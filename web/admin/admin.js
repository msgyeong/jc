/**
 * 영등포 JC 관리자 콘솔
 * UI 설계 명세서 AW001 ~ AW009 기반 구현
 */

/* ======================================================
   설정 & 상수
   ====================================================== */
const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

const PAGE_TITLES = {
    approval:  '가입 승인',
    members:   '회원 목록',
    roles:     '직책/권한 관리',
    boards:    '게시판 관리',
    notices:   '공지사항 관리',
    schedules: '일정 관리',
    security:  '계정 보안',
};

const PERMS = ['notice_write', 'schedule_manage', 'board_delete'];

/* ======================================================
   전역 상태
   ====================================================== */
let currentUser   = null;   // 로그인 중인 관리자
let currentPage   = null;
let memberSearch  = '';
let searchTimer   = null;

// Drawer 상태
let activeMember  = null;   // AW004 회원 상세
let activePost    = null;   // AW006 게시글 상세

// 모달 상태
let editingNotice   = null; // null = 신규, object = 수정
let editingSchedule = null;

/* ======================================================
   초기화
   ====================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        verifyAndInit();
    } else {
        showLogin();
    }
    document.getElementById('login-form').addEventListener(
        'submit', onLoginSubmit,
    );
});

async function verifyAndInit() {
    try {
        const data = await request('/auth/me');
        const role = data.user?.role;
        if (!role || !['admin', 'super_admin'].includes(role)) {
            throw new Error('권한 없음');
        }
        currentUser = data.user;
        showApp();
    } catch {
        logout();
    }
}

/* ======================================================
   API 헬퍼
   ====================================================== */
async function request(endpoint, opts = {}) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
}

/* ======================================================
   AW001 · 로그인 / 로그아웃
   ====================================================== */
function showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app').hidden = true;
}

function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app').hidden = false;
    applyMenuVisibility();
    fillSidebarUser();
    const firstPage = isSuperAdmin()
        ? 'approval'
        : hasPerm('board_delete') ? 'boards'
        : hasPerm('notice_write') ? 'notices'
        : 'security';
    switchPage(firstPage);
}

async function onLoginSubmit(e) {
    e.preventDefault();
    const adminId  = document.getElementById('f-admin-id').value.trim();
    const password = document.getElementById('f-password').value;
    const errEl    = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');

    errEl.hidden = true;
    btn.disabled = true;
    btn.textContent = '로그인 중...';

    try {
        const data = await request('/admin/auth/login', {
            method: 'POST',
            body: JSON.stringify({ admin_id: adminId, password }),
        });
        const role = data.user?.role;
        if (!role || !['admin', 'super_admin'].includes(role)) {
            throw new Error('관리자 권한이 없습니다.');
        }
        localStorage.setItem('admin_token', data.token);
        currentUser = data.user;
        showApp();
    } catch (err) {
        errEl.textContent = err.message || '아이디 또는 비밀번호가 일치하지 않습니다.';
        errEl.hidden = false;
        document.getElementById('f-admin-id').focus();
    } finally {
        btn.disabled = false;
        btn.textContent = 'Login';
    }
}

function logout() {
    localStorage.removeItem('admin_token');
    currentUser = null;
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app').hidden = true;
    document.getElementById('f-password').value = '';
    document.getElementById('login-error').hidden = true;
}

/* ======================================================
   권한 헬퍼
   ====================================================== */
function isSuperAdmin() {
    return currentUser?.role === 'super_admin';
}

function hasPerm(perm) {
    if (isSuperAdmin()) return true;
    return currentUser?.permissions?.includes(perm);
}

function applyMenuVisibility() {
    document.querySelectorAll('.menu-item').forEach(btn => {
        const require = btn.dataset.require;
        if (!require) return;
        if (require === 'super_admin') {
            btn.hidden = !isSuperAdmin();
        } else {
            btn.hidden = !hasPerm(require);
        }
    });
}

function fillSidebarUser() {
    const u = currentUser;
    if (!u) return;
    const initials = (u.name || u.admin_id || 'A').charAt(0).toUpperCase();
    const avatar = document.getElementById('sidebar-avatar');
    if (u.profile_image) {
        avatar.innerHTML = `<img src="${u.profile_image}" alt="">`;
    } else {
        avatar.textContent = initials;
    }
    document.getElementById('sidebar-name').textContent = u.name || u.admin_id;
    document.getElementById('sidebar-role').textContent =
        u.role === 'super_admin' ? '최고 관리자' : '관리자';
}

