# 게시판 구조 & 회원 상태 명세

## 게시판 구조

하단 탭 "게시판" 하나에 **공지 게시판** / **일반 게시판** 두 개 서브탭을 운영한다.

```
┌─────────────────────────────────────┐
│  게시판                    [+ 작성]  │  ← AppBar
├──────────────┬──────────────────────┤
│  공지 게시판  │   일반 게시판         │  ← TabBar (서브탭)
├──────────────┴──────────────────────┤
│  [게시글 카드] ...무한 스크롤...      │  ← TabBarView
├─────────────────────────────────────┤
│  홈 │ 게시판 │ 일정 │ 회원 │ 프로필  │  ← 하단 탭
└─────────────────────────────────────┘
```

- **공지 게시판**: `category = 'notice'` — 관리자/지정 직책만 작성 (`can_post_notice = true`)
- **일반 게시판**: `category = 'general'` — 모든 승인된 회원 작성 가능
- **FAB(+)**: 공지탭은 권한자만, 일반탭은 모든 회원에게 노출
- **고정 공지**: `is_pinned = true` → 공지탭 상단 고정
- 댓글/대댓글(대대댓글 불가), 공감(토글), N배지(3일 이내+미읽음), 이미지(최대 5개) 동일 적용

---

## 회원 상태 체크 로직

| 조건 | 상태 |
|------|------|
| `is_approved = false`, `rejection_reason IS NULL` | 승인 대기 |
| `is_approved = false`, `rejection_reason IS NOT NULL` | 가입 거절 |
| `is_suspended = true` | 정지 |
| `withdrawn_at IS NOT NULL` 또는 `is_deleted = true` | 탈퇴 |
| `is_approved = true`, `is_suspended = false` | 정상 (로그인 허용) |

---

## API 응답 형식 표준

```json
// 성공
{ "success": true, "data": { ... } }

// 성공 (목록)
{ "success": true, "data": { "items": [...], "total": 100, "page": 1, "totalPages": 5 } }

// 실패
{ "success": false, "error": "에러 메시지", "code": "ERROR_CODE" }
```
