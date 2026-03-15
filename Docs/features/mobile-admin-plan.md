# 앱 내 관리자 권한 기획서

> 작성일: 2026-03-15 | 작성자: 기획자 에이전트
> 우선순위: Must-have
> 선행 문서: `member-position-plan.md`, `member-dossier-plan.md`

---

## 1. 기능 개요 및 목적

관리자가 PC 없이도 앱(모바일 웹)에서 긴급 관리 업무를 처리할 수 있도록 하는 기능.

- **목적**: 외출/이동 중에도 회원 승인, 부적절 게시글 삭제, 긴급 푸시 발송 등 즉각 대응
- **원칙**: 관리자 웹에서 권한을 부여받은 사용자만 앱에서 관리 기능 사용 가능
- **핵심 설계**: 기존 `role` 체계를 유지하면서, 세부 권한을 `mobile_admin_permissions` 테이블로 분리
- **추가 전용 구현**: 기존 auth 미들웨어, API 로직을 변경하지 않고, 새로운 권한 체크 미들웨어를 **추가**

---

## 2. 권한 체계 상세

### 2-1. 기존 시스템 분석

| 구분 | 현재 상태 |
|------|----------|
| `users.role` | `super_admin`, `admin`, `member`, `pending` — JWT에 포함 |
| `authenticate` 미들웨어 | JWT 검증 → `req.user.role` 설정 |
| `requireRole(['admin', 'super_admin'])` | admin 이상만 허용 |
| `position_permissions` 테이블 | 존재하지만 **API에서 미사용** |
| `adminAuth` 미들웨어 | admin 경로 전용 (admin 롤 체크) |

### 2-2. 신규 권한 체계

```
┌──────────────────────────────────────────────────┐
│                 super_admin                       │
│  ─────────────────────────────────────────────── │
│  모든 앱 관리 권한 자동 보유                      │
│  관리자 웹: 모든 기능                             │
│  앱: 모든 관리 기능                               │
├──────────────────────────────────────────────────┤
│                   admin                           │
│  ─────────────────────────────────────────────── │
│  관리자 웹: 모든 기능 (기존 유지)                 │
│  앱: 개별 권한 부여/회수 가능                     │
│       (기본: 모든 앱 관리 권한 ON)                │
├──────────────────────────────────────────────────┤
│                  member                           │
│  ─────────────────────────────────────────────── │
│  관리자 웹: 접근 불가 (기존 유지)                 │
│  앱: 개별 권한 부여 가능                          │
│       (기본: 모든 앱 관리 권한 OFF)               │
│       (예: 회장 직책에게 member_approve 권한)     │
├──────────────────────────────────────────────────┤
│                  pending                          │
│  ─────────────────────────────────────────────── │
│  앱 관리 권한 부여 불가                           │
└──────────────────────────────────────────────────┘
```

### 2-3. 세부 권한 항목

| 권한 코드 | 설명 | 앱 관리 기능 |
|-----------|------|-------------|
| `member_approve` | 회원가입 승인/거부 | 대기 회원 목록 + 승인/거부 버튼 |
| `post_manage` | 게시글 수정/삭제 | 타인 게시글에 수정/삭제 버튼 표시 |
| `schedule_manage` | 일정 수정/삭제 | 타인 일정에 수정/삭제 버튼 표시 |
| `notice_manage` | 공지 작성/수정/삭제 | 공지 탭 FAB + 수정/삭제 기능 |
| `push_send` | 긴급 푸시 알림 발송 | 즉시 푸시 발송 화면 |

### 2-4. 역할별 기본 권한

| 역할 | member_approve | post_manage | schedule_manage | notice_manage | push_send |
|------|:-:|:-:|:-:|:-:|:-:|
| super_admin | ✅ 자동 | ✅ 자동 | ✅ 자동 | ✅ 자동 | ✅ 자동 |
| admin | ✅ 기본 ON | ✅ 기본 ON | ✅ 기본 ON | ✅ 기본 ON | ✅ 기본 ON |
| member | ❌ 기본 OFF | ❌ 기본 OFF | ❌ 기본 OFF | ❌ 기본 OFF | ❌ 기본 OFF |

- `super_admin`: 권한 테이블 조회 없이 항상 모든 권한 보유 (코드 레벨 보장)
- `admin`: 기본적으로 모든 앱 관리 권한 ON, super_admin이 개별 회수 가능
- `member`: 기본 OFF, 관리자가 필요한 권한만 개별 부여 가능

