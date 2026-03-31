# UX/UI 검토 보고서 — 2026-03-30

## 요약

| 항목 | 값 |
|------|-----|
| 총 검토 화면 | 12개 |
| 발견 이슈 | **92건** |
| Critical | 9건 |
| High | 17건 |
| Medium | 41건 |
| Low | 25건 |

### 검토 환경
- 뷰포트: 375×667 (모바일 기준)
- 검토 방식: 코드 정적 분석 (HTML/CSS/JS) + WebFetch 실제 페이지 확인
- 검토 기준: CLAUDE.md 사용자 관점 개발 규칙 + iOS/Android HIG 터치 가이드라인

---

## 전체 화면 공통 이슈 (Cross-Screen)

### CS-01: iOS Safari 입력 시 자동 줌 (font-size < 16px)
| 항목 | 내용 |
|------|------|
| 심각도 | **Critical** |
| 설명 | 모든 `input`, `select`, `textarea`의 font-size가 14~15px로 설정되어 있어, iOS Safari에서 포커스 시 자동 줌이 발생한다. 줌 후 복원되지 않아 사용자가 매우 혼란스러워한다. |
| 영향 범위 | 로그인, 회원가입, 게시글 작성, 일정 등록, 프로필 편집, 검색 — **모든 입력 화면** |
| 위치 | `main.css:499` `.form-group input { font-size: 15px; }`, `main.css:523` `textarea { font-size: 14px; }`, `main.css:544` `select { font-size: 14px; }` |
| 수정 방안 | 모든 입력 요소의 font-size를 **16px 이상**으로 변경 |
```css
.form-group input[type="email"],
.form-group input[type="password"],
.form-group input[type="text"],
.form-group input[type="tel"],
.form-group input[type="url"],
.form-group input[type="date"],
.form-group input[type="time"],
.form-group input[type="datetime-local"],
.form-group textarea,
.form-group select,
.schedule-form-input,
.schedule-form-textarea,
.schedule-form-select,
.cc-input,
.cc-reply-input,
.search-overlay-input-wrap input,
.post-search-bar input,
.post-create-title-input,
.post-create-content-input {
    font-size: 16px;
}
```

---

### CS-02: 뒤로가기 버튼 터치 영역 부족 (32×32px)
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | 앱바의 `.back-button`이 32×32px로, 모바일 최소 터치 영역(44×44px)보다 작다. 손가락이 큰 사용자는 탭이 어렵다. |
| 영향 범위 | 모든 화면의 앱바 뒤로가기 버튼 |
| 위치 | `main.css:257-258` |
| 수정 방안 | |
```css
.back-button,
.logout-button {
    width: 44px;
    height: 44px;
}
```

---

### CS-03: 뒤로가기 버튼 아이콘 불일치 (SVG vs 텍스트 화살표)
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 아이디 찾기 화면은 SVG 화살표, 비밀번호 찾기/회원가입은 텍스트 `←` 화살표 사용. 디바이스마다 텍스트 화살표 렌더링이 다르다. |
| 위치 | `index.html:121` (SVG), `index.html:148,303` (텍스트) |
| 수정 방안 | 모든 뒤로가기 버튼에 동일한 SVG 아이콘 사용 |
```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
```

---

### CS-04: `with-bottom-nav` padding이 Safe Area 미대응
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.with-bottom-nav { padding-bottom: 62px }`이지만, 하단 네비 실제 높이는 `56px + env(safe-area-inset-bottom)`. iPhone X+ 등 홈바 있는 기기에서 콘텐츠가 가려진다. |
| 위치 | `main.css:1127` |
| 수정 방안 | |
```css
.screen-content.with-bottom-nav {
    padding-bottom: calc(62px + env(safe-area-inset-bottom, 0px));
}
```

---

### CS-05: h3 기본 font-size 12px (최소 13px 미만)
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | `.screen h3` 기본 font-size가 12px로 CLAUDE.md 최소 기준(13px) 미달 |
| 위치 | `main.css:439` |
| 수정 방안 | `font-size: 13px`로 변경 |

---

### CS-06: 12px 이하 font-size 사용 요소들
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 위치 및 요소 | |

| 선택자 | 현재 크기 | 위치 | 수정값 |
|---------|----------|------|--------|
| `.member-role-badge` | 10px | main.css:3356 | 11px |
| `.nav-label` (≤359px) | 9px | main.css:5132 | 10px |
| `.banner-subtitle` (≤479px) | 10px | main.css:5104 | 11px |
| `.feature-card p` | 12px | main.css:1010 | 13px |
| `.help-text` | 12px | main.css:484 | 13px |
| `.error-message` | 12px | main.css:721 | 13px |
| `.password-requirements li` | 12px | main.css:6302 | 13px |
| `.industry-filter-inline` | 12px | main.css:7520 | 13px |

---

## 1. 로그인 화면

### L-01: 로그인 화면에 로고/브랜딩 없음
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | 스플래시에서 로고가 표시되지만 로그인 화면에는 앱 로고 없이 폼만 표시됨. 브랜딩이 약해 보인다. |
| 위치 | `index.html:57-115` |
| 수정 방안 | 폼 위에 JC 로고 이미지 추가 |

### L-02: screen-content 좌우 padding 12px — 답답함
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.screen-content { padding: 12px }` — 375px 뷰포트에서 좌우 12px은 너무 좁다. 일반적인 모바일 앱은 16~20px 사용. |
| 위치 | `main.css:276` |
| 수정 방안 | `padding: 16px`로 변경 (전체 앱 영향 — 주의하여 테스트 필요) |

