const express = require('express');
const cors = require('cors');
const path = require('path');
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

// Express 앱 초기화
const app = express();
const PORT = process.env.API_PORT || 3000;

// CORS 설정
app.use(cors({
    origin: '*', // 모든 도메인 허용 (프로덕션에서는 특정 도메인만 허용 권장)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/seed', seedRoutes);

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
    console.log('='.repeat(50));
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
