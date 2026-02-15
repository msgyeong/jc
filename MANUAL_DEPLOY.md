# 🚀 Railway 수동 배포 가이드

## ✅ 현재 상태
- **GitHub 저장소**: https://github.com/msgyeong/jc
- **최신 커밋**: `4a2655f - Add quick deployment action guide`
- **Railway 설정**: railway.json 존재 ✅
- **배포 방식**: Dockerfile (자동 감지)

---

## 📋 Railway 수동 배포 방법

### 방법 1: 웹 대시보드에서 재배포 (추천)

#### Step 1: Railway 대시보드 접속
```
URL: https://railway.app/dashboard
```

#### Step 2: JC 프로젝트 찾기
- 프로젝트 목록에서 "jc" 또는 "msgyeong" 검색
- 연결된 저장소가 `msgyeong/jc`인 프로젝트 클릭

#### Step 3: 재배포 실행
```
1. 프로젝트 화면에서 웹 앱 서비스 클릭
2. 좌측 "Deployments" 탭 클릭
3. 최신 배포 찾기
4. 우측 점 3개 (⋮) 클릭
5. "Redeploy" 선택
```

#### Step 4: 배포 모니터링
```
- Status: Building → Active (성공)
- 예상 시간: 3-5분
- Logs 탭에서 실시간 로그 확인
```

#### Step 5: 확인
```
1. Settings → Networking
2. Domain 확인
3. URL 접속하여 테스트
```

---

### 방법 2: Git Push로 자동 배포 트리거

Railway가 GitHub webhook을 통해 자동 배포하도록 설정되어 있다면:

```bash
# 빈 커밋으로 배포 트리거
git commit --allow-empty -m "trigger: Railway deployment"
git push origin main
```

Railway가 자동으로 새 배포를 감지하고 시작합니다.

---

### 방법 3: Railway CLI (선택사항)

#### Railway CLI 설치 (Node.js 필요)
```bash
# Scoop으로 Node.js 설치 (Windows)
scoop install nodejs

# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 연결
railway link

# 수동 배포
railway up

# 로그 확인
railway logs
```

---

## 🔍 배포 상태 확인

### Railway 대시보드에서 확인할 사항:

#### 1. Deployments 탭
```
✅ 최신 배포 상태: Active
✅ 커밋 해시: 4a2655f
✅ 빌드 시간: 2-5분
```

#### 2. Logs 탭
```
예상 로그:
  Building Docker image...
  Step 1/8 : FROM nginx:alpine
  Step 8/8 : CMD ["/start.sh"]
  Successfully built...
  🚀 Starting Nginx on port 3000...
```

#### 3. Settings 탭
```
✅ Source: msgyeong/jc (main 브랜치)
✅ Auto Deploy: Enabled
✅ Domain: jc-production-XXXX.up.railway.app
```

---

## 🎯 배포 후 테스트

### 1. URL 접속
```
https://jc-production-XXXX.up.railway.app
```

### 2. 로그인 테스트
```
일반 회원:
- 이메일: minsu@jc.com
- 비밀번호: test1234
- 예상 결과: ✅ 로그인 성공, "경민수" 표시

관리자:
- 이메일: admin@jc.com
- 비밀번호: admin1234
- 예상 결과: ✅ 로그인 성공, 관리자 페이지 접근

미등록 계정:
- 임의 이메일
- 예상 결과: ❌ "등록되지 않은 계정입니다"
```

---

## 🐛 문제 해결

### 문제 1: "프로젝트를 찾을 수 없음"
**원인**: Railway 프로젝트가 생성되지 않음

**해결**:
```
1. Railway 대시보드 → "New Project"
2. "Deploy from GitHub repo"
3. "msgyeong/jc" 선택
4. "Deploy Now"
```

### 문제 2: "배포가 자동으로 안 됨"
**원인**: GitHub webhook 미설정

**해결**:
```
1. Railway 프로젝트 → Settings → Source
2. "Disconnect" → 다시 "Connect to GitHub"
3. "msgyeong/jc" 선택
4. Auto Deploy 활성화 확인
```

### 문제 3: "Build Failed"
**원인**: Dockerfile 오류 또는 의존성 문제

**해결**:
```
1. Logs 탭에서 에러 메시지 확인
2. 로컬에서 Docker 빌드 테스트:
   docker build -t jc-app .
3. 문제 수정 후 재푸시
```

### 문제 4: "503 Service Unavailable"
**원인**: 앱이 시작되지 않음

**해결**:
```
1. Logs 탭 확인
2. "Starting Nginx" 메시지 있는지 확인
3. Variables 탭에서 PORT 환경변수 확인
4. 없으면 재배포
```

---

## 📊 배포 체크리스트

현재 상태:
- [x] GitHub 저장소 푸시 완료
- [x] railway.json 설정 완료
- [x] Dockerfile 준비 완료
- [x] 최신 커밋: 4a2655f

Railway에서 확인:
- [ ] 프로젝트 존재 확인
- [ ] GitHub 연결 확인 (msgyeong/jc)
- [ ] 자동 배포 활성화 확인
- [ ] 최신 배포 상태 확인
- [ ] Domain URL 확인
- [ ] PostgreSQL 연결 확인
- [ ] 로그인 테스트 완료

---

## 🔄 자동 배포 활성화 확인

Railway 프로젝트가 제대로 설정되어 있다면:

```
1. GitHub에 푸시
   ↓
2. Railway webhook 트리거
   ↓
3. 자동 빌드 시작
   ↓
4. 배포 완료
   ↓
5. URL 업데이트
```

**소요 시간**: 3-5분 (자동)

---

## 📞 다음 단계

### 1. Railway 대시보드 접속
👉 https://railway.app/dashboard

### 2. 배포 상태 확인
- Deployments 탭에서 최신 배포 확인
- Status가 "Active"인지 확인

### 3. URL 테스트
- Settings → Networking에서 URL 복사
- 브라우저에서 접속
- minsu@jc.com으로 로그인 테스트

### 4. 데이터베이스 확인
PostgreSQL이 추가되어 있는지 확인:
```
- 프로젝트에 PostgreSQL 카드 있는지 확인
- Variables에 DATABASE_URL 있는지 확인
- 없으면 추가 필요 (DEPLOY_NOW.md 참고)
```

---

## ✅ 배포 완료 확인

모든 것이 정상이라면:

```
🎉 배포 성공!

📍 URL: https://jc-production-XXXX.up.railway.app
👤 테스트: minsu@jc.com / test1234 (경민수)
🔧 관리자: admin@jc.com / admin1234
📊 커밋: 4a2655f
⏰ 배포 시간: 2026-02-15
```

---

**지금 바로 [Railway 대시보드](https://railway.app/dashboard)를 열어 배포 상태를 확인하세요!**
