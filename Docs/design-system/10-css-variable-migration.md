# CSS 하드코딩 색상 → 변수 전환 방안

> 작성일: 2026-03-09
> 작성자: 디자이너 에이전트
> 대상: `web/styles/main.css`
> 목적: 하드코딩된 색상값을 CSS 변수로 전환하여 유지보수성 확보

---

## 1. 전환 대상 목록

`04-design-audit.md`에서 식별한 하드코딩 색상 + 추가 발견 건.

### 1-1. Primary 계열

| # | 위치 (선택자) | 하드코딩 값 | 전환 변수 |
|---|---------------|-------------|-----------|
| P1 | `.btn-primary:hover` | `#1a42b8` | `var(--primary-hover)` |
| P2 | `.btn-primary:hover box-shadow` | `rgba(31, 79, 216, 0.3)` | `rgba(37, 99, 235, 0.3)` — primary RGB 맞춤 |
| P3 | `.btn-secondary:hover` | `#d4dff7` | 제거 → `filter: brightness(0.95)` 또는 별도 변수 |
| P4 | `.link-button:hover` | `#1a42b8` | `var(--primary-hover)` |
| P5 | `.fab box-shadow` | `rgba(31, 79, 216, 0.4)` | `rgba(37, 99, 235, 0.4)` |
| P6 | `.fab:hover box-shadow` | `rgba(31, 79, 216, 0.5)` | `rgba(37, 99, 235, 0.5)` |

### 1-2. 상태 색상 계열

| # | 위치 (선택자) | 하드코딩 값 | 전환 변수 |
|---|---------------|-------------|-----------|
| S1 | `.inline-error-message bg` | `#FEE2E2` | `var(--error-bg)` |
| S2 | `.badge-admin` | `#8B5CF6` | `var(--purple-text)` 또는 신규 `--admin-badge` |
| S3 | `.badge-member` | `#3B82F6` | `var(--primary-color)` |
| S4 | `.badge-pending` | `#9CA3AF` | `var(--text-hint)` |
| S5 | `.btn-remove:hover` | `#b91c1c` | `var(--error-hover)` |
| S6 | `.btn-remove.disabled` | `#d1d5db` | `var(--border-color)` |

### 1-3. 캘린더 색상

| # | 위치 (선택자) | 하드코딩 값 | 전환 변수 |
|---|---------------|-------------|-----------|
| C1 | `.cal-weekday.sat` | `#2563EB` | `var(--saturday-color)` |
| C2 | `.cal-day.sat .cal-day-num` | `#2563EB` | `var(--saturday-color)` |
| C3 | `.data-table tbody tr:hover td` (admin) | `#f8faff` | `var(--primary-bg)` |

### 1-4. 관리자 페이지 (main.css 내)

| # | 위치 (선택자) | 하드코딩 값 | 전환 변수 |
|---|---------------|-------------|-----------|
| A1 | `.stat-card.stat-warning bg` | `#fff8e1` | `var(--warning-bg)` |
| A2 | `.stat-card.stat-warning border` | `#ffe082` | `var(--accent-color)` |
| A3 | `.result-box.success-box bg` | `#e8f5e9` | `var(--success-bg)` |
| A4 | `.result-box.success-box border` | `#a5d6a7` | `var(--success-color)` |
| A5 | `.result-box h3` | `#2e7d32` | `var(--success-text)` |
| A6 | `.temp-password-display border` | `#66bb6a` | `var(--success-color)` |
| A7 | `.temp-password-display color` | `#1b5e20` | `var(--success-text)` |
| A8 | `.btn-copy border` | `#66bb6a` | `var(--success-color)` |
| A9 | `.btn-copy color` | `#2e7d32` | `var(--success-text)` |
| A10 | `.btn-copy:hover bg` | `#c8e6c9` | `var(--success-bg)` |
| A11 | `.result-notice color` | `#666` | `var(--text-secondary)` |

### 1-5. 배지 색상 (role-badge)

| # | 위치 (선택자) | 하드코딩 값 | 전환 변수 |
|---|---------------|-------------|-----------|
| R1 | `.member-role-badge.role-super bg` | `#FEF3C7` | `var(--warning-bg)` |
| R2 | `.member-role-badge.role-super color` | `#92400E` | `var(--warning-text)` |

