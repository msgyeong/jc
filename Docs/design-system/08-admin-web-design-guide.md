# 관리자 웹 디자인 가이드

> 작성일: 2026-03-09
> 작성자: 디자이너 에이전트
> 대상: `web/admin/` (관리자 콘솔)
> 기준: 사장님 제공 관리자 웹 UI 설계 명세

---

## 1. 레이아웃 구조

```
┌──────────────────────────────────────────────────────────┐
│  [Sidebar 240px]  │  [Header 64px]                       │
│                   ├──────────────────────────────────────┤
│  ┌─────────────┐  │  [Main Content]                      │
│  │ 브랜드 로고  │  │  padding: 32px                       │
│  ├─────────────┤  │                                      │
│  │ 메뉴 항목    │  │  ┌────────────────────────────────┐ │
│  │ · 대시보드   │  │  │  Page Toolbar                  │ │
│  │ · 가입 승인  │  │  ├────────────────────────────────┤ │
│  │ · 회원 관리  │  │  │  Table / Card Stack            │ │
│  │ · 게시판     │  │  │                                │ │
│  │ · 일정       │  │  │                                │ │
│  │ · 설정       │  │  └────────────────────────────────┘ │
│  ├─────────────┤  │                                      │
│  │ 사용자 정보  │  │                                      │
│  └─────────────┘  │                                      │
└──────────────────────────────────────────────────────────┘
```

### 레이아웃 메트릭

| 속성 | 값 | CSS 변수 |
|------|-----|----------|
| Sidebar Width | 240px | `--sidebar-w` |
| Header Height | 64px | `--header-h` |
| Content Padding | 32px | `--content-pad` |
| Card Radius | 16px | `--card-radius` |
| Modal/Drawer Width | 480px | `--modal-w` |

---

## 2. 색상 체계

### CSS 변수 (admin.css :root)

```css
:root {
    /* Primary (Action) */
    --c-primary:       #2563EB;    /* 주요 버튼, 선택 상태, 링크 */
    --c-primary-hover: #1D4ED8;    /* Primary hover */
    --c-primary-light: #93C5FD;    /* 하이라이트, 진행 표시 */
    --c-primary-bg:    #EFF6FF;    /* 아바타 배경, 선택 배경 */

    /* Danger (Destructive) */
    --c-danger:        #DC2626;    /* 삭제, 거절, 에러 */
    --c-danger-hover:  #B91C1C;    /* Danger hover */
    --c-danger-bg:     #FEE2E2;    /* 에러 배경 */

    /* Success */
    --c-success:       #10B981;    /* 승인, 활성 */
    --c-success-bg:    #ECFDF5;

    /* Warning */
    --c-warning:       #F59E0B;    /* 대기, 주의 */
    --c-warning-bg:    #FEF3C7;

    /* Neutral */
    --c-text:          #111827;    /* 기본 텍스트 */
    --c-text-sub:      #6B7280;    /* 보조 텍스트 */
    --c-text-hint:     #9CA3AF;    /* 플레이스홀더 */
    --c-border:        #D1D5DB;    /* 테두리 */
    --c-bg:            #F9FAFB;    /* 페이지 배경 */
    --c-bg-card:       #FFFFFF;    /* 카드 배경 */

    /* Shadow */
    --shadow-sm:  0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
    --shadow-md:  0 4px 16px rgba(0,0,0,0.10);
    --shadow-lg:  0 12px 40px rgba(0,0,0,0.15);
}
```

---

## 3. 컴포넌트 스펙

### 3-1. 사이드바

| 속성 | 값 |
|------|-----|
| 배경 | `#111827` (dark) |
| 텍스트 (비활성) | `rgba(255,255,255,0.65)` |
| 텍스트 (hover) | `rgba(255,255,255,0.9)` |
| 활성 메뉴 배경 | `var(--c-primary)` |
| 활성 메뉴 텍스트 | `#FFFFFF` |
| 메뉴 아이템 padding | `10px 12px` |
| 메뉴 아이템 radius | `8px` |
| 구분선 | `rgba(255,255,255,0.08)` |
| 배지 (알림) | `var(--c-danger)` 배경, white 텍스트 |

### 3-2. 헤더

| 속성 | 값 |
|------|-----|
| 배경 | `var(--c-bg-card)` (white) |
| 높이 | `64px` |
| 하단 border | `1px solid var(--c-border)` |
| shadow | `var(--shadow-sm)` |
| 제목 | `18px`, weight 600 |
| 위치 | `fixed`, `left: sidebar-w`, `right: 0` |

### 3-3. 버튼

| 유형 | 배경 | 텍스트 | Hover 배경 | 용도 |
|------|------|--------|------------|------|
| Primary | `#2563EB` | white | `#1D4ED8` | 생성, 저장, 승인 |
| Danger | `#DC2626` | white | `#B91C1C` | 삭제, 거절, 정지 |
| Ghost | transparent, border | `--c-text-sub` | `--c-bg` | 취소, 보조 액션 |

공통 스타일:
- padding: `9px 18px`
- border-radius: `8px`
- font-size: `14px`, weight 600
- 버튼 그룹은 **우측 정렬** (`justify-content: flex-end`)

