# 3단계: 공지사항 및 일정 기능 구현

**기간**: 4일차 ~ 5일차  
**목표**: 공지사항 목록/상세/작성 및 일정 목록/상세/등록 기능 완성

---

## 게시판·일정 정책 (요구사항)

> 상세: **02-0-board-and-schedule-policy.md** 참고.

- **공지사항 게시판**: 관리자 및 **관리자가 지정한 사람**만 작성. **일정 첨부** 가능.
- **일반 게시판**: 모든 승인된 회원 작성. **일정 첨부** 가능.
- **일정 연동(추후)**  
  - 게시글에 첨부된 일정은 일정 기능과 연동.  
  - **푸시 알람**: 전체 회원 대상, **특정 일자 전**(예: 1주일 전, 1일 전 등) 알람 발송.  
  - **참석 인원 옵션**: 참석자(누가 참석하는지) 확인 가능.

---

## 웹 구현 완료 현황 (코드 분석 기준)

- [x] **웹** 공지사항 목록 (loadNotices, createNoticeCard) — 고정 공지 우선, N배지, 참석조사 배지, 댓글/공감 수, 빈 상태 — `web/js/notices.js`, `api/routes/notices.js`
- [x] **웹** 공지 작성 버튼 권한 확인 표시
- [x] **웹** 공지 상세/작성/수정/삭제, 참석자 조사 — `web/js/notices.js`, `api/routes/notices.js`
- [x] **웹** 일정 목록 (loadSchedules, 날짜별 그룹, N배지, 오늘 이후, 빈 상태) — `web/js/schedules.js`, `api/routes/schedules.js`
- [x] **웹** 일정 상세/등록/수정/삭제 — `web/js/schedules.js`, `api/routes/schedules.js`

> **선행 조건**: 
> - [ ] 2단계 완료 (게시글 기능)

> **참고**: 
> - 공지사항 작성: `role_permissions.can_post_notice = true` 권한 필요
> - 일정 등록: `role_permissions.can_create_schedule = true` 권한 필요

> **역할 구분**: 
> - 🤖 **Cursor(AI)**: Cursor가 혼자 진행 가능한 작업
> - 👤 **사용자**: 사용자가 직접 해야 하는 작업 (테스트, 검증 등)

---

## 공지사항 모델 및 서비스

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 공지사항 모델 생성
- [x] `lib/models/notice_model.dart` 생성 (Freezed + JsonSerializable)
  - schema notices 테이블 및 API 응답 구조 (is_pinned, has_attendance, likes_count, comments_count 등)
- [x] build_runner 실행

### [x] 공지사항 서비스
- [x] `lib/services/notice_service.dart` 생성
- [x] 공지사항 목록 조회 (고정 공지 우선, Supabase from('notices'))
- [x] 공지사항 상세 조회, 조회수 증가
- [x] 공지사항 작성/수정/삭제 (RLS에서 권한 확인)

---

## 공지사항 목록 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 공지사항 목록 UI
- [x] `lib/screens/notices/notice_list_screen.dart` 생성
- [x] 공지사항 리스트 (ListView.builder)
- [x] 공지 카드 위젯 (_NoticeCard)
  - 고정 공지 아이콘 (isPinned)
  - 제목, 등록일, 참석조사 배지, 댓글/공감 수
  - 'N' 배지 (3일 이내 새 공지)
- [x] 공지 작성 FAB (context.push /home/notices/create)
- [x] 고정 공지 우선 (서비스 order is_pinned DESC)
- [x] Pull-to-refresh (RefreshIndicator)

### [x] 공지사항 목록 Provider
- [x] `lib/providers/notice_list_provider.dart` 생성 (noticeListProvider)
- [x] 목록 로드·갱신 (StateNotifierProvider)

---

## 공지사항 상세 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 공지사항 상세 UI
- [x] `lib/screens/notices/notice_detail_screen.dart` 생성
- [x] 공지 내용 표시 (제목, 작성자, 등록일, 본문)
- [x] 공감/댓글 수 표시 (likes_count, comments_count)
- [x] 참석자 조사 섹션 (hasAttendance 시 플레이스홀더 — 추후 연동)
- [x] 댓글 섹션 플레이스홀더 (추후 연동)
- [x] 수정/삭제 (작성자만 PopupMenu, 삭제 확인 후 NoticeService.delete)

### [x] 공지사항 상세 Provider
- [x] `lib/providers/notice_detail_provider.dart` (noticeDetailProvider, 조회수 증가 후 조회)
- [ ] 참석자 조사 상태 조회/업데이트 (추후)

---

## 공지사항 작성 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 공지사항 작성 UI
- [x] `lib/screens/notices/notice_create_screen.dart` 생성
- [x] 제목·본문 입력 필드, 유효성 검증
- [x] 고정 공지·참석자 조사 활성화 체크박스
- [x] 등록 시 NoticeCreateNotifier.submit → 목록 갱신 후 상세로 이동
- [ ] 권한 확인 (화면 진입 시 — RLS 또는 역할 체크 추후)

