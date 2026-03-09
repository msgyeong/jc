# 컴포넌트별 디자인 개선안

> 작성일: 2026-03-09
> 작성자: 디자이너 에이전트
> 참조: [04-design-audit.md](./04-design-audit.md) 점검 결과 기반

---

## 1. 홈 화면 — 배너 영역 개선

### 현재 문제
- 배너 이미지 미등록 시 연보라(#E6ECFA) 배경에 "영등포 JC" 텍스트만 표시
- 200px 높이의 빈 공간이 첫 화면에서 낭비됨
- 사용자에게 미완성 인상

### 개선안: 기본 배너 카드

이미지가 없을 때 표시할 **기본 배너 카드** 디자인:

```
┌─────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐    │
│  │  [그라디언트 배경]                    │    │
│  │                                      │    │
│  │    영등포 JC                          │    │  <- 로고 또는 텍스트
│  │    청년회의소                          │    │  <- 서브 텍스트
│  │                                      │    │
│  │    ● ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ●    │    │  <- 장식 라인
│  └─────────────────────────────────────┘    │
│              ●  ○  ○                        │  <- 인디케이터
└─────────────────────────────────────────────┘
```

#### 스타일 스펙

| 속성 | 값 |
|------|-----|
| 높이 | 180px |
| 배경 | `linear-gradient(135deg, #1F4FD8 0%, #3B6FE8 50%, #5B8FF9 100%)` |
| 모서리 | 12px (border-radius-lg) |
| 마진 | 좌우 16px, 하단 16px |
| 제목 텍스트 | 24px, weight 700, white |
| 부제 텍스트 | 14px, weight 400, rgba(255,255,255,0.8) |
| 정렬 | 중앙 정렬 (수평+수직) |
| 장식 | 하단에 반투명 원형 도형으로 패턴 |

#### CSS 클래스명: `.banner-default`

```css
.banner-default {
    height: 180px;
    background: linear-gradient(135deg, #1F4FD8 0%, #3B6FE8 50%, #5B8FF9 100%);
    border-radius: 12px;
    margin: 0 16px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.banner-default-title {
    font-size: 24px;
    font-weight: 700;
    color: white;
    margin-bottom: 4px;
    z-index: 1;
}

.banner-default-sub {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    z-index: 1;
}

/* 장식용 원형 */
.banner-default::before {
    content: '';
    position: absolute;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    top: -60px;
    right: -40px;
}

.banner-default::after {
    content: '';
    position: absolute;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    bottom: -40px;
    left: -20px;
}
```

---

## 2. 게시판 — 게시글 카드 개선

### 현재 문제
- 카드 shadow가 너무 약해 배경과 구분이 안 됨
- 통계 영역이 이모지 직접 사용으로 일관성 부족
- 고정 공지 표시가 텍스트("[고정]")로만 되어 시각적 강조 부족

### 개선안: 강화된 게시글 카드

```
┌──────────────────────────────────────────┐
│  [아바타]  작성자 · 3시간 전          [N] │  <- 상단: 작성자 정보 + N배지
│                                          │
│  📌 고정                                  │  <- 고정 배지 (해당 시)
│  게시글 제목이 여기에 표시됩니다     [썸] │  <- 중단: 제목 + 썸네일
│  본문 미리보기 텍스트가 두 줄...     [네] │
│                                    [일] │
│  ─────────────────────────────────────── │  <- 구분선
│  💬 12    ❤ 5    👁 128                   │  <- 하단: 통계
└──────────────────────────────────────────┘
```

#### 변경 스펙

| 속성 | 기존 | 개선 |
|------|------|------|
| box-shadow | `0 1px 3px rgba(0,0,0,0.08)` | `0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)` |
| hover shadow | `0 2px 8px rgba(0,0,0,0.12)` | `0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(31,79,216,0.1)` |
| border | 없음 | `1px solid rgba(0,0,0,0.04)` (미세한 테두리) |
| padding | `16px` | `16px 16px 12px` (하단 약간 좁힘) |
| 통계 구분선 | 없음 | `border-top: 1px solid var(--border-color)`, `padding-top: 10px`, `margin-top: 10px` |
| 고정 배지 | `font-size: 12px; color: primary` | 배경 pill: `background: #EBF0FC; padding: 2px 8px; border-radius: 10px;` |

#### 고정(Pinned) 배지 스타일

```css
.pc-pinned {
    font-size: 11px;
    font-weight: 600;
    color: var(--primary-color);
    background: #EBF0FC;
    padding: 2px 10px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
}

.pc-pinned::before {
    content: '📌';
    font-size: 10px;
}
```

#### 통계 영역 개선

```css
.pc-stats {
    display: flex;
    gap: 16px;
    padding-top: 10px;
    margin-top: 10px;
    border-top: 1px solid var(--border-color);
}

.pc-stat {
    font-size: 12px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
}

/* 통계 아이콘은 SVG inline 또는 CSS로 처리 권장 */
```

---

## 3. 프로필 화면 — 카드 + 액션 버튼 개선

### 현재 문제
- 프로필 정보가 라벨+값 한 줄로 나열됨 (구분감 없음)
- 액션 버튼(프로필 편집, 비밀번호 변경, 로그아웃) 없음
- "활성" 배지 스타일이 디자인 시스템에 미정의

### 개선안: 프로필 카드 + 정보 그룹 + 액션 메뉴

```
┌──────────────────────────────────────────┐
│           [아바타 80px]                   │
│           홍길동                           │  <- 이름 20px bold
│         영등포JC 회장                      │  <- 직책 pill 배지
│              ● 활성                       │  <- 상태 dot + 텍스트
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  기본 정보                                │  <- 섹션 제목
├──────────────────────────────────────────┤
│  이메일                  hong@jc.com      │  <- 라벨(좌) + 값(우)
│  ─────────────────────────────────────── │
│  휴대폰              010-1234-5678       │
│  ─────────────────────────────────────── │
│  주소                서울시 영등포구       │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  설정                                     │
├──────────────────────────────────────────┤
│  ✏️  프로필 편집                      >   │
│  ─────────────────────────────────────── │
│  🔒  비밀번호 변경                    >   │
│  ─────────────────────────────────────── │
│  🚪  로그아웃                         >   │  <- 빨간 텍스트
└──────────────────────────────────────────┘
```

#### 프로필 히어로 영역

| 속성 | 값 |
|------|-----|
| 배경 | `linear-gradient(180deg, var(--secondary-color) 0%, white 100%)` |
| 패딩 | `32px 16px 24px` |
| 아바타 | 80px, border: 4px solid white, box-shadow |
| 이름 | 20px, weight 700, text-primary |
| 직책 | 13px, weight 600, pill 배지 (primary bg, white text) → 아니면 `secondary bg + primary text` |
| 상태 표시 | 8px 초록 dot + "활성" 12px text |

#### 정보 그룹 카드

```css
.profile-info-card {
    background: white;
    border-radius: 12px;
    margin: 0 16px 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}

.profile-info-card-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-secondary);
    padding: 14px 16px 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.profile-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
}

.profile-info-row:last-child {
    border-bottom: none;
}

.profile-info-label {
    font-size: 14px;
    color: var(--text-secondary);
}

.profile-info-value {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
    text-align: right;
}
```

#### 액션 메뉴 카드

```css
.profile-action-card {
    background: white;
    border-radius: 12px;
    margin: 0 16px 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}

.profile-action-item {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background 0.2s ease;
    gap: 12px;
}

.profile-action-item:hover {
    background: var(--background-color);
}

.profile-action-item:last-child {
    border-bottom: none;
}

.profile-action-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
}

.profile-action-text {
    flex: 1;
    font-size: 15px;
    color: var(--text-primary);
}

.profile-action-text.danger {
    color: var(--error-color);
}

.profile-action-arrow {
    font-size: 14px;
    color: var(--text-secondary);
    opacity: 0.5;
}
```

---

## 4. 하단 네비게이션 — 아이콘 + 텍스트 개선

### 현재 문제
- OS 이모지(🏠📋📅👥👤) 사용 — 플랫폼별 렌더링 차이
- CSS `color` 속성으로 active/inactive 색상 전환 불가
- 아이콘 크기가 24px(font-size)이나 이모지 특성상 정밀 제어 불가

### 개선안: SVG 인라인 아이콘 전환

#### 아이콘 세트 (각 24x24px)

| 탭 | 현재 | SVG 아이콘 제안 | 설명 |
|------|------|-----------------|------|
| 홈 | 🏠 | `<svg>` 집 아이콘 | 단순화된 집 형태, stroke 2px |
| 게시판 | 📋 | `<svg>` 문서 목록 아이콘 | 가로줄 3개가 있는 문서 |
| 일정 | 📅 | `<svg>` 캘린더 아이콘 | 상단에 고리 2개 달린 달력 |
| 회원 | 👥 | `<svg>` 사람 2명 아이콘 | 겹친 실루엣 |
| 프로필 | 👤 | `<svg>` 사람 1명 아이콘 | 단일 실루엣 + 원형 |

#### 스타일 스펙

```css
.nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px 0 6px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);   /* inactive 기본색 */
    transition: color 0.2s ease;
}

.nav-item.active {
    color: var(--primary-color);    /* active 색상 */
}

.nav-icon {
    width: 24px;
    height: 24px;
}

.nav-icon svg {
    width: 24px;
    height: 24px;
    stroke: currentColor;           /* 부모 color 상속 */
    stroke-width: 1.8;
    fill: none;
}

.nav-item.active .nav-icon svg {
    stroke-width: 2.2;             /* active일 때 약간 굵게 */
}

.nav-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: -0.2px;
}

.nav-item.active .nav-label {
    font-weight: 700;
}
```

#### 하단 네비게이션 바 전체

```css
.bottom-nav {
    display: flex;
    background: white;
    border-top: 1px solid var(--border-color);
    padding: 0;
    position: sticky;
    bottom: 0;
    z-index: 100;
    box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.04);  /* 상단 미세 그림자 추가 */
}
```

#### SVG 아이콘 코드 (프론트엔드에 전달)

```html
<!-- 홈 -->
<svg viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z"/></svg>

<!-- 게시판 -->
<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5"/></svg>

<!-- 일정 -->
<svg viewBox="0 0 24 24"><path d="M4 7h16v13H4z M4 7V5h16v2 M8 3v4 M16 3v4 M4 11h16"/></svg>

<!-- 회원 -->
<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M22 20c0-2.5-2-4.5-5-5"/></svg>

<!-- 프로필 -->
<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>
```

> **주의**: 위 SVG는 개략적인 path이므로 프론트엔드에서 Lucide, Heroicons, 또는 Feather Icons 등 검증된 아이콘 라이브러리에서 가져오는 것을 권장합니다.

---

## 5. 홈 화면 — 공지/일정 요약 카드 개선

### 현재 문제
- 공지사항: 카드 테두리/배경 없이 텍스트만 나열
- 일정: 날짜 정보 없이 제목+장소만, N 배지 겹침

### 개선안: 공지사항 요약 카드

```
┌──────────────────────────────────────────┐
│  [N]  게시판 완성하고싶다                 │
│       총관리자 · 21시간 전                │
├──────────────────────────────────────────┤
│  [N]  신입회원 환영합니다                 │
│       총관리자 · 2일 전                   │
└──────────────────────────────────────────┘
```

#### 스타일 스펙

```css
.home-notice-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    background: white;
    border-radius: 10px;
    margin-bottom: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: background 0.2s ease;
}

.home-notice-item:hover {
    background: var(--background-color);
}

.home-notice-badge {
    flex-shrink: 0;
    margin-top: 2px;
}

.home-notice-content {
    flex: 1;
    min-width: 0;
}

.home-notice-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.home-notice-meta {
    font-size: 12px;
    color: var(--text-secondary);
}
```

### 개선안: 일정 요약 카드

```
┌──────────────────────────────────────────┐
│  ┌────┐                                  │
│  │ 15 │  3월 정기이사회            [N]   │
│  │ 3월│  14:00 · 영등포 JC 회의실        │
│  └────┘                                  │
├──────────────────────────────────────────┤
│  ┌────┐                                  │
│  │ 20 │  신입회원 오리엔테이션     [N]   │
│  │ 3월│  10:00 · 영등포 JC 회관          │
│  └────┘                                  │
└──────────────────────────────────────────┘
```

#### 스타일 스펙

```css
.home-schedule-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: white;
    border-radius: 10px;
    margin-bottom: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: background 0.2s ease;
}

.home-schedule-item:hover {
    background: var(--background-color);
}

.home-schedule-date {
    width: 48px;
    height: 48px;
    background: var(--secondary-color);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.home-schedule-date-day {
    font-size: 18px;
    font-weight: 700;
    color: var(--primary-color);
    line-height: 1;
}

.home-schedule-date-month {
    font-size: 10px;
    color: var(--text-secondary);
    margin-top: 1px;
}

.home-schedule-info {
    flex: 1;
    min-width: 0;
}

.home-schedule-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.home-schedule-detail {
    font-size: 12px;
    color: var(--text-secondary);
}
```
