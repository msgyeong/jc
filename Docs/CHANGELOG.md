# JC 프로젝트 변경 이력

---

## 2026-03-27 — QA 전면 개선 + 보안/법적 보완 (7ff3dae)

### 법적 보완 (개인정보보호법 준수)
- 회원가입 시 이용약관 + 개인정보 수집·이용 동의 체크박스 추가 (필수)
- 팝업으로 약관/개인정보처리방침 전문 확인 가능
- 개인정보 처리방침 전면 보완
  - 실제 수집 항목 전체 명시 (필수 7개 + 선택 15개)
  - Kakao 주소 API 위탁 처리 고지
  - 탈퇴 후 90일 보관 후 파기 정책
  - 이용자 열람/정정/삭제 권리 명시
- 이용약관 보완: 면책조항(제7조), 분쟁해결(제8조) 추가

### 보안 수정 (4건)
| 심각도 | 수정 내용 | 파일 |
|--------|----------|------|
| CRITICAL | 좋아요 토글 race condition → 트랜잭션 + FOR UPDATE 락 | api/routes/posts.js |
| HIGH | 커넥션 풀 기본값 10 → max:25 설정 | api/config/database.js |
| HIGH | Kakao API 키 하드코딩 → 환경변수 전환 (3곳) | auth.js, map.js |
| HIGH | search-all SQL 문자열 직접 삽입 → 파라미터화 쿼리 | api/routes/members.js |

### Soft Delete 전환
- posts, schedules 테이블에 `deleted_at` 컬럼 추가
- 모든 DELETE → `UPDATE SET deleted_at = NOW()` (14곳)
  - posts.js, notices.js, schedules.js, admin.js, mobile-admin.js
- 목록 조회에 `deleted_at IS NULL` 필터 추가
- 마이그레이션: `database/migrations/028_soft_delete_columns.sql`

### 자동 파기 스케줄러
- 탈퇴 회원: 90일 후 완전 삭제
- soft delete 게시글/일정: 90일 후 완전 삭제
- 파일: `api/cron/data-purge-scheduler.js`

### 페이지네이션 보안
- `limit` 상한 50 제한, `page` 최소 1 방어

### 신규 기능
- **사업 PR**: 한 줄 PR, 서비스 설명, SNS 링크 (프로필 표시/수정)
- **배너 광고**: 관리자 배너 CRUD + 홈 화면 연동
- **직책 필터**: 회원 목록에서 JC 직책별 필터
- **인쇄/CSV**: 관리자 회원 목록 인쇄 + CSV 다운로드
- **배지 개선**: 게시판(공지+일반 합산), 일정(upcoming 전체)

### 변경 파일 (29개, +1,414줄 / -135줄)

**신규 파일:**
- `api/routes/banners.js` — 배너 CRUD API
- `api/cron/data-purge-scheduler.js` — 자동 파기 스케줄러
- `web/admin/js/banners.js` — 관리자 배너 관리
- `database/migrations/028_soft_delete_columns.sql`
- `database/migrations/029_banners.sql`
- `database/migrations/029_business_pr.sql`

**주요 수정 파일:**
- `api/config/database.js` — 커넥션 풀 설정
- `api/server.js` — 배너 라우트 + positions API + 마이그레이션 + 파기 스케줄러
- `api/routes/posts.js` — 좋아요 트랜잭션 + soft delete + 페이지네이션
- `api/routes/members.js` — SQL 파라미터화 + jc_position + 사업PR
- `api/routes/profile.js` — 사업 PR 조회/수정
- `api/routes/admin.js` — soft delete + CSV 다운로드
- `api/routes/mobile-admin.js` — soft delete (6곳)
- `api/routes/notices.js` — soft delete
- `api/routes/schedules.js` — soft delete + deleted_at 필터
- `api/routes/auth.js` — Kakao API 키 환경변수
- `api/routes/map.js` — Kakao API 키 환경변수
- `web/index.html` — 약관 동의 체크박스
- `web/js/signup.js` — 동의 검증 + 약관/개인정보 팝업
- `web/js/settings.js` — 처리방침/이용약관 보완
- `web/js/members.js` — 직책 필터 + 한 줄 PR
- `web/js/profile.js` — 사업 PR UI
- `web/js/navigation.js` — 배지 카운트 개선
- `web/js/home.js` — 배너 연동
- `web/js/posts.js` — updatePostCardStat()
- `web/styles/main.css` — 동의 UI + SNS 배지 + 필터 스타일
- `web/admin/index.html` — 배너 메뉴
- `web/admin/js/admin-app.js` — 배너 페이지
- `web/admin/js/members.js` — 인쇄/CSV

---

## 2026-03-17 ~ 03-26 — 주요 기능 추가 (50+ 커밋)

### 회원 관리
- 카카오톡 스타일 회원 목록 리뉴얼 (초성검색, 그룹별, 타로컬 검색)
- 전화번호 공개 범위 설정 (local/district/all)
- 검색 API에서 super_admin 계정 제외

### 조직도
- 조직도 UI 전면 리뉴얼 — 디자인 개선 + UX 간소화
- 조직도 수기 관리 시스템 (그룹/직책/회원 매칭)

### 게시판
- 그룹 게시판 기능 추가 + 5대 버그 수정 + UI 개선
- 토스트 메시지 제거

### 지도
- JC 지도 (카카오맵) — position:fixed 오버레이 방식
- 카카오 주소 → 좌표 자동 변환 + 기존 회원 일괄 변환

### UX 개선
- pull-to-refresh 현재 화면 새로고침 + 뒤로가기 개선
- 정관 PDF 인라인 뷰어 + 다운로드 버튼
- 비밀번호 찾기 본인확인 2단계 강화
- 접기/펼치기 UI 개선

### 인프라
- 역할별 권한 분리 + org_id 응답 + 타 로컬 차단 기반

---

## 2026-03-17 — 대규모 업데이트 (멀티테넌트 기반)

### 보안 (7건)
- seed 엔드포인트 프로덕션 차단
- JWT 시크릿 폴백 제거 + HS256 명시
- 임시 비밀번호 crypto.randomBytes
- CORS 프로덕션 도메인 제한
- nginx 보안 헤더
- express-rate-limit (15분/50회)
- DB 쿼리 로깅 프로덕션 비활성화

### 멀티테넌트
- organizations 테이블 (name, code, district, region)
- users.org_id + 회원가입 소속 로컬 선택
- /api/organizations CRUD + /public

### 역할 체계
- super_admin → 총관리자 사이트 (/admin/)
- local_admin → 앱 내 로컬 관리
- admin → 앱 내 관리자
- member → 일반 회원

### 회의 시스템
- meetings/attendance/votes/minutes 테이블
- 투표 (confirmed만, 익명)
- 회의록 PDF 업로드/열람

### UI
- 하단 탭: 홈/게시판/일정/회원/회의
- 사이드 메뉴: 조직도/비전/직책/지도/정관/회의록/포털/로컬관리/프로필/설정

### 총관리자 사이트
- 대시보드/로컬관리/감사로그/설정
- 로컬 상세 (회원관리/관리자/통계)

### 포털
- 지구별 로컬 목록 → 해당 로컬 공지/일정 열람
