# 업종 카테고리 목록 + 업종 검색 기획서

> 작성일: 2026-03-10 | 작성자: 기획자 에이전트
> 관련 요구사항: R-04 (업종 검색)
> 관련 항목: M-13
> 우선순위: Must-have (MVP 범위)

---

## 1. 기능 개요

회원의 업종/직종을 카테고리로 분류하고, 업종 기반으로 회원을 검색·필터링하는 기능.

- **목적**: "변호사 회원이 누구지?", "보험업 하는 분?" — 이름 모르는 상태에서 업종으로 탐색
- **현재 상태**: `users` 테이블에 `job_type` TEXT 필드 존재하나 미사용. 검색은 이름/이메일/전화/주소/회사명만 지원.
- **핵심**: 업종 카테고리 선택형 도입 + 검색 필터 추가

---

## 2. 업종 카테고리 목록

### 2-1. 대분류 + 소분류

JC 회원 구성 특성(중소기업 대표, 전문직, 자영업)에 맞춘 카테고리 설계.

| 대분류 코드 | 대분류 | 소분류 예시 |
|------------|--------|-------------|
| `law` | 법률/법무 | 변호사, 법무사, 변리사, 행정사 |
| `finance` | 금융/보험 | 은행, 증권, 보험, 자산관리, 세무사, 회계사 |
| `medical` | 의료/건강 | 병원, 의원, 약국, 한의원, 치과, 건강관리 |
| `construction` | 건설/부동산 | 건설업, 인테리어, 설계, 부동산, 공인중개사 |
| `it` | IT/기술 | 소프트웨어, 웹/앱, 통신, 데이터, 보안 |
| `manufacturing` | 제조/생산 | 식품제조, 기계, 전자, 화학, 섬유 |
| `food` | 요식/식음료 | 레스토랑, 카페, 배달, 프랜차이즈 |
| `retail` | 유통/판매 | 도소매, 무역, 전자상거래, 물류 |
| `service` | 서비스 | 교육, 컨설팅, 광고/마케팅, 디자인, 인력 |
| `realestate` | 부동산/임대 | 부동산개발, 임대업, 시설관리 |
| `culture` | 문화/예술 | 미디어, 엔터테인먼트, 스포츠, 여행 |
| `public` | 공공/기관 | 공기업, 공무원, 비영리, 협회 |
| `other` | 기타 | 기타 업종 (직접 입력) |

### 2-2. 직접 입력 옵션

- 카테고리 목록에 없는 업종은 "기타" 선택 + 직접 입력 가능
- 직접 입력한 업종은 `industry_detail` 필드에 저장
- 향후 자주 입력되는 업종은 카테고리에 추가

---

## 3. DB 변경사항

### 3-1. users 테이블 컬럼 추가

```sql
-- 업종 대분류 (카테고리 코드)
ALTER TABLE users ADD COLUMN industry VARCHAR(30);
-- 업종 상세 (소분류 또는 직접 입력)
ALTER TABLE users ADD COLUMN industry_detail VARCHAR(100);

-- 인덱스 (검색 성능)
CREATE INDEX idx_users_industry ON users(industry) WHERE industry IS NOT NULL;
```

### 3-2. 업종 카테고리 상수 테이블 (선택사항)

카테고리 목록을 DB 테이블로 관리하면 동적 추가/수정이 가능하다.
MVP에서는 프론트엔드 상수로 관리하고, Phase 2에서 DB 테이블로 전환 고려.

```sql
-- Phase 2 이후 도입 고려
CREATE TABLE industry_categories (
  code        VARCHAR(30) PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true
);
```

### 3-3. 기존 job_type 필드 활용

현재 `job_type` TEXT 필드가 존재하나 미사용 상태.
- **방안 A**: `job_type`을 `industry`로 rename하고 활용 → 마이그레이션 필요
- **방안 B**: `industry` 신규 컬럼 추가, `job_type`은 별도 용도로 유지
- **권장**: 방안 B — 기존 컬럼 영향 최소화

