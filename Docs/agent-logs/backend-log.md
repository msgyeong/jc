# 백엔드 에이전트 작업 이력

> 담당: `api/` 폴더 (Express 라우트, 미들웨어, DB 쿼리)
> 담당자 규칙: api/ 폴더만 수정. 프론트(web/) 절대 수정 금지.

---

## 2026-03-11 세션 2: Web Push 알림 백엔드 구현 (Phase 1 MVP)

### 신규 패키지
- `web-push` ^3.6.0 — VAPID 기반 Web Push 발송
- `node-cron` ^3.0.0 — 리마인더 cron

### DB 테이블 생성 (Railway PostgreSQL)
- `push_subscriptions` — 푸시 구독 (user_id, endpoint, p256dh, auth, user_agent)
- `notification_settings` — 알림 설정 (all_push, notice_push, schedule_push, reminder_push, comment_push)
- `notification_log` — 알림 발송 이력 (type, title, body, data, read_at, clicked_at)
- 인덱스 3개: idx_push_subs_user, idx_noti_log_user, idx_noti_log_unread
- 마이그레이션 파일: `database/migrations/006_web_push.sql`

### 신규 파일
| 파일 | 용도 |
|------|------|
| `api/scripts/generate-vapid-keys.js` | VAPID 키 쌍 생성 스크립트 |
| `api/utils/pushSender.js` | 푸시 발송 유틸 (sendPushToUser, sendPushToAll) |
| `api/utils/reminderCron.js` | D-1 리마인더 cron (매일 09:00 KST) |
| `api/routes/notifications.js` | pushRouter + notificationsRouter (API 8개) |

### 신규 API 엔드포인트
| 라우트 | 메서드 | 엔드포인트 | 용도 |
|--------|--------|-----------|------|
| pushRouter | GET | `/api/push/vapid-key` | VAPID 공개키 반환 |
| pushRouter | POST | `/api/push/subscribe` | 푸시 구독 등록 |
| pushRouter | DELETE | `/api/push/subscribe` | 푸시 구독 해제 |
| notificationsRouter | GET | `/api/notifications/settings` | 알림 설정 조회 |
| notificationsRouter | PUT | `/api/notifications/settings` | 알림 설정 변경 |
| notificationsRouter | GET | `/api/notifications` | 알림 내역 (페이지네이션) |
| notificationsRouter | POST | `/api/notifications/:id/read` | 읽음 처리 |
| notificationsRouter | POST | `/api/notifications/read-all` | 모두 읽음 처리 |

### 기존 라우트 수정 (푸시 트리거 추가)
| 파일 | 트리거 | 알림 유형 | 대상 |
|------|--------|-----------|------|
| `posts.js` POST / (category=notice) | 공지 작성 | N-01 | 전체 (작성자 제외) |
| `posts.js` POST /:id/comments | 댓글 작성 | N-05 | 게시글 작성자 (본인 제외) |
| `schedules.js` POST / | 일정 생성 | N-02 | 전체 (작성자 제외) |
| `schedules.js` PUT /:id | 일정 수정 | N-04 | 전체 (수정자 제외) |
| `schedules.js` POST /:id/comments | 일정 댓글 | N-05 | 일정 작성자 (본인 제외) |

### 리마인더 cron (N-03)
- 매일 09:00 KST (Asia/Seoul timezone)
- 내일(D-1) 일정 조회 → reminder_push=ON인 사용자에게 발송
- server.js에서 서버 시작 시 cron 등록

### VAPID 키
- 생성 완료, **Railway 환경변수에 등록 필요**
- VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
- 키 미설정 시 서버 정상 기동, 푸시만 비활성 (console.warn 출력)

### 설계 원칙
- 푸시 발송 실패해도 원래 API 응답은 정상 반환 (비동기 .catch)
- 구독 만료(410 Gone) 시 push_subscriptions에서 자동 삭제
- notification_settings 행이 없으면 기본값(전부 true)으로 동작
- all_push=false면 모든 알림 발송 스킵

### 프론트엔드 전달사항
1. Service Worker (`web/sw.js`) 파일 생성 필요 — push 이벤트 + notificationclick 핸들러
2. `web/manifest.json` 생성 필요 — PWA 설정
3. 로그인 후 `GET /api/push/vapid-key`로 공개키 조회 → `pushManager.subscribe()` → `POST /api/push/subscribe`
4. 알림 센터 UI: `GET /api/notifications` (페이지네이션) + 미읽음 배지 (unread_count)
5. 알림 설정 UI: `GET/PUT /api/notifications/settings` (5개 토글)
6. 앱바 종 아이콘: unread_count 뱃지 표시

