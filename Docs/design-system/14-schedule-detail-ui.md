# 14. 일정 상세 화면 UI 가이드

> 작성일: 2026-03-10
> 작성자: 디자이너 에이전트
> 기반: 07-unified-design-guide.md, 11-mobile-color-renewal.md (Blue+Gray 2톤)
> 참조: Docs/features/schedule-detail.md (기획서), 12-attendance-vote-ui.md (출석투표)
> 대상: 모바일 웹 (`web/js/schedules.js`, `web/styles/main.css`)

---

## 1. 개요

캘린더에서 일정 카드를 클릭하면 진입하는 상세 화면. 일정 기본 정보, 출석투표, 참석자 명단, 연결 공지, 댓글 섹션을 수직으로 배치한다.

---

## 2. 전체 레이아웃

```
┌─────────────────────────────────────┐
│  ← 뒤로          일정 상세    ⋮     │  ← AppBar
├─────────────────────────────────────┤
│  [카테고리 배지]                     │
│  제목 (h2)                          │
│                                     │
│  📅 날짜/시간 행                    │
│  📍 장소 행 (지도 링크)             │
│  ✏️ 작성자 행                       │
│  🕐 등록일 행                       │
├─────────────────────────────────────┤
│  설명 텍스트                        │
├─────────────────────────────────────┤
│  출석투표 카드 (12번 가이드 참조)     │
├─────────────────────────────────────┤
│  참석자 명단                        │
├─────────────────────────────────────┤
│  연결된 공지 배너                   │
├─────────────────────────────────────┤
│  댓글 섹션                          │
├─────────────────────────────────────┤
│  [댓글 입력...]            [전송]   │  ← 하단 고정
└─────────────────────────────────────┘
```

---

## 3. AppBar (헤더)

### 3-1. 레이아웃

```
┌─────────────────────────────────────┐
│  ← 뒤로          일정 상세    ⋮     │
└─────────────────────────────────────┘
```

### 3-2. 스펙

| 요소 | 스타일 | CSS 변수 |
|------|--------|----------|
| 컨테이너 | `height: 56px; background: var(--primary-color); color: #FFFFFF; display: flex; align-items: center; padding: 0 16px` | `--primary-color: #2563EB` |
| 뒤로가기 버튼 | `width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center` | — |
| 뒤로가기 아이콘 | SVG `20×20`, `stroke: #FFFFFF; stroke-width: 2; fill: none` | — |
| 타이틀 | `font-size: 18px; font-weight: 700; color: #FFFFFF; flex: 1; text-align: center` | — |
| 더보기(⋮) 버튼 | `width: 40px; height: 40px; border-radius: 50%` — 작성자/admin에게만 표시 | — |
| 더보기 아이콘 | SVG 점 3개 세로, `4px` dot, `fill: #FFFFFF` | — |

### 3-3. 더보기 드롭다운 메뉴

```
        ┌──────────────┐
        │  ✏️ 수정     │
        │  ─────────── │
        │  🗑️ 삭제     │
        └──────────────┘
```

| 속성 | 값 |
|------|-----|
| Background | `#FFFFFF` |
| Border-radius | `8px` |
| Box-shadow | `0 4px 16px rgba(0,0,0,0.10)` (--shadow-md) |
| Min-width | `120px` |
| Padding | `4px 0` |
| 메뉴 아이템 | `padding: 12px 16px; font-size: 14px; color: #111827` |
| 삭제 텍스트 | `color: #DC2626` (--c-danger) |
| 호버 배경 | `#F9FAFB` (--c-bg) |
| 구분선 | `1px solid #F3F4F6; margin: 4px 16px` |
| 위치 | `position: absolute; right: 16px; top: 52px; z-index: 100` |

---

## 4. 카테고리 배지

### 4-1. 레이아웃

카드 상단에 pill 형태 배지로 표시.

### 4-2. 색상 매핑

