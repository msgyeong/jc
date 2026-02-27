// 영등포 JC 관리자 전용 웹

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

let authToken = localStorage.getItem('admin_token');
let searchTimer = null;

// ============================================
// 초기화
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        verifyTokenAndInit();
    } else {
        showLogin();
    }

    setupLoginForm();
    setupSidebarNav();
});

async function verifyTokenAndInit() {
    try {
        const data = await api('/auth/me');
        if (!data.user || !['admin', 'super_admin'].includes(data.user.role)) {
            alert('관리자 권한이 없습니다.');
            logout();
            return;
        }
        showApp(data.user);
    } catch {
        logout();
    }
}

// ============================================
// API 헬퍼
// ============================================

async function api(endpoint, options = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API 오류');
    return data;
}

// ============================================
// 로그인
// ============================================

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-app').style.display = 'none';
}

function showApp(user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-app').style.display = 'flex';
    document.getElementById('sidebar-user-name').textContent =
        `${user.name} (${user.role === 'super_admin' ? '총관리자' : '관리자'})`;
    switchPage('dashboard');
}

function setupLoginForm() {
    document.getElementById('login-form').addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errEl = document.getElementById('login-error');
        const btn = document.getElementById('login-btn');

        errEl.style.display = 'none';
        btn.disabled = true;
        btn.textContent = '로그인 중...';

        try {
            const data = await api('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            if (!['admin', 'super_admin'].includes(data.user?.role)) {
                throw new Error('관리자 권한이 없습니다.');
            }

            authToken = data.token;
            localStorage.setItem('admin_token', authToken);
            showApp(data.user);
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = '로그인';
        }
    });
}

function logout() {
    authToken = null;
    localStorage.removeItem('admin_token');
    showLogin();
}

// ============================================
// 페이지 전환
// ============================================

function setupSidebarNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });
}

function switchPage(page) {
    document.querySelectorAll('.nav-item').forEach(b =>
        b.classList.toggle('active', b.dataset.page === page)
    );
    document.querySelectorAll('.page').forEach(p =>
        p.classList.toggle('active', p.id === `page-${page}`)
    );

    switch (page) {
        case 'dashboard': loadStats(); break;
        case 'pending':   loadPending(); break;
        case 'members':   loadMembers(); break;
        case 'content':   loadContent(); break;
    }
}

// ============================================
// 대시보드 통계
// ============================================

async function loadStats() {
    try {
        const data = await api('/admin/stats');
        const s = data.stats;
        document.getElementById('stat-members').textContent = s.totalMembers;
        document.getElementById('stat-pending').textContent = s.pendingMembers;
        document.getElementById('stat-posts').textContent   = s.totalPosts;
        document.getElementById('stat-notices').textContent = s.totalNotices;

        const badge = document.getElementById('pending-badge');
        if (s.pendingMembers > 0) {
            badge.textContent = s.pendingMembers;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {
        console.error('통계 로드 실패:', e);
    }
}

// ============================================
// 승인 대기 회원
// ============================================

async function loadPending() {
    const el = document.getElementById('pending-list');
    el.innerHTML = '<div class="loading">로딩 중...</div>';
    try {
        const data = await api('/admin/members/pending');
        if (!data.members.length) {
            el.innerHTML = '<div class="empty">승인 대기 회원이 없습니다.</div>';
            return;
        }
        el.innerHTML = data.members.map(renderPendingCard).join('');
    } catch (e) {
        el.innerHTML = `<div class="empty">오류: ${e.message}</div>`;
    }
}

function renderPendingCard(u) {
    const avatar = u.profile_image
        ? `<img src="${u.profile_image}" alt="">`
        : u.name.charAt(0);
    return `
        <div class="user-card">
            <div class="user-avatar">${avatar}</div>
            <div class="user-info">
                <div class="user-name">${u.name}</div>
                <div class="user-email">${u.email}</div>
                <div class="user-meta">
                    ${u.phone ? `📞 ${u.phone}` : ''}
                    &nbsp; 신청일: ${fmtDate(u.created_at)}
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-success"
                    onclick="approveUser('${u.id}','${esc(u.name)}')">✅ 승인</button>
                <button class="btn btn-danger"
                    onclick="rejectUser('${u.id}','${esc(u.name)}')">❌ 거부</button>
            </div>
        </div>`;
}

async function approveUser(id, name) {
    if (!confirm(`${name} 님을 승인하시겠습니까?`)) return;
    try {
        await api(`/admin/members/${id}/approve`, { method: 'PATCH' });
        alert(`✅ ${name} 님이 승인되었습니다.`);
        loadPending();
        loadStats();
    } catch (e) { alert(`❌ ${e.message}`); }
}

async function rejectUser(id, name) {
    if (!confirm(`${name} 님의 가입을 거부하시겠습니까?`)) return;
    try {
        await api(`/admin/members/${id}/reject`, { method: 'DELETE' });
        alert(`✅ ${name} 님의 가입이 거부되었습니다.`);
        loadPending();
        loadStats();
    } catch (e) { alert(`❌ ${e.message}`); }
}

// ============================================
// 전체 회원 관리
// ============================================

async function loadMembers(search = '', status = '') {
    const el = document.getElementById('members-list');
    el.innerHTML = '<div class="loading">로딩 중...</div>';
    try {
        const params = new URLSearchParams({ limit: 50 });
        if (search) params.set('q', search);
        if (status) params.set('status', status);
        const data = await api(`/admin/members?${params}`);
        if (!data.members.length) {
            el.innerHTML = '<div class="empty">회원이 없습니다.</div>';
            return;
        }
        el.innerHTML = data.members.map(renderMemberCard).join('');
    } catch (e) {
        el.innerHTML = `<div class="empty">오류: ${e.message}</div>`;
    }
}

function renderMemberCard(u) {
    const avatar = u.profile_image
        ? `<img src="${u.profile_image}" alt="">`
        : u.name.charAt(0);
    const isSuperAdmin = localStorage.getItem('admin_token') &&
        document.getElementById('sidebar-user-name').textContent.includes('총관리자');

    return `
        <div class="user-card">
            <div class="user-avatar">${avatar}</div>
            <div class="user-info">
                <div class="user-name">
                    ${u.name}
                    <span class="tag ${statusTag(u.status)}">${statusLabel(u.status)}</span>
                    <span class="tag ${roleTag(u.role)}">${roleLabel(u.role)}</span>
                </div>
                <div class="user-email">${u.email}</div>
                <div class="user-meta">${u.phone ? `📞 ${u.phone}` : ''} &nbsp; 가입: ${fmtDate(u.created_at)}</div>
            </div>
            <div class="user-actions">
                <select class="role-select"
                    onchange="changeRole('${u.id}','${esc(u.name)}',this)">
                    <option value="member"      ${u.role==='member'?'selected':''}>일반 회원</option>
                    <option value="admin"       ${u.role==='admin'?'selected':''}>관리자</option>
                    ${isSuperAdmin ? `<option value="super_admin" ${u.role==='super_admin'?'selected':''}>총관리자</option>` : ''}
                </select>
                ${u.status === 'active'
                    ? `<button class="btn btn-warning"
                           onclick="suspendUser('${u.id}','${esc(u.name)}')">⏸️ 정지</button>`
                    : u.status === 'suspended'
                        ? `<button class="btn btn-success"
                               onclick="activateUser('${u.id}','${esc(u.name)}')">▶️ 복구</button>`
                        : ''}
            </div>
        </div>`;
}

function onMemberSearch(val) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        const status = document.getElementById('member-status-filter').value;
        loadMembers(val, status);
    }, 300);
}