---

## 2026-03-11 세션 1: 댓글 인코딩 깨짐 조사 및 수정

### 현상
- 배포 사이트에서 '신나는 월례회'(post_id=1) 게시글의 댓글 id 1~4가 한글 깨짐 (◆□◆T 같은 문자로 표시)

### 원인 분석
- DB 인코딩: `server_encoding = UTF8`, `client_encoding = UTF8` — 정상
- Express body parser: `express.json()` + `express.urlencoded()` — UTF-8 기본값, 정상
- **근본 원인**: 댓글 id 1~4는 EUC-KR/CP949 인코딩 데이터가 UTF-8 DB에 저장될 때 U+FFFD(대체 문자, hex: `efbfbd`)로 치환됨
  - 초기 시드 또는 비-UTF-8 클라이언트에서 작성된 것으로 추정
  - hex 확인: 모든 한글 바이트가 `efbfbd`로 대체 → **원본 복구 불가**

### 수정 작업
1. 깨진 댓글 4개 삭제: `DELETE FROM comments WHERE post_id = 1 AND id IN (1, 2, 3, 4)` — 4건 삭제
2. `posts.comments_count` 동기화: 2 (남은 정상 댓글: id=5 "final", id=6 "final test")
3. 한글 인코딩 검증: 새 한글 댓글 INSERT → 정상 UTF-8 저장 확인 → 테스트 댓글 삭제

### 결론
- API/DB 인코딩 설정에 문제 없음 — 코드 수정 불필요
- 깨진 데이터는 초기 테스트 시 잘못된 인코딩으로 작성된 것
- 현재 시스템에서 한글 댓글 정상 동작 확인

---

## 2026-03-10 일일 요약

> 세션 1~8 총 8회 작업 수행

### 오늘 완료된 작업 (커밋 순)

| # | 커밋 | 작업 내용 | 세션 |
|---|------|-----------|------|
| 1 | — (DB만) | 테스트 게시글 6건 삭제 (프로덕션 DB) | 세션 1 |
| 2 | — (DB만) | 경민수 테스트 계정(id=7) 삭제 + 남은 테스트 게시글 2건 삭제 | 세션 2 |
| 3 | `5f171bd` | SSN 보안 강화 — 서버에서 7자리만 추출 저장 | 세션 2 |
| 4 | — | 긴급 장애 조사 — 백엔드 정상 확인 (프론트엔드 문제) | 세션 3 |
| 5 | `aea28ee` | 주민번호 API ssnFront+ssnBack 분리 수신 + 유효성 검증 + debug 노출 제거 | 세션 4 |
| 6 | `29badd0` | 출석투표/즐겨찾기/직함이력 API 신규 생성 + DB 테이블 4개 생성 | 세션 5 |
| 7 | `759fe93` | Sprint 3 DB 마이그레이션 (linked_schedule_id, linked_post_id, industry, schedule comments) | 세션 6 |
| 8 | `2828e7f` | M-02: 공지 라우트 통합 (notices.js → posts 테이블 기반 하위호환 프록시) | 세션 6 |
| 9 | `01d47f6` | M-12: 공지-일정 연동 API (트랜잭션 동시생성/동기화/삭제) | 세션 6 |
| 10 | `5fd783b` | M-13: 업종 검색 API (GET /api/industries + members 필터 + profile 업종) | 세션 6 |
| 11 | `26f3a2d` | 일정 댓글 API (GET/POST/DELETE /api/schedules/:id/comments) | 세션 6 |
| 12 | `7205857` | BUG-S4-001: GET /api/members 500 에러 수정 (count 쿼리 바인딩) | 세션 7 |
| 13 | `a9b09d2` | M-10: 관리자 지정 필드 수정 제한 + PUT /api/admin/members/:id 신규 | 세션 8 |

### 오늘 생성된 DB 테이블

| 테이블 | 용도 | 세션 |
|--------|------|------|
| `attendance_config` | 일정별 투표 설정 (유형/마감/성원/비용) | 5 |
| `attendance_votes` | 회원별 투표 기록 (UPSERT) | 5 |
| `favorites` | 회원 즐겨찾기 | 5 |
| `title_history` | 연도별 직함 이력 | 5 |

