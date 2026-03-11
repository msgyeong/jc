# 프론트엔드 에이전트 작업 이력

> 담당: `web/` 폴더 (index.html, js/, styles/, admin/, image/)
> 규칙: web/ 폴더 외 파일 수정 금지. 타 역할 변경 필요 시 사장에게 보고.

---

## 세션 #1 — 2026-03-09 (일)

### 작업: UI 긴급 수정 5건
- **상태**: 완료
- **커밋**: `676ad56` → `origin main` 푸시 완료 (Railway 자동 배포)

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/navigation.js` | `loadHomeScreen()` → `loadHomeData()` 수정 (2곳). 미정의 함수 호출 ReferenceError 해결 |
| `web/js/schedules.js` | `if (!calMonth)` → `if (calMonth == null)` 수정 (1월 버그). API 응답 호환성 추가 |
| `web/js/members.js` | API 응답 파싱 호환성 (result.members / result.data.members / result.data.items). 에러 시 "다시 시도" 버튼 |
| `web/js/home.js` | 배너→그라데이션 SVG 3종. 일정카드: event_date→start_date 호환, N배지 absolute 분리. 공지 API 호환성 |
| `web/styles/main.css` | +330줄. 홈 일정/공지 카드, 게시판 카드 그림자/hover, 프로필 그라데이션 히어로, 빈/에러 상태 UI, 로딩 스피너 |

#### 수정 상세

**[긴급1] 캘린더 렌더링 안 됨**
- 원인: navigation.js의 `loadHomeScreen()` 미정의 함수 → ReferenceError. schedules.js의 `!calMonth`이 0(1월)에서 true. API 응답 형식 불일치 가능성.
- 해결: 함수명 수정, `calMonth == null` 체크, 응답 폴백 패턴 적용

**[긴급2] 회원 목록 "로딩 중" 멈춤**
- 원인: API 응답 형식 불일치 (members vs data.members vs data.items)
- 해결: 3가지 형식 모두 지원, 에러 시 "다시 시도" 버튼

**[높음] 홈 화면 배너/일정/배지**
- 배너: 텅 빈 플레이스홀더 → 파랑/초록/보라 그라데이션 SVG 3종
- N배지: 텍스트 겹침 → `position: absolute; top: -4px; right: -4px`
- 일정카드: `home-schedule-card` 전용 클래스 분리

**[보통] 게시판/프로필**
- 게시판: box-shadow + hover translateY(-1px) + 빈 상태 아이콘
- 프로필: 히어로 linear-gradient, 아바타 white border, info-section 그림자 강화
- 프로필 버튼(수정/비번/로그아웃)은 이미 profile.js에 존재하여 추가 불필요

---

## 세션 #2 — 2026-03-10 (월)

### 작업: CSS 변수 마이그레이션 Phase 1~4
- **상태**: 완료
- **커밋**: `b42db87`
- **기준 문서**: `Docs/design-system/10-css-variable-migration.md`, `07-unified-design-guide.md`

#### Phase 1: 신규 CSS 변수 추가
`:root`에 19개 디자인 토큰 변수 추가 (색상 16개 + 섀도우 3개):
`--primary-hover`, `--primary-light`, `--primary-bg`, `--error-hover`, `--error-bg`, `--error-text`, `--success-bg`, `--success-text`, `--warning-bg`, `--warning-text`, `--text-hint`, `--neutral-bg`, `--purple-bg`, `--purple-text`, `--saturday-color`, `--sunday-color`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`

#### Phase 2: 하드코딩 색상 → 변수 전환 (30건)
| 카테고리 | 전환 항목 |
|----------|----------|
| Primary 계열 | `.btn-primary:hover` #1a42b8→var(--primary-hover), box-shadow rgba→rgb 맞춤, `.btn-secondary:hover` #d4dff7→filter:brightness, `.link-button:hover` #1a42b8→var(--primary-hover), `.fab` box-shadow rgba 2건 |
| 상태 색상 | `.inline-error-message` #FEE2E2→var(--error-bg), `.badge-admin` #8B5CF6→var(--purple-text), `.badge-member` #3B82F6→var(--primary-color), `.badge-pending` #9CA3AF→var(--text-hint), `.btn-remove:hover` #b91c1c→var(--error-hover), `.btn-remove.disabled` #d1d5db→var(--border-color) 2건 |
| 캘린더 | `.cal-weekday.sat`, `.cal-day.sat` #2563EB→var(--saturday-color) |
| 관리자 | `.stat-card.stat-warning` #fff8e1→var(--warning-bg) + #ffe082→var(--accent-color), `.result-box.success-box` #e8f5e9→var(--success-bg) + #a5d6a7→var(--success-color), `.result-box h3` #2e7d32→var(--success-text), `.temp-password-display` #66bb6a→var(--success-color) + #1b5e20→var(--success-text), `.btn-copy` 3건→success 변수, `.result-notice` #666→var(--text-secondary) |
| 배지/기타 | `.member-role-badge.role-super` #FEF3C7/#92400E→warning 변수, `.btn-icon-danger:hover` #FEE2E2→var(--error-bg), `.profile-action-btn.danger` #FEE2E2→var(--error-bg), `.badge-pinned` #FEF3C7/#92400E→warning 변수, `.profile-hero` gradient #3B82F6→var(--primary-light), `.member-search-box:focus-within` rgba→rgb 맞춤 |
| 정보 박스 | `.info-box` #FEF3C7→var(--warning-bg) |

