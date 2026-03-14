# 테스터 에이전트 검증 결과

## 세션 1 (2026-03-14 오전): Push 알림, 참석/불참, 환경설정 기본 검증
## 세션 2 (2026-03-14 오후): 4대 신규 기능 검증

---

# 세션 2: 4대 신규 기능 검증 결과

## 1. 게시글 참석/불참

### 백엔드 API: ✅ 구현됨
- **api/routes/posts.js** L766-951
  - `POST /api/posts/:id/attendance` — 참석/불참 등록 ✅
    - linked_schedule_id가 있으면 schedule_attendance 재활용 ✅
    - 없으면 post_attendance 테이블 사용 ✅
    - status 유효성 검증 (attending/not_attending) ✅
  - `DELETE /api/posts/:id/attendance` — 참석 취소 ✅
    - linked_schedule_id 분기 처리 동일 ✅
  - `GET /api/posts/:id/attendance/summary` — 현황 요약 ✅
    - 참석/불참 수 + my_status 반환 ✅
    - linked_schedule_id에 따라 테이블 분기 ✅
  - `GET /api/posts/:id/attendance/details` — 참석자/불참자 명단 ✅
    - attending/not_attending 그룹으로 분리 반환 ✅
- posts 테이블에 `attendance_enabled` 컬럼 추가 ✅
- 게시글 작성 시 `attendance_enabled` 값 저장 ✅ (L456, L527)

### DB 마이그레이션: ✅
- **014_post_attendance.sql**
  - post_attendance 테이블 (post_id, user_id, status, UNIQUE) ✅
  - posts 테이블에 attendance_enabled BOOLEAN 컬럼 ✅

### 프론트엔드 UI: ✅ 구현됨
- **web/js/posts.js** L883-954
  - `loadPostAttendance(post)` — 참석 UI 렌더링 ✅
    - attendance_enabled || linked_schedule_id 조건 체크 ✅
    - 참석 N / 불참 N 카운트 표시 ✅
    - 참석/불참 버튼 (내 상태 활성화 표시) ✅
  - `submitPostAttendance(status, postId)` — API 호출 ✅
  - `loadPostAttendeeList(postId)` — 참석자/불참자 그룹별 명단 ✅
    - 참석 (N명) / 불참 (N명) 그룹 분리 ✅
    - 이름 쉼표 구분 나열 ✅
  - 글쓰기 폼에 참석 확인 토글 (`renderAttendanceToggleSection`) ✅
    - toggle-switch로 attendance_enabled on/off ✅

### 프로덕션 DB: ✅ (post_attendance 테이블 확인됨)

### ⚠️ 발견 이슈
1. **미응답자 명단 미표시**: details API가 참석/불참만 반환하고 미응답자 목록은 미포함 (전체 회원 대비 미응답 계산 없음)

---

## 2. Push 알림 설정 (글쓰기 폼)

### 백엔드 API: ✅ 구현됨
- **api/routes/posts.js** L537-570
  - push_setting 파라미터 처리 ✅
    - `immediate` → 즉시 sendPushToAll (N-01) ✅
    - `scheduled` → createScheduledNotifications 등록 ✅
    - `d_day` → createScheduledNotifications 등록 ✅
    - `none` → 공지인 경우에도 기본 즉시 알림 발송 (하위 호환) ✅
  - push_scheduled_at, push_event_date 전달 ✅

- **api/cron/notification-scheduler.js** ✅
  - `startNotificationScheduler()` — 5분 간격 cron ✅
  - scheduled_notifications에서 pending + scheduled_at <= NOW() 조회 ✅
  - notification_type별 분기:
    - `immediate` / `scheduled` → 📢 새 알림 ✅
    - `d_day_7`, `d_day_3`, `d_day_1`, `d_day_0` → ⏰ D-N 일정 알림 ✅
  - 발송 후 status='sent', sent_at=NOW() 업데이트 ✅
  - `createScheduledNotifications()` — 예약 알림 등록 함수 ✅
    - immediate → 즉시 pending 등록 ✅
    - scheduled → 지정 시간에 등록 ✅
    - d_day → D-7/D-3/D-1/D-0 각각 등록 (과거 날짜 스킵) ✅

- **api/server.js** L23, L142 — startNotificationScheduler() 등록 ✅

### DB 마이그레이션: ✅
- **017_scheduled_notifications.sql**
  - scheduled_notifications 테이블 (post_id, schedule_id, notification_type, scheduled_at, status) ✅
  - 인덱스 3개 ✅

