# 🚂 Railway 전용 설정 가이드 (Supabase 없이)

## ✅ Railway 하나로 모두 해결!

**Supabase 가입 필요 없음!** Railway에서 PostgreSQL을 바로 추가합니다.

---

## 🚀 1단계: Railway 프로젝트 생성 (3분)

### Step 1: GitHub 연결
1. https://railway.app/dashboard 접속
2. **"New Project"** 클릭
3. **"Deploy from GitHub repo"** 선택
4. **"k50004950-ctrl/jc"** 레포지토리 선택

### Step 2: PostgreSQL 추가
1. 프로젝트 화면에서 **"+ New"** 클릭
2. **"Database"** → **"Add PostgreSQL"** 선택
3. 자동으로 PostgreSQL 생성 (1분 소요)
4. ✅ 완료!

---

## 🔧 2단계: 데이터베이스 연결 (2분)

### Railway 웹 앱과 DB 연결

1. 프로젝트 화면에서 **웹 앱 서비스** 클릭
2. **"Variables"** 탭 클릭
3. **"+ New Variable"** → **"Add Reference"**
4. PostgreSQL 선택 → **"DATABASE_URL"** 추가
5. 자동 재배포 시작 (2분)

---

## 📊 3단계: 데이터베이스 초기화 (3분)

### Railway에서 SQL 실행

1. Railway 프로젝트에서 **PostgreSQL 서비스** 클릭
2. **"Data"** 탭 클릭
3. 상단의 **"Query"** 버튼 클릭
4. 아래 SQL 전체 복사 → 붙여넣기 → **"Run Query"**

```sql
-- ============================================
-- JC 앱 데이터베이스 스키마 (Railway 전용)
-- ============================================

-- 1. 회원 테이블 (users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
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
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[],
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'question', 'announcement', 'event')),
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 댓글 (comments)
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 게시글 공감 (post_likes)
CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 5. 공지사항 (notices)
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[],
    is_pinned BOOLEAN DEFAULT FALSE,
    has_attendance BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 공지사항 참석자 조사 (notice_attendance)
CREATE TABLE IF NOT EXISTS notice_attendance (
    id SERIAL PRIMARY KEY,
    notice_id INTEGER REFERENCES notices(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('attending', 'not_attending', 'undecided')) DEFAULT 'undecided',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notice_id, user_id)
);

-- 7. 일정 (schedules)
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT,
    category TEXT DEFAULT 'event' CHECK (category IN ('event', 'meeting', 'training', 'holiday', 'other')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 배너 (banners)
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 세션 (sessions)
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

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_notices_pinned ON notices(is_pinned, created_at DESC);
CREATE INDEX idx_schedules_date ON schedules(start_date);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

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

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notices_updated_at BEFORE UPDATE ON notices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 댓글 수 자동 업데이트
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comments_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- 공감 수 자동 업데이트
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

-- 만료된 세션 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 완료!
-- ============================================

SELECT '✅ Railway PostgreSQL 데이터베이스 생성 완료!' AS message;
```

5. ✅ `Railway PostgreSQL 데이터베이스 생성 완료!` 확인

---

## 👤 4단계: 관리자 계정 생성 (2분)

### Railway에서 SQL로 관리자 추가

1. Railway PostgreSQL → **"Query"** 탭
2. 아래 SQL 실행 (이메일/비밀번호 변경):

```sql
-- 관리자 계정 생성 (이메일/비밀번호 변경!)
INSERT INTO users (email, password_hash, name, role, status)
VALUES (
    'admin@example.com',           -- ← 이메일 변경
    'admin123',                     -- ← 비밀번호 (임시, 첫 로그인 후 변경)
    '관리자',                       -- ← 이름 변경
    'super_admin',
    'active'
);

SELECT '✅ 관리자 계정 생성 완료!' AS message;
```

3. ✅ 완료!

---

## 🔐 5단계: 보안 강화 (선택, 2분)

### 비밀번호 암호화 (프로덕션 환경)

**개발 중에는 평문 비밀번호 사용 → 나중에 암호화**

Railway에서 pgcrypto 확장 활성화:

```sql
-- pgcrypto 확장 설치 (비밀번호 암호화)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 기존 관리자 비밀번호 암호화
UPDATE users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@example.com';

SELECT '✅ 비밀번호 암호화 완료!' AS message;
```

---

## 💰 비용 (거의 무료!)

### Railway 무료 플랜
- ✅ **월 $5 크레딧** 제공
- ✅ **PostgreSQL 포함**
- ✅ **웹 앱 + DB 같이 사용**

### 사용량 예상
- 웹 앱: 월 $3-4
- PostgreSQL: 월 $1-2
- **총: $5 이하 (무료 크레딧으로 충분!)**

### 회원 100명 이상 → 유료
- **$5/월** (추가 사용량만 결제)
- PostgreSQL 자동 백업 포함
- 무제한 트래픽

---

## 📊 데이터 관리

### 데이터 조회 (Railway Query 탭)

```sql
-- 전체 회원 목록
SELECT id, email, name, role, status, created_at 
FROM users 
ORDER BY created_at DESC;

-- 승인 대기 회원
SELECT id, email, name, created_at 
FROM users 
WHERE status = 'pending';

-- 최근 게시글 10개
SELECT p.id, p.title, u.name AS author, p.views, p.created_at
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
ORDER BY p.created_at DESC
LIMIT 10;
```

