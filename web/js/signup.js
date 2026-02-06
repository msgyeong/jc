// 회원가입 기능

// 회원가입 폼 유효성 검사
function validateSignupForm() {
    clearAllErrors();
    
    let isValid = true;
    
    // 이메일 검사
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    if (!email) {
        showError('signup-email-error', '이메일을 입력하세요.');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('signup-email-error', '올바른 이메일 형식이 아닙니다.');
        isValid = false;
    }
    
    // 비밀번호 검사
    const password = document.getElementById('signup-password').value;
    if (!password) {
        showError('signup-password-error', '비밀번호를 입력하세요.');
        isValid = false;
    } else if (!validatePassword(password)) {
        showError('signup-password-error', '비밀번호는 8자 이상이어야 합니다.');
        isValid = false;
    }
    
    // 비밀번호 확인
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    if (!passwordConfirm) {
        showError('signup-password-confirm-error', '비밀번호 확인을 입력하세요.');
        isValid = false;
    } else if (password !== passwordConfirm) {
        showError('signup-password-confirm-error', '비밀번호가 일치하지 않습니다.');
        isValid = false;
    }
    
    // 성명 검사
    const name = document.getElementById('signup-name').value.trim();
    if (!name) {
        showError('signup-name-error', '성명을 입력하세요.');
        isValid = false;
    }
    
    // 휴대폰 검사
    const phone = document.getElementById('signup-phone').value.trim();
    if (!phone) {
        showError('signup-phone-error', '휴대폰 번호를 입력하세요.');
        isValid = false;
    } else {
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            showError('signup-phone-error', '올바른 휴대폰 번호를 입력하세요.');
            isValid = false;
        }
    }
    
    // 주소 검사
    const address = document.getElementById('signup-address').value.trim();
    if (!address) {
        showError('signup-address-error', '주소를 입력하세요.');
        isValid = false;
    }
    
    return isValid;
}

// 회원가입 데이터 수집
function collectSignupData() {
    return {
        email: document.getElementById('signup-email').value.trim().toLowerCase(),
        password: document.getElementById('signup-password').value,
        name: document.getElementById('signup-name').value.trim(),
        phone: document.getElementById('signup-phone').value.trim(),
        address: document.getElementById('signup-address').value.trim(),
        addressDetail: document.getElementById('signup-address-detail').value.trim() || null,
        companyName: document.getElementById('signup-company').value.trim() || null,
        companyPosition: document.getElementById('signup-position').value.trim() || null
    };
}

// 회원가입 처리
async function handleSignup(event) {
    event.preventDefault();
    
    console.log('🔹 회원가입 시작');
    
    // 유효성 검사
    if (!validateSignupForm()) {
        console.log('❌ 유효성 검사 실패');
        return;
    }
    
    const submitButton = document.querySelector('.btn-signup');
    setButtonLoading(submitButton, true);
    
    try {
        const signupData = collectSignupData();
        console.log('📝 회원가입 데이터:', { ...signupData, password: '***' });
        
        // 데모 모드 처리
        if (CONFIG.DEMO_MODE) {
            console.log('📝 데모 모드: 회원가입 시뮬레이션');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 성공 - 승인 대기 화면으로
            navigateToScreen('pending-approval');
            setButtonLoading(submitButton, false);
            return;
        }
        
        // Supabase 확인
        if (!supabase) {
            showInlineError('signup-inline-error', 'Supabase가 초기화되지 않았습니다.');
            setButtonLoading(submitButton, false);
            return;
        }
        
        // 실제 Supabase 회원가입
        console.log('🔐 Supabase 회원가입 시도...');
        
        // 1. 이메일 중복 확인
        const { data: existingEmail } = await supabase
            .from('members')
            .select('id')
            .eq('email', signupData.email)
            .maybeSingle();
        
        if (existingEmail) {
            showInlineError('signup-inline-error', '이미 사용 중인 이메일입니다.');
            setButtonLoading(submitButton, false);
            return;
        }
        
        // 2. Auth 사용자 생성
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: signupData.email,
            password: signupData.password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        
        if (authError) {
            console.error('❌ Auth 생성 실패:', authError);
            showInlineError('signup-inline-error', '회원가입에 실패했습니다: ' + authError.message);
            setButtonLoading(submitButton, false);
            return;
        }
        
        console.log('✅ Auth 사용자 생성 성공');
        
        // 3. Members 테이블에 정보 저장
        const { error: memberError } = await supabase
            .from('members')
            .insert([{
                auth_user_id: authData.user.id,
                email: signupData.email,
                name: signupData.name,
                phone: signupData.phone,
                address: signupData.address,
                address_detail: signupData.addressDetail,
                company_name: signupData.companyName,
                company_position: signupData.companyPosition,
                is_approved: false,
                is_suspended: false,
                created_at: new Date().toISOString()
            }]);
        
        if (memberError) {
            console.error('❌ Members 저장 실패:', memberError);
            // Auth 사용자는 생성되었으나 회원 정보 저장 실패
            showInlineError('signup-inline-error', '회원 정보 저장에 실패했습니다. 관리자에게 문의하세요.');
            setButtonLoading(submitButton, false);
            return;
        }
        
        console.log('✅ 회원 정보 저장 성공');
        
        // 4. 로그아웃 (승인 대기 상태이므로)
        await supabase.auth.signOut();
        
        // 5. 승인 대기 화면으로 이동
        navigateToScreen('pending-approval');
        setButtonLoading(submitButton, false);
        
        console.log('✅ 회원가입 완료 - 승인 대기');
        
    } catch (error) {
        console.error('❌ 회원가입 오류:', error);
        showInlineError('signup-inline-error', '회원가입 중 오류가 발생했습니다: ' + error.message);
        setButtonLoading(submitButton, false);
    }
}

// 회원가입 폼 이벤트 설정
function setupSignupForm() {
    const form = document.getElementById('signup-form');
    if (form) {
        form.addEventListener('submit', handleSignup);
        
        // 전화번호 자동 포맷팅
        const phoneInput = document.getElementById('signup-phone');
        if (phoneInput) {
            setupPhoneFormatting(phoneInput);
        }
        
        // 이메일 소문자 변환
        const emailInput = document.getElementById('signup-email');
        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toLowerCase();
            });
        }
        
        console.log('✅ 회원가입 폼 이벤트 설정 완료');
    }
}