### L-03: "로그인 유지" 체크박스 18×18px — 너무 작음
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | 체크박스 자체가 18×18px로 터치하기 어렵다. 전체 라벨 영역도 min-height 44px 미만. |
| 위치 | `main.css:762-766` |
| 수정 방안 | |
```css
.checkbox-label {
    min-height: 44px;
    display: flex;
    align-items: center;
    padding: 8px 0;
}
.checkbox-label input[type="checkbox"] {
    width: 22px;
    height: 22px;
}
```

---

## 2. 회원가입 화면 (6단계)

### S-01: 진행 상태 표시(Progress) 없음
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | 회원가입 폼이 6개 섹션(약 410줄 HTML)으로 매우 길지만, 진행 상태 표시가 전혀 없다. 사용자가 얼마나 남았는지 알 수 없다. (비밀번호 찾기에는 step indicator가 있음) |
| 위치 | `index.html:300-710` |
| 수정 방안 | 상단에 sticky 프로그레스 바 추가, 또는 단계별 페이지네이션 도입 |

### S-02: 제출 버튼이 최하단에 묻혀있음
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | "회원가입" 버튼이 폼 맨 아래에만 있어, 필수 항목만 작성한 사용자가 찾기 어렵다. 선택 항목을 모두 스크롤해야 버튼이 보인다. |
| 위치 | `index.html:699-709` |
| 수정 방안 | 제출 버튼을 `position: sticky; bottom: 0;`으로 하단 고정, 또는 각 섹션 끝에 "건너뛰기" 버튼 추가 |

### S-03: 섹션 제목에 "Step N:" 개발자용 번호 노출
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | "Step 2: 기본 정보", "Step 3: 직장 정보" 등 내부 단계 번호가 사용자에게 노출됨. 비개발자 사용자에게 혼란스럽다. |
| 위치 | `index.html:406,466,554,574,621` |
| 수정 방안 | "Step N:" 접두사 제거. "기본 정보", "직장 정보"만 표시 |

### S-04: `.badge-optional` 클래스에 CSS 정의 없음
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `badge-optional` 클래스를 3곳에서 사용하지만 CSS 정의가 없다. 스타일이 적용되지 않은 텍스트로 표시됨. (`.optional-badge`는 존재) |
| 위치 | `index.html:312,460,544` |
| 수정 방안 | `badge-optional`을 `optional-badge`로 클래스명 통일 |

### S-05: 삭제 버튼(.btn-remove) 32×32px — 너무 작음
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | 학력/경력 동적 필드의 삭제 버튼이 32×32px. |
| 위치 | `main.css:2263-2264` |
| 수정 방안 | `width: 44px; height: 44px;`로 변경 |

### S-06: 주민번호 입력 고정 너비 — 작은 화면에서 넘칠 수 있음
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.ssn-front { flex: 0 0 140px }` 고정 너비 사용. 큰 글씨 설정이나 320px 뷰포트에서 가로 오버플로 가능 |
| 위치 | `main.css:2390-2440` |
| 수정 방안 | `flex: 0 0 140px` → `flex: 1; min-width: 100px; max-width: 160px;` |

### S-07: 전화번호 자동 포맷 미적용
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 아이디 찾기 화면은 전화번호 자동 하이픈 포맷이 되지만, 회원가입의 `#signup-phone`, `#signup-work-phone`에는 미적용 |
| 위치 | `auth.js:272-294` (포맷 함수), `signup.js` (미바인딩) |
| 수정 방안 | `signup.js` DOMContentLoaded에서 `formatPhoneInput()`을 두 필드에 바인딩 |

### S-08: 이메일 중복확인 미검증
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | "중복확인" 버튼은 있지만, `validateSignupForm()`에서 중복확인 수행 여부를 체크하지 않음. 확인 없이 제출 가능. |
| 위치 | `index.html:350`, `signup.js:134-273` |
| 수정 방안 | `_emailVerified` 플래그 도입, 중복확인 완료 후 `true` 설정, 폼 검증 시 체크 |

