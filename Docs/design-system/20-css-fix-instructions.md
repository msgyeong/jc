# CSS 전수 감사 결과 + 프론트엔드 수정 지시서

> 작성일: 2026-03-30
> 작성자: 디자이너 에이전트
> 목적: main.css + admin.css + JS 인라인 스타일 전수 감사 → 프론트엔드가 바로 실행할 수 있는 수정 지시서
> 기준 문서: `07-unified-design-guide.md`, `04-design-audit.md`, `10-css-variable-migration.md`

---

## 감사 요약

| 항목 | main.css | admin.css | JS 인라인 | 합계 |
|------|----------|-----------|-----------|------|
| 하드코딩 색상 | **187건** | **32건** | **~200건** | **~419건** |
| 비표준 여백 | 23건 | 8건 | ~50건 | ~81건 |
| 중복 선언 | 14건 | 0건 | - | 14건 |
| 미정의 클래스 | 0건 | 1건 | - | 1건 |
| 인라인 스타일 (JS) | - | - | **419건** | 419건 |

---

## Phase 0: 긴급 수정 — 관리자웹 배너 관리 테이블

### [admin.css] 배너 테이블 액션 버튼 레이아웃

```
현재: .action-btns { display: flex; gap: 6px; }
      — 버튼 4개가 줄바꿈 되거나 넘침

변경:
.action-btns {
    display: flex;
    gap: 4px;
    flex-wrap: nowrap;
    white-space: nowrap;
}
이유: 액션 버튼 4개(수정/삭제/위/아래)를 1행에 배치
```

### [admin.css] 배너 테이블 제목 컬럼 ellipsis

```
현재: 제목이 길면 테이블 전체가 늘어남

추가할 CSS:
.banner-title-cell {
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
이유: 긴 배너 제목이 테이블 레이아웃을 깨뜨리지 않도록
```

### [web/admin/js/banners.js] 테이블 컬럼 너비 조정

```
현재: style="width:50px" (순서), style="width:80px" (이미지), style="width:280px" (제목)
변경: 순서 50px, 이미지 80px, 제목 → 클래스 사용, 상태 80px, 기간 120px, 액션 → width:180px (기존보다 확대)
이유: 액션 버튼 4개를 1행에 넣으려면 최소 180px 필요
```

---

## Phase 1: main.css — :root 변수 누락 추가

현재 `:root`에 없지만 코드에서 필요한 변수들:

```css
:root {
    /* ── 추가 필요 ── */
    --warning-color: #F59E0B;          /* accent-color와 동일하지만 의미 분리 */
    --color-primary: var(--primary-color);  /* 일부 코드에서 --color-primary 참조 */
    --color-error: var(--error-color);
    --color-text-hint: var(--text-hint);
}
```

이유: `schedules.js` 등에서 `var(--color-primary, #2563EB)` 폴백으로 사용 중. 변수 정의 시 폴백 불필요.

---

## Phase 2: main.css — 하드코딩 색상 → 변수 전환

### 2-1. `#2563EB` (Primary) 하드코딩 — 52건

