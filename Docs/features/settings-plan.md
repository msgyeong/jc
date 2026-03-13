# 환경설정 기획서 (이슈 #9)

> 작성일: 2026-03-13 | 작성자: 기획자 에이전트
> 관련 이슈: GitHub #9
> 우선순위: Should-have

---

## 1. 환경설정 메뉴 구조

```
┌─────────────────────────────────────┐
│  ← 환경설정                         │
├─────────────────────────────────────┤
│                                     │
│  ─── 화면 ──────────────────────── │
│                                     │
│  🌙 다크모드                 [OFF]  │  ← 토글
│  🔤 글꼴 크기               [보통]  │  ← 선택
│                                     │
│  ─── 알림 ──────────────────────── │
│                                     │
│  🔔 알림 설정                  >   │  ← 별도 화면 이동
│                                     │
│  ─── 데이터 ─────────────────────  │
│                                     │
│  🗑️ 캐시 삭제                  >   │  ← 확인 다이얼로그
│                                     │
│  ─── 계정 ──────────────────────── │
│                                     │
│  🔒 비밀번호 변경              >   │  ← 별도 화면 이동
│  🚪 로그아웃                   >   │  ← 확인 다이얼로그
│  ⚠️ 회원 탈퇴                  >   │  ← 별도 화면 이동
│                                     │
│  ─── 정보 ──────────────────────── │
│                                     │
│  📋 이용약관                   >   │  ← 웹뷰 이동
│  🔐 개인정보 처리방침           >   │  ← 웹뷰 이동
│  ℹ️ 앱 버전         v1.0.0 (웹앱)  │  ← 텍스트만
│                                     │
└─────────────────────────────────────┘
```

---

## 2. 각 설정 항목 상세

### 2-1. 다크모드

| 항목 | 내용 |
|------|------|
| 기본값 | OFF (라이트 모드) |
| 동작 | 앱 자체 다크모드 — 시스템 설정과 독립 |
| 저장 | localStorage + 서버 동기화 (user_settings) |
| 적용 | 즉시 적용 (페이지 새로고침 불필요) |

#### 구현 방식

1. `<html>` 태그에 `data-theme="dark"` 속성 추가/제거
2. CSS variables로 색상 전환 (시스템 `prefers-color-scheme` 무시)
3. localStorage에 `theme` 값 저장 → 앱 로드 시 즉시 적용 (FOUC 방지)
4. 로그인 후 서버와 동기화

```css
/* 라이트 모드 (기본) */
:root {
  --color-bg: #F9FAFB;
  --color-surface: #FFFFFF;
  --color-text: #111827;
  --color-text-sub: #6B7280;
  --color-border: #E5E7EB;
  --color-primary: #2563EB;
  --color-secondary: #E6ECFA;
}

/* 다크모드 */
[data-theme="dark"] {
  --color-bg: #111827;
  --color-surface: #1F2937;
  --color-text: #F9FAFB;
  --color-text-sub: #9CA3AF;
  --color-border: #374151;
  --color-primary: #3B82F6;
  --color-secondary: #1E3A5F;
}
```

### 2-2. 글꼴 크기

| 항목 | 내용 |
|------|------|
| 기본값 | 보통 (16px) |
| 옵션 | 작게(14px) / 보통(16px) / 크게(18px) / 아주 크게(20px) |
| 저장 | localStorage + 서버 동기화 |
| 적용 | `<html>` 태그의 `font-size` 변경 → rem 기반 자동 스케일 |