| 카테고리 | 레이블 | Background | Text Color | CSS 클래스 |
|----------|--------|-----------|------------|------------|
| `event` | 행사 | `#DBEAFE` | `#1E40AF` | `.badge-event` |
| `meeting` | 회의 | `#FEF3C7` | `#92400E` | `.badge-meeting` |
| `training` | 교육 | `#D1FAE5` | `#065F46` | `.badge-training` |
| `holiday` | 휴일 | `#FEE2E2` | `#991B1B` | `.badge-holiday` |
| `other` | 기타 | `#F3F4F6` | `#374151` | `.badge-other` |

### 4-3. 스타일

```css
.schedule-category-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}
```

---

## 5. 기본 정보 카드

### 5-1. 컨테이너

| 속성 | 값 | CSS 변수 |
|------|-----|----------|
| Background | `#FFFFFF` | `--c-bg-card` |
| Padding | `20px 16px` | — |
| Margin | `0` (AppBar 바로 아래) | — |

### 5-2. 제목

| 속성 | 값 |
|------|-----|
| Font-size | `20px` |
| Font-weight | `700` |
| Color | `#111827` (--c-text) |
| Margin-top | `4px` |
| Line-height | `1.4` |

### 5-3. 정보 행 (날짜/장소/작성자/등록일)

```
┌─────────────────────────────────────┐
│  📅 2026.03.15 (토) 14:00 ~ 16:00  │
│  📍 영등포구청 3층 대회의실  🗺️     │
│  ✏️ 김회장                          │
│  🕐 3일 전 등록                     │
└─────────────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 아이콘 | SVG `16×16`, `stroke: #6B7280; stroke-width: 1.5; fill: none; flex-shrink: 0` |
| 행 레이아웃 | `display: flex; align-items: center; gap: 8px; padding: 6px 0` |
| 텍스트 | `font-size: 14px; color: #374151; line-height: 1.5` |
| 날짜 텍스트 | `font-weight: 500` — 다른 행보다 약간 굵게 |
| 보조 텍스트(작성자, 등록일) | `color: #6B7280` (--c-text-sub) |
| 행 간 간격 | `gap: 0` (padding으로 처리) |
| 첫 행 margin-top | `16px` |

### 5-4. 장소 — 지도 링크

```css
.schedule-location-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
}

.schedule-location-text {
  font-size: 14px;
  color: #374151;
  flex: 1;
}

.schedule-map-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #EFF6FF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.schedule-map-icon:active {
  background: #DBEAFE;
}

.schedule-map-icon svg {
  width: 16px;
  height: 16px;
  stroke: var(--primary-color, #2563EB);
  stroke-width: 1.5;
  fill: none;
}
```

- 지도 아이콘 클릭 → `https://map.naver.com/v5/search/{location}` 새 탭 열기
- 장소가 NULL이면 행 자체 렌더링하지 않음

### 5-5. 종일 이벤트 표시

| 조건 | 날짜 표시 형식 |
|------|---------------|
| 종일 (같은 날) | `2026.03.15 (토) 종일` |
| 종일 (여러 날) | `2026.03.15 (토) ~ 2026.03.16 (일)` |
| 시간 있음 | `2026.03.15 (토) 14:00 ~ 16:00` |

"종일" 텍스트: `font-size: 12px; font-weight: 500; color: #2563EB; background: #EFF6FF; padding: 2px 8px; border-radius: 4px; margin-left: 4px`

---

## 6. 설명 섹션

### 6-1. 레이아웃

```
┌─────────────────────────────────────┐
│  설명                               │
│  ─────────────────────────────────  │
│  3월 정기 이사회입니다.              │
│  안건:                              │
│  1. 2026년 상반기 예산 승인          │
│  2. 신규 회원 가입 승인 건           │
└─────────────────────────────────────┘
```

### 6-2. 스펙

| 요소 | 스타일 |
|------|--------|
| 섹션 컨테이너 | `background: #FFFFFF; padding: 16px; margin-top: 8px` |
| 섹션 제목 | `font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px` |
| 구분선 | `1px solid #F3F4F6; margin-bottom: 12px` |
| 설명 텍스트 | `font-size: 15px; color: #374151; line-height: 1.7; white-space: pre-wrap` |
| 설명 없을 때 | 섹션 자체 미표시 |

---

## 7. 출석투표 섹션

> **12-attendance-vote-ui.md** 전체 참조.

### 배치

