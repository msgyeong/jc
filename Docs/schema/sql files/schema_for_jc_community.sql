-- Supabase Schema for 영등포 JC 회원관리 앱
-- 생성일: 2026-01-19
-- 업데이트: 2026-01-19 (관리자 전용 필드 별도 테이블 방식 적용, 교육 이력 테이블 추가, 성능 최적화 포함)
-- 기준 문서: prd/08-design.md, prd/01-users.md, prd/05-data-policy.md
--
-- 적용 방식:
-- - 관리자 전용 필드: 별도 테이블 방식 (awards, international_competitions, jc_careers, disciplinary_actions, education_history)
-- - 성능 최적화: comment_count, like_count 캐시 컬럼 및 자동 업데이트 트리거

-- ============================================
-- 1. 회원(members) 테이블
-- ============================================

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Supabase Auth 연동
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 기본 정보 (필수)
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  resident_id TEXT UNIQUE NOT NULL, -- 주민등록번호 (하이픈 포함, 암호화 권장)
  address TEXT NOT NULL, -- 자택 주소 (상세 주소 포함)
  phone TEXT NOT NULL, -- 휴대폰 (하이픈 포함)
  profile_photo_url TEXT, -- Supabase Storage URL (1매 필수)
  
  -- 선택 정보
  company_name TEXT,
  company_position TEXT,
  company_address TEXT,
  job_type TEXT,
  hobby TEXT,
  specialty TEXT,
  recommender TEXT,
  
  -- 관리자 전용 필드 (관리자 웹에서만 입력/수정 가능)
  jc_affiliation TEXT, -- 소속 JC
  member_number TEXT UNIQUE, -- 회원번호
  jc_position TEXT, -- JC 직책
  joined_at DATE, -- 가입일
  department TEXT, -- 소속분과
  transferred_at DATE, -- 전입 (년, 월, 일)
  -- 참고: 표창, 국제대회 참가, JC경력, 교육 이력은 별도 테이블로 관리 (awards, international_competitions, jc_careers, education_history)
  discipline TEXT, -- 징계 (징계 이력은 disciplinary_actions 테이블로 관리)
  
  -- 상태 관리
  is_approved BOOLEAN DEFAULT false, -- 가입 승인 여부
  is_suspended BOOLEAN DEFAULT false, -- 정지 여부
  rejection_reason TEXT, -- 거절 사유
  withdrawn_at TIMESTAMPTZ, -- 탈퇴일
  is_deleted BOOLEAN DEFAULT false, -- 삭제 여부
  is_special_member BOOLEAN DEFAULT false, -- 특우회 여부 (정보 표시용)
  
  -- 공통 필드
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 2. 학력(educations) 테이블
-- ============================================

CREATE TABLE educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  graduation_date TEXT NOT NULL, -- 졸업 년월 (6자리)
  school_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 3. 경력(careers) 테이블
-- ============================================

CREATE TABLE careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  career_date TEXT NOT NULL, -- 경력 년월 (6자리)
  career_description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 4. 가족 정보(families) 테이블
-- ============================================

CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID UNIQUE NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  is_married BOOLEAN NOT NULL, -- 혼인 유무
  spouse_name TEXT, -- 배우자명 (혼인인 경우 필수)
  spouse_contact TEXT, -- 배우자 연락처 (하이픈 포함)
  spouse_birthdate TEXT, -- 배우자 생년월일 (8자리)
  has_children BOOLEAN NOT NULL, -- 자녀 유무
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 5. 자녀(children) 테이블
-- ============================================

CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 자녀 이름
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 6. 게시글(posts) 테이블
-- ============================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[], -- 첨부 이미지 URL 배열 (Supabase Storage)
  comment_count INTEGER DEFAULT 0, -- 댓글 수 캐시 (자동 업데이트)
  like_count INTEGER DEFAULT 0, -- 공감 수 캐시 (자동 업데이트)
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 7. 공지사항(notices) 테이블
-- ============================================

CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false, -- 고정 공지 여부
  attendance_survey_enabled BOOLEAN DEFAULT false, -- 참석자 조사 활성화 여부
  comment_count INTEGER DEFAULT 0, -- 댓글 수 캐시 (자동 업데이트)
  like_count INTEGER DEFAULT 0, -- 공감 수 캐시 (자동 업데이트)
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 8. 일정(schedules) 테이블
-- ============================================

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL, -- 일정 날짜
  start_time TIME, -- 시작 시간
  end_time TIME, -- 종료 시간
  location TEXT, -- 장소
  comment_count INTEGER DEFAULT 0, -- 댓글 수 캐시 (자동 업데이트)
  like_count INTEGER DEFAULT 0, -- 공감 수 캐시 (자동 업데이트)
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 9. 댓글(comments) 테이블 (Polymorphic)
-- ============================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES members(id) ON DELETE SET NULL,
  
  -- Polymorphic 관계 (게시글/공지/일정 중 하나)
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  
  -- 대댓글 지원
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 제약: post_id, notice_id, schedule_id 중 하나만 NULL이 아니어야 함
  CONSTRAINT comment_target_check CHECK (
    (post_id IS NOT NULL AND notice_id IS NULL AND schedule_id IS NULL) OR
    (post_id IS NULL AND notice_id IS NOT NULL AND schedule_id IS NULL) OR
    (post_id IS NULL AND notice_id IS NULL AND schedule_id IS NOT NULL)
  )
);

-- ============================================
-- 10. 공감(likes) 테이블 (Polymorphic)
-- ============================================

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  
  -- Polymorphic 관계
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 제약: post_id, notice_id, schedule_id 중 하나만 NULL이 아니어야 함
  CONSTRAINT like_target_check CHECK (
    (post_id IS NOT NULL AND notice_id IS NULL AND schedule_id IS NULL) OR
    (post_id IS NULL AND notice_id IS NOT NULL AND schedule_id IS NULL) OR
    (post_id IS NULL AND notice_id IS NULL AND schedule_id IS NOT NULL)
  ),
  
  -- 제약: 같은 콘텐츠에 대한 중복 공감 방지
  CONSTRAINT like_unique_member_post UNIQUE (member_id, post_id),
  CONSTRAINT like_unique_member_notice UNIQUE (member_id, notice_id),
  CONSTRAINT like_unique_member_schedule UNIQUE (member_id, schedule_id)
);

-- ============================================
-- 11. 참석자 조사(attendance_surveys) 테이블
-- ============================================

CREATE TYPE attendance_status AS ENUM ('attending', 'not_attending', 'undecided');

CREATE TABLE attendance_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status attendance_status NOT NULL DEFAULT 'undecided', -- 참석/불참/미정
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 제약: 한 회원당 한 공지에 하나의 참석 여부만
  UNIQUE (notice_id, member_id)
);

-- ============================================
-- 12. 읽음 추적(read_status) 테이블 (Polymorphic)
-- ============================================

CREATE TABLE read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  
  -- Polymorphic 관계
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  
  read_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- 제약: post_id, notice_id, schedule_id 중 하나만 NULL이 아니어야 함
  CONSTRAINT read_target_check CHECK (
    (post_id IS NOT NULL AND notice_id IS NULL AND schedule_id IS NULL) OR
    (post_id IS NULL AND notice_id IS NOT NULL AND schedule_id IS NULL) OR
    (post_id IS NULL AND notice_id IS NULL AND schedule_id IS NOT NULL)
  ),
  
  -- 제약: 같은 콘텐츠에 대한 중복 읽음 추적 방지
  CONSTRAINT read_unique_member_post UNIQUE (member_id, post_id),
  CONSTRAINT read_unique_member_notice UNIQUE (member_id, notice_id),
  CONSTRAINT read_unique_member_schedule UNIQUE (member_id, schedule_id)
);

-- ============================================
-- 13. 관리자 전용 필드 테이블 (별도 테이블 방식)
-- ============================================

