# 컴포넌트 가이드 v2.0 — 미니멀 리뉴얼

> 작성일: 2026-03-13
> 작성자: 디자이너 에이전트
> 관련: tokens.css, 이슈 #2 #3 #7 #9
> 방향: 무채색 + 딥네이비 1색, 그림자 최소, border 구분, iOS 참고

---

## 1. 디자인 원칙

1. **무채색 80% + 포인트 1색**: Gray 계열이 대부분, 딥 네이비(`#1E3A5F`)는 CTA와 활성 상태에만
2. **border > shadow**: 카드/섹션 구분은 `1px solid var(--color-border)`. 그림자는 모달/드로어만
3. **입력필드 경량화**: 높이 44px, 가벼운 테두리, 포커스 시 border-color만 변경
4. **여백으로 호흡**: 밀도 높은 UI 대신 충분한 여백 (16px padding, 12~16px gap)
5. **타이포 계층 2단계**: 진한(#111827) + 보조(#6B7280). 3단계 이상 금지

---

## 2. AppBar (헤더) — 리디자인

### Before → After

| 속성 | Before | After |
|------|--------|-------|
| 배경 | 파란 그라데이션 `#2563EB → #1D4ED8` | 흰색 `#FFFFFF` + 하단 border |
| 텍스트 | 흰색 | `#111827` (기본 텍스트) |
| 그림자 | `box-shadow` 있음 | 없음 (border만) |
| 높이 | padding 기반 | 56px 고정 |

### 스펙

```css
.app-bar {
    height: 56px;
    background: var(--appbar-bg);          /* #FFFFFF */
    color: var(--appbar-text);             /* #111827 */
    border-bottom: 1px solid var(--appbar-border);  /* #E5E7EB */
    padding: 0 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: none;
}

.app-bar-title {
    font-size: 17px;
    font-weight: 600;
    flex: 1;
    color: var(--color-text);
}

.back-button {
    background: none;
    border: none;
    color: var(--color-text);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 6px;
}

.back-button:hover {
    background: var(--color-bg-secondary);
}
```

---

## 3. 입력 필드 — 리디자인

### Before → After

| 속성 | Before | After |
|------|--------|-------|
| min-height | 48px | 44px |
| border | `1px solid var(--border-color)` | `1px solid #E5E7EB` |
| border-radius | 8px | 8px (유지) |
| font-size | 15px | 15px (유지) |
| focus | `border-width: 2px` + padding 조정 | `border-color: #1E3A5F` (width 유지) |
| focus shadow | 없음 | `0 0 0 2px rgba(30,58,95,0.08)` — 미세한 ring |

### 스펙

```css
/* 공통 입력 필드 */
input[type="text"],
input[type="email"],
input[type="password"],
input[type="tel"],
input[type="number"],
input[type="date"],
input[type="time"],
select,
textarea {
    width: 100%;
    min-height: var(--input-height);        /* 44px */
    padding: 10px 12px;
    border: 1px solid var(--input-border);  /* #E5E7EB */
    border-radius: var(--input-radius);     /* 8px */
    font-size: var(--input-font-size);      /* 15px */
    font-family: var(--font-family);
    color: var(--color-text);
    background: var(--input-bg);
    transition: border-color var(--duration-fast) var(--ease-default);
    box-sizing: border-box;
    outline: none;
}

input::placeholder,
textarea::placeholder {
    color: var(--input-placeholder);        /* #9CA3AF */
}

/* 포커스 — border color만 변경, width 유지 */
input:focus,
select:focus,
textarea:focus {
    border-color: var(--input-border-focus); /* #1E3A5F */
    box-shadow: 0 0 0 2px rgba(30, 58, 95, 0.08);
}

/* 에러 */
input.error,
select.error,
textarea.error {
    border-color: var(--color-error);
    box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.06);
}

/* 비활성 */
input:disabled,
select:disabled,
textarea:disabled {
    background: var(--color-bg-secondary);
    color: var(--color-text-disabled);
    cursor: not-allowed;
}
```

### textarea

```css
textarea {
    min-height: 100px;
    resize: vertical;
    line-height: var(--leading-relaxed);
}
```

---

## 4. 버튼 — 3종만

### 4-1. Primary (주요 액션)

```css
.btn {
    height: var(--btn-height);              /* 44px */
    border: none;
    border-radius: var(--btn-radius);       /* 8px */
    font-size: var(--btn-font-size);        /* 15px */
    font-weight: var(--btn-font-weight);    /* 600 */
    font-family: var(--font-family);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all var(--duration-fast) var(--ease-default);
    width: 100%;
}

.btn-primary {
    background: var(--color-primary);       /* #1E3A5F */
    color: #FFFFFF;
}

.btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover); /* #162D4A */
}

.btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
```

### 4-2. Ghost (보조 액션)

```css
.btn-ghost {
    background: transparent;
    color: var(--color-text-sub);
    border: 1px solid var(--color-border);
}

.btn-ghost:hover:not(:disabled) {
    background: var(--color-bg-secondary);
}
```

### 4-3. Danger (삭제/위험 액션)

```css
.btn-danger {
    background: var(--color-error);
    color: #FFFFFF;
}

.btn-danger:hover:not(:disabled) {
    background: var(--color-error-hover);
}
```

### 4-4. Text Button (인라인)

```css
.btn-text {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    padding: 4px 8px;
    cursor: pointer;
}

.btn-text:hover {
    text-decoration: underline;
}
```

---

## 5. 카드 — border 구분

```css
.card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);      /* 12px */
    padding: var(--card-padding);           /* 16px */
    /* 그림자 없음 — border로 구분 */
}
```

---

## 6. 토글 스위치 — 이슈 #2 (일정 첨부 토글)

### Before → After

| 속성 | Before | After |
|------|--------|-------|
| 스타일 | 체크박스 | iOS 스타일 토글 스위치 |
| 크기 | 18×18 체크박스 | 44×24px 토글 |
| ON | 체크마크 | 딥 네이비 (`#1E3A5F`) |
| OFF | 빈 체크박스 | 그레이 (`#D1D5DB`) |

### 스펙

```css
/* 토글 스위치 — CSS only */
.toggle-switch {
    position: relative;
    width: var(--toggle-width);             /* 44px */
    height: var(--toggle-height);           /* 24px */
    flex-shrink: 0;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
}

.toggle-switch .toggle-slider {
    position: absolute;
    inset: 0;
    background: var(--toggle-bg-off);       /* #D1D5DB */
    border-radius: var(--toggle-radius);    /* 9999px */
    cursor: pointer;
    transition: background var(--duration-normal) var(--ease-default);
}

.toggle-switch .toggle-slider::before {
    content: '';
    position: absolute;
    width: var(--toggle-knob-size);         /* 20px */
    height: var(--toggle-knob-size);        /* 20px */
    left: 2px;
    bottom: 2px;
    background: #FFFFFF;
    border-radius: 50%;
    transition: transform var(--duration-normal) var(--ease-default);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.toggle-switch input:checked + .toggle-slider {
    background: var(--toggle-bg-on);        /* #1E3A5F */
}

.toggle-switch input:checked + .toggle-slider::before {
    transform: translateX(20px);
}
```

### HTML 사용법

```html
<label class="toggle-switch">
    <input type="checkbox" />
    <span class="toggle-slider"></span>
</label>
```

---

## 7. 프로필 하단 메뉴 — 리디자인 (이슈 #7)

### Before → After

| 속성 | Before | After |
|------|--------|-------|
| 스타일 | 큰 컬러 버튼 나열 | iOS 설정 스타일 리스트 |
| 배경 | 각 버튼별 컬러 | 흰색 카드, 항목간 구분선 |
| 아이콘 | 없음 / 이모지 | SVG 아이콘 (20px) |
| 네비 | 없음 | 우측 `>` chevron |

### 스펙

```css
/* 설정 메뉴 리스트 */
.settings-group {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);        /* 12px */
    overflow: hidden;
    margin-bottom: var(--space-16);
}

.settings-group-title {
    font-size: var(--text-xs);              /* 12px */
    font-weight: var(--weight-semibold);
    color: var(--color-text-hint);          /* #9CA3AF */
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: var(--space-12) var(--space-16) var(--space-6);
}

.settings-item {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    padding: 14px var(--space-16);
    cursor: pointer;
    transition: background var(--duration-fast) var(--ease-default);
    border-bottom: 1px solid var(--color-divider);
}

.settings-item:last-child {
    border-bottom: none;
}

.settings-item:hover {
    background: var(--color-bg-secondary);
}

.settings-item:active {
    background: var(--color-border-light);
}

/* 아이콘 */
.settings-item-icon {
    width: 20px;
    height: 20px;
    color: var(--color-text-sub);
    flex-shrink: 0;
}

/* 텍스트 */
.settings-item-label {
    flex: 1;
    font-size: var(--text-base);            /* 15px */
    font-weight: var(--weight-regular);
    color: var(--color-text);
}

/* 우측 값/상태 */
.settings-item-value {
    font-size: var(--text-sm);
    color: var(--color-text-hint);
}

/* 우측 chevron > */
.settings-item-chevron {
    width: 16px;
    height: 16px;
    color: var(--color-text-disabled);      /* #D1D5DB */
    flex-shrink: 0;
}

/* 로그아웃 항목 — 빨간 텍스트 */
.settings-item--danger .settings-item-label {
    color: var(--color-error);
}

.settings-item--danger .settings-item-icon {
    color: var(--color-error);
}
```

### HTML 구조

```html
<!-- 프로필 하단 메뉴 -->
<div class="settings-group">
    <div class="settings-group-title">계정</div>

    <div class="settings-item" onclick="navigateTo('edit-profile')">
        <svg class="settings-item-icon"><!-- edit icon --></svg>
        <span class="settings-item-label">내 정보 수정</span>
        <svg class="settings-item-chevron"><!-- > --></svg>
    </div>

    <div class="settings-item" onclick="navigateTo('settings')">
        <svg class="settings-item-icon"><!-- settings icon --></svg>
        <span class="settings-item-label">환경설정</span>
        <svg class="settings-item-chevron"><!-- > --></svg>
    </div>
</div>

<div class="settings-group">
    <div class="settings-item settings-item--danger" onclick="handleLogout()">
        <svg class="settings-item-icon"><!-- logout icon --></svg>
        <span class="settings-item-label">로그아웃</span>
    </div>
</div>
```

### 프로필 히어로 리디자인

```css
/* 프로필 히어로 — 컬러 그라디언트 제거, 깔끔하게 */
.profile-hero {
    background: var(--color-bg-secondary);  /* 연한 그레이 */
    padding: 32px 16px 24px;
    text-align: center;
    border-bottom: 1px solid var(--color-border);
}

.profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--color-primary-bg);    /* #F0F4F8 */
    color: var(--color-primary);            /* #1E3A5F */
    font-size: 28px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
    border: 2px solid var(--color-border);
}

.profile-name {
    font-size: var(--text-xl);              /* 20px */
    font-weight: var(--weight-bold);
    color: var(--color-text);
    margin-bottom: 4px;
}

.profile-role-badge {
    display: inline-block;
    padding: 4px 12px;
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--color-primary);
    background: var(--color-primary-light);
    border-radius: var(--radius-full);
}
```

---

## 8. 환경설정 화면 — 이슈 #9

### 레이아웃

```
┌─────────────────────────────────────┐
│  ← 환경설정                          │  ← 흰색 AppBar + border
├─────────────────────────────────────┤
│  bg: #F9FAFB                         │
│                                      │
│  화면                      12px gray │  ← 그룹 타이틀
│  ┌──────────────────────────────┐   │
│  │  🌙 다크모드        [toggle] │   │  ← 토글 스위치
│  │  ─────────────────────────── │   │
│  │  🔤 글꼴 크기         보통 > │   │  ← 선택 + chevron
│  └──────────────────────────────┘   │
│                                      │
│  알림                                │
│  ┌──────────────────────────────┐   │
│  │  🔔 알림 설정              > │   │
│  └──────────────────────────────┘   │
│                                      │
│  데이터                              │
│  ┌──────────────────────────────┐   │
│  │  🗑️ 캐시 삭제              > │   │
│  └──────────────────────────────┘   │
│                                      │
│  계정                                │
│  ┌──────────────────────────────┐   │
│  │  🔒 비밀번호 변경           > │   │
│  │  ─────────────────────────── │   │
│  │  🚪 로그아웃                > │   │  ← 빨간 텍스트
│  │  ─────────────────────────── │   │
│  │  ⚠️ 회원 탈퇴               > │   │  ← 빨간 텍스트
│  └──────────────────────────────┘   │
│                                      │
│  정보                                │
│  ┌──────────────────────────────┐   │
│  │  📋 이용약관               > │   │
│  │  ─────────────────────────── │   │
│  │  🔐 개인정보 처리방침       > │   │
│  │  ─────────────────────────── │   │
│  │  ℹ️  앱 버전    v1.0.0 (웹앱) │   │  ← 텍스트만
│  └──────────────────────────────┘   │
│                                      │
└─────────────────────────────────────┘
```

### CSS

```css
.settings-screen {
    background: var(--color-bg-secondary);  /* #F9FAFB */
    min-height: 100vh;
}

.settings-content {
    padding: var(--space-16);
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
}

/* 토글 행 (다크모드 등) */
.settings-item--toggle {
    cursor: default;                        /* 토글이 있으므로 행 클릭 불필요 */
}

.settings-item--toggle:hover {
    background: transparent;
}

/* 앱 버전 (클릭 불가) */
.settings-item--static {
    cursor: default;
}

.settings-item--static:hover {
    background: transparent;
}
```

---

## 9. 배지 스타일 — 연한 배경 통일

```css
/* 모든 배지 공통 */
.badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    border-radius: var(--radius-full);
    line-height: 1.4;
}

/* 유형별 */
.badge-primary {
    background: var(--color-primary-light);
    color: var(--color-primary);
}

.badge-success {
    background: var(--color-success-bg);
    color: var(--color-success-text);
}

.badge-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning-text);
}

.badge-danger {
    background: var(--color-error-bg);
    color: var(--color-error-text);
}

.badge-neutral {
    background: var(--color-border-light);  /* #F3F4F6 */
    color: var(--color-text-sub);
}

/* N배지 (유일한 원색 배경 허용) */
.badge-new {
    background: var(--color-badge-new);     /* #DC2626 */
    color: #FFFFFF;
    font-size: 10px;
    font-weight: var(--weight-bold);
    padding: 1px 5px;
    min-width: 16px;
    text-align: center;
}
```

---

## 10. 아바타 — 단일 톤

```css
.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-primary-bg);    /* #F0F4F8 */
    color: var(--color-primary);            /* #1E3A5F */
    font-size: 15px;
    font-weight: var(--weight-semibold);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.avatar-lg {
    width: 80px;
    height: 80px;
    font-size: 28px;
}

.avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}
```

---

## 11. 하단 네비게이션

```css
.bottom-nav {
    height: var(--nav-height);              /* 56px */
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0;
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    max-width: 480px;
    width: 100%;
    z-index: 100;
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: var(--nav-inactive);             /* #9CA3AF */
    font-size: var(--nav-text-size);        /* 12px */
    text-decoration: none;
    cursor: pointer;
    position: relative;
    padding: 6px 0;
    transition: color var(--duration-fast) var(--ease-default);
}

.nav-item.active {
    color: var(--nav-active);               /* #1E3A5F */
}

.nav-item .nav-icon svg {
    width: var(--nav-icon-size);            /* 24px */
    height: var(--nav-icon-size);
    stroke: currentColor;
    stroke-width: 1.5;
    fill: none;
}

.nav-item.active .nav-icon svg {
    stroke-width: 2;
}

/* 미읽음 dot */
.nav-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-badge-new);
    position: absolute;
    top: 4px;
    right: calc(50% - 16px);
}
```

---

## 12. 다이얼로그 / 모달

```css
.dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
}

.dialog {
    background: var(--color-surface);
    border-radius: var(--radius-xl);        /* 16px */
    padding: 24px;
    max-width: 320px;
    width: 100%;
    box-shadow: var(--shadow-lg);
}

.dialog-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text);
    margin-bottom: 8px;
}

.dialog-body {
    font-size: var(--text-base);
    color: var(--color-text-sub);
    line-height: var(--leading-relaxed);
    margin-bottom: 20px;
}

.dialog-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.dialog-actions .btn {
    width: auto;
    min-width: 72px;
    height: 36px;
    font-size: var(--text-sm);
}
```

---

## 13. 리스트 아이템 (일반)

```css
.list-item {
    display: flex;
    align-items: center;
    gap: var(--space-12);
    padding: 12px var(--space-16);
    border-bottom: 1px solid var(--color-divider);
}

.list-item:last-child {
    border-bottom: none;
}
```

---

## 14. 색상 팔레트 요약

| 용도 | 색상 | HEX |
|------|------|-----|
| Primary (CTA, 활성) | 딥 네이비 | `#1E3A5F` |
| Primary Hover | 더 진한 네이비 | `#162D4A` |
| Primary Light (배지, 태그) | 아주 연한 회색블루 | `#E8EDF3` |
| Primary BG (아바타, 섹션) | 거의 흰색 | `#F0F4F8` |
| Background | 순백 | `#FFFFFF` |
| Background Secondary | 연한 그레이 | `#F9FAFB` |
| Border | 연한 그레이 | `#E5E7EB` |
| Text | 거의 검정 | `#111827` |
| Text Sub | 중간 그레이 | `#6B7280` |
| Text Hint | 연한 그레이 | `#9CA3AF` |
| Error | 빨강 | `#DC2626` |
| Success | 초록 | `#16A34A` |
| Warning | 호박 | `#D97706` |

---

## 15. 프론트엔드 전달 요약

### 마이그레이션 Phase

1. **Phase 1**: `tokens.css` 기반 CSS 변수 교체 (`:root` 재정의)
2. **Phase 2**: AppBar → 흰색 배경 + border 전환
3. **Phase 3**: 입력필드 높이 44px + 포커스 스타일 변경
4. **Phase 4**: 프로필 하단 → 설정 리스트 메뉴 전환
5. **Phase 5**: 토글 스위치 컴포넌트 추가
6. **Phase 6**: 아바타 단일 톤 통일
7. **Phase 7**: 배지 연한 배경 스타일 전환
8. **Phase 8**: 환경설정 화면 신규 구현

---

---

## 16. 인물카드 (Member Dossier) — ★핵심★

> CEO 비전: "국정원에서 프로필 띄워놓는 것처럼" 한 눈에 인물 정보를 파악
> 참조: `Docs/features/member-dossier-plan.md`

### 16-1. 전체 레이아웃

```
┌─────────────────────────────────────────┐
│  ← 회원 상세                   [편집]   │  AppBar
├─────────────────────────────────────────┤
│  ┌──────────┐                          │
│  │  프로필  │  김영등 (24px bold)       │  상단 프로필 카드
│  │  사진    │  회장 (뱃지)              │
│  │ (120×120)│  영등포JC · 제1분과       │
│  │          │  📞 010-1234-5678        │
│  └──────────┘  ✉️ kim@example.com      │
│                🏢 (주)영등포상사 대표    │
├─────────────────────────────────────────┤
│ [기본정보][JC이력][교육][활동]           │  수평 스크롤 탭 바
│ [경력][가족][취미][메모]                 │
├─────────────────────────────────────────┤
│  ※ 선택 탭 콘텐츠 영역                 │
└─────────────────────────────────────────┘
```

### 16-2. 상단 프로필 카드

```css
/* 상단 프로필 헤더 */
.dossier-header {
    background: var(--dossier-header-bg);           /* #F4F6F9 */
    border-bottom: 1px solid var(--dossier-header-border);
    padding: 24px 16px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
}

/* 프로필 사진 (120×120) */
.dossier-avatar {
    width: var(--dossier-avatar-size);              /* 120px */
    height: var(--dossier-avatar-size);
    border-radius: 50%;
    border: var(--dossier-avatar-border);           /* 3px solid border */
    background: var(--color-primary-bg);
    color: var(--color-primary);
    font-size: 40px;
    font-weight: var(--weight-bold);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
}

.dossier-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* 이름 + 정보 영역 */
.dossier-info {
    flex: 1;
    min-width: 0;
}

.dossier-name {
    font-size: var(--dossier-name-size);            /* 24px */
    font-weight: var(--dossier-name-weight);        /* 700 */
    color: var(--color-text);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.dossier-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.dossier-meta-row {
    font-size: var(--text-sm);
    color: var(--color-text-sub);
    display: flex;
    align-items: center;
    gap: 6px;
}

/* 연락처 링크 (탭하면 전화/메일) */
.dossier-contact-link {
    color: var(--color-primary);
    text-decoration: none;
    font-size: var(--text-sm);
}

.dossier-contact-link:hover {
    text-decoration: underline;
}
```

### 16-3. 수평 스크롤 탭 바 (8개 탭)

```css
/* 탭 바 컨테이너 — 가로 스크롤 */
.dossier-tabs {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;          /* Firefox */
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    position: sticky;
    top: 56px;                      /* AppBar 높이 아래 */
    z-index: 50;
}

.dossier-tabs::-webkit-scrollbar {
    display: none;                  /* Chrome/Safari */
}

/* 개별 탭 */
.dossier-tab {
    flex-shrink: 0;
    padding: 0 16px;
    height: var(--dossier-tab-height);              /* 44px */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--dossier-tab-font);             /* 13px */
    font-weight: var(--dossier-tab-weight);         /* 500 */
    color: var(--dossier-tab-color);                /* hint gray */
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: color var(--duration-fast) var(--ease-default),
                border-color var(--duration-fast) var(--ease-default);
}

.dossier-tab:hover {
    color: var(--color-text-sub);
}

.dossier-tab.active {
    color: var(--dossier-tab-active);               /* primary */
    border-bottom: var(--dossier-tab-indicator);    /* 2px solid primary */
    font-weight: var(--weight-semibold);
}

/* 탭 콘텐츠 영역 */
.dossier-content {
    padding: var(--space-16);
}
```

### 16-4. 정보 라벨+값 레이아웃 (2단 그리드)

```css
/* 기본정보 등 라벨-값 쌍 */
.info-grid {
    display: flex;
    flex-direction: column;
    gap: var(--info-row-gap);                       /* 12px */
}

.info-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-8);
}

.info-label {
    width: var(--info-label-width);                 /* 100px */
    flex-shrink: 0;
    font-size: var(--info-label-size);              /* 13px */
    color: var(--info-label-color);                 /* hint gray */
    font-weight: var(--weight-medium);
    padding-top: 2px;
}

.info-value {
    flex: 1;
    font-size: var(--info-value-size);              /* 15px */
    color: var(--info-value-color);                 /* 기본 텍스트 */
    line-height: var(--leading-normal);
    word-break: break-word;
}
```

### 16-5. 타임라인 컴포넌트 (JC 이력 — 세로 점선 + 이벤트)

```css
/* 타임라인 래퍼 */
.timeline {
    position: relative;
    padding-left: 24px;
}

/* 세로 선 */
.timeline::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 4px;
    bottom: 4px;
    width: var(--timeline-line-width);              /* 2px */
    background: var(--timeline-line-color);         /* border color */
}

/* 이벤트 항목 */
.timeline-item {
    position: relative;
    padding-bottom: var(--timeline-gap);            /* 24px */
}

.timeline-item:last-child {
    padding-bottom: 0;
}

/* 점 (dot) */
.timeline-item::before {
    content: '';
    position: absolute;
    left: -24px;
    top: 4px;
    width: var(--timeline-dot-size);                /* 10px */
    height: var(--timeline-dot-size);
    border-radius: 50%;
    background: var(--timeline-dot-bg);             /* 흰색 */
    border: var(--timeline-dot-border);             /* 2px solid primary */
}

/* 현재 직책 — 채워진 점 */
.timeline-item.current::before {
    background: var(--timeline-dot-color);          /* primary */
}

/* 기간 텍스트 */
.timeline-period {
    font-size: var(--text-xs);
    color: var(--color-text-hint);
    margin-bottom: 2px;
}

/* 직책/이벤트명 */
.timeline-title {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--color-text);
}
```

### 16-6. 교육/경력/가족 카드

```css
/* 리스트 카드 (교육, 경력) */
.dossier-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-12) var(--space-16);
    margin-bottom: var(--space-8);
}

.dossier-card-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text);
    margin-bottom: 2px;
}

.dossier-card-sub {
    font-size: var(--text-sm);
    color: var(--color-text-sub);
}

/* 수료/미수료 아이콘 */
.dossier-card-status--completed {
    color: var(--color-success);
}

.dossier-card-status--incomplete {
    color: var(--color-error);
}

/* 관리자 메모 (잠금) */
.dossier-memo {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-16);
    white-space: pre-wrap;
    font-size: var(--text-sm);
    color: var(--color-text-sub);
    line-height: var(--leading-relaxed);
}

/* 섹션 헤더 (탭 내 제목 + 추가 버튼) */
.dossier-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-12);
}

.dossier-section-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text);
}

/* 가족 현황 테이블 */
.dossier-table {
    width: 100%;
    border-collapse: collapse;
}

.dossier-table th,
.dossier-table td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-divider);
    font-size: var(--text-sm);
}

.dossier-table th {
    font-weight: var(--weight-semibold);
    color: var(--color-text-sub);
    background: var(--color-bg-secondary);
}
```

### 16-7. 반응형 (480px 이하)

```css
@media (max-width: 480px) {
    .dossier-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .dossier-avatar {
        width: 80px;
        height: 80px;
        font-size: 28px;
    }

    .dossier-info {
        align-items: center;
    }

    .dossier-name {
        font-size: var(--text-xl);  /* 20px */
        justify-content: center;
    }

    .dossier-meta {
        align-items: center;
    }

    .info-label {
        width: 80px;
    }
}
```

### HTML 사용 예시

```html
<!-- 인물카드 상단 -->
<div class="dossier-header">
    <div class="dossier-avatar">김</div>
    <div class="dossier-info">
        <div class="dossier-name">
            김영등
            <span class="badge-position badge-position--president">회장</span>
        </div>
        <div class="dossier-meta">
            <span class="dossier-meta-row">영등포JC · 제1분과</span>
            <a href="tel:010-1234-5678" class="dossier-contact-link">📞 010-1234-5678</a>
            <a href="mailto:kim@example.com" class="dossier-contact-link">✉️ kim@example.com</a>
            <span class="dossier-meta-row">🏢 (주)영등포상사 대표이사</span>
        </div>
    </div>
</div>

<!-- 탭 바 -->
<div class="dossier-tabs">
    <button class="dossier-tab active">기본정보</button>
    <button class="dossier-tab">JC이력</button>
    <button class="dossier-tab">교육</button>
    <button class="dossier-tab">활동</button>
    <button class="dossier-tab">경력</button>
    <button class="dossier-tab">가족</button>
    <button class="dossier-tab">취미</button>
    <button class="dossier-tab">메모</button>
</div>

<!-- 기본정보 탭 -->
<div class="dossier-content">
    <div class="info-grid">
        <div class="info-row">
            <span class="info-label">생년월일</span>
            <span class="info-value">1985.03.15 (만 41세)</span>
        </div>
        <div class="info-row">
            <span class="info-label">주소</span>
            <span class="info-value">서울시 영등포구 여의도동<br>여의도아파트 101동 1201호</span>
        </div>
    </div>
</div>

<!-- JC이력 탭 — 타임라인 -->
<div class="dossier-content">
    <div class="timeline">
        <div class="timeline-item current">
            <div class="timeline-period">2025.01 ~ 현재</div>
            <div class="timeline-title">회장</div>
        </div>
        <div class="timeline-item">
            <div class="timeline-period">2024.01 ~ 2024.12</div>
            <div class="timeline-title">부회장</div>
        </div>
    </div>
</div>
```

---

## 17. 직책 뱃지 (Position Badge)

> 참조: `Docs/features/member-position-plan.md`

직책별로 색상이 구분된 소형 뱃지. 프로필, 회원목록, 참석자 명단 등에서 이름 옆에 표시.

### 17-1. 스펙

```css
/* 직책 뱃지 공통 */
.badge-position {
    display: inline-flex;
    align-items: center;
    font-size: var(--badge-position-size);          /* 11px */
    padding: var(--badge-position-padding);         /* 2px 8px */
    border-radius: var(--badge-position-radius);    /* 10px */
    font-weight: var(--weight-medium);
    line-height: 1.4;
    white-space: nowrap;
    border: 1px solid transparent;
}

/* 회장 — 금색 */
.badge-position--president {
    background: var(--position-president-bg);       /* #FEF3C7 */
    color: var(--position-president-text);          /* #92400E */
    border-color: var(--position-president-border); /* #F59E0B */
}

/* 수석부회장 — 은색 */
.badge-position--svp {
    background: var(--position-svp-bg);             /* #F3F4F6 */
    color: var(--position-svp-text);               /* #374151 */
    border-color: var(--position-svp-border);       /* #9CA3AF */
}

/* 부회장 — 청색 (Primary Light) */
.badge-position--vp {
    background: var(--position-vp-bg);              /* primary-light */
    color: var(--position-vp-text);                /* primary */
    border-color: var(--position-vp-border);        /* primary */
}

/* 총무 — 부회장과 동일 스타일 */
.badge-position--secretary {
    background: var(--position-vp-bg);
    color: var(--position-vp-text);
    border-color: var(--position-vp-border);
}

/* 이사 — 연청색 */
.badge-position--director {
    background: var(--position-director-bg);        /* #DBEAFE */
    color: var(--position-director-text);           /* #1E40AF */
    border-color: var(--position-director-border);  /* #3B82F6 */
}

/* 감사 — 이사와 동일 */
.badge-position--auditor {
    background: var(--position-director-bg);
    color: var(--position-director-text);
    border-color: var(--position-director-border);
}

/* 일반회원 — 기본 (가장 낮은 시인성) */
.badge-position--member {
    background: var(--position-default-bg);         /* #F3F4F6 */
    color: var(--position-default-text);            /* #6B7280 */
    border-color: var(--position-default-border);   /* #E5E7EB */
}
```

### 17-2. 직책 매핑 테이블

| 직책 | CSS 클래스 | 배경 | 텍스트 | 테두리 |
|------|-----------|------|--------|--------|
| 회장 | `--president` | 금색 `#FEF3C7` | `#92400E` | `#F59E0B` |
| 수석부회장 | `--svp` | 은색 `#F3F4F6` | `#374151` | `#9CA3AF` |
| 부회장 | `--vp` | 청색 `#E8EDF3` | `#1E3A5F` | `#1E3A5F` |
| 총무 | `--secretary` | 청색 (부회장 동일) | | |
| 이사 | `--director` | 연청 `#DBEAFE` | `#1E40AF` | `#3B82F6` |
| 감사 | `--auditor` | 연청 (이사 동일) | | |
| 일반회원 | `--member` | 회색 `#F3F4F6` | `#6B7280` | `#E5E7EB` |

### 17-3. 사용 위치

- **프로필 화면**: 이름 아래 (`.profile-role-badge` 대체)
- **회원 목록**: 이름 우측 (인라인, gap 6px)
- **인물카드 상단**: 이름 우측
- **참석자 명단**: 이름 우측
- **댓글 작성자**: 이름 우측 (선택)

### HTML 사용 예시

```html
<!-- 회원 목록 -->
<div class="member-card">
    <div class="avatar">김</div>
    <div>
        <span class="member-name">김영등</span>
        <span class="badge-position badge-position--president">회장</span>
    </div>
</div>

<!-- 프로필 -->
<div class="profile-hero">
    <div class="profile-avatar">김</div>
    <div class="profile-name">김영등</div>
    <span class="badge-position badge-position--president">회장</span>
</div>
```

---

## 18. 게시글 참석/불참 UI

> 참조: `Docs/features/post-attendance-plan.md`
> 일정 참석 UI(`12-attendance-vote-ui.md`)와 동일한 스타일 사용

### 18-1. 참석 여부 섹션 (게시글 상세 하단)

```css
/* 참석 여부 섹션 래퍼 */
.post-attendance {
    border-top: 1px solid var(--color-border);
    padding: var(--space-16);
    margin-top: var(--space-16);
}

.post-attendance-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--space-12);
}

/* 참석/불참 버튼 그룹 */
.attendance-buttons {
    display: flex;
    gap: var(--space-8);
    margin-bottom: var(--space-12);
}

/* 참석 버튼 */
.attendance-btn {
    flex: 1;
    height: 44px;
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all var(--duration-fast) var(--ease-default);
}

/* 미선택 상태 (기본) */
.attendance-btn--attend {
    background: var(--attendance-none-bg);
    color: var(--attendance-none-color);
    border: 1px solid var(--attendance-none-border);
}

.attendance-btn--absent {
    background: var(--attendance-none-bg);
    color: var(--attendance-none-color);
    border: 1px solid var(--attendance-none-border);
}

/* 참석 선택됨 — 초록 */
.attendance-btn--attend.active {
    background: var(--attendance-attend-bg);         /* #F0FDF4 */
    color: var(--attendance-attend-color);           /* #16A34A */
    border-color: var(--attendance-attend-border);   /* #16A34A */
}

/* 불참 선택됨 — 빨강 */
.attendance-btn--absent.active {
    background: var(--attendance-absent-bg);         /* #FEF2F2 */
    color: var(--attendance-absent-color);           /* #DC2626 */
    border-color: var(--attendance-absent-border);   /* #DC2626 */
}

/* 참석 현황 요약 */
.attendance-summary {
    font-size: var(--text-sm);
    color: var(--color-text-sub);
    margin-bottom: var(--space-8);
}

.attendance-summary strong {
    color: var(--color-text);
}

/* 명단 토글 */
.attendance-toggle-list {
    font-size: var(--text-sm);
    color: var(--color-primary);
    cursor: pointer;
    background: none;
    border: none;
    font-weight: var(--weight-medium);
}

/* 명단 리스트 */
.attendance-list {
    margin-top: var(--space-8);
}

.attendance-list-group {
    margin-bottom: var(--space-12);
}

.attendance-list-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--color-text-hint);
    margin-bottom: var(--space-4);
}

.attendance-list-names {
    font-size: var(--text-sm);
    color: var(--color-text);
    line-height: var(--leading-relaxed);
}
```

### 18-2. 게시글 작성 폼 — 참석 기능 토글

```css
/* 추가 옵션 섹션 */
.post-form-options {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-16);
    margin-top: var(--space-16);
}

.post-form-option-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--color-divider);
}

.post-form-option-row:last-child {
    border-bottom: none;
}

.post-form-option-label {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--color-text);
}

.post-form-option-desc {
    font-size: var(--text-xs);
    color: var(--color-text-hint);
    margin-top: 2px;
}
```

### 18-3. 게시글 목록 카드 참석 요약

```css
/* 게시글 카드 하단 참석 요약 */
.post-card-attendance {
    display: flex;
    gap: var(--space-8);
    font-size: var(--text-xs);
    color: var(--color-text-sub);
    margin-top: var(--space-8);
}

.post-card-attendance .attend-count {
    color: var(--color-success);
}

.post-card-attendance .absent-count {
    color: var(--color-error);
}
```

### HTML 사용 예시

```html
<!-- 게시글 상세 — 참석 섹션 -->
<div class="post-attendance">
    <div class="post-attendance-title">📋 참석 여부</div>
    <div class="attendance-buttons">
        <button class="attendance-btn attendance-btn--attend active">✅ 참석</button>
        <button class="attendance-btn attendance-btn--absent">❌ 불참</button>
    </div>
    <div class="attendance-summary">
        참석 <strong>18</strong>명 · 불참 <strong>5</strong>명 · 미응답 <strong>10</strong>명
    </div>
    <button class="attendance-toggle-list">참석자 명단 보기 ▼</button>
</div>

<!-- 게시글 작성 폼 — 참석 토글 -->
<div class="post-form-options">
    <div class="post-form-option-row">
        <div>
            <div class="post-form-option-label">📋 참석 확인 기능</div>
            <div class="post-form-option-desc">회원들의 참석/불참을 확인합니다</div>
        </div>
        <label class="toggle-switch">
            <input type="checkbox" name="attendance_enabled" />
            <span class="toggle-slider"></span>
        </label>
    </div>
</div>
```

---

## 19. Push 알림 설정 UI (글쓰기 폼)

> 참조: `Docs/features/push-notification-plan.md` §10

### 19-1. 글쓰기 폼 내 알림 설정 섹션

```css
/* Push 알림 설정 섹션 */
.push-settings {
    background: var(--push-section-bg);             /* bg-secondary */
    border: 1px solid var(--color-border);
    border-radius: var(--push-section-radius);      /* 12px */
    padding: var(--push-section-padding);           /* 16px */
    margin-top: var(--space-16);
}

.push-settings-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--space-12);
}

/* 라디오 버튼 그룹 */
.push-radio-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
}

.push-radio-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-12);
    cursor: pointer;
}

/* 커스텀 라디오 */
.push-radio {
    width: var(--push-radio-size);                  /* 20px */
    height: var(--push-radio-size);
    border-radius: 50%;
    border: 2px solid var(--push-radio-inactive);   /* border gray */
    background: var(--color-surface);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
    transition: border-color var(--duration-fast) var(--ease-default);
}

.push-radio-item.selected .push-radio {
    border-color: var(--push-radio-active);         /* primary */
}

.push-radio-item.selected .push-radio::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--push-radio-active);
}

/* 라디오 라벨 */
.push-radio-label {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--color-text);
}

.push-radio-desc {
    font-size: var(--text-xs);
    color: var(--color-text-hint);
    margin-top: 2px;
}

/* 예약 발송 — 날짜+시간 입력 (라디오 하위) */
.push-schedule-inputs {
    display: flex;
    gap: var(--space-8);
    margin-top: var(--space-8);
    padding-left: 32px;               /* 라디오와 정렬 */
}

.push-schedule-inputs input {
    flex: 1;
}

/* D-day 체크박스 그룹 (라디오 하위) */
.push-dday-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
    margin-top: var(--space-8);
    padding-left: 32px;
}

/* 커스텀 체크박스 */
.push-checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    cursor: pointer;
    font-size: var(--text-sm);
    color: var(--color-text);
}

.push-checkbox-box {
    width: var(--push-checkbox-size);               /* 18px */
    height: var(--push-checkbox-size);
    border-radius: var(--radius-xs);                /* 4px */
    border: 2px solid var(--push-radio-inactive);
    background: var(--color-surface);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--duration-fast) var(--ease-default);
}

.push-checkbox.checked .push-checkbox-box {
    background: var(--color-primary);
    border-color: var(--color-primary);
}

.push-checkbox.checked .push-checkbox-box::after {
    content: '✓';
    color: #FFFFFF;
    font-size: 12px;
    font-weight: var(--weight-bold);
}

/* 비활성 상태 (일정 미첨부 시 D-day 옵션) */
.push-radio-item.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
}
```

### 19-2. 라디오 옵션 정리

| 옵션 | 라벨 | 설명 | 하위 입력 |
|------|------|------|----------|
| 즉시 발송 | 즉시 발송 | 게시 즉시 전체 회원에게 알림 | — |
| 예약 발송 | 예약 발송 | 특정 날짜/시간에 Push 발송 | 날짜+시간 input |
| 일정 연동 | 일정 연동 알림 | D-day 기준 알림 (일정 첨부 시만) | D-7, D-3, D-1, 당일 체크박스 |
| 없음 | 알림 없음 | Push 알림을 보내지 않음 | — |

### HTML 사용 예시

```html
<div class="push-settings">
    <div class="push-settings-title">Push 알림 설정</div>
    <div class="push-radio-group">
        <!-- 즉시 발송 -->
        <div class="push-radio-item selected">
            <div class="push-radio"></div>
            <div>
                <div class="push-radio-label">즉시 발송</div>
                <div class="push-radio-desc">게시 즉시 전체 회원에게 알림</div>
            </div>
        </div>

        <!-- 예약 발송 -->
        <div class="push-radio-item">
            <div class="push-radio"></div>
            <div>
                <div class="push-radio-label">예약 발송</div>
                <div class="push-schedule-inputs">
                    <input type="date" />
                    <input type="time" />
                </div>
            </div>
        </div>

        <!-- 일정 연동 -->
        <div class="push-radio-item">
            <div class="push-radio"></div>
            <div>
                <div class="push-radio-label">일정 연동 알림</div>
                <div class="push-radio-desc">일정 첨부 시에만 활성화</div>
                <div class="push-dday-options">
                    <label class="push-checkbox checked">
                        <span class="push-checkbox-box"></span> D-7
                    </label>
                    <label class="push-checkbox checked">
                        <span class="push-checkbox-box"></span> D-3
                    </label>
                    <label class="push-checkbox checked">
                        <span class="push-checkbox-box"></span> D-1
                    </label>
                    <label class="push-checkbox">
                        <span class="push-checkbox-box"></span> 당일
                    </label>
                </div>
            </div>
        </div>

        <!-- 알림 없음 -->
        <div class="push-radio-item">
            <div class="push-radio"></div>
            <div>
                <div class="push-radio-label">알림 없음</div>
                <div class="push-radio-desc">Push 알림을 보내지 않음</div>
            </div>
        </div>
    </div>
</div>
```

---

---

## 20. 앱 관리 권한 UI

> 참조: `Docs/features/mobile-admin-plan.md`
> 원칙: 관리 기능은 일반 기능과 시각적으로 구분 (🛡️ 아이콘 + admin 뱃지), 권한이 없는 사용자에게는 완전히 숨김

### 20-1. 관리자 뱃지 (Admin Badge)

관리 기능임을 표시하는 방패 아이콘 + 라벨 조합. 관리 영역 진입, 관리 액션 버튼에 사용.

```css
/* 관리 뱃지 — 관리 기능 표식 */
.badge-admin {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: var(--text-xs);                      /* 12px */
    font-weight: var(--weight-medium);
    background: var(--admin-badge-bg);              /* #EFF6FF */
    color: var(--admin-badge-text);                 /* #1E40AF */
    border: 1px solid var(--admin-badge-border);    /* #93C5FD */
    border-radius: var(--radius-full);
    line-height: 1.4;
}

.badge-admin-icon {
    width: 12px;
    height: 12px;
}
```

### 20-2. 관리자 웹 — 권한 관리 토글 UI

인물카드 또는 회원 상세 화면에 "앱 관리 권한" 섹션으로 추가.

```
┌─────────────────────────────────────────────────┐
│  ─── 📱 앱 관리 권한 ────────────────────────── │
│                                                 │
│  현재 역할: member                               │
│                                                 │
│  회원 승인/거부     member_approve      [OFF]   │
│  게시글 관리       post_manage          [ON ]   │
│  일정 관리         schedule_manage      [OFF]   │
│  공지 관리         notice_manage        [OFF]   │
│  긴급 푸시 발송    push_send            [OFF]   │
│                                                 │
│  변경 사유 (선택)                                │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │              권한 저장                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ─── 권한 변경 이력 ─────────────────────────── │
│                                                 │
│  2026-03-15 10:00  member_approve 부여          │
│    by 김관리자 — "회장 직책 부여"                │
│                                                 │
└─────────────────────────────────────────────────┘
```

```css
/* 권한 관리 섹션 */
.admin-perm-section {
    background: var(--admin-section-bg);
    border: 1px solid var(--admin-section-border);
    border-radius: var(--radius-lg);
    padding: var(--space-16);
    margin-top: var(--space-16);
}

.admin-perm-section-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-8);
}

.admin-perm-role {
    font-size: var(--text-sm);
    color: var(--color-text-sub);
    margin-bottom: var(--space-16);
}

/* 권한 토글 행 */
.admin-perm-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--admin-perm-row-height);       /* 52px */
    padding: var(--space-8) 0;
    border-bottom: 1px solid var(--admin-perm-row-border);
}

.admin-perm-row:last-child {
    border-bottom: none;
}

.admin-perm-label {
    flex: 1;
}

.admin-perm-name {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--color-text);
}

.admin-perm-code {
    font-size: var(--text-xs);
    color: var(--color-text-hint);
    font-family: monospace;
}

/* 변경 사유 입력 */
.admin-perm-reason {
    margin-top: var(--space-16);
}

.admin-perm-reason label {
    display: block;
    font-size: var(--text-sm);
    color: var(--color-text-sub);
    margin-bottom: var(--space-4);
}

/* 변경 이력 */
.admin-perm-log {
    margin-top: var(--space-16);
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-16);
}

.admin-perm-log-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--color-text-sub);
    margin-bottom: var(--space-12);
}

.admin-perm-log-item {
    padding: var(--space-8) 0;
    border-bottom: 1px solid var(--color-divider);
}

.admin-perm-log-item:last-child {
    border-bottom: none;
}

.admin-perm-log-action {
    font-size: var(--text-sm);
    color: var(--color-text);
}

.admin-perm-log-action .grant {
    color: var(--color-success);
    font-weight: var(--weight-medium);
}

.admin-perm-log-action .revoke {
    color: var(--color-error);
    font-weight: var(--weight-medium);
}

.admin-perm-log-meta {
    font-size: var(--text-xs);
    color: var(--color-text-hint);
    margin-top: 2px;
}
```

### 20-3. 앱 — 관리 메뉴 배치 (프로필 화면)

프로필 하단 설정 리스트에 "관리" 그룹 추가. `has_any_permission = true`일 때만 렌더링.

```
┌─────────────────────────────────────────┐
│  ─── 관리 ──────────────────────────── │  ← 권한 보유 시만 표시
│  ┌──────────────────────────────────┐  │
│  │  🛡️ 앱 관리                  >  │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

```css
/* 관리 메뉴 아이템 — 기존 settings-item 확장 */
.settings-item--admin .settings-item-icon {
    color: var(--admin-icon-color);                 /* primary */
}

.settings-item--admin .settings-item-label {
    font-weight: var(--weight-medium);
}
```

### 20-4. 앱 — 관리 허브 화면

보유 권한에 해당하는 카드만 표시. `post_manage`/`schedule_manage`는 각 상세 화면에서 인라인 제공.

```
┌─────────────────────────────────────────┐
│  ← 앱 관리                              │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  👤 회원 승인 대기           3   │  │  ← member_approve
│  │     승인 대기 중인 회원 목록      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  📢 공지 관리                    │  │  ← notice_manage
│  │     공지 작성/수정/삭제           │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  📣 긴급 푸시 발송               │  │  ← push_send
│  │     즉시 전체/그룹 알림 발송      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ℹ️ 게시글/일정 관리는 각 화면에서     │
│     인라인으로 제공됩니다.              │
│                                         │
└─────────────────────────────────────────┘
```

```css
/* 관리 허브 화면 */
.admin-hub {
    padding: var(--space-16);
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
}

/* 관리 허브 카드 */
.admin-hub-card {
    background: var(--admin-hub-card-bg);
    border: 1px solid var(--admin-hub-card-border);
    border-radius: var(--admin-hub-card-radius);    /* 12px */
    padding: var(--space-16);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-12);
    transition: background var(--duration-fast) var(--ease-default);
}