| 라인 | 선택자 | 속성 | 변경 |
|------|--------|------|------|
| 2131 | `.badge-admin` | `background-color: #2563EB` | `var(--primary-color)` |
| 3363 | `.member-role-badge.role-super` | `background: #2563EB` | `var(--primary-color)` |
| 3396 | `.call-btn` | `color: #2563EB` | `var(--primary-color)` |
| 3425 | `.phone-link` | `color: #2563EB` | `var(--primary-color)` |
| 4051 | `.profile-hero` | `background: linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)` | `linear-gradient(135deg, var(--primary-color) 0%, #60A5FA 100%)` |
| 4189 | `.vote-btn.selected.vote-attend` | `border-color: #2563EB` | `var(--primary-color)` |
| 4236 | `.progress-attend` | `background: #2563EB` | `var(--primary-color)` |
| 4510 | `.empty-state-cta` | `background: #2563EB` | `var(--primary-color)` |
| 4572 | `.error-state-retry` | `background: #2563EB` | `var(--primary-color)` |
| 4685 | `.schedule-allday-badge` | `color: #2563EB` | `var(--primary-color)` |
| 4686 | `.schedule-allday-badge` | `background: #EFF6FF` | `var(--primary-light)` |
| 4697 | `.schedule-map-icon` | `background: #EFF6FF` | `var(--primary-light)` |
| 4709 | `.schedule-map-icon svg` | `stroke: #2563EB` | `var(--primary-color)` |
| 4791 | `.attendee-view-all` | `color: #2563EB` | `var(--primary-color)` |
| 4833 | `.schedule-form-input:focus` | `border-color: #2563EB` | `var(--primary-color)` |
| 4856 | `.schedule-form-textarea:focus` | `border-color: #2563EB` | `var(--primary-color)` |
| 4899 | `checkbox accent-color` | `#2563EB` | `var(--primary-color)` |
| 4948 | `.toggle-switch.active` | `background: #2563EB` | `var(--primary-color)` |
| 4982 | `radio accent-color` | `#2563EB` | `var(--primary-color)` |
| 5001 | `.schedule-form-submit` | `background: #2563EB` | `var(--primary-color)` |
| 5418 | 알림 UI | `background: #2563EB` | `var(--primary-color)` |
| 5566 | 알림 UI | `color: #2563EB` | `var(--primary-color)` |
| 5623 | 토글 | `background: #2563EB` | `var(--primary-color)` |
| 5727 | 프로필 | `color: #2563EB` | `var(--primary-color)` |
| 5757 | 프로필 | `background: #2563EB` | `var(--primary-color)` |
| 5837 | 프로필 | `color: #2563EB` | `var(--primary-color)` |
| 5857 | 프로필 | `color: #2563EB` | `var(--primary-color)` |
| 5914 | 프로필 | `color: #2563EB` | `var(--primary-color)` |
| 6519 | 관리자 | `color: #2563EB` | `var(--primary-color)` |
| 6696 | 관리자 | `color: #2563EB` | `var(--primary-color)` |
| 6725 | 관리자 | `border-color: #2563EB` | `var(--primary-color)` |
| 6791 | 관리자 | `background: #2563EB` | `var(--primary-color)` |
| 6850 | 관리자 | `color: #2563EB` | `var(--primary-color)` |
| 6950 | 관리자 | `color: #2563EB` | `var(--primary-color)` |
| 7018 | 관리자 | `border-color: #2563EB` | `var(--primary-color)` |
| 7044 | 관리자 | `background: #2563EB` | `var(--primary-color)` |
| 7194 | 관리자 | `color: #2563EB` | `var(--primary-color)` |
| 8836 | `.cc-avatar` | `color: #2563EB` | `var(--primary-color)` |
| 8851 | `.cc-input:focus` | `border-bottom-color: #2563EB` | `var(--primary-color)` |
| 8853 | `.cc-send-btn` | `background: #2563EB` | `var(--primary-color)` |
| 8868 | `.ac-vote-btn` | `border-color: #2563EB` | `var(--primary-color)` |
| 8875 | `.ac-progress-attend` | `background: #2563EB` | `var(--primary-color)` |
| 8882 | `.ac-group-label.ac-group-attend` | `color: #2563EB` | `var(--primary-color)` |

### 2-2. `#1D4ED8` (Primary Hover/Dark) — 12건

| 라인 | 선택자 | 변경 |
|------|--------|------|
| 2469 | `.btn-address-search:hover` | `var(--primary-hover)` |
| 3369 | `.member-role-badge.role-admin` | `color: var(--primary-hover)` |
| 3410 | `.call-btn:active` | `color: var(--primary-hover)` |
| 3446-3447 | `.phone-link:active` | `color/text-decoration-color: var(--primary-hover)` |
| 4191 | `.vote-btn.selected.vote-attend` | `color: var(--primary-hover)` |
| 4514 | `.empty-state-cta:active` | `background: var(--primary-hover)` |
| 4580 | `.error-state-retry:active` | `background: var(--primary-hover)` |
| 5011 | `.schedule-form-submit:active` | `background: var(--primary-hover)` |
| 5762 | 프로필 | `background: var(--primary-hover)` |
| 8855 | `.cc-send-btn:active` | `background: var(--primary-hover)` |

### 2-3. `#DC2626` (Error/Danger) — 18건

