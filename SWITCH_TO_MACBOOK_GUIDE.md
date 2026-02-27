# 🍎 맥북으로 작업 환경 이전 가이드

Windows에서 MacBook으로 Cursor 작업 환경을 옮기는 완벽한 가이드입니다.

---

## 📋 준비 사항 체크리스트

현재 Windows에서 확인할 것:
- ✅ GitHub 계정 (k50004950-ctrl)
- ✅ 저장소 URL: https://github.com/k50004950-ctrl/jc.git
- ✅ 모든 변경사항 커밋/푸시 완료 ✅ (최신 커밋: 1ca2778)

---

## 🚀 맥북 설정 단계

### 1단계: 기본 개발 도구 설치 (10분)

#### 1-1. Homebrew 설치 (Mac 패키지 매니저)
맥북 터미널을 열고 (Cmd + Space → "터미널" 검색):

```bash
# Homebrew 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 설치 확인
brew --version
```

#### 1-2. Git 설치
```bash
# Git 설치
brew install git

# 버전 확인
git --version
# 예상 출력: git version 2.x.x
```

#### 1-3. Git 사용자 정보 설정
```bash
# 사용자 이름 설정 (Windows에서 사용하던 것과 동일하게)
git config --global user.name "k50004950-ctrl"

# 이메일 설정
git config --global user.email "k50004950@gmail.com"

# 설정 확인
git config --list
```

---

### 2단계: Cursor 설치 (5분)

#### 2-1. Cursor 다운로드 및 설치
1. **공식 사이트 접속**: https://cursor.sh
2. **"Download for Mac" 클릭**
3. **다운로드된 파일 실행**
   - `.dmg` 파일을 열고
   - Cursor 아이콘을 Applications 폴더로 드래그
4. **Cursor 실행**
   - Launchpad → Cursor 실행
   - 또는 Spotlight (Cmd + Space) → "Cursor" 검색

#### 2-2. Cursor 초기 설정
1. **GitHub 계정 로그인** (선택사항)
   - Settings → Account → Sign in with GitHub
   - Windows에서 사용하던 설정이 동기화됨

2. **확장 기능 자동 동기화**
   - GitHub 로그인 시 자동으로 동기화됨
   - 또는 수동으로 필요한 확장 설치

---

### 3단계: 프로젝트 클론 (5분)

#### 3-1. 작업 디렉토리 생성
```bash
# 홈 디렉토리로 이동
cd ~

# Documents 또는 원하는 위치에 작업 폴더 생성
mkdir -p ~/Documents/projects
cd ~/Documents/projects

# 또는 Desktop에 생성
# cd ~/Desktop
```

#### 3-2. GitHub 인증 설정 (SSH 키 - 권장)

**방법 1: SSH 키 사용 (권장)**

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "k50004950@gmail.com"
# Enter 3번 눌러서 기본 설정 사용

# SSH 키 복사
cat ~/.ssh/id_ed25519.pub
# 출력된 내용 전체를 복사 (ssh-ed25519로 시작)
```

**GitHub에 SSH 키 등록**:
1. https://github.com/settings/keys 접속
2. "New SSH key" 클릭
3. Title: "MacBook"
4. Key: 복사한 SSH 키 붙여넣기
5. "Add SSH key" 클릭

```bash
# SSH 연결 테스트
ssh -T git@github.com
# 성공 메시지: "Hi k50004950-ctrl! You've successfully authenticated..."
```

**방법 2: HTTPS + Personal Access Token**

GitHub에서 토큰 생성:
1. https://github.com/settings/tokens 접속
2. "Generate new token (classic)" 클릭
3. 권한 선택: `repo` 전체 체크
4. 토큰 생성 후 **복사** (다시 볼 수 없음!)

#### 3-3. 프로젝트 클론

**SSH 사용 (권장)**:
```bash
# 프로젝트 클론
git clone git@github.com:k50004950-ctrl/jc.git

# 프로젝트 폴더로 이동
cd jc

# 브랜치 확인
git branch
# 출력: * main

# 최신 상태 확인
git log -1 --oneline
# 예상 출력: 1ca2778 deploy: Force Railway redeploy with collaborator changes
```

**HTTPS 사용**:
```bash
# 프로젝트 클론
git clone https://github.com/k50004950-ctrl/jc.git

# 사용자명 입력: k50004950-ctrl
# 비밀번호 입력: (Personal Access Token 붙여넣기)

cd jc
```

---

### 4단계: Cursor에서 프로젝트 열기 (1분)

#### 방법 1: Cursor에서 직접 열기
1. Cursor 실행
2. `File → Open Folder...`
3. `~/Documents/projects/jc` 선택
4. "Open" 클릭

#### 방법 2: 터미널에서 열기 (추천)
```bash
# 프로젝트 폴더에서
cd ~/Documents/projects/jc