function onStatusFilter(val) {
    const search = document.getElementById('member-search').value;
    loadMembers(search, val);
}

async function changeRole(id, name, selectEl) {
    const role = selectEl.value;
    if (!confirm(`${name} 님의 권한을 "${roleLabel(role)}"로 변경하시겠습니까?`)) {
        loadMembers(); return;
    }
    try {
        await api(`/admin/members/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        });
        alert(`✅ 권한이 변경되었습니다.`);
    } catch (e) { alert(`❌ ${e.message}`); loadMembers(); }
}

async function suspendUser(id, name) {
    if (!confirm(`${name} 님을 정지하시겠습니까?`)) return;
    try {
        await api(`/admin/members/${id}/suspend`, { method: 'PATCH' });
        alert(`✅ ${name} 님이 정지되었습니다.`);
        loadMembers();
    } catch (e) { alert(`❌ ${e.message}`); }
}

async function activateUser(id, name) {
    if (!confirm(`${name} 님을 복구하시겠습니까?`)) return;
    try {
        await api(`/admin/members/${id}/activate`, { method: 'PATCH' });
        alert(`✅ ${name} 님이 복구되었습니다.`);
        loadMembers();
    } catch (e) { alert(`❌ ${e.message}`); }
}

// ============================================
// 콘텐츠 관리
// ============================================

async function loadContent() {
    const el = document.getElementById('content-list');
    el.innerHTML = '<div class="loading">로딩 중...</div>';
    try {
        const data = await api('/admin/posts?limit=30');
        if (!data.posts.length) {
            el.innerHTML = '<div class="empty">게시글이 없습니다.</div>';
            return;
        }
        el.innerHTML = data.posts.map(renderContentCard).join('');
    } catch (e) {
        el.innerHTML = `<div class="empty">오류: ${e.message}</div>`;
    }
}

function renderContentCard(p) {
    return `
        <div class="content-card">
            <div class="content-card-header">
                <div class="content-title">${p.title}</div>
                <button class="btn btn-danger"
                    onclick="deletePost('${p.id}','${esc(p.title)}')">🗑️ 삭제</button>
            </div>
            <div class="content-meta">
                작성자: ${p.author_name || '-'} &nbsp;|&nbsp;
                ${fmtDateTime(p.created_at)} &nbsp;|&nbsp;
                👁️ ${p.views||0} &nbsp; 👍 ${p.likes_count||0} &nbsp; 💬 ${p.comments_count||0}
            </div>
        </div>`;
}

async function deletePost(id, title) {
    if (!confirm(`"${title}" 게시글을 삭제하시겠습니까?`)) return;
    try {
        await api(`/admin/posts/${id}`, { method: 'DELETE' });
        alert('✅ 게시글이 삭제되었습니다.');
        loadContent();
        loadStats();
    } catch (e) { alert(`❌ ${e.message}`); }
}

// ============================================
// 헬퍼
// ============================================

function statusTag(s)   { return { active:'tag-active', pending:'tag-pending', suspended:'tag-suspended' }[s] || ''; }
function statusLabel(s) { return { active:'활성', pending:'대기', suspended:'정지' }[s] || s; }
function roleTag(r)     { return { super_admin:'tag-admin', admin:'tag-admin', member:'tag-member' }[r] || ''; }
function roleLabel(r)   { return { super_admin:'총관리자', admin:'관리자', member:'일반 회원' }[r] || r; }
function esc(s)         { return String(s).replace(/'/g, "\\'"); }

function fmtDate(d) {
    if (!d) return '-';
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

function fmtDateTime(d) {
    if (!d) return '-';
    const dt = new Date(d);
    return `${fmtDate(d)} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}
