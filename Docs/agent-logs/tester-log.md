# 테스터 에이전트 작업 이력

> 세션이 끊겨도 이 파일을 읽으면 이전 테스트 상태를 파악하고 이어서 작업할 수 있습니다.

---

## 세션 1: 2026-03-09 (전체 기능 테스트)

### 작업 요약
- **시작**: 사장님이 "심각한 버그 확인" → 전체 기능 테스트 지시
- **범위**: API 전수 점검 (65개 엔드포인트), 화면별 기능 점검, 버그 리포트 작성
- **로그인 계정**: admin@jc.com / admin1234 (super_admin)

### 발견된 버그 (총 7건)

| # | 버그 | 심각도 | 최종 상태 |
|---|------|--------|-----------|
| BUG-001 | GET /api/schedules/:id → 500 에러 | CRITICAL | 수정 완료 |
| BUG-002 | GET/POST /api/posts/:id/comments → 500 에러 | CRITICAL | 수정 완료 |
| BUG-003 | 홈 화면 schedule.event_date → start_date 불일치 | HIGH | 수정 완료 |
| BUG-004 | POST /api/auth/reset-password → 404 (정상 회원도 실패) | HIGH | 수정 완료 |
| BUG-005 | GET /api (슬래시 없이) → 301 리다이렉트 | MEDIUM | 수정 완료 |
| BUG-006 | DB 스키마-API 코드 불일치 (comments.parent_id vs parent_comment_id 등) | MEDIUM | 수정 완료 |
| NEW-BUG-001 | POST /api/posts/:id/like → 500 (BUG-006 수정 시 회귀) | CRITICAL | 수정 완료 |

### 최종 테스트 결과: 32/32 (100%)

```
PASS | 01 health              (GET /health)
PASS | 02 api-info             (GET /api)
PASS | 03 login                (POST /api/auth/login)
PASS | 04 auth-me              (GET /api/auth/me)
PASS | 05 reset-pw-kim         (POST /api/auth/reset-password - kim.yh)
PASS | 06 reset-pw-lee         (POST /api/auth/reset-password - lee.jy)
PASS | 07 logout               (POST /api/auth/logout)
PASS | 08 posts-list           (GET /api/posts)
PASS | 09 posts-notice         (GET /api/posts?category=notice)
PASS | 10 post-detail          (GET /api/posts/1)
PASS | 11 post-create          (POST /api/posts)
PASS | 12 post-update          (PUT /api/posts/1)
PASS | 13 like-on              (POST /api/posts/1/like)
PASS | 14 like-off             (POST /api/posts/1/like)
PASS | 15 comments-list        (GET /api/posts/1/comments)
PASS | 16 comment-create       (POST /api/posts/1/comments)
PASS | 17 comments-post3       (GET /api/posts/3/comments)
PASS | 18 notices-list         (GET /api/notices)
PASS | 19 notice-detail        (GET /api/notices/1)
PASS | 20 attendance           (GET /api/notices/1/attendance)
PASS | 21 schedules-list       (GET /api/schedules)
PASS | 22 schedules-month      (GET /api/schedules?year=2026&month=3)
PASS | 23 schedule-detail      (GET /api/schedules/1)
PASS | 24 schedule-create      (POST /api/schedules)
PASS | 25 members-list         (GET /api/members)
PASS | 26 members-search       (GET /api/members/search)
PASS | 27 member-detail        (GET /api/members/1)
PASS | 28 profile              (GET /api/profile)
PASS | 29 profile-update       (PUT /api/profile)
PASS | 30 admin-stats          (GET /api/admin/stats)
PASS | 31 admin-roles          (GET /api/admin/roles)
PASS | 32 auth-block           (인증 없는 요청 → 401)
```

### 비밀번호 재설정 상세 (4명 전원 PASS)

| 회원 | 이메일 | 결과 |
|------|--------|------|
| 김영호 | kim.yh@yjc-test.kr | PASS |
| 이준영 | lee.jy@yjc-test.kr | PASS |
| 경민수 | minsu@jc.com | PASS |
| 박성민 | park.sm@yjc-test.kr | PASS |

### 테스트 환경 주의사항

- **Windows curl은 한글 UTF-8 인코딩 문제가 있음**: curl로 한글 이름/내용을 보내면 서버에서 인코딩 깨짐 발생
- **해결책**: 한글이 포함된 API 테스트는 **python3 urllib**을 사용해야 정확한 결과를 얻음
- 테스트 스크립트 예시는 이 세션 대화 내역에 있음

### 현재 데이터 상태

- 회원: 34명 (admin 1 + 수동가입 3 + seed 30)
- 게시글: 3건 (ID 1, 2, 3)
- 공지사항: 1건 (ID 1)
- 일정: 12건 (ID 1~12, seed 데이터)
- admin 비밀번호: admin1234 (원복 완료)
- seed 회원 비밀번호: 백엔드가 test1234로 전체 복원함

### 미테스트 항목 (다음 세션에서 확인 필요)

- [ ] 프론트엔드 브라우저 렌더링 (캘린더, 배너, N배지 등) — curl/API로는 확인 불가
- [ ] 이미지 업로드 (POST /api/upload) — Cloudinary 연동 여부
- [ ] 회원가입 전체 플로우 (6단계 폼)
- [ ] 관리자 콘솔 (web/admin/) 기능
- [ ] 모바일 반응형 UI

---

## 세션 2: 2026-03-10 (단기 스프린트 검증)

### 작업 요약
- **목적**: 색상 리뉴얼 + SSN 보안강화 + 캐시 버스팅 후 코드 품질 검증
- **범위**: JS 문법, SSN 입력란, 카카오 주소 검색, 아바타 색상 통일, 초록색 잔여, 뱃지, SSN API, 필드명 일치, 캐시 버스팅

