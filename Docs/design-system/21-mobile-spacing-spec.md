# 모바일 여백/간격/글씨 크기 규격표

> 작성일: 2026-03-30
> 작성자: 디자이너 에이전트
> 목적: 375×667 뷰포트에서 정보 밀도 최대화. 불필요한 여백 전부 제거.
> 대상: `web/styles/main.css`만 (관리자 웹 admin.css 제외)

---

## 1. 글로벌 규격 (전 화면 공통)

### 1-1. 레이아웃 토큰

| 요소 | 현재값 | 변경값 | CSS 변수/선택자 |
|------|--------|--------|----------------|
| 앱바 높이 | 56px | **48px** | `--appbar-height` (L70) |
| 앱바 좌우 패딩 | 16px | **12px** | `.app-bar` padding (L232) |
| 앱바 제목 | 17px/600 | **16px/600** | `.app-bar-title` (L244) |
| 하단 네비 높이 | 56px | **56px** (유지) | `--nav-height` (L90) — 터치 영역 확보 |
| 화면 좌우 패딩 | 16px | **12px** | `.screen-content` padding (L276) |
| 하단 네비 safe-area 패딩 | 70px | **62px** | `.screen-content.with-bottom-nav` (L1093) |

### 1-2. 타이포그래피 토큰

| 요소 | 현재값 | 변경값 | 근거 |
|------|--------|--------|------|
| 페이지 제목 (h1) | 17px/600 | **16px/600** | 앱바 제목과 동일 |
| 섹션 제목 (h2) | 18px/700 | **15px/600** | 과도하게 굵고 큼 → 섹션 제목은 가볍게 |
| 서브 제목 (h3) | 16px/600 | **14px/600** | 본문과 구분되면 충분 |
| 본문 | 15px/400 | **14px/400** | 모바일 기본 |
| 보조 텍스트 | 13~14px | **12px/400** | 날짜, 메타, 통계 |
| 캡션 | 11~12px | **11px** | 배지, 라벨 |
| 버튼 텍스트 | 15px/600 | **14px/600** | |

**CSS 변경:**
```
L437: .screen h1, .app-bar-title { font-size: 16px; font-weight: 600; }
L438: .screen h2, .section-title { font-size: 15px; font-weight: 600; }
L439: .screen h3, .info-section-title { font-size: 14px; font-weight: 600; }
```

### 1-3. 스페이싱 토큰 (CSS 변수 변경)

| 토큰 | 현재값 | 변경값 | 용도 |
|------|--------|--------|------|
| `--spacing-xs` | 8px | **4px** | 아이콘-텍스트 간격, 최소 여백 |
| `--spacing-sm` | 12px | **8px** | 카드 내부 요소 간격 |
| `--spacing-md` | 16px | **12px** | 섹션 내부 패딩 |
| `--spacing-lg` | 24px | **16px** | 섹션 간 간격 |
| `--spacing-xl` | 32px | **24px** | 페이지 패딩 |

### 1-4. 컴포넌트 기본값

| 요소 | 현재값 | 변경값 | CSS 선택자 |
|------|--------|--------|-----------|
| 카드 패딩 | 14~16px | **10px 12px** | `.card` (L3888) |
| 카드 간 간격 | 10~12px | **6px** | `.card` margin-bottom (L3890) |
| 카드 border-radius | 12px | **8px** | `--border-radius-lg` (L53) |
| 버튼 높이 | 44px | **44px** (유지) | `--input-height` — 터치 최소 |
| 입력 필드 높이 | 44px | **44px** (유지) | `--input-height` |

---

## 2. 화면별 여백 규격

---

### 화면 1: 홈

**목표**: 배너 + 공지 3개 + 일정 3개가 스크롤 없이 한 화면에 보여야 함.

#### [배너 캐러셀]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 배너 높이 | `.banner-carousel` height: 160px (L5018) | **120px** | 375×667에서 배너가 화면 24% 차지 → 18%로 축소 |
| 배너 마진 | `.banner-carousel` margin: 16px 16px 0 (L5018-5019) | **8px 12px 0** | 좌우 16px → 12px, 상단 16px → 8px |
| 배너 내부 패딩 | `.banner-slide` padding: 16px (L5039) | **10px 12px** | 텍스트 영역 축소 |
| 배너 제목 | `.banner-slide .banner-title` 18px/700 (L5069) | **15px/700** | 작은 배너에 맞게 |
| 배너 부제목 | `.banner-slide .banner-subtitle` 13px (L5077) | **11px** | |

