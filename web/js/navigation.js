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
// ========== 라우터 (Phase 3 개선) ==========
// nav: 탭 활성화, showNav: 네비바 표시, init: 진입, leave: 이탈 정리, noHistory: pushState 안함
var _currentScreen = null;
var _lastScreenName = '';
var _navStack = []; // 네비게이션 스택 — forward/back 방향 판단용
var _screenCache = {}; // 화면 캐싱 — 뒤로가기 시 깜빡임 방지

// 목록 화면 = 스택 초기화 대상 (탭 네비로 이동 시)
var _tabScreens = ['home', 'posts', 'schedules', 'members', 'meetings', 'profile'];

var _routes = {
    'home':         { nav: 'home',      showNav: true,  init: function() { if (typeof updateUserDisplay === 'function') updateUserDisplay(); loadHomeData(); updateNavBadges(); } },
    'posts':        { nav: 'posts',     showNav: true,  init: function() { if (typeof loadPostsScreen === 'function') loadPostsScreen(); } },
    'schedules':    { nav: 'schedules', showNav: true,
        init: function() { if (typeof loadSchedulesScreen === 'function') loadSchedulesScreen(); },
        leave: function() { if (typeof _scheduleDetailActive !== 'undefined') _scheduleDetailActive = false; if (typeof backToScheduleList === 'function') backToScheduleList(); }
    },
    'members':      { nav: 'members',   showNav: true,  init: function() { if (typeof loadMembersScreen === 'function') loadMembersScreen(); } },
    'meetings':     { nav: 'meetings',  showNav: true,  init: function() { if (typeof loadMeetingsScreen === 'function') loadMeetingsScreen(); } },
    'profile':      { nav: 'profile',   showNav: true,  init: function() { if (typeof loadProfile === 'function') loadProfile(); } },
    'login':        { noHistory: true, init: function() { var f = document.getElementById('login-form'); if (f) f.reset(); clearAllErrors(); setTimeout(function() { var el = document.getElementById('login-email'); if (el) el.focus(); }, 100); } },
    'signup':       { noHistory: true, init: function() { var f = document.getElementById('signup-form'); if (f) f.reset(); clearAllErrors(); setTimeout(function() { var el = document.getElementById('signup-org'); if (el) el.focus(); }, 100); } },
    'forgot-password': { noHistory: true, init: function() { resetForgotPasswordToStep1(); ['forgot-password-form','forgot-verify-form','forgot-set-password-form'].forEach(function(id) { var f = document.getElementById(id); if (f) f.reset(); }); clearAllErrors(); setTimeout(function() { var el = document.getElementById('forgot-email'); if (el) el.focus(); }, 100); } },
    'pending-approval': { noHistory: true },
    'admin':        { init: function() { if (typeof initAdminPage === 'function') initAdminPage(); } },
    'admin-manage': { init: function() { if (typeof initLocalAdmin === 'function') initLocalAdmin(); } },
    'notifications': {},
    'notification-settings': { nav: 'profile' },
    'settings':     { nav: 'profile', init: function() { if (typeof renderSettingsScreen === 'function') renderSettingsScreen(); } },
    'portal':       { init: function() { if (typeof loadPortalScreen === 'function') loadPortalScreen(); } },
    'org-chart':    { init: function() { if (typeof loadOrgChartScreen === 'function') loadOrgChartScreen(); } },
    'jc-map':       { init: function() { setTimeout(function() { if (typeof loadJcMapScreen === 'function') loadJcMapScreen(); }, 100); } },
    'jc-vision':    { init: function() { if (typeof loadContentScreen === 'function') loadContentScreen('jc-vision'); } },
    'jc-roles':     { init: function() { if (typeof loadContentScreen === 'function') loadContentScreen('jc-roles'); } },
    'jc-charter':   { init: function() { if (typeof loadContentScreen === 'function') loadContentScreen('jc-charter'); } },
    'group-board':  {
        init: function() { if (typeof loadGroupBoardScreen === 'function') loadGroupBoardScreen(); },
        leave: function() { if (typeof _currentGroupBoardId !== 'undefined') { _groupBoardLoading = false; } }
    },
    'clubs':        { init: function() { if (typeof loadClubsScreen === 'function') loadClubsScreen(); } },
    'club-detail':  { init: function() { if (typeof loadClubDetailScreen === 'function') loadClubDetailScreen(); } },
    'club-create':  { init: function() { if (typeof initClubCreateForm === 'function') initClubCreateForm(); } },
    'club-invite':  { init: function() { if (typeof loadClubInviteScreen === 'function') loadClubInviteScreen(); } },
    'club-post-form': { init: function() { if (typeof initClubPostForm === 'function') initClubPostForm(); } },
    'club-schedule-form': { init: function() { if (typeof initClubScheduleForm === 'function') initClubScheduleForm(); } },
    'post-detail':   { nav: 'posts', showNav: true },
    'member-detail': {},
    'meeting-records': { init: function() { if (typeof loadMeetingRecordsScreen === 'function') loadMeetingRecordsScreen(); } }
};