| 속성 | 값 |
|------|-----|
| 위치 | 설명 섹션 아래, `margin-top: 8px` |
| 표시 조건 | `attendance_config`가 존재하고 `is_active === true`인 경우만 |
| 미활성 일정 | 이 섹션 전체 숨김 |

---

## 8. 참석자 명단 섹션

### 8-1. 레이아웃

```
┌─────────────────────────────────────┐
│  👥 참석자 명단 (15명)              │
│  ─────────────────────────────────  │
│  김회장 · 이부회장 · 박이사 · 정이사 │
│  · 한회원                           │
│                                     │
│  [전체 보기 >]                      │
└─────────────────────────────────────┘
```

### 8-2. 스펙

| 요소 | 스타일 | CSS 변수 |
|------|--------|----------|
| 섹션 컨테이너 | `background: #FFFFFF; padding: 16px; margin-top: 8px` | `--c-bg-card` |
| 섹션 제목 | `font-size: 14px; font-weight: 600; color: #111827` | `--c-text` |
| 인원 수 | `font-size: 14px; font-weight: 500; color: #6B7280; margin-left: 4px` | `--c-text-sub` |
| 구분선 | `1px solid #F3F4F6; margin: 8px 0 12px` | — |
| 이름 나열 | `font-size: 14px; color: #374151; line-height: 1.6` | — |
| 이름 구분자 | ` · ` (가운데 점, 양쪽 공백) | — |
| "전체 보기" 버튼 | `font-size: 13px; font-weight: 500; color: #2563EB; margin-top: 12px; cursor: pointer; background: none; border: none; padding: 0` | `--c-primary` |
| 최대 표시 인원 | 5명 (초과 시 "외 N명" 텍스트) | — |
| 투표 미활성 | 섹션 전체 미표시 | — |

### 8-3. 전체 보기 모달 (확장형)

"전체 보기" 클릭 시 참석자 전체 목록을 펼침 또는 바텀시트로 표시.

```
┌─────────────────────────────────────┐
│  참석자 전체 (15명)          닫기 ✕ │
├─────────────────────────────────────┤
│  [아] 김회장       회장    2시간 전  │
│  [아] 이부회장     부회장   어제     │
│  [아] 박이사       이사     3일 전   │
│  ...                                │
└─────────────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 바텀시트 배경 | `background: #FFFFFF; border-radius: 16px 16px 0 0` |
| 오버레이 | `background: rgba(0,0,0,0.4); z-index: 200` |
| 최대 높이 | `max-height: 70vh; overflow-y: auto` |
| 헤더 | `padding: 16px; border-bottom: 1px solid #F3F4F6` |
| 닫기 버튼 | `width: 32px; height: 32px; border-radius: 50%; background: #F3F4F6` |
| 아이템 | 12-attendance-vote-ui.md 명단 아이템과 동일 |
| 투표 시점 | `font-size: 12px; color: #9CA3AF` (--c-text-hint) |

---

## 9. 연결된 공지 배너

### 9-1. 표시 조건

- `schedules.linked_post_id`가 존재하는 경우에만 표시
- 없으면 섹션 전체 숨김

### 9-2. 레이아웃

```
┌─────────────────────────────────────┐
│  🔗 연결된 공지                     │
│  ┌─────────────────────────────┐   │
│  │  📋 3월 정기 이사회 안내 공지  > │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 9-3. 스펙

| 요소 | 스타일 | CSS 변수 |
|------|--------|----------|
| 섹션 컨테이너 | `background: #FFFFFF; padding: 16px; margin-top: 8px` | `--c-bg-card` |
| 섹션 제목 | `font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 8px` | `--c-text` |
| 배너 카드 | `background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 12px 16px; cursor: pointer` | `--c-primary-bg` |
| 배너 아이콘 | SVG `16×16`, `stroke: #2563EB; fill: none` — 왼쪽 | `--c-primary` |
| 배너 텍스트 | `font-size: 14px; font-weight: 500; color: #1E40AF; flex: 1` | — |
| 화살표 | SVG `16×16`, `stroke: #93C5FD; fill: none` — 오른쪽 | — |
| 레이아웃 | `display: flex; align-items: center; gap: 8px` | — |
| 호버/터치 | `background: #DBEAFE` | `--c-primary-light` |
| 클릭 동작 | 해당 공지 상세 화면으로 네비게이션 | — |

