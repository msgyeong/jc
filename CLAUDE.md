# JC 프로젝트 — Claude Code 지침

## 프로젝트 개요
- **영등포 JC 회원관리 커뮤니티 앱** (하이브리드 웹앱)
- GitHub: `msgyeong/jc` / 배포: `https://jc-production-7db6.up.railway.app`
- 기술: HTML/CSS/Vanilla JS (SPA) + Node.js Express + Railway PostgreSQL
- 배포: Docker (Nginx + Node.js) → Railway 자동 배포 (main push)

## 절대 금지 사항
- **Flutter/Dart 사용 금지** — `web/js/` + `api/routes/`에서만 개발
- **Supabase 사용 금지** — Railway PostgreSQL만 사용

## 개발 규칙
1. SQL은 반드시 파라미터화 쿼리 ($1, $2) — SQL 인젝션 방지
2. 에러는 인라인 표시 (스낵바 X)
3. 빈 상태, 로딩 상태, 에러 상태 UI 필수
4. soft delete 사용 (deleted_at)
5. 디자인: `Docs/design-system/` 가이드 준수, 독자적 스타일 금지

## 디자인 시스템 (요약)
- 라이트 테마만 사용
- Primary: `#1F4FD8` / Accent: `#F59E0B` / Error: `#DC2626`
- 폰트: Noto Sans KR / 카드: radius 12 / 버튼: 높이 48, radius 8

## Git & 배포 규칙
- main 브랜치 push = Railway 자동 배포
- **작업 완료 시 확인 질문 없이 바로 commit & push**
- 사장님은 비개발자 — 기술적 확인 질문 하지 말 것, 자율 진행

## MCP 서버 활용 (필수)
- **Postgres MCP**: DB 스키마/데이터를 직접 쿼리 — 추측 금지, 확인 후 코딩
- **Playwright MCP**: 배포된 앱을 브라우저로 직접 열어서 버그 확인/검증
- **Sequential Thinking**: 복잡한 버그 분석, 기능 설계 시 구조화 사고
- 코드만 보고 추측하지 말고, MCP로 실제 상태를 확인한 후 작업할 것

## 작업 완료 검증 규칙 (강제 — 예외 없음)
- **"완료" 보고 전에 반드시 배포된 앱에서 MCP로 실제 검증할 것**
- 코드를 고쳤다 ≠ 실제로 고쳐졌다. 검증 없이 "완료"라고 보고하지 말 것
- 작업 유형별 필수 검증 방법:
  1. **버그 수정**: Playwright MCP로 해당 화면 열어서 버그가 재현되지 않는지 확인
  2. **기능 추가/변경**: Playwright MCP로 해당 기능을 실제로 동작시켜서 확인
  3. **데이터 삭제/수정**: Postgres MCP로 `SELECT COUNT(*)` 등 실제 DB 상태 조회
  4. **API 변경**: 배포된 URL(https://jc-production-7db6.up.railway.app)에 직접 API 호출해서 응답 확인
- 스크립트 출력만 보고 완료 보고 금지 — MCP 직접 조회 결과와 교차 검증 필수
- 검증 결과를 응답 요약에 포함할 것 (예: "Playwright로 확인: 댓글 등록 정상 동작")
- **검증 범위**: 새로 만든 기능뿐 아니라, 사장님이 지시한 모든 항목을 체크리스트로 만들어서 하나씩 검증할 것. "기능이 동작한다"만 보지 말고 "지시한 것이 전부 반영되었는지"를 확인할 것
- **"완료"라고 말하지 말 것**: "수정하고 push 했습니다. 확인 부탁드립니다"로 보고. 사장님이 OK 해야 완료

## 작업 로그 규칙 (강제 — 예외 없음)
- **작업자 식별**: 세션 시작 시 반드시 "나는 민수" 또는 "나는 우연" 선언을 확인할 것. 선언 없으면 먼저 물어볼 것
- **로그 폴더**: `Docs/work-logs/MS/` (경민수), `Docs/work-logs/WY/` (김우연)
- **일자별 로그 파일**: `2026-03-30.md` 형식으로 해당 작업자 폴더에 생성
- **새 날짜에 작업 시작되면 새 로그 파일 생성** (이전 날짜 로그는 보존)
- **로그 파일 내용 (필수 형식)**:
  ```
  # 작업 로그 — 2026-03-30 (MS 또는 WY)

  ## 지시 1: (사장님 지시 원문 요약)
  - [ ] 항목 1 — 미검증
  - [x] 항목 2 — Postgres MCP 검증 완료
  - [x] 항목 3 — Playwright MCP 검증 완료

  ## 지시 2: ...
  ```
- **작업 흐름**: 지시 접수 → 체크리스트 작성 → 각 항목 작업 → MCP 검증 → 체크 표시 → 전부 체크 후 완료 보고
- 체크되지 않은 항목이 있으면 "완료"라고 보고하지 말 것

## 팀 에이전트 규칙
- 문서 기준 작업 (문서 vs 코드 충돌 시 문서 우선)
- 같은 버그 2번 이상 지적받지 않도록 한 사이클에 끝내기
- MCP 도구를 적극 활용하여 검증 (상세: 아래 문서)
- 상세: [`Docs/claude-reference/team-agent-rules.md`](Docs/claude-reference/team-agent-rules.md)

## 응답 규칙 (강제)
- **모든 작업 완료 후 반드시 아래 형식의 요약을 응답 마지막에 포함할 것**
- 중간 과정이 길어도, 최종 응답 끝에 요약 블록을 넣어서 사장님이 스크롤 없이 결과를 확인할 수 있게 한다

```
---
📋 **주문 요약**: (사장님이 요청한 내용을 1~2줄로 요약)
✅ **처리 결과**: (실제로 한 일과 결과를 bullet으로 정리)
🤖 **사용 모델**: Opus 4.6 / Sonnet 4.6 (실제 사용한 모델 표기)
🔧 **활용 MCP**: Postgres, Playwright, Sequential Thinking 등 (실제 사용한 것만)
---
```

- 이 요약은 생략 불가 — 어떤 작업이든 반드시 포함
- 짧은 질문에 대한 짧은 답변이라도 요약 블록 포함

## 참고 문서
| 문서 | 위치 |
|------|------|
| 프로젝트 구조 | [`Docs/claude-reference/project-structure.md`](Docs/claude-reference/project-structure.md) |
| 게시판·회원·API 명세 | [`Docs/claude-reference/board-and-member-spec.md`](Docs/claude-reference/board-and-member-spec.md) |
| 팀 에이전트 & 품질 사이클 | [`Docs/claude-reference/team-agent-rules.md`](Docs/claude-reference/team-agent-rules.md) |
| PRD | `Docs/prd/` (00~08) |
| 게시판 정책 | `Docs/tasks-common/02-0-board-and-schedule-policy.md` |
| 디자인 시스템 | `Docs/design-system/` |
| 와이어프레임 | `Docs/wireframes/` |
| 에이전트 작업 이력 | `Docs/agent-logs/` |
