# Web Push 알림 기획서

> 작성일: 2026-03-11 | 작성자: 기획자 에이전트
> 관련 요구사항: 신규 (R-12 Web Push 알림)
> 우선순위: Must-have (사용자 리텐션 핵심)

---

## 1. 기능 개요

PWA 기반 Web Push 알림을 통해 공지사항, 일정 등록/변경, 리마인더, 댓글 알림을 회원에게 즉시 전달한다.

- **목적**: 공지, 일정 변경 시 33명 회원에게 즉각 전달. 앱 재방문율 향상
- **기술**: Push API + Service Worker (VAPID 기반 Web Push)
- **핵심 원칙**: 네이티브 앱 설치 불필요 — PWA 홈 화면 추가만으로 동작
- **현재 상태**: 알림 기능 없음. Service Worker 미등록. manifest.json 없음

---

## 2. 알림 유형 정의

| ID | 유형 | 트리거 | 발송 대상 | 알림 제목 예시 | 알림 본문 예시 |
|----|------|--------|-----------|---------------|---------------|
| **N-01** | 새 공지 등록 | 공지 게시글 작성 완료 시 | 전체 회원 (notice_push=ON) | 📢 새 공지사항 | "3월 정기 이사회 안내" — 미리보기 50자 |
| **N-02** | 일정 등록 | 새 일정 생성 시 | 전체 회원 (schedule_push=ON) | 📅 새 일정 등록 | "3월 정기 이사회 — 2026.03.15 14:00 영등포구청" |
| **N-03** | 일정 리마인더 | 일정 D-1 오전 09:00 (cron) | 전체 회원 (reminder_push=ON) | ⏰ 내일 일정 | "내일 14:00 3월 정기 이사회 — 영등포구청 3층" |
| **N-04** | 일정 변경/취소 | 일정 수정/삭제 시 | 전체 회원 (schedule_push=ON) | 📅 일정 변경 / ❌ 일정 취소 | "3월 정기 이사회 날짜가 3/22로 변경되었습니다" |
| **N-05** | 댓글 알림 | 내 글에 댓글 작성 시 | 게시글 작성자 (comment_push=ON) | 💬 새 댓글 | "김영등님이 댓글을 남겼습니다: 참석합니다!" |

### 알림 본문 규칙

- 제목: 최대 40자 (초과 시 말줄임)
- 본문: 최대 80자 (초과 시 말줄임)
- 아이콘: PWA 앱 아이콘 (192x192)
- 배지: PWA 앱 배지 (72x72, 모노크롬)
- 클릭 액션: 해당 상세 화면으로 이동 (URL path 포함)

---

## 3. 사용자 설정

### 3-1. 프로필 > 알림 설정 화면

```
┌─────────────────────────────────────┐
│  ← 알림 설정                        │  ← AppBar
├─────────────────────────────────────┤
│                                     │
│  🔔 전체 알림                [ON]   │  ← 마스터 스위치
│                                     │
│  ─── 알림 유형 ─────────────────── │
│                                     │
│  📢 공지 알림                [ON]   │  N-01
│     새 공지사항이 등록되면 알림      │
│                                     │
│  📅 일정 알림                [ON]   │  N-02, N-04
│     일정 등록/변경/취소 시 알림      │
│                                     │
│  ⏰ 일정 리마인더            [ON]   │  N-03
│     일정 하루 전 오전 9시 알림       │
│                                     │
│  💬 댓글 알림                [ON]   │  N-05
│     내 글에 댓글이 달리면 알림       │
│                                     │
│  ─── 상태 ──────────────────────── │
│                                     │
│  푸시 구독 상태: ✅ 활성            │
│  [푸시 알림 재등록]                  │  ← 구독 해제됐을 때 표시
│                                     │
└─────────────────────────────────────┘
```

### 3-2. 설정 기본값

| 설정 | 기본값 |
|------|--------|
| 전체 알림 | ON |
| 공지 알림 | ON |
| 일정 알림 | ON |
| 리마인더 | ON |
| 댓글 알림 | ON |

### 3-3. 마스터 스위치 동작

