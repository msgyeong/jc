/* ================================================
   영등포 JC — 관리자 SPA 코어
   라우팅 · 인증 · API 클라이언트 · 공통 유틸
   ================================================ */

/* ---------- API Client ---------- */
const AdminAPI = (() => {
    const BASE = location.origin;

    function getToken() {
        return localStorage.getItem('admin_token');
    }
    function setToken(t) {
        localStorage.setItem('admin_token', t);
    }
    function clearToken() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
    }
    function getUser() {
        try { return JSON.parse(localStorage.getItem('admin_user')); }
        catch { return null; }
    }
    function setUser(u) {
        localStorage.setItem('admin_user', JSON.stringify(u));
    }

    async function request(method, path, body) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        const token = getToken();
        if (token) opts.headers['Authorization'] = 'Bearer ' + token;
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(BASE + path, opts);
        const data = await res.json().catch(() => ({}));

        if (res.status === 401 || res.status === 403) {
            clearToken();
            showLogin();
            throw new Error(data.message || '인증 오류');
        }
        if (!res.ok) throw new Error(data.message || '요청 실패');
        return data;
    }

    return {
        getToken, setToken, clearToken, getUser, setUser,
        get:    (p)    => request('GET', p),
        post:   (p, b) => request('POST', p, b),
        put:    (p, b) => request('PUT', p, b),
        delete: (p)    => request('DELETE', p),
    };
})();

/* ---------- Login / Logout ---------- */
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';
    btn.disabled = true;

    try {
        const admin_id = document.getElementById('admin-id').value.trim();
        const password = document.getElementById('admin-pw').value;
        if (!admin_id || !password) {
            errEl.textContent = '이메일과 비밀번호를 입력하세요.';
            return;
        }

        const res = await AdminAPI.post('/api/admin/auth/login', { admin_id, password });
        if (res.success) {
            AdminAPI.setToken(res.token);
            AdminAPI.setUser(res.user);
            enterApp();
        } else {
            errEl.textContent = res.message || '로그인 실패';
        }
    } catch (err) {
        errEl.textContent = err.message || '로그인 중 오류가 발생했습니다.';
    } finally {
        btn.disabled = false;
    }
}

function adminLogout() {
    AdminAPI.clearToken();
    showLogin();
}

function showLogin() {
    document.getElementById('login-page').style.display = '';
    document.getElementById('main-layout').style.display = 'none';
    document.getElementById('admin-login-form').reset();
    document.getElementById('login-error').textContent = '';
}

function enterApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-layout').style.display = 'flex';

    const user = AdminAPI.getUser();
    if (user) {
        const nameEl = document.getElementById('sidebar-user-name');
        const avatarEl = document.getElementById('sidebar-avatar');
        const headerUser = document.getElementById('header-user');
        if (nameEl) nameEl.textContent = user.name || '관리자';
        if (avatarEl) avatarEl.textContent = (user.name || 'A').charAt(0);
        if (headerUser) headerUser.textContent = user.name || '관리자';
    }

    routeFromHash();
}

/* ---------- SPA Router ---------- */
const PAGE_TITLES = {
    dashboard: '대시보드',
    members: '회원 관리',
    posts: '게시판 관리',
};

const PAGE_RENDERERS = {
    dashboard: typeof renderDashboard === 'function' ? renderDashboard : null,
    members: typeof renderMembers === 'function' ? renderMembers : null,
    posts: typeof renderPosts === 'function' ? renderPosts : null,
};

function routeFromHash() {
    const hash = location.hash.replace('#', '') || 'dashboard';
    const page = PAGE_TITLES[hash] ? hash : 'dashboard';
    navigateAdmin(page, false);
}

function navigateAdmin(page, pushHash) {
    if (pushHash !== false) location.hash = '#' + page;

    // Update sidebar active
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(el => {
        el.classList.toggle('active', el.dataset.page === page);
    });

    // Update header title
    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;

    // Render page content
    const main = document.getElementById('main-content');
    main.innerHTML = '';

    const renderer = PAGE_RENDERERS[page];
    if (renderer) {
        renderer(main);
    } else {
        main.innerHTML = '<div class="table-empty"><p>준비 중인 페이지입니다.</p></div>';
    }

    // Close mobile sidebar
    closeSidebar();
}

