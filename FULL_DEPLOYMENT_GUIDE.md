# 🚀 영등포 JC - 완전 배포 가이드 (웹 + 앱)

**날짜**: 2026-02-06  
**버전**: 1.0  

---

## 📋 전체 구조

```
웹 버전 (Vercel)
    ↓ ↑
백엔드 (Supabase)
    ↓ ↑
앱 버전 (Flutter → Firebase/Play Store/App Store)
```

---

## 🎯 1단계: GitHub 준비

### Fork 하기
1. **https://github.com/msgyeong/jc** 접속
2. 우측 상단 **Fork** 버튼 클릭
3. 본인 계정 `k50004950-ctrl`로 Fork 완료

### 로컬 저장소 설정
```powershell
cd C:\jcK
git remote set-url origin https://github.com/k50004950-ctrl/jc.git
git push -u origin main
```

✅ **완료 확인**: https://github.com/k50004950-ctrl/jc

---

## 🌐 2단계: 웹 버전 배포 (Vercel)

### 배포하기

#### 방법 A: Vercel 대시보드
1. **https://vercel.com** 접속
2. GitHub 계정으로 로그인
3. **"Add New..." → "Project"** 클릭
4. **`k50004950-ctrl/jc`** 선택
5. **설정:**
   - Root Directory: `web`
   - Framework Preset: Other
   - Build Command: (비워두기)
   - Output Directory: `.`
   - Install Command: (비워두기)
6. **Environment Variables 추가:**
   - `SUPABASE_URL` = (Supabase 프로젝트 URL)
   - `SUPABASE_ANON_KEY` = (Supabase Anon Key)
7. **Deploy** 클릭!

#### 방법 B: Vercel CLI
```powershell
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 디렉토리로 이동
cd C:\jcK\web

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 배포 후 URL
```
https://jc-k50004950.vercel.app
또는
https://your-custom-domain.com
```

---

## 🔥 3단계: Firebase 설정 (앱 대비)

### Firebase 프로젝트 생성

1. **https://console.firebase.google.com** 접속
2. **"프로젝트 추가"** 클릭
3. 프로젝트 이름: `yeongdeungpo-jc`
4. Google Analytics: 선택 (선택사항)
5. **프로젝트 만들기** 클릭

### Firebase 앱 등록

#### Android 앱 추가
1. Firebase 콘솔 → **프로젝트 설정**
2. **Android 앱 추가** 클릭
3. **Android 패키지 이름**: `com.yeongdeungpo.jc` (또는 pubspec.yaml 확인)
4. **google-services.json** 다운로드
5. `android/app/google-services.json`에 저장

#### iOS 앱 추가
1. Firebase 콘솔 → **프로젝트 설정**
2. **iOS 앱 추가** 클릭
3. **iOS 번들 ID**: `com.yeongdeungpo.jc` (또는 Xcode 확인)
4. **GoogleService-Info.plist** 다운로드
5. `ios/Runner/GoogleService-Info.plist`에 저장

### Firebase 설정 파일
```powershell
# Flutter Firebase 플러그인 추가
cd C:\jcK
flutter pub add firebase_core
flutter pub add firebase_analytics
```

---

## 🗄️ 4단계: Supabase 프로젝트 설정

### Supabase 프로젝트 생성
1. **https://supabase.com** 접속
2. **"New project"** 클릭
3. Organization: 선택 또는 생성
4. **프로젝트 이름**: `yeongdeungpo-jc`
5. **Database Password**: 강력한 비밀번호 생성
6. **Region**: Northeast Asia (Seoul) - `ap-northeast-2`
7. **Create new project** 클릭

### 데이터베이스 설정
1. Supabase Dashboard → **SQL Editor**
2. `Docs/schema/schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. **RUN** 클릭

### Storage 설정
1. **Storage** → **New bucket**
2. Bucket name: `profiles`
3. Public: **ON**
4. **Create bucket**

### RLS 정책 설정
SQL Editor에서:
```sql
-- Storage RLS 정책 (profiles 버킷)
CREATE POLICY "Anyone can view profiles"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own folder"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete from own folder"
ON storage.objects FOR DELETE
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 환경 변수 가져오기
1. **Settings** → **API**
2. **Project URL** 복사
3. **anon public** 키 복사

---

## 🔧 5단계: 환경 변수 설정

### 웹 버전 (web/js/config.js)
```javascript
const CONFIG = {
    SUPABASE_URL: 'https://xxxxx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGc...',
    DEMO_MODE: false  // 실제 배포 시 false
};
```

### Vercel 환경 변수
Vercel Dashboard → **Settings** → **Environment Variables**
- `SUPABASE_URL` = `https://xxxxx.supabase.co`
- `SUPABASE_ANON_KEY` = `eyJhbGc...`

