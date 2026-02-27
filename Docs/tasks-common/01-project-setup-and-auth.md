# 1단계: 프로젝트 설정 및 인증 시스템 구축

**기간**: 1일차 ~ 1.5일차  
**목표**: 프로젝트 기반 구조 구축 및 인증 시스템 완성

---

## 웹 구현 완료 현황 (코드 분석 기준)

- [x] **웹** 로그인 화면 (이메일/비밀번호, 비밀번호 토글, 로그인 유지, 회원가입 링크) — `web/index.html`, `web/js/auth.js`
- [x] **웹** 로그인 로직 (apiClient.login, JWT 저장, 회원 상태 확인, 에러 인라인 표시) — `web/js/auth.js`, `api/routes/auth.js`
- [x] **웹** 회원가입 화면 (다단계 폼), 승인 대기 화면 — `web/js/signup.js`, `#signup-screen`, `#pending-approval-screen`
- [x] **웹** 회원가입 API 연동 (apiClient.signup) — `api/routes/auth.js` signup
- [x] **웹** 스플래시 화면, 인증 확인 후 로그인/홈 전환 — `web/js/app.js`, `#splash-screen`
- [x] **웹** 로그아웃, 세션(토큰) 관리, 미인증 시 로그인 리다이렉트 — `web/js/auth.js`, api-client clearToken
- [ ] **웹** 비밀번호 찾기/재설정
- [ ] **웹** 회원 상태별 처리 (거절/정지/탈퇴 시 로그인 차단)

> **선행 조건**: 
> - [ ] Flutter SDK 설치 완료
> - [ ] 개발 환경 설정 완료 (Android Studio / VS Code)

> **참고**: 
> - Supabase 프로젝트는 개발자가 직접 생성해야 함
> - schema.sql 파일은 Supabase 대시보드에서 실행 필요

> **역할 구분**: 
> - 🤖 **Cursor(AI)**: Cursor가 혼자 진행 가능한 작업
> - 👤 **사용자**: 사용자가 직접 해야 하는 작업 (환경 설정, 테스트 등)

---

## 프로젝트 초기 설정

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] Flutter 프로젝트 구조 생성
- [x] 폴더 구조 생성 (lib/models, lib/providers, lib/screens, lib/widgets, lib/services, lib/utils)
- [x] pubspec.yaml 의존성 추가
  - flutter_riverpod, supabase_flutter, freezed_annotation, json_annotation
  - go_router, cached_network_image, image_picker, image_cropper
  - flutter_dotenv, google_fonts, shared_preferences, intl
  - build_runner, freezed, json_serializable (dev)
- [x] 디자인 시스템 적용 준비
  - 색상 팔레트 참고 (design-system/01-color-palette.md)
  - 타이포그래피 참고 (design-system/02-typography.md)
  - 컴포넌트 스타일 참고 (design-system/03-component-styles.md)
  - **라이트 테마만 사용** (다크 테마 미사용)

### [x] Supabase 클라이언트 설정
- [x] `lib/services/supabase_service.dart` 생성
- [x] 환경 변수에서 URL, anon key 읽기
- [x] 초기화 로직 구현

### [x] 환경 변수 관리
- [x] `.env` 파일 생성 (gitignore에 추가)
- [x] Supabase URL, Anon Key 설정 (사용자 작업: Supabase 프로젝트 생성 후 설정)
- [x] flutter_dotenv 패키지 설정
- [x] 환경별 설정 분리 (dev/prod)

### [x] 디자인 시스템 기본 설정
- [x] 테마 파일 생성 (`lib/theme/app_theme.dart`)
- [x] 색상 팔레트 적용 (design-system/01-color-palette.md)
  - Primary: `#1F4FD8`
  - Secondary: `#E6ECFA`
  - Accent: `#F59E0B`
  - Error: `#DC2626`
  - **라이트 테마만 사용** (다크 테마 미사용)
- [x] 타이포그래피 기본 설정 (design-system/02-typography.md)
  - Noto Sans KR 폰트 설정
  - 기본 텍스트 스타일 정의
