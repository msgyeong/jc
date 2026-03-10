# 15. 일정 등록/수정 화면 UI 가이드

> 작성일: 2026-03-10
> 작성자: 디자이너 에이전트
> 기반: 07-unified-design-guide.md, 11-mobile-color-renewal.md (Blue+Gray 2톤)
> 참조: Docs/features/schedule-form.md (기획서)
> 대상: 모바일 웹 (`web/js/schedules.js`, `web/styles/main.css`)

---

## 1. 개요

관리자/권한자가 일정을 등록하거나 수정하는 폼 화면. 기본 정보 입력 + 접이식 투표 설정 섹션으로 구성.

---

## 2. 전체 레이아웃

```
┌─────────────────────────────────────┐
│  ← 취소        일정 등록     [저장]  │  ← AppBar
├─────────────────────────────────────┤
│                                     │
│  제목 *                             │
│  ┌─────────────────────────────┐   │
│  │ 입력...                     │   │
│  └─────────────────────────────┘   │
│                                     │
│  카테고리 *                         │
│  ┌─────────────────────────────┐   │
│  │ 선택 ▼                      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ☐ 종일 이벤트                     │
│                                     │
│  시작 날짜/시간 *                   │
│  ┌──────────────┬──────────────┐   │
│  │ YYYY-MM-DD   │  HH:mm       │   │
│  └──────────────┴──────────────┘   │
│                                     │
│  종료 날짜/시간                     │
│  ┌──────────────┬──────────────┐   │
│  │ YYYY-MM-DD   │  HH:mm       │   │
│  └──────────────┴──────────────┘   │
│                                     │
│  장소                               │
│  ┌─────────────────────────────┐   │
│  │ 입력...                     │   │
│  └─────────────────────────────┘   │
│                                     │
│  설명                               │
│  ┌─────────────────────────────┐   │
│  │ 입력...                     │   │
│  │                              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─── 참석 투표 설정 ──── ▾ ──────  │  ← 접이식 헤더
│  (접이식 투표 설정 영역)             │
│                                     │
├─────────────────────────────────────┤
│           [일정 등록]               │  ← 하단 CTA
└─────────────────────────────────────┘
```

---

## 3. AppBar

### 3-1. 레이아웃

```
등록 모드: ← 취소        일정 등록     [저장]
수정 모드: ← 취소        일정 수정     [저장]
```

### 3-2. 스펙

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `height: 56px; background: var(--c-primary, #2563EB); color: #FFFFFF; display: flex; align-items: center; padding: 0 8px` |
| 취소 버튼 | `font-size: 15px; font-weight: 500; color: #FFFFFF; background: none; border: none; padding: 8px 12px; cursor: pointer` |
| 타이틀 | `font-size: 18px; font-weight: 700; color: #FFFFFF; flex: 1; text-align: center` |
| 저장 버튼 | `font-size: 15px; font-weight: 600; color: #FFFFFF; background: rgba(255,255,255,0.2); border: none; border-radius: 6px; padding: 6px 16px; cursor: pointer` |
| 저장 비활성 | `opacity: 0.5; pointer-events: none` (필수 필드 미입력 시) |

---

## 4. 폼 컨테이너

| 속성 | 값 | CSS 변수 |
|------|-----|----------|
| Background | `#F9FAFB` | `--c-bg` |
| 내부 컨테이너 | `background: #FFFFFF; padding: 20px 16px; margin: 0` | `--c-bg-card` |
| 필드 간 간격 | `margin-bottom: 20px` | — |

---

## 5. 입력 필드 공통 스타일

### 5-1. 라벨

| 속성 | 값 |
|------|-----|
| Font-size | `14px` |
| Font-weight | `600` |
| Color | `#111827` (--c-text) |
| Margin-bottom | `6px` |
| 필수 마크 (*) | `color: #DC2626; margin-left: 2px` |

### 5-2. 텍스트 입력 (input, select, textarea)

| 상태 | 스타일 |
|------|--------|
| **기본** | `width: 100%; height: 48px; padding: 0 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 15px; color: #111827; background: #FFFFFF; transition: all 0.15s ease` |
| **포커스** | `border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); outline: none` |
| **에러** | `border-color: #DC2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.08)` |
| **비활성** | `background: #F3F4F6; color: #9CA3AF; cursor: not-allowed` |
| **플레이스홀더** | `color: #9CA3AF` |

