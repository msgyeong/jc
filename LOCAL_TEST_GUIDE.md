# ================================================
# 로컬 테스트 가이드
# ================================================

## 🎯 테스트 목표

Railway 배포 전에 로컬 환경에서 전체 시스템을 테스트합니다:
- ✅ Node.js API 서버 작동 확인
- ✅ 웹 프론트엔드 작동 확인
- ✅ API ↔ DB 연결 확인
- ✅ 웹 ↔ API 연동 확인

---

## 📋 사전 준비

### 1. Node.js 설치 확인
```bash
node --version
# v18 이상 권장

npm --version
```

### 2. Python 설치 확인 (웹 서버용)
```bash
python --version
# 3.x 이상
```

### 3. Railway PostgreSQL 연결 정보 가져오기

**방법 1: Railway 대시보드**
1. https://railway.app/dashboard 접속
2. PostgreSQL 서비스 선택
3. "Connect" 탭 클릭
4. "Postgres Connection URL" 복사

**방법 2: Railway CLI**
```bash
railway variables
# DATABASE_URL 값 복사
```

---

## 🧪 테스트 1: API 서버 단독 테스트

### Step 1: 환경 변수 설정

`api/.env` 파일을 생성하거나 수정:

```bash
# Railway PostgreSQL 연결 (실제 값으로 교체)
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# JWT 비밀키 생성
JWT_SECRET=생성된_32자_이상_랜덤_문자열

# 환경
NODE_ENV=development

# 포트
PORT=3000
```

**JWT_SECRET 생성 방법**:
```bash
# Node.js로 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 결과 예시: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Step 2: 의존성 설치

```bash
cd api
npm install
```

**예상 출력**:
```
added 150 packages in 10s
```

### Step 3: API 서버 실행

**방법 A: 배치 스크립트 (Windows)**
```bash
cd api
test-api.bat
```

**방법 B: 직접 실행**
```bash
cd api
node server.js
```

**성공 시 출력**:
```
==================================================
🚀 영등포 JC API 서버 시작
==================================================
📡 포트: 3000
🌍 환경: development
🔗 URL: http://localhost:3000
==================================================
✅ Database connected successfully
```

### Step 4: API 테스트

**새 터미널을 열어서** 다음 명령어 실행:

**헬스체크**:
```bash
curl http://localhost:3000/health
# 응답: {"status":"ok","timestamp":"2026-02-19T..."}
```

**로그인 테스트**:
```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"minsu@jc.com\",\"password\":\"test1234\"}"
```

**예상 응답**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "minsu@jc.com",
    "name": "경민수",
    "role": "member"
  }
}
```

**게시글 목록 조회 테스트**:
```bash
# 먼저 로그인해서 토큰 받기
set TOKEN=받은_JWT_토큰

curl http://localhost:3000/api/posts?page=1 ^
  -H "Authorization: Bearer %TOKEN%"
```

---

## 🌐 테스트 2: 웹 프론트엔드 단독 테스트

### Step 1: 웹 서버 실행

**새 터미널을 열어서**:

**방법 A: 배치 스크립트 (Windows)**
```bash
test-web.bat
```

**방법 B: 직접 실행**
```bash
cd web
python -m http.server 8000
```

**성공 시 출력**:
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

### Step 2: 브라우저 테스트

1. **브라우저에서 접속**
   - URL: http://localhost:8000

2. **로그인 화면 확인**
   - 이메일/비밀번호 입력 폼 표시
   - UI가 정상적으로 렌더링되는지 확인

3. **개발자 도구 열기** (F12)
   - Console 탭 확인
   - 에러 메시지 확인

**예상 콘솔 로그**:
```
✅ Config 로드 완료 - Railway API 모드
✅ API 클라이언트 초기화 완료
✅ Auth 모듈 로드 완료 (Railway API)
✅ Home 모듈 로드 완료 (Railway API)
...
```

---

## 🔗 테스트 3: 웹 + API 통합 테스트

**전제 조건**: API 서버와 웹 서버가 모두 실행 중이어야 합니다.
- API: http://localhost:3000
- 웹: http://localhost:8000

### 테스트 시나리오