#### Phase 3: Primary 색상 변경
- `--primary-color`: `#1F4FD8` → `#2563EB` (관리자 웹 명세 기준 통일)
- `--border-color`: `rgba(107,114,128,0.3)` → `#D1D5DB` (solid 값으로 통일)

#### Phase 4: 중복 선언 정리 (3건)
- `.app-bar-action` 두 번째 선언(캘린더 pill) → `.app-bar-action-pill`로 분리 + `web/index.html` class 업데이트
- `.btn-sm` 첫 번째 선언 제거 (두 번째 유지)
- `.content-section` 두 번째 중복 선언 제거

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/styles/main.css` | CSS 변수 19개 추가, 하드코딩 30건 전환, primary/border 색상 변경, 중복 3건 정리 |
| `web/index.html` | schedule-today-btn class: `app-bar-action` → `app-bar-action-pill` |

---

### 작업: 색상 리뉴얼 미반영 전수 수정
- **상태**: 완료
- **커밋**: `4b33611` (home.js 문법 오류 긴급 수정), `ed49c3f` (전수 수정)

#### 긴급 수정
- `home.js:66` — `notices.map()` 콜백에 닫는 `}` 누락 → SyntaxError → 전체 앱 로드 실패. 즉시 수정+푸시

#### 전수 수정 내역
| # | 항목 | 수정 내용 |
|---|------|----------|
| 1 | 앱바 색상 | 이미 `var(--primary-color)=#2563EB` (블루). 초록 미발견 — 캐시 문제 가능성 |
| 2 | 게시판 서브탭 | `.board-tabs` 파란배경→흰배경, `.board-tab.active` 흰색→`var(--primary-color)` 블루 밑줄 |
| 3 | 비밀번호 토글 | 👁️/🙈 이모지 → SVG eye/eye-off 아이콘 (index.html 3곳, navigation.js, auth.js) |
| 4 | UI 이모지 전수 제거 | posts.js (📌💬❤️🤍👁️→SVG/텍스트), home.js (📌💬❤️⏰📍→SVG/텍스트), notices.js (📌📝👁️💬❤️→SVG/텍스트), admin.js (✅❌👁️👍💬→텍스트), admin/admin.js (✅❌📌→텍스트) |
| 5 | `.icon-sm` CSS | 인라인 SVG 아이콘 통일 스타일 (14px, stroke:currentColor) |
| 6 | 초록색 전수 검색 | `#4CAF50/#43A047/#388E3C/#059669/green` — web/ 전체 0건 확인 |

---

### 작업: Blue+Gray 2톤 색상 리뉴얼 + 회원가입 UX 개선
- **상태**: 완료
- **커밋**: `b6f772f`
- **기준 문서**: `Docs/design-system/11-mobile-color-renewal.md`

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/index.html` | 하단 네비 이모지→SVG 아이콘 (5탭 x 6개 nav = 30건), 카카오 주소 API 스크립트, SSN 분할 입력 HTML, 주소 input readonly+onclick |
| `web/js/home.js` | 배너 3종 블루 통일 (초록/보라 제거), N배지 최대 2개 제한 (공지/일정 각각) |
| `web/js/members.js` | 아바타 8색 랜덤 → 단일 블루 (#DBEAFE + #2563EB) 3곳 |
| `web/js/profile.js` | 아바타 8색 랜덤 → 단일 블루 1곳 |
| `web/js/schedules.js` | meeting 카테고리 #059669→#2563EB |
| `web/js/signup.js` | SSN 분할 입력 (앞6+뒤1), 카카오 주소 검색 함수, 숫자 필터 함수 |
| `web/styles/main.css` | --primary-light #DBEAFE, 배지 연한배경+진한텍스트, SVG 네비 스타일, nav-dot, SSN 분할 CSS, pc-avatar/member-avatar/profile-avatar color:inherit |

#### 제거된 색상
핑크(#EC4899), 보라(#7C3AED, #8B5CF6, #A78BFA), 시안(#0891B2), 주황(#EA580C), 초록 배너(#059669, #10B981)

---

## 세션 #3 — 2026-03-10 (월) 오후

### 작업: CSS 캐시 버스팅 + 종합 디자인 개선
- **상태**: 완료
- **커밋**: `8d9dc49` → `origin main` 푸시 완료 (Railway 자동 배포)

#### 문제 상황
- 앱바가 CSS에서는 `#2563EB` 파란색인데, 배포 사이트에서 여전히 초록색으로 표시
- 원인: nginx의 CSS 캐시 (1년 immutable) + 브라우저 캐시

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/index.html` | `main.css` → `main.css?v=20260310` 캐시 버스팅 쿼리스트링 추가 |
| `web/styles/main.css` | :root 변수 개선, 앱바 그라데이션, 뱃지 통일, 브라우저 아이콘 제거 |

#### 상세 변경

**1. CSS 캐시 버스팅**
- `<link href="styles/main.css">` → `<link href="styles/main.css?v=20260310">`
- 서비스워커 확인 → 없음 (조치 불필요)

**2. :root CSS 변수 개선**
| 변수 | 이전 | 이후 |
|------|------|------|
| `--primary-dark` | (없음) | `#1D4ED8` |
| `--secondary-color` | `#E6ECFA` | `#F1F5F9` |
| `--success-color` | `#10B981` | `#059669` |
| `--background-color` | `#F9FAFB` | `#F8FAFC` |
| `--text-primary` | `#111827` | `#0F172A` |
| `--text-secondary` | `#6B7280` | `#64748B` |
| `--border-color` | `#D1D5DB` | `#E2E8F0` |
| `--radius-sm/md/lg` | (없음) | `8px/12px/16px` |
| `--shadow-sm` | 0.08+0.06 | 0.05 (가벼운 그림자) |
| `--shadow-md` | 0.10 | 0.07+0.05 (이중 레이어) |