#### [홈 콘텐츠]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 홈 콘텐츠 패딩 | `.home-content` padding: var(--spacing-lg) 0 = 24px (L912) | **8px 0** | 배너 아래 즉시 콘텐츠 시작 |
| 섹션 간 간격 | `.content-section` margin-bottom: var(--spacing-xl) = 32px (L1170) | **12px** | 32px는 과도. 12px이면 구분 충분 |
| 섹션 헤더 아래 간격 | `.section-header` margin-bottom: var(--spacing-md) = 16px (L1178) | **6px** | 제목 바로 아래에 카드 시작 |
| 섹션 제목 | `.section-header h2` 18px/700 (L1182) | **15px/600** | 과도하게 큼 |
| "전체보기" 버튼 | `.view-all-btn` padding: var(--spacing-xs) = 8px (L1194) | **4px** | |

#### [홈 일정 카드]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 카드 패딩 | `.home-schedule-card` padding: 12px (L3804) | **8px 10px** | |
| 카드 간 간격 | `.home-schedule-card` margin-bottom: 8px (L3808) | **4px** | |
| 카드 border-radius | `var(--border-radius-lg)` = 12px (L3807) | **8px** | |
| 날짜 박스 크기 | `.home-schedule-date-box` 48×48px (L3822) | **40×40px** | |
| 날짜 박스 숫자 | `.home-schedule-day` 18px/700 (L3832) | **16px/700** | |
| 제목 | `.home-schedule-title` 14px/600 (L3850) | **13px/600** | |
| 메타 | `.home-schedule-meta` 12px (L3863) | **11px** | |

#### [홈 공지 카드]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 카드 패딩 | `.notice-card` padding: 12px (L3886) | **8px 10px** | |
| 카드 간 간격 | `.notice-card` margin-bottom: 8px (L3890) | **4px** | |
| 카드 border-radius | `var(--border-radius-lg)` = 12px (L3889) | **8px** | |
| 제목 | `.notice-title` 14px/600 (L3908) | **13px/600** | |
| 메타 | `.notice-meta` 12px (L3918) | **11px** | |

---

### 화면 2: 게시판

#### [서브탭]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 탭 높이 | `.board-tab` padding: 12px 0 (L2599) | **8px 0** | 48px → 36px 정도로 축소 |
| 탭 글씨 | `.board-tab` 15px/500 (L2603) | **13px/500** | |
| 탭 active 글씨 | `.board-tab.active` 15px/600 (L2614) | **13px/600** | |
| 탭 border-bottom | 3px (L2608) | **2px** | |

#### [게시글 카드 (pc-card)]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 카드 패딩 | `.pc-card` padding: 16px (L2626) | **10px 12px** | |
| 카드 간 간격 | `.pc-card` margin-bottom: 12px (L2627) | **6px** | |
| 카드 border-radius | 12px (L2625) | **8px** | |
| 아바타 크기 | `.pc-avatar` 32px (L2651) | **28px** | |
| 상단 간격 | `.pc-top` gap: 8px, margin-bottom: 12px (L2645-2646) | **gap: 6px, mb: 8px** | |
| 작성자 | `.pc-author` 14px/500 (L2674) | **13px/500** | |
| 시간 | `.pc-time` 12px (L2685) | **11px** | |
| 제목 | `.pc-title` 16px/600 (L2728) | **14px/600** | 과도하게 큼 |
| 미리보기 | `.pc-preview` 14px (L2739) | **13px** | |
| 썸네일 | `.pc-thumb` 60×60px (L2751) | **52×52px** | |
| 본문↔통계 간격 | `.pc-body` margin-bottom: 12px (L2711) | **8px** | |
| 통계 | `.pc-stats` gap: 14px (L2767) | **10px** | |
| 통계 글씨 | `.pc-stat` 13px (L2771) | **12px** | |

#### [FAB]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| FAB 크기 | `.fab` 56×56px (L1419-1420) | **48×48px** | 화면 가림 최소화 |
| FAB 위치 | `.fab` bottom: 90px (L1417) | **72px** | 네비 바로 위 |
| FAB 글씨 | `.fab` 28px (L1425) | **24px** | |

#### [게시글 리스트 패딩]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 리스트 패딩 | `.post-list` padding: var(--spacing-md) = 16px (L3882) | **8px 12px** | |

---

