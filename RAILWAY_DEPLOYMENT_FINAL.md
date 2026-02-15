# 🚀 Railway 최종 배포 가이드

## ✅ 배포 준비 완료
- **GitHub 저장소**: https://github.com/msgyeong/jc.git
- **최신 커밋**: `876d7eb - Update test account and enforce approval-only login`
- **배포 파일**: Dockerfile, nginx.conf, start.sh 모두 준비됨

---

## 📋 **Railway 배포 단계별 가이드**

### 🎯 **Step 1: Railway 프로젝트 생성** (3분)

1. **Railway 대시보드 접속**
   - URL: https://railway.app/dashboard
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - **"New Project"** 버튼 클릭
   - **"Deploy from GitHub repo"** 선택

3. **저장소 선택**
   - 목록에서 **"msgyeong/jc"** 찾기
   - 선택 후 **"Deploy Now"** 클릭

4. **자동 배포 시작**
   - Railway가 자동으로 Dockerfile 감지
   - 빌드 시작 (약 2-3분 소요)

---

### 🔧 **Step 2: PostgreSQL 데이터베이스 추가** (2분)

1. **프로젝트 화면에서**
   - 우측 상단 **"+ New"** 버튼 클릭
   - **"Database"** 선택
   - **"Add PostgreSQL"** 클릭

2. **자동 생성 대기**
   - PostgreSQL 인스턴스 생성 (약 1분)
   - ✅ 완료 후 PostgreSQL 카드 표시됨

3. **데이터베이스 연결 (중요!)**
   - 웹 앱 서비스 카드 클릭
   - 좌측 메뉴에서 **"Variables"** 탭 클릭
   - **"+ New Variable"** 클릭
   - **"Add Reference"** 선택
   - PostgreSQL 선택 → **"DATABASE_URL"** 변수 추가
   - 자동으로 재배포 시작

---

### 🌐 **Step 3: 도메인 생성** (1분)

1. **웹 앱 서비스 선택**
   - 프로젝트에서 웹 앱 카드 클릭

2. **도메인 생성**
   - 좌측 메뉴에서 **"Settings"** 탭 클릭
   - **"Networking"** 섹션 찾기
   - **"Generate Domain"** 버튼 클릭

3. **URL 확인 및 복사**
   - 생성된 URL 예시: `jc-production-XXXX.up.railway.app`
   - 이 URL을 복사해두세요!

---

### 📊 **Step 4: 데이터베이스 초기화** (5분)

1. **PostgreSQL 서비스 선택**
   - 프로젝트에서 PostgreSQL 카드 클릭

2. **Query 탭 접속**
   - 좌측 메뉴에서 **"Data"** 탭 클릭
   - 상단의 **"Query"** 버튼 클릭

3. **테이블 생성 (1단계)**
   ```sql
   -- 아래 SQL을 복사하여 Query 창에 붙여넣고 "Run Query" 클릭
   -- database/railway_init.sql 파일 내용 전체
   ```
   
   <details>
   <summary>📋 railway_init.sql 전체 코드 (클릭하여 펼치기)</summary>
   
   ```sql
   -- 1. 회원 테이블
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

   -- 2. 게시판
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

   -- 3. 댓글
   CREATE TABLE IF NOT EXISTS comments (
       id SERIAL PRIMARY KEY,
       post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
       author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       content TEXT NOT NULL,
       parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- 4. 게시글 공감
   CREATE TABLE IF NOT EXISTS post_likes (
       id SERIAL PRIMARY KEY,
       post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       UNIQUE(post_id, user_id)
   );

   -- 5. 공지사항
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

   -- 6. 공지사항 참석자 조사
   CREATE TABLE IF NOT EXISTS notice_attendance (
       id SERIAL PRIMARY KEY,
       notice_id INTEGER REFERENCES notices(id) ON DELETE CASCADE,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       status TEXT CHECK (status IN ('attending', 'not_attending', 'undecided')) DEFAULT 'undecided',
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW(),
       UNIQUE(notice_id, user_id)
   );

   -- 7. 일정
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

   -- 8. 배너
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

   -- 9. 세션
   CREATE TABLE IF NOT EXISTS sessions (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       session_token TEXT UNIQUE NOT NULL,
       expires_at TIMESTAMPTZ NOT NULL,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- 인덱스 생성
   CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
   CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
   CREATE INDEX IF NOT EXISTS idx_notices_pinned ON notices(is_pinned, created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(start_date);
   CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
   CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
   CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
   CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

   -- 트리거 함수
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

   SELECT '✅ 데이터베이스 초기화 완료!' AS message;
   ```
   </details>

4. **관리자 계정 생성 (2단계)**
   - 새 Query 창에 아래 SQL 입력 후 실행:
   ```sql
   INSERT INTO users (email, password_hash, name, role, status)
   VALUES (
       'admin@jc.com',
       'admin1234',
       '총관리자',
       'super_admin',
       'active'
   )
   ON CONFLICT (email) DO NOTHING;

   SELECT '✅ 관리자 계정 생성 완료!' AS result;
   ```

5. **테스트 회원 계정 생성 (3단계)**
   - 새 Query 창에 아래 SQL 입력 후 실행:
   ```sql
   INSERT INTO users (email, password_hash, name, phone, address, role, status)
   VALUES (
       'minsu@jc.com',
       'test1234',
       '경민수',
       '010-1234-5678',
       '서울시 영등포구',
       'member',
       'active'
   )
   ON CONFLICT (email) DO NOTHING;

   SELECT '✅ 테스트 회원 계정 생성 완료!' AS result;
   ```

