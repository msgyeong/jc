-- 029: 사업 PR 기능 (한 줄 PR, 서비스 설명, SNS 링크)
ALTER TABLE users ADD COLUMN IF NOT EXISTS one_line_pr TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS service_description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sns_links JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN users.one_line_pr IS '한 줄 PR (예: 프리미엄 IT 서비스)';
COMMENT ON COLUMN users.service_description IS '주요 서비스 설명 (예: 웹개발, 앱개발)';
COMMENT ON COLUMN users.sns_links IS 'SNS 링크 배열 [{type, handle}]';
