# 17. 빈 상태 / 로딩 / 에러 공통 UI 가이드

> 작성일: 2026-03-10
> 작성자: 디자이너 에이전트
> 기반: 07-unified-design-guide.md, 11-mobile-color-renewal.md (Blue+Gray 2톤)
> 대상: 모바일 웹 전 화면 (`web/js/`, `web/styles/main.css`)

---

## 1. 개요

앱의 모든 화면에서 **빈 상태(Empty)**, **로딩(Loading)**, **에러(Error)**, **토스트 알림(Toast)**, **인라인 에러** 5가지 상태를 일관되게 처리하기 위한 공통 가이드.

---

## 2. 빈 상태 (Empty State)

데이터가 없을 때 표시하는 안내 화면. 일러스트 + 메시지 + CTA 버튼으로 구성.

### 2-1. 레이아웃

```
┌─────────────────────────────────────┐
│                                     │
│           (SVG 일러스트)             │
│              64×64                  │
│                                     │
│         주 메시지 텍스트             │
│         보조 메시지 텍스트           │
│                                     │
│           [CTA 버튼]                │  ← 선택적
│                                     │
└─────────────────────────────────────┘
```

### 2-2. 공통 스타일

| 요소 | 스타일 | CSS 변수 |
|------|--------|----------|
| 컨테이너 | `display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; min-height: 200px` | — |
| 일러스트 아이콘 | `width: 64px; height: 64px; margin-bottom: 16px; color: #D1D5DB` | `--c-border` |
| 주 메시지 | `font-size: 15px; font-weight: 600; color: #374151; text-align: center; margin-bottom: 4px` | — |
| 보조 메시지 | `font-size: 13px; font-weight: 400; color: #9CA3AF; text-align: center; line-height: 1.5` | `--c-text-hint` |
| CTA 버튼 | `margin-top: 16px; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer` | — |
| CTA Primary | `background: #2563EB; color: #FFFFFF; border: none` | `--c-primary` |
| CTA Ghost | `background: #FFFFFF; color: #2563EB; border: 1px solid #D1D5DB` | — |

### 2-3. 화면별 빈 상태 정의

| 화면 | 아이콘 | 주 메시지 | 보조 메시지 | CTA |
|------|--------|----------|------------|-----|
| **홈 - 공지** | 📋 (document) | "등록된 공지가 없습니다" | — | — |
| **홈 - 일정** | 📅 (calendar) | "예정된 일정이 없습니다" | — | — |
| **게시판 - 공지탭** | 📋 (document) | "아직 공지사항이 없습니다" | "새로운 공지가 등록되면 여기에 표시됩니다" | — |
| **게시판 - 일반탭** | 📝 (edit) | "아직 게시글이 없습니다" | "첫 번째 게시글을 작성해보세요!" | [글 작성하기] (Primary) |
| **일정 - 해당 날짜** | 📅 (calendar) | "이 날짜에 일정이 없습니다" | — | — |
| **일정 - 전체** | 📅 (calendar) | "등록된 일정이 없습니다" | "새 일정을 등록해보세요" | [일정 등록] (Primary, 권한자만) |
| **회원 - 검색 결과 없음** | 🔍 (search) | "검색 결과가 없습니다" | "다른 이름이나 직책으로 검색해보세요" | — |
| **댓글 - 없음** | 💬 (chat) | "아직 댓글이 없습니다" | "첫 댓글을 작성해보세요!" | — |
| **참석자 - 없음** | 👥 (users) | "아직 투표한 참석자가 없습니다" | — | — |

### 2-4. SVG 아이콘 가이드

모든 빈 상태 아이콘은 **단색 SVG** 사용 (이모지 금지):

| 속성 | 값 |
|------|-----|
| 크기 | `64×64px` |
| Stroke | `#D1D5DB` (--c-border) |
| Stroke-width | `1.5` |
| Fill | `none` |
| 스타일 | 라인 아이콘 (Feather/Lucide 스타일) |

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  min-height: 200px;
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  color: #D1D5DB;
}

.empty-state-icon svg {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-width: 1.5;
  fill: none;
}

