# JC 프로젝트 — Claude Code 공통 컨텍스트

> 이 파일은 Claude Code가 매 세션 시작 시 자동으로 읽는 프로젝트 지침입니다.

---

## 프로젝트 개요

- **프로젝트명**: 영등포 JC 회원관리 커뮤니티 앱
- **목적**: 영등포청년회의소(영등포JC) 회원 공지/게시글/일정/회원 정보 통합 관리
- **GitHub**: `msgyeong/jc`
- **배포 URL**: `https://jc-production-7db6.up.railway.app`

---

## 기술 스택 (확정)

| 영역 | 기술 |
|------|------|
| **프론트엔드 (웹앱)** | HTML, CSS, Vanilla JavaScript (SPA 방식) |
| **백엔드 API** | Node.js Express, JWT (jsonwebtoken + bcrypt) |
| **데이터베이스** | Railway PostgreSQL (pg 라이브러리) |
| **관리자 웹** | web/admin/ (HTML + JS, 동일 SPA 구조) |
| **배포** | Docker (Nginx + Node.js) → Railway 자동 배포 (main 브랜치 push) |
| **파일 스토리지** | Cloudinary (추후) |

### ⚠️ Flutter는 절대 사용하지 않음 — 최우선 규칙
- 이 프로젝트는 **하이브리드 웹앱** 단일 버전으로 개발합니다.
- `web/` 폴더(HTML/JS/CSS)가 **유일한** 프론트엔드입니다.
- `lib/` 폴더(Flutter)는 **완전 삭제됨**. Flutter 관련 파일/코드를 절대 생성하지 마세요.
- Flutter, Dart, Riverpod, GoRouter 관련 코드를 신규로 작성하지 마세요.
- **모든 신규 기능은 반드시 `web/js/`(프론트) + `api/routes/`(백엔드)에 구현하세요.**

### ⚠️ Supabase는 사용하지 않음
- Supabase 관련 코드, 패키지, 설정을 절대 추가하지 마세요.
- 기존 Supabase 코드가 남아있으면 제거 대상입니다.
- DB는 오직 Railway PostgreSQL만 사용합니다.

---

## 프로젝트 구조

```
E:/app/jc/
├── api/                    # Node.js Express API 서버
│   ├── server.js           # 메인 서버 (PORT || 3000)
│   ├── config/database.js  # Railway PostgreSQL 연결
│   ├── middleware/          # auth.js (JWT), errorHandler.js
│   ├── routes/             # auth, posts, notices, schedules, members, profile
│   └── utils/              # jwt.js, password.js
├── web/                    # 프론트엔드 웹앱 (실제 서비스 코드)
│   ├── index.html          # SPA 메인 페이지
│   ├── js/                 # JavaScript 모듈 (app, auth, api-client, 각 화면별)
│   ├── styles/main.css     # 전체 스타일
│   ├── admin/              # 관리자 콘솔 (별도 SPA)
│   └── image/              # 이미지 리소스
├── admin-web/              # 관리자 웹 (Next.js) — 미구현
├── database/migrations/    # SQL 마이그레이션 파일
├── Dockerfile              # Multi-stage: Node.js + Nginx
├── nginx.conf              # API 프록시 + 정적 파일
├── start.sh                # 컨테이너 시작 스크립트
└── Docs/                   # PRD, 태스크, 디자인 시스템 문서
    ├── prd/                # 00-overview ~ 08-design
    ├── tasks-web/          # 웹 구현 태스크
    ├── tasks-common/       # 공통 체크리스트
    ├── design-system/      # 색상, 타이포, 컴포넌트
    ├── wireframes/         # 화면별 와이어프레임
    └── user-flows/         # 유저 플로우
```

---

## 디자인 시스템

- **라이트 테마만 사용** (다크 테마 대응 불필요)
- Primary: `#1F4FD8` / Secondary: `#E6ECFA` / Accent: `#F59E0B`
- Background: `#F9FAFB` / Text: `#111827` / SubText: `#6B7280` / Error: `#DC2626`
- 폰트: Noto Sans KR
- 카드: cornerRadius 12, elevation 1~2
- 버튼: 높이 48, cornerRadius 8

---

## 현재 게시판 구조 (신규 설계)

하단 탭 "게시판" 하나에 **공지 게시판** / **일반 게시판** 두 개 서브탭을 운영한다.

```
┌─────────────────────────────────────┐
│  게시판                    [+ 작성]  │  ← AppBar
├──────────────┬──────────────────────┤
│  공지 게시판  │   일반 게시판         │  ← TabBar (서브탭)
├──────────────┴──────────────────────┤
│  [게시글 카드] ...무한 스크롤...      │  ← TabBarView
├─────────────────────────────────────┤
│  홈 │ 게시판 │ 일정 │ 회원 │ 프로필  │  ← 하단 탭
└─────────────────────────────────────┘
```

- **공지 게시판**: `category = 'notice'` — 관리자/지정 직책만 작성 (`can_post_notice = true`)
- **일반 게시판**: `category = 'general'` — 모든 승인된 회원 작성 가능
- **FAB(+)**: 공지탭은 권한자만, 일반탭은 모든 회원에게 노출
- **고정 공지**: `is_pinned = true` → 공지탭 상단 고정
- 댓글/대댓글(대대댓글 불가), 공감(토글), N배지(3일 이내+미읽음), 이미지(최대 5개) 동일 적용

