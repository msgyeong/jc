# 회원 상세 프로필 — 인물카드 기획서 ★핵심★

> 작성일: 2026-03-14 | 작성자: 기획자 에이전트
> 우선순위: Must-have (CEO 핵심 요구사항)

---

## 1. 기능 개요 및 비전

**CEO 비전**: "국정원에서 프로필 띄워놓는 것처럼" 한 눈에 인물 정보를 파악할 수 있는 상세 카드

- **목적**: 회원의 개인정보, JC 활동 이력, 직업 경력, 가족 현황 등을 한 화면에서 종합적으로 파악
- **대상**: 모든 승인 회원 (열람), 관리자 + 본인 (편집)
- **핵심 원칙**: 상단에 핵심 정보를 크게 표시하고, 하단에 세부 정보를 아코디언으로 구성

---

## 2. 와이어프레임

### 2-1. 인물카드 전체 레이아웃

```
┌─────────────────────────────────────────┐
│  ← 회원 상세                   [✏️ 편집]│  ← 본인/관리자만 편집 버튼
├─────────────────────────────────────────┤
│                                         │
│  ┌──────┐  김영등                       │  ← 이름 (큰 글씨, 24px bold)
│  │      │  회장 · 영등포JC              │  ← 직책 · 소속JC
│  │ 사진 │  제1분과                      │  ← 소속분과
│  │      │                              │
│  │      │  📞 010-1234-5678            │  ← 연락처 (탭하면 전화)
│  └──────┘  ✉️ kim@example.com          │  ← 이메일 (탭하면 메일)
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [기본정보] [JC이력] [교육] [활동]       │  ← 탭 바
│  [경력] [가족] [취미] [메모]             │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ※ 선택된 탭의 내용이 아래에 표시       │
│                                         │
└─────────────────────────────────────────┘
```

### 2-2. 상단 프로필 카드 상세

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌──────────┐                          │
│  │          │  김영등                   │  font-size: 24px, bold
│  │  프로필  │  ─────────────────────── │
│  │  사진    │  회장                     │  직책 배지 (primary 색상)
│  │ (120x120)│  영등포JC · 제1분과      │  소속 정보
│  │          │                          │
│  └──────────┘  📞 010-1234-5678       │  클릭 → tel: 링크
│                ✉️ kim@example.com      │  클릭 → mailto: 링크
│                🏢 (주)영등포상사 대표   │  회사 + 직위
│                                         │
└─────────────────────────────────────────┘
```

### 2-3. 탭별 콘텐츠

#### 탭 1: 기본 정보

```
┌─────────────────────────────────────────┐
│  기본 정보                              │
├─────────────────────────────────────────┤
│                                         │
│  생년월일     1985.03.15 (만 41세)      │
│  성별        남                         │
│  주소        서울시 영등포구 여의도동     │
│              여의도아파트 101동 1201호    │
│  직업        (주)영등포상사              │
│              대표이사                    │
│              제조업 > 식품가공            │  ← 업종
│  연락처      010-1234-5678              │
│              (직장) 02-123-4567         │
│  이메일      kim@example.com            │
│  긴급연락처  이영등 (배우자) 010-5678-..│
│                                         │
└─────────────────────────────────────────┘
```

#### 탭 2: JC 이력

```
┌─────────────────────────────────────────┐
│  JC 이력                                │
├─────────────────────────────────────────┤
│                                         │
│  입회일       2020.01.15                │
│  회원번호     YDP-2020-015              │
│  현재 직책    회장                      │
│  소속분과     제1분과                    │
│  특우회 여부  ✅ 해당                   │
│                                         │
│  ─── 직책 변동 이력 ──────────────────  │
│                                         │
│  2025.01 ~ 현재     회장               │
│  2024.01 ~ 2024.12  부회장             │
│  2022.01 ~ 2023.12  이사               │
│  2020.01 ~ 2021.12  일반회원           │
│                                         │
│  ─── 소속분과 이력 ──────────────────  │  (Phase 2)
│                                         │
│  2023.01 ~ 현재     제1분과            │
│  2020.01 ~ 2022.12  제3분과            │
│                                         │
└─────────────────────────────────────────┘
```

#### 탭 3: 교육 이수 현황

```
┌─────────────────────────────────────────┐
│  교육 이수 현황                  [+ 추가]│  ← 관리자만
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ ✅ JCI 리더십 아카데미           │  │
│  │    2025.06.15 · 수료             │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ ✅ 신입회원 OT                   │  │
│  │    2020.02.10 · 수료             │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ ❌ JC 회계 교육                  │  │
│  │    2025.09.20 · 미수료           │  │
│  └──────────────────────────────────┘  │
│                                         │
│  교육이 없습니다. (빈 상태)            │
│                                         │
└─────────────────────────────────────────┘
```

#### 탭 4: 활동 현황

```
┌─────────────────────────────────────────┐
│  활동 현황                       [+ 추가]│
├─────────────────────────────────────────┤
│                                         │
│  ─── 행사 참석 이력 ─────────────────  │
│                                         │
│  2026.03  3월 정기 이사회     ✅ 참석  │
│  2026.02  2월 정기 이사회     ✅ 참석  │
│  2026.01  1월 정기 이사회     ❌ 불참  │
│  2025.12  송년회              ✅ 참석  │
│  ...                                    │
│                                         │
│  ─── 봉사활동 ───────────────────────  │
│                                         │
│  2025.11.15  지역 봉사활동 참여         │
│  2025.06.20  환경 정화 캠페인           │
│                                         │
│  ─── 위원회 활동 ────────────────────  │
│                                         │
│  2025.01 ~ 현재  기획위원회 위원        │
│                                         │
│  참석률: 85% (17/20)                   │  ← 통계 요약
│                                         │
└─────────────────────────────────────────┘
```

#### 탭 5: 직업 경력

```
┌─────────────────────────────────────────┐
│  직업 경력                       [+ 추가]│
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ (주)영등포상사                    │  │
│  │ 대표이사                         │  │
│  │ 2015.03 ~ 현재 (11년)           │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ (주)서울식품                     │  │
│  │ 이사                            │  │
│  │ 2010.01 ~ 2015.02 (5년)         │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

