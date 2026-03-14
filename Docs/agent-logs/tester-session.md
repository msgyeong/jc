# 테스터 에이전트 검증 결과 (2026-03-14)

## 검증 대상: Push 알림, 참석/불참 기능, 참석자 명단, 환경설정

---

## 1. Push 알림 기능

### 백엔드 API: ✅ 구현됨
- **api/routes/notifications.js** — 알림 + 푸시 구독 라우터 통합
  - `GET /api/notifications` — 알림 목록 (페이지네이션) ✅
  - `POST /api/notifications/:id/read` — 읽음 처리 ✅ (⚠️ 기획서는 PUT이나 POST로 구현됨)
  - `POST /api/notifications/read-all` — 전체 읽음 처리 ✅
  - `GET /api/notifications/unread-count` — 안읽은 수 ✅
  - `GET /api/notifications/settings` — 알림 설정 조회 ✅
  - `PUT /api/notifications/settings` — 알림 설정 수정 ✅
- **푸시 구독 엔드포인트 (pushRouter)**:
  - `GET /api/push/vapid-key` — VAPID 공개키 반환 ✅
  - `POST /api/push/subscribe` — 구독 등록 ✅
  - `DELETE /api/push/subscribe` — 구독 해제 ✅
- **api/utils/pushSender.js** — web-push 기반 발송 로직 ✅
  - `sendPushToUser()` — 개별 사용자 발송 ✅
  - `sendPushToAll()` — 전체 발송 (excludeUserId 지원) ✅
  - 알림 유형별 설정 확인 후 발송 (TYPE_TO_SETTING 매핑) ✅
  - notification_log 자동 기록 ✅
  - 만료된 구독(410/404) 자동 삭제 ✅

### 알림 생성 트리거: ✅ 구현됨
| 유형 | 트리거 | 발송 방식 | 구현 위치 |
|------|--------|-----------|-----------|
| N-01 | 공지 등록 | sendPushToAll | api/routes/posts.js:507,536 |
| N-02 | 일정 등록 | sendPushToAll | api/routes/schedules.js:171 |
| N-03 | 일정 D-1 리마인더 | sendPushToUser (cron) | api/utils/reminderCron.js:44 |
| N-04 | 일정 변경 | sendPushToAll | api/routes/schedules.js:237 |
| N-05 | 댓글 등록 (일정) | sendPushToUser | api/routes/schedules.js:436 |
| N-06 | 생일 알림 | sendPushToUser (cron) | api/utils/reminderCron.js:90 |

### 생일 알림 cron: ✅ 구현됨
- **api/utils/reminderCron.js** — node-cron 기반
- 매일 09:00 KST 실행 (`0 0 * * *` UTC)
- D-1 일정 리마인더 + 생일 알림 통합 실행
- birthday_push 설정 ON인 사용자만 대상
- 본인 제외 발송

### Service Worker: ✅ 구현됨
- **web/sw.js** — Push 이벤트 핸들링
  - `push` 이벤트 → `showNotification()` ✅
  - `notificationclick` → 클라이언트 포커스 or 새 창 ✅
  - `install` → skipWaiting ✅
  - `activate` → clients.claim ✅

### Web Push 구독 (프론트): ✅ 구현됨
- **web/js/push.js** — 완전한 구독/해제 모듈
  - SW 등록 + 기존 구독 확인 ✅
  - VAPID key 기반 PushManager.subscribe ✅
  - 구독 유도 배너 (3회 dismiss 후 미표시) ✅
  - iOS standalone 체크 + PWA 설치 안내 ✅
  - 알림 클릭 → 화면 이동 (handleNotificationNavigation) ✅

### DB 마이그레이션: ✅
- **006_web_push.sql** — push_subscriptions, notification_settings, notification_log 테이블
- **011_birthday_push.sql** — notification_settings에 birthday_push 컬럼 추가

### 프론트엔드 UI: ✅ 구현됨
- **web/js/notifications.js** — 알림 센터 화면
  - 알림 목록 렌더링 (유형별 아이콘) ✅
  - 개별 읽음 처리 + 전체 읽음 ✅
  - 🔔 앱바 배지 (99+ 표시) ✅
  - 시간 표시 (방금/N분 전/N시간 전/어제/N일 전) ✅
  - 빈 상태/에러 상태 UI ✅
  - 알림 클릭 → 해당 화면 이동 ✅
