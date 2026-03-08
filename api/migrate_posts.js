/**
 * Migration: Add is_pinned to posts, parent_comment_id to comments
 * Run: node api/migrate_posts.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { query, pool } = require('./config/database');

async function migrate() {
  console.log('Running posts/comments migration...');

  // Add is_pinned to posts (if not exists)
  try {
    await query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false`);
    console.log('+ posts.is_pinned column OK');
  } catch (e) {
    console.log('  posts.is_pinned:', e.message);
  }

  // Add parent_comment_id to comments (if not exists)
  try {
    await query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_comment_id INTEGER REFERENCES comments(id) ON DELETE SET NULL`);
    console.log('+ comments.parent_comment_id column OK');
  } catch (e) {
    console.log('  comments.parent_comment_id:', e.message);
  }

  // Ensure post_reads table exists
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS post_reads (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      )
    `);
    console.log('+ post_reads table OK');
  } catch (e) {
    console.log('  post_reads:', e.message);
  }

  // Ensure likes table exists
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(member_id, post_id)
      )
    `);
    console.log('+ likes table OK');
  } catch (e) {
    console.log('  likes:', e.message);
  }

  console.log('Migration complete.');
  await pool.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