-- 13-1. 표창(awards) 테이블
CREATE TABLE awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- 표창명
  awarded_on DATE, -- 수상일
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 13-2. 국제대회 참가(international_competitions) 테이블
CREATE TABLE international_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 대회명
  participated_on DATE, -- 참가일
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 13-3. JC 경력(jc_careers) 테이블
CREATE TABLE jc_careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 직책명
  started_on DATE, -- 시작일
  ended_on DATE, -- 종료일
  note TEXT, -- 비고
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 13-4. 징계 이력(disciplinary_actions) 테이블
CREATE TABLE disciplinary_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 징계 내용
  action_on DATE, -- 징계일
  note TEXT, -- 비고
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 13-5. 교육 이력(education_history) 테이블
CREATE TABLE education_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  education_type TEXT NOT NULL, -- 교육 종류 ('신입회원교육', '2차교육', '리더십교육', '기타' 등)
  education_name TEXT, -- 교육명 (선택, 기타 교육의 경우)
  education_date DATE, -- 교육 수료일 또는 참가일
  education_batch TEXT, -- 교육 기수 (예: '2026-1기', '57기' 등)
  is_completed BOOLEAN DEFAULT false, -- 이수 여부 (true: 이수, false: 미이수)
  completion_date DATE, -- 수료일 (이수한 경우)
  note TEXT, -- 비고
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 14. 직책/권한(role_permissions) 테이블
-- ============================================

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT UNIQUE NOT NULL, -- 직책명 (예: '회장', '이사' 등)
  can_post_notice BOOLEAN DEFAULT false, -- 공지사항 작성 권한
  can_create_schedule BOOLEAN DEFAULT false, -- 일정 등록 권한
  can_delete_post BOOLEAN DEFAULT false, -- 게시글 삭제 권한
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 15. 홍보/광고 배너(banners) 테이블
-- ============================================

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- 업체명 또는 제목
  image_url TEXT NOT NULL, -- 대표 이미지 또는 로고 (Supabase Storage)
  description TEXT, -- 짧은 홍보 문구
  link_url TEXT, -- 외부 링크 (선택)
  display_order INTEGER DEFAULT 0, -- 표시 순서
  is_active BOOLEAN DEFAULT true, -- 활성화 여부
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- 인덱스 생성
-- ============================================

-- members
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_is_approved ON members(is_approved) WHERE is_approved = true;
CREATE INDEX idx_members_jc_position ON members(jc_position);

-- posts
CREATE INDEX idx_posts_created_at ON posts(created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- notices
CREATE INDEX idx_notices_is_pinned ON notices(is_pinned, created_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_notices_created_at ON notices(created_at DESC) WHERE is_deleted = false;

-- schedules
CREATE INDEX idx_schedules_date ON schedules(date) WHERE is_deleted = false;
CREATE INDEX idx_schedules_date_asc ON schedules(date ASC) WHERE is_deleted = false;

-- comments
CREATE INDEX idx_comments_post_id ON comments(post_id) WHERE is_deleted = false;
CREATE INDEX idx_comments_notice_id ON comments(notice_id) WHERE is_deleted = false;
CREATE INDEX idx_comments_schedule_id ON comments(schedule_id) WHERE is_deleted = false;
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);

-- likes
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_notice_id ON likes(notice_id);
CREATE INDEX idx_likes_schedule_id ON likes(schedule_id);

-- attendance_surveys
CREATE INDEX idx_attendance_surveys_notice_id ON attendance_surveys(notice_id);
CREATE INDEX idx_attendance_surveys_member_id ON attendance_surveys(member_id);

-- read_status
CREATE INDEX idx_read_status_post_id ON read_status(post_id);
CREATE INDEX idx_read_status_notice_id ON read_status(notice_id);
CREATE INDEX idx_read_status_schedule_id ON read_status(schedule_id);
CREATE INDEX idx_read_status_member_id ON read_status(member_id);

-- banners
CREATE INDEX idx_banners_display_order ON banners(display_order) WHERE is_active = true AND is_deleted = false;

-- 관리자 전용 필드 테이블 인덱스
CREATE INDEX idx_awards_member_id ON awards(member_id) WHERE is_deleted = false;
CREATE INDEX idx_international_competitions_member_id 
  ON international_competitions(member_id) WHERE is_deleted = false;
CREATE INDEX idx_jc_careers_member_id ON jc_careers(member_id) WHERE is_deleted = false;
CREATE INDEX idx_disciplinary_actions_member_id 
  ON disciplinary_actions(member_id) WHERE is_deleted = false;

-- 교육 이력 인덱스 (교육 기수 기반 검색 및 필터링 최적화)
CREATE INDEX idx_education_history_member_id 
  ON education_history(member_id) WHERE is_deleted = false;
CREATE INDEX idx_education_history_education_type 
  ON education_history(education_type) WHERE is_deleted = false;
CREATE INDEX idx_education_history_education_batch 
  ON education_history(education_batch) WHERE is_deleted = false;
CREATE INDEX idx_education_history_is_completed 
  ON education_history(is_completed) WHERE is_deleted = false;
CREATE INDEX idx_education_history_member_type_completed 
  ON education_history(member_id, education_type, is_completed) WHERE is_deleted = false;

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- members: 회원 가입 및 정보 관리
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 신규 회원 가입: 자신의 auth_user_id로 INSERT 가능 (is_approved = false로 가입)
CREATE POLICY "신규 회원 가입 가능"
  ON members FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- 승인된 회원: 자신의 정보 조회/수정 가능
CREATE POLICY "승인된 회원은 자신의 정보 조회/수정 가능"
  ON members FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "승인된 회원은 자신의 정보 수정 가능"
  ON members FOR UPDATE
  USING (auth.uid() = auth_user_id AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL);

-- 승인된 회원: 다른 회원의 공개 정보 조회 가능
CREATE POLICY "승인된 회원은 다른 회원의 공개 정보 조회 가능"
  ON members FOR SELECT
  USING (is_approved = true AND is_suspended = false AND withdrawn_at IS NULL);

-- educations: 회원가입 시 학력 정보 INSERT 가능
ALTER TABLE educations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "회원은 자신의 학력 정보 INSERT 가능"
  ON educations FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM members WHERE id = member_id AND auth_user_id = auth.uid())
  );

