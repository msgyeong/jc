# 디자이너 에이전트 작업 이력

> 담당: UI/UX 설계, 디자인 시스템 관리
> 담당 폴더: `Docs/design-system/`, `Docs/wireframes/`
> 규칙: `web/`, `api/` 파일은 절대 수정하지 않음

---

## 세션 1: 2026-03-09

### 작업 1: 전체 디자인 일관성 점검 + 컴포넌트 개선안
- **시간**: 2026-03-09
- **지시**: 사장님 — 앱 디자인 퀄리티가 출시 수준 미달, 디자인 가이드 정리
- **작업 내용**:
  1. `web/styles/main.css` (2300줄+) 전체 분석
  2. 배포 화면 스크린샷 5종 분석 (홈, 게시판, 일정, 회원, 프로필)
  3. 문제점 17건 식별 (심각 2, 중간 2, 경미 2 + CSS 이슈 다수)
- **산출물**:
  - `Docs/design-system/04-design-audit.md` — 점검 보고서 (화면별 문제, CSS 하드코딩 8건, 중복 3건)
  - `Docs/design-system/05-component-improvement.md` — 5개 영역 개선안 (배너, 카드, 프로필, 네비, 홈요약)
  - `Docs/design-system/06-badge-tag-guide.md` — 배지/태그 통일 가이드 (N배지 겹침 해결, 4유형 스펙)
  - `Docs/design-system/README.md` 업데이트
- **상태**: 완료

