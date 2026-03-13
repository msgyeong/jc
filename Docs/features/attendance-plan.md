# 참석 여부 확인 기능 기획서 (이슈 #5)

> 작성일: 2026-03-13 | 작성자: 기획자 에이전트
> 관련 이슈: GitHub #5
> 선행 문서: `Docs/features/attendance-vote.md` (투표 시스템 상세 기획)
> 우선순위: Must-have

---

## 1. 기능 개요 및 목적

일정별로 회원의 참석/불참/미응답 여부를 확인하고, 참석 명단을 관리하는 기능.

- **목적**:
  - 이사회: 성원(정족수) 충족 여부 사전 확인
  - 월례회: 참석 인원 파악 (식사 준비, 장소 규모 결정)
  - 일반 행사: 참석 예정 인원 파악
- **대상**: 모든 승인된 회원
- **핵심 원칙**: 간단한 탭 한 번으로 참석/불참 체크, 즉시 반영
- **기존 기획 연관**: `attendance-vote.md`의 투표 시스템을 단순화한 핵심 기능

---

## 2. 사용자 흐름

### 2-1. 일반 회원 흐름

```
일정 목록 또는 홈 화면
    ↓
일정 카드 탭 → 일정 상세 화면 진입
    ↓
[참석 여부] 섹션 확인
    ↓
참석 / 불참 중 선택 (버튼 탭)
    ↓
선택 즉시 서버 저장 (별도 제출 버튼 없음)
    ↓
참석 현황 숫자 실시간 갱신
    ↓
[참석자 명단 보기] 탭 → 참석/불참 명단 확인
    ↓
변경 가능 (다시 버튼 탭으로 상태 변경)
```

### 2-2. 관리자 흐름

```
일정 상세 화면
    ↓
참석 현황 요약 (참석 N명 / 불참 N명 / 미응답 N명) 확인
    ↓
[전체 현황 보기] → 참석/불참/미응답 회원 명단 전체 확인
    ↓
(선택) 미응답자에게 알림 발송 (Push 알림 연동, Phase 2)
```

---

## 3. 참석 상태 정의

| 상태 | 값 | 표시 | 색상 |
|------|-----|------|------|
| **참석** | `attending` | ✅ 참석 | `#16A34A` (green) |
| **불참** | `not_attending` | ❌ 불참 | `#DC2626` (red) |
| **미응답** | (레코드 없음) | — 미응답 | `#6B7280` (gray) |

> 기존 `attendance-vote.md`의 `undecided`(미정) 상태는 이 단순화 버전에서 제외.
> 필요 시 향후 추가 가능.

---

## 4. DB 스키마

### 4-1. schedule_attendance 테이블