### 오늘 추가된 DB 컬럼 (세션 6)

| 테이블 | 컬럼 | 용도 |
|--------|------|------|
| `posts` | `linked_schedule_id` | 공지-일정 연동 (FK → schedules) |
| `schedules` | `linked_post_id` | 일정-공지 연동 (FK → posts) |
| `users` | `industry` VARCHAR(30) | 업종 대분류 코드 |
| `users` | `industry_detail` VARCHAR(100) | 업종 상세 |
| `comments` | `schedule_id` | 일정 댓글용 (FK → schedules) |

### 오늘 생성된 API 엔드포인트

| 라우트 파일 | 엔드포인트 | 메서드 | 용도 |
|-------------|-----------|--------|------|
| `attendance.js` | `/api/attendance` | POST | 투표 설정 생성 (관리자) |
| | `/api/attendance/:configId` | PUT | 투표 설정 수정 (관리자) |
| | `/api/attendance/:scheduleId` | GET | 투표 현황 조회 |
| | `/api/attendance/:configId/vote` | POST | 투표하기 (UPSERT) |
| | `/api/attendance/:configId/results` | GET | 투표 결과 상세 |
| | `/api/attendance/:configId/close` | POST | 조기 마감 (관리자) |
| `favorites.js` | `/api/favorites/:targetId` | POST | 즐겨찾기 추가 |
| | `/api/favorites/:targetId` | DELETE | 즐겨찾기 해제 |
| | `/api/favorites` | GET | 내 즐겨찾기 목록 |
| `titles.js` | `/api/titles/:userId` | GET | 직함 이력 조회 |
| | `/api/titles/:userId` | POST | 직함 추가 (관리자) |
| | `/api/titles/:userId/:titleId` | PUT | 직함 수정 (관리자) |
| | `/api/titles/:userId/:titleId` | DELETE | 직함 삭제 (관리자) |
| `industries.js` | `/api/industries` | GET | 업종 카테고리 목록 (13개) |
| `schedules.js` | `/api/schedules/:id/comments` | GET | 일정 댓글 목록 |
| | `/api/schedules/:id/comments` | POST | 일정 댓글 작성 |
| | `/api/schedules/:id/comments/:commentId` | DELETE | 일정 댓글 삭제 |

### 오늘 수정된 기존 파일

| 파일 | 변경 내용 |
|------|-----------|
| `api/routes/auth.js` | SSN ssnFront+ssnBack 분리, 유효성 검증, debug/stack 제거 |
| `api/routes/members.js` | is_favorited 필드 + industry 필터 + industry_name 매핑 |
| `api/routes/notices.js` | notices 테이블 → posts 테이블 기반 하위호환 프록시로 전환 |
| `api/routes/posts.js` | 공지-일정 연동 (트랜잭션 생성/동기화/삭제), linked_schedule 조회 |
| `api/routes/schedules.js` | linked_post 조회 + 일정 댓글 CRUD |
| `api/routes/profile.js` | industry/industry_detail 필드 조회/수정 + 유효성 검증 |
| `api/server.js` | attendance, favorites, titles, industries 라우터 등록 |

### Must-have 진행률 (기획자 전달 기준)
- **완료**: M-02, M-10, M-11, M-12, M-13, M-14, M-17 — **7/7 전체 완료** ✅

### 프론트엔드 전달사항
1. 회원가입 API `ssn` → `ssnFront` + `ssnBack` 분리 전송 필요 (`web/js/auth.js`)
2. 즐겨찾기 UI 구현 필요 (별표 토글 + 회원 목록 즐겨찾기 섹션)
3. 출석 투표 UI 구현 필요 (일정 상세 내 투표 카드)
4. 직함 이력 UI 구현 필요 (회원 상세에서 연도별 직함 표시)
5. **[신규]** 공지 작성 폼에 "일정 첨부" 토글 + 일정 정보 입력 섹션 추가 필요 (schedule 객체 전송)
6. **[신규]** 일정 상세에서 "연결된 공지" 링크 표시 (linked_post 필드 활용)
7. **[신규]** 회원 목록에 업종 필터 드롭다운 추가 (?industry= 파라미터)
8. **[신규]** 프로필 수정에 업종 선택 필드 추가 (GET /api/industries로 목록 조회)
9. **[신규]** 일정 상세에 댓글 섹션 추가 (GET/POST /api/schedules/:id/comments)

