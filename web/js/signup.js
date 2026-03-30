// 회원가입 관련 기능 (Railway API 연동)

var _signupPhotoBase64 = null;

// ========== 이미지 크롭 모달 ==========

function openImageCropper(imageSrc, onCrop) {
    // 모달 생성
    var overlay = document.createElement('div');
    overlay.className = 'crop-overlay';
    overlay.innerHTML = ''
        + '<div class="crop-modal">'
        + '<div class="crop-header">사진 자르기</div>'
        + '<div class="crop-container" id="crop-container">'
        + '<canvas id="crop-canvas"></canvas>'
        + '<div class="crop-frame" id="crop-frame"></div>'
        + '</div>'
        + '<div class="crop-controls">'
        + '<button type="button" class="crop-btn crop-btn-cancel" id="crop-cancel">취소</button>'
        + '<input type="range" id="crop-zoom" min="100" max="300" value="100" class="crop-zoom-slider">'
        + '<button type="button" class="crop-btn crop-btn-confirm" id="crop-confirm">완료</button>'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);

    var canvas = document.getElementById('crop-canvas');
    var ctx = canvas.getContext('2d');
    var container = document.getElementById('crop-container');
    var img = new Image();
    var scale = 1, offsetX = 0, offsetY = 0;
    var dragging = false, startX = 0, startY = 0;
    var imgW = 0, imgH = 0;
    var FRAME_SIZE = Math.min(window.innerWidth - 48, 280);

    canvas.width = FRAME_SIZE;
    canvas.height = FRAME_SIZE;
    container.style.width = FRAME_SIZE + 'px';
    container.style.height = FRAME_SIZE + 'px';

    img.onload = function() {
        imgW = img.width;
        imgH = img.height;
        // 초기 스케일: 이미지가 프레임에 꽉 차도록
        var fitScale = FRAME_SIZE / Math.min(imgW, imgH);
        scale = fitScale;
        document.getElementById('crop-zoom').value = 100;
        offsetX = (FRAME_SIZE - imgW * scale) / 2;
        offsetY = (FRAME_SIZE - imgH * scale) / 2;
        drawCrop();
    };
    img.src = imageSrc;

    function drawCrop() {
        ctx.clearRect(0, 0, FRAME_SIZE, FRAME_SIZE);
        ctx.drawImage(img, offsetX, offsetY, imgW * scale, imgH * scale);
    }

    // 줌
    document.getElementById('crop-zoom').addEventListener('input', function() {
        var baseScale = FRAME_SIZE / Math.min(imgW, imgH);
        var newScale = baseScale * (this.value / 100);
        // 줌 중심을 프레임 중앙으로
        var cx = FRAME_SIZE / 2;
        var cy = FRAME_SIZE / 2;
        offsetX = cx - (cx - offsetX) * (newScale / scale);
        offsetY = cy - (cy - offsetY) * (newScale / scale);
        scale = newScale;
        drawCrop();
    });

    // 드래그 (마우스)
    canvas.addEventListener('mousedown', function(e) { dragging = true; startX = e.clientX - offsetX; startY = e.clientY - offsetY; });
    window.addEventListener('mousemove', function handler(e) {
        if (!dragging) return;
        offsetX = e.clientX - startX; offsetY = e.clientY - startY; drawCrop();
    });
    window.addEventListener('mouseup', function() { dragging = false; });

    // 드래그 (터치)
    canvas.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) { dragging = true; startX = e.touches[0].clientX - offsetX; startY = e.touches[0].clientY - offsetY; e.preventDefault(); }
    }, { passive: false });
    canvas.addEventListener('touchmove', function(e) {
        if (dragging && e.touches.length === 1) { offsetX = e.touches[0].clientX - startX; offsetY = e.touches[0].clientY - startY; drawCrop(); e.preventDefault(); }
    }, { passive: false });
    canvas.addEventListener('touchend', function() { dragging = false; });

    // 취소
    document.getElementById('crop-cancel').addEventListener('click', function() {
        overlay.remove();
    });

    // 완료
    document.getElementById('crop-confirm').addEventListener('click', function() {
        // 최종 크롭 결과를 정사각 캔버스에서 추출
        var resultCanvas = document.createElement('canvas');
        resultCanvas.width = 400;
        resultCanvas.height = 400;
        var rctx = resultCanvas.getContext('2d');
        var ratio = 400 / FRAME_SIZE;
        rctx.drawImage(img, offsetX * ratio, offsetY * ratio, imgW * scale * ratio, imgH * scale * ratio);
        var croppedBase64 = resultCanvas.toDataURL('image/jpeg', 0.85);
        onCrop(croppedBase64);
        overlay.remove();
    });
}

