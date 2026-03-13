# Push 알림 기능 기획서 (이슈 #4)

> 작성일: 2026-03-13 | 작성자: 기획자 에이전트
> 관련 이슈: GitHub #4
> 선행 문서: `Docs/features/web-push-notification.md` (N-01~N-05 기존 기획)
> 우선순위: Must-have

---

## 1. 기능 개요 및 목적

PWA 기반 Web Push 알림을 통해 회원에게 주요 이벤트를 즉시 전달한다.

- **목적**: 공지, 일정, 댓글, 생일 등 핵심 이벤트를 33명 회원에게 실시간 전달하여 앱 재방문율 향상
- **기술**: Web Push API + Service Worker (VAPID 기반) + node-cron (스케줄 작업)
- **핵심 원칙**: 네이티브 앱 설치 불필요 — PWA 홈 화면 추가만으로 동작
- **기존 기획 대비 추가**: 생일 알림(N-06) 신규 추가

---

## 2. 알림 유형별 트리거 조건 및 메시지 형식

### 2-1. 알림 유형 정의

| ID | 유형 | 트리거 | 발송 대상 | 제목 예시 | 본문 예시 |
|----|------|--------|-----------|-----------|-----------|
| **N-01** | 공지 알림 | 공지 게시글 작성 완료 시 | 전체 회원 (notice_push=ON) | 📢 새 공지사항 | "3월 정기 이사회 안내" — 미리보기 50자 |
| **N-02** | 일정 등록 알림 | 새 일정 생성 시 | 전체 회원 (schedule_push=ON) | 📅 새 일정 등록 | "3월 정기 이사회 — 2026.03.15 14:00 영등포구청" |
| **N-03** | 일정 리마인더 | 일정 D-1 오전 09:00 (cron) | 전체 회원 (reminder_push=ON) | ⏰ 내일 일정 | "내일 14:00 3월 정기 이사회 — 영등포구청 3층" |
| **N-04** | 일정 변경/취소 | 일정 수정/삭제 시 | 전체 회원 (schedule_push=ON) | 📅 일정 변경 | "3월 정기 이사회 날짜가 3/22로 변경되었습니다" |
| **N-05** | 댓글 알림 | 내 글에 댓글 작성 시 | 게시글 작성자 (comment_push=ON, 본인 제외) | 💬 새 댓글 | "김영등님이 댓글을 남겼습니다: 참석합니다!" |
| **N-06** | 생일 알림 | 매일 오전 09:00 cron | 전체 회원 (birthday_push=ON, 생일 당사자 제외) | 🎂 오늘 생일 | "오늘은 김영등님의 생일입니다! 축하 메시지를 보내보세요" |

### 2-2. 알림 메시지 규칙

- **제목**: 최대 40자 (초과 시 말줄임)
- **본문**: 최대 80자 (초과 시 말줄임)
- **아이콘**: PWA 앱 아이콘 (192x192)
- **배지**: PWA 앱 배지 (72x72, 모노크롬)
- **클릭 액션**: 해당 상세 화면으로 이동

### 2-3. 알림 클릭 시 이동 경로

| 알림 유형 | 클릭 시 이동 |
|-----------|-------------|
| N-01 (공지) | `/#posts/{post_id}` |
| N-02 (일정 등록) | `/#schedules/{schedule_id}` |
| N-03 (리마인더) | `/#schedules/{schedule_id}` |
| N-04 (일정 변경) | `/#schedules/{schedule_id}` |
| N-05 (댓글) | `/#posts/{post_id}` (댓글 위치 스크롤) |
| N-06 (생일) | `/#members/{member_id}` (생일 당사자 프로필) |

### 2-4. 생일 알림 상세 규칙

- **트리거**: 매일 09:00 KST, `users.birth_date`의 월/일이 오늘과 일치하는 회원 조회
- **대상**: 전체 승인된 회원 중 `birthday_push=ON`인 회원 (생일 당사자 본인 제외)
- **복수 생일**: 같은 날 생일인 회원이 여러 명이면 각각 별도 알림 발송
  - 예: "오늘은 김영등님의 생일입니다!", "오늘은 박청년님의 생일입니다!"
- **birth_date 없는 회원**: 알림 발송 스킵 (birth_date IS NULL)
- **당일 리마인더와 통합**: 일정 리마인더 cron(N-03)과 동일 시간대에 실행하되 별도 함수

---

## 3. DB 스키마

### 3-1. push_subscriptions — 푸시 구독 정보 (기존)

> 이미 `006_web_push.sql`로 프로덕션 DB에 생성 완료