```sql
CREATE TABLE schedule_attendance (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(15) NOT NULL CHECK (status IN ('attending', 'not_attending')),
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(schedule_id, user_id)  -- 회원당 일정별 1개 레코드
);

CREATE INDEX idx_schedule_attendance_schedule ON schedule_attendance(schedule_id);
CREATE INDEX idx_schedule_attendance_user ON schedule_attendance(user_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER schedule_attendance_updated_at
  BEFORE UPDATE ON schedule_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4-2. 기존 테이블과의 관계

- `notice_attendance` 테이블은 기존에 `notices` 전용으로 이미 존재
- `schedule_attendance`는 `schedules` 전용으로 신규 생성
- 두 테이블은 독립적으로 운영 (polymorphic 통합 불필요 — 간결성 우선)

### 4-3. 마이그레이션 파일

파일: `database/migrations/012_schedule_attendance.sql`

```sql
-- 012: 일정 참석 여부 테이블
CREATE TABLE IF NOT EXISTS schedule_attendance (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(15) NOT NULL CHECK (status IN ('attending', 'not_attending')),
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(schedule_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_schedule_attendance_schedule
  ON schedule_attendance(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_attendance_user
  ON schedule_attendance(user_id);

CREATE TRIGGER schedule_attendance_updated_at
  BEFORE UPDATE ON schedule_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 5. API 엔드포인트 설계

### 5-1. 참석 여부 등록/변경

```
POST /api/schedules/:id/attendance
Headers: Authorization: Bearer <token>
Body: {
  "status": "attending" | "not_attending"
}
Response: {
  "success": true,
  "data": {
    "schedule_id": 15,
    "status": "attending",
    "responded_at": "2026-03-13T14:30:00+09:00"
  }
}
```

- INSERT ... ON CONFLICT (schedule_id, user_id) DO UPDATE
- 동일 상태 재전송 시에도 `responded_at` 갱신

### 5-2. 참석 여부 취소 (미응답으로 되돌리기)

```
DELETE /api/schedules/:id/attendance
Headers: Authorization: Bearer <token>
Response: { "success": true }
```

- 레코드 삭제 → 미응답 상태로 복귀

### 5-3. 참석 현황 요약 조회

```
GET /api/schedules/:id/attendance/summary
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "attending": 18,
    "not_attending": 5,
    "no_response": 10,
    "total_members": 33,
    "my_status": "attending"       // 본인 상태 (null = 미응답)
  }
}
```

- `total_members`: 전체 승인된 회원 수 (status='active')
- `no_response`: total_members - attending - not_attending

### 5-4. 참석자 명단 조회

```
GET /api/schedules/:id/attendance/details
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "attending": [
      { "user_id": 1, "name": "김회장", "jc_position": "회장", "responded_at": "..." },
      { "user_id": 3, "name": "이부회장", "jc_position": "부회장", "responded_at": "..." }
    ],
    "not_attending": [
      { "user_id": 5, "name": "정회원", "jc_position": null, "responded_at": "..." }
    ],
    "no_response": [
      { "user_id": 7, "name": "오회원", "jc_position": null }
    ]
  }
}
```

- 일반 회원: `attending`, `not_attending` 명단만 열람 가능
- 관리자: `no_response` 명단도 열람 가능
- 정렬: 직책 우선 → 이름 가나다순

### 5-5. API 권한 정리

| API | 권한 |
|-----|------|
| POST /attendance | 모든 승인 회원 |
| DELETE /attendance | 본인만 |
| GET /summary | 모든 승인 회원 |
| GET /details | 참석/불참: 모든 회원 / 미응답: 관리자만 |

---

## 6. 프론트엔드 UI

### 6-1. 일정 상세 — 참석 여부 섹션

```
┌─────────────────────────────────────────┐
│  📋 참석 여부                           │
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │   ✅ 참석    │  │   ❌ 불참    │    │  ← 선택된 버튼 강조
│  └──────────────┘  └──────────────┘    │
│                                         │
│  참석 18명 · 불참 5명 · 미응답 10명     │  ← 요약 텍스트
│                                         │
│  [참석자 명단 보기 ▼]                   │  ← 아코디언 펼침
│                                         │
│  ─── 참석 (18명) ───────────────────── │
│  김회장 · 이부회장 · 박이사 · ...       │  ← 이름만, 칩 형태
│                                         │
│  ─── 불참 (5명) ────────────────────── │
│  정회원 · 최회원 · ...                  │
│                                         │
└─────────────────────────────────────────┘
```

#### 버튼 상태

| 상태 | 참석 버튼 | 불참 버튼 |
|------|----------|----------|
| 미응답 | outline (기본) | outline (기본) |
| 참석 선택 | filled green (`#16A34A`) | outline |
| 불참 선택 | outline | filled red (`#DC2626`) |

- 버튼 클릭 즉시 API 호출 + 낙관적 UI 업데이트
- 같은 버튼 다시 클릭 → 미응답으로 되돌리기 (DELETE 호출)

### 6-2. 일정 목록 카드에 참석 요약 표시

```
┌─────────────────────────────────────┐
│  📅 3월 정기 이사회                  │
│  3/15(토) 14:00 · 영등포구청         │
│  ✅ 18명 참석 · ❌ 5명 불참          │  ← 참석 요약 한 줄
└─────────────────────────────────────┘
```

### 6-3. 관리자 전용 — 전체 현황 뷰

관리자는 일정 상세에서 더 상세한 현황을 볼 수 있다:

```
┌─────────────────────────────────────────┐
│  📊 참석 현황 (관리자)                   │
│                                         │
│  ■■■■■■■■■■■■■■■■■■□□□□□□□□□□□□□□□     │
│  참석 18명 (55%) / 전체 33명             │
│                                         │
│  ─── 참석 (18명) ───────────────────── │
│  김회장    | 회장      | 3/10 14:30     │
│  이부회장  | 부회장    | 3/10 15:00     │
│  박이사    | 이사      | 3/11 09:20     │
│  ...                                    │
│                                         │
│  ─── 불참 (5명) ────────────────────── │
│  정회원    |           | 3/11 10:00     │
│  ...                                    │
│                                         │
│  ─── 미응답 (10명) ──────────────────── │
│  오회원    |           | —              │
│  강회원    |           | —              │
│  ...                                    │
│                                         │
└─────────────────────────────────────────┘
```

- 관리자만 미응답자 목록 확인 가능
- 직책 + 응답 일시 표시
- 프로그레스 바로 참석률 시각화

---

## 7. 관리자 웹 연동

### 7-1. 일정별 참석 현황 대시보드

관리자 웹(`web/admin/`)에서 일정 상세 진입 시 참석 현황을 대시보드 형태로 제공:

```
┌─────────────────────────────────────────────────────────┐
│  일정: 3월 정기 이사회                                    │
│  일시: 2026-03-15 14:00 · 장소: 영등포구청 3층            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │   18    │  │    5    │  │   10    │  │   33    │  │
│  │  참석   │  │  불참   │  │ 미응답  │  │  전체   │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
│                                                         │
│  참석률: 54.5%  ■■■■■■■■■■■□□□□□□□□□                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  필터: [전체 ▼]  검색: [이름 검색...        ]            │
├──────┬──────────┬──────────┬──────────────────────────-──┤
│ 이름 │ 직책     │ 상태     │ 응답 일시                   │
├──────┼──────────┼──────────┼─────────────────────────────┤
│ 김회장│ 회장     │ ✅ 참석  │ 2026-03-10 14:30          │
│ 이부장│ 부회장   │ ✅ 참석  │ 2026-03-10 15:00          │
│ 정회원│ —       │ ❌ 불참  │ 2026-03-11 10:00          │
│ 오회원│ —       │ — 미응답 │ —                          │
├──────┴──────────┴──────────┴─────────────────────────────┤
│  [CSV 다운로드]                                          │
└─────────────────────────────────────────────────────────┘
```

### 7-2. 관리자 웹 API

관리자 웹에서는 동일한 API를 사용하되, 관리자 권한으로 `no_response` 명단 포함:

```
GET /api/schedules/:id/attendance/details
→ 관리자 토큰 → 미응답 명단 포함 응답
```

### 7-3. CSV 내보내기

```
GET /api/schedules/:id/attendance/export?format=csv
Headers: Authorization: Bearer <admin-token>
Response: CSV 파일 다운로드

CSV 형식:
이름,직책,상태,응답일시
김회장,회장,참석,2026-03-10 14:30
이부회장,부회장,참석,2026-03-10 15:00
정회원,,불참,2026-03-11 10:00
오회원,,미응답,
```

---

## 8. 비즈니스 규칙

1. **참석 변경**: 언제든 자유롭게 변경 가능 (INSERT ON CONFLICT UPDATE)
2. **미응답 계산**: 전체 승인 회원 수 - (참석 + 불참)
3. **일정 삭제 시**: schedule_attendance 레코드 CASCADE 삭제
4. **회원 탈퇴 시**: 해당 회원의 attendance 레코드 CASCADE 삭제
5. **비승인 회원**: 참석 여부 체크 불가 (API에서 status='active' 검증)

---

## 9. 기존 기획서와의 관계

| 항목 | attendance-vote.md | attendance-plan.md (이 문서) |
|------|--------------------|-----------------------------|
| 범위 | 투표 시스템 (설정, 유형, 마감) | 참석 여부 확인 (단순) |
| 상태 | attend/absent/undecided | attending/not_attending |
| DB | attendance_config + attendance_votes | schedule_attendance (단일 테이블) |
| 마감 | 마감일 + 수동 마감 | 없음 (언제든 변경 가능) |
| 투표 유형 | 이사회/월례회/일반 | 없음 (일정 category로 구분) |
| 성원/비용 | 지원 | Phase 2에서 attendance-vote.md 기반 확장 |

**구현 순서**: 이 문서(단순 참석 확인)를 먼저 구현 → 이후 `attendance-vote.md`의 투표 설정/마감/성원 기능을 Phase 2에서 확장

---

## 10. 향후 확장 (Phase 2)

- **투표 마감 기능**: `attendance-vote.md` 기반 deadline, 조기 마감
- **이사회 성원 표시**: 참석 수 vs 정족수 프로그레스 바
- **월례회 비용 계산**: 참석자 × 단가
- **미응답자 알림**: 관리자가 미응답자에게 푸시 알림 발송
- **참석률 통계**: 월별/분기별 회원 참석률 대시보드
