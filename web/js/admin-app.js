// 앱 관리 기능 — 권한 로드 + 관리 허브 + 회원 승인 + 공지/게시글/일정 관리 + 푸시

// ══════════════════════════════════════
// B-1: 권한 로드 및 헬퍼
// ══════════════════════════════════════

window.__mobilePermissions = null;
window.__hasAnyPermission = false;

async function loadMyPermissions() {
    try {
        const res = await apiClient.request('/auth/my-permissions');
        if (res.success && res.data) {
            window.__mobilePermissions = res.data.mobile_permissions;
            window.__hasAnyPermission = res.data.has_any_permission;
        }
    } catch (err) {
        console.error('권한 로드 실패:', err);
        window.__mobilePermissions = null;
        window.__hasAnyPermission = false;
    }
}

function hasMobilePermission(permission) {
    return window.__mobilePermissions && window.__mobilePermissions[permission] === true;
}

// ══════════════════════════════════════
// B-2: 프로필 화면에 관리 메뉴 삽입
// ══════════════════════════════════════

function renderAdminMenuInProfile() {
    var existing = document.getElementById('profile-admin-section');
    if (existing) existing.remove();

    if (!window.__hasAnyPermission) return;

    var settingsGroups = document.querySelectorAll('#profile-content .settings-group');
    if (settingsGroups.length === 0) return;

    var section = document.createElement('div');
    section.id = 'profile-admin-section';
    section.className = 'settings-group admin-menu-group';
    section.innerHTML = '<div class="settings-group-title admin-section-title">'
        + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
        + ' 관리'
        + '</div>'
        + '<div class="settings-item" onclick="showAdminHub()">'
        + '<span class="settings-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>'
        + '<span class="settings-item-label">앱 관리</span>'
        + '<span class="settings-item-chevron"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></span>'
        + '</div>';

    settingsGroups[0].after(section);
}

// ══════════════════════════════════════
// 관리 허브 화면
// ══════════════════════════════════════

function showAdminHub() {
    var screen = document.getElementById('admin-hub-screen');
    if (!screen) return;
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    screen.classList.add('active');
    removeFloatingDeleteBar();
    renderAdminHubContent();
    pushRoute('admin-hub');
}

function renderAdminHubContent() {
    var container = document.getElementById('admin-hub-content');
    if (!container) return;

    var chevron = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
    var html = '';

    if (hasMobilePermission('member_approve')) {
        html += '<div class="admin-hub-card" onclick="showPendingMembersScreen()">'
            + '<div class="admin-hub-card-icon" style="background:var(--success-bg);color:#059669">'
            + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>'
            + '</div>'
            + '<div class="admin-hub-card-body">'
            + '<div class="admin-hub-card-title">회원 승인 대기<span class="admin-hub-badge" id="pending-count-badge"></span></div>'
            + '<div class="admin-hub-card-desc">승인 대기 중인 회원 목록</div>'
            + '</div>' + chevron + '</div>';
        loadPendingCount();
    }

    if (hasMobilePermission('notice_manage')) {
        html += '<div class="admin-hub-card" onclick="showNoticeManageScreen()">'
            + '<div class="admin-hub-card-icon" style="background:var(--warning-bg);color:var(--warning-text)">'
            + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
            + '</div>'
            + '<div class="admin-hub-card-body">'
            + '<div class="admin-hub-card-title">공지 관리</div>'
            + '<div class="admin-hub-card-desc">공지 작성/수정/삭제</div>'
            + '</div>' + chevron + '</div>';
    }

    if (hasMobilePermission('post_manage')) {
        html += '<div class="admin-hub-card" onclick="showPostManageScreen()">'
            + '<div class="admin-hub-card-icon" style="background:#EDE9FE;color:#7C3AED">'
            + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
            + '</div>'
            + '<div class="admin-hub-card-body">'
            + '<div class="admin-hub-card-title">게시글 관리</div>'
            + '<div class="admin-hub-card-desc">게시글 일괄 삭제</div>'
            + '</div>' + chevron + '</div>';
    }

    if (hasMobilePermission('schedule_manage')) {
        html += '<div class="admin-hub-card" onclick="showScheduleManageScreen()">'
            + '<div class="admin-hub-card-icon" style="background:var(--success-bg);color:#059669">'
            + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
            + '</div>'
            + '<div class="admin-hub-card-body">'
            + '<div class="admin-hub-card-title">일정 관리</div>'
            + '<div class="admin-hub-card-desc">일정 일괄 삭제</div>'
            + '</div>' + chevron + '</div>';
    }

    if (hasMobilePermission('push_send')) {
        html += '<div class="admin-hub-card" onclick="showPushSendScreen()">'
            + '<div class="admin-hub-card-icon" style="background:var(--error-bg);color:var(--error-color)">'
            + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
            + '</div>'
            + '<div class="admin-hub-card-body">'
            + '<div class="admin-hub-card-title">긴급 푸시 발송</div>'
            + '<div class="admin-hub-card-desc">즉시 전체/선택 알림 발송</div>'
            + '</div>' + chevron + '</div>';
    }

    // super_admin 전용: 전체 초기화 버튼
    var userInfo = typeof currentUser !== 'undefined' ? currentUser : JSON.parse(localStorage.getItem('user_info') || 'null');
    if (userInfo && userInfo.role === 'super_admin') {
        html += '<div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-color)">'
            + '<div class="admin-hub-card" onclick="confirmResetData()" style="border-color:var(--error-color)">'
            + '<div class="admin-hub-card-icon" style="background:var(--error-bg);color:var(--error-color)">'
            + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>'
            + '</div>'
            + '<div class="admin-hub-card-body">'
            + '<div class="admin-hub-card-title" style="color:var(--error-color)">전체 데이터 초기화</div>'
            + '<div class="admin-hub-card-desc">관리자 3명 제외 모든 회원/게시글/일정 삭제</div>'
            + '</div>' + chevron + '</div></div>';
    }

    if (!html) {
        html = '<div class="admin-hub-empty">관리 권한이 없습니다.</div>';
    }

    container.innerHTML = html;
}

