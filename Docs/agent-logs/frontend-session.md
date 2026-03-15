# 프론트엔드 세션 로그 — 2026-03-14 (업데이트)

## 테스터 검증 후 수정 (세션 2)

### 수정 1: 생일 알림 토글 UI 추가
- notification-settings.js에 birthday_push 토글 추가 (하트 아이콘)
- 기존 4개(공지/일정/리마인더/댓글) + 생일 = 5개 유형 토글

### 수정 2+3: 참석자 명단 접기/펼치기 + 그룹별 표시
- loadAttendeeList()를 schedule_attendance API(/schedules/:id/attendance/details)로 전환
- 참석/불참/미응답 3그룹 분리 표시
- 5명 초과 시 접기/펼치기 버튼, 5명 이하면 바로 표시
- CSS: .attendee-group, .attendee-toggle-btn 등 추가

### 수정 4: 관리자 웹 참석 현황
- admin/js/schedules.js에 '참석' 버튼 + showAttendanceModal() 추가
- 참석/불참/미응답 통계 카드 + 그룹별 명단(직책 포함)
- CSV 내보내기 버튼 (GET /api/schedules/:id/attendance/export)

### 수정 5: 참석 시스템 통합 (schedule_attendance)
- loadAttendanceVote() → schedule_attendance API(/schedules/:id/attendance/summary) 사용
- submitVote() → submitAttendance()로 교체 (POST /schedules/:id/attendance)
- 기존 attendance_config/votes 관련 코드 제거 (currentAttendanceConfigId, /attendance/ 경로)
- 참석/불참 2버튼으로 단순화 (미정 제거)

### 수정 6: 이용약관/개인정보 처리방침
- alert() placeholder → 실제 서브화면으로 교체
- showTermsPage(): 6개 조항 포함 이용약관
- showPrivacyPage(): 수집항목/이용목적/보유기간/제3자제공/파기/책임자
- CSS: .legal-content 스타일 추가

---

## 작업 요약
CEO 피드백 "파란색 일색 촌스러움, 심플하고 세련되게" 반영하여 전체 디자인 리뉴얼 + 기능 구현 9건 처리.

## 완료된 작업

