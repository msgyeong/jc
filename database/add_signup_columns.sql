-- ============================================
-- 6단계 회원가입 양식을 위한 컬럼 추가
-- ============================================
-- Railway PostgreSQL → Data → Query 탭에서 실행하세요!

-- Step 1: 로그인 정보 (이미 존재: email, password_hash)
-- Step 2: 기본 정보 컬럼 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ssn TEXT,                    -- 주민등록번호 (마스킹 저장)
ADD COLUMN IF NOT EXISTS address_detail TEXT,          -- 상세 주소
ADD COLUMN IF NOT EXISTS postal_code TEXT;             -- 우편번호

-- Step 3: 직장 정보 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS company TEXT,                 -- 회사명
ADD COLUMN IF NOT EXISTS position TEXT,                -- 직책
ADD COLUMN IF NOT EXISTS department TEXT,              -- 부서
ADD COLUMN IF NOT EXISTS work_phone TEXT,              -- 직장 전화번호
ADD COLUMN IF NOT EXISTS work_address TEXT;            -- 직장 주소

-- Step 4: 학력/경력 정보 컬럼 추가 (JSON 배열로 저장)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS educations JSONB DEFAULT '[]'::jsonb,  -- 학력 정보
ADD COLUMN IF NOT EXISTS careers JSONB DEFAULT '[]'::jsonb;      -- 경력 정보

-- Step 5: 가족 정보 컬럼 추가 (JSON 배열로 저장)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS families JSONB DEFAULT '[]'::jsonb;     -- 가족 정보

-- Step 6: 기타 정보 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS hobbies TEXT,                 -- 취미
ADD COLUMN IF NOT EXISTS special_notes TEXT,           -- 특이사항
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,       -- 비상 연락처
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,  -- 비상 연락처 이름
ADD COLUMN IF NOT EXISTS emergency_relationship TEXT;  -- 비상 연락처 관계

-- 기존 테스트 데이터 확인
SELECT 
    '✅ 컬럼 추가 완료!' AS message,
    COUNT(*) AS total_users
FROM users;

-- 컬럼 목록 확인
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