---

## 2026-03-10 세션 8: M-10 관리자 지정 필드 수정 제한

### DB 변경
- `users.join_number` VARCHAR(20) 컬럼 추가

### 관리자 전용 필드 목록
- `position` (JC 직책), `department` (소속 위원회), `join_number` (기수), `role` (역할), `status` (상태)

### PUT /api/profile 변경
- 일반 회원이 위 5개 필드를 요청에 포함해도 **무시(strip)** — 에러 없이 나머지 필드만 저장
- 관리자(admin/super_admin)는 자신의 position/department/join_number도 수정 가능
- 로그에 무시된 필드명 기록 (`[M-10] 일반 회원(id=N)이 관리자 전용 필드 수정 시도 → 무시됨`)

### PUT /api/admin/members/:id 신규
- 관리자가 특정 회원의 position/department/join_number/role/status/name/phone/company 수정 가능
- role 변경: super_admin만 super_admin 부여 가능, 자기 자신 역할 변경 금지
- status 변경: active/pending/suspended/withdrawn 유효성 검증
- 동적 SET 절: 전달된 필드만 UPDATE (불필요한 NULL 덮어쓰기 방지)

### 커밋
- `a9b09d2` — feat(M-10): 관리자 지정 필드 수정 제한
- Railway 자동 배포 완료

---

## 2026-03-10 세션 7: 긴급 버그 수정 (BUG-S4-001)

### BUG-S4-001: GET /api/members → 500 Internal Server Error
- **위치**: `api/routes/members.js` 46~48행
- **원인**: 세션 6 M-13 업종 검색 구현 시 count 쿼리가 중복 작성됨
  - 1차 count 쿼리: `WHERE u.status = 'active'` (placeholder 0개) + `params.slice(2)` = `[userId]` (1개) → **바인딩 불일치 에러**
  - 2차 count 쿼리: 올바르게 구성 (industry 필터 시에만 `$1` 추가)
- **수정**: 1차 count 쿼리(46~49행) 5줄 삭제, 2차 count 쿼리만 유지
- **검증**: 프로덕션 DB 직접 쿼리 — 필터 없이/있이 모두 정상 동작 확인
- **커밋**: `7205857` — fix: GET /api/members 500 에러 수정
- **배포**: `git push origin main` → Railway 자동 배포

---

## 2026-03-10 세션 6: 3차 스프린트 (M-02, M-12, M-13, 일정 댓글)

### DB 마이그레이션 (Railway PostgreSQL)
- `posts.linked_schedule_id` INTEGER REFERENCES schedules(id) ON DELETE SET NULL
- `schedules.linked_post_id` INTEGER REFERENCES posts(id) ON DELETE SET NULL
- `users.industry` VARCHAR(30), `users.industry_detail` VARCHAR(100)
- `comments.schedule_id` INTEGER REFERENCES schedules(id) ON DELETE CASCADE
- 인덱스 4개 생성 (idx_posts_linked_schedule, idx_schedules_linked_post, idx_users_industry, idx_comments_schedule_id)
- 마이그레이션 파일: `database/migrations/005_sprint3_schema.sql`

### M-02: 공지 라우트 통합
- `api/routes/notices.js`를 notices 테이블 → posts 테이블 (category='notice') 기반으로 전환
- 모든 CRUD (GET/POST/PUT/DELETE) + 목록/상세 조회가 posts 테이블 참조
- 하위호환 유지: 기존 `/api/notices` 엔드포인트 그대로 동작
- 주의: 구 notices 테이블 데이터는 posts 테이블에 없음 (프론트에서 이미 posts 사용 중이므로 무관)

### M-12: 공지-일정 연동 API
- POST /api/posts: `schedule` 객체 포함 시 트랜잭션으로 일정 동시 생성 + `vote_config` 지원
- PUT /api/posts/:id: `schedule` 객체로 연결 일정 동기화 (업데이트/신규/해제)
- DELETE /api/posts/:id: `?delete_linked_schedule=true` 옵션으로 연결 일정 동시 삭제
- GET /api/posts/:id: `linked_schedule` 객체 포함 (id, title, start_date, end_date, location, category)
- GET /api/schedules/:id: `linked_post` 객체 포함 (id, title, created_at, author_name)
- `database.js`의 `transaction()` 헬퍼 활용

