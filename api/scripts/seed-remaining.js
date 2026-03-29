/**
 * 남은 시드 데이터: 참석/댓글/좋아요 (회원+게시글+일정+공지는 이미 생성됨)
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
const q = (text, params) => pool.query(text, params);
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function main() {
  // 시드 회원 ID 조회
  const memberRes = await q("SELECT id FROM users WHERE email LIKE '%@yjc-seed.kr' ORDER BY id");
  const memberIds = memberRes.rows.map(r => r.id);
  console.log(`시드 회원: ${memberIds.length}명`);

  const allAuthorIds = [1, 8, 38, ...memberIds];

  // 시드로 생성된 일정 조회
  const schedRes = await q("SELECT id FROM schedules ORDER BY id DESC LIMIT 55");
  const scheduleIds = schedRes.rows.map(r => r.id);
  console.log(`일정: ${scheduleIds.length}개`);

  // 시드로 생성된 게시글 조회 (general)
  const postRes = await q("SELECT id FROM posts WHERE category = 'general' ORDER BY id DESC LIMIT 55");
  const postIds = postRes.rows.map(r => r.id);
  console.log(`게시글: ${postIds.length}개`);

  // 시드로 생성된 공지 조회
  const noticeRes = await q("SELECT id, has_attendance FROM notices ORDER BY id DESC LIMIT 32");
  const notices = noticeRes.rows;
  console.log(`공지: ${notices.length}개`);

  // 6. 일정 참석
  console.log('\n6) 일정 참석 기록 생성...');
  let attendanceCount = 0;
  for (const scheduleId of scheduleIds) {
    const numAttendees = randInt(5, 20);
    const shuffled = [...memberIds].sort(() => Math.random() - 0.5).slice(0, numAttendees);
    for (const userId of shuffled) {
      const status = Math.random() < 0.75 ? 'attending' : 'not_attending';
      try {
        await q(
          `INSERT INTO schedule_attendance (schedule_id, user_id, status, responded_at, updated_at)
           VALUES ($1, $2, $3, NOW() - interval '${randInt(1, 30)} days', NOW())
           ON CONFLICT DO NOTHING`,
          [scheduleId, userId, status]
        );
        attendanceCount++;
      } catch(e) {}
    }
  }
  console.log(`   ✅ 일정 참석 ~${attendanceCount}개`);

  // 7. 공지 출석
  console.log('\n7) 공지 출석 기록 생성...');
  let noticeAttCount = 0;
  const attendanceNotices = notices.filter(n => n.has_attendance);
  for (const notice of attendanceNotices) {
    const numAttendees = randInt(10, 30);
    const shuffled = [...memberIds].sort(() => Math.random() - 0.5).slice(0, numAttendees);
    for (const userId of shuffled) {
      const status = Math.random() < 0.7 ? 'attending' : 'not_attending';
      try {
        await q(
          `INSERT INTO notice_attendance (notice_id, user_id, status, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [notice.id, userId, status]
        );
        noticeAttCount++;
      } catch(e) {}
    }
  }
  console.log(`   ✅ 공지 출석 ~${noticeAttCount}개`);

  // 8. 댓글
  console.log('\n8) 댓글 생성...');
  const commentTexts = [
    '좋은 정보 감사합니다!', '참석하겠습니다.', '이번에는 참석이 어려울 것 같습니다.',
    '좋은 행사네요. 기대됩니다!', '자세한 안내 감사합니다.', '문의사항이 있는데 연락드려도 될까요?',
    '항상 감사합니다.', '다음에도 이런 행사 부탁드립니다.', '시간이 되면 참석하겠습니다.',
    '유익한 내용이네요.', '공유 감사합니다!', '좋은 의견이십니다.',
    '동의합니다.', '저도 관심있습니다.', '잘 정리해주셨네요.',
    '회원 여러분 모두 참석해주세요!', '장소가 좋네요.', '시간 조정이 가능할까요?',
    '작년보다 더 좋아질 것 같습니다.', '적극 추천합니다.', '함께 하겠습니다!',
    '멋진 기획이네요.', '준비해주신 분들 수고하셨습니다.', '다음 모임도 기대됩니다.',
    '좋은 제안입니다.', '정보가 많이 도움이 됩니다.', '감사합니다. 잘 참고하겠습니다.',
    '꼭 참석하고 싶습니다!', '일정 확인하고 연락드리겠습니다.', '좋은 하루 되세요!',
  ];
  let commentCount = 0;

  for (const postId of postIds) {
    const num = randInt(1, 5);
    for (let j = 0; j < num; j++) {
      const authorId = allAuthorIds[Math.floor(Math.random() * allAuthorIds.length)];
      await q(
        `INSERT INTO comments (post_id, author_id, content, created_at, updated_at)
         VALUES ($1, $2, $3, NOW() - interval '${randInt(0, 30)} days', NOW())`,
        [postId, authorId, rand(commentTexts)]
      );
      commentCount++;
    }
  }

  for (const scheduleId of scheduleIds) {
    const num = randInt(0, 3);
    for (let j = 0; j < num; j++) {
      const authorId = allAuthorIds[Math.floor(Math.random() * allAuthorIds.length)];
      await q(
        `INSERT INTO comments (schedule_id, author_id, content, created_at, updated_at)
         VALUES ($1, $2, $3, NOW() - interval '${randInt(0, 30)} days', NOW())`,
        [scheduleId, authorId, rand(commentTexts)]
      );
      commentCount++;
    }
  }

  await q(`UPDATE posts SET comments_count = (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id AND comments.is_deleted = false) WHERE id = ANY($1)`, [postIds]);
  console.log(`   ✅ 댓글 ${commentCount}개`);

  // 9. 좋아요
  console.log('\n9) 좋아요 생성...');
  let likeCount = 0;
  for (const postId of postIds) {
    const num = randInt(0, 15);
    const shuffled = [...memberIds].sort(() => Math.random() - 0.5).slice(0, num);
    for (const memberId of shuffled) {
      try {
        await q(`INSERT INTO likes (user_id, post_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`, [memberId, postId]);
        likeCount++;
      } catch(e) {}
    }
  }
  await q(`UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) WHERE id = ANY($1)`, [postIds]);
  console.log(`   ✅ 좋아요 ~${likeCount}개`);

  console.log('\n=== 완료 ===');
  await pool.end();
  process.exit(0);
}

main().catch(err => { console.error(err); pool.end(); process.exit(1); });