---

## 3. DB 스키마

### 3-1. mobile_admin_permissions 테이블 (신규)

```sql
CREATE TABLE mobile_admin_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(30) NOT NULL CHECK (
    permission IN ('member_approve', 'post_manage', 'schedule_manage', 'notice_manage', 'push_send')
  ),
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_by INTEGER REFERENCES users(id),      -- 권한 부여한 관리자
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

CREATE INDEX idx_mobile_admin_perms_user ON mobile_admin_permissions(user_id);
```

**설계 원칙**:
- 레코드가 없으면 → 해당 권한 없음 (member 기본)
- `granted = true` → 권한 있음
- `granted = false` → 권한 명시적 회수 (admin 기본 ON에서 개별 회수 시)
- `super_admin`은 이 테이블을 조회하지 않고 항상 권한 보유

### 3-2. mobile_admin_log 테이블 (권한 변경 이력)

```sql
CREATE TABLE mobile_admin_log (
  id SERIAL PRIMARY KEY,
  target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(30) NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('grant', 'revoke')),
  performed_by INTEGER NOT NULL REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mobile_admin_log_target ON mobile_admin_log(target_user_id);
CREATE INDEX idx_mobile_admin_log_created ON mobile_admin_log(created_at);
```

### 3-3. admin 역할 기본 권한 시드

```sql
-- admin 역할 사용자에게 모든 앱 관리 권한 기본 부여
INSERT INTO mobile_admin_permissions (user_id, permission, granted, granted_by)
SELECT u.id, p.permission, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM users u
CROSS JOIN (
  VALUES ('member_approve'), ('post_manage'), ('schedule_manage'), ('notice_manage'), ('push_send')
) AS p(permission)
WHERE u.role IN ('admin')
  AND NOT EXISTS (
    SELECT 1 FROM mobile_admin_permissions map
    WHERE map.user_id = u.id AND map.permission = p.permission
  );
```

### 3-4. 마이그레이션 파일

파일: `database/migrations/018_mobile_admin_permissions.sql`

```sql
-- 018: 앱 내 관리자 권한 테이블

-- 1. 앱 관리 권한 테이블
CREATE TABLE IF NOT EXISTS mobile_admin_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(30) NOT NULL CHECK (
    permission IN ('member_approve', 'post_manage', 'schedule_manage', 'notice_manage', 'push_send')
  ),
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_mobile_admin_perms_user ON mobile_admin_permissions(user_id);

-- 2. 권한 변경 이력 로그
CREATE TABLE IF NOT EXISTS mobile_admin_log (
  id SERIAL PRIMARY KEY,
  target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(30) NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('grant', 'revoke')),
  performed_by INTEGER NOT NULL REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_admin_log_target ON mobile_admin_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_admin_log_created ON mobile_admin_log(created_at);

-- 3. 기존 admin 사용자에게 기본 권한 시드
INSERT INTO mobile_admin_permissions (user_id, permission, granted, granted_by)
SELECT u.id, p.permission, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM users u
CROSS JOIN (
  VALUES ('member_approve'), ('post_manage'), ('schedule_manage'), ('notice_manage'), ('push_send')
) AS p(permission)
WHERE u.role IN ('admin', 'super_admin')
ON CONFLICT (user_id, permission) DO NOTHING;
```

---

## 4. 권한 체크 미들웨어 (신규 — 기존 변경 없음)

### 4-1. 새 미들웨어 파일

파일: `api/middleware/mobileAdmin.js`

