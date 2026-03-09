# 통합 디자인 가이드 (Unified Design Guide)

> 작성일: 2026-03-09
> 작성자: 디자이너 에이전트
> 목적: 관리자 웹 UI 명세를 기준으로 회원 모바일 웹 + 관리자 웹의 디자인 톤 통일

---

## 1. 현황 분석: 두 시스템의 차이

현재 프로젝트에는 **회원 모바일 웹**(`web/styles/main.css`)과 **관리자 웹**(`web/admin/admin.css`)이 별도의 CSS 변수 체계를 사용하고 있다.

### 1-1. 색상 비교

| 역할 | 모바일 웹 (현재) | 관리자 웹 (명세) | 통일안 |
|------|-----------------|-----------------|--------|
| **Primary** | `#1F4FD8` | `#2563EB` | **`#2563EB`** |
| Primary Hover | `#1a42b8` (하드코딩) | `#1D4ED8` | **`#1D4ED8`** |
| Primary Light | `#E6ECFA` | `#93C5FD` | 용도별 분리 (아래 참조) |
| **Danger / Error** | `#DC2626` | `#DC2626` | **`#DC2626`** (동일) |
| Danger Hover | `#b91c1c` (하드코딩) | `#B91C1C` | **`#B91C1C`** |
| Text Primary | `#111827` | `#111827` | **`#111827`** (동일) |
| Text Secondary | `#6B7280` | `#6B7280` | **`#6B7280`** (동일) |
| Border | `rgba(107,114,128,0.3)` | `#D1D5DB` | **`#D1D5DB`** |
| Background | `#F9FAFB` | `#F9FAFB` | **`#F9FAFB`** (동일) |
| Card Background | `white` | `#FFFFFF` | **`#FFFFFF`** (동일) |
| Success | `#10B981` | `#16a34a` (alert) | **`#10B981`** |
| Accent/Warning | `#F59E0B` | 미정의 | **`#F59E0B`** |

### 1-2. 레이아웃/컴포넌트 비교

| 속성 | 모바일 웹 | 관리자 웹 | 통일안 |
|------|-----------|-----------|--------|
| Card Radius | `12px` | `16px` | 모바일 `12px`, 관리자 `16px` (각자 유지) |
| Border Radius (일반) | `8px` | `8px` | **`8px`** (동일) |
| Content Padding | `16px~24px` | `32px` | 모바일 `16px`, 관리자 `32px` |
| Font Family | Noto Sans KR | Inter + Noto Sans KR | 관리자: Inter 우선, 모바일: Noto Sans KR 우선 |
| Shadow 체계 | 인라인 개별 값 | `sm/md/lg` 3단계 | **3단계 통일** |
| Button Height | `48px` | 자동 (padding) | 모바일 `48px` 유지, 관리자 padding 기반 |
| 변수 네이밍 | `--primary-color` | `--c-primary` | 각자 유지 (별도 CSS 파일) |

### 1-3. 핵심 결론

> **Primary 색상을 `#2563EB`로 통일**한다.
> 기존 모바일 웹의 `#1F4FD8`은 관리자 명세 `#2563EB`와 같은 Blue 계열이나 약간 더 진하다.
> 관리자 웹이 더 최신 명세이므로 `#2563EB`을 기준으로 삼는다.

---

## 2. 통일 디자인 토큰 (Unified Design Tokens)

### 2-1. 공통 색상 (Shared Color Tokens)

아래 색상은 **모바일 웹과 관리자 웹 모두 동일하게** 사용한다.

```
┌─────────────────────────────────────────────────────┐
│  SHARED COLOR TOKENS                                 │
├──────────────────┬──────────┬────────────────────────┤
│  Token           │  HEX     │  Usage                 │
├──────────────────┼──────────┼────────────────────────┤
│  primary         │ #2563EB  │ 주요 액션, 앱바, 버튼   │
│  primary-hover   │ #1D4ED8  │ Primary hover/pressed  │
│  primary-light   │ #93C5FD  │ 선택 하이라이트, 태그   │
│  primary-bg      │ #EFF6FF  │ Primary 배경, 아바타   │
│  primary-surface │ #E6ECFA  │ 섹션 배경, 칩 배경     │
│                  │          │                        │
│  danger          │ #DC2626  │ 에러, 삭제, N 배지     │
│  danger-hover    │ #B91C1C  │ Danger hover           │
│  danger-bg       │ #FEE2E2  │ 에러 배경              │
│  danger-text     │ #991B1B  │ 에러 텍스트 (배경 위)  │
│                  │          │                        │
│  success         │ #10B981  │ 성공, 활성 상태        │
│  success-bg      │ #ECFDF5  │ 성공 배경              │
│  success-text    │ #065F46  │ 성공 텍스트            │
│                  │          │                        │
│  warning         │ #F59E0B  │ 경고, 대기, Accent     │
│  warning-bg      │ #FEF3C7  │ 경고 배경              │
│  warning-text    │ #92400E  │ 경고 텍스트            │
│                  │          │                        │
│  text            │ #111827  │ 기본 텍스트            │
│  text-sub        │ #6B7280  │ 보조 텍스트            │
│  text-hint       │ #9CA3AF  │ 플레이스홀더, 힌트     │
│                  │          │                        │
│  border          │ #D1D5DB  │ 테두리, 구분선         │
│  bg              │ #F9FAFB  │ 페이지 배경            │
│  bg-card         │ #FFFFFF  │ 카드/패널 배경         │
│                  │          │                        │
│  purple-bg       │ #F3E8FF  │ 교육 카테고리          │
│  purple-text     │ #6B21A8  │ 교육 카테고리 텍스트   │
│  neutral-bg      │ #F3F4F6  │ 비활성, 기타           │
│  neutral-text    │ #6B7280  │ 비활성 텍스트          │
│  saturday        │ #2563EB  │ 토요일 텍스트          │
│  sunday          │ #DC2626  │ 일요일 텍스트          │
└──────────────────┴──────────┴────────────────────────┘
```

