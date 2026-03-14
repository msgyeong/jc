-- Migration 017: 예약 알림 시스템
-- Date: 2026-03-14

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
  notification_type VARCHAR(30) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_post ON scheduled_notifications(post_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_schedule ON scheduled_notifications(schedule_id);