---

## 회원 상태 체크 로직

| 조건 | 상태 |
|------|------|
| `is_approved = false`, `rejection_reason IS NULL` | 승인 대기 |
| `is_approved = false`, `rejection_reason IS NOT NULL` | 가입 거절 |
| `is_suspended = true` | 정지 |
| `withdrawn_at IS NOT NULL` 또는 `is_deleted = true` | 탈퇴 |
| `is_approved = true`, `is_suspended = false` | 정상 (로그인 허용) |

---

## API 응답 형식 표준

```json
// 성공
{ "success": true, "data": { ... } }

// 성공 (목록)
{ "success": true, "data": { "items": [...], "total": 100, "page": 1, "totalPages": 5 } }

// 실패
{ "success": false, "error": "에러 메시지", "code": "ERROR_CODE" }
```

---

## 개발 규칙

1. **SQL은 반드시 파라미터화 쿼리** ($1, $2) 사용 — SQL 인젝션 방지
2. **에러는 인라인 표시** — 스낵바 대신 해당 입력 필드 하단에 표시
3. **빈 상태, 로딩 상태, 에러 상태 UI 필수**
4. **하드코딩 금지** — 상수는 constants 파일에
5. **soft delete 사용** — deleted_at 필드 설정
6. **Supabase 코드 금지** — Railway PostgreSQL + Express API만 사용

---

## 팀 에이전트 구성

이 프로젝트는 **팀 에이전트** 체제로 운영됩니다. 5개 에이전트가 **하나의 팀**으로 협업합니다.

| 역할 | 설명 |
|------|------|
| **사장** | 최종 의사결정자, 지시 및 방향 설정 (사용자) |
| **기획자 에이전트** | PRD, 유저 플로우, 요구사항 정의 (`Docs/`) |
| **디자이너 에이전트** | UI/UX 디자인, 디자인 시스템 (`Docs/design-system/`) |
| **프론트엔드 에이전트** | `web/js/`, `web/styles/`, `web/index.html` 담당 |
| **백엔드 에이전트** | `api/` (Express 라우트, 미들웨어, DB 쿼리) 담당 |
| **테스터 에이전트** | 기능 테스트, API 테스트, 배포 검증 |

### ⚠️ 팀 협업 필수 규칙

1. **문서 기준 작업**: 모든 구현은 `Docs/` 폴더의 PRD, 와이어프레임, 디자인 시스템 문서를 먼저 확인하고 그 기준에 맞게 작업한다. 문서와 코드가 충돌하면 문서를 우선한다.
2. **디자인 통일성 필수**: 새 화면/컴포넌트 추가 시 반드시 `Docs/design-system/` 가이드를 따른다. 색상, 폰트, 간격, 카드 스타일 등 기존 디자인과 일관성을 유지해야 한다. 독자적으로 새 스타일을 만들지 않는다.
3. **팀 단위 사고**: 각 에이전트는 독립적으로 일하지 않는다. 프론트엔드 변경은 백엔드 API 스펙을 확인하고, 백엔드 변경은 프론트엔드 호출부를 확인한다. 기획/디자인 문서가 있으면 반드시 참조한다.
4. **작업 이력 기록**: 에이전트별 로그를 `Docs/agent-logs/`에 남겨 세션이 끊겨도 이어서 작업할 수 있게 한다.

### ⚠️ 품질 완성 사이클 — 한 번에 끝내기

기능 하나를 구현할 때 아래 사이클을 **한 세션 안에서** 완료한다. 사장님에게 반복 수정을 요청받는 일이 없도록 한다.

```
① 기획 확인  →  ② 구현  →  ③ 테스터 검증  →  ④ 비교/수정  →  ⑤ 완료
```

| 단계 | 담당 | 행동 |
|------|------|------|
| **① 기획 확인** | 기획자 | PRD·와이어프레임·정책 문서에서 해당 기능 요구사항을 정리. 빠진 부분이 있으면 문서를 먼저 보완 |
| **② 구현** | 디자이너 + 프론트 + 백엔드 | 디자인 시스템 준수하며 구현. 프론트↔백엔드 API 스펙 맞춤 확인 |
| **③ 테스터 검증** | 테스터 | 실제 API 호출 + UI 동작을 검증. 기획 문서·디자인 가이드와 **비교 대조** |
| **④ 비교/수정** | 전원 | 테스터가 발견한 불일치·버그를 즉시 수정. 기획 문서가 부족하면 기획자가 보완, 디자인 불일치면 디자이너·프론트가 수정, API 문제면 백엔드가 수정 |
| **⑤ 완료** | 테스터 | 수정 후 재검증하여 통과 확인. 통과해야 "완료" |

**핵심 원칙:**
- 테스터가 통과시키지 않은 기능은 **완료가 아니다**
- 문서와 실제 구현이 다르면 **문서를 기준으로 코드를 수정**한다 (문서가 틀린 경우에만 기획자가 문서 수정)
- 같은 버그로 사장님이 2번 이상 지적하는 일이 없도록 **한 사이클에서 끝낸다**

---

## 참고 문서 위치

- PRD: `Docs/prd/` (00~08)
- 게시판 정책: `Docs/tasks-common/02-0-board-and-schedule-policy.md`
- 디자인 시스템: `Docs/design-system/`
- 와이어프레임: `Docs/wireframes/`
- 팀 지시문: `Docs/team-board-directives.md`
