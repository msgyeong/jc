const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const uploadRoutes = require('./routes/upload');
const noticesRoutes = require('./routes/notices');
const schedulesRoutes = require('./routes/schedules');
const membersRoutes = require('./routes/members');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');
const seedRoutes = require('./routes/seed');
const attendanceRoutes = require('./routes/attendance');
const favoritesRoutes = require('./routes/favorites');
const memberGroupsRoutes = require('./routes/member-groups');
const titlesRoutes = require('./routes/titles');
const industriesRoutes = require('./routes/industries');
const { notificationsRouter, pushRouter } = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const mobileAdminRoutes = require('./routes/mobile-admin');
const meetingsRoutes = require('./routes/meetings');
const organizationsRoutes = require('./routes/organizations');
const contentRoutes = require('./routes/content');
const orgchartRoutes = require('./routes/orgchart');
const mapRoutes = require('./routes/map');
const groupBoardRoutes = require('./routes/group-board');
const bannersRoutes = require('./routes/banners');
const clubsRoutes = require('./routes/clubs');
const { startReminderCron } = require('./utils/reminderCron');
const { startNotificationScheduler } = require('./cron/notification-scheduler');
const { startDataPurgeScheduler } = require('./cron/data-purge-scheduler');

// Express 앱 초기화
const app = express();
const PORT = process.env.API_PORT || 3000;

// CORS 설정
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://jc-production-7db6.up.railway.app']
    : ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000'];
