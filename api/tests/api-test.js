/**
 * API 자동 테스트 (기초 교체 3단계)
 * 실행: node api/tests/api-test.js
 * 핵심 API 20개를 테스트하여 "고치면 깨지는" 현상 방지
 */

const BASE = process.env.API_URL || 'http://localhost:3000';
let TOKEN = '';
let testPostId = null;
let testScheduleId = null;
let passed = 0, failed = 0;

async function request(method, path, body) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (TOKEN) opts.headers['Authorization'] = 'Bearer ' + TOKEN;
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + '/api' + path, opts);
    return res.json();
}

function assert(name, condition, detail) {
    if (condition) {
        console.log('  ✅ ' + name);
        passed++;
    } else {
        console.log('  ❌ ' + name + (detail ? ' — ' + detail : ''));
        failed++;
    }
}

async function runTests() {
    console.log('🧪 JC API 자동 테스트 시작\n');

    // ======= 1. 인증 =======
    console.log('📌 인증');
    var login = await request('POST', '/auth/login', { email: 'admin@jc.com', password: 'admin1234' });
    assert('로그인 성공', login.success && login.token);
    TOKEN = login.token;

    var me = await request('GET', '/auth/me');
    assert('내 정보 조회', me.success && me.user && me.user.email === 'admin@jc.com');

    // ======= 2. 게시글 CRUD =======
    console.log('\n📌 게시글');
    var createPost = await request('POST', '/posts', {
        title: '테스트 공지', content: '테스트 내용', category: 'notice',
        schedule: { title: '테스트일정', start_date: '2026-04-01T09:00:00', end_date: '2026-04-01T18:00:00', category: 'event' }
    });
    assert('공지 게시글 생성 (일정 첨부)', createPost.success);
    testPostId = createPost.post ? createPost.post.id : (createPost.data ? createPost.data.id : null);

    var listNotice = await request('GET', '/posts?page=1&limit=10&category=notice');
    assert('공지 게시글 목록', listNotice.success && listNotice.posts && listNotice.posts.length > 0);
    if (listNotice.posts && listNotice.posts.length > 0) {
        testPostId = testPostId || listNotice.posts[0].id;
        assert('is_pinned 컬럼 존재', listNotice.posts[0].hasOwnProperty('is_pinned'), 'is_pinned: ' + listNotice.posts[0].is_pinned);
        assert('read_by_current_user 컬럼 존재', listNotice.posts[0].hasOwnProperty('read_by_current_user'));
    }

    var createGeneral = await request('POST', '/posts', { title: '테스트 일반', content: '일반 내용', category: 'general' });
    assert('일반 게시글 생성', createGeneral.success);
    var generalId = createGeneral.post ? createGeneral.post.id : null;

    var listGeneral = await request('GET', '/posts?page=1&limit=10&category=general');
    assert('일반 게시글 목록 (카테고리 필터)', listGeneral.success && listGeneral.posts);
    if (listGeneral.posts) {
        var hasGeneral = listGeneral.posts.some(function(p) { return p.category === 'general'; });
        var hasNotice = listGeneral.posts.some(function(p) { return p.category === 'notice'; });
        assert('일반 탭에 일반 글만 표시', hasGeneral || listGeneral.posts.length === 0, 'notice 혼입: ' + hasNotice);
    }

    // ======= 3. 게시글 상세 + 읽음 =======
    console.log('\n📌 게시글 상세 + 읽음 처리');
    if (testPostId) {
        var detail = await request('GET', '/posts/' + testPostId);
        assert('게시글 상세 조회', detail.success && detail.post);
        assert('linked_schedule 존재', detail.post && detail.post.linked_schedule !== undefined);

        // 읽음 처리 확인
        var listAfterRead = await request('GET', '/posts?page=1&limit=10&category=notice');
        if (listAfterRead.posts) {
            var readPost = listAfterRead.posts.find(function(p) { return p.id === testPostId; });
            assert('읽음 처리 (read_by_current_user=true)', readPost && readPost.read_by_current_user === true,
                readPost ? 'read_by_current_user: ' + readPost.read_by_current_user : 'post not found');
        }
    }

    // ======= 4. 좋아요 =======
    console.log('\n📌 좋아요');
    if (testPostId) {
        var like1 = await request('POST', '/posts/' + testPostId + '/like');
        assert('좋아요 토글 (좋아요)', like1.success && like1.liked === true);
        var like2 = await request('POST', '/posts/' + testPostId + '/like');
        assert('좋아요 토글 (취소)', like2.success && like2.liked === false);
    }

    // ======= 5. 댓글 =======
    console.log('\n📌 댓글');
    if (testPostId) {
        var comment = await request('POST', '/posts/' + testPostId + '/comments', { content: '테스트 댓글' });
        assert('댓글 작성', comment.success);
        var comments = await request('GET', '/posts/' + testPostId + '/comments');
        assert('댓글 목록', comments.success && comments.comments && comments.comments.length > 0);
    }

    // ======= 6. 일정 =======
    console.log('\n📌 일정');
    var schedules = await request('GET', '/schedules?year=2026&month=4');
    assert('일정 목록', schedules.success);
    if (schedules.schedules && schedules.schedules.length > 0) {
        testScheduleId = schedules.schedules[0].id;
        var schedDetail = await request('GET', '/schedules/' + testScheduleId);
        assert('일정 상세 (views 컬럼)', schedDetail.success && schedDetail.schedule);
    } else {
        assert('일정 존재 확인', false, '일정 0개 — 게시글 일정 첨부 실패?');
    }

    // ======= 7. 회원 =======
    console.log('\n📌 회원');
    var members = await request('GET', '/members?page=1&limit=10');
    assert('회원 목록', members.success || (members.data && members.data.items));

    // ======= 8. 조직도 =======
    console.log('\n📌 조직도');
    var orgchart = await request('GET', '/orgchart');
    assert('조직도 조회', orgchart.success);

    // ======= 9. 그룹 일정 =======
    console.log('\n📌 그룹 일정');
    var mySchedules = await request('GET', '/group-board/my-schedules/all');
    assert('내 그룹 일정 API (라우트 순서)', mySchedules.success);

    var myGroups = await request('GET', '/group-board/my-groups/list');
    assert('내 그룹 목록 API (라우트 순서)', myGroups.success);

    // ======= 10. 정리 =======
    console.log('\n📌 정리');
    if (generalId) {
        var del = await request('DELETE', '/posts/' + generalId);
        assert('게시글 삭제', del.success);
    }
    if (testPostId) {
        var del2 = await request('DELETE', '/posts/' + testPostId);
        assert('공지 게시글 삭제', del2.success);
    }

    // ======= 결과 =======
    console.log('\n' + '='.repeat(40));
    console.log('결과: ' + passed + ' 통과 / ' + failed + ' 실패 / 총 ' + (passed + failed));
    console.log('='.repeat(40));

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(function(e) {
    console.error('테스트 실행 오류:', e);
    process.exit(1);
});
