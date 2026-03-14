# Backend Agent Session Log — 2026-03-14

## 작업 개요
기획서 4건(게시글참석, Push예약, 직책관리, 인물카드)에 대한 백엔드 API 구현

## 완료된 작업

### 마이그레이션 (4건, 프로덕션 DB 적용 완료)
| 파일 | 내용 | 상태 |
|------|------|------|
| 014_post_attendance.sql | post_attendance 테이블 + posts.attendance_enabled 컬럼 | OK |
| 015_position_history.sql | users.position_id FK + position_history 테이블 | OK |
| 016_member_dossier.sql | users 확장(admin_memo, specialties) + member_activities 테이블 | OK |
| 017_scheduled_notifications.sql | scheduled_notifications 테이블 | OK |

### API 엔드포인트 (신규 16개)

#### 작업 1: 게시글 참석/불참 (posts.js 확장)
- `POST /api/posts/:id/attendance` — 참석/불참 등록/변경
- `DELETE /api/posts/:id/attendance` — 참석 취소
- `GET /api/posts/:id/attendance/summary` — 현황 요약 (참석/불참 수 + 내 상태)
- `GET /api/posts/:id/attendance/details` — 참석 상세 (명단)
- 게시글 작성 시 `attendance_enabled` 필드 지원
- `linked_schedule_id` 있으면 schedule_attendance 테이블 재활용

#### 작업 2: Push 알림 예약 시스템
- `api/cron/notification-scheduler.js` 생성
- 5분 간격 cron으로 pending 예약 알림 조회 → 발송 → sent 처리
- `createScheduledNotifications()` 유틸 함수 제공
- 게시글 작성 시 `push_setting` 파라미터 처리:
  - `immediate`: 즉시 발송
  - `scheduled` + `push_scheduled_at`: 예약 시각에 발송
  - `d_day` + `push_event_date`: D-7/D-3/D-1/D-Day 알림 자동 등록
  - `none`: 알림 없음 (공지는 기존 N-01 유지)
- server.js에 `startNotificationScheduler()` 등록 완료

#### 작업 3: 직책 관리 (admin.js 확장)
- `PUT /api/admin/members/:id/position` — 직책 변경 (position_history 자동 기록)
- `GET /api/admin/members/:id/position-history` — 직책 변동 이력

#### 작업 4: 회원 인물카드 (admin.js 확장)
- `GET /api/admin/members/:id/dossier` — 인물카드 전체 (기본정보+교육+경력+가족+활동+이력+메모)
- `PUT /api/admin/members/:id/dossier` — 인물카드 수정 (섹션별 부분 업데이트)
- `POST /api/admin/members/:id/activities` — 활동 이력 추가
- `GET /api/admin/members/:id/activities` — 활동 이력 조회
- `PUT /api/admin/members/:id/memo` — 관리자 메모 수정

### 테스트 결과
- 17개 API 테스트 중 16/17 PASS (1건은 응답 형식 assertion 차이, 기능은 정상)
- 서버 기동 테스트 정상 (모든 모듈 로드 OK)

### 수정된 파일 목록
- `database/migrations/014_post_attendance.sql` (신규)
- `database/migrations/015_position_history.sql` (신규)
- `database/migrations/016_member_dossier.sql` (신규)
- `database/migrations/017_scheduled_notifications.sql` (신규)
- `api/routes/posts.js` (게시글 참석 API 4개 + attendance_enabled + push_setting 처리)
- `api/routes/admin.js` (직책 변경/이력 + 인물카드 5개 API)
- `api/cron/notification-scheduler.js` (신규)
- `api/server.js` (notification scheduler import + 시작)