```css
.linked-notice-banner {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s ease;
}

.linked-notice-banner:active {
  background: #DBEAFE;
}

.linked-notice-text {
  font-size: 14px;
  font-weight: 500;
  color: #1E40AF;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

---

## 10. 댓글 섹션

### 10-1. 전체 구조

```
┌─────────────────────────────────────┐
│  💬 댓글 (5)                        │
│  ─────────────────────────────────  │
│                                     │
│  ┌─ 댓글 아이템 ──────────────────┐ │
│  │  [아] 이부회장 · 2시간 전       │ │
│  │  안건 추가: 회원 워크숍 일정     │ │
│  │       답글(1) · 👍 2  · ⋮      │ │
│  │                                 │ │
│  │  ┌─ 대댓글 ──────────────────┐ │ │
│  │  │ [아] 김회장 · 1시간 전     │ │ │
│  │  │ 네, 추가하겠습니다         │ │ │
│  │  │            👍 0  · ⋮       │ │ │
│  │  └───────────────────────────┘ │ │
│  └─────────────────────────────────┘ │
│  ...                                │
├─────────────────────────────────────┤
│  [댓글 입력...]            [전송]   │  ← 하단 고정
└─────────────────────────────────────┘
```

### 10-2. 댓글 섹션 헤더

| 요소 | 스타일 |
|------|--------|
| 섹션 컨테이너 | `background: #FFFFFF; padding: 16px; margin-top: 8px` |
| 섹션 제목 "댓글" | `font-size: 14px; font-weight: 600; color: #111827` |
| 댓글 수 "(5)" | `font-size: 14px; font-weight: 500; color: #6B7280; margin-left: 4px` |
| 구분선 | `1px solid #F3F4F6; margin: 8px 0 12px` |

### 10-3. 댓글 아이템

| 요소 | 스타일 |
|------|--------|
| 아바타 | `32px × 32px; border-radius: 50%; background: #DBEAFE; color: #2563EB; font-size: 13px; font-weight: 600` |
| 작성자명 | `font-size: 14px; font-weight: 600; color: #111827` |
| 시간 | `font-size: 12px; color: #9CA3AF; margin-left: 8px` |
| 헤더 레이아웃 | `display: flex; align-items: center; gap: 8px` |
| 댓글 내용 | `font-size: 14px; color: #374151; line-height: 1.6; margin-top: 6px; padding-left: 40px` (아바타 너비 + gap) |
| 액션 행 | `padding-left: 40px; margin-top: 8px; display: flex; gap: 12px; align-items: center` |
| 아이템 간격 | `padding: 12px 0; border-bottom: 1px solid #F3F4F6` |

### 10-4. 댓글 액션 버튼

| 요소 | 스타일 |
|------|--------|
| "답글(N)" | `font-size: 12px; color: #6B7280; cursor: pointer; font-weight: 500` |
| "답글(N)" 클릭 시 | 대댓글 입력 모드 진입 |
| 👍 공감 버튼 | `font-size: 12px; color: #9CA3AF; cursor: pointer` |
| 👍 공감 활성 | `color: #2563EB` (--c-primary) |
| 공감 수 | `font-size: 12px; color: #6B7280; margin-left: 2px` |
| 더보기(⋮) | `font-size: 12px; color: #9CA3AF` — 본인 댓글에만 표시 |

### 10-5. 대댓글

| 요소 | 스타일 |
|------|--------|
| 들여쓰기 | `margin-left: 40px; padding-left: 12px; border-left: 2px solid #E5E7EB` |
| 아바타 크기 | `28px × 28px` (부모보다 작게) |
| 작성자명 | `font-size: 13px; font-weight: 600; color: #111827` |
| 내용 | `font-size: 13px; color: #374151; line-height: 1.5` |
| 배경 | `background: #F9FAFB; border-radius: 8px; padding: 10px 12px; margin-top: 8px` |

### 10-6. 댓글 입력 바 (하단 고정)

