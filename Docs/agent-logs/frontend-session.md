# 프론트엔드 세션 로그 — 2026-03-14

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