### 화면 3: 게시글 상세

| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 상세 패딩 | `.post-detail` padding: 0, padding-bottom: 70px (L1471-1472) | **0 0 62px** (네비 높이 맞춤) |
| 작성자 영역 간격 | `.post-detail-header` gap: var(--spacing-sm)=12px, mb: var(--spacing-md)=16px (L1479-1480) | **gap: 8px, mb: 10px** |
| 아바타 크기 | `.author-avatar` 40px (L1494) | **36px** | |
| 제목 | `.post-detail-title` 20px/700 (L1534) | **17px/700** | 과도하게 큼 |
| 제목 아래 간격 | margin-bottom: var(--spacing-md)=16px (L1536) | **10px** | |
| 본문 아래 간격 | `.post-detail-body` margin-bottom: var(--spacing-lg)=24px (L1543) | **12px** | |
| 메타 영역 | `.post-detail-meta` gap: 20px, padding: 12px 0 (L1641,1645) | **gap: 12px, padding: 8px 0** | |
| 메타 글씨 | `.post-detail-meta` 14px (L1643) | **13px** | |
| 댓글 제목 | `.post-detail-comments h4` 16px (L1688) | **14px** | |

---

### 화면 4: 일정 (캘린더)

| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 캘린더 패딩 | `.calendar-container` padding: 16px (L2997) | **8px 12px** | |
| 헤더 아래 간격 | `.calendar-header` margin-bottom: 16px (L3005) | **8px** | |
| 월 제목 | `.calendar-title` 17px/700 (L3009-3010) | **15px/600** | |
| 네비 버튼 | `.calendar-nav-btn` 36×36px (L3016) | **32×32px** | |
| 요일 헤더 아래 | `.calendar-weekdays` margin-bottom: 8px (L3038) | **4px** | |
| 요일 글씨 | `.cal-weekday` 12px/600 (L3043-3044) | **11px/600** | |
| 날짜 셀 radius | `.cal-day` border-radius: 10px (L3064) | **8px** | |
| 날짜 숫자 | `.cal-day-num` 14px/500 (L3084-3085) | **13px/500** | |
| 선택일 헤더 | `.schedule-day-header` padding: 12px 16px 4px (L3130) | **8px 12px 2px** | |
| 선택일 텍스트 | `.schedule-day-text` 15px/700 (L3135) | **14px/600** | |

#### [일정 카드 V2]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 카드 마진 | `.schedule-card-v2` margin: 8px 16px (L3143) | **4px 12px** | |
| 카드 패딩 | `.schedule-card-v2` padding: 14px 16px (L3144) | **10px 12px** | |
| 카드 radius | `var(--border-radius-lg)` = 12px (L3145) | **8px** | |
| 상단 간격 | `.schedule-card-top` gap: 8px, mb: 8px (L3159-3160) | **gap: 6px, mb: 4px** | |
| 제목 | `.schedule-card-title` 15px/600 (L3177) | **14px/600** | |
| 장소 | `.schedule-card-loc` 13px (L3185) | **12px** | |

---

### 화면 5: 일정 상세

| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 상세 패딩 | `.schedule-detail` padding: 16px 16px 0 (L4532) | **12px 12px 0** | |
| 섹션 패딩 | `.schedule-detail-section` padding: 16px (L4536) | **12px** | |
| 섹션 간 간격 | `.schedule-detail-section` margin-top: 8px (L4537) | **6px** | |
| 섹션 제목 | `.schedule-detail-section-title` 14px/600 (L4541-4542) | **13px/600** | |
| 구분선 아래 | `.schedule-detail-divider` margin-bottom: 12px (L4554) | **8px** | |
| 카테고리 배지 | 12px/600, padding: 4px 12px (L4561-4564) | **11px/600, padding: 2px 8px** | |
| 정보 행 패딩 | `.schedule-info-row` padding: 6px 0 (L4579) | **4px 0** | |
| 정보 첫 행 마진 | `.schedule-info-row:first-of-type` margin-top: 16px (L4581) | **8px** | |
| 정보 텍스트 | `.schedule-info-text` 14px (L4591) | **13px** | |
| 참석 투표 섹션 | `.attendance-section` padding: 24px (L4048) | **12px** | 과도하게 큼 |
| 참석 투표 radius | 12px (L4050) | **8px** | |
| 참석 제목 | `.attendance-title` 16px/700 (L4062-4063) | **14px/600** | |
| 투표 버튼 패딩 | `.vote-btn` padding: 14px 8px (L4090) | **10px 6px** | |
| 투표 버튼 radius | 12px (L4092) | **8px** | |
| 투표 숫자 | `.vote-count` 18px/700 (L4137-4138) | **16px/700** | |
| 참석자 명단 | `.attendee-names` 14px (L4699) | **13px** | |
| "전체보기" | `.attendee-view-all` 13px (L4704) | **12px** | |

