// 영등포 JC - 웹 앱 메인 스크립트 (완전 재구현)

console.log('🚀 영등포 JC 웹 앱 시작...');
console.log('📅 버전: 2.0');
console.log('⏰ 시간:', new Date().toLocaleString('ko-KR'));

// 네이티브 pull-to-refresh 방지 + 커스텀 새로고침
(function setupOverscrollRefresh() {
    // CSS로도 방지하지만, JS에서도 보강
    document.body.style.overscrollBehaviorY = 'contain';

    var _touchStartY = 0;
    var _isPulling = false;
    var _pullThreshold = 100;
    var _pullIndicator = null;

    function getCurrentScreenRefresher() {
        // 현재 활성 화면에 맞는 데이터 새로고침 함수 반환
        var activeScreen = document.querySelector('.screen.active');
        if (!activeScreen) return null;
        var id = activeScreen.id;
        if (id === 'home-screen' && typeof loadHomeData === 'function') return loadHomeData;
        if (id === 'posts-screen' && typeof loadPostsScreen === 'function') return loadPostsScreen;
        if (id === 'members-screen' && typeof loadMembersScreen === 'function') return loadMembersScreen;
        if (id === 'schedules-screen' && typeof loadSchedulesScreen === 'function') return loadSchedulesScreen;
        if (id === 'profile-screen' && typeof loadProfile === 'function') return loadProfile;
        if (id === 'meetings-screen' && typeof loadMeetingsScreen === 'function') return loadMeetingsScreen;
        if (id === 'org-chart-screen' && typeof loadOrgChartScreen === 'function') return loadOrgChartScreen;
        return null;
    }

    function getOrCreateIndicator() {
        if (_pullIndicator) return _pullIndicator;
        _pullIndicator = document.createElement('div');
        _pullIndicator.id = 'pull-refresh-indicator';
        _pullIndicator.innerHTML = '<div class="pull-refresh-spinner"></div>';
        document.body.appendChild(_pullIndicator);
        return _pullIndicator;
    }

    document.addEventListener('touchstart', function(e) {
        var scrollable = e.target.closest('.screen-content, .search-overlay-results');
        if (scrollable && scrollable.scrollTop > 0) return;
        // 페이지 맨 위에서만 pull-to-refresh 활성화
        if (window.scrollY > 0) return;
        _touchStartY = e.touches[0].clientY;
        _isPulling = true;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!_isPulling) return;
        var dy = e.touches[0].clientY - _touchStartY;
        if (dy < 0) { _isPulling = false; return; }
        if (dy > 20) {
            var indicator = getOrCreateIndicator();
            var progress = Math.min(dy / _pullThreshold, 1);
            indicator.style.transform = 'translateY(' + Math.min(dy * 0.4, 60) + 'px)';
            indicator.style.opacity = progress;
            indicator.classList.toggle('ready', dy >= _pullThreshold);
            indicator.style.display = 'flex';
        }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (!_isPulling) return;
        _isPulling = false;
        var indicator = document.getElementById('pull-refresh-indicator');
        if (indicator && indicator.classList.contains('ready')) {
            // 새로고침 실행
            indicator.style.transform = 'translateY(50px)';
            indicator.innerHTML = '<div class="pull-refresh-spinner spinning"></div>';
            var refresher = getCurrentScreenRefresher();
            if (refresher) {
                Promise.resolve(refresher()).then(function() {
                    hideIndicator();
                    showToast('새로고침 완료');
                }).catch(function() {
                    hideIndicator();
                });
            } else {
                hideIndicator();
            }
        } else {
            hideIndicator();
        }
    }, { passive: true });

    function hideIndicator() {
        var indicator = document.getElementById('pull-refresh-indicator');
        if (indicator) {
            indicator.style.transform = 'translateY(-40px)';
            indicator.style.opacity = '0';
            setTimeout(function() {
                indicator.style.display = 'none';
                indicator.innerHTML = '<div class="pull-refresh-spinner"></div>';
            }, 200);
        }
    }
})();

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
        await authCheck;
        console.log('📊 인증 상태:', currentAuthStatus);

        if (currentAuthStatus === AuthStatus.AUTHENTICATED) {
            targetScreen = 'home';
            console.log('✅ 인증됨 → 홈 화면');
        } else if (currentAuthStatus === AuthStatus.PENDING_APPROVAL) {
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
    
    // 초기 화면은 replaceState로 설정 (pushState 스택 오염 방지)
    if (targetScreen === 'home') {
        history.replaceState({ screen: 'home' }, '', '#home');
        window._navPopstate = true; // navigateToScreen에서 중복 pushState 방지
    }
    navigateToScreen(targetScreen);
    window._navPopstate = false;

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
