// 인증 관련 기능 (Railway API 연동)

// 인증 상태
const AuthStatus = {
    INITIAL: 'initial',
    LOADING: 'loading',
    UNAUTHENTICATED: 'unauthenticated',
    AUTHENTICATED: 'authenticated',
    PENDING_APPROVAL: 'pendingApproval',
    REJECTED: 'rejected',
    SUSPENDED: 'suspended',
    WITHDRAWN: 'withdrawn'
};

let currentAuthStatus = AuthStatus.INITIAL;
let currentUser = null;

// 로그인 폼 유효성 검사
function validateLoginForm() {
    clearAllErrors();

    let isValid = true;
    let firstErrorField = null;

    const emailEl = document.getElementById('login-email');
    const email = emailEl.value.trim();
    if (!email) {
        showError('email-error', '이메일을 입력하세요.');
        isValid = false;
        if (!firstErrorField) firstErrorField = emailEl;
    } else if (!validateEmail(email)) {
        showError('email-error', '올바른 이메일 형식이 아닙니다.');
        isValid = false;
        if (!firstErrorField) firstErrorField = emailEl;
    }

    const passwordEl = document.getElementById('login-password');
    const password = passwordEl.value;
    if (!password) {
        showError('password-error', '비밀번호를 입력하세요.');
        isValid = false;
        if (!firstErrorField) firstErrorField = passwordEl;
    } else if (password.length < 8) {
        showError('password-error', '비밀번호는 8자 이상이어야 합니다.');
        isValid = false;
        if (!firstErrorField) firstErrorField = passwordEl;
    }

    // 첫 번째 에러 필드로 포커스 이동
    if (firstErrorField) firstErrorField.focus();

    return isValid;
}

// 로그인 처리
async function handleLogin(event) {
    event.preventDefault();
    
    console.log('🔹 로그인 시작');
    
    // 유효성 검사
    if (!validateLoginForm()) {
        console.log('❌ 유효성 검사 실패');
        return;
    }
    
    const loginButton = document.querySelector('.btn-login');
    setButtonLoading(loginButton, true);
    
    try {
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        console.log('📝 로그인 시도:', email);
        
        // API 로그인 호출
        const result = await apiClient.login(email, password);
        
        if (result.success) {
            console.log('✅ 로그인 성공:', result.user);

            // 사용자 정보 저장
            currentUser = result.user;
            localStorage.setItem('user_info', JSON.stringify(result.user));

            // 로그인 유지 옵션 저장
            if (rememberMe) {
                localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
            }

            // 관리자 계정이면 관리자 페이지로 이동
            if (['super_admin'].includes(result.user.role)) {
                // 관리자 웹에서도 동일 토큰 사용
                localStorage.setItem('admin_token', result.token || localStorage.getItem('auth_token'));
                localStorage.setItem('admin_user', JSON.stringify(result.user));
                window.location.href = '/admin/';
                return;
            }

            // 홈 화면으로 이동 — history 스택 초기화
            currentAuthStatus = AuthStatus.AUTHENTICATED;
            history.replaceState({ screen: 'home' }, '', '#home');
            window._navPopstate = true; // 중복 pushState 방지
            navigateToScreen('home');
            window._navPopstate = false;
            // 로그인 직후 스크롤 초기화 — 앱바 보이도록
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;

            // 홈 화면 데이터 로드
            if (typeof loadHomeData === 'function') {
                loadHomeData();
            }
        } else {
            // 에러 메시지 표시
            showInlineError('inline-error', result.message || '로그인에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('❌ 로그인 에러:', error);
        
        // 사용자 친화적 에러 메시지
        let errorMessage = '로그인 중 오류가 발생했습니다.';
        
        if (error.message) {
            if (error.message.includes('승인')) {
                errorMessage = error.message;
                currentAuthStatus = AuthStatus.PENDING_APPROVAL;
            } else if (error.message.includes('정지')) {
                errorMessage = error.message;
                currentAuthStatus = AuthStatus.SUSPENDED;
            } else if (error.message.includes('이메일') || error.message.includes('비밀번호')) {
                errorMessage = error.message;
            } else {
                errorMessage = error.message;
            }
        }
        
        showInlineError('inline-error', errorMessage);
        
    } finally {
        setButtonLoading(loginButton, false);
    }
}

// 로그아웃 처리
async function handleLogout() {
    try {
        console.log('🔹 로그아웃 시작');
        
        // API 로그아웃 호출
        await apiClient.logout();
        
        // 로컬 상태 초기화
        currentUser = null;
        currentAuthStatus = AuthStatus.UNAUTHENTICATED;
        
        console.log('✅ 로그아웃 완료');
        
        // 로그인 화면으로 이동
        navigateToScreen('login');
        
        // 폼 초기화
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
        
    } catch (error) {
        console.error('❌ 로그아웃 에러:', error);
        // 에러가 발생해도 로컬 상태는 초기화하고 로그인 화면으로 이동
        currentUser = null;
        currentAuthStatus = AuthStatus.UNAUTHENTICATED;
        apiClient.clearToken();
        navigateToScreen('login');
    }
}

// 인증 상태 확인
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            console.log('❌ 저장된 토큰 없음');
            currentAuthStatus = AuthStatus.UNAUTHENTICATED;
            return false;
        }
        
        console.log('🔹 인증 상태 확인 중...');
        
        // API로 현재 사용자 정보 조회
        const result = await apiClient.getMe();
        
        if (result.success && result.user) {
            console.log('✅ 인증 유효:', result.user);
            currentUser = result.user;
            currentAuthStatus = AuthStatus.AUTHENTICATED;
            localStorage.setItem('user_info', JSON.stringify(result.user));
            return true;
        } else {
            console.log('❌ 인증 실패');
            currentAuthStatus = AuthStatus.UNAUTHENTICATED;
            apiClient.clearToken();
            return false;
        }
        
    } catch (error) {
        console.error('❌ 인증 확인 에러:', error);
        currentAuthStatus = AuthStatus.UNAUTHENTICATED;
        apiClient.clearToken();
        return false;
    }
}