- [x] MaterialApp 테마 설정

### [x] 이미지 업로드 기본 유틸리티
- [x] `lib/utils/image_uploader.dart` 생성 (기본 구조)
  - 이미지 선택 (카메라/갤러리)
  - 이미지 크롭 (image_cropper)
  - Supabase Storage 업로드 기본 로직
  - 업로드 진행 상태 관리 기본 구조

### [x] 기본 에러 처리 구조
- [x] 전역 에러 핸들러 기본 구조 (`lib/utils/error_handler.dart`)
- [x] 에러 타입 정의
- [x] 사용자 친화적 에러 메시지 매핑 기본 구조

---

## 인증 모델 정의

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 인증 관련 모델 생성
- [x] `lib/models/auth/user_model.dart` 생성 (Freezed)
- [x] `lib/models/auth/member_model.dart` 생성 (Freezed)
  - schema.sql의 members 테이블 구조와 일치
  - `@JsonSerializable(fieldRename: FieldRename.snake)` 적용
- [x] build_runner 실행하여 코드 생성

---

## 로그인 화면 구현

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 로그인 화면 UI
- [x] `lib/screens/auth/login_screen.dart` 생성
- [x] 이메일/비밀번호 입력 필드
- [x] 비밀번호 표시/숨김 토글
- [x] 로그인 버튼
- [x] "비밀번호 찾기", "회원가입" 버튼
- [x] 로그인 유지 옵션

### [x] 로그인 로직
- [x] `lib/providers/auth_provider.dart` 생성
- [x] Supabase Auth 로그인 로직
- [x] 회원 상태 확인 (is_approved, is_suspended, withdrawn_at)
- [x] 상태별 리다이렉트 처리
- [x] 유효성 검증 (이메일 형식, 비밀번호 8자리 이상)
- [x] 오류 메시지 인라인 표시 (SelectableText.rich)

---

## 회원가입 화면 구현

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 회원가입 화면 UI
- [x] `lib/screens/auth/signup_screen.dart` 생성
- [x] 단계형 폼 구조 (6단계)
  - Step 1: 로그인 정보 (이메일, 비밀번호, 비밀번호 확인)
  - Step 2: 기본 정보 (프로필 사진, 성명, 주민등록번호, 주소, 휴대폰)
  - Step 3: 직장 정보 (선택)
  - Step 4: 학력/경력 정보
  - Step 5: 가족 정보
  - Step 6: 기타 정보
- [x] 상단 진행 표시 (1/6, 2/6 등)
- [x] 이전/다음 버튼
- [x] 필수/선택 라벨 표시

### [x] 회원가입 기능
- [x] 프로필 사진 업로드 (이미지 업로드 유틸리티 사용, 1매 필수, 500MB 이하)
- [x] Supabase Storage 업로드
- [x] 입력 필드 특수 처리
  - 주민등록번호: 숫자 키패드, 자동 하이픈, 마스킹
  - 휴대폰: 숫자 키패드, 자동 하이픈
  - 주소: 주소 검색 API 연동 (Daum 우편번호 서비스, 상세 주소 선택)
- [x] 유효성 검증 (실시간, 인라인 오류 표시)
- [x] 회원가입 Provider 구현
  - Supabase Auth 사용자 생성
  - members, educations, careers, families 테이블 저장
  - `is_approved = false` 설정
- [x] 회원가입 완료 후 플로우
  - "승인 요청" 버튼 클릭 → 회원가입 정보 저장
  - 다음 화면: "회원 가입이 승인 진행중입니다" + '확인' 버튼
  - 확인 버튼 클릭 → 로그인 화면으로 복귀

### [x] 회원가입 플로우 Storage 정책 적용 (리팩토링 완료)

> **역할**: 🤖 **Cursor(AI)** 전담  
> **목적**: Storage RLS 정책과 호환되도록 회원가입 순서 변경

