const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * 비밀번호 해싱
 * @param {string} password - 평문 비밀번호
 * @returns {Promise<string>} 해시된 비밀번호
 */
async function hashPassword(password) {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        return hash;
    } catch (error) {
        console.error('Password hashing error:', error);
        throw new Error('비밀번호 해싱 실패');
    }
}

/**
 * 비밀번호 검증
 * @param {string} password - 평문 비밀번호
 * @param {string} hash - 해시된 비밀번호
 * @returns {Promise<boolean>} 일치 여부
 */
async function comparePassword(password, hash) {
    try {
        const match = await bcrypt.compare(password, hash);
        return match;
    } catch (error) {
        console.error('Password comparison error:', error);
        throw new Error('비밀번호 검증 실패');
    }
}

module.exports = {
    hashPassword,
    comparePassword
};
