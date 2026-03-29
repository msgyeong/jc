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