CREATE POLICY "회원은 자신의 학력 정보 조회 가능"
  ON educations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM members WHERE id = member_id AND auth_user_id = auth.uid())
  );

-- careers: 회원가입 시 경력 정보 INSERT 가능
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "회원은 자신의 경력 정보 INSERT 가능"
  ON careers FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM members WHERE id = member_id AND auth_user_id = auth.uid())
  );

CREATE POLICY "회원은 자신의 경력 정보 조회 가능"
  ON careers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM members WHERE id = member_id AND auth_user_id = auth.uid())
  );

-- families: 회원가입 시 가족 정보 INSERT 가능
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "회원은 자신의 가족 정보 INSERT 가능"
  ON families FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM members WHERE id = member_id AND auth_user_id = auth.uid())
  );

CREATE POLICY "회원은 자신의 가족 정보 조회 가능"
  ON families FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM members WHERE id = member_id AND auth_user_id = auth.uid())
  );

-- children: 회원가입 시 자녀 정보 INSERT 가능
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "회원은 자신의 자녀 정보 INSERT 가능"
  ON children FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM families f 
      JOIN members m ON f.member_id = m.id 
      WHERE f.id = family_id AND m.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "회원은 자신의 자녀 정보 조회 가능"
  ON children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM families f 
      JOIN members m ON f.member_id = m.id 
      WHERE f.id = family_id AND m.auth_user_id = auth.uid()
    )
  );

-- posts: 승인된 회원은 게시글 조회/작성 가능, 자신의 게시글만 수정/삭제 가능
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "승인된 회원은 게시글 조회 가능"
  ON posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    ) AND is_deleted = false
  );

CREATE POLICY "승인된 회원은 게시글 작성 가능"
  ON posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    )
  );

CREATE POLICY "작성자는 자신의 게시글 수정/삭제 가능"
  ON posts FOR UPDATE
  USING (author_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));

-- notices: 승인된 회원은 공지사항 조회 가능, 관리자는 작성/수정/삭제 가능
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "승인된 회원은 공지사항 조회 가능"
  ON notices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN role_permissions rp ON m.jc_position = rp.role_name
      WHERE m.auth_user_id = auth.uid()
      AND m.is_approved = true AND m.is_suspended = false AND m.withdrawn_at IS NULL
    ) AND is_deleted = false
  );