### M-13: 업종 검색 API
- GET /api/members: `?industry=it` 쿼리 파라미터로 업종 필터링
- GET /api/members/search: `?q=` + `?industry=` AND 조합 검색
- GET /api/members/:id: industry, industry_detail, industry_name 필드 추가
- GET /api/industries: 업종 카테고리 13개 목록 반환 (law, finance, medical, ...)
- PUT /api/profile: industry, industry_detail 수정 + 코드 유효성 + 100자 제한 검증
- GET /api/profile: industry, industry_detail 필드 포함

### 일정 댓글 API
- GET /api/schedules/:id/comments: 댓글 목록 (대댓글 구조화, author 객체 포함)
- POST /api/schedules/:id/comments: 댓글 작성 (대대댓글 방지 검증)
- DELETE /api/schedules/:id/comments/:commentId: 댓글 삭제 (soft delete)
- comments 테이블의 schedule_id 컬럼 활용 (post_id와 별도)

### 커밋
- `759fe93` — db: Sprint 3 스키마 마이그레이션
- `2828e7f` — refactor(M-02): 공지 라우트 통합
- `01d47f6` — feat(M-12): 공지-일정 연동 API
- `5fd783b` — feat(M-13): 업종 검색 API
- `26f3a2d` — feat: 일정 댓글 API

### 프로덕션 DB 스키마 (세션 6 이후)
```
posts: ... + linked_schedule_id (FK → schedules, ON DELETE SET NULL)
schedules: ... + linked_post_id (FK → posts, ON DELETE SET NULL)
users: ... + industry VARCHAR(30), industry_detail VARCHAR(100)
comments: ... + schedule_id (FK → schedules, ON DELETE CASCADE)
```

---

## 2026-03-10 세션 5: 출석투표/즐겨찾기/직함이력 API + DB 테이블

### DB 테이블 생성 (Railway PostgreSQL)
1. **attendance_config** — 투표 설정 (schedule_id, vote_type, deadline, quorum, cost, is_active, closed_at)
2. **attendance_votes** — 투표 기록 (config_id, user_id, vote: attend/absent/undecided, UPSERT)
3. **favorites** — 즐겨찾기 (user_id, target_member_id, UNIQUE)
4. **title_history** — 직함 이력 (user_id, year, title, position, UNIQUE(user_id,year))

### 신규 API 라우트
- `api/routes/attendance.js` — POST 생성, PUT 수정, GET 현황, POST 투표, GET 결과, POST 마감
- `api/routes/favorites.js` — POST 추가, DELETE 해제, GET 목록
- `api/routes/titles.js` — GET 이력, POST 추가, PUT 수정, DELETE 삭제

### 기존 API 수정
- `api/routes/members.js` — GET /api/members에 `is_favorited` 필드 추가 (LEFT JOIN favorites)
- `api/server.js` — 3개 라우터 등록 (/api/attendance, /api/favorites, /api/titles)

### 커밋
- `29badd0` — feat: 출석투표/즐겨찾기/직함이력 API + DB 테이블 (프론트 커밋에 포함)
- Railway 자동 배포 완료

### 프로덕션 DB 스키마 추가
```
attendance_config: id, schedule_id(UNIQUE), vote_type, quorum_count, quorum_basis, cost_per_person, deadline, is_active, closed_at, created_by, created_at, updated_at
attendance_votes: id, config_id, user_id, vote(attend/absent/undecided), voted_at, updated_at, UNIQUE(config_id,user_id)
favorites: id, user_id, target_member_id, created_at, UNIQUE(user_id,target_member_id)
title_history: id, user_id, year, title, position, created_at, UNIQUE(user_id,year)
```

---

## 2026-03-10 세션 4: 중복회원 확인 + SSN API 개선

### 작업 1: 중복 회원(id=7) 확인
- DB 조회 결과: id=7 이미 세션 2에서 삭제 완료 (rows: [])
- `minsoo@jc.com` 검색 결과도 0건 — 정리 완료 상태

### 작업 2: 주민번호 API 분리 수신 (ssnFront + ssnBack)
- 파일: `api/routes/auth.js` 58~93행
- **변경 전**: 단일 `ssn` 필드 수신 → 서버에서 숫자 파싱
- **변경 후**: `ssnFront`(앞6자리) + `ssnBack`(뒤1자리) 분리 수신
- **유효성 검증 추가**:
  - ssnFront: 정확히 6자리 숫자 + YYMMDD 날짜 유효성 (월 1~12, 일 1~31)
  - ssnBack: 정확히 1자리, 1~4만 허용
