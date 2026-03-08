# 🚂 Railway 배포 완전 가이드

**플랫폼**: Railway  
**대상**: 영등포 JC 웹 버전 + 앱 버전 대비  
**날짜**: 2026-02-06  

---

## 📋 준비 사항

✅ **완료된 것들:**
- [x] 웹 버전 개발 완료
- [x] Railway 배포 설정 파일 생성
  - `Dockerfile` - Docker 이미지 빌드
  - `nginx.conf` - 웹서버 설정
  - `railway.json` - Railway 설정
  - `.railwayignore` - 제외 파일 목록

---

## 🎯 Railway 배포 단계

### 1️⃣ GitHub Fork & Push

#### Step 1: Fork 하기 (브라우저)
1. https://github.com/msgyeong/jc 접속
2. 우측 상단 **"Fork"** 버튼 클릭
3. 본인 계정 `k50004950-ctrl`로 Fork

#### Step 2: Push 하기
```powershell
# 배포 파일 커밋
cd C:\jcK
git add Dockerfile nginx.conf railway.json .railwayignore
git commit -m "Add Railway deployment configuration"

# 원격 저장소 변경
git remote set-url origin https://github.com/k50004950-ctrl/jc.git

# Push
git push -u origin main
```

또는 `deploy.bat` 실행:
```powershell
C:\jcK\deploy.bat
```

---

### 2️⃣ Railway 프로젝트 생성

#### Step 1: Railway 로그인
1. https://railway.app 접속
2. **"Login"** 클릭
3. **GitHub 계정으로 로그인**

#### Step 2: 새 프로젝트 생성
1. Dashboard에서 **"New Project"** 클릭
2. **"Deploy from GitHub repo"** 선택
3. **"Configure GitHub App"** 클릭 (처음이면)
4. Repository 권한 부여
5. **`k50004950-ctrl/jc`** 선택

#### Step 3: 설정 확인
Railway가 자동으로 감지:
- ✅ `Dockerfile` 발견
- ✅ 자동 빌드 시작
- ✅ 도메인 자동 생성

---

### 3️⃣ 환경 변수 설정 (선택)

현재는 `DEMO_MODE: true`로 설정되어 있어서 **바로 작동**합니다!

#### PostgreSQL 연동 시:
1. Railway Dashboard → 프로젝트 선택
2. **"Variables"** 탭 클릭
3. **"+ New Variable"** → **"Add Reference"** → PostgreSQL → **DATABASE_URL** 추가

---

### 4️⃣ 배포 확인

#### 자동 배포 프로세스:
```
1. GitHub Push
   ↓
2. Railway 감지
   ↓
3. Docker 이미지 빌드
   ↓
4. Nginx 컨테이너 실행
   ↓
5. 도메인 생성
   ↓
6. 배포 완료! 🎉
```

#### 배포 URL 확인:
1. Railway Dashboard → **"Deployments"** 탭
2. 최신 배포 클릭
3. **"View Logs"** 확인
4. **도메인 주소** 복사
   - 예: `https://jc-production-xxxx.up.railway.app`

---

## 🔧 커스텀 도메인 설정 (선택)

### Railway에서 커스텀 도메인 추가:
1. Railway Dashboard → **"Settings"** 탭
2. **"Domains"** 섹션
3. **"Custom Domain"** 추가
4. 도메인 제공업체에서 DNS 설정:
   ```
   Type: CNAME
   Name: www (또는 @)
   Value: [Railway가 제공한 값]
   ```

---

## 📱 앱 버전 대비 설정

### Railway PostgreSQL 설정

#### 1. PostgreSQL 추가
1. Railway 프로젝트 → **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. 자동으로 PostgreSQL 생성

#### 2. 데이터베이스 초기화
1. Railway PostgreSQL → **"Data"** → **"Query"**
2. `database/railway_init.sql` 실행
3. `database/create_admin.sql` 실행

#### 3. 환경 변수 연결
1. Railway 웹 앱 → Variables → **"Add Reference"** → PostgreSQL → **DATABASE_URL**
2. 커밋 & Push → Railway 자동 재배포

---

### Firebase 설정 (앱용)

#### 1. Firebase 프로젝트 생성
1. https://console.firebase.google.com
2. **"프로젝트 추가"**
3. 프로젝트 이름: `yeongdeungpo-jc`

#### 2. Android 앱 등록
1. 설정 → **Android 앱 추가**
2. 패키지 이름: `com.yeongdeungpo.jc`
3. `google-services.json` 다운로드
4. `android/app/` 에 저장