#### 탭 6: 가족 현황

```
┌─────────────────────────────────────────┐
│  가족 현황                       [+ 추가]│
├─────────────────────────────────────────┤
│                                         │
│  배우자   이영등     1987년생           │
│  자녀     김하늘     2015년생 (만 11세) │
│  자녀     김바다     2018년생 (만 8세)  │
│                                         │
└─────────────────────────────────────────┘
```

#### 탭 7: 취미/특기

```
┌─────────────────────────────────────────┐
│  취미/특기                              │
├─────────────────────────────────────────┤
│                                         │
│  취미     골프, 등산, 독서              │
│  특기     요리, 영어 회화               │
│                                         │
└─────────────────────────────────────────┘
```

#### 탭 8: 메모 (관리자 전용)

```
┌─────────────────────────────────────────┐
│  🔒 관리자 메모                  [편집]  │
├─────────────────────────────────────────┤
│                                         │
│  2026.01.15 - 회비 3개월 미납 상태      │
│  2025.09.01 - 해외 출장으로 3분기       │
│               활동 불참 예정            │
│                                         │
└─────────────────────────────────────────┘
```

- 관리자만 열람/편집 가능
- 본인에게는 이 탭 자체가 보이지 않음

---

## 3. DB 스키마

### 3-1. 기존 users 테이블 활용 가능 필드

users 테이블에 이미 존재하는 필드:

| 필드 | 용도 | 상태 |
|------|------|------|
| `name`, `email`, `phone` | 기본 연락처 | ✅ 기존 |
| `birth_date`, `gender`, `address` | 기본 정보 | ✅ 기존 |
| `address_detail`, `postal_code` | 상세 주소 | ✅ 기존 |
| `company_name`, `company_position` | 현재 직장 | ✅ 기존 |
| `company_address`, `job_type` | 직장 정보 | ✅ 기존 |
| `industry`, `industry_detail` | 업종 | ✅ 기존 |
| `work_phone` | 직장 전화 | ✅ 기존 |
| `hobby`, `hobbies` | 취미 | ✅ 기존 (중복 — hobby 사용) |
| `specialty`, `special_notes` | 특기/특이사항 | ✅ 기존 |
| `jc_position`, `position_id` | 직책 | ✅ 기존 + 015 확장 |
| `jc_affiliation` | 소속 JC | ✅ 기존 |
| `department` | 소속분과 | ✅ 기존 |
| `member_number` | 회원번호 | ✅ 기존 |
| `joined_at` | 입회일 | ✅ 기존 |
| `is_special_member` | 특우회 여부 | ✅ 기존 |
| `profile_image` | 프로필 사진 | ✅ 기존 |
| `educations` | 교육 이력 (JSONB) | ✅ 기존 |
| `careers` | 경력 (JSONB) | ✅ 기존 |
| `families` | 가족 (JSONB) | ✅ 기존 |
| `emergency_contact`, `emergency_contact_name`, `emergency_relationship` | 긴급연락처 | ✅ 기존 |