.empty-state-title {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  text-align: center;
  margin-bottom: 4px;
}

.empty-state-desc {
  font-size: 13px;
  color: #9CA3AF;
  text-align: center;
  line-height: 1.5;
}

.empty-state-cta {
  margin-top: 16px;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.empty-state-cta--primary {
  background: #2563EB;
  color: #FFFFFF;
  border: none;
}

.empty-state-cta--primary:active {
  background: #1D4ED8;
}

.empty-state-cta--ghost {
  background: #FFFFFF;
  color: #2563EB;
  border: 1px solid #D1D5DB;
}
```

---

## 3. 스켈레톤 로딩 (Skeleton Loading)

데이터를 가져오는 동안 표시하는 플레이스홀더 애니메이션.

### 3-1. 공통 스켈레톤 바

```
█████████████████████     ← 긴 바 (제목)
████████████              ← 중간 바 (본문)
████████                  ← 짧은 바 (날짜)
```

### 3-2. 스펙

| 속성 | 값 |
|------|-----|
| Background | `#E5E7EB` |
| Border-radius | `4px` |
| Animation | shimmer (좌→우 빛 효과, `1.5s infinite ease-in-out`) |
| 원형 (아바타) | `border-radius: 50%` |

```css
.skeleton {
  background: #E5E7EB;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite ease-in-out;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton--circle {
  border-radius: 50%;
}

.skeleton--text {
  height: 14px;
  margin-bottom: 8px;
}

.skeleton--title {
  height: 20px;
  width: 60%;
  margin-bottom: 12px;
}

.skeleton--avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton--btn {
  height: 44px;
  border-radius: 8px;
}

.skeleton--bar {
  height: 8px;
  border-radius: 4px;
}
```

### 3-3. 화면별 스켈레톤 구성

#### 홈 화면

```
┌─────────────────────────────┐
│  ████████████████████████   │  ← 배너 (160px)
├─────────────────────────────┤
│  ████████  공지사항          │
│  ████████████████████████   │  ← 카드 5줄
│  ██████████████████         │
│  ████████████████████       │
├─────────────────────────────┤
│  ████████  다가오는 일정     │
│  █████████████████████████  │
│  ██████████████████████     │
└─────────────────────────────┘
```

| 영역 | 스켈레톤 구성 |
|------|-------------|
| 배너 | `160px` 높이 사각형, `border-radius: 12px` |
| 공지 목록 | 5줄 × (`skeleton--text`, 너비 80%/70%/75%/65%/70%) |
| 일정 목록 | 5줄 × (좌측 `skeleton--circle 8px` + `skeleton--text` 70%) |

#### 게시판 목록

```
┌─────────────────────────────┐
│  ○ ████████████████   ████  │  ← 아바타 + 제목 + 날짜
│  ████████████████████████   │  ← 본문 미리보기
│  ████████████               │
├─────────────────────────────┤
│  ○ ████████████████   ████  │
│  ████████████████████████   │
│  ████████████               │
└─────────────────────────────┘
```

| 영역 | 구성 |
|------|------|
| 카드 | `skeleton--avatar 40px` + `skeleton--title 60%` + `skeleton--text 80%` × 2 |
| 반복 | 3~5개 카드 |

#### 일정 상세

```
┌─────────────────────────────┐
│  ████████████   (배지)       │
│  ████████████████████████   │  ← 제목
│  ████████████████           │  ← 날짜
│  ██████████████             │  ← 장소
│  ████████                   │  ← 작성자
├─────────────────────────────┤
│  ████████████████████████   │  ← 설명
│  ██████████████████████     │
│  ████████████████           │
├─────────────────────────────┤
│  ███████████████████████    │  ← 투표 버튼 3개
│  ████████████████████████   │  ← 바 차트
└─────────────────────────────┘
```

#### 회원 목록

```
┌─────────────────────────────┐
│  ○ ████████████   ████████  │  ← 아바타 + 이름 + 직책
│  ○ ████████████   ████████  │
│  ○ ████████████   ████████  │
│  ○ ████████████   ████████  │
└─────────────────────────────┘
```

#### 프로필

```
┌─────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░  │  ← 히어로 배경
│       ○                     │  ← 아바타 (80px)
│    ████████                 │  ← 이름
│    ██████                   │  ← 직책
├─────────────────────────────┤
│  ████████████████████████   │  ← 정보 카드
│  ██████████████████████     │
└─────────────────────────────┘
```

---

## 4. 풀 에러 (Full Error)

API 실패 등으로 전체 화면이 로드되지 않았을 때.

### 4-1. 레이아웃

```
┌─────────────────────────────────────┐
│                                     │
│           (에러 아이콘)              │
│              48×48                  │
│                                     │
│       데이터를 불러올 수 없습니다     │
│       네트워크를 확인해주세요         │
│                                     │
│          [다시 시도]                │
│                                     │
└─────────────────────────────────────┘
```

### 4-2. 스펙

| 요소 | 스타일 | CSS 변수 |
|------|--------|----------|
| 컨테이너 | `display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; min-height: 300px` | — |
| 에러 아이콘 | SVG `48×48`, 원형 배경 `#FEE2E2` + 느낌표 `#DC2626` | `--c-danger-bg`, `--c-danger` |
| 아이콘 배경 원 | `width: 72px; height: 72px; border-radius: 50%; background: #FEE2E2; display: flex; align-items: center; justify-content: center; margin-bottom: 16px` | — |
| 주 메시지 | `font-size: 16px; font-weight: 600; color: #111827; text-align: center; margin-bottom: 4px` | `--c-text` |
| 보조 메시지 | `font-size: 14px; color: #6B7280; text-align: center` | `--c-text-sub` |
| 재시도 버튼 | `margin-top: 20px; padding: 10px 24px; border-radius: 8px; background: #2563EB; color: #FFFFFF; border: none; font-size: 14px; font-weight: 600` | `--c-primary` |
| 재시도 active | `background: #1D4ED8` | `--c-primary-hover` |

### 4-3. 화면별 에러 메시지

| 화면 | 주 메시지 | 보조 메시지 |
|------|----------|------------|
| **홈** | "홈 화면을 불러올 수 없습니다" | "네트워크 연결을 확인하고 다시 시도해주세요" |
| **게시판** | "게시글을 불러올 수 없습니다" | "잠시 후 다시 시도해주세요" |
| **일정** | "일정 정보를 불러올 수 없습니다" | "네트워크 연결을 확인해주세요" |
| **일정 상세** | "일정 정보를 불러올 수 없습니다" | — |
| **회원** | "회원 목록을 불러올 수 없습니다" | "잠시 후 다시 시도해주세요" |
| **프로필** | "프로필을 불러올 수 없습니다" | "네트워크 연결을 확인해주세요" |

```css
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  min-height: 300px;
}

.error-state-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #FEE2E2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.error-state-icon svg {
  width: 32px;
  height: 32px;
  stroke: #DC2626;
  stroke-width: 2;
  fill: none;
}

.error-state-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  text-align: center;
  margin-bottom: 4px;
}

.error-state-desc {
  font-size: 14px;
  color: #6B7280;
  text-align: center;
}

.error-state-retry {
  margin-top: 20px;
  padding: 10px 24px;
  border-radius: 8px;
  background: #2563EB;
  color: #FFFFFF;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.error-state-retry:active {
  background: #1D4ED8;
}
```

---

## 5. 토스트 알림 (Toast)

일시적 피드백 메시지. 성공/에러/정보 3종.

### 5-1. 레이아웃

```
        ┌─────────────────────────────┐
        │  ✓ 일정이 등록되었습니다     │  ← 상단 중앙
        └─────────────────────────────┘
```

### 5-2. 스펙

| 속성 | 값 |
|------|-----|
| Position | `fixed; top: 72px; left: 50%; transform: translateX(-50%); z-index: 500` |
| Min-width | `200px` |
| Max-width | `calc(100% - 32px)` |
| Padding | `12px 20px` |
| Border-radius | `8px` |
| Font-size | `14px` |
| Font-weight | `500` |
| Box-shadow | `0 4px 16px rgba(0,0,0,0.12)` |
| Display | `flex; align-items: center; gap: 8px` |
| 아이콘 크기 | `18×18px` |

### 5-3. 유형별 색상

| 유형 | Background | Text Color | 아이콘 | 아이콘 색 |
|------|-----------|------------|--------|----------|
| **성공** | `#ECFDF5` | `#065F46` | ✓ (체크 원) | `#10B981` |
| **에러** | `#FEF2F2` | `#991B1B` | ✕ (엑스 원) | `#DC2626` |
| **정보** | `#EFF6FF` | `#1E40AF` | ℹ (정보) | `#2563EB` |

### 5-4. 애니메이션

| 단계 | 애니메이션 |
|------|-----------|
| 진입 | `translateY(-20px) → translateY(0)` + `opacity: 0 → 1` (`0.3s ease`) |
| 유지 | 3초 |
| 퇴장 | `translateY(0) → translateY(-20px)` + `opacity: 1 → 0` (`0.3s ease`) |

### 5-5. 화면별 사용 예시

| 화면 | 유형 | 메시지 |
|------|------|--------|
| 일정 등록 후 | 성공 | "일정이 등록되었습니다" |
| 일정 수정 후 | 성공 | "일정이 수정되었습니다" |
| 일정 삭제 후 | 성공 | "일정이 삭제되었습니다" |
| 댓글 작성 | 성공 | "댓글이 등록되었습니다" |
| API 실패 | 에러 | "처리 중 오류가 발생했습니다" |
| 네트워크 끊김 | 에러 | "네트워크 연결을 확인해주세요" |
| 투표 완료 | 정보 | "투표가 반영되었습니다" |
| 게시글 작성 | 성공 | "게시글이 등록되었습니다" |
| 프로필 수정 | 성공 | "프로필이 수정되었습니다" |

```css
.toast {
  position: fixed;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  min-width: 200px;
  max-width: calc(100% - 32px);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 8px;
  animation: toastIn 0.3s ease;
}

.toast--success {
  background: #ECFDF5;
  color: #065F46;
}

.toast--error {
  background: #FEF2F2;
  color: #991B1B;
}

.toast--info {
  background: #EFF6FF;
  color: #1E40AF;
}

.toast-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}

.toast--exit {
  animation: toastOut 0.3s ease forwards;
}
```

---

## 6. 인라인 에러 (Inline Error)

폼 입력 필드 하단에 표시하는 유효성 에러.

### 6-1. 레이아웃

```
라벨 *
┌─────────────────────────────┐  ← border: #DC2626
│ 입력값                       │
└─────────────────────────────┘
⚠ 에러 메시지                    ← 인라인 에러
```

### 6-2. 스펙

| 요소 | 스타일 |
|------|--------|
| 에러 텍스트 | `font-size: 13px; color: #DC2626; margin-top: 4px; display: flex; align-items: center; gap: 4px` |
| 에러 아이콘 (선택) | SVG `12×12`, `stroke: #DC2626; stroke-width: 2` |
| 에러 필드 border | `border-color: #DC2626` |
| 에러 필드 box-shadow | `0 0 0 3px rgba(220,38,38,0.08)` |
| 진입 애니메이션 | `opacity: 0→1, translateY(-4px)→0, 0.2s ease` |
| 해제 | 필드 수정 시 즉시 제거 |

> **원칙**: "스낵바 대신 인라인 에러" — CLAUDE.md 개발 규칙 #2 준수.

```css
.inline-error {
  font-size: 13px;
  color: #DC2626;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  animation: inlineErrorIn 0.2s ease;
}

.inline-error-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

@keyframes inlineErrorIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 7. 네트워크 오프라인 배너

### 7-1. 레이아웃

```
┌─────────────────────────────────────┐
│  ⚠ 인터넷에 연결되어 있지 않습니다   │  ← 화면 상단 고정
└─────────────────────────────────────┘
```

### 7-2. 스펙

| 속성 | 값 |
|------|-----|
| Position | `fixed; top: 0; left: 0; right: 0; z-index: 600` |
| Background | `#FEF3C7` (--c-warning-bg) |
| Text | `font-size: 13px; font-weight: 500; color: #92400E; text-align: center; padding: 8px 16px` |
| 아이콘 | SVG wifi-off `14×14`, `stroke: #92400E` |
| 복귀 시 | 배경 `#ECFDF5` + 텍스트 "연결되었습니다" → 2초 후 자동 사라짐 |

```css
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 600;
  background: #FEF3C7;
  padding: 8px 16px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: #92400E;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  animation: slideDown 0.3s ease;
}

.offline-banner--online {
  background: #ECFDF5;
  color: #065F46;
}

@keyframes slideDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}
```

---

## 8. 모바일 반응형 기준

### 뷰포트별 조정

| 뷰포트 | 조정 사항 |
|---------|----------|
| **≥ 480px** | 기본 레이아웃 |
| **< 480px** | 빈 상태 아이콘 `56×56`, 토스트 `font-size: 13px`, 에러 아이콘 원 `64×64` |
| **< 360px** | 빈 상태 아이콘 `48×48`, 패딩 축소 (`padding: 32px 16px`), 토스트 `max-width: calc(100% - 24px)` |

### 반응형 CSS

```css
@media (max-width: 479px) {
  .empty-state-icon {
    width: 56px;
    height: 56px;
  }

  .toast {
    font-size: 13px;
  }

  .error-state-icon {
    width: 64px;
    height: 64px;
  }
}

@media (max-width: 359px) {
  .empty-state-icon {
    width: 48px;
    height: 48px;
  }

  .empty-state {
    padding: 32px 16px;
    min-height: 160px;
  }

  .error-state {
    padding: 32px 16px;
  }

  .toast {
    max-width: calc(100% - 24px);
  }
}
```

---

## 9. 인터랙션 요약

| 상태 | 진입 | 유지 | 퇴장 |
|------|------|------|------|
| 빈 상태 | 데이터 0건 확인 즉시 | 데이터 생길 때까지 | 데이터 로드 후 fade-out |
| 스켈레톤 | API 호출 시작 즉시 | API 응답 올 때까지 | 데이터 렌더링으로 대체 (fade 없이 즉시) |
| 풀 에러 | API 실패 시 | 재시도까지 | 재시도 시 스켈레톤으로 대체 |
| 토스트 | 액션 완료 시 | **3초** | 자동 퇴장 (0.3s) |
| 인라인 에러 | 유효성 실패 시 | 필드 수정까지 | 수정 시 즉시 제거 |
| 오프라인 배너 | `navigator.onLine === false` | 온라인 복귀까지 | 온라인 → "연결됨" 2초 표시 후 slide-up |

---

## 10. CSS 변수 정리

| 변수명 | 값 | 용도 |
|--------|-----|------|
| `--c-primary` | `#2563EB` | CTA Primary, 재시도 버튼, 토스트 정보 아이콘 |
| `--c-primary-hover` | `#1D4ED8` | 재시도 active |
| `--c-danger` | `#DC2626` | 에러 아이콘, 인라인 에러 텍스트/border |
| `--c-danger-bg` | `#FEE2E2` | 에러 아이콘 배경, 토스트 에러 배경 |
| `--c-success` | `#10B981` | 토스트 성공 아이콘 |
| `--c-success-bg` | `#ECFDF5` | 토스트 성공 배경, 온라인 배너 |
| `--c-warning-bg` | `#FEF3C7` | 오프라인 배너 |
| `--c-text` | `#111827` | 풀 에러 주 메시지 |
| `--c-text-sub` | `#6B7280` | 풀 에러 보조 메시지 |
| `--c-text-hint` | `#9CA3AF` | 빈 상태 보조 메시지 |
| `--c-border` | `#D1D5DB` | 빈 상태 아이콘 색상, Ghost 버튼 border |
| `--c-border-light` | `#E5E7EB` | 스켈레톤 배경 |
| `--c-divider` | `#F3F4F6` | — |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-10 | 초안 작성 — 빈 상태 5종, 스켈레톤 5종, 풀 에러, 토스트, 인라인 에러, 오프라인 배너 |