```javascript
const db = require('../config/database');

/**
 * 앱 관리 권한 체크 미들웨어
 * - super_admin: 항상 통과
 * - admin/member: mobile_admin_permissions 테이블에서 granted=true 확인
 *
 * 사용법: requireMobilePermission('post_manage')
 */
function requireMobilePermission(permission) {
  return async (req, res, next) => {
    try {
      const { userId, role } = req.user;

      // super_admin은 항상 모든 권한 보유
      if (role === 'super_admin') {
        return next();
      }

      // DB에서 권한 조회
      const result = await db.query(
        `SELECT granted FROM mobile_admin_permissions
         WHERE user_id = $1 AND permission = $2`,
        [userId, permission]
      );

      if (result.rows.length === 0 || !result.rows[0].granted) {
        return res.status(403).json({
          success: false,
          error: '해당 관리 권한이 없습니다',
          code: 'MOBILE_PERMISSION_DENIED'
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * 현재 사용자의 앱 관리 권한 목록 조회 (프론트에서 UI 제어용)
 */
async function getMobilePermissions(userId, role) {
  const allPermissions = ['member_approve', 'post_manage', 'schedule_manage', 'notice_manage', 'push_send'];

  if (role === 'super_admin') {
    return allPermissions.reduce((acc, p) => ({ ...acc, [p]: true }), {});
  }

  const result = await db.query(
    `SELECT permission, granted FROM mobile_admin_permissions
     WHERE user_id = $1`,
    [userId]
  );

  const permissions = {};
  allPermissions.forEach(p => { permissions[p] = false; });
  result.rows.forEach(row => { permissions[row.permission] = row.granted; });

  return permissions;
}

module.exports = { requireMobilePermission, getMobilePermissions };
```

### 4-2. 기존 미들웨어와의 관계

```
┌─ 기존 (변경 없음) ──────────────────────────┐
│                                              │
│  authenticate → req.user 설정               │
│  requireRole(['admin']) → 관리자 웹 전용     │
│  adminAuth → 관리자 API 보호                │
│                                              │
└──────────────────────────────────────────────┘

┌─ 신규 (추가) ────────────────────────────────┐
│                                              │
│  requireMobilePermission('post_manage')      │
│    → 앱에서 관리 기능 사용 시 체크           │
│    → authenticate 이후에 체인               │
│    → 기존 미들웨어와 독립적                  │
│                                              │
└──────────────────────────────────────────────┘
```

**적용 예시**:
```javascript
// 기존 (변경 없음): 일반 게시글 삭제 — 본인만 가능
router.delete('/:id', authenticate, deleteOwnPost);

// 신규 (추가): 앱 관리자 게시글 삭제 — 권한 있는 사용자
router.delete('/:id/admin-delete', authenticate, requireMobilePermission('post_manage'), adminDeletePost);
```

---

## 5. API 엔드포인트 설계

### 5-1. 앱 — 내 권한 조회

```
GET /api/auth/my-permissions
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "role": "admin",
    "mobile_permissions": {
      "member_approve": true,
      "post_manage": true,
      "schedule_manage": true,
      "notice_manage": true,
      "push_send": true
    },
    "has_any_permission": true
  }
}
```

- 로그인 직후 + 앱 시작 시 호출하여 UI 제어에 사용
- `has_any_permission = true`이면 관리 메뉴 표시

### 5-2. 앱 — 회원 승인/거부 (member_approve)

```
GET /api/mobile-admin/pending-members
Headers: Authorization: Bearer <token>
Response: {
  "success": true,
  "data": {
    "items": [
      {
        "id": 15,
        "name": "신청자",
        "email": "new@example.com",
        "phone": "010-9999-8888",
        "created_at": "2026-03-14T10:00:00Z",
        "recommender": "김영등"
      }
    ],
    "total": 3
  }
}

POST /api/mobile-admin/members/:id/approve
Headers: Authorization: Bearer <token>
Response: { "success": true, "data": { "name": "신청자", "status": "active" } }

POST /api/mobile-admin/members/:id/reject
Headers: Authorization: Bearer <token>
Body: { "reason": "가입 조건 미충족" }
Response: { "success": true }
```

### 5-3. 앱 — 게시글 관리 (post_manage)

```
PUT /api/mobile-admin/posts/:id
Headers: Authorization: Bearer <token>
Body: { "title": "수정된 제목", "content": "수정된 내용" }
Response: { "success": true }

DELETE /api/mobile-admin/posts/:id
Headers: Authorization: Bearer <token>
Body: { "reason": "부적절한 내용" }  // 선택
Response: { "success": true }
```

- 기존 `POST /DELETE /api/posts/:id` (본인 글 전용)과 별도 경로
- 관리 삭제 시 `notification_log`에 기록 (삭제 알림은 Phase 2)

### 5-4. 앱 — 일정 관리 (schedule_manage)

