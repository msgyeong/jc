# 직책 관리 시스템 기획서

> 작성일: 2026-03-14 | 작성자: 기획자 에이전트
> 우선순위: Must-have

---

## 1. 기능 개요

회원별 JC 직책을 체계적으로 관리하고, 프로필/회원 목록에서 직책을 명확하게 표시하는 기능.

- **목적**: 회원 직책 정보를 일관되게 관리하고, 직책별 정렬/필터 제공
- **대상**: 관리자 (직책 배정), 모든 회원 (직책 열람)
- **핵심 원칙**: 기존 `positions` 테이블(migration 010) + `users.jc_position` 필드를 최대한 활용

---

## 2. 직책 목록

### 2-1. 고정 직책 (기본 제공)

> migration 010에 이미 seed 데이터로 등록됨

| 직책명 | level | 설명 |
|--------|-------|------|
| 회장 | 6 | 최고 대표 |
| 수석부회장 | 5 | 회장 보좌 |
| 부회장 | 4 | 분과/업무별 부회장 |
| 총무 | 3 | 사무 총괄 |
| 이사 | 2 | 이사회 구성원 |
| 감사 | 1 | 감사 담당 |
| 일반회원 | 0 | 기본 직책 |

### 2-2. 추가 직책 (관리자가 등록)

관리자가 필요에 따라 커스텀 직책을 추가할 수 있다:

- 상임부회장, 사무국장, 분과위원장, 신입회원 등
- `positions` 테이블에 INSERT
- level 값으로 정렬 순서 결정

---

## 3. DB 스키마

### 3-1. 기존 테이블 활용

**positions 테이블** (migration 010 — 이미 존재):
```sql
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  level INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**users.jc_position** (기존 TEXT 필드):
- 현재: 자유 텍스트로 직책명 직접 입력
- 변경 계획: `position_id` 외래키로 전환하여 정규화

### 3-2. users 테이블 확장

```sql
-- users 테이블에 position_id 외래키 추가
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS position_id INTEGER REFERENCES positions(id) ON DELETE SET NULL;

-- 기존 jc_position 텍스트 → position_id 매핑 (마이그레이션)
UPDATE users u
  SET position_id = p.id
  FROM positions p
  WHERE u.jc_position = p.name
    AND u.position_id IS NULL;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_position_id ON users(position_id);
```

> `jc_position` 컬럼은 하위 호환을 위해 당분간 유지하되, 새로운 기능은 `position_id`를 사용.
> API에서는 position_id를 기준으로 하되, jc_position도 동기화.

### 3-3. 직책 변동 이력 (선택적 확장)

```sql
CREATE TABLE position_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id INTEGER REFERENCES positions(id) ON DELETE SET NULL,
  position_name VARCHAR(50) NOT NULL,  -- 당시 직책명 (이름 변경 대비)
  started_at DATE NOT NULL,
  ended_at DATE,
  changed_by INTEGER REFERENCES users(id),  -- 변경한 관리자
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_position_history_user ON position_history(user_id);
```

> Phase 2 구현. 회원 상세 프로필(인물카드)의 JC 이력 섹션에서 활용.

### 3-4. 마이그레이션 파일

파일: `database/migrations/015_user_position_id.sql`

```sql
-- 015: 사용자 직책 외래키 + 직책 이력 테이블

-- 1. users 테이블에 position_id 추가
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS position_id INTEGER REFERENCES positions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_position_id ON users(position_id);

-- 2. 기존 jc_position → position_id 매핑
UPDATE users u
  SET position_id = p.id
  FROM positions p
  WHERE u.jc_position = p.name
    AND u.position_id IS NULL;

-- 3. 직책 이력 테이블
CREATE TABLE IF NOT EXISTS position_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id INTEGER REFERENCES positions(id) ON DELETE SET NULL,
  position_name VARCHAR(50) NOT NULL,
  started_at DATE NOT NULL,
  ended_at DATE,
  changed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_position_history_user ON position_history(user_id);
```

---

## 4. API 엔드포인트 설계

### 4-1. 직책 목록 조회

```
GET /api/positions
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": [
    { "id": 1, "name": "회장", "level": 6, "description": "최고 대표" },
    { "id": 2, "name": "수석부회장", "level": 5, "description": "회장 보좌" },
    ...
  ]
}
```

- 모든 승인 회원 열람 가능
- level 내림차순 정렬

### 4-2. 직책 추가 (관리자)

```
POST /api/positions
Headers: Authorization: Bearer <admin-token>
Body: {
  "name": "사무국장",
  "level": 3,
  "description": "사무 총괄 보좌"
}
Response: {
  "success": true,
  "data": { "id": 8, "name": "사무국장", "level": 3 }
}
```

### 4-3. 직책 수정 (관리자)

```
PUT /api/positions/:id
Headers: Authorization: Bearer <admin-token>
Body: {
  "name": "사무국장",
  "level": 4,
  "description": "수정된 설명"
}
Response: { "success": true }
```

### 4-4. 직책 삭제 (관리자)

```
DELETE /api/positions/:id
Headers: Authorization: Bearer <admin-token>
Response: { "success": true }
```

- 해당 직책을 가진 회원의 `position_id` → NULL (ON DELETE SET NULL)
- 고정 직책(level >= 1) 삭제 시 경고 확인 필요

### 4-5. 회원 직책 변경 (관리자)

```
PUT /api/members/:id/position
Headers: Authorization: Bearer <admin-token>
Body: {
  "position_id": 3
}
Response: {
  "success": true,
  "data": {
    "user_id": 5,
    "position": { "id": 3, "name": "부회장", "level": 4 }
  }
}
```

**서버 로직**:
1. `users.position_id` 업데이트
2. `users.jc_position` 동기화 (호환성)
3. (Phase 2) `position_history`에 이전 직책 종료 + 새 직책 시작 기록

### 4-6. 회원 목록 — 직책 필터/정렬

기존 `GET /api/members` 확장:

```
GET /api/members?position_id=3&sort=position
Headers: Authorization: Bearer <token>

