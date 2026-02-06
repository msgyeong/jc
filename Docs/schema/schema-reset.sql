-- ============================================
-- 스키마 초기화 (기존 테이블/객체 삭제)
-- ============================================
--
-- 사용 방법:
-- 1. 먼저 이 파일(schema-reset.sql)을 Supabase SQL Editor에서 실행
-- 2. 그 다음 schema.sql을 실행하여 최신 스키마 적용
--
-- 주의: 실행 시 모든 테이블과 데이터가 삭제됩니다.
--       운영 DB에서는 사용하지 마세요.
-- ============================================

-- 1. 트리거/함수 사용 중인 테이블부터 삭제
--    (CASCADE로 FK 의존 테이블 함께 삭제)

DROP TABLE IF EXISTS read_status CASCADE;
DROP TABLE IF EXISTS attendance_surveys CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS education_history CASCADE;
DROP TABLE IF EXISTS disciplinary_actions CASCADE;
DROP TABLE IF EXISTS jc_careers CASCADE;
DROP TABLE IF EXISTS international_competitions CASCADE;
DROP TABLE IF EXISTS awards CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS children CASCADE;
DROP TABLE IF EXISTS families CASCADE;
DROP TABLE IF EXISTS careers CASCADE;
DROP TABLE IF EXISTS educations CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- 2. ENUM 타입 삭제
DROP TYPE IF EXISTS attendance_status CASCADE;

-- 3. 함수 삭제 (트리거가 참조하던 함수들)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_comment_count() CASCADE;
DROP FUNCTION IF EXISTS update_like_count() CASCADE;
