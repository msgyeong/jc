# 디자이너 에이전트 작업 이력

> 담당: UI/UX 설계, 디자인 시스템 관리
> 담당 폴더: `Docs/design-system/`, `Docs/wireframes/`
> 규칙: `web/`, `api/` 파일은 절대 수정하지 않음

---

## 세션 1: 2026-03-09

### 작업 1: 전체 디자인 일관성 점검 + 컴포넌트 개선안
- **시간**: 2026-03-09
- **지시**: 사장님 — 앱 디자인 퀄리티가 출시 수준 미달, 디자인 가이드 정리
- **작업 내용**:
  1. `web/styles/main.css` (2300줄+) 전체 분석
  2. 배포 화면 스크린샷 5종 분석 (홈, 게시판, 일정, 회원, 프로필)
  3. 문제점 17건 식별 (심각 2, 중간 2, 경미 2 + CSS 이슈 다수)
- **산출물**:
  - `Docs/design-system/04-design-audit.md` — 점검 보고서 (화면별 문제, CSS 하드코딩 8건, 중복 3건)
  - `Docs/design-system/05-component-improvement.md` — 5개 영역 개선안 (배너, 카드, 프로필, 네비, 홈요약)
  - `Docs/design-system/06-badge-tag-guide.md` — 배지/태그 통일 가이드 (N배지 겹침 해결, 4유형 스펙)
  - `Docs/design-system/README.md` 업데이트
- **상태**: 완료

