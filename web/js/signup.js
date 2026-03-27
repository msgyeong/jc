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
    
    // 주민등록번호 검증 (분할 입력)
    const ssnFront = document.getElementById('signup-ssn-front').value.trim();
    const ssnBack = document.getElementById('signup-ssn-back').value.trim();
    if (!ssnFront || !ssnBack) {
        showError('signup-ssn-error', '주민등록번호를 입력하세요.');
        isValid = false;
    } else if (ssnFront.length !== 6 || !/^\d{6}$/.test(ssnFront)) {
        showError('signup-ssn-error', '생년월일 6자리를 정확히 입력하세요.');
        isValid = false;
    } else if (ssnBack.length !== 1 || !/^[1-4]$/.test(ssnBack)) {
        showError('signup-ssn-error', '성별 1자리를 입력하세요 (1~4).');
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
    
    // 약관 동의 검증
    const agreeTerms = document.getElementById('agree-terms');
    if (agreeTerms && !agreeTerms.checked) {
        showError('agree-terms-error', '이용약관에 동의해주세요.');
        isValid = false;
    }
    const agreePrivacy = document.getElementById('agree-privacy');
    if (agreePrivacy && !agreePrivacy.checked) {
        showError('agree-privacy-error', '개인정보 수집 및 이용에 동의해주세요.');
        isValid = false;
    }

    return isValid;
}

// 약관/개인정보 팝업
function showTermsPopup() {
    showLegalPopup('이용약관', ''
        + '<h4>영등포 JC 회원관리 앱 이용약관</h4>'
        + '<p><strong>제1조 (목적)</strong><br>이 약관은 영등포청년회의소(이하 "회의소")가 제공하는 회원관리 앱(이하 "서비스")의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>'
        + '<p><strong>제2조 (이용자격)</strong><br>서비스는 회의소 회원으로 가입 승인된 자에 한하여 이용할 수 있습니다.</p>'
        + '<p><strong>제3조 (서비스의 내용)</strong><br>회의소는 다음과 같은 서비스를 제공합니다:<br>1. 공지사항 및 게시판 기능<br>2. 일정 관리 및 참석 여부 확인<br>3. 회원 정보 조회<br>4. 푸시 알림 서비스</p>'
        + '<p><strong>제4조 (이용자의 의무)</strong><br>1. 이용자는 타인의 개인정보를 부정 사용하거나 유출해서는 안 됩니다.<br>2. 서비스를 통해 취득한 정보를 회의소의 사전 승인 없이 외부에 공개하거나 상업적으로 이용할 수 없습니다.</p>'
        + '<p><strong>제5조 (서비스 변경 및 중단)</strong><br>회의소는 운영상 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있으며, 사전에 공지합니다.</p>'
        + '<p><strong>제6조 (탈퇴 및 자격상실)</strong><br>1. 회원은 언제든지 탈퇴를 요청할 수 있습니다.<br>2. 탈퇴 후 90일간 데이터 보관 후 완전 파기됩니다.</p>'
        + '<p><strong>제7조 (면책 조항)</strong><br>1. 회의소는 천재지변 또는 불가항력으로 인한 서비스 제공 불가에 대해 책임지지 않습니다.<br>2. 이용자 귀책사유로 인한 서비스 이용 장애에 대해 책임지지 않습니다.</p>'
        + '<p><strong>제8조 (분쟁 해결)</strong><br>서비스 이용과 관련한 분쟁은 대한민국 법률에 따르며, 서울서부지방법원을 관할법원으로 합니다.</p>'
        + '<p style="color:#6B7280;font-size:13px;margin-top:16px">시행일: 2026년 1월 1일</p>'
    );
}

function showPrivacyPopup() {
    showLegalPopup('개인정보 수집 및 이용 동의', ''
        + '<h4>개인정보 수집 및 이용 안내</h4>'
        + '<p><strong>1. 수집하는 개인정보 항목</strong><br>'
        + '<em>필수 항목:</em> 이름, 이메일, 비밀번호, 휴대폰번호, 주소, 주민등록번호(앞6자리+뒤1자리), 최종학력<br>'
        + '<em>선택 항목:</em> 회사명, 직책, 부서, 직장전화, 직장주소, 업종, 프로필사진, 경력, 결혼여부, 배우자정보, 자녀정보, 취미, 비상연락처, 가입소감문, 개인웹사이트</p>'
        + '<p><strong>2. 수집 및 이용 목적</strong><br>'
        + '1. 회원 식별 및 가입 승인<br>'
        + '2. 공지사항, 일정 등 서비스 제공<br>'
        + '3. 푸시 알림 발송<br>'
        + '4. 회원 간 연락처 공유 (앱 내 한정, 전화번호 공개 범위 설정에 따름)<br>'
        + '5. 주소 좌표 변환을 위한 Kakao API 위탁 처리</p>'
        + '<p><strong>3. 개인정보 보유 및 이용 기간</strong><br>'
        + '회원 탈퇴 시부터 90일간 보관 후 완전 파기합니다.<br>'
        + '관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>'
        + '<p><strong>4. 개인정보의 제3자 제공</strong><br>'
        + '회의소는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.</p>'
        + '<p><strong>5. 개인정보 처리 위탁</strong><br>'
        + '주소 좌표 변환: Kakao (카카오 주소 API) - 입력된 주소를 좌표로 변환하기 위해 전달됩니다.</p>'
        + '<p><strong>6. 이용자의 권리</strong><br>'
        + '이용자는 언제든지 본인의 개인정보를 열람, 정정, 삭제 요구할 수 있으며, 프로필 수정 또는 회원 탈퇴를 통해 처리할 수 있습니다.</p>'
        + '<p><strong>7. 개인정보 보호 책임자</strong><br>'
        + '영등포청년회의소 사무국<br>문의: 앱 내 관리자 연락</p>'
        + '<p style="color:#6B7280;font-size:13px;margin-top:16px">시행일: 2026년 1월 1일</p>'
    );
}

