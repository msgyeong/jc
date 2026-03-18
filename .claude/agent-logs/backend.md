# 백엔드 에이전트 작업 이력

> 담당: `api/` 폴더 (Express 라우트, 미들웨어, DB 쿼리)
> 담당자 규칙: api/ 폴더만 수정. 프론트(web/) 절대 수정 금지.

---

## 2026-03-09 세션 작업 요약

### 커밋 이력 (시간순)

| # | 커밋 해시 | 내용 | 수정 파일 |
|---|-----------|------|-----------|
| 1 | `8a7eae7` | 일정 상세/댓글/공감 API 500 에러 수정 | schedules.js, posts.js |
| 2 | `575d495` | 댓글 API 에러 메시지 임시 노출 (디버그) | posts.js |
| 3 | `4f639e9` | 댓글 API 프로덕션 DB 호환성 수정 | posts.js |
| 4 | `7176b0b` | BUG-004~006 (reset-password, nginx, read_status) | auth.js, posts.js, nginx.conf |
| 5 | `6a1b84a` | reset-password 디버그 코드 제거 | auth.js |
| 6 | `0748410` | 공감 회귀 버그 + reset-password NFC 정규화 | posts.js, auth.js |
| 7 | `f8bb021` | reset-password 이름 매칭 강화 + 에러 메시지 개선 | auth.js |

---

### 수정된 버그 목록

#### BUG-001: GET /api/schedules/:id → 500 에러
- **원인**: `schedules` 테이블에 `views` 컬럼 없음. 코드에서 `UPDATE schedules SET views = views + 1` 실행
- **수정**: views UPDATE 쿼리 제거 (`api/routes/schedules.js`)
- **상태**: 완료

#### BUG-002: GET /api/members → 무한 로딩
- **원인**: 백엔드 API 자체는 정상 (34명 반환). 프론트엔드 문제
- **상태**: 백엔드 이상 없음. 프론트엔드 에이전트에게 전달 필요

#### BUG-003: GET /api/posts/:id/comments → 500 에러
- **원인**: 프로덕션 DB comments 테이블에 `is_deleted`, `parent_id` 컬럼 부재
- **수정**: 폴백 쿼리 추가 (컬럼 없을 때 기본 쿼리로 전환)
- **추가 조치**: 프로덕션 DB에 ALTER TABLE로 누락 컬럼 추가 완료
- **상태**: 완료

#### BUG-004: POST /api/auth/reset-password → 404 에러
- **원인**: 한글 유니코드 인코딩 불일치 (NFC vs NFD) + 이름 공백 차이
- **수정**: SQL REPLACE로 공백 제거 비교, NFC 정규화, 에러 메시지 분리
- **상태**: 완료

#### BUG-005: GET /api → 301 리다이렉트
- **원인**: nginx `location /api/` (trailing slash)가 `/api` 미매칭
- **수정**: `location /api`로 변경 (`nginx.conf`)
- **상태**: 완료

#### BUG-006: DB 스키마-코드 불일치
- **원인**: 여러 컬럼명 불일치
  - `comments.parent_comment_id` → 실제: `parent_id`
  - `likes.member_id` → 코드가 `user_id`로 잘못 변경됨 (회귀)
  - `read_status` 테이블 → 코드가 `post_reads`로 참조
- **수정**: 모두 프로덕션 DB 스키마에 맞게 수정
- **상태**: 완료

---

### 프로덕션 DB 변경 이력

| 작업 | SQL | 결과 |
|------|-----|------|
| comments 컬럼 추가 | `ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false` | 완료 |
| comments 컬럼 추가 | `ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE` | 이미 존재 (스킵) |
| 비밀번호 일괄 복원 | `UPDATE users SET password_hash = ... WHERE ...` | 34명 test1234로 복원 |

---

### 프로덕션 DB 실제 스키마 (코드 작성 시 참고)

```
users: id, email, password_hash, name, phone, address, ..., role, status, company, position, department, ...
posts: id, author_id, title, content, images, category, views, likes_count, comments_count, is_deleted, ...
comments: id, post_id, author_id, content, parent_id, parent_comment_id(레거시), is_deleted, created_at, updated_at
likes: id, member_id(주의!), post_id, created_at  ← user_id 아님!
schedules: id, title, description, start_date, end_date, location, category, created_by, ... (views 컬럼 없음!)
read_status: id, user_id, post_id, notice_id, schedule_id, read_at  ← post_reads 아님!
```

### 주의사항 (다음 세션에서 반드시 확인)
1. **likes 테이블 컬럼은 `member_id`** — `user_id`가 아님! 절대 혼동 금지
2. **schedules 테이블에 `views` 컬럼 없음** — 조회수 기능 추가 시 ALTER TABLE 필요
3. **comments 테이블에 `parent_comment_id`(레거시) 컬럼 존재** — 사용하지 않음, 삭제 권장
4. **읽음 추적 테이블은 `read_status`** — `post_reads` 아님
5. **비밀번호 재설정 테스트 후 반드시 비밀번호 복원** (test1234)

---

### 미완료/건의 사항

| 항목 | 내용 | 우선순위 |
|------|------|----------|
| comments.parent_comment_id 삭제 | 레거시 컬럼, 코드 미사용 | 낮음 |
| likes 테이블 member_id → user_id 통일 | DB ALTER + 코드 수정 필요 | 중간 |
| schedules에 views 컬럼 추가 | 조회수 기능 필요 시 | 낮음 |
| auth.js signup 에러에 debug/stack 노출 | 프로덕션에서 제거 필요 (보안) | 높음 |

---

### DB 접속 정보 (세션 간 공유용)
- **Railway PostgreSQL**: `postgresql://postgres:lnpAyUJCakMuxZfCufYnWAoOCHQkEELA@hopper.proxy.rlwy.net:46513/railway`
- **접속 방법**: `cd /e/app/jc/api && node -e "const {Pool}=require('pg'); ..."`
- **pg 모듈 위치**: `api/node_modules/pg` (프로젝트 루트 아닌 api/ 폴더에서 실행)

---

### 시드 계정 (테스트용)
| 이메일 | 이름 | 역할 | 비밀번호 |
|--------|------|------|----------|
| admin@jc.com | 총관리자 | super_admin | test1234 |
| kim.yh@yjc-test.kr | 김영호 | super_admin | test1234 |
| lee.jy@yjc-test.kr | 이준영 | admin | test1234 |
| park.sm@yjc-test.kr | 박성민 | admin | test1234 |
| minsu@jc.com | 경민수 | member | test1234 |
| 나머지 26명 | @yjc-test.kr | member | test1234 |
