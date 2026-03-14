# 게시글 참석/불참 기능 기획서

> 작성일: 2026-03-14 | 작성자: 기획자 에이전트
> 선행 문서: `attendance-plan.md` (일정 참석 기획), `push-notification-plan.md`
> 우선순위: Must-have

---

## 1. 기능 개요 및 목적

게시글(특히 공지+일정 첨부 게시글)에서 참석/불참을 확인하고 명단을 관리하는 기능.

- **목적**: 공지 게시글에 참석 여부 확인 기능을 부여하여, 일정 상세 화면 진입 없이도 참석 의사를 표시 가능
- **핵심 원칙**: 일정 첨부된 게시글은 해당 일정의 `schedule_attendance` 데이터를 공유하여 이중 관리 방지
- **대상**: 모든 승인된 회원

### 1-1. 게시글 유형별 참석 기능 동작 방식

| 게시글 유형 | linked_schedule_id | 참석 기능 | 데이터 소스 |
|------------|-------------------|----------|------------|
| **공지 + 일정 첨부** | 있음 | 자동 활성화 | `schedule_attendance` 테이블 (일정과 공유) |
| **공지 (일정 없음)** | NULL | 작성자 선택 활성화 | `post_attendance` 테이블 (게시글 전용) |
| **일반 게시글 + 일정 첨부** | 있음 | 자동 활성화 | `schedule_attendance` 테이블 |
| **일반 게시글 (일정 없음)** | NULL | 작성자 선택 활성화 | `post_attendance` 테이블 |

> **핵심**: `linked_schedule_id`가 있으면 → `schedule_attendance` 재활용, 없으면 → `post_attendance` 사용

---

## 2. 사용자 흐름

### 2-1. 일정 첨부 게시글 (linked_schedule_id 존재)

```
게시글 상세 화면 진입
    ↓
[참석 여부] 섹션 자동 표시 (일정 첨부 감지)
    ↓
참석 / 불참 버튼 선택 (탭 한 번)
    ↓
schedule_attendance에 저장 (일정 상세와 동일 데이터)
    ↓
참석 현황 숫자 실시간 갱신
    ↓
[참석자 명단 보기] → 참석/불참 명단 확인
```

- 이 게시글에서 참석 표시 → 일정 상세에서도 동일하게 반영
- 일정 상세에서 참석 표시 → 이 게시글에서도 동일하게 반영

### 2-2. 일정 미첨부 게시글 (작성자가 참석 기능 ON)

```
게시글 작성 화면
    ↓
[참석 확인 기능 사용] 토글 ON (기본: OFF)
    ↓
게시글 등록
    ↓
게시글 상세 화면 → [참석 여부] 섹션 표시
    ↓
참석 / 불참 버튼 선택
    ↓
post_attendance에 저장 (게시글 전용)
```

### 2-3. 관리자 흐름

```
게시글 상세 화면
    ↓
참석 현황 요약 (참석 N명 / 불참 N명 / 미응답 N명)
    ↓
[전체 현황 보기] → 참석/불참/미응답 전체 명단 확인
```

---

## 3. DB 스키마

### 3-1. post_attendance 테이블 (신규)

> 일정이 첨부되지 않은 게시글의 참석 확인 전용

```sql
CREATE TABLE post_attendance (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(15) NOT NULL CHECK (status IN ('attending', 'not_attending')),
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_attendance_post ON post_attendance(post_id);
CREATE INDEX idx_post_attendance_user ON post_attendance(user_id);

CREATE TRIGGER post_attendance_updated_at
  BEFORE UPDATE ON post_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3-2. posts 테이블 확장

```sql
-- 게시글에 참석 기능 활성화 여부 (일정 미첨부 게시글용)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN DEFAULT false;
```

- `linked_schedule_id IS NOT NULL` → 자동으로 참석 기능 활성화 (attendance_enabled 무관)
- `linked_schedule_id IS NULL AND attendance_enabled = true` → post_attendance 테이블 사용

### 3-3. 기존 테이블 재활용 정리

| 테이블 | 용도 | 상태 |
|--------|------|------|
| `schedule_attendance` | 일정 참석 (게시글+일정 연동 공유) | 기존 (migration 012) |
| `notice_attendance` | (레거시) notices 테이블 전용 | 기존 — 점진적 폐기 대상 |
| `post_attendance` | 일정 미첨부 게시글 참석 | **신규** |

> `notice_attendance`는 기존 notices 시스템에 묶여 있으므로 그대로 유지.
> 새 게시판(posts) 체제에서는 `schedule_attendance` + `post_attendance` 조합 사용.

### 3-4. 마이그레이션 파일

파일: `database/migrations/014_post_attendance.sql`

```sql
-- 014: 게시글 참석 여부 기능
-- 1. posts 테이블에 attendance_enabled 컬럼 추가
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN DEFAULT false;

