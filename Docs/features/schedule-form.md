# 일정 등록/수정 화면 기획서

> 작성일: 2026-03-10 | 작성자: 기획자 에이전트
> 관련 항목: M-05 (일정 등록 화면 완성)
> 우선순위: Must-have (MVP 범위)

---

## 1. 기능 개요

관리자/권한자가 일정을 등록하거나 수정하는 폼 화면.

- **등록 권한**: `super_admin`, `admin`, 또는 `can_post_notice = true`인 직책자
- **수정 권한**: 작성자 본인 또는 admin
- **현재 상태**: `schedules.js`에 기본 폼 존재하나 일부 필드·유효성 검증 미완성
- **진입 경로**: 캘린더 화면 FAB(+) 또는 상세 화면 "수정" 메뉴

---

## 2. 화면 구성

```
┌─────────────────────────────────────┐
│  ← 취소        일정 등록     [저장]  │  ← AppBar
├─────────────────────────────────────┤
│                                     │
│  제목 *                             │
│  ┌─────────────────────────────┐   │
│  │ 3월 정기 이사회              │   │
│  └─────────────────────────────┘   │
│                                     │
│  카테고리 *                         │
│  ┌─────────────────────────────┐   │
│  │ 회의 ▼                      │   │  ← 드롭다운
│  └─────────────────────────────┘   │
│                                     │
│  시작 날짜/시간 *                   │
│  ┌──────────────┬──────────────┐   │
│  │ 2026-03-15   │  14:00       │   │  ← date + time input
│  └──────────────┴──────────────┘   │
│                                     │
│  종료 날짜/시간                     │
│  ┌──────────────┬──────────────┐   │
│  │ 2026-03-15   │  16:00       │   │
│  └──────────────┴──────────────┘   │
│                                     │
│  ☐ 종일 이벤트                     │  ← 체크 시 시간 입력 숨김
│                                     │
│  장소                               │
│  ┌─────────────────────────────┐   │
│  │ 영등포구청 3층 대회의실      │   │
│  └─────────────────────────────┘   │
│                                     │
│  설명                               │
│  ┌─────────────────────────────┐   │
│  │ 3월 정기 이사회입니다.       │   │
│  │ 안건:                        │   │
│  │ 1. 상반기 예산 승인          │   │
│  │                              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─── 참석 투표 설정 ───────────── │
│                                     │
│  참석 투표 활성화         [토글 ON] │
│                                     │
│  투표 유형 *                        │  ← 토글 ON 시 표시
│  ○ 이사회  ● 월례회  ○ 일반       │
│                                     │
│  마감일                             │
│  ┌─────────────────────────────┐   │
│  │ 2026-03-14 18:00            │   │
│  └─────────────────────────────┘   │
│                                     │
│  1인당 비용 (원)                    │  ← 월례회 선택 시만
│  ┌─────────────────────────────┐   │
│  │ 30000                        │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│           [일정 등록]               │  ← 하단 CTA 버튼
└─────────────────────────────────────┘
```

---

## 3. 필드 목록

### 3-1. 기본 정보 필드

| 필드 | DB 컬럼 | 타입 | 필수 | 유효성 검증 |
|------|---------|------|------|-------------|
| **제목** | `title` | TEXT | ✅ | 1~100자, 빈 문자열 불가 |
| **카테고리** | `category` | SELECT | ✅ | `event`/`meeting`/`training`/`holiday`/`other` 중 택1 |
| **시작 날짜** | `start_date` (date) | DATE | ✅ | 유효한 날짜 |
| **시작 시간** | `start_date` (time) | TIME | 조건 | 종일 이벤트 아닌 경우 필수 |
| **종료 날짜** | `end_date` (date) | DATE | ❌ | 시작 날짜 이후여야 함 |
| **종료 시간** | `end_date` (time) | TIME | ❌ | 시작 시간 이후여야 함 (같은 날인 경우) |
| **종일 이벤트** | — | CHECKBOX | ❌ | 체크 시 시간 입력 비활성 |
| **장소** | `location` | TEXT | ❌ | 최대 200자 |
| **설명** | `description` | TEXTAREA | ❌ | 최대 2000자 |