Query Parameters:
  position_id: 직책 ID로 필터 (선택)
  sort: "position" | "name" | "joined" (기본: position)
```

- `sort=position`: positions.level 내림차순 → 이름 가나다순
- 직책 없는 회원(position_id IS NULL)은 맨 뒤

---

## 5. 프론트엔드 UI

### 5-1. 회원 목록 — 직책 표시

```
┌─────────────────────────────────────┐
│  회원 목록            [필터 ▼] [검색]│
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 김영등                   │   │
│  │    회장 · 제1분과            │   │  ← 직책 + 소속분과
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 이청년                   │   │
│  │    수석부회장 · 제2분과      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 👤 박회원                   │   │
│  │    일반회원                  │   │  ← 분과 미지정
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

#### 필터 옵션:
```
┌─────────────────────────────────────┐
│  직책 필터                          │
├─────────────────────────────────────┤
│  ○ 전체                            │
│  ○ 회장                            │
│  ○ 수석부회장                      │
│  ○ 부회장                          │
│  ○ 총무                            │
│  ○ 이사                            │
│  ○ 감사                            │
│  ○ 일반회원                        │
│  ○ 미지정                          │
└─────────────────────────────────────┘
```

### 5-2. 프로필 화면 — 직책 표시

```
┌─────────────────────────────────────┐
│                                     │
│         [프로필 사진]               │
│                                     │
│      김영등                         │  ← 큰 글씨
│      회장 · 영등포JC                │  ← 직책 + 소속JC
│      제1분과                        │  ← 소속분과
│                                     │
│  📞 010-1234-5678                  │
│  ✉️ kim@example.com                │
│                                     │
└─────────────────────────────────────┘
```

### 5-3. 관리자 — 회원 상세에서 직책 변경

```
┌─────────────────────────────────────┐
│  ← 회원 상세                        │
├─────────────────────────────────────┤
│                                     │
│  👤 김영등                          │
│                                     │
│  직책                               │
│  ┌─────────────────────────────┐   │
│  │ 회장                     ▼ │   │  ← 드롭다운
│  └─────────────────────────────┘   │
│                                     │
│  소속분과                           │
│  ┌─────────────────────────────┐   │
│  │ 제1분과                   ▼ │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         저장하기             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

- 드롭다운: `GET /api/positions` 목록에서 선택
- 저장: `PUT /api/members/:id/position` 호출

---

## 6. 비즈니스 규칙

1. **직책은 1인 1직책**: 한 회원에 하나의 직책만 지정 (복수 직책 불가)
2. **직책 정렬**: `positions.level` 내림차순 (회장 6 → 일반회원 0)
3. **신입 회원 가입 시**: 기본 직책 = "일반회원" (`position_id` = 일반회원 ID)
4. **직책 삭제 제한**: 해당 직책을 가진 회원이 있을 경우 경고 (삭제 시 해당 회원 직책 = NULL)
5. **직책명 중복 금지**: `positions.name` UNIQUE 제약
6. **jc_position 동기화**: `position_id` 변경 시 `jc_position` 텍스트도 함께 업데이트

---

## 7. 구현 우선순위

### Phase 1 — MVP

| 순서 | 작업 | 담당 | 설명 |
|------|------|------|------|
| 1 | DB 마이그레이션 (position_id + position_history) | 백엔드 | `015_user_position_id.sql` |
| 2 | GET /api/positions (직책 목록) | 백엔드 | |
| 3 | PUT /api/members/:id/position (직책 변경) | 백엔드 | jc_position 동기화 포함 |
| 4 | GET /api/members 확장 (position 필터/정렬) | 백엔드 | |
| 5 | 회원 목록 — 직책 표시 + 필터 UI | 프론트 | |
| 6 | 프로필 — 직책 표시 | 프론트 | |
| 7 | 관리자 — 회원 직책 변경 드롭다운 | 프론트 (admin) | |

### Phase 2 — 확장

| 순서 | 작업 | 담당 | 설명 |
|------|------|------|------|
| 8 | POST/PUT/DELETE /api/positions (관리자 직책 CRUD) | 백엔드 | |
| 9 | position_history 기록 로직 | 백엔드 | 직책 변경 시 자동 기록 |
| 10 | 관리자 — 직책 관리 화면 (추가/수정/삭제) | 프론트 (admin) | |
| 11 | 인물카드 — JC 이력 섹션에 직책 변동 표시 | 프론트 | member-dossier-plan.md 연동 |

---

## 8. 기존 시스템과의 관계

| 항목 | 기존 | 변경 |
|------|------|------|
| 직책 저장 | `users.jc_position` (TEXT) | `users.position_id` (FK) + jc_position 동기화 |
| 직책 목록 | `positions` 테이블 (migration 010) | 그대로 활용 |
| 직책 권한 | `position_permissions` (migration 010) | 그대로 활용 |
| 직책 표시 | 일부 화면에서만 | 회원 목록 + 프로필 + 참석 명단 등 전체 |