| 라인 | 선택자 | 변경 |
|------|--------|------|
| 4159 | `.attendance-deadline.closed` | `color: var(--error-color)` |
| 4197 | `.vote-btn.selected.vote-absent` | `color: var(--error-color)` |
| 4552 | `.error-state-icon svg` | `stroke: var(--error-color)` |
| 4818 | `.schedule-form-label .required` | `color: var(--error-color)` |
| 4837 | `.schedule-form-input--error` | `border-color: var(--error-color)` |
| 4870 | `.schedule-form-error` | `color: var(--error-color)` |
| 4756 | `.schedule-dropdown-item--danger` | `color: var(--error-color)` |
| 5108 | `.nav-badge` | `background: var(--error-color)` |
| 5338 | 알림 | `background: var(--error-color)` |
| 6761 | 관리자 | `background: var(--error-color)` |
| 7204 | 기타 | `background: var(--error-color)` |
| 7330 | 기타 | `border/color: var(--error-color)` |
| 8526-8528 | 게시판 | `color/border/background: var(--error-color/--error-bg)` |
| 8713 | 클럽 | `background: var(--error-color)` |
| 8844 | `.cc-like-btn.cc-liked` | `color: var(--error-color)` |
| 8845 | `.cc-delete-btn` | `color: var(--error-color)` |
| 8883 | `.ac-group-label.ac-group-absent` | `color: var(--error-color)` |

> **중요**: 현재 `--error-color: #C4532D`인데, 코드에서 `#DC2626`을 직접 사용하는 곳이 18건. **Phase 7에서 `:root`의 `--error-color`를 `#DC2626`으로 변경** 후 이 Phase 진행할 것.

### 2-4. `#EF4444` — 8건

| 라인 | 선택자 | 변경 |
|------|--------|------|
| 4195 | `.vote-btn.selected.vote-absent` | `border-color: var(--error-color)` |
| 4241 | `.progress-absent` | `background: var(--error-color)` |
| 6571 | 관리자 | `background: var(--error-color)` |
| 6655 | 관리자 | `color: var(--error-color)` |
| 8876 | `.ac-progress-absent` | `background: var(--error-color)` |

> 참고: `#EF4444`는 `#DC2626`과 같은 빨강 계열이나 약간 밝음. error-color로 통일.

### 2-5. `#EFF6FF` / `#DBEAFE` (Primary Light/BG) — 24건

| 라인 | 선택자 | 속성 | 변경 |
|------|--------|------|------|
| 2136 | `.badge-member` | `background: #DBEAFE` | `var(--primary-light)` |
| 3405 | `.call-btn:hover` | `background: #EFF6FF` | `var(--primary-light)` |
| 3409 | `.call-btn:active` | `background: #DBEAFE` | `var(--primary-bg)` |
| 4653 | `.badge-event` | `background: #DBEAFE` | `var(--primary-light)` |
| 4705 | `.schedule-map-icon:active` | `background: #DBEAFE` | `var(--primary-bg)` |
| 4761 | `.linked-notice-banner` | `background: #EFF6FF` | `var(--primary-light)` |
| 4771 | `.linked-notice-banner:active` | `background: #DBEAFE` | `var(--primary-bg)` |
| 5177 | `.linked-schedule-banner` | `background: #EFF6FF` | `var(--primary-light)` |
| 5183 | `.linked-schedule-banner:hover` | `background: #DBEAFE` | `var(--primary-bg)` |
| 5250 | `.industry-tag` | `background: #EFF6FF` | `var(--primary-light)` |
| 5406 | 알림 | `background: #EFF6FF` | `var(--primary-light)` |
| 5446 | 알림 | `background: #DBEAFE` | `var(--primary-bg)` |
| 5785 | 프로필 | `background: #EFF6FF` | `var(--primary-light)` |
| 6849 | 관리자 | `background: #EFF6FF` | `var(--primary-light)` |
| 7161 | 미팅 | `background: #DBEAFE` | `var(--primary-light)` |
| 7316 | 포탈 | `border: 2px solid #DBEAFE` | `var(--primary-light)` |
| 7865 | 기타 | `background: #DBEAFE` | `var(--primary-light)` |
| 8357 | 게시판 | `background: #DBEAFE` | `var(--primary-light)` |
| 8836 | `.cc-avatar` | `background: #DBEAFE` | `var(--primary-light)` |

### 2-6. `#D1D5DB` (Border/Disabled) — 14건

