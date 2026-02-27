## Railway 배포 가이드

이 문서는 **공동 개발자**가 현재 레포를 Railway에 배포할 수 있도록
단계별로 정리한 가이드입니다.

백엔드는 `api/server.js` (Express), 프론트는 `web/` 정적 파일이며,
루트에 있는 `Dockerfile`, `nginx.conf`, `start.sh` 조합으로
Railway에서 동작하도록 구성되어 있습니다.

---

## 1. 사전 준비

- **GitHub 레포 권한**
  - 레포: `msgyeong/jc`
  - 공동 개발자가 이 레포에 **읽기 권한 이상**이 있어야 합니다.
- **Railway 계정**
  - 공동 개발자가 Railway 계정을 가지고 있어야 합니다.
  - 프로젝트 오너가 Railway 프로젝트에 **멤버 초대**를 해주면 가장 편합니다.

---

## 2. Railway 프로젝트 생성 및 GitHub 연동

1. 공동 개발자가 Railway에 로그인합니다.
2. **New Project** 버튼 클릭.
3. **Deploy from GitHub Repo** 선택.
4. GitHub 연동을 허용한 뒤, 레포 **`msgyeong/jc`** 를 선택합니다.
5. 서비스가 생성되면, Railway가 자동으로 루트의 `Dockerfile`을 감지합니다.
   - 별도의 **Build Command / Start Command** 입력은 필요 없습니다.
   - Dockerfile이 `start.sh`를 실행하도록 이미 설정되어 있습니다.

---

## 3. 데이터베이스 및 환경 변수 설정

### 3-1. PostgreSQL 생성 (Railway 플러그인 사용)

1. Railway 프로젝트 화면에서 **Add → Database → PostgreSQL** 선택.
2. 데이터베이스가 생성되면, 우측 상단의 **Variables** 탭에서
   `DATABASE_URL` 값을 확인할 수 있습니다.
3. API 서비스(이 레포에서 만든 서비스) 설정 화면으로 이동합니다.
4. **Variables** 탭에서 다음 환경 변수를 설정합니다.

- `DATABASE_URL`: 위에서 생성한 PostgreSQL의 접속 URL
- `JWT_SECRET`: JWT 서명을 위한 비밀 문자열
- `NODE_ENV`: `production`

Railway에서 데이터베이스를 **같은 프로젝트 안에서** 추가하면,
서비스에 `DATABASE_URL`이 자동으로 주입되기도 합니다.
그래도 **Variables 탭에서 값이 제대로 잡혀 있는지 한 번 확인**하는 것이 좋습니다.

### 3-2. PORT 변수

- Railway는 컨테이너 실행 시 `PORT` 환경 변수를 자동으로 넘겨줍니다.
- `start.sh`에서는 `PORT`가 비어 있으면 기본값 `80`을 사용하도록 되어 있습니다.
- 일반적으로 별도 설정 없이 Railway가 주는 `PORT`를 그대로 사용하면 됩니다.

---

## 4. 헬스체크 및 라우팅

- Docker 컨테이너 내부에서:
  - **웹(프론트)**: `http://localhost:$PORT/`
  - **API**: `http://localhost:$PORT/api`
  - **헬스체크**: `http://localhost:$PORT/health`
- `Dockerfile`에는 `/health` 엔드포인트를 기준으로 한 `HEALTHCHECK`가 이미 설정되어 있습니다.

Railway 대시보드에서 **Health** 관련 설정을 따로 만질 필요는 없지만,
배포 후 로그에서 `/health` 호출이 정상인지 확인하면 좋습니다.

---

## 5. 배포 플로우 (공동 개발자용)

1. **코드 변경**
   - 로컬에서 브랜치를 만들어 작업합니다.
   - `git push` 로 GitHub(`msgyeong/jc`)에 푸시합니다.
2. **Railway 자동 배포**
   - 기본 브랜치(예: `main` 또는 Railway에서 설정한 브랜치)에 푸시되면
     Railway가 자동으로 새 빌드 & 배포를 실행합니다.
   - 또는 Railway 웹에서 `Deploy` 버튼을 눌러 수동으로 재배포할 수도 있습니다.
3. **로그 확인**
   - Railway 서비스 상세 화면 → **Deployments / Logs** 탭에서
     `start.sh` 출력과 API 서버 로그를 확인합니다.
   - `DATABASE_URL` 또는 `JWT_SECRET` 미설정 시 경고 메시지가 찍히니 참고합니다.

---

## 6. 로컬 개발 참고 (선택)

공동 개발자가 로컬에서 API만 실행해 보고 싶을 경우:

```bash
cd api
npm install
cp .env.example .env   # 있다면, 또는 직접 .env 생성
# .env에 DATABASE_URL, JWT_SECRET 등 설정
npm run dev
```

프론트는 `web/` 아래 `index.html`을 브라우저로 직접 열거나,
간단한 정적 서버(예: `npx serve web`)를 사용해서 테스트할 수 있습니다.

---

## 7. 정리

- Railway 배포에 필요한 **Dockerfile / Nginx 설정 / 시작 스크립트**는
  이미 레포에 포함되어 있습니다.
- 공동 개발자는:
  - Railway에서 GitHub 레포 `msgyeong/jc`를 연결하고,
  - PostgreSQL 플러그인을 추가한 뒤,
  - `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV` 환경 변수만 올바르게 설정하면
  바로 배포 및 재배포를 진행할 수 있습니다.