- **전체 OFF**: 모든 하위 토글 비활성(회색), 서버에서 해당 유저 푸시 발송 스킵
- **전체 ON**: 하위 토글 개별 활성화 가능
- 전체 OFF 시 하위 설정값은 유지 (다시 ON 시 복원)

---

## 4. 백엔드 설계

### 4-1. VAPID 키 설정

```bash
# 최초 1회 생성
npx web-push generate-vapid-keys

# 환경변수 (.env / Railway)
VAPID_PUBLIC_KEY=BPxxx...
VAPID_PRIVATE_KEY=xxx...
VAPID_SUBJECT=mailto:admin@ydpjc.org
```

### 4-2. DB 테이블

#### push_subscriptions — 푸시 구독 정보

```sql
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,                    -- 디바이스 식별용 (디버깅)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)           -- 같은 기기 중복 구독 방지
);

CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);
```

#### notification_settings — 알림 설정

```sql
CREATE TABLE notification_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  all_push BOOLEAN DEFAULT true,       -- 마스터 스위치
  notice_push BOOLEAN DEFAULT true,    -- N-01
  schedule_push BOOLEAN DEFAULT true,  -- N-02, N-04
  reminder_push BOOLEAN DEFAULT true,  -- N-03
  comment_push BOOLEAN DEFAULT true,   -- N-05
  updated_at TIMESTAMP DEFAULT NOW()
);
```

> 회원 가입 승인 시 `notification_settings` 기본 행 INSERT (전부 true)

#### notification_log — 알림 발송 이력

```sql
CREATE TABLE notification_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL,           -- 'N-01'~'N-05'
  title VARCHAR(100) NOT NULL,
  body TEXT,
  data JSONB,                          -- { url: '/posts/15', post_id: 15 } 등
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,                   -- 앱 내 알림센터에서 읽음 처리
  clicked_at TIMESTAMP                 -- 푸시 클릭 시 기록
);

CREATE INDEX idx_noti_log_user ON notification_log(user_id, sent_at DESC);
CREATE INDEX idx_noti_log_unread ON notification_log(user_id) WHERE read_at IS NULL;
```

### 4-3. API 엔드포인트

#### 푸시 구독

```
POST /api/push/subscribe
Headers: Authorization: Bearer <token>
Body: {
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/xxx...",
    "keys": {
      "p256dh": "BPxxx...",
      "auth": "xxx..."
    }
  }
}
Response: { "success": true }
```

```
DELETE /api/push/subscribe
Headers: Authorization: Bearer <token>
Body: {
  "endpoint": "https://fcm.googleapis.com/fcm/send/xxx..."
}
Response: { "success": true }
```

#### 알림 설정

```
GET /api/notifications/settings
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "all_push": true,
    "notice_push": true,
    "schedule_push": true,
    "reminder_push": true,
    "comment_push": true
  }
}
```

```
PUT /api/notifications/settings
Headers: Authorization: Bearer <token>
Body: {
  "all_push": true,
  "notice_push": true,
  "schedule_push": false,
  "reminder_push": true,
  "comment_push": true
}
Response: { "success": true }
```

#### 알림 내역 (앱 내 알림센터)

```
GET /api/notifications?page=1&limit=20
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "items": [
      {
        "id": 42,
        "type": "N-01",
        "title": "📢 새 공지사항",
        "body": "3월 정기 이사회 안내",
        "data": { "url": "/posts/15" },
        "sent_at": "2026-03-11T10:30:00+09:00",
        "read_at": null
      }
    ],
    "total": 15,
    "page": 1,
    "totalPages": 1,
    "unread_count": 3
  }
}
```

```
POST /api/notifications/:id/read
Headers: Authorization: Bearer <token>
Response: { "success": true }
```

```
POST /api/notifications/read-all
Headers: Authorization: Bearer <token>
Response: { "success": true, "data": { "updated": 3 } }
```

### 4-4. 발송 로직

#### 공통 발송 함수

```
sendPushToUsers(userIds[], type, title, body, data)
  1. notification_settings에서 해당 type ON이고 all_push=true인 유저 필터
  2. push_subscriptions에서 해당 유저들의 구독 정보 조회
  3. web-push로 각 구독에 발송
  4. 410 Gone 응답 시 해당 구독 레코드 삭제 (만료된 구독)
  5. notification_log에 각 유저별 기록 INSERT
```