| 라인 | 선택자 | 변경 |
|------|--------|------|
| 3419 | `.call-btn--disabled` | `color: var(--text-disabled)` |
| 4480 | `.empty-state-icon` | `color: var(--text-disabled)` |
| 4823 | `.schedule-form-input` | `border: 1px solid var(--border-color)` |
| 4844 | `.schedule-form-textarea` | `border: 1px solid var(--border-color)` |
| 4918 | `.vote-collapsible-header .line` | `background: var(--border-color)` |
| 4943 | `.toggle-switch` | `background: var(--toggle-bg-off)` |
| 5012 | `.schedule-form-submit:disabled` | `background: var(--text-disabled)` |
| 5617 | 토글 | `background: var(--toggle-bg-off)` |
| 6717 | 관리자 | `border: 1px solid var(--border-color)` |
| 7010 | 관리자 | `border: 1px solid var(--border-color)` |
| 7079 | 퍼미션 | `background: var(--toggle-bg-off)` |
| 7293 | 기타 | `border: 1px solid var(--border-color)` |
| 8772 | 클럽 | `border: 2px dashed var(--text-disabled)` |
| 8854 | `.cc-send-btn:disabled` | `background: var(--text-disabled)` |

### 2-7. `#6B7280` (Text Hint) — 8건

| 라인 | 선택자 | 변경 |
|------|--------|------|
| 425 | `.signup-avatar-camera` | `background: var(--text-hint)` |
| 4670 | `.schedule-info-row svg` | `stroke: var(--text-hint)` |
| 4926 | `.vote-collapsible-header .arrow` | `stroke: var(--text-hint)` |
| 5515 | 알림 | `color: var(--text-hint)` |

### 2-8. `#1E40AF` (Primary 진한 변형) — 10건

| 라인 | 선택자 | 변경 |
|------|--------|------|
| 2137 | `.badge-member` | `color: #1E40AF` → `var(--primary-hover)` |
| 4653 | `.badge-event` | `color: #1E40AF` → `var(--primary-hover)` |
| 4775 | `.linked-notice-text` | `color: #1E40AF` → `var(--primary-hover)` |
| 5251 | `.industry-tag` | `color: #1E40AF` → `var(--primary-hover)` |
| 6131 | 관리자 | `color: #1E293B` → `var(--text-primary)` |
| 6435-6436 | `.position-badge` | `color: #1E40AF` → `var(--primary-hover)` |
| 7161 | 미팅 | `color: #1E40AF` → `var(--primary-hover)` |
| 7170 | 미팅 | `color: #1E40AF` → `var(--primary-hover)` |
| 8785 | 클럽 | `color: #1E40AF` → `var(--primary-hover)` |

### 2-9. 기타 상태 색상 하드코딩

| 라인 | 선택자 | 현재 | 변경 |
|------|--------|------|------|
| 4202 | `.vote-btn.selected.vote-undecided` | `background: #FEF3C7` | `var(--warning-bg)` |
| 4203 | `.vote-btn.selected.vote-undecided` | `color: #D97706` | `var(--warning-text)` |
| 4246 | `.progress-undecided` | `background: #F59E0B` | `var(--accent-color)` |
| 4302 | `.favorites-section` | `background: #FFFBEB` | `var(--warning-bg)` |
| 4304 | `.favorites-section` | `border: 1px solid #FDE68A` | `1px solid var(--accent-color)` |
| 4313 | `.favorites-header` | `color: #92400E` | `var(--warning-text)` |
| 4388 | `.toast--success` | `background: #ECFDF5; color: #065F46` | `var(--success-bg); var(--success-text)` |
| 4389 | `.toast--error` | `background: #FEF2F2; color: #991B1B` | `var(--error-bg); var(--error-text)` |
| 4390 | `.toast--info` | `background: #EFF6FF; color: #1E40AF` | `var(--primary-light); var(--primary-hover)` |
| 4543 | `.error-state-icon` | `background: #FEE2E2` | `var(--error-bg)` |
| 4654 | `.badge-meeting` | `background: #FEF3C7; color: #92400E` | `var(--warning-bg); var(--warning-text)` |
| 4655 | `.badge-training` | `background: #D1FAE5; color: #065F46` | `var(--success-bg); var(--success-text)` |
| 4656 | `.badge-holiday` | `background: #FEE2E2; color: #991B1B` | `var(--error-bg); var(--error-text)` |
| 5677 | 알림 | `background: #10B981` | `var(--success-color)` |
| 5681 | 알림 | `background: #DC2626` | `var(--error-color)` |
| 6322-6325 | 비밀번호 강도 | 각 색상 | 해당 시맨틱 변수 |
| 6404 | `.attendance-count-badge.attend` | `background: #ECFDF5; color: #166534` | `var(--success-bg); var(--success-text)` |
| 6405 | `.attendance-count-badge.absent` | `background: #FEF2F2; color: #991B1B` | `var(--error-bg); var(--error-text)` |
| 6432 | `.position-badge.pos-president` | `background: #FEF3C7; color: #92400E` | `var(--warning-bg); var(--warning-text)` |
| 6437 | `.position-badge.pos-auditor` | `background: #F0FDF4; color: #166534` | `var(--success-bg); var(--success-text)` |
| 6641 | 관리자 | `background: #10B981` | `var(--success-color)` |
| 6746-6750 | 관리자 | `background: #FFFBEB; border: #FDE68A; color: #92400E` | `var(--warning-bg/--accent-color/--warning-text)` |
| 7094 | 퍼미션 토글 | `background: #10B981` | `var(--success-color)` |
| 8784 | 클럽 | `background: #FEF3C7; color: #92400E` | `var(--warning-bg); var(--warning-text)` |

