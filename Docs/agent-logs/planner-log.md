# 기획자 에이전트 작업 이력

> 새 세션 시작 시: 이 파일 → `Docs/priority-matrix-2026-03-09.md` 순서로 읽기
> 담당 범위: Docs/ (PRD, 요구사항, 유저 플로우, 관리자 웹 기획)

---

## 세션 1 — 2026-03-09

### 작업 1: PRD 점검 + 갭 분석

**지시**: PRD 대비 미구현 분석, 우선순위 재정리, 홈 화면 기획 보완

**생성/수정 파일**:
- `Docs/gap-analysis-2026-03-09.md` (신규) — 11개 기능 영역별 갭 분석
- `Docs/priority-matrix-2026-03-09.md` (신규) — Must/Should/Nice 매트릭스
- `Docs/home-screen-plan-2026-03-09.md` (신규) — 배너 콘텐츠+섹션 재정의
- `Docs/prd/06-tech-stack.md` (수정) — Flutter→웹앱 현행화

**핵심 발견**: 공지 API 중복, 배너 콘텐츠 관리 없음, 회원 상세 미완성, N배지 탭 미적용

---

### 작업 2: 비전 + R-01~R-07

**지시**: 3단계 확장 비전 + 7개 핵심 요구사항

**생성/수정 파일**:
- `Docs/vision-roadmap.md` (신규) — Phase 1~3, R-01~R-07, 멀티 테넌트
- `Docs/priority-matrix-2026-03-09.md` (수정) — M-11~M-15 추가

---

### 작업 3: R-08~R-11 + 관리자 웹 PRD

**지시**: 추가 요구사항 4건 + 관리자 웹 전면 재개발

**생성/수정 파일**:
- `Docs/vision-roadmap.md` (수정) — R-08(바로 통화), R-09(즐겨찾기), R-10(관리자웹), R-11(네이티브앱)
- `Docs/admin-web/00-overview.md` (전면 재작성) — 목적+디자인시스템+보안
- `Docs/admin-web/01-screens.md` (전면 재작성) — AW-001~009 화면별 상세
- `Docs/admin-web/02-wireframes.md` (전면 재작성) — 공통 패턴
- `Docs/admin-web/03-features.md` (전면 재작성) — 기능+Audit Log+API 30+개
- `Docs/admin-web/04-user-flows.md` (전면 재작성) — 플로우 8+개
- `Docs/priority-matrix-2026-03-09.md` (수정) — M-08 분할, M-16~17 추가

**관리자 웹 디자인**: 그레이톤, Primary #2563EB, 사이드바 240px, 헤더 64px

---

## 세션 2 — 2026-03-10

### 작업 1: 중기 스프린트 기능 기획서 작성

**지시**: 출석 투표, 전화걸기, 즐겨찾기 3개 기능 기획서 작성

**생성 파일**:
- `Docs/features/attendance-vote.md` (신규) — 출석 투표 기능 기획서
  - R-02 기반, 투표 상태 3종 + 미응답, API 6개, DB 테이블 2개
  - 이사회 성원 표시, 월례회 비용 계산 포함
  - 관리자: 투표 생성/마감/결과 CSV 내보내기
- `Docs/features/click-to-call.md` (신규) — 전화걸기 기능 기획서
  - R-08 기반, tel: 링크, 프론트엔드 only
  - 적용: 회원 목록, 회원 상세, 내 프로필 (본인은 비활성)
  - 전화번호 포맷: DB `01012345678` → 표시 `010-1234-5678`
- `Docs/features/favorites.md` (신규) — 즐겨찾기 기능 기획서
  - R-09 기반, 별표 토글, 회원 목록 상단 우선 표시
  - favorites 테이블 (member_id, target_member_id)
  - API 3개 + 기존 회원 목록 API 확장

**커밋**: `60e7da7` — `docs: 중기 스프린트 기획서 (출석투표, 전화걸기, 즐겨찾기)`
**푸시**: origin/main 완료

---

## 세션 3 — 2026-03-10

### 작업 1: 3차 스프린트 기획서 4건 작성

**지시**: M-04, M-05, M-12, M-13 기획서 작성

**생성 파일**:
- `Docs/features/schedule-detail.md` (신규) — 일정 상세 화면 기획서
  - M-04 기반, 상세 화면 전체 구성 (헤더, 기본 정보, 댓글, 참석자 명단, 연결 공지)
  - 장소 → 네이버 지도 링크, 더보기 메뉴(수정/삭제), 종일 이벤트 처리
  - 댓글 API 2개 신규 (POST/GET /api/schedules/:id/comments)
  - DB 변경: schedules에 linked_post_id 추가 (공지 연동용)
- `Docs/features/schedule-form.md` (신규) — 일정 등록/수정 화면 기획서
  - M-05 기반, 필드 10개 (제목/카테고리/날짜/시간/장소/설명 + 투표 설정)
  - 종일 이벤트 체크박스, 유효성 검증 9개 규칙
  - 수정 모드: 프리필 동작, 투표 진행 중 수정 제한
  - 기존 API(POST/PUT /api/schedules) 활용, 신규 API 없음
