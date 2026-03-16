-- Migration 021: 푸시 발송 이력 테이블
-- Date: 2026-03-16

CREATE TABLE IF NOT EXISTS push_send_log (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('all', 'selected')),
  target_user_ids INTEGER[],
  target_count INTEGER NOT NULL DEFAULT 0,
  sent_by INTEGER REFERENCES users(id),
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_push_send_log_sent_at ON push_send_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_send_log_sent_by ON push_send_log(sent_by);