### 2-10. `#FFFFFF` / `#fff` / `white` (배경) — 30건+

흰색은 대부분 적절하나, 다크모드 지원을 위해 다음으로 변경:

```
#FFFFFF, #fff, white (배경용) → var(--background-color)
#FFFFFF, #fff (텍스트 on primary) → 유지 (primary 위 텍스트는 항상 흰색)
```

주요 대상:
- 4803, 4807, 4827, 4848, 4956, 4995 (schedule-form 관련) → `var(--background-color)`
- 5065, 5070, 5093 (배너 텍스트) → 유지 (오버레이 위 흰색)
- 7297, 7383, 7550 등 (일반 배경) → `var(--background-color)`

---

## Phase 3: main.css — 여백 비표준값 수정

디자인 시스템 spacing: `4 / 8 / 12 / 16 / 24 / 32 / 48px`

| 라인 | 선택자 | 현재 | 변경 | 이유 |
|------|--------|------|------|------|
| 162 (admin.css) | `.form-field` | `margin-bottom: 20px` | `16px` | 20px는 비표준. 16px(md)으로 통일 |
| 541 (admin.css) | `.filter-bar` | `margin-bottom: 20px` | `24px` | 20px → 24px(lg) |
| 1198 (admin.css) | `.settings-section` | `margin-bottom: 20px` | `24px` |
| 1319 (admin.css) | `.profile-card` | `margin-bottom: 20px` | `24px` |
| 2676 (main.css) | `.pc-top` | `margin-bottom: 10px` | `12px` | 10px → 12px(sm) |
| 3190 (main.css) | `.schedule-card-top` | `margin-bottom: 6px` | `8px` | 6px → 8px(xs) |
| 3301 (main.css) | `.member-card-v2` | `padding: 12px 14px` | `12px 16px` | 14px → 16px(md) |
| 3305 (main.css) | `.member-card-v2` | `gap: 14px` | `16px` | 14px → 16px(md) |
| 3716 (main.css) | `.profile-action-btn.primary:hover` | `background: #1A43B8` | `var(--primary-hover)` | 비표준 색상값 |
| 4134 (main.css) | `.attendance-section` | `padding: 20px` | `24px` | 20px → 24px(lg) |
| 4810 (main.css) | `.schedule-form-field` | `margin-bottom: 20px` | `24px` | 20px → 24px(lg) |
| 4822 (main.css) | `.schedule-form-input` | `height: 48px` | `var(--input-height)` (44px) | 48px → 44px 통일 |

---

## Phase 4: main.css — 중복 선언 제거

