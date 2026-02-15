-- ============================================
-- Railway PostgreSQL 테스트 회원 계정 생성
-- ============================================
-- railway_init.sql 실행 후 이 파일을 실행하세요!

-- 테스트 회원 계정 생성 (일반 회원)
INSERT INTO users (email, password_hash, name, phone, address, role, status)
VALUES (
    'minsu@jc.com',               -- 이메일 (계정 이름과 일치)
    'test1234',                   -- 비밀번호 (평문)
    '경민수',                     -- 이름
    '010-1234-5678',              -- 전화번호
    '서울시 영등포구',             -- 주소
    'member',                     -- 역할: 일반 회원
    'active'                      -- 상태: 활성화 (승인 완료)
)
ON CONFLICT (email) DO NOTHING;

-- 생성 확인
SELECT 
    '✅ 테스트 회원 계정 생성 완료!' AS message,
    email,
    name,
    role,
    status,
    '로그인 가능' AS note
FROM users 
WHERE email = 'minsu@jc.com';

-- ============================================
-- 테스트 계정 정보
-- ============================================
-- 이메일: minsu@jc.com
-- 비밀번호: test1234
-- 이름: 경민수
-- 역할: 일반 회원
-- 상태: 활성화 (바로 로그인 가능)
-- ============================================
