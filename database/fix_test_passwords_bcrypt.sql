-- ============================================
-- 기존 테스트 계정 비밀번호를 bcrypt 해시로 수정
-- ============================================
-- 로그인이 안 될 때 (평문 비밀번호가 저장된 경우) Railway Query에서 실행하세요!

-- minsu@jc.com 비밀번호: test1234 (bcrypt)
UPDATE users
SET password_hash = '$2b$10$d6HOo60sTh6fijblahBPO.BpsmyP6U/xChdSoT0m8YGxFrbUlYg4e'
WHERE email = 'minsu@jc.com';

-- admin@jc.com 비밀번호: admin1234 (bcrypt)
UPDATE users
SET password_hash = '$2b$10$bQxMtPEEXHA4vajU99iR7e0DCcxpmuMkgQz0OHuxLrTlKpeoYFsq6'
WHERE email = 'admin@jc.com';

-- 확인
SELECT email, name, role, status,
       CASE WHEN password_hash LIKE '$2b$%' THEN 'bcrypt 적용됨' ELSE '평문' END AS password_type
FROM users
WHERE email IN ('minsu@jc.com', 'admin@jc.com');
