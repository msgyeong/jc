const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, addOrgFilter } = require('../middleware/auth');
const { sendPushToAll, sendPushToUser } = require('../utils/pushSender');
const commentService = require('../services/comment-service');

// 일정 댓글 config
const scheduleCommentConfig = {
    commentTable: 'comments',
    fkColumn: 'schedule_id',
    parentTable: 'schedules',
    updateCommentCount: false,   // 일정은 comments_count 미갱신
    commentLikeTable: 'comment_likes',
    push: {
        getAuthorQuery: 'SELECT created_by, title FROM schedules WHERE id = $1',
        authorIdColumn: 'created_by',
        urlTemplate: '/#schedules/{id}',
        dataKey: 'schedule_id'
    }
};

/**
 * GET /api/schedules
 * 일정 목록 조회
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const upcoming = req.query.upcoming === 'true';
        const year = parseInt(req.query.year);
        const month = parseInt(req.query.month);

        let sqlQuery = `
            SELECT
                s.id, s.title, s.start_date, s.end_date,
                s.location, s.description, s.category,
                s.views,
                s.created_at, s.updated_at,
                s.created_by as author_id, u.name as author_name, u.profile_image as author_image
            FROM schedules s
            LEFT JOIN users u ON s.created_by = u.id
        `;

        const conditions = ['s.deleted_at IS NULL'];
        const params = [];

        // 멀티테넌트 org_id 필터
        addOrgFilter(conditions, params, req, 's');

        // 월별 조회 (캘린더용)
        if (year && month) {
            params.push(year, month);
            conditions.push(`EXTRACT(YEAR FROM s.start_date) = $${params.length - 1}`);
            conditions.push(`EXTRACT(MONTH FROM s.start_date) = $${params.length}`);
        } else if (upcoming) {
            conditions.push('s.start_date >= CURRENT_DATE');
        }

        sqlQuery += ' WHERE ' + conditions.join(' AND ');

        sqlQuery += ' ORDER BY s.start_date ASC';

        const result = await query(sqlQuery, params);

        res.json({
            success: true,
            schedules: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Get schedules error:', error);
        res.status(500).json({
            success: false,
            message: '일정 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/schedules/:id
 * 일정 상세 조회
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // 조회수 증가
        await query('UPDATE schedules SET views = COALESCE(views, 0) + 1 WHERE id = $1', [id]);

        // 일정 조회 (linked_post_id + views 포함)
        const result = await query(
            `SELECT
                s.id, s.title, s.start_date, s.end_date,
                s.location, s.description, s.category,
                s.linked_post_id, s.views, s.org_id,
                s.created_at, s.updated_at,
                s.created_by as author_id, u.name as author_name, u.profile_image as author_image
             FROM schedules s
             LEFT JOIN users u ON s.created_by = u.id
             WHERE s.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '일정을 찾을 수 없습니다.'
            });
        }

        const schedule = result.rows[0];

        // 멀티테넌트: org_id 소속 확인 (super_admin 제외)
        if (req.user.role !== 'super_admin' && req.user.orgId && schedule.org_id && schedule.org_id !== req.user.orgId) {
            return res.status(403).json({
                success: false,
                message: '다른 조직의 일정에 접근할 수 없습니다.'
            });
        }

        // 연결된 공지 정보 조회
        if (schedule.linked_post_id) {
            try {
                const postResult = await query(
                    `SELECT p.id, p.title, p.created_at, u.name as author_name
                     FROM posts p LEFT JOIN users u ON p.author_id = u.id
                     WHERE p.id = $1`,
                    [schedule.linked_post_id]
                );
                schedule.linked_post = postResult.rows[0] || null;
            } catch (catchErr) { console.error("[silent-catch]", catchErr.message); }
        }

        res.json({
            success: true,
            schedule
        });
    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({
            success: false,
            message: '일정 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/schedules
 * 일정 등록 (권한 필요)
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, start_date, end_date, location, description, category } = req.body;
        const authorId = req.user.userId;

        // 일정 등록 권한 확인
        const userResult = await query(
            'SELECT role FROM users WHERE id = $1',
            [authorId]
        );

        const userRole = userResult.rows[0].role;
        
        // super_admin, admin만 작성 가능
        if (!['super_admin', 'admin'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: '일정 등록 권한이 없습니다.'
            });
        }

        // 유효성 검증
        if (!title || !start_date) {
            return res.status(400).json({
                success: false,
                message: '제목과 날짜를 입력해주세요.'
            });
        }

        // 종료일이 시작일보다 빠른 경우 차단
        if (end_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({
                success: false,
                message: '종료일은 시작일보다 빠를 수 없습니다.'
            });
        }

        // 일정 생성
        const result = await query(
            `INSERT INTO schedules (created_by, title, start_date, end_date, location, description, category, org_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
             RETURNING id`,
            [authorId, title, start_date, end_date, location, description, category, req.user.orgId || null]
        );

        const newScheduleId = result.rows[0].id;

        // N-02 일정 등록 알림
        const startObj = new Date(start_date);
        const dateStr = startObj.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
        const timeStr = startObj.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
        sendPushToAll({
            title: '\uD83D\uDCC5 \uC0C8 \uC77C\uC815 \uB4F1\uB85D',
            body: `${title} \u2014 ${dateStr} ${timeStr}${location ? ' ' + location : ''}`.substring(0, 80),
            data: { url: `/#schedules/${newScheduleId}`, schedule_id: newScheduleId },
            type: 'N-02'
        }, authorId).catch(e => console.error('[Push] N-02 발송 에러:', e.message));

        res.status(201).json({
            success: true,
            message: '일정이 등록되었습니다.',
            scheduleId: newScheduleId
        });
    } catch (error) {
        console.error('Create schedule error:', error);
        res.status(500).json({
            success: false,
            message: '일정 등록 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/schedules/:id
 * 일정 수정
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, start_date, end_date, location, description, category } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // 일정 소유자 확인
        const scheduleResult = await query(
            'SELECT created_by FROM schedules WHERE id = $1',
            [id]
        );

        if (scheduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '일정을 찾을 수 없습니다.'
            });
        }

        // 작성자 본인이거나 관리자인 경우만 수정 가능
        const isAuthor = Number(scheduleResult.rows[0].created_by) === Number(userId);
        const isAdmin = ['super_admin', 'admin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '일정 수정 권한이 없습니다.'
            });
        }

        // 종료일이 시작일보다 빠른 경우 차단
        if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({
                success: false,
                message: '종료일은 시작일보다 빠를 수 없습니다.'
            });
        }

        // 일정 수정
        await query(
            `UPDATE schedules 
             SET title = $1, start_date = $2, end_date = $3, 
                 location = $4, description = $5, category = $6, updated_at = NOW()
             WHERE id = $7`,
            [title, start_date, end_date, location, description, category, id]
        );

        // N-04 일정 변경 알림
        sendPushToAll({
            title: '\uD83D\uDCC5 \uC77C\uC815 \uBCC0\uACBD',
            body: `${title} \uC77C\uC815\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4`.substring(0, 80),
            data: { url: `/#schedules/${id}`, schedule_id: parseInt(id) },
            type: 'N-04'
        }, userId).catch(e => console.error('[Push] N-04 발송 에러:', e.message));

        res.json({
            success: true,
            message: '일정이 수정되었습니다.'
        });
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({
            success: false,
            message: '일정 수정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * DELETE /api/schedules/:id
 * 일정 삭제
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // 일정 소유자 확인
        const scheduleResult = await query(
            'SELECT created_by FROM schedules WHERE id = $1',
            [id]
        );

        if (scheduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '일정을 찾을 수 없습니다.'
            });
        }

        // 작성자 본인이거나 관리자인 경우만 삭제 가능
        const isAuthor = Number(scheduleResult.rows[0].created_by) === Number(userId);
        const isAdmin = ['super_admin', 'admin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '일정 삭제 권한이 없습니다.'
            });
        }

        // 일정 삭제
        await query('UPDATE schedules SET deleted_at = NOW() WHERE id = $1', [id]);

        res.json({
            success: true,
            message: '일정이 삭제되었습니다.'
        });
    } catch (error) {
        console.error('Delete schedule error:', error);
        res.status(500).json({
            success: false,
            message: '일정 삭제 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/schedules/:id/comments — comment-service 위임
 */
