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

    // 동적 경로: /members/:id
    const memberDetailMatch = path.match(/^\/members\/(\d+)$/);
    if (memberDetailMatch) {
        const memberId = memberDetailMatch[1];
        if (typeof showMemberDetailScreen === 'function') {
            showMemberDetailScreen(memberId);
        } else {
            console.error('❌ showMemberDetailScreen 미정의');
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
            if (typeof updateUserDisplay === 'function') updateUserDisplay();
            loadHomeScreen(); // 홈 화면 로드
        } else if (screenName === 'login') {
            // 로그인 화면으로 돌아갈 때 폼 초기화
            const form = document.getElementById('login-form');
            if (form) {
                form.reset();
            }
            clearAllErrors();
        } else if (screenName === 'signup') {
            const form = document.getElementById('signup-form');
            if (form) {
                form.reset();
            }
            clearAllErrors();
        } else if (screenName === 'forgot-password') {
            const form = document.getElementById('forgot-password-form');
            if (form) {
                form.reset();
                form.style.display = 'block';
            }
            const result = document.getElementById('forgot-password-result');
            if (result) result.style.display = 'none';
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
                await loadProfile();
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
    
    // 비밀번호 찾기
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', () => {
            navigateToScreen('forgot-password');
        });
    }
    
    // 비밀번호 찾기 폼
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
    
    // 임시 비밀번호 복사 버튼
    const copyBtn = document.getElementById('copy-temp-password');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const pw = document.getElementById('temp-password-value').textContent;
            navigator.clipboard.writeText(pw).then(() => {
                copyBtn.textContent = '복사됨!';
                setTimeout(() => { copyBtn.textContent = '복사'; }, 2000);
            });
        });
    }
    
    console.log('✅ 회원가입/비밀번호 찾기 이벤트 설정 완료');
}

// 비밀번호 찾기 폼 처리
async function handleForgotPassword(event) {
    event.preventDefault();
    clearAllErrors();
    
    const email = document.getElementById('forgot-email').value.trim().toLowerCase();
    const name = document.getElementById('forgot-name').value.trim();
    
    let isValid = true;
    
    if (!email) {
        showError('forgot-email-error', '이메일을 입력하세요.');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('forgot-email-error', '올바른 이메일 형식이 아닙니다.');
        isValid = false;
    }
    
    if (!name) {
        showError('forgot-name-error', '이름을 입력하세요.');
        isValid = false;
    }
    
    if (!isValid) return;
    
    const submitBtn = document.querySelector('.btn-forgot-password');
    setButtonLoading(submitBtn, true);
    
    try {
        const result = await apiClient.resetPassword(email, name);
        
        if (result.success && result.tempPassword) {
            document.getElementById('forgot-password-form').style.display = 'none';
            document.getElementById('temp-password-value').textContent = result.tempPassword;
            document.getElementById('forgot-password-result').style.display = 'block';
        }
    } catch (error) {
        showInlineError('forgot-inline-error', error.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}