#### 3. iOS 앱 등록
1. 설정 → **iOS 앱 추가**
2. 번들 ID: `com.yeongdeungpo.jc`
3. `GoogleService-Info.plist` 다운로드
4. `ios/Runner/` 에 저장

---

## 🚀 Flutter 앱 빌드 (추후)

### Android APK
```powershell
cd C:\jcK
flutter build apk --release
```
출력: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle (Play Store)
```powershell
flutter build appbundle --release
```
출력: `build/app/outputs/bundle/release/app-release.aab`

### 배포
- **내부 테스트**: Firebase App Distribution
- **공개**: Google Play Store

---

## 📊 배포 구조 (완성 시)

```
┌─────────────────────────────────┐
│  웹 버전 (Railway)               │
│  https://jc-xxx.railway.app     │
│  - Nginx + Docker               │
│  - 자동 배포                     │
└─────────────────────────────────┘
            ↓ ↑ API
┌─────────────────────────────────┐
│  백엔드 (Railway)                │
│  - Node.js API (Express)        │
│  - Railway PostgreSQL           │
│  - JWT 인증                     │
└─────────────────────────────────┘
            ↓ ↑ API
┌─────────────────────────────────┐
│  앱 버전 (Flutter)               │
│  - Android (Play Store)         │
│  - iOS (App Store)              │
│  - Firebase Analytics           │
└─────────────────────────────────┘
```

---

## ✅ 배포 체크리스트

### 즉시 실행
- [ ] GitHub Fork 완료
- [ ] Railway 설정 파일 커밋
- [ ] GitHub Push 완료
- [ ] Railway 프로젝트 생성
- [ ] 자동 배포 확인
- [ ] 웹사이트 접속 테스트
- [ ] 데모 모드 테스트 (로그인/회원가입)

### 추후 실행 (Railway PostgreSQL 연동)
- [ ] Railway PostgreSQL 추가
- [ ] 데이터베이스 초기화 (railway_init.sql)
- [ ] 환경 변수 설정 (DATABASE_URL)
- [ ] 실제 데이터로 테스트

### 앱 개발 시
- [ ] Firebase 프로젝트 생성
- [ ] Android/iOS 앱 등록
- [ ] Flutter 환경 설정
- [ ] APK/AAB 빌드
- [ ] Play Store 등록

---

## 🔄 자동 배포 플로우

```
개발자가 코드 수정
    ↓
Git Commit
    ↓
Git Push to GitHub
    ↓
Railway 자동 감지
    ↓
Docker 이미지 빌드
    ↓
자동 배포
    ↓
새 버전 라이브! 🎉
```

**소요 시간**: 약 2-3분

---

## 🆘 문제 해결

### Railway 배포 실패
1. **로그 확인**: Railway Dashboard → Deployments → View Logs
2. **Docker 빌드 오류**: `Dockerfile` 확인
3. **포트 오류**: 80 포트 확인

### 웹사이트 접속 안됨
1. 배포 상태 확인: **Deployments** 탭에서 "Success" 확인
2. 도메인 확인: Settings → Domains
3. 브라우저 캐시 삭제: Ctrl + Shift + R

### API 연결 실패
1. DATABASE_URL 환경 변수 확인
2. Node.js API 서버 로그 확인
3. Railway → Logs 탭에서 에러 확인

---

## 💰 비용

### Railway 무료 티어
- ✅ **$5 크레딧/월** (무료)
- ✅ 500시간 실행 시간
- ✅ 충분히 테스트 가능!

### Railway Pro (필요 시)
- $5/월 기본 + 사용량
- 무제한 프로젝트

### PostgreSQL (Railway 포함)
- Railway 무료 크레딧에 포함
- 소규모 프로젝트에 충분

### Firebase
- ✅ **무료 티어**: 1GB 저장소, 10GB/월 전송
- ✅ Analytics 무료

---

## 📞 지원

- **Railway 문서**: https://docs.railway.app
- **PostgreSQL 문서**: https://www.postgresql.org/docs/
- **Flutter 문서**: https://flutter.dev/docs

---

## 🎯 다음 단계

1. **지금**: Railway 배포 → 웹 테스트
2. **1주 후**: Railway PostgreSQL 연동 → 실제 데이터
3. **1개월 후**: Flutter 앱 개발 시작
4. **2개월 후**: Play Store 출시

---

**작성자**: AI Assistant  
**최종 업데이트**: 2026-02-06  
**버전**: Railway 전용 1.0  
