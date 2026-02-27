# 공통 작업 목록 (tasks-common)

**역할**: 개발 방향과 to-do 리스트의 **단일 소스(single source of truth)**.

- **체크리스트·완료 기준**은 이 폴더에서만 관리합니다.
- Flutter 구현 상세: **../tasks-flutter/**
- 웹 구현 상세: **../tasks-web/** (동일 번호 체계, 08만 웹 전용 Railway)

---

## 파일 번호 체계 (Flutter·웹 공통)

| 번호 | 문서 | 설명 |
|------|------|------|
| 00 | 00-project-overview.md | 프로젝트 개요·원칙 |
| 01 | 01-project-setup-and-auth.md | 프로젝트 설정·인증 |
| 02-0 | 02-0-board-and-schedule-policy.md | **게시판 구분·일정 연동 정책**(02·03·04 참고) |
| 02 | 02-post-features.md | 게시글 목록/상세/작성·댓글·공감 |
| 03 | 03-notice-and-schedule.md | 공지사항·일정 |
| 04 | 04-member-profile-and-home.md | 회원·프로필·홈 |
| 05 | 05-admin-web.md | 관리자 웹 |
| 06 | 06-common-features.md | 공통 기능·마무리 |
| 07 | 07-testing-and-polish.md | 테스트·최종 마무리 |
| 08 | *(웹 전용)* | Railway 백엔드 API → **tasks-web/08-railway-backend-api.md** |
| 09 | 09-signup-upgrade-6-steps.md | 회원가입 6단계 |
| 10 | 10-signup-ui-ux-improvement.md | 회원가입 UI/UX |
| 11 | 11-design-system-cleanup.md | 디자인 시스템 정리 |

---

## 사용 방법

1. **완료 시**: 해당 단계 문서의 체크박스를 `[x]`로 변경 (이 폴더만 수정).
2. **구현 시**: 
   - Flutter → tasks-flutter/ 같은 번호 파일에서 구현 상세 참고.
   - 웹 → tasks-web/ 같은 번호 파일에서 구현 상세 참고 (08은 웹만 있음).

---

## 참고 문서

- **PRD**: `../prd/`
- **스키마**: `../schema/`
- **유저 플로우**: `../user-flows/`
- **디자인 시스템**: `../design-system/`