CREATE POLICY "권한 있는 회원은 공지사항 작성/수정/삭제 가능"
  ON notices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN role_permissions rp ON m.jc_position = rp.role_name
      WHERE m.auth_user_id = auth.uid()
      AND m.is_approved = true AND m.is_suspended = false AND m.withdrawn_at IS NULL
      AND rp.can_post_notice = true
    )
  );

-- schedules: 승인된 회원은 일정 조회 가능, 관리자는 등록/수정/삭제 가능
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "승인된 회원은 일정 조회 가능"
  ON schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    ) AND is_deleted = false
  );

CREATE POLICY "권한 있는 회원은 일정 등록/수정/삭제 가능"
  ON schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members m
      JOIN role_permissions rp ON m.jc_position = rp.role_name
      WHERE m.auth_user_id = auth.uid()
      AND m.is_approved = true AND m.is_suspended = false AND m.withdrawn_at IS NULL
      AND rp.can_create_schedule = true
    )
  );

-- comments: 승인된 회원은 댓글 조회/작성 가능, 자신의 댓글만 수정/삭제 가능
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "승인된 회원은 댓글 조회 가능"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    ) AND is_deleted = false
  );

CREATE POLICY "승인된 회원은 댓글 작성 가능"
  ON comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    )
  );

CREATE POLICY "작성자는 자신의 댓글 수정/삭제 가능"
  ON comments FOR UPDATE
  USING (author_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));

-- likes: 승인된 회원은 공감 조회/작성 가능
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "승인된 회원은 공감 조회/작성 가능"
  ON likes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    )
  );

-- attendance_surveys: 승인된 회원은 참석자 조사 조회/참여 가능
ALTER TABLE attendance_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "승인된 회원은 참석자 조사 조회/참여 가능"
  ON attendance_surveys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    )
  );

-- read_status: 승인된 회원은 읽음 상태 조회/기록 가능
ALTER TABLE read_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "승인된 회원은 읽음 상태 조회/기록 가능"
  ON read_status FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    )
  );

-- banners: 승인된 회원은 배너 조회 가능
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "승인된 회원은 배너 조회 가능"
  ON banners FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    ) AND is_active = true AND is_deleted = false
  );

-- 관리자 전용 필드 테이블 RLS 정책
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE international_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jc_careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_history ENABLE ROW LEVEL SECURITY;

-- 승인된 회원은 자신의 표창 조회 가능 (읽기 전용)
CREATE POLICY "승인된 회원은 자신의 표창 조회 가능"
  ON awards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = awards.member_id
      AND auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    ) AND is_deleted = false
  );

-- 승인된 회원은 자신의 국제대회 참가 조회 가능 (읽기 전용)
CREATE POLICY "승인된 회원은 자신의 국제대회 참가 조회 가능"
  ON international_competitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = international_competitions.member_id
      AND auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    ) AND is_deleted = false
  );

-- 승인된 회원은 자신의 JC 경력 조회 가능 (읽기 전용)
CREATE POLICY "승인된 회원은 자신의 JC 경력 조회 가능"
  ON jc_careers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = jc_careers.member_id
      AND auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    ) AND is_deleted = false
  );

-- 징계는 비공개 (관리자 웹에서만 관리)
CREATE POLICY "징계는 관리자 웹에서만 접근"
  ON disciplinary_actions FOR ALL
  USING (false); -- RLS 차단 (관리자 웹은 Service Role 키 사용)

-- 승인된 회원은 자신의 교육 이력 조회 가능 (읽기 전용)
CREATE POLICY "승인된 회원은 자신의 교육 이력 조회 가능"
  ON education_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = education_history.member_id
      AND auth_user_id = auth.uid()
      AND is_approved = true AND is_suspended = false AND withdrawn_at IS NULL
    ) AND is_deleted = false
  );

