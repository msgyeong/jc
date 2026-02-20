# Flutter 앱 작업 목록 (tasks-flutter)

본 폴더는 **Flutter 앱** 개발을 위한 **구현 상세**를 담습니다.

> **체크리스트·완료 기준**은 **../tasks-common/** 에서 공통 관리합니다. 항목 완료 시 **tasks-common** 해당 파일의 체크박스를 함께 업데이트하세요.
> **웹 구현**은 **../tasks-web/** (동일 번호 체계) 참고.

> **프로젝트 목적**: 영등포 JC 회원 간의 공지 전달, 소통, 일정 공유, 회원 정보 관리를 하나의 앱에서 제공하며, 오프라인 중심 커뮤니티 운영을 온라인으로 보조합니다.

---

## 작업 파일 목록 (tasks-common과 동일 번호)

1. **[00-project-overview.md](./00-project-overview.md)** — 프로젝트 개요
2. **[01-project-setup-and-auth.md](./01-project-setup-and-auth.md)** — 프로젝트 설정 및 인증 (예상 1.5일)
3. **[02-post-features.md](./02-post-features.md)** — 게시글 관련 기능 (예상 2일)
4. **[03-notice-and-schedule.md](./03-notice-and-schedule.md)** — 공지사항 및 일정 (예상 2일)
5. **[04-member-profile-and-home.md](./04-member-profile-and-home.md)** — 회원/프로필 및 홈 (예상 2일)
6. **[06-common-features.md](./06-common-features.md)** — 공통 기능 및 마무리 (예상 1일)
7. **[07-testing-and-polish.md](./07-testing-and-polish.md)** — 테스트 및 최종 마무리 (예상 5일)
8. **[09-signup-upgrade-6-steps.md](./09-signup-upgrade-6-steps.md)** — 회원가입 6단계 업그레이드
9. **[10-signup-ui-ux-improvement.md](./10-signup-ui-ux-improvement.md)** — 회원가입 UI/UX 개선
10. **[11-design-system-cleanup.md](./11-design-system-cleanup.md)** — 디자인 시스템 정리

*(05 관리자 웹은 tasks-common·tasks-web에 있음. Flutter 앱에서는 관리자 웹을 별도 Next.js 등으로 구현 시 tasks-common/05 참고.)*

---

## 전체 일정 요약

- **개발 기간**: 약 10일 (1-6단계)
- **테스트 기간**: 약 5일 (7단계)
- **총 소요 기간**: 약 15일

---

## 작업 진행 방법

1. **태스크 문서는 진행될 때마다 즉시 업데이트한다.**
   - 항목 완료 시 해당 체크박스를 바로 `[x]`로 변경
   - 새로 구현한 항목이 있으면 해당 섹션에 반영
   - Cursor(AI) 작업 시에도 동일 적용

2. 각 작업 파일의 체크박스를 업데이트하여 진행 상황을 표시합니다.
   - `[ ]` 미완료
   - `[x]` 완료

3. 각 단계는 순서대로 진행합니다.
   - 이전 단계가 완료되어야 다음 단계로 진행합니다.

4. 작업 항목의 담당 구분을 확인합니다.
   - **🤖 Cursor(AI)**: AI가 주도적으로 구현
   - **👤 사용자**: 개발자가 직접 진행하거나 검토/테스트

5. 각 단계 완료 시 다음 단계로 진행합니다.

---

## 역할 구분 설명

### 🤖 Cursor(AI)
- 코드 구현 주도
- UI/UX 구현
- 로직 작성
- 개발자가 요청 시 즉시 진행 가능

### 👤 사용자
- 환경 설정 및 초기 구성
- 외부 서비스 연동 (Supabase 프로젝트 생성, API 키 설정 등)
- 테스트 및 검증
- 성능 최적화 검토
- 최종 결정 및 승인

---

## 참고 문서

- **공통 체크리스트(to-do)**: `../tasks-common/`
- **PRD 문서**: `../prd/08-design.md`
- **스키마 문서**: `../schema/schema.sql`
- **유저 플로우**: `../user-flows/`
- **디자인 시스템**: `../design-system/`
- **와이어프레임**: `../wireframes/`

---

## 업데이트 기록

- 2026-01-19: 초기 작업 목록 생성 (to-do list 형식으로 재작성)
