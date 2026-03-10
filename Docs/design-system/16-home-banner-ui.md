# 16. 홈 배너 UI 가이드

> 작성일: 2026-03-10
> 작성자: 디자이너 에이전트
> 기반: 07-unified-design-guide.md, 11-mobile-color-renewal.md (Blue+Gray 2톤)
> 참조: Docs/home-screen-plan-2026-03-09.md (홈 화면 기획)
> 대상: 모바일 웹 (`web/js/home.js`, `web/styles/main.css`)

---

## 1. 개요

홈 화면 최상단에 위치하는 배너 캐러셀. 관리자가 등록한 배너(홍보/행사/공지 하이라이트)를 자동 슬라이드 + 수동 스와이프로 순환 표시한다.

---

## 2. 전체 레이아웃

```
┌─────────────────────────────────────┐
│  영등포JC                        🔔 │  ← AppBar
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │                              │   │
│  │  [배너 콘텐츠 영역]          │   │  ← 160px 고정 높이
│  │                              │   │
│  │          ● ○ ○               │   │  ← 인디케이터 점
│  └─────────────────────────────┘   │
│                                     │
│  (이하 공지사항, 일정 등)           │
└─────────────────────────────────────┘
```

---

## 3. 배너 캐러셀 컨테이너

### 3-1. 스펙

| 속성 | 값 | CSS 변수 |
|------|-----|----------|
| Width | `100%` (양쪽 패딩 `16px`) | — |
| Height | `160px` (고정) | — |
| Border-radius | `12px` | — |
| Overflow | `hidden` | — |
| Margin | `16px 16px 0` | — |
| Position | `relative` | — |

### 3-2. 배너 0개일 때

- **섹션 전체 숨김** (`display: none`)
- 빈 공간 발생하지 않음
- 공지사항 섹션이 최상단으로 올라옴

```css
.banner-carousel {
  position: relative;
  width: calc(100% - 32px);
  height: 160px;
  margin: 16px 16px 0;
  border-radius: 12px;
  overflow: hidden;
}

.banner-carousel:empty,
.banner-carousel--hidden {
  display: none;
}
```

---

## 4. 배너 슬라이드 트랙

### 4-1. 구조

```
[슬라이드 트랙] ← width: (배너 수 × 100%), translateX로 이동
  ├─ [배너 1] width: 100%
  ├─ [배너 2] width: 100%
  └─ [배너 3] width: 100%
```

### 4-2. 스펙

| 속성 | 값 |
|------|-----|
| Display | `flex` |
| Transition | `transform 0.4s ease` |
| Width | `(배너 수 × 100%)` |
| Touch-action | `pan-y` (수직 스크롤은 허용, 수평은 JS 처리) |

```css
.banner-track {
  display: flex;
  height: 100%;
  transition: transform 0.4s ease;
  will-change: transform;
}

.banner-slide {
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  position: relative;
}
```

---

## 5. 배너 콘텐츠 유형별 레이아웃

### 5-1. 유형 A: 이미지 배너

이미지가 있는 경우 전체 배경으로 표시 + 하단 그라디언트 오버레이.

```
┌─────────────────────────────────────┐
│                                     │
│       (배너 이미지 전체 배경)        │
│                                     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← 하단 그라디언트 오버레이
│  업체명/행사명                      │
│  짧은 홍보 문구                     │
│              ● ○ ○                  │
└─────────────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 이미지 | `width: 100%; height: 100%; object-fit: cover` |
| 그라디언트 오버레이 | `position: absolute; bottom: 0; left: 0; right: 0; height: 80px; background: linear-gradient(transparent, rgba(0,0,0,0.6))` |
| 제목 | `position: absolute; bottom: 36px; left: 16px; right: 16px; font-size: 16px; font-weight: 700; color: #FFFFFF; text-shadow: 0 1px 3px rgba(0,0,0,0.3)` |
| 부제 | `position: absolute; bottom: 16px; left: 16px; right: 16px; font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.85)` |

### 5-2. 유형 B: 컬러 배경 배너 (이미지 없을 때)

이미지가 없으면 `bg_color` 값으로 그라디언트 배경 생성.

