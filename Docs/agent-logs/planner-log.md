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

---

## 다른 에이전트에게 전달할 사항

### → 백엔드
1. M-02: 공지 라우트 통합 (notices.js 폐기)
2. Audit Log 테이블 → `admin-web/03-features.md` §9
3. 권한 매트릭스 테이블 (positions + position_permissions)
4. 즐겨찾기 API (favorites 테이블)
5. 참석 투표 모델 → `vision-roadmap.md` R-02

### → 프론트엔드
1. 기존 admin-web 코드 삭제 후 재개발
2. 관리자 웹 디자인 → `admin-web/00-overview.md` §5
3. tel: 링크 (M-16), 즐겨찾기 별표 (M-17)

### → 디자이너
1. 앱 Primary #1F4FD8 → #2563EB 통일 여부 사장님 확인 필요

---

## 미완료 TODO

- [ ] 업종 카테고리 목록 확정
- [ ] 직책-권한 매핑표 최종 확정
- [ ] 참석 투표 유형별 상세 규칙 (성원 기준, 비용 단가)
- [ ] 입회원서 실물 양식 vs 가입 폼 항목 비교
- [ ] 공지 삭제 시 연결 일정 처리 방식 확정

---

## 핵심 참조 문서

| 용도 | 파일 |
|------|------|
| 전체 요구사항 | `Docs/vision-roadmap.md` (R-01~R-11) |
| 우선순위 | `Docs/priority-matrix-2026-03-09.md` |
| 갭 분석 | `Docs/gap-analysis-2026-03-09.md` |
| 관리자 웹 | `Docs/admin-web/` (00~04) |
| 홈 화면 | `Docs/home-screen-plan-2026-03-09.md` |