-- ============================================
-- RPC: 회원가입 시 이메일 사용 가능 여부 (anon 호출 가능)
-- members + auth.users 둘 다 조회 (Auth에만 있어도 "이미 사용 중"으로 표시)
-- ============================================
CREATE OR REPLACE FUNCTION public.check_email_available(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.members
    WHERE lower(trim(email)) = lower(trim(p_email))
  )
  AND NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(trim(p_email))
  );
$$;
COMMENT ON FUNCTION public.check_email_available(text) IS
  '회원가입 화면에서 이메일 중복 확인용. members 및 auth.users 모두 확인. true=사용 가능, false=이미 사용 중.';
-- 회원가입 화면(비인증)에서 이메일 중복 확인 호출을 위해 anon 실행 허용
GRANT EXECUTE ON FUNCTION public.check_email_available(text) TO anon;

-- ============================================
-- RPC: 주민등록번호 중복 확인 (anon 호출 가능)
-- ============================================
CREATE OR REPLACE FUNCTION public.check_resident_id_available(p_resident_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN length(regexp_replace(trim(p_resident_id), '[^0-9]', '', 'g')) <> 13
    THEN true
    ELSE NOT EXISTS (
      SELECT 1 FROM public.members
      WHERE regexp_replace(resident_id, '[^0-9]', '', 'g') =
            regexp_replace(trim(p_resident_id), '[^0-9]', '', 'g')
    )
  END;
$$;
COMMENT ON FUNCTION public.check_resident_id_available(text) IS
  '회원가입 화면 주민번호 중복 확인. true=사용 가능, false=이미 등록된 번호.';
GRANT EXECUTE ON FUNCTION public.check_resident_id_available(text) TO anon;

-- ============================================
-- RPC: 휴대폰 번호 중복 확인 (anon 호출 가능)
-- ============================================
CREATE OR REPLACE FUNCTION public.check_phone_available(p_phone text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN length(regexp_replace(trim(p_phone), '[^0-9]', '', 'g')) < 10
    THEN true
    ELSE NOT EXISTS (
      SELECT 1 FROM public.members
      WHERE regexp_replace(phone, '[^0-9]', '', 'g') =
            regexp_replace(trim(p_phone), '[^0-9]', '', 'g')
    )
  END;
$$;
COMMENT ON FUNCTION public.check_phone_available(text) IS
  '회원가입 화면 휴대폰 중복 확인. true=사용 가능, false=이미 등록된 번호.';
GRANT EXECUTE ON FUNCTION public.check_phone_available(text) TO anon;

-- ============================================
-- 트리거: updated_at 자동 업데이트
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_educations_updated_at BEFORE UPDATE ON educations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_careers_updated_at BEFORE UPDATE ON careers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_surveys_updated_at BEFORE UPDATE ON attendance_surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 관리자 전용 필드 테이블 트리거
CREATE TRIGGER update_awards_updated_at BEFORE UPDATE ON awards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_international_competitions_updated_at 
  BEFORE UPDATE ON international_competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jc_careers_updated_at BEFORE UPDATE ON jc_careers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciplinary_actions_updated_at 
  BEFORE UPDATE ON disciplinary_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_history_updated_at 
  BEFORE UPDATE ON education_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 성능 최적화: 댓글/공감 카운트 자동 업데이트 트리거
-- ============================================

-- 댓글 카운트 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
DECLARE
  target_table TEXT;
  target_id UUID;
BEGIN
  -- Polymorphic 관계에 따라 대상 테이블 및 ID 결정
  IF NEW.post_id IS NOT NULL THEN
    target_table := 'posts';
    target_id := NEW.post_id;
  ELSIF NEW.notice_id IS NOT NULL THEN
    target_table := 'notices';
    target_id := NEW.notice_id;
  ELSIF NEW.schedule_id IS NOT NULL THEN
    target_table := 'schedules';
    target_id := NEW.schedule_id;
  ELSE
    RETURN NULL;
  END IF;

  IF TG_OP = 'INSERT' AND (NEW.is_deleted = false OR NEW.is_deleted IS NULL) THEN
    EXECUTE format('UPDATE %I SET comment_count = comment_count + 1 WHERE id = $1', target_table)
      USING target_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND (NEW.is_deleted = true OR NEW.is_deleted IS NOT NULL) THEN
      EXECUTE format('UPDATE %I SET comment_count = comment_count - 1 WHERE id = $1', target_table)
        USING target_id;
    ELSIF OLD.is_deleted = true AND (NEW.is_deleted = false OR NEW.is_deleted IS NULL) THEN
      EXECUTE format('UPDATE %I SET comment_count = comment_count + 1 WHERE id = $1', target_table)
        USING target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND (OLD.is_deleted = false OR OLD.is_deleted IS NULL) THEN
    IF OLD.post_id IS NOT NULL THEN
      target_table := 'posts';
      target_id := OLD.post_id;
    ELSIF OLD.notice_id IS NOT NULL THEN
      target_table := 'notices';
      target_id := OLD.notice_id;
    ELSIF OLD.schedule_id IS NOT NULL THEN
      target_table := 'schedules';
      target_id := OLD.schedule_id;
    END IF;
    EXECUTE format('UPDATE %I SET comment_count = comment_count - 1 WHERE id = $1', target_table)
      USING target_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 댓글 카운트 자동 업데이트 트리거
CREATE TRIGGER update_comment_count_on_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (NEW.is_deleted = false OR NEW.is_deleted IS NULL)
  EXECUTE FUNCTION update_comment_count();

CREATE TRIGGER update_comment_count_on_update
  AFTER UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_count();

CREATE TRIGGER update_comment_count_on_delete
  AFTER DELETE ON comments
  FOR EACH ROW
  WHEN (OLD.is_deleted = false OR OLD.is_deleted IS NULL)
  EXECUTE FUNCTION update_comment_count();

-- 공감 카운트 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
DECLARE
  target_table TEXT;
  target_id UUID;
BEGIN
  -- Polymorphic 관계에 따라 대상 테이블 및 ID 결정
  IF NEW.post_id IS NOT NULL THEN
    target_table := 'posts';
    target_id := NEW.post_id;
  ELSIF NEW.notice_id IS NOT NULL THEN
    target_table := 'notices';
    target_id := NEW.notice_id;
  ELSIF NEW.schedule_id IS NOT NULL THEN
    target_table := 'schedules';
    target_id := NEW.schedule_id;
  ELSE
    RETURN NULL;
  END IF;

  IF TG_OP = 'INSERT' THEN
    EXECUTE format('UPDATE %I SET like_count = like_count + 1 WHERE id = $1', target_table)
      USING target_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      target_table := 'posts';
      target_id := OLD.post_id;
    ELSIF OLD.notice_id IS NOT NULL THEN
      target_table := 'notices';
      target_id := OLD.notice_id;
    ELSIF OLD.schedule_id IS NOT NULL THEN
      target_table := 'schedules';
      target_id := OLD.schedule_id;
    END IF;
    EXECUTE format('UPDATE %I SET like_count = like_count - 1 WHERE id = $1', target_table)
      USING target_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 공감 카운트 자동 업데이트 트리거
CREATE TRIGGER update_like_count_on_insert
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_like_count();

CREATE TRIGGER update_like_count_on_delete
  AFTER DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_like_count();

-- ============================================
-- 주석 (Documentation)
-- ============================================

COMMENT ON TABLE members IS '회원 정보 테이블. Supabase Auth와 연동되어 인증을 처리하며, 관리자 전용 필드는 관리자 웹에서만 입력/수정 가능';
COMMENT ON TABLE educations IS '회원 학력 정보. 회원당 최소 1개 이상 필요';
COMMENT ON TABLE careers IS '회원 경력 정보. 회원당 최소 1개 이상 필요';
COMMENT ON TABLE families IS '회원 가족 정보. 혼인/자녀 유무 및 배우자 정보 포함';
COMMENT ON TABLE children IS '회원 자녀 정보. families 테이블과 1:N 관계';
COMMENT ON TABLE posts IS '게시글 테이블. 전체 회원 작성 가능, 작성자 또는 관리자만 수정/삭제 가능';
COMMENT ON TABLE notices IS '공지사항 테이블. 앱 내 관리자(직책 기반)만 작성 가능, 고정 공지 지원';
COMMENT ON TABLE schedules IS '일정 테이블. 앱 내 관리자(직책 기반)만 등록 가능';
COMMENT ON TABLE comments IS '댓글/대댓글 테이블. 게시글/공지/일정에 대한 댓글 지원(Polymorphic)';
COMMENT ON TABLE likes IS '공감 테이블. 게시글/공지/일정에 대한 공감 지원(Polymorphic)';
COMMENT ON TABLE attendance_surveys IS '참석자 조사 테이블. 공지사항에 대한 참석 여부 조사';
COMMENT ON TABLE read_status IS '읽음 추적 테이블. 게시글/공지/일정의 사용자별 읽음 상태 추적(Polymorphic)';
COMMENT ON TABLE role_permissions IS '직책별 권한 테이블. 관리자 웹에서 직책별 권한 설정';
COMMENT ON TABLE banners IS '홍보/광고 배너 테이블. 홈 화면 슬라이드 배너용';
COMMENT ON TABLE awards IS '회원 표창 정보. 관리자 웹에서만 입력/수정 가능, 회원당 최대 5개';
COMMENT ON TABLE international_competitions IS '국제대회 참가 정보. 관리자 웹에서만 입력/수정 가능, 회원당 최대 2개';
COMMENT ON TABLE jc_careers IS 'JC 경력 정보. 관리자 웹에서만 입력/수정 가능, 회원당 최대 5개';
COMMENT ON TABLE disciplinary_actions IS '징계 이력. 관리자 웹에서만 관리 가능 (비공개)';
COMMENT ON TABLE education_history IS '회원 교육 이력. 관리자 웹에서만 입력/수정 가능, 교육 기수 기반 검색 및 이수/미이수 필터링 지원';
COMMENT ON COLUMN posts.comment_count IS '댓글 수 캐시 (자동 업데이트)';
COMMENT ON COLUMN posts.like_count IS '공감 수 캐시 (자동 업데이트)';
COMMENT ON COLUMN notices.comment_count IS '댓글 수 캐시 (자동 업데이트)';
COMMENT ON COLUMN notices.like_count IS '공감 수 캐시 (자동 업데이트)';
COMMENT ON COLUMN schedules.comment_count IS '댓글 수 캐시 (자동 업데이트)';
COMMENT ON COLUMN schedules.like_count IS '공감 수 캐시 (자동 업데이트)';

-- ============================================
-- Supabase Storage 버킷 및 정책
-- ============================================
-- 
-- 아래 Storage 정책은 Supabase 대시보드 또는 SQL Editor에서 별도로 실행해야 합니다.
-- storage.buckets, storage.objects 테이블은 Supabase에서 자동 생성됩니다.
--
-- 프로필 사진 버킷: profiles
-- 경로 규칙: profiles/{auth_user_id}/avatar.jpg
-- 접근 정책:
--   - SELECT: 로그인한 사용자 전체 (다른 회원 프로필 사진 조회 가능)
--   - INSERT/UPDATE/DELETE: 본인 폴더만 (profiles/{자기ID}/)
--

-- 버킷 생성 (Supabase 대시보드에서 수동 생성 권장)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true);

-- Storage RLS 정책: SELECT (읽기) - 로그인한 사용자는 모든 프로필 조회 가능
-- CREATE POLICY "프로필 사진 조회 - 로그인 사용자"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'profiles'
--     AND auth.role() = 'authenticated'
--   );

-- Storage RLS 정책: INSERT (업로드) - 본인 폴더에만 업로드 가능
-- CREATE POLICY "프로필 사진 업로드 - 본인 폴더만"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'profiles'
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- Storage RLS 정책: UPDATE (수정) - 본인 파일만 수정 가능
-- CREATE POLICY "프로필 사진 수정 - 본인 파일만"
--   ON storage.objects FOR UPDATE
--   USING (
--     bucket_id = 'profiles'
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- Storage RLS 정책: DELETE (삭제) - 본인 파일만 삭제 가능
-- CREATE POLICY "프로필 사진 삭제 - 본인 파일만"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'profiles'
--     AND auth.role() = 'authenticated'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
