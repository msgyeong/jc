-- Migration 019: 게시글 이미지 DB 저장 (Railway ephemeral filesystem 대응)
-- Date: 2026-03-15

CREATE TABLE IF NOT EXISTS post_images (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
  image_data BYTEA NOT NULL,
  file_size INTEGER,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_images_filename ON post_images(filename);
