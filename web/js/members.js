// 회원 관련 기능 - 개선판 (Railway API 연동)

let currentMembersPage = 1;
let membersLoading = false;
let searchTimeout = null;

async function loadMembersScreen() {
    await loadMembers(1);
}

// 회원 목록 로드
async function loadMembers(page = 1) {
    if (membersLoading) return;
    const container = document.getElementById('member-list');
    if (!container) return;

    membersLoading = true;
    try {
        if (page === 1) {
            container.innerHTML = '<div class="content-loading"><div class="loading-spinner"></div><p>회원 목록을 불러오는 중...</p></div>';
        }
        const result = await apiClient.getMembers(page, 50);
        // API 응답 형식 호환: result.members 또는 result.data.members 또는 result.data.items
        const members = result.members || (result.data && (result.data.members || result.data.items)) || [];
        const total = result.total || (result.data && result.data.total) || members.length;

        if (result.success && members) {
            const badge = document.getElementById('member-count-badge');
            if (badge) badge.textContent = `${total}명`;

            if (members.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>등록된 회원이 없습니다.</p></div>';
            } else {
                container.innerHTML = renderMemberGrid(members);
                currentMembersPage = page;
            }
        } else {
            container.innerHTML = '<div class="error-state"><div class="error-state-icon">⚠️</div><p>회원 목록을 불러올 수 없습니다.</p><button class="btn btn-secondary btn-sm" onclick="loadMembers(1)">다시 시도</button></div>';
        }
    } catch (error) {
        console.error('회원 목록 로드 실패:', error);
        container.innerHTML = '<div class="error-state"><div class="error-state-icon">⚠️</div><p>회원 목록을 불러올 수 없습니다.</p><button class="btn btn-secondary btn-sm" onclick="loadMembers(1)">다시 시도</button></div>';
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
        container.innerHTML = '<div class="content-loading">검색 중...</div>';
        const result = await apiClient.searchMembers(query);
        const members = result.members || (result.data && (result.data.members || result.data.items)) || [];
        if (result.success && members) {
            const badge = document.getElementById('member-count-badge');
            if (badge) badge.textContent = `${members.length}명`;
            if (members.length === 0) {
                container.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
            } else {
                container.innerHTML = renderMemberGrid(members);
            }
        } else {
            container.innerHTML = '<div class="error-state">검색에 실패했습니다.</div>';
        }
    } catch (error) {
        console.error('회원 검색 실패:', error);
        container.innerHTML = '<div class="error-state">검색에 실패했습니다.</div>';
    }
}

// 회원 목록 그리드 렌더링
function renderMemberGrid(members) {
    return '<div class="member-grid">' +
        members.map(member => createMemberCard(member)).join('') +
    '</div>';
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
    const bgColor = '#DBEAFE';
    const avatarTextColor = '#1E40AF';

    const callBtn = member.phone
        ? `<a href="tel:${member.phone.replace(/\D/g, '')}" class="call-btn" aria-label="${escapeHtml(name)}에게 전화걸기" onclick="event.stopPropagation()">${phoneSvg20}</a>`
        : `<span class="call-btn call-btn--disabled" aria-hidden="true">${phoneSvg20}</span>`;

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
                    ${roleBadge}
                </div>
                ${position ? `<div class="member-position-v2">${escapeHtml(position)}</div>` : ''}
                ${company ? `<div class="member-company-v2">${escapeHtml(company)}</div>` : ''}
            </div>
            ${callBtn}
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
    container.innerHTML = '<div class="content-loading">회원 정보를 불러오는 중...</div>';

    try {
        const res = await apiClient.getMember(memberId);
        if (!res.success || !res.member) {
            container.innerHTML = '<div class="error-state">회원 정보를 불러오지 못했습니다.</div>';
            return;
        }
        const m = res.member;
        const roleLabel = m.role === 'super_admin' ? '총관리자' : m.role === 'admin' ? '관리자' : '회원';
        const genderLabel = m.gender === 'male' ? '남성' : m.gender === 'female' ? '여성' : '';
        container.innerHTML = `
            <div class="detail-view">
                <button class="btn-back" onclick="backToMemberList()">← 회원 목록</button>
                <div class="profile-hero">
                    <div class="profile-avatar-xl" style="background:#DBEAFE; color:#1E40AF">
                        ${m.profile_image
                            ? `<img src="${m.profile_image}" alt="${escapeHtml(m.name)}">`
                            : `<span>${escapeHtml((m.name || '?')[0])}</span>`
                        }
                    </div>
                    <h2 class="profile-hero-name">${escapeHtml(m.name || '')}</h2>
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

                ${(m.company || m.position || m.department) ? `
                <div class="info-section">
                    <h3 class="info-section-title">직장 정보</h3>
                    ${infoRow('회사', m.company)}
                    ${infoRow('직책', m.position)}
                    ${infoRow('부서', m.department)}
                    ${m.work_phone ? infoRow('직장 전화', m.work_phone, true) : ''}
                </div>` : ''}
            </div>
        `;
    } catch (_) {
        container.innerHTML = '<div class="error-state">회원 정보를 불러오지 못했습니다.</div>';
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

function showToast(msg) {
    let toast = document.getElementById('toast-msg');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-msg';
        toast.className = 'toast-msg';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

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
