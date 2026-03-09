# 회원 모바일 웹 — 색상/톤 통일 가이드

> 작성일: 2026-03-09
> 작성자: 디자이너 에이전트
> 대상: `web/styles/main.css` (회원용 모바일 웹)
> 기준: [07-unified-design-guide.md](./07-unified-design-guide.md) 통합 디자인 토큰

---

## 1. 목표

관리자 웹(`admin.css`)과 동일한 색상 톤을 회원 모바일 웹에 적용하여,
**하나의 브랜드로 보이는 일관된 시각 경험**을 제공한다.

---

## 2. CSS 변수 변경 명세

### 2-1. 변경되는 변수

```css
/* === 현재 (Before) === */
:root {
    --primary-color: #1F4FD8;
    --secondary-color: #E6ECFA;
    --accent-color: #F59E0B;
    --error-color: #DC2626;
    --success-color: #10B981;
    --background-color: #F9FAFB;
    --text-primary: #111827;
    --text-secondary: #6B7280;
    --border-color: rgba(107, 114, 128, 0.3);

    --spacing-xs: 8px;
    --spacing-sm: 12px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;

    --border-radius: 8px;
    --border-radius-lg: 12px;

    --font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

    --transition: all 0.2s ease;
}

/* === 변경 후 (After) === */
:root {
    /* ── Primary ── */
    --primary-color: #2563EB;           /* 변경: #1F4FD8 → #2563EB */
    --primary-hover: #1D4ED8;           /* 신규 추가 */
    --primary-light: #93C5FD;           /* 신규 추가 */
    --primary-bg: #EFF6FF;              /* 신규 추가 */

    /* ── Secondary (Surface) ── */
    --secondary-color: #E6ECFA;         /* 유지 */

    /* ── Accent / Warning ── */
    --accent-color: #F59E0B;            /* 유지 */
    --warning-bg: #FEF3C7;             /* 신규 추가 */
    --warning-text: #92400E;           /* 신규 추가 */

    /* ── Danger / Error ── */
    --error-color: #DC2626;             /* 유지 */
    --error-hover: #B91C1C;            /* 신규 추가 */
    --error-bg: #FEE2E2;              /* 신규 추가 */
    --error-text: #991B1B;            /* 신규 추가 */

    /* ── Success ── */
    --success-color: #10B981;           /* 유지 */
    --success-bg: #ECFDF5;            /* 신규 추가 */
    --success-text: #065F46;           /* 신규 추가 */

    /* ── Neutral ── */
    --background-color: #F9FAFB;        /* 유지 */
    --text-primary: #111827;            /* 유지 */
    --text-secondary: #6B7280;          /* 유지 */
    --text-hint: #9CA3AF;              /* 신규 추가 */
    --border-color: #D1D5DB;            /* 변경: rgba(107,114,128,0.3) → #D1D5DB */
    --neutral-bg: #F3F4F6;            /* 신규 추가 */

    /* ── Special ── */
    --purple-bg: #F3E8FF;             /* 신규 추가 */
    --purple-text: #6B21A8;           /* 신규 추가 */
    --saturday-color: #2563EB;         /* 신규 추가 */
    --sunday-color: #DC2626;           /* 신규 추가 */

    /* ── Spacing ── */
    --spacing-xs: 8px;                  /* 유지 */
    --spacing-sm: 12px;                 /* 유지 */
    --spacing-md: 16px;                 /* 유지 */
    --spacing-lg: 24px;                 /* 유지 */
    --spacing-xl: 32px;                 /* 유지 */

    /* ── Radius ── */
    --border-radius: 8px;              /* 유지 */
    --border-radius-lg: 12px;          /* 유지 */

    /* ── Shadow (신규) ── */
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.10);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.15);

    /* ── Typography ── */
    --font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

    /* ── Transition ── */
    --transition: all 0.2s ease;
}
```

### 2-2. 변경 요약