```
┌─────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░ 블루 그라디언트 ░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                     │
│  업체명/행사명                      │
│  짧은 홍보 문구                     │
│              ● ○ ○                  │
└─────────────────────────────────────┘
```

#### 기본 그라디언트 3종 (Blue+Gray 2톤 원칙)

| 순서 | 그라디언트 | 용도 |
|------|-----------|------|
| 1 (기본) | `linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)` | 미디엄 블루 |
| 2 | `linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)` | 딥 네이비 |
| 3 | `linear-gradient(135deg, #1D4ED8 0%, #93C5FD 100%)` | 코발트→스카이 |

| 요소 | 스타일 |
|------|--------|
| 배경 | 위 그라디언트 중 1개 (관리자가 지정하거나, `display_order % 3`으로 자동 배정) |
| 제목 | `position: absolute; bottom: 36px; left: 16px; right: 16px; font-size: 18px; font-weight: 700; color: #FFFFFF` |
| 부제 | `position: absolute; bottom: 14px; left: 16px; right: 16px; font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.8)` |

### 5-3. 유형 공통 CSS

```css
.banner-slide--image {
  position: relative;
}

.banner-slide--image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}

.banner-slide--color {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
}

.banner-title {
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.banner-slide--color .banner-title {
  font-size: 18px;
}

.banner-subtitle {
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 이미지 배너의 텍스트는 오버레이 위 */
.banner-slide--image .banner-text-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  z-index: 1;
}
```

---

## 6. 인디케이터 점 (Dots)

### 6-1. 레이아웃

```
          ● ○ ○
```

배너 하단 중앙에 위치.

### 6-2. 스펙

| 속성 | 값 |
|------|-----|
| 컨테이너 | `position: absolute; bottom: 8px; left: 0; right: 0; display: flex; justify-content: center; gap: 6px; z-index: 2` |
| 비활성 점 | `width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.4); transition: all 0.3s ease` |
| 활성 점 | `width: 18px; height: 6px; border-radius: 3px; background: #FFFFFF` |
| 배너 1개일 때 | 인디케이터 숨김 |

```css
.banner-indicators {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  z-index: 2;
}

.banner-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
  cursor: pointer;
}

.banner-dot.active {
  width: 18px;
  border-radius: 3px;
  background: #FFFFFF;
}

/* 배너 1개일 때 인디케이터 숨김 */
.banner-indicators:has(.banner-dot:only-child) {
  display: none;
}
```

---

## 7. 자동 전환 타이밍

### 7-1. 규칙

| 항목 | 값 |
|------|-----|
| 자동 슬라이드 간격 | **4초** |
| 슬라이드 전환 시간 | `0.4s ease` |
| 마지막 → 첫번째 | 자연스럽게 순환 (무한 루프) |
| 사용자 스와이프 후 | 자동 타이머 리셋 (4초 후 재개) |
| 화면 비활성 시 | `visibilitychange` 이벤트로 자동 전환 일시정지 |
| 배너 1개 | 자동 전환 비활성, 스와이프 비활성 |

### 7-2. 구현 로직 (참고)

```javascript
// 자동 전환 로직
let autoSlideTimer;
const SLIDE_INTERVAL = 4000; // 4초

function startAutoSlide() {
  stopAutoSlide();
  autoSlideTimer = setInterval(() => {
    goToNextSlide();
  }, SLIDE_INTERVAL);
}

function stopAutoSlide() {
  clearInterval(autoSlideTimer);
}

// 사용자 터치 시 타이머 리셋
carousel.addEventListener('touchstart', stopAutoSlide);
carousel.addEventListener('touchend', () => {
  setTimeout(startAutoSlide, SLIDE_INTERVAL);
});

// 화면 비활성 시 정지
document.addEventListener('visibilitychange', () => {
  document.hidden ? stopAutoSlide() : startAutoSlide();
});
```

---

## 8. 스와이프 인터랙션

### 8-1. 터치 스와이프

| 항목 | 값 |
|------|-----|
| 최소 스와이프 거리 | `30px` (이하면 무시) |
| 방향 판별 | 수평 이동 > 수직 이동일 때만 슬라이드 전환 |
| 드래그 중 미리보기 | 터치 이동량만큼 트랙 따라감 (`transition: none` 중) |
| 드래그 종료 | 30px 이상이면 전환, 미만이면 원래 위치 복귀 |
| 전환 방향 | 왼쪽 스와이프 → 다음, 오른쪽 스와이프 → 이전 |