**적용된 순서**:
1. **Auth 계정 생성** (`signUp`) → 사용자 ID 생성
2. **프로필 사진 업로드** → `profiles/{userId}/avatar.jpg`
3. **members INSERT** → 회원 정보 저장

- [x] `lib/providers/signup_provider.dart` 수정
  - `submit()` 메서드에서 순서 변경: signUp → upload → insert
  - 업로드 경로: `profiles/${userId}/avatar.jpg`
  - 실패 시 롤백 처리 (Auth 사용자 삭제 등): 추후 검토
  - **디버깅 후**: `submit()` catch 블록의 디버깅용 로그 제거 (`developer.log('Signup submit error: ...')`, `developer.log('Stack: ...')` 및 `import 'dart:developer'` 제거)
- [x] `lib/utils/image_uploader.dart` 수정
  - 버킷 이름 확인: `profiles`
  - MIME 타입 동적 처리 (jpeg, png, webp)

---

## 인증 가드 및 라우팅

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 라우팅 설정
- [x] GoRouter 설정 (`lib/routes/app_router.dart`)
- [x] 인증 필요 라우트 정의
- [x] 인증 가드 미들웨어 구현

### [x] 하단 탭 네비게이션 기본 구조
- [x] `lib/widgets/main_navigation.dart` 생성 (기본 구조)
- [x] 탭 구성 정의 (홈, 게시판, 일정, 회원, 내 프로필)
- [x] 기본 라우팅 구조 설정
- [x] 인증 가드 통합 (미인증 사용자는 하단 탭 숨김)
- [x] 각 탭별 기본 라우트 정의 (상세 구현은 이후 단계에서)

### [x] 인증 상태 관리
- [x] 인증 상태 Provider
- [x] 로그인 상태 유지 (SharedPreferences 또는 secure_storage)
- [x] 미인증 사용자 자동 리다이렉트

### [x] 세션 관리
- [x] Supabase 세션 갱신 로직
- [x] 토큰 만료 처리
- [x] 자동 로그아웃 처리 (장기 미사용 시)
- [x] 세션 만료 시 로그인 화면으로 리다이렉트
- [x] 로그아웃 버튼 (내 프로필 탭 우측 상단, 4단계 항목 선행 구현 → 테스트 편의)

### [x] 스플래시 화면
- [x] `lib/screens/splash_screen.dart` 생성
- [x] `assets/images/jc_logo_slash.png` 표시 (PRD 기준 파일명)
- [x] 인증 상태 확인 (최대 3초)
- [x] 로그인 화면 또는 홈 화면으로 전환

---

## 개발자 작업 (선행)

> **역할**: 👤 **사용자** 전담  
> **순서**: 아래 작업을 **먼저** 완료한 뒤, 회원 상태별 처리·비밀번호 찾기 구현을 진행한다.

### [x] 환경 설정
- [x] Flutter SDK 버전 확인 (Flutter 3.x 권장)
- [x] Supabase 프로젝트 생성
- [x] schema.sql 파일 실행 (Supabase 대시보드)
- [x] Storage 버킷 생성 및 정책 설정 (프로필 사진용)
  - 버킷 이름: `profiles`
  - Public: ON (URL 직접 접근 허용)
  - RLS 정책 설정 (schema.sql 하단 주석 참고)
    - SELECT: 로그인 사용자 전체 조회 가능
    - INSERT/UPDATE/DELETE: 본인 폴더(`profiles/{auth.uid()}/`)만 허용
- [x] 환경 변수 설정 (.env 또는 flutter_dotenv)
  - `.env` 파일 생성 및 gitignore 추가
  - Supabase URL, Anon Key 설정
  - 환경별 설정 분리 (dev/prod): 현재는 단일 `.env`로 충분, 필요 시 추후 적용

### [x] RLS 정책 확인
- [x] Supabase RLS 정책 적용 확인
  - members: 신규 회원 INSERT, 자기 정보 조회/수정, 다른 회원 조회
  - educations, careers, families, children: 자기 정보 INSERT/조회
