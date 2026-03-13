-- 013: 사용자 환경설정 테이블
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  font_size VARCHAR(10) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'xlarge')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
