# Sprint 2026-03-09: 일정/회원/프로필 기능 완성

> AI 팀 자율 작업 로그 — 2026년 3월 9일 야간 스프린트

---

## 팀 구성

| 역할 | 담당 | 설명 |
|------|------|------|
| PM/기획 | 기획자 수민 | 요구사항 분석, 태스크 정의, QA 기준 수립 |
| 프론트엔드 | 프론트 지현 | 웹앱 (web/js) UI 구현 |
| 백엔드 | 백엔드 준호 | Express API 확장, DB 쿼리 최적화 |
| QA | 테스터 은비 | 코드 리뷰, 엣지 케이스 점검, 정합성 검증 |

---

## 1. 기획자 수민의 요구사항 분석

### 1-1. 현재 상태 진단

**일정 (Schedule)**
- [x] 목록 화면 (기본)
- [x] 상세 화면 (기본)
- [x] 작성 화면 (기본)
- [ ] **수정 화면 (완전 미구현)** — 라우터에도 없음
- [ ] 카테고리 드롭다운 (현재 자유 텍스트 입력)
- [ ] 시간 선택 (현재 날짜만 선택 가능)
- [ ] 상세 화면에서 수정 버튼 없음

**회원 (Members)**
- [x] 목록 화면 + 검색
- [x] 상세 화면 (기본)
- [ ] **상세 화면에 직책/회사/부서 정보 없음** — DB에는 있으나 API가 미반환
- [ ] 전화 걸기 액션 없음
- [ ] 기수/소속 정보 없음 (와이어프레임 요구)

**프로필 (Profile)**
- [x] 내 프로필 보기
- [x] 프로필 이미지 변경
- [x] 기본 정보 수정 (이름, 연락처, 주소, 생년월일, 성별)
- [ ] **직장 정보 (회사, 직책, 부서) 표시/수정 없음**
- [ ] **비밀번호 변경 기능 없음**

### 1-2. 구현 태스크 (우선순위순)

#### [P0] 일정 수정 화면 신규 구현
- `lib/screens/schedules/schedule_edit_screen.dart` 생성
- 라우터에 `/home/schedule/:id/edit` 경로 추가
- 상세 화면에 수정 버튼 추가 (작성자/관리자만)
- 카테고리 드롭다운 (행사, 정기회의, 교육, 공휴일, 기타)
- 시간 선택기 추가

#### [P0] API 회원 상세 필드 확장
- members.js: company, position, department, work_phone 반환 추가
- profile.js: 동일 필드 반환 + 수정 지원

#### [P1] 회원 상세 UI 개선
- 직장 정보 섹션 추가 (회사, 직책, 부서, 직장 전화)
- 전화 걸기 버튼 (url_launcher 없이 선택 복사)

#### [P1] 프로필 UI 개선
- 직장 정보 표시 + 수정 폼 확장
- 비밀번호 변경 기능 (현재 비밀번호 확인 → 새 비밀번호)

#### [P2] 일정 목록/상세 개선
- 카테고리 한글 매핑
- 상세 화면에 수정 네비게이션 추가

---

## 2. 프론트 지현 작업 로그 (web/js 기반)

> **주의**: 초기에 Flutter(lib/)로 구현했으나, 프로젝트가 하이브리드 웹앱 전용이므로
> web/js 기반으로 전면 재구현함. Flutter 코드는 레거시이며 배포에 포함되지 않음.

### 2-1. 일정 모듈 전면 재작성 (web/js/schedules.js)
- 카테고리 드롭다운 (행사/정기회의/교육/공휴일/기타) — `<select>` 요소
- 카테고리별 한글 라벨 + 색상 매핑 (CATEGORY_LABELS, CATEGORY_COLORS)
- 시작/종료 날짜+시간 분리 입력 → ISO 형식으로 API 전송
- **API 필드 매핑 수정**: `event_date`/`start_time`/`end_time` → `start_date`/`end_date` (TIMESTAMPTZ)
- 상세 화면에 수정/삭제 버튼 (작성자 또는 관리자)
- 일정 작성/수정 폼 공용 `renderScheduleForm()` 함수
- 카드에 카테고리 뱃지 + 시간 표시

### 2-2. 회원 모듈 전면 재작성 (web/js/members.js)
- `loadMembersScreen()` 함수 추가 (탭 전환 시 호출)
- `showMemberDetailScreen(memberId)` — 회원 상세 화면 구현
  - 프로필 아바타, 이름, 역할 뱃지
  - 기본 정보 (이메일, 연락처+복사, 주소, 성별, 생년월일, 가입일)
  - 직장 정보 (회사, 직책, 부서, 직장 전화+복사)
- `copyToClipboard()` 유틸리티 (navigator.clipboard + fallback)
- `createMemberCard()` — 소속 정보(회사/직책) 표시

### 2-3. 프로필 모듈 전면 재작성 (web/js/profile.js)
- 프로필 표시: 기본 정보 + 직장 정보(회사/직책/부서/직장전화) 섹션
- 프로필 수정 폼: 9개 필드 (이름, 연락처, 주소, 생년월일, 성별, 회사, 직책, 부서, 직장전화)
- 비밀번호 변경: 현재 비밀번호 + 새 비밀번호 + 확인 — 6자 미만/불일치 검증
- 로그아웃 버튼 추가
- 관리자 메뉴 버튼 (admin 역할만)

### 2-4. 네비게이션 업데이트 (web/js/navigation.js)
- `/members/:id` 동적 경로 핸들러 추가

### 2-5. API 클라이언트 확장 (web/js/api-client.js)
- `changePassword()` 메서드 추가

---

## 3. 백엔드 준호 작업 로그

### 3-1. members.js 확장
- GET /api/members: company, position, department 필드 추가
- GET /api/members/search: 동일 필드 추가
- GET /api/members/:id: company, position, department, work_phone 추가