| 선택자 | 첫 번째 선언 | 두 번째(+) 선언 | 처리 |
|--------|-------------|----------------|------|
| `.card-header` | ~1205 | ~3970 | 3970 유지, 1205 제거 |
| `.card-title` | ~1213 | ~3977 | 3977 유지, 1213 제거 |
| `.card-meta` | ~1239 | ~3985 | 3985 유지, 1239 제거 |
| `.card-stats` | ~1252 | ~3993 | 3993 유지, 1252 제거 |
| `.empty-state` | ~1483 | ~4001 → ~4466 | 4466 유지(최종), 나머지 제거 |
| `.empty-state-icon` | ~1489 | ~4008 → ~4476 | 4476 유지, 나머지 제거 |
| `.empty-state-mini` | ~3231 | ~4025 | 4025 유지, 3231 제거 |
| `.content-loading` | ~1161 | ~4105 | 4105 유지, 1161 제거 |
| `.profile-v2` | ~3452 | ~4044 | 4044 유지, 3452 제거 |
| `.profile-hero` | ~3456 | ~4048 | 4048 유지, 3456 제거 |
| `.info-section` | ~3641 | ~4071 | 4071 유지, 3641 제거 |
| `.profile-actions` | ~3687 | ~4080 | 4080 유지, 3687 제거 |
| `.profile-action-btn` | ~3694 | ~4087 | 4087 유지, 3694 제거 |
| `.error-state` | ~4014 | ~4531 | 4531 유지, 4014 제거 |
| `.badge` | ~2107 | ~3927 | 3927 유지(홈 카드용), 2107은 관리자 페이지용으로 `.badge-admin-page` 등으로 분리 |
| `.banner-section` | ~1093 | ~4037 | 4037 유지, 1093 제거 |

> **작업 방법**: 위의 "제거" 대상을 삭제하고, "유지" 대상만 남기면 됨.

---

## Phase 5: admin.css — 하드코딩 색상 → 변수 전환

| 라인 | 선택자 | 현재 | 변경 |
|------|--------|------|------|
| 276 | `.sidebar` | `background: #111827` | `var(--c-text)` |
| 682 | `tbody tr:hover` | `background: #f8faff` | `var(--c-primary-bg)` |
| 718 | `.badge-active` | `background: #dcfce7; color: #15803d` | `var(--c-success-bg); var(--c-success)` |
| 719 | `.badge-success` | `background: #dcfce7; color: #15803d` | `var(--c-success-bg); var(--c-success)` |
| 720 | `.badge-pending` | `background: #fef9c3; color: #a16207` | `var(--c-warning-bg); #a16207` |
| 721 | `.badge-suspended` | `background: #fee2e2; color: #b91c1c` | `var(--c-danger-bg); var(--c-danger)` |
| 863 | `.admin-toast.success` | `background: #059669` | `var(--c-success)` |
| 1180 | `.action-badge.action-warning` | `color: #92400E` | 유지 (admin 전용 경고 텍스트) |
| 1270 | `.toggle-slider` | `background: #D1D5DB` | 유지 (admin 전용 토글) |
| 1290 | `input:checked + .toggle-slider` | `background: #2563EB` | `var(--c-primary)` |
| 1491 | `.dossier-avatar` | `background: #DBEAFE` | `var(--c-primary-light)` |
| 1627 | `.editable-field .edit-input` | `border: 1px solid #2563EB` | `var(--c-primary)` |
| 1662 | `td.editable-cell .cell-input` | `border: 1px solid #2563EB` | `var(--c-primary)` |
| 1681 | `.perm-role-badge.role-super_admin` | `background: #FEE2E2; color: #DC2626` | `var(--c-danger-bg); var(--c-danger)` |
| 1682 | `.perm-role-badge.role-admin` | `background: #DBEAFE; color: #2563EB` | `var(--c-primary-light); var(--c-primary)` |
| 1683 | `.perm-role-badge.role-member` | `background: #F3F4F6; color: #6B7280` | `var(--c-bg); var(--c-text-sub)` |
| 1686-1688 | `.perm-super-notice` | `color: #6B7280; background: #F3F4F6` | `var(--c-text-sub); var(--c-bg)` |
| 1704 | `.permission-card` | `background: #F9FAFB` | `var(--c-bg)` |
| 1709 | `.permission-card:hover` | `background: #F3F4F6` | 유지 |
| 1730 | `.permission-icon.icon-member` | `background: #DBEAFE` | `var(--c-primary-light)` |
| 1731 | `.permission-icon.icon-post` | `background: #FEF3C7` | `var(--c-warning-bg)` |
| 1732 | `.permission-icon.icon-schedule` | `background: #D1FAE5` | `var(--c-success-bg)` |
| 1733 | `.permission-icon.icon-notice` | `background: #EDE9FE` | 신규 변수 필요 또는 유지 |
| 1734 | `.permission-icon.icon-push` | `background: #FEE2E2` | `var(--c-danger-bg)` |
| 1737 | `.permission-name` | `color: #1E293B` | `var(--c-text)` |
| 1738 | `.permission-desc` | `color: #6B7280` | `var(--c-text-sub)` |
| 1756-1773 | `.perm-toggle` | `#D1D5DB, #2563EB` | 시맨틱 변수 |