### 5-3. Textarea (설명)

| 속성 | 값 |
|------|-----|
| Min-height | `120px` |
| Resize | `vertical` |
| Padding | `12px 14px` |
| Line-height | `1.6` |

### 5-4. 에러 메시지 (인라인)

| 속성 | 값 |
|------|-----|
| Font-size | `13px` |
| Color | `#DC2626` (--c-danger) |
| Margin-top | `4px` |
| 아이콘 | 선택적 — ⚠️ SVG `12×12` 인라인 |
| 표시 애니메이션 | `max-height 0→20px, opacity 0→1, 0.2s ease` |

```css
.form-field {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 6px;
}

.form-label .required {
  color: #DC2626;
  margin-left: 2px;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 15px;
  color: #111827;
  background: #FFFFFF;
  transition: all 0.15s ease;
  outline: none;
  font-family: 'Noto Sans KR', sans-serif;
}

.form-input:focus {
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-input--error {
  border-color: #DC2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.08);
}

.form-input:disabled {
  background: #F3F4F6;
  color: #9CA3AF;
  cursor: not-allowed;
}

.form-textarea {
  min-height: 120px;
  padding: 12px 14px;
  resize: vertical;
  line-height: 1.6;
  height: auto;
}

.form-error {
  font-size: 13px;
  color: #DC2626;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  animation: errorFadeIn 0.2s ease;
}

@keyframes errorFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 6. 카테고리 드롭다운 (Select)

### 6-1. 네이티브 Select 스타일링

```
┌─────────────────────────────┐
│ 회의                      ▼ │
└─────────────────────────────┘
```

| 속성 | 값 |
|------|-----|
| 기본 스타일 | 입력 필드 공통과 동일 |
| 화살표 | `appearance: none` + 커스텀 SVG 화살표 오른쪽 배치 |
| 화살표 아이콘 | SVG chevron-down `12×12`, `stroke: #6B7280; stroke-width: 2` |
| Padding-right | `40px` (화살표 공간 확보) |

### 6-2. 카테고리 옵션

| 값 | 레이블 |
|----|--------|
| (미선택) | "카테고리를 선택해주세요" — `color: #9CA3AF` |
| `event` | 행사 |
| `meeting` | 회의 |
| `training` | 교육 |
| `holiday` | 휴일 |
| `other` | 기타 |

```css
.form-select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,..."); /* chevron-down SVG */
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 12px;
  padding-right: 40px;
}

.form-select option[value=""] {
  color: #9CA3AF;
}
```

---

## 7. 종일 이벤트 체크박스

### 7-1. 레이아웃

```
☐ 종일 이벤트
```

### 7-2. 스펙

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `display: flex; align-items: center; gap: 8px; margin-bottom: 20px; cursor: pointer` |
| 체크박스 | `width: 20px; height: 20px; border: 2px solid #D1D5DB; border-radius: 4px; transition: all 0.15s ease` |
| 체크됨 | `background: #2563EB; border-color: #2563EB` + 흰색 체크마크 SVG |
| 라벨 텍스트 | `font-size: 14px; color: #374151; font-weight: 500` |

### 7-3. 동작

- 체크 시: 시작/종료 **시간** 입력 필드 숨김 (`display: none` + slide-up 애니메이션)
- 날짜 입력은 유지
- 해제 시: 시간 입력 다시 표시 (slide-down)

```css
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  cursor: pointer;
  user-select: none;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #D1D5DB;
  border-radius: 4px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.custom-checkbox.checked {
  background: #2563EB;
  border-color: #2563EB;
}

.custom-checkbox.checked::after {
  content: '';
  width: 10px;
  height: 6px;
  border-left: 2px solid #FFFFFF;
  border-bottom: 2px solid #FFFFFF;
  transform: rotate(-45deg) translateY(-1px);
}

.checkbox-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}
```

---

## 8. 날짜/시간 입력 필드

### 8-1. 레이아웃

```
시작 날짜/시간 *
┌──────────────┬──────────────┐
│ 2026-03-15   │  14:00       │
└──────────────┴──────────────┘
```

