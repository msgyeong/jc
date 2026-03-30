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
- Primary: `#2563EB` / Accent: `#F59E0B` / Error: `#DC2626`
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

## 모바일 퍼스트 개발 규칙 (강제 — 예외 없음)

> **이 앱의 실 사용 환경은 모바일 폰이다. PC 크롬은 테스트 도구일 뿐이다.**
> PC에서 잘 보이는데 폰에서 깨지면 그것은 버그다. 폰에서 정상 동작해야 완료다.

### 1. 모바일 기준 개발 원칙
- **모든 UI 작업은 모바일 뷰포트(375×667) 기준으로 먼저 개발**한다
- PC/태블릿은 모바일이 정상인 상태에서 추가 대응한다
- 가로 스크롤이 생기면 버그다. 모든 요소는 뷰포트 너비 안에 들어와야 한다
- 터치 타겟 최소 44×44px — 손가락으로 누를 수 없는 버튼은 버그다

### 2. CSS 모바일 필수 규칙
- `viewport` 메타 태그: `width=device-width, initial-scale=1.0` 필수
- 고정 px 너비 사용 금지 — `width: 350px` 같은 코드 금지. `max-width: 100%`, `width: 100%`, `flex`, `%` 사용
- `overflow-x: hidden`으로 가로 스크롤 숨기지 마라 — 원인을 찾아 고쳐라
- 폰트 크기 최소 13px — 12px 이하는 모바일에서 가독성 불량
- 버튼/입력 필드 높이 최소 44px — iOS/Android 터치 가이드라인
- `-webkit-tap-highlight-color: transparent` — 터치 시 깜빡임 방지
- `user-select: none` — 버튼/카드 등 인터랙티브 요소에 적용 (텍스트 선택 방지)
- Safe Area 대응: `padding-bottom: env(safe-area-inset-bottom)` — 노치/홈바 대응

### 3. 모바일 네비게이션 규칙 (절대 위반 금지)
- **로그아웃을 제외한 모든 뒤로가기는 이전 화면으로 돌아간다** — 하드코딩된 목적지로 보내지 마라
- 브라우저 뒤로가기(스와이프 백), 앱바의 ← 버튼, "목록으로" 버튼 모두 동일하게 이전 화면으로 돌아가야 한다
- 폼 작성 중 뒤로가기 → 확인 팝업 필수 ("작성 중인 내용이 저장되지 않습니다")
- 하단 탭 전환은 뒤로가기 스택을 초기화해도 됨 (탭 간 이동이므로)
- **iOS Safari의 스와이프 백** 제스처와 **Android 시스템 뒤로가기** 버튼 모두 대응해야 한다

### 4. 모바일 특수 이슈 필수 대응
- **iOS Safari**:
  - `position: fixed` 하단 요소가 키보드에 밀림 → `visualViewport` API 사용
  - `input` 포커스 시 화면 줌 → `font-size: 16px` 이상 설정 (16px 미만이면 iOS가 자동 줌)
  - 스크롤 바운스 → `-webkit-overflow-scrolling: touch` 또는 `overscroll-behavior: none`
  - 100vh가 실제 뷰포트보다 큼 → `dvh` 또는 JS `window.innerHeight` 사용
- **Android Chrome**:
  - 주소창 숨김/표시에 따라 뷰포트 높이 변동 → 고정 레이아웃에 주의
  - 하드웨어 뒤로가기 버튼 → `popstate` 이벤트로 반드시 처리
- **공통**:
  - 느린 네트워크(3G) 대응 → 로딩 상태 표시 필수, 이미지 lazy loading
  - 터치와 클릭 동시 발생 → `touchstart` + `click` 이중 실행 방지
  - 긴 목록 → 무한 스크롤 시 스크롤 위치 보존 (뒤로가기 시 원래 위치)

### 5. 모바일 테스트 검증 규칙
- **Playwright 검증 시 모바일 뷰포트(375×667)로 반드시 테스트**
- Playwright에서 `browser_resize`로 모바일 사이즈 설정 후 검증
- 다음 항목을 반드시 확인:
  1. 가로 스크롤 없음
  2. 하단 네비게이션 바가 컨텐츠를 가리지 않음
  3. 모든 버튼/링크가 터치 가능한 크기
  4. 입력 필드 포커스 시 화면이 깨지지 않음
  5. 스크롤 후 뒤로가기 시 이전 스크롤 위치 복원
- **PC 크롬에서만 테스트하고 "완료"라고 보고하지 마라** — 모바일 뷰포트 검증 필수

### 6. 모바일 성능 규칙
- JS 파일 합계 500KB 이하 유지 (비압축 기준)
- 이미지는 반드시 적절한 크기로 리사이즈 — 원본 그대로 올리지 마라
- CSS 애니메이션은 `transform`/`opacity`만 사용 — `width`/`height`/`top`/`left` 애니메이션 금지 (리플로우 유발)
- `scroll` 이벤트 리스너에 `passive: true` 필수

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