#### 트리거별 발송

| 트리거 | 발송 함수 호출 위치 | type | 대상 |
|--------|---------------------|------|------|
| 공지 작성 | `POST /api/posts` (category=notice) | N-01 | 전체 회원 |
| 일정 생성 | `POST /api/schedules` | N-02 | 전체 회원 |
| 일정 수정 | `PUT /api/schedules/:id` | N-04 | 전체 회원 |
| 일정 삭제 | `DELETE /api/schedules/:id` | N-04 | 전체 회원 |
| 댓글 작성 | `POST /api/posts/:id/comments` | N-05 | 게시글 작성자 (본인 제외) |
| 일정 댓글 | `POST /api/schedules/:id/comments` | N-05 | 일정 작성자 (본인 제외) |

#### 리마인더 (N-03) — node-cron

```javascript
// 매일 09:00 KST 실행
cron.schedule('0 0 * * *', async () => {  // UTC 00:00 = KST 09:00
  // 1. 내일(KST 기준) 일정 조회
  // 2. reminder_push=true인 전체 회원에게 발송
  // 3. notification_log 기록
}, { timezone: 'Asia/Seoul' });
```

### 4-5. npm 패키지

```json
{
  "web-push": "^3.6.0",
  "node-cron": "^3.0.0"
}
```

---

## 5. 프론트엔드 설계

### 5-1. Service Worker 등록

파일: `web/sw.js` (루트에 위치 — scope 최대화)

```
web/sw.js
  ├── push 이벤트 수신 → 알림 표시 (self.registration.showNotification)
  ├── notificationclick 이벤트 → 해당 URL로 이동
  └── (향후) 오프라인 캐시 (Cache API)
```

등록: `web/js/app.js`에서 앱 초기화 시

```javascript
if ('serviceWorker' in navigator) {
  const reg = await navigator.serviceWorker.register('/sw.js');
  // reg 객체를 푸시 구독에 사용
}
```

### 5-2. 푸시 구독 요청 플로우

```
앱 로그인 성공
    ↓
Service Worker 등록 확인
    ↓
기존 구독 존재 여부 확인 (reg.pushManager.getSubscription())
    ↓
구독 없음 → 구독 유도 배너 표시
    "알림을 켜면 공지와 일정을 바로 받아볼 수 있어요"
    [알림 켜기] 버튼
    ↓
버튼 클릭 (사용자 인터랙션 필수 — iOS 요구사항)
    ↓
Notification.requestPermission()
    ↓
granted → reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })
    ↓
구독 객체 → POST /api/push/subscribe
    ↓
완료 → 배너 숨김, "알림이 활성화되었습니다" 토스트
```

### 5-3. 알림 클릭 동작

| 알림 유형 | 클릭 시 이동 경로 |
|-----------|-------------------|
| N-01 (공지) | `/#posts/{post_id}` — 공지 상세 |
| N-02 (일정 등록) | `/#schedules/{schedule_id}` — 일정 상세 |
| N-03 (리마인더) | `/#schedules/{schedule_id}` — 일정 상세 |
| N-04 (일정 변경) | `/#schedules/{schedule_id}` — 일정 상세 |
| N-05 (댓글) | `/#posts/{post_id}` — 게시글 상세 (댓글 위치 스크롤) |

### 5-4. 앱 내 알림 센터

앱바 우측에 종 아이콘(🔔) + 미읽음 배지

```
┌─────────────────────────────────────┐
│  ← 알림                            │  ← AppBar
├─────────────────────────────────────┤
│  [모두 읽음 처리]                    │
├─────────────────────────────────────┤
│  ● 📢 새 공지사항                   │  ← 미읽음 (● 파란 점)
│    3월 정기 이사회 안내              │
│    10분 전                          │
├─────────────────────────────────────┤
│  ○ 📅 새 일정 등록                  │  ← 읽음 (○ 회색)
│    3월 봉사활동 — 3/20 09:00        │
│    어제                             │
├─────────────────────────────────────┤
│  ○ 💬 새 댓글                       │
│    김영등님이 댓글을 남겼습니다       │
│    3일 전                           │
├─────────────────────────────────────┤
│                                     │
│  알림이 더 없습니다                  │
│                                     │
├─────────────────────────────────────┤
│  홈 │ 게시판 │ 일정 │ 회원 │ 프로필  │
└─────────────────────────────────────┘
```