#### 1. 로그인 테스트

1. **브라우저에서** http://localhost:8000 접속
2. 테스트 계정으로 로그인:
   - 이메일: `minsu@jc.com`
   - 비밀번호: `test1234`

3. **개발자 도구 Console 확인**:
   ```
   🔹 로그인 시작
   📝 로그인 시도: minsu@jc.com
   📡 API 요청: POST /api/auth/login
   ✅ API 응답 성공
   ✅ 로그인 성공
   ```

4. **예상 결과**:
   - ✅ 로그인 성공
   - ✅ 홈 화면으로 이동
   - ✅ 상단에 사용자 이름 표시

**실패 시 확인 사항**:
- ❌ "Failed to fetch" 에러 → API 서버 실행 여부 확인
- ❌ "CORS error" → nginx.conf CORS 설정 확인 (배포 후 해결)
- ❌ "Unauthorized" → 계정 정보 확인 또는 DB 확인

#### 2. 게시판 조회 테스트

1. **하단 탭에서** "게시판" 클릭
2. **개발자 도구 Network 탭 확인**:
   - `GET /api/posts?page=1&limit=20` 요청 확인
   - Status: 200 OK

3. **예상 결과**:
   - ✅ 게시글 목록 표시 (또는 "등록된 게시글이 없습니다")

#### 3. 공지사항 조회 테스트

1. **홈 화면** 공지사항 섹션 확인
2. **개발자 도구 Network 탭**:
   - `GET /api/notices?page=1&limit=5` 요청 확인

3. **예상 결과**:
   - ✅ 공지사항 요약 표시

#### 4. 일정 조회 테스트

1. **홈 화면** 일정 섹션 확인
2. **개발자 도구 Network 탭**:
   - `GET /api/schedules?upcoming=true` 요청 확인

3. **예상 결과**:
   - ✅ 다가오는 일정 표시

#### 5. 회원 목록 조회 테스트

1. **하단 탭에서** "회원" 클릭
2. **개발자 도구 Network 탭**:
   - `GET /api/members?page=1&limit=50` 요청 확인

3. **예상 결과**:
   - ✅ 활성 회원 목록 표시

#### 6. 프로필 조회 테스트

1. **하단 탭에서** "프로필" 클릭
2. **개발자 도구 Network 탭**:
   - `GET /api/profile` 요청 확인

3. **예상 결과**:
   - ✅ 내 프로필 정보 표시
   - ✅ 이메일, 이름, 전화번호 등 표시

#### 7. 공지사항 상세/작성/수정/삭제 테스트

1. **하단 탭에서** "공지사항" 진입 후 목록 카드 클릭
2. **개발자 도구 Network 탭**:
   - `GET /api/notices?page=1&limit=20`
   - `GET /api/notices/:id`
3. **예상 결과**:
   - ✅ 공지 상세(제목/본문/작성자/조회수) 표시
   - ✅ 작성자 또는 관리자 계정에서만 수정/삭제 버튼 표시

4. **작성 테스트(관리자 계정)**:
   - `+` 버튼 클릭 → 제목/내용/고정/참석조사 입력 후 저장
   - Network: `POST /api/notices`
   - ✅ 저장 성공 후 상세 또는 목록 반영

5. **수정 테스트(작성자/관리자)**:
   - 상세의 수정 버튼 클릭 → 내용 변경 후 저장
   - Network: `PUT /api/notices/:id`
   - ✅ 변경 내용 반영

6. **삭제 테스트(작성자/관리자)**:
   - 상세의 삭제 버튼 클릭
   - Network: `DELETE /api/notices/:id`
   - ✅ 목록에서 제거

#### 8. 공지 참석자 조사 테스트

1. 참석조사 활성화된 공지 상세 진입
2. 참석/불참/미정 버튼 각각 클릭
3. **개발자 도구 Network 탭**:
   - `GET /api/notices/:id/attendance`
   - `POST /api/notices/:id/attendance`
4. **예상 결과**:
   - ✅ 내 상태 저장/변경
   - ✅ 요약 통계(참석/불참/미정) 갱신

#### 9. 일정 상세/등록/수정/삭제 테스트