```
┌─────────────────────────────────────┐
│  [댓글을 입력하세요...]      [전송]  │
└─────────────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `position: fixed; bottom: 0; left: 0; right: 0; background: #FFFFFF; border-top: 1px solid #E5E7EB; padding: 8px 16px; display: flex; gap: 8px; align-items: center; z-index: 50` |
| 입력 필드 | `flex: 1; height: 40px; border: 1px solid #D1D5DB; border-radius: 20px; padding: 0 16px; font-size: 14px; color: #111827; background: #F9FAFB` |
| 입력 포커스 | `border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); background: #FFFFFF` |
| 플레이스홀더 | `color: #9CA3AF` |
| 전송 버튼 | `width: 40px; height: 40px; border-radius: 50%; background: #2563EB; display: flex; align-items: center; justify-content: center` |
| 전송 아이콘 | SVG 화살표 `18×18`, `fill: #FFFFFF` |
| 전송 비활성 | 입력 비어있을 때 `background: #D1D5DB; pointer-events: none` |
| 대댓글 모드 | 입력란 위에 `@작성자명 에게 답글` 표시, 취소(✕) 버튼 |

```css
.comment-input-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-top: 1px solid #E5E7EB;
  padding: 8px 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  z-index: 50;
}

.comment-input {
  flex: 1;
  height: 40px;
  border: 1px solid #D1D5DB;
  border-radius: 20px;
  padding: 0 16px;
  font-size: 14px;
  color: #111827;
  background: #F9FAFB;
  outline: none;
  transition: all 0.15s ease;
}

.comment-input:focus {
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  background: #FFFFFF;
}

.comment-send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2563EB;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.comment-send-btn:disabled {
  background: #D1D5DB;
  pointer-events: none;
}

.comment-send-btn:active {
  background: #1D4ED8;
}

/* 대댓글 모드 안내 */
.comment-reply-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: #EFF6FF;
  font-size: 12px;
  color: #2563EB;
}

.comment-reply-cancel {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #DBEAFE;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## 11. 삭제 확인 다이얼로그

```
┌─────────────────────────────────┐
│                                 │
│  일정을 삭제하시겠습니까?        │
│  삭제 시 투표 기록도 함께        │
│  삭제됩니다.                    │
│                                 │
│  [취소]          [삭제]         │
│                                 │
└─────────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 오버레이 | `background: rgba(0,0,0,0.4); z-index: 300` |
| 다이얼로그 | `background: #FFFFFF; border-radius: 16px; width: calc(100% - 64px); max-width: 320px; padding: 24px; margin: auto` |
| 제목 | `font-size: 16px; font-weight: 700; color: #111827; text-align: center; margin-bottom: 8px` |
| 설명 | `font-size: 14px; color: #6B7280; text-align: center; line-height: 1.5; margin-bottom: 24px` |
| 버튼 레이아웃 | `display: flex; gap: 8px` |
| 취소 버튼 | `flex: 1; height: 44px; border-radius: 8px; background: #F3F4F6; color: #374151; border: none; font-size: 15px; font-weight: 600` |
| 삭제 버튼 | `flex: 1; height: 44px; border-radius: 8px; background: #DC2626; color: #FFFFFF; border: none; font-size: 15px; font-weight: 600` |

---

## 12. 모바일 반응형 기준

### 뷰포트별 조정

| 뷰포트 | 조정 사항 |
|---------|----------|
| **≥ 480px** | 기본 레이아웃 그대로 |
| **< 480px** | 참석자 명단 최대 3명으로 축소, 댓글 아바타 `28px`, 대댓글 들여쓰기 `32px` |
| **< 360px** | 기본 정보 아이콘 `14px`, 텍스트 `13px`, 댓글 입력 높이 `36px` |

### 터치 영역

- 뒤로가기/더보기 버튼: `40×40px` 최소
- 지도 링크 아이콘: `28×28px` (+ 패딩으로 실질 `40×40`)
- 댓글 전송 버튼: `40×40px`
- 연결 공지 배너: 전체 영역 터치 가능

### 반응형 CSS

