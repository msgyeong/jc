-- 027: 조직도 그룹 게시판 + 그룹 일정
-- 조직도 그룹별 전용 게시판과 그룹 일정 기능

-- 그룹 게시글 테이블
CREATE TABLE IF NOT EXISTS group_posts (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES orgchart_groups(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    images TEXT,                    -- JSON array of image URLs
    is_pinned BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 그룹 게시글 댓글 테이블
CREATE TABLE IF NOT EXISTS group_post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES group_post_comments(id) ON DELETE CASCADE,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 그룹 게시글 읽음 추적
CREATE TABLE IF NOT EXISTS group_post_reads (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 그룹 일정 테이블
CREATE TABLE IF NOT EXISTS group_schedules (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES orgchart_groups(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    category VARCHAR(50) DEFAULT 'meeting',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_created_at ON group_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_post_id ON group_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_reads_post_user ON group_post_reads(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_schedules_group_id ON group_schedules(group_id);
CREATE INDEX IF NOT EXISTS idx_group_schedules_start_date ON group_schedules(start_date);