---

## 4. 화면 구성

### 4-1. 회원 가입 폼 — 업종 선택 추가

```
┌─────────────────────────────────────┐
│  직장 정보                          │
├─────────────────────────────────────┤
│  회사/사업장명                      │
│  ┌─────────────────────────────┐   │
│  │ 영등포건설(주)               │   │
│  └─────────────────────────────┘   │
│                                     │
│  직책                               │
│  ┌─────────────────────────────┐   │
│  │ 대표이사                     │   │
│  └─────────────────────────────┘   │
│                                     │
│  업종 *                             │  ← 신규 추가
│  ┌─────────────────────────────┐   │
│  │ 건설/부동산 ▼               │   │  ← 대분류 드롭다운
│  └─────────────────────────────┘   │
│                                     │
│  업종 상세                          │
│  ┌─────────────────────────────┐   │
│  │ 건설업                       │   │  ← 소분류 또는 직접 입력
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 4-2. 회원 목록 — 업종 필터

```
┌─────────────────────────────────────┐
│  회원 목록              🔍 검색     │
├─────────────────────────────────────┤
│  업종: [전체 ▼]                     │  ← 업종 필터 드롭다운
├─────────────────────────────────────┤
│  ⭐ 즐겨찾기 (3)                    │
│  ★ 김회장       회장   건설/부동산  │  ← 업종 태그 표시
│  ★ 이부회장     부회장  법률/법무   │
│  ...                                │
├─────────────────────────────────────┤
│  전체 회원 (47)                     │
│  ☆ 강회원       회원   IT/기술     │
│  ☆ 고회원       회원   금융/보험   │
│  ...                                │
└─────────────────────────────────────┘
```

### 4-3. 업종 필터 드롭다운

```
┌─────────────────┐
│  전체            │  ← 기본값 (필터 해제)
│  ─────────────  │
│  법률/법무       │
│  금융/보험       │
│  의료/건강       │
│  건설/부동산     │
│  IT/기술         │
│  제조/생산       │
│  요식/식음료     │
│  유통/판매       │
│  서비스          │
│  부동산/임대     │
│  문화/예술       │
│  공공/기관       │
│  기타            │
└─────────────────┘
```

### 4-4. 회원 카드 — 업종 표시

```
┌─────────────────────────────────────┐
│  ☆ 강회원          회원             │
│     영등포소프트(주) · 대표이사     │
│     🏷️ IT/기술                     │  ← 업종 태그
│     📞 010-1234-5678               │
└─────────────────────────────────────┘
```

- 업종 태그: 가벼운 배경색 + 작은 글씨 (칩/뱃지 스타일)
- 업종 미등록 회원: 태그 미표시

### 4-5. 회원 상세 — 업종 표시

```
┌─────────────────────────────────────┐
│  직장 정보                          │
│  회사: 영등포소프트(주)             │
│  직책: 대표이사                     │
│  업종: IT/기술 · 소프트웨어 개발    │  ← 대분류 + 상세
│  주소: 영등포구 ...                 │
└─────────────────────────────────────┘
```

### 4-6. 프로필 수정 — 업종 변경

기존 프로필 수정 화면에 업종 선택 필드 추가.

---

## 5. 검색 + 필터 동작

### 5-1. 검색과 필터 조합

| 동작 | 설명 |
|------|------|
| **텍스트 검색만** | 기존과 동일 (이름/이메일/전화/회사명으로 검색) |
| **업종 필터만** | 선택한 업종에 해당하는 회원만 표시 |
| **검색 + 필터 조합** | 텍스트 검색 결과 중 선택한 업종만 표시 (AND 조건) |

### 5-2. 업종 필터 선택 시 동작

```
1. 드롭다운에서 "IT/기술" 선택
    ↓