- [x] Storage RLS 정책 적용 확인 (schema.sql 하단 주석 참고)
  - profiles 버킷: SELECT(로그인 사용자 전체), INSERT/UPDATE/DELETE(본인 폴더만)
- [x] 승인된 회원만 데이터 접근 가능 확인
- [x] 권한 기반 접근 제어 확인
- [x] 테스트 계정으로 RLS 정책 검증

### [ ] 테스트 및 검증
- [ ] `flutter pub run build_runner build --delete-conflicting-outputs` 실행
- [x] 로그인 플로우 테스트
  - [x] 정상 로그인
  - [x] 잘못된 이메일/비밀번호 (한글 안내: "등록되지 않은 이메일이거나 비밀번호가 맞지 않아요.")
  - [ ] 가입대기/거절/정지/탈퇴 상태 회원 로그인 시도
- [x] 회원가입 플로우 전체 테스트
  - [x] 모든 필수 항목 입력
  - [x] 프로필 사진 업로드
  - [x] 학력/경력 여러 개 추가
  - [x] 가족 정보 입력
- [ ] 로그인 상태 유지 테스트
- [ ] 인증 가드 테스트 (미로그인 상태 접근 차단)
- [ ] 주소 검색 API 연동 (필요시)

---

## 회원 상태별 처리

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 회원 상태 확인 로직
- [ ] `is_approved = false` → 승인 진행중 화면
- [ ] `is_approved = false && rejection_reason IS NOT NULL` → 로그인 차단, 거절 사유 표시
- [ ] `is_suspended = true` → 로그인 차단, 정지 안내
- [ ] `withdrawn_at IS NOT NULL` → 로그인 차단

### [ ] 승인 진행중 화면
- [ ] `lib/screens/auth/pending_approval_screen.dart` 생성
- [ ] "회원 가입이 승인 진행중입니다" 메시지
- [ ] "확인" 버튼 (로그인 화면으로 복귀)

---

## 비밀번호 찾기/재설정

> **역할**: 🤖 **Cursor(AI)** 전담

### [ ] 비밀번호 찾기 화면
- [ ] `lib/screens/auth/forgot_password_screen.dart` 생성
- [ ] 이메일 입력 필드
- [ ] 비밀번호 재설정 요청 버튼
- [ ] 유효성 검증 (이메일 형식)

### [ ] 비밀번호 재설정 기능
- [ ] Supabase Auth 비밀번호 재설정 이메일 발송
- [ ] 재설정 이메일 발송 완료 안내 화면
- [ ] 재설정 링크 클릭 시 비밀번호 재설정 화면 (`lib/screens/auth/reset_password_screen.dart`)
- [ ] 새 비밀번호 입력 및 확인
- [ ] 비밀번호 재설정 완료 처리
- [ ] 재설정 완료 후 로그인 화면으로 이동

---

## 완료 기준

- [x] 로그인 화면 정상 작동
- [ ] 비밀번호 찾기/재설정 기능 정상 작동
- [x] 회원가입 화면이 모든 필수 필드 수집 및 저장
- [x] 프로필 사진 Supabase Storage 업로드 성공
  - 경로: `profiles/{auth.uid()}/avatar.jpg`
  - 회원가입 순서: Auth 생성 → 업로드 → members INSERT
- [x] **(웹)** 미인증 사용자 보호된 화면 접근 차단 (checkAuthStatus, navigateToScreen('login'))
- [ ] 회원 상태별 처리 정확히 동작
- [x] **(웹)** 스플래시 화면 표시 및 올바른 화면 전환
- [x] 디자인 시스템 기본 설정 완료
- [x] 이미지 업로드 기본 유틸리티 생성 완료
- [x] 하단 탭 네비게이션 기본 구조 생성 완료
- [x] DB RLS 정책 적용 확인 완료 (members, educations, careers, families, children)
- [x] Storage RLS 정책 적용 확인 완료 (profiles 버킷)

---

## 다음 단계
이 단계 완료 후 **02-post-features.md**로 진행
