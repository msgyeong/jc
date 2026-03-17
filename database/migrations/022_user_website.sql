-- 회원 홈페이지 URL 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(500);
