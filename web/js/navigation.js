// 화면 전환 및 네비게이션 (완전 재구현)

// 경로 기반 네비게이션 (새로 추가)
function navigateTo(path) {
    console.log('🔗 경로 이동:', path);

    // 동적 경로: /posts/:id
    const postDetailMatch = path.match(/^\/posts\/(\d+)$/);
    if (postDetailMatch) {
        const postId = postDetailMatch[1];
        if (typeof showPostDetailScreen === 'function') {
            showPostDetailScreen(postId);
        } else {
            console.error('❌ showPostDetailScreen 미정의');
        }
        return;
    }

    // 동적 경로: /notices/:id
    const noticeDetailMatch = path.match(/^\/notices\/(\d+)$/);
    if (noticeDetailMatch) {
        const noticeId = noticeDetailMatch[1];
        if (typeof showNoticeDetailScreen === 'function') {
            showNoticeDetailScreen(noticeId);
        } else {
            console.error('❌ showNoticeDetailScreen 미정의');
        }
        return;
    }

    // 동적 경로: /schedules/:id
    const scheduleDetailMatch = path.match(/^\/schedules\/(\d+)$/);
    if (scheduleDetailMatch) {
        const scheduleId = scheduleDetailMatch[1];
        if (typeof showScheduleDetailScreen === 'function') {
            showScheduleDetailScreen(scheduleId);
        } else {
            console.error('❌ showScheduleDetailScreen 미정의');
        }
        return;
    }

    // 경로를 화면 이름으로 변환
    const pathToScreen = {
        '/': 'splash',
        '/login': 'login',
        '/signup': 'signup',
        '/pending': 'pending-approval',
        '/home': 'home',
        '/posts': 'posts',
        '/notices': 'notices',
        '/schedules': 'schedules',
        '/members': 'members',
        '/profile': 'profile',
        '/admin': 'admin'
    };

    const screenName = pathToScreen[path];
    if (screenName) {
        navigateToScreen(screenName);
    } else {
        console.error('❌ 알 수 없는 경로:', path);
    }
}

// 화면 전환
function navigateToScreen(screenName) {
    console.log('📱 화면 전환:', screenName);
    
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // 선택한 화면 표시
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        
        // 화면별 추가 처리
        if (screenName === 'home') {
            updateNavigation('home');
            updateUserDisplay();
            loadHomeScreen(); // 홈 화면 로드
        } else if (screenName === 'login') {
            // 로그인 화면으로 돌아갈 때 폼 초기화
            const form = document.getElementById('login-form');
            if (form) {
                form.reset();
            }
            clearAllErrors();
        } else if (screenName === 'signup') {
            // 회원가입 화면으로 갈 때 폼 초기화
            const form = document.getElementById('signup-form');
            if (form) {
                form.reset();
            }
            clearAllErrors();
        } else if (screenName === 'admin') {
            // 관리자 페이지 초기화
            if (typeof initAdminPage === 'function') {
                initAdminPage();
            }
        } else if (screenName === 'posts') {
            updateNavigation('posts');
            if (typeof loadPostsScreen === 'function') {
                loadPostsScreen();
            }
        }
        
        console.log('✅ 화면 전환 완료:', screenName);
    } else {
        console.error('❌ 화면을 찾을 수 없음:', screenName);
    }
}

// 하단 네비게이션 업데이트
function updateNavigation(activeTab) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === activeTab) {
            item.classList.add('active');
        }
    });
}

// 비밀번호 표시/숨김 토글 설정
function setupPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const input = document.getElementById(targetId);
            const icon = button.querySelector('.icon');
            
            if (!input) return;
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = '🙈';
            } else {
                input.type = 'password';
                icon.textContent = '👁️';
            }
        });
    });
    
    console.log('✅ 비밀번호 토글 설정 완료');
}

// 하단 네비게이션 이벤트 설정
function setupBottomNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            switchTab(tab);
        });
    });
    
    console.log('✅ 하단 네비게이션 설정 완료');
}

// 탭 전환 함수
async function switchTab(tab) {
    console.log('📱 탭 전환:', tab);
    
    // 모든 네비게이션 업데이트
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tab) {
            item.classList.add('active');
        }
    });
    
    // 화면 전환
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    let targetScreen;
    
    switch(tab) {
        case 'home':
            targetScreen = document.getElementById('home-screen');
            if (targetScreen) {
                targetScreen.classList.add('active');
                await loadHomeScreen();
            }
            break;
            
        case 'posts':
            targetScreen = document.getElementById('posts-screen');
            if (targetScreen) {
                targetScreen.classList.add('active');
                await loadPostsScreen();
            }
            break;
            
        case 'notices':
            targetScreen = document.getElementById('notices-screen');
            if (targetScreen) {
                targetScreen.classList.add('active');
                await loadNoticesScreen();
            }
            break;
            
        case 'schedules':
            targetScreen = document.getElementById('schedules-screen');
            if (targetScreen) {
                targetScreen.classList.add('active');
                await loadSchedulesScreen();
            }
            break;
            
        case 'members':
            targetScreen = document.getElementById('members-screen');
            if (targetScreen) {
                targetScreen.classList.add('active');
                await loadMembersScreen();
            }
            break;
            
        case 'profile':
            targetScreen = document.getElementById('profile-screen');
            if (targetScreen) {
                targetScreen.classList.add('active');
                await loadProfileScreen();
            }
            break;
            
        default:
            console.error('알 수 없는 탭:', tab);
    }
    
    console.log('✅ 탭 전환 완료:', tab);
}

// 회원가입 관련 이벤트 설정
function setupSignupEvents() {
    // 회원가입 링크
    const signupLink = document.getElementById('signup-link');
    if (signupLink) {
        signupLink.addEventListener('click', () => {
            navigateToScreen('signup');
        });
    }
    
    // 비밀번호 찾기 (TODO)
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', () => {
            alert('비밀번호 찾기 기능은 개발 중입니다.');
        });
    }
    
    console.log('✅ 회원가입 관련 이벤트 설정 완료');
}
