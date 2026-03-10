# 18. Web Push 알림 UI 가이드

> 작성일: 2026-03-11 | 작성자: 디자이너 에이전트
> 기반: 07-unified-design-guide.md (통합 디자인 토큰), 11-mobile-color-renewal.md (Blue+Gray 2톤)
> 참조: Docs/features/web-push-notification.md (기획서), 16-home-banner-ui.md (배너 참고)
> 대상: 프론트엔드 에이전트 (`web/js/`, `web/styles/main.css`)

---

## 1. 개요

Web Push 알림 기능에 필요한 6개 UI 컴포넌트의 상세 디자인 명세.
Blue+Gray 2톤 원칙을 유지하며, 기존 컴포넌트 스타일과 통일한다.

### 1-1. 컴포넌트 목록

| # | 컴포넌트 | CSS 프리픽스 | 우선순위 |
|---|----------|-------------|----------|
| 1 | 앱바 알림 배지 | `.notification-badge-*` | Phase 1 |
| 2 | 알림 센터 화면 | `.notification-*` | Phase 2 |
| 3 | 알림 설정 화면 | `.alert-settings-*` | Phase 2 |
| 4 | 푸시 구독 유도 배너 | `.push-subscribe-*` | Phase 1 |
| 5 | PWA 설치 안내 배너 | `.push-install-*` | Phase 2 |
| 6 | 푸시 알림 디자인 (OS) | — (manifest/SW) | Phase 1 |

### 1-2. 디자인 토큰 참조

| 용도 | 토큰 | 값 |
|------|------|-----|
| 미읽음 점 | primary | `#2563EB` |
| 미읽음 배경 | primary-bg | `#EFF6FF` |
| 배지 배경 | danger | `#DC2626` |
| 배지 텍스트 | white | `#FFFFFF` |
| 읽음 텍스트 | text-sub | `#6B7280` |
| 시간 텍스트 | text-hint | `#9CA3AF` |
| 토글 ON | primary | `#2563EB` |
| 토글 OFF | border | `#D1D5DB` |
| 배너 배경 | primary-bg | `#EFF6FF` |
| 카드 배경 | bg-card | `#FFFFFF` |
| 페이지 배경 | bg | `#F9FAFB` |
| 구분선 | border | `#D1D5DB` |

---

## 2. 앱바 알림 배지

### 2-1. 레이아웃

```
┌──────────────────────────────────────┐
│  영등포 JC                     🔔   │
│                                 ③   │  ← 빨간 배지 (우상단)
└──────────────────────────────────────┘
```

종 아이콘은 앱바 우측에 위치. 기존 앱바 타이틀과 같은 행.

### 2-2. 종 아이콘 스펙

| 속성 | 값 |
|------|-----|
| 아이콘 타입 | SVG (인라인) |
| 크기 | `24 × 24px` |
| 색상 | `#FFFFFF` (앱바 배경이 Primary일 때) |
| Stroke | `stroke: currentColor; stroke-width: 1.5; fill: none` |
| 터치 영역 | `40 × 40px` (패딩 `8px`) |
| 위치 | 앱바 우측, `right: 8px` |
| Cursor | `pointer` |

#### SVG 아이콘

```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
</svg>
```

### 2-3. 미읽음 배지 스펙

| 속성 | 값 |
|------|-----|
| 형태 | pill (둥근 직사각형) |
| 최소 크기 | `18 × 18px` (1자리 숫자: 원형) |
| 패딩 | `0 5px` (2자리 이상일 때 좌우 여백) |
| 배경색 | `#DC2626` (danger) |
| 텍스트 색상 | `#FFFFFF` |
| 폰트 크기 | `10px` |
| 폰트 두께 | `700` (Bold) |
| Border-radius | `9px` (반원) |
| Border | `2px solid #2563EB` (앱바 배경과 동일 — 분리감) |
| 위치 | 종 아이콘 기준 `top: -6px; right: -8px` |
| Z-index | `1` |
| 최대 표시 | `99+` (99 초과 시) |
| 0일 때 | `display: none` |

### 2-4. 상태별 표시

| 미읽음 수 | 배지 표시 | 배지 크기 |
|-----------|----------|----------|
| 0 | 숨김 | — |
| 1~9 | 숫자 | `18 × 18px` (원형) |
| 10~99 | 숫자 | `24 × 18px` (pill) |
| 100+ | `99+` | `30 × 18px` (pill) |

### 2-5. CSS

