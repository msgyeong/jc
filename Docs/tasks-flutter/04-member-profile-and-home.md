# 4단계: 회원/프로필 및 홈 화면 기능 구현

**기간**: 6일차 ~ 7일차
**목표**: 회원 목록/검색, 프로필 상세/수정, 홈 화면 요약 정보 제공 기능 완성

> **선행 조건**:
> - [x] 3단계 완료 (공지사항 및 일정 기능)

> **참고**:
> - 프로필 수정: 이름, 연락처, 주소, 생년월일, 성별 수정 가능
> - 프로필 이미지: 카메라/갤러리에서 선택 후 Railway API 업로드

> **역할 구분**:
> - 🤖 **Cursor(AI)**: Cursor가 혼자 진행 가능한 작업
> - 👤 **사용자**: 사용자가 직접 해야 하는 작업 (테스트, 검증 등)

---

## 회원 서비스

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 회원 서비스
- [x] `lib/services/member_service.dart` 생성
- [x] 회원 목록 조회 (페이지네이션) — `GET /api/members?page=&limit=`
- [x] 회원 검색 — `GET /api/members/search?q=`
- [x] 회원 상세 조회 — `GET /api/members/:id`
- [x] `_normalize()` 변환

---

## 회원 목록 및 검색 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 회원 목록 UI
- [x] `lib/screens/members/member_list_screen.dart` 생성
- [x] 검색 입력 필드 (AppBar 토글 — search 아이콘 클릭)
- [x] 회원 리스트 (ListView.builder + Card)
- [x] 회원 카드 위젯
  - 프로필 사진 (원형 CircleAvatar, 이니셜 fallback)
  - 이름
  - 역할 배지 (총괄관리자/관리자)
  - 연락처
- [x] Pull-to-refresh (RefreshIndicator)
- [x] 빈 상태 메시지

### [x] 회원 검색 기능
- [x] 이름 검색 (onSubmitted)
- [x] 검색 취소 시 전체 목록 복원

### [x] 회원 목록 Provider
- [x] `lib/providers/member_list_provider.dart` 생성
- [x] StateNotifierProvider 사용
- [x] search() 메서드

---

## 회원 상세 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 회원 상세 UI
- [x] `lib/screens/members/member_detail_screen.dart` 생성
- [x] 프로필 헤더
  - 프로필 사진 (큰 원형 CircleAvatar radius:48)
  - 이름 (headlineSmall + bold)
  - 역할 배지 (Chip)
- [x] 프로필 정보 카드
  - 이메일, 연락처, 주소, 성별, 생년월일, 가입일
  - 아이콘 + 라벨 + 값 구조

### [x] 회원 상세 Provider
- [x] `lib/providers/member_list_provider.dart`에 `memberDetailProvider` 포함
- [x] FutureProvider.family 사용

---

## 내 프로필 탭 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 내 프로필 탭 UI
- [x] `lib/screens/profile_tab_screen.dart` 완전 구현 (ConsumerWidget)
- [x] AppBar 타이틀: "내 프로필"
- [x] AppBar 우측 상단 로그아웃 버튼 (확인 다이얼로그 포함)
- [x] 프로필 헤더
  - 프로필 사진 (원형, 카메라 버튼 오버레이)
  - 이름, 역할 배지
- [x] 프로필 정보 카드 (이메일, 연락처, 주소, 성별, 생년월일)
- [x] "프로필 수정" 버튼 (OutlinedButton.icon)

### [x] 프로필 사진 변경
- [x] 카메라/갤러리 선택 BottomSheet
- [x] ImageUploader.pickAndUpload() 사용
- [x] ProfileProvider.updateImage() 호출
- [x] 업로드 중 로딩 표시

---

## 프로필 수정 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 프로필 수정 UI
- [x] `_ProfileEditScreen` (profile_tab_screen.dart 내 private 클래스)
- [x] 이름 입력 필드 (필수)
- [x] 연락처 입력 필드
- [x] 주소 입력 필드
- [x] 생년월일 입력 필드 (YYYY-MM-DD)
- [x] 성별 드롭다운 (남성/여성)
- [x] 저장 버튼 (FilledButton with loading state)

### [x] 프로필 수정 기능
- [x] `lib/providers/profile_provider.dart` 생성 (AsyncNotifierProvider)
- [x] `lib/services/profile_service.dart` 생성
  - `GET /api/profile` — 프로필 조회
  - `PUT /api/profile` — 프로필 수정
  - `PUT /api/profile/image` — 프로필 이미지 변경
- [x] 수정 완료 후 프로필 새로고침 + SnackBar 알림

---

## 홈 화면 구현

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 홈 화면 UI
- [x] `lib/screens/home_tab_screen.dart` 생성 (ConsumerWidget)
- [x] 인사말 카드 (사용자 이름 표시, primaryColor 배경)
- [x] 최근 공지사항 섹션
  - 섹션 헤더 ("최근 공지사항", "더보기" 버튼 → `/home/notices`)
  - 공지 요약 리스트 (최대 3개)
  - 고정 공지 아이콘 표시
  - 빈 상태 카드
- [x] 다가오는 일정 요약 섹션
  - 섹션 헤더 ("다가오는 일정", "더보기" 버튼 → `/home/schedule`)
  - 일정 요약 리스트 (최대 3개)
  - 날짜 + 장소 표시
  - 빈 상태 카드
- [x] Pull-to-refresh (공지 + 일정 동시 새로고침)

### [x] 홈 화면 데이터
- [x] noticeListProvider, scheduleListProvider 재활용
- [x] 별도 homeProvider 없이 기존 프로바이더 활용

### [ ] 배너 기능 (미구현)
- [ ] 배너 모델/서비스 — 백엔드 배너 API 미구현
- [ ] 배너 슬라이드 위젯

---

## 하단 탭 내비게이션 완성

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 하단 탭 내비게이션 완성
- [x] `lib/widgets/main_navigation.dart` (1단계에서 생성, 완성됨)
- [x] 5개 탭: 홈, 게시판, 일정, 회원, 내 프로필
- [x] 각 탭별 라우트 상세 구현 완료
- [x] 현재 탭 하이라이트
- [x] GoRouter ShellRoute 통합

---

## 라우터 업데이트

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 라우트 추가
- [x] `/home` → HomeTabScreen
- [x] `/home/schedule` → ScheduleListScreen
- [x] `/home/schedule/create` → ScheduleCreateScreen
- [x] `/home/schedule/:id` → ScheduleDetailScreen
- [x] `/home/members` → MemberListScreen
- [x] `/home/members/:id` → MemberDetailScreen
- [x] `/home/profile` → ProfileTabScreen
- [x] placeholder 파일 삭제 (home_placeholder_screen.dart, tab_placeholder_screen.dart)

---

## 개발자 작업

> **역할**: 👤 **사용자** 전담

### [ ] 테스트 및 검증
- [ ] 회원 검색 테스트
- [ ] 프로필 정보 표시 확인
- [ ] 프로필 수정 테스트
- [ ] 프로필 사진 업데이트 테스트
- [ ] 홈 화면 로딩 테스트
- [ ] 내비게이션 플로우 테스트

---

## 완료 기준

- [x] 회원 목록 표시 및 검색 정상 작동
- [x] 회원 상세 화면 정보 표시
- [x] 내 프로필 조회/수정/사진변경 가능
- [x] 홈 화면 공지사항, 일정 요약 표시
- [x] 하단 탭 내비게이션 정상 작동
- [ ] 배너 기능 (백엔드 API 미구현)

---

## 다음 단계
이 단계 완료 후 **05-admin-web.md**로 진행
