-- 011: 생일 알림 설정 컬럼 추가
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS birthday_push BOOLEAN DEFAULT true;
