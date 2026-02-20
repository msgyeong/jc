// 1회성: DB에 평문으로 저장된 테스트 계정 비밀번호를 bcrypt로 수정
// 사용법: node fix-passwords.js (api 폴더에서, .env에 DATABASE_URL 필요)
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const HASH_MINSU = '$2b$10$d6HOo60sTh6fijblahBPO.BpsmyP6U/xChdSoT0m8YGxFrbUlYg4e';
const HASH_ADMIN = '$2b$10$bQxMtPEEXHA4vajU99iR7e0DCcxpmuMkgQz0OHuxLrTlKpeoYFsq6';

async function fix() {
    try {
        const r1 = await pool.query(
            "UPDATE users SET password_hash = $1 WHERE email = 'minsu@jc.com'",
            [HASH_MINSU]
        );
        const r2 = await pool.query(
            "UPDATE users SET password_hash = $1 WHERE email = 'admin@jc.com'",
            [HASH_ADMIN]
        );
        console.log('minsu@jc.com updated:', r1.rowCount);
        console.log('admin@jc.com updated:', r2.rowCount);

        if (r1.rowCount === 0) {
            const r3 = await pool.query(
                `INSERT INTO users (email, password_hash, name, phone, address, role, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
                ['minsu@jc.com', HASH_MINSU, '경민수', '010-1234-5678', '서울시 영등포구', 'member', 'active']
            );
            console.log('minsu@jc.com insert/upsert:', r3.rowCount);
        }
    } catch (e) {
        console.error(e.message);
    } finally {
        pool.end();
    }
}

fix();
