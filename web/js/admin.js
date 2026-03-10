// 관리자 페이지 (API 클라이언트 기반)

// ============================================
// 초기화
// ============================================

function initAdminPage() {
    if (!checkAdminPermission()) {
        showAdminError('관리자 권한이 없습니다. 홈으로 이동합니다.');
        setTimeout(() => navigateTo('/home'), 2000);
        return;
    }

    setupAdminTabs();
    loadAdminStats();
    switchAdminTab('pending-users');
}

function checkAdminPermission() {
    const user = getCurrentUser();
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'admin';
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('user_info')) || null;
    } catch {
        return null;
    }
}

function showAdminError(msg) {
    const el = document.getElementById('admin-error');
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
    }
}

// ============================================
// 탭 전환
// ============================================

function setupAdminTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', e => {
            e.preventDefault();
            switchAdminTab(tab.dataset.tab);
        });
    });
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(t =>
        t.classList.remove('active')
    );
    document.querySelectorAll('.admin-tab-content').forEach(c =>
        c.classList.remove('active')
    );

    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');

    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeContent) activeContent.classList.add('active');

    switch (tabName) {
        case 'pending-users':
            loadPendingUsers();
            break;
        case 'all-users':
            loadAllUsers();
            break;
        case 'content-management':
            loadContentManagement();
            break;
    }
}

// ============================================
// 대시보드 통계
// ============================================

async function loadAdminStats() {
    try {
        const data = await apiClient.request('/admin/stats');
        if (!data.success) return;

        const { stats } = data;
        const statsHtml = `
            <div class="admin-stats">
                <div class="stat-card">
                    <span class="stat-number">${stats.totalMembers}</span>
                    <span class="stat-label">활성 회원</span>
                </div>
                <div class="stat-card stat-warning">
                    <span class="stat-number">${stats.pendingMembers}</span>
                    <span class="stat-label">승인 대기</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${stats.totalPosts}</span>
                    <span class="stat-label">게시글</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${stats.totalNotices}</span>
                    <span class="stat-label">공지사항</span>
                </div>
            </div>
        `;
        const statsEl = document.getElementById('admin-stats');
        if (statsEl) statsEl.innerHTML = statsHtml;
    } catch (e) {
        console.error('통계 로드 실패:', e);
    }
}

// ============================================
// 승인 대기 회원 관리
// ============================================