- 알림 항목 클릭 → read_at 업데이트 + 해당 화면 이동
- 시간 표시: 방금 / N분 전 / N시간 전 / 어제 / N일 전 / 날짜

### 5-5. 앱바 알림 아이콘

```
┌──────────────────────────────────────┐
│  영등포 JC        🔔③              │
└──────────────────────────────────────┘
```

- `③`: 미읽음 알림 수 (빨간 배지, danger 색상)
- 0이면 배지 숨김
- 클릭 → 알림 센터 화면 이동

### 5-6. 프로필 > 알림 설정 UI

프로필 탭 메뉴에 "알림 설정" 항목 추가:

```
프로필 화면
  ├── 내 정보 수정
  ├── 🔔 알림 설정     ← 신규 추가
  ├── 비밀번호 변경
  └── 로그아웃
```

---

## 6. PWA 설정

### 6-1. manifest.json

파일: `web/manifest.json`

```json
{
  "name": "영등포 JC",
  "short_name": "영등포JC",
  "description": "영등포청년회의소 회원관리 커뮤니티",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#2563EB",
  "background_color": "#F9FAFB",
  "icons": [
    { "src": "/image/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/image/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/image/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/image/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 6-2. index.html 추가 태그

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#2563EB">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="/image/icon-192.png">
```

### 6-3. Service Worker 캐시 전략

Phase 1 (푸시 알림 MVP):
- 푸시 수신 + 알림 표시만 구현
- 오프라인 캐시는 미구현

Phase 2 (향후):
- 정적 파일 캐시 (CSS, JS, 이미지)
- 오프라인 fallback 페이지

### 6-4. 홈 화면 추가 안내 배너

```
┌─────────────────────────────────────┐
│  📱 홈 화면에 추가하면              │
│  알림을 받을 수 있어요!             │
│                                     │
│  [추가 방법 보기]      [닫기]       │
└─────────────────────────────────────┘
```

- 조건: PWA가 아닌 브라우저에서 접속 + 아직 닫지 않은 경우
- "추가 방법 보기" 클릭 → OS별 안내:
  - **Android Chrome**: "메뉴(⋮) → 홈 화면에 추가"
  - **iOS Safari**: "공유(□↑) → 홈 화면에 추가"
- "닫기" → localStorage에 플래그 저장, 7일간 미표시

---

## 7. iOS 호환성 주의사항

### 7-1. 지원 조건

| 조건 | 필수 여부 | 설명 |
|------|-----------|------|
| iOS 16.4+ | 필수 | 그 이전 버전은 Web Push 미지원 |
| Safari | 필수 | Chrome/Firefox iOS는 미지원 |
| 홈 화면 추가 | 필수 | 브라우저에서 직접 접속 시 푸시 불가 |
| 사용자 인터랙션 | 필수 | 버튼 클릭 등의 인터랙션 이후에만 권한 요청 가능 |

### 7-2. 프론트엔드 분기 처리

```
구독 요청 시:
  1. 'PushManager' in window 체크
  2. iOS인 경우:
     - standalone 모드 확인 (홈 화면 추가됨)
     - standalone 아니면 → "홈 화면에 추가 후 이용하세요" 안내
  3. Notification.permission 확인
     - 'denied' → "설정에서 알림을 허용해주세요" 안내 (재요청 불가)
     - 'default' → 권한 요청
     - 'granted' → 구독 진행
```

### 7-3. 제한사항

- iOS에서는 알림 소리/진동 커스터마이징 불가
- 알림 액션 버튼 미지원
- 배지 업데이트 미지원
- 알림 이미지(big picture) 미지원

---

## 8. 보안 고려사항

1. **VAPID 키 보안**: Private Key는 환경변수로만 관리 (코드/저장소에 절대 포함 금지)
2. **구독 검증**: POST /api/push/subscribe에서 endpoint URL 형식 검증
3. **발송 제한**: 동일 알림을 중복 발송하지 않도록 notification_log 체크
4. **구독 정리**: 410 Gone 응답 시 즉시 구독 삭제, 주기적 정리 cron (월 1회)
5. **인증**: 모든 알림 API는 JWT 인증 필수

