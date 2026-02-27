// 관리자 페이지 (Railway API 연동)

function initAdminPage() {
    console.log('🔧 관리자 페이지 초기화...');

    if (!checkAdminPermission()) {
        alert('관리자 권한이 없습니다.');
        navigateToScreen('home');
        return;
    }

    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchAdminTab(tab.dataset.tab);
        });
    });

    switchAdminTab('pending-users');
}

function checkAdminPermission() {
    const user = JSON.parse(localStorage.getItem('user_info') || 'null');
    return user && ['super_admin', 'admin'].includes(user.role);
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

    const tab = document.querySelector(`[data-tab="${tabName}"]`);
    if (tab) tab.classList.add('active');
    const content = document.getElementById(`${tabName}-tab`);
    if (content) content.classList.add('active');

    switch (tabName) {
        case 'pending-users': loadPendingUsers(); break;
        case 'all-users': loadAllUsers(); break;
        case 'content-management': loadContentManagement(); break;
    }
}

// ============================================
// 승인 대기 회원
// ============================================

async function loadPendingUsers() {
    const container = document.getElementById('pending-users-list');
    container.innerHTML = '<div class="loading">불러오는 중...</div>';

    try {
        const result = await apiClient.request('/admin/pending');
        if (!result.success) throw new Error(result.message);
        renderPendingUsers(result.users);
    } catch (error) {
        console.error('승인 대기 로딩 실패:', error);
        container.innerHTML = `<div class="empty-state"><p>불러오기 실패: ${error.message}</p></div>`;
    }
}