async function loadPendingUsers() {
    const container = document.getElementById('pending-users-list');
    container.innerHTML = '<div class="content-loading">로딩 중...</div>';

    try {
        const data = await apiClient.request('/admin/members/pending');

        if (!data.success) throw new Error(data.message);

        if (data.members.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>승인 대기 중인 회원이 없습니다.</p>
                </div>`;
            return;
        }

        container.innerHTML = data.members
            .map(user => renderPendingUserCard(user))
            .join('');
    } catch (error) {
        console.error('승인 대기 회원 로딩 실패:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p class="error-text">회원 정보를 불러올 수 없습니다.</p>
                <p class="error-detail">${error.message}</p>
            </div>`;
    }
}

function renderPendingUserCard(user) {
    const avatarHtml = user.profile_image
        ? `<img src="${user.profile_image}" alt="${user.name}">`
        : `<div class="avatar-placeholder">${user.name.charAt(0)}</div>`;

    return `
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-info">
                <div class="user-avatar">${avatarHtml}</div>
                <div class="user-details">
                    <h3>${user.name}</h3>
                    <p class="user-email">${user.email}</p>
                    <p class="user-meta">
                        ${user.phone ? `📞 ${user.phone}` : ''}
                        ${user.birth_date ? `🎂 ${formatAdminDate(user.birth_date)}` : ''}
                    </p>
                    <p class="user-date">가입 신청: ${formatAdminDateTime(user.created_at)}</p>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-success"
                    onclick="approveUser('${user.id}', '${user.name}')">
                    승인
                </button>
                <button class="btn btn-danger"
                    onclick="rejectUser('${user.id}', '${user.name}')">
                    거부
                </button>
            </div>
        </div>`;
}

async function approveUser(userId, userName) {
    if (!confirm(`${userName} 님을 승인하시겠습니까?`)) return;
    try {
        const data = await apiClient.request(
            `/admin/members/${userId}/approve`,
            { method: 'PATCH' }
        );
        if (!data.success) throw new Error(data.message);
        alert(`✅ ${userName} 님이 승인되었습니다.`);
        loadPendingUsers();
        loadAdminStats();
    } catch (error) {
        alert(`❌ 승인 처리 실패: ${error.message}`);
    }
}

async function rejectUser(userId, userName) {
    if (!confirm(`${userName} 님의 가입을 거부하시겠습니까?\n해당 계정이 삭제됩니다.`)) return;
    try {
        const data = await apiClient.request(
            `/admin/members/${userId}/reject`,
            { method: 'DELETE' }
        );
        if (!data.success) throw new Error(data.message);
        alert(`✅ ${userName} 님의 가입이 거부되었습니다.`);
        loadPendingUsers();
        loadAdminStats();
    } catch (error) {
        alert(`❌ 거부 처리 실패: ${error.message}`);
    }
}

// ============================================
// 전체 회원 관리
// ============================================

let allUsersSearchTimer = null;

async function loadAllUsers(searchQuery = '', statusFilter = '') {
    const container = document.getElementById('all-users-list');
    container.innerHTML = '<div class="content-loading">로딩 중...</div>';

    try {
        const params = new URLSearchParams({ limit: 50 });
        if (searchQuery) params.set('q', searchQuery);
        if (statusFilter) params.set('status', statusFilter);

        const data = await apiClient.request(`/admin/members?${params}`);
        if (!data.success) throw new Error(data.message);

        if (data.members.length === 0) {
            container.innerHTML = `
                <div class="empty-state"><p>회원이 없습니다.</p></div>`;
            return;
        }

        const currentUser = getCurrentUser();
        container.innerHTML = data.members
            .map(user => renderAllUserCard(user, currentUser))
            .join('');
    } catch (error) {
        console.error('전체 회원 로딩 실패:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p class="error-text">회원 정보를 불러올 수 없습니다.</p>
            </div>`;
    }
}

function renderAllUserCard(user, currentUser) {
    const isSelf = String(user.id) === String(currentUser?.id);
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const statusBadge = getStatusBadge(user.status);
    const roleBadge = getRoleBadge(user.role);

    const avatarHtml = user.profile_image
        ? `<img src="${user.profile_image}" alt="${user.name}">`
        : `<div class="avatar-placeholder">${user.name.charAt(0)}</div>`;

    const actionsHtml = isSelf
        ? '<span class="text-muted">본인 계정</span>'
        : `
            <select class="role-select"
                onchange="changeUserRole('${user.id}', this.value, '${user.name}', this)">
                <option value="member" ${user.role === 'member' ? 'selected' : ''}>일반 회원</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>관리자</option>
                ${isSuperAdmin ? `<option value="super_admin" ${user.role === 'super_admin' ? 'selected' : ''}>총관리자</option>` : ''}
            </select>
            ${user.status === 'active'
                ? `<button class="btn btn-warning btn-sm"
                       onclick="suspendUser('${user.id}', '${user.name}')">⏸️ 정지</button>`
                : user.status === 'suspended'
                    ? `<button class="btn btn-success btn-sm"
                           onclick="activateUser('${user.id}', '${user.name}')">▶️ 복구</button>`
                    : ''
            }`;

    return `
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-info">
                <div class="user-avatar">${avatarHtml}</div>
                <div class="user-details">
                    <h3>
                        ${user.name}
                        ${statusBadge}
                        ${roleBadge}
                    </h3>
                    <p class="user-email">${user.email}</p>
                    <p class="user-meta">${user.phone ? `📞 ${user.phone}` : ''}</p>
                    <p class="user-date">가입일: ${formatAdminDate(user.created_at)}</p>
                </div>
            </div>
            <div class="user-actions">${actionsHtml}</div>
        </div>`;
}

async function changeUserRole(userId, newRole, userName, selectEl) {
    if (!confirm(`${userName} 님의 권한을 "${getRoleLabel(newRole)}"로 변경하시겠습니까?`)) {
        loadAllUsers();
        return;
    }
    try {
        const data = await apiClient.request(
            `/admin/members/${userId}/role`,
            { method: 'PATCH', body: JSON.stringify({ role: newRole }) }
        );
        if (!data.success) throw new Error(data.message);
        alert(`✅ ${userName} 님의 권한이 변경되었습니다.`);
    } catch (error) {
        alert(`❌ 권한 변경 실패: ${error.message}`);
        loadAllUsers();
    }
}

async function suspendUser(userId, userName) {
    if (!confirm(`${userName} 님을 정지하시겠습니까?`)) return;
    try {
        const data = await apiClient.request(
            `/admin/members/${userId}/suspend`,
            { method: 'PATCH' }
        );
        if (!data.success) throw new Error(data.message);
        alert(`✅ ${userName} 님이 정지되었습니다.`);
        loadAllUsers();
    } catch (error) {
        alert(`❌ 정지 처리 실패: ${error.message}`);
    }
}

async function activateUser(userId, userName) {
    if (!confirm(`${userName} 님을 복구하시겠습니까?`)) return;
    try {
        const data = await apiClient.request(
            `/admin/members/${userId}/activate`,
            { method: 'PATCH' }
        );
        if (!data.success) throw new Error(data.message);
        alert(`✅ ${userName} 님이 복구되었습니다.`);
        loadAllUsers();
    } catch (error) {
        alert(`❌ 복구 처리 실패: ${error.message}`);
    }
}

// ============================================
// 콘텐츠 관리 (게시글)
// ============================================

async function loadContentManagement() {
    const container = document.getElementById('content-management-list');
    container.innerHTML = '<div class="content-loading">로딩 중...</div>';

    try {
        const data = await apiClient.request('/admin/posts?limit=30');
        if (!data.success) throw new Error(data.message);

        if (data.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state"><p>게시글이 없습니다.</p></div>`;
            return;
        }

        container.innerHTML = `
            <div class="content-section">
                <h3>최근 게시글 (${data.posts.length}건)</h3>
                ${data.posts.map(post => renderPostManageCard(post)).join('')}
            </div>`;
    } catch (error) {
        console.error('콘텐츠 관리 로딩 실패:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p class="error-text">콘텐츠를 불러올 수 없습니다.</p>
            </div>`;
    }
}

function renderPostManageCard(post) {
    return `
        <div class="content-item" data-id="${post.id}">
            <div class="content-info">
                <h4>${post.title}</h4>
                <p class="content-meta">
                    작성자: ${post.author_name || '알 수 없음'} |
                    ${formatAdminDateTime(post.created_at)} |
                    조회 ${post.views || 0}
                    좋아요 ${post.likes_count || 0}
                    댓글 ${post.comments_count || 0}
                </p>
            </div>
            <div class="content-actions">
                <button class="btn btn-danger btn-sm"
                    onclick="deletePost('${post.id}', '${post.title.replace(/'/g, "\\'")}')">
                    🗑️ 삭제
                </button>
            </div>
        </div>`;
}

async function deletePost(postId, title) {
    if (!confirm(`"${title}" 게시글을 삭제하시겠습니까?`)) return;
    try {
        const data = await apiClient.request(
            `/admin/posts/${postId}`,
            { method: 'DELETE' }
        );
        if (!data.success) throw new Error(data.message);
        alert('✅ 게시글이 삭제되었습니다.');
        loadContentManagement();
        loadAdminStats();
    } catch (error) {
        alert(`❌ 삭제 실패: ${error.message}`);
    }
}

// ============================================
// 검색/필터 (전체 회원 탭)
// ============================================

function onAdminMemberSearch(value) {
    clearTimeout(allUsersSearchTimer);
    allUsersSearchTimer = setTimeout(() => {
        const statusFilter = document.getElementById('admin-status-filter')?.value || '';
        loadAllUsers(value, statusFilter);
    }, 300);
}

function onAdminStatusFilter(value) {
    const searchQuery = document.getElementById('admin-member-search')?.value || '';
    loadAllUsers(searchQuery, value);
}

// ============================================
// 뱃지 / 헬퍼
// ============================================

function getStatusBadge(status) {
    const map = {
        active: '<span class="badge badge-success">활성</span>',
        pending: '<span class="badge badge-warning">대기</span>',
        suspended: '<span class="badge badge-danger">정지</span>',
    };
    return map[status] || '';
}

function getRoleBadge(role) {
    const map = {
        super_admin: '<span class="badge badge-admin">총관리자</span>',
        admin: '<span class="badge badge-admin">관리자</span>',
        member: '<span class="badge badge-member">회원</span>',
        pending: '<span class="badge badge-pending">미승인</span>',
    };
    return map[role] || '';
}

function getRoleLabel(role) {
    const map = {
        super_admin: '총관리자',
        admin: '관리자',
        member: '일반 회원',
    };
    return map[role] || role;
}

function formatAdminDate(dateString) {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatAdminDateTime(dateString) {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${formatAdminDate(dateString)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

console.log('✅ Admin 모듈 로드 완료 (Railway API)');
