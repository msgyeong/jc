-- 026: 전화번호 공개 범위 설정
-- phone_visibility: 'local' (같은 로컬만), 'district' (같은 지구), 'all' (전체 공개)

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_visibility VARCHAR(20) DEFAULT 'local';