### 검증 결과: 10/10 (100%)

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | JS 문법 검증 (web/js/*.js) | ✅ | 15개 파일 전체 통과 |
| 2 | JS 문법 검증 (api/routes/*.js + server.js) | ✅ | 10개 파일 전체 통과 |
| 3 | npm test | ⚠️ | 테스트 스크립트 미등록 (test script 없음) — 기능 문제 아님 |
| 4 | 주민번호 입력란 (index.html) | ✅ | ssn-front, ssn-back, ssn-input-group, ssn-separator, ssn-mask 모두 존재 |
| 5 | 카카오 주소 검색 | ✅ | postcode.v2.js 로드, openAddressSearch 함수, btn-address-search 버튼, address-main/address-detail input 모두 존재 |
| 6 | 아바타 색상 통일 | ✅ | members.js + profile.js 모두 블루톤(#DBEAFE/#1E40AF) 통일 |
| 7 | 초록색 잔여 확인 | ✅ | web/ 전체 0건 — 초록색 완전 제거됨 |
| 8 | 뱃지 색상 확인 | ✅ | role-super, badge-admin, 총관리자 — JS·CSS 모두 정상 |
| 9 | 주민번호 API (auth.js) | ✅ | ssnFront/ssnBack 분리 수신, 6자리+1자리 검증, YYMMDD 날짜 유효성 검증 포함 |
| 10 | 프론트-백엔드 필드명 일치 | ✅ | 프론트(signup.js): ssnFront/ssnBack → 백엔드(auth.js): ssnFront/ssnBack 일치 |
| 11 | 캐시 버스팅 | ✅ | main.css?v=20260310b 확인 |

### 미테스트 항목 (이월)

- [ ] 프론트엔드 브라우저 렌더링 (캘린더, 배너, N배지 등) — curl/API로는 확인 불가
- [ ] 이미지 업로드 (POST /api/upload) — Cloudinary 연동 여부
- [ ] 회원가입 전체 플로우 (6단계 폼)
- [ ] 관리자 콘솔 (web/admin/) 기능
- [ ] 모바일 반응형 UI

---

## 세션 3: 2026-03-10 (중기 스프린트 전체 검증)

### 작업 요약
- **목적**: 출석투표·즐겨찾기·직함이력 신규 기능 + 전화걸기 UX + 디자인·보안 검증
- **범위**: JS 문법, 백엔드 3개 신규 API, 라우터 등록, 프론트엔드 4개 UI, 디자인 일관성, 보안

### 검증 결과: 11/11 (100%)

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | JS 문법 검증 | ✅ | web/js/ 15파일 + api/routes/ 12파일 + server.js 전체 통과 |
| 2 | 출석투표 API (attendance.js) | ✅ | 6개 엔드포인트: POST /, PUT /:configId, GET /:scheduleId, POST /:configId/vote, GET /:configId/results, POST /:configId/close |
| 3 | 즐겨찾기 API (favorites.js) | ✅ | 3개 엔드포인트: POST /:targetId, DELETE /:targetId, GET / |
| 4 | 직함이력 API (titles.js) | ✅ | 4개 엔드포인트: GET /:userId, POST /:userId, PUT /:userId/:titleId, DELETE /:userId/:titleId |
| 5 | 라우터 등록 (server.js) | ✅ | attendance, favorites, titles 3개 모두 require + app.use 등록 확인 |
| 6 | 전화걸기 UI (tel:) | ✅ | members.js: tel: 링크 + call-btn + formatPhone / profile.js: tel: + phone-link / main.css: .call-btn, .phone-link 스타일 |
| 7 | 출석투표 UI | ✅ | schedules.js: attendance-section, loadAttendanceVote, submitVote, vote-btn / main.css: .attendance-section, .vote-btn, .vote-attend |
| 8 | 즐겨찾기 UI | ✅ | members.js: favorites-section, loadFavorites, toggleFavorite, favorite-btn / main.css: .favorite-btn, .favorites-section |
| 9 | 직함이력 UI | ✅ | members.js + profile.js: title-history-section, loadTitleHistory, title-item / main.css: .title-history-section, .title-item |
| 10 | 디자인 일관성 | ✅ | 초록색 잔여 0건, 캐시 버스팅 main.css?v=20260310e 확인 |
| 11 | 보안 | ✅ | Authorization Bearer 중앙관리(api-client.js), ssnFront/ssnBack 분리수신+유효성검증(auth.js) |

### 신규 파일 확인
- `api/routes/attendance.js` — 출석투표 CRUD + 투표 + 결과 + 마감 (6 endpoints)
- `api/routes/favorites.js` — 즐겨찾기 추가/삭제/목록 (3 endpoints)
- `api/routes/titles.js` — 직함이력 조회/추가/수정/삭제 (4 endpoints, 관리자 권한 보호)

### 미테스트 항목 (이월)

- [ ] 프론트엔드 브라우저 렌더링 (캘린더, 배너, N배지 등)
- [ ] 이미지 업로드 (POST /api/upload) — Cloudinary 연동 여부
- [ ] 회원가입 전체 플로우 (6단계 폼)
- [ ] 관리자 콘솔 (web/admin/) 기능
- [ ] 모바일 반응형 UI
- [ ] 신규 API 실 호출 테스트 (프로덕션 DB 연동)

---

## 2026-03-10 작업 종합 요약

### 오늘 전체 팀 작업 내역 (커밋 기준)

#### 디자인/스타일 (4건)
| 커밋 | 내용 |
|------|------|
| `8d9dc49` | CSS 캐시 버스팅 + 종합 디자인 개선 |
| `8e4ce80` | 아바타 블루 단일톤 + 뱃지 통일 + 알림아이콘 색상 개선 |
| `a88f4d5` | 자동완성 아이콘 숨김 + 안내박스 블루 테마 통일 |
| `ed49c3f` | 색상 리뉴얼 미반영 항목 전수 수정 |

#### 백엔드 (2건)
| 커밋 | 내용 |
|------|------|
| `aea28ee` | 주민번호 API 분리수신(ssnFront+ssnBack) + 유효성 검증 + debug 노출 제거 |
| `4b33611` | home.js 문법 오류 수정 — 전체 앱 로드 실패 원인 |

#### 프론트엔드 신규 기능 (3건)
| 커밋 | 내용 |
|------|------|
| `711f7d6` | 주민번호 분리입력(6+1) + 카카오 주소검색 API 연동 |
| `29badd0` | 전화걸기(tel:) 기능 — 회원목록/상세/프로필 |
| `03cedc0` | 출석투표 UI + 즐겨찾기(★) UI + 직함이력 UI 구현 |

#### 기획/문서 (2건)
| 커밋 | 내용 |
|------|------|
| `60e7da7` | 중기 스프린트 기획서 (출석투표, 전화걸기, 즐겨찾기) |
| `29b66e0` | 중기 스프린트 UI 가이드 |

#### 테스터 검증 (2건)
| 커밋 | 내용 |
|------|------|
| `53de2e5` | 단기 스프린트 테스트 결과 보고 — 10/10 통과 |
| `7efc05b` | 중기 스프린트 전체 검증 완료 — 11/11 통과 |

### 테스터 검증 총 결과
- **단기 스프린트 (세션 2)**: 10/10 ✅ — JS 문법, SSN, 카카오 주소, 아바타 색상, 초록색 제거, 뱃지, 필드명 일치, 캐시 버스팅
- **중기 스프린트 (세션 3)**: 11/11 ✅ — JS 문법, 출석투표/즐겨찾기/직함이력 API 3종, 라우터 등록, 전화걸기/출석투표/즐겨찾기/직함이력 UI 4종, 디자인 일관성, 보안
- **발견된 버그**: 0건 (모든 항목 정상)

### 현재 프로젝트 상태
- **API 라우트**: 12개 (auth, posts, notices, schedules, members, profile, admin, seed, upload, attendance, favorites, titles)
- **프론트엔드 JS**: 15개 모듈
- **신규 추가된 기능**: 출석투표, 즐겨찾기, 직함이력, 전화걸기, 주민번호 분리입력, 카카오 주소검색
- **디자인**: 초록색 완전 제거, 블루+그레이 2톤 통일 완료

---

## 세션 4: 2026-03-10 (3차 스프린트 검증)

### 작업 요약
- **목적**: 3차 스프린트 백엔드 6커밋 + 프론트 6커밋 후 전체 검증
- **범위**: JS 문법, 백엔드 신규 API 구조, 프론트-백엔드 필드명 일치, 프로덕션 API 실 호출, 디자인 일관성, 캐시 버스팅

### 1. JS 문법 검증: 전체 PASS

| 영역 | 파일 수 | 결과 |
|------|---------|------|
| web/js/*.js | 15 | ✅ 전체 통과 |
| api/routes/*.js + server.js | 14 | ✅ 전체 통과 |

### 2. 백엔드 신규 API 구조 검증: 6/6 PASS

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | notices.js 하위호환 프록시 | ✅ | GET/POST/PUT/DELETE 4개 엔드포인트, posts 테이블 category='notice' 쿼리, read_status JOIN fallback |
| 2 | posts.js linked_schedule_id | ✅ | POST 시 schedule 객체 → 트랜잭션으로 일정 동시 생성, PUT 시 연결 일정 동기화, DELETE 시 delete_linked_schedule 옵션 |
| 3 | schedules.js 일정 댓글 API | ✅ | GET/POST/DELETE /:id/comments 3개 엔드포인트, 대댓글 구조화, 대대댓글 방지 |
| 4 | members.js ?industry= 필터 | ✅ | VALID_INDUSTRY_CODES 검증 후 WHERE 조건 추가, search에도 industry 필터 지원 |
| 5 | industries.js GET /api/industries | ✅ | 13개 업종 카테고리 반환 (인증 불필요) |
| 6 | server.js 라우터 등록 | ✅ | 13개 라우터 전부 require + app.use 확인 (auth, posts, notices, schedules, members, profile, upload, admin, seed, attendance, favorites, titles, industries) |

### 3. 프론트-백엔드 필드명 일치 검증: PASS

| 프론트 호출 | 백엔드 경로 | 일치 |
|------------|------------|------|
| `/favorites` (GET/POST/DELETE) | api/routes/favorites.js | ✅ |
| `/titles/:userId` (GET) | api/routes/titles.js | ✅ |
| `/attendance/:scheduleId` (GET) | api/routes/attendance.js | ✅ |
| `/schedules/:id/comments` (GET/POST) | api/routes/schedules.js | ✅ |
| `/members` (GET) | api/routes/members.js | ✅ |
| `/members/search?q=` (GET) | api/routes/members.js | ✅ |

**미연동 API** (백엔드 구현 완료, 프론트 미연동):
- `/api/industries` — 프론트에서 아직 호출하지 않음 (업종 드롭다운 미구현)
- `/api/members?industry=` — 프론트에서 아직 호출하지 않음 (업종 필터 UI 미구현)

### 4. 프로덕션 API 실 호출 테스트

| # | 테스트 | 결과 | 비고 |
|---|--------|------|------|
| 1 | POST /api/auth/login | ✅ PASS | admin@jc.com / test1234 토큰 발급 정상 |
| 2 | GET /api/notices (하위호환) | ✅ PASS | 2건 반환 |
| 3 | GET /api/industries | ✅ PASS | 13개 업종 카테고리 |
| 4 | **GET /api/members** | ❌ **FAIL 500** | **BUG-S4-001** |
| 5 | **GET /api/members?industry=it** | ❌ **FAIL 500** | **BUG-S4-001** (동일 원인) |
| 6 | GET /api/members/search?q=admin | ✅ PASS | 1건 반환 |
| 7 | GET /api/schedules | ✅ PASS | 14건 |
| 8 | GET /api/schedules/1 | ✅ PASS | |
| 9 | GET /api/schedules/1/comments | ✅ PASS | 0건 (댓글 없음) |
| 10 | GET /api/attendance/1 | ⚠️ 404 | 정상 — 일정 1에 투표 설정 없음 |
| 11 | GET /api/favorites | ✅ PASS | 0건 |
| 12 | GET /api/titles/1 | ✅ PASS | 0건 |
| 13 | GET /api/posts | ✅ PASS | 2건 |
| 14 | GET /api/posts?category=notice | ✅ PASS | 2건 |
| 15 | GET /api/posts/1 | ✅ PASS | |
| 16 | GET /api/profile | ✅ PASS | |
| 17 | GET /api/auth/me | ✅ PASS | |
| 18 | GET /health | ✅ PASS | "healthy" 텍스트 응답 |

### 5. 디자인 일관성 검증

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | 초록색 잔여 (장식적) | ✅ | web/ 전체 0건 — 완전 제거됨 |
| 2 | 기능적 색상 (success/training) | ✅ | --success-color, badge-training 등 정상 사용 |
| 3 | 캐시 버스팅 버전 | ✅ | main.css?v=20260310f 확인 |
| 4 | 보라색 잔여 | ⚠️ LOW | main.css에 --purple-bg, --purple-text CSS 변수 선언은 남아있으나 실제 사용처 없음 (dead code) |

### 발견된 버그

#### BUG-S4-001: GET /api/members → 500 Internal Server Error (CRITICAL)

- **심각도**: **CRITICAL** — 회원 목록 페이지 전체 이용 불가
- **위치**: `api/routes/members.js:46-48`
- **원인**: count 쿼리에 잘못된 파라미터 전달
  ```javascript
  // 문제 코드 (line 46-48)
  const countResult = await query(
      `SELECT COUNT(*) FROM users u WHERE ${whereClause}`,
      params.slice(2) // ← [userId]를 전달하지만 쿼리에 파라미터 placeholder 없음
  );
  ```
- **상세**: `whereClause`가 `u.status = 'active'`일 때 파라미터 0개 필요하지만 `params.slice(2)` = `[userId]` 1개를 전달 → PostgreSQL 에러: `bind message supplies 1 parameters, but prepared statement "" requires 0`
- **영향**: `GET /api/members`와 `GET /api/members?industry=` 모두 500 에러
- **수정 방향**: lines 46-48의 첫 번째 count 쿼리를 제거하고 lines 50-61의 "Re-do count" 블록만 남기거나, 첫 번째 쿼리를 try-catch로 감싸기
- **참고**: `GET /api/members/search`는 별도 로직이므로 정상 동작

#### 디자인 경미 이슈 (LOW)

- main.css line 46-47에 `--purple-bg: #F3E8FF`, `--purple-text: #6B21A8` CSS 변수가 선언되어 있으나 실제 사용처 없음 (dead code)
- admin.css line 664에 `#16a34a` (초록색) 있으나 이는 success alert의 기능적 색상으로 정상

### 검증 총 결과

| 영역 | 결과 |
|------|------|
| JS 문법 (29파일) | ✅ 29/29 |
| 백엔드 구조 (6항목) | ✅ 6/6 |
| 프론트-백엔드 필드명 | ✅ 6/6 |
| 프로덕션 API (18항목) | 16 PASS / 1 FAIL(BUG) / 1 예상404 |
| 디자인 일관성 (4항목) | ✅ 4/4 (1건 LOW 경미) |

**CRITICAL 버그 1건 발견**: BUG-S4-001 — `GET /api/members` 500 에러. 백엔드 에이전트 수정 필요.

### BUG-S4-001 수정 확인 (커밋 7205857)

백엔드 에이전트가 `members.js` count 쿼리 바인딩 버그를 수정함. 프로덕션 재검증 결과:

| # | 테스트 | 결과 | 비고 |
|---|--------|------|------|
| 1 | GET /api/members (필터 없음) | ✅ PASS | total=33, page=1, totalPages=1 |
| 2 | GET /api/members?industry=construction | ✅ PASS | total=0 (해당 업종 회원 없음) |
| 3 | GET /api/members?industry=it | ✅ PASS | total=0 (해당 업종 회원 없음) |
| 4 | GET /api/members?industry=invalidcode | ✅ PASS | total=33 (유효하지 않은 코드 무시, 전체 반환) |

**BUG-S4-001: 수정 완료 확인** ✅

---

## 세션 5: 2026-03-11 (스프린트 5 배포 검증 — M-10/M-12/M-13 + 회귀)

### 작업 요약
- **목적**: 스프린트 5 신규 기능(M-10 관리자 필드 수정 제한, M-12 공지-일정 연동, M-13 업종 필터) + 기존 기능 회귀 검증
- **범위**: 배포 사이트 전수 검증 (API 실 호출 + 소스 코드 분석)
- **테스트 계정**: admin@jc.com / test1234 (super_admin), kang.ms@yjc-test.kr / test1234 (member)

### 테스트 결과: 8/8 (100%)

| TC# | 항목 | 결과 | 비고 |
|-----|------|------|------|
| TC-S5-001 | M-12 공지-일정 연동 — 글쓰기 토글 | ✅ PASS | `schedule` 객체 전달 시 공지+일정 동시 생성, `linked_schedule_id` 양방향 저장 확인 (Post 15→Schedule 18, Schedule 18→Post 15) |
| TC-S5-002 | M-12 공지-일정 연동 — 일정 상세에서 관련 공지 | ✅ PASS | Schedule 18 상세에 `linked_post_id=15` 확인, 삭제 시 `?delete_linked_schedule=true`로 연동 일정도 동시 삭제 |
| TC-S5-003 | M-13 업종 필터 — 드롭다운 동작 | ✅ PASS | `GET /api/industries` → 13개 카테고리 반환, `GET /api/members?industry=it` 필터 정상 동작, 프론트 `members.js` 업종 드롭다운 코드 확인 |
| TC-S5-004 | M-13 업종 필터 — 프로필 업종 표시 | ✅ PASS | 프로필 API에 `industry`, `industry_detail` 필드 존재, 가입폼 Step 3에 업종 선택 드롭다운 있음 |
| TC-S5-005 | M-10 관리자 필드 수정 제한 | ✅ PASS | 일반 회원(kang.ms, role=member)이 position/department 변경 시도 → 성공 응답이지만 실제 값 미반영(원래 값 유지). 관리자(admin)는 정상 변경 가능 |
| TC-S5-006 | 댓글 인코딩 확인 | ✅ PASS | 게시글 1에 댓글 2건 존재(ID 5,6), 새 댓글 '테스트 댓글입니다' 등록→한글 정상 저장→조회 시 인코딩 정상 |
| TC-S5-007 | 기존 기능 회귀 테스트 | ✅ PASS | 10개 항목 전체 통과 (아래 상세) |
| TC-S5-008 | 테스트 데이터 정리 | ✅ PASS | 테스트 게시글 2건(ID 14,15), 테스트 댓글 1건(ID 8), 연동 일정(ID 18) 모두 삭제, 프로필 원복 완료 |

### TC-S5-001 상세: M-12 공지-일정 연동

**핵심 동작 확인:**
- `POST /api/posts` → body에 `schedule` 객체 포함 시 트랜잭션으로 공지+일정 동시 생성
- 응답: `{ post: { id: 15, linked_schedule_id: 18 }, schedule: { id: 18, linked_post_id: 15 } }`
- `GET /api/posts/15` → `linked_schedule_id = 18` 확인
- `GET /api/schedules/18` → `linked_post_id = 15` 확인
- `DELETE /api/posts/15?delete_linked_schedule=true` → 게시글+일정 동시 삭제

**프론트엔드 UI (소스 코드 확인):**
- `web/index.html:739` — `#post-create-schedule-attach` 컨테이너 존재
- `web/js/posts.js:240~320` — `renderScheduleAttachSection()`, `toggleScheduleAttach()`, `getScheduleAttachData()` 구현
- `web/js/posts.js:421~424` — 공지 작성 시 `payload.schedule = scheduleData` 전달
- `web/js/posts.js:782~810` — 게시글 상세에서 `linked-schedule-banner` 렌더링
- `web/styles/main.css:4446~4543` — `.schedule-attach-section`, `.linked-schedule-banner` 스타일

**참고:** `linked_schedule_id`를 직접 전달하는 방식은 미지원. 반드시 `schedule` 객체로 전달해야 함 (설계 의도대로).

### TC-S5-003 상세: M-13 업종 필터

**API 검증:**
```
GET /api/industries → 13개: law, finance, medical, construction, it, manufacturing, food, retail, service, realestate, culture, public, other
GET /api/members → 33명 (total=33)
GET /api/members?industry=it → 0명 (해당 업종 회원 없음, 정상)
GET /api/members?industry=construction → 0명 (정상)
```

**프론트엔드 UI (소스 코드 확인):**
- `web/js/members.js:38~73` — `renderIndustryFilter()`: "업종: 전체" 드롭다운, 13개 카테고리 옵션
- `web/js/members.js:73,109` — `currentIndustryFilter` 파라미터로 API 호출
- `web/styles/main.css:4549~4565` — `.industry-filter-wrap`, `.industry-filter-select` 스타일

### TC-S5-005 상세: M-10 관리자 필드 수정 제한

| 계정 | Role | PUT position='HACK' | 실제 결과 |
|------|------|---------------------|-----------|
| admin@jc.com | super_admin | success=true | position='테스트직책' → **변경됨** ✅ |
| kim.yh@yjc-test.kr | super_admin | success=true | position='HACK' → **변경됨** ✅ |
| kang.ms@yjc-test.kr | member | success=true | position='부장' (원래값 유지) → **무시됨** ✅ |

**결론**: 백엔드가 `role=member`일 때 admin 전용 필드(position, department)를 자동 무시. 응답은 success이지만 실제 값 미변경. 기능 정상.

### TC-S5-006 상세: 댓글 인코딩

- 기존 댓글 2건: ID 5 "final", ID 6 "final test" → 영문 정상
- 새 댓글 "테스트 댓글입니다" → 등록 성공 → 조회 시 한글 정상 표시 (인코딩 OK)
- 댓글 삭제 후 `comments_count=2` 복원 확인

### TC-S5-007 상세: 회귀 테스트

| # | 항목 | 결과 |
|---|------|------|
| 1 | GET /health | ✅ "healthy" |
| 2 | GET /api/schedules | ✅ 15건 |
| 3 | GET /api/schedules/1 | ✅ 상세 정상 |
| 4 | GET /api/members | ✅ 33명 |
| 5 | GET /api/members/search?q=admin | ✅ 1건 |
| 6 | GET /api/profile | ✅ 정상 |
| 7 | GET /api/posts | ✅ 정상 |
| 8 | GET /api/notices | ✅ 정상 |
| 9 | GET /api/posts/1/comments | ✅ 정상 |
| 10 | GET /api/industries | ✅ 13개 |

**즐겨찾기 API 추가 검증:**
- `POST /api/favorites/13` → 즐겨찾기 추가 성공
- `GET /api/favorites` → 1건 확인
- `DELETE /api/favorites/13` → 삭제 성공

### TC-S5-008 상세: 테스트 데이터 정리

| 작업 | 결과 |
|------|------|
| DELETE /api/posts/15?delete_linked_schedule=true | ✅ 게시글+연동일정 삭제 |
| DELETE /api/posts/14 | ✅ 삭제 |
| DELETE /api/posts/1/comments/8 | ✅ 삭제, comments_count=2 |
| kim.yh 프로필 원복 (position/department=null) | ✅ 복원 |
| admin 프로필 원복 (position/department=null) | ✅ 복원 |
| 최종 데이터: Posts 2건, Comments 2건, Schedules 14건 | ✅ 원상복구 |

### 발견된 버그: 0건

모든 테스트 항목 정상 통과. 신규 버그 없음.

### 회원 역할 분포 (참고)

| Role | 인원 |
|------|------|
| super_admin | 2명 (admin@jc.com, kim.yh) |
| admin | 2명 (park.sm, lee.jy) |
| member | 29명 |

### 미테스트 항목 (이월)

- [ ] 브라우저 기반 E2E 테스트 (캘린더, 배너 캐러셀 등 JS 동적 렌더링)
- [ ] 이미지 업로드 (POST /api/upload) — Cloudinary 연동 여부
- [ ] 회원가입 전체 플로우 (6단계 폼)
- [ ] 관리자 콘솔 (web/admin/) 기능
- [ ] 모바일 반응형 UI
- [ ] 업종 데이터가 있는 회원으로 업종 필터 실 필터링 테스트

---

## 세션 6: 2026-03-11 (Web Push 알림 기능 검증)

### 작업 요약
- **목적**: Web Push 알림 신규 기능 전수 검증
- **범위**: 파일 구조, index.html 통합, API 엔드포인트, Service Worker, CSS, 회귀, PWA manifest, nginx 설정
- **테스트 계정**: admin@jc.com / test1234

### 테스트 결과: 7 PASS / 1 WARN (버그 1건)

| TC# | 항목 | 결과 | 비고 |
|-----|------|------|------|
| TC-01 | 파일 존재 및 구조 확인 | ✅ PASS | 5개 파일 전부 존재, 핵심 함수 확인 |
| TC-02 | index.html 통합 확인 | ✅ PASS | 7개 항목 전부 확인 |
| TC-03 | API 엔드포인트 동작 테스트 | ⚠️ WARN | 5/6 PASS, VAPID key 필드명 불일치 (BUG-S6-001) |
| TC-04 | Service Worker 구문 검증 | ✅ PASS | 구문 정상, push/notificationclick 핸들러 확인 |
| TC-05 | CSS 스타일 확인 | ✅ PASS | 6개 클래스 그룹 전부 존재 |
| TC-06 | 기존 기능 회귀 테스트 | ✅ PASS | API 3개 200 + JS 전체 문법 통과 |
| TC-07 | PWA manifest 검증 | ✅ PASS | 필드 5개 + 아이콘 4개(192/512/maskable) 확인 |
| TC-08 | nginx.conf 확인 | ✅ PASS | sw.js 캐시 방지 + manifest.json 서빙 설정 확인 |

---

### TC-01 상세: 파일 존재 및 구조

| 파일 | 존재 | 핵심 요소 |
|------|------|-----------|
| `web/sw.js` | ✅ | `push` 이벤트 → `showNotification()`, `notificationclick` 이벤트 → `clients.openWindow()` + `client.postMessage()` |
| `web/manifest.json` | ✅ | 유효 JSON, `name`/`icons`/`display` 필드 존재 |
| `web/js/push.js` | ✅ | `subscribePush()`, `unsubscribePush()`, `initPush()`, `getVapidPublicKey()`, iOS/PWA 체크 |
| `web/js/notifications.js` | ✅ | `loadNotifications()`, `markNotificationAsRead()`, `markAllNotificationsRead()`, `updateNotificationBadge()` |
| `web/js/notification-settings.js` | ✅ | `loadNotificationSettings()`, `saveNotificationSetting()`, 마스터 스위치 + 4개 유형별 토글 |

### TC-02 상세: index.html 통합

| 항목 | 위치 | 확인 |
|------|------|------|
| `<link rel="manifest">` | line 9 | ✅ `manifest.json` |
| `<meta name="theme-color">` | line 10 | ✅ `#2563EB` |
| 알림 벨 아이콘 | line 526 | ✅ `#notification-bell` + `onclick="showNotificationCenter()"` |
| 배지 카운트 | line 531 | ✅ `#notification-badge-count` |
| 알림 센터 화면 | line 920 | ✅ `#notifications-screen` + `#notification-list-content` + `모두 읽음` 버튼 |
| 알림 설정 화면 | line 958 | ✅ `#notification-settings-screen` + `#notification-settings-content` |
| 스크립트 태그 (캐시 버스팅) | line 1090-1092 | ✅ `push.js?v=20260311a`, `notifications.js?v=20260311a`, `notification-settings.js?v=20260311a` |

### TC-03 상세: API 엔드포인트

| # | 엔드포인트 | HTTP | 결과 | 비고 |
|---|-----------|------|------|------|
| 1 | `GET /api/push/vapid-key` | 200 | ⚠️ WARN | 응답: `data.vapidPublicKey` (BUG-S6-001) |
| 2 | `GET /api/notifications/settings` | 200 | ✅ | fields: `all_push, notice_push, schedule_push, reminder_push, comment_push` |
| 3 | `GET /api/notifications` | 200 | ✅ | items=0, unread_count=0 |
| 4 | `PUT /api/notifications/settings` | 200 | ✅ | 5개 설정 저장 성공 |
| 5 | `POST /api/notifications/read-all` | 200 | ✅ | 전체 읽음 처리 성공 |

### TC-04 상세: Service Worker

- `node -c web/sw.js` → ✅ 구문 정상
- `push` 이벤트: `event.data.json()` 파싱 → `self.registration.showNotification()` 호출 ✅
- `notificationclick` 이벤트: `event.notification.close()` → `clients.matchAll()` → `client.focus()` + `client.postMessage()` 또는 `clients.openWindow()` ✅
- icon: `/image/icon-192.png`, badge: `/image/badge-72.png` — 파일 존재 확인 ✅

### TC-05 상세: CSS 스타일

| 클래스 | 존재 | main.css 라인 |
|--------|------|--------------|
| `.notification-badge-wrap` (벨 아이콘) | ✅ | 4595 |
| `.notification-badge-count` (배지) | ✅ | 4617 |
| `.notification-item` | ✅ | 4675 |
| `.notification-item.unread` | ✅ | 4691 |
| `.alert-settings-*` (설정 관련 12개) | ✅ | 4808~4940 |
| `.push-subscribe-banner` | ✅ | 4968 |

### TC-06 상세: 회귀 테스트

| 항목 | 결과 |
|------|------|
| `GET /api/members` | ✅ 200 |
| `GET /api/posts` | ✅ 200 |
| `GET /api/schedules` | ✅ 200 |
| `node -c web/js/*.js` (전체 JS 문법) | ✅ 전체 통과 |

### TC-07 상세: PWA manifest

```json
{
  "name": "영등포 JC",
  "short_name": "영등포JC",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2563EB",
  "icons": [
    { "src": "/image/icon-192.png", "sizes": "192x192" },
    { "src": "/image/icon-512.png", "sizes": "512x512" },
    { "src": "/image/icon-maskable-192.png", "sizes": "192x192", "purpose": "maskable" },
    { "src": "/image/icon-maskable-512.png", "sizes": "512x512", "purpose": "maskable" }
  ]
}
```
- 아이콘 파일 4개 모두 실제 존재 ✅ (`web/image/icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`)
- `badge-72.png`도 존재 ✅

### TC-08 상세: nginx.conf

| 설정 | 확인 |
|------|------|
| `location = /sw.js` → `Cache-Control "no-cache, no-store, must-revalidate"` | ✅ (line 64-68) |
| `location = /sw.js` → `Service-Worker-Allowed "/"` 헤더 | ✅ |
| `location = /manifest.json` → `Content-Type "application/manifest+json"` | ✅ (line 71-75) |
| `location = /manifest.json` → `max-age=3600` 캐시 | ✅ |
| gzip에 `application/manifest+json` 포함 | ✅ (line 88) |

---

### 발견된 버그

#### BUG-S6-001: VAPID key 필드명 불일치 — 프론트-백엔드 미스매치 (HIGH)

- **심각도**: **HIGH** — 푸시 구독이 실패하여 알림을 받을 수 없음
- **위치**: `web/js/push.js:43` ↔ `api/routes/notifications.js:22`
- **현상**: 프론트엔드가 VAPID 공개키를 가져오지 못해 `subscribePush()`가 항상 실패
- **원인**:
  - 백엔드 응답: `{ success: true, data: { vapidPublicKey: "BNgg..." } }`
  - 프론트엔드 기대: `result.data.publicKey` (line 43)
  - `data.publicKey`가 undefined → `getVapidPublicKey()` 함수가 null 반환
  - `subscribePush()` line 82에서 `if (!vapidKey)` → 실패 토스트 "푸시 설정을 불러올 수 없습니다"
- **수정 방향** (둘 중 하나):
  - A) 프론트엔드 수정: `push.js:43` → `result.data.vapidPublicKey` 로 변경
  - B) 백엔드 수정: `notifications.js:22` → `{ publicKey: VAPID_PUBLIC_KEY }` 로 변경
  - **A안 권장** (백엔드 응답이 더 명시적이므로)

---

### 테스트 총평

Web Push 알림 기능의 **구조와 설계는 완성도가 높음**:
- Service Worker, Push 구독, 알림 센터, 알림 설정 등 전체 파이프라인 구현 완료
- UI/CSS가 잘 정의되어 있고 index.html에 올바르게 통합됨
- 5개 API 엔드포인트 모두 200 응답
- nginx에 SW 캐시 방지, manifest 서빙까지 설정 완료
- PWA manifest + 아이콘 4종 + badge 아이콘까지 준비됨

**다만 BUG-S6-001 (VAPID key 필드명 불일치)로 인해 실제 Push 구독이 동작하지 않음**. 이 1줄 수정이 완료되면 전체 Push 알림 파이프라인이 정상 동작할 것으로 예상.

---

## 세션 7: 2026-03-11 (관리자 웹 M-08 전체 9화면 종합 검증)

### 작업 요약
- **목적**: 관리자 웹(Phase 1~3) 전체 9화면 종합 검증
- **범위**: API 엔드포인트, 프론트엔드 코드 구조, 사이드바 네비게이션, DB 스키마
- **배포 URL**: https://jc-production-7db6.up.railway.app/admin/
- **테스트 계정**: admin@jc.com / test1234 (super_admin)

### 테스트 결과: 4 PASS / 1 WARN

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| 1. API 엔드포인트 | ✅ PASS | 11/11 정상 응답 |
| 2. 프론트엔드 코드 구조 | ✅ PASS | 10개 JS 파일 + 9개 라우트 + 10개 script 태그 |
| 3. 사이드바 프로필 네비게이션 | ⚠️ WARN | 헤더에는 있지만 사이드바에 없음 (BUG-AW-001) |
| 4. DB 스키마 | ✅ PASS | 008_app_settings.sql 존재 |
| 5. JS 문법 검증 | ✅ PASS | admin JS 10개 파일 전체 통과 |

---

### 1. API 엔드포인트 검증

| # | 엔드포인트 | HTTP | 결과 | 비고 |
|---|-----------|------|------|------|
| 1 | `POST /api/admin/auth/login` | 200 | ✅ | 토큰 정상 발급 |
| 2 | `GET /api/admin/auth/me` | 200 | ✅ | id, email, name, role, status, profile_image, created_at, updated_at |
| 3 | `GET /api/admin/dashboard/stats` | 200 | ✅ | members, posts, schedules, comments |
| 4 | `GET /api/admin/members?page=1&limit=10` | 200 | ✅ | 페이지네이션 정상 |
| 5 | `GET /api/admin/posts?page=1&limit=10` | 200 | ✅ | items, total, page, totalPages |
| 6 | `GET /api/admin/notices?page=1&limit=10` | 200 | ✅ | items, total, page, totalPages |
| 7 | `GET /api/admin/schedules?page=1&limit=10` | 200 | ✅ | items, total, page, totalPages |
| 8 | `GET /api/admin/audit-log?page=1&limit=10` | 200 | ✅ | items, total, page, totalPages |
| 9 | `GET /api/admin/settings` | 200 | ✅ | id, app_name, app_description, require_approval, default_role, push_enabled |
| 10 | `GET /api/admin/dashboard/recent-activity` | 200 | ✅ | recent_members, recent_posts, recent_schedules |
| 11 | `PUT /api/admin/auth/profile` | 존재 확인 | ✅ | admin.js:1834 라우트 등록 확인 |

**통계 세부 API** (stats.js가 직접 호출하지는 않지만 백엔드에 존재):

| 엔드포인트 | HTTP | 비고 |
|-----------|------|------|
| `GET /api/admin/stats/members` | 200 | 월별 가입, 역할/업종 분포 |
| `GET /api/admin/stats/posts` | 200 | 월별 게시글, 카테고리 분포 |
| `GET /api/admin/stats/schedules` | 200 | 월별 일정, 출석 통계 |
| `GET /api/admin/stats/activity` | 200 | 일별 게시글/댓글 수 |

**참고**: 테스트 항목의 `GET /api/admin/stats/overview`는 존재하지 않음 (404). `stats.js`는 실제로 `/api/admin/dashboard/stats` + `/api/admin/dashboard/recent-activity`를 사용하므로 정상 동작.

### 2. 프론트엔드 코드 구조 검증

**JS 파일 존재 (10/10):**

| 파일 | 존재 | 핵심 함수 |
|------|------|-----------|
| `admin-app.js` | ✅ | `getPageRenderer()` — 9페이지 라우트 등록, `navigateAdmin()`, `adminLogout()` |
| `dashboard.js` | ✅ | `renderDashboard()` |
| `members.js` | ✅ | `renderMembers()` |
| `posts.js` | ✅ | `renderPosts()` |
| `notices.js` | ✅ | `renderNotices()` |
| `schedules.js` | ✅ | `renderSchedules()` |
| `stats.js` | ✅ | `renderStats()`, `loadStatsData()`, CSS-only 차트 (외부 라이브러리 없음) |
| `audit-log.js` | ✅ | `renderAuditLog()` |
| `settings.js` | ✅ | `renderSettings()` |
| `admin-profile.js` | ✅ | `renderAdminProfile()`, `saveProfile()`, `changePassword()` |

**index.html script 태그 (10/10):**
- `admin-app.js?v=20260311d` ~ `admin-profile.js?v=20260311d` 전부 캐시 버스팅 포함

**getPageRenderer() 라우트 맵 (9/9):**
```
dashboard, members, posts, notices, schedules, stats, audit-log, settings, admin-profile
```

### 3. 사이드바 프로필 네비게이션

- **헤더**: `#header-user` → `onclick="navigateAdmin('admin-profile')"` ✅ (index.html:114)
- **사이드바**: `.sidebar-user` 영역에 클릭 핸들러 **없음** ⚠️
  - 사이드바 하단에 사용자 이름/역할/아바타 표시되지만, 클릭해도 아무 동작 없음
  - 사이드바 nav에 `#admin-profile` 링크 없음 (dashboard~settings 8개만 있음)
  - → **BUG-AW-001** (아래 상세)

### 4. DB 스키마 검증

- `database/migrations/008_app_settings.sql` ✅ 존재
- `api/routes/admin.js`에 settings CRUD + auth/profile PUT 라우트 ✅ 존재

### 5. JS 문법 검증

- `web/admin/js/*.js` 10개 파일 전부 `node -c` 통과 ✅

---

### 발견된 버그

#### BUG-AW-001: 사이드바 프로필 영역 클릭 시 #admin-profile 이동 불가 (LOW)

- **심각도**: **LOW** — 헤더 우상단 이름 클릭으로 접근 가능하므로 기능 자체는 동작
- **위치**: `web/admin/index.html:92~103` (`.sidebar-user` 영역)
- **현상**: 사이드바 하단의 사용자 프로필 영역(아바타+이름+역할)을 클릭해도 아무 동작 없음
- **기대 동작**: 클릭 시 `#admin-profile` 페이지로 이동
- **대안 경로**: 헤더 우상단 사용자 이름 클릭 (`#header-user`, index.html:114)으로 접근 가능
- **수정 방향**: `.sidebar-user` div에 `onclick="navigateAdmin('admin-profile')"` + `cursor:pointer` 추가

---

### 테스트 총평

관리자 웹 9화면이 전체적으로 잘 완성됨:
- **API**: 11개 주요 엔드포인트 + 4개 통계 세부 API 전부 200 정상 응답
- **프론트**: 10개 JS 파일, 9개 라우트, 10개 script 태그, 캐시 버스팅 일치
- **기능**: 대시보드 통계, 회원/게시글/공지/일정 CRUD, 감사 로그, 시스템 설정, 프로필+비밀번호 변경
- **차트**: CSS-only 구현 (외부 라이브러리 0개) — 수평 바 차트, 도넛 차트, 막대 차트
- **보안**: JWT 인증, 관리자 전용 라우트 분리

**버그 1건 (LOW)**: 사이드바 프로필 클릭 미동작 — 헤더 대안 경로 있어 긴급도 낮음.

---

## 다음 작업 (TODO)

1. **BUG-S6-001 수정 후 재검증** — VAPID key 필드명 수정 후 Push 구독 동작 확인
2. **BUG-AW-001 수정 후 확인** — 사이드바 프로필 클릭 이동
3. 브라우저 기반 E2E 테스트 (프론트엔드 렌더링 검증)
4. 회원가입 → 승인 → 로그인 전체 플로우 테스트
5. 업종 데이터가 있는 회원으로 필터 실 동작 검증
