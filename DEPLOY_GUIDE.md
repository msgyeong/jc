# Railway 배포 가이드

## 📋 준비 사항

### 1. GitHub Fork (필수!)
1. https://github.com/msgyeong/jc 접속
2. 우측 상단 **Fork** 버튼 클릭
3. 본인 계정(`k50004950-ctrl`)으로 Fork

### 2. Push 하기
Fork한 후:
```bash
cd C:\jcK
git push -u origin main
```

---

## 🚀 Railway 배포 방법

### 방법 A: 웹 버전만 배포 (권장)

웹 버전은 정적 파일이므로 **Vercel**이나 **Netlify**가 더 적합합니다!

#### Vercel 배포 (추천)

1. **Vercel 가입**
   - https://vercel.com
   - GitHub 계정으로 로그인

2. **프로젝트 Import**
   - "New Project" 클릭
   - `k50004950-ctrl/jc` 선택
   - "Import" 클릭

3. **설정**
   - Root Directory: `web`
   - Build Command: (비워두기)
   - Output Directory: (비워두기)
   - Install Command: (비워두기)

4. **Deploy** 클릭!

✅ 완료! 몇 분 후 `https://jc-xxx.vercel.app` 주소 생성

---

#### Netlify 배포 (대안)

1. **Netlify 가입**
   - https://netlify.com
   - GitHub 계정으로 로그인

2. **프로젝트 Import**
   - "Add new site" > "Import an existing project"
   - GitHub에서 `k50004950-ctrl/jc` 선택

3. **설정**
   - Base directory: `web`
   - Build command: (비워두기)
   - Publish directory: `.` (현재 디렉토리)

4. **Deploy** 클릭!

---

### 방법 B: Railway 배포 (전체 프로젝트)

**Railway는 Flutter 앱 전체를 배포하려는 경우에만 사용**

1. **Fork 확인**
   - https://github.com/k50004950-ctrl/jc 에 Fork 되어있는지 확인

2. **Railway 연결**
   - https://railway.com/new/github 접속
   - Fork한 레포지토리 `k50004950-ctrl/jc` 선택

3. **설정 추가 필요**
   - Railway에서 정적 파일 서빙 설정
   - 또는 별도 서버 설정 (Node.js, Python 등)

---

## 💡 추천 방법

### 웹 버전만 테스트:
→ **Vercel 사용** (가장 간단, 무료, 자동 배포)

### Flutter 앱 전체:
→ Firebase Hosting 또는 Google Cloud

### 백엔드 서버:
→ Railway 또는 Render.com

---

## 🔧 배포 후 할 일

### 1. Supabase 설정
`web/js/config.js` 파일 수정:
```javascript
const CONFIG = {
    SUPABASE_URL: 'YOUR_ACTUAL_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_ACTUAL_ANON_KEY',
    DEMO_MODE: false  // 실제 배포 시 false
};
```

### 2. 환경 변수 설정 (Vercel/Netlify)
- Dashboard에서 Environment Variables 설정
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## ✅ 테스트 체크리스트

배포 후:
- [ ] 로그인 페이지 접속 확인
- [ ] 회원가입 테스트
- [ ] 로그인 테스트
- [ ] 홈 화면 데이터 로드 확인
- [ ] 모든 탭 동작 확인
- [ ] 모바일 반응형 확인

---

**작성일**: 2026-02-06