### 3-2. users 테이블 추가 필드

```sql
-- 관리자 전용 메모
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin_memo TEXT;
```

### 3-3. 기존 JSONB 필드 구조 정의

> users 테이블의 `educations`, `careers`, `families`는 JSONB 배열로 이미 존재.
> 구조를 정의하여 일관성 유지.

#### educations JSONB 구조:
```json
[
  {
    "title": "JCI 리더십 아카데미",
    "date": "2025-06-15",
    "completed": true,
    "description": "리더십 과정 수료"
  }
]
```

#### careers JSONB 구조:
```json
[
  {
    "company": "(주)영등포상사",
    "position": "대표이사",
    "start_date": "2015-03",
    "end_date": null,
    "description": ""
  }
]
```

#### families JSONB 구조:
```json
[
  {
    "relationship": "배우자",
    "name": "이영등",
    "birth_year": 1987
  },
  {
    "relationship": "자녀",
    "name": "김하늘",
    "birth_year": 2015
  }
]
```

### 3-4. member_activities 테이블 (신규)

> 행사 참석은 `schedule_attendance`에서 조회 가능하지만,
> 봉사활동/위원회 등 수동 기록이 필요한 활동은 별도 테이블.

```sql
CREATE TABLE member_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('volunteer', 'committee', 'award', 'other')),
  title VARCHAR(200) NOT NULL,
  date DATE,
  end_date DATE,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_member_activities_user ON member_activities(user_id);
```

### 3-5. 마이그레이션 파일

파일: `database/migrations/016_member_dossier.sql`

```sql
-- 016: 회원 인물카드 확장

-- 1. 관리자 메모 컬럼 추가
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin_memo TEXT;

-- 2. 활동 이력 테이블
CREATE TABLE IF NOT EXISTS member_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('volunteer', 'committee', 'award', 'other')),
  title VARCHAR(200) NOT NULL,
  date DATE,
  end_date DATE,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_activities_user ON member_activities(user_id);
```

---

## 4. API 엔드포인트 설계

### 4-1. 인물카드 전체 조회 (통합)

```
GET /api/members/:id/dossier
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "profile": {
      "id": 1,
      "name": "김영등",
      "profile_image": "https://...",
      "email": "kim@example.com",
      "phone": "010-1234-5678",
      "position": { "id": 1, "name": "회장", "level": 6 },
      "jc_affiliation": "영등포JC",
      "department": "제1분과"
    },
    "basic_info": {
      "birth_date": "1985-03-15",
      "gender": "male",
      "address": "서울시 영등포구 여의도동",
      "address_detail": "여의도아파트 101동 1201호",
      "postal_code": "07241",
      "company_name": "(주)영등포상사",
      "company_position": "대표이사",
      "industry": "제조업",
      "industry_detail": "식품가공",
      "work_phone": "02-123-4567",
      "emergency_contact": "010-5678-1234",
      "emergency_contact_name": "이영등",
      "emergency_relationship": "배우자"
    },
    "jc_history": {
      "joined_at": "2020-01-15",
      "member_number": "YDP-2020-015",
      "is_special_member": true,
      "position_history": [
        { "position_name": "회장", "started_at": "2025-01", "ended_at": null },
        { "position_name": "부회장", "started_at": "2024-01", "ended_at": "2024-12" }
      ]
    },
    "educations": [
      { "title": "JCI 리더십 아카데미", "date": "2025-06-15", "completed": true }
    ],
    "activities": {
      "attendance_summary": {
        "total_schedules": 20,
        "attended": 17,
        "rate": 85
      },
      "manual_activities": [
        { "id": 1, "activity_type": "volunteer", "title": "지역 봉사활동", "date": "2025-11-15" }
      ]
    },
    "careers": [
      { "company": "(주)영등포상사", "position": "대표이사", "start_date": "2015-03", "end_date": null }
    ],
    "families": [
      { "relationship": "배우자", "name": "이영등", "birth_year": 1987 }
    ],
    "hobbies_specialties": {
      "hobby": "골프, 등산, 독서",
      "specialty": "요리, 영어 회화"
    },
    "admin_memo": "2026.01.15 - 회비 3개월 미납"  // 관리자에게만 포함
  }
}
```

