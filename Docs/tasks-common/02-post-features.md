# 2단계: 게시글 관련 기능 구현

**기간**: 2일차 ~ 3일차  
**목표**: 게시글 목록/상세/작성 및 댓글/공감 기능 완성

> **현재 문서는 웹 버전 기준으로 체크합니다.** Flutter는 차후 `../tasks-flutter/02-post-features.md` 참고.

---

## 게시판 구분 및 정책 (요구사항)

> 상세 정책: **02-0-board-and-schedule-policy.md** 참고.

- **공지사항 게시판**: 관리자 및 **관리자가 지정한 사람**만 작성 가능. 일정 첨부 가능, 추후 일정과 연동.
- **일반 게시판**: **모든 승인된 회원**이 작성 가능. 일정 첨부 가능, 추후 일정과 연동.
- **일정 첨부**: 두 게시판 모두 일정을 첨부할 수 있으며, 추후 일정 기능과 연동(푸시 알람, 참석 인원 옵션 등).
- **N배지**: 새 게시물에 N 표시. **읽은 사용자**는 로그인 시 해당 글에 대해 **N이 사라지도록** 개인별 읽음 상태 저장·반영 필요.

---

## 웹 기준 체크리스트

### 백엔드(API) — 웹
- [x] 게시글 목록 조회 (페이지네이션) — `api/routes/posts.js` GET /api/posts
- [x] 게시글 상세 조회 (조회수 증가) — GET /api/posts/:id
- [x] 게시글 작성 — POST /api/posts
- [x] 게시글 수정 — PUT /api/posts/:id
- [x] 게시글 삭제 — DELETE /api/posts/:id
- [x] **게시판 구분**: 공지사항(category=notice, 관리자만 작성) vs 일반(category=general) — POST/PUT 권한·작성 폼 게시판 선택
- [x] **일정 첨부**: 게시글 schedule_id 필드·API (작성/수정 시 연결 일정 ID)

### 게시글 목록 — 웹
- [x] 목록 로드 (loadPostsScreen, loadPosts)
- [x] 게시글 카드 (제목, 작성자, 작성일 상대시간, 미리보기, 댓글/공감 수, N배지, 첫 이미지 썸네일)
- [x] 게시글 작성 버튼 (FAB)
- [x] 무한 스크롤
- [x] 빈 상태 메시지

### 게시글 상세 — 웹
- [x] 상세 화면 (#post-detail-screen)
- [x] 제목, 작성자, 작성일, 본문, 첨부 이미지 표시
- [x] 조회/댓글/공감 수 표시
- [x] 수정/삭제 버튼 (작성자 또는 관리자만)
- [x] 삭제 API 연동 (확인 후 삭제, 목록 복귀)
- [x] 수정 화면·API 연동 (#post-edit-screen, PUT, 저장 후 상세 복귀)
- [x] 공감 버튼·토글 (POST /api/posts/:id/like, user_has_liked 표시)
- [x] 댓글 섹션 (목록 GET /api/posts/:id/comments, 작성 POST, 상세에 표시)

### 게시글 작성 — 웹
- [x] 작성 화면 (#post-create-screen)
- [x] 제목·본문 필수, 유효성·에러 인라인 표시
- [x] 등록 API 연동, 등록 후 목록 갱신·게시판 복귀
- [x] 이미지 첨부 (최대 5개) — UI·업로드(POST /api/upload)·URL 입력·images 배열 저장

### 게시글 수정 — 웹
- [x] 수정 화면 (기존 내용 불러오기, 제목/본문)
- [x] 수정 API 연동, 완료 후 상세 복귀

### 댓글 — 웹
- [x] 댓글 API (목록 GET /:id/comments, 작성 POST /:id/comments)
- [x] 댓글 목록·작성 UI (상세 화면 내)

### 공감 — 웹
- [x] 공감 API (토글 POST /:id/like, GET 상세 시 user_has_liked)
- [x] 공감 버튼 UI (상세)

### N배지 — 웹
- [x] 3일 이내 새 게시글 N배지 (목록·상세 구분 없이 생성일 기준)
- [x] **개인별 읽음 처리**: 읽은 사용자에게는 N 미표시 (post_reads 저장·상세 조회 시 기록·목록에 read_by_current_user 반영)

---

## 웹 다음 작업 순서

1. **이미지 첨부 (작성 시)** — 작성 폼에 이미지 추가 UI, 업로드 또는 URL 입력, POST 시 images 배열
2. **게시글 수정** — 수정 화면 추가, GET으로 기존 데이터 로드 후 PUT 연동
3. **댓글** — 백엔드 댓글 API 있으면 웹 댓글 목록·작성 UI
4. **공감** — 백엔드 공감 API 있으면 웹 공감 버튼·토글

---

## 완료 기준 (웹)

- [x] 게시글 목록 정상 표시 및 무한 스크롤
- [x] 게시글 작성 가능 (제목/본문)
- [x] 게시글 수정 가능 (작성자 또는 관리자)
- [x] 게시글 삭제 가능 (작성자 또는 관리자)
- [x] 댓글 작성 가능 (상세 화면 목록·작성)
- [x] 공감 기능 정상 작동 (토글, 상세 화면)
- [x] 새 게시글 N배지 표시 (3일 이내)
- [x] N배지: 로그인 사용자별 읽음 처리 시 해당 글 N 미표시

---

## 참고: Flutter (차후)

아래는 Flutter 앱 구현 시 참고용입니다. **웹 진행은 위 체크리스트 기준.**

- 게시글 모델/서비스: `lib/models/post_model.dart`, `lib/services/post_service.dart`
- 목록: `lib/screens/posts/post_list_screen.dart`, ListView.builder, Provider
- 상세: `lib/screens/posts/post_detail_screen.dart`, 이미지 뷰어, 읽음 상태
- 작성/수정: 이미지 첨부 최대 5개, 네이버 밴드 방식
- 댓글: comment_model, comment_service, comment_provider, 대댓글
- 공감: like_service, like_provider

---

## 다음 단계
웹 기준 위 체크리스트 완료 후 **03-notice-and-schedule.md**로 진행