---

### 화면 6: 회원

#### [검색바]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 검색 래퍼 패딩 | `.member-search-wrap` padding: 12px 16px 8px (L3206) | **8px 12px 6px** | |
| 검색 박스 radius | `.member-search-box` border-radius: 24px (L3215) | **20px** | |
| 검색 입력 패딩 | `.member-search-box input` padding: 10px 0 (L3237) | **8px 0** | |
| 검색 입력 글씨 | 14px (L3238) | **13px** | |

#### [필터]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 업종 필터 래퍼 | `.industry-filter-wrap` padding: 0 16px 8px (L5141) | **0 12px 4px** | |
| 필터 높이 | `.industry-filter-select` height: 38px (L5145) | **34px** | |
| 필터 글씨 | 13px (L5149) | **12px** | |

#### [회원 카드]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 카드 목록 간격 | `.member-grid` gap: 8px (L3259) | **4px** | |
| 카드 패딩 | `.member-card-v2` padding: 12px 16px (L3265) | **8px 12px** | |
| 카드 radius | `var(--border-radius-lg)` = 12px (L3267) | **8px** | |
| 카드 gap | `.member-card-v2` gap: 16px (L3270) | **10px** | |
| 아바타 크기 | `.member-avatar-v2` 48px (L3281) | **40px** | |
| 아바타 이니셜 | 18px/700 (L3291-3292) | **15px/700** | |
| 이름 | `.member-name-v2` 15px/600 (L3315-3316) | **14px/600** | |
| 직책 | `.member-position-v2` 13px (L3338) | **12px** | |
| 회사 | `.member-company-v2` 12px (L3344) | **11px** | |
| 역할 배지 | `.member-role-badge` 10px (L3321) | 유지 | |
| 전화 버튼 | `.call-btn` 40×40px (L3356) | **36×36px** | 44px 내부 터치 영역 유지 |
| 섹션 헤더 | `.member-section-header` padding: 12px 4px 6px (L4203) | **8px 4px 4px** | |

---

### 화면 7: 프로필

#### [히어로 섹션]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 히어로 패딩 | `.profile-hero` padding: 28px 0 24px (L3965) | **16px 0 12px** | 공간 과도 |
| 히어로 마진 | margin: 0 -16px 20px (L3967) | **0 -12px 10px** | |
| 아바타 크기 | `.profile-avatar-xl` 80×80px (L3422-3423) | **64×64px** | |
| 아바타 아래 간격 | margin-bottom: 12px (L3426) | **8px** | |
| 이름 | `.profile-hero-name` 20px/700 (L3483-3484) | **17px/700** | |
| 역할 배지 | `.profile-hero-role` 13px/600, padding: 3px 12px (L3490-3494) | **12px/600, padding: 2px 8px** | |

#### [정보 섹션]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 섹션 간격 | `.info-section` margin-bottom: 12px (L3987) | **8px** | |
| 섹션 패딩 | `.info-section` padding: 16px (L3990) | **10px 12px** | |
| 섹션 radius | `var(--border-radius-lg)` = 12px (L3989) | **8px** | |
| 섹션 제목 | `.info-section-title` 13px/700 (L3602-3603) | **12px/600** | |
| 제목 아래 간격 | margin-bottom: 12px (L3607) | **8px** | |
| 제목 구분선 패딩 | padding-bottom: 8px (L3608) | **6px** | |
| 정보 행 패딩 | `.info-row` padding: 8px 0 (L3616) | **6px 0** | |
| 라벨 글씨 | `.info-label` 13px (L3625) | **12px** | |
| 값 글씨 | `.info-value` 14px/500 (L3632-3634) | **13px/500** | |

#### [액션 버튼]
| 컴포넌트 | 현재 (CSS 선택자 + 값) | 변경 | 이유 |
|---------|----------------------|------|------|
| 버튼 간격 | `.profile-actions` gap: 8px (L3998) | **6px** | |
| 버튼 패딩 | `.profile-action-btn` padding: 14px (L4008) | **12px** | 44px 터치 유지 |
| 버튼 radius | `var(--border-radius-lg)` = 12px (L4010) | **8px** | |
| 버튼 글씨 | 15px/600 (L4011-4012) | **14px/600** | |

