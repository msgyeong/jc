# 8단계(웹 전용): Railway 백엔드 API 구축

**목표**: Railway PostgreSQL 연동 Node.js API 서버 구축 및 웹 버전 완전 작동  
**현재 상태**: 웹 UI는 있지만 백엔드 연결 안 됨 (DEMO_MODE만 작동)  
**배포 환경**: Railway (Docker + Nginx + Node.js + PostgreSQL)

> **선행 조건**: 
> - [x] Railway PostgreSQL 데이터베이스 구축 완료
> - [x] 웹 프론트엔드 UI 구조 완성
> - [x] Railway 배포 자동화 설정 완료

> **참고**:
> - 실제 DB는 Railway PostgreSQL
> - 직접 API 서버 구축 필요
> - JWT 토큰 기반 인증 사용

> **역할 구분**: 
> - 🤖 **Cursor(AI)**: 모든 코드 작성 및 구조 설계
> - 👤 **사용자**: 로컬 테스트 및 Railway 배포 확인

---

## 현재 문제점

### ❌ 작동하지 않는 이유
1. **백엔드 부재**: Railway PostgreSQL 사용하지만 API 서버 없음
2. **API 서버 없음**: 정적 HTML만 배포되어 있어 데이터베이스 연결 불가
3. **인증 미구현**: JWT 기반 인증 필요
4. **데모 모드만 작동**: `config.js`의 `DEMO_MODE: true`로 샘플 데이터만 표시

### ✅ 해결 방안
```
┌─────────────────────────────────────────────┐
│          Railway 배포 환경                    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  Nginx       │      │  Node.js API    │ │
│  │  (정적 파일)  │─────▶│  (Express)      │ │
│  │  /web/*      │      │  /api/*         │ │
│  └──────────────┘      └─────────────────┘ │
│         │                      │           │
│         │                      ▼           │
│         │              ┌─────────────────┐ │
│         │              │ Railway         │ │
│         └─────────────▶│ PostgreSQL      │ │
│                        └─────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Phase 1: Node.js API 서버 구축

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 프로젝트 구조 생성

**디렉토리 구조**:
```
api/
├── package.json           # Node.js 의존성
├── server.js              # Express 서버 메인
├── config/
│   └── database.js        # Railway PostgreSQL 연결
├── middleware/
│   ├── auth.js            # JWT 인증 미들웨어
│   └── errorHandler.js    # 에러 처리
├── routes/
│   ├── auth.js            # 로그인, 회원가입
│   ├── posts.js           # 게시판 CRUD
│   ├── notices.js         # 공지사항 CRUD
│   ├── schedules.js       # 일정 CRUD
│   ├── members.js         # 회원 목록/검색
│   └── profile.js         # 프로필 조회/수정
└── utils/
    ├── jwt.js             # JWT 토큰 생성/검증
    └── password.js        # bcrypt 비밀번호 해싱
```

**필요한 패키지**:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

### [x] 데이터베이스 연결 설정

**파일**: `api/config/database.js`

- Railway `DATABASE_URL` 환경 변수 사용
- PostgreSQL 연결 풀 생성
- 연결 테스트 함수

### [x] 인증 유틸리티 구현

**파일**: `api/utils/password.js`
- `hashPassword(password)` - bcrypt 해싱
- `comparePassword(password, hash)` - 비밀번호 검증

**파일**: `api/utils/jwt.js`
- `generateToken(userId, email, role)` - JWT 생성
- `verifyToken(token)` - JWT 검증

**파일**: `api/middleware/auth.js`
- `authenticate` - JWT 토큰 검증 미들웨어
- `requireRole(roles)` - 권한 체크 미들웨어

### [x] 인증 API 구현

**파일**: `api/routes/auth.js`

**엔드포인트**:
```javascript
POST   /api/auth/signup
  - 입력: email, password, name, phone, address
  - 처리: 비밀번호 해싱, users 테이블 INSERT
  - 응답: { success, message, userId }

POST   /api/auth/login
  - 입력: email, password
  - 처리: 비밀번호 검증, 회원 상태 확인 (status='active')
  - 응답: { success, token, user: { id, email, name, role } }

GET    /api/auth/me
  - 헤더: Authorization: Bearer {token}
  - 응답: { user: { id, email, name, role, ... } }

POST   /api/auth/logout
  - 응답: { success }
```

**회원 상태 체크**:
- `status = 'pending'` → 승인 대기 메시지 반환
- `status = 'suspended'` → 정지 계정 메시지 반환
- `status = 'active'` → 로그인 허용

### [x] 게시판 API 구현

**파일**: `api/routes/posts.js`

**엔드포인트**:
```javascript
GET    /api/posts?page=1&limit=20
  - 인증 필요
  - 페이지네이션 (기본 20개)
  - 응답: { posts: [...], total, page, totalPages }

