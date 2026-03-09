# 디자인 시스템 문서

이 폴더는 앱의 디자인 시스템 관련 문서를 관리합니다.

## 문서 목록

### [01-color-palette.md](./01-color-palette.md)
- 색상 팔레트 정의
- 라이트 테마 색상
- 다크 테마 색상
- 각 색상의 HEX 코드, 사용 목적, 인상

### [02-typography.md](./02-typography.md)
- 타이포그래피 시스템 정의
- 기본 폰트: Noto Sans KR
- 텍스트 스타일 정의 (제목1, 제목2, 본문1, 본문2, 버튼, 캡션)
- Flutter 적용 값 포함

### [03-component-styles.md](./03-component-styles.md)
- 컴포넌트 스타일 가이드
- App Bar, 버튼, 텍스트 필드, 카드, 리스트 아이템, 탭 바 등
- 각 컴포넌트의 기본 형태, 색상 규칙, 상태 변화 정의

### [04-design-audit.md](./04-design-audit.md) — NEW (2026-03-09)
- 전체 디자인 일관성 점검 보고서
- 화면별 문제점 목록 (홈, 게시판, 일정, 회원, 프로필)
- CSS 하드코딩/중복 선언 분석
- 개선 우선순위

### [05-component-improvement.md](./05-component-improvement.md) — NEW (2026-03-09)
- 홈 배너 기본 UI 개선안 (그라디언트 카드)
- 게시글 카드 디자인 강화안 (shadow, 구분선, 고정 배지)
- 프로필 카드 + 정보 그룹 + 액션 메뉴 개선안
- 하단 네비게이션 SVG 아이콘 전환안
- 홈 공지/일정 요약 카드 개선안

### [06-badge-tag-guide.md](./06-badge-tag-guide.md) — NEW (2026-03-09)
- N 배지 겹침 문제 해결안 (flex 레이아웃 규칙)
- 배지 유형 분류: 상태, 역할, 콘텐츠, 카테고리
- 각 배지별 크기/색상/배치 스펙
- 디자인 토큰 확장 제안 (CSS 변수)

### [07-unified-design-guide.md](./07-unified-design-guide.md) — NEW (2026-03-09)
- **통합 디자인 가이드**: 관리자 웹 + 회원 모바일 웹 톤 통일
- Primary 색상 통일: `#1F4FD8` → `#2563EB`
- 통일 디자인 토큰 35종 정의
- Shadow 3단계 체계 (sm/md/lg)
- 플랫폼별 허용 차이 정의

### [08-admin-web-design-guide.md](./08-admin-web-design-guide.md) — NEW (2026-03-09)
- **관리자 웹 전용 디자인 가이드**
- 레이아웃: Sidebar 240px + Header 64px + Main Content
- 컴포넌트 스펙: 버튼, 인풋, 테이블, 배지, 카드, 모달, Drawer
- 로그인 페이지 스플릿 스크린 디자인
- 반응형 규칙

### [09-mobile-color-alignment.md](./09-mobile-color-alignment.md) — NEW (2026-03-09)
- **회원 모바일 웹 색상 통일 가이드**
- CSS 변수 Before/After 명세 (변경 2건 + 신규 16건)
- 컴포넌트별 적용 가이드 (앱바, 버튼, 카드, 캘린더, 배지, 인풋)
- 시각적 변화 예상 분석

### [10-css-variable-migration.md](./10-css-variable-migration.md) — NEW (2026-03-09)
- **CSS 하드코딩 → 변수 전환 방안**
- 전환 대상 30건 (Primary, 상태, 캘린더, 관리자, 배지)
- 중복 선언 정리 3건
- 4단계 Phase 전환 계획 (변수 추가 → 하드코딩 전환 → Primary 변경 → 중복 정리)
- 검증 체크리스트

## 색상 팔레트 요약 (최신)

### 통일 Primary (2026-03-09 갱신)
- 주 색상: **`#2563EB`** (Primary) — 기존 `#1F4FD8`에서 변경
- Primary Hover: `#1D4ED8`
- Primary Light: `#93C5FD`
- Primary BG: `#EFF6FF`

### 라이트 테마
- 주 색상: `#2563EB` (Primary)
- 보조 색상: `#E6ECFA` (Secondary)
- 강조 색상: `#F59E0B` (Accent)
- 배경 색상: `#F9FAFB` (Background)
- 기본 텍스트: `#111827`
- 보조 텍스트: `#6B7280`
- 오류 색상: `#DC2626` (Error)

### 다크 테마 (참고용, 실제 미사용)
- 주 색상: `#4F7CFF` (Primary)
- 보조 색상: `#1E293B` (Secondary)
- 강조 색상: `#FBBF24` (Accent)
- 배경 색상: `#0F172A` (Background)
- 기본 텍스트: `#E5E7EB`
- 보조 텍스트: `#9CA3AF`
- 오류 색상: `#F87171` (Error)

> **참고**: 다크 테마 색상은 정의되어 있으나 실제 개발에서는 사용하지 않습니다.

## 테마 정책

**중요**: 사용자 스마트폰의 '다크/라이트' 환경에 종속적이지 않고, 이 앱은 무조건 '라이트' 기준으로만 개발된다. 이 앱의 '라이트' 테마는 독립적이고, 사용자 스마트폰 환경에 영향을 받지 않는다.

색상 팔레트 문서에 다크 테마 색상이 정의되어 있으나, 이는 참고용이며 실제 개발에서는 **라이트 테마만 사용**한다.

## 설계 원칙

- 커뮤니티 기반 앱 특성상 **신뢰감, 정돈됨, 공식성**을 우선
- 공지 / 일정 / 게시글 등 정보 위계가 명확히 드러나야 함
- 과도한 브랜드 컬러 사용 지양, **중립 색상 + 절제된 포인트**
- 라이트 테마 기준으로 가독성 우선

## 타이포그래피 스타일 요약

- 제목1: 22sp, w700, height 1.3
- 제목2: 18sp, w600, height 1.35
- 본문1: 15sp, w400, height 1.6
- 본문2: 14sp, w400, height 1.55
- 버튼: 15sp, w600, height 1.2
- 캡션: 12sp, w400, height 1.4

## 컴포넌트 스타일 요약

- App Bar: Primary Color 배경, 화면 제목 및 액션 아이콘
- 기본 버튼: 48dp 높이, 8dp cornerRadius, Primary Color
- 강조 버튼: Accent Color, 중요 액션용
- 텍스트 필드: 48dp 높이, 8dp cornerRadius, 포커스/오류 상태 지원
- 카드: 12dp cornerRadius, elevation 1~2, 게시글/공지/일정 공통
- 리스트 아이템: 최소 56dp 높이, 선택 상태 지원
- 탭 바: Primary Color 인디케이터, 선택/비선택 상태 구분

## 사용 방법

- **07~10번 문서가 최신 기준**입니다. 관리자 웹 명세를 반영한 통합 가이드입니다.
- **프론트엔드 에이전트에게**: `10-css-variable-migration.md`의 Phase 1~4 순서로 CSS 변경을 진행하세요.
- **색상 기준은 07번 문서의 Unified Design Tokens**를 따릅니다.

## 관련 문서

- PRD 문서: `../prd/08-design.md` - 화면 구조 및 기능 매핑
- 와이어프레임: `../wireframes/` - 화면별 텍스트 와이어프레임