### 데이터 수정

```sql
-- 회원 승인
UPDATE users 
SET status = 'active', role = 'member' 
WHERE id = 1;

-- 관리자 권한 부여
UPDATE users 
SET role = 'admin' 
WHERE id = 2;

-- 회원 정지
UPDATE users 
SET status = 'suspended' 
WHERE id = 3;
```

---

## 🔄 백업 (Railway 자동!)

### Railway 자동 백업 (유료 플랜)
- 매일 자동 백업
- 7일 보관
- 클릭 한 번으로 복구

### 무료 플랜 백업 (수동)

1. Railway PostgreSQL → **"Data"** 탭
2. **"Backups"** 섹션
3. **"Create Backup"** 클릭
4. 백업 파일 다운로드

**또는 pg_dump 사용:**

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 백업 생성
railway run pg_dump $DATABASE_URL > backup.sql

# 복구
railway run psql $DATABASE_URL < backup.sql
```

---

## 🎯 관리자 기능 테스트

### 1. 웹 앱 접속
- Railway 프로젝트 → Settings → Generate Domain
- 생성된 URL 접속 (예: `jc-app.up.railway.app`)

### 2. 로그인
- 이메일: `admin@example.com`
- 비밀번호: `admin123` (또는 설정한 비밀번호)

### 3. 관리자 페이지
- 프로필 → **🔧 관리자 페이지**
- 회원 승인/거부
- 권한 변경
- 콘텐츠 삭제

---

## 📈 모니터링

### Railway 대시보드에서 확인

1. **Metrics** 탭:
   - CPU 사용량
   - 메모리 사용량
   - 네트워크 트래픽

2. **Deployments** 탭:
   - 배포 기록
   - 에러 로그

3. **Observability** 탭:
   - 앱 로그
   - DB 쿼리 로그

### 비용 알림 설정
1. Railway 프로젝트 → Settings
2. **Usage Limits** 섹션
3. **Monthly Limit** 설정 (예: $10)
4. 80% 도달 시 이메일 알림

---

## 🔧 추가 설정 (선택)

### 1. 커스텀 도메인
1. Railway 프로젝트 → Settings → Domains
2. **"Add Domain"** 클릭
3. 도메인 입력 (예: `jc.mydomain.com`)
4. DNS 설정 (CNAME 레코드 추가)

### 2. 환경 변수 추가
1. Railway 웹 앱 → Variables
2. 필요한 환경 변수 추가:
   ```
   JWT_SECRET=your-secret-key
   SESSION_DURATION=7d
   ```

### 3. 이미지 업로드 (Cloudinary 무료)
1. https://cloudinary.com 가입
2. API Key 복사
3. Railway Variables에 추가:
   ```
   CLOUDINARY_URL=cloudinary://...
   ```

---

## ❓ 자주 묻는 질문

### Q1: Supabase vs Railway PostgreSQL 차이?

| 기능 | Supabase | Railway PostgreSQL |
|------|----------|-------------------|
| **데이터베이스** | ✅ PostgreSQL | ✅ PostgreSQL |
| **인증 시스템** | ✅ 내장 (Auth) | ❌ 직접 구현 |
| **파일 스토리지** | ✅ 내장 (Storage) | ❌ 외부 서비스 (Cloudinary 등) |
| **관리 UI** | ✅ 강력한 대시보드 | ✅ 기본 Query 탭 |
| **비용** | ✅ 무료 (500MB) | ✅ 무료 ($5 크레딧) |
| **백업** | ✅ 자동 (Pro) | ✅ 자동 (유료) |

**결론**: Railway만 써도 충분! 단순하고 관리 편함!

### Q2: 비밀번호 암호화 안 하면 위험한가요?

**개발 중**: 평문 OK (테스트용)
**프로덕션**: 반드시 암호화 (위 SQL 실행)

Railway는 HTTPS로 암호화되므로 전송은 안전합니다.

### Q3: 무료 크레딧 소진되면?

- Railway: 카드 등록 시 사용한 만큼만 청구
- 대부분 **월 $5-10** 수준
- 사용량 알림 설정으로 관리

### Q4: Supabase보다 복잡한가요?

**아니요!** 오히려 더 간단:
- ✅ 가입 1개만 (Railway)
- ✅ SQL 직접 실행 (더 직관적)
- ✅ 모든 게 한 곳에 (웹 + DB)

---

## 🎉 완료!

**Railway 하나로 끝!** 

- ✅ Supabase 가입 불필요
- ✅ PostgreSQL 바로 사용
- ✅ 웹 + DB 한 곳에서 관리
- ✅ 거의 무료 ($5 크레딧)

**Railway Query 탭에서 SQL만 실행하면 끝!** 🚀

---

## 📞 문제 해결

### 데이터베이스 연결 안 됨
```bash
# Railway 터미널에서 확인
echo $DATABASE_URL
# 출력되면 정상, 없으면 Variables 탭에서 DATABASE_URL 추가
```

### 웹 앱이 DB를 못 찾음
1. Railway 웹 앱 → Variables
2. DATABASE_URL이 있는지 확인
3. 없으면 "+ Add Reference" → PostgreSQL → DATABASE_URL

### SQL 에러
- Railway PostgreSQL → "Query" 탭에서 에러 확인
- 테이블 이름 오타 확인
- 외래 키 제약 조건 확인

**막히면 Railway 대시보드 → Logs 확인!**