-- 2. 일정 미첨부 게시글용 참석 테이블
CREATE TABLE IF NOT EXISTS post_attendance (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(15) NOT NULL CHECK (status IN ('attending', 'not_attending')),
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_attendance_post ON post_attendance(post_id);
CREATE INDEX IF NOT EXISTS idx_post_attendance_user ON post_attendance(user_id);
```

---

## 4. API 엔드포인트 설계

### 4-1. 참석 여부 등록/변경

```
POST /api/posts/:id/attendance
Headers: Authorization: Bearer <token>
Body: {
  "status": "attending" | "not_attending"
}
Response: {
  "success": true,
  "data": {
    "post_id": 42,
    "status": "attending",
    "responded_at": "2026-03-14T14:30:00+09:00",
    "source": "schedule"  // "schedule" | "post" — 데이터 소스 표시
  }
}
```

**서버 로직**:
1. `posts` 테이블에서 해당 게시글 조회
2. `linked_schedule_id`가 있으면 → `schedule_attendance` 테이블에 UPSERT
3. `linked_schedule_id`가 없고 `attendance_enabled = true`이면 → `post_attendance` 테이블에 UPSERT
4. 참석 기능이 비활성화된 게시글이면 → 400 에러

### 4-2. 참석 여부 취소 (미응답 복귀)

```
DELETE /api/posts/:id/attendance
Headers: Authorization: Bearer <token>
Response: { "success": true }
```

- `linked_schedule_id` 유무에 따라 적절한 테이블에서 DELETE

### 4-3. 참석 현황 요약

```
GET /api/posts/:id/attendance/summary
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "attending": 18,
    "not_attending": 5,
    "no_response": 10,
    "total_members": 33,
    "my_status": "attending",
    "source": "schedule",
    "schedule_id": 15        // 일정 연동 시에만
  }
}
```

### 4-4. 참석자 명단 조회

```
GET /api/posts/:id/attendance/details
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "attending": [
      { "user_id": 1, "name": "김회장", "jc_position": "회장", "responded_at": "..." }
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

- 일반 회원: `attending`, `not_attending` 명단만
- 관리자: `no_response` 명단 포함

### 4-5. API 권한 정리

| API | 권한 |
|-----|------|
| POST /posts/:id/attendance | 모든 승인 회원 |
| DELETE /posts/:id/attendance | 본인만 |
| GET /posts/:id/attendance/summary | 모든 승인 회원 |
| GET /posts/:id/attendance/details | 참석/불참: 모든 회원 / 미응답: 관리자만 |

---

## 5. 프론트엔드 UI

### 5-1. 게시글 작성 폼 — 참석 기능 토글

> 일정 첨부가 없는 게시글 작성 시에만 표시

```
┌─────────────────────────────────────────┐
│  ─── 추가 옵션 ─────────────────────── │
│                                         │
│  📋 참석 확인 기능          [OFF]       │  ← 토글
│     회원들의 참석/불참을 확인합니다      │
│                                         │
│  📅 일정 첨부               [선택]     │  ← 기존 기능
│     (일정 첨부 시 참석 기능 자동 ON)    │
│                                         │
└─────────────────────────────────────────┘
```

- 일정을 첨부하면 → 참석 토글 자동 ON + 비활성화 (schedule_attendance 사용)
- 일정 미첨부 상태에서 토글 ON → post_attendance 사용

### 5-2. 게시글 상세 — 참석 여부 섹션

```
┌─────────────────────────────────────────┐
│  [게시글 제목]                          │
│  [게시글 내용...]                       │
│                                         │
│  📅 연결된 일정: 3월 정기 이사회         │  ← 일정 첨부 시
│     3/15(토) 14:00 · 영등포구청         │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  📋 참석 여부                           │
│                                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │   ✅ 참석    │  │   ❌ 불참    │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│  참석 18명 · 불참 5명 · 미응답 10명     │
│                                         │
│  [참석자 명단 보기 ▼]                   │
│                                         │
│  ─── 참석 (18명) ──────────────────── │
│  김회장 · 이부회장 · 박이사 · ...       │
│                                         │
│  ─── 불참 (5명) ───────────────────── │
│  정회원 · 최회원 · ...                  │
│                                         │
└─────────────────────────────────────────┘
```

- 버튼 스타일/동작은 `attendance-plan.md` §6-1과 동일
- 같은 버튼 다시 클릭 → 미응답으로 되돌리기 (DELETE 호출)
- 낙관적 UI 업데이트

### 5-3. 게시글 목록 카드에 참석 요약 표시

```
┌─────────────────────────────────────┐
│  📢 3월 정기 이사회 안내            │
│  김회장 · 2시간 전                  │
│  📅 3/15(토) 14:00                 │  ← 일정 정보
│  ✅ 18명 참석 · ❌ 5명 불참        │  ← 참석 요약
└─────────────────────────────────────┘
```

- 참석 기능이 활성화된 게시글만 참석 요약 행 표시
- 참석 기능 비활성화 게시글에는 표시 안 함

---

## 6. 일정 연동 상세

### 6-1. 데이터 동기화 원칙

```
[게시글 상세]                   [일정 상세]
      │                              │
      ├── 참석 버튼 클릭 ──────────────┤
      │   → schedule_attendance에 저장  │
      │                              │
      ├── 요약/명단 조회 ─────────────┤
      │   → schedule_attendance 조회   │
      │                              │
      └──────────── 동일 데이터 ──────┘
```

- **단일 데이터 소스**: `schedule_attendance` 테이블 하나로 양쪽에서 읽기/쓰기
- **실시간 반영**: 어느 쪽에서든 변경하면 양쪽 모두 반영

### 6-2. API 내부 로직 (의사코드)

```javascript
// POST /api/posts/:id/attendance
async function postAttendance(req, res) {
  const post = await getPost(req.params.id);

  if (post.linked_schedule_id) {
    // 일정 연동 → schedule_attendance 테이블 사용
    await upsertScheduleAttendance(
      post.linked_schedule_id,
      req.user.id,
      req.body.status
    );
    return res.json({ success: true, data: { source: 'schedule' } });
  }

  if (post.attendance_enabled) {
    // 게시글 전용 참석
    await upsertPostAttendance(post.id, req.user.id, req.body.status);
    return res.json({ success: true, data: { source: 'post' } });
  }

  return res.status(400).json({
    success: false,
    error: '참석 기능이 활성화되지 않은 게시글입니다'
  });
}
```

---

## 7. 비즈니스 규칙

1. **일정 첨부 게시글**: 참석 기능 자동 활성화, 별도 토글 불필요
2. **일정 미첨부 게시글**: 작성자가 토글로 참석 기능 ON/OFF 가능
3. **참석 변경**: 언제든 자유롭게 변경 가능
4. **게시글 삭제 시**: post_attendance 레코드 CASCADE 삭제
5. **일정 연동 게시글의 일정 삭제 시**: `linked_schedule_id = NULL` (ON DELETE SET NULL) → 참석 데이터는 schedule_attendance에서 CASCADE 삭제됨, 게시글에서 참석 섹션 숨김
6. **게시글 수정으로 일정 첨부 변경 시**: 새 일정 첨부 → 새 schedule_attendance로 연결 (기존 post_attendance 데이터는 별도 마이그레이션 불필요)

---

## 8. 구현 우선순위

### Phase 1 — MVP

| 순서 | 작업 | 담당 | 설명 |
|------|------|------|------|
| 1 | DB 마이그레이션 (post_attendance + attendance_enabled) | 백엔드 | `014_post_attendance.sql` |
| 2 | POST /api/posts/:id/attendance (등록/변경) | 백엔드 | schedule/post 분기 로직 |
| 3 | DELETE /api/posts/:id/attendance (취소) | 백엔드 | |
| 4 | GET /api/posts/:id/attendance/summary | 백엔드 | |
| 5 | GET /api/posts/:id/attendance/details | 백엔드 | |
| 6 | 게시글 상세 — 참석 여부 섹션 UI | 프론트 | 버튼 + 요약 + 명단 |
| 7 | 게시글 작성 폼 — 참석 기능 토글 | 프론트 | attendance_enabled 설정 |
| 8 | 게시글 목록 카드 — 참석 요약 표시 | 프론트 | 한 줄 요약 |

### Phase 2 — 확장

| 순서 | 작업 | 담당 | 설명 |
|------|------|------|------|
| 9 | 관리자 — 미응답자 Push 알림 발송 | 백엔드+프론트 | |
| 10 | notice_attendance → post_attendance 마이그레이션 | 백엔드 | 레거시 정리 |
| 11 | 참석률 통계 대시보드 | 프론트 | 관리자 웹 |

---

## 9. 기존 기획서와의 관계

| 항목 | attendance-plan.md | 이 문서 (post-attendance-plan.md) |
|------|--------------------|---------------------------------|
| 범위 | 일정(schedules) 전용 | 게시글(posts)에서의 참석 기능 |
| 데이터 | schedule_attendance | schedule_attendance 재활용 + post_attendance |
| 진입점 | 일정 상세 화면 | 게시글 상세 화면 |
| 연동 | 단독 | schedule_attendance 공유로 양방향 연동 |

**구현 시 `attendance-plan.md`를 먼저 구현한 뒤, 이 문서를 구현한다.**
