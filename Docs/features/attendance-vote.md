# 출석 투표 기능 기획서

> 작성일: 2026-03-10 | 작성자: 기획자 에이전트
> 관련 요구사항: R-02 (참석 투표 시스템)
> 우선순위: Must-have (MVP 범위)

---

## 1. 기능 개요

모임/행사 참석 여부를 앱에서 투표하고, 참석 현황을 실시간으로 파악하는 기능.

- **대상 사용자**: 모든 승인된 회원
- **생성 권한**: 관리자 또는 공지 작성 권한이 있는 직책자
- **목적**: 이사회 성원 확인, 월례회 참석 인원 파악, 일반 행사 참석 조사

---

## 2. 사용자 흐름

### 2-1. 회원 흐름 (투표 참여)

```
일정 목록 / 공지 상세
    ↓
일정 상세 화면 진입
    ↓
[참석 투표] 카드 확인
    ↓
참석 / 불참 / 미정 중 선택 (라디오 버튼)
    ↓
선택 즉시 저장 (별도 제출 버튼 없음)
    ↓
참석 현황 실시간 갱신 표시
    ↓
마감 전까지 변경 가능
```

### 2-2. 관리자 흐름 (투표 생성/관리)

```
일정 등록 또는 공지 작성
    ↓
[참석 투표 활성화] 토글 ON
    ↓
투표 설정 입력:
  - 투표 유형 선택 (이사회 / 월례회 / 일반)
  - 마감일 설정
  - (이사회) 성원 기준 인원 입력
  - (월례회) 1인당 비용 입력
    ↓
등록 완료 → 회원에게 투표 카드 노출
    ↓
현황 확인: 참석/불참/미정/미응답 목록
    ↓
마감 처리 (수동 또는 마감일 자동)
    ↓
(선택) 결과 내보내기 (CSV)
```

---

## 3. 투표 상태

| 상태 | 값 | 아이콘 | 색상 |
|------|-----|--------|------|
| **참석** | `attend` | ✅ 체크 | `#16A34A` (green) |
| **불참** | `absent` | ❌ 엑스 | `#DC2626` (red) |
| **미정** | `undecided` | ❓ 물음표 | `#F59E0B` (amber) |
| **미응답** | (투표 기록 없음) | — | `#6B7280` (gray) |

- 미응답: 투표에 아직 참여하지 않은 회원 (별도 레코드 없음)
- 마감 후에는 투표 변경 불가

---

## 4. 마감일 설정

- 관리자가 투표 생성 시 **마감일시**를 설정
- 마감일시가 지나면 자동으로 투표 비활성화
- 마감 전 관리자가 수동으로 조기 마감 가능
- 마감일 미설정 시: 관리자가 수동 마감할 때까지 투표 유지
- **마감 임박 표시**: 마감 24시간 이내 → "마감 임박" 배지 표시

---

## 5. 참석 현황 표시

### 5-1. 요약 표시 (일정 상세 내 투표 카드)

```
┌─────────────────────────────────────────┐
│  📋 참석 투표          마감: 3/15(토)   │
│                                         │
│  ○ 참석    ● 불참    ○ 미정            │  ← 본인 선택
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  │
│  │ ✅  │  │ ❌  │  │ ❓  │  │ 💤  │  │
│  │ 참석 │  │ 불참 │  │ 미정 │  │미응답│  │
│  │ 18명 │  │  5명 │  │  3명 │  │ 24명 │  │
│  └─────┘  └─────┘  └─────┘  └─────┘  │
│                                         │
│  [참석자 목록 보기 >]                    │  ← 펼침 또는 모달
└─────────────────────────────────────────┘
```

### 5-2. 상세 목록 (펼침 시)

```
참석 (18명)
  김회장  |  이부회장  |  박이사  |  ...

불참 (5명)
  정회원  |  최회원  |  ...

미정 (3명)
  한회원  |  ...

미응답 (24명)
  오회원  |  강회원  |  ...
```

### 5-3. 이사회 성원 표시 (vote_type = 'board_meeting')

```
성원 현황: 참석 15명 / 성원 기준 20명 (75%)
■■■■■■■■■■■■■■■□□□□□  ← 프로그레스 바
⚠️ 성원 미달 (5명 추가 필요)
```

### 5-4. 월례회 비용 표시 (vote_type = 'monthly_meeting')

```
예상 비용: 참석 42명 × 30,000원 = 1,260,000원
```

---

## 6. 관리자 기능

| 기능 | 설명 |
|------|------|
| **투표 생성** | 일정/공지 작성 시 투표 활성화 토글 |
| **투표 설정 수정** | 마감일 변경, 유형 변경, 성원 기준/비용 수정 |
| **조기 마감** | 마감일 전 수동으로 투표 종료 |
| **현황 조회** | 참석/불참/미정/미응답 회원 목록 |
| **미응답자 확인** | 미응답 회원 목록 별도 표시 |
| **결과 내보내기** | CSV 파일 다운로드 (이름, 직책, 투표 상태, 투표 일시) |

