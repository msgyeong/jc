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
| **앱 프론트엔드** | Flutter (Dart), Riverpod, Freezed, GoRouter |
| **백엔드 API** | Node.js Express, JWT (jsonwebtoken + bcrypt) |
| **데이터베이스** | Railway PostgreSQL (pg 라이브러리) |
| **관리자 웹** | Next.js 14+ (App Router), TypeScript, Zustand, Tailwind CSS, shadcn/ui |
| **배포** | Docker (Nginx + Node.js) → Railway 자동 배포 (main 브랜치 push) |
| **파일 스토리지** | Cloudinary (추후) |

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
├── lib/                    # Flutter 앱 소스
│   ├── models/             # Freezed 모델
│   ├── services/           # API 호출 서비스
│   ├── providers/          # Riverpod Provider
│   ├── screens/            # 화면 (board/, notices/, schedules/, members/, profile/)
│   ├── widgets/            # 공용 위젯
│   └── router/             # GoRouter (app_router.dart)
├── web/                    # Flutter 웹 빌드 출력 + 정적 HTML/JS (레거시)
├── admin-web/              # 관리자 웹 (Next.js) — 미구현
├── database/migrations/    # SQL 마이그레이션 파일
├── Dockerfile              # Multi-stage: Node.js + Nginx
├── nginx.conf              # API 프록시 + 정적 파일
├── start.sh                # 컨테이너 시작 스크립트
└── Docs/                   # PRD, 태스크, 디자인 시스템 문서
    ├── prd/                # 00-overview ~ 08-design
    ├── tasks-flutter/      # Flutter 구현 태스크
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

## 참고 문서 위치

- PRD: `Docs/prd/` (00~08)
- 게시판 정책: `Docs/tasks-common/02-0-board-and-schedule-policy.md`
- 게시판 태스크: `Docs/tasks-flutter/02-post-features.md`
- 공지/일정 태스크: `Docs/tasks-flutter/03-notice-and-schedule.md`
- 디자인 시스템: `Docs/design-system/`
- 와이어프레임: `Docs/wireframes/`
- 팀 지시문: `Docs/team-board-directives.md`