```css
/* 앱바 알림 아이콘 래퍼 */
.notification-badge-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.notification-badge-wrap svg {
  width: 24px;
  height: 24px;
  color: #FFFFFF;
}

/* 미읽음 배지 */
.notification-badge-count {
  position: absolute;
  top: 2px;
  right: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #DC2626;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  border-radius: 9px;
  border: 2px solid var(--primary-color, #2563EB);
  z-index: 1;
  pointer-events: none;
}

.notification-badge-count:empty,
.notification-badge-count[data-count="0"] {
  display: none;
}
```

### 2-6. 인터랙션

- **탭/클릭**: 알림 센터 화면으로 이동
- **터치 피드백**: `opacity: 0.7` (0.1s)
- **진입 애니메이션**: 배지 카운트 변경 시 `scale(1.2) → scale(1)` 바운스 (0.3s)

```css
@keyframes notification-badge-bounce {
  0% { transform: scale(0.5); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.notification-badge-count.animate {
  animation: notification-badge-bounce 0.3s ease;
}
```

---

## 3. 알림 센터 화면

### 3-1. 전체 레이아웃

```
┌─────────────────────────────────────┐
│  ← 알림              모두 읽음 처리  │  ← AppBar
├─────────────────────────────────────┤
│                                     │
│  ┌─ 미읽음 알림 카드 ─────────────┐ │
│  │ ● 📢 새 공지사항               │ │
│  │   3월 정기 이사회 안내...       │ │
│  │   10분 전                      │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─ 읽음 알림 카드 ───────────────┐ │
│  │   📅 새 일정 등록              │ │
│  │   3월 봉사활동 — 3/20 09:00    │ │
│  │   어제                         │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─ 읽음 알림 카드 ───────────────┐ │
│  │   💬 새 댓글                    │ │
│  │   김영등님이 댓글을 남겼습...    │ │
│  │   3일 전                       │ │
│  └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  홈 │ 게시판 │ 일정 │ 회원 │ 프로필  │
└─────────────────────────────────────┘
```

- 일반 SPA 화면 (탭 형식 아님)
- 앱바 + 스크롤 가능한 알림 리스트
- 하단 탭 바 유지

### 3-2. AppBar

