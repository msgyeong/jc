# 🚀 JC 앱 시작 가이드 (빠른 시작)

## 📋 목차
1. [Railway 배포](#1-railway-배포-5분)
2. [관리자 계정 생성](#2-관리자-계정-생성-2분)
3. [백업 설정](#3-백업-설정-선택-5분)

---

## 1. Railway 배포 (5분)

### Step 1: Railway에서 프로젝트 연결
1. https://railway.app/dashboard 접속
2. "New Project" → "Deploy from GitHub repo"
3. **"k50004950-ctrl/jc"** 선택
4. 자동 배포 시작 (2-3분)
5. Settings → "Generate Domain" → URL 생성

### Step 2: PostgreSQL 추가
1. 프로젝트 화면에서 **"+ New"** 클릭
2. **"Database"** → **"Add PostgreSQL"** 선택
3. 자동으로 PostgreSQL 생성 (1분 소요)

### Step 3: 데이터베이스 초기화
1. Railway PostgreSQL → **"Data"** 탭 → **"Query"**
2. `database/railway_init.sql` 파일 내용 전체 복사 → 붙여넣기 → **"Run Query"**
3. `Railway PostgreSQL 데이터베이스 초기화 완료!` 확인

### Step 4: 환경 변수 설정
1. Railway 프로젝트 → 웹 앱 서비스 → **Variables** 탭
2. **"+ New Variable"** → **"Add Reference"** → PostgreSQL → **DATABASE_URL** 추가
3. 자동 재배포 (1분)

---

## 2. 관리자 계정 생성 (2분)

### Step 1: SQL로 관리자 생성
1. Railway PostgreSQL → **"Query"** 탭
2. `database/create_admin.sql` 파일 내용 실행
3. 관리자 계정 생성 완료

### Step 2: 로그인
1. 웹 앱에서 관리자 계정으로 로그인
2. 프로필 → **관리자 페이지** 버튼 확인
3. 완료!

---

## 3. 백업 설정 (선택, 5분)

### Railway 백업

#### 방법 1: Railway CLI
```bash
npm install -g @railway/cli
railway run pg_dump $DATABASE_URL > backup.sql
```

#### 방법 2: Railway 대시보드
1. Railway PostgreSQL → **"Data"** 탭
2. **"Backups"** 섹션
3. **"Create Backup"** 클릭

### Railway 유료 플랜 (자동 백업)
- 매일 자동 백업, 7일 보관
- 클릭 한 번으로 복구

---

## 📚 상세 가이드 문서

| 문서 | 내용 |
|------|------|
| **RAILWAY_DEPLOYMENT_GUIDE.md** | Railway 배포 상세 가이드 |
| **FULL_DEPLOYMENT_GUIDE.md** | 전체 배포 가이드 (웹 + 앱) |
| **database/README.md** | 데이터베이스 관리 가이드 |
| **web/README.md** | 웹 버전 개발 가이드 |

---

## 🎯 주요 기능

### ✅ 인증 시스템
- 회원가입 (이메일 + 비밀번호)
- 로그인 / 로그아웃
- 세션 관리 (로그인 유지)

### ✅ 관리자 페이지
- 회원 승인/거부
- 권한 변경 (member ↔ admin)
- 회원 정지/복구
- 게시글/댓글 삭제

### ✅ 게시판
- 게시글 목록/작성/수정/삭제
- 댓글/대댓글
- 공감 (좋아요)
- 카테고리 분류

### ✅ 공지사항
- 공지 목록/작성/수정/삭제
- 상단 고정
- 참석자 조사 (참석/불참/미정)

### ✅ 일정
- 일정 등록/수정/삭제
- 날짜별 그룹핑
- 카테고리 (모임/회의/교육/휴일 등)

### ✅ 회원 관리
- 회원 목록
- 검색 (이름/직책/업종)
- 프로필 상세

### ✅ 홈 화면
- 배너 슬라이드
- 최근 공지사항
- 다가오는 일정

---

## 🔧 관리자 권한 구조

| 역할 | 권한 |
|------|------|
| **super_admin** | 모든 권한 (관리자 권한 부여 가능) |
| **admin** | 회원 승인, 공지/일정 작성, 콘텐츠 삭제 |
| **member** | 게시글 작성, 댓글, 공감 |
| **pending** | 승인 대기 (로그인 불가) |

---

## 💰 비용 (무료로 시작)

### 무료 플랜 (충분!)
- Railway: **$0** (월 $5 크레딧, 약 500시간 무료)
- **총 비용: $0/월**

### 회원 100명 기준
- 데이터베이스: 약 50MB
- 저장소 (이미지): 약 200MB
- 트래픽: 월 5GB 이하
- **✅ 무료 플랜으로 충분합니다!**

### 업그레이드 시점
- 회원 100명 이상
- DB 400MB 이상
- 월간 방문자 5,000명 이상
- → **Railway Pro**: $5/월 + 사용량

---

## 🆘 문제 해결

### Q1: Railway에서 레포지토리가 안 보여요
**A:** GitHub App 권한 설정
1. Railway → Configure GitHub App
2. Repository access → "k50004950-ctrl/jc" 선택
3. Save

### Q2: 로그인이 안 돼요
**A:** 설정 확인
1. Railway Variables에서 DATABASE_URL 확인
2. API 서버 로그 확인 (Railway → Logs)

### Q3: 관리자 페이지가 안 보여요
**A:** Railway PostgreSQL Query 탭에서 권한 확인
```sql
SELECT * FROM users WHERE email = 'your@email.com';
```
- role = `super_admin`, status = `active` 확인

### Q4: 데이터가 안 보여요
**A:** 데이터베이스 생성 확인
1. Railway PostgreSQL → Query 탭
2. 다음 쿼리 실행:
   ```sql
   SELECT * FROM schema_migrations;
   ```
3. 없으면 `database/railway_init.sql` 다시 실행

---

## 📞 지원

### 📧 이슈 리포트
- GitHub Issues: https://github.com/k50004950-ctrl/jc/issues

### 📚 공식 문서
- Railway: https://docs.railway.app
- PostgreSQL: https://www.postgresql.org/docs/

---

## 🎉 완료!

이제 다음을 할 수 있습니다:

1. ✅ 회원 가입 → 관리자 승인 → 로그인
2. ✅ 게시글/댓글 작성
3. ✅ 공지사항/일정 등록
4. ✅ 관리자 페이지에서 회원 관리
5. ✅ 정기 백업으로 데이터 보호

**문제가 있으면 상세 가이드 문서를 참고하세요!** 📚
