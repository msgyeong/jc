-- ============================================
-- Railway PostgreSQL 초기화 스크립트
-- Version: 2.0.0
-- Date: 2026-03-07
-- Description: 영등포 JC 회원관리 앱 전체 DB 스키마
-- ============================================

-- ============================================
-- 1. 회원(users) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    resident_id TEXT UNIQUE, -- 주민등록번호 (암호화 권장)
    phone TEXT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT, -- 자택 주소
    profile_image TEXT,

    -- 선택 정보
    company_name TEXT,
    company_position TEXT,
    company_address TEXT,
    job_type TEXT,
    hobby TEXT,
    specialty TEXT,
    recommender TEXT,

    -- 관리자 전용 필드
    jc_affiliation TEXT, -- 소속 JC
    member_number TEXT UNIQUE, -- 회원번호
    jc_position TEXT, -- JC 직책
    joined_at DATE, -- JC 가입일
    department TEXT, -- 소속분과
    transferred_at DATE, -- 전입일
    discipline TEXT, -- 징계 메모

    -- 상태 관리
    role TEXT DEFAULT 'pending' CHECK (role IN ('super_admin', 'admin', 'member', 'pending')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended', 'withdrawn')),
    is_special_member BOOLEAN DEFAULT false, -- 특우회 여부
    rejection_reason TEXT, -- 거절 사유
    withdrawn_at TIMESTAMPTZ, -- 탈퇴일

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 학력(educations) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS educations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    graduation_date TEXT NOT NULL, -- 졸업 년월 (6자리)
    school_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 경력(careers) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS careers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    career_date TEXT NOT NULL, -- 경력 년월 (6자리)
    career_description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 가족 정보(families) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS families (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_married BOOLEAN NOT NULL,
    spouse_name TEXT,
    spouse_contact TEXT,
    spouse_birthdate TEXT, -- 8자리
    has_children BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. 자녀(children) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS children (
    id SERIAL PRIMARY KEY,
    family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. 게시글(posts) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[],
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'notice', 'question', 'announcement', 'event')),
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_banner BOOLEAN DEFAULT false,
    attendance_enabled BOOLEAN DEFAULT false,
    linked_schedule_id INTEGER,  -- schedules 테이블 생성 후 FK 추가
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. 댓글(comments) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Polymorphic 관계 (게시글/공지/일정 중 하나)
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    notice_id INTEGER,  -- notices 테이블 생성 후 FK 추가
    schedule_id INTEGER, -- schedules 테이블 생성 후 FK 추가

    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. 게시글 공감(post_likes) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- ============================================
-- 9. 공지사항(notices) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[],
    is_pinned BOOLEAN DEFAULT FALSE,
    has_attendance BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. 공지사항 참석자 조사(notice_attendance) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS notice_attendance (
    id SERIAL PRIMARY KEY,
    notice_id INTEGER REFERENCES notices(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('attending', 'not_attending', 'undecided')) DEFAULT 'undecided',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notice_id, user_id)
);

