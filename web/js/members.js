// 회원 관련 기능 - 개선판 (Railway API 연동)

// M-13: 업종 카테고리 상수
const INDUSTRY_CATEGORIES = [
    { code: 'law', name: '법률/법무' },
    { code: 'finance', name: '금융/보험' },
    { code: 'medical', name: '의료/건강' },
    { code: 'construction', name: '건설/부동산' },
    { code: 'it', name: 'IT/기술' },
    { code: 'manufacturing', name: '제조/생산' },
    { code: 'food', name: '요식/식음료' },
    { code: 'retail', name: '유통/판매' },
    { code: 'service', name: '서비스' },
    { code: 'realestate', name: '부동산/임대' },
    { code: 'culture', name: '문화/예술' },
    { code: 'public', name: '공공/기관' },
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
        '이사': 'pos-director', '감사': 'pos-auditor',
        '일반회원': 'pos-member'
    };
    const cls = classMap[positionName] || 'pos-default';
    return '<span class="position-badge ' + cls + '">' + escapeHtml(positionName) + '</span>';
}

let currentMembersPage = 1;
let membersLoading = false;
let searchTimeout = null;
let currentIndustryFilter = '';

async function loadMembersScreen() {
    currentIndustryFilter = '';
    renderIndustryFilter();
    await loadFavorites();
    await loadMembers(1);
}

// M-13: 업종 필터 드롭다운 렌더링
function renderIndustryFilter() {
    const wrap = document.querySelector('.member-search-wrap');
    if (!wrap) return;
    let filterEl = document.getElementById('industry-filter-wrap');
    if (filterEl) return; // 이미 있으면 스킵
    filterEl = document.createElement('div');
    filterEl.id = 'industry-filter-wrap';
    filterEl.className = 'industry-filter-wrap';
    filterEl.innerHTML = `
        <select id="industry-filter" class="industry-filter-select" onchange="handleIndustryFilterChange(this.value)">
            <option value="">업종: 전체</option>
            ${INDUSTRY_CATEGORIES.map(c => `<option value="${c.code}">${c.name}</option>`).join('')}
        </select>
    `;
    wrap.appendChild(filterEl);
}

function handleIndustryFilterChange(value) {
    currentIndustryFilter = value;
    loadMembers(1);
}