function renderPendingUsers(users) {
    const container = document.getElementById('pending-users-list');

    if (!users || users.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>승인 대기 중인 회원이 없습니다. 🎉</p></div>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-card" id="pending-card-${user.id}">
            <div class="user-info">
                <div class="avatar-placeholder" style="width:48px;height:48px;border-radius:50%;background:#e3e8ff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;color:#4f6ef7;flex-shrink:0;">
                    ${user.name.charAt(0)}
                </div>
                <div class="user-details" style="flex:1;margin-left:12px;">
                    <h3 style="margin:0 0 4px;">${user.name}</h3>
                    <p style="margin:0;color:#666;font-size:13px;">📧 ${user.email}</p>
                    ${user.phone ? `<p style="margin:2px 0;color:#666;font-size:13px;">📞 ${user.phone}</p>` : ''}
                    ${user.company ? `<p style="margin:2px 0;color:#666;font-size:13px;">🏢 ${user.company} ${user.position || ''}</p>` : ''}
                    ${user.special_notes ? `<p style="margin:4px 0;color:#888;font-size:12px;">💬 ${user.special_notes}</p>` : ''}
                    <p style="margin:4px 0;color:#999;font-size:12px;">신청일: ${formatDateTime(user.created_at)}</p>
                </div>
            </div>
            <div class="user-actions" style="display:flex;gap:8px;margin-top:12px;">
                <button class="btn btn-primary" style="flex:1;" onclick="approveUser(${user.id}, '${user.name}')">
                    ✅ 승인
                </button>
                <button class="btn" style="flex:1;background:#fff0f0;color:#e53e3e;border:1px solid #fed7d7;" onclick="rejectUser(${user.id}, '${user.name}')">
                    ❌ 거부
                </button>
            </div>
        </div>
    `).join('');
}

async function approveUser(userId, userName) {
    if (!confirm(`${userName} 님을 승인하시겠습니까?`)) return;
    try {
        const result = await apiClient.request(`/admin/approve/${userId}`, { method: 'PUT' });
        if (!result.success) throw new Error(result.message);
        const card = document.getElementById(`pending-card-${userId}`);
        if (card) card.remove();
        alert(`✅ ${userName} 님이 승인되었습니다.`);
        if (!document.querySelector('.user-card')) loadPendingUsers();
    } catch (error) {
        alert('❌ 오류: ' + error.message);
    }
}

async function rejectUser(userId, userName) {
    if (!confirm(`${userName} 님의 가입을 거부하시겠습니까?\n계정이 삭제됩니다.`)) return;
    try {
        const result = await apiClient.request(`/admin/reject/${userId}`, { method: 'DELETE' });
        if (!result.success) throw new Error(result.message);
        const card = document.getElementById(`pending-card-${userId}`);
        if (card) card.remove();
        alert(`✅ ${userName} 님이 거부되었습니다.`);
        if (!document.querySelector('.user-card')) loadPendingUsers();
    } catch (error) {
        alert('❌ 오류: ' + error.message);
    }
}

// ============================================
// 전체 회원 관리
// ============================================

async function loadAllUsers() {
    const container = document.getElementById('all-users-list');
    container.innerHTML = '<div class="loading">불러오는 중...</div>';

    try {
        const result = await apiClient.request('/admin/users');
        if (!result.success) throw new Error(result.message);
        renderAllUsers(result.users);
    } catch (error) {
        console.error('전체 회원 로딩 실패:', error);
        container.innerHTML = `<div class="empty-state"><p>불러오기 실패: ${error.message}</p></div>`;
    }
}

function renderAllUsers(users) {
    const container = document.getElementById('all-users-list');
    const me = JSON.parse(localStorage.getItem('user_info') || 'null');
    const isSuperAdmin = me?.role === 'super_admin';

    if (!users || users.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>등록된 회원이 없습니다.</p></div>';
        return;
    }

    container.innerHTML = users.map(user => {
        const isMe = user.id === me?.id;
        const statusBadge = {
            active: '<span style="background:#c6f6d5;color:#276749;padding:2px 8px;border-radius:10px;font-size:11px;">활성</span>',
            pending: '<span style="background:#fefcbf;color:#744210;padding:2px 8px;border-radius:10px;font-size:11px;">대기</span>',
            suspended: '<span style="background:#fed7d7;color:#822727;padding:2px 8px;border-radius:10px;font-size:11px;">정지</span>'
        }[user.status] || '';

        const roleBadge = {
            super_admin: '<span style="background:#e9d8fd;color:#553c9a;padding:2px 8px;border-radius:10px;font-size:11px;">총관리자</span>',
            admin: '<span style="background:#bee3f8;color:#2a4365;padding:2px 8px;border-radius:10px;font-size:11px;">관리자</span>',
            member: ''
        }[user.role] || '';

        return `
        <div class="user-card" id="user-card-${user.id}">
            <div class="user-info">
                <div class="avatar-placeholder" style="width:44px;height:44px;border-radius:50%;background:#e3e8ff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;color:#4f6ef7;flex-shrink:0;">
                    ${user.name.charAt(0)}
                </div>
                <div class="user-details" style="flex:1;margin-left:12px;">
                    <h3 style="margin:0 0 4px;">${user.name} ${statusBadge} ${roleBadge}</h3>
                    <p style="margin:0;color:#666;font-size:13px;">📧 ${user.email}</p>
                    ${user.phone ? `<p style="margin:2px 0;color:#666;font-size:13px;">📞 ${user.phone}</p>` : ''}
                    <p style="margin:4px 0;color:#999;font-size:12px;">가입일: ${formatDateTime(user.created_at)}</p>
                </div>
            </div>
            ${!isMe ? `
            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
                <select onchange="changeUserRole(${user.id}, this.value, '${user.name}')" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:8px;font-size:13px;">
                    <option value="member" ${user.role === 'member' ? 'selected' : ''}>일반 회원</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>관리자</option>
                    ${isSuperAdmin ? `<option value="super_admin" ${user.role === 'super_admin' ? 'selected' : ''}>총관리자</option>` : ''}
                </select>
                ${user.status === 'active' ? `
                    <button class="btn" style="background:#fff0f0;color:#e53e3e;border:1px solid #fed7d7;" onclick="changeUserStatus(${user.id}, 'suspended', '${user.name}')">⏸ 정지</button>
                ` : user.status === 'suspended' ? `
                    <button class="btn btn-primary" onclick="changeUserStatus(${user.id}, 'active', '${user.name}')">▶ 복구</button>
                ` : ''}
            </div>
            ` : '<p style="color:#999;font-size:13px;margin-top:8px;">본인 계정</p>'}
        </div>`;
    }).join('');
}

async function changeUserRole(userId, role, userName) {
    try {
        const result = await apiClient.request(`/admin/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        });
        if (!result.success) throw new Error(result.message);
        alert(`✅ ${userName} 님의 역할이 변경되었습니다.`);
    } catch (error) {
        alert('❌ 오류: ' + error.message);
        loadAllUsers();
    }
}

async function changeUserStatus(userId, status, userName) {
    const action = status === 'suspended' ? '정지' : '복구';
    if (!confirm(`${userName} 님을 ${action}하시겠습니까?`)) return loadAllUsers();
    try {
        const result = await apiClient.request(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        if (!result.success) throw new Error(result.message);
        alert(`✅ ${result.message}`);
        loadAllUsers();
    } catch (error) {
        alert('❌ 오류: ' + error.message);
    }
}

// ============================================
// 콘텐츠 관리 (기본 안내)
// ============================================

function loadContentManagement() {
    const container = document.getElementById('content-management-list');
    container.innerHTML = `
        <div class="empty-state">
            <p>📋 콘텐츠 관리 기능은 준비 중입니다.</p>
        </div>
    `;
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

console.log('✅ Admin 모듈 로드 완료 (Railway API)');