```
┌─────────────────────────────────────┐
│  글꼴 크기                          │
├─────────────────────────────────────┤
│                                     │
│  ○ 작게    (14px)                   │
│  ● 보통    (16px)   ← 기본         │
│  ○ 크게    (18px)                   │
│  ○ 아주 크게 (20px)                 │
│                                     │
│  미리보기:                          │
│  ┌───────────────────────────────┐ │
│  │ 가나다라마바사 ABC 123         │ │
│  │ 이 크기로 텍스트가 표시됩니다. │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### 2-3. 알림 설정

`push-notification-plan.md` §6-3의 알림 설정 화면으로 이동.

| 설정 | 기본값 |
|------|--------|
| 전체 알림 | ON |
| 공지 알림 | ON |
| 일정 알림 | ON |
| 리마인더 | ON |
| 댓글 알림 | ON |
| 생일 알림 | ON |

### 2-4. 캐시 삭제

```
┌─────────────────────────────────────┐
│  캐시를 삭제하시겠습니까?            │
│                                     │
│  저장된 임시 데이터를 삭제합니다.     │
│  로그인 상태는 유지됩니다.           │
│                                     │
│        [취소]    [삭제]              │
└─────────────────────────────────────┘
```

- localStorage에서 캐시 관련 항목만 삭제 (토큰, 설정값 유지)
- Service Worker 캐시 삭제 (caches.delete)
- 완료 후 "캐시가 삭제되었습니다" 토스트

### 2-5. 비밀번호 변경

기존 프로필 화면의 비밀번호 변경 기능을 환경설정으로 이동.

```
┌─────────────────────────────────────┐
│  ← 비밀번호 변경                     │
├─────────────────────────────────────┤
│                                     │
│  현재 비밀번호                       │
│  ┌─────────────────────────────┐   │
│  │ ••••••••               👁  │   │
│  └─────────────────────────────┘   │
│                                     │
│  새 비밀번호                         │
│  ┌─────────────────────────────┐   │
│  │                         👁  │   │
│  └─────────────────────────────┘   │
│  8자 이상, 영문+숫자 포함            │
│                                     │
│  새 비밀번호 확인                     │
│  ┌─────────────────────────────┐   │
│  │                         👁  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         변경하기             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

- 기존 `PUT /api/auth/password` API 사용
- 에러: 인라인 표시 (스낵바 아님)

### 2-6. 로그아웃

```
┌─────────────────────────────────────┐
│  로그아웃 하시겠습니까?              │
│                                     │
│        [취소]    [로그아웃]          │
└─────────────────────────────────────┘
```

- JWT 토큰 삭제 (localStorage)
- Push 구독 해제 (DELETE /api/push/subscribe)
- 로그인 화면으로 이동

### 2-7. 회원 탈퇴

```
┌─────────────────────────────────────┐
│  ← 회원 탈퇴                        │
├─────────────────────────────────────┤
│                                     │
│  ⚠️ 회원 탈퇴 시 아래 데이터가       │
│  삭제되며, 복구할 수 없습니다.       │
│                                     │
│  · 작성한 게시글 및 댓글             │
│  · 프로필 정보                      │
│  · 알림 설정 및 구독 정보            │
│                                     │
│  탈퇴 사유 (선택)                    │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  비밀번호 확인                       │
│  ┌─────────────────────────────┐   │
│  │ ••••••••               👁  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │       회원 탈퇴하기          │   │  ← 빨간색 버튼
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

- 비밀번호 확인 후 soft delete (withdrawn_at 설정, status='withdrawn')
- Push 구독 삭제
- 로그인 화면으로 이동

### 2-8. 이용약관 / 개인정보 처리방침

- 별도 HTML 페이지 또는 외부 URL로 이동
- Phase 1에서는 placeholder 페이지 (내용 추후 작성)
- 파일: `web/terms.html`, `web/privacy.html`

### 2-9. 앱 버전

- `package.json`의 version 표시
- 텍스트만 (클릭 불가)
- 형식: `v1.0.0 (웹앱)`

---

## 3. DB 스키마

### 3-1. user_settings 테이블 (신규)

```sql
CREATE TABLE user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  font_size VARCHAR(10) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'xlarge')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

> 알림 설정은 별도 `notification_settings` 테이블에서 관리 (분리 유지)

### 3-2. 마이그레이션 파일

파일: `database/migrations/013_user_settings.sql`

