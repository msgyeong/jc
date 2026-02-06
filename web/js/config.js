// 앱 설정
const CONFIG = {
    SUPABASE_URL: 'YOUR_SUPABASE_URL', // 예: https://xxxxx.supabase.co
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    DEMO_MODE: true // true로 설정하면 샘플 데이터 사용 (Supabase 없이 테스트 가능)
};

// Supabase 클라이언트 (전역 변수로 사용)
window.supabaseClient = null;

// Supabase 초기화
window.initSupabase = function() {
    try {
        // 데모 모드면 Supabase 초기화 건너뛰기
        if (CONFIG.DEMO_MODE) {
            console.log('🎯 데모 모드 활성화 - 샘플 데이터 사용');
            return null;
        }
        
        if (CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.warn('⚠️ Supabase URL이 설정되지 않았습니다.');
            console.warn('💡 데모 모드로 테스트하려면 CONFIG.DEMO_MODE = true로 설정하세요.');
            return null;
        }
        
        if (typeof window.supabase !== 'undefined') {
            window.supabaseClient = window.supabase.createClient(
                CONFIG.SUPABASE_URL,
                CONFIG.SUPABASE_ANON_KEY
            );
            console.log('✅ Supabase 초기화 완료');
        } else {
            console.warn('⚠️ Supabase CDN 로드 실패');
        }
        
        return window.supabaseClient;
    } catch (error) {
        console.error('❌ Supabase 초기화 실패:', error);
        console.log('💡 데모 모드로 테스트하려면 CONFIG.DEMO_MODE = true로 설정하세요.');
        return null;
    }
}

// 로컬 스토리지 키
const STORAGE_KEYS = {
    REMEMBER_ME: 'auth_remember_me',
    USER_SESSION: 'auth_user_session'
};
