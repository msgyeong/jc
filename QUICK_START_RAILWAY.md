# 🚀 Railway 빠른 시작 가이드

## ⚡ 3단계로 배포 완료!

---

## 📌 1단계: GitHub Fork (1분)

### 방법:
1. **브라우저 열기**
2. https://github.com/msgyeong/jc 접속
3. 우측 상단 **"Fork"** 버튼 클릭
4. **"Create fork"** 클릭

✅ **완료!** → https://github.com/k50004950-ctrl/jc

---

## 📌 2단계: GitHub Push (1분)

### 방법 A: 자동 스크립트 (추천)
```
C:\jcK\deploy.bat 더블클릭
```

### 방법 B: 수동 실행
```powershell
cd C:\jcK
git remote set-url origin https://github.com/k50004950-ctrl/jc.git
git push -u origin main
```

✅ **완료!** → GitHub에서 코드 확인

---

## 📌 3단계: Railway 배포 (3분)

### 과정:

#### 1. Railway 접속
```
https://railway.app
```

#### 2. 로그인
- **"Login"** 클릭
- **GitHub 계정**으로 로그인

#### 3. 프로젝트 생성
- **"New Project"** 클릭
- **"Deploy from GitHub repo"** 선택
- **`k50004950-ctrl/jc`** 찾아서 선택

#### 4. 자동 배포 시작
```
✅ Dockerfile 감지
✅ Docker 이미지 빌드 중...
✅ 배포 중...
✅ 완료! 🎉
```

#### 5. URL 확인
- Railway Dashboard → **"Settings"** 탭
- **"Domains"** 섹션에서 URL 복사
- 예: `https://jc-production-xxxx.up.railway.app`

---

## 🎉 배포 완료!

### 테스트:
1. **브라우저에서 Railway URL 접속**
2. **회원가입 테스트** (데모 모드)
   - 아무 이메일/비밀번호 입력
   - 기본 정보 입력
   - "가입 신청" 클릭
   - ✅ 승인 대기 화면 표시

3. **로그인 테스트** (데모 모드)
   - 아무 이메일/비밀번호 입력
   - "로그인" 클릭
   - ✅ 홈 화면 표시

4. **모든 기능 테스트**
   - ✅ 홈 - 배너 슬라이드
   - ✅ 게시판 - 게시글 목록
   - ✅ 일정 - 날짜별 일정
   - ✅ 회원 - 검색 기능
   - ✅ 프로필 - 내 정보

---

## 🔄 코드 수정 시

### 자동 재배포:
```powershell
cd C:\jcK
# 1. 코드 수정
# 2. 커밋
git add .
git commit -m "Update something"
# 3. Push
git push
# 4. Railway가 자동으로 감지하고 재배포! (2-3분)
```

---

## 📱 앱 버전 개발 시 (추후)

### Railway PostgreSQL 연동:
1. **Railway에서 PostgreSQL 추가**
   - 프로젝트 → "+ New" → "Database" → "Add PostgreSQL"

2. **데이터베이스 초기화**
   - Railway PostgreSQL → Query 탭
   - `database/railway_init.sql` 실행

3. **웹에 적용**
   - Railway Variables에 DATABASE_URL 추가
   - 커밋 & Push → 자동 재배포

4. **Flutter 앱에 적용**
   - `.env` 파일 생성
   - API 서버 URL 추가
   - APK 빌드

---

## 💡 유용한 링크

- **웹사이트**: [Railway 배포 URL]
- **GitHub**: https://github.com/k50004950-ctrl/jc
- **Railway Dashboard**: https://railway.app/dashboard
- **Firebase**: https://console.firebase.google.com (추후)

---

## 📊 현재 상태

### ✅ 완료
- [x] 웹 버전 개발 100%
- [x] Railway 배포 설정
- [x] Docker 설정
- [x] Nginx 설정
- [x] 데모 모드 활성화

### 🚧 다음 단계
- [ ] Railway PostgreSQL 연동 (실제 DB)
- [ ] Flutter 앱 개발
- [ ] Play Store 출시
- [ ] 관리자 웹 개발

---

## 🎯 요약

```
1. Fork        (1분)   ✅
   ↓
2. Push        (1분)   ✅
   ↓
3. Railway     (3분)   ✅
   ↓
4. 배포 완료! 🎉
```

**총 소요 시간: 5분**

---

**작성일**: 2026-02-06  
**버전**: Quick Start 1.0  