| 구분 | 항목 | 변경 내용 |
|------|------|-----------|
| **변경** | `--primary-color` | `#1F4FD8` → `#2563EB` |
| **변경** | `--border-color` | `rgba(107,114,128,0.3)` → `#D1D5DB` |
| **신규** | `--primary-hover` | `#1D4ED8` |
| **신규** | `--primary-light` | `#93C5FD` |
| **신규** | `--primary-bg` | `#EFF6FF` |
| **신규** | `--error-hover` | `#B91C1C` |
| **신규** | `--error-bg` | `#FEE2E2` |
| **신규** | `--error-text` | `#991B1B` |
| **신규** | `--success-bg` | `#ECFDF5` |
| **신규** | `--success-text` | `#065F46` |
| **신규** | `--warning-bg` | `#FEF3C7` |
| **신규** | `--warning-text` | `#92400E` |
| **신규** | `--text-hint` | `#9CA3AF` |
| **신규** | `--neutral-bg` | `#F3F4F6` |
| **신규** | `--shadow-sm/md/lg` | 3단계 shadow 체계 |
| **신규** | `--saturday-color` | `#2563EB` |
| **신규** | `--sunday-color` | `#DC2626` |
| **유지** | 나머지 전부 | 값 변경 없음 |

---

## 3. 컴포넌트별 적용 가이드

### 3-1. 앱바 (AppBar)

```
변경 전: background-color: var(--primary-color);  /* #1F4FD8 */
변경 후: background-color: var(--primary-color);  /* #2563EB — 약간 밝아짐 */
```
- 변수를 통해 자동 적용됨. 추가 작업 없음.
- 시각적으로 약간 밝고 생동감 있는 블루로 변경.

### 3-2. 버튼

```css
/* Primary 버튼 hover — 하드코딩 제거 */
.btn-primary:hover:not(:disabled) {
    background-color: var(--primary-hover);  /* 기존: #1a42b8 하드코딩 */
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);  /* primary RGB 맞춤 */
}
```

### 3-3. 카드

```css
/* 카드 — shadow 변수 사용 */
.card {
    box-shadow: var(--shadow-sm);
}

.card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--primary-color);
}
```

### 3-4. 캘린더 요일 색상

```css
/* 토/일 색상 — 변수 사용 */
.cal-weekday.sat { color: var(--saturday-color); }
.cal-weekday.sun { color: var(--sunday-color); }
.cal-day.sat .cal-day-num { color: var(--saturday-color); }
.cal-day.sun .cal-day-num { color: var(--sunday-color); }
```

### 3-5. 배지

```css
/* 상태 배지 — 변수 사용 */
.status-badge.status-active {
    background: var(--success-bg);
    color: var(--success-text);
}

.status-badge.status-pending {
    background: var(--warning-bg);
    color: var(--warning-text);
}

.status-badge.status-suspended {
    background: var(--error-bg);
    color: var(--error-text);
}
```

### 3-6. 인풋 포커스

```css
/* 인풋 포커스 — 관리자 웹과 동일한 blue ring */
.form-group input:focus {
    outline: none;
    border-color: var(--primary-color);
    border-width: 2px;
    padding: 13px 15px;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);  /* 신규 추가 */
}
```

---

## 4. 시각적 변화 예상

### Primary 색상 비교

```
Before: #1F4FD8  ████████  (진한 남색 톤)
After:  #2563EB  ████████  (밝은 코발트 블루)
```

| 화면 | 시각적 변화 |
|------|------------|
| 앱바 | 약간 밝아짐 — 더 현대적인 느낌 |
| 버튼 | 약간 밝아짐 — 클릭 유도 효과 증가 |
| 링크 텍스트 | 거의 차이 없음 |
| 배지 (공지) | 약간 밝아짐 |
| 캘린더 선택 | 약간 밝아짐 |

> **결론**: 같은 Blue 계열 내 미세한 밝기 차이로, 전체 톤에 영향 없이 관리자 웹과 통일 가능.

---

## 5. Border Color 변경 영향

```
Before: rgba(107, 114, 128, 0.3)  ≈ 반투명 회색
After:  #D1D5DB                    ≈ 불투명 연한 회색
```

| 영향 | 설명 |
|------|------|
| 밝은 배경 위 | 거의 동일하게 보임 |
| 카드 테두리 | 약간 더 선명해짐 (불투명이므로) |
| 인풋 테두리 | 약간 더 선명해짐 |
| 구분선 | 약간 더 선명해짐 |

> **결론**: 시각적 차이 미미. 관리자 웹과 통일 + 불투명 값으로 예측 가능성 향상.
