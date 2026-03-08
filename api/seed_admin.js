/**
 * 관리자 계정 시드 스크립트
 * 사용법: node api/seed_admin.js
 *
 * DATABASE_URL 환경변수가 필요합니다.
 * Railway 환경이 아닌 로컬에서 실행 시 .env 파일에 DATABASE_URL을 설정하세요.
 */
require('dotenv').config();
const { pool, query } = require('./config/database');
const { hashPassword } = require('./utils/password');

async function seedAdmin() {
  const email = 'admin@jc.com';
  const password = 'admin1234';
  const name = '관리자';

  try {
    // 이미 존재하는지 확인
    const existing = await query('SELECT id, role, status FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      console.log(`이미 존재하는 계정: id=${user.id}, role=${user.role}, status=${user.status}`);
      // 기존 계정을 super_admin + active로 업데이트
      await query(
        "UPDATE users SET role = 'super_admin', status = 'active', updated_at = NOW() WHERE email = $1",
        [email]
      );
      console.log('-> role=super_admin, status=active 로 업데이트 완료');
    } else {
      const hash = await hashPassword(password);
      await query(
        `INSERT INTO users (email, password_hash, name, phone, address, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'super_admin', 'active', NOW(), NOW())`,
        [email, hash, name, '010-0000-0000', '서울시 영등포구']
      );
      console.log('관리자 계정 생성 완료!');
    }

    console.log(`  email: ${email}`);
    console.log(`  password: ${password}`);
    console.log(`  role: super_admin`);
    console.log(`  status: active`);
  } catch (err) {
    console.error('시드 실패:', err.message);
  } finally {
    await pool.end();
  }
}

seedAdmin();