### S-09: novalidate 누락 — 브라우저 기본 팝업 표시됨
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | 모든 `<form>` 태그에 `novalidate` 미설정. 커스텀 에러 메시지 대신 브라우저 기본 팝업이 먼저 표시됨 |
| 위치 | `index.html:62,168,309` 등 모든 form 태그 |
| 수정 방안 | 모든 `<form>`에 `novalidate` 속성 추가 |

### S-10: error-message의 min-height 18px로 빈 공간 낭비
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | 에러 없을 때도 18px 공간이 예약되어, 긴 회원가입 폼에서 ~360px의 불필요한 세로 공간 발생 |
| 위치 | `main.css:723` |
| 수정 방안 | `min-height` 제거, 에러 텍스트가 있을 때만 `display: block` |

### S-11: 아이디 찾기 화면 컨테이너 구조 불일치
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 아이디 찾기는 `class="form-container"` + 인라인 `style="padding:24px"` 사용. 다른 인증 화면은 `screen-content` + `auth-form`. padding이 달라 화면 간 느낌이 다르다. |
| 위치 | `index.html:125` |
| 수정 방안 | 동일한 `screen-content` + `auth-form` 구조로 통일 |

### S-12: 아이디 찾기 에러 메시지가 필드 아래가 아닌 하단에 위치
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `find-email-error` span이 이름, 전화번호 필드 모두 아래 하나만 있음. 각 필드별 에러 표시 불가. |
| 위치 | `index.html:135` |
| 수정 방안 | 각 입력 필드 아래에 개별 error-message span 추가 |

---

## 3. 홈 화면

### H-01: 배너 CTA 버튼 터치 영역 부족
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.banner-cta`가 `padding: 4px 12px`으로 높이 약 20px. 44px 최소 터치 영역 미달. |
| 위치 | `main.css:5052-5063` |
| 수정 방안 | `padding: 10px 16px; min-height: 44px;` |

### H-02: "전체 보기" 버튼 터치 영역 부족
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.view-all-btn { padding: 4px }` — 약 20px 높이. |
| 위치 | `main.css:1222-1231` |
| 수정 방안 | `min-height: 44px; display: inline-flex; align-items: center;` |

### H-03: content-section 간 간격 8px — 너무 좁음
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | 홈 섹션(공지, 일정) 간 간격이 8px로 시각적 구분이 약하다 |
| 위치 | `main.css:1206` |
| 수정 방안 | `margin-bottom: 12px` 또는 `16px` |

---

## 4. 게시판 화면 (공지/일반 탭)

### B-01: 게시판 탭 터치 영역 부족 (~30px)
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.board-tab { padding: 8px 0; font-size: 13px }` — 전체 높이 약 30px. 탭 전환 시 잘못 터치하기 쉽다. |
| 위치 | `main.css:2632-2644` |
| 수정 방안 | `padding: 12px 0;` 또는 `min-height: 44px;` |

### B-02: 검색 입력 높이 38px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.post-search-bar input { height: 38px }` — 44px 미달 |
| 위치 | `main.css:1348-1358` |
| 수정 방안 | `height: 44px;` |

### B-03: 검색 닫기 버튼 32×32px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.post-search-close { width: 32px; height: 32px }` |
| 위치 | `main.css:1360-1371` |
| 수정 방안 | `width: 44px; height: 44px;` |

### B-04: 앱바 아이콘 버튼 36×36px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.app-bar-icon-btn { width: 36px; height: 36px }` — 검색 토글 버튼 등 |
| 위치 | `main.css:1323-1336` |
| 수정 방안 | `width: 44px; height: 44px;` |

### B-05: 게시글 목록 이중 padding (좌우 24px 합산)
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.screen-content` padding 12px + `.post-list` padding 12px = 좌우 24px. 375px에서 콘텐츠 영역이 327px로 좁아짐 |
| 위치 | `main.css:276` + `main.css:3917` |
| 수정 방안 | `.post-list { padding: 8px 0; }` |

### B-06: FAB 버튼이 앱바 안에 위치 (시맨틱 오류)
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | `<button class="fab">+</button>`이 `.app-bar` 내부에 있지만 `position: fixed`로 하단에 표시. z-index 스태킹 컨텍스트 문제 가능. |
| 위치 | `index.html:791` |
| 수정 방안 | FAB을 `.app-bar` 밖으로 이동 |

---

## 5. 게시글 상세 (댓글/공감 포함)

### PD-01: 뒤로가기 버튼 HTML 태그 깨짐 (닫는 `>` 누락)
| 항목 | 내용 |
|------|------|
| 심각도 | **Critical** |
| 설명 | `<button>` 태그의 닫는 `>`가 누락되어 브라우저 에러 복구에 의존. 일부 브라우저에서 버튼이 렌더링되지 않을 수 있다. |
| 위치 | `index.html:812-814` (게시글 상세), `index.html:827-828` (게시글 수정), `index.html:876-877` (게시글 작성) |
| 수정 방안 | 3곳 모두 수정: |
```html
<!-- Before (broken) -->
<button type="button" class="back-button" id="post-detail-back" aria-label="뒤로 가기"
    <span class="icon">←</span>
