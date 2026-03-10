# 12. 출석 투표 UI 가이드

> 작성일: 2026-03-10
> 작성자: 디자이너 에이전트
> 기반: 07-unified-design-guide.md, 11-mobile-color-renewal.md (Blue+Gray 2톤)
> 대상: 모바일 웹 (`web/js/`, `web/styles/main.css`)

---

## 1. 개요

모임/일정에 대한 **참석 여부 투표** 기능의 UI 명세.
하단 탭 "일정" 화면의 일정 상세 또는 별도 투표 카드에서 사용한다.

---

## 2. 투표 카드 레이아웃

```
┌─────────────────────────────────────────────┐
│  📋 모임명 (Heading)                    날짜  │  ← 카드 헤더
│  📍 장소                                     │
├─────────────────────────────────────────────┤
│                                             │
│  [ ✓ 참석 ]   [ ✕ 불참 ]   [ ? 미정 ]       │  ← 투표 버튼 그룹
│                                             │
├─────────────────────────────────────────────┤
│  참석 현황                          12/20명   │  ← 현황 헤더
│  ████████████░░░░░░░░░░░░░░░░░░░           │  ← 프로그레스 바
│  참석 8  ·  불참 3  ·  미응답 9             │  ← 범례
├─────────────────────────────────────────────┤
│  참석자 명단                        펼치기 ▾  │
│  ┌──┐ 홍길동    참석                         │
│  │아│ 김철수    불참                         │
│  └──┘ 이영희    미응답                       │
└─────────────────────────────────────────────┘
```

### 카드 컨테이너

| 속성 | 값 |
|------|-----|
| Background | `#FFFFFF` (--c-bg-card) |
| Border | `1px solid #E5E7EB` (--border-color) |
| Border-radius | `12px` |
| Box-shadow | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` (--shadow-sm) |
| Padding | `16px` |
| Margin-bottom | `12px` |

### 카드 헤더

| 요소 | 스타일 |
|------|--------|
| 모임명 | `font-size: 16px; font-weight: 700; color: #111827` |
| 날짜 | `font-size: 13px; font-weight: 400; color: #6B7280` — 우측 정렬 |
| 장소 | `font-size: 14px; font-weight: 400; color: #6B7280; margin-top: 4px` |
| 레이아웃 | 모임명+날짜는 `display: flex; justify-content: space-between; align-items: center` |

---

## 3. 투표 버튼 그룹

### 버튼 공통

| 속성 | 값 |
|------|-----|
| Layout | `display: flex; gap: 8px; margin: 16px 0` |
| 각 버튼 | `flex: 1; height: 44px; border-radius: 8px; font-size: 14px; font-weight: 600` |
| Transition | `all 0.2s ease` |
| Cursor | `pointer` |

### 버튼 3종 — 미선택 상태 (Default)

| 버튼 | Background | Text Color | Border |
|------|-----------|------------|--------|
| **참석** | `#EFF6FF` | `#2563EB` | `1px solid #BFDBFE` |
| **불참** | `#FEF2F2` | `#DC2626` | `1px solid #FECACA` |
| **미정** | `#F1F5F9` | `#64748B` | `1px solid #CBD5E1` |

### 버튼 3종 — 선택됨 상태 (Active)

| 버튼 | Background | Text Color | Border | Box-shadow |
|------|-----------|------------|--------|------------|
| **참석** | `#2563EB` | `#FFFFFF` | `2px solid #2563EB` | `0 0 0 3px rgba(37,99,235,0.2)` |
| **불참** | `#DC2626` | `#FFFFFF` | `2px solid #DC2626` | `0 0 0 3px rgba(220,38,38,0.2)` |
| **미정** | `#64748B` | `#FFFFFF` | `2px solid #64748B` | `0 0 0 3px rgba(100,116,139,0.2)` |

### 선택됨 상태 체크 아이콘

- 선택된 버튼 텍스트 앞에 **체크 아이콘** 표시
- 참석: `✓` (체크마크), 불참: `✕` (엑스), 미정: `?` (물음표)
- 아이콘 크기: `14px`, 텍스트와 `gap: 6px`
- 선택 시 버튼에 `transform: scale(0.97)` → `scale(1)` 미세 애니메이션

### CSS 예시