### 3-2. profile.js 확장
- GET /api/profile: company, position, department, work_phone 추가
- PUT /api/profile: company, position, department, work_phone 수정 지원

### 3-3. 비밀번호 변경 API 추가
- PUT /api/profile/password: 현재 비밀번호 확인 → bcrypt 해싱 → 업데이트

---

## 4. 테스터 은비 검증 로그

### 4-1. 코드 리뷰 결과 (web/js 재구현 기준)

**일정 관련 (web/js/schedules.js)**
- [x] 카테고리 드롭다운 5개 옵션 (`<select>`) 확인
- [x] 시작/종료 날짜+시간 분리 입력 → ISO 합성 확인
- [x] API 필드 매핑: start_date/end_date (TIMESTAMPTZ) 정상 사용
- [x] 상세 화면: 수정/삭제 버튼 권한 분기 (작성자 OR 관리자) 확인
- [x] 카테고리별 색상/한글 라벨 매핑 정상
- [x] 작성/수정 폼 공용 함수 `renderScheduleForm()` 확인

**회원 관련 (web/js/members.js)**
- [x] 회원 상세 화면: 직장 정보 섹션 (회사/직책/부서/직장전화) 확인
- [x] 전화번호 눌러서 복사 (navigator.clipboard + fallback) 확인
- [x] 카드에 소속 정보 (회사/직책) 표시 확인
- [x] 디바운싱 검색 (300ms) 정상

**프로필 관련 (web/js/profile.js)**
- [x] 직장 정보 섹션 표시 확인
- [x] 프로필 수정 폼: 9개 필드 (기본 5 + 직장 4) 확인
- [x] 비밀번호 변경: 3단계 검증 (현재/새/확인) 확인
- [x] 6자 미만 검증, 비밀번호 불일치 검증, 서버 에러 표시 확인
- [x] 로그아웃 버튼 + 확인 다이얼로그 확인
- [x] api-client.js: changePassword() 메서드 확인

**네비게이션 (web/js/navigation.js)**
- [x] `/members/:id` 동적 경로 핸들러 추가 확인

**백엔드 API**
- [x] members.js: 3개 엔드포인트 모두 company/position/department 필드 추가 확인
- [x] members.js: 검색에 company ILIKE 조건 추가 (회사명 검색 가능)
- [x] profile.js GET: 4개 직장 필드 반환 확인
- [x] profile.js PUT: 10개 파라미터 ($1~$10) 정상 매핑 확인
- [x] profile.js PUT /password: bcrypt.compare + bcrypt.hash(12) 보안 적절
- [x] profile.js PUT /password: 6자 미만 검증, 현재 비밀번호 불일치 에러 처리 확인

### 4-2. 주의 사항 / 고민한 점

1. **DB 컬럼 존재 여부**: `company`, `position`, `department`, `work_phone` 컬럼은
   `database/railway_init.sql`의 users 테이블에 이미 정의되어 있음 → DB 마이그레이션 불필요

2. **일정 카테고리 제한**: DB의 schedules 테이블 CHECK 제약조건이
   `('event', 'meeting', 'training', 'holiday', 'other')`로 정의됨 → 드롭다운 옵션과 일치

3. **비밀번호 변경 시 bcrypt 모듈**: `require('bcryptjs')`를 함수 내부에서 호출하는 방식 사용.
   이미 auth.js에서 전역 사용 중이므로 문제 없으나, 상단 require로 옮기는 것도 고려 가능

4. **프로필 수정 필수값 완화**: 기존에는 name + phone + address 모두 필수였으나,
   name만 필수로 완화함 — 신규 가입 직후 phone/address 미입력 상태에서도 수정 가능하도록

5. **되돌리기**: 이전 커밋(`8e818b7`)으로 `git revert` 또는 `git reset --hard`로 복원 가능

### 4-3. 미구현 (다음 스프린트 후보)

- [ ] 일정 캘린더 뷰 (월간 달력) — 와이어프레임에 있으나 복잡도 높아 후순위
- [ ] 회원 기수(batch) 정보 — DB 스키마에 아직 없음, 추후 설계 필요
- [ ] 프로필 학력/경력/가족 상세 조회/수정 — JSONB 구조라 별도 UI 설계 필요
- [ ] 배너 기능 — 백엔드 API 미구현

---

## 변경 파일 요약

### 웹앱 프론트엔드 (배포 대상)

| 구분 | 파일 | 변경 |
|------|------|------|
| 수정 | `web/js/schedules.js` | 전면 재작성 — 카테고리 드롭다운, 시간 입력, API 필드 수정, 수정/삭제 |
| 수정 | `web/js/members.js` | 전면 재작성 — 상세 화면, 직장 정보, 전화 복사 |
| 수정 | `web/js/profile.js` | 전면 재작성 — 직장 정보, 프로필 수정 폼, 비밀번호 변경, 로그아웃 |
| 수정 | `web/js/navigation.js` | `/members/:id` 동적 경로 추가 |
| 수정 | `web/js/api-client.js` | changePassword() 메서드 추가 |

### 백엔드 API (배포 대상)

| 구분 | 파일 | 변경 |
|------|------|------|
| 수정 | `api/routes/members.js` | 3개 엔드포인트 직장 필드 반환 |
| 수정 | `api/routes/profile.js` | 직장 필드 + 비밀번호 변경 API |

### 문서

| 구분 | 파일 | 변경 |
|------|------|------|
| 수정 | `CLAUDE.md` | Flutter 미사용 명시, 웹앱 전용 프로젝트 구조로 수정 |
| 수정 | `Docs/sprint-2026-03-09-schedule-member-profile.md` | 이 문서 (web/js 기준으로 업데이트) |

---
