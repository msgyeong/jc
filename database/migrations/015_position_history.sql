-- Migration 015: 직책 FK + 직책 변동 이력
-- Date: 2026-03-14

-- 1. users 테이블에 position_id FK 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS position_id INTEGER REFERENCES positions(id);

-- 2. position_history 테이블
CREATE TABLE IF NOT EXISTS position_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id INTEGER REFERENCES positions(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by INTEGER REFERENCES users(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_position_history_user ON position_history(user_id);
CREATE INDEX IF NOT EXISTS idx_position_history_position ON position_history(position_id);