### 2-2. 공통 Shadow 체계

```
┌────────┬──────────────────────────────────────────────┬──────────────┐
│  등급  │  값                                          │  용도        │
├────────┼──────────────────────────────────────────────┼──────────────┤
│  sm    │  0 1px 3px rgba(0,0,0,0.08),                │  카드 기본   │
│        │  0 1px 2px rgba(0,0,0,0.06)                 │              │
├────────┼──────────────────────────────────────────────┼──────────────┤
│  md    │  0 4px 16px rgba(0,0,0,0.10)                │  카드 hover  │
├────────┼──────────────────────────────────────────────┼──────────────┤
│  lg    │  0 12px 40px rgba(0,0,0,0.15)               │  모달/드로어 │
└────────┴──────────────────────────────────────────────┴──────────────┘
```

### 2-3. 공통 Spacing 체계

```
┌────────┬────────┬──────────────────────────┐
│  Token │  Value │  Usage                   │
├────────┼────────┼──────────────────────────┤
│  xs    │  4px   │  최소 간격               │
│  sm    │  8px   │  아이콘-텍스트 간격      │
│  md    │  12px  │  카드 내부 요소 간격     │
│  lg    │  16px  │  섹션 내부 패딩          │
│  xl    │  24px  │  섹션 간 간격            │
│  2xl   │  32px  │  페이지 패딩 (관리자)    │
│  3xl   │  48px  │  대형 간격               │
└────────┴────────┴──────────────────────────┘
```

---

## 3. 플랫폼별 차이 (허용 범위)

아래 항목은 모바일/관리자 각각 다른 값을 사용하되, **톤은 통일**한다.

| 속성 | 모바일 웹 | 관리자 웹 | 이유 |
|------|-----------|-----------|------|
| Card Radius | `12px` | `16px` | 관리자는 넓은 화면에서 더 큰 radius가 자연스러움 |
| Content Padding | `16px` | `32px` | 모바일은 좁은 뷰포트 |
| Font Primary | Noto Sans KR | Inter, Noto Sans KR | 관리자는 영문 데이터(이메일, 날짜)가 많아 Inter 우선 |
| Button Style | Full-width `48px` | Inline padding 기반 | 모바일 터치 영역 vs 데스크탑 클릭 |
| AppBar | Primary 배경 + 흰색 텍스트 | 흰색 배경 + 다크 텍스트 | 모바일 앱 느낌 vs 대시보드 느낌 |

---

## 4. 디자인 원칙 (통합)

### 4-1. 색상 사용 원칙

1. **Primary Blue는 액션에만** — 버튼, 링크, 선택 상태에 사용. 배경/장식에 남용하지 않는다.
2. **상태 색상은 4색 체계** — Success(초록), Warning(노란), Danger(빨강), Neutral(회색).
3. **배경색은 3단계** — `bg`(페이지) < `bg-card`(카드) < `white`(강조). 깊이를 표현한다.
4. **텍스트는 2단계** — `text`(주) + `text-sub`(보조). 3단계 이상 구분하지 않는다.

### 4-2. 컴포넌트 원칙

1. **카드는 shadow + border-radius** — border 대신 shadow로 부유감 표현.
2. **인풋 포커스는 blue ring** — `box-shadow: 0 0 0 3px rgba(37,99,235,0.12)`.
3. **에러 인풋은 red border** — `border-color: danger`.
4. **버튼은 3종** — Primary(파란), Danger(빨간), Ghost(테두리). 그 외 버튼 색상 추가 금지.
5. **배지는 pill 형태** — `border-radius: 20px` 또는 원형, 소문자 금지.

### 4-3. 타이포그래피 원칙

| 레벨 | 모바일 | 관리자 | 용도 |
|------|--------|--------|------|
| Heading 1 | 22px / 700 | 18px / 600 | 페이지 제목 |
| Heading 2 | 18px / 700 | 17px / 700 | 섹션 제목 |
| Body | 15px / 400 | 14px / 400 | 본문 |
| Caption | 12px / 400 | 12~13px / 500 | 메타 정보, 힌트 |
| Button | 15px / 600 | 14px / 600 | 버튼 텍스트 |

---

## 5. Primary 색상 변경 영향도

`#1F4FD8` → `#2563EB` 변경 시 영향 받는 CSS:

| 영역 | 파일 | 변경 내용 |
|------|------|-----------|
| CSS 변수 | `main.css :root` | `--primary-color: #1F4FD8` → `#2563EB` |
| Hover 색상 | `main.css` 곳곳 | `#1a42b8` 하드코딩 → `var(--primary-hover)` = `#1D4ED8` |
| Secondary | `main.css :root` | `--secondary-color: #E6ECFA` 유지 (surface 역할) |
| Primary Light 추가 | `main.css :root` | `--primary-light: #93C5FD` 신규 추가 |
| Primary BG 추가 | `main.css :root` | `--primary-bg: #EFF6FF` 신규 추가 |

> **주의**: 이 변경은 시각적으로 미세한 차이(같은 Blue 계열)이므로 UX 영향은 최소.
> 단, 앱바 배경색이 약간 밝아지므로 시각 확인 필요.

---

## 6. 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-09 | 초판 작성 — 관리자 웹 명세 기반 통합 가이드 |