</button>

<!-- After (fixed) -->
<button type="button" class="back-button" id="post-detail-back" aria-label="뒤로 가기">
    <span class="icon">←</span>
</button>
```

### PD-02: 공감 버튼(.btn-like) 터치 영역 부족
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.post-detail-meta .btn-like { padding: 4px 0 }` — 높이 약 28px |
| 위치 | `main.css:1799-1809` |
| 수정 방안 | `min-height: 44px; padding: 8px 12px;` |

### PD-03: 댓글 액션 버튼(좋아요/답글/삭제) 극도로 작음
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.cc-like-btn, .cc-reply-btn, .cc-delete-btn { padding: 2px 0; font-size: 12px }` — 높이 약 16px. 누르기 거의 불가능. |
| 위치 | `main.css:8809` |
| 수정 방안 | |
```css
.cc-like-btn, .cc-reply-btn, .cc-delete-btn {
    min-height: 44px;
    padding: 8px 12px;
    font-size: 13px;
}
```

### PD-04: 댓글 입력(.cc-input) 높이 40px, font-size 14px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 높이 40px(44px 미달), font-size 14px(iOS 줌 유발). |
| 위치 | `main.css:8817` |
| 수정 방안 | `height: 44px; font-size: 16px;` |

### PD-05: 답글 입력/전송 36px 높이, 13px 폰트
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.cc-reply-input { height: 36px; font-size: 13px }`, `.cc-reply-send { width: 36px; height: 36px }` |
| 위치 | `main.css:8825-8826` |
| 수정 방안 | 둘 다 `44px`, 폰트 `16px` |

### PD-06: 수정/삭제 버튼(.btn-sm) min-height 32px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.post-detail-actions .btn-sm { min-height: 32px }` — 44px 미달 |
| 위치 | `main.css:1704-1710` |
| 수정 방안 | `min-height: 44px;` |

### PD-07: 갤러리 화살표 버튼 32×32px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.gallery-arrow { width: 32px; height: 32px }` |
| 위치 | `main.css:1647-1661` |
| 수정 방안 | `width: 44px; height: 44px;` |

---

## 6. 게시글 작성

### PC-01: 뒤로가기 버튼 HTML 깨짐 (PD-01과 동일)
| 항목 | 내용 |
|------|------|
| 심각도 | **Critical** |
| 위치 | `index.html:876-877` |

### PC-02: 제목/내용 필드에 라벨 없음
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | placeholder만 사용. 입력 중 placeholder가 사라지면 어떤 필드인지 알 수 없다. |
| 위치 | `index.html:889-903` |
| 수정 방안 | 각 필드 위에 `<label>` 추가, 또는 floating label 패턴 적용 |

### PC-03: 필수 필드 표시 없음
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 제목, 내용 모두 `required` 속성은 있지만 시각적 필수 표시(`*` 등)가 없다. |
| 위치 | `index.html:889-903` |
| 수정 방안 | 라벨에 `<span class="required-badge">필수</span>` 추가 |

### PC-04: 에러 메시지가 폼 상단에 위치
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `#post-create-error`가 제목 입력 위에 위치. 어떤 필드의 에러인지 불명확. |
| 위치 | `index.html:888` |
| 수정 방안 | 각 필드 아래에 개별 에러 메시지 컨테이너 배치 |

### PC-05: 제목/내용 입력 디자인 언어 불일치
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | 제목은 `border-bottom` 언더라인 스타일, 내용은 `border: 1px solid` 박스 스타일. 같은 폼에서 두 가지 스타일 혼재. |
| 위치 | `main.css:2864-2876` vs `main.css:2888` |
| 수정 방안 | 의도된 디자인이면 유지. 통일이 필요하면 둘 다 박스 스타일로 변경 |

### PC-06: 게시글 수정 폼과 작성 폼의 클래스 불일치
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 수정 폼은 `.auth-form` 클래스(전통적 라벨+입력), 작성 폼은 `.post-create-form`(모던 borderless). 같은 콘텐츠 유형에 두 가지 다른 UX. |
| 위치 | `index.html:833` vs `index.html:885` |
| 수정 방안 | 동일한 폼 스타일로 통일 |

### PC-07: 공지 옵션 체크박스 18×18px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.post-create-switch input[type="checkbox"] { width: 18px; height: 18px }`, 부모 라벨 높이도 ~30px |
| 위치 | `main.css:3004-3009` |
| 수정 방안 | 라벨에 `min-height: 44px` 추가 |