// 회원 목록 로드
async function loadMembers(page = 1) {
    if (membersLoading) return;
    const container = document.getElementById('member-list');
    if (!container) return;

    membersLoading = true;
    try {
        if (page === 1) {
            container.innerHTML = renderSkeleton('list');
        }
        let membersUrl = `/members?page=${page}&limit=50`;
        if (currentIndustryFilter) membersUrl += `&industry=${encodeURIComponent(currentIndustryFilter)}`;
        const result = await apiClient.request(membersUrl);
        // API 응답 형식 호환: result.members 또는 result.data.members 또는 result.data.items
        const members = result.members || (result.data && (result.data.members || result.data.items)) || [];
        const total = result.total || (result.data && result.data.total) || members.length;

        if (result.success && members) {
            const badge = document.getElementById('member-count-badge');
            if (badge) badge.textContent = `${total}명`;

            if (members.length === 0) {
                container.innerHTML = renderEmptyState('users', '등록된 회원이 없습니다');
            } else {
                container.innerHTML = renderMemberGrid(members);
                currentMembersPage = page;
            }
        } else {
            container.innerHTML = renderErrorState('회원 목록을 불러올 수 없습니다', '잠시 후 다시 시도해주세요', 'loadMembers(1)');
        }
    } catch (error) {
        console.error('회원 목록 로드 실패:', error);
        container.innerHTML = renderErrorState('회원 목록을 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'loadMembers(1)');
    } finally {
        membersLoading = false;
    }
}

// 회원 검색
async function searchMembers(query) {
    if (!query || query.trim() === '') { loadMembers(1); return; }
    const container = document.getElementById('member-list');
    if (!container) return;

    try {
        container.innerHTML = renderSkeleton('list');
        let searchUrl = `/members/search?q=${encodeURIComponent(query)}`;
        if (currentIndustryFilter) searchUrl += `&industry=${encodeURIComponent(currentIndustryFilter)}`;
        const result = await apiClient.request(searchUrl);
        const members = result.members || (result.data && (result.data.members || result.data.items)) || [];
        if (result.success && members) {
            const badge = document.getElementById('member-count-badge');
            if (badge) badge.textContent = `${members.length}명`;
            if (members.length === 0) {
                container.innerHTML = renderEmptyState('search', '검색 결과가 없습니다', '다른 이름으로 검색해보세요');
            } else {
                container.innerHTML = renderMemberGrid(members);
            }
        } else {
            container.innerHTML = renderErrorState('검색에 실패했습니다', null, `searchMembers('${query}')`);
        }
    } catch (error) {
        console.error('회원 검색 실패:', error);
        container.innerHTML = renderErrorState('검색에 실패했습니다', '네트워크 연결을 확인해주세요', `searchMembers('${query}')`);
    }
}

// 회원 목록 그리드 렌더링
function renderMemberGrid(members) {
    return '<div class="member-grid">' +
        members.map(member => createMemberCard(member)).join('') +
    '</div>';
}

// ========== 즐겨찾기 ==========

const starSvgFilled = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
const starSvgEmpty = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

async function loadFavorites() {
    const container = document.getElementById('member-list');
    if (!container) return;
    // 기존 즐겨찾기 섹션 제거
    const existing = document.getElementById('favorites-section');
    if (existing) existing.remove();

    try {
        const res = await apiClient.request('/favorites');
        if (!res.success || !res.data || !res.data.items || res.data.items.length === 0) return;
        const items = res.data.items;
        const html = `
            <div id="favorites-section" class="favorites-section">
                <div class="favorites-header">${starSvgFilled} 즐겨찾기</div>
                <div class="favorites-list">
                    ${items.map(m => {
                        const name = m.name || '이름 없음';
                        const callBtn = m.phone
                            ? `<a href="tel:${m.phone.replace(/\D/g, '')}" class="call-btn" aria-label="${escapeHtml(name)}에게 전화걸기" onclick="event.stopPropagation()">${phoneSvg20}</a>`
                            : '';
                        return `<div class="member-card-v2" onclick="navigateTo('/members/${m.id}')" style="padding:10px 14px">
                            <div class="member-avatar-v2" style="background:var(--color-primary-bg);color:var(--color-primary);width:36px;height:36px;font-size:14px">
                                ${m.profile_image ? `<img src="${m.profile_image}" alt="${escapeHtml(name)}">` : `<span>${escapeHtml(name[0])}</span>`}
                            </div>
                            <div class="member-info-v2">
                                <span class="member-name-v2">${escapeHtml(name)}</span>
                                ${m.position ? `<span class="member-position-v2" style="margin-left:6px">${escapeHtml(m.position)}</span>` : ''}
                            </div>
                            ${callBtn}
                            <button class="favorite-btn" onclick="event.stopPropagation();toggleFavorite(${m.id},true,this)" aria-label="즐겨찾기 해제">${starSvgFilled}</button>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforebegin', html);
    } catch (_) { /* 무시 */ }
}

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
        showToast(e.message || '즐겨찾기 변경에 실패했습니다.', 'error');
    }
}

// 전화번호 포맷 (표시용)
function formatPhone(num) {
    if (!num) return '';
    const clean = num.replace(/\D/g, '');
    if (clean.length === 11) return clean.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    if (clean.length === 10) return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    return num;
}

// 전화 아이콘 SVG
const phoneSvg20 = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';
const phoneSvg16 = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';