```sql
-- 013: 사용자 환경설정 테이블
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  font_size VARCHAR(10) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'xlarge')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3-3. 설정 기본값 정리

| 설정 | DB 컬럼 | 기본값 | 테이블 |
|------|---------|--------|--------|
| 다크모드 | theme | 'light' | user_settings |
| 글꼴 크기 | font_size | 'medium' | user_settings |
| 전체 알림 | all_push | true | notification_settings |
| 공지 알림 | notice_push | true | notification_settings |
| 일정 알림 | schedule_push | true | notification_settings |
| 리마인더 | reminder_push | true | notification_settings |
| 댓글 알림 | comment_push | true | notification_settings |
| 생일 알림 | birthday_push | true | notification_settings |

---

## 4. API 엔드포인트 설계

### 4-1. 환경설정 조회

```
GET /api/settings
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "theme": "light",
    "font_size": "medium"
  }
}
```

- user_settings 레코드가 없으면 기본값 반환
- 알림 설정은 별도 API (`GET /api/notifications/settings`)

### 4-2. 환경설정 변경

```
PUT /api/settings
Headers: Authorization: Bearer <token>
Body: {
  "theme": "dark",
  "font_size": "large"
}
Response: { "success": true }
```

- INSERT ON CONFLICT UPDATE (user_settings)
- 부분 업데이트 지원 (theme만 보내도 됨, font_size 유지)

### 4-3. 회원 탈퇴

```
POST /api/auth/withdraw
Headers: Authorization: Bearer <token>
Body: {
  "password": "현재비밀번호",
  "reason": "탈퇴 사유 (선택)"
}
Response: { "success": true }
```

- 비밀번호 검증
- soft delete: status='withdrawn', withdrawn_at=NOW()
- Push 구독 삭제
- 세션 삭제

### 4-4. 캐시 삭제

프론트엔드 only (API 호출 불필요)

```javascript
// localStorage 캐시 항목 삭제 (토큰, 설정 유지)
const keepKeys = ['token', 'theme', 'font_size', 'push_banner_dismissed'];
Object.keys(localStorage).forEach(key => {
  if (!keepKeys.includes(key)) localStorage.removeItem(key);
});

// Service Worker 캐시 삭제
if ('caches' in window) {
  caches.keys().then(names => names.forEach(name => caches.delete(name)));
}
```

---

## 5. 프론트엔드 UI

### 5-1. 환경설정 화면 접근 경로

기존 프로필 탭 메뉴에서 환경설정 진입:

```
프로필 탭
  ├── 내 정보 수정
  ├── ⚙️ 환경설정      ← 신규 (기존 비밀번호 변경 + 로그아웃 통합)
  └── (비밀번호 변경, 로그아웃은 환경설정 내부로 이동)
```

### 5-2. 환경설정 메인 화면

§1의 메뉴 구조 참조. 각 항목은 그룹별로 구분선(`─── 그룹명 ───`)으로 분리.

- **토글**: 다크모드 (즉시 적용)
- **선택**: 글꼴 크기 (라디오 버튼 + 미리보기)
- **이동**: 알림 설정, 비밀번호 변경, 회원 탈퇴 (별도 화면)
- **액션**: 캐시 삭제, 로그아웃 (확인 다이얼로그)
- **정보**: 이용약관, 개인정보, 앱 버전 (읽기 전용)

### 5-3. 다크모드 전환 동작

```javascript
// 토글 클릭 시
function toggleDarkMode(enabled) {
  const theme = enabled ? 'dark' : 'light';

  // 1. 즉시 적용
  document.documentElement.setAttribute('data-theme', theme);

  // 2. localStorage 저장 (FOUC 방지)
  localStorage.setItem('theme', theme);

  // 3. 서버 동기화 (비동기, 실패해도 무관)
  apiClient.put('/api/settings', { theme });
}
```

### 5-4. 앱 로드 시 설정 적용 (FOUC 방지)

`web/index.html`의 `<head>` 최상단에 인라인 스크립트:

```html
<script>
  // 다크모드 즉시 적용 (FOUC 방지)
  (function() {
    var theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    var fontSize = localStorage.getItem('font_size') || 'medium';
    var sizes = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' };
    document.documentElement.style.fontSize = sizes[fontSize] || '16px';
  })();
