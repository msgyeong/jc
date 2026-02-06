# GitHub 저장소 설정 및 공유

공동개발자와 코드를 공유하기 위한 GitHub 업로드 절차입니다.

## 1. GitHub에서 새 저장소 만들기

1. [GitHub](https://github.com) 로그인 후 **New repository** 클릭
2. **Repository name**: `jc` 또는 원하는 이름 입력
3. **Description**: (선택) 예: `영등포 JC 회원관리 Flutter 앱`
4. **Public** 선택 (비공개로 하려면 Private 선택)
5. **README, .gitignore, license 추가하지 않음** (이미 로컬에 있음)
6. **Create repository** 클릭

## 2. 로컬에서 remote 추가 후 푸시

저장소를 만든 뒤 GitHub에 표시되는 URL을 사용합니다.

**HTTPS 예시 (저장소 URL이 `https://github.com/사용자명/jc.git`인 경우):**

```powershell
cd e:\app\jc_v4\jc
git remote add origin https://github.com/사용자명/jc.git
git branch -M main
git push -u origin main
```

**SSH 예시 (SSH 키를 이미 등록한 경우):**

```powershell
git remote add origin git@github.com:사용자명/jc.git
git branch -M main
git push -u origin main
```

- `사용자명`을 본인 GitHub 사용자명(또는 조직명)으로 바꾸세요.
- 최초 푸시 시 GitHub 로그인 또는 토큰/SSH 인증이 필요할 수 있습니다.

## 3. 공동개발자 초대 (조직/비공개인 경우)

- 저장소 **Settings** → **Collaborators** → **Add people**에서 GitHub 계정으로 초대

## 4. 공동개발자가 클론하는 방법

```powershell
git clone https://github.com/사용자명/jc.git
cd jc
flutter pub get
```

환경 변수(`.env`)는 저장소에 포함되지 않으므로, 팀 내에서 안전하게 공유한 뒤 프로젝트 루트에 `.env` 파일을 만들어 두어야 합니다.
