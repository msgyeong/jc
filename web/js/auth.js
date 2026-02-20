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
    
    const email = document.getElementById('login-email').value.trim();
    if (!email) {
        showError('email-error', '이메일을 입력하세요.');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('email-error', '올바른 이메일 형식이 아닙니다.');
        isValid = false;
    }
    
    const password = document.getElementById('login-password').value;
    if (!password) {
        showError('password-error', '비밀번호를 입력하세요.');
        isValid = false;
    } else if (password.length < 8) {
        showError('password-error', '비밀번호는 8자 이상이어야 합니다.');
        isValid = false;
    }
    
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
            
            // 홈 화면으로 이동
            currentAuthStatus = AuthStatus.AUTHENTICATED;
            navigateToScreen('home');
            
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
    
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 회원가입 링크
    const signupLink = document.getElementById('signup-link');
    if (signupLink) {
        signupLink.addEventListener('click', () => {
            navigateToScreen('signup');
        });
    }
    
    // 비밀번호 토글
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            
            if (input.type === 'password') {
                input.type = 'text';
                this.querySelector('.icon').textContent = '🙈';
            } else {
                input.type = 'password';
                this.querySelector('.icon').textContent = '👁️';
            }
        });
    });
});

console.log('✅ Auth 모듈 로드 완료 (Railway API)');
