# 영등포 JC API 서버

Railway PostgreSQL 연동 Node.js 백엔드 API

## 📋 기능

### ✅ 구현 완료
- **인증 API** - 로그인, 회원가입, JWT 토큰
- **게시판 API** - CRUD (생성, 조회, 수정, 삭제)
- **공지사항 API** - 조회, 작성 (권한 체크)
- **일정 API** - 조회, 등록 (권한 체크)
- **회원 API** - 목록, 검색, 프로필 조회
- **프로필 API** - 조회, 수정

## 🚀 로컬 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일 생성 (`.env.example` 참고):
```bash
DATABASE_URL=postgresql://postgres:...@...railway.app:5432/railway
JWT_SECRET=your-super-secret-key-32-chars-minimum
NODE_ENV=development
PORT=3000
```

### 3. 서버 시작
```bash
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 📡 API 엔드포인트

### 인증 (`/api/auth`)
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보 (인증 필요)
- `POST /api/auth/logout` - 로그아웃 (인증 필요)

### 게시판 (`/api/posts`)
- `GET /api/posts?page=1&limit=20` - 목록 조회 (인증 필요)
- `GET /api/posts/:id` - 상세 조회 (인증 필요)
- `POST /api/posts` - 작성 (인증 필요)
- `PUT /api/posts/:id` - 수정 (인증 필요, 작성자만)
- `DELETE /api/posts/:id` - 삭제 (인증 필요, 작성자/관리자)

### 공지사항 (`/api/notices`)
- `GET /api/notices?page=1&limit=20` - 목록 조회 (인증 필요)
- `GET /api/notices/:id` - 상세 조회 (인증 필요)
- `POST /api/notices` - 작성 (인증 + 권한 필요)

### 일정 (`/api/schedules`)
- `GET /api/schedules?upcoming=true` - 목록 조회 (인증 필요)
- `GET /api/schedules/:id` - 상세 조회 (인증 필요)
- `POST /api/schedules` - 등록 (인증 + 권한 필요)

### 회원 (`/api/members`)
- `GET /api/members?page=1&limit=50` - 목록 조회 (인증 필요)
- `GET /api/members/search?q=검색어` - 검색 (인증 필요)
- `GET /api/members/:id` - 프로필 조회 (인증 필요)

### 프로필 (`/api/profile`)
- `GET /api/profile` - 내 프로필 조회 (인증 필요)
- `PUT /api/profile` - 프로필 수정 (인증 필요)
- `PUT /api/profile/image` - 프로필 이미지 URL 업데이트 (인증 필요)

## 🔑 인증

JWT Bearer 토큰 사용:
```
Authorization: Bearer {token}
```

로그인 후 받은 토큰을 모든 인증 필요 API에 헤더로 전송합니다.

## 🧪 테스트

### Postman/Insomnia로 테스트

1. **회원가입**
```http
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test1234",
  "name": "테스트",
  "phone": "010-1234-5678",
  "address": "서울시 영등포구"
}
```

2. **로그인**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "minsu@jc.com",
  "password": "test1234"
}
```

3. **게시글 목록 조회**
```http
GET http://localhost:3000/api/posts?page=1&limit=20
Authorization: Bearer {받은_토큰}
```

## 📁 프로젝트 구조

```
api/
├── config/
│   └── database.js          # PostgreSQL 연결
├── middleware/
│   ├── auth.js              # JWT 인증 미들웨어
│   └── errorHandler.js      # 에러 처리
├── routes/
│   ├── auth.js              # 인증 API
│   ├── posts.js             # 게시판 API
│   ├── notices.js           # 공지사항 API
│   ├── schedules.js         # 일정 API
│   ├── members.js           # 회원 API
│   └── profile.js           # 프로필 API
├── utils/
│   ├── jwt.js               # JWT 토큰 유틸
│   └── password.js          # 비밀번호 해싱
├── .env                     # 환경 변수 (gitignore)
├── .env.example             # 환경 변수 예시
├── package.json             # 의존성
└── server.js                # Express 서버
```

## 🛠️ 기술 스택

- **Node.js** - 런타임
- **Express** - 웹 프레임워크
- **PostgreSQL** (Railway) - 데이터베이스
- **JWT** - 인증
- **bcrypt** - 비밀번호 해싱

## 📝 다음 단계

- [ ] 이미지 업로드 API (Storage 서비스 필요)
- [ ] 댓글 API
- [ ] 공감(좋아요) API
- [ ] 관리자 API (회원 승인/거절)

---

**버전**: 1.0.0  
**최종 업데이트**: 2026-02-19