window.addEventListener('hashchange', () => {
    if (AdminAPI.getToken()) routeFromHash();
});

/* ---------- Sidebar Nav ---------- */
document.addEventListener('click', e => {
    const link = e.target.closest('.sidebar-nav .nav-link');
    if (!link || link.classList.contains('disabled')) return;
    e.preventDefault();
    const page = link.dataset.page;
    if (page) navigateAdmin(page);
});

/* ---------- Mobile Sidebar Toggle ---------- */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = closeSidebar;
        document.body.appendChild(overlay);
    }
    overlay.classList.toggle('visible', sidebar.classList.contains('open'));
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('open');
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) overlay.classList.remove('visible');
}

document.getElementById('menu-toggle').addEventListener('click', toggleSidebar);

/* ---------- Modal ---------- */
function openModal(html) {
    const overlay = document.getElementById('modal-overlay');
    overlay.innerHTML = html;
    overlay.style.display = 'flex';
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.style.display = 'none';
    overlay.innerHTML = '';
}

/* ---------- Toast ---------- */
function showAdminToast(message, type) {
    type = type || 'success';
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'admin-toast ' + type;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

/* ---------- Utility ---------- */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return formatDate(dateStr) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function statusBadge(status) {
    const map = {
        active: '<span class="badge badge-active">활동</span>',
        pending: '<span class="badge badge-pending">대기</span>',
        suspended: '<span class="badge badge-suspended">정지</span>',
        withdrawn: '<span class="badge badge-suspended">탈퇴</span>',
    };
    return map[status] || '<span class="badge">' + escapeHtml(status) + '</span>';
}

function roleBadge(role) {
    if (role === 'super_admin') return '<span class="badge badge-admin">슈퍼관리자</span>';
    if (role === 'admin') return '<span class="badge badge-admin">관리자</span>';
    return '<span class="badge badge-general">회원</span>';
}

function categoryBadge(cat) {
    if (cat === 'notice') return '<span class="badge badge-notice">공지</span>';
    return '<span class="badge badge-general">일반</span>';
}

function renderPagination(container, currentPage, totalPages, onPageChange) {
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = '<div class="pagination">';
    html += '<button ' + (currentPage <= 1 ? 'disabled' : '') + ' data-page="' + (currentPage - 1) + '">&laquo;</button>';

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) {
        html += '<button class="' + (i === currentPage ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }

    html += '<button ' + (currentPage >= totalPages ? 'disabled' : '') + ' data-page="' + (currentPage + 1) + '">&raquo;</button>';
    html += '</div>';
    container.innerHTML = html;
    container.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = parseInt(btn.dataset.page);
            if (p >= 1 && p <= totalPages) onPageChange(p);
        });
    });
}

/* ---------- Skeleton Loader ---------- */
function showTableSkeleton(container, cols) {
    cols = cols || 5;
    let html = '<div class="table-wrap">';
    for (let r = 0; r < 5; r++) {
        html += '<div class="skeleton-row">';
        for (let c = 0; c < cols; c++) {
            const w = 40 + Math.random() * 120;
            html += '<div class="skeleton skeleton-cell" style="width:' + w + 'px"></div>';
        }
        html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

/* ---------- Init ---------- */
(function init() {
    // Bind renderers after scripts load
    PAGE_RENDERERS.dashboard = typeof renderDashboard === 'function' ? renderDashboard : null;
    PAGE_RENDERERS.members = typeof renderMembers === 'function' ? renderMembers : null;
    PAGE_RENDERERS.posts = typeof renderPosts === 'function' ? renderPosts : null;

    document.getElementById('admin-login-form').addEventListener('submit', handleLogin);

    if (AdminAPI.getToken()) {
        enterApp();
    } else {
        showLogin();
    }
})();