### 3-2. 참석 투표 설정 필드

참석 투표 토글을 ON으로 설정하면 아래 필드가 표시된다.

| 필드 | DB 테이블/컬럼 | 타입 | 필수 | 조건부 표시 |
|------|----------------|------|------|-------------|
| **투표 활성화** | `attendance_config.is_active` | TOGGLE | ❌ | 항상 |
| **투표 유형** | `attendance_config.vote_type` | RADIO | ✅ | 토글 ON |
| **마감일** | `attendance_config.deadline` | DATETIME | ❌ | 토글 ON |
| **성원 기준 인원** | `attendance_config.quorum_count` | NUMBER | ✅ | 이사회 선택 시 |
| **성원 기준 모수** | `attendance_config.quorum_basis` | SELECT | ✅ | 이사회 선택 시 |
| **1인당 비용** | `attendance_config.cost_per_person` | NUMBER | ❌ | 월례회 선택 시 |

---

## 4. 카테고리 목록

| 값 | 레이블 | 설명 |
|-----|--------|------|
| `event` | 행사 | 기본값. 총회, 워크숍, 친목 행사 등 |
| `meeting` | 회의 | 이사회, 정기 회의, 위원회 |
| `training` | 교육 | 세미나, 강연, 교육 프로그램 |
| `holiday` | 휴일 | 공휴일, JC 기념일 |
| `other` | 기타 | 분류 외 기타 일정 |

---

## 5. 유효성 검증 규칙

### 5-1. 프론트엔드 검증 (즉시)

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

### 5-2. 에러 표시 방식

- 인라인 표시: 해당 필드 바로 아래 빨간 텍스트 (`#DC2626`, 13px)
- 에러 필드 border 색상: `#DC2626`
- 저장 시 첫 번째 에러 필드로 스크롤

---

## 6. 수정 모드

### 6-1. 진입

- 일정 상세 → 더보기(⋮) → "수정" 클릭
- URL: `#schedule-edit-{id}` 또는 내부 상태 관리

### 6-2. 프리필 동작

```javascript
// 기존 일정 데이터로 폼 초기화
{
  title: schedule.title,
  category: schedule.category,
  start_date: schedule.start_date,  // date + time 분리
  end_date: schedule.end_date,
  location: schedule.location,
  description: schedule.description,
  // 투표 설정 (존재하는 경우)
  vote_enabled: !!schedule.vote_config,
  vote_type: schedule.vote_config?.vote_type,
  deadline: schedule.vote_config?.deadline,
  quorum_count: schedule.vote_config?.quorum_count,
  cost_per_person: schedule.vote_config?.cost_per_person
}
```

### 6-3. 수정 제한 사항

| 상황 | 처리 |
|------|------|
| 투표가 진행 중인 일정 수정 | 투표 설정은 수정 가능 (유형 변경은 경고 표시) |
| 이미 투표 기록이 있는 유형 변경 | "투표 유형을 변경하면 기존 투표 기록이 유지됩니다. 계속하시겠습니까?" 확인 |
| 마감된 투표 | 재활성화 가능 (마감일 변경으로) |

### 6-4. UI 차이

| 항목 | 등록 모드 | 수정 모드 |
|------|-----------|-----------|
| AppBar 타이틀 | "일정 등록" | "일정 수정" |
| CTA 버튼 | "일정 등록" | "수정 완료" |
| 취소 버튼 동작 | 캘린더로 | 상세 화면으로 |

---

## 7. 종일 이벤트 체크박스

- 체크 시: 시간 입력 필드 숨김 (날짜만 입력)
- `start_date`에 `00:00:00` 저장
- `end_date`에 해당일 `23:59:59` 저장 (또는 NULL)
- 체크 해제 시: 시간 입력 필드 다시 표시