- **web/index.html** — notifications-screen 정의 (L932) ✅
- **web/index.html** — 🔔 아이콘 + 배지 (L536-541) ✅

### 프로덕션 DB 반영: ✅
- push_subscriptions ✅
- notification_settings ✅
- notification_log ✅

### ⚠️ 발견 이슈
1. **읽음 처리 HTTP 메소드 불일치**: 기획서는 `PUT /api/notifications/:id/read`이나, 실제 구현은 `POST`
   - 프론트엔드(notifications.js:50)도 POST로 호출하므로 **동작에는 문제 없음**
2. **notification-settings.js에 birthday_push 토글 미표시**: 알림 설정 화면에 4개 토글(공지/일정/리마인더/댓글)만 렌더링되고, **생일 알림 토글이 UI에 없음**
   - 백엔드는 birthday_push 지원하지만 프론트에서 토글을 안 보여줌

---

## 2. 참석/불참 기능

### 구현 방식 확인
⚠️ **두 가지 참석 시스템이 병존**:

#### (A) schedule_attendance 방식 (schedules.js 라우터 내장)
- **api/routes/schedules.js** L492-718에 엔드포인트 존재
  - `POST /api/schedules/:id/attendance` ✅
  - `DELETE /api/schedules/:id/attendance` ✅
  - `GET /api/schedules/:id/attendance/summary` ✅
  - `GET /api/schedules/:id/attendance/details` ✅
  - `GET /api/schedules/:id/attendance/export` ✅ (CSV)
- status: `attending` / `not_attending`
- 마이그레이션: **012_schedule_attendance.sql** ✅

#### (B) attendance_config + attendance_votes 방식 (attendance.js 별도 라우터)
- **api/routes/attendance.js** — 투표 설정 기반 시스템
  - `POST /api/attendance` — 투표 설정 생성
  - `PUT /api/attendance/:configId` — 설정 수정
  - `GET /api/attendance/:scheduleId` — 현황 조회
  - `POST /api/attendance/:configId/vote` — 투표 (attend/absent/undecided)
  - `GET /api/attendance/:configId/results` — 상세 결과
  - `POST /api/attendance/:configId/close` — 조기 마감

### 백엔드 API: ✅ 구현됨 (두 시스템 모두)
### DB 마이그레이션: ✅
- schedule_attendance 테이블 ✅ (프로덕션 확인)
- attendance_config 테이블 ✅ (프로덕션 확인)
- attendance_votes 테이블 ✅ (프로덕션 확인)

### 프론트엔드 UI: ✅ 구현됨
- **web/js/schedules.js** — 일정 상세 화면에서:
  - 출석 투표 섹션 (attendance_config 방식) ✅
    - 참석/불참/미정 3버튼 ✅
    - 투표 결과 프로그레스바 ✅
    - 마감 표시 ✅
    - 응답 N명 / 전체 N명 표시 ✅
  - 참석자 명단 섹션 (loadAttendeeList) ✅
    - 참석 투표한 회원 이름 나열 (5명 + 외 N명) ✅
  - 투표 제출 → 즉시 UI 갱신 ✅
  - 일정 등록 시 참석 투표 설정 옵션 (접이식) ✅
    - 투표 유형 선택 (이사회/월례회/일반) ✅
    - 마감일 설정 ✅

### ⚠️ 발견 이슈
1. **두 참석 시스템 병존**: schedule_attendance API와 attendance_config/votes API가 모두 존재. 프론트엔드는 **attendance_config 방식만 사용** (`/attendance/:scheduleId`). schedule_attendance 엔드포인트는 프론트에서 호출하지 않아 사실상 미사용.
2. **접기/펼치기 명단 UI 미구현**: 참석자 명단이 5명까지만 표시되고 "외 N명"으로 축약되지만, 클릭하여 전체 명단을 보는 접기/펼치기 기능은 없음.

---

## 3. 참석자 명단 표시