---

## 2. 중복 선언 정리 대상

| 선택자 | 라인 | 문제 | 해결안 |
|--------|------|------|--------|
| `.app-bar-action` | 2082~2097, 2250~2261 | 두 번 선언, 서로 다른 스타일 | 두 번째 선언(캘린더용)을 `.app-bar-action-pill`로 분리 |
| `.btn-sm` | 299~302, 1538~1541 | 두 번 선언 | 첫 번째 제거 (게시글 폼 쪽), 두 번째 유지 |
| `.content-section` | 704~706, 1488~1490 | 두 번 선언 | 병합 |

---

## 3. 전환 작업 순서 (프론트엔드에게 전달)

### Phase 1: 변수 추가 (위험도: 없음)

`:root`에 신규 변수만 추가. 기존 값은 건드리지 않는다.

```css
:root {
    /* 기존 변수 유지 */

    /* Phase 1: 신규 변수 추가 */
    --primary-hover: #1D4ED8;
    --primary-light: #93C5FD;
    --primary-bg: #EFF6FF;
    --error-hover: #B91C1C;
    --error-bg: #FEE2E2;
    --error-text: #991B1B;
    --success-bg: #ECFDF5;
    --success-text: #065F46;
    --warning-bg: #FEF3C7;
    --warning-text: #92400E;
    --text-hint: #9CA3AF;
    --neutral-bg: #F3F4F6;
    --purple-bg: #F3E8FF;
    --purple-text: #6B21A8;
    --saturday-color: #2563EB;
    --sunday-color: #DC2626;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.10);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.15);
}
```

### Phase 2: 하드코딩 → 변수 전환 (위험도: 낮음)

하드코딩된 색상값을 변수 참조로 교체. 시각적 변화 없음.

작업 목록: 위 1-1 ~ 1-5의 모든 항목.

### Phase 3: Primary 색상 변경 (위험도: 낮음)

```css
--primary-color: #2563EB;  /* #1F4FD8에서 변경 */
--border-color: #D1D5DB;   /* rgba에서 변경 */
```

**이 단계에서 앱바, 버튼 등 Primary 사용 요소의 색상이 미세하게 변경됨.**

### Phase 4: 중복 선언 정리 (위험도: 낮음)

`.app-bar-action`, `.btn-sm`, `.content-section` 중복 해소.

---

## 4. 검증 체크리스트

Phase 3 완료 후 아래 화면에서 시각 확인 필요:

- [ ] 로그인 화면: 버튼 색상
- [ ] 홈: 앱바 배경색
- [ ] 게시판: 서브탭 색상, 게시글 카드
- [ ] 일정: 캘린더 선택일 배경, 오늘 표시
- [ ] 회원: 역할 배지 색상
- [ ] 프로필: 직책 배지, 섹션 밑줄
- [ ] 모든 화면: border 선명도 변화 확인

---

## 5. 장기 개선 제안

### 5-1. admin.css와 main.css 변수명 통일

현재:
- `main.css`: `--primary-color`, `--text-primary`, `--border-color`
- `admin.css`: `--c-primary`, `--c-text`, `--c-border`

두 파일은 **별도 페이지**에서 로드되므로 충돌은 없으나, 네이밍 통일을 장기 목표로 권장.

제안: `--jc-primary`, `--jc-text`, `--jc-border` 등 프로젝트 프리픽스 방식.
단, 현재 시점에서는 불필요한 작업량이므로 **보류**.

### 5-2. 공통 토큰 파일 분리

장기적으로 `web/styles/tokens.css` 파일을 만들어 공통 색상만 분리하고,
`main.css`와 `admin.css` 모두에서 `@import`로 로드하는 구조 검토 가능.

```
web/styles/
├── tokens.css      ← 공통 색상 변수만 (새 파일)
├── main.css        ← 회원 모바일 웹 (tokens.css import)
admin/
├── admin.css       ← 관리자 웹 (tokens.css import)
```

> 현재 시점에서는 **Phase 1~4만 진행**하고, 토큰 분리는 추후 검토.
