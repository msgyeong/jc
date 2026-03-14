-- Migration 016: 회원 인물카드 확장
-- Date: 2026-03-14

-- 1. users 테이블 확장 컬럼
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_memo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialties TEXT;

-- educations, careers, families 컬럼은 이미 존재할 수 있음 (회원가입 시 수집)
-- JSONB 기본값 설정
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'educations'
  ) THEN
    ALTER TABLE users ADD COLUMN educations JSONB DEFAULT '[]';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'careers'
  ) THEN
    ALTER TABLE users ADD COLUMN careers JSONB DEFAULT '[]';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'families'
  ) THEN
    ALTER TABLE users ADD COLUMN families JSONB DEFAULT '[]';
  END IF;
END $$;

-- 2. member_activities 테이블
CREATE TABLE IF NOT EXISTS member_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN ('committee', 'volunteer', 'award', 'training', 'other')),
  title VARCHAR(200) NOT NULL,
  date DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_activities_user ON member_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_member_activities_type ON member_activities(activity_type);
