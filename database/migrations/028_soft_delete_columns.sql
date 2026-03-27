-- 게시글, 일정 soft delete 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- 인덱스 (삭제되지 않은 항목 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_schedules_deleted_at ON schedules (deleted_at) WHERE deleted_at IS NULL;
