// 프로필 기능 - 개선판 (Railway API 연동)

var DEFAULT_AVATAR_SVG = '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="15" r="6" fill="#A0C4E8"/><ellipse cx="20" cy="32" rx="11" ry="8" fill="#A0C4E8"/></svg>';

let profileLoaded = false;
let currentProfile = null;

// 프로필 사진 업로드
async function uploadProfilePhoto(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
        showToast('파일 크기는 5MB 이하여야 합니다.', 'error');
        input.value = '';
        return;
    }
    try {
        const formData = new FormData();
        formData.append('photo', file);
        const token = localStorage.getItem('auth_token');
        const baseURL = (window.apiClient && window.apiClient.baseURL) || '/api';
        const res = await fetch(baseURL + '/profile/photo', {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            showToast('프로필 사진이 변경되었습니다.');
            loadProfile();
        } else {
            showToast(data.message || '업로드 실패', 'error');
        }
    } catch (err) {
        console.error('Upload profile photo error:', err);
        showToast('프로필 사진 업로드 중 오류가 발생했습니다.', 'error');
    }
    input.value = '';
}

// 내 프로필 로드
async function loadProfile() {
    const container = document.getElementById('profile-content');
    if (!container) return;

    try {
        container.innerHTML = renderSkeleton('list');
        const result = await apiClient.getProfile();
        if (result.success && result.profile) {
            currentProfile = result.profile;
            container.innerHTML = renderProfile(result.profile);
            profileLoaded = true;
            if (result.profile.id) loadProfileTitleHistory(result.profile.id);
            // 관리 기능은 사이드 메뉴 "로컬 관리"로 이동됨
        } else {
            container.innerHTML = renderErrorState('프로필을 불러올 수 없습니다', '잠시 후 다시 시도해주세요', 'loadProfile()');
        }
    } catch (error) {
        console.error('프로필 로드 실패:', error);
        container.innerHTML = renderErrorState('프로필을 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'loadProfile()');
    }
}

// SNS 타입별 아이콘/라벨
var SNS_TYPE_MAP = {
    instagram: { icon: '\uD83D\uDCF7', label: 'Instagram', urlPrefix: 'https://instagram.com/' },
    youtube:   { icon: '\uD83C\uDFAC', label: 'YouTube',   urlPrefix: 'https://youtube.com/' },
    twitter:   { icon: '\uD83D\uDC26', label: 'X (Twitter)', urlPrefix: 'https://x.com/' },
    facebook:  { icon: '\uD83D\uDCD8', label: 'Facebook',  urlPrefix: 'https://facebook.com/' },
    blog:      { icon: '\uD83D\uDCDD', label: '블로그',     urlPrefix: '' },
    other:     { icon: '\uD83D\uDD17', label: '기타',       urlPrefix: '' }
};

function renderSnsBadges(snsLinks) {
    if (!snsLinks || !Array.isArray(snsLinks) || snsLinks.length === 0) return '';
    return snsLinks.map(function(sns) {
        var info = SNS_TYPE_MAP[sns.type] || SNS_TYPE_MAP.other;
        var handle = sns.handle || '';
        var url = handle.startsWith('http') ? handle : (info.urlPrefix ? info.urlPrefix + handle.replace(/^@/, '') : handle);
        var hasUrl = url && (url.startsWith('http') || url.startsWith('//'));
        if (hasUrl) {
            return '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener" class="sns-badge" title="' + escapeHtml(info.label) + '">' + info.icon + ' ' + escapeHtml(handle) + '</a>';
        }
        return '<span class="sns-badge">' + info.icon + ' ' + escapeHtml(handle) + '</span>';
    }).join(' ');
}

// 프로필 렌더링
function renderProfile(p) {
    const roleLabel = getRoleText(p.role);
    const hasWorkInfo = p.company || p.position || p.department || p.work_phone;

    return `
        <div class="profile-v2">
            <!-- 프로필 히어로 -->
            <div class="profile-hero">
                <div class="profile-avatar-xl" style="background:#DBEAFE; position:relative; cursor:pointer" onclick="document.getElementById('profile-photo-input').click()">
                    ${p.profile_image
                        ? `<img src="${p.profile_image}" alt="${escapeHtml(p.name)}">`
                        : DEFAULT_AVATAR_SVG
                    }
                    <div class="avatar-camera-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="1.5"><rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M7 6l1.5-2h7L17 6"/></svg>
                    </div>
                    <div class="avatar-photo-hint">사진 변경</div>
                    <input type="file" id="profile-photo-input" accept="image/*" style="display:none" onchange="uploadProfilePhoto(this)">
                </div>
                <h2 class="profile-hero-name">${escapeHtml(p.name || '이름 없음')}${p.jc_position && typeof getPositionBadgeHtml === 'function' ? ' ' + getPositionBadgeHtml(p.jc_position) : ''}</h2>
                <span class="profile-hero-role">${roleLabel}</span>
            </div>

            <!-- 기본 정보 -->
            <div class="info-section">
                <h3 class="info-section-title">기본 정보</h3>
                ${p.org_name ? profileInfoRow('소속 로컬', p.org_name + (p.org_district ? ' (' + p.org_district + ')' : ''), 'group') : ''}
                ${profileInfoRow('이메일', p.email, 'mail')}
                ${profileInfoRow('연락처', p.phone, 'phone')}
                ${profileInfoRow('주소', p.address, 'location')}
                ${p.birth_date ? profileInfoRow('생년월일', formatDate(p.birth_date, 'YYYY-MM-DD'), 'calendar') : ''}
                ${p.gender ? profileInfoRow('성별', getGenderText(p.gender), 'person') : ''}
            </div>

            ${hasWorkInfo || p.industry ? `
            <div class="info-section">
                <h3 class="info-section-title">직장 정보</h3>
                ${p.company ? profileInfoRow('회사', p.company, 'company') : ''}
                ${p.position ? profileInfoRow('직책', p.position, 'badge') : ''}
                ${p.department ? profileInfoRow('부서', p.department, 'group') : ''}
                ${p.industry ? profileInfoRow('업종', (typeof getIndustryName === 'function' ? getIndustryName(p.industry) : p.industry) + (p.industry_detail ? ' · ' + p.industry_detail : ''), 'company') : ''}
                ${p.work_phone ? profileInfoRow('직장 전화', p.work_phone, 'phone') : ''}
            </div>` : ''}

            ${p.one_line_pr || p.service_description || (p.sns_links && p.sns_links.length > 0) ? `
            <div class="info-section">
                <h3 class="info-section-title">사업 PR</h3>
                ${p.one_line_pr ? profileInfoRow('한 줄 PR', p.one_line_pr, 'text') : ''}
                ${p.service_description ? profileInfoRow('주요 서비스', p.service_description, 'text') : ''}
                ${p.sns_links && p.sns_links.length > 0 ? `
                <div class="info-row">
                    <span class="info-label">SNS</span>
                    <span class="info-value sns-badges-wrap">${renderSnsBadges(p.sns_links)}</span>
                </div>` : ''}
            </div>` : ''}

            <div class="info-section">
                <h3 class="info-section-title">JC 정보</h3>
                ${profileInfoRow('입회일', p.join_date ? formatDate(p.join_date, 'YYYY-MM-DD') : '미설정', 'calendar')}
            </div>

            <div id="profile-title-history-container"></div>

            <!-- 메뉴 -->
            <div class="settings-group">
                <div class="settings-item" onclick="showEditProfileForm()">
                    <span class="settings-item-icon">&#9998;</span>
                    <span class="settings-item-label">내 정보 수정</span>
                    <span class="settings-item-chevron"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></span>
                </div>
                <div class="settings-item" onclick="showSettingsScreen()">
                    <span class="settings-item-icon">&#9881;</span>
                    <span class="settings-item-label">환경설정</span>
                    <span class="settings-item-chevron"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></span>
                </div>
            </div>
            <div class="settings-group">
                <div class="settings-item settings-item--danger" onclick="handleProfileLogout()">
                    <span class="settings-item-icon">&#10132;</span>
                    <span class="settings-item-label">로그아웃</span>
                </div>
            </div>
        </div>
    `;
}

function profileInfoRow(label, value, iconType) {
    if (!value) return '';
    if (iconType === 'phone') {
        const display = profileFormatPhone(value);
        const telHref = value.replace(/\D/g, '');
        const phoneSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';
        return `<div class="info-row">
            <span class="info-label">${label}</span>
            <span class="info-value"><a href="tel:${telHref}" class="phone-link">${phoneSvg} ${escapeHtml(display)}</a></span>
        </div>`;
    }
    return `<div class="info-row">
        <span class="info-label">${label}</span>
        <span class="info-value">${escapeHtml(value)}</span>
    </div>`;
}

function profileFormatPhone(num) {
    if (!num) return '';
    const clean = num.replace(/\D/g, '');
    if (clean.length === 11) return clean.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    if (clean.length === 10) return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    return num;
}

// 프로필 수정 폼
function showEditProfileForm() {
    const p = currentProfile;
    if (!p) return;
    const container = document.getElementById('profile-content');
    if (!container) return;
    const birthVal = p.birth_date ? formatDate(p.birth_date, 'YYYY-MM-DD') : '';

    // M-10: 관리자 지정 필드 readonly 여부
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    const isAdmin = ['admin', 'super_admin'].includes(userInfo.role);
    const roAttr = isAdmin ? '' : ' readonly class="readonly-field"';
    const roHint = isAdmin ? '' : '<span class="readonly-hint">관리자만 수정 가능</span>';

    container.innerHTML = `
        <div class="profile-v2">
            <button class="btn-back" onclick="loadProfile()">← 돌아가기</button>
            <h2 class="form-card-title">프로필 수정</h2>
            <form id="profile-edit-form" onsubmit="handleProfileEditSubmit(event)">
                <div class="info-section">
                    <h3 class="info-section-title">기본 정보</h3>
                    <div class="form-group"><label>이름 *</label><input type="text" id="edit-name" value="${escapeHtml(p.name || '')}" required></div>
                    <div class="form-group"><label>연락처</label><input type="tel" id="edit-phone" value="${escapeHtml(p.phone || '')}" placeholder="010-0000-0000"></div>
                    <div class="form-group"><label>전화번호 공개 범위</label>
                        <select id="edit-phone-visibility">
                            <option value="local" ${(p.phone_visibility || 'local') === 'local' ? 'selected' : ''}>로컬 공개 (같은 JC만)</option>
                            <option value="district" ${p.phone_visibility === 'district' ? 'selected' : ''}>지구 공개 (같은 지구)</option>
                            <option value="all" ${p.phone_visibility === 'all' ? 'selected' : ''}>전체 공개</option>
                        </select>
                        <span class="help-text">타 로컬 회원에게 전화번호 공개 여부</span>
                    </div>
                    <div class="form-group"><label>주소</label><input type="text" id="edit-address" value="${escapeHtml(p.address || '')}"></div>
                    <div class="form-group"><label>생년월일</label><input type="date" id="edit-birth-date" value="${birthVal}"></div>
                    <div class="form-group"><label>성별</label>
                        <select id="edit-gender">
                            <option value="">선택 안 함</option>
                            <option value="male" ${p.gender === 'male' ? 'selected' : ''}>남성</option>
                            <option value="female" ${p.gender === 'female' ? 'selected' : ''}>여성</option>
                        </select>
                    </div>
                    <div class="form-group"><label>입회일</label><input type="date" id="edit-join-date" value="${p.join_date ? formatDate(p.join_date, 'YYYY-MM-DD') : ''}"><span class="help-text">JC 입회 날짜 (과거 날짜 가능)</span></div>
                </div>
                <div class="info-section">
                    <h3 class="info-section-title">직장 정보</h3>
                    <div class="form-group"><label>회사</label><input type="text" id="edit-company" value="${escapeHtml(p.company || '')}"></div>
                    <div class="form-group"><label>직책 ${roHint}</label><input type="text" id="edit-position" value="${escapeHtml(p.position || '')}"${roAttr}></div>
                    <div class="form-group"><label>부서 ${roHint}</label><input type="text" id="edit-department" value="${escapeHtml(p.department || '')}"${roAttr}></div>
                    <div class="form-group"><label>업종</label>
                        <select id="edit-industry">
                            <option value="">선택 안 함</option>
                            ${(typeof INDUSTRY_CATEGORIES !== 'undefined' ? INDUSTRY_CATEGORIES : []).map(c => `<option value="${c.code}" ${p.industry === c.code ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group"><label>업종 상세</label><input type="text" id="edit-industry-detail" value="${escapeHtml(p.industry_detail || '')}" placeholder="상세 업종 (예: 소프트웨어 개발)" maxlength="100"></div>
                    <div class="form-group"><label>직장 전화</label><input type="tel" id="edit-work-phone" value="${escapeHtml(p.work_phone || '')}"></div>
                    <div class="form-group"><label>대표 사이트</label><input type="url" id="edit-website" value="${escapeHtml(p.website || '')}" placeholder="홈페이지, 인스타, 유튜브 등 URL"></div>
                </div>
                <div class="info-section">
                    <h3 class="info-section-title">사업 PR</h3>
                    <div class="form-group"><label>한 줄 PR</label><input type="text" id="edit-one-line-pr" value="${escapeHtml(p.one_line_pr || '')}" placeholder="예: 프리미엄 IT 서비스" maxlength="100"></div>
                    <div class="form-group"><label>주요 서비스</label><input type="text" id="edit-service-description" value="${escapeHtml(p.service_description || '')}" placeholder="예: 웹개발, 앱개발, 컨설팅" maxlength="200"></div>
                    <div class="form-group">
                        <label>SNS 링크</label>
                        <div id="sns-links-container">
                            ${renderSnsEditList(p.sns_links)}
                        </div>
                        <button type="button" class="btn btn-outline btn-sm" onclick="addSnsLinkRow()" style="margin-top:8px">+ SNS 추가</button>
                    </div>
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

// SNS 편집 목록 렌더링
function renderSnsEditList(snsLinks) {
    if (!snsLinks || !Array.isArray(snsLinks) || snsLinks.length === 0) return '';
    return snsLinks.map(function(sns, idx) {
        return renderSnsRow(sns.type || 'other', sns.handle || '', idx);
    }).join('');
}

function renderSnsRow(type, handle, idx) {
    var options = [
        {val:'instagram', label:'Instagram'},
        {val:'youtube', label:'YouTube'},
        {val:'twitter', label:'X (Twitter)'},
        {val:'facebook', label:'Facebook'},
        {val:'blog', label:'블로그'},
        {val:'other', label:'기타'}
    ];
    var optHtml = options.map(function(o) {
        return '<option value="' + o.val + '"' + (type === o.val ? ' selected' : '') + '>' + o.label + '</option>';
    }).join('');
    return '<div class="sns-edit-row" data-idx="' + idx + '" style="display:flex;gap:8px;align-items:center;margin-bottom:8px">' +
        '<select class="sns-type-select" style="flex:0 0 120px;height:40px;border:1px solid #D1D5DB;border-radius:8px;padding:0 8px;font-size:14px">' + optHtml + '</select>' +
        '<input type="text" class="sns-handle-input" value="' + escapeHtml(handle) + '" placeholder="@계정명 또는 URL" style="flex:1;height:40px;border:1px solid #D1D5DB;border-radius:8px;padding:0 12px;font-size:14px">' +
        '<button type="button" class="btn-icon-delete" onclick="removeSnsRow(this)" style="flex:0 0 36px;height:36px;border:none;background:#FEE2E2;color:#DC2626;border-radius:8px;cursor:pointer;font-size:16px" title="삭제">&times;</button>' +
        '</div>';
}

function addSnsLinkRow() {
    var container = document.getElementById('sns-links-container');
    if (!container) return;
    var idx = container.querySelectorAll('.sns-edit-row').length;
    container.insertAdjacentHTML('beforeend', renderSnsRow('instagram', '', idx));
}

function removeSnsRow(btn) {
    var row = btn.closest('.sns-edit-row');
    if (row) row.remove();
}

function collectSnsLinks() {
    var container = document.getElementById('sns-links-container');
    if (!container) return [];
    var rows = container.querySelectorAll('.sns-edit-row');
    var links = [];
    rows.forEach(function(row) {
        var type = row.querySelector('.sns-type-select').value;
        var handle = row.querySelector('.sns-handle-input').value.trim();
        if (handle) links.push({ type: type, handle: handle });
    });
    return links;
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
        work_phone: document.getElementById('edit-work-phone').value.trim() || null,
        industry: document.getElementById('edit-industry')?.value || null,
        industry_detail: document.getElementById('edit-industry-detail')?.value?.trim() || null,
        website: document.getElementById('edit-website')?.value?.trim() || null,
        join_date: document.getElementById('edit-join-date')?.value || null,
        phone_visibility: document.getElementById('edit-phone-visibility')?.value || 'local',
        one_line_pr: document.getElementById('edit-one-line-pr')?.value?.trim() || null,
        service_description: document.getElementById('edit-service-description')?.value?.trim() || null,
        sns_links: collectSnsLinks()
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
            showToast('비밀번호가 변경되었습니다.', 'success');
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

// 로그아웃 (프로필 화면 전용 — auth.js의 handleLogout 호출)
async function handleProfileLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    profileLoaded = false;
    currentProfile = null;
    // auth.js의 handleLogout 호출하여 전역 상태 정리
    if (typeof handleLogout === 'function') {
        handleLogout();
    }
}

function getRoleText(role) {
    return { 'super_admin': '총관리자', 'admin': '관리자', 'member': '회원', 'pending': '가입 대기' }[role] || role;
}

function getGenderText(gender) {
    return { 'male': '남성', 'female': '여성', 'other': '기타' }[gender] || gender;
}

// ========== 직함 이력 ==========

async function loadProfileTitleHistory(userId) {
    const container = document.getElementById('profile-title-history-container');
    if (!container) return;
    try {
        const res = await apiClient.request('/titles/' + userId);
        if (!res.success) { container.innerHTML = ''; return; }
        const titles = res.data || [];
        if (titles.length === 0) {
            container.innerHTML = `
                <div class="title-history-section">
                    <h3 class="section-title">직함 이력</h3>
                    <div class="empty-text">등록된 직함 이력이 없습니다.</div>
                </div>`;
            return;
        }
        container.innerHTML = `
            <div class="title-history-section">
                <h3 class="section-title">직함 이력</h3>
                ${titles.map(t => `
                    <div class="title-item">
                        <span class="title-year">${t.year}년</span>
                        <span class="title-position">${escapeHtml(t.title || t.position || '')}</span>
                    </div>
                `).join('')}
            </div>`;
    } catch (_) { container.innerHTML = ''; }
}

function handleEditProfile() { showEditProfileForm(); }

// ========== 프로필 편집 이탈 경고 ==========
var _profileEditing = false;

var _origShowEditProfileForm = showEditProfileForm;
showEditProfileForm = function() {
    _origShowEditProfileForm();
    _profileEditing = true;
    // 폼 input 변경 감지
    var form = document.getElementById('profile-edit-form');
    if (form) {
        form.addEventListener('input', function() { _profileEditing = true; }, { once: false });
    }
};

// 돌아가기 버튼 래핑
var _origLoadProfile = loadProfile;
window._profileBackGuard = function() {
    if (_profileEditing) {
        if (!confirm('수정 중인 내용이 저장되지 않습니다. 나가시겠습니까?')) return;
    }
    _profileEditing = false;
    _origLoadProfile();
};

// 프로필 수정 제출 성공 시 플래그 해제
var _origHandleProfileEditSubmit = typeof handleProfileEditSubmit === 'function' ? handleProfileEditSubmit : null;
if (_origHandleProfileEditSubmit) {
    var _wrappedProfileSubmit = handleProfileEditSubmit;
    // submit 후 성공 시 플래그 해제는 showToast 호출로 간접 확인 — 직접 해제
}

// showEditProfileForm 내 '돌아가기' 버튼 onclick을 가로채기
var _origContainerHtml = null;
(new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
                var backBtn = node.querySelector ? node.querySelector('.btn-back[onclick*="loadProfile"]') : null;
                if (backBtn) {
                    backBtn.setAttribute('onclick', 'window._profileBackGuard()');
                }
            }
        });
    });
})).observe(document.getElementById('profile-content') || document.body, { childList: true, subtree: true });

document.addEventListener('DOMContentLoaded', () => {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) editProfileBtn.addEventListener('click', handleEditProfile);
});

console.log('✅ Profile 모듈 로드 완료 (Railway API)');