// 현재 사용자 정보 가져오기
function getCurrentUser() {
    if (currentUser) {
        return currentUser;
    }
    
    // 로컬 스토리지에서 가져오기
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
        try {
            currentUser = JSON.parse(userInfo);
            return currentUser;
        } catch (error) {
            console.error('사용자 정보 파싱 에러:', error);
            return null;
        }
    }
    
    return null;
}

// 인증 필요 확인
function requireAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        console.log('❌ 인증 필요 - 로그인 화면으로 이동');
        navigateToScreen('login');
        return false;
    }
    return true;
}

// 페이지 로드 시 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
    // 로그인 폼
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 비밀번호 토글 (signup-link, logout-btn은 navigation.js의 setupSignupEvents에서 등록)
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            
            if (input.type === 'password') {
                input.type = 'text';
                this.querySelector('.icon').innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
            } else {
                input.type = 'password';
                this.querySelector('.icon').innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
            }
        });
    });
});

// 전화번호 자동 하이픈 포매팅
function formatPhoneInput(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length >= 8) {
        input.value = v.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3');
    } else if (v.length >= 4) {
        input.value = v.replace(/(\d{3})(\d+)/, '$1-$2');
    } else {
        input.value = v;
    }
}

// 아이디(이메일) 찾기
function showFindEmailScreen() {
    navigateToScreen('find-email');
    // 전화번호 입력 이벤트 바인딩
    setTimeout(() => {
        const phoneInput = document.getElementById('find-email-phone');
        if (phoneInput && !phoneInput._formatted) {
            phoneInput._formatted = true;
            phoneInput.addEventListener('input', () => formatPhoneInput(phoneInput));
        }
    }, 100);
}

async function handleFindEmail() {
    const name = (document.getElementById('find-email-name')?.value || '').trim();
    const phone = (document.getElementById('find-email-phone')?.value || '').trim();
    const errorEl = document.getElementById('find-email-error');
    const resultEl = document.getElementById('find-email-result');

    if (!name || !phone) {
        if (errorEl) { errorEl.textContent = '이름과 전화번호를 모두 입력해주세요.'; errorEl.style.display = 'block'; }
        return;
    }
    if (errorEl) { errorEl.style.display = 'none'; }
    if (resultEl) resultEl.style.display = 'none';

    try {
        const res = await apiClient.request('/auth/find-email', {
            method: 'POST',
            body: JSON.stringify({ name, phone })
        });
        if (res.found) {
            if (resultEl) { resultEl.style.display = 'block'; }
            document.getElementById('find-email-value').textContent = res.email;
        } else {
            if (errorEl) { errorEl.textContent = '일치하는 계정을 찾을 수 없습니다.'; errorEl.style.display = 'block'; }
        }
    } catch (err) {
        if (errorEl) { errorEl.textContent = err.message || '이메일 찾기 중 오류'; errorEl.style.display = 'block'; }
    }
}

console.log('✅ Auth 모듈 로드 완료 (Railway API)');