---

## 3. 과도한 값 일괄 점검

### 3-1. padding/margin 20px 이상 → 축소 대상

| 라인 | 선택자 | 현재 | 변경 | 이유 |
|------|--------|------|------|------|
| L878 | `.pending-content` | padding: var(--spacing-xl) = 32px | **16px** | 승인대기 화면 과도한 여백 |
| L887 | `.icon-large` | font-size: 80px, margin-bottom: var(--spacing-lg)=24px | **48px, mb: 12px** | 아이콘 과도 |
| L898 | `.pending-content h2` | 22px/700 | **18px/700** | |
| L921 | `.welcome-section` | margin-bottom: var(--spacing-xl) = 32px | **12px** | 환영 메시지 아래 과도 |
| L925 | `.welcome-section h2` | 22px/700 | **17px/600** | 과도하게 큼 |
| L944 | `.feature-grid` | gap: var(--spacing-md) = 16px | **8px** | |
| L951 | `.feature-card` | padding: var(--spacing-lg) = 24px | **12px** | |
| L964 | `.feature-icon` | 48px, mb: var(--spacing-sm)=12px | **32px, mb: 8px** | |
| L1800 | `.profile-header` | padding: var(--spacing-xl) var(--spacing-md) = 32px 16px | **16px 12px** | |
| L1814 | `.profile-avatar-large` | 120×120, font-size: 48px | **80×80, 36px** | 프로필 구버전이나 사용 시 |
| L1821 | `.profile-name` | 22px/700 | **17px/700** | |
| L4048 | `.attendance-section` | padding: 24px | **12px** | |
| L4386 | `.empty-state` | padding: 48px 24px | **24px 16px** | 빈 상태도 공간 절약 |
| L4451 | `.error-state` | padding: 48px 24px | **24px 16px** | |
| L4517 | `.loading-state` | padding: 48px 16px | **24px 16px** | |
| L4725 | `.schedule-form-field` | margin-bottom: 24px | **16px** | 폼 필드 간 과도 |
| L4807 | `.allday-checkbox-wrapper` | margin-bottom: 20px | **12px** | |
| L5788 | `.dialog-overlay` | padding: 24px | **16px** | |
| L5796 | `.dialog-box` | padding: 24px | **16px** | |
| L6293 | `.legal-overlay` | padding: 24px | **16px** | |
| L6302 | `.legal-modal` | padding: 24px | **16px** | |
| L6587 | `.push-modal-overlay` | padding: 20px | **12px** | |
| L6593 | `.push-modal` | padding: 24px | **16px** | |

### 3-2. font-size 14px+ & font-weight 700 — 제목 아닌데 과도한 곳

| 라인 | 선택자 | 현재 | 변경 | 이유 |
|------|--------|------|------|------|
| L2485 | `.stat-number` | 22px/700 | **18px/700** | 관리자 통계 수치 (모바일 내 관리 화면) |
| L2558 | `.temp-password-display` | 22px/700 | **18px/700** | 비밀번호 표시 |
| L3009 | `.calendar-title` | 17px/700 | **15px/600** | 캘린더 월 제목 — 700은 과도 |
| L3136 | `.schedule-day-text` | 15px/700 | **14px/600** | 선택 날짜 텍스트 |
| L3688 | `.form-card-title` | 18px/700 | **16px/600** | 폼 카드 제목 |
| L4062 | `.attendance-title` | 16px/700 | **14px/600** | 참석 투표 제목 |
| L4248 | `.title-history-section .section-title` | 15px/700 | **14px/600** | 직함 이력 제목 |
| L6600 | `.push-modal-title` | 18px/700 | **16px/600** | 푸시 모달 제목 |

### 3-3. border-radius 12px 이상 카드 → 8px 통일

