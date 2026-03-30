// 회원 관련 기능 — 카카오톡 스타일 리뉴얼 (Railway API 연동)

var DEFAULT_AVATAR_SVG_SM = '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="15" r="6" fill="#A0C4E8"/><ellipse cx="20" cy="32" rx="11" ry="8" fill="#A0C4E8"/></svg>';

// 풀스크린 이미지 뷰어
function openFullscreenViewer(imageUrl) {
    if (!imageUrl) return;
    var overlay = document.createElement('div');
    overlay.className = 'fullscreen-viewer';
    overlay.innerHTML = '<button class="fs-close-btn" aria-label="닫기">&times;</button>'
        + '<img src="' + imageUrl.replace(/"/g, '&quot;') + '" alt="프로필 사진">';
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay || e.target.classList.contains('fs-close-btn')) {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.15s';
            setTimeout(function() { overlay.remove(); }, 150);
        }
    });
    document.body.appendChild(overlay);
}

// ========== 상수 ==========

const INDUSTRY_CATEGORIES = [
    { code: 'law', name: '법률/법무' }, { code: 'finance', name: '금융/보험' },
    { code: 'medical', name: '의료/건강' }, { code: 'construction', name: '건설/부동산' },
    { code: 'it', name: 'IT/기술' }, { code: 'manufacturing', name: '제조/생산' },
    { code: 'food', name: '요식/식음료' }, { code: 'retail', name: '유통/판매' },
    { code: 'service', name: '서비스' }, { code: 'realestate', name: '부동산/임대' },
    { code: 'culture', name: '문화/예술' }, { code: 'public', name: '공공/기관' },
    { code: 'other', name: '기타' }
];

function getIndustryName(code) {
    if (!code) return '';
    const found = INDUSTRY_CATEGORIES.find(c => c.code === code);
    return found ? found.name : code;
}

// 직책 뱃지 HTML 생성
function getPositionBadgeHtml(positionName) {
    if (!positionName) return '';
    const classMap = {
        '회장': 'pos-president', '수석부회장': 'pos-senior-vp',
        '부회장': 'pos-vp', '총무': 'pos-secretary',
        '이사': 'pos-director', '감사': 'pos-auditor', '일반회원': 'pos-member'
    };
    const cls = classMap[positionName] || 'pos-default';
    return '<span class="position-badge ' + cls + '">' + escapeHtml(positionName) + '</span>';
}

const starSvgFilled = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
const starSvgEmpty = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
const phoneSvg20 = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';
const phoneSvg16 = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';

// ========== 상태 변수 ==========

let currentMembersPage = 1;
let membersLoading = false;
let currentIndustryFilter = '';
let currentPositionFilter = '';
let currentJoinNumberFilter = '';
let cachedPositions = [];
let searchScope = 'my-org'; // 'my-org' | 'all-org'
let searchTimeout = null;
let crossOrgEnabled = false; // 타로컬 보기 토글

// ========== 메인 화면 로드 ==========

