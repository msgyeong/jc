# 🛠️ 개발 환경 설치 가이드 (Windows)

## 📋 현재 상태

### ✅ 설치된 도구
- **Git**: 2.52.0 ✅

### ❌ 설치 필요한 도구
- **Node.js**: ❌ (Railway CLI에 필요)
- **Python**: ❌ (선택사항)
- **PostgreSQL**: ❌ (로컬 개발용, 선택사항)

---

## 🚀 빠른 설치 (추천)

### 방법 1: Scoop 패키지 매니저 사용 (가장 쉬움)

#### Step 1: Scoop 설치
PowerShell을 **관리자 권한**으로 실행 후:

```powershell
# 실행 정책 변경
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Scoop 설치
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

#### Step 2: Node.js 설치
```powershell
scoop install nodejs
```

#### Step 3: Python 설치 (선택사항)
```powershell
scoop install python
```

#### Step 4: PostgreSQL 설치 (선택사항)
```powershell
scoop install postgresql
```

---

### 방법 2: 개별 설치 프로그램 (GUI)

#### 1. Node.js 설치
1. **다운로드**: https://nodejs.org/ko
2. **LTS 버전** (Long Term Support) 다운로드
3. 설치 프로그램 실행
4. 기본 설정으로 설치 (Next 계속 클릭)
5. 설치 완료 후 **터미널 재시작**

**확인:**
```powershell
node --version
npm --version
```

#### 2. Python 설치 (선택사항)
1. **다운로드**: https://www.python.org/downloads/
2. Python 3.11 이상 다운로드
3. 설치 시 **"Add Python to PATH"** 체크 필수!
4. 설치 진행

**확인:**
```powershell
python --version
pip --version
```

#### 3. PostgreSQL 설치 (선택사항)
1. **다운로드**: https://www.postgresql.org/download/windows/
2. PostgreSQL 15 이상 다운로드
3. 설치 진행 (비밀번호 설정)

**확인:**
```powershell
psql --version
```

---

## 🎯 Railway CLI 설치 (Node.js 설치 후)

### Node.js 설치 확인 후 실행:

```powershell
# Railway CLI 설치
npm install -g @railway/cli

# 설치 확인
railway --version

# Railway 로그인
railway login

# 프로젝트 연결
cd e:\app\jc
railway link

# 배포
railway up

# 로그 확인
railway logs
```

---

## 🔧 설치 후 설정

### 1. 터미널 재시작
도구 설치 후 반드시 터미널을 재시작해야 PATH가 적용됩니다.

### 2. 설치 확인
```powershell
# 모든 도구 버전 확인
git --version
node --version
npm --version
python --version
railway --version
```

### 3. Railway 프로젝트 설정
```powershell
cd e:\app\jc

# Railway 로그인 (브라우저 열림)
railway login

# 프로젝트 연결
railway link
# 목록에서 "jc" 프로젝트 선택

# 배포
railway up
```

---

## 📊 각 도구의 필요성

### 🔴 필수 (Railway 배포용)
- **Node.js**: Railway CLI 실행에 필요
  - npm (Node Package Manager) 포함
  - Railway CLI 설치 가능

### 🟡 권장 (로컬 개발용)
- **Python**: 로컬 웹 서버 실행
  - `python -m http.server 8000`
  - 간단한 테스트용

### 🟢 선택 (고급 개발용)
- **PostgreSQL**: 로컬 데이터베이스
  - Railway PostgreSQL 대신 로컬 테스트
  - SQL 쿼리 연습

---

## 🚀 빠른 시작 (Node.js만 설치)

### 최소 설치로 Railway 배포:

```powershell
# 1. Node.js 다운로드 & 설치
# https://nodejs.org/ko → LTS 다운로드

# 2. 터미널 재시작

# 3. Railway CLI 설치
npm install -g @railway/cli

# 4. 프로젝트로 이동
cd e:\app\jc

# 5. Railway 로그인
railway login

# 6. 프로젝트 연결
railway link

# 7. 배포
railway up

