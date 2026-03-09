# 관리자 웹 PRD - 기능 정의

> 최종 수정: 2026-03-09 | 전면 재작성 (사장님 UI 명세서 기반)

---

## 1. 인증 (AW-001)

- 최고 관리자 로그인: admin_id + password → JWT 토큰 발급
- 토큰 만료 시 자동 로그아웃 → 로그인 화면 리다이렉트
- 인증 실패 시 인라인 에러 메시지
- 모든 API 요청에 Bearer 토큰 첨부

---

## 2. 가입 승인 (AW-002)

- 가입 대기/승인됨/거절됨 상태별 필터 탭
- 대기 건수 배지 (사이드바)
- 승인: 확인 모달 → 상태 변경 → `is_approved = true`
- 거절: 사유 입력 모달 → 상태 변경 → `rejection_reason` 저장
- 처리 결과 즉시 목록 갱신
- 앱에서 거절된 회원이 로그인 시 거절 사유 표시

---

## 3. 회원 관리 (AW-003, AW-004)

### 3-1. 회원 목록 (AW-003)
- 통합 검색 (이름/이메일/전화번호)
- 필터: 상태, 기수, 소속, 직책
- 50명 단위 페이지네이션
- 행 클릭 → 회원 관리카드 이동

### 3-2. 회원 관리카드 (AW-004)
- **기본 정보**: 이름, 이메일, 전화, 가입일, 상태
- **JC 정보 (관리자 전용)**:
  - 직책 변경 → 권한 자동 반영 + Audit Log 기록 (R-03)
  - 소속, 기수, 교육 이력, JC 경력, 표창/국제대회
  - 교육 이력: 교육명, 이수 여부, 이수일 (모달로 관리)
- **개인 정보**: 가입 시 입력 정보 조회/보완
- **권한 설정**: 체크박스 (공지작성/일정등록/삭제)
  - 직책 변경 시 자동 업데이트 (매트릭스 기반)
  - 수동 오버라이드 가능
- **상태 변경**: 정지/복구/탈퇴 처리 (확인 모달 필수)
- **변경 이력 (Audit Log)**: 모든 변경 시간순 역순 표시
- **인쇄**: CSS @media print 레이아웃 → 회원관리카드 출력 (R-01)

---

## 4. 직책/권한 관리 (AW-005)

- **권한 매트릭스**: 직책(행) × 권한(열) 체크박스 테이블
  - 권한: 공지사항 작성, 일정 등록, 게시글/댓글 삭제
- **직책 추가**: 새 직책명 입력으로 행 추가
- **저장**: 일괄 저장 → 해당 직책의 모든 회원에게 **실시간 반영**
- **하드코딩 금지**: 직책/권한은 모두 DB 테이블에서 관리
- 변경 시 확인 모달 필수

---

## 5. 게시판 관리 (AW-006)

- **탭**: 공지 게시판 / 일반 게시판
- **검색**: 제목, 작성자
- **테이블**: 제목, 작성자, 작성일, 조회수, 댓글수
- **Drawer (우측 슬라이드)**: 게시글 상세 표시
  - 본문, 이미지, 댓글 목록
  - 개별 댓글 삭제
  - 게시글 삭제 (Danger Red, 확인 모달)
- **고정 토글** (공지만): 행에서 바로 토글
- 모든 삭제는 soft delete

---

## 6. 공지사항 관리 (AW-007)

- **목록**: 고정 공지 상단, 최신순
- **작성/수정 모달** (480px):
  - 제목, 본문, 이미지 (최대 5개)
  - 고정 공지 설정 체크박스
  - **참석 투표 활성화** (R-02): 투표 유형(이사회/월례회/기타), 마감일
  - **일정 연동** (R-07): 일정일, 시간, 장소 → 캘린더 자동 반영
- **삭제**: 확인 모달 → soft delete
- **고정 토글**: 행에서 바로 변경

---

## 7. 일정 관리 (AW-008)