.admin-hub-card:hover {
    background: var(--color-bg-secondary);
}

.admin-hub-card:active {
    background: var(--color-border-light);
}

/* 카드 아이콘 (원형 배경) */
.admin-hub-card-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--admin-badge-bg);              /* #EFF6FF */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

/* 카드 텍스트 */
.admin-hub-card-info {
    flex: 1;
    min-width: 0;
}

.admin-hub-card-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: var(--space-8);
}

.admin-hub-card-desc {
    font-size: var(--text-sm);
    color: var(--color-text-sub);
    margin-top: 2px;
}

/* 대기 건수 배지 (빨간 원형) */
.admin-pending-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: var(--radius-full);
    background: var(--admin-pending-badge-bg);      /* red */
    color: var(--admin-pending-badge-text);          /* white */
    font-size: 11px;
    font-weight: var(--weight-bold);
}

/* 허브 하단 안내 */
.admin-hub-note {
    font-size: var(--text-xs);
    color: var(--color-text-hint);
    text-align: center;
    padding: var(--space-8) 0;
}
```

### 20-5. 앱 — 회원가입 승인 화면

```
┌─────────────────────────────────────────┐
│  ← 회원 승인 대기                        │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  신청자1                         │  │
│  │  new1@example.com                │  │
│  │  010-1234-5678                   │  │
│  │  추천인: 김영등                   │  │
│  │  신청일: 2026-03-14              │  │
│  │                                  │  │
│  │  [거부]              [승인]      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  대기 중인 회원이 없습니다.              │  ← 빈 상태
│                                         │
└─────────────────────────────────────────┘
```

```css
/* 승인 대기 화면 */
.admin-pending {
    padding: var(--space-16);
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
}

