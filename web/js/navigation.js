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
            loadHomeData(); // 홈 화면 로드
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
            // Step 1으로 리셋
            resetForgotPasswordToStep1();
            const form = document.getElementById('forgot-password-form');
            if (form) form.reset();
            const verifyForm = document.getElementById('forgot-verify-form');
            if (verifyForm) verifyForm.reset();
            const setForm = document.getElementById('forgot-set-password-form');
            if (setForm) setForm.reset();
            clearAllErrors();
        } else if (screenName === 'admin') {
            // 관리자 페이지 초기화
            if (typeof initAdminPage === 'function') {
                initAdminPage();
            }
        } else if (screenName === 'notifications') {
            // 알림 센터 — 네비 업데이트 없음 (독립 화면)
        } else if (screenName === 'notification-settings') {
            // 알림 설정 — 프로필 탭 활성
            updateNavigation('profile');
        } else if (screenName === 'posts') {
            updateNavigation('posts');
            if (typeof loadPostsScreen === 'function') {
                loadPostsScreen();
            }
        } else if (screenName === 'settings') {
            updateNavigation('profile');
            if (typeof renderSettingsScreen === 'function') {
                renderSettingsScreen();
            }
        } else if (screenName === 'admin-manage') {
            if (typeof initLocalAdmin === 'function') initLocalAdmin();
        } else if (screenName === 'portal') {
            if (typeof loadPortalScreen === 'function') loadPortalScreen();
        } else if (screenName === 'org-chart') {
            if (typeof loadOrgChartScreen === 'function') loadOrgChartScreen();
        } else if (screenName === 'jc-map') {
            if (typeof loadJcMapScreen === 'function') {
                // 맵은 화면이 표시된 후 초기화해야 함
                setTimeout(function() { loadJcMapScreen(); }, 100);
            }
        } else if (['jc-vision','jc-roles','jc-charter'].includes(screenName)) {
            if (typeof loadContentScreen === 'function') loadContentScreen(screenName);
        }

        // history.pushState for back navigation (로그인 전 화면은 제외)
        var authScreens = ['splash', 'login', 'signup', 'forgot-password', 'pending-approval'];
        if (!window._navPopstate && authScreens.indexOf(screenName) === -1) {
            var stateObj = { screen: screenName };
            history.pushState(stateObj, '', '#' + screenName);
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
                icon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
            } else {
                input.type = 'password';
                icon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
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

    // N배지 초기 셋업 (M-06)
    initNavBadges();

    console.log('Nav setup complete');
}

// M-06: N배지 하단 탭 적용 (숫자 배지)
function initNavBadges() {
    document.querySelectorAll('.nav-item').forEach(item => {
        const tab = item.dataset.tab;
        if (tab === 'posts' || tab === 'schedules') {
            if (!item.querySelector('.nav-badge')) {
                const badge = document.createElement('span');
                badge.className = 'nav-badge';
                badge.dataset.badgeTab = tab;
                item.style.position = 'relative';
                item.appendChild(badge);
            }
        }
    });
    updateNavBadges();
}

