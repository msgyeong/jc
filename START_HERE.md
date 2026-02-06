# 🚀 JC 앱 시작 가이드 (빠른 시작)

## 📋 목차
1. [Supabase 설정](#1-supabase-설정-5분)
2. [Railway 배포](#2-railway-배포-3분)
3. [관리자 계정 생성](#3-관리자-계정-생성-2분)
4. [백업 설정](#4-백업-설정-선택-5분)

---

## 1. Supabase 설정 (5분)

### Step 1: 프로젝트 생성
1. https://supabase.com 접속 → GitHub 로그인
2. "New Project" 클릭
3. 입력:
   - Name: `jc-app`
   - Password: **강력한 비밀번호 (메모!)**
   - Region: `Seoul`
   - Plan: `Free`
4. "Create project" 클릭 (2분 대기)

### Step 2: 데이터베이스 생성
1. 왼쪽 메뉴 → **🗄️ SQL Editor** 클릭
2. "+ New query" 클릭
3. `database/migrations/001_initial_schema.sql` 파일 열기
4. **전체 복사** → SQL Editor에 붙여넣기
5. **"RUN"** 버튼 클릭
6. ✅ `데이터베이스 테이블 생성 완료!` 확인

### Step 3: API 키 확인
1. 왼쪽 메뉴 → **⚙️ Settings** → **API**
2. **메모장에 복사**:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbG...
   ```

---

## 2. Railway 배포 (3분)

### Railway에서 프로젝트 연결
1. https://railway.app/dashboard 접속
2. "New Project" → "Deploy from GitHub repo"
3. **"k50004950-ctrl/jc"** 선택
4. 자동 배포 시작 (2-3분)
5. Settings → "Generate Domain" → URL 생성

### 환경 변수 설정 (중요!)
1. Railway 프로젝트 → **Variables** 탭
2. 다음 2개 추가 (Supabase에서 복사한 값):
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbG...
   ```
3. 자동 재배포 (1분)

---

## 3. 관리자 계정 생성 (2분)

### Step 1: 회원가입
1. Railway에서 생성된 URL 접속 (예: `jc-app.railway.app`)
2. **회원가입** 클릭
3. 정보 입력 후 **가입 신청**

### Step 2: 관리자 승격
1. Supabase → **🗄️ Table Editor** → **users** 테이블
2. 방금 가입한 회원 찾기
3. 더블클릭으로 수정:
   - `role` → `super_admin`
   - `status` → `active`
4. **Save** 클릭

### Step 3: 로그인
1. 웹 앱으로 돌아가서 로그인
2. 프로필 → **🔧 관리자 페이지** 버튼 확인
3. ✅ 완료!

---

## 4. 백업 설정 (선택, 5분)

### 무료 플랜 백업 (권장)

#### 방법 1: 자동 스크립트
1. `backup-supabase.bat` 파일 열기
2. 수정:
   ```batch
   SET PROJECT_ID=xxxxx  ← Supabase 프로젝트 ID
   ```
3. 더블클릭으로 실행
4. 백업 파일 확인: `C:\JC_Backups\`

#### 방법 2: Windows 작업 스케줄러
1. `Win + R` → `taskschd.msc` 입력
2. "작업 만들기" 클릭
3. 트리거: 매주 일요일 오전 3시
4. 동작: `C:\jcK\backup-supabase.bat` 실행

### Pro 플랜 백업 (자동)
- Supabase → Database → Backups → "Enable automatic backups"
- 매일 자동 백업 (7일 보관)

---

## 📚 상세 가이드 문서

| 문서 | 내용 |
|------|------|
| **SUPABASE_SETUP_GUIDE.md** | Supabase 전체 설정 가이드 |
| **SUPABASE_UPGRADE_GUIDE.md** | 무료 → 유료 업그레이드 가이드 |
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
- ✅ Supabase: **$0** (500MB DB, 1GB 저장소)
- ✅ Railway: **$0** (월 $5 크레딧, 약 500시간 무료)
- ✅ **총 비용: $0/월**

### 회원 100명 기준
- 데이터베이스: 약 50MB
- 저장소 (이미지): 약 200MB
- 트래픽: 월 5GB 이하
- **✅ 무료 플랜으로 충분합니다!**

### 업그레이드 시점
- 회원 100명 이상
- DB 400MB 이상
- 월간 방문자 5,000명 이상
- → **Supabase Pro**: $25/월

---

## 🆘 문제 해결

### Q1: Railway에서 레포지토리가 안 보여요
**A:** GitHub App 권한 설정
1. Railway → Configure GitHub App
2. Repository access → "k50004950-ctrl/jc" 선택
3. Save

### Q2: 로그인이 안 돼요
**A:** Supabase 설정 확인
1. `web/js/config.js` 파일 확인:
   ```javascript
   DEMO_MODE: false  // 반드시 false
   url: 'https://...'  // 실제 URL
   anonKey: 'eyJ...'  // 실제 키
   ```
2. Railway Variables 확인

### Q3: 관리자 페이지가 안 보여요
**A:** Supabase에서 권한 확인
1. Table Editor → users 테이블
2. 본인 계정 찾기
3. role = `super_admin`, status = `active` 확인

### Q4: 데이터가 안 보여요
**A:** 데이터베이스 생성 확인
1. Supabase → SQL Editor
2. 다음 쿼리 실행:
   ```sql
   SELECT * FROM public.schema_migrations;
   ```
3. `001_initial_schema` 확인
4. 없으면 `database/migrations/001_initial_schema.sql` 다시 실행

---

## 📞 지원

### 📧 이슈 리포트
- GitHub Issues: https://github.com/k50004950-ctrl/jc/issues

### 📚 공식 문서
- Supabase: https://supabase.com/docs
- Railway: https://docs.railway.app

---

## 🎉 완료!

이제 다음을 할 수 있습니다:

1. ✅ 회원 가입 → 관리자 승인 → 로그인
2. ✅ 게시글/댓글 작성
3. ✅ 공지사항/일정 등록
4. ✅ 관리자 페이지에서 회원 관리
5. ✅ 정기 백업으로 데이터 보호

**문제가 있으면 상세 가이드 문서를 참고하세요!** 📚
