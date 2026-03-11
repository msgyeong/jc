-- 008: 시스템 설정 테이블
-- 단일 row 방식 (id=1 고정)

CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    app_name VARCHAR(100) DEFAULT '영등포 JC',
    app_description TEXT DEFAULT '회원관리 커뮤니티 앱',
    require_approval BOOLEAN DEFAULT false,
    default_role VARCHAR(20) DEFAULT 'member',
    push_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER
);

-- 기본값 삽입 (충돌 시 무시)
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