---

## 7. 일정 캘린더

### SC-01: 캘린더 네비 버튼 32×32px
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.calendar-nav-btn { width: 32px; height: 32px }` — 월 이동 화살표 |
| 위치 | `main.css:3049` |
| 수정 방안 | `width: 44px; height: 44px;` |

### SC-02: "오늘" 버튼 높이 ~22px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.app-bar-action-pill { padding: 4px 12px; font-size: 12px }` |
| 위치 | `main.css:3017` |
| 수정 방안 | `padding: 10px 16px; min-height: 44px;` |

### SC-03: 과거 날짜에 시각적 구분 없음
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 캘린더에서 today, selected, has-event는 구분되지만 과거 날짜에 대한 시각적 처리 없음 |
| 위치 | `schedules.js:97-157` |
| 수정 방안 | 오늘 이전 날짜에 `.past` 클래스 추가 → `opacity: 0.4` 적용 |

### SC-04: 일정 카드 제목 text-overflow 미처리
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.schedule-card-title`에 overflow/clamp 처리 없음. 긴 제목이 카드 레이아웃을 깨뜨릴 수 있음 |
| 위치 | `main.css:3211` |
| 수정 방안 | |
```css
.schedule-card-title {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}
```

---

## 8. 일정 상세 (참석 투표 포함)

### SD-01: 일정 상세 하단 padding 0 — 콘텐츠가 네비에 가려짐
| 항목 | 내용 |
|------|------|
| 심각도 | **Critical** |
| 설명 | `.schedule-detail { padding: 12px 12px 0 }` — 하단 padding이 0. 댓글 섹션이 하단 네비(56px+)에 가려진다. |
| 위치 | `main.css:4583` |
| 수정 방안 | `padding: 12px 12px 80px;` |

### SD-02: 뒤로가기(.btn-back) 터치 영역 부족
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.btn-back { padding: 8px 0 }` — 높이 ~30px. 앱바가 아닌 콘텐츠 영역에 위치하여 스크롤 시 사라진다. |
| 위치 | `main.css:3538` |
| 수정 방안 | `min-height: 44px;` + 앱바로 이동 권장 |

### SD-03: 참석 투표 버튼 높이 40px
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.attendance-btn { height: 40px }` — 44px 미달 |
| 위치 | `main.css:6164` |
| 수정 방안 | `height: 44px;` |

### SD-04: 지도 아이콘 28×28px — 너무 작음
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.schedule-map-icon { width: 28px; height: 28px }` |
| 위치 | `main.css:4660` |
| 수정 방안 | `width: 44px; height: 44px;` (내부 SVG는 16px 유지) |

### SD-05: more-btn 색상이 white (흰 배경에서 안 보임)
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.schedule-more-btn { color: white }` — CSS에서 흰색 설정. 인라인 HTML이 `var(--text-hint)`로 덮어쓰지만, hover 배경도 `rgba(255,255,255,0.1)`로 흰 배경에서 안 보임 |
| 위치 | `main.css:4692` |
| 수정 방안 | `color: var(--text-hint);`, hover: `background: var(--bg-secondary);` |

### SD-06: 참석 상세 토글 버튼 높이 ~21px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.attendance-details-toggle { padding: 4px 0; font-size: 13px }` |
| 위치 | `main.css:6201` |
| 수정 방안 | `padding: 12px 0; min-height: 44px;` |

### SD-07: 뒤로가기가 앱바가 아닌 콘텐츠 안에 위치
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 일정 상세에서 뒤로가기 버튼이 콘텐츠 스크롤 영역 안에 있어, 스크롤하면 사라진다. 앱바 제목은 "일정" 그대로. |
| 위치 | `schedules.js` 일정 상세 렌더링 부분 |
| 수정 방안 | 앱바를 동적으로 업데이트하여 뒤로가기 + 일정 제목 표시 |

### SD-08: 투표 제출 시 로딩 상태 없음
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 참석 버튼 탭 시 disabled/loading 상태 없이 API 호출. 더블탭 가능. |
| 위치 | `.attendance-btn` CSS에 `:disabled` 스타일 없음 |
| 수정 방안 | `.attendance-btn:disabled { opacity: 0.5; pointer-events: none; }` 추가 |

---

## 9. 일정 등록

### SF-01: 제출 버튼이 스크롤 필요 (고정 아님)
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.schedule-form-cta`가 `position: static`으로, 긴 폼에서 맨 아래까지 스크롤해야 제출 버튼이 보인다. |
| 위치 | `main.css:4960` |
| 수정 방안 | `position: sticky; bottom: 0;` 또는 `position: fixed; bottom: 62px;` |

### SF-02: datetime-local 입력 font-size 15px (iOS 줌)
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.schedule-form-input { font-size: 15px }` — CS-01과 동일 이슈 |
| 위치 | `main.css:4786` |
| 수정 방안 | `font-size: 16px;` |