### admin.css — 미정의 클래스 추가 필요

```css
/* 추가 필요 */
.btn-danger-outline {
    background: transparent;
    color: var(--c-danger);
    border: 1px solid var(--c-danger);
}
.btn-danger-outline:hover:not(:disabled) {
    background: var(--c-danger-bg);
}
```

이유: `web/admin/js/organizations.js`에서 사용하지만 admin.css에 정의 없음.

---

## Phase 6: JS 인라인 스타일 → CSS 클래스 전환

### 6-1. 인라인 스타일 현황

- **web/js/*.js**: 271건
- **web/admin/js/*.js**: 148건
- **합계**: 419건

### 6-2. main.css + admin.css에 추가할 유틸리티 클래스

```css
/* ── 인라인 스타일 대체용 유틸리티 ── */

/* 색상 */
.text-primary-color { color: var(--primary-color); }
.text-error { color: var(--error-color); }
.text-success { color: var(--success-color); }
.bg-primary-light { background: var(--primary-light); }
.bg-error { background: var(--error-bg); }
.bg-success { background: var(--success-bg); }
.bg-warning { background: var(--warning-bg); }
.bg-white { background: var(--background-color); }

/* 여백 */
.mt-4 { margin-top: 4px; }
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.mt-24 { margin-top: 24px; }
.mb-4 { margin-bottom: 4px; }
.mb-8 { margin-bottom: 8px; }
.mb-12 { margin-bottom: 12px; }
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
.p-12 { padding: 12px; }
.p-16 { padding: 16px; }
.p-24 { padding: 24px; }
.py-40 { padding-top: 40px; padding-bottom: 40px; }

/* 레이아웃 */
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-col { display: flex; flex-direction: column; }
.gap-4 { gap: 4px; }
.gap-8 { gap: 8px; }
.gap-12 { gap: 12px; }
.gap-16 { gap: 16px; }

/* 폰트 */
.fs-11 { font-size: 11px; }
.fs-12 { font-size: 12px; }
.fs-13 { font-size: 13px; }
.fs-14 { font-size: 14px; }
.fs-15 { font-size: 15px; }
.fs-16 { font-size: 16px; }
.fw-500 { font-weight: 500; }
.fw-600 { font-weight: 600; }
.fw-700 { font-weight: 700; }
```

### 6-3. 인라인 스타일 전환 가이드 (JS 수정 시 참고)

| 인라인 스타일 패턴 | 빈도 | 대체 방법 |
|-------------------|------|-----------|
| `style="color:#9CA3AF"` | 30+ | `class="text-muted"` |
| `style="color:#6B7280"` | 25+ | `class="text-hint"` |
| `style="color:#DC2626"` | 15+ | `class="text-error"` |
| `style="color:#2563EB"` | 12+ | `class="text-primary-color"` |
| `style="padding:40px 0"` | 8+ | `class="py-40"` |
| `style="text-align:center"` | 15+ | `class="text-center"` |
| `style="margin-top:16px"` | 10+ | `class="mt-16"` |
| `style="font-size:13px;font-weight:600;color:#374151"` | 8+ | `class="fs-13 fw-600 text-primary"` |
| `style="padding:12px;text-align:center;color:#9CA3AF;font-size:13px"` | 6+ | `class="p-12 text-center text-muted fs-13"` |
| `style="width:100%;padding:10px;border:1px solid #D1D5DB..."` | 4+ | 기존 `.form-field input` 또는 신규 `.inline-input` 클래스 |

### 6-4. 가장 심각한 인라인 스타일 (즉시 수정 대상)

#### admin-app.js — 통계 카드 색상 (5건)

```
현재:
  style="background:#ECFDF5;color:#059669"  (성공)
  style="background:#FEF3C7;color:#D97706"  (경고)
  style="background:#EDE9FE;color:#7C3AED"  (보라)
  style="background:#D1FAE5;color:#059669"  (성공2)
  style="background:#FEE2E2;color:#DC2626"  (에러)

변경: .stat-icon.blue/.green/.yellow/.red 처럼 시맨틱 클래스 활용
  class="stat-icon green" → admin.css에 이미 정의됨