```
PUT /api/mobile-admin/schedules/:id
Headers: Authorization: Bearer <token>
Body: { "title": "수정", "start_date": "2026-03-20" }
Response: { "success": true }

DELETE /api/mobile-admin/schedules/:id
Headers: Authorization: Bearer <token>
Response: { "success": true }
```

### 5-5. 앱 — 공지 관리 (notice_manage)

```
POST /api/mobile-admin/notices
Headers: Authorization: Bearer <token>
Body: {
  "title": "긴급 공지",
  "content": "내용...",
  "is_pinned": false,
  "notification_setting": { "type": "immediate" }
}
Response: { "success": true, "data": { "id": 42 } }

PUT /api/mobile-admin/notices/:id
DELETE /api/mobile-admin/notices/:id
```

- 내부적으로 `posts` 테이블에 `category='notice'`로 저장 (기존 로직 재활용)

### 5-6. 앱 — 긴급 푸시 발송 (push_send)

```
POST /api/mobile-admin/push/send
Headers: Authorization: Bearer <token>
Body: {
  "title": "긴급 공지",
  "body": "오늘 모임 장소가 변경되었습니다. 영등포구청 3층으로 변경.",
  "target": "all",           // "all" | "position" | "department"
  "target_value": null,      // target별 필터 값 (position_id, department명)
  "linked_post_id": null     // 클릭 시 이동할 게시글 (선택)
}
Response: {
  "success": true,
  "data": {
    "sent_count": 28,
    "failed_count": 2
  }
}
```

**발송 대상 옵션**:
| target | target_value | 대상 |
|--------|-------------|------|
| `all` | null | 전체 활성 회원 |
| `position` | position_id | 특정 직책 회원 |
| `department` | "제1분과" | 특정 분과 회원 |

### 5-7. 관리자 웹 — 권한 관리

```
GET /api/admin/members/:id/mobile-permissions
Headers: Authorization: Bearer <admin-token>
Response: {
  "success": true,
  "data": {
    "user_id": 5,
    "name": "이청년",
    "role": "member",
    "permissions": {
      "member_approve": false,
      "post_manage": true,
      "schedule_manage": false,
      "notice_manage": false,
      "push_send": false
    }
  }
}

PUT /api/admin/members/:id/mobile-permissions
Headers: Authorization: Bearer <admin-token>
Body: {
  "permissions": {
    "member_approve": true,
    "post_manage": true,
    "schedule_manage": false,
    "notice_manage": false,
    "push_send": false
  },
  "reason": "회장 직책에 따른 권한 부여"
}
Response: { "success": true }
```

**서버 로직**:
1. 각 permission에 대해 UPSERT (`INSERT ON CONFLICT UPDATE`)
2. 변경된 항목마다 `mobile_admin_log`에 grant/revoke 기록
3. super_admin만 admin의 권한을 변경 가능
4. admin은 member의 권한만 변경 가능

### 5-8. 관리자 웹 — 권한 변경 이력

```
GET /api/admin/mobile-admin-log?page=1&limit=20&user_id=5
Headers: Authorization: Bearer <admin-token>
Response: {
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "target_user": { "id": 5, "name": "이청년" },
        "permission": "member_approve",
        "action": "grant",
        "performed_by": { "id": 1, "name": "김관리자" },
        "reason": "회장 직책에 따른 권한 부여",
        "created_at": "2026-03-15T10:00:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "totalPages": 1
  }
}
```

### 5-9. API 권한 정리

| API | 필요 권한 | 비고 |
|-----|----------|------|
| GET /auth/my-permissions | 로그인 사용자 | UI 제어용 |
| GET /mobile-admin/pending-members | member_approve | |
| POST /mobile-admin/members/:id/approve | member_approve | |
| POST /mobile-admin/members/:id/reject | member_approve | |
| PUT /mobile-admin/posts/:id | post_manage | |
| DELETE /mobile-admin/posts/:id | post_manage | |
| PUT /mobile-admin/schedules/:id | schedule_manage | |
| DELETE /mobile-admin/schedules/:id | schedule_manage | |
| POST /mobile-admin/notices | notice_manage | |
| PUT /mobile-admin/notices/:id | notice_manage | |
| DELETE /mobile-admin/notices/:id | notice_manage | |
| POST /mobile-admin/push/send | push_send | |
| GET /admin/members/:id/mobile-permissions | admin 웹 (requireRole) | |
| PUT /admin/members/:id/mobile-permissions | admin 웹 (requireRole) | |
| GET /admin/mobile-admin-log | admin 웹 (requireRole) | |

