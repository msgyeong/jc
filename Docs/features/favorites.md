# 즐겨찾기 기능 기획서

> 작성일: 2026-03-10 | 작성자: 기획자 에이전트
> 관련 요구사항: R-09 (즐겨찾기 기능)
> 우선순위: Must-have (MVP 범위)

---

## 1. 기능 개요

자주 연락하는 회원을 즐겨찾기에 등록하여 빠르게 접근하는 기능.

- 별표(★) 아이콘 토글로 즐겨찾기 등록/해제
- 회원 목록 상단에 즐겨찾기 회원 우선 표시
- 즐겨찾기 데이터는 **개인별** (다른 회원에게 노출되지 않음)

---

## 2. 사용자 흐름

### 2-1. 즐겨찾기 등록

```
회원 목록 또는 회원 상세
    ↓
별표(☆) 아이콘 클릭
    ↓
즉시 ★로 변경 + API 호출 (낙관적 업데이트)
    ↓
회원 목록 새로고침 시 상단에 표시
```

### 2-2. 즐겨찾기 해제

```
★ 아이콘 클릭
    ↓
즉시 ☆로 변경 + API 호출
    ↓
목록에서 즐겨찾기 영역에서 제거
```

---

## 3. UI 설계

### 3-1. 회원 목록 화면

```
┌─────────────────────────────────────┐
│  회원 목록              🔍 검색     │
├─────────────────────────────────────┤
│  ⭐ 즐겨찾기 (3)                    │  ← 즐겨찾기 섹션 헤더
├─────────────────────────────────────┤
│  ★ 김회장       회장    📞 010-... │
│  ★ 이부회장     부회장  📞 010-... │
│  ★ 박이사       이사    📞 010-... │
├─────────────────────────────────────┤
│  전체 회원 (47)                     │  ← 전체 회원 섹션 헤더
├─────────────────────────────────────┤
│  ☆ 강회원       회원    📞 010-... │
│  ☆ 고회원       회원    📞 010-... │
│  ☆ 구회원       회원                │
│  ...                                │
└─────────────────────────────────────┘
```

- **즐겨찾기 섹션**: 목록 최상단에 별도 영역으로 표시
- **즐겨찾기 0명**: 즐겨찾기 섹션 헤더 미표시 (전체 회원만 표시)
- **별표 위치**: 회원 카드 좌측 또는 우측

### 3-2. 회원 상세 화면

```
┌─────────────────────────────────────┐
│  ← 뒤로       김회장          ★    │  ← 우상단 별표 아이콘
├─────────────────────────────────────┤
│  프로필 정보...                     │
└─────────────────────────────────────┘
```

- 회원 상세 상단 우측에 별표 아이콘
- 클릭 시 토글 (★ ↔ ☆)

### 3-3. 별표 아이콘 스타일

| 상태 | 아이콘 | 색상 |
|------|--------|------|
| 즐겨찾기 등록 | ★ (filled) | `#F59E0B` (Accent amber) |
| 즐겨찾기 해제 | ☆ (outline) | `#D1D5DB` (gray-300) |

---

## 4. API 설계안

### 4-1. 즐겨찾기 등록

```
POST /api/members/:memberId/favorite
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": { "member_id": 5, "created_at": "2026-03-10T..." }
}
```

### 4-2. 즐겨찾기 해제

```
DELETE /api/members/:memberId/favorite
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": null
}
```

### 4-3. 즐겨찾기 목록 조회

```
GET /api/members/favorites
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "items": [
      { "id": 5, "name": "김회장", "position": "회장", "company": "영등포건설", "phone": "01012345678", "favorited_at": "..." },
      ...
    ],
    "total": 3
  }
}
```

### 4-4. 회원 목록 API 확장

기존 `GET /api/members` 응답에 `is_favorited` 필드 추가:

```json
{
  "id": 5,
  "name": "김회장",
  "position": "회장",
  "is_favorited": true
}
```

---

## 5. DB 테이블 설계안

```sql
CREATE TABLE favorites (
  id              SERIAL PRIMARY KEY,
  member_id       INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                  -- 즐겨찾기를 한 회원 (로그인 사용자)
  target_member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
                  -- 즐겨찾기된 회원
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(member_id, target_member_id)
);

CREATE INDEX idx_favorites_member ON favorites(member_id);
```

**참고**: 컬럼명은 `member_id` 사용 (프로젝트 컨벤션 — likes 테이블과 동일)

---

## 6. 비즈니스 규칙

1. **본인 즐겨찾기 불가**: `member_id = target_member_id` → 400 에러
2. **중복 등록 방지**: UNIQUE 제약으로 중복 INSERT 시 409 에러
3. **탈퇴 회원 처리**: 대상 회원 탈퇴 시 CASCADE 삭제
4. **개인 데이터**: 즐겨찾기 정보는 본인만 조회 가능 (API에서 토큰 기반 필터)
5. **즐겨찾기 상한**: 제한 없음 (전체 회원 50~100명 규모)

---

## 7. 구현 범위

| 항목 | 담당 | 난이도 |
|------|------|--------|
| favorites 테이블 생성 마이그레이션 | 백엔드 | 낮음 |
| 즐겨찾기 등록/해제 API | 백엔드 | 낮음 |
| 즐겨찾기 목록 조회 API | 백엔드 | 낮음 |
| 회원 목록 API에 is_favorited 추가 | 백엔드 | 낮음 |
| 회원 목록 즐겨찾기 섹션 UI | 프론트엔드 | 중간 |
| 별표 토글 UI + 낙관적 업데이트 | 프론트엔드 | 중간 |
| 회원 상세 별표 아이콘 | 프론트엔드 | 낮음 |
