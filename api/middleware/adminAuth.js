const { authenticate } = require('./auth');

/**
 * 관리자 전용 미들웨어
 * authenticate 후 role이 admin 또는 super_admin인지 확인
 */
function requireAdmin(req, res, next) {
    const role = req.user && req.user.role;
    if (!role || !['admin', 'super_admin'].includes(role)) {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다.',
        });
    }
    next();
}

/**
 * authenticate + requireAdmin 결합 미들웨어 배열
 */
const adminAuth = [authenticate, requireAdmin];

module.exports = { requireAdmin, adminAuth };
