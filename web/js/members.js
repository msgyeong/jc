// 회원 관련 기능 (Railway API 연동)

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
            container.innerHTML = '<div class="content-loading">회원 목록 로딩 중...</div>';
        }

        const result = await apiClient.getMembers(page, 50);

        if (result.success && result.members) {
            if (result.members.length === 0) {
                container.innerHTML = '<div class="empty-state">등록된 회원이 없습니다.</div>';
            } else {
                container.innerHTML = result.members.map(member => createMemberCard(member)).join('');
                currentMembersPage = page;
            }
        } else {
            container.innerHTML = '<div class="error-state">회원 목록을 불러올 수 없습니다.</div>';
        }
    } catch (error) {
        console.error('회원 목록 로드 실패:', error);
        container.innerHTML = '<div class="error-state">회원 목록을 불러올 수 없습니다.</div>';
    } finally {
        membersLoading = false;
    }
}

// 회원 검색
async function searchMembers(query) {
    if (!query || query.trim() === '') {
        loadMembers(1);
        return;
    }

    const container = document.getElementById('member-list');
    if (!container) return;

    try {
        container.innerHTML = '<div class="content-loading">검색 중...</div>';

        const result = await apiClient.searchMembers(query);

        if (result.success && result.members) {
            if (result.members.length === 0) {
                container.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
            } else {
                container.innerHTML = result.members.map(member => createMemberCard(member)).join('');
            }
        } else {
            container.innerHTML = '<div class="error-state">검색에 실패했습니다.</div>';
        }
    } catch (error) {
        console.error('회원 검색 실패:', error);
        container.innerHTML = '<div class="error-state">검색에 실패했습니다.</div>';
    }
}

// 회원 카드 생성
function createMemberCard(member) {
    const company = member.company || '';
    const position = member.position || '';
    const affiliation = [company, position].filter(Boolean).join(' / ');

    return `
        <div class="member-card" onclick="navigateTo('/members/${member.id}')">
            <div class="member-avatar">
                ${member.profile_image ?
                    `<img src="${member.profile_image}" alt="${member.name}">` :
                    `<div class="member-avatar-placeholder">${member.name ? member.name[0] : '?'}</div>`
                }
            </div>

            <div class="member-info">
                <div class="member-name-row">
                    <h3 class="member-name">${escapeHtml(member.name || '이름 없음')}</h3>
                    ${member.role === 'super_admin' ? '<span class="badge badge-admin">총관리자</span>' : ''}
                    ${member.role === 'admin' ? '<span class="badge badge-admin">관리자</span>' : ''}
                </div>

                ${affiliation ? `<div class="member-company">🏢 ${escapeHtml(affiliation)}</div>` : ''}
                ${member.phone ? `<div class="member-phone">📞 ${escapeHtml(member.phone)}</div>` : ''}
            </div>
        </div>
    `;
}

