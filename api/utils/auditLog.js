const { query } = require('../config/database');

/**
 * Audit Log 기록
 * @param {object} params
 * @param {number} params.adminId - 관리자 ID
 * @param {string} params.action - 액션 (예: 'member.approve', 'post.delete')
 * @param {string} params.targetType - 대상 유형 ('member', 'post', 'schedule', 'notice')
 * @param {number} params.targetId - 대상 ID
 * @param {object} [params.before] - 변경 전 값
 * @param {object} [params.after] - 변경 후 값
 * @param {string} [params.description] - 사람이 읽을 수 있는 설명
 * @param {string} [params.ipAddress] - IP 주소
 */
async function writeAuditLog({ adminId, action, targetType, targetId, before, after, description, ipAddress }) {
    try {
        await query(
            `INSERT INTO audit_log (admin_id, action, target_type, target_id, before_value, after_value, description, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                adminId,
                action,
                targetType || null,
                targetId || null,
                before ? JSON.stringify(before) : null,
                after ? JSON.stringify(after) : null,
                description || null,
                ipAddress || null,
            ]
        );
    } catch (err) {
        console.error('[AuditLog] 기록 실패:', err.message);
    }
}

module.exports = { writeAuditLog };
