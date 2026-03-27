/**
 * 개인정보 자동 파기 스케줄러
 * - 탈퇴 후 90일 경과한 회원 데이터 완전 삭제
 * - soft delete된 게시글/일정 90일 후 완전 삭제
 * - 매일 자정(UTC) 실행
 */
const { query } = require('../config/database');

const PURGE_DAYS = 90;

async function purgeWithdrawnUsers() {
    try {
        const result = await query(
            `DELETE FROM users
             WHERE status = 'withdrawn'
             AND withdrawn_at < NOW() - INTERVAL '${PURGE_DAYS} days'
             RETURNING id`
        );
        if (result.rows.length > 0) {
            console.log(`[DataPurge] ${result.rows.length}명의 탈퇴 회원 데이터 완전 파기 완료`);
        }
    } catch (err) {
        console.error('[DataPurge] 탈퇴 회원 파기 오류:', err.message);
    }
}

async function purgeSoftDeletedPosts() {
    try {
        const result = await query(
            `DELETE FROM posts
             WHERE deleted_at IS NOT NULL
             AND deleted_at < NOW() - INTERVAL '${PURGE_DAYS} days'
             RETURNING id`
        );
        if (result.rows.length > 0) {
            console.log(`[DataPurge] ${result.rows.length}개의 삭제된 게시글 완전 파기 완료`);
        }
    } catch (err) {
        console.error('[DataPurge] 게시글 파기 오류:', err.message);
    }
}

async function purgeSoftDeletedSchedules() {
    try {
        const result = await query(
            `DELETE FROM schedules
             WHERE deleted_at IS NOT NULL
             AND deleted_at < NOW() - INTERVAL '${PURGE_DAYS} days'
             RETURNING id`
        );
        if (result.rows.length > 0) {
            console.log(`[DataPurge] ${result.rows.length}개의 삭제된 일정 완전 파기 완료`);
        }
    } catch (err) {
        console.error('[DataPurge] 일정 파기 오류:', err.message);
    }
}

async function runDataPurge() {
    console.log('[DataPurge] 개인정보 자동 파기 시작...');
    await purgeWithdrawnUsers();
    await purgeSoftDeletedPosts();
    await purgeSoftDeletedSchedules();
    console.log('[DataPurge] 개인정보 자동 파기 완료');
}

function startDataPurgeScheduler() {
    // 매일 자정(UTC)에 실행 — 24시간 간격
    const INTERVAL_MS = 24 * 60 * 60 * 1000;

    // 서버 시작 시 1회 실행
    setTimeout(() => {
        runDataPurge();
    }, 10000);

    // 이후 매일 반복
    setInterval(() => {
        runDataPurge();
    }, INTERVAL_MS);

    console.log('[DataPurge] 자동 파기 스케줄러 등록 (24시간 간격)');
}

module.exports = { startDataPurgeScheduler, runDataPurge };
