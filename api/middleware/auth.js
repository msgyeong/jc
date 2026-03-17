const { verifyToken } = require('../utils/jwt');
const { query } = require('../config/database');

// org_id 캐시 (메모리, 5분)
const orgIdCache = new Map();

/**
 * JWT 인증 미들웨어
 * Authorization 헤더에서 Bearer 토큰을 추출하고 검증
 */
function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '인증 토큰이 필요합니다.'
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않거나 만료된 토큰입니다.'
            });
        }

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };

        // org_id 비동기 로드 (캐시)
        const cached = orgIdCache.get(decoded.userId);
        if (cached && cached.exp > Date.now()) {
            req.user.orgId = cached.orgId;
            return next();
        }
        query('SELECT org_id FROM users WHERE id = $1', [decoded.userId])
            .then(r => {
                const orgId = r.rows[0]?.org_id || null;
                orgIdCache.set(decoded.userId, { orgId, exp: Date.now() + 300000 });
                req.user.orgId = orgId;
                next();
            })
            .catch(() => {
                req.user.orgId = null;
                next();
            });
        return;
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: '인증 처리 중 오류가 발생했습니다.'
        });
    }
}

/**
 * 권한 체크 미들웨어
 * @param {Array<string>} allowedRoles - 허용된 역할 목록
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '인증이 필요합니다.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다.'
            });
        }

        next();
    };
}

module.exports = {
    authenticate,
    requireRole
};
