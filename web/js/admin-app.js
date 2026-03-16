// 앱 관리 기능 — 권한 로드 + 관리 허브 + 회원 승인
// B-1: 권한 로드, B-2: 관리 메뉴, B-3: 회원가입 승인

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
    // 기존 관리 섹션 제거 (중복 방지)
    var existing = document.getElementById('profile-admin-section');
    if (existing) existing.remove();

    if (!window.__hasAnyPermission) return;

    var settingsGroups = document.querySelectorAll('#profile-content .settings-group');
    if (settingsGroups.length === 0) return;

    var section = document.createElement('div');
    section.id = 'profile-admin-section';
    section.className = 'settings-group admin-menu-group';
    section.innerHTML = '<div class="settings-group-title admin-section-title">'
        + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
        + ' 관리'
        + '</div>'
        + '<div class="settings-item" onclick="showAdminHub()">'
        + '<span class="settings-item-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>'
        + '<span class="settings-item-label">앱 관리</span>'
        + '<span class="settings-item-chevron"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></span>'
        + '</div>';

    // 첫 번째 settings-group 뒤에 삽입
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
    renderAdminHubContent();
    history.pushState({ screen: 'admin-hub' }, '', '#admin-hub');
}

function renderAdminHubContent() {
    var container = document.getElementById('admin-hub-content');
    if (!container) return;

    var html = '';

    if (hasMobilePermission('member_approve')) {
        html += '<div class="admin-hub-card" onclick="showPendingMembersScreen()">'
            + '<div class="admin-hub-card-icon" style="background:#ECFDF5;color:#059669">'
            + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>'
            + '</div>'
            + '<div class="admin-hub-card-body">'
            + '<div class="admin-hub-card-title">회원 승인 대기<span class="admin-hub-badge" id="pending-count-badge"></span></div>'
            + '<div class="admin-hub-card-desc">승인 대기 중인 회원 목록</div>'
            + '</div>'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>'
            + '</div>';
        loadPendingCount();
    }

    if (hasMobilePermission('notice_manage')) {
        html += '<div class="admin-hub-card" onclick="showToast(\'공지 관리는 게시판 공지탭에서 이용하세요.\')">'
            + '<div class="admin-hub-card-icon" style="background:#FEF3C7;color:#D97706">'
            + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
            + '</div>'
            + '<div class="admin-hub-card-body">'
            + '<div class="admin-hub-card-title">공지 관리</div>'
            + '<div class="admin-hub-card-desc">공지 작성/수정/삭제</div>'
            + '</div>'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>'
            + '</div>';
    }

    if (hasMobilePermission('push_send')) {
        html += '<div class="admin-hub-card" onclick="showPushSendScreen()">'
            + '<div class="admin-hub-card-icon" style="background:#FEE2E2;color:#DC2626">'
            + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
            + '</div>'
            + '<div class="admin-hub-card-body">'
            + '<div class="admin-hub-card-title">긴급 푸시 발송</div>'
            + '<div class="admin-hub-card-desc">즉시 전체/그룹 알림 발송</div>'
            + '</div>'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>'
            + '</div>';
    }

    if (hasMobilePermission('post_manage') || hasMobilePermission('schedule_manage')) {
        html += '<div class="admin-hub-info">'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
            + ' 게시글/일정 관리는 각 화면에서 인라인으로 제공됩니다.'
            + '</div>';
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
    history.pushState({ screen: 'pending-members' }, '', '#pending-members');
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
                + '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>'
                + '<div style="margin-top:12px;color:#9CA3AF">대기 중인 회원이 없습니다.</div>'
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
            showToast(name + '님의 가입이 승인되었습니다.', 'success');
            var card = document.getElementById('pending-member-' + memberId);
            if (card) card.style.display = 'none';
            // 남은 카드 없으면 새로고침
            var remaining = document.querySelectorAll('.pending-member-card[style*="display: none"]');
            var total = document.querySelectorAll('.pending-member-card');
            if (remaining.length >= total.length) loadPendingMembers();
        } else {
            showToast(res.message || '승인 실패', 'error');
        }
    } catch (err) {
        showToast(err.message || '승인 중 오류', 'error');
    }
}