/* ======================================================
   페이지 전환
   ====================================================== */
function switchPage(page) {
    currentPage = page;

    // 메뉴 active
    document.querySelectorAll('.menu-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });

    // 페이지 active
    document.querySelectorAll('.page').forEach(sec => {
        const isActive = sec.id === `page-${page}`;
        sec.hidden  = !isActive;
        sec.classList.toggle('active', isActive);
    });

    // 헤더 타이틀
    document.getElementById('header-title').textContent =
        PAGE_TITLES[page] || page;

    // 데이터 로드
    loadPageData(page);
}

function loadPageData(page) {
    switch (page) {
        case 'approval':   loadApproval();   break;
        case 'members':    loadMembers();     break;
        case 'roles':      loadRoles();       break;
        case 'boards':     loadBoards();      break;
        case 'notices':    loadNotices();     break;
        case 'schedules':  loadSchedules();   break;
        case 'security':   initSecurity();    break;
    }
}

function refreshCurrentPage() {
    if (currentPage) loadPageData(currentPage);
}

// 사이드바 메뉴 클릭 이벤트 등록
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.menu-item[data-page]').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.dataset.page));
    });
});

/* ======================================================
   AW002 · 가입 승인 목록
   ====================================================== */
async function loadApproval() {
    const list = document.getElementById('approval-list');
    list.innerHTML = loadingHtml();
    try {
        const data = await request('/admin/members/pending');
        const members = data.members || [];

        document.getElementById('approval-count').textContent =
            `대기 ${members.length}명`;

        // 사이드바 뱃지
        const badge = document.getElementById('badge-approval');
        badge.textContent = members.length;
        badge.hidden = members.length === 0;

        if (!members.length) {
            list.innerHTML = emptyHtml('승인 대기 중인 회원이 없습니다.');
            return;
        }

        list.innerHTML = members.map(m => `
            <div class="approval-card" id="approval-${m.id}">
                <div class="card-avatar">
                    ${m.profile_image
                        ? `<img src="${m.profile_image}" alt="">`
                        : esc(m.name).charAt(0)}
                </div>
                <div class="card-info">
                    <div class="card-name">${esc(m.name)}</div>
                    <div class="card-email">${esc(m.email)}</div>
                    <div class="card-meta">
                        ${m.phone ? `📞 ${esc(m.phone)} &nbsp;` : ''}
                        신청일: ${fmtDate(m.created_at)}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary btn-sm"
                        onclick="approveUser('${m.id}','${esc(m.name)}')">
                        ✅ 승인
                    </button>
                    <button class="btn btn-danger btn-sm"
                        onclick="rejectUser('${m.id}','${esc(m.name)}')">
                        ❌ 거부
                    </button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = errorHtml(e.message);
    }
}

async function approveUser(id, name) {
    confirm2(
        '가입 승인',
        `${name} 님의 가입을 승인하시겠습니까?`,
        '',
        async () => {
            await request(`/admin/members/${id}/approve`, { method: 'PATCH' });
            loadApproval();
        },
    );
}

async function rejectUser(id, name) {
    confirm2(
        '가입 거부',
        `${name} 님의 가입 요청을 거부하시겠습니까?`,
        '삭제된 데이터는 복구할 수 없습니다.',
        async () => {
            await request(`/admin/members/${id}/reject`, { method: 'DELETE' });
            loadApproval();
        },
    );
}

/* ======================================================
   AW003 · 회원 목록
   ====================================================== */
async function loadMembers() {
    const tbody = document.getElementById('members-tbody');
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">로딩 중...</td></tr>`;

    const q      = document.getElementById('member-q').value.trim();
    const status = document.getElementById('member-status').value;

    const params = new URLSearchParams({ limit: 50 });
    if (q)      params.set('q', q);
    if (status) params.set('status', status);

    try {
        const data = await request(`/admin/members?${params}`);
        const members = data.members || [];

        if (!members.length) {
            tbody.innerHTML =
                `<tr><td colspan="5" class="table-empty">회원이 없습니다.</td></tr>`;
            return;
        }

        tbody.innerHTML = members.map(m => `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div class="card-avatar" style="width:32px;height:32px;font-size:13px;">
                            ${m.profile_image
                                ? `<img src="${m.profile_image}" alt="">`
                                : esc(m.name).charAt(0)}
                        </div>
                        <span style="font-weight:500;">${esc(m.name)}</span>
                    </div>
                </td>
                <td>${esc(m.generation || '-')}</td>
                <td>${esc(m.department || '-')}</td>
                <td>
                    <span class="status-badge ${statusBadgeClass(m.status)}">
                        ${statusLabel(m.status)}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" title="상세 보기"
                        onclick="openMemberDrawer(${JSON.stringify(m).replace(/"/g, '&quot;')})">
                        〉
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML =
            `<tr><td colspan="5" class="table-empty">${esc(e.message)}</td></tr>`;
    }
}

function onMemberSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadMembers, 300);
}

/* ======================================================
   AW004 · 회원 상세 Drawer
   ====================================================== */
function openMemberDrawer(member) {
    activeMember = member;

    // 프로필
    const avatar = document.getElementById('drawer-avatar');
    if (member.profile_image) {
        avatar.innerHTML = `<img src="${member.profile_image}" alt="">`;
    } else {
        avatar.textContent = (member.name || '?').charAt(0).toUpperCase();
    }
    document.getElementById('drawer-name').textContent    = member.name;
    document.getElementById('drawer-sub').textContent     =
        [member.generation, member.department].filter(Boolean).join(' · ');
    document.getElementById('drawer-phone').textContent   = member.phone || '-';
    document.getElementById('drawer-joined').textContent  = fmtDate(member.created_at);
    document.getElementById('drawer-role-label').textContent =
        member.position || member.role_label || '-';

    // 상태 뱃지
    const statusBadge = document.getElementById('drawer-status-badge');
    statusBadge.textContent  = statusLabel(member.status);
    statusBadge.className    =
        `status-badge ${statusBadgeClass(member.status)}`;

    // suspend/activate 버튼
    const suspendBtn = document.getElementById('drawer-suspend-btn');
    if (member.status === 'suspended') {
        suspendBtn.textContent = '▶️ 복구';
        suspendBtn.className   = 'btn btn-primary';
    } else {
        suspendBtn.textContent = 'Suspend';
        suspendBtn.className   = 'btn btn-danger';
    }

    // Audit Log
    const logEl = document.getElementById('drawer-audit-log');
    const logs  = member.audit_logs || [];
    if (logs.length) {
        logEl.innerHTML = logs.map(l => `
            <div class="audit-entry">
                > updated_by: ${esc(l.updated_by || '-')}<br>
                > updated_at: ${fmtDateTime(l.updated_at)}<br>
                > changes: ${esc(l.changes || '-')}
            </div>
        `).join('');
    } else {
        logEl.innerHTML = '<div class="hint-text">변경 이력이 없습니다.</div>';
    }

    // Permissions
    const permEl = document.getElementById('drawer-permissions');
    permEl.innerHTML = PERMS.map(p => {
        const checked = (member.permissions || []).includes(p) ? 'checked' : '';
        return `
            <div class="perm-row">
                <input type="checkbox" id="perm-${p}" class="checkbox"
                    ${checked} ${!isSuperAdmin() ? 'disabled' : ''}>
                <label for="perm-${p}">${p}</label>
            </div>
        `;
    }).join('');

    openDrawer('member-drawer');
}

async function toggleMemberStatus() {
    if (!activeMember) return;
    const isSuspended = activeMember.status === 'suspended';
    const action  = isSuspended ? 'activate' : 'suspend';
    const label   = isSuspended ? '복구' : '정지';

    confirm2(
        `회원 ${label}`,
        `${activeMember.name} 님을 ${label}하시겠습니까?`,
        '',
        async () => {
            await request(`/admin/members/${activeMember.id}/${action}`, {
                method: 'PATCH',
            });
            closeDrawer('member-drawer');
            loadMembers();
        },
    );
}

async function saveMemberChanges() {
    if (!activeMember) return;
    const permissions = PERMS.filter(p =>
        document.getElementById(`perm-${p}`)?.checked,
    );
    try {
        await request(`/admin/members/${activeMember.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ permissions }),
        });
        closeDrawer('member-drawer');
        loadMembers();
    } catch (e) {
        alert(`저장 실패: ${e.message}`);
    }
}