### [x] 공지사항 작성 Provider
- [x] `lib/providers/notice_create_provider.dart` (noticeCreateProvider)

---

## 공지사항 수정 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 공지사항 수정 UI
- [x] `lib/screens/notices/notice_edit_screen.dart` 생성
- [x] noticeEditFormProvider로 기존 데이터 로드 (제목, 본문, 고정 공지, 참석자 조사)
- [x] 제목/본문 수정, 고정 공지·참석자 조사 체크박스
- [x] 저장 시 NoticeService.update → 상세 갱신·목록 갱신 후 상세로 이동
- [ ] 수정 권한 확인 (작성자만 — RLS에서 처리 추후)

### [x] 공지사항 수정 기능
- [x] noticeEditFormProvider (조회수 없이 getById)
- [x] 수정 완료 후 상세 화면으로 이동 (context.go)

---

## 일정 모델 및 서비스 (웹)

> **역할**: 🌐 **웹 구현 기준**

### [x] 일정 모델/서비스 대응 (웹 JS)
- [x] `api-client.js` 일정 API 메서드 사용 (`getSchedule`, `createSchedule`, `updateSchedule`, `deleteSchedule`)
- [x] 목록 조회 (날짜 기준 정렬)
- [x] 상세 조회
- [x] 등록/수정/삭제 (권한 확인: admin/super_admin)

---

## 일정 목록 화면 (웹)

> **역할**: 🌐 **웹 구현 기준**

### [x] 일정 목록 UI
- [x] `web/js/schedules.js` 목록 렌더링
- [x] 일정 카드 위젯 (날짜/제목/시간/장소/N배지)
- [x] 일정 등록 버튼 (권한 있는 사용자만 표시)
- [x] 오늘 이후 일정 우선 표시 (`upcoming=true`)
- [x] 날짜별 그룹핑 렌더링

---

## 일정 상세 화면 (웹)

> **역할**: 🌐 **웹 구현 기준**

### [x] 일정 상세 UI
- [x] 상세 표시 (제목/날짜/시간/장소/설명)
- [x] 공감/댓글 수 표시
- [x] 수정/삭제 버튼 (작성자 또는 관리자)

---

## 일정 등록 화면 (웹)

> **역할**: 🌐 **웹 구현 기준**

### [x] 일정 등록 UI
- [x] 등록 폼 (제목/날짜/시작/종료/장소/설명)
- [x] 유효성 검증 (제목, 날짜 필수)
- [x] 권한 확인 (등록 버튼/서버 권한 체크)

---

## 일정 수정 화면 (웹)

> **역할**: 🌐 **웹 구현 기준**

### [x] 일정 수정 UI/기능
- [x] 기존 내용 불러오기
- [x] 제목/날짜/시간/장소/설명 수정
- [x] 수정 권한 확인 (작성자 또는 관리자)
- [x] 수정 완료 후 상세 화면 이동

---

## 참석자 조사 기능 (웹)

> **역할**: 🌐 **웹 구현 기준**

### [x] 참석자 조사 서비스/API
- [x] `GET /api/notices/:id/attendance` (현황/내 상태/목록)
- [x] `POST /api/notices/:id/attendance` (참석/불참/미정 저장)

### [x] 참석자 조사 UI (웹)
- [x] 상세에서 참석 여부 선택 버튼 3개
- [x] 선택 결과 저장 후 통계/내 상태 갱신
- [ ] 참석자 목록 상세 UI 고도화 (현재 요약 중심)

---

## 개발자 작업

> **역할**: 👤 **사용자** 전담

### [ ] 테스트 및 검증
- [ ] 권한 확인 로직 테스트
  - 권한 있는 사용자는 작성 가능
  - 권한 없는 사용자는 작성 화면 접근 불가
- [ ] 고정 공지 우선 노출 테스트
- [ ] 참석자 조사 기능 전체 테스트
  - 참석 여부 선택/변경
  - 참석자 통계 정확성
- [ ] 일정 정렬 테스트 (날짜 기준)
- [ ] 캘린더 뷰 구현 여부 결정 (선택)

---

## 완료 기준

- [x] **(웹)** 공지사항 목록 표시 및 고정 공지 우선 노출
- [x] 공지사항 작성 권한 확인 정상 작동
- [x] 공지사항 수정 가능 (작성자 또는 관리자)
- [x] 공지사항 삭제 가능 (작성자 또는 관리자)
- [x] 참석자 조사 기능 기본 동작
- [x] **(웹)** 일정 목록 날짜 기준 정렬 표시 (날짜별 그룹, 오늘 이후)
- [x] 일정 등록 권한 확인 정상 작동
- [x] 일정 수정 가능 (작성자 또는 관리자)
- [x] 일정 삭제 가능 (작성자 또는 관리자)
- [ ] 공지사항과 일정 모두 댓글/공감 기능 완전 연동 (일부 표시만 완료)

---

## 다음 단계
이 단계 완료 후 **04-member-profile-and-home.md**로 진행
