# 3단계: 공지사항 및 일정 기능 구현

**기간**: 4일차 ~ 5일차  
**목표**: 공지사항 목록/상세/작성 및 일정 목록/상세/등록 기능 완성

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

### [ ] 공지사항 모델 생성
- [ ] `lib/models/notice_model.dart` 생성 (Freezed)
  - schema.sql의 notices 테이블 구조와 일치
- [ ] build_runner 실행

### [ ] 공지사항 서비스
- [ ] `lib/services/notice_service.dart` 생성
- [ ] 공지사항 목록 조회 (고정 공지 우선)
- [ ] 공지사항 상세 조회
- [ ] 공지사항 작성/수정/삭제 (권한 확인)

---

## 공지사항 목록 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 공지사항 목록 UI
- [ ] `lib/screens/notices/notice_list_screen.dart` 생성
- [ ] 공지사항 리스트
- [ ] 공지 카드 위젯
  - 고정 공지 아이콘/배지 (isPinned = true)
  - 제목, 등록일
  - 댓글 수, 공감 수
  - 'N' 배지 (새 공지)
- [ ] 공지 작성 버튼 (권한 있는 사용자만 표시)
- [ ] 고정 공지 상단 우선 표시
- [ ] Pull-to-refresh

### [ ] 공지사항 목록 Provider
- [ ] `lib/providers/notice_list_provider.dart` 생성
- [ ] 고정 공지와 일반 공지 분리 처리

---

## 공지사항 상세 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 공지사항 상세 UI
- [ ] `lib/screens/notices/notice_detail_screen.dart` 생성
- [ ] 공지 내용 표시
  - 제목, 작성자 정보, 등록일
  - 본문 내용
- [ ] 공감 버튼 및 수
- [ ] 참석자 조사 섹션 (attendanceSurveyEnabled = true인 경우)
  - 참석 여부 선택 버튼 (참석/불참/미정)
  - 참석자 통계 (참석/불참/미정 수)
  - 참석자 목록 (선택)
- [ ] 댓글 섹션
- [ ] 수정/삭제 버튼 (작성자만)

### [ ] 공지사항 상세 Provider
- [ ] `lib/providers/notice_detail_provider.dart` 생성
- [ ] 공지사항 상세 조회
- [ ] 참석자 조사 상태 조회/업데이트

---

## 공지사항 작성 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 공지사항 작성 UI
- [ ] `lib/screens/notices/notice_create_screen.dart` 생성
- [ ] 제목 입력 필드
- [ ] 본문 입력 필드
- [ ] 고정 공지 옵션 (체크박스)
- [ ] 참석자 조사 활성화 옵션 (체크박스)
- [ ] 유효성 검증 (제목, 본문 필수)
- [ ] 권한 확인 (화면 진입 시)

### [ ] 공지사항 작성 Provider
- [ ] `lib/providers/notice_create_provider.dart` 생성

---

## 공지사항 수정 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 공지사항 수정 UI
- [ ] `lib/screens/notices/notice_edit_screen.dart` 생성
- [ ] 기존 내용 불러오기 (제목, 본문, 고정 공지 여부, 참석자 조사 활성화 여부)
- [ ] 제목/본문 수정 필드
- [ ] 고정 공지 옵션 수정 (체크박스)
- [ ] 참석자 조사 활성화 옵션 수정 (체크박스)
- [ ] 수정 권한 확인 (작성자만)
- [ ] 수정 완료 버튼

### [ ] 공지사항 수정 기능
- [ ] 공지사항 수정 Provider
  - 기존 공지사항 데이터 조회
  - 수정된 내용 저장
- [ ] 수정 완료 후 상세 화면으로 이동

---

## 일정 모델 및 서비스

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 일정 모델 생성
- [ ] `lib/models/schedule_model.dart` 생성 (Freezed)
  - schema.sql의 schedules 테이블 구조와 일치
- [ ] build_runner 실행

### [ ] 일정 서비스
- [ ] `lib/services/schedule_service.dart` 생성
- [ ] 일정 목록 조회 (날짜 기준 정렬)
- [ ] 일정 상세 조회
- [ ] 일정 등록/수정/삭제 (권한 확인)

