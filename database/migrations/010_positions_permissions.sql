-- Migration 010: Positions & Permissions + Schedule Views
-- Date: 2026-03-11

-- 1. positions 테이블
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    level INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. position_permissions 테이블
CREATE TABLE IF NOT EXISTS position_permissions (
    id SERIAL PRIMARY KEY,
    position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT true,
    UNIQUE(position_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_position_permissions_position ON position_permissions(position_id);

-- 3. Seed data: positions
INSERT INTO positions (name, level, description) VALUES
    ('회장', 6, '최고 의결권자'),
    ('수석부회장', 5, '회장 부재 시 대행'),
    ('부회장', 4, '분과 총괄'),
    ('총무', 3, '사무/재정 총괄'),
    ('이사', 2, '분과 운영'),
    ('감사', 2, '감사/감독'),
    ('일반회원', 1, '일반 회원')
ON CONFLICT (name) DO NOTHING;

-- 4. Seed data: permissions for each position
-- 권한 목록:
--   member.view, member.edit, member.approve, member.delete
--   post.create, post.edit, post.delete, post.pin
--   notice.create, notice.edit, notice.delete, notice.pin
--   schedule.create, schedule.edit, schedule.delete
--   comment.delete
--   admin.access, admin.settings

-- 회장 (level 6) — 전체 권한
INSERT INTO position_permissions (position_id, permission, granted)
SELECT p.id, perm, true
FROM positions p,
     UNNEST(ARRAY[
         'member.view', 'member.edit', 'member.approve', 'member.delete',
         'post.create', 'post.edit', 'post.delete', 'post.pin',
         'notice.create', 'notice.edit', 'notice.delete', 'notice.pin',
         'schedule.create', 'schedule.edit', 'schedule.delete',
         'comment.delete',
         'admin.access', 'admin.settings'
     ]) AS perm
WHERE p.name = '회장'
ON CONFLICT (position_id, permission) DO NOTHING;

-- 수석부회장 (level 5) — 전체 권한
INSERT INTO position_permissions (position_id, permission, granted)
SELECT p.id, perm, true
FROM positions p,
     UNNEST(ARRAY[
         'member.view', 'member.edit', 'member.approve', 'member.delete',
         'post.create', 'post.edit', 'post.delete', 'post.pin',
         'notice.create', 'notice.edit', 'notice.delete', 'notice.pin',
         'schedule.create', 'schedule.edit', 'schedule.delete',
         'comment.delete',
         'admin.access', 'admin.settings'
     ]) AS perm
WHERE p.name = '수석부회장'
ON CONFLICT (position_id, permission) DO NOTHING;

-- 부회장 (level 4)
INSERT INTO position_permissions (position_id, permission, granted)
SELECT p.id, perm, true
FROM positions p,
     UNNEST(ARRAY[
         'member.view', 'member.edit', 'member.approve',
         'post.create', 'post.edit', 'post.delete', 'post.pin',
         'notice.create', 'notice.edit', 'notice.delete', 'notice.pin',
         'schedule.create', 'schedule.edit', 'schedule.delete',
         'comment.delete',
         'admin.access'
     ]) AS perm
WHERE p.name = '부회장'
ON CONFLICT (position_id, permission) DO NOTHING;

-- 총무 (level 3)
INSERT INTO position_permissions (position_id, permission, granted)
SELECT p.id, perm, true
FROM positions p,
     UNNEST(ARRAY[
         'member.view', 'member.edit',
         'post.create', 'post.edit', 'post.pin',
         'notice.create', 'notice.edit', 'notice.pin',
         'schedule.create', 'schedule.edit',
         'comment.delete',
         'admin.access'
     ]) AS perm
WHERE p.name = '총무'
ON CONFLICT (position_id, permission) DO NOTHING;

-- 이사 (level 2)
INSERT INTO position_permissions (position_id, permission, granted)
SELECT p.id, perm, true
FROM positions p,
     UNNEST(ARRAY[
         'member.view',
         'post.create', 'post.edit',
         'notice.create', 'notice.edit',
         'schedule.create', 'schedule.edit'
     ]) AS perm
WHERE p.name = '이사'
ON CONFLICT (position_id, permission) DO NOTHING;

-- 감사 (level 2)
INSERT INTO position_permissions (position_id, permission, granted)
SELECT p.id, perm, true
FROM positions p,
     UNNEST(ARRAY[
         'member.view',
         'post.create', 'post.edit',
         'admin.access'
     ]) AS perm
WHERE p.name = '감사'
ON CONFLICT (position_id, permission) DO NOTHING;

-- 일반회원 (level 1) — 기본 조회/작성만
INSERT INTO position_permissions (position_id, permission, granted)
SELECT p.id, perm, true
FROM positions p,
     UNNEST(ARRAY[
         'member.view',
         'post.create'
     ]) AS perm
WHERE p.name = '일반회원'
ON CONFLICT (position_id, permission) DO NOTHING;

-- 5. schedules 테이블에 views 컬럼 추가
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