### 작업 2: 관리자 웹 명세 기반 통합 디자인 시스템 업데이트
- **시간**: 2026-03-09 (작업 1 직후)
- **지시**: 사장님 — 관리자 웹 UI 설계 명세 공유, 디자인 톤 통일
- **참고 자료**: 관리자 웹 명세 (Primary #2563EB, Card Radius 16px, Sidebar 240px 등)
- **분석 내용**:
  - `web/admin/admin.css` (1239줄) 전체 분석
  - `web/admin/index.html` 구조 확인
  - 모바일 웹 vs 관리자 웹 색상/레이아웃 차이 비교
- **핵심 결정**:
  - Primary 색상 통일: `#1F4FD8` → `#2563EB` (관리자 명세 기준)
  - Border 색상 통일: `rgba(107,114,128,0.3)` → `#D1D5DB`
  - Shadow 3단계 체계 도입: sm/md/lg
  - CSS 변수 16건 신규 추가 필요
- **산출물**:
  - `Docs/design-system/07-unified-design-guide.md` — 통합 디자인 가이드 (토큰 35종, 원칙 정의)
  - `Docs/design-system/08-admin-web-design-guide.md` — 관리자 웹 전용 (레이아웃, 10종 컴포넌트)
  - `Docs/design-system/09-mobile-color-alignment.md` — 모바일 색상 통일 (Before/After 명세)
  - `Docs/design-system/10-css-variable-migration.md` — 하드코딩 전환 4단계 Phase 계획
  - `Docs/design-system/README.md` 업데이트
- **상태**: 완료

---

## 세션 2: 2026-03-10

### 작업 3: 모바일 앱 색상 리뉴얼 가이드
- **시간**: 2026-03-10
- **지시**: 사장님 — "색상이 너무 컬러풀하고 촌스럽다" 피드백
- **분석 내용**:
  - `web/styles/main.css` 전체 색상 사용 현황 분석
  - `web/js/home.js` 배너 SVG 그라디언트 3종 색상 확인 (블루/초록/보라)
  - `web/js/members.js`, `web/js/profile.js` 아바타 8색 랜덤 배열 확인
  - `web/js/schedules.js` 카테고리 5색 확인
  - 관리자 배지 `#8B5CF6`(보라) 등 Primary 톤과 불일치 색상 식별
- **핵심 결정**:
  - **"Blue + Gray" 2톤 베이스** 원칙 확정
  - 배너 3종 → 블루 계열 그라디언트 통일 (명도 차이로 구분)
  - 아바타 8색 랜덤 → 단일 톤 (#DBEAFE 배경 + #2563EB 이니셜)
  - 배지 원색 배경 → 연한 배경 + 진한 텍스트 스타일 통일
  - N배지 사용 기준 정리 (3일+미읽음, 홈에서 최대 2개, 하단 네비는 dot만)
  - 제거 대상 색상: 핑크, 보라, 시안, 주황, 초록(배너) 등 6색
- **산출물**:
  - `Docs/design-system/11-mobile-color-renewal.md` — 모바일 색상 리뉴얼 가이드
    - Before/After 매핑표 (배너, 아바타, 네비, 배지, 일정, 프로필 등 7개 영역)
    - N배지 사용 기준 + 최대 개수 제한
    - 프로필 카드 색상 개선안
    - 프론트엔드 전달용 7단계 Phase 작업 목록
- **상태**: 완료

---

## 세션 3: 2026-03-10

### 작업 4: 중기 스프린트 UI 가이드 (출석 투표 + 전화걸기)
- **시간**: 2026-03-10
- **지시**: 사장님 — 중기 스프린트 UI 가이드 작성 (Blue+Gray 2톤 기반)
- **산출물**:
  - `Docs/design-system/12-attendance-vote-ui.md` — 출석 투표 UI 가이드
    - 투표 카드 레이아웃 (모임명, 날짜, 장소, 3버튼)
    - 참석/불참/미정 버튼 Default + Active 상태 (색상, border, shadow, 체크 아이콘)
    - 참석 현황 바 차트 (3색 세그먼트 + 범례)
    - 참석자 명단 리스트 (아바타 + 이름 + 직책 + 상태 배지)
    - 모바일 반응형 (480px, 360px 브레이크포인트)
    - 인터랙션 가이드 (토글, 재선택, 애니메이션)
    - 빈 상태 / 로딩 / 마감 상태 UI
  - `Docs/design-system/13-click-to-call-ui.md` — 전화걸기 UI 가이드
    - 회원 목록 전화 아이콘 위치 (우측 끝, flex)
    - SVG 아이콘 규격 (20×20, stroke: currentColor, stroke-width: 1.5)
    - 전화번호 텍스트 스타일 (파란색 밑줄, 연한 밑줄 색 #93C5FD)
    - 40×40 터치 영역 래퍼
    - 전화번호 미등록 비활성 상태
    - 접근성 (aria-label, 스크린리더 호환)
- **상태**: 완료

---

## 세션 4: 2026-03-10

### 작업 5: 3차 스프린트 UI 가이드 (일정상세, 일정폼, 홈배너, 빈상태/로딩/에러)
- **시간**: 2026-03-10
- **지시**: 사장님 — 3차 스프린트 UI 가이드 4종 작성
- **참조 문서**:
  - `Docs/features/schedule-detail.md` (기획자 작성 일정 상세 기획서)
  - `Docs/features/schedule-form.md` (기획자 작성 일정 폼 기획서)
  - `Docs/home-screen-plan-2026-03-09.md` (홈 화면 기획)
  - `12-attendance-vote-ui.md` (출석투표 — 참조만)
- **산출물**:
  - `Docs/design-system/14-schedule-detail-ui.md` — 일정 상세 화면 UI 가이드
    - AppBar (뒤로가기 + 더보기 메뉴 드롭다운)
    - 카테고리 배지 5종 색상 매핑
    - 기본 정보 카드 (날짜/장소/작성자/등록일, 아이콘 행)
    - 장소 지도 링크 (네이버 지도 연동, 아이콘 버튼)
    - 출석투표 섹션 (12번 참조)
    - 참석자 명단 (최대 5명 + 전체보기 바텀시트)
    - 연결된 공지 배너 (블루 배경 카드, 클릭 이동)
    - 댓글 섹션 (댓글/대댓글, 공감, 하단 고정 입력바)
    - 삭제 확인 다이얼로그
    - 반응형 (480px/360px)
  - `Docs/design-system/15-schedule-form-ui.md` — 일정 등록/수정 폼 UI 가이드
    - AppBar (취소/저장, 등록/수정 모드)
    - 입력 필드 공통 스타일 (기본/포커스/에러/비활성)
    - 카테고리 드롭다운 (네이티브 select 커스텀)
    - 종일 이벤트 체크박스 (시간 필드 토글)
    - 날짜/시간 입력 (date+time 병렬 레이아웃)
    - 참석 투표 설정 접이식 섹션 (토글 스위치, 라디오 버튼, 조건부 필드)
    - 유효성 에러 인라인 표시 (9개 규칙)
    - 취소 확인 다이얼로그
    - 반응형 (480px/360px)
  - `Docs/design-system/16-home-banner-ui.md` — 홈 배너 캐러셀 UI 가이드
    - 배너 컨테이너 (160px 고정, 0개 시 숨김)
    - 슬라이드 트랙 (flex + translateX)
    - 유형 A: 이미지 배너 (오버레이 + 텍스트)
    - 유형 B: 컬러 배경 (블루 그라디언트 3종)
    - 인디케이터 점 (활성=pill 18px, 비활성=원 6px)
    - 자동 전환 4초, 스와이프, 화면 비활성 시 정지
    - 데스크탑 화살표 (hover fade-in)
    - 클릭 동작 (external/notice/schedule)
    - 접근성 (ARIA)
    - 반응형 (480px: 140px, 360px: 120px)
  - `Docs/design-system/17-empty-loading-error-ui.md` — 빈 상태/로딩/에러 공통 UI 가이드
    - 빈 상태 (SVG 아이콘 64px + 메시지 + CTA, 화면별 9종 정의)
    - 스켈레톤 로딩 (shimmer 애니메이션, 화면별 5종 구성)
    - 풀 에러 (에러 아이콘 원형 + 메시지 + 재시도, 화면별 6종)
    - 토스트 알림 (성공/에러/정보 3유형, 3초 자동 퇴장)
    - 인라인 에러 (폼 필드 하단, fade-in 애니메이션)
    - 네트워크 오프라인 배너 (상단 고정, 복귀 시 "연결됨")
    - 반응형 (480px/360px)
- **상태**: 완료

---

## 세션 5: 2026-03-11

### 작업 6: Web Push 알림 UI 가이드 작성
- **시간**: 2026-03-11
- **지시**: 사장님 — Web Push 알림 기능 UI 가이드 작성 (기획자 요청서 기반)
- **참조 문서**:
  - `Docs/design-system/18-notification-ui.md` (기획자 요청서 → 확장)
  - `Docs/features/web-push-notification.md` (상세 기획서)
  - `Docs/design-system/07-unified-design-guide.md` (통합 디자인 토큰)
  - `Docs/design-system/16-home-banner-ui.md` (배너 UI 참고)
- **산출물**:
  - `Docs/design-system/18-notification-ui.md` — 기획자 요청서를 상세 UI 가이드로 확장
    - **1. 앱바 알림 배지**: SVG 종 아이콘 24px, 미읽음 배지(pill, #DC2626, 10px bold), 바운스 애니메이션
    - **2. 알림 센터 화면**: 미읽음(#EFF6FF)/읽음(#FFFFFF) 배경 차이, 좌측 파란 점 8px, 유형별 원형 아이콘(4종), 시간 표시 6단계 규칙, 빈 상태(SVG 64px)
    - **3. 알림 설정 화면**: iOS 스타일 토글(48×28px), 마스터 스위치(크기 대, 15px bold), 마스터 OFF 시 opacity 0.5 + pointer-events none, 푸시 상태 표시
    - **4. 푸시 구독 유도 배너**: 하단 고정(72px), 카드형(#FFFFFF, shadow-md), [알림 켜기] Primary CTA + [나중에] Ghost, slide-up/down 애니메이션, 7일 후 재표시, 3회 닫기 시 영구 숨김
    - **5. PWA 설치 안내 배너**: 상단 고정(64px), #EFF6FF 배경, 닫기(X) 가능, OS별 안내 모달(Android Chrome + iOS Safari), 7일 후 재표시
    - **6. 푸시 알림 디자인**: PWA 아이콘 6종 제작 가이드(192/512/maskable/badge/apple-touch), 유형별 알림 예시 6종, 제목 40자/본문 80자 제한
    - 반응형 CSS (430px/360px 브레이크포인트)
    - 접근성 (ARIA role/label 전체 정의)
    - CSS 클래스명 규칙 5개 프리픽스
    - 프론트엔드 Phase 1/2 구현 순서
- **디자인 결정 사항**:
  - 스와이프 삭제 미구현 (소규모 앱, "모두 읽음"으로 충분)
  - 알림 아이콘 원형 배경 채택 (블루 DBEAFE, 리마인더만 옐로 FEF3C7)
  - 배지 border 2px solid primary (앱바 배경과 분리감)
  - 구독 배너: 하단 고정 (BottomNav 위) / 설치 배너: 상단 고정 (AppBar 아래) — 위치 차별화
  - 토글 스위치: 48×28px iOS 스타일 (CSS-only)
- **상태**: 완료

---

## 현재 디자인 시스템 파일 목록

| # | 파일 | 상태 | 설명 |
|---|------|------|------|
| 01 | `01-color-palette.md` | 구버전 | 초기 색상 정의 (Primary #1F4FD8 — 변경 예정) |
| 02 | `02-typography.md` | 구버전 | 타이포 정의 (Flutter 참조 포함 — 정리 필요) |
| 03 | `03-component-styles.md` | 구버전 | 컴포넌트 기본 정의 (AppBar만) |
| 04 | `04-design-audit.md` | **최신** | 디자인 점검 보고서 |
| 05 | `05-component-improvement.md` | **최신** | 컴포넌트 개선안 |
| 06 | `06-badge-tag-guide.md` | **최신** | 배지/태그 가이드 |
| 07 | `07-unified-design-guide.md` | **최신** | 통합 디자인 가이드 (기준 문서) |
| 08 | `08-admin-web-design-guide.md` | **최신** | 관리자 웹 전용 |
| 09 | `09-mobile-color-alignment.md` | **최신** | 모바일 색상 통일 |
| 10 | `10-css-variable-migration.md` | **최신** | CSS 변수 전환 계획 |
| 11 | `11-mobile-color-renewal.md` | **최신** | 모바일 색상 리뉴얼 가이드 (촌스러움 해결) |
| 12 | `12-attendance-vote-ui.md` | **최신** | 출석 투표 UI 가이드 |
| 13 | `13-click-to-call-ui.md` | **최신** | 전화걸기 (Click-to-Call) UI 가이드 |
| 14 | `14-schedule-detail-ui.md` | **최신** | 일정 상세 화면 UI 가이드 |
| 15 | `15-schedule-form-ui.md` | **최신** | 일정 등록/수정 폼 UI 가이드 |
| 16 | `16-home-banner-ui.md` | **최신** | 홈 배너 캐러셀 UI 가이드 |
| 17 | `17-empty-loading-error-ui.md` | **최신** | 빈 상태/로딩/에러 공통 UI 가이드 |
| 18 | `18-notification-ui.md` | **최신** | Web Push 알림 UI 가이드 (6개 컴포넌트) |

---

## 다음 작업 (TODO) — 프론트엔드에 전달 대기

아래 항목은 **사장님 승인 후 프론트엔드 에이전트가 실행**해야 함:

- [ ] `main.css` :root에 신규 CSS 변수 16건 추가 (Phase 1)
- [ ] 하드코딩 색상 30건 → 변수 참조로 전환 (Phase 2)
- [ ] `--primary-color: #2563EB` 변경 + `--border-color: #D1D5DB` 변경 (Phase 3)
- [ ] 중복 선언 3건 정리 (Phase 4)
- [ ] 홈 배너 기본 UI 구현 (05번 문서)
- [ ] N 배지 겹침 수정 (06번 문서)
- [ ] 하단 네비 이모지 → SVG 전환 (05번 문서)
- [ ] 프로필 액션 버튼 추가 (05번 문서)
- [ ] 게시글 카드 shadow 강화 (05번 문서)

## 세션 6: 2026-03-13

### 작업 7: 전체 디자인 리뉴얼 — 미니멀 방향 전환 (이슈 #3, #2, #7, #9)
- **시간**: 2026-03-13
- **지시**: CEO — "파란색 일색 촌스러움, 입력필드 구림, 심플하고 세련되게"
- **핵심 결정**:
  - **Primary 색상 전환**: `#2563EB` (블루) → `#1E3A5F` (딥 네이비) — 세련된 무채색 기반
  - **AppBar 전환**: 파란 그라데이션 → 흰색 배경 + 하단 border
  - **입력필드**: 48px → 44px, focus시 border-color만 변경 (미세 ring)
  - **그림자 최소화**: 카드는 border 구분, shadow는 모달/드로어만
  - **아바타 단일 톤**: 8색 랜덤 → `#F0F4F8` 배경 + `#1E3A5F` 이니셜
  - **배지**: 원색 배경 → 연한 배경 + 진한 텍스트 (N배지만 원색 허용)
- **산출물**:
  - `Docs/design-system/tokens.css` — **신규 작성** (디자인 토큰 v2.0)
    - 라이트/다크 모드 색상 토큰
    - Spacing, Radius, Shadow, Typography 토큰
    - 컴포넌트별 토큰 (AppBar, Input, Button, Card, Toggle, Nav)
  - `Docs/design-system/components.md` — **전면 재작성** (컴포넌트 가이드 v2.0)
    - AppBar 리디자인 (흰색 배경 + border)
    - 입력 필드 리디자인 (44px, 가벼운 focus)
    - 버튼 3종 (Primary/Ghost/Danger) + Text Button
    - 토글 스위치 (이슈 #2 — 44×24px iOS 스타일)
    - 프로필 하단 메뉴 (이슈 #7 — iOS 설정 스타일 리스트)
    - 환경설정 화면 (이슈 #9 — 섹션 그룹 + 토글/chevron)
    - 배지 6종, 아바타 단일 톤, 하단 네비 SVG, 다이얼로그
    - 프론트엔드 전달용 8단계 Phase 계획
- **상태**: 완료

---

## 현재 디자인 시스템 파일 목록

| # | 파일 | 상태 | 설명 |
|---|------|------|------|
| — | `tokens.css` | **v2.0 최신** | CSS 디자인 토큰 (라이트+다크) |
| — | `components.md` | **v2.0 최신** | 컴포넌트 가이드 (미니멀 리뉴얼) |
| 01 | `01-color-palette.md` | 구버전 | 초기 색상 (→ tokens.css로 대체) |
| 02 | `02-typography.md` | 구버전 | 타이포 (→ tokens.css로 대체) |
| 03 | `03-component-styles.md` | 구버전 | 컴포넌트 (→ components.md로 대체) |
| 04 | `04-design-audit.md` | 참고용 | 디자인 점검 보고서 |
| 05 | `05-component-improvement.md` | 참고용 | 컴포넌트 개선안 |
| 06 | `06-badge-tag-guide.md` | 참고용 | 배지/태그 가이드 |
| 07 | `07-unified-design-guide.md` | 참고용 | 통합 디자인 가이드 (→ tokens.css 우선) |
| 08 | `08-admin-web-design-guide.md` | **최신** | 관리자 웹 전용 |
| 09 | `09-mobile-color-alignment.md` | 참고용 | (→ tokens.css로 대체) |
| 10 | `10-css-variable-migration.md` | 참고용 | CSS 변수 전환 계획 |
| 11 | `11-mobile-color-renewal.md` | 참고용 | 색상 리뉴얼 (→ tokens.css 반영) |
| 12 | `12-attendance-vote-ui.md` | **최신** | 출석 투표 UI 가이드 |
| 13 | `13-click-to-call-ui.md` | **최신** | 전화걸기 UI 가이드 |
| 14 | `14-schedule-detail-ui.md` | **최신** | 일정 상세 화면 UI 가이드 |
| 15 | `15-schedule-form-ui.md` | **최신** | 일정 등록/수정 폼 UI 가이드 |
| 16 | `16-home-banner-ui.md` | **최신** | 홈 배너 캐러셀 UI 가이드 |
| 17 | `17-empty-loading-error-ui.md` | **최신** | 빈 상태/로딩/에러 공통 UI 가이드 |
| 18 | `18-notification-ui.md` | **최신** | Web Push 알림 UI 가이드 |

---

## 다음 작업 (TODO) — 프론트엔드에 전달 대기

아래 항목은 **사장님 승인 후 프론트엔드 에이전트가 실행**해야 함:

### 미니멀 리뉴얼 적용 (8 Phase)
- [ ] Phase 1: `tokens.css` 기반 CSS 변수 교체 (main.css `:root` 재정의)
- [ ] Phase 2: AppBar → 흰색 배경 + border 전환
- [ ] Phase 3: 입력필드 높이 44px + 포커스 스타일 변경
- [ ] Phase 4: 프로필 하단 → 설정 리스트 메뉴 전환 (이슈 #7)
- [ ] Phase 5: 토글 스위치 컴포넌트 추가 (이슈 #2)
- [ ] Phase 6: 아바타 단일 톤 통일
- [ ] Phase 7: 배지 연한 배경 스타일 전환
- [ ] Phase 8: 환경설정 화면 신규 구현 (이슈 #9)

### 기타 (이전 TODO 이관)
- [ ] 홈 배너 기본 UI 구현 (16번 문서)
- [ ] 하단 네비 이모지 → SVG 전환
- [ ] 게시글 카드 shadow → border 전환

## 디자이너 에이전트 추가 TODO

- [ ] 와이어프레임 업데이트 (`Docs/wireframes/`)
- [ ] 반응형 디자인 가이드 작성 (모바일 480px 이하)
- [ ] 리뉴얼 적용 후 전체 스크린 시각 검증
- [ ] 12~18번 UI 가이드 색상을 딥 네이비 `#1E3A5F` 기준으로 갱신
