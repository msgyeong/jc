-- Migration 020: 앱 내 관리자 권한 시스템
-- Date: 2026-03-15

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

-- 3. 기존 admin/super_admin 사용자에게 기본 권한 시드
INSERT INTO mobile_admin_permissions (user_id, permission, granted, granted_by)
SELECT u.id, p.permission, true, (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM users u
CROSS JOIN (
  VALUES ('member_approve'), ('post_manage'), ('schedule_manage'), ('notice_manage'), ('push_send')
) AS p(permission)
WHERE u.role IN ('admin', 'super_admin')
ON CONFLICT (user_id, permission) DO NOTHING;