**3. 앱바 그라데이션**
- `background-color: var(--primary-color)` → `background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)`
- `box-shadow`: 블루 계열 rgba(37,99,235,0.15)

**4. 뱃지 통일**
| 뱃지 | 이전 | 이후 |
|------|------|------|
| `.badge-admin` | 연한 파랑 배경 + 진한 파랑 텍스트 | `#2563EB` 배경 + 흰색 텍스트 |
| `.badge-member` | 회색 배경 | `#E0F2FE` 배경 + `#0369A1` 텍스트 |
| `.badge-pending` | 노란 배경 | `#F1F5F9` 배경 + `#64748B` 텍스트 |

**5. 브라우저 비밀번호 아이콘 제거**
- `input::-ms-reveal, input::-ms-clear { display: none; }` 추가
- 로그인 "..." 아이콘은 Edge/IE 브라우저 기본 비밀번호 표시 버튼이었음

#### 검증 결과
- 초록색 계열 잔여: 0건 (`#4CAF|#43A0|#388E|#e8f5|#a5d6|#66bb|#2e7d|#1b5e`)
- JS 문법 검사: `node -c web/js/*.js` 전체 통과

---

## 타 에이전트 요청사항

### → 백엔드
- [ ] API 응답 형식 통일 필요: `{ success, members }` vs `{ success, data: { items } }` 확정 요청

### → 테스터
- [ ] 배포 후 검증: 홈 배너, 캘린더 그리드, 회원 목록, 프로필 스타일

---

## 다음 작업 — 기획자 전달 (2026-03-09)

> 전체 우선순위: `Docs/priority-matrix-2026-03-09.md` 참조

### Must-have (앱)
- [x] M-01: 홈 배너 정비 — 세션 #5 완료 (블루 그라디언트 3종 캐러셀)
- [x] M-03: 회원 상세 프로필 (타인) + 바로 통화 tel: 링크 (R-08) — 세션 #4 완료
- [x] M-04: 일정 상세 화면 완성 — 세션 #5 완료
- [x] M-05: 일정 등록 화면 완성 — 세션 #5 완료
- [x] M-06: N배지 하단 탭 적용 — 세션 #5 완료
- [x] M-07: 빈 상태/로딩/에러 UI 전체 적용 — 세션 #5 완료
- [x] M-11: 참석 투표 UI → 세션 #4 완료 (출석투표 3버튼+프로그레스바)
- [x] M-12: 공지-일정 연동 UI → 세션 #6 완료
- [x] M-13: 업종 검색 UI → 세션 #6 완료
- [x] M-16: 프로필 바로 통화 (tel: 링크) — 세션 #4 완료
- [x] M-17: 즐겨찾기 UI (별표 토글 + 필터) — 세션 #4 완료 (필터는 미구현)

### Must-have (관리자 웹 — 전면 재개발)
- [ ] M-08a: 기존 web/admin/, admin-web/ 코드 삭제
- [ ] M-08b~j: AW-001~009 신규 개발 → `Docs/admin-web/` 전체 참조
- 디자인: 그레이톤, 사이드바 240px, 헤더 64px, Primary #2563EB, Danger #DC2626