GET    /api/posts/:id
  - 인증 필요
  - 조회수 증가
  - 응답: { post: { id, title, content, author, ... } }

POST   /api/posts
  - 인증 필요
  - 입력: title, content, images (선택)
  - 응답: { success, postId }

PUT    /api/posts/:id
  - 인증 필요 + 작성자 본인 확인
  - 입력: title, content, images
  - 응답: { success }

DELETE /api/posts/:id
  - 인증 필요 + 작성자/관리자 확인
  - 응답: { success }
```

### [x] 공지사항 API 구현

**파일**: `api/routes/notices.js`

**엔드포인트**:
```javascript
GET    /api/notices?page=1&limit=20
  - 인증 필요
  - 고정 공지(is_pinned=true) 우선 표시
  - 응답: { notices: [...], total, page, totalPages }

GET    /api/notices/:id
  - 인증 필요
  - 응답: { notice: { id, title, content, ... } }

POST   /api/notices
  - 인증 필요 + 권한 체크 (can_post_notice)
  - 입력: title, content, is_pinned, attendance_survey_enabled
  - 응답: { success, noticeId }

PUT    /api/notices/:id
  - 인증 필요 + 작성자/관리자 확인
  - 응답: { success }

DELETE /api/notices/:id
  - 인증 필요 + 작성자/관리자 확인
  - 응답: { success }
```

### [x] 일정 API 구현

**파일**: `api/routes/schedules.js`

**엔드포인트**:
```javascript
GET    /api/schedules?upcoming=true
  - 인증 필요
  - upcoming=true: 오늘 이후 일정만
  - 날짜 순 정렬
  - 응답: { schedules: [...], total }

GET    /api/schedules/:id
  - 인증 필요
  - 응답: { schedule: { id, title, date, ... } }

POST   /api/schedules
  - 인증 필요 + 권한 체크 (can_create_schedule)
  - 입력: title, event_date, start_time, end_time, location, description
  - 응답: { success, scheduleId }

PUT    /api/schedules/:id
  - 인증 필요 + 작성자/관리자 확인
  - 응답: { success }

DELETE /api/schedules/:id
  - 인증 필요 + 작성자/관리자 확인
  - 응답: { success }
```

### [x] 회원 API 구현

**파일**: `api/routes/members.js`

**엔드포인트**:
```javascript
GET    /api/members?page=1&limit=50
  - 인증 필요
  - status='active' 회원만
  - 응답: { members: [...], total, page, totalPages }

GET    /api/members/search?q=검색어
  - 인증 필요
  - 검색 필드: name, job_title, industry, jc_position
  - 응답: { members: [...], total }

GET    /api/members/:id
  - 인증 필요
  - 회원 프로필 상세 조회
  - 응답: { member: { id, name, email, ... } }
```

### [x] 프로필 API 구현

**파일**: `api/routes/profile.js`

**엔드포인트**:
```javascript
GET    /api/profile
  - 인증 필요 (본인 정보만)
  - 응답: { profile: { id, email, name, phone, ... } }

PUT    /api/profile
  - 인증 필요 (본인만)
  - 입력: name, phone, address, company, position 등
  - 응답: { success }
```

### [x] Express 서버 메인 파일

**파일**: `api/server.js`

- Express 앱 초기화
- CORS 설정
- JSON body parser
- 라우트 등록
- 에러 핸들러
- 포트 리스닝 (기본 3000, 환경 변수로 변경 가능)

```javascript
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
// ... 기타 라우트

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
// ... 기타 라우트