```sql
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

### 3-2. notification_settings — 알림 설정 (확장 필요)

> 기존 테이블에 `birthday_push` 컬럼 추가

```sql
-- 기존 테이블 (006_web_push.sql)
CREATE TABLE notification_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  all_push BOOLEAN DEFAULT true,
  notice_push BOOLEAN DEFAULT true,
  schedule_push BOOLEAN DEFAULT true,
  reminder_push BOOLEAN DEFAULT true,
  comment_push BOOLEAN DEFAULT true,
  birthday_push BOOLEAN DEFAULT true,   -- ★ 신규 추가
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 마이그레이션 (기존 테이블에 컬럼 추가)
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS birthday_push BOOLEAN DEFAULT true;
```

### 3-3. notification_log — 알림 발송 이력 (기존)

> 이미 생성 완료. type 값에 'N-06' 추가 사용

```sql
CREATE TABLE notification_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL,        -- 'N-01'~'N-06'
  title VARCHAR(100) NOT NULL,
  body TEXT,
  data JSONB,                       -- { url: '/members/5', member_id: 5 } 등
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  clicked_at TIMESTAMP
);
```

### 3-4. 마이그레이션 파일

파일: `database/migrations/011_birthday_push.sql`

```sql
-- 011: 생일 알림 설정 컬럼 추가
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS birthday_push BOOLEAN DEFAULT true;
```

---

## 4. API 엔드포인트 설계

### 4-1. 푸시 구독 (기존 — web-push-notification.md §4-3 참조)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/push/subscribe` | 푸시 구독 등록 |
| DELETE | `/api/push/subscribe` | 푸시 구독 해제 |

### 4-2. 알림 설정 (기존 + birthday_push 추가)

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
    "comment_push": true,
    "birthday_push": true        // ★ 신규
  }
}
```

```
PUT /api/notifications/settings
Headers: Authorization: Bearer <token>
Body: {
  "all_push": true,
  "notice_push": true,
  "schedule_push": true,
  "reminder_push": true,
  "comment_push": true,
  "birthday_push": false         // ★ 신규
}
Response: { "success": true }
```

### 4-3. 알림 내역 (기존)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/notifications?page=1&limit=20` | 알림 목록 (페이지네이션) |
| POST | `/api/notifications/:id/read` | 개별 읽음 처리 |
| POST | `/api/notifications/read-all` | 전체 읽음 처리 |

### 4-4. 알림 미읽음 수 (앱바 배지용)

```
GET /api/notifications/unread-count
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": { "count": 3 }
}
```

---

## 5. Service Worker 등록 흐름

### 5-1. 파일 구조

```
web/
├── sw.js                    # Service Worker (루트 — scope 최대화)
├── manifest.json            # PWA manifest
└── js/
    └── push.js              # 푸시 구독/관리 모듈 (신규)
```

### 5-2. 등록 플로우

```
앱 로그인 성공
    ↓
1. Service Worker 등록 확인
   navigator.serviceWorker.register('/sw.js')
    ↓
2. 기존 구독 확인
   reg.pushManager.getSubscription()
    ↓
3-A. 구독 없음 → 구독 유도 배너 표시
    "알림을 켜면 공지와 일정을 바로 받아볼 수 있어요"
    [알림 켜기] 버튼
    ↓
3-B. 버튼 클릭 (사용자 인터랙션 필수 — iOS 요구사항)
    ↓
4. 권한 요청
   Notification.requestPermission()
    ↓
5. granted → 구독 생성
   reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
    ↓
6. 서버 등록
   POST /api/push/subscribe
    ↓
7. 완료 → "알림이 활성화되었습니다" 토스트
```

### 5-3. sw.js 핵심 이벤트