2. API 호출: GET /api/members?industry=it
    ↓
3. 결과 목록 갱신 (IT/기술 회원만 표시)
    ↓
4. 헤더에 "IT/기술 (8명)" 표시
    ↓
5. [전체] 선택 시 필터 해제
```

---

## 6. API 설계안

### 6-1. 회원 목록 API 확장

기존 `GET /api/members` 에 `industry` 쿼리 파라미터 추가.

```
GET /api/members?industry=it&page=1&limit=20
Response: {
  "success": true,
  "data": {
    "items": [
      {
        "id": 5,
        "name": "강회원",
        "position": "회원",
        "company": "영등포소프트(주)",
        "industry": "it",
        "industry_name": "IT/기술",
        "industry_detail": "소프트웨어 개발",
        "phone": "01012345678",
        "is_favorited": true
      },
      ...
    ],
    "total": 8,
    "page": 1,
    "totalPages": 1
  }
}
```

### 6-2. 회원 검색 API 확장

기존 `GET /api/members/search` 에 `industry` 쿼리 파라미터 추가.

```
GET /api/members/search?q=소프트&industry=it
```

- `q`와 `industry` 모두 제공 시: AND 조건
- `industry`만 제공 시: 해당 업종 전체 회원
- `q`만 제공 시: 기존 동작 유지

### 6-3. 업종 카테고리 목록 조회

```
GET /api/industries
Response: {
  "success": true,
  "data": [
    { "code": "law", "name": "법률/법무" },
    { "code": "finance", "name": "금융/보험" },
    { "code": "medical", "name": "의료/건강" },
    { "code": "construction", "name": "건설/부동산" },
    { "code": "it", "name": "IT/기술" },
    { "code": "manufacturing", "name": "제조/생산" },
    { "code": "food", "name": "요식/식음료" },
    { "code": "retail", "name": "유통/판매" },
    { "code": "service", "name": "서비스" },
    { "code": "realestate", "name": "부동산/임대" },
    { "code": "culture", "name": "문화/예술" },
    { "code": "public", "name": "공공/기관" },
    { "code": "other", "name": "기타" }
  ]
}
```

> MVP에서는 프론트엔드 상수로 관리해도 무방. API는 Phase 2 동적 관리 대비용.

### 6-4. 프로필 수정 — 업종 필드

기존 `PUT /api/profile` 또는 `PUT /api/members/:id` 에 `industry`, `industry_detail` 필드 추가.

```
PUT /api/profile
Body: {
  ...,
  "industry": "it",
  "industry_detail": "소프트웨어 개발"
}
```

### 6-5. 회원가입 — 업종 필드

기존 `POST /api/auth/register` 에 `industry`, `industry_detail` 필드 추가.

```
POST /api/auth/register
Body: {
  ...,
  "industry": "construction",
  "industry_detail": "건설업"
}
```

---

## 7. 프론트엔드 상수 정의

```javascript
// web/js/config.js 또는 constants.js에 추가

const INDUSTRY_CATEGORIES = [
  { code: 'law', name: '법률/법무', examples: '변호사, 법무사, 변리사' },
  { code: 'finance', name: '금융/보험', examples: '은행, 증권, 보험, 세무사' },
  { code: 'medical', name: '의료/건강', examples: '병원, 약국, 한의원' },
  { code: 'construction', name: '건설/부동산', examples: '건설, 인테리어, 설계' },
  { code: 'it', name: 'IT/기술', examples: '소프트웨어, 웹/앱, 통신' },
  { code: 'manufacturing', name: '제조/생산', examples: '식품, 기계, 전자' },
  { code: 'food', name: '요식/식음료', examples: '레스토랑, 카페, 프랜차이즈' },
  { code: 'retail', name: '유통/판매', examples: '도소매, 무역, 물류' },
  { code: 'service', name: '서비스', examples: '교육, 컨설팅, 광고, 디자인' },
  { code: 'realestate', name: '부동산/임대', examples: '부동산개발, 임대, 시설관리' },
  { code: 'culture', name: '문화/예술', examples: '미디어, 스포츠, 여행' },
  { code: 'public', name: '공공/기관', examples: '공기업, 비영리, 협회' },
  { code: 'other', name: '기타', examples: '' }
];
```

---

## 8. 업종 태그 스타일

```css
.industry-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #EFF6FF;
  color: #1E40AF;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* 업종별 색상 (선택사항 — 기본은 단일 색상) */