### 8-2. 스펙

| 요소 | 스타일 |
|------|--------|
| 행 레이아웃 | `display: flex; gap: 8px` |
| 날짜 입력 | `flex: 1; height: 48px; type: date` — 공통 입력 스타일 |
| 시간 입력 | `width: 120px; height: 48px; type: time` — 공통 입력 스타일 |
| 종일 이벤트 시 | 시간 입력 `display: none`, 날짜 입력 `width: 100%` |
| 날짜 포맷 | 브라우저 네이티브 date picker |
| 시간 포맷 | 24시간 형식 (HH:mm) |

```css
.date-time-row {
  display: flex;
  gap: 8px;
}

.date-input {
  flex: 1;
}

.time-input {
  width: 120px;
  flex-shrink: 0;
}

/* 종일 이벤트 시 시간 필드 숨김 */
.all-day-active .time-input {
  display: none;
}

.all-day-active .date-input {
  width: 100%;
}
```

---

## 9. 참석 투표 설정 (접이식 섹션)

### 9-1. 접이식 헤더

```
─── 참석 투표 설정 ──────────────── ▾
```

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `display: flex; align-items: center; gap: 12px; padding: 16px 0; cursor: pointer; border-top: 1px solid #E5E7EB; margin-top: 4px` |
| 구분선 (좌) | `flex: 0 0 16px; height: 1px; background: #D1D5DB` |
| 텍스트 | `font-size: 14px; font-weight: 600; color: #374151; white-space: nowrap` |
| 구분선 (우) | `flex: 1; height: 1px; background: #D1D5DB` |
| 화살표 | `margin-left: 8px; transition: transform 0.2s ease` |
| 화살표 열림 | `transform: rotate(180deg)` |

### 9-2. 접이식 바디 — 투표 토글

```
참석 투표 활성화                   [●━━━]  ON
```

| 요소 | 스타일 |
|------|--------|
| 행 레이아웃 | `display: flex; justify-content: space-between; align-items: center; padding: 12px 0` |
| 라벨 | `font-size: 14px; font-weight: 500; color: #111827` |
| 토글 트랙 | `width: 44px; height: 24px; border-radius: 12px; transition: background 0.2s ease; cursor: pointer` |
| 트랙 OFF | `background: #D1D5DB` |
| 트랙 ON | `background: #2563EB` |
| 토글 썸(원) | `width: 20px; height: 20px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s ease` |
| 썸 OFF | `transform: translateX(2px)` |
| 썸 ON | `transform: translateX(22px)` |

```css
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: #D1D5DB;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.toggle-switch.active {
  background: #2563EB;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(20px);
}
```

### 9-3. 투표 유형 (라디오 버튼)

토글 ON 시 표시.

```
투표 유형 *
○ 이사회    ● 월례회    ○ 일반
```

| 요소 | 스타일 |
|------|--------|
| 그룹 레이아웃 | `display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px` |
| 라디오 옵션 | `display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 8px 0` |
| 라디오 원 (미선택) | `width: 18px; height: 18px; border: 2px solid #D1D5DB; border-radius: 50%` |
| 라디오 원 (선택됨) | `border-color: #2563EB` + 내부 `10px` filled circle `#2563EB` |
| 라벨 텍스트 | `font-size: 14px; color: #374151; font-weight: 500` |

```css
.radio-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px 0;
  user-select: none;
}

.radio-circle {
  width: 18px;
  height: 18px;
  border: 2px solid #D1D5DB;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease;
  flex-shrink: 0;
}

.radio-circle.selected {
  border-color: #2563EB;
}

.radio-circle.selected::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2563EB;
}

.radio-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}
```

### 9-4. 조건부 필드

#### 마감일 (토글 ON 시 항상)

- 날짜+시간 입력, 8번 스타일과 동일

#### 성원 기준 (이사회 선택 시)

```
성원 기준 인원 *
┌─────────────────────────────┐
│ 20                          │  ← type="number"
└─────────────────────────────┘

성원 기준 모수 *
┌─────────────────────────────┐
│ 이사 전체 ▼                 │  ← select
└─────────────────────────────┘
```

#### 1인당 비용 (월례회 선택 시)

