const ALL_PERMISSIONS = ['member_approve', 'post_manage', 'schedule_manage', 'notice_manage', 'push_send'];

/**
 * 앱 관리 권한 체크 미들웨어 (단순화)
 * - super_admin / admin / local_admin: 모든 권한
 * - member: 권한 없음
 */
function requireMobilePermission(permission) {
    return async (req, res, next) => {
        try {
            const { role } = req.user;
            if (['super_admin', 'admin', 'local_admin'].includes(role)) {
                return next();
            }
            return res.status(403).json({
                success: false,
                error: '관리 권한이 없습니다. 중간관리자(local_admin) 이상만 가능합니다.',
                code: 'MOBILE_PERMISSION_DENIED'
            });
        } catch (err) {
            next(err);
        }
    };
}

/**
 * 현재 사용자의 앱 관리 권한 목록 조회 (단순화)
 * local_admin 이상이면 모든 권한
 */
async function getMobilePermissions(userId, role) {
    const hasAll = ['super_admin', 'admin', 'local_admin'].includes(role);
    const permissions = {};
    ALL_PERMISSIONS.forEach(p => { permissions[p] = hasAll; });
    return permissions;
}

module.exports = { requireMobilePermission, getMobilePermissions, ALL_PERMISSIONS };