// 회원 카드 생성
function createMemberCard(member) {
    const name = member.name || '이름 없음';
    const initial = name[0] || '?';
    const company = member.company || '';
    const position = member.position || '';
    const roleBadge = member.role === 'super_admin' ? '<span class="member-role-badge role-super">총관리자</span>'
        : member.role === 'admin' ? '<span class="member-role-badge role-admin">관리자</span>' : '';
    const bgColor = 'var(--color-primary-bg)';
    const avatarTextColor = 'var(--color-primary)';

    const callBtn = member.phone
        ? `<a href="tel:${member.phone.replace(/\D/g, '')}" class="call-btn" aria-label="${escapeHtml(name)}에게 전화걸기" onclick="event.stopPropagation()">${phoneSvg20}</a>`
        : `<span class="call-btn call-btn--disabled" aria-hidden="true">${phoneSvg20}</span>`;

    const isFav = member.is_favorited;
    const favBtn = `<button class="favorite-btn" onclick="event.stopPropagation();toggleFavorite(${member.id},${!!isFav},this)" aria-label="${isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}">${isFav ? starSvgFilled : starSvgEmpty}</button>`;

    return `
        <div class="member-card-v2" onclick="navigateTo('/members/${member.id}')">
            <div class="member-avatar-v2" style="background:${bgColor}; color:${avatarTextColor}">
                ${member.profile_image
                    ? `<img src="${member.profile_image}" alt="${escapeHtml(name)}">`
                    : `<span>${escapeHtml(initial)}</span>`
                }
            </div>
            <div class="member-info-v2">
                <div class="member-name-row-v2">
                    <span class="member-name-v2">${escapeHtml(name)}</span>
                    ${member.jc_position ? getPositionBadgeHtml(member.jc_position) : ''}
                    ${roleBadge}
                </div>
                ${position ? `<div class="member-position-v2">${escapeHtml(position)}</div>` : ''}
                ${company ? `<div class="member-company-v2">${escapeHtml(company)}</div>` : ''}
                ${member.industry ? `<span class="industry-tag">${escapeHtml(getIndustryName(member.industry))}</span>` : ''}
            </div>
            ${callBtn}
            ${favBtn}
        </div>
    `;
}

// 회원 상세 화면
async function showMemberDetailScreen(memberId) {
    const screen = document.getElementById('members-screen');
    const container = document.getElementById('member-list');
    const searchWrap = document.querySelector('.member-search-wrap');
    if (!screen || !container) return;

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
    if (searchWrap) searchWrap.style.display = 'none';
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
                    <div class="profile-avatar-xl" style="background:var(--color-primary-bg); color:var(--color-primary)">
                        ${m.profile_image
                            ? `<img src="${m.profile_image}" alt="${escapeHtml(m.name)}">`
                            : `<span>${escapeHtml((m.name || '?')[0])}</span>`
                        }
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

                ${(m.company || m.position || m.department || m.industry) ? `
                <div class="info-section">
                    <h3 class="info-section-title">직장 정보</h3>
                    ${infoRow('회사', m.company)}
                    ${infoRow('직책', m.position)}
                    ${infoRow('부서', m.department)}
                    ${m.industry ? infoRow('업종', getIndustryName(m.industry) + (m.industry_detail ? ' · ' + m.industry_detail : '')) : ''}
                    ${m.work_phone ? infoRow('직장 전화', m.work_phone, true) : ''}
                </div>` : ''}

                <div id="title-history-container"></div>
            </div>
        `;
        loadTitleHistory(memberId);
    } catch (_) {
        container.innerHTML = renderErrorState('회원 정보를 불러오지 못했습니다', '네트워크 연결을 확인해주세요', `showMemberDetailScreen(${memberId})`);
    }
}

// ========== 직함 이력 ==========

async function loadTitleHistory(userId, containerId) {
    const container = document.getElementById(containerId || 'title-history-container');
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
    } catch (_) {
        container.innerHTML = '';
    }
}

function backToMemberList() {
    const searchWrap = document.querySelector('.member-search-wrap');
    if (searchWrap) searchWrap.style.display = '';
    loadMembers(currentMembersPage);
}

function infoRow(label, value, isPhone = false) {
    if (!value) return '';
    if (isPhone) {
        const display = formatPhone(value);
        const telHref = value.replace(/\D/g, '');
        return `<div class="info-row">
            <span class="info-label">${label}</span>
            <span class="info-value"><a href="tel:${telHref}" class="phone-link">${phoneSvg16} ${escapeHtml(display)}</a></span>
        </div>`;
    }
    return `<div class="info-row">
        <span class="info-label">${label}</span>
        <span class="info-value">${escapeHtml(value)}</span>
    </div>`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(text + ' 복사됨');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(text + ' 복사됨');
    });
}

// showToast는 utils.js의 글로벌 함수 사용

// 검색 입력 처리 (디바운싱)
function handleMemberSearch(event) {
    const query = event.target.value.trim();
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchMembers(query), 300);
}

// 이벤트 바인딩
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('member-search');
    if (searchInput) searchInput.addEventListener('input', handleMemberSearch);
});

console.log('✅ Members 모듈 로드 완료 (Railway API)');
