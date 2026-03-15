const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('⚠️  JWT_SECRET 환경변수가 설정되지 않았습니다.');
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is required in production');
    }
}
const JWT_EXPIRES_IN = '7d'; // 7일

/**
 * JWT 토큰 생성
 * @param {number} userId - 사용자 ID
 * @param {string} email - 이메일
 * @param {string} role - 역할 (super_admin, admin, member, pending)
 * @returns {string} JWT 토큰
 */
function generateToken(userId, email, role) {
    const payload = {
        userId,
        email,
        role
    };

    const token = jwt.sign(payload, JWT_SECRET || 'dev-only-secret', {
        algorithm: 'HS256',
        expiresIn: JWT_EXPIRES_IN
    });

    return token;
}

/**
 * JWT 토큰 검증
 * @param {string} token - JWT 토큰
 * @returns {object|null} 디코딩된 페이로드 또는 null
 */
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET || 'dev-only-secret', {
            algorithms: ['HS256']
        });
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.error('Token expired');
        } else if (error.name === 'JsonWebTokenError') {
            console.error('Invalid token');
        } else {
            console.error('Token verification error:', error);
        }
        return null;
    }
}

module.exports = {
    generateToken,
    verifyToken
};
