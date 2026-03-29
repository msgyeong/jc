/**
 * 대량 테스트 데이터 시드 스크립트
 * - 테스트 회원 50명
 * - 일반 게시글 55개
 * - 일정 55개
 * - 공지 게시글 32개 (일부 일정 연동)
 * - 일정 참석 기록
 * - 게시글/일정 댓글
 *
 * 실행: cd api && node scripts/seed-bulk-data.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const q = (text, params) => pool.query(text, params);

// ── 한국 이름/회사 데이터 ──
const lastNames = ['김','이','박','정','최','강','한','윤','임','송','조','오','배','신','류','허','곽','문','장','권','남','유','서','양','홍','전','황','안','손','백','도','원','민','변','노','하','구','성','차','우','진','탁','엄','고','마','표','피','방','공','연'];
const firstNamesM = ['영호','준영','성민','대현','민석','태훈','현우','진호','동훈','재민','우성','기훈','정우','승기','인수','태양','건우','시현','도윤','지훈','세준','수호','예준','하준','은우','민재','현준','지환','서진','승현'];
const firstNamesF = ['유진','지수','서연','미래','지혜','하늘','수빈','예린','나영','하은','소희','다은','세정','다솔','은서','지아','서윤','하린','유나','민서','채원','수아','지윤','서아','예은','가은','시은','하윤','소율','아인'];
const companies = ['건설','법률사무소','회계법인','물산','디자인','무역','세무사사무소','기획','물류','교육','테크','약국','건축','여행사','전자','푸드','자동차','아트','부동산','한의원','보험','미디어','치과','패션','유통','스튜디오','엔지니어링','인테리어','에너지','법무법인','IT솔루션','컨설팅','마케팅','금융','증권','제약','바이오','통신','광고','출판'];
const positions = ['대표이사','대표','이사','부장','과장','팀장','실장','원장','센터장','기술이사','소장','관장','지점장','디자이너','PD','변호사','회계사','세무사','약사','한의사'];
const departments = ['경영','법무','회계','영업','디자인','무역','세무','기획','물류','교육','IT','약학','건축','관광','전자','외식','자동차','문화','부동산','한의학','보험','미디어','치의학','패션','유통','사진','엔지니어링','인테리어','에너지','금융'];
const locations = ['영등포 JC 회관','영등포 JC 회의실','영등포 비즈센터 3층','영등포구청 대강당','여의도 레스토랑','서울CC','안양천 영등포 구간','영등포 어린이공원','여의도 IFC 컨퍼런스룸','타임스퀘어 세미나실','영등포 문화원','영등포구 복지관','여의도공원','영등포시장 광장','롯데백화점 문화센터'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n) { return String(n).padStart(2, '0'); }

// 날짜 범위: 2026-01-01 ~ 2026-06-30
function randomDate(startMonth = 1, endMonth = 6) {
  const m = randInt(startMonth, endMonth);
  const d = randInt(1, 28);
  const h = randInt(9, 20);
  return `2026-${pad(m)}-${pad(d)}T${pad(h)}:00:00`;
}

function randomPastDate() {
  const m = randInt(1, 3);
  const d = randInt(1, 28);
  return `2026-${pad(m)}-${pad(d)}T${pad(randInt(8, 22))}:${pad(randInt(0, 59))}:00`;
}

async function main() {
  console.log('=== 대량 테스트 데이터 시드 시작 ===\n');

  const hashedPw = await bcrypt.hash('test1234', 10);

  // ─────────────────────────────────────
  // 1. 테스트 회원 50명
  // ─────────────────────────────────────
  console.log('1) 테스트 회원 50명 생성...');
  const memberIds = [];
  for (let i = 1; i <= 50; i++) {
    const isFemale = i > 25;
    const lastName = lastNames[i - 1] || rand(lastNames);
    const firstName = isFemale ? firstNamesF[i - 26] || rand(firstNamesF) : firstNamesM[i - 1] || rand(firstNamesM);
    const name = lastName + firstName;
    const email = `testmember${pad(i)}@yjc-seed.kr`;
    const phone = `010-2222-${String(1000 + i)}`;
    const gender = isFemale ? 'female' : 'male';
    const birthY = randInt(1975, 1995);
    const birthM = pad(randInt(1, 12));
    const birthD = pad(randInt(1, 28));
    const company = lastName + rand(companies);
    const position = rand(positions);
    const department = rand(departments);
    const role = i <= 2 ? 'admin' : 'member';

    const res = await q(
      `INSERT INTO users (email, password_hash, name, phone, company, position, department, gender, birth_date, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [email, hashedPw, name, phone, company, position, department, gender, `${birthY}-${birthM}-${birthD}`, role]
    );
    memberIds.push(res.rows[0].id);
  }
  console.log(`   ✅ 회원 ${memberIds.length}명 생성 완료 (ID: ${memberIds[0]}~${memberIds[memberIds.length - 1]})`);

  // 기존 관리자 ID도 포함
  const allAuthorIds = [1, 8, 38, ...memberIds];

  // ─────────────────────────────────────
  // 2. 일정 55개
  // ─────────────────────────────────────
  console.log('\n2) 일정 55개 생성...');
  const scheduleCategories = ['meeting', 'event', 'training', 'holiday'];
  const scheduleTitles = {
    meeting: [
      '정기이사회', '월례회의', '임원회의', '분과위원회', '운영위원회', '사업계획 회의',
      '예산심의 회의', '인사위원회', '감사위원회', '특별위원회', '합동이사회', '확대간부회의',
      '신년 전략회의', '중간 점검 회의', '하반기 기획회의'
    ],
    event: [
      '봉사활동', '친목 골프 모임', '네트워킹 디너', '신년회', '송년회', '체육대회',
      '지역 축제 참가', '기부 바자회', '문화탐방', '등산 모임', '볼링대회', '와인파티',
      '가족 초청 행사', '회원 조찬 모임', '지역사회 포럼'
    ],
    training: [
      '리더십 세미나', '신입회원 오리엔테이션', '커뮤니케이션 교육', '디지털 마케팅 특강',
      'ESG 경영 워크숍', '재무관리 교육', '법률 특강', '인사관리 세미나',
      '스타트업 멘토링', '글로벌 비즈니스 교육', 'AI 활용 워크숍', '프레젠테이션 교육'
    ],
    holiday: [
      '설 연휴', '추석 연휴', '어린이날', '광복절 기념', '한글날 행사', '크리스마스 파티'
    ]
  };

  const scheduleIds = [];
  for (let i = 0; i < 55; i++) {
    const cat = scheduleCategories[i % 4];
    const titles = scheduleTitles[cat];
    const monthNum = (i % 6) + 1;
    const title = `${monthNum}월 ${titles[i % titles.length]}`;
    const startDate = randomDate(monthNum, monthNum);
    const endHour = parseInt(startDate.split('T')[1].split(':')[0]) + randInt(1, 3);
    const endDate = startDate.split('T')[0] + `T${pad(Math.min(endHour, 23))}:00:00`;
    const createdBy = allAuthorIds[i % allAuthorIds.length];
    const location = rand(locations);
    const description = `${title} 안내입니다. 많은 참여 부탁드립니다. 장소: ${location}`;

    const res = await q(
      `INSERT INTO schedules (title, description, start_date, end_date, location, category, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - interval '${randInt(1, 60)} days', NOW())
       RETURNING id`,
      [title, description, startDate, endDate, location, cat, createdBy]
    );
    scheduleIds.push(res.rows[0].id);
  }
  console.log(`   ✅ 일정 ${scheduleIds.length}개 생성 완료`);

  // ─────────────────────────────────────
  // 3. 일반 게시글 55개
  // ─────────────────────────────────────
  console.log('\n3) 일반 게시글 55개 생성...');
  const postTopics = [
    { title: '이번 주 봉사활동 후기', content: '이번 주 봉사활동에 참여해주신 모든 회원분들 감사합니다. 정말 뜻깊은 시간이었습니다. 다음에도 많은 참여 부탁드립니다.' },
    { title: '영등포 맛집 추천합니다', content: '영등포역 근처에 새로 오픈한 한식당 정말 맛있습니다. 회원 분들과 함께 가면 좋을 것 같아요. 점심 특선이 특히 추천입니다.' },
    { title: '회원 경조사 안내', content: '우리 회원님의 경조사 소식을 전해드립니다. 축하와 위로의 마음을 함께 전해주세요.' },
    { title: '사업 협력 제안', content: '회원 간 사업 협력 기회가 있어 공유합니다. 관심 있으신 분들은 연락 주세요.' },
    { title: '지난 모임 사진 공유', content: '지난번 모임에서 찍은 사진들을 공유합니다. 즐거운 시간이었네요!' },
    { title: '세미나 참석 후기', content: '지난주 리더십 세미나에 다녀왔습니다. 핵심 내용을 정리해서 공유드립니다.' },
    { title: '신입회원 환영합니다', content: '이번 달 새로 가입하신 회원분을 환영합니다! 앞으로 좋은 활동 함께 해요.' },
    { title: '회비 납부 안내', content: '이번 분기 회비 납부 기간입니다. 기한 내 납부 부탁드립니다.' },
    { title: '주차장 이용 안내', content: '회관 주차장 이용 시 주의사항을 안내드립니다. 2시간 이상 주차 시 사전 등록 필요합니다.' },
    { title: '건강 관리 팁 공유', content: '봄철 건강관리에 도움이 되는 정보를 공유합니다. 운동과 식이요법 관련 내용입니다.' },
    { title: '골프 모임 결과', content: '지난 주말 골프 모임 결과입니다. 우승은 김영호 회원! 축하합니다.' },
    { title: '지역 발전 아이디어', content: '영등포 지역 발전을 위한 아이디어를 공유합니다. 함께 논의해 봅시다.' },
    { title: '회원 사업장 소개', content: '우리 회원의 새로운 사업장을 소개합니다. 방문하시면 할인 혜택도 있습니다.' },
    { title: '봄 나들이 추천', content: '벚꽃 시즌에 가볼 만한 곳을 추천합니다. 영등포 인근 명소 위주로 정리했습니다.' },
    { title: '자녀 교육 정보 공유', content: '학부모 회원분들을 위한 교육 정보를 공유합니다. 영등포 지역 학원 및 프로그램 추천.' },
    { title: '회원 간 중고거래', content: '사무실 비품을 정리 중인데, 필요하신 분 계시면 연락주세요. 상태 좋습니다.' },
    { title: '독서 모임 참가자 모집', content: '이번 달 독서 모임 책은 "리더의 조건"입니다. 함께 읽고 토론하실 분 모집합니다.' },
    { title: '회의실 예약 방법 안내', content: '회관 회의실 예약 방법이 변경되었습니다. 앱에서 직접 예약 가능합니다.' },
    { title: '네트워킹 행사 후기', content: '지난 네트워킹 디너 정말 유익했습니다. 새로운 사업 파트너를 만나게 되었네요.' },
    { title: '운동 소모임 안내', content: '매주 수요일 저녁 배드민턴 소모임을 합니다. 참여 원하시는 분 댓글 남겨주세요.' },
    { title: '세금 절세 팁', content: '사업자 회원분들을 위한 절세 팁을 정리했습니다. 올해 변경된 세법 포함.' },
    { title: '회원 생일 축하', content: '이번 달 생일이신 회원분들을 축하합니다! 생일 축하드립니다.' },
    { title: '지역 봉사 일정 공유', content: '다음 달 예정된 봉사활동 일정을 미리 공유합니다. 참여 신청 받습니다.' },
    { title: '사무실 인테리어 추천', content: '최근 사무실을 리모델링했는데, 좋은 업체를 추천합니다. 합리적인 가격이었어요.' },
    { title: '여름 워크숍 장소 추천', content: '여름 워크숍 장소로 제주도 또는 강원도를 제안합니다. 의견 부탁드립니다.' },
    { title: '회원 자기소개', content: '새로 가입한 회원입니다. 영등포에서 카페를 운영하고 있습니다. 잘 부탁드립니다.' },
    { title: 'JC 활동 소감', content: 'JC 활동을 시작한 지 1년이 되었습니다. 돌아보니 정말 많이 성장했네요.' },
    { title: '추천 도서 목록', content: '비즈니스에 도움이 되는 책들을 추천합니다. 경영, 리더십, 자기계발 분야 위주입니다.' },
    { title: '회원 동호회 소개', content: '현재 운영 중인 동호회를 소개합니다. 골프, 등산, 독서, 와인 등 다양합니다.' },
    { title: '연말 행사 기획 아이디어', content: '올해 송년회 기획 아이디어를 모집합니다. 참신한 제안 부탁드립니다.' },
    { title: '사업장 홍보 게시판', content: '회원분들의 사업장을 홍보할 수 있는 공간입니다. 자유롭게 소개해주세요.' },
    { title: '영등포 개발 소식', content: '영등포역 인근 재개발 소식을 공유합니다. 지역 경제에 큰 영향이 있을 것 같습니다.' },
    { title: '회원 취미 공유', content: '요즘 빠진 취미가 있으신 분? 저는 최근 도예를 시작했는데 정말 재미있습니다.' },
    { title: '명절 선물 추천', content: '다가오는 명절에 비즈니스 파트너에게 보낼 선물 추천합니다.' },
    { title: '회원 여행 후기', content: '지난 달 가족여행 다녀온 곳이 너무 좋아서 공유합니다. 제주도 숨은 명소예요.' },
    { title: '신년 목표 공유', content: '올해 사업 목표와 개인 목표를 공유합니다. 함께 응원해주세요.' },
    { title: '회원 맛집 투어', content: '이번 주 금요일 여의도 맛집 투어 갈 분 모집합니다! 5명 정도 생각 중입니다.' },
    { title: '비즈니스 뉴스 공유', content: '오늘 주요 경제 뉴스를 정리해서 공유합니다. 중소기업 관련 정책 변화에 주목하세요.' },
    { title: '회원 건의사항', content: '앱 사용 중 불편한 점이 있어서 건의합니다. 일정 알림 기능이 추가되면 좋겠습니다.' },
    { title: '지역 행사 안내', content: '영등포구에서 주최하는 봄맞이 축제가 있습니다. 관심 있으신 분들 함께 가요.' },
    { title: '사업 성공 사례 공유', content: '최근 신규 사업이 좋은 성과를 내고 있어서 경험을 공유합니다.' },
    { title: '회원 감사 인사', content: '지난번 도움 주신 회원분들께 감사 인사 전합니다. 덕분에 잘 해결되었습니다.' },
    { title: '건강검진 안내', content: '국가건강검진 대상자 안내입니다. 올해 대상이신 분들 꼭 받으세요.' },
    { title: '회원 자녀 장학금 안내', content: 'JC 장학 사업으로 회원 자녀 장학금을 지원합니다. 신청 기간을 확인하세요.' },
    { title: '주말 등산 모임', content: '이번 주말 관악산 등산 갈 분 모집합니다. 난이도는 중간 정도입니다.' },
    { title: '업종별 소모임 제안', content: '같은 업종의 회원끼리 소모임을 만들면 어떨까요? 정보 교류에 도움이 될 것 같습니다.' },
    { title: '회원 추천 앱/서비스', content: '사업에 도움이 되는 앱과 서비스를 추천합니다. 회계, 마케팅, 일정관리 등.' },
    { title: '지역 소상공인 지원 정보', content: '영등포구 소상공인 지원 사업 안내입니다. 대출, 컨설팅, 교육 등 다양합니다.' },
    { title: '회원 동반 행사 안내', content: '다음 달 가족 동반 행사를 계획 중입니다. 일정과 장소에 대한 의견 부탁드립니다.' },
    { title: '여의도 벚꽃 모임', content: '벚꽃 시즌에 여의도 한강공원에서 도시락 모임 하실 분! 날짜 조율 중입니다.' },
    { title: '회원 스터디 모임', content: '영어 스터디 모임을 시작합니다. 비즈니스 영어 위주로 주 1회 진행 예정입니다.' },
    { title: '환경 캠페인 참여', content: '영등포 환경 캠페인에 JC가 참여합니다. 많은 동참 부탁드립니다.' },
    { title: 'IT 트렌드 공유', content: '최근 AI와 디지털 전환 관련 트렌드를 정리했습니다. 사업에 참고하시기 바랍니다.' },
    { title: '회원 인터뷰 시리즈', content: '이번 달 회원 인터뷰 대상자는 김영호 회원입니다. 사업 이야기를 들어봅시다.' },
    { title: '올해 사업 중간 점검', content: '올해 JC 사업 중간 점검 결과를 공유합니다. 잘 진행되고 있는 사업과 보완이 필요한 사업을 정리했습니다.' },
  ];

  const postIds = [];
  for (let i = 0; i < 55; i++) {
    const topic = postTopics[i];
    const authorId = allAuthorIds[i % allAuthorIds.length];
    const views = randInt(5, 200);
    const daysAgo = randInt(1, 90);

    const res = await q(
      `INSERT INTO posts (author_id, title, content, category, views, created_at, updated_at)
       VALUES ($1, $2, $3, 'general', $4, NOW() - interval '${daysAgo} days', NOW() - interval '${daysAgo} days')
       RETURNING id`,
      [authorId, topic.title, topic.content, views]
    );
    postIds.push(res.rows[0].id);
  }
  console.log(`   ✅ 일반 게시글 ${postIds.length}개 생성 완료`);

  // ─────────────────────────────────────
  // 4. 공지 게시글 32개 (일부 일정 연동)
  // ─────────────────────────────────────
  console.log('\n4) 공지 게시글 32개 생성...');
  const noticeTitles = [
    { title: '[필독] 2026년 연간 사업계획 안내', content: '2026년도 영등포JC 연간 사업계획을 안내드립니다. 첨부된 계획서를 확인하시고, 각 사업별 담당자는 준비 부탁드립니다.', pinned: true },
    { title: '[공지] 회비 납부 안내 (1분기)', content: '2026년 1분기 회비 납부 안내입니다. 납부 기한: 3월 31일까지. 계좌: 국민은행 123-456-789.' },
    { title: '[공지] 회원 주소록 업데이트 요청', content: '회원 주소록을 업데이트하고 있습니다. 변경된 연락처가 있으시면 사무국으로 알려주세요.' },
    { title: '[중요] 앱 업데이트 안내', content: '영등포JC 앱이 업데이트되었습니다. 새로운 기능: 일정 알림, 출석 체크, 회원 검색 개선.' },
    { title: '[공지] 정기총회 안내', content: '2026년 정기총회를 다음과 같이 개최합니다. 전 회원 필수 참석입니다.', pinned: true, hasAttendance: true },
    { title: '[공지] 사무국 운영시간 변경', content: '사무국 운영시간이 변경됩니다. 변경 후: 평일 09:00~18:00 (점심시간 12:00~13:00).' },
    { title: '[안내] 주차장 이용 규정 변경', content: '회관 주차장 이용 규정이 변경됩니다. 사전 등록제로 전환하오니 참고 바랍니다.' },
    { title: '[공지] 신입회원 모집 안내', content: '2026년 신입회원을 모집합니다. 추천인 제도를 통해 적극적으로 모집해주세요.' },
    { title: '[중요] 개인정보 처리방침 개정', content: '개인정보 처리방침이 개정되었습니다. 주요 변경사항을 확인해주세요.' },
    { title: '[공지] 봄 봉사활동 참가 신청', content: '봄 시즌 봉사활동 참가 신청을 받습니다. 아래 일정을 확인하시고 참여해주세요.', hasAttendance: true },
    { title: '[안내] JCI 한국 전국대회 참가 안내', content: 'JCI 한국 전국대회에 참가합니다. 참가 희망자는 사무국에 신청해주세요.' },
    { title: '[공지] 회원 경조사 안내', content: '회원 경조사 소식을 안내드립니다. 축하와 위로의 마음을 전해주세요.' },
    { title: '[중요] 이사회 결의사항 공지', content: '3월 정기이사회에서 결의된 사항을 공지합니다. 전 회원 숙지 바랍니다.', pinned: true },
    { title: '[공지] 회원 명함 제작 안내', content: '영등포JC 통일 명함을 제작합니다. 신청 기간: 3/15~3/25. 디자인 시안은 첨부파일 참조.' },
    { title: '[안내] 회관 시설 보수 공사', content: '회관 시설 보수 공사가 진행됩니다. 공사 기간 중 회의실 이용이 제한될 수 있습니다.' },
    { title: '[공지] 4월 행사 일정 안내', content: '4월 예정된 행사 일정을 안내드립니다. 일정을 확인하시고 참석 여부를 알려주세요.', hasAttendance: true },
    { title: '[중요] 회칙 개정 안건 공지', content: '회칙 개정 안건을 사전 공지합니다. 정기총회에서 표결 예정이니 사전에 검토 바랍니다.' },
    { title: '[공지] 체육대회 안내', content: '영등포JC 체육대회를 개최합니다. 팀 편성 및 종목은 추후 공지 예정입니다.', hasAttendance: true },
    { title: '[안내] 사업보고서 제출 요청', content: '각 사업 담당자는 사업보고서를 제출해주세요. 제출 기한: 매월 25일.' },
    { title: '[공지] 외부 강연 안내', content: '외부 전문가 초청 강연이 예정되어 있습니다. 주제: "ESG 경영과 중소기업". 많은 참여 바랍니다.', hasAttendance: true },
    { title: '[중요] 보험 가입 안내', content: '단체보험 가입 안내입니다. 가입 희망자는 사무국에 문의해주세요.' },
    { title: '[공지] 지역사회 기부금 모금', content: '영등포 지역 소외계층을 위한 기부금을 모금합니다. 자발적 참여 부탁드립니다.' },
    { title: '[안내] 회원증 재발급 안내', content: '회원증 분실 시 재발급 절차를 안내드립니다. 사무국 방문 또는 앱에서 신청 가능합니다.' },
    { title: '[공지] 하계 워크숍 안내', content: '하계 워크숍을 계획 중입니다. 장소와 일정에 대한 회원 의견을 수렴합니다.', hasAttendance: true },
    { title: '[중요] 선거관리위원회 구성', content: '차기 임원 선거를 위한 선거관리위원회를 구성합니다. 위원 지원자를 모집합니다.' },
    { title: '[공지] 홈페이지 리뉴얼 안내', content: '영등포JC 홈페이지가 리뉴얼되었습니다. 새로운 디자인과 기능을 확인해주세요.' },
    { title: '[안내] 사무국 인력 충원', content: '사무국 업무 보조 인력을 충원합니다. 추천하실 분이 계시면 연락 바랍니다.' },
    { title: '[공지] 분과위원회 구성 안내', content: '2026년도 분과위원회 구성을 안내합니다. 희망 분과에 신청해주세요.', hasAttendance: true },
    { title: '[중요] 감사 결과 보고', content: '정기 감사 결과를 보고드립니다. 주요 사항은 첨부 문서를 확인해주세요.' },
    { title: '[공지] 회원 혜택 프로그램', content: '회원 전용 혜택 프로그램을 안내드립니다. 제휴업체 할인, 교육 지원 등 다양한 혜택이 있습니다.' },
    { title: '[안내] 지역 청년 멘토링 프로그램', content: '영등포 청년 멘토링 프로그램에 멘토로 참여해주실 회원을 모집합니다.', hasAttendance: true },
    { title: '[공지] 연간 일정표 배포', content: '2026년 연간 일정표를 배포합니다. 주요 행사와 회의 일정을 확인하시고 일정 관리에 참고하세요.', pinned: true },
  ];

  const noticeIds = [];
  for (let i = 0; i < 32; i++) {
    const n = noticeTitles[i];
    const authorId = [1, 8, 38][i % 3]; // 관리자들만 공지 작성
    const daysAgo = randInt(1, 90);
    const isPinned = n.pinned || false;
    const hasAttendance = n.hasAttendance || false;
    const views = randInt(20, 300);

    const res = await q(
      `INSERT INTO notices (author_id, title, content, is_pinned, has_attendance, views, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() - interval '${daysAgo} days', NOW() - interval '${daysAgo} days')
       RETURNING id`,
      [authorId, n.title, n.content, isPinned, hasAttendance, views]
    );
    noticeIds.push(res.rows[0].id);
  }
  console.log(`   ✅ 공지 게시글 ${noticeIds.length}개 생성 완료`);

  // ─────────────────────────────────────
  // 5. 공지-일정 연동 (일부 공지에 linked_schedule_id 설정은 notices에 없으므로,
  //    대신 일정의 linked_post_id와 게시글의 linked_schedule_id를 사용)
  // ─────────────────────────────────────
  console.log('\n5) 게시글-일정 연동 (10개)...');
  for (let i = 0; i < 10; i++) {
    const postId = postIds[i];
    const scheduleId = scheduleIds[i];
    await q(`UPDATE posts SET linked_schedule_id = $1 WHERE id = $2`, [scheduleId, postId]);
    await q(`UPDATE schedules SET linked_post_id = $1 WHERE id = $2`, [postId, scheduleId]);
  }
  console.log('   ✅ 10개 게시글-일정 연동 완료');

  // ─────────────────────────────────────
  // 6. 일정 참석 기록
  // ─────────────────────────────────────
  console.log('\n6) 일정 참석 기록 생성...');
  let attendanceCount = 0;
  for (const scheduleId of scheduleIds) {
    // 각 일정에 5~20명 참석
    const numAttendees = randInt(5, 20);
    const shuffled = [...memberIds].sort(() => Math.random() - 0.5).slice(0, numAttendees);
    for (const userId of shuffled) {
      const weightedStatus = Math.random() < 0.75 ? 'attending' : 'not_attending';
      await q(
        `INSERT INTO schedule_attendance (schedule_id, user_id, status, responded_at, updated_at)
         VALUES ($1, $2, $3, NOW() - interval '${randInt(1, 30)} days', NOW())
         ON CONFLICT DO NOTHING`,
        [scheduleId, userId, weightedStatus]
      );
      attendanceCount++;
    }
  }
  console.log(`   ✅ 일정 참석 기록 약 ${attendanceCount}개 생성 완료`);

  // ─────────────────────────────────────
  // 7. 공지 출석 기록
  // ─────────────────────────────────────
  console.log('\n7) 공지 출석 기록 생성...');
  let noticeAttCount = 0;
  const attendanceNotices = noticeIds.filter((_, i) => noticeTitles[i].hasAttendance);
  for (const noticeId of attendanceNotices) {
    const numAttendees = randInt(10, 30);
    const shuffled = [...memberIds].sort(() => Math.random() - 0.5).slice(0, numAttendees);
    for (const userId of shuffled) {
      const status = Math.random() < 0.7 ? 'attending' : 'not_attending';
      await q(
        `INSERT INTO notice_attendance (notice_id, user_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [noticeId, userId, status]
      );
      noticeAttCount++;
    }
  }
  console.log(`   ✅ 공지 출석 기록 약 ${noticeAttCount}개 생성 완료`);

  // ─────────────────────────────────────
  // 8. 댓글 (게시글 + 일정)
  // ─────────────────────────────────────
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
    '좋은 제안입니다. 한번 논의해 봅시다.', '정보가 많이 도움이 됩니다.',
    '감사합니다. 잘 참고하겠습니다.', '꼭 참석하고 싶습니다!',
    '일정 확인하고 연락드리겠습니다.', '좋은 하루 되세요!',
  ];

  let commentCount = 0;

  // 게시글 댓글 (각 게시글에 1~5개)
  for (const postId of postIds) {
    const numComments = randInt(1, 5);
    for (let j = 0; j < numComments; j++) {
      const authorId = allAuthorIds[Math.floor(Math.random() * allAuthorIds.length)];
      const content = rand(commentTexts);
      await q(
        `INSERT INTO comments (post_id, author_id, content, created_at, updated_at)
         VALUES ($1, $2, $3, NOW() - interval '${randInt(0, 30)} days', NOW())`,
        [postId, authorId, content]
      );
      commentCount++;
    }
  }

  // 일정 댓글 (각 일정에 0~3개)
  for (const scheduleId of scheduleIds) {
    const numComments = randInt(0, 3);
    for (let j = 0; j < numComments; j++) {
      const authorId = allAuthorIds[Math.floor(Math.random() * allAuthorIds.length)];
      const content = rand(commentTexts);
      await q(
        `INSERT INTO comments (schedule_id, author_id, content, created_at, updated_at)
         VALUES ($1, $2, $3, NOW() - interval '${randInt(0, 30)} days', NOW())`,
        [scheduleId, authorId, content]
      );
      commentCount++;
    }
  }

  // 게시글 comments_count 업데이트
  await q(`UPDATE posts SET comments_count = (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id AND comments.is_deleted = false) WHERE id = ANY($1)`, [postIds]);

  console.log(`   ✅ 댓글 총 ${commentCount}개 생성 완료`);

  // ─────────────────────────────────────
  // 9. 좋아요 (게시글)
  // ─────────────────────────────────────
  console.log('\n9) 좋아요 생성...');
  let likeCount = 0;
  for (const postId of postIds) {
    const numLikes = randInt(0, 15);
    const shuffled = [...memberIds].sort(() => Math.random() - 0.5).slice(0, numLikes);
    for (const memberId of shuffled) {
      try {
        await q(
          `INSERT INTO likes (user_id, post_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
          [memberId, postId]
        );
        likeCount++;
      } catch (e) { /* unique constraint */ }
    }
  }
  // likes_count 업데이트
  await q(`UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) WHERE id = ANY($1)`, [postIds]);
  console.log(`   ✅ 좋아요 약 ${likeCount}개 생성 완료`);

  // ─────────────────────────────────────
  // 완료
  // ─────────────────────────────────────
  console.log('\n=== 시드 완료 요약 ===');
  console.log(`  회원: 50명`);
  console.log(`  일반 게시글: 55개`);
  console.log(`  일정: 55개`);
  console.log(`  공지: 32개`);
  console.log(`  게시글-일정 연동: 10개`);
  console.log(`  일정 참석: ~${attendanceCount}개`);
  console.log(`  공지 출석: ~${noticeAttCount}개`);
  console.log(`  댓글: ${commentCount}개`);
  console.log(`  좋아요: ~${likeCount}개`);
  console.log('\n테스트 계정: testmember01~50@yjc-seed.kr / test1234');

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('시드 오류:', err);
  pool.end();
  process.exit(1);
});