async function loadMembersScreen() {
    currentIndustryFilter = '';
    currentPositionFilter = '';
    const container = document.getElementById('member-list');
    if (!container) return;
    container.innerHTML = renderSkeleton('list');

    try {
        // 병렬 로드: 즐겨찾기, 그룹, 회원 목록, 직책 목록
        const [favRes, groupsRes, membersRes, posRes] = await Promise.all([
            apiClient.request('/favorites').catch(() => ({ success: false })),
            apiClient.request('/member-groups').catch(() => ({ success: false })),
            apiClient.request('/members?page=1&limit=50' + (currentIndustryFilter ? '&industry=' + currentIndustryFilter : '') + (currentPositionFilter ? '&position_id=' + currentPositionFilter : '') + (currentJoinNumberFilter ? '&join_number=' + currentJoinNumberFilter : '') + (crossOrgEnabled ? '&cross_org=true' : '')).catch(() => ({ success: false })),
            apiClient.request('/positions').catch(() => ({ success: false }))
        ]);
        cachedPositions = (posRes.success && posRes.data) ? posRes.data : [];

        const members = membersRes.members || (membersRes.data && (membersRes.data.members || membersRes.data.items)) || [];
        const total = membersRes.total || (membersRes.data && membersRes.data.total) || members.length;
        const favorites = (favRes.success && favRes.data && favRes.data.items) ? favRes.data.items : [];
        const groups = (groupsRes.success && groupsRes.data && groupsRes.data.items) ? groupsRes.data.items : [];

        const badge = document.getElementById('member-count-badge');
        if (badge) badge.textContent = `${total}명`;

        if (members.length === 0 && favorites.length === 0) {
            container.innerHTML = renderEmptyState('users', '등록된 회원이 없습니다');
            return;
        }

        let html = '';

        // 1. "나" 섹션
        const userInfo = typeof currentUser !== 'undefined' ? currentUser : JSON.parse(localStorage.getItem('user_info') || 'null');
        const myId = userInfo ? userInfo.id : null;
        const myMember = myId ? members.find(m => String(m.id) === String(myId)) : null;
        if (myMember) {
            html += renderMeSection(myMember);
        }

        // 2. 즐겨찾기 섹션
        if (favorites.length > 0) {
            html += renderFavoritesSection(favorites);
        }

        // 3. 그룹 섹션들
        if (groups.length > 0) {
            html += renderGroupsSections(groups);
        }
        html += `<div class="add-group-row"><button type="button" class="add-group-btn" onclick="showCreateGroupDialog()">+ 그룹 추가</button></div>`;

        // 4. 전체 회원 섹션
        const otherMembers = members.filter(m => !myId || String(m.id) !== String(myId));
        html += renderAllMembersSection(otherMembers, total - (myMember ? 1 : 0));

        container.innerHTML = html;
        currentMembersPage = 1;
    } catch (error) {
        console.error('회원 목록 로드 실패:', error);
        container.innerHTML = renderErrorState('회원 목록을 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'loadMembersScreen()');
    }
}

// ========== 섹션 렌더링 ==========

function renderMeSection(member) {
    const name = member.name || '이름 없음';
    const roleBadge = member.role === 'super_admin' ? '<span class="member-role-badge role-super">총관리자</span>'
        : member.role === 'admin' ? '<span class="member-role-badge role-admin">관리자</span>' : '';

    return `
        <div class="member-section me-section">
            <div class="member-section-header">나</div>
            <div class="me-card" onclick="navigateTo('/members/${member.id}')">
                <div class="me-avatar" style="background:var(--primary-bg)">
                    ${member.profile_image ? `<img src="${member.profile_image}" alt="${escapeHtml(name)}">` : DEFAULT_AVATAR_SVG_SM}
                </div>
                <div class="me-info">
                    <div class="me-name-row">
                        <span class="me-name">${escapeHtml(name)}</span>
                        ${member.jc_position ? getPositionBadgeHtml(member.jc_position) : ''}
                        ${roleBadge}
                    </div>
                    ${member.company ? `<div class="me-sub">${escapeHtml(member.company)}</div>` : ''}
                </div>
            </div>
        </div>`;
}

function renderFavoritesSection(favorites) {
    const cards = favorites.map(m => {
        const name = m.name || '이름 없음';
        const callBtn = m.phone
            ? `<a href="tel:${m.phone.replace(/\D/g, '')}" class="call-btn" aria-label="${escapeHtml(name)}에게 전화걸기" onclick="event.stopPropagation()">${phoneSvg20}</a>`
            : '';
        return `<div class="member-card-v2 compact" onclick="navigateTo('/members/${m.id}')">
            <div class="member-avatar-v2" style="background:var(--primary-bg);width:36px;height:36px">
                ${m.profile_image ? `<img src="${m.profile_image}" alt="${escapeHtml(name)}">` : DEFAULT_AVATAR_SVG_SM}
            </div>
            <div class="member-info-v2">
                <span class="member-name-v2">${escapeHtml(name)}</span>
                ${m.position ? `<span class="member-position-v2" style="margin-left:6px">${escapeHtml(m.position)}</span>` : ''}
            </div>
            ${callBtn}
            <button class="favorite-btn" onclick="event.stopPropagation();toggleFavorite(${m.id},true,this)" aria-label="즐겨찾기 해제">${starSvgFilled}</button>
        </div>`;
    }).join('');

    return `
        <div class="member-section section-collapsible" id="section-favorites">
            <div class="member-section-header clickable" onclick="toggleSectionCollapse('section-favorites')">
                <span>${starSvgFilled} 즐겨찾기 <span class="section-count">${favorites.length}</span></span>
            </div>
            <div class="section-body">${cards}</div>
        </div>`;
}

function renderGroupsSections(groups) {
    return groups.map(g => `
        <div class="member-section section-collapsible group-section" id="section-group-${g.id}" data-group-id="${g.id}">
            <div class="member-section-header clickable" onclick="toggleSectionCollapse('section-group-${g.id}')">
                <span>📁 ${escapeHtml(g.name)} <span class="section-count">${g.member_count}</span></span>
                <div class="group-actions">
                    <button class="group-action-btn" onclick="event.stopPropagation();showEditGroupDialog(${g.id},'${escapeHtml(g.name)}')" aria-label="이름 변경">✎</button>
                    <button class="group-action-btn" onclick="event.stopPropagation();deleteGroup(${g.id})" aria-label="삭제">🗑</button>
                </div>
            </div>
            <div class="section-body" id="group-body-${g.id}">
                <div class="content-loading" style="padding:8px">로딩 중...</div>
            </div>
        </div>
    `).join('');
}

function renderAllMembersSection(members, count) {
    const industryOptions = INDUSTRY_CATEGORIES.map(c =>
        `<option value="${c.code}"${currentIndustryFilter === c.code ? ' selected' : ''}>${c.name}</option>`
    ).join('');

    const positionOptions = cachedPositions.length > 0
        ? cachedPositions.map(p =>
            `<option value="${p.id}"${currentPositionFilter == p.id ? ' selected' : ''}>${escapeHtml(p.name)}</option>`
        ).join('')
        : [
            {id: 1, name: '회장'}, {id: 2, name: '수석부회장'}, {id: 3, name: '부회장'},
            {id: 4, name: '총무'}, {id: 5, name: '이사'}, {id: 6, name: '감사'}, {id: 7, name: '일반회원'}
        ].map(p => `<option value="${p.id}"${currentPositionFilter == p.id ? ' selected' : ''}>${p.name}</option>`).join('');

    const cards = members.map(m => createMemberCard(m)).join('');

    return `
        <div class="member-section" id="section-all-members">
            <div class="member-section-header all-members-header" style="flex-wrap:wrap;gap:6px">
                <span>회원 ${count}명</span>
                <div class="member-filters-row">
                    <select class="industry-filter-inline" onchange="handleIndustryFilterChange(this.value)">
                        <option value="">업종: 전체</option>
                        ${industryOptions}
                    </select>
                    <select class="industry-filter-inline" onchange="handlePositionFilterChange(this.value)">
                        <option value="">직책: 전체</option>
                        ${positionOptions}
                    </select>
                    <label class="cross-org-toggle" style="display:inline-flex;align-items:center;gap:4px;font-size:13px;color:var(--text-hint);cursor:pointer;margin-left:4px">
                        <input type="checkbox" id="cross-org-check" onchange="handleCrossOrgToggle(this.checked)" style="accent-color:var(--primary-color)">
                        <span>타로컬 보기</span>
                    </label>
                </div>
            </div>
            <div class="member-section-list">${cards || renderEmptyState('users', '조건에 맞는 회원이 없습니다')}</div>
        </div>`;
}

// ========== 카드 생성 ==========

function createMemberCard(member) {
    const name = member.name || '이름 없음';
    const roleBadge = member.role === 'super_admin' ? '<span class="member-role-badge role-super">총관리자</span>'
        : member.role === 'admin' ? '<span class="member-role-badge role-admin">관리자</span>' : '';

    const callBtn = member.phone
        ? `<a href="tel:${member.phone.replace(/\D/g, '')}" class="call-btn" aria-label="${escapeHtml(name)}에게 전화걸기" onclick="event.stopPropagation()">${phoneSvg20}</a>`
        : `<span class="call-btn call-btn--disabled" aria-hidden="true">${phoneSvg20}</span>`;

    const isFav = member.is_favorited;
    const favBtn = `<button class="favorite-btn" onclick="event.stopPropagation();toggleFavorite(${member.id},${!!isFav},this)" aria-label="${isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}">${isFav ? starSvgFilled : starSvgEmpty}</button>`;

    return `
        <div class="member-card-v2" onclick="navigateTo('/members/${member.id}')">
            <div class="member-avatar-v2" style="background:var(--primary-bg)">
                ${member.profile_image ? `<img src="${member.profile_image}" alt="${escapeHtml(name)}">` : DEFAULT_AVATAR_SVG_SM}
            </div>
            <div class="member-info-v2">
                <div class="member-name-row-v2">
                    <span class="member-name-v2">${escapeHtml(name)}</span>
                    ${member.jc_position ? getPositionBadgeHtml(member.jc_position) : ''}
                    ${roleBadge}
                </div>
                ${member.position ? `<div class="member-position-v2">${escapeHtml(member.position)}</div>` : ''}
                ${member.company ? `<div class="member-company-v2">${escapeHtml(member.company)}</div>` : ''}
                ${member.one_line_pr ? `<div class="member-one-line-pr">${escapeHtml(member.one_line_pr)}</div>` : (member.business_headline ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px">${escapeHtml(member.business_headline)}</div>` : '')}
                ${member.industry ? `<span class="industry-tag">${escapeHtml(getIndustryName(member.industry))}</span>` : ''}
            </div>
            ${callBtn}
            ${favBtn}
        </div>`;
}

// 검색결과용 카드 (타조직 회원: 전화번호 없음, 조직명 표시)
function createSearchResultCard(member) {
    const name = member.name || '이름 없음';
    const isFav = member.is_favorited;
    const favBtn = `<button class="favorite-btn" onclick="event.stopPropagation();toggleFavorite(${member.id},${!!isFav},this)" aria-label="${isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}">${isFav ? starSvgFilled : starSvgEmpty}</button>`;

    const callBtn = member.phone
        ? `<a href="tel:${member.phone.replace(/\D/g, '')}" class="call-btn" onclick="event.stopPropagation()">${phoneSvg20}</a>`
        : '';

    return `
        <div class="member-card-v2" onclick="navigateTo('/members/${member.id}')">
            <div class="member-avatar-v2" style="background:var(--primary-bg);width:36px;height:36px">
                ${member.profile_image ? `<img src="${member.profile_image}" alt="${escapeHtml(name)}">` : DEFAULT_AVATAR_SVG_SM}
            </div>
            <div class="member-info-v2">
                <div class="member-name-row-v2">
                    <span class="member-name-v2">${escapeHtml(name)}</span>
                </div>
                ${member.company ? `<div class="member-company-v2">${escapeHtml(member.company)}</div>` : ''}
                ${member.org_name ? `<div class="member-org-tag">${escapeHtml(member.org_name)}</div>` : ''}
            </div>
            ${callBtn}
            ${favBtn}
        </div>`;
}

// ========== 업종 필터 ==========

function handleIndustryFilterChange(value) {
    currentIndustryFilter = value;
    loadFilteredMembers();
}

function handlePositionFilterChange(value) {
    currentPositionFilter = value;
    loadFilteredMembers();
}

function handleCrossOrgToggle(checked) {
    crossOrgEnabled = checked;
    loadFilteredMembers();
}

async function loadFilteredMembers() {
    const container = document.getElementById('member-list');
    if (!container) return;
    const listEl = container.querySelector('.member-section-list');
    if (listEl) listEl.innerHTML = renderSkeleton('list');

    try {
        let url = '/members?page=1&limit=50';
        if (currentIndustryFilter) url += `&industry=${encodeURIComponent(currentIndustryFilter)}`;
        if (currentPositionFilter) url += `&position_id=${encodeURIComponent(currentPositionFilter)}`;
        if (crossOrgEnabled) url += '&cross_org=true';
        const membersRes = await apiClient.request(url);
        const members = membersRes.members || [];
        const total = membersRes.total || members.length;

        const userInfo = typeof currentUser !== 'undefined' ? currentUser : JSON.parse(localStorage.getItem('user_info') || 'null');
        const myId = userInfo ? userInfo.id : null;
        const otherMembers = members.filter(m => !myId || String(m.id) !== String(myId));
        const cards = otherMembers.map(m => createMemberCard(m)).join('');

        const badge = document.getElementById('member-count-badge');
        if (badge) badge.textContent = `${total}명`;

        // 전체 회원 섹션만 업데이트
        const sectionEl = document.getElementById('section-all-members');
        if (sectionEl) {
            const headerSpan = sectionEl.querySelector('.all-members-header > span');
            if (headerSpan) headerSpan.textContent = `회원 ${total - (members.find(m => myId && String(m.id) === String(myId)) ? 1 : 0)}명`;
            const listInner = sectionEl.querySelector('.member-section-list');
            if (listInner) listInner.innerHTML = cards || '<div class="empty-text" style="padding:16px;text-align:center;color:var(--text-secondary)">해당하는 회원이 없습니다</div>';
        }
    } catch (error) {
        console.error('필터 로드 실패:', error);
    }
}

// ========== 즐겨찾기 ==========

async function toggleFavorite(memberId, currentState, btnEl) {
    try {
        if (currentState) {
            await apiClient.request('/favorites/' + memberId, { method: 'DELETE' });
            if (btnEl) { btnEl.innerHTML = starSvgEmpty; btnEl.setAttribute('aria-label', '즐겨찾기 추가'); }
            btnEl.onclick = function(e) { e.stopPropagation(); toggleFavorite(memberId, false, btnEl); };
        } else {
            await apiClient.request('/favorites/' + memberId, { method: 'POST' });
            if (btnEl) { btnEl.innerHTML = starSvgFilled; btnEl.setAttribute('aria-label', '즐겨찾기 해제'); }
            btnEl.onclick = function(e) { e.stopPropagation(); toggleFavorite(memberId, true, btnEl); };
        }
    } catch (e) {
    }
}

// ========== 섹션 접기/펼치기 ==========

function toggleSectionCollapse(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.classList.toggle('collapsed');

    // 그룹의 경우 처음 펼칠 때 멤버 로드
    if (!section.classList.contains('collapsed') && section.classList.contains('group-section')) {
        const groupId = section.dataset.groupId;
        const body = document.getElementById('group-body-' + groupId);
        if (body && body.querySelector('.content-loading')) {
            loadGroupMembers(groupId);
        }
    }
}

// ========== 그룹 관리 ==========

async function loadGroupMembers(groupId) {
    const body = document.getElementById('group-body-' + groupId);
    if (!body) return;
    try {
        const res = await apiClient.request('/member-groups/' + groupId + '/members');
        const items = (res.success && res.data && res.data.items) ? res.data.items : [];
        if (items.length === 0) {
            body.innerHTML = '<div class="empty-text" style="padding:12px;text-align:center;color:var(--text-secondary);font-size:13px">멤버가 없습니다</div>';
            return;
        }
        body.innerHTML = items.map(m => {
            const name = m.name || '이름 없음';
            return `<div class="member-card-v2 compact" onclick="navigateTo('/members/${m.id}')">
                <div class="member-avatar-v2" style="background:var(--primary-bg);width:36px;height:36px">
                    ${m.profile_image ? `<img src="${m.profile_image}" alt="${escapeHtml(name)}">` : DEFAULT_AVATAR_SVG_SM}
                </div>
                <div class="member-info-v2">
                    <span class="member-name-v2">${escapeHtml(name)}</span>
                    ${m.company ? `<span class="member-company-v2" style="margin-left:6px">${escapeHtml(m.company)}</span>` : ''}
                </div>
                <button class="group-action-btn" onclick="event.stopPropagation();removeFromGroup(${groupId},${m.id})" aria-label="그룹에서 제거" title="그룹에서 제거">✕</button>
            </div>`;
        }).join('');
    } catch (_) {
        body.innerHTML = '<div class="empty-text" style="padding:12px;color:var(--text-secondary)">로드 실패</div>';
    }
}

function showCreateGroupDialog() {
    const name = prompt('새 그룹 이름을 입력하세요:');
    if (!name || !name.trim()) return;
    apiClient.request('/member-groups', { method: 'POST', body: JSON.stringify({ name: name.trim() }) })
        .then(res => {
        })
}

function showEditGroupDialog(groupId, currentName) {
    const name = prompt('그룹 이름 변경:', currentName);
    if (!name || !name.trim() || name.trim() === currentName) return;
    apiClient.request('/member-groups/' + groupId, { method: 'PUT', body: JSON.stringify({ name: name.trim() }) })
        .then(res => {
        })
}

function deleteGroup(groupId) {
    if (!confirm('이 그룹을 삭제할까요?')) return;
    apiClient.request('/member-groups/' + groupId, { method: 'DELETE' })
        .then(res => {
            if (res.success) { loadMembersScreen(); }
        })
        .catch(err => { console.error('그룹 삭제 실패:', err); });
}

function removeFromGroup(groupId, memberId) {
    apiClient.request('/member-groups/' + groupId + '/members/' + memberId, { method: 'DELETE' })
        .then(res => {
            if (res.success) { loadGroupMembers(groupId); }
        })
}

// ========== 검색 오버레이 ==========

function openMemberSearchOverlay() {
    const overlay = document.getElementById('member-search-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    const input = document.getElementById('member-search-global');
    if (input) { input.value = ''; input.focus(); }
    document.getElementById('search-results').innerHTML =
        '<div class="search-empty-hint">이름, 초성(ㄱㅁㅇ), 업종, 조직명으로 검색하세요</div>';
    if (typeof pushRoute === 'function') pushRoute('member-search');
}

function closeMemberSearchOverlay() {
    const overlay = document.getElementById('member-search-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    if (location.hash === '#member-search') history.back();
}

function switchSearchTab(scope) {
    searchScope = scope;
    document.querySelectorAll('.search-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.scope === scope);
    });
    // 현재 입력값으로 재검색
    const input = document.getElementById('member-search-global');
    if (input && input.value.trim()) {
        performGlobalSearch(input.value.trim());
    }
}

function handleGlobalSearchInput(e) {
    const q = e.target.value.trim();
    if (searchTimeout) clearTimeout(searchTimeout);
    if (!q) {
        document.getElementById('search-results').innerHTML =
            '<div class="search-empty-hint">이름, 초성(ㄱㅁㅇ), 업종, 조직명으로 검색하세요</div>';
        return;
    }
    searchTimeout = setTimeout(() => performGlobalSearch(q), 300);
}

async function performGlobalSearch(q) {
    const resultsEl = document.getElementById('search-results');
    if (!resultsEl) return;
    resultsEl.innerHTML = renderSkeleton('list');

    try {
        let url;
        if (searchScope === 'all-org') {
            url = `/members/search-all?q=${encodeURIComponent(q)}`;
        } else {
            url = `/members/search?q=${encodeURIComponent(q)}`;
        }
        const res = await apiClient.request(url);
        const members = res.members || (res.data && res.data.items) || [];

        if (members.length === 0) {
            resultsEl.innerHTML = '<div class="search-empty-hint">검색 결과가 없습니다</div>';
            return;
        }

        if (searchScope === 'all-org') {
            // 조직별 그룹핑
            const grouped = {};
            members.forEach(m => {
                const org = m.org_name || '소속 없음';
                if (!grouped[org]) grouped[org] = [];
                grouped[org].push(m);
            });
            let html = '';
            for (const [orgName, orgMembers] of Object.entries(grouped)) {
                html += `<div class="search-org-group">
                    <div class="search-org-header">${escapeHtml(orgName)} (${orgMembers.length})</div>
                    ${orgMembers.map(m => createSearchResultCard(m)).join('')}
                </div>`;
            }
            resultsEl.innerHTML = html;
        } else {
            resultsEl.innerHTML = members.map(m => createSearchResultCard(m)).join('');
        }
    } catch (error) {
        console.error('검색 실패:', error);
        resultsEl.innerHTML = '<div class="search-empty-hint">검색 중 오류가 발생했습니다</div>';
    }
}

// ========== 회원 상세 화면 ==========

async function showMemberDetailScreen(memberId) {
    // 검색 오버레이 닫기
    closeMemberSearchOverlay();

    // 올바른 화면 전환 (navigateToScreen 사용)
    navigateToScreen('member-detail');

    const container = document.getElementById('member-detail-content') || document.getElementById('member-list');
    if (!container) return;
    container.innerHTML = renderSkeleton('list');

    try {
        const res = await apiClient.getMember(memberId);
        if (!res.success || !res.member) {
            container.innerHTML = renderErrorState('회원 정보를 불러오지 못했습니다', null, `showMemberDetailScreen(${memberId})`);
            return;
        }
        const m = res.member;
        const roleLabel = m.role === 'super_admin' ? '총관리자' : m.role === 'admin' ? '관리자' : '회원';
        const genderLabel = m.gender === 'male' ? '남성' : m.gender === 'female' ? '여성' : '';
        container.innerHTML = `
            <div class="detail-view">
                <button class="btn-back" onclick="backToMemberList()">← 회원 목록</button>
                <div class="profile-hero">
                    <div class="profile-avatar-xl" style="background:var(--primary-bg)${m.profile_image ? ';cursor:pointer' : ''}" ${m.profile_image ? `onclick="openFullscreenViewer('${m.profile_image.replace(/'/g, "\\'")}')"` : ''}>
                        ${m.profile_image ? `<img src="${m.profile_image}" alt="${escapeHtml(m.name)}">` : DEFAULT_AVATAR_SVG_SM}
                    </div>
                    <h2 class="profile-hero-name">${escapeHtml(m.name || '')}${m.jc_position ? ' ' + getPositionBadgeHtml(m.jc_position) : ''}</h2>
                    <span class="profile-hero-role">${roleLabel}</span>
                </div>

                <div class="info-section">
                    <h3 class="info-section-title">기본 정보</h3>
                    ${infoRow('이메일', m.email)}
                    ${infoRow('연락처', m.phone, true)}
                    ${infoRow('주소', m.address)}
                    ${genderLabel ? infoRow('성별', genderLabel) : ''}
                    ${m.birth_date ? infoRow('생년월일', formatDate(m.birth_date, 'YYYY-MM-DD')) : ''}
                    ${m.created_at ? infoRow('가입일', formatDate(m.created_at, 'YYYY-MM-DD')) : ''}
                </div>

                ${(m.company || m.position || m.department || m.industry || m.website) ? `
                <div class="info-section">
                    <h3 class="info-section-title">직장 정보</h3>
                    ${infoRow('회사', m.company)}
                    ${infoRow('직책', m.position)}
                    ${infoRow('부서', m.department)}
                    ${m.industry ? infoRow('업종', getIndustryName(m.industry) + (m.industry_detail ? ' · ' + m.industry_detail : '')) : ''}
                    ${m.work_phone ? infoRow('직장 전화', m.work_phone, true) : ''}
                    ${m.website ? `<div class="info-row"><span class="info-label">대표 사이트</span><span class="info-value"><a href="${escapeHtml(m.website)}" target="_blank" rel="noopener" style="color:var(--primary-color);text-decoration:underline;word-break:break-all">${escapeHtml(m.website)}</a></span></div>` : ''}
                </div>` : ''}

                ${m.one_line_pr || m.service_description || (m.sns_links && m.sns_links.length > 0) ? `
                <div class="info-section">
                    <h3 class="info-section-title">사업 PR</h3>
                    ${m.one_line_pr ? infoRow('한 줄 PR', m.one_line_pr) : ''}
                    ${m.service_description ? infoRow('주요 서비스', m.service_description) : ''}
                    ${m.sns_links && m.sns_links.length > 0 ? '<div class="info-row"><span class="info-label">SNS</span><span class="info-value sns-badges-wrap">' + (typeof renderSnsBadges === 'function' ? renderSnsBadges(m.sns_links) : '') + '</span></div>' : ''}
                </div>` : ''}

                <div id="title-history-container"></div>
            </div>
        `;
        loadTitleHistory(memberId);
    } catch (_) {
        container.innerHTML = renderErrorState('회원 정보를 불러오지 못했습니다', '네트워크 연결을 확인해주세요', `showMemberDetailScreen(${memberId})`);
    }
}

async function loadTitleHistory(userId, containerId) {
    const container = document.getElementById(containerId || 'title-history-container');
    if (!container) return;
    try {
        const res = await apiClient.request('/titles/' + userId);
        if (!res.success) { container.innerHTML = ''; return; }
        const titles = res.data || [];
        if (titles.length === 0) {
            container.innerHTML = `<div class="title-history-section"><h3 class="section-title">직함 이력</h3><div class="empty-text">등록된 직함 이력이 없습니다.</div></div>`;
            return;
        }
        container.innerHTML = `<div class="title-history-section"><h3 class="section-title">직함 이력</h3>${titles.map(t => `<div class="title-item"><span class="title-year">${t.year}년</span><span class="title-position">${escapeHtml(t.title || t.position || '')}</span></div>`).join('')}</div>`;
    } catch (_) { container.innerHTML = ''; }
}

function backToMemberList() {
    navigateToScreen('members', { back: true });
}

// ========== 유틸리티 ==========

function formatPhone(num) {
    if (!num) return '';
    const clean = num.replace(/\D/g, '');
    if (clean.length === 11) return clean.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    if (clean.length === 10) return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    return num;
}

function infoRow(label, value, isPhone = false) {
    if (!value) return '';
    if (isPhone) {
        const display = formatPhone(value);
        const telHref = value.replace(/\D/g, '');
        return `<div class="info-row"><span class="info-label">${label}</span><span class="info-value"><a href="tel:${telHref}" class="phone-link">${phoneSvg16} ${escapeHtml(display)}</a></span></div>`;
    }
    return `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${escapeHtml(value)}</span></div>`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        // copied
    }).catch(function() {
        var ta = document.createElement('textarea'); ta.value = text;
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
    });
}

// ========== 이벤트 바인딩 ==========

document.addEventListener('DOMContentLoaded', () => {
    // 검색 오버레이 입력
    const globalSearch = document.getElementById('member-search-global');
    if (globalSearch) globalSearch.addEventListener('input', handleGlobalSearchInput);

    // 뒤로가기 핸들러
    window.addEventListener('popstate', function(e) {
        const overlay = document.getElementById('member-search-overlay');
        if (overlay && overlay.classList.contains('open')) {
            overlay.classList.remove('open');
        }
    });
});

console.log('✅ Members 모듈 로드 완료 (카카오톡 스타일)');