- **DB 저장 형식**: `XXXXXX-X` (뒷번호 2~7자리 절대 미저장)
- **보안 수정**: signup 에러 응답에서 `debug`, `stack` 필드 제거

### 커밋
- `aea28ee` — fix: 주민번호 API 분리수신(ssnFront+ssnBack) + 유효성 검증 + debug 노출 제거
- Railway 자동 배포 트리거됨

### ⚠️ 프론트엔드 전달사항
- 회원가입 API 요청 본문 변경: `ssn` → `ssnFront` + `ssnBack` 분리 전송 필요
- 프론트 `web/js/auth.js` 수정 필요 (백엔드는 web/ 수정 불가)

---

## 2026-03-10 세션 3: 긴급 장애 조사

### 증상
- 배포 사이트 모든 페이지에서 데이터 로딩 실패 (홈/게시판/회원/프로필)

### 조사 결과: 백엔드 API 100% 정상
- 프로덕션 서버 기동 정상 (`/health` → `healthy`)
- 로그인 정상 (`POST /api/auth/login` → 200, 토큰 발급)
- 전체 엔드포인트 테스트 8/8 통과:
  - `/api/auth/me` → 200 (사용자 정보 정상)
  - `/api/posts` → 200 (2건)
  - `/api/posts?category=notice` → 200 (2건)
  - `/api/posts?category=general` → 200 (0건)
  - `/api/notices` → 200 (1건)
  - `/api/schedules` → 200 (14건)
  - `/api/members` → 200 (33명)
  - `/api/profile` → 200 (프로필 정상)
- SSN 보안 수정은 `signup` 라우트 내부만 변경 → 인증/라우팅 영향 없음

### 원인 추정 (백엔드 아님)
1. **nginx 캐시 설정**: JS 파일 `expires 1y + immutable` (nginx.conf 64행) → 브라우저에 구버전 JS 캐시 가능
2. **프론트엔드 JS 오류**: `web/js/` 코드 문제 → 프론트엔드 에이전트 확인 필요
3. **해결 시도**: 사용자에게 Ctrl+Shift+R (하드 리로드) 권장

---

## 2026-03-10 세션 2 작업 요약

### 작업 1: 경민수 테스트 계정 삭제
- id=7 (`minsoo@jc.com`) 회원 삭제 완료
- 관련 posts/comments/likes 없었음 (FK 정리 불필요)
- 남은 회원 수: 33명

### 작업 2: 남은 테스트 게시글 삭제
- id=2 "dfsdf", id=7 "ft" 삭제 완료
- 남은 게시글: id=1 "신나는 월례회"(notice), id=3 "게시판 완성하고싶다"(notice)

### 작업 3: 회원가입 SSN 필드 보안 강화
- 파일: `api/routes/auth.js` 58~66행
- 변경 전: 프론트에서 보낸 ssn 값을 그대로 `+ '******'` 붙여서 저장 → 전체 주민번호 전송 시 그대로 저장되는 위험
- 변경 후: 서버에서 숫자만 추출 → 앞 6자리(생년월일) + 뒤 1자리(성별)만 추출 → `XXXXXX-X******` 형태로 저장
- 전체 주민번호가 전송되더라도 서버에서 7자리만 저장하여 개인정보 보호

### 프로덕션 DB 스키마 정정 (추가)
- `posts` 테이블에 `is_deleted` 컬럼 없음 확인
- `users` 테이블에 `is_approved` 컬럼 없음 (status 필드로 관리: active/pending 등)

---

## 2026-03-10 세션 1 작업 요약

### 작업 1: 테스트 데이터 정리 (프로덕션 DB)
- 에이전트들이 테스트로 작성한 게시글 6건 삭제 완료
- 삭제 대상 (title 기준: "에이전트", "작업 보고서", "final", "test"):
  - id=8: "final"
  - id=9: "[테스터 에이전트] 2026-03-10 전체 기능 테스트 완료 보고서"
  - id=10: "[프론트엔드 에이전트] 첫 작업 보고서 (2026-03-10)"
  - id=11: "[2026-03-10] 디자이너 에이전트 업무 보고"
  - id=12: "[기획자 에이전트] 오늘 하루 작업 보고서"
  - id=13: "⚡ [백엔드 에이전트] 2026-03-10 작업 보고서"