### 작업 2: 관리자 웹 명세 기반 통합 디자인 시스템 업데이트
- **시간**: 2026-03-09 (작업 1 직후)
- **지시**: 사장님 — 관리자 웹 UI 설계 명세 공유, 디자인 톤 통일
- **참고 자료**: 관리자 웹 명세 (Primary #2563EB, Card Radius 16px, Sidebar 240px 등)
- **분석 내용**:
  - `web/admin/admin.css` (1239줄) 전체 분석
  - `web/admin/index.html` 구조 확인
  - 모바일 웹 vs 관리자 웹 색상/레이아웃 차이 비교
- **핵심 결정**:
  - Primary 색상 통일: `#1F4FD8` → `#2563EB` (관리자 명세 기준)
  - Border 색상 통일: `rgba(107,114,128,0.3)` → `#D1D5DB`
  - Shadow 3단계 체계 도입: sm/md/lg
  - CSS 변수 16건 신규 추가 필요
- **산출물**:
  - `Docs/design-system/07-unified-design-guide.md` — 통합 디자인 가이드 (토큰 35종, 원칙 정의)
  - `Docs/design-system/08-admin-web-design-guide.md` — 관리자 웹 전용 (레이아웃, 10종 컴포넌트)
  - `Docs/design-system/09-mobile-color-alignment.md` — 모바일 색상 통일 (Before/After 명세)
  - `Docs/design-system/10-css-variable-migration.md` — 하드코딩 전환 4단계 Phase 계획
  - `Docs/design-system/README.md` 업데이트
- **상태**: 완료

---

## 세션 2: 2026-03-10

### 작업 3: 모바일 앱 색상 리뉴얼 가이드
- **시간**: 2026-03-10
- **지시**: 사장님 — "색상이 너무 컬러풀하고 촌스럽다" 피드백
- **분석 내용**:
  - `web/styles/main.css` 전체 색상 사용 현황 분석
  - `web/js/home.js` 배너 SVG 그라디언트 3종 색상 확인 (블루/초록/보라)
  - `web/js/members.js`, `web/js/profile.js` 아바타 8색 랜덤 배열 확인
  - `web/js/schedules.js` 카테고리 5색 확인
  - 관리자 배지 `#8B5CF6`(보라) 등 Primary 톤과 불일치 색상 식별
- **핵심 결정**:
  - **"Blue + Gray" 2톤 베이스** 원칙 확정
  - 배너 3종 → 블루 계열 그라디언트 통일 (명도 차이로 구분)
  - 아바타 8색 랜덤 → 단일 톤 (#DBEAFE 배경 + #2563EB 이니셜)
  - 배지 원색 배경 → 연한 배경 + 진한 텍스트 스타일 통일
  - N배지 사용 기준 정리 (3일+미읽음, 홈에서 최대 2개, 하단 네비는 dot만)
  - 제거 대상 색상: 핑크, 보라, 시안, 주황, 초록(배너) 등 6색
- **산출물**:
  - `Docs/design-system/11-mobile-color-renewal.md` — 모바일 색상 리뉴얼 가이드
    - Before/After 매핑표 (배너, 아바타, 네비, 배지, 일정, 프로필 등 7개 영역)
    - N배지 사용 기준 + 최대 개수 제한
    - 프로필 카드 색상 개선안
    - 프론트엔드 전달용 7단계 Phase 작업 목록
- **상태**: 완료

---

## 세션 3: 2026-03-10

### 작업 4: 중기 스프린트 UI 가이드 (출석 투표 + 전화걸기)
- **시간**: 2026-03-10
- **지시**: 사장님 — 중기 스프린트 UI 가이드 작성 (Blue+Gray 2톤 기반)
- **산출물**:
  - `Docs/design-system/12-attendance-vote-ui.md` — 출석 투표 UI 가이드
    - 투표 카드 레이아웃 (모임명, 날짜, 장소, 3버튼)
    - 참석/불참/미정 버튼 Default + Active 상태 (색상, border, shadow, 체크 아이콘)
    - 참석 현황 바 차트 (3색 세그먼트 + 범례)
    - 참석자 명단 리스트 (아바타 + 이름 + 직책 + 상태 배지)
    - 모바일 반응형 (480px, 360px 브레이크포인트)
    - 인터랙션 가이드 (토글, 재선택, 애니메이션)
    - 빈 상태 / 로딩 / 마감 상태 UI
  - `Docs/design-system/13-click-to-call-ui.md` — 전화걸기 UI 가이드
    - 회원 목록 전화 아이콘 위치 (우측 끝, flex)
    - SVG 아이콘 규격 (20×20, stroke: currentColor, stroke-width: 1.5)
    - 전화번호 텍스트 스타일 (파란색 밑줄, 연한 밑줄 색 #93C5FD)
    - 40×40 터치 영역 래퍼
    - 전화번호 미등록 비활성 상태
    - 접근성 (aria-label, 스크린리더 호환)
- **상태**: 완료

---

## 현재 디자인 시스템 파일 목록

| # | 파일 | 상태 | 설명 |
|---|------|------|------|
| 01 | `01-color-palette.md` | 구버전 | 초기 색상 정의 (Primary #1F4FD8 — 변경 예정) |
| 02 | `02-typography.md` | 구버전 | 타이포 정의 (Flutter 참조 포함 — 정리 필요) |
| 03 | `03-component-styles.md` | 구버전 | 컴포넌트 기본 정의 (AppBar만) |
| 04 | `04-design-audit.md` | **최신** | 디자인 점검 보고서 |
| 05 | `05-component-improvement.md` | **최신** | 컴포넌트 개선안 |
| 06 | `06-badge-tag-guide.md` | **최신** | 배지/태그 가이드 |
| 07 | `07-unified-design-guide.md` | **최신** | 통합 디자인 가이드 (기준 문서) |
| 08 | `08-admin-web-design-guide.md` | **최신** | 관리자 웹 전용 |
| 09 | `09-mobile-color-alignment.md` | **최신** | 모바일 색상 통일 |
| 10 | `10-css-variable-migration.md` | **최신** | CSS 변수 전환 계획 |
| 11 | `11-mobile-color-renewal.md` | **최신** | 모바일 색상 리뉴얼 가이드 (촌스러움 해결) |
| 12 | `12-attendance-vote-ui.md` | **최신** | 출석 투표 UI 가이드 |
| 13 | `13-click-to-call-ui.md` | **최신** | 전화걸기 (Click-to-Call) UI 가이드 |

---

## 다음 작업 (TODO) — 프론트엔드에 전달 대기

아래 항목은 **사장님 승인 후 프론트엔드 에이전트가 실행**해야 함:

- [ ] `main.css` :root에 신규 CSS 변수 16건 추가 (Phase 1)
- [ ] 하드코딩 색상 30건 → 변수 참조로 전환 (Phase 2)
- [ ] `--primary-color: #2563EB` 변경 + `--border-color: #D1D5DB` 변경 (Phase 3)
- [ ] 중복 선언 3건 정리 (Phase 4)
- [ ] 홈 배너 기본 UI 구현 (05번 문서)
- [ ] N 배지 겹침 수정 (06번 문서)
- [ ] 하단 네비 이모지 → SVG 전환 (05번 문서)
- [ ] 프로필 액션 버튼 추가 (05번 문서)
- [ ] 게시글 카드 shadow 강화 (05번 문서)

## 디자이너 에이전트 추가 TODO

- [ ] 01~03번 구버전 문서를 07번 기준으로 갱신 (사장님 요청 시)
- [ ] 와이어프레임 업데이트 (`Docs/wireframes/`)
- [ ] 반응형 디자인 가이드 작성 (모바일 480px 이하)
- [ ] 색상 리뉴얼 적용 후 전체 스크린 시각 검증
