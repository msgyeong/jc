# 📊 JC 앱 데이터베이스 관리

## 📂 디렉토리 구조

```
database/
├── migrations/
│   ├── 001_initial_schema.sql      # 초기 스키마
│   ├── 002_xxx.sql                 # 추후 추가될 마이그레이션
│   └── ...
└── README.md                       # 이 파일
```

---

## 🔄 마이그레이션 실행

### Railway PostgreSQL

**Railway에서 바로 실행:**

1. Railway 대시보드 → **PostgreSQL** 클릭
2. **"Data"** 탭 클릭
3. **"Query"** 버튼 클릭
4. `database/railway_init.sql` 파일 내용 전체 복사
5. 붙여넣고 **"Run Query"** 클릭
6. `Railway PostgreSQL 데이터베이스 초기화 완료!` 확인
7. `database/create_admin.sql` 파일로 관리자 계정 생성

---

### 2. 새로운 마이그레이션 추가

**예시: 회원에게 "직책" 필드 추가**

`migrations/002_add_user_position.sql` 파일 생성:

```sql
-- ============================================
-- Add position field to users table
-- Version: 1.0.1
-- Date: 2026-XX-XX
-- Description: Add position field for user job title
-- ============================================

-- 1. 테이블 수정
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS position TEXT;

-- 2. 마이그레이션 기록
INSERT INTO public.schema_migrations (version, name)
VALUES ('002', 'add_user_position')
ON CONFLICT (version) DO NOTHING;

-- 3. 완료 메시지
SELECT '✅ 마이그레이션 002 완료: position 필드 추가' AS message;
```

**실행:**
1. Railway PostgreSQL Query 탭에서 위 내용 실행
2. 버전 확인:
```sql
SELECT * FROM public.schema_migrations ORDER BY executed_at DESC;
```

---

## 📋 현재 데이터베이스 스키마

### 테이블 목록 (v1.0.0)

| 테이블 | 설명 | 주요 필드 |
|--------|------|-----------|
| **users** | 회원 정보 | id, email, name, role, status |
| **posts** | 게시글 | id, author_id, title, content, views, likes_count |
| **comments** | 댓글 | id, post_id, author_id, content, parent_id |
| **post_likes** | 게시글 공감 | id, post_id, user_id |
| **notices** | 공지사항 | id, author_id, title, content, is_pinned |
| **notice_attendance** | 참석자 조사 | id, notice_id, user_id, status |
| **schedules** | 일정 | id, title, start_date, end_date, location |
| **banners** | 배너 | id, title, image_url, order_index |
| **schema_migrations** | 마이그레이션 추적 | version, name, executed_at |

---

### 권한 구조 (roles)

| 역할 | 설명 | 권한 |
|------|------|------|
| **super_admin** | 총관리자 | 모든 권한 |
| **admin** | 관리자 | 회원 승인, 공지 작성, 일정 등록 |
| **member** | 일반 회원 | 게시글 작성, 댓글, 공감 |
| **pending** | 승인 대기 | 로그인 불가 (승인 대기 화면만) |

---

### 상태 (status)

| 상태 | 설명 |
|------|------|
| **active** | 정상 활동 |
| **pending** | 승인 대기 |
| **suspended** | 정지 (관리자가 정지 처리) |

---

## 🛡️ 접근 제어

Railway 환경에서는 Node.js API 서버에서 JWT 인증 및 권한 검사를 수행합니다.

### 주요 정책:

1. **회원 정보 (users)**
   - 본인 정보는 누구나 조회 가능
   - active 회원은 다른 회원 정보 조회 가능
   - 본인 정보만 수정 가능
   - 관리자는 모든 회원 정보 수정 가능

2. **게시글 (posts)**
   - active 회원만 조회 가능
   - active 회원만 작성 가능
   - 본인 게시글만 수정/삭제 가능

3. **공지사항 (notices)**
   - active 회원만 조회 가능
   - 관리자만 작성/수정/삭제 가능

4. **일정 (schedules)**
   - active 회원만 조회 가능
   - 관리자만 작성/수정/삭제 가능

---

## 🔧 자동화 트리거

### 1. updated_at 자동 업데이트
모든 테이블의 `updated_at` 필드가 수정 시 자동으로 현재 시간으로 업데이트됩니다.