```css
.vote-btn-group {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.vote-btn {
  flex: 1;
  height: 44px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* 참석 — Default */
.vote-btn--attend {
  background: #EFF6FF;
  color: #2563EB;
  border: 1px solid #BFDBFE;
}

/* 참석 — Active */
.vote-btn--attend.active {
  background: #2563EB;
  color: #FFFFFF;
  border: 2px solid #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

/* 불참 — Default */
.vote-btn--absent {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

/* 불참 — Active */
.vote-btn--absent.active {
  background: #DC2626;
  color: #FFFFFF;
  border: 2px solid #DC2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2);
}

/* 미정 — Default */
.vote-btn--maybe {
  background: #F1F5F9;
  color: #64748B;
  border: 1px solid #CBD5E1;
}

/* 미정 — Active */
.vote-btn--maybe.active {
  background: #64748B;
  color: #FFFFFF;
  border: 2px solid #64748B;
  box-shadow: 0 0 0 3px rgba(100, 116, 139, 0.2);
}
```

---

## 4. 참석 현황 바 차트

### 레이아웃

```
참석 현황                              12/20명
████████████████░░░░░░██████░░░░░░░░░░░░░░░
참석 8  ·  불참 3  ·  미응답 9
```

### 바 차트 스펙

| 속성 | 값 |
|------|-----|
| 컨테이너 높이 | `8px` |
| Border-radius | `4px` (양쪽 끝 둥글게) |
| Background (전체) | `#E5E7EB` (미응답 영역) |
| 참석 영역 색상 | `#2563EB` (Primary) |
| 불참 영역 색상 | `#DC2626` (Danger) |
| 미응답 영역 색상 | `#E5E7EB` (Neutral border) |
| 영역 간 간격 | `1px` (흰색 구분선) |
| Transition | `width 0.3s ease` |

### 헤더 행

| 요소 | 스타일 |
|------|--------|
| "참석 현황" 라벨 | `font-size: 14px; font-weight: 600; color: #111827` |
| "12/20명" 카운트 | `font-size: 13px; font-weight: 500; color: #6B7280` — 우측 정렬 |
| 레이아웃 | `display: flex; justify-content: space-between; margin-bottom: 8px` |

### 범례 행

| 요소 | 스타일 |
|------|--------|
| 범례 텍스트 | `font-size: 12px; color: #6B7280` |
| 색상 dot | `8px × 8px; border-radius: 50%` — 각 범례 앞에 해당 색상 dot |
| 간격 | 범례 간 `gap: 12px`, dot-텍스트 `gap: 4px` |
| Margin-top | `8px` |

### CSS 예시

```css
.vote-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.vote-bar-container {
  height: 8px;
  border-radius: 4px;
  background: #E5E7EB;
  overflow: hidden;
  display: flex;
  gap: 1px;
}

.vote-bar-segment {
  height: 100%;
  transition: width 0.3s ease;
}

.vote-bar-segment--attend {
  background: #2563EB;
  border-radius: 4px 0 0 4px;
}

.vote-bar-segment--absent {
  background: #DC2626;
}

.vote-legend {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.vote-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6B7280;
}

.vote-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

---

## 5. 참석자 명단 리스트

### 레이아웃

```
┌──────────────────────────────────────────┐
│  참석자 명단                    펼치기 ▾  │  ← 토글 헤더
├──────────────────────────────────────────┤
│  [아] 홍길동         회장      ● 참석     │
│  [아] 김철수         부회장    ● 불참     │
│  [아] 이영희         회원      ○ 미응답   │
│  ...                                     │
└──────────────────────────────────────────┘
```

### 명단 헤더

| 요소 | 스타일 |
|------|--------|
| "참석자 명단" | `font-size: 14px; font-weight: 600; color: #111827` |
| "펼치기 ▾" / "접기 ▴" | `font-size: 13px; color: #2563EB; cursor: pointer` |
| 구분선 | `border-top: 1px solid #E5E7EB; padding-top: 12px; margin-top: 12px` |

### 명단 아이템