```
1인당 비용 (원)
┌─────────────────────────────┐
│ 30,000                      │  ← type="text" (포맷팅)
└─────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 숫자 입력 | 공통 입력 스타일 + `text-align: right` |
| 천 단위 콤마 | JS로 포맷팅 (`toLocaleString()`) |
| 단위 표시 | 라벨에 "(원)" 포함 |

### 9-5. 접이식 애니메이션

```css
.collapsible-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  padding: 0 0;
}

.collapsible-body.open {
  max-height: 600px;
  padding: 12px 0;
}
```

---

## 10. 하단 CTA 버튼

### 10-1. 레이아웃

```
┌─────────────────────────────────────┐
│             [일정 등록]              │
└─────────────────────────────────────┘
```

### 10-2. 스펙

| 상태 | 스타일 |
|------|--------|
| **기본** | `width: 100%; height: 48px; background: #2563EB; color: #FFFFFF; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.15s ease` |
| **Active (터치)** | `background: #1D4ED8` |
| **비활성** | `background: #D1D5DB; color: #FFFFFF; pointer-events: none` — 필수 필드 미입력 시 |
| **로딩** | `background: #93C5FD; pointer-events: none` + 스피너 아이콘 |
| 수정 모드 텍스트 | "수정 완료" |
| 컨테이너 | `padding: 16px; background: #FFFFFF; border-top: 1px solid #F3F4F6` |

```css
.schedule-form-submit {
  width: 100%;
  height: 48px;
  background: #2563EB;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
  font-family: 'Noto Sans KR', sans-serif;
}

.schedule-form-submit:active {
  background: #1D4ED8;
}

.schedule-form-submit:disabled {
  background: #D1D5DB;
  pointer-events: none;
}

.schedule-form-submit--loading {
  background: #93C5FD;
  pointer-events: none;
}
```

---

## 11. 유효성 에러 표시

### 11-1. 에러 규칙 (기획서 5-1 참조)

| 규칙 | 에러 메시지 |
|------|-------------|
| 제목 비어있음 | "제목을 입력해주세요" |
| 제목 100자 초과 | "제목은 100자 이내로 입력해주세요" |
| 시작 날짜 비어있음 | "시작 날짜를 선택해주세요" |
| 종료 날짜 < 시작 날짜 | "종료 날짜는 시작 날짜 이후여야 합니다" |
| 같은 날 종료 시간 ≤ 시작 시간 | "종료 시간은 시작 시간 이후여야 합니다" |
| 장소 200자 초과 | "장소는 200자 이내로 입력해주세요" |
| 설명 2000자 초과 | "설명은 2000자 이내로 입력해주세요" |
| 투표 ON + 유형 미선택 | "투표 유형을 선택해주세요" |
| 이사회 + 성원 기준 비어있음 | "성원 기준 인원을 입력해주세요" |

### 11-2. 에러 표시 동작

1. **저장 클릭 시**: 모든 필드 검증 → 에러 있는 필드에 빨간 border + 인라인 메시지
2. **첫 에러 필드로 스크롤**: `scrollIntoView({ behavior: 'smooth', block: 'center' })`
3. **실시간 해제**: 에러 필드 수정 시 에러 즉시 제거
4. **에러 필드 라벨**: 라벨 색상은 변경하지 않음 (border + 메시지만)

### 11-3. 에러 상태 시각 예시

```
제목 *
┌─────────────────────────────┐  ← border: #DC2626
│                              │     box-shadow: 0 0 0 3px rgba(220,38,38,0.08)
└─────────────────────────────┘
⚠ 제목을 입력해주세요             ← color: #DC2626, font-size: 13px
```

---

## 12. 모바일 반응형 기준

### 뷰포트별 조정

| 뷰포트 | 조정 사항 |
|---------|----------|
| **≥ 480px** | 기본 레이아웃 그대로 |
| **< 480px** | 날짜/시간 `gap: 6px`, 라디오 그룹 `gap: 8px` |
| **< 360px** | 날짜/시간 세로 스택 (`flex-direction: column`), 입력 높이 `44px`, 폰트 `14px` |

### 터치 영역