/* 승인 대기 카드 */
.admin-pending-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-16);
}

.admin-pending-card-name {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text);
    margin-bottom: var(--space-8);
}

.admin-pending-card-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-bottom: var(--space-16);
}

.admin-pending-card-row {
    font-size: var(--text-sm);
    color: var(--color-text-sub);
    display: flex;
    align-items: center;
    gap: var(--space-6);
}

/* 승인/거부 버튼 */
.admin-pending-actions {
    display: flex;
    gap: var(--space-8);
}

.admin-pending-actions .btn {
    flex: 1;
    height: var(--admin-action-btn-height);         /* 36px */
    border-radius: var(--admin-action-btn-radius);  /* 6px */
    font-size: var(--text-sm);
}

/* 거부 버튼 — ghost + 빨강 텍스트 */
.btn-reject {
    background: transparent;
    color: var(--color-error);
    border: 1px solid var(--color-error);
    font-weight: var(--weight-semibold);
    cursor: pointer;
}

.btn-reject:hover {
    background: var(--color-error-bg);
}

/* 승인 버튼 — primary */
.btn-approve {
    background: var(--color-primary);
    color: #FFFFFF;
    border: none;
    font-weight: var(--weight-semibold);
    cursor: pointer;
}

.btn-approve:hover {
    background: var(--color-primary-hover);
}