```sql
-- 트리거: set_updated_at
-- 적용 테이블: users, posts, comments, notices, schedules
```

### 2. 회원가입 시 프로필 생성
회원가입 API 호출 시 Node.js 서버에서 `users` 테이블에 프로필을 생성합니다.

```
-- 기본값: role='pending', status='pending'
```

### 3. 댓글 수 자동 카운트
게시글에 댓글이 추가/삭제되면 `posts.comments_count`가 자동으로 업데이트됩니다.

```sql
-- 트리거: update_post_comments_count_trigger
```

### 4. 공감 수 자동 카운트
게시글에 공감이 추가/삭제되면 `posts.likes_count`가 자동으로 업데이트됩니다.

```sql
-- 트리거: update_post_likes_count_trigger
```

---

## 📊 데이터 조회 쿼리 예시

### 승인 대기 중인 회원 목록

```sql
SELECT id, name, email, created_at
FROM public.users
WHERE status = 'pending'
ORDER BY created_at DESC;
```

### 최근 게시글 10개

```sql
SELECT 
    p.id, 
    p.title, 
    p.views, 
    p.likes_count, 
    p.comments_count,
    u.name AS author_name,
    p.created_at
FROM public.posts p
LEFT JOIN public.users u ON p.author_id = u.id
ORDER BY p.created_at DESC
LIMIT 10;
```

### 고정된 공지사항

```sql
SELECT id, title, content, created_at
FROM public.notices
WHERE is_pinned = TRUE
ORDER BY created_at DESC;
```

### 다가오는 일정

```sql
SELECT id, title, start_date, end_date, location
FROM public.schedules
WHERE start_date >= NOW()
ORDER BY start_date ASC
LIMIT 5;
```

### 마이그레이션 버전 확인

```sql
SELECT version, name, executed_at
FROM public.schema_migrations
ORDER BY executed_at DESC;
```

---

## 🗃️ 백업 및 복구

### 백업 방법

#### 방법 1: Railway CLI

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 백업 생성
railway run pg_dump $DATABASE_URL > backup.sql
```

#### 방법 2: Railway 대시보드

1. Railway PostgreSQL → **"Data"** 탭
2. **"Backups"** 섹션
3. **"Create Backup"** 클릭
4. 백업 파일 다운로드

---

### 복구 방법

⚠️ **주의**: 복구는 기존 데이터를 덮어씁니다!

```bash
# Railway CLI로 복구
railway run psql $DATABASE_URL < backup.sql
```

또는 Railway PostgreSQL → "Query" 탭에서 백업 SQL을 붙여넣어 실행합니다.

---

## 📈 성능 최적화

### 인덱스 확인

```sql
-- 모든 인덱스 조회
SELECT 
    tablename, 
    indexname, 
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 쿼리 성능 분석

```sql
-- 쿼리 실행 계획 확인
EXPLAIN ANALYZE
SELECT * FROM public.posts
WHERE author_id = 'some-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

### 테이블 크기 확인

```sql
SELECT
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
```

---

## 🔒 보안 체크리스트

- API 서버에서 JWT 인증 및 권한 검사
- 비밀번호 해싱 (bcrypt/pgcrypto)
- 정기 백업 (주 1회 이상)
- 마이그레이션 버전 추적
- HTTPS 통신 (Railway 자동 제공)

---

## 📞 문제 해결

### Q1: 인증 에러가 나요

- JWT 토큰이 만료되었는지 확인
- API 서버 로그에서 에러 원인 확인
- Railway 대시보드 → Logs 탭에서 서버 로그 확인

### Q2: 트리거가 작동하지 않아요

```sql
-- 트리거 목록 확인
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 트리거 재생성: migrations/001_initial_schema.sql 다시 실행
```

### Q3: 마이그레이션 충돌

```sql
-- 마이그레이션 기록 확인
SELECT * FROM public.schema_migrations;

-- 특정 버전 삭제 (신중히!)
DELETE FROM public.schema_migrations WHERE version = '002';
```

---

## 📚 추가 자료

- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [Railway 공식 문서](https://docs.railway.app)

---

**마지막 업데이트**: 2026-02-06  
**스키마 버전**: 1.0.0