**권한별 응답 차이**:
- **본인**: 전체 정보 (admin_memo 제외)
- **일반 회원**: 기본 프로필 + 공개 정보 (주소/가족 상세 제외)
- **관리자**: 전체 정보 (admin_memo 포함)

### 4-2. 교육 CRUD

```
POST /api/members/:id/educations
Body: { "title": "JCI 교육", "date": "2025-06-15", "completed": true }

PUT /api/members/:id/educations/:index
Body: { "title": "수정된 교육명", "completed": false }

DELETE /api/members/:id/educations/:index
```

> JSONB 배열 업데이트 (인덱스 기반)

### 4-3. 경력 CRUD

```
POST /api/members/:id/careers
Body: { "company": "회사명", "position": "직위", "start_date": "2020-01", "end_date": null }

PUT /api/members/:id/careers/:index
DELETE /api/members/:id/careers/:index
```

### 4-4. 가족 CRUD

```
POST /api/members/:id/families
Body: { "relationship": "배우자", "name": "이름", "birth_year": 1987 }

PUT /api/members/:id/families/:index
DELETE /api/members/:id/families/:index
```

### 4-5. 활동 CRUD

```
POST /api/members/:id/activities
Body: {
  "activity_type": "volunteer",
  "title": "지역 봉사활동",
  "date": "2025-11-15",
  "description": "설명"
}

PUT /api/members/:id/activities/:activityId
DELETE /api/members/:id/activities/:activityId
```

> 활동은 별도 테이블(member_activities)이므로 ID 기반 CRUD

### 4-6. 관리자 메모

```
PUT /api/members/:id/admin-memo
Headers: Authorization: Bearer <admin-token>
Body: { "memo": "회비 미납 3개월" }
Response: { "success": true }
```

### 4-7. 참석 이력 조회 (통계용)

```
GET /api/members/:id/attendance-history?year=2026
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "total": 20,
    "attended": 17,
    "not_attended": 3,
    "rate": 85,
    "history": [
      { "schedule_id": 15, "title": "3월 정기 이사회", "date": "2026-03-15", "status": "attending" },
      ...
    ]
  }
}
```

> `schedule_attendance` + `schedules` JOIN으로 조회

### 4-8. API 권한 정리

| API | 본인 | 일반 회원 | 관리자 |
|-----|------|----------|--------|
| GET /dossier | ✅ 전체 (메모 제외) | ✅ 공개 정보만 | ✅ 전체 |
| POST/PUT/DELETE educations | ❌ | ❌ | ✅ |
| POST/PUT/DELETE careers | ✅ | ❌ | ✅ |
| POST/PUT/DELETE families | ✅ | ❌ | ✅ |
| POST/PUT/DELETE activities | ❌ | ❌ | ✅ |
| PUT admin-memo | ❌ | ❌ | ✅ |
| GET attendance-history | ✅ | ❌ | ✅ |

---

## 5. 회원가입 시 수집 vs 나중에 추가하는 정보

### 5-1. 회원가입 시 수집 (필수/선택)

| 필드 | 필수/선택 | 입력 주체 |
|------|----------|----------|
| 이름 | 필수 | 본인 |
| 이메일 | 필수 | 본인 |
| 비밀번호 | 필수 | 본인 |
| 전화번호 | 필수 | 본인 |
| 생년월일 | 필수 | 본인 |
| 성별 | 필수 | 본인 |
| 주소 | 선택 | 본인 |
| 회사명/직위 | 선택 | 본인 |
| 추천인 | 선택 | 본인 |

### 5-2. 가입 승인 후 관리자가 입력

| 필드 | 입력 주체 |
|------|----------|
| 직책 (position_id) | 관리자 |
| 소속분과 (department) | 관리자 |
| 회원번호 (member_number) | 관리자 |
| 입회일 (joined_at) | 관리자 |
| 소속JC (jc_affiliation) | 관리자 |
| 특우회 여부 (is_special_member) | 관리자 |
| 교육 이수 내역 | 관리자 |
| 활동 이력 (수동) | 관리자 |
| 관리자 메모 | 관리자 |

### 5-3. 본인이 나중에 추가/수정 가능

| 필드 | 비고 |
|------|------|
| 프로필 사진 | 프로필 편집 |
| 주소 상세 | 프로필 편집 |
| 직업 경력 | 인물카드 경력 탭 |
| 가족 현황 | 인물카드 가족 탭 |
| 취미/특기 | 인물카드 취미 탭 |
| 긴급 연락처 | 프로필 편집 |