// 프로필 사진 선택 → 크롭 모달
document.addEventListener('DOMContentLoaded', function() {
    var photoInput = document.getElementById('signup-photo-input');
    if (photoInput) {
        photoInput.addEventListener('change', function() {
            var file = this.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                alert('사진 크기는 5MB 이하여야 합니다.');
                this.value = '';
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                openImageCropper(e.target.result, function(croppedBase64) {
                    _signupPhotoBase64 = croppedBase64;
                    var preview = document.getElementById('signup-avatar-preview');
                    if (preview) preview.innerHTML = '<img src="' + croppedBase64 + '" alt="프로필">';
                });
            };
            reader.readAsDataURL(file);
            this.value = ''; // 같은 파일 재선택 허용
        });
    }
});

// 회원가입 폼 유효성 검사
function validateSignupForm() {
    clearAllErrors();

    let isValid = true;
    let firstErrorField = null;

    // 이메일 검증
    const emailEl = document.getElementById('signup-email');
    const email = emailEl.value.trim();
    if (!email) {
        showError('signup-email-error', '이메일을 입력하세요.');
        isValid = false;
        if (!firstErrorField) firstErrorField = emailEl;
    } else if (!validateEmail(email)) {
        showError('signup-email-error', '올바른 이메일 형식이 아닙니다.');
        isValid = false;
        if (!firstErrorField) firstErrorField = emailEl;
    }

    // 비밀번호 검증
    const passwordEl = document.getElementById('signup-password');
    const password = passwordEl.value;
    if (!password) {
        showError('signup-password-error', '비밀번호를 입력하세요.');
        isValid = false;
        if (!firstErrorField) firstErrorField = passwordEl;
    } else if (password.length < 8) {
        showError('signup-password-error', '비밀번호는 8자 이상이어야 합니다.');
        isValid = false;
        if (!firstErrorField) firstErrorField = passwordEl;
    }

    // 비밀번호 확인 검증
    const passwordConfirmEl = document.getElementById('signup-password-confirm');
    const passwordConfirm = passwordConfirmEl.value;
    if (!passwordConfirm) {
        showError('signup-password-confirm-error', '비밀번호 확인을 입력하세요.');
        isValid = false;
        if (!firstErrorField) firstErrorField = passwordConfirmEl;
    } else if (password !== passwordConfirm) {
        showError('signup-password-confirm-error', '비밀번호가 일치하지 않습니다.');
        isValid = false;
        if (!firstErrorField) firstErrorField = passwordConfirmEl;
    }

    // 이름 검증
    const nameEl = document.getElementById('signup-name');
    const name = nameEl.value.trim();
    if (!name) {
        showError('signup-name-error', '이름을 입력하세요.');
        isValid = false;
        if (!firstErrorField) firstErrorField = nameEl;
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
    } else {
        // 날짜 유효성 검증
        const mm = parseInt(ssnFront.substring(2, 4), 10);
        const dd = parseInt(ssnFront.substring(4, 6), 10);
        if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
            showError('signup-ssn-error', '유효하지 않은 생년월일입니다.');
            isValid = false;
        } else {
            // 월별 일수 체크
            const yy = parseInt(ssnFront.substring(0, 2), 10);
            const century = (ssnBack === '1' || ssnBack === '2') ? 1900 : 2000;
            const fullYear = century + yy;
            const maxDay = new Date(fullYear, mm, 0).getDate();
            if (dd > maxDay) {
                showError('signup-ssn-error', `${mm}월은 최대 ${maxDay}일까지입니다.`);
                isValid = false;
            }
        }
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

    // 첫 번째 에러 필드로 포커스 이동
    if (firstErrorField) firstErrorField.focus();

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
        + '<p style="color:var(--text-hint);font-size:13px;margin-top:16px">시행일: 2026년 1월 1일</p>'
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
        + '<p style="color:var(--text-hint);font-size:13px;margin-top:16px">시행일: 2026년 1월 1일</p>'
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
        + '<button onclick="this.closest(\'#legal-popup-overlay\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-hint)">&times;</button>'
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
            special_notes: join_message,  // 가입 소감문을 special_notes에 저장
            profile_image: _signupPhotoBase64 || undefined
        };
        
        console.log('📝 회원가입 시도:', email);
        
        // API 회원가입 호출
        const result = await apiClient.signup(userData);
        
        if (result.success) {
            console.log('✅ 회원가입 성공');
            
            // 승인 대기 화면으로 이동
            navigateToScreen('pending-approval');
            
            // 폼 초기화
            _signupPhotoBase64 = null;
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
        <div class="education-fields-row">
            <input type="text" class="education-school edu-input" placeholder="학교명" required>
        </div>
        <div class="education-fields-row2">
            <input type="text" class="education-graduation edu-input" placeholder="년도" inputmode="numeric" maxlength="4" required>
            <select class="education-status edu-input" required>
                <option value="">구분</option>
                <option value="졸업">졸업</option>
                <option value="수료">수료</option>
                <option value="재학">재학</option>
                <option value="휴학">휴학</option>
                <option value="기타">기타</option>
            </select>
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
        <div class="education-fields-row">
            <input type="text" class="career-company edu-input" placeholder="직장명">
        </div>
        <div class="education-fields-row2">
            <input type="text" class="career-period edu-input" placeholder="년도" inputmode="numeric" maxlength="4">
            <input type="text" class="career-position edu-input" placeholder="직책/부서">
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
        <div class="family-row-2col">
            <input type="text" class="child-name" placeholder="이름">
            <input type="date" class="child-birth">
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
        
        // 초기 학력/경력 필드 1개씩 추가
        addEducationField();
        addCareerField();
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
            // API 응답 구조: { data: { items: [...] } } 또는 { data: [...] }
            var orgs = Array.isArray(data.data) ? data.data : (data.data.items || []);
            orgs.forEach(function(org) {
                var opt = document.createElement('option');
                opt.value = org.id;
                opt.textContent = org.name + (org.district ? ' (' + org.district + ')' : '');
                sel.appendChild(opt);
            });
            // 로컬이 1개면 자동 선택
            if (orgs.length === 1) {
                sel.value = orgs[0].id;
            }
        }
    } catch (e) {
        console.error('로컬 목록 로드 실패:', e);
    }
}
loadOrgList();

