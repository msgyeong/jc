// 프로필 기능 - 개선판 (Railway API 연동)

let profileLoaded = false;
let currentProfile = null;

// 내 프로필 로드
async function loadProfile() {
    const container = document.getElementById('profile-content');
    if (!container) return;

    try {
        container.innerHTML = '<div class="content-loading">프로필을 불러오는 중...</div>';
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
function renderProfile(p) {
    const roleLabel = getRoleText(p.role);
    const hasWorkInfo = p.company || p.position || p.department || p.work_phone;

    return `
        <div class="profile-v2">
            <!-- 프로필 히어로 -->
            <div class="profile-hero">
                <div class="profile-avatar-xl" style="background:#DBEAFE; color:#1E40AF">
                    ${p.profile_image
                        ? `<img src="${p.profile_image}" alt="${escapeHtml(p.name)}">`
                        : `<span>${escapeHtml((p.name || '?')[0])}</span>`
                    }
                </div>
                <h2 class="profile-hero-name">${escapeHtml(p.name || '이름 없음')}</h2>
                <span class="profile-hero-role">${roleLabel}</span>
            </div>

            <!-- 기본 정보 -->
            <div class="info-section">
                <h3 class="info-section-title">기본 정보</h3>
                ${profileInfoRow('이메일', p.email, 'mail')}
                ${profileInfoRow('연락처', p.phone, 'phone')}
                ${profileInfoRow('주소', p.address, 'location')}
                ${p.birth_date ? profileInfoRow('생년월일', formatDate(p.birth_date, 'YYYY-MM-DD'), 'calendar') : ''}
                ${p.gender ? profileInfoRow('성별', getGenderText(p.gender), 'person') : ''}
            </div>

            ${hasWorkInfo ? `
            <div class="info-section">
                <h3 class="info-section-title">직장 정보</h3>
                ${p.company ? profileInfoRow('회사', p.company, 'company') : ''}
                ${p.position ? profileInfoRow('직책', p.position, 'badge') : ''}
                ${p.department ? profileInfoRow('부서', p.department, 'group') : ''}
                ${p.work_phone ? profileInfoRow('직장 전화', p.work_phone, 'phone') : ''}
            </div>` : ''}

            <div class="info-section">
                <h3 class="info-section-title">가입 정보</h3>
                ${profileInfoRow('가입일', formatDate(p.created_at, 'YYYY-MM-DD'), 'calendar')}
            </div>

            <!-- 액션 버튼 -->
            <div class="profile-actions">
                <button class="profile-action-btn primary" onclick="showEditProfileForm()">
                    <span class="profile-action-icon">&#9998;</span>
                    프로필 수정
                </button>
                <button class="profile-action-btn secondary" onclick="showChangePasswordDialog()">
                    <span class="profile-action-icon">&#128274;</span>
                    비밀번호 변경
                </button>
                ${['super_admin', 'admin'].includes(p.role) ? `
                <button class="profile-action-btn admin" onclick="navigateToScreen('admin')">
                    <span class="profile-action-icon">&#9881;</span>
                    관리자 메뉴
                </button>` : ''}
                <button class="profile-action-btn danger" onclick="handleLogout()">
                    <span class="profile-action-icon">&#10132;</span>
                    로그아웃
                </button>
            </div>
        </div>
    `;
}

function profileInfoRow(label, value, iconType) {
    if (!value) return '';
    return `<div class="info-row">
        <span class="info-label">${label}</span>
        <span class="info-value">${escapeHtml(value)}</span>
    </div>`;
}

// 프로필 수정 폼
function showEditProfileForm() {
    const p = currentProfile;
    if (!p) return;
    const container = document.getElementById('profile-content');
    if (!container) return;
    const birthVal = p.birth_date ? formatDate(p.birth_date, 'YYYY-MM-DD') : '';

    container.innerHTML = `
        <div class="profile-v2">
            <button class="btn-back" onclick="loadProfile()">← 돌아가기</button>
            <h2 class="form-card-title">프로필 수정</h2>
            <form id="profile-edit-form" onsubmit="handleProfileEditSubmit(event)">
                <div class="info-section">
                    <h3 class="info-section-title">기본 정보</h3>
                    <div class="form-group"><label>이름 *</label><input type="text" id="edit-name" value="${escapeHtml(p.name || '')}" required></div>
                    <div class="form-group"><label>연락처</label><input type="tel" id="edit-phone" value="${escapeHtml(p.phone || '')}" placeholder="010-0000-0000"></div>
                    <div class="form-group"><label>주소</label><input type="text" id="edit-address" value="${escapeHtml(p.address || '')}"></div>
                    <div class="form-group"><label>생년월일</label><input type="date" id="edit-birth-date" value="${birthVal}"></div>
                    <div class="form-group"><label>성별</label>
                        <select id="edit-gender">
                            <option value="">선택 안 함</option>
                            <option value="male" ${p.gender === 'male' ? 'selected' : ''}>남성</option>
                            <option value="female" ${p.gender === 'female' ? 'selected' : ''}>여성</option>
                        </select>
                    </div>
                </div>
                <div class="info-section">
                    <h3 class="info-section-title">직장 정보</h3>
                    <div class="form-group"><label>회사</label><input type="text" id="edit-company" value="${escapeHtml(p.company || '')}"></div>
                    <div class="form-group"><label>직책</label><input type="text" id="edit-position" value="${escapeHtml(p.position || '')}"></div>
                    <div class="form-group"><label>부서</label><input type="text" id="edit-department" value="${escapeHtml(p.department || '')}"></div>
                    <div class="form-group"><label>직장 전화</label><input type="tel" id="edit-work-phone" value="${escapeHtml(p.work_phone || '')}"></div>
                </div>
                <div id="profile-edit-error" class="inline-error-message"></div>
                <button type="submit" class="btn btn-primary btn-full" id="profile-edit-submit-btn">
                    <span class="btn-text">저장</span>
                    <span class="btn-loading" style="display:none;"><span class="spinner"></span></span>
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
    if (!name) { showInlineError('profile-edit-error', '이름은 필수 입력입니다.'); return; }

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

    setButtonLoading(submitBtn, true);
    if (errorEl) { errorEl.classList.remove('show'); errorEl.textContent = ''; }

    try {
        const result = await apiClient.updateProfile(data);
        if (result.success) {
            profileLoaded = false;
            await loadProfile();
        } else {
            showInlineError('profile-edit-error', result.message || '프로필 수정에 실패했습니다.');
        }
    } catch (error) {
        showInlineError('profile-edit-error', error.message || '프로필 수정에 실패했습니다.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// 비밀번호 변경
function showChangePasswordDialog() {
    const container = document.getElementById('profile-content');
    if (!container) return;

    container.innerHTML = `
        <div class="profile-v2">
            <button class="btn-back" onclick="loadProfile()">← 돌아가기</button>
            <h2 class="form-card-title">비밀번호 변경</h2>
            <form id="password-change-form" onsubmit="handlePasswordChange(event)">
                <div class="info-section">
                    <div class="form-group"><label>현재 비밀번호</label><input type="password" id="pw-current" required></div>
                    <div class="form-group"><label>새 비밀번호 (6자 이상)</label><input type="password" id="pw-new" required minlength="6"></div>
                    <div class="form-group"><label>새 비밀번호 확인</label><input type="password" id="pw-confirm" required minlength="6"></div>
                </div>
                <div id="pw-change-error" class="inline-error-message"></div>
                <button type="submit" class="btn btn-primary btn-full" id="pw-change-submit-btn">
                    <span class="btn-text">비밀번호 변경</span>
                    <span class="btn-loading" style="display:none;"><span class="spinner"></span></span>
                </button>
            </form>
        </div>
    `;
}

async function handlePasswordChange(event) {
    event.preventDefault();
    const submitBtn = document.getElementById('pw-change-submit-btn');
    const current = document.getElementById('pw-current').value;
    const newPw = document.getElementById('pw-new').value;
    const confirmPw = document.getElementById('pw-confirm').value;

    if (newPw.length < 6) { showInlineError('pw-change-error', '새 비밀번호는 6자 이상이어야 합니다.'); return; }
    if (newPw !== confirmPw) { showInlineError('pw-change-error', '새 비밀번호가 일치하지 않습니다.'); return; }

    setButtonLoading(submitBtn, true);
    try {
        const result = await apiClient.changePassword(current, newPw);
        if (result.success) {
            alert('비밀번호가 변경되었습니다.');
            await loadProfile();
        } else {
            showInlineError('pw-change-error', result.message || '비밀번호 변경에 실패했습니다.');
        }
    } catch (error) {
        showInlineError('pw-change-error', error.message || '비밀번호 변경에 실패했습니다.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// 로그아웃
async function handleLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    try { await apiClient.logout(); } catch (_) {}
    profileLoaded = false;
    currentProfile = null;
    navigateToScreen('login');
}

function getRoleText(role) {
    return { 'super_admin': '총관리자', 'admin': '관리자', 'member': '회원', 'pending': '가입 대기' }[role] || role;
}

function getGenderText(gender) {
    return { 'male': '남성', 'female': '여성', 'other': '기타' }[gender] || gender;
}

function handleEditProfile() { showEditProfileForm(); }

document.addEventListener('DOMContentLoaded', () => {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) editProfileBtn.addEventListener('click', handleEditProfile);
});

console.log('✅ Profile 모듈 로드 완료 (Railway API)');
