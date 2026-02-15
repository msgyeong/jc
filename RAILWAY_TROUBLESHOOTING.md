# 🚨 Railway 배포 문제 해결 가이드

## ❓ 현재 상황
Railway 배포가 반응이 없거나 실패하는 경우

---

## 🔍 체크리스트

### 1. Railway 프로젝트 확인
1. **Railway 대시보드 접속**: https://railway.app/dashboard
2. **프로젝트 상태 확인**:
   - `msgyeong/jc` 프로젝트가 연결되어 있나?
   - 배포 상태가 "Building" 또는 "Deploying"인가?
   - 에러 메시지가 있나?

### 2. 저장소 연결 확인
Railway 프로젝트 설정에서:
- ✅ GitHub 저장소: `msgyeong/jc` 연결 확인
- ✅ 브랜치: `main` 설정 확인
- ✅ 자동 배포: 활성화 확인

### 3. 배포 로그 확인
Railway 프로젝트 → **Deployments** 탭 → 최신 배포 클릭:
```
예상되는 로그:
- Building Docker image...
- Running Dockerfile...
- Starting Nginx on port XXXX...
- Deployment successful
```

---

## 🛠️ 해결 방법

### 방법 1: Railway에서 수동 재배포
1. Railway 프로젝트 대시보드 접속
2. 프로젝트 선택
3. **Deployments** 탭
4. **"Redeploy"** 버튼 클릭

### 방법 2: GitHub 저장소 재연결
1. Railway 프로젝트 → **Settings** 탭
2. **Source** 섹션
3. **"Disconnect"** → 다시 **"Connect to GitHub"**
4. `msgyeong/jc` 저장소 선택

### 방법 3: 새 Railway 프로젝트 생성

#### Step 1: Railway 프로젝트 생성
1. https://railway.app/new 접속
2. **"Deploy from GitHub repo"** 선택
3. **"msgyeong/jc"** 저장소 선택
4. **"Deploy Now"** 클릭

#### Step 2: 환경 변수 설정 (선택)
Railway 프로젝트 → **Variables** 탭:
```
(필요한 경우만)
DATABASE_URL=postgresql://...
```

#### Step 3: 도메인 생성
Railway 프로젝트 → **Settings** → **Networking**:
1. **"Generate Domain"** 클릭
2. 생성된 URL 복사 (예: `jc-production-xxxx.up.railway.app`)

### 방법 4: Railway CLI 사용

```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# 수동 배포
railway up

# 로그 확인
railway logs
```

---

## 🐛 일반적인 오류와 해결

### 오류 1: "Build failed - Dockerfile not found"
**원인**: Railway가 Dockerfile을 찾지 못함

**해결**:
1. Railway 프로젝트 → **Settings** → **Build**
2. **Build Command** 확인: `docker build -f Dockerfile .`
3. **Dockerfile Path** 확인: `Dockerfile` (루트에 있어야 함)

### 오류 2: "Port binding failed"
**원인**: 포트 설정 문제

**해결**:
1. Railway 프로젝트 → **Settings**
2. **PORT** 환경 변수가 자동 설정되어 있는지 확인
3. Dockerfile에서 `EXPOSE ${PORT}` 확인

### 오류 3: "Deployment timeout"
**원인**: 배포 시간 초과

**해결**:
1. Railway 무료 플랜: 빌드 시간 제한 있음
2. 프로젝트 → **Redeploy** 다시 시도
3. 계속 실패하면 유료 플랜 고려

### 오류 4: "503 Service Unavailable"
**원인**: 앱이 시작되지 않음

**해결**:
1. Railway Logs 확인
2. Nginx 설정 확인
3. `start.sh` 스크립트 권한 확인

---

## 📊 배포 상태 확인 방법

### Railway 대시보드에서
1. **Deployments** 탭:
   - 🟢 초록색: 배포 성공
   - 🟡 노란색: 배포 중
   - 🔴 빨간색: 배포 실패

2. **Metrics** 탭:
   - CPU, 메모리 사용량 확인
   - 앱이 실행 중인지 확인

3. **Logs** 탭:
   - 실시간 로그 확인
   - 에러 메시지 찾기

### 웹 브라우저에서
배포된 URL 접속:
- **정상**: 로그인 화면 표시
- **문제**: 503 에러 또는 연결 실패

---

## 🔄 배포 프로세스 이해

### 정상 배포 흐름
```
1. GitHub Push
   ↓
2. Railway 자동 감지
   ↓
3. Dockerfile 빌드
   ↓
4. Docker 이미지 생성
   ↓
5. 컨테이너 시작
   ↓
6. Nginx 웹 서버 실행
   ↓
7. 배포 완료 ✅
```

### 예상 소요 시간
- 빌드: 2-3분
- 배포: 1-2분
- **총**: 3-5분

---

## 🆘 추가 도움이 필요한 경우

### Railway 로그 확인
Railway 프로젝트 → **Logs** 탭에서 에러 메시지 확인

### 중요한 로그 키워드
- ❌ `ERROR`: 에러 발생
- ⚠️ `WARN`: 경고
- ✅ `Starting Nginx`: 정상 시작
- 🔴 `Connection refused`: 포트 문제
- 🔴 `Permission denied`: 권한 문제

---

## 💡 빠른 테스트 방법

### 로컬에서 Docker 테스트
```bash
# Docker 이미지 빌드
docker build -t jc-app .

# 컨테이너 실행
docker run -p 8080:80 jc-app

# 브라우저에서 테스트
# http://localhost:8080
```

정상 작동하면 Railway 설정 문제입니다.

---

## 📞 현재 배포 URL

기존 배포 URL (공동 개발자):
- https://jc-production-7db6.up.railway.app

새로 배포하면 다른 URL이 생성됩니다:
- https://jc-production-XXXX.up.railway.app

---

**최종 업데이트**: 2026-02-15