/* ======================================================
   AW005 · 직책/권한 관리
   ====================================================== */
async function loadRoles() {
    const tbody = document.getElementById('roles-tbody');
    tbody.innerHTML =
        `<tr><td colspan="4" class="table-empty">로딩 중...</td></tr>`;
    try {
        const data = await request('/admin/roles');
        const roles = data.roles || [];

        if (!roles.length) {
            tbody.innerHTML =
                `<tr><td colspan="4" class="table-empty">역할 데이터가 없습니다.</td></tr>`;
            return;
        }

        tbody.innerHTML = roles.map(r => {
            const isSys = r.name === 'super_admin';
            return `
                <tr data-role-id="${r.id}">
                    <td style="font-weight:500;">
                        ${esc(r.display_name || r.name)}
                        ${isSys
                            ? '<span style="margin-left:6px;font-size:11px;color:#6B7280;">(시스템)</span>'
                            : ''}
                    </td>
                    ${PERMS.map(p => {
                        const has     = (r.permissions || []).includes(p);
                        const disable = isSys ? 'disabled class="perm-check-disabled"' : '';
                        return `
                            <td class="text-center">
                                <input type="checkbox" class="perm-check"
                                    data-role="${r.id}" data-perm="${p}"
                                    ${has ? 'checked' : ''}
                                    ${disable}
                                    style="width:18px;height:18px;
                                           accent-color:var(--c-primary);">
                            </td>`;
                    }).join('')}
                </tr>`;
        }).join('');
    } catch (e) {
        tbody.innerHTML =
            `<tr><td colspan="4" class="table-empty">${esc(e.message)}</td></tr>`;
    }
}