async function updateNavBadges() {
    // 로그인 전에는 API 호출하지 않음
    if (!localStorage.getItem('auth_token')) return;
    try {
        // 새 공지 개수 (3일 이내)
        const postsRes = await apiClient.getPosts(1, 20, 'notice');
        const posts = postsRes.posts || (postsRes.data && (postsRes.data.posts || postsRes.data.items)) || [];
        const newNoticeCount = posts.filter(p => {
            const created = new Date(p.created_at);
            return (Date.now() - created) <= 3 * 24 * 60 * 60 * 1000;
        }).length;
        document.querySelectorAll('.nav-badge[data-badge-tab="posts"]').forEach(d => {
            if (newNoticeCount > 0) {
                d.textContent = newNoticeCount > 99 ? '99+' : String(newNoticeCount);
                d.classList.add('visible');
            } else {
                d.textContent = '';
                d.classList.remove('visible');
            }
        });
    } catch (_) {}
    try {
        // 다가오는 일정 개수 (7일 이내)
        const schedRes = await apiClient.getSchedules(true);
        const scheds = schedRes.schedules || (schedRes.data && (schedRes.data.schedules || schedRes.data.items)) || [];
        const upcomingCount = scheds.filter(s => {
            const start = new Date(s.start_date);
            return (start - Date.now()) <= 7 * 24 * 60 * 60 * 1000 && start >= Date.now();
        }).length;
        document.querySelectorAll('.nav-badge[data-badge-tab="schedules"]').forEach(d => {
            if (upcomingCount > 0) {
                d.textContent = upcomingCount > 99 ? '99+' : String(upcomingCount);
                d.classList.add('visible');
            } else {
                d.textContent = '';
                d.classList.remove('visible');
            }
        });
    } catch (_) {}
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
                await loadHomeData();
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

        case 'meetings':
            targetScreen = document.getElementById('meetings-screen');
            if (targetScreen) {
                targetScreen.classList.add('active');
                if (typeof loadMeetingsScreen === 'function') loadMeetingsScreen();
            }
            break;

        default:
            console.error('알 수 없는 탭:', tab);
    }
    
    // history.pushState for back navigation
    if (!window._navPopstate) {
        history.pushState({ screen: tab, tab: tab }, '', '#' + tab);
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
    
    // 비밀번호 찾기 Step 1 폼
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }

    // 비밀번호 찾기 Step 2 폼
    const forgotVerifyForm = document.getElementById('forgot-verify-form');
    if (forgotVerifyForm) {
        forgotVerifyForm.addEventListener('submit', handleForgotVerify);
    }

    // 비밀번호 찾기 Step 3 폼
    const forgotSetForm = document.getElementById('forgot-set-password-form');
    if (forgotSetForm) {
        forgotSetForm.addEventListener('submit', handleForgotSetPassword);
    }
    
    console.log('✅ 회원가입/비밀번호 찾기 이벤트 설정 완료');
}

// 비밀번호 찾기: 현재 verify 토큰 (Step 2에서 사용)
let _forgotResetToken = null;