| 요소 | 스타일 |
|------|--------|
| 배경 | `#2563EB` (Primary) |
| 높이 | `56px` |
| 좌측 | `←` 뒤로가기 아이콘 (24px, #FFFFFF) |
| 중앙 | "알림" 텍스트 (`16px`, `600`, `#FFFFFF`) |
| 우측 | "모두 읽음" 텍스트 버튼 (`13px`, `500`, `rgba(255,255,255,0.85)`) |

#### "모두 읽음" 버튼 상태

| 상태 | 스타일 |
|------|--------|
| 미읽음 있을 때 | `color: rgba(255,255,255,0.85)` — 활성 |
| 전부 읽음일 때 | `color: rgba(255,255,255,0.4)` — 비활성, `pointer-events: none` |
| 탭 시 | `opacity: 0.7` (0.1s) |

### 3-3. 알림 리스트 아이템

```
┌─────────────────────────────────────────────┐
│  ●  [아이콘]  알림 제목 (최대 1줄)           │
│              알림 본문 (최대 2줄, 말줄임)     │
│              10분 전                         │
└─────────────────────────────────────────────┘
```

#### 아이템 레이아웃 스펙

| 속성 | 값 |
|------|-----|
| 패딩 | `16px` (상하좌우) |
| 최소 높이 | `80px` |
| 배경 (미읽음) | `#EFF6FF` (primary-bg) |
| 배경 (읽음) | `#FFFFFF` (bg-card) |
| 구분선 | 하단 `1px solid #E5E7EB` (border-light), 좌측 `56px` 오프셋 |
| Display | `flex`, `gap: 12px` |

#### 미읽음 점 (●)

| 속성 | 값 |
|------|-----|
| 크기 | `8 × 8px` |
| 색상 | `#2563EB` (primary) |
| 형태 | 원형 (`border-radius: 50%`) |
| 위치 | 아이콘 좌측, 아이템 좌측 `16px`에서 수직 중앙 |
| 읽음 시 | 숨김 (공간은 유지 — `visibility: hidden`) |

#### 유형별 아이콘

아이콘은 원형 배경 위에 배치한다.

| 유형 | 아이콘 | 배경색 | 아이콘 색상 |
|------|--------|--------|------------|
| 📢 공지 (N-01) | 확성기 SVG | `#DBEAFE` | `#2563EB` |
| 📅 일정 (N-02, N-04) | 캘린더 SVG | `#DBEAFE` | `#2563EB` |
| ⏰ 리마인더 (N-03) | 시계 SVG | `#FEF3C7` | `#D97706` |
| 💬 댓글 (N-05) | 말풍선 SVG | `#DBEAFE` | `#2563EB` |

| 속성 | 값 |
|------|-----|
| 아이콘 배경 크기 | `36 × 36px` |
| Border-radius | `50%` (원형) |
| 아이콘 SVG 크기 | `18 × 18px` (중앙 배치) |
| Stroke-width | `1.5` |
| Flex-shrink | `0` |

#### 텍스트 영역

| 요소 | 스타일 |
|------|--------|
| 제목 | `font-size: 14px; font-weight: 600; color: #111827; line-height: 1.4` |
| 제목 (읽음) | `font-weight: 500; color: #6B7280` |
| 본문 | `font-size: 13px; font-weight: 400; color: #374151; line-height: 1.4; max-height: 2.8em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical` |
| 본문 (읽음) | `color: #9CA3AF` |
| 시간 | `font-size: 12px; font-weight: 400; color: #9CA3AF; margin-top: 4px` |

### 3-4. CSS

```css
/* 알림 센터 컨테이너 */
.notification-list {
  background: #F9FAFB;
  min-height: calc(100vh - 56px - 64px); /* AppBar + BottomNav */
}

/* 알림 아이템 */
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  cursor: pointer;
  transition: background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.notification-item:active {
  background: #F3F4F6;
}

/* 미읽음 상태 */
.notification-item.unread {
  background: #EFF6FF;
}

.notification-item.unread:active {
  background: #DBEAFE;
}

/* 미읽음 점 */
.notification-dot {
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 50%;
  background: #2563EB;
  margin-top: 14px; /* 아이콘 중앙 정렬 */
  flex-shrink: 0;
}

.notification-item:not(.unread) .notification-dot {
  visibility: hidden;
}

/* 유형 아이콘 */
.notification-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon svg {
  width: 18px;
  height: 18px;
}

.notification-icon--notice,
.notification-icon--schedule,
.notification-icon--comment {
  background: #DBEAFE;
  color: #2563EB;
}

.notification-icon--reminder {
  background: #FEF3C7;
  color: #D97706;
}

/* 텍스트 영역 */
.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-item:not(.unread) .notification-title {
  font-weight: 500;
  color: #6B7280;
}

.notification-body {
  font-size: 13px;
  font-weight: 400;
  color: #374151;
  line-height: 1.4;
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-item:not(.unread) .notification-body {
  color: #9CA3AF;
}

.notification-time {
  font-size: 12px;
  font-weight: 400;
  color: #9CA3AF;
  margin-top: 4px;
}
```

### 3-5. 빈 상태

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│            🔔 (SVG 64px)            │
│                                     │
│       새로운 알림이 없습니다         │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; padding: 48px 24px` |
| 아이콘 | SVG 종 아이콘, `64 × 64px`, `stroke: #D1D5DB; stroke-width: 1` |
| 텍스트 | `font-size: 15px; color: #9CA3AF; margin-top: 16px` |

```css
.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 48px 24px;
}

.notification-empty svg {
  width: 64px;
  height: 64px;
  color: #D1D5DB;
}

.notification-empty p {
  font-size: 15px;
  color: #9CA3AF;
  margin-top: 16px;
}
```

### 3-6. 시간 표시 규칙

| 경과 시간 | 표시 |
|-----------|------|
| 1분 미만 | "방금" |
| 1~59분 | "N분 전" |
| 1~23시간 | "N시간 전" |
| 1일 (어제) | "어제" |
| 2~6일 | "N일 전" |
| 7일 이상 | "M/D" (예: "3/11") |

### 3-7. 스와이프 삭제

> **결정: 미구현** — 소규모 앱(33명)으로 알림 수가 적어 스와이프 삭제 불필요.
> "모두 읽음" 기능으로 충분. 향후 필요 시 추가.

---

## 4. 알림 설정 화면

### 4-1. 전체 레이아웃

```
┌─────────────────────────────────────┐
│  ← 알림 설정                        │  ← AppBar
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🔔 전체 알림           [===]  │  │  ← 마스터 스위치 (크기 대)
│  └───────────────────────────────┘  │
│                                     │
│  알림 유형                          │  ← 섹션 헤더
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 📢 공지 알림           [===]  │  │
│  │   새 공지사항이 등록되면 알림  │  │
│  ├───────────────────────────────┤  │
│  │ 📅 일정 알림           [===]  │  │
│  │   일정 등록/변경/취소 시 알림  │  │
│  ├───────────────────────────────┤  │
│  │ ⏰ 일정 리마인더       [===]  │  │
│  │   일정 하루 전 오전 9시 알림   │  │
│  ├───────────────────────────────┤  │
│  │ 💬 댓글 알림           [===]  │  │
│  │   내 글에 댓글이 달리면 알림   │  │
│  └───────────────────────────────┘  │
│                                     │
│  푸시 상태                          │  ← 섹션 헤더
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 푸시 알림: ✅ 활성            │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  홈 │ 게시판 │ 일정 │ 회원 │ 프로필  │
└─────────────────────────────────────┘
```

### 4-2. 진입 경로

프로필 탭 메뉴에 "알림 설정" 항목 추가:

```
프로필 화면
  ├── 내 정보 수정
  ├── 🔔 알림 설정     ← 신규
  ├── 비밀번호 변경
  └── 로그아웃
```

### 4-3. 섹션 헤더

| 속성 | 값 |
|------|-----|
| 폰트 | `12px`, `600`, `#9CA3AF` (text-hint) |
| 텍스트 변환 | `uppercase` (영문일 때) / 한글은 그대로 |
| 패딩 | `24px 16px 8px` |
| letter-spacing | `0.5px` |

```css
.alert-settings-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
  padding: 24px 16px 8px;
  letter-spacing: 0.5px;
}
```

### 4-4. 토글 스위치 디자인

iOS 스타일 토글 스위치. CSS-only 구현.

#### 기본 토글 (하위 항목용)

| 속성 | 값 |
|------|-----|
| 전체 크기 | `48 × 28px` |
| Border-radius | `14px` (반원) |
| 배경 (OFF) | `#D1D5DB` (border 색상) |
| 배경 (ON) | `#2563EB` (primary) |
| 전환 | `background 0.2s ease` |
| 노브 크기 | `24 × 24px` |
| 노브 색상 | `#FFFFFF` |
| 노브 그림자 | `0 1px 3px rgba(0,0,0,0.15)` |
| 노브 위치 (OFF) | `left: 2px` |
| 노브 위치 (ON) | `left: 22px` |
| 노브 전환 | `left 0.2s ease` |

#### 마스터 스위치 (전체 알림)

마스터 스위치는 하위 토글과 시각적으로 구분:

| 속성 | 값 |
|------|-----|
| 컨테이너 배경 | `#FFFFFF` (bg-card) |
| 패딩 | `20px 16px` (일반보다 4px 더) |
| 아이콘 크기 | `20px` (일반보다 2px 더) |
| 제목 폰트 | `15px`, `600` (일반: `14px`, `500`) |
| 하단 여백 | `4px` (섹션 헤더까지 간격) |

#### 마스터 OFF 시 하위 토글 비활성

| 요소 | 비활성 스타일 |
|------|-------------|
| 토글 배경 | `#E5E7EB` (neutral-bg보다 약간 진함) |
| 토글 노브 | `#F9FAFB` (흐릿) |
| 아이콘 색상 | `#D1D5DB` |
| 제목 색상 | `#D1D5DB` |
| 설명 색상 | `#E5E7EB` |
| 전체 opacity | `0.5` |
| pointer-events | `none` |

### 4-5. 설정 아이템 레이아웃

```
┌───────────────────────────────────────────┐
│  [아이콘]  제목                    [토글]  │
│           설명 텍스트                      │
└───────────────────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `display: flex; align-items: flex-start; padding: 16px; background: #FFFFFF; border-bottom: 1px solid #E5E7EB` |
| 아이콘 | SVG `18 × 18px`, `color: #2563EB`, `margin-right: 12px`, `margin-top: 1px` |
| 제목 | `font-size: 14px; font-weight: 500; color: #111827` |
| 설명 | `font-size: 12px; color: #9CA3AF; margin-top: 2px` |
| 토글 | 우측 정렬 (`margin-left: auto`) |

### 4-6. CSS

```css
/* 알림 설정 화면 */
.alert-settings-page {
  background: #F9FAFB;
  min-height: calc(100vh - 56px - 64px);
}

/* 마스터 스위치 카드 */
.alert-settings-master {
  background: #FFFFFF;
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.alert-settings-master .alert-settings-label {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

/* 설정 아이템 */
.alert-settings-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
}

.alert-settings-icon {
  width: 18px;
  height: 18px;
  min-width: 18px;
  color: #2563EB;
  margin-right: 12px;
  margin-top: 1px;
}

.alert-settings-text {
  flex: 1;
}

.alert-settings-label {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.alert-settings-desc {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 2px;
  line-height: 1.4;
}

/* 토글 스위치 */
.alert-settings-toggle {
  position: relative;
  width: 48px;
  height: 28px;
  min-width: 48px;
  margin-left: auto;
  cursor: pointer;
}

.alert-settings-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.alert-settings-toggle .toggle-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #D1D5DB;
  border-radius: 14px;
  transition: background 0.2s ease;
}

.alert-settings-toggle input:checked + .toggle-track {
  background: #2563EB;
}

.alert-settings-toggle .toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  background: #FFFFFF;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: left 0.2s ease;
}

.alert-settings-toggle input:checked ~ .toggle-knob {
  left: 22px;
}

/* 마스터 OFF → 하위 비활성 */
.alert-settings-group.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.alert-settings-group.disabled .toggle-track {
  background: #E5E7EB !important;
}

.alert-settings-group.disabled .toggle-knob {
  background: #F9FAFB;
}

/* 푸시 상태 섹션 */
.alert-settings-status {
  background: #FFFFFF;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #111827;
}

.alert-settings-status .status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.alert-settings-status .status-dot.active {
  background: #10B981;
}

.alert-settings-status .status-dot.inactive {
  background: #DC2626;
}
```

### 4-7. 토글 HTML 구조 (참고)

```html
<label class="alert-settings-toggle">
  <input type="checkbox" checked>
  <span class="toggle-track"></span>
  <span class="toggle-knob"></span>
</label>
```

---

## 5. 푸시 구독 유도 배너

### 5-1. 노출 조건

- 로그인 성공 후
- 푸시 미구독 상태 (아직 Notification 권한 요청 안 함)
- localStorage에 닫기 플래그 없거나 만료됨 (7일)

### 5-2. 레이아웃

```
┌─────────────────────────────────────┐
│  🔔  알림을 켜면 공지와 일정을       │
│      바로 받아볼 수 있어요!          │
│                                     │
│  [  알림 켜기  ]        [나중에]    │
└─────────────────────────────────────┘
```

### 5-3. 위치 & 스타일

| 속성 | 값 |
|------|-----|
| 위치 | 하단 고정 (BottomNav 위) |
| 하단 오프셋 | `72px` (BottomNav 64px + 여백 8px) |
| 좌우 마진 | `16px` |
| 패딩 | `16px` |
| 배경색 | `#FFFFFF` (bg-card) |
| Border | `1px solid #DBEAFE` |
| Border-radius | `12px` |
| Shadow | `0 4px 16px rgba(0, 0, 0, 0.10)` (shadow-md) |
| Z-index | `900` (BottomNav보다 낮은 레벨) |

### 5-4. 내부 요소

| 요소 | 스타일 |
|------|--------|
| 아이콘 | SVG 종 `24px`, `color: #2563EB` |
| 메시지 | `font-size: 14px; font-weight: 500; color: #111827; line-height: 1.5` |
| 메시지 영역 | `display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px` |
| 버튼 영역 | `display: flex; justify-content: flex-end; gap: 8px` |

### 5-5. 버튼 스타일

| 버튼 | 스타일 |
|------|--------|
| **알림 켜기** (CTA) | `background: #2563EB; color: #FFFFFF; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 8px; border: none` |
| **알림 켜기** hover | `background: #1D4ED8` |
| **나중에** | `background: transparent; color: #6B7280; font-size: 14px; font-weight: 500; padding: 10px 16px; border-radius: 8px; border: none` |
| **나중에** hover | `background: #F3F4F6` |

### 5-6. 진입/퇴장 애니메이션

| 진입 | 퇴장 |
|------|------|
| `slide-up` + `fade-in` (0.3s ease) | `slide-down` + `fade-out` (0.2s ease) |

```css
/* 푸시 구독 유도 배너 */
.push-subscribe-banner {
  position: fixed;
  bottom: 72px;
  left: 16px;
  right: 16px;
  max-width: 430px;
  margin: 0 auto;
  background: #FFFFFF;
  border: 1px solid #DBEAFE;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.10);
  z-index: 900;
  animation: push-banner-slide-up 0.3s ease;
}

.push-subscribe-banner.hiding {
  animation: push-banner-slide-down 0.2s ease forwards;
}

@keyframes push-banner-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes push-banner-slide-down {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

.push-subscribe-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.push-subscribe-message svg {
  width: 24px;
  height: 24px;
  min-width: 24px;
  color: #2563EB;
  margin-top: 1px;
}

.push-subscribe-message p {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  line-height: 1.5;
}

.push-subscribe-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.push-subscribe-btn {
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.push-subscribe-btn--primary {
  background: #2563EB;
  color: #FFFFFF;
}

.push-subscribe-btn--primary:active {
  background: #1D4ED8;
}

.push-subscribe-btn--ghost {
  background: transparent;
  color: #6B7280;
  font-weight: 500;
  padding: 10px 16px;
}

.push-subscribe-btn--ghost:active {
  background: #F3F4F6;
}
```

### 5-7. "나중에" 클릭 동작

- localStorage에 `push_banner_dismissed` 플래그 + 타임스탬프 저장
- 7일 후 다시 표시
- 3회 닫기 시 더 이상 표시하지 않음 (`push_banner_dismiss_count >= 3`)

### 5-8. 알림 권한 거부(denied) 시

"알림 켜기" 클릭 후 사용자가 권한을 거부하면:

```
┌─────────────────────────────────────┐
│  🔕  브라우저 설정에서 알림을        │
│      허용해주세요                    │
│                                     │
│                        [확인]       │
└─────────────────────────────────────┘
```

- 아이콘: 🔕 SVG (음소거 종), `color: #9CA3AF`
- 메시지 색상: `#6B7280`
- 확인 버튼: Ghost 스타일

---

## 6. PWA 설치 안내 배너

### 6-1. 노출 조건

- PWA가 아닌 브라우저에서 접속 (`!window.matchMedia('(display-mode: standalone)').matches`)
- 아직 닫지 않은 경우 (localStorage 체크)
- Push API 지원하는 브라우저

### 6-2. 레이아웃

```
┌──────────────────────────────────────────┐
│  📱  홈 화면에 추가하면             ✕   │
│      알림을 받을 수 있어요!              │
│                                          │
│  [추가 방법 보기]                        │
└──────────────────────────────────────────┘
```

### 6-3. 위치 & 스타일

구독 유도 배너와 동일한 스타일을 사용하되, **상단 고정**으로 위치 차별화.

| 속성 | 값 |
|------|-----|
| 위치 | 상단 고정 (AppBar 아래) |
| 상단 오프셋 | `64px` (AppBar 56px + 여백 8px) |
| 좌우 마진 | `16px` |
| 패딩 | `14px 16px` |
| 배경색 | `#EFF6FF` (primary-bg) |
| Border | `1px solid #DBEAFE` |
| Border-radius | `12px` |
| Shadow | `0 4px 16px rgba(0, 0, 0, 0.08)` |
| Z-index | `800` |

### 6-4. 내부 요소

| 요소 | 스타일 |
|------|--------|
| 아이콘 | 스마트폰 SVG `20px`, `color: #2563EB` |
| 닫기(✕) | `20 × 20px`, `color: #9CA3AF`, 우상단 `position: absolute; top: 14px; right: 14px` |
| 메시지 | `font-size: 13px; font-weight: 500; color: #111827; line-height: 1.5` |
| 버튼 | `font-size: 13px; font-weight: 600; color: #2563EB; background: transparent; padding: 8px 0; border: none` |

### 6-5. CSS

```css
/* PWA 설치 안내 배너 */
.push-install-banner {
  position: fixed;
  top: 64px;
  left: 16px;
  right: 16px;
  max-width: 430px;
  margin: 0 auto;
  background: #EFF6FF;
  border: 1px solid #DBEAFE;
  border-radius: 12px;
  padding: 14px 16px;
  padding-right: 40px; /* 닫기 버튼 공간 */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  z-index: 800;
  animation: push-banner-slide-down-enter 0.3s ease;
}

@keyframes push-banner-slide-down-enter {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.push-install-banner.hiding {
  animation: push-banner-slide-up-exit 0.2s ease forwards;
}

@keyframes push-banner-slide-up-exit {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-12px);
  }
}

.push-install-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0;
}

.push-install-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.push-install-message svg {
  width: 20px;
  height: 20px;
  min-width: 20px;
  color: #2563EB;
  margin-top: 1px;
}

.push-install-message p {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  line-height: 1.5;
}

.push-install-action {
  margin-top: 8px;
  margin-left: 30px; /* 아이콘 + gap 정렬 */
}

.push-install-action button {
  font-size: 13px;
  font-weight: 600;
  color: #2563EB;
  background: transparent;
  padding: 8px 0;
  border: none;
  cursor: pointer;
}
```

### 6-6. "추가 방법 보기" 클릭 → OS별 안내 모달

#### 모달 레이아웃

```
┌─────────────────────────────────────┐
│                                     │
│  홈 화면에 추가하기              ✕  │
│                                     │
│  ──── Android (Chrome) ──────────  │
│                                     │
│  1. 우측 상단 ⋮ (더보기) 클릭       │
│  2. "홈 화면에 추가" 선택           │
│  3. "추가" 확인                     │
│                                     │
│  ──── iOS (Safari) ──────────────  │
│                                     │
│  1. 하단 □↑ (공유) 버튼 탭          │
│  2. "홈 화면에 추가" 선택           │
│  3. "추가" 확인                     │
│                                     │
│  ※ iOS는 Safari에서만 가능합니다    │
│                                     │
└─────────────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 오버레이 | `background: rgba(0,0,0,0.5); z-index: 1000` |
| 모달 | `background: #FFFFFF; border-radius: 16px; max-width: 360px; margin: auto; padding: 24px` |
| 제목 | `font-size: 18px; font-weight: 700; color: #111827` |
| 닫기 | `24px`, `#9CA3AF`, 우상단 |
| OS 제목 | `font-size: 13px; font-weight: 600; color: #2563EB; margin: 20px 0 12px` |
| 단계 텍스트 | `font-size: 14px; color: #374151; line-height: 1.6` |
| 단계 숫자 | `font-weight: 600; color: #2563EB` |
| 참고 텍스트 | `font-size: 12px; color: #9CA3AF; margin-top: 16px` |

### 6-7. "닫기" 동작

- localStorage에 `pwa_install_dismissed` 플래그 + 타임스탬프 저장
- 7일 후 다시 표시

---

## 7. 푸시 알림 디자인 (OS 알림 영역)

### 7-1. 알림 구성

```
┌─────────────────────────────────────┐
│  [앱아이콘] 영등포 JC     · 방금     │
│  📢 새 공지사항                      │
│  3월 정기 이사회 안내 — 3월 정기     │
│  이사회를 안내합니다...              │
└─────────────────────────────────────┘
```

### 7-2. 알림 콘텐츠 가이드

| 요소 | 스펙 |
|------|------|
| 앱 이름 | "영등포 JC" (manifest.json `short_name`) |
| 아이콘 | `icon-192.png` (192×192) |
| 배지 아이콘 | `badge-72.png` (72×72, 모노크롬 — Android 상태바) |
| 제목 최대 길이 | 40자 (초과 시 OS가 자동 말줄임) |
| 본문 최대 길이 | 80자 (초과 시 OS가 자동 말줄임) |

### 7-3. 유형별 알림 예시

| 유형 | 제목 | 본문 예시 |
|------|------|----------|
| N-01 공지 | 📢 새 공지사항 | "3월 정기 이사회 안내" |
| N-02 일정 등록 | 📅 새 일정 등록 | "3월 봉사활동 — 2026.03.20 09:00 영등포구청" |
| N-03 리마인더 | ⏰ 내일 일정 | "내일 14:00 3월 정기 이사회 — 영등포구청 3층" |
| N-04 일정 변경 | 📅 일정 변경 | "3월 정기 이사회 날짜가 3/22로 변경되었습니다" |
| N-04 일정 취소 | ❌ 일정 취소 | "3월 봉사활동이 취소되었습니다" |
| N-05 댓글 | 💬 새 댓글 | "김영등님이 댓글을 남겼습니다: 참석합니다!" |

### 7-4. PWA 아이콘 세트 제작 가이드

| 파일명 | 크기 | 용도 | 디자인 |
|--------|------|------|--------|
| `icon-192.png` | 192×192 | PWA 아이콘 | `#2563EB` 배경 + 흰색 "JC" 텍스트 |
| `icon-512.png` | 512×512 | PWA 스플래시 | 동일 |
| `icon-maskable-192.png` | 192×192 | Android adaptive icon | 동일 (safe zone 80%: 중앙 154×154에 로고) |
| `icon-maskable-512.png` | 512×512 | Android adaptive icon | 동일 (safe zone 80%: 중앙 410×410에 로고) |
| `badge-72.png` | 72×72 | Android 알림 배지 | 흰색 배경 + `#2563EB` "JC" (모노크롬) |
| `apple-touch-icon.png` | 180×180 | iOS 홈 화면 | `#2563EB` 배경 + 흰색 "JC" 텍스트 |

#### 아이콘 디자인 스펙

```
┌────────────────────┐
│                    │
│    ┌──────────┐   │  ← #2563EB 배경 (전체)
│    │          │   │
│    │   JC     │   │  ← 흰색 텍스트, 중앙 배치
│    │          │   │     폰트: Noto Sans KR, Bold
│    └──────────┘   │     크기: 아이콘 높이의 40%
│                    │
└────────────────────┘
```

| 속성 | 값 |
|------|-----|
| 배경색 | `#2563EB` (primary) |
| 텍스트 | "JC" |
| 텍스트 색상 | `#FFFFFF` |
| 폰트 | Noto Sans KR, Bold |
| 텍스트 크기 | 아이콘 높이의 40% |
| 텍스트 위치 | 수직/수평 정중앙 |
| Corner radius (일반) | `0` (OS가 자동 적용) |
| Maskable safe zone | 중앙 80% 영역 내에 텍스트 배치 |
| Badge (모노크롬) | 투명 배경 + 흰색 "JC" |

---

## 8. 반응형 디자인

### 8-1. 뷰포트별 조정

| 뷰포트 | 조정 사항 |
|---------|----------|
| **≥ 430px** | 기본 레이아웃 (모든 스펙 그대로) |
| **< 430px** | 배너 좌우 마진 `12px`, 알림 아이템 패딩 `14px` |
| **< 360px** | 배너 border-radius `8px`, 아이콘 배경 `32px`, 폰트 1px 축소 |

### 8-2. 반응형 CSS

```css
@media (max-width: 429px) {
  .push-subscribe-banner,
  .push-install-banner {
    left: 12px;
    right: 12px;
  }

  .notification-item {
    padding: 14px;
  }
}

@media (max-width: 359px) {
  .push-subscribe-banner,
  .push-install-banner {
    border-radius: 8px;
  }

  .notification-icon {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }

  .notification-icon svg {
    width: 16px;
    height: 16px;
  }

  .notification-title {
    font-size: 13px;
  }

  .notification-body {
    font-size: 12px;
  }
}
```

---

## 9. 접근성

| 컴포넌트 | 접근성 구현 |
|----------|-----------|
| 앱바 종 아이콘 | `role="button"`, `aria-label="알림 N건"` |
| 배지 | `aria-hidden="true"` (아이콘 aria-label에 포함) |
| 알림 리스트 | `role="list"` |
| 알림 아이템 | `role="listitem"`, `aria-label="[유형] [제목] [시간]"` |
| 미읽음 점 | `aria-hidden="true"` (아이템 전체에 `aria-label`로 포함) |
| 모두 읽음 | `role="button"`, `aria-label="모든 알림 읽음 처리"` |
| 토글 스위치 | `role="switch"`, `aria-checked="true/false"`, `aria-label="공지 알림"` |
| 마스터 OFF | 하위 토글에 `aria-disabled="true"` |
| 구독 배너 | `role="alert"`, `aria-live="polite"` |
| 설치 배너 | `role="banner"`, `aria-label="PWA 설치 안내"` |
| 닫기 버튼 | `aria-label="배너 닫기"` |

---

## 10. 인터랙션 요약

| 동작 | 반응 |
|------|------|
| 앱바 종 아이콘 탭 | → 알림 센터 화면 이동 |
| 알림 아이템 탭 | → read_at 업데이트 + 해당 콘텐츠 상세 이동 |
| "모두 읽음" 탭 | → 전체 read_at 일괄 업데이트 + UI 갱신 |
| 토글 스위치 탭 | → 즉시 API PUT + 낙관적 UI 업데이트 |
| 마스터 OFF | → 하위 토글 전체 비활성 (값 유지) |
| 마스터 ON | → 하위 토글 복원 |
| "알림 켜기" 탭 | → Notification.requestPermission() → 구독 → 배너 숨김 |
| "나중에" 탭 | → 배너 slide-down 퇴장 + localStorage 저장 |
| "추가 방법 보기" | → OS별 안내 모달 표시 |

---

## 11. 프론트엔드 전달 사항

### 11-1. 구현 순서 (Phase별)

#### Phase 1 — MVP

| 순서 | 컴포넌트 | 파일 |
|------|----------|------|
| 1 | PWA 아이콘 6종 제작 | `web/image/` |
| 2 | 푸시 구독 유도 배너 | `web/js/push.js` + `main.css` |
| 3 | 앱바 알림 아이콘 + 배지 | `web/js/app.js` + `main.css` |

#### Phase 2 — 완성

| 순서 | 컴포넌트 | 파일 |
|------|----------|------|
| 4 | 알림 센터 화면 | `web/js/notifications.js` + `main.css` |
| 5 | 알림 설정 화면 | `web/js/notification-settings.js` + `main.css` |
| 6 | PWA 설치 안내 배너 | `web/js/push.js` + `main.css` |

### 11-2. CSS 클래스명 규칙

| 영역 | 프리픽스 | 예시 |
|------|----------|------|
| 앱바 알림 | `.notification-badge-*` | `.notification-badge-wrap`, `.notification-badge-count` |
| 알림 센터 | `.notification-*` | `.notification-list`, `.notification-item`, `.notification-dot` |
| 알림 설정 | `.alert-settings-*` | `.alert-settings-toggle`, `.alert-settings-item` |
| 구독 배너 | `.push-subscribe-*` | `.push-subscribe-banner`, `.push-subscribe-btn` |
| 설치 배너 | `.push-install-*` | `.push-install-banner`, `.push-install-close` |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-11 | 기획자 요청서 → 상세 UI 가이드 확장 (6개 컴포넌트 전체 명세) |
