# 🟢 Railway 배포 확인 & 운영 루틴

아래 내용을 그대로 실행해줘.

1. 현재 `main` 브랜치가 최신인지 확인해줘.
   - `git fetch origin`
   - `git log origin/main --oneline -5`

2. 현재 main의 최신 커밋 해시를 알려줘.
   - `git rev-parse --short origin/main`

3. Railway 배포 상태를 확인하는 절차를 안내해줘:
   - Railway 대시보드: https://railway.app/dashboard
   - 프로젝트 → jc 서비스 → Deployments 탭
   - 최신 배포의 커밋 해시가 위 main 커밋 해시와 일치하는지 확인

4. Railway 자동 배포 권장 설정 체크리스트:
   - [ ] GitHub 레포: `msgyeong/jc` 연결 여부
   - [ ] 배포 브랜치: `main` 설정 여부
   - [ ] Builder: `Dockerfile` 사용 여부 (루트에 Dockerfile 존재)
   - [ ] 환경변수 설정: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
   - [ ] Health Check: `/health` 엔드포인트 응답 확인

5. 배포 실패 시 대응 절차:
   - Step 1: Railway → Deployments → 실패한 배포 클릭 → 로그 확인
   - Step 2: 오류 메시지 복사해서 Cursor에 붙여넣기 → 원인 파악
   - Step 3: 로컬에서 수정 후 `main`에 머지
   - Step 4: Railway 자동 재배포 대기 (또는 수동 Deploy 버튼 클릭)
