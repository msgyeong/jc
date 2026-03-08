# 3단계: 공지사항 및 일정 기능 구현

**기간**: 4일차 ~ 5일차
**목표**: 공지사항 목록/상세/작성 및 일정 목록/상세/등록 기능 완성

> **선행 조건**:
> - [x] 2단계 완료 (게시글 기능) — 공지사항 부분 선행 구현

> **참고**:
> - 공지사항 작성: `super_admin`, `admin` role 권한 필요
> - 일정 등록: `super_admin`, `admin` role 권한 필요

> **역할 구분**:
> - 🤖 **Cursor(AI)**: Cursor가 혼자 진행 가능한 작업
> - 👤 **사용자**: 사용자가 직접 해야 하는 작업 (테스트, 검증 등)

---

## 공지사항 모델 및 서비스

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 공지사항 모델 생성
- [x] `lib/models/notice_model.dart` 생성 (Freezed)
  - Railway API 응답 구조와 일치 (snake_case → camelCase 변환)
  - `attendanceSurveyEnabled` getter 추가
- [x] build_runner 실행

### [x] 공지사항 서비스
- [x] `lib/services/notice_service.dart` 생성
- [x] 공지사항 목록 조회 (고정 공지 우선) — `GET /api/notices`
- [x] 공지사항 상세 조회 (조회수 자동 증가) — `GET /api/notices/:id`
- [x] 공지사항 작성/수정/삭제 (권한 확인) — `POST/PUT/DELETE /api/notices`
- [x] `_normalizeNotice()` 변환 (integer ID → string, snake_case 정규화)

---

## 공지사항 목록 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 공지사항 목록 UI
- [x] `lib/screens/notices/notice_list_screen.dart` 생성
- [x] 공지사항 리스트
- [x] 공지 카드 위젯
  - 고정 공지 아이콘 (isPinned = true, push_pin 아이콘)
  - 제목, 등록일
  - 댓글 수, 공감 수
  - 'N' 배지 (3일 이내 새 공지)
- [x] 공지 작성 버튼 (FAB)
- [x] 고정 공지 상단 우선 표시
- [x] Pull-to-refresh (RefreshIndicator)

### [x] 공지사항 목록 Provider
- [x] `lib/providers/notice_list_provider.dart` 생성
- [x] StateNotifierProvider 사용
- [x] 고정 공지와 일반 공지 API에서 정렬 처리

---

## 공지사항 상세 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 공지사항 상세 UI
- [x] `lib/screens/notices/notice_detail_screen.dart` 생성
- [x] 공지 내용 표시
  - 제목, 작성자 정보, 등록일
  - 본문 내용
- [x] 공감 수, 댓글 수 표시
- [x] 참석자 조사 섹션 (attendanceSurveyEnabled = true인 경우)
  - 참석 여부 선택 버튼 (참석/불참/미정) — Railway API 연동
  - 참석자 통계 (참석/불참/미정 수)
  - 참석자 목록 표시
- [ ] 댓글 섹션 (백엔드 API 미구현 — notices에는 댓글 엔드포인트 없음)
- [x] 수정/삭제 버튼 (작성자만, PopupMenuButton)

### [x] 공지사항 상세 Provider
- [x] `lib/providers/notice_detail_provider.dart` 생성
- [x] FutureProvider.family 사용
- [x] 참석자 조사 상태 조회/업데이트 (`lib/providers/notice_attendance_provider.dart`)

---

## 공지사항 작성 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 공지사항 작성 UI
- [x] `lib/screens/notices/notice_create_screen.dart` 생성
- [x] 제목 입력 필드
- [x] 본문 입력 필드 (8줄)
- [x] 고정 공지 옵션 (CheckboxListTile)
- [x] 참석자 조사 활성화 옵션 (CheckboxListTile)
- [x] 유효성 검증 (제목, 본문 필수)
- [x] FilledButton with loading state

### [x] 공지사항 작성 Provider
- [x] `lib/providers/notice_create_provider.dart` 생성
- [x] SessionService.getUserId() 사용

---

## 공지사항 수정 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 공지사항 수정 UI
- [x] `lib/screens/notices/notice_edit_screen.dart` 생성
- [x] 기존 내용 불러오기 (제목, 본문, 고정 공지 여부, 참석자 조사 활성화 여부)
- [x] 제목/본문 수정 필드
- [x] 고정 공지 옵션 수정 (체크박스)
- [x] 참석자 조사 활성화 옵션 수정 (체크박스)
- [x] 수정 권한 확인 (작성자만)
- [x] 수정 완료 버튼