function saveRoles() {
    confirm2(
        '권한 변경 확인',
        '권한 설정을 변경하시겠습니까?',
        '변경 사항은 접속 중인 모든 관리자에게 즉시 반영됩니다.',
        async () => {
            const rows = {};
            document.querySelectorAll('#roles-tbody input[data-role]').forEach(el => {
                const roleId = el.dataset.role;
                const perm   = el.dataset.perm;
                if (!rows[roleId]) rows[roleId] = [];
                if (el.checked)    rows[roleId].push(perm);
            });

            const payload = Object.entries(rows).map(([id, permissions]) =>
                ({ id, permissions }),
            );

            await request('/admin/roles', {
                method: 'PUT',
                body: JSON.stringify({ roles: payload }),
            });
            loadRoles();
        },
    );
}

/* ======================================================
   AW006 · 게시판 관리
   ====================================================== */
async function loadBoards() {
    const tbody = document.getElementById('boards-tbody');
    tbody.innerHTML =
        `<tr><td colspan="5" class="table-empty">로딩 중...</td></tr>`;
    try {
        const data = await request('/admin/posts?limit=50');
        const posts = data.posts || [];

        document.getElementById('boards-total').textContent =
            `Total: ${data.total ?? posts.length}`;

        if (!posts.length) {
            tbody.innerHTML =
                `<tr><td colspan="5" class="table-empty">게시글이 없습니다.</td></tr>`;
            return;
        }

        tbody.innerHTML = posts.map(p => `
            <tr>
                <td style="max-width:320px;overflow:hidden;
                           text-overflow:ellipsis;white-space:nowrap;">
                    <a href="#" style="color:var(--c-text);text-decoration:none;
                       font-weight:500;"
                        onclick="openPostDrawer(${JSON.stringify(p)
                            .replace(/"/g, '&quot;')});return false;">
                        ${esc(p.title)}
                    </a>
                </td>
                <td>${esc(p.author_name || '-')}</td>
                <td>${fmtDate(p.created_at)}</td>
                <td class="text-center">${p.comments_count ?? 0}</td>
                <td>
                    <button class="btn-icon" title="상세"
                        onclick="openPostDrawer(${JSON.stringify(p)
                            .replace(/"/g, '&quot;')})">
                        〉
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML =
            `<tr><td colspan="5" class="table-empty">${esc(e.message)}</td></tr>`;
    }
}

/* ======================================================
   AW006 · 게시글 상세 Drawer
   ====================================================== */
async function openPostDrawer(post) {
    activePost = post;

    document.getElementById('post-drawer-title').textContent = post.title;
    document.getElementById('post-author').textContent = post.author_name || '-';
    document.getElementById('post-date').textContent   = fmtDate(post.created_at);
    document.getElementById('post-content').textContent = post.content || '';

    // 댓글 로드
    const commentsEl = document.getElementById('post-comments');
    const countEl    = document.getElementById('post-comment-count');
    commentsEl.innerHTML = '<div class="hint-text">로딩 중...</div>';

    try {
        const data = await request(`/admin/posts/${post.id}/comments`);
        const comments = data.comments || [];
        countEl.textContent = comments.length;

        if (!comments.length) {
            commentsEl.innerHTML = '<div class="hint-text">댓글이 없습니다.</div>';
        } else {
            commentsEl.innerHTML = comments.map(c => `
                <div class="comment-item" id="comment-${c.id}">
                    <div class="comment-body">
                        <div class="comment-author">${esc(c.author_name || '-')}</div>
                        <div class="comment-text">${esc(c.content)}</div>
                    </div>
                    <button class="btn btn-danger btn-sm"
                        onclick="deleteComment('${c.id}')">삭제</button>
                </div>
            `).join('');
        }
    } catch {
        commentsEl.innerHTML = '<div class="hint-text">댓글을 불러올 수 없습니다.</div>';
    }

    openDrawer('post-drawer');
}

function deleteCurrentPost() {
    if (!activePost) return;
    confirm2(
        '게시글 삭제',
        '게시글을 삭제하시겠습니까?',
        '삭제된 데이터는 복구할 수 없습니다. 계속하시겠습니까?',
        async () => {
            await request(`/admin/posts/${activePost.id}`, { method: 'DELETE' });
            closeDrawer('post-drawer');
            loadBoards();
        },
    );
}

async function deleteComment(commentId) {
    confirm2(
        '댓글 삭제',
        '이 댓글을 삭제하시겠습니까?',
        '',
        async () => {
            await request(`/admin/comments/${commentId}`, { method: 'DELETE' });
            document.getElementById(`comment-${commentId}`)?.remove();
            const countEl = document.getElementById('post-comment-count');
            countEl.textContent = Math.max(0, +countEl.textContent - 1);
        },
    );
}

/* ======================================================
   AW007 · 공지사항 관리
   ====================================================== */
async function loadNotices() {
    const tbody = document.getElementById('notices-tbody');
    tbody.innerHTML =
        `<tr><td colspan="4" class="table-empty">로딩 중...</td></tr>`;
    try {
        const data = await request('/admin/notices?limit=50');
        const notices = data.notices || [];

        if (!notices.length) {
            tbody.innerHTML =
                `<tr><td colspan="4" class="table-empty">공지사항이 없습니다.</td></tr>`;
            return;
        }

        tbody.innerHTML = notices.map(n => `
            <tr>
                <td style="font-weight:${n.pinned ? '600' : '400'};">
                    ${n.pinned
                        ? '<span style="color:var(--c-primary);margin-right:4px;">📌</span>'
                        : ''}
                    ${esc(n.title)}
                </td>
                <td>${fmtDate(n.created_at)}</td>
                <td class="text-center">${n.pinned ? '✓' : '-'}</td>
                <td>
                    <button class="btn btn-ghost btn-sm"
                        onclick='openNoticeModal(${JSON.stringify(n)
                            .replace(/'/g, "\\'")})'
                    >수정</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML =
            `<tr><td colspan="4" class="table-empty">${esc(e.message)}</td></tr>`;
    }
}

function openNoticeModal(notice = null) {
    editingNotice = notice;
    const isEdit  = !!notice;

    document.getElementById('notice-modal-title').textContent =
        isEdit ? '공지 수정' : '공지 추가';
    document.getElementById('n-title').value   = notice?.title   ?? '';
    document.getElementById('n-content').value = notice?.content ?? '';
    document.getElementById('n-pinned').checked = !!notice?.pinned;
    document.getElementById('notice-error').hidden = true;
    document.getElementById('notice-delete-btn').hidden = !isEdit;

    openModal('notice-modal');
}

async function saveNotice() {
    const title   = document.getElementById('n-title').value.trim();
    const content = document.getElementById('n-content').value.trim();
    const pinned  = document.getElementById('n-pinned').checked;
    const errEl   = document.getElementById('notice-error');

    if (!title || !content) {
        errEl.textContent = '제목과 내용을 모두 입력해 주세요.';
        errEl.hidden = false;
        return;
    }

    try {
        if (editingNotice) {
            await request(`/admin/notices/${editingNotice.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ title, content, pinned }),
            });
        } else {
            await request('/admin/notices', {
                method: 'POST',
                body: JSON.stringify({ title, content, pinned }),
            });
        }
        closeModal('notice-modal');
        loadNotices();
    } catch (e) {
        errEl.textContent = e.message;
        errEl.hidden = false;
    }
}

function deleteCurrentNotice() {
    if (!editingNotice) return;
    confirm2(
        '공지사항 삭제',
        `"${editingNotice.title}" 공지를 삭제하시겠습니까?`,
        '삭제된 데이터는 복구할 수 없습니다.',
        async () => {
            await request(`/admin/notices/${editingNotice.id}`, {
                method: 'DELETE',
            });
            closeModal('notice-modal');
            loadNotices();
        },
    );
}

/* ======================================================
   AW008 · 일정 관리
   ====================================================== */
async function loadSchedules() {
    const tbody = document.getElementById('schedules-tbody');
    tbody.innerHTML =
        `<tr><td colspan="4" class="table-empty">로딩 중...</td></tr>`;
    try {
        const data = await request('/admin/schedules?limit=50');
        const schedules = data.schedules || [];

        if (!schedules.length) {
            tbody.innerHTML =
                `<tr><td colspan="4" class="table-empty">일정이 없습니다.</td></tr>`;
            return;
        }

        tbody.innerHTML = schedules.map(s => `
            <tr>
                <td style="font-weight:500;">${esc(s.title)}</td>
                <td>${fmtDate(s.date)}${s.time ? ' ' + s.time.slice(0,5) : ''}</td>
                <td>${esc(s.location || '-')}</td>
                <td>
                    <button class="btn btn-ghost btn-sm"
                        onclick='openScheduleModal(${JSON.stringify(s)
                            .replace(/'/g, "\\'")})'>
                        수정
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML =
            `<tr><td colspan="4" class="table-empty">${esc(e.message)}</td></tr>`;
    }
}

function openScheduleModal(schedule = null) {
    editingSchedule = schedule;
    const isEdit    = !!schedule;

    document.getElementById('schedule-modal-title').textContent =
        isEdit ? '일정 수정' : '일정 추가';
    document.getElementById('s-title').value    = schedule?.title    ?? '';
    document.getElementById('s-date').value     = schedule?.date     ?? '';
    document.getElementById('s-time').value     = schedule?.time?.slice(0,5) ?? '';
    document.getElementById('s-location').value = schedule?.location ?? '';
    document.getElementById('s-desc').value     = schedule?.desc     ?? '';
    document.getElementById('schedule-error').hidden = true;
    document.getElementById('schedule-delete-btn').hidden = !isEdit;

    openModal('schedule-modal');
}

async function saveSchedule() {
    const title    = document.getElementById('s-title').value.trim();
    const date     = document.getElementById('s-date').value;
    const time     = document.getElementById('s-time').value;
    const location = document.getElementById('s-location').value.trim();
    const desc     = document.getElementById('s-desc').value.trim();
    const errEl    = document.getElementById('schedule-error');

    if (!title || !date) {
        errEl.textContent = '제목과 날짜는 필수 입력입니다.';
        errEl.hidden = false;
        return;
    }

    const body = { title, date, time: time || null, location, desc };

    try {
        if (editingSchedule) {
            await request(`/admin/schedules/${editingSchedule.id}`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });
        } else {
            await request('/admin/schedules', {
                method: 'POST',
                body: JSON.stringify(body),
            });
        }
        closeModal('schedule-modal');
        loadSchedules();
    } catch (e) {
        errEl.textContent = e.message;
        errEl.hidden = false;
    }
}

function deleteCurrentSchedule() {
    if (!editingSchedule) return;
    confirm2(
        '일정 삭제',
        `"${editingSchedule.title}" 일정을 삭제하시겠습니까?`,
        '삭제된 데이터는 복구할 수 없습니다.',
        async () => {
            await request(`/admin/schedules/${editingSchedule.id}`, {
                method: 'DELETE',
            });
            closeModal('schedule-modal');
            loadSchedules();
        },
    );
}

/* ======================================================
   AW009 · 계정 보안
   ====================================================== */
function initSecurity() {
    document.getElementById('pw-form').onsubmit = changePassword;
    document.getElementById('pw-error').hidden   = true;
    document.getElementById('pw-success').hidden  = true;
}

async function changePassword(e) {
    e.preventDefault();
    const cur     = document.getElementById('f-cur-pw').value;
    const newPw   = document.getElementById('f-new-pw').value;
    const confirm = document.getElementById('f-confirm-pw').value;
    const errEl   = document.getElementById('pw-error');
    const okEl    = document.getElementById('pw-success');

    errEl.hidden = true;
    okEl.hidden  = true;

    if (newPw !== confirm) {
        errEl.textContent = '새 비밀번호가 일치하지 않습니다.';
        errEl.hidden = false;
        return;
    }
    if (!validatePassword(newPw)) {
        errEl.textContent =
            '비밀번호는 10자 이상, 영문·숫자·특수문자를 포함해야 합니다.';
        errEl.hidden = false;
        return;
    }

    const btn = e.submitter;
    btn.disabled = true;
    btn.textContent = '변경 중...';

    try {
        await request('/admin/account/password', {
            method: 'PATCH',
            body: JSON.stringify({
                current_password: cur,
                new_password: newPw,
            }),
        });
        okEl.textContent = '비밀번호가 변경되었습니다. 보안을 위해 재로그인합니다.';
        okEl.hidden = false;
        document.getElementById('pw-form').reset();
        setTimeout(logout, 2000);
    } catch (err) {
        errEl.textContent = err.message;
        errEl.hidden = false;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Change Password';
    }
}

function validatePassword(pw) {
    return pw.length >= 10
        && /[a-zA-Z]/.test(pw)
        && /[0-9]/.test(pw)
        && /[^a-zA-Z0-9]/.test(pw);
}

/* ======================================================
   Drawer 제어
   ====================================================== */
function openDrawer(id) {
    document.getElementById(id).hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeDrawer(id) {
    document.getElementById(id).hidden = true;
    document.body.style.overflow = '';
}

/* ======================================================
   Modal 제어
   ====================================================== */
function openModal(id) {
    document.getElementById(id).hidden = false;
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).hidden = true;
    document.body.style.overflow = '';
}

/* ======================================================
   확인 다이얼로그
   ====================================================== */
function confirm2(title, message, sub, onConfirm) {
    document.getElementById('confirm-title').textContent   = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-sub').textContent     = sub || '';
    document.getElementById('confirm-sub').hidden          = !sub;

    const okBtn = document.getElementById('confirm-ok-btn');
    // 이전 핸들러 제거 후 새로 등록
    const newBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newBtn, okBtn);
    newBtn.addEventListener('click', async () => {
        newBtn.disabled = true;
        newBtn.textContent = '처리 중...';
        try {
            await onConfirm();
        } catch (e) {
            alert(`오류: ${e.message}`);
        } finally {
            closeModal('confirm-dialog');
            newBtn.disabled = false;
            newBtn.textContent = '확인';
        }
    });

    openModal('confirm-dialog');
}

/* ======================================================
   유틸리티
   ====================================================== */
function statusBadgeClass(s) {
    return { active: 'badge-active', pending: 'badge-pending',
             suspended: 'badge-suspended' }[s] || '';
}

function statusLabel(s) {
    return { active: 'Active', pending: 'Pending', suspended: 'Suspended' }[s] || s;
}

function fmtDate(d) {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    const y  = dt.getFullYear();
    const m  = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

function fmtDateTime(d) {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    const h  = String(dt.getHours()).padStart(2, '0');
    const mi = String(dt.getMinutes()).padStart(2, '0');
    return `${fmtDate(d)} ${h}:${mi}`;
}

function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function loadingHtml() {
    return '<div class="loading-state">⏳ 로딩 중...</div>';
}

function emptyHtml(msg) {
    return `<div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div>${esc(msg)}</div>
    </div>`;
}

function errorHtml(msg) {
    return `<div class="empty-state" style="color:var(--c-danger);">
        <div class="empty-state-icon">⚠️</div>
        <div>${esc(msg)}</div>
    </div>`;
}