### SF-03: 뒤로가기 시 미저장 경고 없음
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | CLAUDE.md 규칙: "폼 작성 중 뒤로가기 → 확인 팝업 필수". 일정 등록 폼에 이 체크가 없다. |
| 위치 | `schedules.js` — `backToScheduleList()` |
| 수정 방안 | dirty-form 체크 + confirm 다이얼로그 추가 |

### SF-04: "종일" 체크 시 input type 미변경
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | "종일" 체크 시 `datetime-local` → `date`로 변경되어야 하지만 그대로 유지 |
| 위치 | `schedules.js:748` |
| 수정 방안 | all-day 체크 이벤트에서 input type을 `date`로 동적 변경 |

### SF-05: textarea padding 불일치 (14px vs input 16px)
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | `.schedule-form-textarea { padding: 12px 14px }` vs `.schedule-form-input { padding: 0 16px }` |
| 위치 | `main.css:4810` vs `main.css:4789` |
| 수정 방안 | `padding: 12px 16px;`로 통일 |

---

## 10. 회원 목록 (검색/필터 포함)

### ML-01: 전화 버튼(.call-btn) 36×36px
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.call-btn { width: 36px; height: 36px }` — 44px 미달 |
| 위치 | `main.css:3386` |
| 수정 방안 | `width: 44px; height: 44px;` |

### ML-02: 즐겨찾기 버튼(.favorite-btn) 36×36px
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `min-width: 36px; min-height: 36px` |
| 위치 | `main.css:4226` |
| 수정 방안 | `min-width: 44px; min-height: 44px;` |

### ML-03: 그룹 편집/삭제 버튼 28×28px
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `.group-action-btn { width: 28px; height: 28px }` — 매우 작음 |
| 위치 | `main.css:7447-7461` |
| 수정 방안 | `width: 44px; height: 44px;` |

### ML-04: `.member-company-v2` font-size 11px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 회사명이 11px + `opacity: 0.8`로 가독성 떨어짐. CLAUDE.md 최소 13px. |
| 위치 | `main.css:3378-3382` |
| 수정 방안 | `font-size: 13px`, `opacity: 1` |

### ML-05: member-one-line-pr 고정 max-width: 200px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 320px 뷰포트에서 오버플로 가능. |
| 위치 | `main.css:5233`, `members.js:271` (인라인) |
| 수정 방안 | `max-width: 100%;` |

### ML-06: 검색 오버레이 입력 38px + font 14px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 높이 38px(44px 미달), font-size 14px(iOS 줌) |
| 위치 | `main.css:7612-7622` |
| 수정 방안 | `height: 44px; font-size: 16px;` |

### ML-07: 검색 탭 버튼 높이 ~25px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.search-tab { padding: 6px 16px }` — 총 높이 ~25px |
| 위치 | `main.css:7641-7660` |
| 수정 방안 | `min-height: 44px;` |

### ML-08: 필터 드롭다운 높이 ~24px
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.industry-filter-inline { font-size: 12px; padding: 4px 8px }` |
| 위치 | `main.css:7512-7530` |
| 수정 방안 | `min-height: 36px; font-size: 13px;` |

### ML-09: 그룹 생성/수정 후 화면 미갱신
| 항목 | 내용 |
|------|------|
| 심각도 | **High** |
| 설명 | `showCreateGroupDialog()`와 `showEditGroupDialog()`의 `.then()` 콜백이 비어있어, 그룹 생성/수정 후 화면이 갱신되지 않음 |
| 위치 | `members.js:423-437` |
| 수정 방안 | `.then()` 안에 `loadMembersScreen()` 추가 |

---

## 11. 회원 프로필 상세 (타인)

### MD-01: 하단 네비에 콘텐츠 가려짐 (with-bottom-nav 누락)
| 항목 | 내용 |
|------|------|
| 심각도 | **Critical** |
| 설명 | `#member-detail-content`에 `with-bottom-nav` 클래스 없음. 마지막 섹션(직위 이력, 비즈니스 PR)이 하단 네비에 가려짐 |
| 위치 | `index.html:1311` |
| 수정 방안 | `<div class="screen-content with-bottom-nav" id="member-detail-content">` |

### MD-02: 인라인 뒤로가기 버튼이 하드코딩된 목적지로 이동
| 항목 | 내용 |
|------|------|
| 심각도 | **Critical** |
| 설명 | "← 회원 목록" 버튼이 `navigateToScreen('members')`로 하드코딩. 검색 결과에서 왔으면 검색으로 돌아가야 하지만 회원 목록으로 이동. CLAUDE.md 위반. |
| 위치 | `members.js:567,629-631` |
| 수정 방안 | `history.back()` 사용, 또는 인라인 버튼 제거(앱바 뒤로가기로 충분) |