// 중앙 pushState 함수 — 모든 파일에서 이것만 호출
function pushRoute(screenName, extraState) {
    if (window._navPopstate) return;
    var state = { screen: screenName };
    if (extraState) {
        for (var k in extraState) state[k] = extraState[k];
    }
    history.pushState(state, '', '#' + screenName);
}

function navigateToScreen(screenName, opts) {
    opts = opts || {};
    var route = _routes[screenName] || {};

    // 동일 화면 재진입 방지 (탭 클릭 등)
    if (_currentScreen === screenName && !opts.force) return;

    // ─── 방향 결정 (스택 기반) ───
    var isBack = opts.back || false;
    var isTabSwitch = _tabScreens.indexOf(screenName) >= 0;

    if (!isBack && !isTabSwitch) {
        // 상세/생성/편집 화면으로 전진
        _navStack.push(screenName);
    } else if (isBack && _navStack.length > 0) {
        _navStack.pop();
    } else if (isTabSwitch) {
        // 탭 전환 시 스택 초기화
        _navStack = [screenName];
    }

    // ─── 이전 화면 처리 ───
    var prevScreen = _currentScreen ? document.getElementById(_currentScreen + '-screen') : null;
    if (_currentScreen) {
        var prevRoute = _routes[_currentScreen];
        if (prevRoute && prevRoute.leave) {
            try { prevRoute.leave(); } catch (e) { console.error('Screen leave error:', _currentScreen, e); }
        }

        // 이전 화면 슬라이드 아웃 애니메이션
        if (prevScreen && _currentScreen !== screenName) {
            var outClass = isBack ? 'slide-out-right' : (isTabSwitch ? '' : 'slide-out-left');
            if (outClass) {
                prevScreen.classList.add(outClass);
                (function(el, cls) {
                    setTimeout(function() {
                        el.classList.remove('active', cls);
                    }, 200);
                })(prevScreen, outClass);
            } else {
                prevScreen.classList.remove('active', 'slide-forward', 'slide-back');
            }
        }
    }

    _currentScreen = screenName;

    // ─── 이전 화면이 아닌 다른 모든 화면 숨기기 ───
    document.querySelectorAll('.screen').forEach(function(s) {
        var id = s.id.replace('-screen', '');
        if (id !== screenName && id !== (_lastScreenName || '')) {
            s.classList.remove('active', 'slide-forward', 'slide-back', 'slide-out-left', 'slide-out-right');
        }
    });

    // ─── 하단 네비바 ───
    var sharedNav = document.getElementById('shared-bottom-nav');
    if (sharedNav) {
        sharedNav.style.display = route.showNav ? '' : 'none';
    }

    // ─── 새 화면 표시 ───
    var targetScreen = document.getElementById(screenName + '-screen');
    if (targetScreen) {
        // 슬라이드 방향 적용
        var inClass = '';
        if (!isTabSwitch) {
            inClass = isBack ? 'slide-back' : 'slide-forward';
        }

        // 약간의 딜레이로 이전 화면 아웃과 겹침 효과
        var delay = (prevScreen && !isTabSwitch) ? 50 : 0;
        setTimeout(function() {
            targetScreen.classList.remove('slide-forward', 'slide-back', 'slide-out-left', 'slide-out-right');
            if (inClass) targetScreen.classList.add(inClass);
            targetScreen.classList.add('active');

            // 애니메이션 클래스 정리
            if (inClass) {
                setTimeout(function() {
                    targetScreen.classList.remove(inClass);
                }, 250);
            }
        }, delay);

        _lastScreenName = screenName;

        // 탭 활성화
        if (route.nav) updateNavigation(route.nav);

        // 화면 초기화
        if (route.init) {
            try { route.init(); } catch (err) { console.error('Screen init error:', screenName, err); }
        }

        // pushState
        if (!route.noHistory) {
            pushRoute(screenName);
        }
    } else {
        console.error('Screen not found:', screenName);
    }
}