- 연관 댓글 0건, 좋아요 0건 (없었음)
- `read_status` 테이블은 프로덕션 DB에 존재하지 않음 (메모리 수정 필요)

### 작업 2: 경민수 중복 회원 확인
- 결과: **동명이인 2명 존재** (중복이 아닌 별개 계정)
  - id=5: `minsu@jc.com` / 010-1234-5678 / 2026-02-20 생성 → **시드 데이터 원본**
  - id=7: `minsoo@jc.com` / 010-2462-8582 / 2026-03-08 생성 → 나중에 추가된 계정
- 이메일, 전화번호 모두 다르므로 실제 중복이 아님
- **사장 판단 필요**: id=7(`minsoo@jc.com`)이 의도된 계정인지 테스트 계정인지 확인 필요

### 프로덕션 DB 스키마 정정
- `posts` 테이블에 `is_deleted` 컬럼 없음 (이전 로그 스키마 수정 필요)
- `read_status` 테이블 존재하지 않음 (이전 로그에서 존재한다고 기록됨)

---

## 2026-03-09 세션 작업 요약

### 커밋 이력 (시간순)

| # | 커밋 해시 | 내용 | 수정 파일 |
|---|-----------|------|-----------|
| 1 | `8a7eae7` | 일정 상세/댓글/공감 API 500 에러 수정 | schedules.js, posts.js |
| 2 | `575d495` | 댓글 API 에러 메시지 임시 노출 (디버그) | posts.js |
| 3 | `4f639e9` | 댓글 API 프로덕션 DB 호환성 수정 | posts.js |
| 4 | `7176b0b` | BUG-004~006 (reset-password, nginx, read_status) | auth.js, posts.js, nginx.conf |
| 5 | `6a1b84a` | reset-password 디버그 코드 제거 | auth.js |
| 6 | `0748410` | 공감 회귀 버그 + reset-password NFC 정규화 | posts.js, auth.js |
| 7 | `f8bb021` | reset-password 이름 매칭 강화 + 에러 메시지 개선 | auth.js |

---

### 수정된 버그 목록

#### BUG-001: GET /api/schedules/:id → 500 에러
- **원인**: `schedules` 테이블에 `views` 컬럼 없음. 코드에서 `UPDATE schedules SET views = views + 1` 실행
- **수정**: views UPDATE 쿼리 제거 (`api/routes/schedules.js`)
- **상태**: 완료

#### BUG-002: GET /api/members → 무한 로딩
- **원인**: 백엔드 API 자체는 정상 (34명 반환). 프론트엔드 문제
- **상태**: 백엔드 이상 없음. 프론트엔드 에이전트에게 전달 필요

#### BUG-003: GET /api/posts/:id/comments → 500 에러
- **원인**: 프로덕션 DB comments 테이블에 `is_deleted`, `parent_id` 컬럼 부재
- **수정**: 폴백 쿼리 추가 (컬럼 없을 때 기본 쿼리로 전환)
- **추가 조치**: 프로덕션 DB에 ALTER TABLE로 누락 컬럼 추가 완료
- **상태**: 완료

#### BUG-004: POST /api/auth/reset-password → 404 에러
- **원인**: 한글 유니코드 인코딩 불일치 (NFC vs NFD) + 이름 공백 차이
- **수정**: SQL REPLACE로 공백 제거 비교, NFC 정규화, 에러 메시지 분리
- **상태**: 완료

#### BUG-005: GET /api → 301 리다이렉트
- **원인**: nginx `location /api/` (trailing slash)가 `/api` 미매칭
- **수정**: `location /api`로 변경 (`nginx.conf`)
- **상태**: 완료

#### BUG-006: DB 스키마-코드 불일치
- **원인**: 여러 컬럼명 불일치
  - `comments.parent_comment_id` → 실제: `parent_id`
  - `likes.member_id` → 코드가 `user_id`로 잘못 변경됨 (회귀)
  - `read_status` 테이블 → 코드가 `post_reads`로 참조
- **수정**: 모두 프로덕션 DB 스키마에 맞게 수정
- **상태**: 완료

---

### 프로덕션 DB 변경 이력

| 작업 | SQL | 결과 |
|------|-----|------|
| comments 컬럼 추가 | `ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false` | 완료 |
| comments 컬럼 추가 | `ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE` | 이미 존재 (스킵) |
| 비밀번호 일괄 복원 | `UPDATE users SET password_hash = ... WHERE ...` | 34명 test1234로 복원 |