/* 거부 사유 다이얼로그 */
.admin-reject-dialog .dialog-body textarea {
    min-height: 80px;
}
```

### 20-6. 앱 — 게시글/일정 관리 버튼 (인라인)

`post_manage` 또는 `schedule_manage` 권한 보유 시, 타인의 게시글/일정 상세 하단에 관리 영역 표시.

```
─── 🛡️ 관리 ──────────────────────
[수정]  [삭제]
```

```css
/* 인라인 관리 액션 영역 */
.admin-inline-actions {
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-12);
    margin-top: var(--space-16);
}

.admin-inline-actions-title {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    color: var(--color-text-hint);
    margin-bottom: var(--space-8);
    display: flex;
    align-items: center;
    gap: var(--space-4);
}

.admin-inline-actions-buttons {
    display: flex;
    gap: var(--space-8);
}

/* 관리 액션 버튼 (소형) */
.btn-admin-action {
    height: var(--admin-action-btn-height);         /* 36px */
    padding: 0 var(--space-16);
    border-radius: var(--admin-action-btn-radius);  /* 6px */
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--space-4);
    transition: all var(--duration-fast) var(--ease-default);
}

/* 관리 수정 버튼 */
.btn-admin-action--edit {
    background: var(--admin-badge-bg);              /* #EFF6FF */
    color: var(--admin-badge-text);                 /* #1E40AF */
    border: 1px solid var(--admin-badge-border);    /* #93C5FD */
}