| 요소 | 스타일 |
|------|--------|
| 아바타 | `32px × 32px; border-radius: 50%; background: #DBEAFE; color: #2563EB; font-size: 13px; font-weight: 600` — 성(이니셜) 1글자 |
| 이름 | `font-size: 14px; font-weight: 500; color: #111827; flex: 1` |
| 직책 | `font-size: 12px; color: #6B7280; margin-left: auto` |
| 상태 배지 | `font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 10px` |
| 아이템 높이 | `48px` (터치 영역 확보) |
| 아이템 간 구분 | `border-bottom: 1px solid #F3F4F6` (마지막 아이템 제외) |
| 레이아웃 | `display: flex; align-items: center; gap: 10px; padding: 8px 0` |

### 상태 배지 색상

| 상태 | Background | Text Color | Dot Color |
|------|-----------|------------|-----------|
| **참석** | `#EFF6FF` | `#2563EB` | `#2563EB` |
| **불참** | `#FEF2F2` | `#DC2626` | `#DC2626` |
| **미응답** | `#F3F4F6` | `#6B7280` | `#9CA3AF` |

### CSS 예시

```css
.attendee-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #E5E7EB;
  padding-top: 12px;
  margin-top: 12px;
}

.attendee-list-toggle {
  font-size: 13px;
  color: #2563EB;
  cursor: pointer;
  background: none;
  border: none;
  font-weight: 500;
}

.attendee-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #F3F4F6;
  min-height: 48px;
}

.attendee-item:last-child {
  border-bottom: none;
}

.attendee-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #DBEAFE;
  color: #2563EB;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.attendee-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  flex: 1;
}

.attendee-role {
  font-size: 12px;
  color: #6B7280;
}

.attendee-status {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.attendee-status--attend {
  background: #EFF6FF;
  color: #2563EB;
}

.attendee-status--absent {
  background: #FEF2F2;
  color: #DC2626;
}

.attendee-status--pending {
  background: #F3F4F6;
  color: #6B7280;
}
```

---

## 6. 모바일 반응형 기준

### 뷰포트별 대응

| 뷰포트 | 조정 사항 |
|---------|----------|
| **≥ 480px** | 기본 레이아웃 그대로 |
| **< 480px** | 투표 버튼 `gap: 6px`, 버튼 텍스트 `font-size: 13px` |
| **< 360px** | 투표 버튼 세로 스택 (`flex-direction: column; gap: 6px`), 버튼 높이 `40px` |

### 터치 영역

- 모든 버튼 최소 높이: `44px` (Apple HIG 기준)
- 명단 아이템 최소 높이: `48px`
- 버튼 간 최소 간격: `6px` (오탭 방지)

### 반응형 CSS

```css
@media (max-width: 479px) {
  .vote-btn-group {
    gap: 6px;
  }
  .vote-btn {
    font-size: 13px;
  }
}

@media (max-width: 359px) {
  .vote-btn-group {
    flex-direction: column;
    gap: 6px;
  }
  .vote-btn {
    height: 40px;
  }
}
```

---

## 7. 인터랙션 가이드

### 투표 버튼 동작

1. **초기 상태**: 3개 버튼 모두 Default (미선택)
2. **선택 시**: 해당 버튼 Active 상태로 전환, 나머지 2개는 Default 유지
3. **재선택 시**: 동일 버튼 클릭하면 투표 취소 (3개 모두 Default로 복귀)
4. **변경 시**: 다른 버튼 클릭하면 즉시 변경 (별도 확인 없음)

### 바 차트 애니메이션

- 투표 변경 시 바 너비 `transition: width 0.3s ease`로 부드럽게 변경
- 범례 숫자도 즉시 갱신

### 명단 토글

- 기본: **접힌 상태** (참석 현황 바만 표시)
- "펼치기" 클릭 시 명단 펼침 (`max-height` 애니메이션, `0.25s ease`)
- 참석 → 불참 → 미응답 순서로 정렬

---

## 8. 빈 상태 / 로딩 상태

| 상태 | UI |
|------|-----|
| **로딩** | 투표 버튼 영역: skeleton shimmer (44px 높이 3개), 바 차트: skeleton shimmer (8px 높이) |
| **투표 없음** | "아직 등록된 투표가 없습니다" — `font-size: 14px; color: #9CA3AF; text-align: center; padding: 24px 0` |
| **마감된 투표** | 버튼 비활성 (`opacity: 0.5; pointer-events: none`), "투표가 마감되었습니다" 안내 텍스트 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-10 | 초안 작성 — 투표 카드, 버튼, 바 차트, 명단, 반응형 |