---

## 6. 관리자 웹 UI — 권한 관리 화면

### 6-1. 회원 상세 / 인물카드 내 권한 섹션

```
┌─────────────────────────────────────────────────────┐
│  ← 회원 상세: 이청년                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ... (기존 회원 정보) ...                            │
│                                                     │
│  ─── 📱 앱 관리 권한 ──────────────────────────────  │
│                                                     │
│  현재 역할: member                                   │
│                                                     │
│  회원 승인/거부     member_approve        [OFF]     │
│  게시글 관리       post_manage            [ON ]     │
│  일정 관리         schedule_manage        [OFF]     │
│  공지 관리         notice_manage          [OFF]     │
│  긴급 푸시 발송    push_send              [OFF]     │
│                                                     │
│  변경 사유 (선택)                                    │
│  ┌───────────────────────────────────────────┐     │
│  │ 회장 직책에 따른 게시글 관리 권한 부여     │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │              권한 저장                     │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ─── 권한 변경 이력 ───────────────────────────── │
│                                                     │
│  2026-03-15 10:00  member_approve 부여              │
│    by 김관리자 — "회장 직책 부여"                    │
│                                                     │
│  2026-03-10 14:00  post_manage 부여                 │
│    by 김관리자 — "게시글 관리 위임"                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 6-2. 권한 변경 시 확인 다이얼로그

```
┌─────────────────────────────────────────┐
│  권한 변경 확인                          │
│                                         │
│  이청년님의 앱 관리 권한을               │
│  다음과 같이 변경합니다:                 │
│                                         │
│  ✅ 추가: member_approve (회원 승인)    │
│  ❌ 회수: (없음)                        │
│                                         │
│        [취소]    [확인]                  │
└─────────────────────────────────────────┘
```

### 6-3. 관리자 대시보드 — 권한 현황 위젯

```
┌─────────────────────────────────────────┐
│  📱 앱 관리 권한 현황                    │
├─────────────────────────────────────────┤
│                                         │
│  총 권한 보유자: 5명                     │
│                                         │
│  김관리자  (super_admin)  5/5 권한      │
│  이청년    (member)       2/5 권한      │
│  박부회장  (member)       1/5 권한      │
│                                         │
│  [상세 보기]                            │
│                                         │
└─────────────────────────────────────────┘
```

---

## 7. 앱 UI — 관리 기능 화면

### 7-1. 관리 메뉴 진입점

**방식**: 하단 탭의 **프로필** 화면에 관리 메뉴 추가 (권한 보유 시만 표시)

```
┌─────────────────────────────────────────┐
│  프로필                                  │
├─────────────────────────────────────────┤
│                                         │
│  [프로필 사진]                          │
│  김영등 · 회장                          │
│                                         │
│  ─── 나의 메뉴 ────────────────────── │
│                                         │
│  📝 내 정보 수정                    >  │
│  ⚙️ 환경설정                        >  │
│                                         │
│  ─── 관리 ──────────────────────────  │  ← 권한 보유 시만 표시
│                                         │
│  🛡️ 앱 관리                         >  │  ← 관리 허브 진입
│                                         │
│  ─── 정보 ──────────────────────────  │
│  ...                                    │
│                                         │
└─────────────────────────────────────────┘
```

### 7-2. 앱 관리 허브 화면

```
┌─────────────────────────────────────────┐
│  ← 앱 관리                              │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  👤 회원 승인 대기           3   │  │  ← member_approve 권한 시
│  │     승인 대기 중인 회원 목록      │  │     배지: 대기 건수
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  📢 공지 관리                    │  │  ← notice_manage 권한 시
│  │     공지 작성/수정/삭제           │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  📣 긴급 푸시 발송               │  │  ← push_send 권한 시
│  │     즉시 전체/그룹 알림 발송      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  게시글/일정 관리는 각 화면에서         │
│  인라인으로 제공됩니다.                 │
│                                         │
└─────────────────────────────────────────┘
```

- 보유한 권한에 해당하는 메뉴만 표시
- `post_manage`, `schedule_manage`는 허브 대신 각 게시글/일정 상세 화면에서 인라인 표시

### 7-3. 회원 승인 대기 화면 (member_approve)

```
┌─────────────────────────────────────────┐
│  ← 회원 승인 대기                        │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  신청자1                         │  │
│  │  new1@example.com                │  │
│  │  010-1234-5678                   │  │
│  │  추천인: 김영등                   │  │
│  │  신청일: 2026-03-14              │  │
│  │                                  │  │
│  │  [거부]              [승인]      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  신청자2                         │  │
│  │  new2@example.com                │  │
│  │  ...                             │  │
│  │  [거부]              [승인]      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  대기 중인 회원이 없습니다.             │  ← 빈 상태
│                                         │
└─────────────────────────────────────────┘
```

#### 거부 시 사유 입력
```
┌─────────────────────────────────────────┐
│  가입 거부                               │
│                                         │
│  거부 사유 (필수)                        │
│  ┌─────────────────────────────────┐   │
│  │ 가입 조건을 충족하지 않습니다.   │   │
│  └─────────────────────────────────┘   │
│                                         │
│        [취소]    [거부 확인]             │
└─────────────────────────────────────────┘
```

### 7-4. 게시글 인라인 관리 (post_manage)

```
┌─────────────────────────────────────────┐
│  [게시글 상세]                          │
│                                         │
│  김회원님의 게시글                       │
│  제목: 안녕하세요                        │
│  내용: ...                              │
│                                         │
│  ─────────────────────────────────────  │
│  💬 댓글 5  ❤️ 3                       │
│                                         │
│  ─── 🛡️ 관리 ────────────────────────  │  ← post_manage 권한 시 표시
│  [수정]  [삭제]                         │
│                                         │
└─────────────────────────────────────────┘
```

- 본인 글이 아니어도 수정/삭제 버튼 표시
- 삭제 시 확인 + 사유 입력 (선택)
- 관리 삭제임을 표시하는 배지/라벨

### 7-5. 긴급 푸시 발송 화면 (push_send)

```
┌─────────────────────────────────────────┐
│  ← 긴급 푸시 발송                        │
├─────────────────────────────────────────┤
│                                         │
│  제목 (필수)                             │
│  ┌─────────────────────────────────┐   │
│  │ 긴급: 모임 장소 변경             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  내용 (필수)                             │
│  ┌─────────────────────────────────┐   │
│  │ 오늘 모임 장소가 변경되었습니다. │   │
│  │ 영등포구청 3층 → 5층 대회의실   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  발송 대상                               │
│  ┌─────────────────────────────────┐   │
│  │ ● 전체 회원                     │   │
│  │ ○ 직책별                        │   │
│  │ ○ 분과별                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ⚠️ 즉시 발송됩니다. 신중히 작성하세요. │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │          📣 발송하기             │   │  ← 빨간색 강조 버튼
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 7-6. 발송 확인 다이얼로그

