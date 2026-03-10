// 영등포 JC - 웹 앱 메인 스크립트 (완전 재구현)

console.log('🚀 영등포 JC 웹 앱 시작...');
console.log('📅 버전: 2.0');
console.log('⏰ 시간:', new Date().toLocaleString('ko-KR'));

// 앱 초기화
async function initApp() {
    console.log('\n=== 앱 초기화 시작 ===\n');
    
    try {
        // 1. API 클라이언트 확인
        console.log('🔹 Step 1: API 클라이언트 확인');
        if (!window.apiClient) {
            throw new Error('API 클라이언트가 초기화되지 않았습니다.');
        }
        console.log('✅ API 클라이언트 준비됨:', window.apiClient.baseURL);
        
        // 2. UI 이벤트 설정
        console.log('🔹 Step 2: UI 이벤트 설정');
        // auth.js에서 이미 설정되므로 여기서는 추가 설정만
        setupBottomNavigation();
        setupSignupEvents();
        setupFABButtons();
        setupViewAllButtons();
        
        // 3. 초기 화면 표시
        console.log('🔹 Step 3: 초기 화면 표시');
        await showInitialScreen();
        
        console.log('\n=== 앱 초기화 완료 ===\n');
        
    } catch (error) {
        console.error('❌ 앱 초기화 오류:', error);
        alert('앱 초기화 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.');
    }
}

// 초기 화면 표시
async function showInitialScreen() {
    console.log('🔹 초기 화면 표시 시작');
    
    // 스플래시 화면 표시
    navigateToScreen('splash');
    
    // 인증 상태 확인 (최대 3초 타임아웃)
    const timeout = new Promise((resolve) => 
        setTimeout(() => {
            console.log('⏰ 인증 확인 타임아웃 (3초)');
            resolve('timeout');
        }, 3000)
    );
    
    const authCheck = checkAuthStatus();
    
    // 타임아웃과 레이스
    const result = await Promise.race([authCheck, timeout]);
    
    let targetScreen = 'login';
    
    if (result !== 'timeout') {
        const status = await authCheck;
        console.log('📊 인증 상태:', status);
        
        if (status === AuthStatus.AUTHENTICATED) {
            targetScreen = 'home';
            console.log('✅ 인증됨 → 홈 화면');
        } else if (status === AuthStatus.PENDING_APPROVAL) {
            targetScreen = 'pending-approval';
            console.log('⏳ 승인 대기 → 승인 대기 화면');
        } else {
            targetScreen = 'login';
            console.log('❌ 미인증 → 로그인 화면');
        }
    } else {
        console.log('⏰ 타임아웃 → 로그인 화면');
        targetScreen = 'login';
    }
    
    // 최소 1초 스플래시 표시 후 전환
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    navigateToScreen(targetScreen);

    // 로그인 상태이면 푸시 초기화 + 안읽은 알림 수 조회
    if (targetScreen === 'home') {
        if (typeof initPush === 'function') initPush();
        if (typeof fetchUnreadNotificationCount === 'function') fetchUnreadNotificationCount();
    }

    console.log('✅ 초기 화면 표시 완료:', targetScreen);
}

// DOM 로드 완료 후 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // 이미 로드된 경우 즉시 실행
    initApp();
}

// 전역 에러 핸들러
window.addEventListener('error', (event) => {
    console.error('❌ 전역 에러:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ 처리되지 않은 Promise 거부:', event.reason);
});

// FAB 버튼 설정
function setupFABButtons() {
    const createPostBtn = document.getElementById('create-post-btn');
    const createNoticeBtn = document.getElementById('create-notice-btn');
    const createScheduleBtn = document.getElementById('create-schedule-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    
    if (createPostBtn) {
        createPostBtn.addEventListener('click', handleCreatePost);
    }
    
    if (createNoticeBtn) {
        createNoticeBtn.addEventListener('click', handleCreateNotice);
    }
    
    if (createScheduleBtn) {
        createScheduleBtn.addEventListener('click', handleCreateSchedule);
    }
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', handleEditProfile);
    }
}

// "전체 보기" 버튼 설정
function setupViewAllButtons() {
    document.querySelectorAll('[data-navigate]').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.target.dataset.navigate;
            if (target) {
                switchTab(target);
            }
        });
    });
}

// 디버그 정보 출력 (개발 모드)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('\n📝 개발 모드 활성화');
    console.log('💡 팁: 콘솔에서 다음 함수들을 사용할 수 있습니다:');
    console.log('  - navigateToScreen("screen-name")');
    console.log('  - checkAuthStatus()');
    console.log('  - currentUser (현재 사용자 정보)');
    console.log('  - currentAuthStatus (현재 인증 상태)');
}