// 뒤로가기 헬퍼
function goBack() {
    if (_navStack.length > 1) {
        _navStack.pop();
        var prev = _navStack[_navStack.length - 1];
        navigateToScreen(prev, { back: true });
    } else {
        history.back();
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

var _navBadgeTimer = null;
function updateNavBadges() {
    // 디바운스 — 500ms 이내 중복 호출 방지
    if (_navBadgeTimer) clearTimeout(_navBadgeTimer);
    _navBadgeTimer = setTimeout(_updateNavBadgesNow, 500);
}
async function _updateNavBadgesNow() {
    _navBadgeTimer = null;
    // 로그인 전에는 API 호출하지 않음
    if (!localStorage.getItem('auth_token')) return;
    try {
        // 새 공지 개수 (3일 이내 + 미읽음) — 공지 + 일반 모두 확인
        let newPostCount = 0;
        const noticeRes = await apiClient.getPosts(1, 50, 'notice');
        const notices = noticeRes.posts || (noticeRes.data && (noticeRes.data.posts || noticeRes.data.items)) || [];
        newPostCount += notices.filter(p => {
            const created = new Date(p.created_at);
            return (Date.now() - created) <= 3 * 24 * 60 * 60 * 1000 && !p.read_by_current_user;
        }).length;
        const generalRes = await apiClient.getPosts(1, 50, 'general');
        const generals = generalRes.posts || (generalRes.data && (generalRes.data.posts || generalRes.data.items)) || [];
        newPostCount += generals.filter(p => {
            const created = new Date(p.created_at);
            return (Date.now() - created) <= 3 * 24 * 60 * 60 * 1000 && !p.read_by_current_user;
        }).length;
        document.querySelectorAll('.nav-badge[data-badge-tab="posts"]').forEach(d => {
            if (newPostCount > 0) {
                d.textContent = newPostCount > 99 ? '99+' : String(newPostCount);
                d.classList.add('visible');
            } else {
                d.textContent = '';
                d.classList.remove('visible');
            }
        });
    } catch (_) {
        // API 실패 시 뱃지 제거
        document.querySelectorAll('.nav-badge[data-badge-tab="posts"]').forEach(d => {
            d.textContent = '';
            d.classList.remove('visible');
        });
    }
    // 일정 배지: 3일 이내 다가오는 일정만 표시
    try {
        const schedRes = await apiClient.getSchedules(true);
        const scheds = schedRes.schedules || (schedRes.data && (schedRes.data.schedules || schedRes.data.items)) || [];
        const now = new Date();
        const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const upcomingCount = scheds.filter(function(s) {
            var d = new Date(s.start_date);
            return d >= now && d <= threeDaysLater;
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

    // 소모임 초대 대기 배지
    try {
        const clubRes = await apiClient.request('/clubs');
        if (clubRes.success) {
            const pendingCount = (clubRes.clubs || []).filter(c => c.my_status === 'pending').length;
            const badge = document.getElementById('club-invite-badge');
            if (badge) {
                if (pendingCount > 0) {
                    badge.textContent = String(pendingCount);
                    badge.style.display = '';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (_) {}
}

// 탭 전환 함수
async function switchTab(tab) {
    // 일정 탭: 상세 플래그 해제
    if (tab === 'schedules') {
        if (typeof _scheduleDetailActive !== 'undefined') _scheduleDetailActive = false;
    }
    // 탭 전환은 navigateToScreen에 위임 (스택 초기화 + 애니메이션 없음)
    navigateToScreen(tab, { force: tab === _currentScreen });
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
            updateForgotStepIndicator(2);
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
            updateForgotStepIndicator(3);
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
            updateForgotStepIndicator(0);
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

// 비밀번호 찾기 Step Indicator 업데이트
function updateForgotStepIndicator(currentStep) {
    var dots = document.querySelectorAll('#forgot-step-indicator .step-dot');
    var lines = document.querySelectorAll('#forgot-step-indicator .step-line');
    dots.forEach(function(dot, i) {
        var step = i + 1;
        dot.classList.remove('active', 'done');
        if (step < currentStep) dot.classList.add('done');
        else if (step === currentStep) dot.classList.add('active');
    });
    lines.forEach(function(line, i) {
        line.classList.toggle('done', i + 1 < currentStep);
    });
    // indicator 표시/숨김
    var indicator = document.getElementById('forgot-step-indicator');
    if (indicator) indicator.style.display = currentStep > 0 ? 'flex' : 'none';
}

// 비밀번호 찾기 화면을 Step 1으로 리셋
function resetForgotPasswordToStep1() {
    _forgotResetToken = null;
    document.getElementById('forgot-step1').style.display = 'block';
    document.getElementById('forgot-step2').style.display = 'none';
    document.getElementById('forgot-step3').style.display = 'none';
    document.getElementById('forgot-password-result').style.display = 'none';
    updateForgotStepIndicator(1);
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
    // 로그인 전 화면이면 popstate 무시 + 스택 복원
    if (_isOnAuthScreen() || !_isLoggedIn()) {
        return;
    }

    // 검색 오버레이가 열려있으면 닫기만
    var memberOverlay = document.getElementById('member-search-overlay');
    if (memberOverlay && memberOverlay.classList.contains('open')) {
        memberOverlay.classList.remove('open');
        return;
    }

    var state = e.state;
    if (state && state.screen) {
        window._navPopstate = true;

        // 특수 화면 (상세 뷰에서 부모로 복귀)
        var _popstateSpecial = {
            'schedule-detail': function() {
                // backToScheduleList는 loadSchedulesScreen 내부에서 처리
                if (typeof _scheduleDetailActive !== 'undefined') _scheduleDetailActive = false;
                navigateToScreen('schedules');
            },
            'post-detail': function() { navigateToScreen('posts'); },
            'group-board': function() {
                // 항상 openGroupBoard로 상태 초기화 보장
                if (typeof openGroupBoard === 'function') {
                    var gId = state.groupId || (typeof _currentGroupBoardId !== 'undefined' ? _currentGroupBoardId : null);
                    var gName = state.groupName || (typeof _currentGroupBoardName !== 'undefined' ? _currentGroupBoardName : '');
                    if (gId) {
                        openGroupBoard(gId, gName);
                    } else {
                        navigateToScreen('orgchart');
                    }
                } else {
                    navigateToScreen('orgchart');
                }
            },
            'admin-hub': function() { if (typeof showAdminHub === 'function') showAdminHub(); },
            'pending-members': function() { if (typeof showPendingMembersScreen === 'function') showPendingMembersScreen(); },
            'push-send': function() { if (typeof showPushSendScreen === 'function') showPushSendScreen(); },
            'notice-manage': function() { if (typeof showNoticeManageScreen === 'function') showNoticeManageScreen(); },
            'notice-edit': function() { if (typeof showNoticeManageScreen === 'function') showNoticeManageScreen(); },
            'post-manage': function() { if (typeof showPostManageScreen === 'function') showPostManageScreen(); },
            'schedule-manage': function() { if (typeof showScheduleManageScreen === 'function') showScheduleManageScreen(); }
        };

        if (_popstateSpecial[state.screen]) {
            _popstateSpecial[state.screen]();
        } else if (state.tab) {
            switchTab(state.tab);
        } else {
            navigateToScreen(state.screen, { back: true });
        }

        window._navPopstate = false;
    } else {
        // history 스택 바닥 → 홈이면 종료 확인, 아니면 홈으로
        var homeScreen = document.getElementById('home-screen');
        if (homeScreen && homeScreen.classList.contains('active')) {
            // 홈에서 더 뒤로 갈 곳 없음 → 종료 확인 팝업
            history.pushState({ screen: 'home' }, '', '#home');
            showExitDialog();
        } else {
            // 홈이 아닌 다른 화면 → 홈으로 돌아가기
            history.pushState({ screen: 'home', tab: 'home' }, '', '#home');
            window._navPopstate = true;
            switchTab('home');
            window._navPopstate = false;
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
    // PWA 앱 종료 시도 (window.close → 안 되면 about:blank → 최종 fallback)
    try {
        window.close();
    } catch (e) {}
    // window.close()가 안 먹히는 경우 (standalone PWA에서는 동작)
    // 약간의 딜레이 후 최소한 빈 페이지로 이동
    setTimeout(function() {
        // Android PWA: 빈 페이지로 이동하면 앱이 닫힘
        window.location.href = 'about:blank';
    }, 200);
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
        profileEl.innerHTML = '<div style="width:36px;height:36px;border-radius:50%;background:#DBEAFE;display:flex;align-items:center;justify-content:center;font-weight:600;color:#2563EB">'
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