router.get('/:id/comments', authenticate, async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        const userId = req.user.userId;
        const data = await commentService.listComments(scheduleCommentConfig, scheduleId, userId);
        res.json({ success: true, data: { items: data.items, total: data.total } });
    } catch (error) {
        console.error('Get schedule comments error:', error);
        res.status(500).json({ success: false, message: '댓글 목록 조회에 실패했습니다.' });
    }
});

/**
 * POST /api/schedules/:id/comments — comment-service 위임
 */
router.post('/:id/comments', authenticate, async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        const { content, parent_id } = req.body || {};
        const userId = req.user.userId;

        const result = await commentService.createComment(scheduleCommentConfig, scheduleId, userId, content, parent_id);
        if (result.error) return res.status(result.status).json({ success: false, message: result.message });

        res.status(201).json({ success: true, data: result.comment });
    } catch (error) {
        console.error('Create schedule comment error:', error);
        res.status(500).json({ success: false, message: '댓글 등록에 실패했습니다.' });
    }
});

/**
 * DELETE /api/schedules/:id/comments/:commentId — comment-service 위임
 */
router.delete('/:id/comments/:commentId', authenticate, async (req, res) => {
    try {
        const { id: scheduleId, commentId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const result = await commentService.deleteComment(scheduleCommentConfig, commentId, scheduleId, userId, userRole);
        if (result.error) return res.status(result.status).json({ success: false, message: result.message });

        res.json({ success: true, message: '댓글이 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete schedule comment error:', error);
        res.status(500).json({ success: false, message: '댓글 삭제에 실패했습니다.' });
    }
});

/**
 * POST /api/schedules/:id/comments/:commentId/like — comment-service 위임
 */
router.post('/:id/comments/:commentId/like', authenticate, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;
        const result = await commentService.toggleCommentLike(scheduleCommentConfig, commentId, userId);
        if (result.error) return res.status(result.status).json({ success: false, message: result.message });
        res.json({ success: true, liked: result.liked, likes_count: result.likes_count });
    } catch (err) {
        console.error('Schedule comment like error:', err);
        res.status(500).json({ success: false, message: '좋아요 처리 실패' });
    }
});