| 라인 | 선택자 | 현재 | 변경 |
|------|--------|------|------|
| L53 | `--border-radius-lg` | 12px | **8px** ← 이 변수를 바꾸면 아래 전부 적용됨 |
| L2625 | `.pc-card` | 12px | 8px (변수 통해) |
| L4050 | `.attendance-section` | 12px | 8px |
| L4218 | `.favorites-section` | 12px | 8px |
| L4244 | `.title-history-section` | 12px | 8px |
| L4857 | `.toggle-switch` | 12px | 유지 (UI 컴포넌트) |
| L4935 | `.banner-carousel` | 12px | **10px** (배너는 약간 둥글게) |
| L5610 | 알림 카드 | 12px | 8px |
| L6446 | 관리자 카드 | 12px | 8px |
| L6524 | 관리자 카드 | 12px | 8px |
| L6882 | 관리자 카드 | 10px | 8px |

### 3-4. gap 12px 이상 → 필요성 점검

| 라인 | 선택자 | 현재 | 변경 | 판정 |
|------|--------|------|------|------|
| L235 | `.app-bar` | gap: 12px | **8px** | 앱바 아이템 간격 축소 |
| L290 | `.splash-content` | gap: var(--spacing-xl)=32px | **16px** | 스플래시 |
| L390 | `.crop-controls` | gap: 12px | 유지 (모달 내부) |
| L1366 | `.member-card` | gap: var(--spacing-md)=16px | **10px** | 회원 카드 구버전 |
| L2710 | `.pc-body` | gap: 12px | **8px** | 게시글 카드 본문 |
| L3270 | `.member-card-v2` | gap: 16px | **10px** | |
| L3927 | `.card-stats (홈)` | gap: 12px | **8px** | |
| L4080 | `.attendance-vote-buttons` | gap: 10px | **8px** | |
| L4257 | `.title-item` | gap: 12px | **8px** | |
| L5307 | 알림 | gap: 12px | **8px** | |

---

## 4. CSS 변수 변경 요약 (`:root` 일괄 수정)

```css
:root {
    /* ── 변경 ── */
    --appbar-height: 48px;         /* 56→48 */
    --border-radius-lg: 8px;       /* 12→8 */
    --spacing-xs: 4px;             /* 8→4 */
    --spacing-sm: 8px;             /* 12→8 */
    --spacing-md: 12px;            /* 16→12 */
    --spacing-lg: 16px;            /* 24→16 */
    --spacing-xl: 24px;            /* 32→24 */

    /* ── 유지 ── */
    --input-height: 44px;          /* 터치 최소 */
    --nav-height: 56px;            /* 터치 영역 */
    --border-radius: 8px;          /* 이미 8px */
    --radius-sm: 6px;              /* 유지 */
    --radius-md: 8px;              /* 유지 */
}
```

> **주의**: spacing 변수를 줄이면 이 변수를 참조하는 모든 곳이 동시에 바뀜. Phase별로 나눠서 적용 권장.

---

## 5. 실행 순서

| 순서 | 작업 | 위험도 | 영향 범위 |
|------|------|--------|-----------|
| 1 | `:root` 변수 변경 (spacing 5개 + appbar + border-radius-lg) | **높음** | 전체 화면 |
| 2 | 타이포그래피 토큰 변경 (h1/h2/h3) | 중간 | 전체 화면 |
| 3 | 홈 화면 고정값 수정 (배너/카드/섹션) | 낮음 | 홈 |
| 4 | 게시판 카드/탭 수정 | 낮음 | 게시판 |
| 5 | 캘린더/일정 수정 | 낮음 | 일정 |
| 6 | 회원 카드/검색 수정 | 낮음 | 회원 |
| 7 | 프로필 히어로/섹션 수정 | 낮음 | 프로필 |
| 8 | 과도한 padding/margin 일괄 축소 | 중간 | 승인대기/빈상태/에러/모달 |
| 9 | Playwright 375×667 전 화면 검증 | - | - |

---

## 6. 검증 체크리스트

- [ ] 홈: 배너 + 공지 3개 + 일정 3개가 스크롤 없이 보이는지
- [ ] 게시판: 게시글 카드 5개 이상 한 화면에 보이는지
- [ ] 일정: 캘린더 전체 + 선택 날짜 일정 1개 이상 보이는지
- [ ] 회원: 검색바 + 필터 + 회원 카드 5개 이상 보이는지
- [ ] 프로필: 히어로 + 기본정보 섹션이 스크롤 없이 보이는지
- [ ] 터치 타겟: 버튼/입력필드 모두 44px 이상인지
- [ ] 가독성: 본문 14px, 보조 12px이 충분히 읽히는지
- [ ] border-radius: 카드 전부 8px로 통일되었는지

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-30 | 초판 작성 — 모바일 375×667 기준 여백/글씨 규격표 |