```
┌─────────────────────────────────────────┐
│  ⚠️ 긴급 푸시 발송                      │
│                                         │
│  전체 회원 33명에게 즉시 발송됩니다.      │
│                                         │
│  제목: 긴급: 모임 장소 변경              │
│  내용: 오늘 모임 장소가 변경...          │
│                                         │
│        [취소]    [발송 확인]             │
└─────────────────────────────────────────┘
```

---

## 8. 보안 체크리스트

### 8-1. API 보안

| # | 항목 | 구현 방식 |
|---|------|----------|
| 1 | **API 레벨 권한 체크** | `requireMobilePermission()` 미들웨어 — 프론트 숨기기만으로 불충분 |
| 2 | **super_admin 바이패스** | 코드에서 `role === 'super_admin'` 시 DB 조회 없이 통과 |
| 3 | **JWT에 권한 미포함** | 권한은 DB 실시간 조회 (캐시 X) — 권한 변경 즉시 반영 |
| 4 | **SQL 인젝션 방지** | 모든 쿼리 파라미터화 ($1, $2) |
| 5 | **권한 변경 감사 로그** | `mobile_admin_log` 테이블에 모든 grant/revoke 기록 |
| 6 | **권한 부여 제한** | admin은 member에게만 권한 부여 가능, admin 간 권한 변경은 super_admin만 |

### 8-2. 권한 변경 즉시 반영

```
관리자 웹에서 권한 변경
    ↓
mobile_admin_permissions 테이블 UPDATE
    ↓
앱에서 다음 API 호출 시
    ↓
requireMobilePermission() → DB 실시간 조회
    ↓
권한 즉시 반영 (토큰 재발급 불필요)
```

