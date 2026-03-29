/**
 * Read Service — 읽음 추적 통합 헬퍼
 *
 * config 예시:
 * {
 *   readTable: 'read_status',     // 읽음 테이블명
 *   fkColumn: 'post_id',          // 대상 FK 컬럼명
 * }
 */
const { query } = require('../config/database');

async function markRead(config, parentId, userId) {
    const { readTable, fkColumn } = config;

    try {
        await query(
            `INSERT INTO ${readTable} (user_id, ${fkColumn}, read_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id, ${fkColumn}) DO NOTHING`,
            [userId, parentId]
        );
    } catch (err) {
        // 테이블이 없으면 무시 (초기 상태에서 발생 가능)
        if (err.message && err.message.includes(readTable)) {
            console.error(`[${readTable}] 테이블 없음, 무시`);
        }
    }
}

module.exports = { markRead };
