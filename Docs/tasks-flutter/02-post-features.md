# 2단계: 게시글 관련 기능 구현

**기간**: 2일차 ~ 3일차
**목표**: 게시글 목록/상세/작성 및 댓글/공감 기능 완성

> **선행 조건**:
> - [x] 1단계 완료 (인증 시스템 구축)

> **참고**:
> - 게시판은 **공지 게시판**(category=notice)과 **일반 게시판**(category=general) 탭으로 구분
> - 공지 게시판: 관리자만 작성 가능, 고정(pin) 기능 지원
> - 일반 게시판: 모든 승인된 회원 작성 가능
> - 수정/삭제는 작성자 또는 관리자만 가능
> - 이미지 첨부는 최대 5개까지 가능

> **역할 구분**:
> - 🤖 **Cursor(AI)**: Cursor가 혼자 진행 가능한 작업
> - 👤 **사용자**: 사용자가 직접 해야 하는 작업 (테스트, 검증 등)

---

## 백엔드 API 업데이트

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 게시글 API 업데이트 (`api/routes/posts.js`)
- [x] GET /api/posts — `?category=notice|general` 필터링 지원
- [x] 공지 게시판: `is_pinned DESC` 정렬 (고정 공지 우선)
- [x] POST /api/posts — `is_pinned` 필드 지원 (공지만)
- [x] PUT /api/posts/:id — `is_pinned` 필드 지원
- [x] GET /api/posts/:id/comments — `parent_comment_id` 포함
- [x] POST /api/posts/:id/comments — `parent_comment_id` 지원 (대댓글)
- [x] DELETE /api/posts/:id/comments/:commentId — 댓글 삭제 (soft delete)
- [x] DB 마이그레이션 스크립트 (`api/migrate_posts.js`)

---

## 게시글 모델 및 서비스

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 게시글 모델 생성
- [x] `lib/models/post_model.dart` 생성 (Freezed)
  - id, authorId, title, content, images, category, isPinned
  - views, likesCount, commentsCount, readByCurrentUser, userHasLiked
  - createdAt, updatedAt, authorName, authorImage
- [x] `lib/models/comment_model.dart` 생성 (Freezed)
  - id, authorId, content, parentCommentId, createdAt
  - authorName, authorImage
- [x] build_runner 실행 완료

### [x] 게시글 서비스
- [x] `lib/services/post_service.dart` 생성
- [x] getList() — 카테고리별 목록 조회
- [x] getById() — 상세 조회
- [x] create() / update() / delete() — CRUD
- [x] toggleLike() — 공감 토글
- [x] getComments() / createComment() / deleteComment() — 댓글 CRUD

---

## 통합 게시판 화면 (BoardScreen)

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 게시판 메인 UI (`lib/screens/posts/board_screen.dart`)
- [x] TabBar: "공지 게시판" / "일반 게시판"
- [x] 각 탭별 PostListTab (카테고리 필터)
- [x] FAB 조건부 표시
  - 공지 탭: 관리자만 표시
  - 일반 탭: 모든 회원 표시
- [x] 게시글 카드 위젯
  - 제목, 본문 미리보기 (2줄)
  - 작성자, 작성일
  - 댓글/공감/조회수 아이콘
  - 고정 공지 핀 아이콘
  - N 배지 (3일 이내 + 미읽음)
- [x] Pull-to-refresh
- [x] 빈 상태 메시지

### [x] 게시판 Provider
- [x] `lib/providers/post_list_provider.dart` 생성
- [x] noticePostListProvider (공지 목록)
- [x] generalPostListProvider (일반 목록)
- [x] postDetailProvider (상세)
- [x] postCommentsProvider (댓글 목록)

---

## 게시글 상세 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 게시글 상세 UI (`lib/screens/posts/post_detail_screen.dart`)
- [x] 제목, 작성자 정보 (아바타, 이름, 날짜)
- [x] 고정 공지 표시
- [x] 본문 내용
- [x] 첨부 이미지 표시
- [x] 조회수 표시
- [x] 공감 버튼 (토글, 카운트)
- [x] 댓글 섹션 (대댓글 들여쓰기)
- [x] 댓글 입력 (하단 고정)
- [x] 답글 입력 (인라인)
- [x] 댓글 삭제 (작성자/관리자)
- [x] 수정/삭제 메뉴 (PopupMenuButton, 작성자/관리자)

---

## 게시글 작성/수정 화면

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 게시글 작성 UI (`lib/screens/posts/post_create_screen.dart`)
- [x] 제목/본문 입력 필드
- [x] 유효성 검증 (필수 필드)
- [x] 상단 고정 스위치 (공지 게시판만)
- [x] 등록 버튼 (로딩 상태)

### [x] 게시글 수정 UI (`lib/screens/posts/post_edit_screen.dart`)
- [x] 기존 내용 불러오기
- [x] 제목/본문 수정
- [x] 상단 고정 스위치 (공지만)
- [x] 저장 버튼 (로딩 상태)
- [x] 수정 완료 후 목록/상세 새로고침

---

## 라우터 업데이트

> **역할**: 🤖 **Cursor(AI)** 전담

### [x] 라우트 설정
- [x] `/home/board` → BoardScreen (탭 게시판)
- [x] `/home/board/create?category=notice|general` → PostCreateScreen
- [x] `/home/board/:id` → PostDetailScreen
- [x] `/home/board/:id/edit` → PostEditScreen

---

## 개발자 작업

> **역할**: 👤 **사용자** 전담

### [ ] DB 마이그레이션 실행
- [ ] `node api/migrate_posts.js` 실행
- [ ] posts.is_pinned, comments.parent_comment_id 컬럼 확인

### [ ] 테스트 및 검증
- [ ] 공지 게시판 / 일반 게시판 탭 전환 확인
- [ ] 게시글 작성 플로우 테스트
- [ ] 게시글 수정/삭제 테스트
- [ ] 댓글/대댓글 작성/삭제 테스트
- [ ] 공감 토글 테스트
- [ ] N 배지 표시/해제 확인
- [ ] FAB 권한 분기 확인 (공지탭: 관리자만, 일반탭: 모든 회원)

---

## 완료 기준

- [x] 통합 게시판(공지/일반 탭) 정상 작동
- [x] 게시글 CRUD (작성/조회/수정/삭제)
- [x] 댓글/대댓글 작성/삭제
- [x] 공감 토글 및 카운트 표시
- [x] N 배지 (3일 이내 + 미읽음)
- [x] 고정 공지 (핀) 기능
- [x] FAB 권한 분기

---

## 다음 단계
이 단계 완료 후 **03-notice-and-schedule.md**로 진행