### [x] 공지사항 수정 기능
- [x] 수정 완료 후 상세 화면으로 이동
- [x] noticeListProvider 갱신

---

## 일정 모델 및 서비스

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 일정 서비스
- [x] `lib/services/schedule_service.dart` 생성 (Map 기반, Freezed 미사용)
- [x] 일정 목록 조회 — `GET /api/schedules`
- [x] 일정 상세 조회 (조회수 증가) — `GET /api/schedules/:id`
- [x] 일정 등록/수정/삭제 (권한 확인) — `POST/PUT/DELETE /api/schedules`
- [x] `_normalize()` 변환

### [ ] 일정 모델 (Freezed)
- [ ] `lib/models/schedule_model.dart` 생성 (Freezed) — 현재 Map<String, dynamic> 사용 중
- [ ] build_runner 실행

---

## 일정 목록 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 일정 목록 UI
- [x] `lib/screens/schedules/schedule_list_screen.dart` 생성
- [x] 일정 리스트
- [x] 일정 카드 위젯
  - 날짜 범위 표시
  - 제목
  - 장소
  - 카테고리 태그
  - 지난 일정 회색 처리
- [x] 일정 등록 버튼 (관리자만 FAB 표시)
- [x] Pull-to-refresh (RefreshIndicator)

### [x] 일정 목록 Provider
- [x] `lib/providers/schedule_list_provider.dart` 생성
- [x] StateNotifierProvider 사용
- [x] upcomingOnly 옵션

---

## 일정 상세 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 일정 상세 UI
- [x] `lib/screens/schedules/schedule_detail_screen.dart` 생성
- [x] 일정 내용 표시
  - 제목, 카테고리
  - 일시 (시작~종료)
  - 장소
  - 작성자
  - 등록일
  - 상세 내용
- [x] 삭제 버튼 (작성자만)

### [x] 일정 상세 Provider
- [x] `lib/providers/schedule_list_provider.dart`에 `scheduleDetailProvider` 포함
- [x] FutureProvider.family 사용

---

## 일정 등록 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 일정 등록 UI
- [x] `lib/screens/schedules/schedule_create_screen.dart` 생성
- [x] 제목 입력 필드
- [x] 날짜 선택 (DatePicker) — 시작일, 종료일(선택)
- [x] 장소 입력 필드
- [x] 분류 입력 필드 (정기회의, 행사, 교육 등)
- [x] 설명 입력 필드 (여러 줄, 6줄)
- [x] 유효성 검증 (제목 필수)
- [x] FilledButton with loading state

### [ ] 일정 수정 화면
- [ ] `lib/screens/schedules/schedule_edit_screen.dart` 생성
- [ ] 기존 내용 불러오기 및 수정

---

## 참석자 조사 기능

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 참석자 조사 Provider 및 UI
- [x] `lib/providers/notice_attendance_provider.dart` 생성
  - AttendanceState 클래스 (attending, notAttending, undecided, myStatus, attendees)
  - `noticeAttendanceProvider` (FutureProvider.family)
  - `updateAttendance()` 함수
- [x] 참석 여부 선택 버튼 (3개: 참석/불참/미정)
  - `_VoteChip` 위젯 (선택 상태 강조, 카운트 표시)
- [x] 선택된 상태 표시 (색상 + 테두리)
- [x] 참석자 통계 표시
- [x] 참석자 목록 표시
- [x] Railway API 연동 (`GET/POST /api/notices/:id/attendance`)

---

## 개발자 작업

> **역할**: 👤 **사용자** 전담

### [ ] 테스트 및 검증
- [ ] 권한 확인 로직 테스트
  - 권한 있는 사용자는 작성 가능
  - 권한 없는 사용자는 작성 버튼 미표시
- [ ] 고정 공지 우선 노출 테스트
- [ ] 참석자 조사 기능 전체 테스트
  - 참석 여부 선택/변경
  - 참석자 통계 정확성
- [ ] 일정 목록 정렬 테스트

---

## 완료 기준

- [x] 공지사항 목록 표시 및 고정 공지 우선 노출
- [x] 공지사항 작성 (admin/super_admin만)
- [x] 공지사항 수정 가능 (작성자만)
- [x] 공지사항 삭제 가능 (작성자만)
- [x] 참석자 조사 기능 Railway API 연동 완료
- [x] 일정 목록 표시
- [x] 일정 등록 (admin/super_admin만)
- [x] 일정 상세 조회
- [x] 일정 삭제 가능 (작성자만)
- [ ] 일정 수정 화면 (미구현)
- [ ] 공지사항 댓글 (백엔드 API 미구현)

---

## 다음 단계
이 단계 완료 후 **04-member-profile-and-home.md**로 진행