---

### 프로덕션 DB 실제 스키마 (코드 작성 시 참고)

```
users: id, email, password_hash, name, phone, address, ..., role, status, company, position, department, ...
posts: id, author_id, title, content, images, category, views, likes_count, comments_count, is_deleted, ...
comments: id, post_id, author_id, content, parent_id, parent_comment_id(레거시), is_deleted, created_at, updated_at
likes: id, member_id(주의!), post_id, created_at  ← user_id 아님!
schedules: id, title, description, start_date, end_date, location, category, created_by, ... (views 컬럼 없음!)
read_status: id, user_id, post_id, notice_id, schedule_id, read_at  ← post_reads 아님!
```

### 주의사항 (다음 세션에서 반드시 확인)
1. **likes 테이블 컬럼은 `member_id`** — `user_id`가 아님! 절대 혼동 금지
2. **schedules 테이블에 `views` 컬럼 없음** — 조회수 기능 추가 시 ALTER TABLE 필요
3. **comments 테이블에 `parent_comment_id`(레거시) 컬럼 존재** — 사용하지 않음, 삭제 권장
4. **읽음 추적 테이블은 `read_status`** — `post_reads` 아님
5. **비밀번호 재설정 테스트 후 반드시 비밀번호 복원** (test1234)

---

### 기획자 전달 — 신규 작업 (2026-03-09)

> 전체 우선순위: `Docs/priority-matrix-2026-03-09.md` 참조

#### Must-have (앱)
- [ ] M-02: 공지 라우트 통합 (notices.js 폐기 → posts.js category='notice')
- [ ] M-10: 관리자 지정 필드 수정 제한 (JC직책/소속/기수)
- [x] M-11: 참석 투표 데이터 모델+API → **세션 5에서 완료** (attendance_config + attendance_votes + 6개 엔드포인트)
- [ ] M-12: 공지-일정 연동 API → `vision-roadmap.md` R-07
- [ ] M-13: 업종 검색 API (GET /api/members/search?industry=)
- [x] M-14: 직함 관리 (변경→즉시 반영+권한 연동) → **세션 5에서 완료** (title_history + CRUD API)
- [x] M-17: 즐겨찾기 API (favorites 테이블) → **세션 5에서 완료** (favorites + 3개 엔드포인트 + members에 is_favorited)

#### Must-have (관리자 웹 API)
- [ ] Audit Log 테이블 생성 → `admin-web/03-features.md` §9
- [ ] 권한 매트릭스 테이블 (positions + position_permissions)
- [ ] 관리자 웹 API 30+개 → `admin-web/03-features.md` §10

---

### 미완료/건의 사항

| 항목 | 내용 | 우선순위 |
|------|------|----------|
| comments.parent_comment_id 삭제 | 레거시 컬럼, 코드 미사용 | 낮음 |
| likes 테이블 member_id → user_id 통일 | DB ALTER + 코드 수정 필요 | 중간 |
| schedules에 views 컬럼 추가 | 조회수 기능 필요 시 | 낮음 |
| ~~auth.js signup 에러에 debug/stack 노출~~ | **세션 4에서 제거 완료** | ~~높음~~ 완료 |

---

### DB 접속 정보 (세션 간 공유용)
- **Railway PostgreSQL**: `postgresql://postgres:lnpAyUJCakMuxZfCufYnWAoOCHQkEELA@hopper.proxy.rlwy.net:46513/railway`
- **접속 방법**: `cd /e/app/jc/api && node -e "const {Pool}=require('pg'); ..."`
- **pg 모듈 위치**: `api/node_modules/pg` (프로젝트 루트 아닌 api/ 폴더에서 실행)

---

### 시드 계정 (테스트용)
| 이메일 | 이름 | 역할 | 비밀번호 |
|--------|------|------|----------|
| admin@jc.com | 총관리자 | super_admin | test1234 |
| kim.yh@yjc-test.kr | 김영호 | super_admin | test1234 |
| lee.jy@yjc-test.kr | 이준영 | admin | test1234 |
| park.sm@yjc-test.kr | 박성민 | admin | test1234 |
| minsu@jc.com | 경민수 | member | test1234 |
| 나머지 26명 | @yjc-test.kr | member | test1234 |