// 회원 상세 화면
async function showMemberDetailScreen(memberId) {
    const screen = document.getElementById('members-screen');
    const container = document.getElementById('member-list');
    if (!screen || !container) return;
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    screen.classList.add('active');
    container.innerHTML = '<div class="content-loading">회원 정보 로딩 중...</div>';

    try {
        const res = await apiClient.getMember(memberId);
        if (!res.success || !res.member) {
            container.innerHTML = '<div class="error-state">회원 정보를 불러오지 못했습니다.</div>';
            return;
        }
        const m = res.member;
        const roleLabel = m.role === 'super_admin' ? '총괄관리자' : m.role === 'admin' ? '관리자' : '회원';
        const genderLabel = m.gender === 'male' ? '남성' : m.gender === 'female' ? '여성' : '';
        const company = m.company || '';
        const position = m.position || '';
        const department = m.department || '';
        const workPhone = m.work_phone || '';
        const hasWorkInfo = company || position || department;

        container.innerHTML = `
            <div class="post-detail">
                <div class="post-detail-actions" style="margin-bottom:12px">
                    <button class="btn btn-secondary btn-sm" onclick="loadMembersScreen()">← 목록</button>
                </div>
                <div style="text-align:center;margin-bottom:24px;">
                    <div style="width:80px;height:80px;border-radius:50%;background:#E6ECFA;display:inline-flex;align-items:center;justify-content:center;font-size:32px;color:#1F4FD8;font-weight:bold;overflow:hidden;">
                        ${m.profile_image ?
                            `<img src="${m.profile_image}" alt="${m.name}" style="width:100%;height:100%;object-fit:cover;">` :
                            (m.name ? m.name[0] : '?')
                        }
                    </div>
                    <h2 style="margin:8px 0 4px;">${escapeHtml(m.name || '')}</h2>
                    <span class="badge" style="background:#E6ECFA;color:#1F4FD8;padding:3px 10px;border-radius:12px;">${roleLabel}</span>
                </div>

                <div class="profile-section">
                    <h3 class="profile-section-title">기본 정보</h3>
                    <div class="profile-info-grid">
                        ${m.email ? `<div class="profile-info-item"><span class="profile-info-label">이메일</span><span class="profile-info-value">${escapeHtml(m.email)}</span></div>` : ''}
                        ${m.phone ? `<div class="profile-info-item"><span class="profile-info-label">연락처</span><span class="profile-info-value" style="cursor:pointer;" onclick="copyToClipboard('${escapeHtml(m.phone)}')">${escapeHtml(m.phone)} <small style="color:#6B7280;">(눌러서 복사)</small></span></div>` : ''}
                        ${m.address ? `<div class="profile-info-item"><span class="profile-info-label">주소</span><span class="profile-info-value">${escapeHtml(m.address)}</span></div>` : ''}
                        ${genderLabel ? `<div class="profile-info-item"><span class="profile-info-label">성별</span><span class="profile-info-value">${genderLabel}</span></div>` : ''}
                        ${m.birth_date ? `<div class="profile-info-item"><span class="profile-info-label">생년월일</span><span class="profile-info-value">${formatDate(m.birth_date, 'YYYY-MM-DD')}</span></div>` : ''}
                        ${m.created_at ? `<div class="profile-info-item"><span class="profile-info-label">가입일</span><span class="profile-info-value">${formatDate(m.created_at, 'YYYY-MM-DD')}</span></div>` : ''}
                    </div>
                </div>

                ${hasWorkInfo ? `
                <div class="profile-section">
                    <h3 class="profile-section-title">직장 정보</h3>
                    <div class="profile-info-grid">
                        ${company ? `<div class="profile-info-item"><span class="profile-info-label">회사</span><span class="profile-info-value">${escapeHtml(company)}</span></div>` : ''}
                        ${position ? `<div class="profile-info-item"><span class="profile-info-label">직책</span><span class="profile-info-value">${escapeHtml(position)}</span></div>` : ''}
                        ${department ? `<div class="profile-info-item"><span class="profile-info-label">부서</span><span class="profile-info-value">${escapeHtml(department)}</span></div>` : ''}
                        ${workPhone ? `<div class="profile-info-item"><span class="profile-info-label">직장 전화</span><span class="profile-info-value" style="cursor:pointer;" onclick="copyToClipboard('${escapeHtml(workPhone)}')">${escapeHtml(workPhone)} <small style="color:#6B7280;">(눌러서 복사)</small></span></div>` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    } catch (_) {
        container.innerHTML = '<div class="error-state">회원 정보를 불러오지 못했습니다.</div>';
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(text + ' 복사됨');
    }).catch(() => {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert(text + ' 복사됨');
    });
}

// 검색 입력 처리 (디바운싱)
function handleMemberSearch(event) {
    const query = event.target.value.trim();
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
        searchMembers(query);
    }, 300);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    const membersScreen = document.getElementById('members-screen');
    if (membersScreen) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (membersScreen.classList.contains('active')) {
                        if (currentMembersPage === 0) {
                            loadMembers(1);
                        }
                    }
                }
            });
        });
        observer.observe(membersScreen, { attributes: true });
    }

    const searchInput = document.getElementById('member-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleMemberSearch);
    }
});

console.log('✅ Members 모듈 로드 완료 (Railway API)');