### 프론트엔드: ⚠️ 부분 구현
- 참석자 이름 5명 + "외 N명" 표시 ✅
- **접기/펼치기 미구현** ❌ — 전체 명단을 보려면 별도 동작이 없음
- 참석/불참 그룹별 분리 표시 ❌ — 참석자만 표시하고 불참자/미정/미응답 명단은 프론트에서 미표시
- 관리자 웹(web/admin/)에서 참석 현황 확인 ❌ — admin/js/schedules.js에 attendance 관련 코드 없음

---

## 4. DB 마이그레이션 실행 여부 (프로덕션)

### ✅ 프로덕션 DB에 확인된 테이블 (7개)
| 테이블명 | 존재 |
|----------|------|
| attendance_config | ✅ |
| attendance_votes | ✅ |
| notification_log | ✅ |
| notification_settings | ✅ |
| push_subscriptions | ✅ |
| schedule_attendance | ✅ |
| user_settings | ✅ |

---

## 5. 환경설정 기능

### 백엔드 API: ✅ 구현됨
- **api/routes/settings.js**
  - `GET /api/settings` — 환경설정 조회 (theme, font_size) ✅
  - `PUT /api/settings` — 환경설정 변경 (유효성 검증 포함) ✅
- 마이그레이션: **013_user_settings.sql** ✅

### 프론트엔드 UI: ✅ 구현됨
- **web/js/settings.js** — 환경설정 화면
  - 다크모드 토글 ✅ (localStorage + 서버 동기화)
  - 글꼴 크기 선택 (작게/보통/크게/아주 크게) ✅ (미리보기 포함)
  - 알림 설정 진입 (`showNotificationSettingsScreen()`) ✅
  - 캐시 삭제 ✅
  - 비밀번호 변경 ✅
  - 로그아웃 ✅
  - 회원 탈퇴 (비밀번호 확인 + 사유 입력) ✅
  - 이용약관 / 개인정보 처리방침 (placeholder) ⚠️
  - 앱 버전 표시 ✅
- **web/js/notification-settings.js** — 알림 설정 화면
  - 전체 알림 마스터 토글 ✅
  - 공지 알림 토글 ✅
  - 일정 알림 토글 ✅
  - 일정 리마인더 토글 ✅
  - 댓글 알림 토글 ✅
  - 생일 알림 토글 ❌ (UI에 미표시)
  - 푸시 상태 표시 (활성/비활성) ✅
  - 푸시 재등록 버튼 ✅

### ⚠️ 발견 이슈
1. **알림 설정 토글 5개/6개 불일치**: 기획서 요구 6개(공지/일정/리마인더/댓글/생일/전체) 중 **생일 알림 토글이 UI에 미표시** (4개 유형 + 전체 = 5개만 보임)
2. **이용약관/개인정보 처리방침**: `alert()` placeholder → 실제 내용 미구현

---

## 종합 요약

| 기능 | 백엔드 API | DB 마이그레이션 | 프론트엔드 UI | 프로덕션 DB |
|------|-----------|----------------|-------------|------------|
| Push 알림 | ✅ 구현됨 | ✅ | ✅ 구현됨 | ✅ |
| 참석/불참 | ✅ 구현됨 (2개 시스템) | ✅ | ✅ 구현됨 | ✅ |
| 참석자 명단 | ✅ 구현됨 | ✅ | ⚠️ 부분 구현 | ✅ |
| 환경설정 | ✅ 구현됨 | ✅ | ✅ 구현됨 | ✅ |

### 미구현/부분 구현 항목 목록
1. **[알림설정] 생일 알림 토글 UI 미표시** — notification-settings.js에 birthday_push 토글 추가 필요
2. **[참석명단] 접기/펼치기 기능 없음** — 5명 초과 시 전체 명단 보기 불가
3. **[참석명단] 불참/미정/미응답 그룹별 명단 미표시** — 참석자만 표시
4. **[관리자웹] 참석 현황 미구현** — admin/js/schedules.js에 attendance 관련 코드 없음
5. **[참석시스템] 두 시스템 병존** — schedule_attendance vs attendance_config/votes, 프론트는 후자만 사용
6. **[환경설정] 이용약관/개인정보 처리방침 내용 미구현** — alert() placeholder
