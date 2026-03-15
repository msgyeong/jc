-- Migration 018: 직종(profession) 컬럼 추가
-- Date: 2026-03-15

ALTER TABLE users ADD COLUMN IF NOT EXISTS profession VARCHAR(100);
COMMENT ON COLUMN users.profession IS '직종 (변호사, 한의사, 개발자, PD 등 - 직장 직위가 아닌 직업 분류)';