```javascript
// push 이벤트 — 알림 표시
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/image/icon-192.png',
      badge: '/image/badge-72.png',
      data: { url: data.url }
    })
  );
});

// notificationclick — 해당 화면 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### 5-4. iOS 호환성 분기

- iOS 16.4+ Safari에서만 Web Push 지원
- 홈 화면 추가(standalone 모드) 필수
- standalone이 아니면 → "홈 화면에 추가 후 이용하세요" 안내 표시
- `Notification.permission === 'denied'` → "설정에서 알림을 허용해주세요" 안내

---

## 6. 프론트엔드 UI

### 6-1. 앱바 알림 아이콘

```
┌──────────────────────────────────────┐
│  영등포 JC                🔔③       │
└──────────────────────────────────────┘
```

- `③`: 미읽음 알림 수 (빨간 배지)
- 0이면 배지 숨김
- 클릭 → 알림 센터 화면 이동

### 6-2. 알림 센터 화면

```
┌─────────────────────────────────────┐
│  ← 알림                            │
├─────────────────────────────────────┤
│  [모두 읽음 처리]                    │
├─────────────────────────────────────┤
│  ● 🎂 오늘 생일                    │  ← 미읽음
│    오늘은 김영등님의 생일입니다!      │
│    2시간 전                         │
├─────────────────────────────────────┤
│  ● 📢 새 공지사항                   │
│    3월 정기 이사회 안내              │
│    10분 전                          │
├─────────────────────────────────────┤
│  ○ 📅 새 일정 등록                  │  ← 읽음
│    3월 봉사활동 — 3/20 09:00        │
│    어제                             │
├─────────────────────────────────────┤
│  ○ 💬 새 댓글                       │
│    박청년님이 댓글을 남겼습니다       │
│    3일 전                           │
├─────────────────────────────────────┤
│                                     │
│  알림이 더 없습니다                  │
│                                     │
├─────────────────────────────────────┤
│  홈 │ 게시판 │ 일정 │ 회원 │ 프로필  │
└─────────────────────────────────────┘
```

- 알림 항목 클릭 → `read_at` 업데이트 + 해당 화면 이동
- 시간 표시: 방금 / N분 전 / N시간 전 / 어제 / N일 전 / 날짜

### 6-3. 알림 설정 화면 (환경설정 내)

```
┌─────────────────────────────────────┐
│  ← 알림 설정                        │
├─────────────────────────────────────┤
│                                     │
│  🔔 전체 알림                [ON]   │  ← 마스터 스위치
│                                     │
│  ─── 알림 유형 ─────────────────── │
│                                     │
│  📢 공지 알림                [ON]   │
│     새 공지사항이 등록되면 알림      │
│                                     │
│  📅 일정 알림                [ON]   │
│     일정 등록/변경/취소 시 알림      │
│                                     │
│  ⏰ 일정 리마인더            [ON]   │
│     일정 하루 전 오전 9시 알림       │
│                                     │
│  💬 댓글 알림                [ON]   │
│     내 글에 댓글이 달리면 알림       │
│                                     │
│  🎂 생일 알림                [ON]   │  ★ 신규
│     회원 생일 당일 알림              │
│                                     │
│  ─── 상태 ──────────────────────── │
│                                     │
│  푸시 구독 상태: ✅ 활성            │
│  [푸시 알림 재등록]                  │
│                                     │
└─────────────────────────────────────┘
```

- **마스터 스위치 OFF**: 모든 하위 토글 비활성(회색), 서버에서 발송 스킵
- **마스터 스위치 ON**: 하위 토글 개별 제어 가능
- OFF 시 하위 설정값은 유지 (다시 ON 시 복원)

---

## 7. 백엔드 발송 로직

### 7-1. 공통 발송 함수

```
sendPushToUsers(userIds[], type, title, body, data)
  1. notification_settings에서 해당 type ON이고 all_push=true인 유저 필터
  2. push_subscriptions에서 해당 유저들의 구독 정보 조회
  3. web-push로 각 구독에 발송
  4. 410 Gone 응답 시 해당 구독 레코드 삭제 (만료된 구독)
  5. notification_log에 각 유저별 기록 INSERT