function rejectPendingMember(memberId, name) {
    // 거부 사유 입력 모달
    var overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';
    overlay.innerHTML = '<div class="admin-modal">'
        + '<div class="admin-modal-title">가입 거부</div>'
        + '<p style="color:#6B7280;font-size:14px;margin-bottom:12px">' + escapeHtml(name) + '님의 가입을 거부합니다.</p>'
        + '<div class="form-group">'
        + '<label style="font-size:13px;font-weight:600;color:#374151;margin-bottom:4px;display:block">거부 사유 (필수)</label>'
        + '<textarea id="reject-reason-input" rows="3" placeholder="거부 사유를 입력하세요" style="width:100%;padding:10px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;resize:vertical"></textarea>'
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
        showToast('거부 사유를 입력하세요.', 'error');
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
            showToast(name + '님의 가입이 거부되었습니다.');
            var overlay = btnEl.closest('.admin-modal-overlay');
            if (overlay) overlay.remove();
            var card = document.getElementById('pending-member-' + memberId);
            if (card) card.style.display = 'none';
            var remaining = document.querySelectorAll('.pending-member-card[style*="display: none"]');
            var total = document.querySelectorAll('.pending-member-card');
            if (remaining.length >= total.length) loadPendingMembers();
        } else {
            showToast(res.message || '거부 실패', 'error');
            btnEl.disabled = false;
            btnEl.textContent = '거부 확인';
        }
    } catch (err) {
        showToast(err.message || '거부 중 오류', 'error');
        btnEl.disabled = false;
        btnEl.textContent = '거부 확인';
    }
}

// ══════════════════════════════════════
// 긴급 푸시 발송 화면
// ══════════════════════════════════════

function showPushSendScreen() {
    var screen = document.getElementById('push-send-screen');
    if (!screen) return;
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    screen.classList.add('active');
    history.pushState({ screen: 'push-send' }, '', '#push-send');

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
        + '<label class="radio-option"><input type="radio" name="push-target" value="all" checked> 전체 회원</label>'
        + '</div>'
        + '</div>'
        + '<div class="push-warning">'
        + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        + ' 즉시 발송됩니다. 신중히 작성하세요.'
        + '</div>'
        + '<button class="btn-push-send" onclick="handlePushSend()">발송하기</button>'
        + '</div>';
}

async function handlePushSend() {
    var title = (document.getElementById('push-title') || {}).value.trim();
    var body = (document.getElementById('push-body') || {}).value.trim();

    if (!title) { showToast('제목을 입력하세요.', 'error'); return; }
    if (!body) { showToast('내용을 입력하세요.', 'error'); return; }

    if (!confirm('전체 회원에게 즉시 발송됩니다.\n\n제목: ' + title + '\n내용: ' + body + '\n\n발송하시겠습니까?')) return;

    try {
        var res = await apiClient.request('/mobile-admin/push/send', {
            method: 'POST',
            body: JSON.stringify({ title: title, body: body, target: 'all' })
        });
        if (res.success) {
            var data = res.data || {};
            showToast('발송 완료 (성공: ' + (data.sent_count || 0) + '건, 실패: ' + (data.failed_count || 0) + '건)', 'success');
            showAdminHub();
        } else {
            showToast(res.message || '발송 실패', 'error');
        }
    } catch (err) {
        showToast(err.message || '발송 중 오류', 'error');
    }
}

// ══════════════════════════════════════
// B-4: 게시글/일정 관리 삭제 (admin-app API)
// ══════════════════════════════════════

async function adminDeletePost(postId) {
    if (!confirm('관리자 권한으로 이 게시글을 삭제하시겠습니까?')) return;
    try {
        var res = await apiClient.request('/mobile-admin/posts/' + postId, { method: 'DELETE' });
        if (res.success) {
            showToast('게시글이 삭제되었습니다.', 'success');
            if (typeof handlePostDetailBack === 'function') handlePostDetailBack();
        } else {
            showToast(res.message || '삭제 실패', 'error');
        }
    } catch (err) {
        showToast(err.message || '삭제 중 오류', 'error');
    }
}

async function adminDeleteSchedule(scheduleId) {
    if (!confirm('관리자 권한으로 이 일정을 삭제하시겠습니까?\n(참석 데이터도 함께 삭제됩니다)')) return;
    try {
        var res = await apiClient.request('/mobile-admin/schedules/' + scheduleId, { method: 'DELETE' });
        if (res.success) {
            showToast('일정이 삭제되었습니다.', 'success');
            if (typeof loadSchedulesScreen === 'function') loadSchedulesScreen();
        } else {
            showToast(res.message || '삭제 실패', 'error');
        }
    } catch (err) {
        showToast(err.message || '삭제 중 오류', 'error');
    }
}

// ══════════════════════════════════════
// 뒤로가기 지원
// ══════════════════════════════════════

function handleAdminHubBack() {
    switchTab('profile');
}

function handlePendingMembersBack() {
    showAdminHub();
}

function handlePushSendBack() {
    showAdminHub();
}

console.log('✅ Admin-App 모듈 로드 완료');