- **필터**: 월 선택, 카테고리 (행사/회의/교육/공휴일/기타)
- **테이블**: 날짜, 제목, 장소, 카테고리(컬러 도트), 연결 공지
- **등록/수정 모달** (480px): 제목, 날짜, 시간(시작/종료), 장소, 카테고리, 설명
- **삭제**: 모달 내 삭제 버튼 (Danger Red, 확인 모달)
- **연결 공지 표시**: R-07로 생성된 일정은 공지 링크 표시

---

## 8. 관리자 계정 보안 (AW-009)

- **비밀번호 변경**: 현재 비밀번호 확인 → 새 비밀번호 입력
- **비밀번호 정책**: 최소 8자, 영문+숫자+특수문자
- 변경 성공 시 토큰 재발급 (세션 유지)
- **계정 정보 표시**: 관리자 ID, 마지막 로그인 시각

---

## 9. Audit Log (횡단 관심사)

모든 관리자 조작에 대해 감사 로그를 기록한다.

### 기록 대상
- 회원 상태 변경 (승인/거절/정지/복구/탈퇴)
- 회원 직책 변경
- 회원 권한 변경
- 회원 정보 수정 (관리자 전용 필드)
- 게시글/댓글 삭제
- 공지사항 작성/수정/삭제
- 일정 등록/수정/삭제
- 직책-권한 매트릭스 변경

### 기록 형식
```
{
  id: serial,
  admin_id: string,           // 변경 수행 관리자
  action: string,             // 'member.approve', 'member.position_change', ...
  target_type: string,        // 'member', 'post', 'notice', 'schedule', 'position'
  target_id: integer,         // 대상 ID
  before_value: jsonb,        // 변경 전 값
  after_value: jsonb,         // 변경 후 값
  description: string,        // 사람이 읽을 수 있는 설명
  created_at: timestamp
}
```

### 조회
- AW-004 회원 관리카드에서 해당 회원 관련 로그 표시
- 추후 전체 Audit Log 조회 화면 확장 가능

---

## 10. API 엔드포인트 목록

### 인증
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/admin/auth/login` | 관리자 로그인 |
| PUT | `/api/admin/auth/password` | 비밀번호 변경 |
| GET | `/api/admin/auth/me` | 계정 정보 |

### 회원 관리
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/members/pending` | 가입 대기 목록 |
| GET | `/api/admin/members` | 회원 목록 (검색/필터/페이지) |
| GET | `/api/admin/members/:id` | 회원 상세 |
| PUT | `/api/admin/members/:id` | 회원 정보 수정 |
| POST | `/api/admin/members/:id/approve` | 가입 승인 |
| POST | `/api/admin/members/:id/reject` | 가입 거절 |
| PUT | `/api/admin/members/:id/position` | 직책 변경 |
| PUT | `/api/admin/members/:id/permissions` | 권한 설정 |
| PUT | `/api/admin/members/:id/status` | 상태 변경 |
| PUT | `/api/admin/members/:id/education` | 교육 이력 수정 |
| PUT | `/api/admin/members/:id/career` | JC 경력 수정 |
| GET | `/api/admin/members/:id/audit-log` | 변경 이력 조회 |

### 직책/권한
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/positions` | 직책 + 권한 매트릭스 |
| PUT | `/api/admin/positions` | 매트릭스 일괄 저장 |
| POST | `/api/admin/positions` | 직책 추가 |

### 게시판
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/posts` | 게시글 목록 |
| DELETE | `/api/admin/posts/:id` | 게시글 삭제 |
| DELETE | `/api/admin/posts/:id/comments/:commentId` | 댓글 삭제 |
| POST | `/api/admin/posts/:id/pin` | 고정 토글 |

### 공지사항
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/notices` | 공지 목록 |
| POST | `/api/admin/notices` | 공지 작성 |
| PUT | `/api/admin/notices/:id` | 공지 수정 |
| DELETE | `/api/admin/notices/:id` | 공지 삭제 |

### 일정
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/schedules` | 일정 목록 |
| POST | `/api/admin/schedules` | 일정 등록 |
| PUT | `/api/admin/schedules/:id` | 일정 수정 |
| DELETE | `/api/admin/schedules/:id` | 일정 삭제 |