.btn-admin-action--edit:hover {
    background: #DBEAFE;
}

/* 관리 삭제 버튼 */
.btn-admin-action--delete {
    background: var(--color-error-bg);              /* #FEF2F2 */
    color: var(--color-error-text);                 /* #991B1B */
    border: 1px solid var(--color-error);
}

.btn-admin-action--delete:hover {
    background: #FEE2E2;
}

/* 삭제 확인 다이얼로그 — 사유 입력 */
.admin-delete-dialog .dialog-body textarea {
    min-height: 60px;
    margin-top: var(--space-8);
}
```

### 20-7. 앱 — 긴급 푸시 발송 화면

```
┌─────────────────────────────────────────┐
│  ← 긴급 푸시 발송                        │
├─────────────────────────────────────────┤
│                                         │
│  제목 (필수)                             │
│  ┌─────────────────────────────────┐   │
│  │ 긴급: 모임 장소 변경             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  내용 (필수)                             │
│  ┌─────────────────────────────────┐   │
│  │ 오늘 모임 장소가 변경되었습니다. │   │
│  │ 영등포구청 3층 → 5층 대회의실   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  발송 대상                               │
│  ┌─────────────────────────────────┐   │
│  │ ● 전체 회원                     │   │
│  │ ○ 직책별                        │   │
│  │ ○ 분과별                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⚠️ 즉시 발송됩니다. 신중히 작성하세요. │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │          📣 발송하기             │   │  ← 빨간 강조
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