```

#### content.js — 전체 레이아웃 인라인 (20건+)

```
현재: 폼 필드, 이미지 표시, 에러 메시지 등이 전부 인라인 style
변경: admin.css의 기존 .form-field, .card-body 등 재활용 + 필요시 신규 클래스 추가
```

#### member-dossier.js — 섹션 제목 인라인 (15건+)

```
현재: style="font-weight:600;font-size:15px;color:#2563EB;border-bottom:..."
변경: .dossier-section-title 클래스가 이미 admin.css에 정의됨 — 이것을 활용
```

---

## Phase 7: `--error-color` 통일 (Phase 2보다 먼저 실행)

현재 `:root`에서 `--error-color: #C4532D`인데, 코드 전체에서 `#DC2626`을 직접 사용하는 곳이 18건+.

**필수 조치:**

```css
/* 변경 전 */
--error-color: #C4532D;
--error-hover: #A3421F;
--error-bg: #FFF7F5;

/* 변경 후 — 07-unified-design-guide.md 기준 */
--error-color: #DC2626;
--error-hover: #B91C1C;
--error-bg: #FEE2E2;
--error-text: #991B1B;
```

다크 모드도 함께 변경:
```css
[data-theme="dark"] {
    --error-color: #F87171;   /* 유지 (이미 맞음) */
    --error-hover: #EF4444;   /* 유지 */
    --error-bg: #2D1B1B;      /* 유지 */
    --error-text: #FCA5A5;    /* 유지 */
}
```

이유: 디자인 가이드(07번)에서 Danger/Error = `#DC2626`으로 명시. 현재 `#C4532D`는 가이드와 불일치.

---

## Phase 8: 하단 네비게이션 이모지 → SVG 전환

현재 상태: **이미 SVG로 전환 완료** ✅

```css
/* main.css 1016~1034 */
.nav-icon svg {
    width: 24px;
    height: 24px;
    stroke: currentColor;
    stroke-width: 1.8;
    fill: none;
}
.nav-item.active .nav-icon svg {
    stroke-width: 2.2;
}
```

- `.nav-item`이 `color: var(--text-hint)` (비활성) / `color: var(--primary-color)` (활성)
- SVG가 `stroke: currentColor`를 상속 → CSS color 변경만으로 아이콘 색상 제어 가능
- **추가 작업 불필요**

---

## 실행 순서 요약

| 순서 | Phase | 위험도 | 작업량 | 설명 |
|------|-------|--------|--------|------|
| 1 | **Phase 0** | 없음 | 소 | 배너 관리 테이블 긴급 수정 |
| 2 | **Phase 7** | 낮음 | 소 | `--error-color` `#DC2626` 통일 |
| 3 | **Phase 1** | 없음 | 소 | :root 누락 변수 추가 |
| 4 | **Phase 4** | 낮음 | 중 | 중복 선언 제거 (main.css 정리) |
| 5 | **Phase 2** | 낮음 | **대** | 하드코딩 색상 → 변수 전환 (187건) |
| 6 | **Phase 3** | 낮음 | 소 | 여백 비표준값 수정 |
| 7 | **Phase 5** | 낮음 | 중 | admin.css 하드코딩 전환 (32건) |
| 8 | **Phase 6** | 중간 | **대** | JS 인라인 스타일 정리 (419건) |

> **참고**: Phase 8 (네비 SVG)은 이미 완료됨 — 추가 작업 불필요.

---

## 검증 체크리스트 (Phase 2, 7 완료 후)

- [ ] 로그인 화면: 버튼 색상, 에러 메시지 색상
- [ ] 홈: 배너, 일정 카드, 공지 카드
- [ ] 게시판: 서브탭, 게시글 카드, N배지
- [ ] 일정: 캘린더 요일 색상, 선택일 배경, 카테고리 배지 5종
- [ ] 회원: 역할 배지, 전화 아이콘, 즐겨찾기 섹션
- [ ] 프로필: 히어로 그라디언트, 액션 버튼 hover
- [ ] 게시글 상세: 좋아요/댓글 색상, 에러 상태 아이콘
- [ ] 토스트 알림: 성공/에러/정보 3종 색상
- [ ] 일정 폼: 입력 필드 포커스, 에러 상태, 투표 버튼
- [ ] 관리자 웹: 대시보드 통계, 회원 테이블, 배너 관리
- [ ] 다크 모드: 색상 변수가 다크 모드에서도 정상 동작하는지

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-30 | 초판 작성 — CSS 전수 감사 + 수정 지시서 |