async function loadPendingCount() {
    try {
        var res = await apiClient.request('/mobile-admin/pending-members');
        if (res.success && res.data) {
            var badge = document.getElementById('pending-count-badge');
            if (badge && res.data.total > 0) {
                badge.textContent = res.data.total;
                badge.style.display = 'inline-flex';
            }
        }
    } catch (_) {}
}

// ══════════════════════════════════════
// B-3: 회원가입 승인 화면
// ══════════════════════════════════════

function showPendingMembersScreen() {
    var screen = document.getElementById('pending-members-screen');
    if (!screen) return;
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    screen.classList.add('active');
    loadPendingMembers();
    pushRoute('pending-members');
}

async function loadPendingMembers() {
    var container = document.getElementById('pending-members-list');
    if (!container) return;
    container.innerHTML = renderSkeleton('list');

    try {
        var res = await apiClient.request('/mobile-admin/pending-members');
        if (res.success && res.data && res.data.items.length > 0) {
            container.innerHTML = res.data.items.map(function(m) {
                return '<div class="pending-member-card" id="pending-member-' + m.id + '">'
                    + '<div class="pending-member-info">'
                    + '<div class="pending-member-name">' + escapeHtml(m.name) + '</div>'
                    + '<div class="pending-member-meta">' + escapeHtml(m.email || '') + '</div>'
                    + (m.phone ? '<div class="pending-member-meta">' + escapeHtml(m.phone) + '</div>' : '')
                    + '<div class="pending-member-meta">신청일: ' + formatDate(m.created_at) + '</div>'
                    + '</div>'
                    + '<div class="pending-member-actions">'
                    + '<button class="btn-admin-reject" onclick="rejectPendingMember(' + m.id + ', \'' + escapeHtml(m.name).replace(/'/g, "\\'") + '\')">거부</button>'
                    + '<button class="btn-admin-approve" onclick="approvePendingMember(' + m.id + ', \'' + escapeHtml(m.name).replace(/'/g, "\\'") + '\')">승인</button>'
                    + '</div>'
                    + '</div>';
            }).join('');
        } else {
            container.innerHTML = '<div class="admin-hub-empty" style="padding:40px 0">'
                + '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>'
                + '<div style="margin-top:12px;color:var(--text-muted)">대기 중인 회원이 없습니다.</div>'
                + '</div>';
        }
    } catch (err) {
        container.innerHTML = renderErrorState('회원 목록을 불러올 수 없습니다', err.message, 'loadPendingMembers()');
    }
}

async function approvePendingMember(memberId, name) {
    if (!confirm(name + '님의 가입을 승인할까요?')) return;
    try {
        var res = await apiClient.request('/mobile-admin/members/' + memberId + '/approve', { method: 'POST' });
        if (res.success) {
            var card = document.getElementById('pending-member-' + memberId);
            if (card) card.style.display = 'none';
            var remaining = document.querySelectorAll('.pending-member-card[style*="display: none"]');
            var total = document.querySelectorAll('.pending-member-card');
            if (remaining.length >= total.length) loadPendingMembers();
        } else {
        }
    } catch (err) {
    }
}

function rejectPendingMember(memberId, name) {
    var overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';
    overlay.innerHTML = '<div class="admin-modal">'
        + '<div class="admin-modal-title">가입 거부</div>'
        + '<p style="color:var(--text-hint);font-size:14px;margin-bottom:12px">' + escapeHtml(name) + '님의 가입을 거부합니다.</p>'
        + '<div class="form-group">'
        + '<label style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:4px;display:block">거부 사유 (필수)</label>'
        + '<textarea id="reject-reason-input" rows="3" placeholder="거부 사유를 입력하세요" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;resize:vertical"></textarea>'
        + '</div>'
        + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">'
        + '<button class="btn btn-secondary btn-sm" onclick="this.closest(\'.admin-modal-overlay\').remove()">취소</button>'
        + '<button class="btn-admin-reject" style="padding:8px 20px;font-size:14px" onclick="confirmRejectMember(' + memberId + ', \'' + escapeHtml(name).replace(/'/g, "\\'") + '\', this)">거부 확인</button>'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);
    setTimeout(function() {
        var input = document.getElementById('reject-reason-input');
        if (input) input.focus();
    }, 100);
}

async function confirmRejectMember(memberId, name, btnEl) {
    var reason = (document.getElementById('reject-reason-input') || {}).value;
    if (!reason || !reason.trim()) {
        return;
    }
    btnEl.disabled = true;
    btnEl.textContent = '처리 중...';
    try {
        var res = await apiClient.request('/mobile-admin/members/' + memberId + '/reject', {
            method: 'POST',
            body: JSON.stringify({ reason: reason.trim() })
        });
        if (res.success) {
            var overlay = btnEl.closest('.admin-modal-overlay');
            if (overlay) overlay.remove();
            var card = document.getElementById('pending-member-' + memberId);
            if (card) card.style.display = 'none';
            var remaining = document.querySelectorAll('.pending-member-card[style*="display: none"]');
            var total = document.querySelectorAll('.pending-member-card');
            if (remaining.length >= total.length) loadPendingMembers();
        } else {
            btnEl.disabled = false;
            btnEl.textContent = '거부 확인';
        }
    } catch (err) {
        btnEl.disabled = false;
        btnEl.textContent = '거부 확인';
    }
}

// ══════════════════════════════════════
// 공지 관리 화면
// ══════════════════════════════════════

var _noticeSelectedIds = new Set();

function showNoticeManageScreen() {
    var screen = document.getElementById('notice-manage-screen');
    if (!screen) return;
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    screen.classList.add('active');
    _noticeSelectedIds.clear();
    loadNoticeManageList();
    pushRoute('notice-manage');
}

async function loadNoticeManageList() {
    var container = document.getElementById('notice-manage-content');
    if (!container) return;
    container.innerHTML = renderSkeleton('list');
    removeFloatingDeleteBar();

    try {
        var res = await apiClient.request('/admin-app/notices?limit=100');
        if (!res.success) throw new Error(res.message || '조회 실패');

        var items = (res.data && res.data.items) || [];
        if (items.length === 0) {
            container.innerHTML = '<div class="admin-hub-empty" style="padding:40px 0">'
                + '<div style="color:var(--text-muted)">등록된 공지가 없습니다.</div>'
                + '</div>';
            return;
        }

        var html = '<div class="admin-list-header">'
            + '<label class="admin-checkbox"><input type="checkbox" onchange="toggleAllNotices(this.checked)"><span class="checkmark"></span></label>'
            + '<span>전체 선택</span>'
            + '</div>';

        items.forEach(function(n) {
            html += '<div class="admin-list-item" onclick="onNoticeItemClick(event, ' + n.id + ')">'
                + '<label class="admin-checkbox" onclick="event.stopPropagation()">'
                + '<input type="checkbox" data-notice-id="' + n.id + '" onchange="onNoticeCheckChange()">'
                + '<span class="checkmark"></span></label>'
                + '<div class="admin-list-item-body">'
                + '<div class="admin-list-item-title">'
                + (n.is_pinned ? '<span class="pin-tag">고정</span> ' : '')
                + escapeHtml(n.title) + '</div>'
                + '<div class="admin-list-item-meta">'
                + '<span>' + escapeHtml(n.author_name || '') + '</span>'
                + '<span>' + formatDate(n.created_at) + '</span>'
                + '</div>'
                + '</div>'
                + '</div>';
        });

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = renderErrorState('공지를 불러올 수 없습니다', err.message, 'loadNoticeManageList()');
    }
}

function onNoticeItemClick(event, noticeId) {
    if (event.target.closest('.admin-checkbox')) return;
    showNoticeEditor(noticeId);
}

function toggleAllNotices(checked) {
    var cbs = document.querySelectorAll('[data-notice-id]');
    cbs.forEach(function(cb) { cb.checked = checked; });
    onNoticeCheckChange();
}

function onNoticeCheckChange() {
    var cbs = document.querySelectorAll('[data-notice-id]');
    _noticeSelectedIds.clear();
    cbs.forEach(function(cb) { if (cb.checked) _noticeSelectedIds.add(parseInt(cb.dataset.noticeId)); });
    updateFloatingDeleteBar(_noticeSelectedIds.size, function() { bulkDeleteNotices(); });
}

async function bulkDeleteNotices() {
    var ids = Array.from(_noticeSelectedIds);
    if (ids.length === 0) return;
    if (!confirm('선택한 ' + ids.length + '개의 공지를 삭제하시겠습니까?')) return;

    try {
        var res = await apiClient.request('/admin-app/notices/bulk', {
            method: 'DELETE',
            body: JSON.stringify({ ids: ids })
        });
        if (res.success) {
            _noticeSelectedIds.clear();
            removeFloatingDeleteBar();
            loadNoticeManageList();
        } else {
        }
    } catch (err) {
    }
}

// 공지 작성/수정 에디터
var _editingNoticeId = null;

function showNoticeEditor(noticeId) {
    var screen = document.getElementById('notice-edit-screen');
    if (!screen) return;
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    screen.classList.add('active');
    removeFloatingDeleteBar();

    _editingNoticeId = noticeId || null;
    var titleEl = document.getElementById('notice-edit-title');
    if (titleEl) titleEl.textContent = _editingNoticeId ? '공지 수정' : '새 공지 작성';

    var container = document.getElementById('notice-edit-content');
    if (!container) return;

    if (_editingNoticeId) {
        container.innerHTML = renderSkeleton('list');
        loadNoticeForEdit(noticeId, container);
    } else {
        renderNoticeEditForm(container, { title: '', content: '', is_pinned: false });
    }

    pushRoute('notice-edit');
}

async function loadNoticeForEdit(noticeId, container) {
    try {
        // GET from existing posts endpoint (notices are posts with category=notice)
        var res = await apiClient.request('/notices/' + noticeId);
        if (res.success && res.data) {
            var n = res.data.notice || res.data;
            renderNoticeEditForm(container, { title: n.title || '', content: n.content || '', is_pinned: !!n.is_pinned });
        } else {
            container.innerHTML = renderErrorState('공지를 불러올 수 없습니다', '', 'showNoticeManageScreen()');
        }
    } catch (err) {
        container.innerHTML = renderErrorState('공지를 불러올 수 없습니다', err.message, 'showNoticeManageScreen()');
    }
}

function renderNoticeEditForm(container, data) {
    container.innerHTML = '<div class="notice-edit-form">'
        + '<div class="form-group">'
        + '<label class="form-label">제목 (필수)</label>'
        + '<input type="text" id="notice-edit-input-title" class="form-input" placeholder="공지 제목" maxlength="200" value="' + escapeHtml(data.title) + '">'
        + '</div>'
        + '<div class="form-group">'
        + '<label class="form-label">내용 (필수)</label>'
        + '<textarea id="notice-edit-input-content" class="form-input" rows="8" placeholder="공지 내용을 입력하세요">' + escapeHtml(data.content) + '</textarea>'
        + '</div>'
        + '<div class="notice-pin-toggle">'
        + '<div><div class="pin-label">상단 고정</div><div class="pin-desc">공지 목록 상단에 고정합니다</div></div>'
        + '<label class="perm-switch"><input type="checkbox" id="notice-edit-pinned"' + (data.is_pinned ? ' checked' : '') + '><span class="perm-slider"></span></label>'
        + '</div>'
        + '<button class="btn-notice-save" onclick="saveNotice()">저장</button>'
        + (_editingNoticeId ? '<button class="btn-admin-reject" style="width:100%;padding:14px;font-size:16px;font-weight:700;margin-top:8px" onclick="deleteSingleNotice(' + _editingNoticeId + ')">삭제</button>' : '')
        + '</div>';
}

async function saveNotice() {
    var title = (document.getElementById('notice-edit-input-title') || {}).value.trim();
    var content = (document.getElementById('notice-edit-input-content') || {}).value.trim();
    var is_pinned = !!(document.getElementById('notice-edit-pinned') || {}).checked;


    try {
        var endpoint = _editingNoticeId
            ? '/admin-app/notices/' + _editingNoticeId
            : '/admin-app/notices';
        var method = _editingNoticeId ? 'PUT' : 'POST';

        var res = await apiClient.request(endpoint, {
            method: method,
            body: JSON.stringify({ title: title, content: content, is_pinned: is_pinned })
        });
        if (res.success) {
            showNoticeManageScreen();
        } else {
        }
    } catch (err) {
    }
}

async function deleteSingleNotice(noticeId) {
    if (!confirm('이 공지를 삭제하시겠습니까?')) return;
    try {
        var res = await apiClient.request('/admin-app/notices/' + noticeId, { method: 'DELETE' });
        if (res.success) {
            showNoticeManageScreen();
        } else {
        }
    } catch (err) {
    }
}

// ══════════════════════════════════════
// 게시글 관리 화면 (일괄 삭제)
// ══════════════════════════════════════

var _postSelectedIds = new Set();

function showPostManageScreen() {
    var screen = document.getElementById('post-manage-screen');
    if (!screen) return;
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    screen.classList.add('active');
    _postSelectedIds.clear();
    loadPostManageList();
    pushRoute('post-manage');
}

async function loadPostManageList() {
    var container = document.getElementById('post-manage-content');
    if (!container) return;
    container.innerHTML = renderSkeleton('list');
    removeFloatingDeleteBar();

    try {
        var res = await apiClient.request('/posts?limit=100');
        if (!res.success) throw new Error(res.message || '조회 실패');

        var items = (res.data && res.data.posts) || (res.data && res.data.items) || [];
        if (items.length === 0) {
            container.innerHTML = '<div class="admin-hub-empty" style="padding:40px 0"><div style="color:var(--text-muted)">게시글이 없습니다.</div></div>';
            return;
        }

        var html = '<div class="admin-list-header">'
            + '<label class="admin-checkbox"><input type="checkbox" onchange="toggleAllPosts(this.checked)"><span class="checkmark"></span></label>'
            + '<span>전체 선택</span>'
            + '</div>';

        items.forEach(function(p) {
            html += '<div class="admin-list-item">'
                + '<label class="admin-checkbox" onclick="event.stopPropagation()">'
                + '<input type="checkbox" data-post-id="' + p.id + '" onchange="onPostCheckChange()">'
                + '<span class="checkmark"></span></label>'
                + '<div class="admin-list-item-body">'
                + '<div class="admin-list-item-title">' + escapeHtml(p.title) + '</div>'
                + '<div class="admin-list-item-meta">'
                + '<span>' + escapeHtml(p.author_name || p.author || '') + '</span>'
                + '<span>' + formatDate(p.created_at) + '</span>'
                + '</div>'
                + '</div>'
                + '</div>';
        });

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = renderErrorState('게시글을 불러올 수 없습니다', err.message, 'loadPostManageList()');
    }
}

function toggleAllPosts(checked) {
    document.querySelectorAll('[data-post-id]').forEach(function(cb) { cb.checked = checked; });
    onPostCheckChange();
}

function onPostCheckChange() {
    _postSelectedIds.clear();
    document.querySelectorAll('[data-post-id]').forEach(function(cb) {
        if (cb.checked) _postSelectedIds.add(parseInt(cb.dataset.postId));
    });
    updateFloatingDeleteBar(_postSelectedIds.size, function() { bulkDeletePosts(); });
}

async function bulkDeletePosts() {
    var ids = Array.from(_postSelectedIds);
    if (ids.length === 0) return;
    if (!confirm('선택한 ' + ids.length + '개의 게시글을 삭제하시겠습니까?')) return;

    try {
        var res = await apiClient.request('/admin-app/posts/bulk', {
            method: 'DELETE',
            body: JSON.stringify({ ids: ids })
        });
        if (res.success) {
            _postSelectedIds.clear();
            removeFloatingDeleteBar();
            loadPostManageList();
        } else {
        }
    } catch (err) {
    }
}

// ══════════════════════════════════════
// 일정 관리 화면 (일괄 삭제)
// ══════════════════════════════════════

var _scheduleSelectedIds = new Set();

function showScheduleManageScreen() {
    var screen = document.getElementById('schedule-manage-screen');
    if (!screen) return;
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    screen.classList.add('active');
    _scheduleSelectedIds.clear();
    loadScheduleManageList();
    pushRoute('schedule-manage');
}

async function loadScheduleManageList() {
    var container = document.getElementById('schedule-manage-content');
    if (!container) return;
    container.innerHTML = renderSkeleton('list');
    removeFloatingDeleteBar();

    try {
        var res = await apiClient.request('/schedules?limit=100');
        if (!res.success) throw new Error(res.message || '조회 실패');

        var items = (res.data && res.data.schedules) || (res.data && res.data.items) || [];
        if (items.length === 0) {
            container.innerHTML = '<div class="admin-hub-empty" style="padding:40px 0"><div style="color:var(--text-muted)">일정이 없습니다.</div></div>';
            return;
        }

        var html = '<div class="admin-list-header">'
            + '<label class="admin-checkbox"><input type="checkbox" onchange="toggleAllSchedules(this.checked)"><span class="checkmark"></span></label>'
            + '<span>전체 선택</span>'
            + '</div>';

        items.forEach(function(s) {
            html += '<div class="admin-list-item">'
                + '<label class="admin-checkbox" onclick="event.stopPropagation()">'
                + '<input type="checkbox" data-schedule-id="' + s.id + '" onchange="onScheduleCheckChange()">'
                + '<span class="checkmark"></span></label>'
                + '<div class="admin-list-item-body">'
                + '<div class="admin-list-item-title">' + escapeHtml(s.title) + '</div>'
                + '<div class="admin-list-item-meta">'
                + '<span>' + escapeHtml(s.creator_name || s.created_by_name || '') + '</span>'
                + '<span>' + formatDate(s.start_date) + '</span>'
                + '</div>'
                + '</div>'
                + '</div>';
        });

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = renderErrorState('일정을 불러올 수 없습니다', err.message, 'loadScheduleManageList()');
    }
}

function toggleAllSchedules(checked) {
    document.querySelectorAll('[data-schedule-id]').forEach(function(cb) { cb.checked = checked; });
    onScheduleCheckChange();
}

function onScheduleCheckChange() {
    _scheduleSelectedIds.clear();
    document.querySelectorAll('[data-schedule-id]').forEach(function(cb) {
        if (cb.checked) _scheduleSelectedIds.add(parseInt(cb.dataset.scheduleId));
    });
    updateFloatingDeleteBar(_scheduleSelectedIds.size, function() { bulkDeleteSchedules(); });
}

async function bulkDeleteSchedules() {
    var ids = Array.from(_scheduleSelectedIds);
    if (ids.length === 0) return;
    if (!confirm('선택한 ' + ids.length + '개의 일정을 삭제하시겠습니까?\n(참석 데이터도 함께 삭제됩니다)')) return;

    try {
        var res = await apiClient.request('/admin-app/schedules/bulk', {
            method: 'DELETE',
            body: JSON.stringify({ ids: ids })
        });
        if (res.success) {
            _scheduleSelectedIds.clear();
            removeFloatingDeleteBar();
            loadScheduleManageList();
        } else {
        }
    } catch (err) {
    }
}

// ══════════════════════════════════════
// 플로팅 삭제 바 (공통)
// ══════════════════════════════════════

var _floatingDeleteCallback = null;

function updateFloatingDeleteBar(count, onDelete) {
    _floatingDeleteCallback = onDelete;
    var bar = document.getElementById('floating-delete-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'floating-delete-bar';
        bar.className = 'floating-delete-bar';
        bar.innerHTML = '<span class="selected-count"></span><button class="btn-bulk-delete" onclick="onFloatingDeleteClick()">삭제</button>';
        document.body.appendChild(bar);
    }
    bar.querySelector('.selected-count').textContent = count + '개 선택됨';
    if (count > 0) {
        bar.classList.add('visible');
    } else {
        bar.classList.remove('visible');
    }
}

function removeFloatingDeleteBar() {
    var bar = document.getElementById('floating-delete-bar');
    if (bar) bar.classList.remove('visible');
    _floatingDeleteCallback = null;
}

function onFloatingDeleteClick() {
    if (typeof _floatingDeleteCallback === 'function') _floatingDeleteCallback();
}

// ══════════════════════════════════════
// 긴급 푸시 발송 화면 (대상 선택 + 발송 기록)
// ══════════════════════════════════════

var _pushMembersList = [];
var _pushSelectedUserIds = new Set();

function showPushSendScreen() {
    var screen = document.getElementById('push-send-screen');
    if (!screen) return;
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    screen.classList.add('active');
    removeFloatingDeleteBar();
    _pushSelectedUserIds.clear();
    pushRoute('push-send');

    var container = document.getElementById('push-send-content');
    if (!container) return;

    container.innerHTML = ''
        + '<div class="push-send-form">'
        + '<div class="form-group">'
        + '<label class="form-label">제목 (필수)</label>'
        + '<input type="text" id="push-title" class="form-input" placeholder="긴급: 모임 장소 변경" maxlength="100">'
        + '</div>'
        + '<div class="form-group">'
        + '<label class="form-label">내용 (필수)</label>'
        + '<textarea id="push-body" class="form-input" rows="4" placeholder="오늘 모임 장소가 변경되었습니다." maxlength="500"></textarea>'
        + '</div>'
        + '<div class="form-group">'
        + '<label class="form-label">발송 대상</label>'
        + '<div class="push-target-options">'
        + '<label class="radio-option"><input type="radio" name="push-target" value="all" checked onchange="onPushTargetChange()"> 전체 회원</label>'
        + '<label class="radio-option"><input type="radio" name="push-target" value="selected" onchange="onPushTargetChange()"> 선택 회원</label>'
        + '</div>'
        + '<div id="push-member-select-area" style="display:none"></div>'
        + '</div>'
        + '<div class="push-warning">'
        + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        + ' 즉시 발송됩니다. 신중히 작성하세요.'
        + '</div>'
        + '<button class="btn-push-send" id="btn-push-send" onclick="handlePushSend()">발송하기</button>'
        + '</div>'
        + '<div class="push-log-section">'
        + '<div class="push-log-section-title">발송 기록</div>'
        + '<div id="push-log-list"></div>'
        + '</div>';

    loadPushLog();
}

function onPushTargetChange() {
    var target = (document.querySelector('input[name="push-target"]:checked') || {}).value;
    var area = document.getElementById('push-member-select-area');
    if (!area) return;

    if (target === 'selected') {
        area.style.display = 'block';
        area.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:13px">회원 목록 로딩 중...</div>';
        loadPushMembers();
    } else {
        area.style.display = 'none';
        _pushSelectedUserIds.clear();
    }
}

async function loadPushMembers() {
    var area = document.getElementById('push-member-select-area');
    if (!area) return;

    try {
        var res = await apiClient.request('/admin-app/members-simple');
        if (!res.success) throw new Error(res.message || '조회 실패');

        _pushMembersList = res.data || [];
        renderPushMemberSelect('');
    } catch (err) {
        area.innerHTML = '<div style="padding:12px;color:var(--error-color);font-size:13px">회원 목록 로드 실패: ' + escapeHtml(err.message) + '</div>';
    }
}

function renderPushMemberSelect(filter) {
    var area = document.getElementById('push-member-select-area');
    if (!area) return;

    var filtered = _pushMembersList;
    if (filter) {
        var f = filter.toLowerCase();
        filtered = _pushMembersList.filter(function(m) {
            return (m.name && m.name.toLowerCase().indexOf(f) >= 0)
                || (m.phone && m.phone.indexOf(f) >= 0);
        });
    }

    var html = '<div class="push-member-select">'
        + '<input type="text" class="push-member-search" placeholder="이름 또는 전화번호 검색" oninput="renderPushMemberSelect(this.value)" value="' + escapeHtml(filter) + '">'
        + '<div class="admin-list-header" style="border-bottom:1px solid var(--border-color)">'
        + '<label class="admin-checkbox"><input type="checkbox" onchange="toggleAllPushMembers(this.checked)"' + (_pushSelectedUserIds.size === _pushMembersList.length && _pushMembersList.length > 0 ? ' checked' : '') + '><span class="checkmark"></span></label>'
        + '<span>전체 선택</span>'
        + '</div>'
        + '<div class="push-member-list">';

    filtered.forEach(function(m) {
        var selected = _pushSelectedUserIds.has(m.id);
        html += '<div class="push-member-item' + (selected ? ' selected' : '') + '" onclick="togglePushMember(' + m.id + ')">'
            + '<label class="admin-checkbox" onclick="event.stopPropagation()">'
            + '<input type="checkbox" data-push-member="' + m.id + '"' + (selected ? ' checked' : '') + ' onchange="togglePushMember(' + m.id + ')">'
            + '<span class="checkmark"></span></label>'
            + '<div class="push-member-item-info">'
            + '<div class="push-member-item-name">' + escapeHtml(m.name) + '</div>'
            + '<div class="push-member-item-sub">'
            + (m.position_name ? escapeHtml(m.position_name) : '')
            + (m.phone ? (m.position_name ? ' · ' : '') + escapeHtml(m.phone) : '')
            + '</div>'
            + '</div>'
            + '</div>';
    });

    html += '</div>';

    if (_pushSelectedUserIds.size > 0) {
        html += '<div class="push-selected-summary">' + _pushSelectedUserIds.size + '명 선택됨</div>';
    }

    html += '</div>';
    area.innerHTML = html;
}

function togglePushMember(id) {
    if (_pushSelectedUserIds.has(id)) {
        _pushSelectedUserIds.delete(id);
    } else {
        _pushSelectedUserIds.add(id);
    }
    var searchInput = document.querySelector('.push-member-search');
    var filter = searchInput ? searchInput.value : '';
    renderPushMemberSelect(filter);
}

function toggleAllPushMembers(checked) {
    _pushSelectedUserIds.clear();
    if (checked) {
        _pushMembersList.forEach(function(m) { _pushSelectedUserIds.add(m.id); });
    }
    var searchInput = document.querySelector('.push-member-search');
    var filter = searchInput ? searchInput.value : '';
    renderPushMemberSelect(filter);
}

async function handlePushSend() {
    var title = (document.getElementById('push-title') || {}).value.trim();
    var body = (document.getElementById('push-body') || {}).value.trim();
    var target = (document.querySelector('input[name="push-target"]:checked') || {}).value || 'all';


    if (target === 'selected' && _pushSelectedUserIds.size === 0) {
        return;
    }

    var targetDesc = target === 'all' ? '전체 회원' : _pushSelectedUserIds.size + '명';
    if (!confirm(targetDesc + '에게 즉시 발송됩니다.\n\n제목: ' + title + '\n내용: ' + body + '\n\n발송하시겠습니까?')) return;

    var btn = document.getElementById('btn-push-send');
    if (btn) { btn.disabled = true; btn.textContent = '발송 중...'; }

    try {
        var payload = { title: title, body: body, target: target };
        if (target === 'selected') {
            payload.userIds = Array.from(_pushSelectedUserIds);
        }

        var res = await apiClient.request('/admin-app/push/send', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (res.success) {
            var data = res.data || {};
            // 폼 초기화
            if (document.getElementById('push-title')) document.getElementById('push-title').value = '';
            if (document.getElementById('push-body')) document.getElementById('push-body').value = '';
            _pushSelectedUserIds.clear();
            loadPushLog();
        } else {
        }
    } catch (err) {
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '발송하기'; }
    }
}

async function loadPushLog() {
    var container = document.getElementById('push-log-list');
    if (!container) return;
    container.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:13px">로딩 중...</div>';

    try {
        var res = await apiClient.request('/admin-app/push-log?limit=20');
        if (!res.success) throw new Error(res.message || '조회 실패');

        var items = (res.data && res.data.items) || [];
        if (items.length === 0) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">발송 기록이 없습니다.</div>';
            return;
        }

        container.innerHTML = items.map(function(log) {
            var targetLabel = log.target_type === 'all' ? '전체' : (log.target_count || 0) + '명';
            return '<div class="push-log-card">'
                + '<div class="push-log-card-title">' + escapeHtml(log.title) + '</div>'
                + '<div class="push-log-card-body">' + escapeHtml(log.content) + '</div>'
                + '<div class="push-log-card-meta">'
                + '<span>대상: ' + targetLabel + '</span>'
                + '<span>' + escapeHtml(log.sent_by_name || '') + '</span>'
                + '<span>' + formatDate(log.sent_at) + '</span>'
                + '</div>'
                + '</div>';
        }).join('');
    } catch (err) {
        container.innerHTML = '<div style="padding:12px;color:var(--error-color);font-size:13px">발송 기록 로드 실패</div>';
    }
}

// ══════════════════════════════════════
// B-4: 게시글/일정 관리 삭제 (개별, 인라인용)
// ══════════════════════════════════════

async function adminDeletePost(postId) {
    if (!confirm('관리자 권한으로 이 게시글을 삭제하시겠습니까?')) return;
    try {
        var res = await apiClient.request('/mobile-admin/posts/' + postId, { method: 'DELETE' });
        if (res.success) {
            if (typeof handlePostDetailBack === 'function') handlePostDetailBack();
        } else {
        }
    } catch (err) {
    }
}

async function adminDeleteSchedule(scheduleId) {
    if (!confirm('관리자 권한으로 이 일정을 삭제하시겠습니까?\n(참석 데이터도 함께 삭제됩니다)')) return;
    try {
        var res = await apiClient.request('/mobile-admin/schedules/' + scheduleId, { method: 'DELETE' });
        if (res.success) {
            if (typeof loadSchedulesScreen === 'function') loadSchedulesScreen();
        } else {
        }
    } catch (err) {
    }
}

// ══════════════════════════════════════
// 뒤로가기 지원
// ══════════════════════════════════════

function handleAdminHubBack() {
    removeFloatingDeleteBar();
    switchTab('profile');
}

function handlePendingMembersBack() {
    showAdminHub();
}

function handlePushSendBack() {
    showAdminHub();
}

function handleNoticeManageBack() {
    removeFloatingDeleteBar();
    showAdminHub();
}

function handleNoticeEditBack() {
    showNoticeManageScreen();
}

function handlePostManageBack() {
    removeFloatingDeleteBar();
    showAdminHub();
}

function handleScheduleManageBack() {
    removeFloatingDeleteBar();
    showAdminHub();
}

// ══════════════════════════════════════
// 로컬 관리 (initLocalAdmin) — 사이드 메뉴 "로컬 관리"
// local_admin / admin / super_admin 접근 가능
// ══════════════════════════════════════

function initLocalAdmin() {
    var container = document.getElementById('admin-manage-content');
    if (!container) return;
    container.innerHTML = '<div class="content-loading">로딩 중...</div>';
    renderLocalAdminDashboard(container);
}

async function renderLocalAdminDashboard(container) {
    var html = '<div style="padding:16px;display:flex;flex-direction:column;gap:16px">';

    // 승인 대기 섹션
    html += '<div class="local-admin-section">'
        + '<div class="local-admin-section-title">'
        + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>'
        + ' 승인 대기 회원'
        + '<span class="local-admin-badge" id="local-admin-pending-badge"></span>'
        + '</div>'
        + '<div id="local-admin-pending-list"><div style="padding:12px;text-align:center;color:var(--text-muted);font-size:13px">로딩 중...</div></div>'
        + '</div>';

    // 회원 목록 섹션
    html += '<div class="local-admin-section">'
        + '<div class="local-admin-section-title">'
        + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
        + ' 회원 목록'
        + '</div>'
        + '<div id="local-admin-member-list"><div style="padding:12px;text-align:center;color:var(--text-muted);font-size:13px">로딩 중...</div></div>'
        + '</div>';

    html += '</div>';
    container.innerHTML = html;

    // 데이터 로드
    loadLocalAdminPending();
    loadLocalAdminMembers();
}

async function loadLocalAdminPending() {
    var listEl = document.getElementById('local-admin-pending-list');
    var badgeEl = document.getElementById('local-admin-pending-badge');
    if (!listEl) return;

    try {
        var res = await apiClient.request('/mobile-admin/pending-members');
        if (!res.success) throw new Error(res.message || '조회 실패');

        var items = (res.data && res.data.items) || [];

        if (badgeEl) {
            if (items.length > 0) {
                badgeEl.textContent = items.length;
                badgeEl.style.display = 'inline-flex';
            } else {
                badgeEl.style.display = 'none';
            }
        }

        if (items.length === 0) {
            listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">'
                + '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border-color)" stroke-width="1.5" style="margin:0 auto 8px"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>'
                + '<div>대기 중인 회원이 없습니다.</div></div>';
            return;
        }

        listEl.innerHTML = items.map(function(m) {
            return '<div class="local-admin-pending-card" id="la-pending-' + m.id + '">'
                + '<div class="local-admin-pending-info">'
                + '<div class="local-admin-pending-name">' + escapeHtml(m.name) + '</div>'
                + '<div class="local-admin-pending-meta">' + escapeHtml(m.email || '') + '</div>'
                + (m.phone ? '<div class="local-admin-pending-meta">' + escapeHtml(m.phone) + '</div>' : '')
                + '<div class="local-admin-pending-meta">신청일: ' + formatDate(m.created_at) + '</div>'
                + '</div>'
                + '<div class="local-admin-pending-actions">'
                + '<button class="btn-admin-reject" onclick="localAdminReject(' + m.id + ', \'' + escapeHtml(m.name).replace(/'/g, "\\'") + '\')">거부</button>'
                + '<button class="btn-admin-approve" onclick="localAdminApprove(' + m.id + ', \'' + escapeHtml(m.name).replace(/'/g, "\\'") + '\')">승인</button>'
                + '</div>'
                + '</div>';
        }).join('');
    } catch (err) {
        listEl.innerHTML = '<div style="padding:12px;color:var(--error-color);font-size:13px">승인 대기 목록 로드 실패: ' + escapeHtml(err.message) + '</div>';
    }
}

async function localAdminApprove(memberId, name) {
    if (!confirm(name + '님의 가입을 승인할까요?')) return;
    try {
        var res = await apiClient.request('/mobile-admin/members/' + memberId + '/approve', { method: 'POST' });
        if (res.success) {
            loadLocalAdminPending();
            loadLocalAdminMembers();
        } else {
        }
    } catch (err) {
    }
}

function localAdminReject(memberId, name) {
    var overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';
    overlay.innerHTML = '<div class="admin-modal">'
        + '<div class="admin-modal-title">가입 거부</div>'
        + '<p style="color:var(--text-hint);font-size:14px;margin-bottom:12px">' + escapeHtml(name) + '님의 가입을 거부합니다.</p>'
        + '<div class="form-group">'
        + '<label style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:4px;display:block">거부 사유 (필수)</label>'
        + '<textarea id="la-reject-reason" rows="3" placeholder="거부 사유를 입력하세요" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;resize:vertical"></textarea>'
        + '</div>'
        + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">'
        + '<button class="btn btn-secondary btn-sm" onclick="this.closest(\'.admin-modal-overlay\').remove()">취소</button>'
        + '<button class="btn-admin-reject" style="padding:8px 20px;font-size:14px" onclick="confirmLocalAdminReject(' + memberId + ', \'' + escapeHtml(name).replace(/'/g, "\\'") + '\', this)">거부 확인</button>'
        + '</div>'
        + '</div>';
    document.body.appendChild(overlay);
    setTimeout(function() {
        var input = document.getElementById('la-reject-reason');
        if (input) input.focus();
    }, 100);
}

async function confirmLocalAdminReject(memberId, name, btnEl) {
    var reason = (document.getElementById('la-reject-reason') || {}).value;
    if (!reason || !reason.trim()) {
        return;
    }
    btnEl.disabled = true;
    btnEl.textContent = '처리 중...';
    try {
        var res = await apiClient.request('/mobile-admin/members/' + memberId + '/reject', {
            method: 'POST',
            body: JSON.stringify({ reason: reason.trim() })
        });
        if (res.success) {
            var overlay = btnEl.closest('.admin-modal-overlay');
            if (overlay) overlay.remove();
            loadLocalAdminPending();
        } else {
            btnEl.disabled = false;
            btnEl.textContent = '거부 확인';
        }
    } catch (err) {
        btnEl.disabled = false;
        btnEl.textContent = '거부 확인';
    }
}

async function loadLocalAdminMembers() {
    var listEl = document.getElementById('local-admin-member-list');
    if (!listEl) return;

    try {
        var res = await apiClient.request('/members?limit=100');
        if (!res.success) throw new Error(res.message || '조회 실패');

        var items = (res.data && res.data.members) || (res.data && res.data.items) || [];

        if (items.length === 0) {
            listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">회원이 없습니다.</div>';
            return;
        }

        var roleBadgeMap = {
            'super_admin': { label: '최고관리자', bg: '#FEE2E2', color: '#DC2626' },
            'admin': { label: '관리자', bg: '#DBEAFE', color: '#1D4ED8' },
            'local_admin': { label: '중간관리자', bg: '#D1FAE5', color: '#059669' },
            'member': { label: '회원', bg: '#F3F4F6', color: '#6B7280' }
        };

        listEl.innerHTML = items.map(function(m) {
            var role = m.role || 'member';
            var badge = roleBadgeMap[role] || roleBadgeMap['member'];
            var canChangeRole = (role !== 'admin' && role !== 'super_admin');

            return '<div class="local-admin-member-card">'
                + '<div class="local-admin-member-info">'
                + '<div class="local-admin-member-name">'
                + escapeHtml(m.name)
                + ' <span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;background:' + badge.bg + ';color:' + badge.color + '">' + badge.label + '</span>'
                + '</div>'
                + '<div class="local-admin-member-meta">'
                + (m.position_name ? escapeHtml(m.position_name) + ' · ' : '')
                + escapeHtml(m.email || '')
                + '</div>'
                + '</div>'
                + (canChangeRole ? '<div class="local-admin-member-actions">'
                    + '<select class="local-admin-role-select" onchange="localAdminChangeRole(' + m.id + ', this.value, \'' + escapeHtml(m.name).replace(/'/g, "\\'") + '\')">'
                    + '<option value="member"' + (role === 'member' ? ' selected' : '') + '>회원</option>'
                    + '<option value="local_admin"' + (role === 'local_admin' ? ' selected' : '') + '>중간관리자</option>'
                    + '</select>'
                    + '</div>' : '')
                + '</div>';
        }).join('');
    } catch (err) {
        listEl.innerHTML = '<div style="padding:12px;color:var(--error-color);font-size:13px">회원 목록 로드 실패: ' + escapeHtml(err.message) + '</div>';
    }
}

async function localAdminChangeRole(memberId, newRole, name) {
    // local_admin은 member / local_admin만 할당 가능
    if (newRole !== 'member' && newRole !== 'local_admin') {
        loadLocalAdminMembers();
        return;
    }
    if (!confirm(name + '님의 역할을 "' + (newRole === 'local_admin' ? '중간관리자' : '회원') + '"(으)로 변경할까요?')) {
        loadLocalAdminMembers();
        return;
    }
    try {
        var res = await apiClient.request('/mobile-admin/members/' + memberId + '/role', {
            method: 'PUT',
            body: JSON.stringify({ role: newRole })
        });
        if (res.success) {
            loadLocalAdminMembers();
        } else {
            loadLocalAdminMembers();
        }
    } catch (err) {
        loadLocalAdminMembers();
    }
}

function handleAdminManageBack() {
    switchTab('home');
}

// ========== 전체 데이터 초기화 (super_admin 전용) ==========

function confirmResetData() {
    if (!confirm('정말로 전체 데이터를 초기화하시겠습니까?\n\n관리자 3명(총관리자, 경민수, 김우연)을 제외한 모든 회원, 게시글, 일정이 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다.')) return;
    if (!confirm('마지막 확인입니다.\n\n정말 삭제하시겠습니까?')) return;
    executeResetData();
}

async function executeResetData() {
    try {
        var res = await apiClient.request('/admin/reset-data', { method: 'POST' });
        if (res.success) {
            alert('초기화 완료!\n\n' + res.message);
            renderAdminHubContent();
        } else {
            alert('초기화 실패: ' + (res.message || '알 수 없는 오류'));
        }
    } catch (e) {
        alert('초기화 중 오류: ' + e.message);
    }
}

console.log('Admin-App module loaded');
