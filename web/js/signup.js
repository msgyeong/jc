// 회원가입 관련 기능 (Railway API 연동)

// 회원가입 폼 유효성 검사
function validateSignupForm() {
    clearAllErrors();
    
    let isValid = true;
    
    // 이메일 검증
    const email = document.getElementById('signup-email').value.trim();
    if (!email) {
        showError('signup-email-error', '이메일을 입력하세요.');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('signup-email-error', '올바른 이메일 형식이 아닙니다.');
        isValid = false;
    }
    
    // 비밀번호 검증
    const password = document.getElementById('signup-password').value;
    if (!password) {
        showError('signup-password-error', '비밀번호를 입력하세요.');
        isValid = false;
    } else if (password.length < 8) {
        showError('signup-password-error', '비밀번호는 8자 이상이어야 합니다.');
        isValid = false;
    }
    
    // 비밀번호 확인 검증
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    if (!passwordConfirm) {
        showError('signup-password-confirm-error', '비밀번호 확인을 입력하세요.');
        isValid = false;
    } else if (password !== passwordConfirm) {
        showError('signup-password-confirm-error', '비밀번호가 일치하지 않습니다.');
        isValid = false;
    }
    
    // 이름 검증
    const name = document.getElementById('signup-name').value.trim();
    if (!name) {
        showError('signup-name-error', '이름을 입력하세요.');
        isValid = false;
    }
    
    // 주민등록번호 검증
    const ssn = document.getElementById('signup-ssn').value.trim();
    if (!ssn) {
        showError('signup-ssn-error', '주민등록번호를 입력하세요.');
        isValid = false;
    } else if (ssn.replace(/-/g, '').length !== 7) {
        showError('signup-ssn-error', '주민등록번호 7자리를 입력하세요 (예: 900101-1******).');
        isValid = false;
    }
    
    // 휴대폰 검증
    const phone = document.getElementById('signup-phone').value.trim();
    if (!phone) {
        showError('signup-phone-error', '휴대폰 번호를 입력하세요.');
        isValid = false;
    }
    
    // 주소 검증
    const address = document.getElementById('signup-address').value.trim();
    if (!address) {
        showError('signup-address-error', '주소를 입력하세요.');
        isValid = false;
    }
    
    // 학력 검증 (최소 1개 필수)
    const educationItems = document.querySelectorAll('.education-item');
    if (educationItems.length === 0) {
        showError('education-error', '최종 학력을 최소 1개 이상 입력하세요.');
        isValid = false;
    } else {
        let hasEmptyEducation = false;
        educationItems.forEach(item => {
            const school = item.querySelector('.education-school').value.trim();
            const graduation = item.querySelector('.education-graduation').value;
            const status = item.querySelector('.education-status').value;
            
            if (!school || !graduation || !status) {
                hasEmptyEducation = true;
            }
        });
        
        if (hasEmptyEducation) {
            showError('education-error', '학력 정보를 모두 입력하세요.');
            isValid = false;
        }
    }
    
    return isValid;
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
    
    const signupButton = document.querySelector('.btn-signup');
    setButtonLoading(signupButton, true);
    
    try {
        // Step 1: 로그인 정보
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;
        
        // Step 2: 기본 정보
        const name = document.getElementById('signup-name').value.trim();
        const ssn = document.getElementById('signup-ssn').value.trim();
        const phone = document.getElementById('signup-phone').value.trim();
        const address = document.getElementById('signup-address').value.trim();
        const address_detail = document.getElementById('signup-address-detail').value.trim();
        
        // Step 3: 직장 정보
        const company = document.getElementById('signup-company').value.trim();
        const position = document.getElementById('signup-position').value.trim();
        const department = document.getElementById('signup-department').value.trim();
        const work_phone = document.getElementById('signup-work-phone').value.trim();
        const work_address = document.getElementById('signup-work-address').value.trim();
        
        // Step 4: 학력/경력 정보
        
        // 학력 정보 수집 (동적 필드)
        const educationItems = document.querySelectorAll('.education-item');
        const educationData = [];
        educationItems.forEach(item => {
            const school = item.querySelector('.education-school').value.trim();
            const graduation = item.querySelector('.education-graduation').value;
            const status = item.querySelector('.education-status').value;
            if (school && graduation && status) {
                educationData.push(`${school} (${graduation}) - ${status}`);
            }
        });
        const education = educationData.join('\n');
        
        // 경력 정보 수집 (동적 필드)
        const careerItems = document.querySelectorAll('.career-item');
        const careerData = [];
        careerItems.forEach(item => {
            const period = item.querySelector('.career-period').value;
            const companyName = item.querySelector('.career-company').value.trim();
            if (period && companyName) {
                careerData.push(`${period} - ${companyName}`);
            }
        });
        const career = careerData.join('\n');
        
        // Step 5: 가족 정보
        const maritalStatus = document.querySelector('input[name="marital-status"]:checked').value;
        const spouseName = document.getElementById('spouse-name')?.value.trim() || '';
        const spouseBirth = document.getElementById('spouse-birth')?.value || '';
        
        const hasChildren = document.querySelector('input[name="has-children"]:checked').value;
        const childItems = document.querySelectorAll('.child-item');
        const childrenData = [];
        childItems.forEach(item => {
            const childName = item.querySelector('.child-name').value.trim();
            const childBirth = item.querySelector('.child-birth').value;
            if (childName && childBirth) {
                childrenData.push(`${childName} (${childBirth})`);
            }
        });
        
        // 가족 정보 문자열 조합
        let familyInfo = '';
        if (maritalStatus === 'married' && spouseName) {
            familyInfo += `배우자: ${spouseName}`;
            if (spouseBirth) {
                familyInfo += ` (${spouseBirth})`;
            }
        }
        if (hasChildren === 'yes' && childrenData.length > 0) {
            if (familyInfo) familyInfo += '\n';
            familyInfo += '자녀:\n' + childrenData.join('\n');
        }
        const family = familyInfo;
        
        // Step 6: 기타 정보
        const hobbies = document.getElementById('signup-hobbies').value.trim();
        const emergency_contact_name = document.getElementById('signup-emergency-contact-name').value.trim();
        const emergency_contact = document.getElementById('signup-emergency-contact').value.trim();
        const emergency_relationship = document.getElementById('signup-emergency-relationship').value.trim();
        const join_message = document.getElementById('signup-join-message').value.trim();
        
        const userData = {
            // Step 1
            email,
            password,
            // Step 2
            name,
            ssn,
            phone,
            address,
            address_detail,
            // Step 3
            company,
            position,
            department,
            work_phone,
            work_address,
            // Step 4
            education,
            career,
            // Step 5
            family,
            // Step 6
            hobbies,
            emergency_contact_name,
            emergency_contact,
            emergency_relationship,
            special_notes: join_message  // 가입 소감문을 special_notes에 저장
        };
        
        console.log('📝 회원가입 시도:', email);
        
        // API 회원가입 호출
        const result = await apiClient.signup(userData);
        
        if (result.success) {
            console.log('✅ 회원가입 성공');
            
            // 승인 대기 화면으로 이동
            navigateToScreen('pending-approval');
            
            // 폼 초기화
            document.getElementById('signup-form').reset();
            
            // 동적 필드 초기화
            document.getElementById('education-list').innerHTML = '';
            document.getElementById('career-list').innerHTML = '';
            document.getElementById('children-list').innerHTML = '';
            educationCount = 0;
            careerCount = 0;
            childCount = 0;
            
        } else {
            showInlineError('signup-inline-error', result.message || '회원가입에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('❌ 회원가입 에러:', error);
        
        let errorMessage = '회원가입 중 오류가 발생했습니다.';
        if (error.message) {
            if (error.message.includes('이메일')) {
                errorMessage = error.message;
            } else if (error.message.includes('필수')) {
                errorMessage = error.message;
            } else {
                errorMessage = error.message;
            }
        }
        
        showInlineError('signup-inline-error', errorMessage);
        
    } finally {
        setButtonLoading(signupButton, false);
    }
}

// 학력 필드 카운터
let educationCount = 0;

// 학력 필드 추가
function addEducationField() {
    educationCount++;
    const educationList = document.getElementById('education-list');
    const educationItem = document.createElement('div');
    educationItem.className = 'education-item';
    educationItem.id = `education-item-${educationCount}`;
    educationItem.innerHTML = `
        <div class="education-fields">
            <div class="form-group" style="flex: 2;">
                <input 
                    type="text" 
                    class="education-school" 
                    placeholder="학교명 (예: 서울대학교 경영학과)"
                    required
                >
            </div>
            <div class="form-group" style="flex: 1;">
                <input 
                    type="month" 
                    class="education-graduation" 
                    placeholder="졸업년월"
                    required
                >
            </div>
            <div class="form-group" style="flex: 1;">
                <select class="education-status" required>
                    <option value="">상태 선택</option>
                    <option value="졸업">졸업</option>
                    <option value="수료">수료</option>
                    <option value="재학">재학</option>
                    <option value="휴학">휴학</option>
                    <option value="중퇴">중퇴</option>
                </select>
            </div>
            <button type="button" class="btn-remove ${educationCount === 1 ? 'disabled' : ''}" onclick="removeEducationField(${educationCount})" title="삭제" ${educationCount === 1 ? 'disabled' : ''}>
                ✕
            </button>
        </div>
    `;
    educationList.appendChild(educationItem);
}

// 학력 필드 삭제
function removeEducationField(id) {
    const items = document.querySelectorAll('.education-item');
    if (items.length <= 1) {
        alert('최소 1개의 학력은 입력해야 합니다.');
        return;
    }
    
    const item = document.getElementById(`education-item-${id}`);
    if (item) {
        item.remove();
    }
}

// 경력 필드 카운터
let careerCount = 0;

// 경력 필드 추가
function addCareerField() {
    careerCount++;
    const careerList = document.getElementById('career-list');
    const careerItem = document.createElement('div');
    careerItem.className = 'career-item';
    careerItem.id = `career-item-${careerCount}`;
    careerItem.innerHTML = `
        <div class="career-fields">
            <div class="form-group" style="flex: 1;">
                <input 
                    type="month" 
                    class="career-period" 
                    placeholder="년월"
                >
            </div>
            <div class="form-group" style="flex: 2;">
                <input 
                    type="text" 
                    class="career-company" 
                    placeholder="직장명 (예: ABC기업 영업부)"
                >
            </div>
            <button type="button" class="btn-remove" onclick="removeCareerField(${careerCount})" title="삭제">
                ✕
            </button>
        </div>
    `;
    careerList.appendChild(careerItem);
}

// 경력 필드 삭제
function removeCareerField(id) {
    const item = document.getElementById(`career-item-${id}`);
    if (item) {
        item.remove();
    }
}

// 자녀 필드 카운터
let childCount = 0;

// 자녀 필드 추가
function addChildField() {
    childCount++;
    const childrenList = document.getElementById('children-list');
    const childItem = document.createElement('div');
    childItem.className = 'child-item';
    childItem.id = `child-item-${childCount}`;
    childItem.innerHTML = `
        <div class="child-fields">
            <div class="form-group" style="flex: 1;">
                <input 
                    type="text" 
                    class="child-name" 
                    placeholder="자녀 이름"
                >
            </div>
            <div class="form-group" style="flex: 1;">
                <input 
                    type="date" 
                    class="child-birth"
                >
            </div>
            <button type="button" class="btn-remove" onclick="removeChildField(${childCount})" title="삭제">
                ✕
            </button>
        </div>
    `;
    childrenList.appendChild(childItem);
}

// 자녀 필드 삭제
function removeChildField(id) {
    const item = document.getElementById(`child-item-${id}`);
    if (item) {
        item.remove();
    }
}

// 휴대폰 번호 자동 하이픈 추가
function formatPhoneNumber(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value.length <= 3) {
        input.value = value;
    } else if (value.length <= 7) {
        input.value = value.slice(0, 3) + '-' + value.slice(3);
    } else {
        input.value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }
}

// 주민등록번호 ****** 표시 갱신 (7자리 입력 시)
function updateSSNMaskVisible() {
    const input = document.getElementById('signup-ssn');
    const wrapper = document.getElementById('signup-ssn-wrapper');
    if (!input || !wrapper) return;
    const full = input.value.replace(/[^0-9]/g, '');
    wrapper.classList.toggle('has-value', full.length === 7);
}

// 주민등록번호 자동 하이픈 추가 (앞 6자리 + 뒤 1자리만)
function formatSSN(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    
    // 최대 7자리까지만 입력
    if (value.length > 7) {
        value = value.slice(0, 7);
    }
    
    if (value.length <= 6) {
        input.value = value;
    } else {
        input.value = value.slice(0, 6) + '-' + value.slice(6, 7);
    }
    
    updateSSNMaskVisible();
}

// 페이지 로드 시 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
    // 회원가입 폼
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        
        // 초기 학력 필드 1개 추가 (필수)
        addEducationField();
    }
    
    // 휴대폰 번호 입력 필드
    const phoneInput = document.getElementById('signup-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    }
    
    // 주민등록번호 입력 필드
    const ssnInput = document.getElementById('signup-ssn');
    if (ssnInput) {
        ssnInput.addEventListener('input', function() {
            formatSSN(this);
        });
        ssnInput.addEventListener('paste', function() {
            setTimeout(function() {
                formatSSN(ssnInput);
            }, 0);
        });
        ssnInput.addEventListener('keyup', updateSSNMaskVisible);
        ssnInput.addEventListener('focus', updateSSNMaskVisible);
    }
    
    // 비상 연락처 입력 필드
    const emergencyContactInput = document.getElementById('signup-emergency-contact');
    if (emergencyContactInput) {
        emergencyContactInput.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    }
    
    // 직장 전화번호 입력 필드
    const workPhoneInput = document.getElementById('signup-work-phone');
    if (workPhoneInput) {
        workPhoneInput.addEventListener('input', function() {
            // 직장 전화번호는 일반 전화번호 형식 (02-0000-0000 등)
            let value = this.value.replace(/[^0-9]/g, '');
            if (value.startsWith('02')) {
                // 서울 (02)
                if (value.length <= 2) {
                    this.value = value;
                } else if (value.length <= 6) {
                    this.value = value.slice(0, 2) + '-' + value.slice(2);
                } else {
                    this.value = value.slice(0, 2) + '-' + value.slice(2, 6) + '-' + value.slice(6, 10);
                }
            } else {
                // 기타 지역 (031, 032 등)
                if (value.length <= 3) {
                    this.value = value;
                } else if (value.length <= 7) {
                    this.value = value.slice(0, 3) + '-' + value.slice(3);
                } else {
                    this.value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
                }
            }
        });
    }
    
    // 결혼 여부 라디오 버튼
    const maritalStatusRadios = document.querySelectorAll('input[name="marital-status"]');
    maritalStatusRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const spouseInfo = document.getElementById('spouse-info');
            if (this.value === 'married') {
                spouseInfo.style.display = 'block';
            } else {
                spouseInfo.style.display = 'none';
                // 미혼 선택 시 배우자 정보 초기화
                document.getElementById('spouse-name').value = '';
                document.getElementById('spouse-birth').value = '';
            }
        });
    });
    
    // 자녀 유무 라디오 버튼
    const hasChildrenRadios = document.querySelectorAll('input[name="has-children"]');
    hasChildrenRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const childrenInfo = document.getElementById('children-info');
            if (this.value === 'yes') {
                childrenInfo.style.display = 'block';
                // 자녀가 없으면 기본 1명 추가
                if (document.querySelectorAll('.child-item').length === 0) {
                    addChildField();
                }
            } else {
                childrenInfo.style.display = 'none';
                // 자녀 없음 선택 시 자녀 필드 초기화
                document.getElementById('children-list').innerHTML = '';
                childCount = 0;
            }
        });
    });
});

console.log('✅ Signup 모듈 로드 완료 (Railway API)');