# 8. 로그 확인
railway logs

# 9. URL 확인
railway open
```

**예상 소요 시간**: 10-15분

---

## 🐛 문제 해결

### "명령어를 찾을 수 없습니다"
**원인**: PATH 환경변수 미설정

**해결**:
1. 터미널 재시작
2. 여전히 안 되면:
   - Windows 검색 → "환경 변수"
   - 시스템 환경 변수 편집
   - Path 변수 확인
   - Node.js, Python 경로 추가

### npm 설치 느림
**원인**: 네트워크 또는 레지스트리 문제

**해결**:
```powershell
# npm 레지스트리 변경 (선택사항)
npm config set registry https://registry.npmjs.org/
```

### Railway CLI 설치 실패
**원인**: Node.js 버전 문제

**해결**:
```powershell
# Node.js 버전 확인 (14 이상 필요)
node --version

# 오래된 버전이면 재설치
scoop update nodejs
# 또는 공식 사이트에서 최신 LTS 다운로드
```

---

## 📝 설치 체크리스트

### 필수 설치
- [ ] Node.js 설치 완료
- [ ] npm 작동 확인
- [ ] Railway CLI 설치 완료
- [ ] Railway 로그인 완료
- [ ] 프로젝트 연결 완료

### 선택 설치
- [ ] Python 설치 (로컬 서버용)
- [ ] PostgreSQL 설치 (로컬 DB용)
- [ ] Git GUI 도구 (GitHub Desktop 등)

---

## 🎯 공동 개발자 환경과 동일하게 설정

공동 개발자가 설치한 도구들:
1. ✅ Node.js
2. ✅ Python
3. ✅ PostgreSQL
4. ✅ Git
5. ✅ Railway CLI
6. ✅ 한글 패치 (Windows 언어 설정)

### 한글 패치 설정
```
Windows 설정 → 시간 및 언어 → 언어
→ 한국어 추가 (이미 있으면 확인)
→ Windows 표시 언어: 한국어
```

---

## 💡 설치 없이 Railway 배포하는 방법

Railway CLI 없이도 배포 가능합니다:

### 방법 1: GitHub Push (자동 배포)
```powershell
# Git만 있으면 됨 (이미 설치됨)
git add .
git commit -m "update"
git push origin main

# Railway가 자동으로 감지하고 배포
```

### 방법 2: Railway 웹 대시보드
```
1. https://railway.app/dashboard
2. 프로젝트 선택
3. Deployments → Redeploy 클릭
```

**현재 상태**: Git이 이미 설치되어 있으므로 GitHub Push로 배포 가능! ✅

---

## 🚀 지금 바로 할 수 있는 일

### Node.js 없이도 가능한 작업:

1. **코드 수정**
   - VS Code / Cursor로 파일 편집
   - Git으로 커밋

2. **GitHub Push**
   ```powershell
   git add .
   git commit -m "update"
   git push origin main
   ```

3. **Railway 자동 배포**
   - GitHub Push하면 자동으로 배포됨
   - Railway 대시보드에서 확인

### Node.js 설치 후 가능한 작업:

1. **Railway CLI 사용**
   - 직접 배포: `railway up`
   - 로그 확인: `railway logs`
   - 환경변수 설정: `railway variables`

2. **npm 패키지 사용**
   - 다양한 개발 도구 설치
   - 프론트엔드 빌드 도구

---

## 📞 다음 단계

### 선택 1: Node.js 설치 (추천)
```
1. https://nodejs.org/ko 접속
2. LTS 버전 다운로드
3. 설치 후 터미널 재시작
4. npm install -g @railway/cli
5. railway login
```

### 선택 2: 지금 상태로 계속
```
1. Git으로 코드 푸시
2. Railway 웹 대시보드에서 배포 확인
3. 필요시 Redeploy 클릭
```

**추천**: Node.js 설치 (10분 소요, 이후 개발 훨씬 편리)

---

**설치 도움이 필요하신가요?** 
Node.js 설치부터 Railway CLI 사용까지 단계별로 도와드리겠습니다!