```css
@media (max-width: 479px) {
  .schedule-detail-title {
    font-size: 18px;
  }

  .comment-avatar {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .comment-reply {
    margin-left: 32px;
  }
}

@media (max-width: 359px) {
  .schedule-info-row svg {
    width: 14px;
    height: 14px;
  }

  .schedule-info-text {
    font-size: 13px;
  }

  .comment-input {
    height: 36px;
    font-size: 13px;
  }
}
```

---

## 13. 인터랙션 가이드

### 13-1. 화면 진입

- 캘린더에서 카드 클릭 시 슬라이드-인 트랜지션 (`transform: translateX(100%) → 0`, `0.25s ease`)
- 스켈레톤 로딩 → 데이터 로드 후 fade-in (`opacity 0 → 1`, `0.2s`)

### 13-2. 뒤로가기

- 뒤로가기 버튼 또는 스와이프 백 (모바일 브라우저 기본 동작)
- 슬라이드-아웃 트랜지션

### 13-3. 더보기 메뉴

- ⋮ 클릭 시 드롭다운 표시 (fade-in `0.15s`)
- 메뉴 외 영역 클릭 시 닫힘
- 메뉴 아이템 터치 시 배경 `#F9FAFB` 하이라이트

### 13-4. 댓글 작성

1. 입력란 탭 → 키보드 올라옴 → 입력바 키보드 위에 고정
2. 텍스트 입력 시 전송 버튼 활성화 (`#D1D5DB → #2563EB`)
3. 전송 클릭 → 댓글 목록 상단에 추가 (낙관적 업데이트)
4. 실패 시 댓글에 "전송 실패" 표시 + 재시도 버튼

### 13-5. 댓글 공감 (👍)

- 탭 시 토글 (활성/비활성)
- 활성: `color: #2563EB` + 숫자 +1
- 비활성: `color: #9CA3AF` + 숫자 -1
- `transition: transform 0.15s ease` — 클릭 시 `scale(1.2) → scale(1)` 미세 바운스

---

## 14. 빈 상태 / 로딩 / 에러

| 상태 | 대상 | UI |
|------|------|-----|
| **로딩** | 전체 | 스켈레톤: 제목(200px 바), 정보행(4줄), 설명(3줄), 댓글(2개) |
| **에러** | 전체 | "일정 정보를 불러올 수 없습니다" + [다시 시도] 버튼 |
| **댓글 없음** | 댓글 섹션 | "아직 댓글이 없습니다. 첫 댓글을 작성해보세요!" — `color: #9CA3AF; text-align: center; padding: 24px 0` |
| **참석자 없음** | 참석자 섹션 | "아직 투표한 참석자가 없습니다" — 동일 스타일 |
| **삭제된 일정** | 전체 | "삭제된 일정입니다" + [목록으로] 버튼 |

---

## 15. CSS 변수 정리 (이 가이드에서 사용하는 변수)

| 변수명 | 값 | 용도 |
|--------|-----|------|
| `--c-primary` | `#2563EB` | 앱바, 전송 버튼, 활성 공감 |
| `--c-primary-hover` | `#1D4ED8` | 전송 버튼 active |
| `--c-primary-bg` | `#EFF6FF` | 연결 공지 배너 배경 |
| `--c-primary-light` | `#DBEAFE` | 아바타 배경, 지도 아이콘 active |
| `--c-danger` | `#DC2626` | 삭제 버튼, 삭제 메뉴 텍스트 |
| `--c-text` | `#111827` | 제목, 이름, 섹션 헤더 |
| `--c-text-sub` | `#6B7280` | 보조 텍스트, 시간, 범례 |
| `--c-text-hint` | `#9CA3AF` | 플레이스홀더, 비활성 액션 |
| `--c-border` | `#D1D5DB` | 입력 필드 border |
| `--c-border-light` | `#E5E7EB` | 댓글 입력바 상단선 |
| `--c-divider` | `#F3F4F6` | 섹션 내 구분선, 아이템 구분 |
| `--c-bg` | `#F9FAFB` | 대댓글 배경, 입력 필드 기본 bg |
| `--c-bg-card` | `#FFFFFF` | 각 섹션 카드 배경 |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` | — |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.10)` | 더보기 메뉴 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-10 | 초안 작성 — 전체 상세 화면 UI 가이드 |
