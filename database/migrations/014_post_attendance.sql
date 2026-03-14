-- Migration 014: 게시글 참석/불참 기능
-- Date: 2026-03-14

-- 1. post_attendance 테이블
CREATE TABLE IF NOT EXISTS post_attendance (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('attending', 'not_attending')),
  responded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_attendance_post ON post_attendance(post_id);
CREATE INDEX IF NOT EXISTS idx_post_attendance_user ON post_attendance(user_id);

-- 2. posts 테이블에 attendance_enabled 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN DEFAULT false;