-- ============================================
-- 11. 일정(schedules) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT,
    category TEXT DEFAULT 'event' CHECK (category IN ('event', 'meeting', 'training', 'holiday', 'other')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    linked_post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- posts.linked_schedule_id FK 추가 (schedules 생성 후)
ALTER TABLE posts ADD CONSTRAINT fk_posts_schedule FOREIGN KEY (linked_schedule_id) REFERENCES schedules(id) ON DELETE SET NULL;

-- comments 테이블에 FK 추가 (notices, schedules 생성 후)
ALTER TABLE comments ADD CONSTRAINT fk_comments_notice FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE;
ALTER TABLE comments ADD CONSTRAINT fk_comments_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE;

-- comments polymorphic 제약: post_id, notice_id, schedule_id 중 하나만 NOT NULL
ALTER TABLE comments ADD CONSTRAINT comment_target_check CHECK (
    (post_id IS NOT NULL AND notice_id IS NULL AND schedule_id IS NULL) OR
    (post_id IS NULL AND notice_id IS NOT NULL AND schedule_id IS NULL) OR
    (post_id IS NULL AND notice_id IS NULL AND schedule_id IS NOT NULL)
);

-- ============================================
-- 12. 공감(likes) 테이블 - Polymorphic (공지/일정용)
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    notice_id INTEGER REFERENCES notices(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT like_target_check CHECK (
        (post_id IS NOT NULL AND notice_id IS NULL AND schedule_id IS NULL) OR
        (post_id IS NULL AND notice_id IS NOT NULL AND schedule_id IS NULL) OR
        (post_id IS NULL AND notice_id IS NULL AND schedule_id IS NOT NULL)
    ),
    CONSTRAINT like_unique_user_post UNIQUE (user_id, post_id),
    CONSTRAINT like_unique_user_notice UNIQUE (user_id, notice_id),
    CONSTRAINT like_unique_user_schedule UNIQUE (user_id, schedule_id)
);

-- ============================================
-- 13. 읽음 추적(read_status) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS read_status (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    notice_id INTEGER REFERENCES notices(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT read_target_check CHECK (
        (post_id IS NOT NULL AND notice_id IS NULL AND schedule_id IS NULL) OR
        (post_id IS NULL AND notice_id IS NOT NULL AND schedule_id IS NULL) OR
        (post_id IS NULL AND notice_id IS NULL AND schedule_id IS NOT NULL)
    ),
    CONSTRAINT read_unique_user_post UNIQUE (user_id, post_id),
    CONSTRAINT read_unique_user_notice UNIQUE (user_id, notice_id),
    CONSTRAINT read_unique_user_schedule UNIQUE (user_id, schedule_id)
);

-- ============================================
-- 14. 직책/권한(role_permissions) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL,
    can_post_notice BOOLEAN DEFAULT false,
    can_create_schedule BOOLEAN DEFAULT false,
    can_delete_post BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 15. 배너(banners) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    link_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 16. 표창(awards) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS awards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    awarded_on DATE,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. 국제대회 참가(international_competitions) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS international_competitions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    participated_on DATE,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 18. JC 경력(jc_careers) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS jc_careers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    started_on DATE,
    ended_on DATE,
    note TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 19. 징계 이력(disciplinary_actions) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS disciplinary_actions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    action_on DATE,
    note TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 20. 교육 이력(education_history) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS education_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    education_type TEXT NOT NULL, -- '신입회원교육', '2차교육', '리더십교육', '기타' 등
    education_name TEXT,
    education_date DATE,
    education_batch TEXT, -- 교육 기수 (예: '2026-1기')
    is_completed BOOLEAN DEFAULT false,
    completion_date DATE,
    note TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 21. 세션(sessions) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성
-- ============================================

-- users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_jc_position ON users(jc_position);

-- educations
CREATE INDEX IF NOT EXISTS idx_educations_user_id ON educations(user_id);

-- careers
CREATE INDEX IF NOT EXISTS idx_careers_user_id ON careers(user_id);

-- posts
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

-- comments
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_notice ON comments(notice_id);
CREATE INDEX IF NOT EXISTS idx_comments_schedule ON comments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- likes
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_notice ON likes(notice_id);
CREATE INDEX IF NOT EXISTS idx_likes_schedule ON likes(schedule_id);

-- notices
CREATE INDEX IF NOT EXISTS idx_notices_pinned ON notices(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_created ON notices(created_at DESC);

-- schedules
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(start_date);

-- read_status
CREATE INDEX IF NOT EXISTS idx_read_status_user ON read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_read_status_post ON read_status(post_id);
CREATE INDEX IF NOT EXISTS idx_read_status_notice ON read_status(notice_id);
CREATE INDEX IF NOT EXISTS idx_read_status_schedule ON read_status(schedule_id);

-- banners
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(order_index);

-- 관리자 전용 테이블
CREATE INDEX IF NOT EXISTS idx_awards_user ON awards(user_id);
CREATE INDEX IF NOT EXISTS idx_international_competitions_user ON international_competitions(user_id);
CREATE INDEX IF NOT EXISTS idx_jc_careers_user ON jc_careers(user_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_user ON disciplinary_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_education_history_user ON education_history(user_id);
CREATE INDEX IF NOT EXISTS idx_education_history_type ON education_history(education_type);
CREATE INDEX IF NOT EXISTS idx_education_history_batch ON education_history(education_batch);

-- sessions
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- 트리거 함수
-- ============================================

-- updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER educations_updated_at BEFORE UPDATE ON educations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER careers_updated_at BEFORE UPDATE ON careers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER children_updated_at BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER notices_updated_at BEFORE UPDATE ON notices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER role_permissions_updated_at BEFORE UPDATE ON role_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER banners_updated_at BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER awards_updated_at BEFORE UPDATE ON awards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER international_competitions_updated_at BEFORE UPDATE ON international_competitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER jc_careers_updated_at BEFORE UPDATE ON jc_careers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER disciplinary_actions_updated_at BEFORE UPDATE ON disciplinary_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER education_history_updated_at BEFORE UPDATE ON education_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 댓글 수 자동 업데이트 (Polymorphic)
-- ============================================
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.notice_id IS NOT NULL THEN
            UPDATE notices SET comments_count = comments_count + 1 WHERE id = NEW.notice_id;
        ELSIF NEW.schedule_id IS NOT NULL THEN
            UPDATE schedules SET comments_count = comments_count + 1 WHERE id = NEW.schedule_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
        ELSIF OLD.notice_id IS NOT NULL THEN
            UPDATE notices SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.notice_id;
        ELSIF OLD.schedule_id IS NOT NULL THEN
            UPDATE schedules SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.schedule_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- ============================================
-- 공감 수 자동 업데이트 (Polymorphic)
-- ============================================
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.notice_id IS NOT NULL THEN
            UPDATE notices SET likes_count = likes_count + 1 WHERE id = NEW.notice_id;
        ELSIF NEW.schedule_id IS NOT NULL THEN
            UPDATE schedules SET likes_count = likes_count + 1 WHERE id = NEW.schedule_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
        ELSIF OLD.notice_id IS NOT NULL THEN
            UPDATE notices SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.notice_id;
        ELSIF OLD.schedule_id IS NOT NULL THEN
            UPDATE schedules SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.schedule_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_likes_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- post_likes용 (기존 호환)
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_likes_count_trigger
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- ============================================
-- 만료된 세션 자동 정리
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 완료
-- ============================================
SELECT 'Railway PostgreSQL 데이터베이스 초기화 완료!' AS message;
SELECT '총 21개 테이블 생성 완료' AS info;