### 프론트엔드 UI: ✅ 구현됨
- **web/js/posts.js** L974-1054
  - `renderPushSettingSection()` — 4종 라디오 ✅
    - 즉시 발송 (기본 선택) ✅
    - 예약 발송 (날짜/시간 입력) ✅
    - 일정 연동 알림 (일정 미첨부 시 disabled) ✅
    - 알림 없음 ✅
  - D-day 체크박스 (D-7/D-3/D-1/당일) ✅ — checked 기본값 ✅
  - 예약 발송 선택 시 날짜/시간 필드 표시/숨김 ✅
  - `handlePushSettingChange(value)` — UI 토글 ✅
  - `getPushSettingPayload()` — API 전달 객체 생성 ✅
    - push_setting, push_scheduled_at, push_d_day_options 포함 ✅

### 프로덕션 DB: ✅ (scheduled_notifications 테이블 확인됨)

### ⚠️ 발견 이슈
1. **D-day 옵션 개별 선택 미반영**: 프론트에서 push_d_day_options 배열을 보내지만, 백엔드 createScheduledNotifications()는 **항상 4개(D-7/D-3/D-1/D-0) 모두 등록**하고 프론트 선택값을 무시함. eventDate만 사용하고 push_d_day_options는 미처리.

---

## 3. 직책 관리

### 백엔드 API: ✅ 구현됨
- **api/routes/admin.js** L2400-2481
  - `PUT /api/admin/members/:id/position` ✅
    - position_id 유효성 + positions 테이블 확인 ✅
    - 트랜잭션: users.position_id 업데이트 + position_history 기록 ✅
    - 감사 로그(audit_log) 기록 ✅
  - `GET /api/admin/members/:id/position-history` ✅
    - position_history JOIN positions + users(assigned_by) ✅
    - assigned_at DESC 정렬 ✅

### DB 마이그레이션: ✅
- **015_position_history.sql**
  - users.position_id FK 추가 ✅
  - position_history 테이블 (user_id, position_id, assigned_at, assigned_by, notes) ✅

### 프론트엔드 (관리자 웹): ⚠️ 부분 구현
- **web/admin/js/members.js** L177-219
  - 회원 상세 모달에 직책 드롭다운 (`<select>`) ✅
  - 저장 버튼 ✅
  - `saveMemberPosition()` 함수 ✅
  - ⚠️ **API 호출 불일치**: `PUT /api/admin/members/:id` (일반 수정)로 position 문자열을 보냄, `PUT /api/admin/members/:id/position` (position_id 전용)을 사용하지 않음
    - position_history 자동 기록이 **작동하지 않을 수 있음**
  - 직책 변동 이력 GET 호출 ❌ — 모달에서 이력 표시 없음

### 프론트엔드 (앱): ✅ 구현됨
- **web/js/profile.js** L43, L61
  - 프로필 히어로에 직책 뱃지 (getPositionBadgeHtml) ✅
  - 직장 정보 섹션에 직책 표시 ✅
- **web/js/members.js** L27-36, L251, L295
  - `getPositionBadgeHtml()` — 7종 색상 매핑 ✅
    - 회장(pos-president), 수석부회장(pos-senior-vp), 부회장(pos-vp), 총무(pos-secretary), 이사(pos-director), 감사(pos-auditor), 일반회원(pos-member) ✅
  - 회원 목록 카드에 직책 뱃지 표시 ✅
  - 회원 상세에 직책 뱃지 표시 ✅
- **web/styles/main.css** L5729-5741 — 직책 뱃지 CSS ✅

### 프로덕션 DB: ✅
- position_history 테이블 ✅
- users.position_id 컬럼 ✅

### ⚠️ 발견 이슈
1. **관리자 직책 변경 API 불일치**: saveMemberPosition()이 `/api/admin/members/:id` (일반 수정)를 호출하여 position 문자열만 업데이트. `/api/admin/members/:id/position` (position_id + position_history 기록)을 사용하지 않아 **직책 변동 이력이 기록되지 않음**
2. **직책 변동 이력 UI 없음**: 관리자 회원 상세에서 이력 조회/표시 없음 (인물카드 JC 이력 탭에서만 확인 가능)

---

## 4. 인물카드 (관리자)

### 백엔드 API: ✅ 구현됨
- **api/routes/admin.js** L2491-2611
  - `GET /api/admin/members/:id/dossier` ✅
    - users 전체 필드 + position_history + member_activities 통합 조회 ✅
    - Promise.all 병렬 쿼리 ✅
  - `PUT /api/admin/members/:id/dossier` ✅
    - hobbies, specialties, special_notes, admin_memo 등 업데이트 ✅
    - educations, careers, families (JSONB) 업데이트 ✅
    - 감사 로그 기록 ✅
  - `POST /api/admin/members/:id/activities` — 활동 이력 추가 (L253 프론트에서 호출)
  - `DELETE /api/admin/members/:id/activities/:activityId` — 활동 이력 삭제 (L264 프론트에서 호출)

