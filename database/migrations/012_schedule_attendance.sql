-- 012: 일정 참석 여부 테이블
CREATE TABLE IF NOT EXISTS schedule_attendance (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(15) NOT NULL CHECK (status IN ('attending', 'not_attending')),
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(schedule_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_schedule_attendance_schedule
  ON schedule_attendance(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_attendance_user
  ON schedule_attendance(user_id);