### Task 1 (Issue #3): 디자인 리뉴얼
- `:root` CSS 변수 전면 교체 → tokens.css v2.0 기준 (딥 네이비 #1E3A5F)
- `[data-theme="dark"]` 다크모드 변수 블록 추가
- AppBar: 파란 그라디언트 → 흰 배경 + 하단 border
- Input: 48px → 44px, focus 스타일 경량화
- Button: 48px → 44px, primary color 교체
- Card: box-shadow → border 기반
- 모든 JS 파일의 하드코딩 파란색(#2563EB, #1D4ED8 등) → CSS 변수 또는 #1E3A5F 계열 교체
  - home.js: 배너 그라디언트 7건
  - members.js: 아바타 색상 3건
  - notices.js, utils.js, schedules.js: SVG stroke 등
  - profile.js: 아바타 배경색

### Task 2 (Issue #1): 사진 업로드 UI
- `post-create-image-file` input에 `multiple` 속성 추가
- `handlePostCreateFileSelect()` 다중 파일 지원으로 재구현
- 최대 5장 제한 유지, 썸네일 프리뷰 + X 제거 기존 로직 활용

### Task 3 (Issue #2): 토글 스위치 CSS
- `.toggle-switch` / `.toggle-slider` 44x24px iOS 스타일 CSS 추가
- 일정 첨부 토글, 다크모드 토글에 적용

### Task 4 (Issue #6): 캘린더 + FAB 수정
- `loadSchedulesScreen()`에서 캘린더/헤더 `display` 복원 로직 추가
- FAB: `display:flex; align-items:center; justify-content:center` 센터링

### Task 5 (Issue #7): 프로필 하단 버튼 리디자인
- `renderProfile()` 내 colored button 4개 → `.settings-group` + `.settings-item` 리스트 메뉴
- 항목: 내 정보 수정, 환경설정, 관리자 메뉴(조건부), 로그아웃(빨간)

### Task 6 (Issue #8): 알림 센터
- 기존 notifications.js 모듈이 이미 완성 상태
- 홈 AppBar에 벨 아이콘 + 배지 카운트 작동 확인
- 색상 토큰 업데이트 (파란색 → CSS 변수)

### Task 7 (Issue #9): 환경설정 화면
- `web/js/settings.js` 신규 생성
- 메뉴 그룹: 화면(다크모드/글꼴), 알림, 데이터(캐시삭제), 계정(비번변경/로그아웃/탈퇴), 정보(약관/개인정보/버전)
- 다크모드: `data-theme` + localStorage + 서버 동기화
- 글꼴 크기: 4단계 (small/medium/large/xlarge)
- FOUC 방지 인라인 스크립트 `<head>`에 추가
- index.html에 settings-screen div + script 태그 추가

### Task 8 (Issue #10): 뒤로가기 네비게이션
- `navigateToScreen()` / `switchTab()`에 `history.pushState()` 추가
- `popstate` 이벤트 리스너로 뒤로가기 처리
- 홈 화면에서 뒤로가기 시 종료 확인 다이얼로그 표시
- `showExitDialog()` / `closeExitDialog()` / `confirmExit()` 함수 추가

### Task 9 (Issue #5): 참석 UI
- 이미 schedules.js에 `loadAttendanceVote()` / `submitVote()` / `loadAttendeeList()` 구현됨
- 투표 버튼 색상을 CSS 변수로 교체

## 수정된 파일 목록
- `web/styles/main.css` — 전체 CSS 변수 교체, 다크모드, 토글, 설정, 다이얼로그 스타일
- `web/index.html` — FOUC 스크립트, settings-screen, exit-dialog, file input multiple
- `web/js/settings.js` — 신규 (환경설정 모듈)
- `web/js/navigation.js` — settings case, pushState, popstate 핸들러
- `web/js/profile.js` — 액션 버튼 → 설정 메뉴 스타일
- `web/js/posts.js` — 다중 파일 업로드
- `web/js/schedules.js` — 캘린더 복원, 색상 교체
- `web/js/home.js` — 그라디언트 색상 교체
- `web/js/members.js` — 아바타 색상 교체
- `web/js/notices.js` — SVG 색상 교체
- `web/js/utils.js` — toast 아이콘 색상 교체

---

## 세션 5 (2026-03-14) — 4대 기능 구현

### Task 1: 게시글 참석 UI
- `posts.js`에 `loadPostAttendance()`, `submitPostAttendance()`, `loadPostAttendeeList()` 추가
- 게시글 상세에서 참석/불참 버튼 + 참석자 그룹 명단 표시
- `renderPostDetail()`에 `post-attendance-container` div 추가
- `attendance_enabled=true`이거나 `linked_schedule_id`가 있을 때 참석 UI 자동 노출
- 게시글 작성 폼에 참석 확인 토글 (`postCreateAttendanceEnabled`) 추가
- `handlePostCreateSubmit()`에 `attendance_enabled` 파라미터 전달

### Task 2: Push 알림 설정 UI
- 공지 작성 폼 하단에 Push 알림 설정 라디오 4개 추가: 즉시/예약/일정연동/없음
- 예약 발송: 날짜+시간 선택 UI
- 일정 연동: D-7/D-3/D-1/당일 체크박스 (일정 첨부 시에만 활성)
- `getPushSettingPayload()` → API에 `push_setting`, `push_scheduled_at`, `push_d_day_options` 전달
- `index.html`에 `post-create-attendance-section`, `post-create-push-setting` div 추가

### Task 3: 직책 관리 + 표시
- `members.js`에 `getPositionBadgeHtml()` 유틸 추가 — 직책별 색상 코딩
- 회원 카드에 JC 직책 뱃지 표시 (회장=gold, 부회장=silver 등)
- 회원 상세, 프로필에 JC 직책 뱃지 표시
- 관리자 회원 상세 모달에 직책 드롭다운 (GET /api/admin/positions → select)
- 직책 저장: PUT /api/admin/members/:id (position 필드)
- API: members, profile 라우트에 `jc_position` 필드 추가
- CSS: `.position-badge` 7종 색상 클래스

### Task 4: 인물카드 (8탭)
- `web/admin/js/member-dossier.js` 신규 생성 (전체 인물카드 모듈)
- 상단 프로필 카드 + 8탭 네비게이션
- Tab 1: 기본정보 (이름/이메일/연락처/생년월일/성별/주소/직장)
- Tab 2: JC 이력 (position_history 테이블 연동)
- Tab 3: 학력 (JSONB educations 필드 CRUD — 추가/삭제)
- Tab 4: 활동 (member_activities 테이블 CRUD — API 연동)
- Tab 5: 경력 (JSONB careers 필드 CRUD)
- Tab 6: 가족 (JSONB families 필드 CRUD)
- Tab 7: 취미/특기 (텍스트 편집)
- Tab 8: 관리자 메모 (admin_memo 필드 편집)
- API: DELETE /api/admin/members/:id/activities/:activityId 엔드포인트 추가
- CSS: `.dossier-*` 인물카드 전용 스타일 (admin.css)
- 관리자 모달에 '인물카드' 버튼 추가 → 전체 화면 인물카드로 이동

### 수정된 파일 목록 (세션 5)
- `web/js/posts.js` — 참석 UI, Push 알림 설정 UI
- `web/js/members.js` — JC 직책 뱃지, getPositionBadgeHtml()
- `web/js/profile.js` — JC 직책 뱃지 표시
- `web/index.html` — 참석/Push 설정 div 추가
- `web/styles/main.css` — 참석 뱃지, Push 설정, 직책 뱃지 CSS
- `web/admin/js/members.js` — 직책 드롭다운, 인물카드 버튼
- `web/admin/js/member-dossier.js` — 신규 (인물카드 8탭 모듈)
- `web/admin/css/admin.css` — 인물카드 CSS
- `web/admin/index.html` — member-dossier.js script 추가
- `api/routes/posts.js` — (기존, 참석 API 확인 완료)
- `api/routes/members.js` — jc_position 필드 추가
- `api/routes/profile.js` — jc_position 필드 추가
- `api/routes/admin.js` — DELETE activities 엔드포인트 추가

---

## 세션 6 (2026-03-15) — 테스터 이슈 수정

### 수정 1: API 에러 처리 개선
- `web/js/api-client.js`의 `request()` 메서드에 HTTP 상태코드별 분기 추가
- 401 Unauthorized → 토큰 제거 + 로그인 화면으로 자동 이동
- 500+ 서버 에러 → "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 메시지

### 수정 2: 관리자 회원 모달에 직책 변동 이력 표시
- `web/admin/js/members.js` openMemberDetail()에서 position-history API 병렬 호출
- 모달 하단에 타임라인 형태로 직책 변동 이력 표시 (직책명/날짜/지정자/메모)
- 이력이 없으면 섹션 숨김

### 수정 3: 생일 알림 토글 — 이미 구현 확인
- `web/js/notification-settings.js`에 birthday_push 토글 이미 존재 (하트 아이콘)
- 추가 작업 불필요

### 수정 4: 이용약관/개인정보 처리방침 — 이미 구현 확인
- `web/js/settings.js`에 showTermsPage(), showPrivacyPage() 이미 전체 서브화면으로 구현됨
- alert() placeholder 없음, 추가 작업 불필요

### 수정된 파일 목록 (세션 6)
- `web/js/api-client.js` — 401/500 에러 핸들링 추가
- `web/admin/js/members.js` — 직책 변동 이력 타임라인 추가