```css
/* 긴급 푸시 발송 화면 */
.admin-push-form {
    padding: var(--space-16);
    display: flex;
    flex-direction: column;
    gap: var(--space-16);
}

/* 발송 대상 라디오 그룹 */
.admin-push-target {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-12);
}

.admin-push-target-title {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--color-text-sub);
    margin-bottom: var(--space-8);
}

.admin-push-target-option {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-8) 0;
    cursor: pointer;
    font-size: var(--text-base);
    color: var(--color-text);
}

/* 직책/분과 드롭다운 (라디오 하위) */
.admin-push-target-select {
    margin-top: var(--space-4);
    padding-left: 28px;               /* 라디오와 정렬 */
}

/* 경고 메시지 */
.admin-push-warning {
    display: flex;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-12);
    background: var(--color-warning-bg);
    border: 1px solid var(--color-warning);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--color-warning-text);
}

/* 발송 버튼 — 빨간색 강조 */
.btn-admin-send {
    width: 100%;
    height: var(--btn-height);                      /* 44px */
    border-radius: var(--btn-radius);
    background: var(--admin-send-btn-bg);           /* red */
    color: var(--admin-send-btn-text);              /* white */
    border: none;
    font-size: var(--btn-font-size);
    font-weight: var(--weight-bold);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-8);
    transition: background var(--duration-fast) var(--ease-default);
}

.btn-admin-send:hover:not(:disabled) {
    background: var(--admin-send-btn-hover);
}

.btn-admin-send:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* 발송 확인 다이얼로그 */
.admin-push-confirm .dialog {
    max-width: 340px;
}

.admin-push-confirm-summary {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    padding: var(--space-12);
    margin: var(--space-8) 0;
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
}

.admin-push-confirm-summary dt {
    color: var(--color-text-hint);
    font-size: var(--text-xs);
    margin-bottom: 2px;
}

.admin-push-confirm-summary dd {
    color: var(--color-text);
    margin: 0 0 var(--space-8) 0;
}

/* 발송 결과 토스트 */
.admin-push-result {
    font-size: var(--text-sm);
}

.admin-push-result .sent-count {
    color: var(--color-success);
    font-weight: var(--weight-semibold);
}

.admin-push-result .failed-count {
    color: var(--color-error);
    font-weight: var(--weight-semibold);
}
```