---

## 9. 구현 우선순위

### Phase 1 — MVP (필수)

| 순서 | 작업 | 담당 |
|------|------|------|
| 1 | DB 테이블 3개 생성 (push_subscriptions, notification_settings, notification_log) | 백엔드 |
| 2 | VAPID 키 생성 + Railway 환경변수 등록 | 백엔드 |
| 3 | web-push + node-cron 패키지 설치 | 백엔드 |
| 4 | 푸시 구독 API (subscribe/unsubscribe) | 백엔드 |
| 5 | 알림 설정 API (GET/PUT) | 백엔드 |
| 6 | manifest.json + Service Worker 기본 파일 | 프론트엔드 |
| 7 | 푸시 구독 플로우 (권한 요청 → 구독 → 서버 등록) | 프론트엔드 |
| 8 | N-01 공지 알림 발송 로직 | 백엔드 |
| 9 | N-02/N-04 일정 알림 발송 로직 | 백엔드 |
| 10 | 알림 클릭 → 해당 화면 이동 | 프론트엔드 |

### Phase 2 — 완성

| 순서 | 작업 | 담당 |
|------|------|------|
| 11 | N-03 리마인더 cron 구현 | 백엔드 |
| 12 | N-05 댓글 알림 발송 로직 | 백엔드 |
| 13 | 알림 내역 API (GET /api/notifications) | 백엔드 |
| 14 | 앱바 알림 아이콘 + 미읽음 배지 | 프론트엔드 |
| 15 | 알림 센터 화면 | 프론트엔드 |
| 16 | 프로필 > 알림 설정 화면 | 프론트엔드 |
| 17 | 홈 화면 추가 안내 배너 | 프론트엔드 |
| 18 | iOS 분기 처리 | 프론트엔드 |

---

## 10. 에러 처리

| 상황 | 처리 |
|------|------|
| 브라우저 미지원 (Push API 없음) | 구독 UI 숨김, 알림 센터만 제공 |
| 알림 권한 거부 (denied) | "설정에서 알림을 허용해주세요" 안내 문구 |
| 구독 만료 (410 Gone) | DB에서 구독 삭제, 다음 로그인 시 재구독 유도 |
| 발송 실패 (네트워크) | notification_log에 실패 기록, 재시도 없음 (소규모 앱) |
| iOS 브라우저 접속 (비-PWA) | 홈 화면 추가 안내 배너 표시 |

---

## 11. 테스트 체크리스트

- [ ] VAPID 키 생성 및 환경변수 설정
- [ ] 푸시 구독/해제 API 정상 동작
- [ ] 알림 설정 조회/변경 API 정상 동작
- [ ] 공지 작성 시 N-01 알림 수신 확인
- [ ] 일정 생성 시 N-02 알림 수신 확인
- [ ] 일정 수정 시 N-04 알림 수신 확인
- [ ] 댓글 작성 시 N-05 알림 수신 확인 (작성자 본인에게는 미발송)
- [ ] 리마인더 cron 동작 확인 (D-1 09:00 KST)
- [ ] 알림 클릭 → 해당 화면 이동
- [ ] 알림 설정 OFF 시 해당 유형 미수신 확인
- [ ] 마스터 스위치 OFF 시 전체 미수신 확인
- [ ] 알림 센터 목록 조회 + 읽음 처리
- [ ] iOS Safari PWA에서 푸시 동작 확인
- [ ] Android Chrome에서 푸시 동작 확인
- [ ] 만료된 구독 자동 정리 확인

---

## 12. 향후 확장 가능성

- **대댓글 알림**: 내 댓글에 대댓글이 달렸을 때 알림
- **공감 알림**: 내 글에 N명 이상 공감 시 알림
- **관리자 공지**: 긴급 공지 시 설정 무관 전체 발송
- **알림 그룹핑**: 동일 게시글 댓글 N개 → "김영등 외 2명이 댓글을 남겼습니다"
- **오프라인 캐시**: Service Worker Cache API로 정적 파일 + API 응답 캐시
- **네이티브 앱 전환 시**: FCM/APNs로 마이그레이션 (web-push → firebase-admin)
