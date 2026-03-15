# 프론트엔드 작업 로그

## 2026-03-15 — 인물카드 + 회원 테이블 개선 3건

### 작업 1: 인물카드 취미/특기 분리
- 기존 '취미/특기' 하나의 textarea → '취미'와 '특기' 별도 textarea로 분리
- 취미 → `hobbies` 필드, 특기 → `specialties` 필드 (각각 별도 컬럼)
- specialties가 JSON 배열(수동 JC이력)인 경우 빈 문자열로 표시 처리
- `saveDossierHobbies()` → hobbies + specialties 동시 저장

### 작업 2: 회원 테이블 컬럼 순서 변경
- **변경 전**: 회원(아바타+이름) / 이메일 / 전화번호 / 직책 / 상태 / 역할 / 가입일 / 관리
- **변경 후**: 사진 / 이름 / JC직책 / 가입일 / 전화번호 / 이메일 / 직업 / 관리
- JC직책: `position_name` (positions 테이블 JOIN, 회장/부회장/감사/이사)
- 직업: `profession` 필드 (변호사, 한의사, 개발자, PD 등)
- 기존 `users.position` (직장 직위) 컬럼 테이블에서 제거
- 스켈레톤 컬럼 수 7→8

### 작업 3: 인물카드 기본정보 직종/직위/JC직책 구분
- 기본정보 탭 '직장 정보' → '직업 / 직장 정보'로 변경
- 필드 구분:
  - **직종(직업)**: `profession` — 인라인 편집 가능 (변호사, 한의사, 개발자 등)
  - **JC 직책**: `position_name` (positions 테이블, 회장/부회장/감사 등, 읽기 전용)
  - **직장 직위**: `position` (수석개발자, 실장, 대표이사 등, 읽기 전용)
- `dossierEditableField()` 헬퍼 함수 추가 — 인라인 입력+저장 버튼
- `saveDossierInlineField()` — PUT /api/admin/members/:id로 필드 업데이트

### 기타
- 캐시 버스팅: `v=20260315` → `v=20260315b`

### 수정된 파일
- `web/admin/js/member-dossier.js` — 취미/특기 분리, 기본정보 직종/직위/JC직책 구분
- `web/admin/js/members.js` — 테이블 컬럼 순서 변경
- `web/admin/index.html` — 캐시 버스팅 버전 업
