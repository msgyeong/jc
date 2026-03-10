-- Sprint 3 Schema Migration (2026-03-10)
-- 공지-일정 연동 + 업종 검색 + 일정 댓글

-- 1. posts.linked_schedule_id (공지-일정 연동)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS linked_schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL;

-- 2. schedules.linked_post_id (공지-일정 연동)
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS linked_post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL;

-- 3. users.industry + industry_detail (업종 검색)
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry_detail VARCHAR(100);

-- 4. comments.schedule_id (일정 댓글)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_posts_linked_schedule ON posts(linked_schedule_id) WHERE linked_schedule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schedules_linked_post ON schedules(linked_post_id) WHERE linked_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_industry ON users(industry) WHERE industry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_schedule_id ON comments(schedule_id) WHERE schedule_id IS NOT NULL;