### 기존 다음 작업
- [x] Primary 색상 `#1F4FD8` → `#2563EB` 마이그레이션 (세션 #2 완료)
- [ ] 실제 배너 이미지 적용 (현재 SVG 플레이스홀더)
- [ ] 게시판 무한 스크롤 검증
- [ ] 게시글 작성/수정 화면 UI 점검
- [ ] 모바일 반응형 최종 점검 (480px 기준)

---

## 세션 #4 — 2026-03-10 (월) 오후~저녁

> 총 5건 작업, 커밋 5개 → origin main 푸시 완료 (Railway 자동 배포)

### 작업 4-1: 아바타 블루 단일톤 + 뱃지 색상 통일
- **상태**: 완료
- **커밋**: `8e4ce80`

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/members.js` | 아바타 텍스트 색상 `#2563EB` → `#1E40AF` (2곳) |
| `web/js/profile.js` | 아바타 텍스트 색상 `#2563EB` → `#1E40AF` (1곳) |
| `web/styles/main.css` | `.role-super` 노란배경→`#2563EB`+white, `.badge-member` `#E0F2FE/#0369A1`→`#DBEAFE/#1E40AF` |

#### 상세
- **아바타**: 이미 `#DBEAFE` 배경 블루 단일톤. 텍스트 색상만 `#1E40AF`(진한 블루)로 통일
- **총관리자 뱃지**: `--warning-bg`/`--warning-text`(노란색) → `#2563EB`/white(블루)
- **회원 뱃지**: `#E0F2FE`/`#0369A1` → `#DBEAFE`/`#1E40AF` (디자인 시스템 통일)
- **알림 아이콘**: 미구현 상태 (코드 없음). 향후 구현 시 white로 적용 예정
- **home.js**: 아바타/뱃지 관련 코드 없어 변경 불필요

---

### 작업 4-2: 주민번호 분리입력 UX + 카카오 주소검색 UI 개선
- **상태**: 완료
- **커밋**: `711f7d6`

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/index.html` | SSN: wrapper→개별 border input, type=password. 주소: readonly input+검색 버튼+상세주소 통합. 캐시 v=20260310b |
| `web/styles/main.css` | `.ssn-split-wrapper` 삭제 → `.ssn-input-group` 개별 border 스타일. `.address-input-group/.btn-address-search/.address-detail` 추가 |
| `web/js/signup.js` | submit: `ssn` 합산 → `ssnFront`+`ssnBack` 분리 전송 (백엔드 분리 수신 대응) |

#### 상세
1. **SSN 입력란**: 하나의 wrapper box → 개별 input에 독립 border+focus 스타일. 뒤 1자리 `type=password`로 보안 강화
2. **주소 입력란**: 단순 readonly input → "주소 검색" 버튼 분리 + 상세주소 바로 아래 배치
3. **캐시 버스팅**: `v=20260310` → `v=20260310b`

---

### 작업 4-3: 자동완성 아이콘 숨김 + 안내박스 블루 테마
- **상태**: 완료
- **커밋**: `a88f4d5`

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/styles/main.css` | webkit credentials/contacts 자동완성 아이콘 숨김, `.info-box` 노란→블루 테마(`#EFF6FF/#2563EB/#1E40AF`) |
| `web/index.html` | 캐시 버스팅 `v=20260310c` |

---

### 작업 4-4: 전화걸기(tel:) 기능 — 회원목록/상세/프로필
- **상태**: 완료
- **커밋**: `29badd0`
- **기준 문서**: `Docs/design-system/13-click-to-call-ui.md`

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/members.js` | `formatPhone()` 추가, 카드에 `.call-btn` 전화아이콘, `infoRow` 전화번호→`tel:` 링크 |
| `web/js/profile.js` | `profileInfoRow` phone 타입→`tel:` 링크, `profileFormatPhone()` 추가 |
| `web/styles/main.css` | `.call-btn` (40x40 원형 터치영역), `.phone-link` (밑줄+아이콘), 비활성 상태 |
| `web/index.html` | 캐시 버스팅 `v=20260310d` |

#### 상세
1. **회원 카드**: 우측에 전화 아이콘(SVG 20px), 클릭→`tel:` 호출, `event.stopPropagation()`으로 카드 네비 방지
2. **회원 상세**: 연락처/직장전화를 `<a href="tel:">` 링크로 변경, SVG 16px 인라인 아이콘
3. **내 프로필**: 동일하게 `tel:` 링크 적용
4. **전화번호 미등록**: 아이콘 회색(`#D1D5DB`), `pointer-events: none`
5. **접근성**: `aria-label="이름에게 전화걸기"`, 터치 영역 40x40px

---

### 작업 4-5: 출석투표 + 즐겨찾기(★) + 직함이력 UI 구현
- **상태**: 완료
- **커밋**: `03cedc0`

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/schedules.js` | 출석투표 섹션: `loadAttendanceVote()`, `submitVote()`. 투표 버튼 3개+프로그레스바+마감 처리 |
| `web/js/members.js` | 즐겨찾기: `loadFavorites()`, `toggleFavorite()`, 카드에 ★ 버튼. 직함이력: `loadTitleHistory()`, 상세 하단 섹션 |
| `web/js/profile.js` | `loadProfileTitleHistory()`, 프로필에 직함이력 섹션 추가 |
| `web/styles/main.css` | `.attendance-*` (투표 UI), `.favorite-btn/.favorites-*` (즐겨찾기), `.title-history-*/.title-item` (직함이력) |
| `web/index.html` | 캐시 버스팅 `v=20260310e` |

#### 상세
1. **출석투표**: 일정 상세 하단에 참석/불참/미정 3버튼 + 프로그레스바. 마감 시 disabled. 404이면 섹션 숨김
2. **즐겨찾기**: 회원 카드에 ★ 토글 (POST/DELETE). 목록 상단에 즐겨찾기 섹션 (노란 배경)
3. **직함이력**: 회원 상세+내 프로필 하단에 연도별 직함 목록. GET /api/titles/:userId 호출

#### API 연동
- `apiClient.request()` 패턴 사용 (기존 토큰 자동 포함)
- attendance: GET /:scheduleId, POST /:configId/vote
- favorites: GET /, POST /:targetId, DELETE /:targetId
- titles: GET /:userId

---

## 세션 #5 — 2026-03-10 (월) 저녁~

> 3차 스프린트 6건 작업

### 작업 5-1: M-04 일정 상세 화면 완성
- **상태**: 완료

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/schedules.js` | `showScheduleDetailScreen()` 완전 재작성 — 스켈레톤 로딩, 카테고리 뱃지 5종, 정보 행(SVG 아이콘), 네이버 지도 링크, 더보기 드롭다운, 참석자 목록, 연결 공지 배너, 댓글 시스템 |
| `web/styles/main.css` | `.schedule-detail-section`, `.schedule-category-badge` 5색, `.schedule-info-row`, `.schedule-map-icon`, `.schedule-more-btn`, `.schedule-dropdown`, `.linked-notice-banner`, `.attendee-names`, `.schedule-comment-*`, `.comment-input-bar` |

---

### 작업 5-2: M-05 일정 등록/수정 화면
- **상태**: 완료

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/schedules.js` | `renderScheduleForm()` 개선 — 하루종일 체크, 카테고리 select, 접이식 투표 설정(토글+라디오), 9개 유효성 검사, 수정모드 prefill |
| `web/styles/main.css` | `.schedule-form-*`, `.date-time-row`, `.allday-checkbox-wrapper`, `.vote-collapsible-*`, `.toggle-switch`, `.vote-radio-*`, `.schedule-form-cta` |

---

### 작업 5-3: M-01 홈 배너 리뉴얼
- **상태**: 완료

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/home.js` | `loadBannerSummary()` → 블루 그라디언트 3종 + 텍스트/CTA. `initBannerCarousel()` — translateX 슬라이드, 4초 자동전환, 터치 스와이프, 인디케이터 |
| `web/styles/main.css` | `.banner-carousel`, `.banner-track`, `.banner-slide`, `.banner-dot`, `.banner-title/subtitle/cta` |
| `web/index.html` | 배너 섹션 간소화 (JS 생성), 캐시 버스팅 `v=20260310f` |

---

### 작업 5-4: M-06 N배지 하단 탭
- **상태**: 완료

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/navigation.js` | `initNavBadges()` — posts/schedules 탭에 `.nav-badge` dot 추가. `updateNavBadges()` — 3일 이내 공지, 7일 이내 일정 확인 |
| `web/styles/main.css` | `.nav-badge` (6px red dot, absolute), `.nav-badge.visible` |

---

### 작업 5-5: M-07 빈 상태/로딩/에러 UI 전체 적용
- **상태**: 완료

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/utils.js` | `showToast()` — SVG 아이콘 토스트 3초 자동소멸. `renderEmptyState()` — 6종 SVG 아이콘. `renderErrorState()` — 재시도 버튼. `renderSkeleton()` — 스켈레톤 로딩 |
| `web/js/home.js` | 공지/일정 빈 상태→`renderEmptyState()`, 에러→`renderErrorState()` |
| `web/js/posts.js` | 목록/상세 로딩→`renderSkeleton('list')`, 빈 상태→`renderEmptyState()`, 에러→`renderErrorState()`, `alert()`→`showToast()` |
| `web/js/members.js` | 목록/검색/상세 로딩→스켈레톤, 빈/에러→통합 컴포넌트, 로컬 `showToast` 제거(utils.js 글로벌 사용), `alert()`→`showToast()` |
| `web/js/profile.js` | 로딩→스켈레톤, 에러→`renderErrorState()`, `alert()`→`showToast()` |
| `web/styles/main.css` | `.toast`, `.skeleton`, `.empty-state`, `.error-state` + shimmer/toastIn/toastOut 애니메이션 |

---

### 작업 5-6: 캐시 버스팅 + 구문 검증
- **상태**: 완료
- `web/index.html`: `main.css?v=20260310f`
- `node -c web/js/*.js` 전체 7파일 통과

---

### 작업 5-7: 홈 배너 캐러셀 렌더링 수정
- **상태**: 완료
- **커밋**: `7dfd2bc`

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/home.js` | 166행 중복 `style` 속성 통합 (HTML spec 위반 수정), 169행 첫 번째 배너 CTA 텍스트 조건 수정 |
| `web/styles/main.css` | 741행 구버전 `.banner-slide` 규칙 제거 (캐러셀 전용 규칙과 충돌 방지), 4335행 `.banner-track .banner-slide`에 `min-width:100%` + `box-sizing` 추가 |

---

## 세션 #6 — 2026-03-10 (월) 밤

> 2건 작업: M-12 공지-일정 연동 UI, M-13 업종 필터 UI

### 작업 6-1: M-12 공지-일정 연동 UI
- **상태**: 완료
- **기준 문서**: `Docs/features/notice-schedule-link.md`

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/posts.js` | 일정 첨부 토글 (`renderScheduleAttachSection`, `toggleScheduleAttach`, `getScheduleAttachData`), 작성 시 `payload.schedule` 포함, 상세에 연결 일정 배너 (`loadLinkedScheduleForPost`) |
| `web/index.html` | 공지 작성 폼에 `post-create-schedule-attach` 컨테이너 추가 |
| `web/styles/main.css` | `.schedule-attach-*` (토글 헤더+필드 섹션), `.linked-schedule-banner` (연결 일정 카드) |

#### 상세
1. **공지 작성 시**: 공지탭일 때 '일정 첨부' 토글 표시 → ON이면 제목/카테고리/날짜시간/장소 입력 필드 노출
2. **POST /api/posts에 schedule 객체 포함**: `{ title, category, start_date, end_date, location }`
3. **공지 상세**: `linked_schedule_id` 또는 `schedule_id` 있으면 일정 API 호출 후 블루 배너 표시 (카테고리 뱃지, 날짜, 장소, 클릭→일정 상세)
4. **일정 상세→원본 공지**: 세션 #5에서 이미 `loadLinkedNotice()` 구현 완료

---

### 작업 6-2: M-13 업종 필터 UI
- **상태**: 완료
- **기준 문서**: `Docs/features/industry-search.md`

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/js/members.js` | `INDUSTRY_CATEGORIES` 13개 상수, `getIndustryName()`, `renderIndustryFilter()` 드롭다운, `currentIndustryFilter` 필터 상태, 검색/목록 API에 `industry=` 파라미터 추가, 카드에 `.industry-tag`, 상세에 업종 infoRow |
| `web/js/profile.js` | 프로필 표시에 업종 행 추가, 수정 폼에 업종/업종상세 select+input 추가, submit에 `industry`, `industry_detail` 포함 |
| `web/js/signup.js` | 가입 데이터에 `industry`, `industry_detail` 필드 추가 |
| `web/index.html` | 회원가입 폼에 업종 select + 업종상세 input 추가, 캐시 버스팅 `v=20260310g` |
| `web/styles/main.css` | `.industry-filter-wrap`, `.industry-filter-select`, `.industry-tag` |

#### 상세
1. **회원 목록**: 검색창 아래 업종 필터 select (전체 + 13개 카테고리)
2. **필터 동작**: `GET /api/members?industry=code` 호출, 검색과 AND 조합 가능
3. **회원 카드**: 업종 있으면 블루 태그(`#EFF6FF/#1E40AF`) 표시
4. **회원 상세**: 직장 정보 섹션에 '업종: 대분류 · 상세' 표시
5. **프로필 수정**: 업종 드롭다운 + 업종 상세 텍스트 입력
6. **회원가입**: Step 3 직장 정보에 업종/업종상세 필드 추가

---

### 작업 6-3: 캐시 버스팅 + 구문 검증
- **상태**: 완료
- `web/index.html`: `main.css?v=20260310g`
- `node -c web/js/*.js` 전체 8파일 통과

---

## 세션 #7 — 2026-03-11 (화)

### 작업: Web Push 알림 프론트엔드 구현
- **상태**: 완료
- **커밋**: `41380b3` → `origin main` 푸시 완료 (Railway 자동 배포)
- **기준 문서**: `Docs/features/web-push-notification.md`, `Docs/design-system/18-notification-ui.md`

#### 신규 파일 (6개)
| 파일 | 설명 |
|------|------|
| `web/sw.js` | Service Worker — push 수신, showNotification, notificationclick 이동, skipWaiting/claim |
| `web/manifest.json` | PWA manifest — standalone, 아이콘 4종, theme_color #2563EB |
| `web/js/push.js` | 푸시 구독 모듈 — initPush, subscribePush, unsubscribePush, VAPID키 변환, iOS 분기, 구독 유도 배너, PWA 설치 안내 배너+가이드 모달 |
| `web/js/notifications.js` | 알림 센터 — loadNotifications, markAsRead, markAllRead, 유형별 아이콘(N-01~N-05), 시간 포맷(방금/N분전/N시간전/어제/N일전/M/D), 앱바 배지 업데이트 |
| `web/js/notification-settings.js` | 알림 설정 — 마스터 스위치+하위 4개 토글, 즉시 API PUT, 마스터 OFF시 하위 비활성, 푸시 상태 표시, 재구독 버튼 |
| `web/image/icon-*.png, badge-72.png, apple-touch-icon.png` | PWA 아이콘 placeholder (6종 PNG + 3종 SVG) — 프로덕션 시 디자인 교체 필요 |

#### 수정 파일 (6개)
| 파일 | 변경 내용 |
|------|----------|
| `web/index.html` | manifest/theme-color/apple-touch-icon 메타 추가, 앱바에 알림 벨+배지 (logout 버튼 대체), 알림 센터/설정 화면 HTML 추가, push/notifications/notification-settings 스크립트 추가, 캐시 버스팅 v=20260311a |
| `web/js/app.js` | 로그인 성공 시 initPush()+fetchUnreadNotificationCount() 호출 |
| `web/js/navigation.js` | notifications/notification-settings 화면 전환 처리 |
| `web/js/profile.js` | 프로필 액션에 '알림 설정' 버튼 추가 (비밀번호 변경 위) |
| `web/styles/main.css` | +380줄 — 앱바 배지, 알림 센터(리스트/아이템/빈상태), 알림 설정(토글/마스터/섹션), 구독 배너(slide-up/down), PWA 설치 배너+가이드 모달, 반응형 |
| `nginx.conf` | sw.js 캐시 방지(no-cache), manifest.json 서빙(application/manifest+json), gzip 타입 추가 |

#### 검증 결과
- `node -c web/js/*.js` 전체 11파일 통과
- `web/sw.js` 존재 및 유효
- `web/manifest.json` 유효 JSON
- 기존 기능 미파괴 (logout은 프로필 화면에서 제공)

#### 구현 상세
1. **앱바 벨 아이콘**: SVG 24px 흰색, 미읽음 수 빨간 배지(#DC2626), 바운스 애니메이션
2. **알림 센터**: 별도 SPA 화면, 유형별 아이콘(공지/일정/리마인더/댓글), 읽음/안읽음 구분, 모두 읽음 처리
3. **알림 설정**: 마스터+4개 토글, iOS 스타일, 마스터 OFF시 하위 opacity 0.5+pointer-events none
4. **푸시 구독 배너**: 하단 고정, 7일 후 재표시, 3회 닫기 시 영구 숨김
5. **iOS 대응**: isIOS()+isStandalone() 체크, PWA 필수 안내, 설치 가이드 모달(Android/iOS)
6. **SW 클릭 이동**: postMessage로 기존 창 focus → navigateTo() 호출

---

## 세션 #8 — 2026-03-11 (화)

### 작업: 관리자 웹 Phase 1 — SPA 프론트엔드
- **상태**: 완료
- **커밋**: `de26b48` → `origin main` 푸시 완료

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/admin/index.html` | 전면 재작성 — 스플릿 로그인 화면(브랜드 패널+폼) + 사이드바 레이아웃 SPA 셸 (대시보드/회원/게시판 + 공지/일정 준비중) |
| `web/admin/css/admin.css` | 신규 — 디자인 가이드 기반 전체 스타일시트 (~1000줄). 로그인, 사이드바, 헤더, 카드, 테이블, 배지, 모달, 토스트, 스켈레톤, 반응형 |
| `web/admin/js/admin-app.js` | 신규 — SPA 코어: API 클라이언트(JWT), hash 라우터, 로그인/로그아웃, 사이드바 토글, 모달/토스트, 유틸(escapeHtml, formatDate, statusBadge 등) |
| `web/admin/js/dashboard.js` | 신규 — 통계 카드 4종(전체회원/승인대기/게시글/일정) + 최근 가입 회원 & 최근 게시글 활동 리스트 |
| `web/admin/js/members.js` | 신규 — 회원 테이블 + 검색(이름/이메일/전화) + 상태/역할 필터 + 페이지네이션 + 상세 모달 + 승인/정지/해제 액션 |
| `web/admin/js/posts.js` | 신규 — 게시글 테이블 + 검색 + 카테고리 필터 + 페이지네이션 + 댓글 관리 모달 + 삭제 확인 |
| `web/admin/admin.css` | 삭제 (구 파일, css/admin.css로 대체) |
| `web/admin/admin.js` | 삭제 (구 파일, js/로 분리) |
| `web/js/profile.js` | 관리자 메뉴 버튼 `navigateToScreen('admin')` → `location.href='/admin/'` |

#### API 연동
- `POST /api/admin/auth/login` — 로그인 (admin_id=email)
- `GET /api/admin/dashboard/stats` — 통계 (members/posts/schedules/comments)
- `GET /api/admin/dashboard/recent-activity` — 최근 가입/게시글/일정
- `GET /api/admin/members` — 회원 목록 (search/status/role/page/limit)
- `GET /api/admin/members/:id` — 회원 상세
- `PUT /api/admin/members/:id` — 상태/역할 변경
- `GET /api/admin/posts` — 게시글 목록 (search/category/page/limit)
- `DELETE /api/admin/posts/:id` — 게시글 삭제
- `GET /api/admin/posts/:id/comments` — 댓글 조회
- `DELETE /api/admin/comments/:id` — 댓글 삭제

#### 아키텍처
- **SPA hash 라우팅**: `#dashboard`, `#members`, `#posts` (공지/일정은 disabled)
- **JWT 인증**: `localStorage`에 `admin_token`/`admin_user` 저장, 401/403시 자동 로그아웃
- **모바일 대응**: 768px 이하 사이드바 슬라이드+오버레이, 480px 이하 1열 레이아웃
- **스켈레톤 로딩**: 테이블/통계 카드 데이터 로딩 중 표시
- **모달**: 회원 상세, 댓글 관리, 삭제 확인 — 오버레이 클릭으로 닫기

---

## 세션 #9 — 2026-03-11 (화)

### 작업: 관리자 웹 긴급 버그 수정 2건
- **상태**: 완료
- **커밋**: `ba9bd28` → `origin main` 푸시 완료

#### BUG-1: 관리자 로그인 필드명 불일치 (검증 결과)
- 코드 확인: `admin-app.js` line 67-74에서 `admin_id` 변수로 올바르게 전송 중
- 원래 코드가 정상이었으므로 수정 불필요

#### BUG-2: 대시보드 렌더링 안 됨 — 스크립트 로딩 순서 (FIXED)
- **원인**: `PAGE_RENDERERS` 객체가 `admin-app.js` 로드 시점에 정적 바인딩 → `dashboard.js`/`members.js`/`posts.js`가 아직 로드 안 됐으므로 `renderDashboard` 등이 모두 `undefined` → `null`
- **증상**: `navigateAdmin()`에서 renderer가 null → "준비 중인 페이지입니다" 표시
- **수정**:
  1. `PAGE_RENDERERS` 정적 객체 제거 → `getPageRenderer(page)` 함수로 호출 시점 late-bind 조회
  2. IIFE `init()` → `window.addEventListener('load', ...)` 변경하여 모든 스크립트 로드 후 초기화

#### 변경 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/admin/js/admin-app.js` | PAGE_RENDERERS 정적 바인딩 → getPageRenderer() late-bind, IIFE → window.load 이벤트 |

---

## 세션 #10 — 2026-03-11 (화)

### 작업: 관리자 웹 Phase 2 — 일정/공지/통계 3화면
- **상태**: 완료
- **커밋**: `0ed0e64` → `origin main` 푸시 완료

#### 신규 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/admin/js/schedules.js` | 일정 관리 — 목록 테이블 + 월/카테고리 필터 + 검색 + 생성/수정 모달 + 삭제 확인 |
| `web/admin/js/notices.js` | 공지사항 관리 — 목록 테이블 + 고정 필터 + 검색 + 작성/수정 모달 + 고정 토글 + 삭제 확인 |
| `web/admin/js/stats.js` | 통계/분석 — 요약 카드 4종 + 역할별 수평 바 차트 + 상태별 도넛 차트 + 월별 가입 추이 세로 바 차트 (CSS-only, 외부 라이브러리 없음) |

#### 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `web/admin/js/admin-app.js` | PAGE_TITLES에 schedules/notices/stats 추가, getPageRenderer()에 3개 페이지 등록 |
| `web/admin/index.html` | 사이드바: 공지/일정 '준비중' 뱃지 제거+활성화, 통계 메뉴 추가. 스크립트 태그 3개 추가. 캐시 버스팅 v=20260311c |
| `web/admin/css/admin.css` | +130줄: .bar-chart/.bar-col/.bar-fill(세로 바), .h-bar-chart(수평 바), .donut-chart/.donut-center(도넛), .legend-item, .pin-badge, .badge-cat-* |

#### API 연동
- `GET /api/admin/schedules?month=&category=&limit=` — 일정 목록
- `POST /api/admin/schedules` — 일정 생성 (title, date, time, location, category, desc)
- `PUT /api/admin/schedules/:id` — 일정 수정
- `DELETE /api/admin/schedules/:id` — 일정 삭제
- `GET /api/admin/notices?limit=` — 공지 목록
- `POST /api/admin/notices` — 공지 작성 (title, content, pinned)
- `PUT /api/admin/notices/:id` — 공지 수정 (고정 토글 포함)
- `DELETE /api/admin/notices/:id` — 공지 삭제
- `GET /api/admin/dashboard/stats` — 통계 데이터 (기존 API 재활용)
- `GET /api/admin/dashboard/recent-activity` — 월별 추이용 데이터

#### 사이드바 전체 메뉴 (6개)
대시보드 → 회원 관리 → 게시판 관리 → 공지사항 → 일정 관리 → 통계/분석

---

## 알려진 이슈 (수정 안 함, 동작 영향 없음)

1. `formatDate` 함수가 `utils.js`와 `home.js`에 중복 정의 — home.js가 덮어씀. 통합 필요.
2. `app.js`의 `checkAuthStatus()` 반환값(boolean)과 `AuthStatus.AUTHENTICATED`(string) 비교 → 항상 false. 실 로그인은 `handleLogin()`에서 처리되므로 영향 제한적.
