# 🗄️ Supabase 데이터베이스 설정 가이드

## 📋 목차
1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [데이터베이스 테이블 생성](#2-데이터베이스-테이블-생성)
3. [관리자 계정 설정](#3-관리자-계정-설정)
4. [Railway 환경 변수 설정](#4-railway-환경-변수-설정)
5. [웹 앱 설정](#5-웹-앱-설정)

---

## 1. Supabase 프로젝트 생성

### Step 1: 계정 생성
1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인 (무료)

### Step 2: 새 프로젝트 생성
1. "New Project" 클릭
2. 입력:
   - **Name**: `jc-app` (원하는 이름)
   - **Database Password**: 강력한 비밀번호 (메모해두세요!)
   - **Region**: `Northeast Asia (Seoul)` (한국 서버)
   - **Pricing Plan**: `Free` (무료)
3. "Create new project" 클릭 → 약 2분 소요

### Step 3: API 키 확인
1. 프로젝트 생성 완료 후 왼쪽 메뉴에서 **⚙️ Project Settings** 클릭
2. **API** 탭 클릭
3. 다음 정보를 **복사해서 메모**:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (긴 문자열)

---

## 2. 데이터베이스 테이블 생성

### Step 1: SQL Editor 열기
1. 왼쪽 메뉴에서 **🗄️ SQL Editor** 클릭
2. "+ New query" 클릭

### Step 2: 아래 SQL 스크립트 전체 복사해서 붙여넣기

```sql
-- ============================================
-- JC 앱 데이터베이스 스키마
-- ============================================

-- 1. 회원 프로필 테이블 (users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    profile_image TEXT,
    role TEXT DEFAULT 'pending' CHECK (role IN ('super_admin', 'admin', 'member', 'pending')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 게시판 (posts)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[], -- 이미지 URL 배열
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'question', 'announcement', 'event')),
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 댓글 (comments)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- 대댓글용
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 게시글 공감 (post_likes)
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 5. 공지사항 (notices)
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[],
    is_pinned BOOLEAN DEFAULT FALSE,
    has_attendance BOOLEAN DEFAULT FALSE, -- 참석자 조사 여부
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 공지사항 참석자 조사 (notice_attendance)
CREATE TABLE IF NOT EXISTS public.notice_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID REFERENCES public.notices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('attending', 'not_attending', 'undecided')) DEFAULT 'undecided',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notice_id, user_id)
);

-- 7. 일정 (schedules)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT,
    category TEXT DEFAULT 'event' CHECK (category IN ('event', 'meeting', 'training', 'holiday', 'other')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 배너 (banners) - 홈 화면용
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_notices_pinned ON public.notices(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(start_date);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- ============================================
-- Row Level Security (RLS) 활성화
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 정책 (Row Level Security Policies)
-- ============================================

-- 1. users 테이블 정책
-- 모든 승인된 회원은 다른 회원 정보 읽기 가능
CREATE POLICY "Anyone can view active members"
    ON public.users FOR SELECT
    USING (status = 'active' OR auth.uid() = id);

-- 본인 정보만 수정 가능
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- 관리자는 모든 회원 정보 수정 가능
CREATE POLICY "Admins can update any user"
    ON public.users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

-- 2. posts 테이블 정책
-- 모든 승인된 회원은 게시글 읽기 가능
CREATE POLICY "Active members can view posts"
    ON public.posts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND status = 'active'
        )
    );

-- 승인된 회원은 게시글 작성 가능
CREATE POLICY "Active members can create posts"
    ON public.posts FOR INSERT
    WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND status = 'active'
        )
    );

-- 본인 게시글만 수정/삭제 가능
CREATE POLICY "Users can update own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = author_id);

-- 3. comments 테이블 정책
CREATE POLICY "Active members can view comments"
    ON public.comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Active members can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can update own comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = author_id);

-- 4. post_likes 테이블 정책
CREATE POLICY "Active members can view likes"
    ON public.post_likes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Active members can like posts"
    ON public.post_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
    ON public.post_likes FOR DELETE
    USING (auth.uid() = user_id);

-- 5. notices 테이블 정책
CREATE POLICY "Active members can view notices"
    ON public.notices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Admins can create notices"
    ON public.notices FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can update notices"
    ON public.notices FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can delete notices"
    ON public.notices FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

-- 6. notice_attendance 테이블 정책
CREATE POLICY "Active members can view attendance"
    ON public.notice_attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Active members can submit attendance"
    ON public.notice_attendance FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance"
    ON public.notice_attendance FOR UPDATE
    USING (auth.uid() = user_id);

-- 7. schedules 테이블 정책
CREATE POLICY "Active members can view schedules"
    ON public.schedules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Admins can create schedules"
    ON public.schedules FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can update schedules"
    ON public.schedules FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admins can delete schedules"
    ON public.schedules FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

-- 8. banners 테이블 정책
CREATE POLICY "Anyone can view active banners"
    ON public.banners FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Admins can manage banners"
    ON public.banners FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
        )
    );

-- ============================================
-- 트리거 함수 (자동 업데이트)
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notices
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.schedules
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 회원가입 시 users 테이블에 자동 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Unknown'),
        'pending',
        'pending'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 회원가입 시 트리거
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 게시글 댓글 수 자동 업데이트
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comments_count_trigger
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- 게시글 공감 수 자동 업데이트
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_likes_count_trigger
    AFTER INSERT OR DELETE ON public.post_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- ============================================
-- 완료!
-- ============================================

SELECT '✅ 데이터베이스 테이블 생성 완료!' AS message;
```

### Step 3: 실행
1. 위 SQL 전체를 복사해서 SQL Editor에 붙여넣기
2. "RUN" 버튼 클릭 (또는 Ctrl+Enter)
3. 성공 메시지 확인: `✅ 데이터베이스 테이블 생성 완료!`

---

## 3. 관리자 계정 설정

### 첫 번째 회원가입 후 관리자로 승격

1. **웹 앱에서 회원가입**
   - 이메일, 비밀번호, 이름 등 입력하여 회원가입

2. **Supabase에서 관리자로 승격**
   - Supabase 대시보드에서 **🗄️ Table Editor** 클릭
   - `users` 테이블 선택
   - 방금 가입한 회원 찾기
   - **role** 컬럼을 `super_admin`으로 변경
   - **status** 컬럼을 `active`로 변경
   - Save

### 역할 설명
- **`super_admin`**: 총관리자 (모든 권한)
- **`admin`**: 관리자 (회원 승인, 공지사항 작성 등)
- **`member`**: 일반 회원
- **`pending`**: 승인 대기 (가입 직후 상태)

---

## 4. Railway 환경 변수 설정

Railway 프로젝트에 Supabase 연결 정보를 추가합니다.

### Step 1: Railway 프로젝트 열기
1. https://railway.app/dashboard
2. 배포한 `jc` 프로젝트 클릭

### Step 2: 환경 변수 추가
1. **Variables** 탭 클릭
2. 다음 2개 변수 추가:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
```

(위에서 메모한 값을 붙여넣기)

3. **Deploy** 버튼 클릭 (자동 재배포)

---

## 5. 웹 앱 설정

### 로컬 개발 환경

`web/js/config.js` 파일을 수정합니다:

```javascript
// Supabase 설정
const SUPABASE_CONFIG = {
    url: 'https://xxxxx.supabase.co', // 👈 여기에 실제 URL 입력
    anonKey: 'eyJhbG...' // 👈 여기에 실제 anon key 입력
};

// 데모 모드 비활성화
const CONFIG = {
    DEMO_MODE: false // 👈 false로 변경
};
```

### Railway 배포 환경

Railway는 환경 변수를 자동으로 사용하지 않으므로, `config.js`를 직접 수정한 후 다시 푸시합니다:

```bash
# config.js 수정 후
git add web/js/config.js
git commit -m "Configure Supabase for production"
git push origin main
```

Railway가 자동으로 재배포합니다.

---

## 🎉 완료!

이제 다음을 할 수 있습니다:

### ✅ 기능 테스트
1. **회원가입** → 계정 생성 (pending 상태)
2. **Supabase에서 승인** → role: `super_admin`, status: `active`
3. **로그인** → 관리자로 로그인
4. **관리 기능**:
   - 다른 회원 승인/거부
   - 공지사항 작성
   - 일정 등록
   - 게시판 관리

### 📊 Supabase 대시보드에서 확인
- **Table Editor**: 데이터 직접 확인/수정
- **Authentication**: 가입된 회원 목록
- **Storage**: 이미지 업로드용 (추가 설정 필요)

---

## 🔧 추가 설정

### Storage (이미지 업로드)

1. Supabase 대시보드 → **🗄️ Storage** 클릭
2. "Create a new bucket" 클릭
3. Bucket name: `avatars` (프로필 사진용)
4. Public bucket: ✅ 체크
5. "Create bucket" 클릭

같은 방법으로 추가 버킷 생성:
- `post-images` (게시글 이미지)
- `notice-images` (공지사항 이미지)

---

## 📞 문제 해결

### 회원가입이 안 돼요
1. Supabase → **Authentication** → **Settings** 확인
2. "Enable email confirmations" 비활성화 (개발 단계)
3. "Enable phone confirmations" 비활성화

### RLS 에러가 나요
```sql
-- SQL Editor에서 실행
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- 테스트 후 다시 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### 데이터가 안 보여요
- 브라우저 개발자 도구 (F12) → Console 탭에서 에러 확인
- Supabase 대시보드 → Logs에서 에러 확인

---

**이제 Supabase 설정을 시작하세요!** 🚀
