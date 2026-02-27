-- 게시판 구분(공지/일반), 일정 첨부, 개인별 읽음 처리
-- Railway(정수 ID) 기준. UUID 스키마면 post_reads의 user_id/post_id 타입을 UUID로 맞춰 실행하세요.

-- 1) posts.category에 'notice' 허용 (공지사항 게시판)
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;
ALTER TABLE posts ADD CONSTRAINT posts_category_check
    CHECK (category IN ('general', 'question', 'announcement', 'event', 'notice'));

-- 2) posts에 일정 연결 컬럼 (없을 때만)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'posts' AND column_name = 'schedule_id'
    ) THEN
        ALTER TABLE posts ADD COLUMN schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3) 개인별 읽음 테이블 (post_reads)
CREATE TABLE IF NOT EXISTS post_reads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_post_reads_user ON post_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reads_post ON post_reads(post_id);