- `Docs/features/notice-schedule-link.md` (신규) — 공지-일정 연동 기획서
  - R-07/M-12 기반, 공지에서 일정 자동 생성 (단일 트랜잭션)
  - 양방향 참조: posts.linked_schedule_id ↔ schedules.linked_post_id
  - 삭제 시 처리: 확인 다이얼로그 (일정도 삭제 or 연결만 해제)
  - 기존 POST /api/posts 확장 (schedule 객체 포함)
  - DB 변경: posts에 linked_schedule_id, schedules에 linked_post_id 추가
- `Docs/features/industry-search.md` (신규) — 업종 카테고리 + 검색 기획서
  - R-04/M-13 기반, 13개 대분류 카테고리 확정
  - 회원 목록 업종 필터 드롭다운, 검색+필터 AND 조건
  - API: GET /api/members?industry=, GET /api/industries, 프로필/가입 API 확장
  - DB 변경: users에 industry + industry_detail 컬럼 추가
  - 프론트 상수: INDUSTRY_CATEGORIES 배열

**커밋**: 아래에서 커밋 예정

---

## 다른 에이전트에게 전달할 사항

### → 백엔드
1. M-02: 공지 라우트 통합 (notices.js 폐기)
2. Audit Log 테이블 → `admin-web/03-features.md` §9
3. 권한 매트릭스 테이블 (positions + position_permissions)
4. 즐겨찾기 API → `Docs/features/favorites.md` (favorites 테이블, API 3개)
5. 출석 투표 API → `Docs/features/attendance-vote.md` (attendance_config + attendance_votes 테이블, API 5개)
6. **[신규]** 일정 댓글 API → `Docs/features/schedule-detail.md` §6 (POST/GET /api/schedules/:id/comments)
7. **[신규]** 공지-일정 연동 API → `Docs/features/notice-schedule-link.md` §5 (POST /api/posts 확장 + schedule 객체)
8. **[신규]** DB 마이그레이션: schedules.linked_post_id, posts.linked_schedule_id 추가
9. **[신규]** 업종 검색 API → `Docs/features/industry-search.md` §6 (GET /api/members?industry=, GET /api/industries)
10. **[신규]** DB 마이그레이션: users.industry + users.industry_detail 컬럼 추가

### → 프론트엔드
1. 기존 admin-web 코드 삭제 후 재개발
2. 관리자 웹 디자인 → `admin-web/00-overview.md` §5
3. 전화걸기 tel: 링크 → `Docs/features/click-to-call.md` (회원 목록/상세/프로필)
4. 즐겨찾기 별표 토글 → `Docs/features/favorites.md` (목록 상단 우선 표시)
5. 출석 투표 UI → `Docs/features/attendance-vote.md` (투표 카드, 현황 표시)
6. **[신규]** 일정 상세 화면 완성 → `Docs/features/schedule-detail.md` (댓글, 참석자 명단, 지도 링크, 더보기 메뉴)
7. **[신규]** 일정 등록/수정 폼 완성 → `Docs/features/schedule-form.md` (종일 이벤트, 투표 설정, 유효성 검증)
8. **[신규]** 공지 작성 시 일정 첨부 UI → `Docs/features/notice-schedule-link.md` (토글+일정 입력)
9. **[신규]** 업종 필터 + 태그 → `Docs/features/industry-search.md` (회원 목록 드롭다운, 카드 태그, 가입/프로필 필드)

### → 디자이너
1. 앱 Primary #1F4FD8 → #2563EB 통일 여부 사장님 확인 필요

---

## 미완료 TODO

- [x] 업종 카테고리 목록 확정 → `Docs/features/industry-search.md` (13개 대분류)
- [ ] 직책-권한 매핑표 최종 확정
- [ ] 참석 투표 유형별 상세 규칙 (성원 기준, 비용 단가)
- [ ] 입회원서 실물 양식 vs 가입 폼 항목 비교
- [x] 공지 삭제 시 연결 일정 처리 방식 확정 → `Docs/features/notice-schedule-link.md` §4-3 (확인 다이얼로그)

---

## 핵심 참조 문서

| 용도 | 파일 |
|------|------|
| 전체 요구사항 | `Docs/vision-roadmap.md` (R-01~R-11) |
| 우선순위 | `Docs/priority-matrix-2026-03-09.md` |
| 갭 분석 | `Docs/gap-analysis-2026-03-09.md` |
| 관리자 웹 | `Docs/admin-web/` (00~04) |
| 홈 화면 | `Docs/home-screen-plan-2026-03-09.md` |
| 출석 투표 기획 | `Docs/features/attendance-vote.md` |
| 전화걸기 기획 | `Docs/features/click-to-call.md` |
| 즐겨찾기 기획 | `Docs/features/favorites.md` |
| 일정 상세 기획 | `Docs/features/schedule-detail.md` |
| 일정 등록/수정 기획 | `Docs/features/schedule-form.md` |
| 공지-일정 연동 기획 | `Docs/features/notice-schedule-link.md` |
| 업종 검색 기획 | `Docs/features/industry-search.md` |
