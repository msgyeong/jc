const { query } = require('../config/database');

const ALL_PERMISSIONS = ['member_approve', 'post_manage', 'schedule_manage', 'notice_manage', 'push_send'];

/**
 * 앱 관리 권한 체크 미들웨어
 * - super_admin: 항상 통과
 * - admin/member: mobile_admin_permissions 테이블에서 granted=true 확인
 */
function requireMobilePermission(permission) {
    return async (req, res, next) => {
        try {
            const { userId, role } = req.user;

            if (role === 'super_admin') {
                return next();
            }

            const result = await query(
                `SELECT granted FROM mobile_admin_permissions
                 WHERE user_id = $1 AND permission = $2`,
                [userId, permission]
            );

            if (result.rows.length === 0 || !result.rows[0].granted) {
                return res.status(403).json({
                    success: false,
                    error: '해당 관리 권한이 없습니다',
                    code: 'MOBILE_PERMISSION_DENIED'
                });
            }

            next();
        } catch (err) {
            next(err);
        }
    };
}

/**
 * 현재 사용자의 앱 관리 권한 목록 조회
 */
async function getMobilePermissions(userId, role) {
    if (role === 'super_admin') {
        return ALL_PERMISSIONS.reduce((acc, p) => ({ ...acc, [p]: true }), {});
    }

    const result = await query(
        `SELECT permission, granted FROM mobile_admin_permissions WHERE user_id = $1`,
        [userId]
    );

    const permissions = {};
    ALL_PERMISSIONS.forEach(p => { permissions[p] = false; });
    result.rows.forEach(row => { permissions[row.permission] = row.granted; });

    return permissions;
}

module.exports = { requireMobilePermission, getMobilePermissions, ALL_PERMISSIONS };