function showLegalPopup(title, content) {
    var existing = document.getElementById('legal-popup-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'legal-popup-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML = ''
        + '<div style="background:#fff;border-radius:12px;max-width:500px;width:100%;max-height:80vh;overflow-y:auto;padding:24px">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
        + '<h3 style="font-size:17px;font-weight:600;margin:0">' + title + '</h3>'
        + '<button onclick="this.closest(\'#legal-popup-overlay\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#6B7280">&times;</button>'
        + '</div>'
        + '<div class="legal-content">' + content + '</div>'
        + '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
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
        // 소속 로컬
        const org_id = document.getElementById('signup-org')?.value || '';

        // Step 1: 로그인 정보
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;
        
        // Step 2: 기본 정보
        const name = document.getElementById('signup-name').value.trim();
        const ssnFront = document.getElementById('signup-ssn-front').value.trim();
        const ssnBack = document.getElementById('signup-ssn-back').value.trim();
        const phone = document.getElementById('signup-phone').value.trim();
        const address = document.getElementById('signup-address').value.trim();
        const address_detail = document.getElementById('signup-address-detail').value.trim();
        const join_date = document.getElementById('signup-join-date')?.value || '';

        // Step 3: 직장 정보
        const company = document.getElementById('signup-company').value.trim();
        const position = document.getElementById('signup-position').value.trim();
        const department = document.getElementById('signup-department').value.trim();
        const work_phone = document.getElementById('signup-work-phone').value.trim();
        const work_address = document.getElementById('signup-work-address').value.trim();
        const industry = document.getElementById('signup-industry')?.value || '';
        const industry_detail = document.getElementById('signup-industry-detail')?.value?.trim() || '';
        const website = document.getElementById('signup-website')?.value?.trim() || '';

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
        const maritalRadio = document.querySelector('input[name="marital-status"]:checked');
        const maritalStatus = maritalRadio ? maritalRadio.value : '';
        const spouseName = document.getElementById('spouse-name')?.value.trim() || '';
        const spouseBirth = document.getElementById('spouse-birth')?.value || '';

        const childrenRadio = document.querySelector('input[name="has-children"]:checked');
        const hasChildren = childrenRadio ? childrenRadio.value : 'no';
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
            // 소속 로컬
            org_id: org_id ? parseInt(org_id) : undefined,
            // Step 1
            email,
            password,
            // Step 2
            name,
            ssnFront,
            ssnBack,
            phone,
            address,
            address_detail,
            join_date: join_date || undefined,
            // Step 3
            company,
            position,
            department,
            work_phone,
            work_address,
            industry: industry || undefined,
            industry_detail: industry_detail || undefined,
            website: website || undefined,
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

// 주민등록번호 분할 입력 숫자만 허용
function filterNumericInput(input, maxLen) {
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, maxLen);
}

// 카카오(다음) 주소 검색
function openAddressSearch() {
    new daum.Postcode({
        oncomplete: function(data) {
            const addr = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
            document.getElementById('signup-address').value = addr;
            const detailInput = document.getElementById('signup-address-detail');
            if (detailInput) detailInput.focus();
        }
    }).open();
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
    
    // 주민등록번호 분할 입력 필드
    const ssnFrontInput = document.getElementById('signup-ssn-front');
    const ssnBackInput = document.getElementById('signup-ssn-back');
    if (ssnFrontInput) {
        ssnFrontInput.addEventListener('input', function() {
            filterNumericInput(this, 6);
            if (this.value.length === 6 && ssnBackInput) ssnBackInput.focus();
        });
    }
    if (ssnBackInput) {
        ssnBackInput.addEventListener('input', function() {
            filterNumericInput(this, 1);
        });
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

// 소속 로컬 목록 로드
async function loadOrgList() {
    var sel = document.getElementById('signup-org');
    if (!sel) return;
    try {
        var res = await fetch('/api/organizations/public');
        var data = await res.json();
        if (data.success && data.data) {
            data.data.forEach(function(org) {
                var opt = document.createElement('option');
                opt.value = org.id;
                opt.textContent = org.name + (org.district ? ' (' + org.district + ')' : '');
                sel.appendChild(opt);
            });
            // 로컬이 1개면 자동 선택
            if (data.data.length === 1) {
                sel.value = data.data[0].id;
            }
        }
    } catch (e) {
        console.error('로컬 목록 로드 실패:', e);
    }
}
loadOrgList();

console.log('✅ Signup 모듈 로드 완료 (Railway API)');
