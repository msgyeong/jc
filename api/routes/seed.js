const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { hashPassword } = require('../utils/password');

/**
 * POST /api/seed/members
 * 테스트용 가상 회원 30명 생성
 */
router.post('/members', async (req, res) => {
    try {
        const existingCount = await query("SELECT COUNT(*) FROM users WHERE email LIKE '%@yjc-test.kr'");
        if (parseInt(existingCount.rows[0].count) > 0) {
            return res.json({ success: true, message: '이미 시드 데이터가 존재합니다.', skipped: true });
        }

        const hashedPw = await hashPassword('test1234');

        const members = [
            { name: '김영호', email: 'kim.yh@yjc-test.kr', role: 'super_admin', phone: '010-1111-0001', company: '영등포건설', position: '대표이사', department: '경영', gender: 'male', birth_date: '1975-03-15' },
            { name: '이준영', email: 'lee.jy@yjc-test.kr', role: 'admin', phone: '010-1111-0002', company: '준영법률사무소', position: '변호사', department: '법무', gender: 'male', birth_date: '1978-07-22' },
            { name: '박성민', email: 'park.sm@yjc-test.kr', role: 'admin', phone: '010-1111-0003', company: '성민회계법인', position: '공인회계사', department: '회계', gender: 'male', birth_date: '1980-01-10' },
            { name: '정대현', email: 'jung.dh@yjc-test.kr', role: 'member', phone: '010-1111-0004', company: '대현물산', position: '이사', department: '영업', gender: 'male', birth_date: '1982-05-18' },
            { name: '최유진', email: 'choi.yj@yjc-test.kr', role: 'member', phone: '010-1111-0005', company: '유진디자인', position: '대표', department: '디자인', gender: 'female', birth_date: '1985-11-03' },
            { name: '강민석', email: 'kang.ms@yjc-test.kr', role: 'member', phone: '010-1111-0006', company: '민석무역', position: '부장', department: '무역', gender: 'male', birth_date: '1983-09-25' },
            { name: '한지수', email: 'han.js@yjc-test.kr', role: 'member', phone: '010-1111-0007', company: '지수세무사사무소', position: '세무사', department: '세무', gender: 'female', birth_date: '1986-04-12' },
            { name: '윤서연', email: 'yoon.sy@yjc-test.kr', role: 'member', phone: '010-1111-0008', company: 'SY기획', position: '기획팀장', department: '기획', gender: 'female', birth_date: '1988-08-30' },
            { name: '임태훈', email: 'lim.th@yjc-test.kr', role: 'member', phone: '010-1111-0009', company: '태훈물류', position: '실장', department: '물류', gender: 'male', birth_date: '1981-12-07' },
            { name: '송미래', email: 'song.mr@yjc-test.kr', role: 'member', phone: '010-1111-0010', company: '미래교육', position: '원장', department: '교육', gender: 'female', birth_date: '1984-06-20' },
            { name: '조현우', email: 'cho.hw@yjc-test.kr', role: 'member', phone: '010-1111-0011', company: '현우테크', position: 'CTO', department: 'IT', gender: 'male', birth_date: '1987-02-14' },
            { name: '오지혜', email: 'oh.jh@yjc-test.kr', role: 'member', phone: '010-1111-0012', company: '지혜약국', position: '약사', department: '약학', gender: 'female', birth_date: '1989-10-05' },
            { name: '배진호', email: 'bae.jh@yjc-test.kr', role: 'member', phone: '010-1111-0013', company: '진호건축', position: '소장', department: '건축', gender: 'male', birth_date: '1979-03-28' },
            { name: '신하늘', email: 'shin.hn@yjc-test.kr', role: 'member', phone: '010-1111-0014', company: '하늘여행사', position: '대표', department: '관광', gender: 'female', birth_date: '1990-07-16' },
            { name: '류동훈', email: 'ryu.dh@yjc-test.kr', role: 'member', phone: '010-1111-0015', company: '동훈전자', position: '과장', department: '전자', gender: 'male', birth_date: '1986-01-22' },
            { name: '허수빈', email: 'heo.sb@yjc-test.kr', role: 'member', phone: '010-1111-0016', company: '수빈푸드', position: '대표', department: '외식', gender: 'female', birth_date: '1991-05-09' },
            { name: '곽재민', email: 'kwak.jm@yjc-test.kr', role: 'member', phone: '010-1111-0017', company: '재민자동차', position: '센터장', department: '자동차', gender: 'male', birth_date: '1983-11-30' },
            { name: '문예린', email: 'moon.yr@yjc-test.kr', role: 'member', phone: '010-1111-0018', company: '예린아트', position: '관장', department: '문화', gender: 'female', birth_date: '1988-04-03' },
            { name: '장우성', email: 'jang.ws@yjc-test.kr', role: 'member', phone: '010-1111-0019', company: '우성부동산', position: '공인중개사', department: '부동산', gender: 'male', birth_date: '1980-08-17' },
            { name: '권나영', email: 'kwon.ny@yjc-test.kr', role: 'member', phone: '010-1111-0020', company: '나영한의원', position: '한의사', department: '한의학', gender: 'female', birth_date: '1987-12-25' },
            { name: '남기훈', email: 'nam.kh@yjc-test.kr', role: 'member', phone: '010-1111-0021', company: '기훈보험', position: '지점장', department: '보험', gender: 'male', birth_date: '1982-06-11' },
            { name: '유하은', email: 'yu.he@yjc-test.kr', role: 'member', phone: '010-1111-0022', company: '하은미디어', position: 'PD', department: '미디어', gender: 'female', birth_date: '1992-09-08' },
            { name: '서정우', email: 'seo.jw@yjc-test.kr', role: 'member', phone: '010-1111-0023', company: '정우치과', position: '원장', department: '치의학', gender: 'male', birth_date: '1985-02-19' },
            { name: '양소희', email: 'yang.sh@yjc-test.kr', role: 'member', phone: '010-1111-0024', company: '소희패션', position: '디자이너', department: '패션', gender: 'female', birth_date: '1993-07-04' },
            { name: '홍승기', email: 'hong.sk@yjc-test.kr', role: 'member', phone: '010-1111-0025', company: '승기유통', position: '대표', department: '유통', gender: 'male', birth_date: '1981-10-21' },
            { name: '전다은', email: 'jeon.de@yjc-test.kr', role: 'member', phone: '010-1111-0026', company: '다은스튜디오', position: '포토그래퍼', department: '사진', gender: 'female', birth_date: '1994-03-13' },
            { name: '황인수', email: 'hwang.is@yjc-test.kr', role: 'member', phone: '010-1111-0027', company: '인수엔지니어링', position: '기술이사', department: '엔지니어링', gender: 'male', birth_date: '1979-11-06' },
            { name: '안세정', email: 'ahn.sj@yjc-test.kr', role: 'member', phone: '010-1111-0028', company: '세정인테리어', position: '실장', department: '인테리어', gender: 'female', birth_date: '1990-01-28' },
            { name: '손태양', email: 'son.ty@yjc-test.kr', role: 'member', phone: '010-1111-0029', company: '태양에너지', position: '대표이사', department: '에너지', gender: 'male', birth_date: '1984-08-09' },
            { name: '백다솔', email: 'baek.ds@yjc-test.kr', role: 'member', phone: '010-1111-0030', company: '다솔법무법인', position: '변호사', department: '법무', gender: 'female', birth_date: '1991-12-17' }
        ];

        for (const m of members) {
            await query(
                `INSERT INTO users (email, password, name, phone, company, position, department, gender, birth_date, role, status, is_approved, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', true, NOW(), NOW())
                 ON CONFLICT (email) DO NOTHING`,
                [m.email, hashedPw, m.name, m.phone, m.company, m.position, m.department, m.gender, m.birth_date, m.role]
            );
        }

        res.json({ success: true, message: `회원 ${members.length}명 시드 완료` });
    } catch (error) {
        console.error('Seed members error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/seed/schedules
 * 테스트용 일정 데이터 생성
 */
router.post('/schedules', async (req, res) => {
    try {
        const existingCount = await query("SELECT COUNT(*) FROM schedules");
        if (parseInt(existingCount.rows[0].count) > 5) {
            return res.json({ success: true, message: '이미 일정 데이터가 존재합니다.', skipped: true });
        }

        // 시드 회원 중 admin 찾기
        const adminResult = await query("SELECT id FROM users WHERE role IN ('super_admin', 'admin') LIMIT 1");
        if (adminResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: '관리자 계정이 없습니다. 먼저 회원 시드를 실행하세요.' });
        }
        const adminId = adminResult.rows[0].id;

        const schedules = [
            { title: '3월 정기이사회', start_date: '2026-03-10T19:00:00', end_date: '2026-03-10T21:00:00', location: '영등포 JC 회의실', category: 'meeting', description: '2026년 3월 정기이사회입니다. 전 이사 참석 바랍니다.' },
            { title: '지역 봉사활동 - 영등포 하천 정화', start_date: '2026-03-15T09:00:00', end_date: '2026-03-15T13:00:00', location: '안양천 영등포 구간', category: 'event', description: '봄맞이 하천 정화 봉사활동입니다. 장갑과 편한 복장 준비해주세요.' },
            { title: '리더십 교육 세미나', start_date: '2026-03-20T14:00:00', end_date: '2026-03-20T17:00:00', location: '영등포 비즈센터 3층', category: 'training', description: '외부 강사 초청 리더십 교육 세미나. 주제: "변화를 이끄는 리더십"' },
            { title: '3월 정기회의 (월례회)', start_date: '2026-03-22T18:30:00', end_date: '2026-03-22T20:30:00', location: '영등포 JC 회관', category: 'meeting', description: '3월 월례 정기회의입니다. 전 회원 참석 필수.' },
            { title: '회원 친목 골프 모임', start_date: '2026-03-29T07:00:00', end_date: '2026-03-29T15:00:00', location: '서울CC', category: 'event', description: '봄 시즌 친목 골프 모임. 참가 신청은 3/25까지.' },
            { title: '4월 정기이사회', start_date: '2026-04-07T19:00:00', end_date: '2026-04-07T21:00:00', location: '영등포 JC 회의실', category: 'meeting', description: '2026년 4월 정기이사회.' },
            { title: '어린이날 봉사활동', start_date: '2026-04-05T10:00:00', end_date: '2026-04-05T16:00:00', location: '영등포 어린이공원', category: 'event', description: '어린이날 기념 지역 봉사활동. 어린이 대상 체험 부스 운영.' },
            { title: 'JCI 아태 컨퍼런스', start_date: '2026-04-18T09:00:00', end_date: '2026-04-20T18:00:00', location: '일본 도쿄', category: 'training', description: 'JCI 아시아태평양 컨퍼런스 참가. 등록비 별도.' },
            { title: '신입회원 오리엔테이션', start_date: '2026-03-12T18:00:00', end_date: '2026-03-12T20:00:00', location: '영등포 JC 회관', category: 'training', description: '2026년 신입회원 오리엔테이션 및 환영행사.' },
            { title: '지역사회 포럼', start_date: '2026-03-27T15:00:00', end_date: '2026-03-27T18:00:00', location: '영등포구청 대강당', category: 'event', description: '영등포 지역 발전을 위한 포럼. 주제: "청년과 지역 경제"' },
            { title: '임원 전략회의', start_date: '2026-03-05T19:00:00', end_date: '2026-03-05T21:00:00', location: '영등포 JC 회의실', category: 'meeting', description: '상반기 사업 전략 논의를 위한 임원회의.' },
            { title: '회원 네트워킹 디너', start_date: '2026-04-12T18:30:00', end_date: '2026-04-12T21:00:00', location: '여의도 레스토랑', category: 'event', description: '회원 간 네트워킹 및 친목 저녁 식사.' }
        ];

        for (const s of schedules) {
            await query(
                `INSERT INTO schedules (created_by, title, start_date, end_date, location, description, category, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
                [adminId, s.title, s.start_date, s.end_date, s.location, s.description, s.category]
            );
        }

        res.json({ success: true, message: `일정 ${schedules.length}개 시드 완료` });
    } catch (error) {
        console.error('Seed schedules error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
