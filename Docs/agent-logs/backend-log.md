# 백엔드 에이전트 작업 이력

> 담당: `api/` 폴더 (Express 라우트, 미들웨어, DB 쿼리)
> 담당자 규칙: api/ 폴더만 수정. 프론트(web/) 절대 수정 금지.

---

## 2026-03-10 세션 2 작업 요약

### 작업 1: 경민수 테스트 계정 삭제
- id=7 (`minsoo@jc.com`) 회원 삭제 완료
- 관련 posts/comments/likes 없었음 (FK 정리 불필요)
- 남은 회원 수: 33명

### 작업 2: 남은 테스트 게시글 삭제
- id=2 "dfsdf", id=7 "ft" 삭제 완료
- 남은 게시글: id=1 "신나는 월례회"(notice), id=3 "게시판 완성하고싶다"(notice)

### 작업 3: 회원가입 SSN 필드 보안 강화
- 파일: `api/routes/auth.js` 58~66행
- 변경 전: 프론트에서 보낸 ssn 값을 그대로 `+ '******'` 붙여서 저장 → 전체 주민번호 전송 시 그대로 저장되는 위험
- 변경 후: 서버에서 숫자만 추출 → 앞 6자리(생년월일) + 뒤 1자리(성별)만 추출 → `XXXXXX-X******` 형태로 저장
- 전체 주민번호가 전송되더라도 서버에서 7자리만 저장하여 개인정보 보호

### 프로덕션 DB 스키마 정정 (추가)
- `posts` 테이블에 `is_deleted` 컬럼 없음 확인
- `users` 테이블에 `is_approved` 컬럼 없음 (status 필드로 관리: active/pending 등)

---

## 2026-03-10 세션 1 작업 요약

### 작업 1: 테스트 데이터 정리 (프로덕션 DB)
- 에이전트들이 테스트로 작성한 게시글 6건 삭제 완료
- 삭제 대상 (title 기준: "에이전트", "작업 보고서", "final", "test"):
  - id=8: "final"
  - id=9: "[테스터 에이전트] 2026-03-10 전체 기능 테스트 완료 보고서"
  - id=10: "[프론트엔드 에이전트] 첫 작업 보고서 (2026-03-10)"
  - id=11: "[2026-03-10] 디자이너 에이전트 업무 보고"
  - id=12: "[기획자 에이전트] 오늘 하루 작업 보고서"
  - id=13: "⚡ [백엔드 에이전트] 2026-03-10 작업 보고서"
- 연관 댓글 0건, 좋아요 0건 (없었음)
- `read_status` 테이블은 프로덕션 DB에 존재하지 않음 (메모리 수정 필요)

### 작업 2: 경민수 중복 회원 확인
- 결과: **동명이인 2명 존재** (중복이 아닌 별개 계정)
  - id=5: `minsu@jc.com` / 010-1234-5678 / 2026-02-20 생성 → **시드 데이터 원본**
  - id=7: `minsoo@jc.com` / 010-2462-8582 / 2026-03-08 생성 → 나중에 추가된 계정
- 이메일, 전화번호 모두 다르므로 실제 중복이 아님
- **사장 판단 필요**: id=7(`minsoo@jc.com`)이 의도된 계정인지 테스트 계정인지 확인 필요

### 프로덕션 DB 스키마 정정
- `posts` 테이블에 `is_deleted` 컬럼 없음 (이전 로그 스키마 수정 필요)
- `read_status` 테이블 존재하지 않음 (이전 로그에서 존재한다고 기록됨)

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

### 기획자 전달 — 신규 작업 (2026-03-09)

> 전체 우선순위: `Docs/priority-matrix-2026-03-09.md` 참조

#### Must-have (앱)
- [ ] M-02: 공지 라우트 통합 (notices.js 폐기 → posts.js category='notice')
- [ ] M-10: 관리자 지정 필드 수정 제한 (JC직책/소속/기수)
- [ ] M-11: 참석 투표 데이터 모델+API → `vision-roadmap.md` R-02
- [ ] M-12: 공지-일정 연동 API → `vision-roadmap.md` R-07
- [ ] M-13: 업종 검색 API (GET /api/members/search?industry=)
- [ ] M-14: 직함 관리 (변경→즉시 반영+권한 연동)
- [ ] M-17: 즐겨찾기 API (favorites 테이블)

#### Must-have (관리자 웹 API)
- [ ] Audit Log 테이블 생성 → `admin-web/03-features.md` §9
- [ ] 권한 매트릭스 테이블 (positions + position_permissions)
- [ ] 관리자 웹 API 30+개 → `admin-web/03-features.md` §10

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