// ==================== 참석 여부 (schedule_attendance) ====================

/**
 * POST /api/schedules/:id/attendance
 * 참석 여부 등록/변경 (UPSERT)
 */
router.post('/:id/attendance', authenticate, async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        const userId = req.user.userId;
        const { status } = req.body;

        if (!status || !['attending', 'not_attending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'status는 attending 또는 not_attending이어야 합니다.'
            });
        }

        // 일정 존재 확인
        const schedCheck = await query('SELECT id FROM schedules WHERE id = $1', [scheduleId]);
        if (schedCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: '일정을 찾을 수 없습니다.' });
        }

        const result = await query(
            `INSERT INTO schedule_attendance (schedule_id, user_id, status, responded_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             ON CONFLICT (schedule_id, user_id)
             DO UPDATE SET status = $3, responded_at = NOW(), updated_at = NOW()
             RETURNING schedule_id, status, responded_at`,
            [scheduleId, userId, status]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Set attendance error:', error);
        res.status(500).json({ success: false, message: '참석 여부 등록 중 오류가 발생했습니다.' });
    }
});

/**
 * DELETE /api/schedules/:id/attendance
 * 참석 여부 취소 (미응답으로 되돌리기)
 */
router.delete('/:id/attendance', authenticate, async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        const userId = req.user.userId;

        await query(
            'DELETE FROM schedule_attendance WHERE schedule_id = $1 AND user_id = $2',
            [scheduleId, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete attendance error:', error);
        res.status(500).json({ success: false, message: '참석 여부 취소 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/schedules/:id/attendance/summary
 * 참석 현황 요약 (참석/불참/미응답 수 + 본인 상태)
 */
router.get('/:id/attendance/summary', authenticate, async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        const userId = req.user.userId;

        // 참석/불참 집계
        const summaryResult = await query(
            `SELECT status, COUNT(*)::int as count
             FROM schedule_attendance WHERE schedule_id = $1
             GROUP BY status`,
            [scheduleId]
        );

        let attending = 0, not_attending = 0;
        summaryResult.rows.forEach(r => {
            if (r.status === 'attending') attending = r.count;
            else if (r.status === 'not_attending') not_attending = r.count;
        });

        // 전체 승인 회원 수 (같은 로컬 소속만)
        const userOrg = await query('SELECT org_id FROM users WHERE id = $1', [userId]);
        const orgId = userOrg.rows[0]?.org_id;
        const totalResult = orgId
            ? await query("SELECT COUNT(*)::int as count FROM users WHERE status = 'active' AND org_id = $1", [orgId])
            : await query("SELECT COUNT(*)::int as count FROM users WHERE status = 'active'");
        const total_members = totalResult.rows[0].count;
        const no_response = total_members - attending - not_attending;

        // 본인 상태
        const myResult = await query(
            'SELECT status FROM schedule_attendance WHERE schedule_id = $1 AND user_id = $2',
            [scheduleId, userId]
        );

        res.json({
            success: true,
            data: {
                attending,
                not_attending,
                no_response,
                total_members,
                my_status: myResult.rows[0]?.status || null
            }
        });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({ success: false, message: '참석 현황 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/schedules/:id/attendance/details
 * 참석자 명단 조회 (관리자는 미응답자도 포함)
 */
router.get('/:id/attendance/details', authenticate, async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        const userRole = req.user.role;
        const isAdmin = userRole && ['super_admin', 'admin'].includes(userRole);

        // 참석/불참 명단
        const votesResult = await query(
            `SELECT sa.status, sa.responded_at,
                    u.id as user_id, u.name, u.position as jc_position
             FROM schedule_attendance sa
             JOIN users u ON u.id = sa.user_id
             WHERE sa.schedule_id = $1
             ORDER BY u.position NULLS LAST, u.name`,
            [scheduleId]
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
                responded_at: r.responded_at
            };
            if (r.status === 'attending') attending.push(item);
            else not_attending.push(item);
        });

        const data = { attending, not_attending };

        // 관리자만 미응답자 목록 포함 (같은 로컬 소속만)
        if (isAdmin) {
            const userOrg2 = await query('SELECT org_id FROM users WHERE id = $1', [userId]);
            const orgId2 = userOrg2.rows[0]?.org_id;
            const allMembers = orgId2
                ? await query("SELECT id, name, position FROM users WHERE status = 'active' AND org_id = $1 ORDER BY position NULLS LAST, name", [orgId2])
                : await query("SELECT id, name, position FROM users WHERE status = 'active' ORDER BY position NULLS LAST, name");
            data.no_response = allMembers.rows
                .filter(m => !respondedUserIds.has(m.id))
                .map(m => ({ user_id: m.id, name: m.name, jc_position: m.position || null }));
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get attendance details error:', error);
        res.status(500).json({ success: false, message: '참석 명단 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/schedules/:id/attendance/export
 * 참석 현황 CSV 내보내기 (관리자 전용)
 */
router.get('/:id/attendance/export', authenticate, async (req, res) => {
    try {
        const userRole = req.user.role;
        if (!userRole || !['super_admin', 'admin'].includes(userRole)) {
            return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
        }

        const { id: scheduleId } = req.params;

        // 일정 정보
        const schedResult = await query('SELECT title FROM schedules WHERE id = $1', [scheduleId]);
        if (schedResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '일정을 찾을 수 없습니다.' });
        }

        // 참석/불참 명단
        const votesResult = await query(
            `SELECT sa.status, sa.responded_at,
                    u.id as user_id, u.name, u.position
             FROM schedule_attendance sa
             JOIN users u ON u.id = sa.user_id
             WHERE sa.schedule_id = $1
             ORDER BY u.position NULLS LAST, u.name`,
            [scheduleId]
        );

        const respondedUserIds = new Set(votesResult.rows.map(r => r.user_id));

        // 미응답자 (같은 로컬 소속만)
        const userOrgCsv = await query('SELECT org_id FROM users WHERE id = $1', [userId]);
        const orgIdCsv = userOrgCsv.rows[0]?.org_id;
        const allMembers = orgIdCsv
            ? await query("SELECT id, name, position FROM users WHERE status = 'active' AND org_id = $1 ORDER BY position NULLS LAST, name", [orgIdCsv])
            : await query("SELECT id, name, position FROM users WHERE status = 'active' ORDER BY position NULLS LAST, name");
        const noResponse = allMembers.rows.filter(m => !respondedUserIds.has(m.id));

        // CSV 생성
        const statusMap = { attending: '참석', not_attending: '불참' };
        let csv = '\uFEFF이름,직책,상태,응답일시\n'; // BOM for Excel
        votesResult.rows.forEach(r => {
            const responded = r.responded_at ? new Date(r.responded_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '';
            csv += `${r.name},${r.position || ''},${statusMap[r.status]},${responded}\n`;
        });
        noResponse.forEach(m => {
            csv += `${m.name},${m.position || ''},미응답,\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="attendance_${scheduleId}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Export attendance error:', error);
        res.status(500).json({ success: false, message: 'CSV 내보내기 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