---

## 6. 일반 회원에게 공개되는 정보 범위

개인정보 보호를 위해 일반 회원이 다른 회원의 인물카드에서 볼 수 있는 정보를 제한:

### 6-1. 공개 정보 (모든 회원에게 표시)

- 이름, 프로필 사진
- 직책, 소속JC, 소속분과
- 전화번호, 이메일
- 회사명, 직위
- 취미/특기

### 6-2. 제한 정보 (본인 + 관리자만)

- 생년월일 (나이만 표시 가능)
- 상세 주소
- 가족 현황 상세
- 긴급 연락처
- 참석 이력/통계

### 6-3. 관리자 전용

- 관리자 메모
- 교육 이수 편집
- 활동 이력 편집
- 회원 상태 변경

---

## 7. 프론트엔드 구현 가이드

### 7-1. 파일 구조

```
web/js/
├── member-dossier.js     # 인물카드 화면 (신규)
└── members.js            # 기존 회원 목록 (인물카드 진입점)
```

### 7-2. 진입 경로

```
회원 목록 → 회원 카드 클릭 → 인물카드(member-dossier) 화면
프로필 탭 → 내 인물카드 보기 (본인용)
```

### 7-3. 탭 구현 방식

- 탭 바: 가로 스크롤 가능 (8개 탭이 화면 폭 초과 시)
- 콘텐츠: 탭 전환 시 API 재호출 없이 캐시된 dossier 데이터 사용
- 편집 모드: [편집] 버튼 클릭 → 인라인 편집 또는 모달 폼

### 7-4. 프로필 사진

- 기본: 이름 이니셜 아바타 (예: "김" → 원형 배경에 "김")
- 업로드: 프로필 편집에서 사진 업로드 (Cloudinary 연동 — 추후)
- 크기: 120x120px, border-radius: 50%

---

## 8. 비즈니스 규칙

1. **본인 편집 가능 항목**: 기본 연락처, 경력, 가족, 취미/특기, 프로필 사진
2. **관리자만 편집 가능**: 직책, 교육 이수, 활동 이력, 관리자 메모, 회원번호
3. **일반 회원 열람 제한**: 상세 주소, 가족 상세, 참석 통계 비공개
4. **JSONB 필드 업데이트**: 배열 인덱스 기반 (추가/수정/삭제)
5. **참석 이력**: `schedule_attendance` 테이블에서 자동 집계 (별도 입력 불필요)
6. **직책 이력**: `position_history` 테이블에서 조회 (Phase 2)

---

## 9. 구현 우선순위

### Phase 1 — MVP

| 순서 | 작업 | 담당 | 설명 |
|------|------|------|------|
| 1 | DB 마이그레이션 (admin_memo + member_activities) | 백엔드 | `016_member_dossier.sql` |
| 2 | GET /api/members/:id/dossier (통합 조회) | 백엔드 | 권한별 응답 분기 |
| 3 | JSONB CRUD API (educations, careers, families) | 백엔드 | |
| 4 | PUT /api/members/:id/admin-memo | 백엔드 | |
| 5 | 인물카드 상단 프로필 UI | 프론트 | 사진 + 이름 + 직책 + 연락처 |
| 6 | 기본 정보 탭 UI | 프론트 | |
| 7 | 경력 탭 UI (CRUD) | 프론트 | 본인 + 관리자 편집 |
| 8 | 가족 탭 UI (CRUD) | 프론트 | 본인 + 관리자 편집 |
| 9 | 취미/특기 탭 UI | 프론트 | |
| 10 | 관리자 메모 탭 UI | 프론트 | 관리자만 표시 |

### Phase 2 — 확장

| 순서 | 작업 | 담당 | 설명 |
|------|------|------|------|
| 11 | 교육 이수 탭 UI (관리자 CRUD) | 프론트 | |
| 12 | 활동 CRUD API + UI | 백엔드+프론트 | member_activities |
| 13 | JC 이력 탭 (직책 변동 이력) | 프론트 | position_history 연동 |
| 14 | 참석 이력 + 통계 | 백엔드+프론트 | schedule_attendance 집계 |
| 15 | 회원 목록 → 인물카드 전환 네비게이션 | 프론트 | |
| 16 | 프로필 사진 업로드 (Cloudinary) | 백엔드+프론트 | |