---

## 8. API 목록

| 메서드 | 경로 | 설명 | 현재 상태 |
|--------|------|------|-----------|
| `POST` | `/api/schedules` | 일정 등록 | ✅ 구현됨 |
| `PUT` | `/api/schedules/:id` | 일정 수정 | ✅ 구현됨 |
| `GET` | `/api/schedules/:id` | 수정 시 기존 데이터 조회 | ✅ 구현됨 |
| `PUT` | `/api/schedules/:id/vote-config` | 투표 설정 추가/수정 | ✅ 구현됨 |

### 등록 API 요청 예시

```
POST /api/schedules
Headers: Authorization: Bearer <token>
Body: {
  "title": "3월 정기 이사회",
  "category": "meeting",
  "start_date": "2026-03-15T14:00:00+09:00",
  "end_date": "2026-03-15T16:00:00+09:00",
  "location": "영등포구청 3층 대회의실",
  "description": "3월 정기 이사회입니다.\n안건:\n1. 상반기 예산 승인"
}
Response: {
  "success": true,
  "data": { "id": 10, "title": "3월 정기 이사회", ... }
}
```

### 투표 설정 (등록 후 별도 호출)

```
PUT /api/schedules/10/vote-config
Body: {
  "vote_type": "board_meeting",
  "deadline": "2026-03-14T18:00:00+09:00",
  "quorum_count": 20,
  "quorum_basis": "directors",
  "is_active": true
}
```

---

## 9. DB 변경사항

**신규 변경 없음** — 기존 `schedules` + `attendance_config` 테이블로 처리.

기존 스키마:
```sql
-- schedules: id, title, description, start_date, end_date, location, category, created_by, ...
-- attendance_config: id, schedule_id, vote_type, quorum_count, quorum_basis, cost_per_person, deadline, is_active, ...
```

---

## 10. 유저 플로우

### 10-1. 등록 플로우

```
캘린더 화면 → FAB(+) 클릭
    ↓
일정 등록 폼 표시
    ↓
필드 입력 (제목*, 카테고리*, 날짜*, 시간, 장소, 설명)
    ↓
(선택) 참석 투표 토글 ON → 투표 설정 입력
    ↓
[일정 등록] 클릭
    ↓
유효성 검증 통과?
  ├─ NO → 에러 메시지 인라인 표시
  └─ YES → API 호출 (POST /api/schedules)
             ↓
         투표 설정 있으면 → PUT /api/schedules/:id/vote-config
             ↓
         성공 → 캘린더 화면 복귀 (해당 날짜 선택 상태)
         실패 → 에러 메시지 표시
```

### 10-2. 수정 플로우

```
일정 상세 → 더보기(⋮) → "수정"
    ↓
기존 데이터로 폼 프리필
    ↓
필드 수정
    ↓
[수정 완료] 클릭
    ↓
유효성 검증 → API 호출 (PUT /api/schedules/:id)
    ↓
성공 → 일정 상세 화면 복귀 (갱신된 데이터)
```

---

## 11. 프론트엔드 구현 가이드

### 수정 대상 파일

| 파일 | 수정 내용 |
|------|-----------|
| `web/js/schedules.js` | 등록/수정 폼 렌더링 보강, 종일 이벤트 토글, 투표 설정 UI, 유효성 검증 |
| `web/styles/main.css` | 폼 스타일, 에러 표시, 토글 스위치 |

### 폼 스타일 가이드

```css
/* 입력 필드 */
.schedule-form input, .schedule-form select, .schedule-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 15px;
}

/* 에러 상태 */
.schedule-form .field-error input {
  border-color: #DC2626;
}
.schedule-form .error-message {
  color: #DC2626;
  font-size: 13px;
  margin-top: 4px;
}

/* CTA 버튼 */
.schedule-form .submit-btn {
  width: 100%;
  height: 48px;
  background: #2563EB;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
}
```
