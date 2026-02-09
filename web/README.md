# 영등포 JC 회원관리 웹 앱

## 📋 개요

영등포 JC 회원 관리를 위한 웹 애플리케이션입니다. Flutter 앱의 기능을 웹 버전으로 구현했습니다.

## ✨ 구현된 기능

### ✅ 완료된 기능

1. **인증 시스템**
   - [x] 로그인 (이메일/비밀번호)
   - [x] 회원가입 (다단계 폼)
   - [x] 로그아웃
   - [x] 세션 관리
   - [x] 승인 대기 처리

2. **홈 화면**
   - [x] 배너 슬라이드 (자동 전환)
   - [x] 공지사항 요약 (최신 5개)
   - [x] 일정 요약 (다가오는 5개)
   - [x] 하단 탭 네비게이션

3. **게시판 기능**
   - [x] 게시글 목록 (무한 스크롤)
   - [x] 새 게시글 'N' 배지
   - [x] 이미지 첨부 표시
   - [ ] 게시글 상세
   - [ ] 게시글 작성
   - [ ] 댓글/대댓글
   - [ ] 공감 기능

4. **공지사항 기능**
   - [x] 공지사항 목록
   - [x] 고정 공지 우선 표시
   - [x] 권한 기반 작성 버튼 표시
   - [ ] 공지사항 상세
   - [ ] 참석자 조사

5. **일정 기능**
   - [x] 일정 목록 (날짜별 그룹핑)
   - [x] 다가오는 일정 표시
   - [x] 권한 기반 작성 버튼 표시
   - [ ] 일정 상세
   - [ ] 일정 등록

6. **회원 관리**
   - [x] 회원 목록 (무한 스크롤)
   - [x] 회원 검색 (디바운싱)
   - [x] 특우회 배지 표시
   - [ ] 회원 프로필 상세
   - [ ] 프로필 수정

7. **내 프로필**
   - [x] 프로필 정보 표시
   - [x] 기본 정보/직장 정보/JC 정보
   - [ ] 프로필 수정

### 🚧 진행 중

8. **공통 기능**
   - [ ] 이미지 업로드
   - [ ] 에러 처리 개선
   - [ ] 로딩 스피너

### 📅 예정

9. **관리자 웹** (별도 프로젝트)
   - [ ] 회원 승인/거절
   - [ ] 권한 관리
   - [ ] 콘텐츠 관리

## 🌐 배포된 앱 접속

**Railway 배포 URL**: https://jc-production-7db6.up.railway.app

### 초기 관리자 계정
- **이메일**: admin@jc.com
- **비밀번호**: admin1234

---

## 🚀 로컬 실행 방법

### 1. 로컬 서버 시작

#### Windows
```bash
.\web\start-server.bat
```

#### Linux/Mac
```bash
chmod +x web/start-server.sh
./web/start-server.sh
```

#### 또는 직접 실행
```bash
cd web
python -m http.server 8000
```

### 2. 브라우저에서 접속

```
http://localhost:8000
```

## ⚙️ 설정

### Supabase 연동

`web/js/config.js` 파일에서 Supabase 설정:

```javascript
const CONFIG = {
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    DEMO_MODE: false  // true로 설정 시 샘플 데이터 사용
};
```

### 데모 모드

Supabase 없이 테스트하려면 `DEMO_MODE: true`로 설정하세요.

---

## 🚀 Railway 배포

### 배포 아키텍처
- **웹 서버**: Nginx (Alpine Linux)
- **데이터베이스**: Railway PostgreSQL
- **컨테이너**: Docker
- **자동 배포**: Git Push → 자동 빌드/배포

### 배포 파일
- `Dockerfile` - Docker 이미지 설정
- `nginx.conf` - Nginx 웹 서버 설정
- `railway.json` - Railway 배포 설정
- `start.sh` - 동적 포트 바인딩 스크립트

### 데이터베이스 초기화
```bash
# Railway PostgreSQL PUBLIC URL 필요
# init-db.bat 파일 수정 후 실행 (Windows)
init-db.bat
```

### 배포 가이드
자세한 배포 방법은 다음 문서 참고:
- `RAILWAY_ONLY_SETUP.md` - Railway 전용 설정 가이드
- `RAILWAY_DEPLOYMENT_GUIDE.md` - 배포 상세 가이드

## 📁 파일 구조

```
web/
├── index.html              # 메인 HTML
├── styles/
│   └── main.css           # 스타일시트
├── js/
│   ├── config.js          # Supabase 설정
│   ├── utils.js           # 유틸리티 함수
│   ├── auth.js            # 인증 기능
│   ├── signup.js          # 회원가입
│   ├── home.js            # 홈 화면
│   ├── posts.js           # 게시판
│   ├── notices.js         # 공지사항
│   ├── schedules.js       # 일정
│   ├── members.js         # 회원 관리
│   ├── profile.js         # 프로필
│   ├── navigation.js      # 화면 전환
│   └── app.js             # 앱 초기화
├── start-server.bat       # Windows 실행 스크립트
├── start-server.sh        # Linux/Mac 실행 스크립트
└── README.md             # 문서
```

## 🎨 디자인 시스템

- **Primary Color**: #1F4FD8
- **Secondary Color**: #E6ECFA
- **Accent Color**: #F59E0B
- **Error Color**: #DC2626
- **폰트**: Noto Sans KR

## 📝 개발 가이드

### 새로운 화면 추가

1. `index.html`에 화면 추가
2. `js/` 폴더에 해당 기능 JavaScript 파일 생성
3. `navigation.js`의 `switchTab()` 함수에 라우팅 추가
4. `app.js`에 초기화 코드 추가

### 디버깅

브라우저 콘솔에서 다음 함수들을 사용할 수 있습니다:

- `navigateToScreen("screen-name")` - 화면 전환
- `switchTab("tab-name")` - 탭 전환
- `checkAuthStatus()` - 인증 상태 확인

## 🐛 알려진 이슈

- [ ] 이미지 업로드 미구현
- [ ] 게시글/공지사항/일정 상세 화면 미구현
- [ ] 작성/수정 화면 미구현
- [ ] 댓글 기능 미구현

## 📄 라이선스

Copyright © 2026 영등포 JC. All rights reserved.

## 🤝 기여

이 프로젝트는 영등포 JC 내부 프로젝트입니다.

---

**버전**: 2.0  
**최종 업데이트**: 2026-02-06
