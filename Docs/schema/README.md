# Supabase Schema 문서

본 폴더는 **영등포 JC 회원관리 앱**의 Supabase 데이터베이스 스키마를 관리합니다.

- 기준 문서: `../prd/08-design.md`, `../prd/01-users.md`, `../prd/05-data-policy.md`
- 기술 스택: Supabase (PostgreSQL)

---

## 문서 목록

- [schema.sql](./schema.sql) - 전체 데이터베이스 스키마 (테이블, 인덱스, RLS 정책, 트리거 포함)
  - 관리자 전용 필드 테이블 (별도 테이블 방식)
  - 교육 이력 테이블 (교육 기수 기반 검색/필터링 지원)
  - 성능 최적화 캐시 컬럼 및 트리거
- [schema-reset.sql](./schema-reset.sql) - 스키마 초기화 (재적용 전 삭제용)

### `sql files/` 폴더란?

**예전에 Supabase에 등록해 두었던 코드**를 모아 둔 곳입니다.  
지금 **기준이 되는 최신 파일은 Docs/schema 루트**에 있으며, `sql files/`는 참고·백업용입니다.

| sql files/ 안의 파일 | 역할 | 지금 기준(교체 시 사용할 파일) |
|----------------------|------|--------------------------------|
| schema_for_jc_community.sql | 전체 DB 스키마 (테이블, RLS, 트리거 등) | **schema.sql** |
| profiles_policy.sql | Storage `profiles` 버킷 RLS 정책 | **sql files/profiles_policy.sql** (Storage는 schema.sql에 포함 안 됨) |
| check_for_email_available.sql | 이메일 중복 확인 RPC | **check_email_available.sql** (루트) |
| check_phone_available.sql | 휴대폰 중복 확인 RPC | **check_phone_available.sql** (루트) |
| check_resident_id_available.sql | 주민등록번호 중복 확인 RPC | **check_resident_id_available.sql** (루트) |

### Supabase에서 교체/수정해야 하는 것

1. **테이블·RLS·트리거 등 전체 스키마**
   - Supabase에 이미 올려 둔 건 `sql files/schema_for_jc_community.sql`과 같은 내용.
   - **최신으로 맞추려면**:  
     1) **schema-reset.sql** 실행 → 2) **schema.sql** 실행  
   - 주의: reset 실행 시 **모든 테이블·데이터가 삭제**되므로, 운영 DB가 아니고 개발/테스트 DB에서만 실행.

2. **RPC 함수 3개** (이메일 / 휴대폰 / 주민번호 중복 확인)
   - Supabase에 이미 만든 함수가 있다면, **내용만 최신으로 맞추면 됨.**
   - 사용할 파일: 루트의  
     `check_email_available.sql`, `check_phone_available.sql`, `check_resident_id_available.sql`  
   - SQL Editor에서 각 파일 내용 복사 후 **Run** (CREATE OR REPLACE라서 기존 함수 덮어씀).

3. **Storage `profiles` 버킷 정책**
   - 테이블 스키마와 별개로, **Storage > policies** 에서 적용하는 RLS.
   - 적용할 내용: **sql files/profiles_policy.sql**  
   - 기존 정책 이름이 같으면 그대로 두고, 정책을 바꾸고 싶을 때만 해당 파일 내용으로 SQL Editor에서 실행해 교체.

요약: **DB 구조를 최신으로 갈 때** → `schema-reset.sql` → `schema.sql`.  
**RPC만 최신으로 갈 때** → 루트의 `check_*.sql` 3개.  
**Storage 정책만 갈 때** → `sql files/profiles_policy.sql`.

---

### 개별 쿼리 (SQL Editor에서 단독 실행용)

아래 파일들은 **Supabase SQL Editor → New query** 에서 해당 파일 내용만 복사해 실행할 때 사용합니다.  
전체 스키마를 다시 실행하지 않고, 함수만 추가/수정할 때 유용합니다.

| 파일 | 설명 |
|------|------|
| [check_email_available.sql](./check_email_available.sql) | 회원가입 이메일 중복 확인 RPC. `members` + `auth.users` 조회, anon 실행 권한 부여. |
| [check_resident_id_available.sql](./check_resident_id_available.sql) | 회원가입 주민등록번호 중복 확인 RPC. 숫자 13자리 기준 비교. |
| [check_phone_available.sql](./check_phone_available.sql) | 회원가입 휴대폰 번호 중복 확인 RPC. 숫자만 추출해 비교. |

---

## 주요 테이블

### 회원 관련
- `members` - 회원 기본 정보 및 상태
- `educations` - 학력 정보 (회원당 1개 이상)
- `careers` - 경력 정보 (회원당 1개 이상)
- `families` - 가족 정보 (혼인/자녀 유무, 배우자 정보)
- `children` - 자녀 정보 (families와 1:N)

### 콘텐츠 관련
- `posts` - 게시글
- `notices` - 공지사항
- `schedules` - 일정

### 상호작용 관련
- `comments` - 댓글/대댓글 (게시글/공지/일정에 대한 Polymorphic)
- `likes` - 공감 (게시글/공지/일정에 대한 Polymorphic)
- `attendance_surveys` - 참석자 조사 (공지사항용)
- `read_status` - 읽음 추적 (게시글/공지/일정에 대한 Polymorphic)

### 권한/관리 관련
- `role_permissions` - 직책별 권한 설정
- `banners` - 홍보/광고 배너