---

## 일정 목록 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 일정 목록 UI
- [ ] `lib/screens/schedules/schedule_list_screen.dart` 생성
- [ ] 일정 리스트 또는 캘린더 뷰 (선택)
- [ ] 일정 카드 위젯
  - 날짜 (큰 글씨, 강조)
  - 제목
  - 시간 (시작 시간 - 종료 시간)
  - 장소
  - 'N' 배지 (새 일정)
- [ ] 일정 등록 버튼 (권한 있는 사용자만 표시)
- [ ] 오늘 이후 일정 우선 표시
- [ ] 날짜별 그룹핑 (선택)

### [ ] 일정 목록 Provider
- [ ] `lib/providers/schedule_list_provider.dart` 생성

---

## 일정 상세 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 일정 상세 UI
- [ ] `lib/screens/schedules/schedule_detail_screen.dart` 생성
- [ ] 일정 내용 표시
  - 제목
  - 날짜 (큰 글씨)
  - 시간 (시작 시간 - 종료 시간)
  - 장소
  - 설명
- [ ] 공감 버튼 및 수
- [ ] 댓글 섹션
- [ ] 수정/삭제 버튼 (작성자만)

### [ ] 일정 상세 Provider
- [ ] `lib/providers/schedule_detail_provider.dart` 생성

---

## 일정 등록 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 일정 등록 UI
- [ ] `lib/screens/schedules/schedule_create_screen.dart` 생성
- [ ] 제목 입력 필드
- [ ] 날짜 선택 (DatePicker)
- [ ] 시작 시간 선택 (TimePicker)
- [ ] 종료 시간 선택 (TimePicker, 선택)
- [ ] 장소 입력 필드
- [ ] 설명 입력 필드 (여러 줄)
- [ ] 유효성 검증 (제목, 날짜 필수)
- [ ] 권한 확인 (화면 진입 시)

### [ ] 일정 등록 Provider
- [ ] `lib/providers/schedule_create_provider.dart` 생성

---

## 일정 수정 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 일정 수정 UI
- [ ] `lib/screens/schedules/schedule_edit_screen.dart` 생성
- [ ] 기존 내용 불러오기 (제목, 날짜, 시간, 장소, 설명)
- [ ] 제목/날짜/시간/장소/설명 수정 필드
- [ ] 수정 권한 확인 (작성자만)
- [ ] 수정 완료 버튼

### [ ] 일정 수정 기능
- [ ] 일정 수정 Provider
  - 기존 일정 데이터 조회
  - 수정된 내용 저장
- [ ] 수정 완료 후 상세 화면으로 이동

---

## 참석자 조사 기능

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 참석자 조사 모델 생성
- [ ] `lib/models/attendance_survey_model.dart` 생성
  - AttendanceStatus enum (attending, notAttending, undecided)

### [ ] 참석자 조사 서비스
- [ ] `lib/services/attendance_survey_service.dart` 생성
- [ ] 참석 여부 조회/업데이트
- [ ] 참석자 통계 조회
- [ ] 참석자 목록 조회

### [ ] 참석자 조사 Provider 및 UI
- [ ] `lib/providers/attendance_survey_provider.dart` 생성
- [ ] 참석 여부 선택 버튼 (3개)
- [ ] 선택된 상태 표시
- [ ] 참석자 통계 표시
- [ ] 참석자 목록 표시 (선택)

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

- [ ] 공지사항 목록 표시 및 고정 공지 우선 노출
- [ ] 공지사항 작성 권한 확인 정상 작동
- [ ] 공지사항 수정 가능 (작성자만)
- [ ] 공지사항 삭제 가능 (작성자만)
- [ ] 참석자 조사 기능 정상 작동
- [ ] 일정 목록 날짜 기준 정렬 표시
- [ ] 일정 등록 권한 확인 정상 작동
- [ ] 일정 수정 가능 (작성자만)
- [ ] 일정 삭제 가능 (작성자만)
- [ ] 공지사항과 일정 모두 댓글/공감 기능 정상 작동

---

## 다음 단계
이 단계 완료 후 **04-member-profile-and-home.md**로 진행