1. **하단 탭에서** "일정" 클릭 후 목록 카드 클릭
2. **개발자 도구 Network 탭**:
   - `GET /api/schedules?upcoming=true`
   - `GET /api/schedules/:id`
3. **예상 결과**:
   - ✅ 일정 상세(제목/날짜/시간/장소/설명) 표시
   - ✅ 작성자 또는 관리자 계정에서만 수정/삭제 버튼 표시

4. **등록 테스트(관리자 계정)**:
   - `+` 버튼 클릭 → 제목/날짜/시간/장소/설명 입력 후 저장
   - Network: `POST /api/schedules`
   - ✅ 저장 성공 후 상세 또는 목록 반영

5. **수정 테스트(작성자/관리자)**:
   - 상세의 수정 버튼 클릭 → 내용 변경 후 저장
   - Network: `PUT /api/schedules/:id`
   - ✅ 변경 내용 반영

6. **삭제 테스트(작성자/관리자)**:
   - 상세의 삭제 버튼 클릭
   - Network: `DELETE /api/schedules/:id`
   - ✅ 목록에서 제거

---

## ⚠️ 주의사항

### CORS 이슈

로컬 테스트에서는 **CORS 에러가 발생할 수 있습니다**:
- 웹: http://localhost:8000
- API: http://localhost:3000
- → 다른 포트 = CORS 정책 위반

**해결 방법**:

**방법 1: 브라우저 CORS 비활성화 (임시)**
```bash
# Chrome 실행 (CORS 비활성화)
chrome.exe --user-data-dir="C:/Chrome dev session" --disable-web-security
```

**방법 2: API 서버에 CORS 미들웨어 추가** (이미 추가됨)
- `api/server.js`에 `cors()` 미들웨어 사용 중

**방법 3: Railway 배포 후 테스트**
- 배포 후에는 같은 도메인이므로 CORS 문제 없음

---

## ✅ 테스트 완료 체크리스트

### API 서버
- [ ] `npm install` 성공
- [ ] `.env` 파일 생성 및 설정
- [ ] API 서버 시작 성공
- [ ] 데이터베이스 연결 성공 ("Database connected" 메시지)
- [ ] `/health` 엔드포인트 응답 확인
- [ ] 로그인 API 테스트 성공

### 웹 프론트엔드
- [ ] 웹 서버 시작 성공
- [ ] 로그인 화면 정상 표시
- [ ] Console에 에러 없음
- [ ] API 클라이언트 초기화 완료

### 통합 테스트
- [ ] 로그인 성공
- [ ] 홈 화면 데이터 로드
- [ ] 게시판 조회 성공
- [ ] 공지사항 조회 성공
- [ ] 일정 조회 성공
- [ ] 공지사항 상세/작성/수정/삭제 성공
- [ ] 공지 참석자 조사 저장/조회 성공
- [ ] 일정 상세/등록/수정/삭제 성공
- [ ] 회원 목록 조회 성공
- [ ] 프로필 조회 성공

---

## 🐛 문제 해결

### API 서버가 시작되지 않음

**증상**: "Database connection error"

**원인**: `DATABASE_URL` 잘못됨

**해결**:
1. Railway 대시보드에서 올바른 URL 복사
2. `api/.env` 파일 수정
3. API 서버 재시작

### 로그인 실패

**증상**: "등록되지 않은 이메일..."

**원인**: 테스트 계정이 DB에 없음

**해결**:
1. Railway PostgreSQL에 접속
2. `database/create_test_member.sql` 실행
3. 다시 로그인 시도

### "Failed to fetch" 에러

**증상**: Console에 "Failed to fetch" 에러

**원인**: API 서버가 실행되지 않음

**해결**:
1. 새 터미널에서 API 서버 실행 확인
2. `http://localhost:3000/health` 직접 접속 테스트

---

## 📊 다음 단계

로컬 테스트가 성공하면:

✅ **Phase 5: Railway 배포**로 진행
- Git Push
- Railway 환경 변수 설정
- 자동 배포 확인

---

**문서 버전**: 1.0  
**최종 업데이트**: 2026-02-19
