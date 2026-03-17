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
const titlesRoutes = require('./routes/titles');
const industriesRoutes = require('./routes/industries');
const { notificationsRouter, pushRouter } = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const mobileAdminRoutes = require('./routes/mobile-admin');
const { startReminderCron } = require('./utils/reminderCron');
const { startNotificationScheduler } = require('./cron/notification-scheduler');

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
    max: 10, // 15분당 최대 10회
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
app.use('/api/titles', titlesRoutes);
app.use('/api/industries', industriesRoutes);
app.use('/api/push', pushRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRoutes);
app.use('/api/mobile-admin', mobileAdminRoutes);
app.use('/api/admin-app', mobileAdminRoutes);

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
app.listen(PORT, () => {
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

    // 리마인더 cron 시작
    startReminderCron();
    // 예약 알림 스케줄러 시작
    startNotificationScheduler();
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