app.listen(process.env.PORT || 3000, () => {
  console.log('API server running on port', process.env.PORT || 3000);
});
```

---

## Phase 2: 웹 프론트엔드 수정

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] API 클라이언트 생성

**파일**: `web/js/api-client.js` (새로 생성)

```javascript
class ApiClient {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('auth_token');
    }
    
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }
    
    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }
    
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
        
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API 요청 실패');
        }
        
        return response.json();
    }
    
    // 인증
    async login(email, password) {
        const result = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (result.token) {
            this.setToken(result.token);
        }
        return result;
    }
    
    async signup(userData) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    
    async logout() {
        const result = await this.request('/auth/logout', { method: 'POST' });
        this.clearToken();
        return result;
    }
    
    async getMe() {
        return this.request('/auth/me');
    }
    
    // 게시판
    async getPosts(page = 1, limit = 20) {
        return this.request(`/posts?page=${page}&limit=${limit}`);
    }
    
    async getPost(id) {
        return this.request(`/posts/${id}`);
    }
    
    async createPost(postData) {
        return this.request('/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    }
    
    // 공지사항
    async getNotices(page = 1, limit = 20) {
        return this.request(`/notices?page=${page}&limit=${limit}`);
    }
    
    // 일정
    async getSchedules(upcoming = true) {
        return this.request(`/schedules?upcoming=${upcoming}`);
    }
    
    // 회원
    async getMembers(page = 1, limit = 50) {
        return this.request(`/members?page=${page}&limit=${limit}`);
    }
    
    async searchMembers(query) {
        return this.request(`/members/search?q=${encodeURIComponent(query)}`);
    }
    
    // 프로필
    async getProfile() {
        return this.request('/profile');
    }
    
    async updateProfile(profileData) {
        return this.request('/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }
}

// 전역 인스턴스
window.apiClient = new ApiClient();
```

### [ ] config.js 수정

**파일**: `web/js/config.js`

- `DEMO_MODE` **제거** (더 이상 필요 없음)
- API 클라이언트만 사용

```javascript
// 앱 설정
const CONFIG = {
    APP_NAME: '영등포 JC',
    API_BASE_URL: '/api',
    VERSION: '2.1'
};

// 로컬 스토리지 키
const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_INFO: 'user_info'
};
```

### [x] auth.js 수정

**파일**: `web/js/auth.js`

- 레거시 클라이언트 호출 **제거**
- `apiClient.login()` 사용
- `apiClient.signup()` 사용
- `apiClient.logout()` 사용
- 데모 모드 로직 **완전 제거**

**주요 변경**:
```javascript
async function handleLogin(email, password) {
    try {
        const result = await apiClient.login(email, password);
        
        if (result.success) {
            // 사용자 정보 저장
            localStorage.setItem('user_info', JSON.stringify(result.user));
            
            // 홈 화면으로 이동
            navigateToScreen('home');
        } else {
            showInlineError('inline-error', result.message);
        }
    } catch (error) {
        showInlineError('inline-error', error.message);
    }
}
```

### [x] signup.js 수정

**파일**: `web/js/signup.js`

- `apiClient.signup()` 사용
- 레거시 코드 제거

### [x] home.js 수정

**파일**: `web/js/home.js`

- `apiClient.getNotices()` 사용 (공지사항 요약)
- `apiClient.getSchedules(true)` 사용 (다가오는 일정)
- 배너는 나중에 구현 (현재 샘플 데이터 유지)

### [x] posts.js 수정

**파일**: `web/js/posts.js`

- `apiClient.getPosts()` 사용 (목록)
- `apiClient.getPost(id)` 사용 (상세)
- `apiClient.createPost(postData)` 사용 (작성)

### [x] notices.js 수정

**파일**: `web/js/notices.js`

- `apiClient.getNotices()` 사용

### [x] schedules.js 수정

**파일**: `web/js/schedules.js`

- `apiClient.getSchedules()` 사용

### [x] members.js 수정

**파일**: `web/js/members.js`

- `apiClient.getMembers()` 사용 (목록)
- `apiClient.searchMembers(query)` 사용 (검색)

### [x] profile.js 수정

**파일**: `web/js/profile.js`

- `apiClient.getProfile()` 사용
- `apiClient.updateProfile()` 사용

### [ ] index.html 수정

**파일**: `web/index.html`

- 불필요한 외부 스크립트 **제거**
- `api-client.js` 추가

```html
<!-- 앱 스크립트 -->
<script src="js/config.js"></script>
<script src="js/api-client.js"></script>  <!-- 새로 추가 -->
<script src="js/utils.js"></script>
<!-- ... 기타 스크립트 -->
```

---

## Phase 3: Railway 배포 구조 변경

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] Dockerfile 수정

**파일**: `Dockerfile`

**변경 사항**:
- Multi-stage build 도입 (Node.js 빌드 → 최종 이미지)
- Nginx + Node.js 통합
- 헬스체크 추가

```dockerfile
# ============================================
# Stage 1: Node.js API 빌드
# ============================================
FROM node:18-alpine AS api-builder

WORKDIR /app/api
COPY api/package*.json ./
RUN npm ci --production
COPY api/ ./

# ============================================
# Stage 2: 최종 이미지
# ============================================
FROM nginx:alpine

# Node.js 및 npm 설치
RUN apk add --no-cache nodejs npm

# API 파일 복사
COPY --from=api-builder /app/api /app/api
WORKDIR /app/api

# 웹 파일 복사
COPY web /usr/share/nginx/html

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 시작 스크립트 복사
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 포트 노출 (Railway가 자동으로 PORT 환경 변수 제공)
EXPOSE ${PORT:-80}

# 시작 스크립트 실행
CMD ["/start.sh"]
```

### [x] nginx.conf 수정

**파일**: `nginx.conf`

**변경 사항**:
- `/api/` 경로를 `http://localhost:3000`으로 프록시
- CORS 헤더 추가
- WebSocket 지원
- 헬스체크 엔드포인트 추가

```nginx
server {
    listen ${PORT:-80};
    server_name _;

    # 정적 파일 (웹 앱)
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # 캐싱 설정
        add_header Cache-Control "public, max-age=3600";
    }

    # API 프록시
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS 헤더
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
    }

    # OPTIONS 요청 처리 (CORS preflight)
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }
}
```

### [x] start.sh 수정

**파일**: `start.sh`

**변경 사항**:
- Node.js API 서버를 백그라운드로 시작
- API 서버 헬스체크
- Nginx를 포그라운드로 실행
- 상세한 로그 출력

```bash
#!/bin/sh

echo "Starting Railway deployment..."

# Railway PORT 환경 변수 사용 (기본값 80)
export PORT=${PORT:-80}

# Nginx 설정에서 PORT 변수 치환
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp
mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf

echo "Starting Node.js API server..."
# Node.js API 시작 (백그라운드)
cd /app/api
node server.js &

# API 서버 시작 대기
sleep 3

echo "Starting Nginx on port $PORT..."
# Nginx 시작 (포그라운드)
nginx -g 'daemon off;'
```

### [x] .env.example 생성

**파일**: `api/.env.example`

```bash
# Railway PostgreSQL 연결
DATABASE_URL=postgresql://user:password@host:port/database

# JWT 비밀키
JWT_SECRET=your-super-secret-key-change-this-in-production

# 환경
NODE_ENV=production

# 포트
PORT=3000
```

---

## Phase 4: 로컬 테스트

> **역할**: 👤 **사용자** 전담

### [ ] Railway PostgreSQL 연결 정보 확인

Railway 대시보드에서 `DATABASE_URL` 가져오기:
1. Railway 대시보드 접속
2. PostgreSQL 서비스 선택
3. "Connect" 탭에서 `DATABASE_URL` 복사

### [ ] 로컬 환경 변수 설정

**파일**: `api/.env` (생성됨, 수정 필요)

```bash
DATABASE_URL=postgresql://postgres:...@...railway.app:5432/railway
JWT_SECRET=생성한_32자_이상_랜덤_문자열
NODE_ENV=development
PORT=3000
```

**JWT_SECRET 생성**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### [ ] API 서버 로컬 실행

```bash
cd api
npm install
test-api.bat  # 또는 node server.js
```

**확인 사항**:
- ✅ "Database connected" 메시지 출력
- ✅ "API server running on port 3000" 출력
- ✅ `http://localhost:3000/health` 접속 가능

### [ ] 웹 서버 로컬 실행

**새 터미널 열기**:
```bash
test-web.bat  # 또는 cd web && python -m http.server 8000
```

**확인**:
- ✅ `http://localhost:8000` 접속 가능
- ✅ 로그인 화면 표시

### [ ] 로컬 테스트

1. **로그인 테스트**
   - 이메일: `minsu@jc.com`
   - 비밀번호: `test1234`
   - 예상: 로그인 성공 → 홈 화면

2. **게시판 조회**
   - 하단 탭 "게시판" 클릭
   - 예상: 게시글 목록 표시 (또는 빈 상태)

3. **공지사항 조회**
   - 홈 화면 공지사항 섹션 확인
   - 예상: 공지사항 요약 표시

4. **일정 조회**
   - 홈 화면 일정 섹션 확인
   - 예상: 다가오는 일정 표시

5. **회원 목록**
   - 하단 탭 "회원" 클릭
   - 예상: 활성 회원 목록 표시

6. **프로필 조회**
   - 하단 탭 "프로필" 클릭
   - 예상: 내 프로필 정보 표시

**참고 문서**: `LOCAL_TEST_GUIDE.md`

1. Railway 대시보드 접속
2. PostgreSQL 서비스 선택
3. "Connect" 탭에서 `DATABASE_URL` 복사

### [ ] 로컬 환경 변수 설정

**파일**: `api/.env` (생성)

```bash
DATABASE_URL=postgresql://postgres:...@...railway.app:5432/railway
JWT_SECRET=test-secret-key-for-local-development
NODE_ENV=development
PORT=3000
```

### [ ] API 서버 로컬 실행

```bash
cd api
npm install
node server.js
```

**확인**:
- 터미널에 "API server running on port 3000" 출력
- "Database connected" 출력

### [ ] 웹 서버 로컬 실행

**새 터미널 열기**:
```bash
cd web
python -m http.server 8000
```

### [ ] 로컬 테스트

1. 브라우저에서 `http://localhost:8000` 접속
2. 회원가입 테스트
3. 로그인 테스트 (테스트 계정: `minsu@jc.com` / `test1234`)
4. 게시판 조회 테스트
5. 공지사항 조회 테스트
6. 일정 조회 테스트

**예상 결과**:
- ✅ 로그인 성공
- ✅ 게시판/공지/일정 목록 표시
- ✅ 실제 데이터베이스에서 데이터 조회

---

## Phase 5: Railway 배포

> **역할**: 👤 **사용자** + 🤖 **Cursor(AI)** 협업

### [ ] Railway 환경 변수 설정

Railway 대시보드에서:

1. 웹 서비스 선택
2. "Variables" 탭
3. 다음 환경 변수 추가:
   ```
   DATABASE_URL=postgresql://... (Railway가 자동 제공)
   JWT_SECRET=생성한-랜덤-문자열-32자-이상
   NODE_ENV=production
   ```

### [ ] Git Push 및 배포

```bash
git add .
git commit -m "Add Railway backend API with JWT auth"
git push origin main
```

**Railway 자동 배포**:
- GitHub Push 감지
- Dockerfile로 이미지 빌드
- 자동 배포 시작

### [ ] 배포 확인

1. Railway 대시보드에서 배포 로그 확인
2. "Deployments" 탭에서 상태 확인
   - ✅ "Active" 상태 확인
   - 빌드 로그에서 에러 없는지 확인

3. 배포된 URL 접속: `https://jc-production-7db6.up.railway.app`

### [ ] 배포 테스트

1. 로그인 테스트
   - 관리자: `admin@jc.com` / `admin1234`
   - 회원: `minsu@jc.com` / `test1234`

2. 기능 테스트
   - 게시판 목록 조회
   - 공지사항 목록 조회
   - 일정 목록 조회
   - 회원 목록 조회
   - 프로필 조회

**예상 결과**:
- ✅ 모든 기능이 실제 데이터베이스와 연동되어 작동
- ✅ 로그인 후 JWT 토큰 기반 인증 작동
- ✅ 새로고침해도 로그인 상태 유지

---

## 완료 기준

### ✅ 백엔드 API
- [ ] Node.js API 서버 구축 완료
- [ ] Railway PostgreSQL 연결 성공
- [ ] JWT 인증 구현 완료
- [ ] 모든 API 엔드포인트 구현 완료
- [ ] 로컬 테스트 성공

### ✅ 프론트엔드
- [ ] 레거시 클라이언트 완전 제거
- [ ] API 클라이언트 구현 완료
- [ ] 모든 JS 파일 API 연동 완료
- [ ] 로컬 테스트 성공

### ✅ Railway 배포
- [ ] Dockerfile 수정 완료
- [ ] nginx.conf 수정 완료
- [ ] start.sh 수정 완료
- [ ] Railway 배포 성공
- [ ] 배포된 URL에서 모든 기능 작동

### ✅ 테스트
- [ ] 로그인/회원가입 작동
- [ ] 게시판 CRUD 작동
- [ ] 공지사항 조회 작동
- [ ] 일정 조회 작동
- [ ] 회원 목록/검색 작동
- [ ] 프로필 조회/수정 작동

---

## 다음 단계

이 단계 완료 후:
- [ ] 이미지 업로드 기능 추가 (Storage 서비스 필요)
- [ ] 댓글 기능 구현
- [ ] 공감(좋아요) 기능 구현
- [ ] 관리자 웹 페이지 구현

---

## 트러블슈팅

### 문제: API 서버가 시작되지 않음
**원인**: DATABASE_URL 환경 변수 누락  
**해결**: Railway 대시보드에서 환경 변수 확인

### 문제: 로그인 후 토큰이 저장되지 않음
**원인**: API 응답에 토큰이 없음  
**해결**: API 서버 로그 확인, JWT 생성 로직 점검

### 문제: CORS 에러
**원인**: nginx.conf에 CORS 헤더 누락  
**해결**: nginx.conf 수정 후 재배포

### 문제: Railway 배포 실패
**원인**: Dockerfile 빌드 에러  
**해결**: Railway 배포 로그 확인, Dockerfile 문법 점검

---

**최종 업데이트**: 2026-02-19  
**버전**: 1.0