app.use(cors({
    origin: function (origin, callback) {
        // 같은 오리진 요청(origin이 없는 경우) 또는 허용된 오리진
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // 모바일 앱 등 다양한 클라이언트 허용
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 인증 엔드포인트 레이트 리미팅
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 50, // 15분당 최대 50회
    message: { success: false, message: '너무 많은 요청이 발생했습니다. 15분 후 다시 시도해주세요.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

// 요청 로깅 (개발 환경)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// 헬스 체크
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API 루트
app.get('/api', (req, res) => {
    res.json({
        message: '영등포 JC 회원관리 API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            posts: '/api/posts',
            notices: '/api/notices',
            schedules: '/api/schedules',
            members: '/api/members',
            profile: '/api/profile'
        }
    });
});

// API 라우트 등록
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
// seed 라우트는 개발 환경에서만 사용
if (process.env.NODE_ENV !== 'production') {
    app.use('/api/seed', seedRoutes);
}
app.use('/api/attendance', attendanceRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/member-groups', memberGroupsRoutes);
app.use('/api/titles', titlesRoutes);
app.use('/api/industries', industriesRoutes);
app.use('/api/push', pushRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRoutes);
app.use('/api/mobile-admin', mobileAdminRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/admin-app', mobileAdminRoutes);
app.use('/api/orgchart', orgchartRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/group-board', groupBoardRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/clubs', clubsRoutes);

// 일반 사용자용 직책(positions) 목록 조회
const { authenticate: authMiddleware } = require('./middleware/auth');
app.get('/api/positions', authMiddleware, async (req, res) => {
    try {
        const { query: dbQuery } = require('./config/database');
        const result = await dbQuery('SELECT id, name FROM positions WHERE org_id IS NULL OR org_id = (SELECT org_id FROM users WHERE id = $1) ORDER BY sort_order ASC, name ASC', [req.user.userId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get positions error:', error);
        res.json({ success: true, data: [] });
    }
});

// 업로드 파일 정적 제공 (URL: /uploads/파일명)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 웹 정적 파일 제공 (API 라우트보다 뒤에 위치)
// admin 파일은 항상 최신 버전을 받도록 캐시 비활성화
app.use(express.static(path.join(__dirname, '../web'), {
    setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}admin${path.sep}`)) {
            res.setHeader(
                'Cache-Control',
                'no-store, no-cache, must-revalidate, proxy-revalidate',
            );
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    },
}));

// 404 핸들러
app.use(notFoundHandler);

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
app.listen(PORT, async () => {
    console.log('='.repeat(50));
    console.log('🚀 영등포 JC API 서버 시작');
    console.log('='.repeat(50));
    console.log(`📡 포트: ${PORT}`);
    console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('API 엔드포인트:');
    console.log(`  - POST   /api/auth/signup`);
    console.log(`  - POST   /api/auth/login`);
    console.log(`  - GET    /api/auth/me`);
    console.log(`  - GET    /api/posts`);
    console.log(`  - POST   /api/posts`);
    console.log(`  - GET    /api/notices`);
    console.log(`  - GET    /api/schedules`);
    console.log(`  - GET    /api/members`);
    console.log(`  - GET    /api/profile`);
    console.log(`  - GET    /api/push/vapid-key`);
    console.log(`  - POST   /api/push/subscribe`);
    console.log(`  - GET    /api/notifications`);
    console.log('='.repeat(50));

    // 자동 마이그레이션 (신규 컬럼)
    const { query: dbQuery } = require('./config/database');
    dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(500)").catch(() => {});
    dbQuery("ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_banner BOOLEAN DEFAULT false").catch(() => {});
    // 사업 PR 컬럼 (029_business_pr)
    dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS one_line_pr TEXT").catch(() => {});
    dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS service_description TEXT").catch(() => {});
    dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS sns_links JSONB DEFAULT '[]'::jsonb").catch(() => {});
    // 회의 테이블
    dbQuery(`CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY, title VARCHAR(200) NOT NULL, description TEXT,
        meeting_type VARCHAR(50) DEFAULT 'regular', meeting_date TIMESTAMP NOT NULL,
        location VARCHAR(200), status VARCHAR(20) DEFAULT 'scheduled',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS meeting_attendance (
        id SERIAL PRIMARY KEY, meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending', checked_in_at TIMESTAMP,
        UNIQUE(meeting_id, user_id)
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS meeting_votes (
        id SERIAL PRIMARY KEY, meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL, description TEXT,
        vote_type VARCHAR(20) DEFAULT 'yesno',
        options JSONB DEFAULT '["찬성","반대","기권"]',
        status VARCHAR(20) DEFAULT 'open',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(), closed_at TIMESTAMP
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS meeting_vote_responses (
        id SERIAL PRIMARY KEY, vote_id INTEGER REFERENCES meeting_votes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        selected_option VARCHAR(100) NOT NULL, voted_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(vote_id, user_id)
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS meeting_minutes (
        id SERIAL PRIMARY KEY, meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
        title VARCHAR(200), file_data BYTEA NOT NULL, file_name VARCHAR(200),
        file_size INTEGER, mime_type VARCHAR(100) DEFAULT 'application/pdf',
        uploaded_by INTEGER REFERENCES users(id), created_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});

    // 멀티테넌트: 조직 테이블
    dbQuery(`CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, code VARCHAR(50) UNIQUE NOT NULL,
        district VARCHAR(100), region VARCHAR(100), description TEXT,
        logo_data BYTEA, logo_mime VARCHAR(100), is_active BOOLEAN DEFAULT true,
        created_by INTEGER, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});
    dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id)").catch(() => {});
    // role check constraint에 local_admin 추가
    dbQuery("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check").catch(() => {});
    dbQuery("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'local_admin', 'member', 'pending'))").catch(() => {});
    // 기본 조직 생성 + 기존 회원 매핑 (순차 실행)
    dbQuery("INSERT INTO organizations (name, code, district, region, description) VALUES ('영등포JC', 'yeongdeungpo', '서울지구', '서울', '영등포청년회의소') ON CONFLICT (code) DO NOTHING").catch(() => {});
    // 입회일 컬럼
    dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS join_date DATE").catch(() => {});
    // JC 지도 컬럼
    dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS map_visible BOOLEAN DEFAULT true").catch(() => {});
    // 전화번호 공개 범위
    dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_visibility VARCHAR(20) DEFAULT 'local'").catch(() => {});
    dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS business_lat DOUBLE PRECISION").catch(() => {});
    dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS business_lng DOUBLE PRECISION").catch(() => {});
    dbQuery("ALTER TABLE users ADD COLUMN IF NOT EXISTS business_address VARCHAR(500)").catch(() => {});
    // 조직도 테이블
    dbQuery(`CREATE TABLE IF NOT EXISTS orgchart_groups (
        id SERIAL PRIMARY KEY, org_id INTEGER REFERENCES organizations(id),
        name VARCHAR(100) NOT NULL, sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS orgchart_members (
        id SERIAL PRIMARY KEY, group_id INTEGER REFERENCES orgchart_groups(id) ON DELETE CASCADE,
        position_title VARCHAR(100) NOT NULL, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        manual_name VARCHAR(100), sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});
    // 중복 방지 인덱스 (기존 테이블에도 적용)
    dbQuery(`CREATE UNIQUE INDEX IF NOT EXISTS idx_orgchart_members_group_user ON orgchart_members(group_id, user_id) WHERE user_id IS NOT NULL`).catch(() => {});
    // 3초 후 매핑 (조직 생성 완료 대기)
    setTimeout(() => {
        dbQuery("UPDATE users SET org_id = (SELECT id FROM organizations WHERE code = 'yeongdeungpo') WHERE org_id IS NULL").catch(() => {});
    }, 3000);

    // 그룹 게시판 테이블
    dbQuery(`CREATE TABLE IF NOT EXISTS group_posts (
        id SERIAL PRIMARY KEY, group_id INTEGER NOT NULL REFERENCES orgchart_groups(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL, content TEXT, images TEXT,
        is_pinned BOOLEAN DEFAULT false, views INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS group_post_comments (
        id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL, parent_id INTEGER REFERENCES group_post_comments(id) ON DELETE CASCADE,
        is_deleted BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS group_post_reads (
        id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES group_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT NOW(), UNIQUE(post_id, user_id)
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS group_schedules (
        id SERIAL PRIMARY KEY, group_id INTEGER NOT NULL REFERENCES orgchart_groups(id) ON DELETE CASCADE,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL, description TEXT, location VARCHAR(200),
        start_date TIMESTAMP NOT NULL, end_date TIMESTAMP,
        category VARCHAR(50) DEFAULT 'meeting',
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});

    // 사이트 콘텐츠 테이블 (조직도, 비전, 직책업무, 지도, 정관)
    dbQuery(`CREATE TABLE IF NOT EXISTS site_content (
        id SERIAL PRIMARY KEY,
        org_id INTEGER REFERENCES organizations(id),
        content_type VARCHAR(50) NOT NULL,
        title VARCHAR(200),
        body TEXT,
        image_data BYTEA,
        image_mime VARCHAR(100),
        file_data BYTEA,
        file_name VARCHAR(200),
        file_mime VARCHAR(100),
        updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});

    // 배너 광고 테이블 (029_banners)
    dbQuery(`CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY, title VARCHAR(200) NOT NULL, description TEXT,
        image_url TEXT, link_url TEXT, is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0, created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    )`).catch(() => {});

    // soft delete 컬럼 추가 (028_soft_delete_columns)
    await query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL`).catch(() => {});
    await query(`ALTER TABLE schedules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL`).catch(() => {});
    await query(`CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts (deleted_at) WHERE deleted_at IS NULL`).catch(() => {});
    await query(`CREATE INDEX IF NOT EXISTS idx_schedules_deleted_at ON schedules (deleted_at) WHERE deleted_at IS NULL`).catch(() => {});

    // 소모임 테이블 (030_clubs)
    dbQuery(`CREATE TABLE IF NOT EXISTS clubs (
        id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT,
        image_url TEXT, created_by INTEGER NOT NULL REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS club_members (
        id SERIAL PRIMARY KEY, club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member', status VARCHAR(20) DEFAULT 'pending',
        invited_by INTEGER REFERENCES users(id), joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(club_id, user_id)
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS club_posts (
        id SERIAL PRIMARY KEY, club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL, content TEXT, images TEXT,
        is_pinned BOOLEAN DEFAULT false, views INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS club_post_comments (
        id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES club_posts(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL, parent_id INTEGER REFERENCES club_post_comments(id) ON DELETE CASCADE,
        is_deleted BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS club_post_reads (
        id SERIAL PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES club_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT NOW(), UNIQUE(post_id, user_id)
    )`).catch(() => {});
    dbQuery(`CREATE TABLE IF NOT EXISTS club_schedules (
        id SERIAL PRIMARY KEY, club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL, description TEXT, location VARCHAR(200),
        start_date TIMESTAMP NOT NULL, end_date TIMESTAMP, category VARCHAR(50) DEFAULT 'meeting',
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )`).catch(() => {});

    // 리마인더 cron 시작
    startReminderCron();
    // 예약 알림 스케줄러 시작
    startNotificationScheduler();
    // 개인정보 자동 파기 스케줄러 (탈퇴 90일 후)
    startDataPurgeScheduler();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM 신호 수신, 서버 종료 중...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT 신호 수신, 서버 종료 중...');
    process.exit(0);
});