- 모든 입력 필드: `height: 48px` (360px 미만: `44px`)
- 체크박스/라디오: 전체 행이 터치 영역 (`padding: 8px 0`)
- 토글 스위치: `44×24px` (좌우 여백으로 실질 `56×40`)
- CTA 버튼: `48px` 높이

### 반응형 CSS

```css
@media (max-width: 479px) {
  .date-time-row {
    gap: 6px;
  }

  .radio-group {
    gap: 8px;
  }
}

@media (max-width: 359px) {
  .date-time-row {
    flex-direction: column;
  }

  .time-input {
    width: 100%;
  }

  .form-input {
    height: 44px;
    font-size: 14px;
  }

  .schedule-form-submit {
    height: 44px;
    font-size: 15px;
  }
}
```

---

## 13. 인터랙션 가이드

### 13-1. 폼 진입

- FAB(+) 클릭 → 폼 슬라이드-업 또는 전환 (`transform: translateY(100%) → 0`, `0.25s ease`)
- 수정 모드: 기존 데이터 프리필 후 표시

### 13-2. 종일 이벤트 토글

1. 체크박스 클릭 → 시간 입력 slide-up 숨김 (`max-height → 0`, `0.2s ease`)
2. 해제 → 시간 입력 slide-down 표시
3. 날짜 입력은 항상 유지

### 13-3. 투표 설정 접이식

1. 헤더 클릭 → 바디 펼침 (`max-height: 0 → 600px`, `0.3s ease`)
2. 화살표 아이콘 `180deg` 회전
3. 다시 클릭 → 접힘

### 13-4. 투표 토글 ON/OFF

1. OFF → ON: 투표 유형 라디오 표시 (fade-in)
2. ON → OFF: 투표 관련 필드 모두 숨김 + 입력값 유지 (재활성화 시 복원)

### 13-5. 저장 플로우

1. [일정 등록] 클릭 → 유효성 검증
2. 에러 있으면: 에러 표시 + 첫 에러 필드 스크롤
3. 통과하면: 버튼 로딩 상태 → API 호출
4. 성공: 캘린더 화면 복귀
5. 실패: 인라인 에러 또는 상단 에러 배너

### 13-6. 취소 동작

- 변경사항이 있으면 "작성 중인 내용이 있습니다. 나가시겠습니까?" 확인 다이얼로그
- 없으면 즉시 이전 화면 복귀

---

## 14. 취소 확인 다이얼로그

```
┌─────────────────────────────────┐
│  작성 중인 내용이 있습니다.      │
│  나가시겠습니까?                 │
│                                 │
│  [계속 작성]        [나가기]    │
└─────────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 다이얼로그 | 14-schedule-detail-ui.md 삭제 확인과 동일 스타일 |
| "계속 작성" | `background: #2563EB; color: #FFFFFF` — Primary |
| "나가기" | `background: #F3F4F6; color: #374151` — Ghost |

---

## 15. CSS 변수 정리 (이 가이드에서 사용하는 변수)

| 변수명 | 값 | 용도 |
|--------|-----|------|
| `--c-primary` | `#2563EB` | AppBar, 저장 버튼, CTA, 포커스 ring, 토글, 라디오 |
| `--c-primary-hover` | `#1D4ED8` | 버튼 active |
| `--c-danger` | `#DC2626` | 에러 border, 에러 텍스트, 필수 마크 |
| `--c-text` | `#111827` | 라벨, 입력 텍스트 |
| `--c-text-sub` | `#6B7280` | — |
| `--c-text-hint` | `#9CA3AF` | 플레이스홀더, 비활성 텍스트 |
| `--c-border` | `#D1D5DB` | 입력 border, 토글 OFF, 라디오/체크박스 기본 |
| `--c-border-light` | `#E5E7EB` | 접이식 헤더 구분선 |
| `--c-divider` | `#F3F4F6` | CTA 상단선 |
| `--c-bg` | `#F9FAFB` | 폼 배경 |
| `--c-bg-card` | `#FFFFFF` | 폼 내부 배경 |
| `--c-bg-disabled` | `#F3F4F6` | 비활성 입력 배경, Ghost 버튼 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-10 | 초안 작성 — 폼 전체 UI + 투표 설정 접이식 + 유효성 에러 |