### 20-8. 디자인 원칙 요약

| 원칙 | 적용 방식 |
|------|----------|
| **관리 = 🛡️ 방패 아이콘** | 관리 메뉴, 인라인 관리 영역, 관리 뱃지에 일관 사용 |
| **관리 색상 = 연한 블루** | `#EFF6FF` 배경 + `#1E40AF` 텍스트 (일반 Primary와 구분) |
| **위험 액션 = 빨강 강조** | 긴급 푸시 발송, 관리 삭제 버튼은 `error` 계열 |
| **권한 없으면 완전 숨김** | `display: none` — 흐리게/비활성이 아닌 완전 제거 |
| **확인 다이얼로그 필수** | 승인/거부/삭제/발송 모두 확인 단계 포함 |
| **변경 이력 추적** | 권한 변경 로그 UI 제공 (관리자 웹) |

### 20-9. CSS 클래스 네이밍 컨벤션

```
admin-*              — 관리 기능 전용 프리픽스
badge-admin          — 관리 뱃지
admin-hub-*          — 관리 허브 화면
admin-pending-*      — 회원 승인 대기
admin-inline-*       — 인라인 관리 (게시글/일정)
admin-push-*         — 긴급 푸시 발송
admin-perm-*         — 권한 관리 (관리자 웹)
btn-admin-*          — 관리 전용 버튼
btn-approve / btn-reject — 승인/거부 (짝 버튼)
```

