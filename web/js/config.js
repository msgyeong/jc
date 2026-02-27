// 앱 설정
const CONFIG = {
    APP_NAME: '영등포 JC',
    // 로컬 테스트: localhost:3000 사용, Railway 배포: /api 사용
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : '/api',
    VERSION: '2.1'
};

// 로컬 스토리지 키
const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_INFO: 'user_info',
    REMEMBER_ME: 'auth_remember_me'
};

console.log('✅ Config 로드 완료 - Railway API 모드');
