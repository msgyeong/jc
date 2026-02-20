-- 댓글·공감 테이블 (API와 연동하려면 users.id 기준으로 생성)
-- 기존 스키마에 comments/likes가 있으면 이 파일은 참고만 하세요.

-- comments (author_id = users.id 사용 시)
-- CREATE TABLE IF NOT EXISTS comments (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   author_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
--   post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
--   content TEXT NOT NULL,
--   parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
--   is_deleted BOOLEAN DEFAULT false,
--   created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
--   updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
-- );

-- likes (member_id = users.id 사용 시, 컬럼명 member_id 유지)
-- CREATE TABLE IF NOT EXISTS likes (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
--   created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
--   UNIQUE(member_id, post_id)
-- );

-- posts에 comments_count, likes_count 컬럼이 없으면 추가
-- ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
-- ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