### DB 마이그레이션: ✅
- **016_member_dossier.sql**
  - users: admin_memo, specialties 컬럼 추가 ✅
  - users: educations, careers, families JSONB 컬럼 (조건부 추가) ✅
  - member_activities 테이블 (activity_type CHECK, title, date, description) ✅

### 프론트엔드 UI: ✅ 구현됨
- **web/admin/js/member-dossier.js** — 453줄, 완전 구현
  - `openMemberDossier(memberId)` — dossier API 호출 ✅
  - **8탭 네비게이션** ✅:
    1. 기본정보 (이름/이메일/연락처/생년월일/성별/주소/회사/직책/부서/업종/긴급연락처 등) ✅
    2. JC 이력 (position_history 테이블 표시 + 특이사항) ✅
    3. 학력 (educations JSONB 추가/삭제 모달) ✅
    4. 활동 (member_activities CRUD) ✅
    5. 경력 (careers JSONB 추가/삭제 모달) ✅
    6. 가족 (families JSONB 추가/삭제 모달) ✅
    7. 취미/특기 (hobbies 텍스트 저장) ✅
    8. 관리자 메모 (admin_memo 텍스트 저장 — "관리자만 볼 수 있습니다" 안내) ✅
  - 프로필 카드 (사진/이름/직책뱃지/이메일/연락처/회사) ✅
  - 프로필 사진 표시 (`profile_image` → img 태그, 없으면 이니셜) ✅
  - JSONB CRUD:
    - 학력: addDossierEducation → 모달(학교/전공/학위/입학/졸업) → saveDossierField ✅
    - 경력: addDossierCareer → 모달(회사/직책/시작/종료/설명) → saveDossierField ✅
    - 가족: addDossierFamily → 모달(이름/관계/생년월일/연락처) → saveDossierField ✅
    - 삭제: removeDossierJsonbItem(field, index) → splice + save ✅
  - 활동 이력:
    - addDossierActivity → 모달(유형 select/제목/날짜/설명) → POST API ✅
    - deleteDossierActivity(id) → DELETE API ✅
  - refreshDossier() — 저장 후 데이터 갱신 ✅
  - 관리자 회원 목록에서 "인물카드" 버튼 진입 ✅ (members.js L160)

### 프로덕션 DB: ✅
- member_activities 테이블 ✅
- users.admin_memo ✅
- users.specialties ✅
- users.educations ✅
- users.careers ✅
- users.families ✅
- users.hobbies ✅
- users.position_id ✅

### ⚠️ 발견 이슈: 없음 — 완전 구현

---

## 5. 프로덕션 DB 테이블/컬럼 확인

### 신규 테이블 (4개): ✅ 전부 존재
| 테이블명 | 존재 |
|----------|------|
| post_attendance | ✅ |
| position_history | ✅ |
| scheduled_notifications | ✅ |
| member_activities | ✅ |

### users 테이블 신규 컬럼 (7개): ✅ 전부 존재
| 컬럼명 | 존재 |
|--------|------|
| hobbies | ✅ |
| specialties | ✅ |
| admin_memo | ✅ |
| educations | ✅ |
| careers | ✅ |
| families | ✅ |
| position_id | ✅ |

---

## 종합 요약

| 기능 | 백엔드 API | DB 마이그레이션 | 프론트엔드 UI | 프로덕션 DB |
|------|-----------|----------------|-------------|------------|
| 게시글 참석/불참 | ✅ 구현됨 | ✅ | ✅ 구현됨 | ✅ |
| Push 알림 설정 | ✅ 구현됨 | ✅ | ✅ 구현됨 | ✅ |
| 직책 관리 | ✅ 구현됨 | ✅ | ⚠️ 부분 구현 | ✅ |
| 인물카드 | ✅ 구현됨 | ✅ | ✅ 구현됨 | ✅ |

### 미구현/버그 항목 (3건)

| # | 기능 | 이슈 | 심각도 |
|---|------|------|--------|
| 1 | Push 알림 설정 | D-day 옵션 개별 선택값이 백엔드에서 무시됨 (항상 4개 모두 등록) | ⚠️ 중간 |
| 2 | 직책 관리 | saveMemberPosition()이 `/position` API 대신 일반 수정 API 호출 → position_history 미기록 | ⚠️ 중간 |
| 3 | 직책 관리 | 관리자 모달에서 직책 변동 이력 표시 없음 (인물카드에서만 확인 가능) | ⚠️ 낮음 |

### 기존 이슈 (세션 1에서 발견, 여전히 유효)
| # | 기능 | 이슈 |
|---|------|------|
| 4 | 알림 설정 | 생일 알림 토글 UI 미표시 |
| 5 | 이용약관 | alert() placeholder |

---

*검증 완료: 2026-03-14*
*테스터 에이전트: 코드 읽기 전용 분석*
