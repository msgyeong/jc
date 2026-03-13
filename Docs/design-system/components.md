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

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-13 | v2.0 미니멀 리뉴얼 — CEO "촌스러움" 피드백 반영, 딥네이비+무채색, 입력필드/헤더/프로필/토글 전면 리디자인 |