### 8-2. 데스크탑 (마우스)

- 좌우 화살표 버튼 표시 (hover 시 fade-in)
- 인디케이터 점 클릭으로도 이동 가능

### 8-3. 화살표 버튼 (데스크탑)

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `position: absolute; top: 50%; transform: translateY(-50%); z-index: 2` |
| 좌측 | `left: 8px` |
| 우측 | `right: 8px` |
| 크기 | `32×32px; border-radius: 50%; background: rgba(255,255,255,0.7); backdrop-filter: blur(4px)` |
| 아이콘 | SVG chevron `14×14`, `stroke: #374151; stroke-width: 2` |
| 호버 | `background: rgba(255,255,255,0.9)` |
| 모바일 | `display: none` |

```css
.banner-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.banner-carousel:hover .banner-arrow {
  opacity: 1;
}

.banner-arrow--left {
  left: 8px;
}

.banner-arrow--right {
  right: 8px;
}

.banner-arrow:hover {
  background: rgba(255, 255, 255, 0.9);
}

/* 모바일에서 화살표 숨김 */
@media (max-width: 768px) {
  .banner-arrow {
    display: none;
  }
}
```

---

## 9. 배너 클릭 동작

| link_type | 동작 |
|-----------|------|
| `external` | `window.open(link_url, '_blank')` — 새 탭/브라우저 |
| `notice` | 앱 내 공지 상세 화면 이동 (`showNoticeDetail(link_target_id)`) |
| `schedule` | 앱 내 일정 상세 화면 이동 (`showScheduleDetail(link_target_id)`) |
| 링크 없음 | 클릭 무반응 (cursor: default) |

```css
.banner-slide[data-link] {
  cursor: pointer;
}

.banner-slide:not([data-link]) {
  cursor: default;
}
```

---

## 10. 모바일 반응형 기준

### 뷰포트별 조정

| 뷰포트 | 조정 사항 |
|---------|----------|
| **≥ 480px** | 기본 레이아웃 (160px, 양쪽 margin 16px) |
| **< 480px** | 높이 `140px`, 제목 `font-size: 15px`, 부제 `font-size: 12px` |
| **< 360px** | 높이 `120px`, margin `12px`, 인디케이터 점 `5px` |

### 반응형 CSS

```css
@media (max-width: 479px) {
  .banner-carousel {
    height: 140px;
  }

  .banner-title {
    font-size: 15px;
  }

  .banner-slide--color .banner-title {
    font-size: 16px;
  }

  .banner-subtitle {
    font-size: 12px;
  }
}

@media (max-width: 359px) {
  .banner-carousel {
    height: 120px;
    margin: 12px 12px 0;
    width: calc(100% - 24px);
  }

  .banner-dot {
    width: 5px;
    height: 5px;
  }

  .banner-dot.active {
    width: 14px;
  }
}
```

---

## 11. 접근성

| 항목 | 구현 |
|------|------|
| `role="region"` | 캐러셀 컨테이너에 적용 |
| `aria-label` | `"홈 배너"` |
| `aria-roledescription` | `"carousel"` |
| 각 슬라이드 | `role="group"`, `aria-roledescription="slide"`, `aria-label="배너 N/M"` |
| 인디케이터 | `aria-label="배너 N으로 이동"`, `aria-current="true"` (활성) |
| 자동 전환 | `aria-live="polite"` — 스크린 리더가 변경 알림 |

---

## 12. CSS 변수 정리

| 변수명 | 값 | 용도 |
|--------|-----|------|
| `--c-primary` | `#2563EB` | 컬러 배경 그라디언트 기본 |
| `--c-bg-card` | `#FFFFFF` | 화살표 배경 |
| `--c-text` | `#111827` | — |
| `--c-text-sub` | `#374151` | 화살표 아이콘 |
| `--c-border-light` | `#E5E7EB` | — |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-10 | 초안 작성 — 배너 캐러셀, 인디케이터, 스와이프, 자동 전환, 유형별 레이아웃 |