// ========== 비밀번호 강도 미터 ==========
(function setupPasswordStrength() {
    var pwInput = document.getElementById('signup-password');
    if (!pwInput) return;

    pwInput.addEventListener('input', function() {
        var val = this.value;
        var container = document.getElementById('password-strength');
        var fill = document.getElementById('password-strength-fill');
        var items = document.querySelectorAll('#password-requirements li');

        if (!container || !fill) return;

        // 표시/숨김
        container.classList.toggle('visible', val.length > 0);

        // 규칙 체크
        var rules = {
            length: val.length >= 8,
            upper: /[A-Z]/.test(val),
            number: /[0-9]/.test(val),
            special: /[^A-Za-z0-9]/.test(val)
        };

        var passed = 0;
        items.forEach(function(li) {
            var rule = li.getAttribute('data-rule');
            if (rules[rule]) {
                li.classList.add('pass');
                passed++;
            } else {
                li.classList.remove('pass');
            }
        });

        // 강도 레벨
        var levels = ['', 'weak', 'fair', 'good', 'strong'];
        fill.setAttribute('data-level', levels[passed] || '');
    });
})();

// 이메일 중복 확인
async function checkEmailDuplicate() {
    const emailEl = document.getElementById('signup-email');
    const email = (emailEl?.value || '').trim().toLowerCase();
    const btn = document.getElementById('email-check-btn');
    if (!email || !validateEmail(email)) {
        showError('signup-email-error', '올바른 이메일을 입력하세요.');
        return;
    }
    if (btn) { btn.disabled = true; btn.textContent = '확인 중...'; }
    try {
        const res = await apiClient.request('/auth/check-email', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        if (res.available) {
            const errEl = document.getElementById('signup-email-error');
            if (errEl) { errEl.textContent = '사용 가능한 이메일입니다.'; errEl.style.color = 'var(--success-color)'; errEl.style.display = 'block'; }
        } else {
            showError('signup-email-error', '이미 가입된 이메일입니다.');
        }
    } catch (err) {
        showError('signup-email-error', err.message || '중복 확인 실패');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '중복 확인'; }
    }
}

console.log('✅ Signup 모듈 로드 완료 (Railway API)');
