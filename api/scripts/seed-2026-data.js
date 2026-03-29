/**
 * 2026년 테스트 데이터 시드
 * - 회원 60명 (특우회/회장단/이사회/위원장/일반)
 * - 이사회 일정 12개 (1~12월 첫째주 수요일 19:00~21:00)
 * - 공지 게시글
 * - 일반 게시글 3~5월 각 10~15개
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
const q = (text, params) => pool.query(text, params);
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n) { return String(n).padStart(2, '0'); }

// 첫째주 수요일 구하기
function firstWednesday(year, month) {
    var d = new Date(year, month - 1, 1);
    while (d.getDay() !== 3) d.setDate(d.getDate() + 1);
    return d;
}

const lastNames = ['김','이','박','정','최','강','한','윤','임','송','조','오','배','신','류','허','곽','문','장','권','남','유','서','양','홍','전','황','안','손','백','도','원','민','변','노','하','구','성','차','우','진','탁','엄','고','마','표','피','방','공','연','주','봉','제','편','설','선','예','연','심'];
const firstNamesM = ['영호','준영','성민','대현','민석','태훈','현우','진호','동훈','재민','우성','기훈','정우','승기','인수','태양','건우','시현','도윤','지훈','세준','수호','예준','하준','은우','민재','현준','지환','서진','승현'];
const firstNamesF = ['유진','지수','서연','미래','지혜','하늘','수빈','예린','나영','하은','소희','다은','세정','다솔','은서','지아','서윤','하린','유나','민서','채원','수아','지윤','서아','예은','가은','시은','하윤','소율','아인'];
const jobs = ['대표이사','변호사','회계사','세무사','약사','한의사','치과의사','건축사','교수','디자이너','PD','기자','컨설턴트','부동산중개사','보험설계사','금융전문가','IT개발자','마케팅전문가','물류전문가','무역전문가','요식업대표','학원장','사진작가','인테리어전문가','에너지전문가','법무사','노무사','관세사','특허변리사','감정평가사'];
const companies = ['영등포건설','준영법률사무소','성민회계법인','대현물산','유진디자인','민석무역','지수세무사사무소','SY기획','태훈물류','미래교육','현우테크','지혜약국','진호건축','하늘여행사','동훈전자','수빈푸드','재민자동차','예린아트','우성부동산','나영한의원','기훈보험','하은미디어','정우치과','소희패션','승기유통','다은스튜디오','인수엔지니어링','세정인테리어','태양에너지','다솔법무법인','건우IT','시현마케팅','도윤물류','지훈무역','세준요식','수호학원','예준사진','하준인테리어','은우에너지','민재금융'];
const depts = ['경영','법무','회계','영업','디자인','무역','세무','기획','물류','교육','IT','약학','건축','관광','전자','외식','자동차','문화','부동산','의학','보험','미디어','치의학','패션','유통','사진','엔지니어링','인테리어','에너지','금융'];

async function main() {
    console.log('=== 2026년 테스트 데이터 시드 시작 ===\n');
    const hashedPw = await bcrypt.hash('test1234', 10);

    // ─── 1. 회원 60명 ───
    console.log('1) 회원 60명 생성...');

    // 조직 구성
    const roles = [
        // 특우회 (10명)
        { title: '특우회 회장', role: 'member', group: '특우회' },
        { title: '특우회 부회장', role: 'member', group: '특우회' },
        { title: '특우회 총무', role: 'member', group: '특우회' },
        { title: '특우회원', role: 'member', group: '특우회' },
        { title: '특우회원', role: 'member', group: '특우회' },
        { title: '특우회원', role: 'member', group: '특우회' },
        { title: '특우회원', role: 'member', group: '특우회' },
        { title: '특우회원', role: 'member', group: '특우회' },
        { title: '특우회원', role: 'member', group: '특우회' },
        { title: '특우회원', role: 'member', group: '특우회' },
        // 회장단 (6명)
        { title: '회장', role: 'admin', group: '회장단' },
        { title: '상임부회장', role: 'admin', group: '회장단' },
        { title: '내무부회장', role: 'admin', group: '회장단' },
        { title: '외무부회장', role: 'admin', group: '회장단' },
        { title: '감사', role: 'admin', group: '회장단' },
        { title: '감사', role: 'admin', group: '회장단' },
        // 이사회 (10명)
        { title: '이사', role: 'member', group: '이사회' },
        { title: '이사', role: 'member', group: '이사회' },
        { title: '이사', role: 'member', group: '이사회' },
        { title: '이사', role: 'member', group: '이사회' },
        { title: '이사', role: 'member', group: '이사회' },
        { title: '이사', role: 'member', group: '이사회' },
        { title: '이사', role: 'member', group: '이사회' },
        { title: '이사', role: 'member', group: '이사회' },
        { title: '이사', role: 'member', group: '이사회' },
        { title: '이사', role: 'member', group: '이사회' },
        // 위원장 8명 + 부위원장 8명
        { title: '총무위원장', role: 'member', group: '위원회' },
        { title: '기획위원장', role: 'member', group: '위원회' },
        { title: '홍보위원장', role: 'member', group: '위원회' },
        { title: '사업위원장', role: 'member', group: '위원회' },
        { title: '교육위원장', role: 'member', group: '위원회' },
        { title: '봉사위원장', role: 'member', group: '위원회' },
        { title: '국제위원장', role: 'member', group: '위원회' },
        { title: '체육위원장', role: 'member', group: '위원회' },
        { title: '총무부위원장', role: 'member', group: '위원회' },
        { title: '기획부위원장', role: 'member', group: '위원회' },
        { title: '홍보부위원장', role: 'member', group: '위원회' },
        { title: '사업부위원장', role: 'member', group: '위원회' },
        { title: '교육부위원장', role: 'member', group: '위원회' },
        { title: '봉사부위원장', role: 'member', group: '위원회' },
        { title: '국제부위원장', role: 'member', group: '위원회' },
        { title: '체육부위원장', role: 'member', group: '위원회' },
        // 일반회원 (18명)
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
        { title: '회원', role: 'member', group: '일반' },
    ];

    const memberIds = [];
    for (let i = 0; i < 60; i++) {
        const isFemale = i >= 35;
        const ln = lastNames[i % lastNames.length];
        const fn = isFemale ? firstNamesF[i - 35] || rand(firstNamesF) : firstNamesM[i] || rand(firstNamesM);
        const name = ln + fn;
        const email = `jc2026member${pad(i + 1)}@yjc-test.kr`;
        const phone = `010-${randInt(3000,9999)}-${randInt(1000,9999)}`;
        const gender = isFemale ? 'female' : 'male';
        const birthM = pad(randInt(1, 12));
        const birthD = pad(randInt(1, 28));
        const birthY = randInt(1975, 1998);
        const r = roles[i];
        const company = ln + rand(companies.map(c => c.replace(/^./, '')));
        const job = rand(jobs);
        const dept = rand(depts);

        const res = await q(
            `INSERT INTO users (email, password_hash, name, phone, company, position, department, gender, birth_date, role, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW())
             ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position
             RETURNING id`,
            [email, hashedPw, name, phone, company, r.title + ' / ' + job, dept, gender, `${birthY}-${birthM}-${birthD}`, r.role]
        );
        memberIds.push(res.rows[0].id);
    }
    console.log(`   회원 ${memberIds.length}명 생성 (ID: ${memberIds[0]}~${memberIds[memberIds.length - 1]})`);

    const allAuthorIds = [1, 38, 39, ...memberIds.slice(10, 16)]; // admin + 회장단

    // ─── 2. 이사회 일정 12개 ───
    console.log('\n2) 이사회 일정 12개 생성...');
    const scheduleIds = [];
    for (let m = 1; m <= 12; m++) {
        const wed = firstWednesday(2026, m);
        const startDate = `2026-${pad(m)}-${pad(wed.getDate())}T19:00:00`;
        const endDate = `2026-${pad(m)}-${pad(wed.getDate())}T21:00:00`;
        const createdBy = rand(allAuthorIds);

        const res = await q(
            `INSERT INTO schedules (title, description, start_date, end_date, location, category, created_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING id`,
            [`${m}월 정기이사회`, `2026년 ${m}월 정기이사회입니다. 전 이사 참석 바랍니다.\n\n안건:\n1. 전월 사업보고\n2. 금월 사업계획\n3. 기타 안건`,
             startDate, endDate, '영등포 JC 회관 3층 회의실', 'meeting', createdBy]
        );
        scheduleIds.push(res.rows[0].id);

        // 참석 등록 (이사회 멤버 10명 + 회장단 6명)
        const boardMembers = memberIds.slice(16, 26); // 이사 10명
        const executives = memberIds.slice(10, 16); // 회장단 6명
        for (const uid of [...boardMembers, ...executives]) {
            const status = Math.random() < 0.8 ? 'attending' : 'not_attending';
            await q(
                `INSERT INTO schedule_attendance (schedule_id, user_id, status, responded_at, updated_at)
                 VALUES ($1, $2, $3, NOW(), NOW()) ON CONFLICT DO NOTHING`,
                [res.rows[0].id, uid, status]
            ).catch(() => {});
        }
    }
    console.log(`   이사회 일정 ${scheduleIds.length}개 + 참석 기록 생성`);

    // ─── 3. 공지 게시글 ───
    console.log('\n3) 공지 게시글 생성...');
    const noticeTitles = [
        { title: '[필독] 2026년 연간 사업계획 안내', content: '2026년도 영등포JC 연간 사업계획을 안내드립니다. 각 사업별 담당자는 준비 부탁드립니다.', pinned: true },
        { title: '[공지] 1분기 회비 납부 안내', content: '2026년 1분기 회비 납부 안내입니다. 납부 기한: 3월 31일까지.', pinned: false },
        { title: '[중요] 정기총회 안내', content: '2026년 정기총회를 개최합니다. 전 회원 필수 참석입니다.', pinned: true },
        { title: '[공지] 신입회원 모집 안내', content: '2026년 신입회원을 모집합니다. 추천인 제도를 통해 적극적으로 모집해주세요.', pinned: false },
        { title: '[안내] 앱 업데이트 안내', content: '영등포JC 앱이 업데이트되었습니다. 새로운 기능을 확인해주세요.', pinned: false },
    ];
    for (const n of noticeTitles) {
        await q(
            `INSERT INTO posts (author_id, title, content, category, is_pinned, views, created_at, updated_at)
             VALUES ($1, $2, $3, 'notice', $4, $5, NOW() - interval '${randInt(1, 30)} days', NOW())`,
            [rand(allAuthorIds), n.title, n.content, n.pinned, randInt(30, 200)]
        );
    }
    console.log(`   공지 게시글 ${noticeTitles.length}개 생성`);

    // ─── 4. 일반 게시글 3~5월 ───
    console.log('\n4) 일반 게시글 3~5월 생성...');
    const generalTopics = [
        '봉사활동 후기', '회원 맛집 추천', '사업 협력 제안', '세미나 참석 후기',
        '네트워킹 행사 안내', '회원 경조사 안내', '지역 발전 아이디어', '독서 모임 안내',
        '운동 소모임 안내', '회원 사업장 소개', '골프 모임 결과', '건강 관리 팁',
        '세금 절세 팁', '여행 후기', '자녀 교육 정보', '비즈니스 뉴스 공유',
        '회원 건의사항', '지역 행사 안내', '업종별 소모임 제안', 'IT 트렌드 공유',
    ];
    let generalCount = 0;
    for (let m = 3; m <= 5; m++) {
        const count = randInt(10, 15);
        for (let i = 0; i < count; i++) {
            const topic = rand(generalTopics);
            const day = randInt(1, 28);
            const authorId = rand([...allAuthorIds, ...memberIds.slice(0, 30)]);
            const hasAttendance = Math.random() < 0.2;
            const linkedScheduleId = (hasAttendance && scheduleIds[m - 1]) ? scheduleIds[m - 1] : null;

            await q(
                `INSERT INTO posts (author_id, title, content, category, views, attendance_enabled, linked_schedule_id, created_at, updated_at)
                 VALUES ($1, $2, $3, 'general', $4, $5, $6, $7, $7)`,
                [authorId, topic, `${m}월 ${topic} 관련 게시글입니다. 많은 관심 부탁드립니다.\n\n상세 내용은 추후 공지 예정입니다.`,
                 randInt(5, 150), hasAttendance, linkedScheduleId,
                 `2026-${pad(m)}-${pad(day)}T${pad(randInt(8, 20))}:${pad(randInt(0, 59))}:00`]
            );
            generalCount++;
        }
    }
    console.log(`   일반 게시글 ${generalCount}개 생성 (3~5월)`);

    // ─── 5. 댓글/좋아요 ───
    console.log('\n5) 댓글 및 좋아요 추가...');
    const postIds = (await q('SELECT id FROM posts WHERE deleted_at IS NULL ORDER BY id')).rows.map(r => r.id);
    const commentTexts = ['좋은 정보 감사합니다!','참석하겠습니다.','유익한 내용이네요.','잘 정리해주셨네요.','다음에도 부탁드립니다.','좋은 행사네요!','감사합니다.','공유 감사합니다!'];
    let cCount = 0, lCount = 0;
    for (const pid of postIds) {
        const nc = randInt(0, 4);
        for (let j = 0; j < nc; j++) {
            await q('INSERT INTO comments (post_id, author_id, content, created_at, updated_at) VALUES ($1,$2,$3,NOW(),NOW())',
                [pid, rand(memberIds), rand(commentTexts)]);
            cCount++;
        }
        const nl = randInt(0, 8);
        const shuffled = [...memberIds].sort(() => Math.random() - 0.5).slice(0, nl);
        for (const uid of shuffled) {
            try { await q('INSERT INTO likes (user_id, post_id, created_at) VALUES ($1,$2,NOW()) ON CONFLICT DO NOTHING', [uid, pid]); lCount++; } catch(e) {}
        }
    }
    await q(`UPDATE posts SET comments_count = (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id AND (comments.is_deleted = false OR comments.is_deleted IS NULL)) WHERE id = ANY($1)`, [postIds]);
    await q(`UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) WHERE id = ANY($1)`, [postIds]);
    console.log(`   댓글 ${cCount}개, 좋아요 ${lCount}개`);

    // ─── 완료 ───
    console.log('\n=== 시드 완료 ===');
    console.log(`  회원: 60명 (특우회 10 + 회장단 6 + 이사 10 + 위원장/부위원장 16 + 일반 18)`);
    console.log(`  이사회 일정: 12개 (1~12월 첫째주 수요일)`);
    console.log(`  공지: ${noticeTitles.length}개`);
    console.log(`  일반 게시글: ${generalCount}개 (3~5월)`);
    console.log(`  댓글: ${cCount}개, 좋아요: ${lCount}개`);
    console.log(`  비밀번호: test1234`);

    await pool.end();
    process.exit(0);
}

main().catch(err => { console.error(err); pool.end(); process.exit(1); });