</script>
```

---

## 6. 다크모드 CSS Variables 구현 가이드

### 6-1. 색상 토큰 매핑

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `--color-bg` | `#F9FAFB` | `#111827` |
| `--color-surface` | `#FFFFFF` | `#1F2937` |
| `--color-text` | `#111827` | `#F9FAFB` |
| `--color-text-sub` | `#6B7280` | `#9CA3AF` |
| `--color-border` | `#E5E7EB` | `#374151` |
| `--color-primary` | `#2563EB` | `#3B82F6` |
| `--color-secondary` | `#E6ECFA` | `#1E3A5F` |
| `--color-accent` | `#F59E0B` | `#FBBF24` |
| `--color-error` | `#DC2626` | `#EF4444` |
| `--color-success` | `#16A34A` | `#22C55E` |
| `--color-card` | `#FFFFFF` | `#1F2937` |
| `--color-input-bg` | `#FFFFFF` | `#374151` |
| `--color-shadow` | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.3)` |

### 6-2. 시스템 설정 무시

```css
/* prefers-color-scheme 무시 — 앱 자체 설정만 사용 */
/* 아래처럼 @media (prefers-color-scheme: dark) 사용하지 않음 */
/* 오직 [data-theme="dark"] 선택자만 사용 */
```

### 6-3. 적용 범위

- `main.css`: `:root` 변수 + `[data-theme="dark"]` 변수 정의
- 모든 색상은 CSS 변수 참조 (`var(--color-xxx)`)
- 하드코딩된 색상값은 CSS 변수로 마이그레이션 필요

---

## 7. 벤치마킹 추가 기능 제안

커뮤니티/회원관리 앱 벤치마킹 결과, 아래 항목을 추가 제안:

| 항목 | 우선순위 | 설명 | 구현 난이도 |
|------|---------|------|------------|
| 다크모드 | Must | 앱 자체 테마 전환 | 중 (CSS 변수 마이그레이션) |
| 글꼴 크기 | Should | 4단계 (작게/보통/크게/아주크게) | 하 |
| 알림 설정 | Must | 6개 유형 개별 on/off | 중 (Push 연동) |
| 캐시 삭제 | Should | localStorage + SW 캐시 | 하 |
| 비밀번호 변경 | Must | 기존 기능 이동 | 하 (이미 구현) |
| 로그아웃 | Must | 기존 기능 이동 | 하 (이미 구현) |
| 회원 탈퇴 | Must | soft delete + 비밀번호 확인 | 중 |
| 이용약관 | Must | 법적 필수 (placeholder) | 하 |
| 개인정보 처리방침 | Must | 법적 필수 (placeholder) | 하 |
| 앱 버전 | Nice | 단순 텍스트 표시 | 하 |
| ~~언어 설정~~ | 제외 | 한국어 단일 → 불필요 | — |

> 언어/지역 설정은 영등포JC가 한국어 단일 사용이므로 제외.
> 향후 다국어 지원 필요 시 추가 가능.

---

## 8. 구현 우선순위

### Phase 1 — MVP

| 순서 | 작업 | 담당 |
|------|------|------|
| 1 | DB 마이그레이션 (user_settings 테이블) | 백엔드 |
| 2 | 환경설정 API (GET/PUT /api/settings) | 백엔드 |
| 3 | 회원 탈퇴 API (POST /api/auth/withdraw) | 백엔드 |
| 4 | 환경설정 메인 화면 UI | 프론트 |
| 5 | 다크모드 CSS 변수 정의 + 토글 | 프론트 |
| 6 | 비밀번호 변경 UI 이동 (프로필 → 환경설정) | 프론트 |
| 7 | 로그아웃 UI 이동 (프로필 → 환경설정) | 프론트 |
| 8 | 회원 탈퇴 화면 | 프론트 |
| 9 | 이용약관/개인정보 placeholder 페이지 | 프론트 |

### Phase 2 — 완성

| 순서 | 작업 | 담당 |
|------|------|------|
| 10 | 글꼴 크기 조절 + 미리보기 | 프론트 |
| 11 | 캐시 삭제 기능 | 프론트 |
| 12 | 기존 CSS 하드코딩 색상 → 변수 마이그레이션 | 프론트 |
| 13 | 알림 설정 화면 연동 (Push 기능 구현 후) | 프론트 |
| 14 | 서버-클라이언트 설정 동기화 (로그인 시) | 프론트+백엔드 |
