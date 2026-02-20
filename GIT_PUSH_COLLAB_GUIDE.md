# 공동개발자 Git 푸시 가이드

이 저장소는 원격이 2개일 수 있습니다.

- `origin`: 푸시 가능한 원격 (권장)
- `k50004950`: 권한 문제로 푸시 실패할 수 있는 원격

## 권장 푸시 방법

항상 아래 명령으로 푸시하세요.

```bash
git pull --rebase origin main
git push origin main
```

## 더 쉬운 방법 (Windows)

루트 폴더에서 아래 배치 파일 실행:

```bash
push-origin.bat
```

이 스크립트는 다음을 자동 수행합니다.

1. `git fetch origin`
2. `git pull --rebase origin main`
3. `git push origin main`

## 실패 시 체크

- GitHub 로그인/토큰 권한 확인
- 브랜치 보호 규칙(필수 PR 등) 확인
- 충돌 발생 시 먼저 충돌 해결 후 재시도
