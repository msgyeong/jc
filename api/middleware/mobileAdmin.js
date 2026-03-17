const ALL_PERMISSIONS = ['member_approve', 'post_manage', 'schedule_manage', 'notice_manage', 'push_send', 'meeting_manage'];

// 역할별 권한 매핑
const ROLE_PERMISSIONS = {
    super_admin: ['member_approve', 'post_manage', 'schedule_manage', 'notice_manage', 'push_send', 'meeting_manage'],
    admin: ['member_approve', 'post_manage', 'schedule_manage', 'notice_manage', 'push_send', 'meeting_manage'],
    local_admin: ['notice_manage', 'schedule_manage', 'meeting_manage'],
    member: []
};

/**
 * 앱 관리 권한 체크 미들웨어
 * - super_admin / admin: 모든 권한
 * - local_admin: 공지작성, 일정관리, 회의관리만
 * - member: 권한 없음
 */
function requireMobilePermission(permission) {
    return async (req, res, next) => {
        try {
            const { role } = req.user;
            const perms = ROLE_PERMISSIONS[role] || [];
            if (perms.includes(permission)) {
                return next();
            }
            return res.status(403).json({
                success: false,
                error: '해당 기능에 대한 권한이 없습니다.',
                code: 'MOBILE_PERMISSION_DENIED'
            });
        } catch (err) {
            next(err);
        }
    };
}

/**
 * 현재 사용자의 앱 관리 권한 목록 조회
 */
async function getMobilePermissions(userId, role) {
    const perms = ROLE_PERMISSIONS[role] || [];
    const permissions = {};
    ALL_PERMISSIONS.forEach(p => { permissions[p] = perms.includes(p); });
    return permissions;
}

module.exports = { requireMobilePermission, getMobilePermissions, ALL_PERMISSIONS };