### Flutter 앱 (.env)
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 📱 6단계: Flutter 앱 빌드 (추후)

### Android APK 빌드
```powershell
cd C:\jcK
flutter build apk --release
```
**출력**: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle (Play Store용)
```powershell
flutter build appbundle --release
```
**출력**: `build/app/outputs/bundle/release/app-release.aab`

### iOS 빌드 (Mac 필요)
```bash
flutter build ios --release
```

---

## 🚀 7단계: 앱 배포 (추후)

### Android - Google Play Store
1. **Google Play Console** 접속
2. 앱 만들기
3. `.aab` 파일 업로드
4. 내부 테스트 → 비공개 테스트 → 프로덕션

### iOS - Apple App Store
1. **App Store Connect** 접속
2. 새로운 앱 생성
3. Xcode에서 Archive
4. **TestFlight** 배포 (베타 테스트)
5. App Store 심사 제출

### 베타 테스트
- **Android**: Firebase App Distribution 또는 Google Play Internal Testing
- **iOS**: TestFlight

---

## 🏗️ 관리자 웹 (Next.js) - 추후

### 프로젝트 생성
```powershell
cd C:\jcK
npx create-next-app@latest admin-web --typescript --tailwind --app
cd admin-web
npm install @supabase/supabase-js zustand
```

### Vercel 배포
```powershell
cd C:\jcK\admin-web
vercel
```

---

## ✅ 배포 체크리스트

### 즉시 실행
- [ ] GitHub Fork 완료
- [ ] 로컬 → GitHub Push
- [ ] Vercel 웹 배포
- [ ] Supabase 프로젝트 생성
- [ ] Supabase 스키마 실행
- [ ] Supabase Storage 설정
- [ ] 웹 버전 환경 변수 설정
- [ ] 웹 버전 테스트 (로그인/회원가입)

### 추후 실행 (앱 개발 시)
- [ ] Firebase 프로젝트 생성
- [ ] Android/iOS 앱 등록
- [ ] Flutter 환경 변수 설정
- [ ] Android APK 빌드 및 테스트
- [ ] iOS 빌드 및 테스트 (Mac)
- [ ] Play Store 등록
- [ ] App Store 등록
- [ ] 관리자 웹 개발 (Next.js)

---

## 📊 배포 환경

### 개발 환경
- **웹**: http://localhost:8000
- **Flutter**: Android Emulator / iOS Simulator
- **Supabase**: Local Development (선택)

### 스테이징 환경
- **웹**: https://jc-staging.vercel.app
- **앱**: Firebase App Distribution (베타)

### 프로덕션 환경
- **웹**: https://jc.vercel.app (또는 커스텀 도메인)
- **Android**: Google Play Store
- **iOS**: Apple App Store

---

## 🔐 보안 설정

### Supabase RLS 확인
- [ ] members 테이블 RLS 활성화
- [ ] educations, careers, families RLS 활성화
- [ ] Storage policies 설정

### API 키 관리
- [ ] .env 파일 .gitignore 추가
- [ ] 프로덕션 키 별도 관리
- [ ] Vercel/Firebase에서만 키 설정

### CORS 설정
Supabase → **Settings** → **API**
- Allowed origins: `https://jc.vercel.app`

---

## 📱 앱 스토어 준비사항

### 공통
- [ ] 앱 아이콘 (1024x1024)
- [ ] 스플래시 스크린
- [ ] 스크린샷 (각 플랫폼별)
- [ ] 앱 설명 (한국어/영어)
- [ ] 개인정보 처리방침 URL
- [ ] 이용약관 URL

### Android (Google Play)
- [ ] 개발자 계정 ($25)
- [ ] 앱 서명 키
- [ ] 컨텐츠 등급

### iOS (App Store)
- [ ] Apple Developer 계정 ($99/년)
- [ ] 앱 서명 인증서
- [ ] App Store 심사 가이드라인 준수

---

## 🆘 트러블슈팅

### Vercel 배포 실패
→ Root Directory 확인: `web`
→ Build Command 비워두기

### Supabase 연결 실패
→ CORS 설정 확인
→ API 키 확인

### Flutter 빌드 오류
→ `flutter clean && flutter pub get`
→ Android/iOS 설정 확인

---

## 📞 지원

- **문서**: `Docs/` 폴더
- **체크리스트**: `Docs/tasks-web/WEB_VERSION_CHECKLIST.md`
- **테스트 보고서**: `Docs/tasks-web/WEB_VERSION_TEST_REPORT.md`

---

**작성자**: AI Assistant (Cursor)  
**최종 업데이트**: 2026-02-06  
**버전**: 1.0
