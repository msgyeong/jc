# 배지/태그 디자인 통일 가이드

> 작성일: 2026-03-09
> 작성자: 디자이너 에이전트
> 참조: [04-design-audit.md](./04-design-audit.md) H2 문제 해결안

---

## 1. 문제 정의

### N 배지 겹침 현상 (홈 화면)

홈 화면 일정 리스트에서 **빨간 N 배지가 제목 텍스트와 겹침**:

```
현재 (문제):
┌──────────────────────────────┐
│  3월 정기이사회 N              │  <- N이 제목 끝에 inline으로 붙어서
│  📍 영등포 JC 회의실           │     긴 제목이면 겹치거나 줄바꿈
│  신입회원 오리엔테이션 N       │
│  📍 영등포 JC 회관             │
│  지역 봉사활동 - 영등포 하천 정화 N  <- 겹침 심각
└──────────────────────────────┘

개선 후:
┌──────────────────────────────┐
│  3월 정기이사회           [N] │  <- N이 우측 고정, 제목은 좌측에서 ellipsis
│  14:00 · 영등포 JC 회의실     │
│  신입회원 오리엔테이션   [N] │
│  10:00 · 영등포 JC 회관       │
└──────────────────────────────┘
```

### 원인
- N 배지가 제목 텍스트 뒤에 `<span>` 으로 inline 삽입
- 부모 요소가 flex 레이아웃이 아니라 텍스트와 함께 흐름
- 제목이 길면 N 배지가 줄바꿈 되거나 겹침

---

## 2. N 배지 (New Badge) 통일 스펙

### 사용 조건
- 게시글: 작성일이 **3일 이내** + 해당 사용자가 **미읽음**
- 일정: 등록일이 **3일 이내**
- 공지: 작성일이 **3일 이내** + 해당 사용자가 **미읽음**

### 디자인 스펙

