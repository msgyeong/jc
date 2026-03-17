-- 멀티테넌트: 조직(로컬) 테이블
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,           -- 영등포JC, 울진JC, 잠실JC
    code VARCHAR(50) UNIQUE NOT NULL,     -- yeongdeungpo, uljin, jamsil
    district VARCHAR(100),                -- 서울지구, 경북지구
    region VARCHAR(100),                  -- 서울, 경북
    description TEXT,
    logo_data BYTEA,
    logo_mime VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,                   -- super_admin who created
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- users 테이블에 org_id 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id);

-- 기본 조직 (영등포JC) 생성
INSERT INTO organizations (name, code, district, region, description)
VALUES ('영등포JC', 'yeongdeungpo', '서울지구', '서울', '영등포청년회의소')
ON CONFLICT (code) DO NOTHING;

-- 기존 회원 모두 영등포JC 소속으로
UPDATE users SET org_id = (SELECT id FROM organizations WHERE code = 'yeongdeungpo')
WHERE org_id IS NULL;