// 비밀번호 찾기 Step 1: 이메일 + 이름 확인
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
        const result = await apiClient.resetPasswordVerify(email, name);

        if (result.success && result.data) {
            _forgotResetToken = result.data.token;

            // 질문 라벨 및 placeholder 설정
            const questionLabel = document.getElementById('forgot-question-label');
            const answerInput = document.getElementById('forgot-answer');
            questionLabel.textContent = result.data.question.label;

            if (result.data.question.type === 'phone_last4') {
                answerInput.placeholder = '숫자 4자리';
                answerInput.inputMode = 'numeric';
                answerInput.maxLength = 4;
            } else {
                answerInput.placeholder = '답변을 입력하세요';
                answerInput.inputMode = 'text';
                answerInput.maxLength = 100;
            }

            // Step 1 숨기고 Step 2 표시
            document.getElementById('forgot-step1').style.display = 'none';
            document.getElementById('forgot-step2').style.display = 'block';
        }
    } catch (error) {
        if (error.code === 'TOKEN_EXPIRED') {
            resetForgotPasswordToStep1();
        }
        showInlineError('forgot-inline-error', error.message || '본인확인에 실패했습니다.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// 비밀번호 찾기 Step 2: 생년월일 + 랜덤 질문 답변
async function handleForgotVerify(event) {
    event.preventDefault();
    clearAllErrors();

    const birthDate = document.getElementById('forgot-birth').value.trim();
    const answer = document.getElementById('forgot-answer').value.trim();

    let isValid = true;

    if (!birthDate) {
        showError('forgot-birth-error', '생년월일을 입력하세요.');
        isValid = false;
    } else if (!/^\d{6}$/.test(birthDate)) {
        showError('forgot-birth-error', '6자리 숫자로 입력하세요. (예: 901231)');
        isValid = false;
    }

    if (!answer) {
        showError('forgot-answer-error', '답변을 입력하세요.');
        isValid = false;
    }

    if (!isValid) return;

    const submitBtn = document.querySelector('.btn-forgot-verify');
    setButtonLoading(submitBtn, true);

    try {
        const result = await apiClient.resetPassword(_forgotResetToken, birthDate, answer);

        if (result.success) {
            // 본인확인 통과 → Step 3 (새 비밀번호 입력) 표시
            document.getElementById('forgot-step2').style.display = 'none';
            document.getElementById('forgot-step3').style.display = 'block';
        }
    } catch (error) {
        if (error.code === 'TOKEN_EXPIRED') {
            resetForgotPasswordToStep1();
            showInlineError('forgot-inline-error', error.message);
        } else {
            showInlineError('forgot-verify-error', error.message || '본인확인에 실패했습니다.');
        }
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// 비밀번호 찾기 Step 3: 새 비밀번호 설정
async function handleForgotSetPassword(event) {
    event.preventDefault();
    clearAllErrors();

    const newPassword = document.getElementById('forgot-new-password').value;
    const confirmPassword = document.getElementById('forgot-confirm-password').value;

    let isValid = true;

    if (!newPassword) {
        showError('forgot-new-password-error', '새 비밀번호를 입력하세요.');
        isValid = false;
    } else if (newPassword.length < 8) {
        showError('forgot-new-password-error', '비밀번호는 8자 이상이어야 합니다.');
        isValid = false;
    }

    if (!confirmPassword) {
        showError('forgot-confirm-password-error', '비밀번호 확인을 입력하세요.');
        isValid = false;
    } else if (newPassword !== confirmPassword) {
        showError('forgot-confirm-password-error', '비밀번호가 일치하지 않습니다.');
        isValid = false;
    }

    if (!isValid) return;

    const submitBtn = document.querySelector('.btn-forgot-set');
    setButtonLoading(submitBtn, true);

    try {
        const result = await apiClient.resetPasswordSet(_forgotResetToken, newPassword);

        if (result.success) {
            document.getElementById('forgot-step3').style.display = 'none';
            document.getElementById('forgot-password-result').style.display = 'block';
            _forgotResetToken = null;
        }
    } catch (error) {
        if (error.code === 'TOKEN_EXPIRED') {
            resetForgotPasswordToStep1();
            showInlineError('forgot-inline-error', error.message);
        } else {
            showInlineError('forgot-set-error', error.message || '비밀번호 변경에 실패했습니다.');
        }
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// 비밀번호 찾기 화면을 Step 1으로 리셋
function resetForgotPasswordToStep1() {
    _forgotResetToken = null;
    document.getElementById('forgot-step1').style.display = 'block';
    document.getElementById('forgot-step2').style.display = 'none';
    document.getElementById('forgot-step3').style.display = 'none';
    document.getElementById('forgot-password-result').style.display = 'none';
    const birthInput = document.getElementById('forgot-birth');
    const answerInput = document.getElementById('forgot-answer');
    const newPwInput = document.getElementById('forgot-new-password');
    const confirmPwInput = document.getElementById('forgot-confirm-password');
    if (birthInput) birthInput.value = '';
    if (answerInput) answerInput.value = '';
    if (newPwInput) newPwInput.value = '';
    if (confirmPwInput) confirmPwInput.value = '';
}

// ========== 뒤로가기 (popstate) ==========

// 로그인 전 화면 목록
var _authScreenNames = ['splash', 'login', 'signup', 'forgot-password', 'pending-approval'];

// 현재 활성 화면이 로그인 전 화면인지 확인
function _isOnAuthScreen() {
    for (var i = 0; i < _authScreenNames.length; i++) {
        var el = document.getElementById(_authScreenNames[i] + '-screen');
        if (el && el.classList.contains('active')) return true;
    }
    return false;
}

// 로그인 여부 확인
function _isLoggedIn() {
    return !!localStorage.getItem('auth_token');
}

window.addEventListener('popstate', function(e) {
    // 로그인 전 화면이면 popstate 무시
    if (_isOnAuthScreen() || !_isLoggedIn()) {
        return;
    }

    var state = e.state;
    if (state && state.screen) {
        // 이전 화면으로 돌아가기
        window._navPopstate = true;
        if (state.tab) {
            switchTab(state.tab);
        } else if (state.screen === 'admin-hub' && typeof showAdminHub === 'function') {
            showAdminHub();
        } else if (state.screen === 'pending-members' && typeof showPendingMembersScreen === 'function') {
            showPendingMembersScreen();
        } else if (state.screen === 'push-send' && typeof showPushSendScreen === 'function') {
            showPushSendScreen();
        } else if (state.screen === 'notice-manage' && typeof showNoticeManageScreen === 'function') {
            showNoticeManageScreen();
        } else if (state.screen === 'notice-edit' && typeof showNoticeManageScreen === 'function') {
            showNoticeManageScreen();
        } else if (state.screen === 'post-manage' && typeof showPostManageScreen === 'function') {
            showPostManageScreen();
        } else if (state.screen === 'schedule-manage' && typeof showScheduleManageScreen === 'function') {
            showScheduleManageScreen();
        } else if (state.screen === 'admin-manage' && typeof initLocalAdmin === 'function') {
            navigateToScreen('admin-manage');
        } else if (['org-chart','jc-vision','jc-roles','jc-charter','jc-map'].includes(state.screen)) {
            navigateToScreen(state.screen);
        } else {
            navigateToScreen(state.screen);
        }
        window._navPopstate = false;
    } else {
        // history 스택 바닥 (홈에서 더 뒤로 갈 곳 없음) → exit 모달
        var homeScreen = document.getElementById('home-screen');
        if (homeScreen && homeScreen.classList.contains('active')) {
            // 스택 복원해서 다시 뒤로가기 가능하게
            history.pushState({ screen: 'home' }, '', '#home');
            showExitDialog();
        }
    }
});

function showExitDialog() {
    var dialog = document.getElementById('exit-confirm-dialog');
    if (dialog) dialog.classList.add('show');
}

function closeExitDialog() {
    var dialog = document.getElementById('exit-confirm-dialog');
    if (dialog) dialog.classList.remove('show');
}

function confirmExit() {
    closeExitDialog();
    // 로그아웃 후 로그인 화면으로 이동
    if (typeof handleLogout === 'function') {
        handleLogout();
    } else {
        // fallback
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        navigateToScreen('login');
    }
}

// ── 사이드 메뉴 (햄버거) ──
function openSideMenu() {
    var menu = document.getElementById('side-menu');
    var overlay = document.getElementById('side-menu-overlay');
    menu.style.display = 'flex';
    overlay.style.display = 'block';
    // 한 프레임 후 transition 적용
    requestAnimationFrame(function() {
        menu.classList.add('open');
        overlay.classList.add('open');
    });
    var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    // 로컬 관리 메뉴 표시/숨김
    var adminLink = document.getElementById('side-menu-admin');
    if (adminLink) {
        adminLink.style.display = (user && ['admin', 'super_admin', 'local_admin'].includes(user.role)) || window.__hasAnyPermission ? 'flex' : 'none';
    }
    var profileEl = document.getElementById('side-menu-profile');
    if (profileEl && user) {
        profileEl.innerHTML = '<div style="width:36px;height:36px;border-radius:50%;background:#DBEAFE;display:flex;align-items:center;justify-content:center;font-weight:600;color:#1E3A5F">'
            + escapeHtml((user.name || '?')[0]) + '</div>'
            + '<div><div style="font-weight:600;font-size:14px">' + escapeHtml(user.name || '') + '</div>'
            + '<div style="font-size:12px;color:#6B7280">' + escapeHtml(user.email || '') + '</div></div>';
    }
}
function closeSideMenu() {
    var menu = document.getElementById('side-menu');
    var overlay = document.getElementById('side-menu-overlay');
    menu.classList.remove('open');
    overlay.classList.remove('open');
    setTimeout(function() {
        menu.style.display = 'none';
        overlay.style.display = 'none';
    }, 300); // transition 끝난 후 숨김
}