| 속성 | 값 |
|------|-----|
| 형태 | 원형 (circle) |
| 크기 | 18px x 18px |
| 배경색 | `var(--error-color)` (#DC2626) |
| 텍스트 | "N", 10px, weight 700, white |
| border-radius | 50% |
| 정렬 | **부모 flex 컨테이너의 우측 끝** (flex-shrink: 0) |

### CSS

```css
.badge-new-circle {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: var(--error-color);
    color: white;
    font-size: 10px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    line-height: 1;
}
```

### 겹침 방지 레이아웃 규칙

N 배지가 포함된 행은 반드시 **flex 레이아웃**을 사용:

```css
/* 제목 + N 배지 행 */
.title-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-row .title-text {
    flex: 1;
    min-width: 0;          /* 필수: flex 자식 텍스트 truncate 허용 */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.title-row .badge-new-circle {
    flex-shrink: 0;         /* N 배지는 절대 축소되지 않음 */
}
```

#### 적용 대상

| 화면 | 적용 위치 | 현재 클래스 |
|------|-----------|-------------|
| 홈 공지 요약 | 공지 제목 행 | 신규 구현 필요 |
| 홈 일정 요약 | 일정 제목 행 | 신규 구현 필요 |
| 게시판 카드 | `.pc-top` 행 | 이미 flex — `.pc-badge-n` 사용 중 (정상) |
| 게시글 상세 | 제목 옆 | 미사용 (상세에서는 N 배지 불필요) |

---

## 3. 전체 배지/태그 통일 가이드

### 3-1. 배지 유형 분류

| 유형 | 용도 | 예시 |
|------|------|------|
| **상태 배지** | 사용자/게시글 상태 표시 | 활성, 대기, 정지, 탈퇴 |
| **역할 배지** | 회원 역할 표시 | 총관리자, 관리자, 회원 |
| **콘텐츠 배지** | 게시글 속성 표시 | N(새글), 고정, 공지 |
| **카테고리 배지** | 일정 유형 분류 | 정기, 특별, 봉사 등 |

### 3-2. 상태 배지

```
 ● 활성     ● 대기     ● 정지     ● 탈퇴
```

| 상태 | 배경색 | 텍스트색 | dot 색 |
|------|--------|----------|--------|
| 활성 | `#ECFDF5` | `#065F46` | `#10B981` |
| 대기 | `#FEF3C7` | `#92400E` | `#F59E0B` |
| 정지 | `#FEE2E2` | `#991B1B` | `#DC2626` |
| 탈퇴 | `#F3F4F6` | `#6B7280` | `#9CA3AF` |

```css
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

.status-badge::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
}

.status-badge.status-active {
    background: #ECFDF5;
    color: #065F46;
}
.status-badge.status-active::before {
    background: #10B981;
}

.status-badge.status-pending {
    background: #FEF3C7;
    color: #92400E;
}
.status-badge.status-pending::before {
    background: #F59E0B;
}

.status-badge.status-suspended {
    background: #FEE2E2;
    color: #991B1B;
}
.status-badge.status-suspended::before {
    background: #DC2626;
}

.status-badge.status-withdrawn {
    background: #F3F4F6;
    color: #6B7280;
}
.status-badge.status-withdrawn::before {
    background: #9CA3AF;
}
```

### 3-3. 역할 배지

| 역할 | 배경색 | 텍스트색 |
|------|--------|----------|
| 총관리자 | `#FEF3C7` | `#92400E` |
| 관리자 | `var(--secondary-color)` | `var(--primary-color)` |
| 회원 | `#F3F4F6` | `#6B7280` |

```css
.role-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
}

.role-badge.role-super {
    background: #FEF3C7;
    color: #92400E;
}

.role-badge.role-admin {
    background: var(--secondary-color);
    color: var(--primary-color);
}

.role-badge.role-member {
    background: #F3F4F6;
    color: #6B7280;
}
```

### 3-4. 콘텐츠 배지

| 배지 | 형태 | 배경 | 텍스트 | 크기 |
|------|------|------|--------|------|
| N (새글) | 원형 | `#DC2626` | white "N" | 18x18px |
| 고정 | pill | `#EBF0FC` | `#1F4FD8` "📌 고정" | auto |
| 공지 | pill | `#1F4FD8` | white "공지" | auto |

```css
/* N 배지 — 원형 */
.badge-new-circle {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: var(--error-color);
    color: white;
    font-size: 10px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

/* 고정 배지 — pill */
.badge-pinned {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 10px;
    background: #EBF0FC;
    color: var(--primary-color);
    font-size: 11px;
    font-weight: 600;
}

/* 공지 배지 — pill */
.badge-notice-label {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--primary-color);
    color: white;
    font-size: 11px;
    font-weight: 600;
}
```

### 3-5. 카테고리 배지 (일정)

| 카테고리 | 배경색 | 텍스트색 |
|----------|--------|----------|
| 정기 | `var(--secondary-color)` | `var(--primary-color)` |
| 특별 | `#FEF3C7` | `#92400E` |
| 봉사 | `#ECFDF5` | `#065F46` |
| 교육 | `#F3E8FF` | `#6B21A8` |
| 기타 | `#F3F4F6` | `#6B7280` |

```css
.schedule-cat-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
}

.schedule-cat-badge.cat-regular { background: var(--secondary-color); color: var(--primary-color); }
.schedule-cat-badge.cat-special { background: #FEF3C7; color: #92400E; }
.schedule-cat-badge.cat-volunteer { background: #ECFDF5; color: #065F46; }
.schedule-cat-badge.cat-education { background: #F3E8FF; color: #6B21A8; }
.schedule-cat-badge.cat-etc { background: #F3F4F6; color: #6B7280; }
```

---

## 4. 배지 배치 규칙 요약

### 규칙 1: N 배지는 항상 flex 컨테이너의 우측 끝
```
[flex container]
  [content, flex: 1, min-width: 0, overflow: hidden]
  [N badge, flex-shrink: 0]
```

### 규칙 2: 역할/상태 배지는 이름 우측에 inline
```
홍길동 [총관리자]  ← 이름 바로 뒤, gap 6px
```

### 규칙 3: 카테고리 배지는 카드 상단 좌측
```
[정기] 14:00~16:00       ← 카드 최상단, 시간과 같은 행
3월 정기이사회
```

### 규칙 4: 고정 배지는 제목 위
```
📌 고정                   ← 제목 바로 위, 작은 pill
게시글 제목이 여기에
```

---

## 5. 디자인 토큰 추가 제안

현재 `:root`에 없지만 배지 시스템에 필요한 색상 변수:

```css
:root {
    /* 기존 변수 유지 */

    /* 확장: 상태 색상 */
    --success-color: #10B981;
    --success-bg: #ECFDF5;
    --success-text: #065F46;

    --warning-color: #F59E0B;
    --warning-bg: #FEF3C7;
    --warning-text: #92400E;

    --error-bg: #FEE2E2;
    --error-text: #991B1B;

    --neutral-bg: #F3F4F6;
    --neutral-text: #6B7280;

    /* 확장: 특수 색상 */
    --purple-bg: #F3E8FF;
    --purple-text: #6B21A8;

    --primary-light-bg: #EBF0FC;
}
```

> **프론트엔드 에이전트에게 전달**: 위 CSS 변수를 `:root`에 추가하고, 기존 하드코딩된 색상을 변수로 교체해 주세요.
