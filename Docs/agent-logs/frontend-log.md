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
- [ ] M-12: 공지-일정 연동 UI → `Docs/vision-roadmap.md` R-07
- [ ] M-13: 업종 검색 UI
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

## 알려진 이슈 (수정 안 함, 동작 영향 없음)

1. `formatDate` 함수가 `utils.js`와 `home.js`에 중복 정의 — home.js가 덮어씀. 통합 필요.
2. `app.js`의 `checkAuthStatus()` 반환값(boolean)과 `AuthStatus.AUTHENTICATED`(string) 비교 → 항상 false. 실 로그인은 `handleLogin()`에서 처리되므로 영향 제한적.