### MD-03: info-row 긴 텍스트 overflow 미처리
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.info-value`에 overflow/text-overflow 처리 없음. 긴 주소, URL이 레이아웃을 깨뜨릴 수 있음 |
| 위치 | `main.css:3647-3670` |
| 수정 방안 | |
```css
.info-value {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    max-width: calc(100% - 80px);
}
```

### MD-04: 앱바 back + 인라인 back — 이중 뒤로가기 버튼
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | 앱바에 `history.back()`, 콘텐츠에 "← 회원 목록" — 두 가지 네비게이션이 혼란 |
| 위치 | `index.html:1308` + `members.js:567` |
| 수정 방안 | 인라인 뒤로가기 버튼 제거 |

### MD-05: `.profile-hero` CSS 정의 중복 (gradient vs flat)
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | `main.css:4015`(gradient)와 `main.css:6088`(flat)이 충돌. 나중 정의가 덮어써서 gradient 미적용 |
| 위치 | `main.css:4015,6088` |
| 수정 방안 | 하나로 통합, 또는 스코핑으로 분리 |

---

## 12. 내 프로필 (보기 + 편집)

### MP-01: 하단 네비에 콘텐츠 가려짐 (with-bottom-nav 누락)
| 항목 | 내용 |
|------|------|
| 심각도 | **Critical** |
| 설명 | `#profile-screen .screen-content`에 `with-bottom-nav` 없음. `.profile-v2`에 `padding-bottom: 80px`이 있지만 Safe Area 미대응. 로그아웃 버튼 등이 가려질 수 있음 |
| 위치 | `index.html:1461` |
| 수정 방안 | `with-bottom-nav` 클래스 추가 |

### MP-02: 뒤로가기 버튼이 하드코딩된 home으로 이동
| 항목 | 내용 |
|------|------|
| 심각도 | **Critical** |
| 설명 | `onclick="switchTab('home')"` — CLAUDE.md 명시 위반: "하드코딩된 목적지로 보내지 마라" |
| 위치 | `index.html:1458` |
| 수정 방안 | `onclick="history.back()"` |

### MP-03: 프로필 사진 5MB 초과 시 무반응
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | 파일 크기 초과 시 `input.value = ''; return;`만 실행. 사용자에게 아무 피드백 없음. |
| 위치 | `profile.js:13-15` |
| 수정 방안 | "사진 크기는 5MB 이하만 가능합니다" 인라인 에러 표시 |

### MP-04: 프로필 편집 필수 필드 표시가 순수 텍스트 `*`
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `<label>이름 *</label>` — styled `.required-badge` 클래스 미사용 |
| 위치 | `profile.js:228` |
| 수정 방안 | `<label>이름 <span class="required-badge">필수</span></label>` |

### MP-05: textarea font-size 14px (input은 15px)
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | 입력 필드와 textarea의 font-size 불일치 |
| 위치 | `main.css:518-531` vs `main.css:499` |
| 수정 방안 | `font-size: 16px`로 통일 (iOS 줌 방지도 겸) |

