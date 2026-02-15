// 인증 관련 기능 (완전 재구현)

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
        
        // 데모 모드 처리
        if (CONFIG.DEMO_MODE) {
            console.log('📝 데모 모드: 로그인 시뮬레이션');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 승인된 계정 리스트 (데모용)
            const approvedAccounts = {
                'admin@jc.com': { name: '총관리자', role: 'super_admin', status: 'active' },
                'minsu@jc.com': { name: '경민수', role: 'member', status: 'active' }
            };
            
            // 계정 확인
            if (!approvedAccounts[email]) {
                showInlineError('inline-error', '등록되지 않은 계정입니다.');
                setButtonLoading(loginButton, false);
                return;
            }
            
            const accountInfo = approvedAccounts[email];
            
            // 비밀번호 확인 (데모용 간단 검증)
            if (password !== 'test1234' && password !== 'admin1234') {
                showInlineError('inline-error', '비밀번호가 일치하지 않습니다.');
                setButtonLoading(loginButton, false);
                return;
            }
            
            // 승인 상태 확인
            if (accountInfo.status !== 'active') {
                showInlineError('inline-error', '승인되지 않은 계정입니다. 관리자 승인을 기다려주세요.');
                setButtonLoading(loginButton, false);
                return;
            }
            
            // 로컬 스토리지에 저장
            if (rememberMe) {
                storage.set(STORAGE_KEYS.REMEMBER_ME, true);
            }
            
            // 데모 사용자 정보 저장
            const demoUser = {
                email: email,
                name: accountInfo.name,
                role: accountInfo.role,
                status: accountInfo.status,
                isApproved: true
            };
            sessionStorage.setItem('demo_user', JSON.stringify(demoUser));
            
            currentUser = demoUser;
            currentAuthStatus = AuthStatus.AUTHENTICATED;
            
            // 홈 화면으로 이동
            navigateToScreen('home');
            updateUserDisplay();
            setButtonLoading(loginButton, false);
            
            console.log('✅ 데모 로그인 성공:', accountInfo.name);
            return;
        }
        
        // 실제 Supabase 로그인
        console.log('🔐 Supabase 로그인 시도...');
        
        const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (authError) {
            console.error('❌ 로그인 실패:', authError);
            if (authError.message.includes('Invalid')) {
                showInlineError('inline-error', '이메일 또는 비밀번호가 올바르지 않습니다.');
            } else {
                showInlineError('inline-error', '로그인에 실패했습니다: ' + authError.message);
            }
            setButtonLoading(loginButton, false);
            return;
        }
        
        console.log('✅ Auth 로그인 성공');
        
        // 회원 정보 확인
        const member = await fetchMemberByAuthUserId(authData.user.id);
        
        if (!member) {
            console.error('❌ 회원 정보 없음');
            showInlineError('inline-error', '회원 정보를 찾을 수 없습니다.');
            await window.supabaseClient.auth.signOut();
            setButtonLoading(loginButton, false);
            return;
        }
        
        console.log('✅ 회원 정보 확인:', member.name);
        
        // 회원 상태 확인
        if (member.withdrawn_at) {
            showInlineError('inline-error', '탈퇴한 계정입니다.');
            await window.supabaseClient.auth.signOut();
            setButtonLoading(loginButton, false);
            return;
        }
        
        if (member.is_suspended) {
            showInlineError('inline-error', '계정이 정지되었습니다. 관리자에게 문의하세요.');
            await window.supabaseClient.auth.signOut();
            setButtonLoading(loginButton, false);
            return;
        }
        
        if (!member.is_approved && member.rejection_reason) {
            showInlineError('inline-error', member.rejection_reason || '가입이 거절되었습니다.');
            await window.supabaseClient.auth.signOut();
            setButtonLoading(loginButton, false);
            return;
        }
        
        if (!member.is_approved) {
            console.log('⏳ 승인 대기 중');
            currentAuthStatus = AuthStatus.PENDING_APPROVAL;
            currentUser = member;
            navigateToScreen('pending-approval');
            setButtonLoading(loginButton, false);
            return;
        }
        
        // 로그인 성공
        console.log('✅ 로그인 성공');
        
        // 로그인 유지 설정
        if (rememberMe) {
            storage.set(STORAGE_KEYS.REMEMBER_ME, true);
        } else {
            storage.remove(STORAGE_KEYS.REMEMBER_ME);
        }
        
        currentUser = member;
        currentAuthStatus = AuthStatus.AUTHENTICATED;
        
        // 홈 화면으로 이동
        navigateToScreen('home');
        updateUserDisplay();
        setButtonLoading(loginButton, false);
        
    } catch (error) {
        console.error('❌ 로그인 오류:', error);
        showInlineError('inline-error', '로그인 중 오류가 발생했습니다: ' + error.message);
        setButtonLoading(loginButton, false);
    }
}

