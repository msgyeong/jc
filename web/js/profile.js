// 프로필 관련 기능 (Railway API 연동)

let profileLoaded = false;
let currentProfile = null;

// 내 프로필 로드
async function loadProfile() {
    console.log('👤 프로필 로드');

    const container = document.getElementById('profile-content');
    if (!container) return;

    try {
        container.innerHTML = '<div class="content-loading">프로필 로딩 중...</div>';

        const result = await apiClient.getProfile();

        if (result.success && result.profile) {
            currentProfile = result.profile;
            container.innerHTML = renderProfile(result.profile);
            profileLoaded = true;
        } else {
            container.innerHTML = '<div class="error-state">프로필을 불러올 수 없습니다.</div>';
        }

    } catch (error) {
        console.error('프로필 로드 실패:', error);
        container.innerHTML = '<div class="error-state">프로필을 불러올 수 없습니다.</div>';
    }
}

// 프로필 렌더링
function renderProfile(profile) {
    const company = profile.company || '';
    const position = profile.position || '';
    const department = profile.department || '';
    const workPhone = profile.work_phone || '';
    const hasWorkInfo = company || position || department || workPhone;

    return `
        <div class="profile-container">
            <!-- 프로필 헤더 -->
            <div class="profile-header">
                <div class="profile-avatar-large">
                    ${profile.profile_image ?
                        `<img src="${profile.profile_image}" alt="${profile.name}">` :
                        `<div class="profile-avatar-large-placeholder">${profile.name ? profile.name[0] : '?'}</div>`
                    }
                </div>
                <h2 class="profile-name">${escapeHtml(profile.name || '이름 없음')}</h2>
                <div class="profile-role">
                    ${getRoleText(profile.role)}
                </div>
            </div>

            <!-- 기본 정보 -->
            <div class="profile-section">
                <h3 class="profile-section-title">기본 정보</h3>
                <div class="profile-info-grid">
                    <div class="profile-info-item">
                        <span class="profile-info-label">이메일</span>
                        <span class="profile-info-value">${escapeHtml(profile.email || '-')}</span>
                    </div>
                    <div class="profile-info-item">
                        <span class="profile-info-label">휴대폰</span>
                        <span class="profile-info-value">${escapeHtml(profile.phone || '-')}</span>
                    </div>
                    <div class="profile-info-item">
                        <span class="profile-info-label">주소</span>
                        <span class="profile-info-value">${escapeHtml(profile.address || '-')}</span>
                    </div>
                    ${profile.birth_date ? `
                        <div class="profile-info-item">
                            <span class="profile-info-label">생년월일</span>
                            <span class="profile-info-value">${formatDate(profile.birth_date, 'YYYY-MM-DD')}</span>
                        </div>
                    ` : ''}
                    ${profile.gender ? `
                        <div class="profile-info-item">
                            <span class="profile-info-label">성별</span>
                            <span class="profile-info-value">${getGenderText(profile.gender)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            ${hasWorkInfo ? `
            <!-- 직장 정보 -->
            <div class="profile-section">
                <h3 class="profile-section-title">직장 정보</h3>
                <div class="profile-info-grid">
                    ${company ? `<div class="profile-info-item"><span class="profile-info-label">회사</span><span class="profile-info-value">${escapeHtml(company)}</span></div>` : ''}
                    ${position ? `<div class="profile-info-item"><span class="profile-info-label">직책</span><span class="profile-info-value">${escapeHtml(position)}</span></div>` : ''}
                    ${department ? `<div class="profile-info-item"><span class="profile-info-label">부서</span><span class="profile-info-value">${escapeHtml(department)}</span></div>` : ''}
                    ${workPhone ? `<div class="profile-info-item"><span class="profile-info-label">직장 전화</span><span class="profile-info-value">${escapeHtml(workPhone)}</span></div>` : ''}
                </div>
            </div>
            ` : ''}

            <!-- 가입 정보 -->
            <div class="profile-section">
                <h3 class="profile-section-title">가입 정보</h3>
                <div class="profile-info-grid">
                    <div class="profile-info-item">
                        <span class="profile-info-label">가입일</span>
                        <span class="profile-info-value">${formatDate(profile.created_at, 'YYYY-MM-DD')}</span>
                    </div>
                </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="profile-section" style="display:flex;flex-direction:column;gap:10px;">
                <button class="btn btn-primary" onclick="showEditProfileForm()" style="width:100%;padding:14px;font-size:15px;border-radius:10px;">
                    ✏️ 프로필 수정
                </button>
                <button class="btn btn-secondary" onclick="showChangePasswordDialog()" style="width:100%;padding:14px;font-size:15px;border-radius:10px;">
                    🔒 비밀번호 변경
                </button>
                ${['super_admin', 'admin'].includes(profile.role) ? `
                <button onclick="navigateToScreen('admin')" style="
                    width:100%;padding:14px;background:#4f6ef7;color:#fff;
                    border:none;border-radius:10px;font-size:15px;font-weight:600;
                    cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
                    🔧 관리자 메뉴
                </button>
                ` : ''}
                <button class="btn" onclick="handleLogout()" style="width:100%;padding:14px;font-size:15px;border-radius:10px;background:#FEE2E2;color:#DC2626;border:none;cursor:pointer;">
                    🚪 로그아웃
                </button>
            </div>
        </div>
    `;
}

// 프로필 수정 폼 표시
function showEditProfileForm() {
    const p = currentProfile;
    if (!p) return;

    const container = document.getElementById('profile-content');
    if (!container) return;

    const birthVal = p.birth_date ? formatDate(p.birth_date, 'YYYY-MM-DD') : '';

    container.innerHTML = `
        <div class="profile-container">
            <div class="post-detail-actions" style="margin-bottom:12px">
                <button class="btn btn-secondary btn-sm" onclick="loadProfile()">← 돌아가기</button>
            </div>
            <h2 style="margin-bottom:20px;font-size:18px;font-weight:700;">프로필 수정</h2>

            <form id="profile-edit-form" onsubmit="handleProfileEditSubmit(event)">
                <div class="profile-section">
                    <h3 class="profile-section-title">기본 정보</h3>
                    <div class="form-group">
                        <label class="form-label">이름 *</label>
                        <input type="text" class="form-input" id="edit-name" value="${escapeHtml(p.name || '')}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">연락처</label>
                        <input type="tel" class="form-input" id="edit-phone" value="${escapeHtml(p.phone || '')}" placeholder="010-0000-0000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">주소</label>
                        <input type="text" class="form-input" id="edit-address" value="${escapeHtml(p.address || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">생년월일</label>
                        <input type="date" class="form-input" id="edit-birth-date" value="${birthVal}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">성별</label>
                        <select class="form-input" id="edit-gender">
                            <option value="">선택 안 함</option>
                            <option value="male" ${p.gender === 'male' ? 'selected' : ''}>남성</option>
                            <option value="female" ${p.gender === 'female' ? 'selected' : ''}>여성</option>
                        </select>
                    </div>
                </div>

                <div class="profile-section">
                    <h3 class="profile-section-title">직장 정보</h3>
                    <div class="form-group">
                        <label class="form-label">회사</label>
                        <input type="text" class="form-input" id="edit-company" value="${escapeHtml(p.company || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">직책</label>
                        <input type="text" class="form-input" id="edit-position" value="${escapeHtml(p.position || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">부서</label>
                        <input type="text" class="form-input" id="edit-department" value="${escapeHtml(p.department || '')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">직장 전화</label>
                        <input type="tel" class="form-input" id="edit-work-phone" value="${escapeHtml(p.work_phone || '')}">
                    </div>
                </div>

                <div id="profile-edit-error" style="color:#DC2626;font-size:14px;margin-bottom:12px;display:none;"></div>

                <button type="submit" class="btn btn-primary" id="profile-edit-submit-btn" style="width:100%;padding:14px;font-size:15px;border-radius:10px;">
                    저장
                </button>
            </form>
        </div>
    `;
}

// 프로필 수정 제출
async function handleProfileEditSubmit(event) {
    event.preventDefault();

    const errorEl = document.getElementById('profile-edit-error');
    const submitBtn = document.getElementById('profile-edit-submit-btn');

    const name = document.getElementById('edit-name').value.trim();
    if (!name) {
        errorEl.textContent = '이름은 필수 입력입니다.';
        errorEl.style.display = 'block';
        return;
    }

    const data = {
        name,
        phone: document.getElementById('edit-phone').value.trim() || null,
        address: document.getElementById('edit-address').value.trim() || null,
        birth_date: document.getElementById('edit-birth-date').value || null,
        gender: document.getElementById('edit-gender').value || null,
        company: document.getElementById('edit-company').value.trim() || null,
        position: document.getElementById('edit-position').value.trim() || null,
        department: document.getElementById('edit-department').value.trim() || null,
        work_phone: document.getElementById('edit-work-phone').value.trim() || null
    };

    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';
    errorEl.style.display = 'none';

    try {
        const result = await apiClient.updateProfile(data);
        if (result.success) {
            profileLoaded = false;
            await loadProfile();
        } else {
            errorEl.textContent = result.message || '프로필 수정에 실패했습니다.';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = error.message || '프로필 수정에 실패했습니다.';
        errorEl.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '저장';
    }
}

// 비밀번호 변경 다이얼로그
function showChangePasswordDialog() {
    const container = document.getElementById('profile-content');
    if (!container) return;

    container.innerHTML = `
        <div class="profile-container">
            <div class="post-detail-actions" style="margin-bottom:12px">
                <button class="btn btn-secondary btn-sm" onclick="loadProfile()">← 돌아가기</button>
            </div>
            <h2 style="margin-bottom:20px;font-size:18px;font-weight:700;">비밀번호 변경</h2>

            <form id="password-change-form" onsubmit="handlePasswordChange(event)">
                <div class="form-group">
                    <label class="form-label">현재 비밀번호</label>
                    <input type="password" class="form-input" id="pw-current" required>
                </div>
                <div class="form-group">
                    <label class="form-label">새 비밀번호 (6자 이상)</label>
                    <input type="password" class="form-input" id="pw-new" required minlength="6">
                </div>
                <div class="form-group">
                    <label class="form-label">새 비밀번호 확인</label>
                    <input type="password" class="form-input" id="pw-confirm" required minlength="6">
                </div>

                <div id="pw-change-error" style="color:#DC2626;font-size:14px;margin-bottom:12px;display:none;"></div>

                <button type="submit" class="btn btn-primary" id="pw-change-submit-btn" style="width:100%;padding:14px;font-size:15px;border-radius:10px;">
                    비밀번호 변경
                </button>
            </form>
        </div>
    `;
}

// 비밀번호 변경 처리
async function handlePasswordChange(event) {
    event.preventDefault();

    const errorEl = document.getElementById('pw-change-error');
    const submitBtn = document.getElementById('pw-change-submit-btn');
    const current = document.getElementById('pw-current').value;
    const newPw = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;

    if (newPw.length < 6) {
        errorEl.textContent = '새 비밀번호는 6자 이상이어야 합니다.';
        errorEl.style.display = 'block';
        return;
    }

    if (newPw !== confirm) {
        errorEl.textContent = '새 비밀번호가 일치하지 않습니다.';
        errorEl.style.display = 'block';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '변경 중...';
    errorEl.style.display = 'none';

    try {
        const result = await apiClient.changePassword(current, newPw);
        if (result.success) {
            alert('비밀번호가 변경되었습니다.');
            await loadProfile();
        } else {
            errorEl.textContent = result.message || '비밀번호 변경에 실패했습니다.';
            errorEl.style.display = 'block';
        }
    } catch (error) {
        errorEl.textContent = error.message || '비밀번호 변경에 실패했습니다.';
        errorEl.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '비밀번호 변경';
    }
}

// 로그아웃 처리
async function handleLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;

    try {
        await apiClient.logout();
    } catch (_) {
        // 무시
    }

    profileLoaded = false;
    currentProfile = null;
    navigateToScreen('login');
}

// 역할 텍스트 변환
function getRoleText(role) {
    const roleMap = {
        'super_admin': '총관리자',
        'admin': '관리자',
        'member': '회원',
        'pending': '가입 대기'
    };
    return roleMap[role] || role;
}

// 성별 텍스트 변환
function getGenderText(gender) {
    const genderMap = {
        'male': '남성',
        'female': '여성',
        'other': '기타'
    };
    return genderMap[gender] || gender;
}

// 프로필 수정 버튼 클릭 (앱바의 편집 버튼)
function handleEditProfile() {
    showEditProfileForm();
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    const profileScreen = document.getElementById('profile-screen');
    if (profileScreen) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (profileScreen.classList.contains('active')) {
                        if (!profileLoaded) {
                            loadProfile();
                        }
                    }
                }
            });
        });

        observer.observe(profileScreen, { attributes: true });
    }

    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', handleEditProfile);
    }
});

console.log('✅ Profile 모듈 로드 완료 (Railway API)');
