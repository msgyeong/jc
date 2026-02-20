# 1단계: 프로젝트 설정 및 인증 시스템 구축

> **체크리스트·완료 기준**: **../tasks-common/01-project-setup-and-auth.md**와 동일합니다.

---

## 웹 구현 참고

- **설정**: `web/js/config.js`, `web/js/api-client.js`. Supabase 제거, API 베이스 URL(localhost:3000 / 배포 시 `/api`).
- **인증**: `web/js/auth.js`, `web/js/signup.js` — `apiClient.login/signup/logout/getMe`, JWT 저장.
- **화면**: 로그인·회원가입·승인대기·스플래시 — `web/index.html` 내 해당 screen, `navigateToScreen()`.
- **백엔드**: `api/routes/auth.js` (로그인/회원가입/me/logout). 08-railway-backend-api.md 참고.

완료 시 **tasks-common/01** 체크박스 동기화.
