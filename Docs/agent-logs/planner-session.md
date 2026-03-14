# 기획자 에이전트 세션 로그

---

## 2026-03-13

### 작업 내용

GitHub 이슈 기반 3개 기능 기획서 작성 완료.

#### 1. Push 알림 기능 기획서 (이슈 #4)
- 파일: `Docs/features/push-notification-plan.md`
- 기존 `web-push-notification.md` (N-01~N-05) 확장
- **생일 알림(N-06) 신규 추가**: 매일 09:00 KST cron, `users.birth_date` 기반
- DB 변경: `notification_settings`에 `birthday_push` 컬럼 추가 (`011_birthday_push.sql`)
- 알림 클릭 시 생일 당사자 프로필로 이동 (`/#members/{id}`)
- Phase 1 (MVP 10단계) + Phase 2 (완성 9단계) 로드맵

#### 2. 참석 여부 확인 기능 기획서 (이슈 #5)
- 파일: `Docs/features/attendance-plan.md`
- 기존 `attendance-vote.md`의 단순화 버전 (먼저 구현)
- DB: `schedule_attendance` 테이블 신규 (`012_schedule_attendance.sql`)
- 상태: attending / not_attending (undecided 제외, Phase 2 확장)
- API 5개: POST/DELETE/GET summary/GET details/GET export(CSV)
- 관리자 웹 대시보드: 참석 현황 테이블 + CSV 다운로드

#### 3. 환경설정 기획서 (이슈 #9)
- 파일: `Docs/features/settings-plan.md`
- DB: `user_settings` 테이블 신규 (`013_user_settings.sql`)
- 다크모드: CSS variables + `data-theme` 속성, 시스템 설정 독립
- 글꼴 크기: 4단계 (14/16/18/20px), rem 기반 스케일
- 메뉴: 다크모드, 글꼴, 알림설정, 캐시삭제, 비밀번호변경, 로그아웃, 탈퇴, 약관, 개인정보, 버전
- 벤치마킹: 언어 설정은 한국어 단일이므로 제외
- Phase 1 (MVP 9단계) + Phase 2 (완성 5단계)

### 생성 파일
- `Docs/features/push-notification-plan.md` (신규)
- `Docs/features/attendance-plan.md` (신규)
- `Docs/features/settings-plan.md` (신규)
- `Docs/agent-logs/planner-session.md` (신규)

---

## 2026-03-14

### 작업 내용

CEO 요구사항 4건에 대한 기획서 작성/업데이트 완료.

#### 1. 게시글 참석/불참 기능 기획서 (요구사항 A)
- 파일: `Docs/features/post-attendance-plan.md` (신규)
- 게시글에서 참석/불참 버튼 표시, 명단 확인 기능
- **핵심 설계**: `linked_schedule_id` 유무에 따라 데이터 소스 분기
  - 일정 첨부 → `schedule_attendance` 재활용 (일정 상세와 양방향 동기화)
  - 일정 미첨부 → `post_attendance` 테이블 (게시글 전용, 작성자 토글로 활성화)
- DB: `post_attendance` 테이블 + `posts.attendance_enabled` 컬럼 추가 (`014_post_attendance.sql`)
- API 4개: POST/DELETE/GET summary/GET details (게시글 기반)
- Phase 1 (MVP 8단계) + Phase 2 (확장 3단계)

#### 2. Push 알람 상세 설정 (요구사항 B)
- 파일: `Docs/features/push-notification-plan.md` (기존 파일에 §10 추가)
- 게시글 작성 시 Push 발송 방식 선택 기능:
  - 즉시 발송 / 예약 발송 / 일정 연동(D-7, D-3, D-1, 당일) / 알림 없음
- DB: `scheduled_notifications` 테이블 (`017_scheduled_notifications.sql`)
  - post_id, schedule_id, notification_type, scheduled_at, status, sent_at
- 서버 cron: 5분 간격 폴링으로 pending 알림 발송
- 기존 N-01/N-03 알림과 중복 방지 로직 포함
- Phase 3으로 구현 (6단계)

#### 3. 직책 관리 시스템 기획서 (요구사항 C)
- 파일: `Docs/features/member-position-plan.md` (신규)
- 기존 `positions` 테이블 (migration 010) + `users.jc_position` 최대 활용
- **핵심 설계**: `users.position_id` FK 추가로 정규화 + `jc_position` 동기화 유지
- DB: `position_id` FK + `position_history` 이력 테이블 (`015_user_position_id.sql`)
- API: 직책 목록 조회, 회원 직책 변경, 회원 목록 필터/정렬
- 관리자 UI: 회원 상세에서 직책 드롭다운 선택
- Phase 1 (MVP 7단계) + Phase 2 (확장 4단계)

#### 4. 회원 상세 프로필 — 인물카드 기획서 (요구사항 D) ★핵심★
- 파일: `Docs/features/member-dossier-plan.md` (신규)
- CEO 비전: "국정원 인물 프로필" 스타일 종합 카드
- **기존 스키마 최대 활용**: users 테이블의 JSONB 필드(educations, careers, families) + 40개 이상 기존 컬럼
- 8개 탭: 기본정보, JC이력, 교육, 활동, 경력, 가족, 취미/특기, 관리자메모
- DB 추가: `admin_memo` 컬럼 + `member_activities` 테이블 (`016_member_dossier.sql`)
- API: 통합 dossier 조회 + JSONB CRUD (교육/경력/가족) + 활동 CRUD + 참석 이력
- 권한 3단계: 본인(전체-메모제외), 일반회원(공개정보만), 관리자(전체)
- 회원가입 시 수집 vs 나중 추가 정보 구분
- Phase 1 (MVP 10단계) + Phase 2 (확장 6단계)

### 생성/수정 파일
- `Docs/features/post-attendance-plan.md` (신규)
- `Docs/features/push-notification-plan.md` (§10 추가)
- `Docs/features/member-position-plan.md` (신규)
- `Docs/features/member-dossier-plan.md` (신규)
- `Docs/agent-logs/planner-session.md` (업데이트)

### 마이그레이션 파일 계획
| 번호 | 파일명 | 내용 |
|------|--------|------|
| 014 | `014_post_attendance.sql` | 게시글 참석 테이블 + attendance_enabled 컬럼 |
| 015 | `015_user_position_id.sql` | 사용자 직책 FK + 직책 이력 테이블 |
| 016 | `016_member_dossier.sql` | 관리자 메모 + 활동 이력 테이블 |
| 017 | `017_scheduled_notifications.sql` | 예약/D-day 알림 스케줄 테이블 |

### 전달사항
- **백엔드**: migration 014~017 실행 순서대로 적용, 기존 jc_position→position_id 마이그레이션 주의
- **프론트엔드**: member-dossier.js 신규 파일 생성 필요, 8개 탭 UI 구현
- **디자이너**: 인물카드 상세 디자인 가이드 요청 (상단 프로필 카드 + 탭 바 + 각 섹션)
- **테스터**: 참석 기능 — 일정 연동 데이터 동기화 검증 중점