6. **생성 확인**
   ```sql
   -- 모든 계정 확인
   SELECT id, email, name, role, status, created_at 
   FROM users 
   ORDER BY created_at DESC;
   ```

---

### ✅ **Step 5: 배포 확인** (2분)

1. **배포 상태 확인**
   - 웹 앱 서비스 → **"Deployments"** 탭
   - 최신 배포 상태 확인:
     - 🟢 **Active**: 배포 성공!
     - 🟡 **Building**: 빌드 중 (대기)
     - 🔴 **Failed**: 실패 (로그 확인)

2. **로그 확인**
   - 웹 앱 서비스 → **"Logs"** 탭
   - 예상 로그:
     ```
     Building Docker image...
     Successfully built...
     Starting Nginx on port 3000...
     ```

3. **웹 앱 접속**
   - Step 3에서 복사한 URL로 접속
   - 예: `https://jc-production-XXXX.up.railway.app`

---

### 🧪 **Step 6: 최종 테스트** (3분)

#### 테스트 체크리스트

- [ ] **1. 웹 앱 접속 가능**
  - URL 접속 시 로그인 화면 표시

- [ ] **2. 관리자 로그인**
  - 이메일: `admin@jc.com`
  - 비밀번호: `admin1234`
  - 결과: 로그인 성공, 관리자 페이지 접근 가능

- [ ] **3. 일반 회원 로그인**
  - 이메일: `minsu@jc.com`
  - 비밀번호: `test1234`
  - 결과: 로그인 성공, 이름 "경민수" 표시

- [ ] **4. 미등록 계정 차단**
  - 임의 이메일로 로그인 시도
  - 결과: "등록되지 않은 계정입니다" 메시지

- [ ] **5. 기능 테스트**
  - 홈 화면 접속
  - 게시판, 공지사항, 일정 탭 이동
  - 회원 목록 조회
  - 프로필 확인

---

## 🎯 **빠른 배포 요약 (5단계)**

```
1️⃣ Railway 프로젝트 생성
   → https://railway.app/new
   → "Deploy from GitHub repo"
   → "msgyeong/jc" 선택

2️⃣ PostgreSQL 추가
   → "+ New" → "Database" → "Add PostgreSQL"
   → 웹 앱 Variables에 DATABASE_URL 연결

3️⃣ 도메인 생성
   → Settings → Networking → "Generate Domain"

4️⃣ 데이터베이스 초기화
   → PostgreSQL → Data → Query
   → railway_init.sql 실행
   → 관리자/테스트 계정 생성

5️⃣ 테스트
   → 생성된 URL 접속
   → minsu@jc.com / test1234 로그인
```

**예상 소요 시간**: 약 10-15분

---

## 🔧 **문제 해결**

### 문제 1: "Deployment Failed"
**해결**:
1. Logs 탭에서 에러 확인
2. Dockerfile 문법 오류 확인
3. "Redeploy" 버튼 클릭하여 재시도

### 문제 2: "503 Service Unavailable"
**해결**:
1. Deployments 탭에서 배포 상태 확인
2. Logs에서 "Starting Nginx" 메시지 확인
3. PORT 환경 변수 자동 설정 확인 (Variables 탭)

### 문제 3: "로그인 안 됨"
**해결**:
```sql
-- Railway PostgreSQL Query에서 실행
SELECT * FROM users WHERE email = 'minsu@jc.com';

-- 계정이 없으면 다시 생성
INSERT INTO users (email, password_hash, name, phone, address, role, status)
VALUES ('minsu@jc.com', 'test1234', '경민수', '010-1234-5678', '서울시 영등포구', 'member', 'active');
```

### 문제 4: "DATABASE_URL 없음"
**해결**:
1. 웹 앱 서비스 → Variables 탭
2. "+ New Variable" → "Add Reference"
3. PostgreSQL 선택 → DATABASE_URL 추가
4. 자동 재배포 대기

---

## 📊 **배포 후 확인사항**

### Railway 대시보드에서

✅ **웹 앱 서비스**
- Status: 🟢 Active
- Domain: `jc-production-XXXX.up.railway.app`
- Recent Logs: "Starting Nginx on port..."

✅ **PostgreSQL**
- Status: 🟢 Active
- Connected: Yes
- Tables: 9개 (users, posts, comments 등)

✅ **Variables**
- DATABASE_URL: ✅ 설정됨 (PostgreSQL 연결)
- PORT: ✅ 자동 설정됨

---

## 🎉 **배포 성공!**

### 최종 정보

**웹 앱 URL**: `https://jc-production-XXXX.up.railway.app` (생성된 URL로 교체)

**테스트 계정**:
- 관리자: `admin@jc.com` / `admin1234`
- 일반 회원: `minsu@jc.com` / `test1234`

**배포 완료 시간**: 2026-02-15

---

## 📞 **추가 도움**

- **Railway 문서**: https://docs.railway.app
- **프로젝트 문서**: `QUICKSTART.md`, `TEST_ACCOUNTS.md`
- **문제 해결**: `RAILWAY_TROUBLESHOOTING.md`

---

**다음 단계**:
1. 생성된 URL을 팀원들과 공유
2. 공동 개발자에게 알림
3. 기능 테스트 완료
4. 사용자 피드백 수집

🚀 **배포 완료를 축하합니다!**
