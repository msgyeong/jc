-- ============================================
-- Railway PostgreSQL 관리자 계정 생성
-- ============================================
-- railway_init.sql 실행 후 이 파일을 실행하세요!

-- 관리자 계정 생성
-- 비밀번호: admin1234 (bcrypt 해시 저장)
-- ⚠️ 이메일/이름은 원하는 대로 변경 가능 (비밀번호 변경은 웹에서)
INSERT INTO users (email, password_hash, name, role, status)
VALUES (
    'admin@jc.com',           -- ← 이메일 변경 가능
    '$2b$10$bQxMtPEEXHA4vajU99iR7e0DCcxpmuMkgQz0OHuxLrTlKpeoYFsq6',  -- admin1234 (bcrypt)
    '총관리자',                -- ← 이름 변경 가능
    'super_admin',
    'active'
)
ON CONFLICT (email) DO NOTHING;

-- 생성 확인
SELECT 
    '✅ 관리자 계정 생성 완료!' AS message,
    email,
    name,
    role,
    status
FROM users 
WHERE role = 'super_admin';
