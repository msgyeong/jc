# 13. 전화걸기 (Click-to-Call) UI 가이드

> 작성일: 2026-03-10
> 작성자: 디자이너 에이전트
> 기반: 07-unified-design-guide.md, 11-mobile-color-renewal.md (Blue+Gray 2톤)
> 대상: 모바일 웹 (`web/js/members.js`, `web/js/profile.js`)

---

## 1. 개요

회원 목록 및 프로필에서 **전화번호를 탭하여 바로 전화를 걸 수 있는** UI 명세.
`<a href="tel:010-xxxx-xxxx">` 네이티브 연동 기반.

---

## 2. 회원 목록에서의 전화 아이콘

### 레이아웃

```
┌───────────────────────────────────────────┐
│  [아] 홍길동              회장     📞      │  ← 회원 카드 아이템
│       부서명                               │
├───────────────────────────────────────────┤
│  [아] 김철수              부회장   📞      │
│       부서명                               │
└───────────────────────────────────────────┘
```

- 전화 아이콘은 **카드 아이템의 가장 오른쪽**에 배치
- 아이콘 → 이름/직책 영역과 `margin-left: auto`로 분리

### 아이콘 위치 스펙

| 속성 | 값 |
|------|-----|
| 위치 | 회원 아이템 행의 우측 끝 (flex 아이템, `margin-left: auto`) |
| 아이콘과 직책 간격 | `12px` |
| 수직 정렬 | `align-self: center` (아이템 중앙) |

---

## 3. 전화 아이콘 SVG 규격

### 아이콘 스펙

| 속성 | 값 |
|------|-----|
| 크기 | `20px × 20px` |
| Stroke | `currentColor` |
| Stroke-width | `1.5` |
| Fill | `none` |
| Color (기본) | `#2563EB` (Primary) |
| Color (hover/active) | `#1D4ED8` (Primary Hover) |

### SVG 코드

```html
<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6
           19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81
           a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339
           1.85.573 2.81.7A2 2 0 0122 16.92z"/>
</svg>
```

### 터치 영역 래퍼

| 속성 | 값 |
|------|-----|
| 터치 영역 크기 | `40px × 40px` (아이콘 20px + 패딩) |
| 패딩 | `10px` (아이콘 주변 사방) |
| Border-radius | `50%` (원형 터치 영역) |
| Background (기본) | `transparent` |
| Background (active) | `#EFF6FF` (Primary BG) |
| Transition | `background 0.15s ease` |

### CSS 예시

```css
.call-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #2563EB;
  transition: background 0.15s ease;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.call-btn:hover {
  background: #EFF6FF;
}

.call-btn:active {
  background: #DBEAFE;
  color: #1D4ED8;
}

.call-btn svg {
  width: 20px;
  height: 20px;
}
```

---

## 4. 전화번호 텍스트 스타일

### 프로필 / 회원 상세에서의 전화번호 표시

```
┌─────────────────────────────────────┐
│  연락처                              │
│  📞  010-1234-5678                  │  ← 탭하면 전화 연결
└─────────────────────────────────────┘
```

### 텍스트 스타일

| 속성 | 값 |
|------|-----|
| Color | `#2563EB` (Primary) |
| Font-size | `15px` |
| Font-weight | `500` |
| Text-decoration | `underline` |
| Text-underline-offset | `2px` |
| Text-decoration-color | `#93C5FD` (Primary Light — 연한 밑줄) |
| Cursor | `pointer` |

### 터치 영역

| 속성 | 값 |
|------|-----|
| 최소 높이 | `44px` (Apple HIG) |
| Padding | `8px 0` (상하 여백으로 터치 영역 확보) |
| Display | `inline-flex; align-items: center; gap: 6px` |

### Hover / Active 상태

| 상태 | 변경 사항 |
|------|----------|
| **Hover** | `text-decoration-color: #2563EB` (밑줄 진해짐) |
| **Active** | `color: #1D4ED8; text-decoration-color: #1D4ED8` |

### CSS 예시

```css
.phone-link {
  color: #2563EB;
  font-size: 15px;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: #93C5FD;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 8px 0;
  transition: text-decoration-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.phone-link:hover {
  text-decoration-color: #2563EB;
}

.phone-link:active {
  color: #1D4ED8;
  text-decoration-color: #1D4ED8;
}
```

### HTML 예시

```html
<a href="tel:010-1234-5678" class="phone-link">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07
             19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3
             a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91
             a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7
             A2 2 0 0122 16.92z"/>
  </svg>
  010-1234-5678
</a>
```

---

## 5. 전화번호 없는 경우

| 상태 | UI |
|------|-----|
| 전화번호 미등록 | 전화 아이콘 `color: #D1D5DB` (비활성 회색), `pointer-events: none` |
| 텍스트 | "전화번호 미등록" — `font-size: 13px; color: #9CA3AF; font-style: italic` |

```css
.call-btn--disabled {
  color: #D1D5DB;
  pointer-events: none;
  cursor: default;
}

.phone-link--empty {
  color: #9CA3AF;
  font-style: italic;
  text-decoration: none;
  pointer-events: none;
}
```

---

## 6. 접근성

- `<a href="tel:...">` 사용으로 스크린리더 호환
- 아이콘 전용 버튼에 `aria-label="전화걸기"` 필수
- 터치 영역 최소 `40px × 40px` 보장

```html
<a href="tel:010-1234-5678" class="call-btn" aria-label="홍길동에게 전화걸기">
  <svg ...>...</svg>
</a>
```

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-10 | 초안 작성 — 아이콘 규격, 텍스트 스타일, 터치 영역, 접근성 |
