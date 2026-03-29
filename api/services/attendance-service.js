/**
 * Attendance Service — 참석 CRUD 통합 모듈
 *
 * posts, schedules, group-board 3곳의 참석 로직을 하나로 통합.
 * meetings는 상태값/관리자 대리등록/checked_in_at 등 구조가 달라 별도 유지.
 *
 * config 예시:
 * {
 *   table: 'schedule_attendance',      // 참석 테이블명
 *   fkColumn: 'schedule_id',           // 부모 FK 컬럼명
 *   allowedStatuses: ['attending', 'not_attending'],
 *   includeNoResponse: true,           // 미응답자 계산 여부
 *   parentTable: 'schedules',          // 부모 존재 확인용 (null이면 skip)
 * }
 */
const { query } = require('../config/database');

// ─── SET (UPSERT) ───

async function setAttendance(config, parentId, userId, status) {
    const { table, fkColumn, allowedStatuses, parentTable } = config;

    if (!status || !allowedStatuses.includes(status)) {
        return {
            error: true, status: 400,
            message: `status는 ${allowedStatuses.join(' 또는 ')}이어야 합니다.`
        };
    }

    // 부모 존재 확인
    if (parentTable) {
        const parentResult = await query(`SELECT id FROM ${parentTable} WHERE id = $1`, [parentId]);
        if (parentResult.rows.length === 0) {
            return { error: true, status: 404, message: '대상을 찾을 수 없습니다.' };
        }
    }

    // UPSERT
    const result = await query(
        `INSERT INTO ${table} (${fkColumn}, user_id, status, responded_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (${fkColumn}, user_id)
         DO UPDATE SET status = $3, responded_at = NOW(), updated_at = NOW()
         RETURNING ${fkColumn}, status, responded_at`,
        [parentId, userId, status]
    );

    return { error: false, data: result.rows[0] };
}

// ─── DELETE ───

async function deleteAttendance(config, parentId, userId) {
    const { table, fkColumn } = config;

    await query(
        `DELETE FROM ${table} WHERE ${fkColumn} = $1 AND user_id = $2`,
        [parentId, userId]
    );

    return { error: false };
}

// ─── SUMMARY ───

async function getSummary(config, parentId, userId) {
    const { table, fkColumn, includeNoResponse } = config;

    const [countResult, myResult] = await Promise.all([
        query(
            `SELECT status, COUNT(*)::int as count FROM ${table} WHERE ${fkColumn} = $1 GROUP BY status`,
            [parentId]
        ),
        query(
            `SELECT status FROM ${table} WHERE ${fkColumn} = $1 AND user_id = $2`,
            [parentId, userId]
        )
    ]);

    const counts = { attending: 0, not_attending: 0 };
    for (const row of countResult.rows) {
        counts[row.status] = row.count;
    }

    const data = {
        attending: counts.attending,
        not_attending: counts.not_attending,
        my_status: myResult.rows.length > 0 ? myResult.rows[0].status : null
    };

    if (includeNoResponse) {
        // 전체 활성 회원 수 (같은 로컬 소속)
        const userOrg = await query('SELECT org_id FROM users WHERE id = $1', [userId]);
        const orgId = userOrg.rows[0]?.org_id;
        const totalResult = orgId
            ? await query("SELECT COUNT(*)::int as count FROM users WHERE status = 'active' AND org_id = $1", [orgId])
            : await query("SELECT COUNT(*)::int as count FROM users WHERE status = 'active'");
        data.total_members = totalResult.rows[0].count;
        data.no_response = data.total_members - counts.attending - counts.not_attending;
    } else {
        data.total = counts.attending + counts.not_attending;
    }

    return data;
}

// ─── DETAILS ───

async function getDetails(config, parentId, userId, userRole) {
    const { table, fkColumn, includeNoResponse } = config;

    const votesResult = await query(
        `SELECT a.status, a.responded_at,
                u.id as user_id, u.name, u.position as jc_position, u.profile_image
         FROM ${table} a
         JOIN users u ON u.id = a.user_id
         WHERE a.${fkColumn} = $1
         ORDER BY u.position NULLS LAST, u.name`,
        [parentId]
    );

    const attending = [];
    const not_attending = [];
    const respondedUserIds = new Set();

    votesResult.rows.forEach(r => {
        respondedUserIds.add(r.user_id);
        const item = {
            user_id: r.user_id,
            name: r.name,
            jc_position: r.jc_position || null,
            profile_image: r.profile_image,
            responded_at: r.responded_at
        };
        if (r.status === 'attending') attending.push(item);
        else not_attending.push(item);
    });

    const data = { attending, not_attending };

    // 관리자 + includeNoResponse 설정 시 미응답자 목록
    if (includeNoResponse) {
        const isAdmin = userRole && ['super_admin', 'admin'].includes(userRole);
        if (isAdmin) {
            const userOrg = await query('SELECT org_id FROM users WHERE id = $1', [userId]);
            const orgId = userOrg.rows[0]?.org_id;
            const allMembers = orgId
                ? await query("SELECT id, name, position FROM users WHERE status = 'active' AND org_id = $1 ORDER BY position NULLS LAST, name", [orgId])
                : await query("SELECT id, name, position FROM users WHERE status = 'active' ORDER BY position NULLS LAST, name");
            data.no_response = allMembers.rows
                .filter(m => !respondedUserIds.has(m.id))
                .map(m => ({ user_id: m.id, name: m.name, jc_position: m.position || null }));
        }
    }

    return data;
}

// ─── CSV EXPORT ───

async function exportCsv(config, parentId, userId, userRole, scheduleTitle) {
    const { table, fkColumn } = config;

    const isAdmin = userRole && ['super_admin', 'admin'].includes(userRole);
    if (!isAdmin) {
        return { error: true, status: 403, message: '관리자 권한이 필요합니다.' };
    }

    const votesResult = await query(
        `SELECT a.status, a.responded_at,
                u.id as user_id, u.name, u.position
         FROM ${table} a
         JOIN users u ON u.id = a.user_id
         WHERE a.${fkColumn} = $1
         ORDER BY u.position NULLS LAST, u.name`,
        [parentId]
    );

    const respondedUserIds = new Set(votesResult.rows.map(r => r.user_id));

    // 미응답자
    const userOrg = await query('SELECT org_id FROM users WHERE id = $1', [userId]);
    const orgId = userOrg.rows[0]?.org_id;
    const allMembers = orgId
        ? await query("SELECT id, name, position FROM users WHERE status = 'active' AND org_id = $1 ORDER BY position NULLS LAST, name", [orgId])
        : await query("SELECT id, name, position FROM users WHERE status = 'active' ORDER BY position NULLS LAST, name");
    const noResponse = allMembers.rows.filter(m => !respondedUserIds.has(m.id));

    const statusMap = { attending: '참석', not_attending: '불참' };
    let csv = '\uFEFF이름,직책,상태,응답일시\n';
    votesResult.rows.forEach(r => {
        const responded = r.responded_at ? new Date(r.responded_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '';
        csv += `${r.name},${r.position || ''},${statusMap[r.status] || r.status},${responded}\n`;
    });
    noResponse.forEach(m => {
        csv += `${m.name},${m.position || ''},미응답,\n`;
    });

    return { error: false, csv, filename: `attendance_${parentId}.csv` };
}

module.exports = {
    setAttendance,
    deleteAttendance,
    getSummary,
    getDetails,
    exportCsv
};