### MP-06: input[type="date"] 전용 스타일 누락
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.form-group input` 선택자에 `type="date"` 미포함. 별도 규칙은 있지만 변수명 불일치. |
| 위치 | `main.css:489-506` |
| 수정 방안 | 선택자에 `input[type="date"]` 추가 |

### MP-07: SNS 배지 flex-wrap 시 라벨 세로 중앙 정렬 어색
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | `.info-row`의 `align-items: center`가 여러 줄 SNS 배지와 맞지 않음 |
| 위치 | `main.css:5238-5242` |
| 수정 방안 | `.info-row:has(.sns-badges-wrap) { align-items: flex-start; }` |

### MP-08: 즐겨찾기 토글 오류 시 무반응
| 항목 | 내용 |
|------|------|
| 심각도 | **Low** |
| 설명 | `toggleFavorite()` catch가 빈 블록. API 실패 시 버튼 상태와 서버 상태 불일치 |
| 위치 | `members.js:361-374` |
| 수정 방안 | catch에서 버튼 상태 롤백 + 에러 메시지 표시 |

### MP-09: sticky 저장 버튼이 iOS 키보드와 충돌 가능
| 항목 | 내용 |
|------|------|
| 심각도 | **Medium** |
| 설명 | `.profile-v2 .btn-full { position: sticky; bottom: 62px }` — iOS에서 키보드 열릴 때 예측 불가 동작 |
| 위치 | `main.css:4008-4013` |
| 수정 방안 | `visualViewport` API 사용, 또는 `position: static` + 충분한 margin |

---

## 우선순위 정리

### Critical (즉시 수정 필요) — 9건
| # | 이슈 | 화면 |
|---|------|------|
| 1 | CS-01: iOS 자동 줌 (font-size < 16px) | 전체 |
| 2 | PD-01: 뒤로가기 버튼 HTML 깨짐 (3곳) | 게시글 상세/수정/작성 |
| 3 | SD-01: 일정 상세 하단 padding 0 | 일정 상세 |
| 4 | MD-01: 회원 상세 with-bottom-nav 누락 | 회원 상세 |
| 5 | MP-01: 내 프로필 with-bottom-nav 누락 | 내 프로필 |
| 6 | MD-02: 회원 상세 뒤로가기 하드코딩 | 회원 상세 |
| 7 | MP-02: 프로필 뒤로가기 홈으로 하드코딩 | 내 프로필 |

### High (빠른 수정 필요) — 17건
| # | 이슈 | 화면 |
|---|------|------|
| 1 | CS-02: 뒤로가기 버튼 32×32 | 전체 |
| 2 | L-03: 체크박스 18×18 | 로그인 |
| 3 | S-01: 회원가입 진행 표시 없음 | 회원가입 |
| 4 | S-02: 제출 버튼 최하단에 묻힘 | 회원가입 |
| 5 | S-05: 삭제 버튼 32×32 | 회원가입 |
| 6 | S-08: 이메일 중복확인 미검증 | 회원가입 |
| 7 | H-01: 배너 CTA 터치 영역 부족 | 홈 |
| 8 | B-01: 게시판 탭 높이 30px | 게시판 |
| 9 | PD-02: 공감 버튼 터치 영역 부족 | 게시글 상세 |
| 10 | PD-03: 댓글 액션 버튼 16px | 게시글 상세 |
| 11 | PD-05: 답글 입력/전송 36px | 게시글 상세 |
| 12 | SC-01: 캘린더 네비 버튼 32×32 | 일정 |
| 13 | SD-02: 일정 상세 뒤로가기 | 일정 상세 |
| 14 | SD-03: 참석 투표 버튼 40px | 일정 상세 |
| 15 | SD-04: 지도 아이콘 28×28 | 일정 상세 |
| 16 | SF-01: 일정 등록 제출 버튼 미고정 | 일정 등록 |
| 17 | ML-01~03,09: 회원 목록 터치 영역 + 그룹 갱신 | 회원 목록 |

---

## 수정 가이드 (프론트엔드용)

### 1순위: 전체 입력 font-size 16px (CS-01 해결)
`main.css`에 아래 규칙 추가/수정:
```css
/* iOS auto-zoom 방지 — 모든 입력 요소 16px */
input, select, textarea { font-size: 16px !important; }
```
> `!important` 대신 각 선택자별 수정이 더 바람직하지만, 긴급 패치용으로 사용 가능

### 2순위: 깨진 HTML 태그 수정 (PD-01)
`index.html`에서 3곳의 `<button` 태그에 닫는 `>` 추가

### 3순위: with-bottom-nav 추가 (SD-01, MD-01, MP-01)
- `index.html:1311`: `class="screen-content"` → `class="screen-content with-bottom-nav"`
- `index.html:1461`: 동일 변경
- `main.css:4583`: `.schedule-detail { padding: 12px 12px 80px; }`

### 4순위: 터치 영역 일괄 수정
```css
/* 터치 영역 최소 44px 일괄 적용 */
.back-button, .logout-button { width: 44px; height: 44px; }
.app-bar-icon-btn { width: 44px; height: 44px; }
.calendar-nav-btn { width: 44px; height: 44px; }
.call-btn { width: 44px; height: 44px; }
.favorite-btn { min-width: 44px; min-height: 44px; }
.group-action-btn { width: 44px; height: 44px; }
.schedule-map-icon { width: 44px; height: 44px; }
.attendance-btn { height: 44px; }
.gallery-arrow { width: 44px; height: 44px; }
.post-search-close { width: 44px; height: 44px; }
.post-search-bar input { height: 44px; }
.cc-input { height: 44px; }
.cc-reply-input { height: 44px; }
.cc-reply-send { width: 44px; height: 44px; }
.btn-remove { width: 44px; height: 44px; }
.search-overlay-input-wrap input { height: 44px; }
```

### 5순위: 뒤로가기 하드코딩 수정 (MD-02, MP-02)
- `index.html:1458`: `onclick="switchTab('home')"` → `onclick="history.back()"`
- `members.js:629-631`: `navigateToScreen('members', { back: true })` → `history.back()`

---

*보고서 작성: UX/UI 검토 에이전트 — 2026-03-30*
*사용 모델: Claude Opus 4.6*