**설계 결정**: JWT에 권한을 포함하지 않음
- 이유: JWT에 넣으면 권한 변경 시 토큰 재발급 필요 → 즉시 반영 불가
- 트레이드오프: DB 조회 1회 추가 (성능 영향 미미 — 33명 소규모)
- 프론트엔드: `GET /auth/my-permissions`를 앱 시작 + 관리 메뉴 진입 시 호출하여 UI 갱신

### 8-3. 권한 부여 권한 제한

```
┌─────────────────────────────────────────────────┐
│  누가 → 누구에게 권한 부여/회수할 수 있는가?     │
├─────────────────────────────────────────────────┤
│                                                 │
│  super_admin → admin   : 모든 권한 부여/회수    │
│  super_admin → member  : 모든 권한 부여/회수    │
│  admin       → member  : 모든 권한 부여/회수    │
│  admin       → admin   : ❌ 불가               │
│  member      → anyone  : ❌ 불가               │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 8-4. 추가 보안 조치

| 항목 | 설명 |
|------|------|
| 푸시 발송 확인 | 발송 전 확인 다이얼로그 필수 (더블 체크) |
| 삭제 사유 기록 | 관리 삭제 시 사유를 audit_log에 기록 |
| 게시글 soft delete | 관리 삭제 = `is_deleted = true` (복구 가능) |
| 일정 삭제 주의 | 참석 데이터 CASCADE — 삭제 전 경고 |
| Rate limit | 긴급 푸시: 1시간에 최대 5건 (남용 방지) |

---

## 9. 기존 시스템과의 관계

### 9-1. 추가 전용 구현 원칙

| 기존 요소 | 변경 여부 | 설명 |
|-----------|----------|------|
| `authenticate` 미들웨어 | **변경 없음** | JWT 검증 로직 동일 |
| `requireRole()` 미들웨어 | **변경 없음** | 기존 admin 웹 보호 동일 |
| `adminAuth` 미들웨어 | **변경 없음** | 기존 관리자 API 동일 |
| JWT 토큰 구조 | **변경 없음** | userId, email, role — 동일 |
| `api/routes/posts.js` | **변경 없음** | 기존 본인 글 CRUD 동일 |
| `api/routes/admin.js` | **추가만** | 권한 관리 엔드포인트 추가 |
| `position_permissions` 테이블 | **변경 없음** | 기존 테이블 독립 유지 |

### 9-2. 새로 추가되는 요소

| 신규 요소 | 위치 |
|-----------|------|
| `requireMobilePermission()` | `api/middleware/mobileAdmin.js` |
| `mobile_admin_permissions` 테이블 | `database/migrations/018_...` |
| `mobile_admin_log` 테이블 | `database/migrations/018_...` |
| `api/routes/mobile-admin.js` | 앱 관리 API 라우트 |
| `web/js/mobile-admin.js` | 앱 관리 UI 모듈 |
| 관리자 웹 권한 관리 섹션 | `web/admin/js/members.js` 확장 |

### 9-3. position_permissions와의 관계

```
position_permissions (기존)     mobile_admin_permissions (신규)
─────────────────────         ──────────────────────────────
직책(position)별 권한           개인(user)별 앱 관리 권한
관리자 웹 기능에 초점            앱(모바일) 관리 기능에 초점
현재 API에서 미사용              이 기획에서 활성 사용
향후 position 기반 확장 가능     즉시 구현
```

- 두 시스템은 독립 운영
- 향후 Phase 3에서 `position_permissions` 기반으로 자동 매핑 가능 (예: 회장 position → member_approve 자동 부여)

---

## 10. 프론트엔드 구현 가이드

### 10-1. 권한 상태 관리

```javascript
// 앱 시작 시 + 관리 메뉴 진입 시 호출
async function loadMyPermissions() {
  const res = await apiClient.get('/api/auth/my-permissions');
  if (res.success) {
    window.__mobilePermissions = res.data.mobile_permissions;
    window.__hasAnyPermission = res.data.has_any_permission;
    updateAdminUI();  // 관리 메뉴 표시/숨김
  }
}