// 로그아웃 처리
async function handleLogout() {
    console.log('🔹 로그아웃 시작');
    
    try {
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
            console.log('✅ Supabase 로그아웃 완료');
        }
        
        // 세션 정보 삭제
        sessionStorage.removeItem('demo_user');
        
        currentUser = null;
        currentAuthStatus = AuthStatus.UNAUTHENTICATED;
        
        // 로그인 화면으로 이동
        navigateToScreen('login');
        
        // 로그인 폼 초기화
        document.getElementById('login-form').reset();
        clearAllErrors();
        
        console.log('✅ 로그아웃 완료');
        
    } catch (error) {
        console.error('❌ 로그아웃 오류:', error);
    }
}

// 회원 정보 조회
async function fetchMemberByAuthUserId(authUserId) {
    try {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('auth_user_id', authUserId)
            .maybeSingle();

        if (error) {
            console.error('❌ 회원 정보 조회 오류:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('❌ 회원 정보 조회 오류:', error);
        return null;
    }
}

// 인증 상태 확인
async function checkAuthStatus() {
    console.log('🔹 인증 상태 확인 시작');
    currentAuthStatus = AuthStatus.LOADING;

    // 데모 모드
    if (CONFIG.DEMO_MODE) {
        console.log('📝 데모 모드');
        const demoUserStr = sessionStorage.getItem('demo_user');
        if (demoUserStr) {
            try {
                const demoUser = JSON.parse(demoUserStr);
                currentUser = demoUser;
                currentAuthStatus = AuthStatus.AUTHENTICATED;
                console.log('✅ 데모 세션 있음:', demoUser.name || demoUser.email);
                return currentAuthStatus;
            } catch (e) {
                console.error('❌ 데모 세션 파싱 오류:', e);
            }
        }
        currentAuthStatus = AuthStatus.UNAUTHENTICATED;
        console.log('❌ 데모 세션 없음');
        return currentAuthStatus;
    }
    
    // Supabase가 없으면 에러
    if (!window.supabaseClient) {
        console.error('❌ Supabase가 초기화되지 않았습니다');
        currentAuthStatus = AuthStatus.UNAUTHENTICATED;
        return currentAuthStatus;
    }

    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) {
            console.error('❌ 세션 조회 오류:', error);
            currentAuthStatus = AuthStatus.UNAUTHENTICATED;
            return currentAuthStatus;
        }
        
        if (!session) {
            console.log('❌ 세션 없음');
            currentAuthStatus = AuthStatus.UNAUTHENTICATED;
            return currentAuthStatus;
        }
        
        console.log('✅ 세션 있음:', session.user.email);

        const member = await fetchMemberByAuthUserId(session.user.id);
        
        if (!member) {
            console.log('❌ 회원 정보 없음');
            currentAuthStatus = AuthStatus.UNAUTHENTICATED;
            await window.supabaseClient.auth.signOut();
            return currentAuthStatus;
        }
        
        console.log('✅ 회원 정보 확인:', member.name);

        if (member.withdrawn_at) {
            console.log('❌ 탈퇴한 계정');
            currentAuthStatus = AuthStatus.WITHDRAWN;
            await window.supabaseClient.auth.signOut();
            return currentAuthStatus;
        }

        if (member.is_suspended) {
            console.log('❌ 정지된 계정');
            currentAuthStatus = AuthStatus.SUSPENDED;
            await window.supabaseClient.auth.signOut();
            return currentAuthStatus;
        }

        if (!member.is_approved && member.rejection_reason) {
            console.log('❌ 거절된 계정');
            currentAuthStatus = AuthStatus.REJECTED;
            await window.supabaseClient.auth.signOut();
            return currentAuthStatus;
        }

        if (!member.is_approved) {
            console.log('⏳ 승인 대기');
            currentAuthStatus = AuthStatus.PENDING_APPROVAL;
            currentUser = member;
            return currentAuthStatus;
        }

        console.log('✅ 인증 완료:', member.name);
        currentAuthStatus = AuthStatus.AUTHENTICATED;
        currentUser = member;
        return currentAuthStatus;

    } catch (error) {
        console.error('❌ 인증 상태 확인 오류:', error);
        currentAuthStatus = AuthStatus.UNAUTHENTICATED;
        return currentAuthStatus;
    }
}

// 사용자 표시 업데이트
function updateUserDisplay() {
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay && currentUser) {
        userNameDisplay.textContent = `${currentUser.name}님 환영합니다!`;
    }
}

// 로그인 폼 이벤트 설정
function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', handleLogin);
        console.log('✅ 로그인 폼 이벤트 설정 완료');
    }
    
    // 로그인 유지 체크박스 초기화
    const rememberMe = storage.get(STORAGE_KEYS.REMEMBER_ME);
    if (rememberMe) {
        document.getElementById('remember-me').checked = true;
    }
}

// 로그아웃 버튼 이벤트 설정
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                await handleLogout();
            }
        });
        console.log('✅ 로그아웃 버튼 이벤트 설정 완료');
    }
}