```

### 7-2. 트리거별 발송 위치

| 트리거 | 호출 위치 | type | 대상 |
|--------|-----------|------|------|
| 공지 작성 | `POST /api/posts` (category=notice) | N-01 | 전체 회원 |
| 일정 생성 | `POST /api/schedules` | N-02 | 전체 회원 |
| 일정 수정 | `PUT /api/schedules/:id` | N-04 | 전체 회원 |
| 일정 삭제 | `DELETE /api/schedules/:id` | N-04 | 전체 회원 |
| 댓글 작성 | `POST /api/posts/:id/comments` | N-05 | 게시글 작성자 (본인 제외) |
| 일정 댓글 | `POST /api/schedules/:id/comments` | N-05 | 일정 작성자 (본인 제외) |

### 7-3. cron 스케줄 작업

```javascript
// 매일 09:00 KST 실행 (UTC 00:00)
cron.schedule('0 0 * * *', async () => {
  // --- N-03: 일정 리마인더 ---
  // 1. 내일(KST) 시작 일정 조회
  // 2. reminder_push=true인 전체 회원에게 발송

  // --- N-06: 생일 알림 ---
  // 1. 오늘(KST) 생일인 회원 조회
  //    SELECT id, name FROM users
  //    WHERE EXTRACT(MONTH FROM birth_date) = $1
  //      AND EXTRACT(DAY FROM birth_date) = $2
  //      AND status = 'active'
  //      AND birth_date IS NOT NULL
  // 2. 각 생일 회원별로:
  //    - birthday_push=ON인 전체 회원에게 발송 (생일 당사자 본인 제외)
  //    - 제목: "🎂 오늘 생일"
  //    - 본문: "오늘은 {이름}님의 생일입니다! 축하 메시지를 보내보세요"
  //    - data: { url: '/#members/{member_id}', member_id: N }
}, { timezone: 'Asia/Seoul' });
```

### 7-4. npm 패키지

```json
{
  "web-push": "^3.6.0",
  "node-cron": "^3.0.0"
}
```

---

## 8. 구현 우선순위

### Phase 1 — MVP (알림 인프라 + 핵심 알림)

| 순서 | 작업 | 담당 | 설명 |
|------|------|------|------|
| 1 | DB 마이그레이션 (birthday_push 컬럼 추가) | 백엔드 | `011_birthday_push.sql` |
| 2 | VAPID 키 생성 + Railway 환경변수 등록 | 백엔드 | 최초 1회 |
| 3 | web-push + node-cron 패키지 설치 | 백엔드 | `npm install` |
| 4 | 푸시 구독 API (subscribe/unsubscribe) | 백엔드 | POST/DELETE /api/push/subscribe |
| 5 | 알림 설정 API (GET/PUT) | 백엔드 | birthday_push 포함 |
| 6 | manifest.json + Service Worker 기본 파일 | 프론트 | sw.js, manifest.json |
| 7 | 푸시 구독 플로우 (권한 요청 → 구독 → 서버 등록) | 프론트 | push.js 모듈 |
| 8 | N-01 공지 알림 발송 | 백엔드 | 공지 작성 시 |
| 9 | N-02/N-04 일정 알림 발송 | 백엔드 | 일정 생성/수정/삭제 시 |
| 10 | 알림 클릭 → 해당 화면 이동 | 프론트 | notificationclick 핸들러 |

### Phase 2 — 완성 (리마인더, 댓글, 생일, 알림센터)

| 순서 | 작업 | 담당 | 설명 |
|------|------|------|------|
| 11 | N-03 일정 리마인더 cron | 백엔드 | 매일 09:00 KST |
| 12 | N-05 댓글 알림 발송 | 백엔드 | 댓글 작성 시 |
| 13 | N-06 생일 알림 cron | 백엔드 | 매일 09:00 KST, N-03과 통합 실행 |
| 14 | 알림 내역 API (GET /api/notifications) | 백엔드 | 페이지네이션 |
| 15 | 앱바 알림 아이콘 + 미읽음 배지 | 프론트 | 🔔 + 빨간 배지 |
| 16 | 알림 센터 화면 | 프론트 | 목록 + 읽음 처리 |
| 17 | 알림 설정 화면 | 프론트 | 환경설정 내 토글 UI |
| 18 | 홈 화면 추가 안내 배너 | 프론트 | iOS/Android 분기 |
| 19 | iOS 분기 처리 | 프론트 | standalone 체크 |

---

## 9. 기존 기획서와의 관계

이 문서는 `Docs/features/web-push-notification.md`의 **확장판**이다.

| 항목 | web-push-notification.md | 이 문서 (push-notification-plan.md) |
|------|--------------------------|--------------------------------------|
| 알림 유형 | N-01~N-05 | N-01~N-06 (생일 알림 추가) |
| DB 변경 | 테이블 3개 신규 | notification_settings에 birthday_push 컬럼 추가 |
| cron 작업 | N-03 리마인더만 | N-03 리마인더 + N-06 생일 알림 |
| 상세 수준 | 기본 설계 | 동일 (이 문서가 최신 통합본) |

**구현 시 이 문서를 기준으로 작업한다.**

---

## 10. 보안 및 에러 처리

| 항목 | 처리 방식 |
|------|----------|
| VAPID Private Key | 환경변수로만 관리 (코드/저장소 포함 금지) |
| 구독 검증 | endpoint URL 형식 검증 |
| 중복 발송 방지 | notification_log 체크 |
| 만료 구독 정리 | 410 Gone 시 즉시 삭제 |
| 인증 | 모든 알림 API는 JWT 필수 |
| 브라우저 미지원 | 구독 UI 숨김, 알림 센터만 제공 |
| 알림 권한 거부 | "설정에서 알림을 허용해주세요" 안내 |
| iOS 비-PWA 접속 | 홈 화면 추가 안내 배너 |