// 권한 체크 헬퍼
function hasMobilePermission(permission) {
  return window.__mobilePermissions?.[permission] === true;
}
```

### 10-2. UI 조건부 렌더링

```javascript
// 프로필 화면 — 관리 메뉴 표시
if (window.__hasAnyPermission) {
  profileMenu.insertAdjacentHTML('beforeend', `
    <div class="menu-section">
      <div class="menu-section-title">관리</div>
      <div class="menu-item" onclick="navigateTo('mobile-admin')">
        🛡️ 앱 관리
      </div>
    </div>
  `);
}

// 게시글 상세 — 관리 삭제 버튼
if (hasMobilePermission('post_manage') && post.author_id !== currentUserId) {
  postActions.insertAdjacentHTML('beforeend', `
    <button class="btn-admin-action" onclick="adminDeletePost(${post.id})">
      🛡️ 삭제
    </button>
  `);
}
```

### 10-3. 파일 구조

```
web/js/
├── mobile-admin.js         # 관리 허브 + 권한 로딩 (신규)
├── mobile-admin-members.js # 회원 승인 화면 (신규)
├── mobile-admin-push.js    # 긴급 푸시 화면 (신규)
└── app.js                  # loadMyPermissions() 호출 추가
```

---

## 11. 구현 우선순위

### Phase 1 — 핵심 (긴급 관리 기능)

| 순서 | 작업 | 담당 | 설명 |
|------|------|------|------|
| 1 | DB 마이그레이션 (018) | 백엔드 | mobile_admin_permissions + log |
| 2 | `requireMobilePermission()` 미들웨어 | 백엔드 | `mobileAdmin.js` |
| 3 | GET /auth/my-permissions | 백엔드 | 권한 조회 API |
| 4 | 회원 승인/거부 API | 백엔드 | mobile-admin 라우트 |
| 5 | 게시글/일정 관리 삭제 API | 백엔드 | post_manage, schedule_manage |
| 6 | 관리자 웹 — 권한 부여 UI | 프론트 (admin) | 토글 스위치 + 저장 |
| 7 | 앱 — 관리 허브 화면 | 프론트 | 프로필 → 관리 메뉴 |
| 8 | 앱 — 회원 승인 대기 화면 | 프론트 | 목록 + 승인/거부 |
| 9 | 앱 — 게시글/일정 인라인 관리 버튼 | 프론트 | 권한 기반 표시 |

### Phase 2 — 확장

| 순서 | 작업 | 담당 | 설명 |
|------|------|------|------|
| 10 | 공지 관리 API (notice_manage) | 백엔드 | 작성/수정/삭제 |
| 11 | 긴급 푸시 발송 API (push_send) | 백엔드 | 대상별 발송 |
| 12 | 앱 — 긴급 푸시 발송 화면 | 프론트 | 제목/내용/대상 + 확인 |
| 13 | 관리자 웹 — 권한 변경 이력 화면 | 프론트 (admin) | 감사 로그 |
| 14 | 관리자 대시보드 — 권한 현황 위젯 | 프론트 (admin) | 요약 카드 |
| 15 | position 기반 자동 권한 매핑 | 백엔드 | 직책 변경 시 권한 자동 부여/회수 |
| 16 | 푸시 Rate limit | 백엔드 | 1시간 5건 제한 |

---

## 12. FAQ

**Q: position_permissions 테이블을 왜 안 쓰나요?**
A: position_permissions는 직책(position) 기반이므로, 같은 직책의 모든 회원에게 일괄 적용됩니다. 앱 관리 권한은 개인별로 세밀하게 제어해야 하므로 별도 테이블(mobile_admin_permissions)을 사용합니다. 향후 직책 변경 시 자동 매핑 기능으로 연결할 수 있습니다.

**Q: 기존 admin 역할과 뭐가 다른가요?**
A: 기존 admin 역할은 관리자 웹에 접속하는 데 필요합니다. mobile_admin_permissions는 앱(모바일 웹)에서 특정 관리 기능을 사용할 수 있는지를 제어합니다. admin이 아닌 일반 member에게도 특정 앱 관리 권한을 부여할 수 있습니다.

**Q: 권한 변경 후 앱에 바로 반영되나요?**
A: 네. JWT에 권한을 포함하지 않고, 매 API 호출마다 DB에서 실시간 조회하므로 즉시 반영됩니다. 프론트 UI는 `GET /auth/my-permissions` 재호출로 갱신합니다.
