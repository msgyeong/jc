-- Web Push 알림 테이블 (2026-03-11)
-- 이미 프로덕션 DB에 실행 완료

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS notification_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  all_push BOOLEAN DEFAULT true,
  notice_push BOOLEAN DEFAULT true,
  schedule_push BOOLEAN DEFAULT true,
  reminder_push BOOLEAN DEFAULT true,
  comment_push BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL,
  title VARCHAR(100) NOT NULL,
  body TEXT,
  data JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  clicked_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_noti_log_user ON notification_log(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_noti_log_unread ON notification_log(user_id) WHERE read_at IS NULL;