# Cursor로 열기
cursor .

# 또는 code 명령어가 있다면
code .
```

---

### 5단계: 개발 환경 설정 (선택사항)

#### 5-1. Node.js 설치 (필요시)
```bash
# Node.js 설치
brew install node

# 버전 확인
node --version
npm --version
```

#### 5-2. Python 설치 (필요시)
```bash
# Python 3 설치 (보통 맥에 기본 설치되어 있음)
brew install python3

# 버전 확인
python3 --version
```

#### 5-3. PostgreSQL 클라이언트 설치 (선택)
```bash
# PostgreSQL 도구 설치
brew install postgresql

# 설치 확인
psql --version
```

---

## ✅ 설정 완료 확인

모든 설정이 완료되면 다음을 확인하세요:

```bash
# 프로젝트 디렉토리에서
cd ~/Documents/projects/jc

# 1. Git 상태 확인
git status
# 출력: On branch main, Your branch is up to date with 'origin/main'

# 2. 원격 저장소 확인
git remote -v
# 출력:
# origin  git@github.com:k50004950-ctrl/jc.git (fetch)
# origin  git@github.com:k50004950-ctrl/jc.git (push)

# 3. 최신 커밋 확인
git log -3 --oneline
# 1ca2778 deploy: Force Railway redeploy with collaborator changes
# 35570db deploy: Trigger Railway deployment
# 1f122f4 Merge pull request #1 from msgyeong/main

# 4. 파일 구조 확인
ls -la
# web/, database/, Dockerfile 등이 보여야 함
```

---

## 🔄 일반적인 작업 흐름

### 1. 맥북에서 작업 시작
```bash
# 프로젝트 폴더로 이동
cd ~/Documents/projects/jc

# 최신 코드 받기 (다른 컴퓨터에서 작업했을 경우)
git pull origin main

# Cursor로 열기
cursor .
```

### 2. 작업 후 저장
```bash
# 변경사항 확인
git status

# 파일 추가
git add .

# 커밋
git commit -m "작업 내용 설명"

# GitHub에 푸시
git push origin main
```

### 3. 공동개발자와 협업
```bash
# 공동개발자 코드 가져오기
git pull origin main

# 충돌 발생 시 해결 후
git add .
git commit -m "Merge from collaborator"
git push origin main
```

---

## 🍎 Mac 단축키 참고

### Cursor/VSCode 단축키
- **커맨드 팔레트**: `Cmd + Shift + P`
- **파일 검색**: `Cmd + P`
- **터미널 열기**: `Ctrl + ` (백틱)
- **사이드바 토글**: `Cmd + B`
- **저장**: `Cmd + S`
- **전체 저장**: `Cmd + Option + S`

### 시스템 단축키
- **앱 전환**: `Cmd + Tab`
- **창 닫기**: `Cmd + W`
- **앱 종료**: `Cmd + Q`
- **Spotlight 검색**: `Cmd + Space`
- **강제 종료**: `Cmd + Option + Esc`

---

## 🔧 문제 해결

### Git 인증 오류
```bash
# SSH 키 다시 추가
ssh-add ~/.ssh/id_ed25519

# 또는 HTTPS credential helper 설정
git config --global credential.helper osxkeychain
```

### Permission denied 오류
```bash
# SSH 키 권한 설정
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

### Cursor 명령어가 작동하지 않음
1. Cursor 실행
2. `Cmd + Shift + P`
3. "Shell Command: Install 'cursor' command in PATH" 검색 및 실행

---

## 📱 추가 팁

### Mac에서 터미널 단축키
- **탭 열기**: `Cmd + T`
- **탭 닫기**: `Cmd + W`
- **화면 지우기**: `Cmd + K` 또는 `clear`

### 유용한 Mac 도구
```bash
# 더 나은 터미널 (선택사항)
brew install --cask iterm2

# 더 나은 Git UI (선택사항)
brew install --cask sourcetree
```

---

## 🎯 요약: 빠른 시작 가이드

```bash
# 1. Git 설치 및 설정
brew install git
git config --global user.name "k50004950-ctrl"
git config --global user.email "k50004950@gmail.com"

# 2. SSH 키 생성 및 GitHub 등록
ssh-keygen -t ed25519 -C "k50004950@gmail.com"
cat ~/.ssh/id_ed25519.pub
# → GitHub에 등록: https://github.com/settings/keys

# 3. 프로젝트 클론
cd ~/Documents
mkdir projects && cd projects
git clone git@github.com:k50004950-ctrl/jc.git
cd jc

# 4. Cursor로 열기
cursor .
```

**완료!** 이제 맥북에서 작업을 이어갈 수 있습니다! 🎉

---

**작성일**: 2026-02-15  
**대상**: Windows → MacBook 전환  
**프로젝트**: JC App (jc repository)