### 3-4. 인풋

| 상태 | border | shadow |
|------|--------|--------|
| 기본 | `1px solid #D1D5DB` | 없음 |
| 포커스 | `1px solid #2563EB` | `0 0 0 3px rgba(37,99,235,0.12)` |
| 에러 | `1px solid #DC2626` | 없음 |

공통 스타일:
- padding: `10px 12px`
- border-radius: `8px`
- font-size: `14px`
- 라벨: `13px`, weight 600, `margin-bottom: 6px`

### 3-5. 테이블

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | card-radius, shadow-sm, overflow hidden |
| th | `12px` uppercase, weight 600, `--c-text-sub`, bg: `--c-bg` |
| td | `14px`, padding `13px 16px` |
| 구분선 | `1px solid var(--c-border)` |
| hover | `background: #f8faff` |
| 빈 상태 | 중앙 정렬, `48px` padding, 아이콘 + 텍스트 |

### 3-6. 상태 배지

| 상태 | 배경 | 텍스트 | 클래스 |
|------|------|--------|--------|
| Active (활성) | `#dcfce7` | `#15803d` | `.badge-active` |
| Pending (대기) | `#fef9c3` | `#a16207` | `.badge-pending` |
| Suspended (정지) | `#fee2e2` | `#b91c1c` | `.badge-suspended` |

공통: `padding: 2px 8px`, `border-radius: 20px`, `font-size: 12px`, weight 600

### 3-7. 카드 (승인 목록, 회원 상세)

| 속성 | 값 |
|------|-----|
| 배경 | `var(--c-bg-card)` |
| 모서리 | `var(--card-radius)` = 16px |
| padding | `18px 20px` |
| shadow | `var(--shadow-sm)` |
| hover shadow | `var(--shadow-md)` |
| 아바타 | 44px, 원형, `#EFF6FF` 배경 |

### 3-8. 모달

| 속성 | 값 |
|------|-----|
| max-width | `var(--modal-w)` = 480px |
| small modal | `380px` |
| 모서리 | `var(--card-radius)` = 16px |
| shadow | `var(--shadow-lg)` |
| 오버레이 | `rgba(0,0,0,0.4)` |
| 애니메이션 | `scaleIn 0.15s ease` |
| 헤더 padding | `20px 24px 16px` |
| 바디 padding | `20px 24px` |
| 푸터 | 우측 정렬, `border-top` |

### 3-9. Drawer (슬라이드 패널)

| 속성 | 값 |
|------|-----|
| width | `480px` |
| shadow | `var(--shadow-lg)` |
| 방향 | 우측에서 슬라이드 |
| 배경 오버레이 | `rgba(0,0,0,0.35)` |
| 애니메이션 | `slideIn 0.2s ease` |
| 헤더 | 제목 + 닫기 버튼, `border-bottom` |
| 바디 | 스크롤 가능, padding `24px` |

---

## 4. 로그인 페이지 디자인

### 레이아웃: 스플릿 스크린

```
┌─────────────────┬──────────────────┐
│  브랜드 패널     │  로그인 폼 패널   │
│  (480px)        │  (나머지)         │
│                 │                   │
│  그라디언트 배경  │  흰색 배경        │
│  #312e81 →      │                   │
│  #4338ca →      │  [로그인 폼]      │
│  #6366f1        │  max-width: 380px │
│                 │                   │
│  로고 + 설명    │  이메일/비밀번호   │
│  기능 목록      │  로그인 버튼      │
└─────────────────┴──────────────────┘
```

| 속성 | 값 |
|------|-----|
| 브랜드 패널 배경 | `linear-gradient(155deg, #312e81, #4338ca, #6366f1)` |
| 헤드라인 | `48px`, weight 800 |
| 폼 인풋 높이 | `50px` |
| 폼 인풋 radius | `12px` |
| 로그인 버튼 | `#4f46e5`, height `52px`, radius `12px` |
| 모바일 (≤768px) | 브랜드 패널 숨김, 폼을 카드로 감싸서 표시 |

---

## 5. 정보 표시 패턴

### Info Row (키-값 표시)

```
┌──────────────────────────────────┐
│  이메일        hong@jc.com       │  <- key: 64px fixed, val: flex
│  ──────────────────────────────  │
│  휴대폰        010-1234-5678    │
│  ──────────────────────────────  │
│  가입일        2026-02-20       │
└──────────────────────────────────┘
```

- Key: `13px`, weight 600, `--c-text-sub`, width `64px`
- Value: `14px`, `--c-text`
- 구분선: `1px solid var(--c-border)`

### Section Title (섹션 제목)

- `12px`, weight 700, `--c-text-sub`, uppercase, `letter-spacing: 0.5px`
- `margin-bottom: 10px`

---

## 6. 반응형 규칙

| Breakpoint | 변경 |
|------------|------|
| ≤ 768px | 사이드바 숨김, 햄버거 메뉴 전환 |
| ≤ 768px | 로그인 브랜드 패널 숨김 |
| ≤ 768px | Content padding `16px`로 축소 |
| ≤ 480px | Drawer width `100vw` |
| ≤ 480px | Modal width `100%` |