---

## 7. API 설계안

### 7-1. 투표 설정 (관리자)

```
# 일정에 투표 설정 추가/수정
PUT /api/schedules/:id/vote-config
Body: {
  "vote_type": "board_meeting" | "monthly_meeting" | "general",
  "deadline": "2026-03-15T18:00:00+09:00",
  "quorum_count": 20,          // 이사회만
  "quorum_basis": "directors",  // 이사회만
  "cost_per_person": 30000,     // 월례회만
  "is_active": true
}
Response: { "success": true, "data": { ... } }
```

### 7-2. 투표 참여 (회원)

```
# 투표하기 (생성 또는 변경)
POST /api/schedules/:id/vote
Body: {
  "status": "attend" | "absent" | "undecided"
}
Response: { "success": true, "data": { "status": "attend", "voted_at": "..." } }
```

### 7-3. 투표 현황 조회

```
# 투표 현황 요약 (모든 회원)
GET /api/schedules/:id/vote-summary
Response: {
  "success": true,
  "data": {
    "config": { "vote_type": "board_meeting", "deadline": "...", "quorum_count": 20, "is_active": true },
    "summary": { "attend": 18, "absent": 5, "undecided": 3, "no_response": 24 },
    "my_vote": "absent",
    "total_members": 50
  }
}

# 투표 상세 목록 (관리자)
GET /api/schedules/:id/vote-details
Response: {
  "success": true,
  "data": {
    "attend": [{ "member_id": 1, "name": "김회장", "position": "회장", "voted_at": "..." }, ...],
    "absent": [...],
    "undecided": [...],
    "no_response": [...]
  }
}
```

### 7-4. 투표 마감 (관리자)

```
POST /api/schedules/:id/vote-close
Response: { "success": true, "data": { "closed_at": "..." } }
```

### 7-5. 결과 내보내기 (관리자)

```
GET /api/schedules/:id/vote-export?format=csv
Response: CSV 파일 다운로드
```

---

## 8. DB 테이블 설계안

### 8-1. attendance_config (투표 설정)

```sql
CREATE TABLE attendance_config (
  id            SERIAL PRIMARY KEY,
  schedule_id   INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  vote_type     VARCHAR(20) NOT NULL DEFAULT 'general',
                -- 'board_meeting' | 'monthly_meeting' | 'general'
  quorum_count  INTEGER,          -- 성원 기준 인원 (이사회)
  quorum_basis  VARCHAR(20),      -- 'directors' | 'all'
  cost_per_person INTEGER,        -- 1인당 비용 (월례회, 원 단위)
  deadline      TIMESTAMPTZ,      -- 투표 마감일시
  is_active     BOOLEAN NOT NULL DEFAULT true,
  closed_at     TIMESTAMPTZ,      -- 수동 마감 일시
  created_by    INTEGER NOT NULL REFERENCES members(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(schedule_id)             -- 일정당 투표 설정 1개
);
```

### 8-2. attendance_votes (투표 기록)

```sql
CREATE TABLE attendance_votes (
  id            SERIAL PRIMARY KEY,
  config_id     INTEGER NOT NULL REFERENCES attendance_config(id) ON DELETE CASCADE,
  member_id     INTEGER NOT NULL REFERENCES members(id),
  status        VARCHAR(10) NOT NULL,
                -- 'attend' | 'absent' | 'undecided'
  voted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(config_id, member_id)    -- 회원당 투표 1개 (변경 시 UPDATE)
);

CREATE INDEX idx_attendance_votes_config ON attendance_votes(config_id);
CREATE INDEX idx_attendance_votes_member ON attendance_votes(member_id);
```

---

## 9. 비즈니스 규칙

1. **투표 변경**: 마감 전까지 자유롭게 변경 가능 (INSERT → ON CONFLICT UPDATE)
2. **마감 판정**: `deadline`이 지났거나 `closed_at`이 설정된 경우 마감
3. **미응답 계산**: 전체 승인 회원 수 - (참석 + 불참 + 미정)
4. **성원 판정**: `attend` 수 ≥ `quorum_count` → 성원 충족
5. **비용 계산**: `attend` 수 × `cost_per_person`
6. **삭제 처리**: 일정 삭제 시 투표 설정 + 투표 기록 CASCADE 삭제

---

## 10. 향후 확장 가능성

- 푸시 알림: 투표 생성 시 전체 회원 알림, 마감 임박 리마인더
- 위임 투표: 이사회에서 위임장 기반 투표 지원
- 투표 통계: 월별/분기별 참석률 통계 대시보드