### 관리자 전용 필드 (별도 테이블 방식)
- `awards` - 표창 정보 (회원당 최대 5개)
- `international_competitions` - 국제대회 참가 정보 (회원당 최대 2개)
- `jc_careers` - JC 경력 정보 (회원당 최대 5개)
- `disciplinary_actions` - 징계 이력 (비공개)
- `education_history` - 교육 이력 (신입회원교육, 2차교육, 리더십교육 등)
  - 교육 기수 기반 검색 지원
  - 이수/미이수 필터링/정렬 지원
  - 관리자 웹에서만 입력/수정 가능

---

## 데이터 정책 반영

### 필수 필드
- 모든 테이블은 `created_at`, `updated_at` 포함
- 삭제는 물리 삭제 대신 `is_deleted` 플래그 사용

### 상태 관리 (members)
- `is_approved` - 가입 승인 여부
- `is_suspended` - 정지 여부
- `rejection_reason` - 거절 사유
- `withdrawn_at` - 탈퇴일
- `is_deleted` - 삭제 여부

### RLS (Row Level Security)
- 승인된 회원만 데이터 접근 가능
- 권한이 필요한 기능(공지 작성, 일정 등록 등)은 `role_permissions` 기준으로 제어

---

## Supabase Storage (파일 저장소)

### 프로필 사진 버킷

| 항목 | 설정 |
|------|------|
| **버킷 이름** | `profiles` |
| **Public/Private** | Public (URL로 직접 접근 가능, 업로드/삭제는 본인만) |
| **경로 규칙** | `profiles/{auth_user_id}/avatar.jpg` |
| **파일 크기** | 500MB 이하 |
| **허용 MIME** | `image/jpeg`, `image/png`, `image/webp` |

### 경로 구조

```
profiles/                          # 버킷
├── {user_uuid_1}/                 # 회원 1의 폴더
│   └── avatar.jpg                 # 프로필 사진
├── {user_uuid_2}/                 # 회원 2의 폴더
│   └── avatar.jpg
└── ...
```

### Storage RLS 정책

| 작업 | 정책 | 설명 |
|------|------|------|
| **SELECT (읽기)** | `auth.role() = 'authenticated'` | 로그인한 사용자는 모든 프로필 사진 조회 가능 |
| **INSERT (업로드)** | `name LIKE 'profiles/' \|\| auth.uid()::text \|\| '/%'` | 본인 폴더에만 업로드 가능 |
| **UPDATE (수정)** | `name LIKE 'profiles/' \|\| auth.uid()::text \|\| '/%'` | 본인 파일만 수정 가능 |
| **DELETE (삭제)** | `name LIKE 'profiles/' \|\| auth.uid()::text \|\| '/%'` | 본인 파일만 삭제 가능 |

### 회원가입 시 프로필 사진 업로드 순서

회원가입 시 Storage 정책과 호환되도록 **다음 순서**를 따릅니다:

1. **Supabase Auth 계정 생성** (`signUp`) → 사용자 ID 생성됨
2. **프로필 사진 업로드** → `profiles/{새 사용자 ID}/avatar.jpg` 경로로 업로드
3. **members 테이블 INSERT** → 회원 정보 저장 (profile_photo_url 포함)

이 순서를 지켜야 업로드 시점에 `auth.uid()`가 존재하여 "본인 폴더" 정책이 정상 동작합니다.

---

## 사용 방법

### 최초 설치
1. Supabase 대시보드에서 SQL Editor 열기
2. `schema.sql` 파일의 전체 내용을 복사하여 실행
3. 또는 마이그레이션 도구를 사용하여 단계별 적용

### 기존 스키마 재적용 (재설치)
이미 테이블이 존재하는 DB에 최신 스키마를 적용할 때는 **먼저 초기화** 후 실행합니다.

1. `schema-reset.sql` 실행 → 기존 테이블/객체 모두 삭제
2. `schema.sql` 실행 → 최신 스키마 적용

> ⚠️ **주의**: `schema-reset.sql` 실행 시 모든 테이블과 데이터가 삭제됩니다. 운영 DB에서는 사용하지 마세요.

### 적용된 방식
- **관리자 전용 필드**: 별도 테이블 방식 적용
  - `awards`, `international_competitions`, `jc_careers`, `disciplinary_actions`, `education_history` 테이블
  - 관리자 웹에서 CRUD 작업 시 편의성 및 쿼리 최적화 용이
- **성능 최적화**: `comment_count`, `like_count` 캐시 컬럼 및 자동 업데이트 트리거 포함
  - 실시간 집계 쿼리 대신 캐시 컬럼 사용
  - 댓글/공감 생성/삭제 시 자동 업데이트

---

## 주의사항

- `members.resident_id`는 민감 정보이므로 암호화 저장 권장
- `members.auth_user_id`는 Supabase Auth와 연동되므로 `ON DELETE CASCADE` 적용
- Polymorphic 테이블(`comments`, `likes`, `read_status`)은 제약 조건으로 데이터 정합성 보장
- 관리자 전용 필드 테이블(`awards`, `international_competitions`, `jc_careers`, `disciplinary_actions`, `education_history`)은 관리자 웹에서 Service Role 키로 접근 (RLS 정책으로 일반 사용자 접근 차단)
- 회원당 최대 개수 제한(표창 5개, 국제대회 참가 2개, JC경력 5개)은 애플리케이션 레벨에서 검증 필요

---

## 관련 문서

- PRD 문서: `../prd/08-design.md` - 기능 상세 설계
- 사용자 정의: `../prd/01-users.md` - 사용자 역할 및 페르소나
- 데이터 정책: `../prd/05-data-policy.md` - 데이터 및 정책 개요