.industry-tag[data-industry="law"] { background: #FEF3C7; color: #92400E; }
.industry-tag[data-industry="medical"] { background: #D1FAE5; color: #065F46; }
.industry-tag[data-industry="it"] { background: #DBEAFE; color: #1E40AF; }
/* ... */
```

---

## 9. 유효성 검증

| 규칙 | 에러 메시지 |
|------|-------------|
| 가입 시 업종 미선택 (선택 사항) | — (필수 아님, 빈 값 허용) |
| "기타" 선택 시 상세 미입력 | "업종 상세를 입력해주세요" |
| industry_detail 100자 초과 | "업종 상세는 100자 이내로 입력해주세요" |
| 유효하지 않은 industry 코드 | 400 에러 ("유효하지 않은 업종 코드입니다") |

---

## 10. 유저 플로우

### 10-1. 업종 등록 플로우

```
회원가입 또는 프로필 수정
    ↓
[업종] 드롭다운 클릭
    ↓
카테고리 목록에서 선택 (예: "건설/부동산")
    ↓
[업종 상세] 입력 (예: "건설업") — 선택사항
    ↓
저장 → DB에 industry='construction', industry_detail='건설업' 저장
```

### 10-2. 업종 검색 플로우

```
회원 목록 화면
    ↓
[업종 필터] 드롭다운 클릭
    ↓
"IT/기술" 선택
    ↓
API: GET /api/members?industry=it
    ↓
IT/기술 업종 회원만 목록에 표시
    ↓
(선택) 검색창에 "소프트" 입력 → AND 조건 적용
    ↓
API: GET /api/members/search?q=소프트&industry=it
    ↓
IT/기술 업종 중 "소프트" 매칭 회원 표시
```

---

## 11. 프론트엔드 구현 가이드

### 수정 대상 파일

| 파일 | 수정 내용 |
|------|-----------|
| `web/js/members.js` | 업종 필터 드롭다운 추가, 회원 카드에 업종 태그, 검색 API 파라미터 확장 |
| `web/js/signup.js` | 가입 폼에 업종 드롭다운 + 상세 입력 필드 추가 |
| `web/js/profile.js` | 프로필 수정에 업종 변경 필드 추가 |
| `web/js/config.js` | `INDUSTRY_CATEGORIES` 상수 추가 |
| `web/styles/main.css` | 업종 태그 스타일, 필터 드롭다운 스타일 |

---

## 12. 마이그레이션 계획

### 12-1. 기존 회원 업종 데이터

- 기존 회원들은 `industry = NULL` 상태
- **프로필 수정 시** 업종 선택 유도 (상단에 "업종을 등록해주세요" 안내 표시)
- 관리자 웹에서 일괄 업종 지정 기능 (Phase 2)

### 12-2. SQL 마이그레이션

```sql
-- migration: add_industry_columns.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry_detail VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_users_industry ON users(industry) WHERE industry IS NOT NULL;
```

---

## 13. 향후 확장 가능성

- **업종별 통계**: 관리자 대시보드에서 업종 분포 차트
- **업종 카테고리 동적 관리**: 관리자 웹에서 카테고리 추가/수정/삭제
- **교차 검색 (Phase 3)**: 전국 로컬JC 회원 업종 검색
- **사업 PR 연계 (R-06)**: 업종 + 사업 PR 정보 결합 검색
