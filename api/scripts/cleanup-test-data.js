/**
 * 테스트 데이터 전체 삭제 — 보존: admin(1), 경민수(38), 김우연(39)
 * 전략: 모든 FK 참조 테이블을 TRUNCATE CASCADE로 정리 후 회원 삭제
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
const q = (text) => pool.query(text);

async function main() {
  console.log('=== 전체 정리 시작 ===\n');

  // users를 참조하는 모든 테이블 데이터 삭제 (순서 중요: 자식 → 부모)
  const tables = [
    // 댓글/좋아요/읽음 (최하위)
    'club_post_comments', 'club_post_reads',
    'group_comment_likes', 'group_post_comments', 'group_post_likes', 'group_post_reads', 'group_post_attendance',
    'post_likes', 'post_reads', 'post_attendance', 'post_images',
    'comments', 'likes', 'read_status',
    // 출석/참석
    'schedule_attendance', 'notice_attendance', 'attendance_votes', 'attendance_config',
    'meeting_vote_responses', 'meeting_votes', 'meeting_minutes', 'meeting_attendance',
    // 게시글/일정
    'club_posts', 'club_schedules',
    'group_posts', 'group_schedules',
    'posts', 'notices', 'schedules', 'meetings',
    // 소모임
    'club_members', 'clubs',
    // 관리/로그
    'mobile_admin_log', 'mobile_admin_permissions',
    'audit_log', 'push_send_log', 'notification_log', 'scheduled_notifications',
    // 회원 관련
    'sessions', 'push_subscriptions', 'notification_settings', 'user_settings',
    'favorites', 'member_activities',
    'member_group_items', 'member_groups',
    'orgchart_members', 'position_history', 'title_history',
    'site_content',
  ];

  for (const table of tables) {
    try {
      const r = await q(`DELETE FROM ${table}`);
      if (r.rowCount > 0) console.log(`  ${table}: ${r.rowCount}개 삭제`);
    } catch(e) {
      // 테이블이 없거나 에러 시 무시
    }
  }

  // 회원 삭제
  console.log('\n회원 삭제 (보존 3명 제외)...');
  const r = await q('DELETE FROM users WHERE id NOT IN (1, 38, 39)');
  console.log(`  삭제: ${r.rowCount}명`);

  // 확인
  console.log('\n=== 결과 ===');
  const remaining = await q('SELECT id, name, email, role FROM users ORDER BY id');
  remaining.rows.forEach(u => console.log(`  [${u.id}] ${u.name} (${u.email}) — ${u.role}`));

  await pool.end();
  process.exit(0);
}

main().catch(err => { console.error(err); pool.end(); process.exit(1); });
