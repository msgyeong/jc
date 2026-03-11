-- 009_db_cleanup.sql
-- DB 클린업: likes.member_id → user_id 통일 + comments.parent_comment_id 레거시 컬럼 삭제
-- 실행일: 2026-03-11

-- 1. likes 테이블: member_id → user_id 통일
ALTER TABLE likes RENAME COLUMN member_id TO user_id;

-- 2. comments 테이블: parent_comment_id 레거시 컬럼 삭제 (parent_id만 사용)
ALTER TABLE comments DROP COLUMN IF EXISTS parent_comment_id;
