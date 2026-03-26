// 프로필 기능 - 개선판 (Railway API 연동)

var DEFAULT_AVATAR_SVG = '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="15" r="6" fill="#A0C4E8"/><ellipse cx="20" cy="32" rx="11" ry="8" fill="#A0C4E8"/></svg>';

let profileLoaded = false;
let currentProfile = null;

// 프로필 사진 업로드
async function uploadProfilePhoto(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
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
            loadProfile();
        } else {
        }
    } catch (err) {
        console.error('Upload profile photo error:', err);
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
                    <input type="file" id="profile-photo-input" accept="image/*" style="display:none" onchange="uploadProfilePhoto(this)">
                </div>
                <h2 class="profile-hero-name">${escapeHtml(p.name || '이름 없음')}${p.jc_position && typeof getPositionBadgeHtml === 'function' ? ' ' + getPositionBadgeHtml(p.jc_position) : ''}</h2>
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

            ${hasWorkInfo || p.industry ? `
            <div class="info-section">
                <h3 class="info-section-title">직장 정보</h3>
                ${p.company ? profileInfoRow('회사', p.company, 'company') : ''}
                ${p.position ? profileInfoRow('직책', p.position, 'badge') : ''}
                ${p.department ? profileInfoRow('부서', p.department, 'group') : ''}
                ${p.industry ? profileInfoRow('업종', (typeof getIndustryName === 'function' ? getIndustryName(p.industry) : p.industry) + (p.industry_detail ? ' · ' + p.industry_detail : ''), 'company') : ''}
                ${p.work_phone ? profileInfoRow('직장 전화', p.work_phone, 'phone') : ''}
            </div>` : ''}

            <div class="info-section">
                <h3 class="info-section-title">JC 정보</h3>
                ${profileInfoRow('입회일', p.join_date ? formatDate(p.join_date, 'YYYY-MM-DD') : '미설정', 'calendar')}
            </div>

            <div id="profile-title-history-container"></div>

            <!-- 사업 PR 섹션 -->
            ${renderBusinessPR(p)}

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
                    <div class="form-group"><label>직업</label><input type="text" id="edit-profession" value="${escapeHtml(p.profession || '')}" placeholder="예: 대표이사, 변호사, 의사"></div>
                    <div class="form-group"><label>대표 사이트</label><input type="url" id="edit-website" value="${escapeHtml(p.website || '')}" placeholder="홈페이지, 인스타, 유튜브 등 URL"></div>
                </div>
                <div class="info-section">
                    <h3 class="info-section-title">사업 PR</h3>
                    <div class="form-group"><label>한 줄 PR (100자)</label><input type="text" id="edit-biz-headline" value="${escapeHtml(p.business_headline || '')}" placeholder="예: 프리미엄 식품 수출 전문" maxlength="100"></div>
                    <div class="form-group"><label>주요 서비스/상품</label><textarea id="edit-biz-description" rows="4" placeholder="사업 소개, 주요 서비스, 상품 등을 자유롭게 입력하세요" maxlength="500" style="resize:vertical">${escapeHtml(p.business_description || '')}</textarea></div>
                    <div class="form-group"><label>사업장 주소</label><input type="text" id="edit-biz-address" value="${escapeHtml(p.business_address || '')}" placeholder="사업장 주소"></div>
                    <div class="form-group"><label>SNS 링크</label>
                        <div id="social-links-container">${renderSocialLinksForm(p.business_social_links)}</div>
                        <button type="button" class="btn btn-outline btn-sm" onclick="addSocialLinkField()" style="margin-top:8px">+ SNS 추가</button>
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
        profession: document.getElementById('edit-profession')?.value?.trim() || null,
        join_date: document.getElementById('edit-join-date')?.value || null,
        phone_visibility: document.getElementById('edit-phone-visibility')?.value || 'local',
        business_headline: document.getElementById('edit-biz-headline')?.value?.trim() || null,
        business_description: document.getElementById('edit-biz-description')?.value?.trim() || null,
        business_address: document.getElementById('edit-biz-address')?.value?.trim() || null,
        business_social_links: collectSocialLinks()
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

// ========== 사업 PR 섹션 ==========

function renderBusinessPR(p) {
    const hasBiz = p.business_headline || p.business_description || p.website || p.business_address || p.profession;
    const socialLinks = p.business_social_links || [];
    const hasSocial = Array.isArray(socialLinks) && socialLinks.length > 0;

    if (!hasBiz && !hasSocial) {
        return `
            <div class="info-section">
                <h3 class="info-section-title">사업 정보</h3>
                <div style="text-align:center;padding:20px 0;color:var(--text-secondary)">
                    등록된 사업 정보가 없습니다.
                    <div style="margin-top:8px"><button class="btn btn-outline btn-sm" onclick="showEditProfileForm()">추가하기</button></div>
                </div>
            </div>`;
    }

    const platformIcons = { facebook: '📘', instagram: '📷', youtube: '🎬', twitter: '🐦', linkedin: '💼', tiktok: '🎵', blog: '📝' };

    return `
        <div class="info-section">
            <h3 class="info-section-title">사업 정보</h3>
            ${p.business_headline ? `<div style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:8px">${escapeHtml(p.business_headline)}</div>` : ''}
            ${p.profession ? profileInfoRow('직업', p.profession, 'company') : ''}
            ${p.business_description ? `<div style="margin:8px 0;padding:12px;background:var(--primary-light,#EFF6FF);border-radius:8px;font-size:13px;line-height:1.6;white-space:pre-wrap">${escapeHtml(p.business_description)}</div>` : ''}
            ${p.business_address ? profileInfoRow('사업장', p.business_address, 'location') : ''}
            ${p.website ? `<div class="info-row"><span class="info-label">웹사이트</span><span class="info-value"><a href="${ensureUrl(p.website)}" target="_blank" rel="noopener" style="color:var(--primary-color);text-decoration:none">${escapeHtml(p.website)}</a></span></div>` : ''}
            ${hasSocial ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px">${socialLinks.map(s => `<a href="${ensureUrl(s.url)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--secondary-color,#F9FAFB);border-radius:16px;font-size:12px;text-decoration:none;color:var(--text-primary)">${platformIcons[s.platform] || '🔗'} ${escapeHtml(s.platform)}</a>`).join('')}</div>` : ''}
        </div>`;
}

function renderSocialLinksForm(links) {
    if (!links || !Array.isArray(links) || links.length === 0) return '';
    return links.map((s, i) => `
        <div class="social-link-row" style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
            <select class="social-platform" style="width:100px;padding:8px;border:1px solid var(--border-color);border-radius:8px;font-size:13px">
                ${['facebook','instagram','youtube','twitter','linkedin','tiktok','blog'].map(p => `<option value="${p}" ${s.platform === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
            <input type="text" class="social-url" value="${escapeHtml(s.url || '')}" placeholder="URL 또는 @아이디" style="flex:1;padding:8px;border:1px solid var(--border-color);border-radius:8px;font-size:13px">
            <button type="button" onclick="this.closest('.social-link-row').remove()" style="background:none;border:none;color:var(--error-color);cursor:pointer;font-size:18px">&times;</button>
        </div>`).join('');
}

function addSocialLinkField() {
    const container = document.getElementById('social-links-container');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'social-link-row';
    row.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;align-items:center';
    row.innerHTML = `
        <select class="social-platform" style="width:100px;padding:8px;border:1px solid var(--border-color);border-radius:8px;font-size:13px">
            ${['facebook','instagram','youtube','twitter','linkedin','tiktok','blog'].map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
        <input type="text" class="social-url" value="" placeholder="URL 또는 @아이디" style="flex:1;padding:8px;border:1px solid var(--border-color);border-radius:8px;font-size:13px">
        <button type="button" onclick="this.closest('.social-link-row').remove()" style="background:none;border:none;color:var(--error-color);cursor:pointer;font-size:18px">&times;</button>`;
    container.appendChild(row);
}

function collectSocialLinks() {
    const rows = document.querySelectorAll('#social-links-container .social-link-row');
    const links = [];
    rows.forEach(row => {
        const platform = row.querySelector('.social-platform')?.value;
        const url = row.querySelector('.social-url')?.value?.trim();
        if (platform && url) links.push({ platform, url });
    });
    return links;
}

function ensureUrl(url) {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return 'https://' + url;
}

function handleEditProfile() { showEditProfileForm(); }

document.addEventListener('DOMContentLoaded', () => {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) editProfileBtn.addEventListener('click', handleEditProfile);
});

console.log('✅ Profile 모듈 로드 완료 (Railway API)');