### HTML 사용 예시

```html
<!-- 프로필 — 관리 메뉴 -->
<div class="settings-group">
    <div class="settings-group-title">관리</div>
    <div class="settings-item settings-item--admin" onclick="navigateTo('mobile-admin')">
        <svg class="settings-item-icon"><!-- shield icon --></svg>
        <span class="settings-item-label">앱 관리</span>
        <svg class="settings-item-chevron"><!-- > --></svg>
    </div>
</div>

<!-- 관리 허브 -->
<div class="admin-hub">
    <div class="admin-hub-card" onclick="navigateTo('admin-pending')">
        <div class="admin-hub-card-icon">👤</div>
        <div class="admin-hub-card-info">
            <div class="admin-hub-card-title">
                회원 승인 대기
                <span class="admin-pending-count">3</span>
            </div>
            <div class="admin-hub-card-desc">승인 대기 중인 회원 목록</div>
        </div>
    </div>
</div>

<!-- 게시글 상세 — 인라인 관리 -->
<div class="admin-inline-actions">
    <div class="admin-inline-actions-title">
        🛡️ 관리
    </div>
    <div class="admin-inline-actions-buttons">
        <button class="btn-admin-action btn-admin-action--edit">수정</button>
        <button class="btn-admin-action btn-admin-action--delete">삭제</button>
    </div>
</div>

<!-- 회원 승인 카드 -->
<div class="admin-pending-card">
    <div class="admin-pending-card-name">신청자1</div>
    <div class="admin-pending-card-info">
        <div class="admin-pending-card-row">✉️ new1@example.com</div>
        <div class="admin-pending-card-row">📞 010-1234-5678</div>
        <div class="admin-pending-card-row">추천인: 김영등</div>
        <div class="admin-pending-card-row">신청일: 2026-03-14</div>
    </div>
    <div class="admin-pending-actions">
        <button class="btn btn-reject">거부</button>
        <button class="btn btn-approve">승인</button>
    </div>
</div>

<!-- 관리자 웹 — 권한 토글 -->
<div class="admin-perm-section">
    <div class="admin-perm-section-title">📱 앱 관리 권한</div>
    <div class="admin-perm-role">현재 역할: member</div>
    <div class="admin-perm-row">
        <div class="admin-perm-label">
            <div class="admin-perm-name">회원 승인/거부</div>
            <div class="admin-perm-code">member_approve</div>
        </div>
        <label class="toggle-switch">
            <input type="checkbox" />
            <span class="toggle-slider"></span>
        </label>
    </div>
    <!-- ... 나머지 권한 ... -->
</div>
```

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-15 | v2.2 — §20 앱 관리 권한 UI (관리뱃지, 권한토글, 관리허브, 회원승인, 인라인관리, 긴급푸시) 추가 |
| 2026-03-14 | v2.1 — 인물카드(Dossier) 전체 UI, 수평탭, 타임라인, 정보그리드, 직책뱃지 7종, 참석/불참 UI, Push알림 설정 UI 추가 |
| 2026-03-13 | v2.0 미니멀 리뉴얼 — CEO "촌스러움" 피드백 반영, 딥네이비+무채색, 입력필드/헤더/프로필/토글 전면 리디자인 |
