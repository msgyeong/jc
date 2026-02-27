# 2단계: 게시글 관련 기능 구현

> **체크리스트·완료 기준**: **../tasks-common/02-post-features.md**와 동일합니다.

---

## 웹 구현 참고

- **목록**: `web/js/posts.js` — `loadPostsScreen()`, `loadPosts(page)`, `createPostCard()`, 무한 스크롤(sentinel).
- **작성**: `#post-create-screen`, `handlePostCreateSubmit`, `apiClient.createPost()`. 등록 후 목록 갱신·게시판 복귀.
- **API**: `api/routes/posts.js` — GET/POST/PUT/DELETE /api/posts.
- **미구현(웹)**: 상세 화면, 이미지 첨부, 수정/삭제, 댓글/공감 UI.

완료 시 **tasks-common/02** 체크박스 동기화.
