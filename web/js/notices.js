// 공지사항 기능 (Railway API 연동)

let currentNoticesPage = 1;
let noticesLoading = false;

function getCurrentUserSafe() {
    try {
        return typeof getCurrentUser === 'function'
            ? getCurrentUser()
            : JSON.parse(localStorage.getItem('user_info') || 'null');
    } catch (_) {
        return null;
    }
}

function isNoticeAuthorOrAdmin(notice) {
    const user = getCurrentUserSafe();
    if (!user) return false;
    return (
        String(user.id) === String(notice.author_id) ||
        ['super_admin', 'admin'].includes(user.role)
    );
}

// 공지사항 화면 진입 시 호출
async function loadNoticesScreen() {
    currentNoticesPage = 1;
    await loadNotices(1);
    checkNoticeCreatePermission();
}

// 공지사항 목록 로드
async function loadNotices(page = 1) {
    if (noticesLoading) return;
    const container = document.getElementById('notice-list');
    if (!container) return;
    noticesLoading = true;
    try {
        container.innerHTML = typeof renderSkeleton === 'function' ? renderSkeleton('list') : '<div class="content-loading">공지사항 로딩 중...</div>';
        const result = await apiClient.getNotices(page, 20);
        if (result.success && Array.isArray(result.notices)) {
            if (result.notices.length === 0) {
                container.innerHTML = typeof renderEmptyState === 'function'
                    ? renderEmptyState('document', '등록된 공지사항이 없습니다')
                    : '<div class="empty-state">등록된 공지사항이 없습니다.</div>';
            } else {
                container.innerHTML = result.notices
                    .map((notice) => createNoticeCard(notice))
                    .join('');
                currentNoticesPage = page;
            }
        } else {
            container.innerHTML = typeof renderErrorState === 'function'
                ? renderErrorState('공지사항을 불러올 수 없습니다', '잠시 후 다시 시도해주세요', 'loadNotices(1)')
                : '<div class="error-state">공지사항을 불러올 수 없습니다.</div>';
        }
    } catch (error) {
        console.error('공지사항 목록 로드 실패:', error);
        container.innerHTML = typeof renderErrorState === 'function'
            ? renderErrorState('공지사항을 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'loadNotices(1)')
            : '<div class="error-state">공지사항을 불러올 수 없습니다.</div>';
    } finally {
        noticesLoading = false;
    }
}

// 공지사항 카드 생성
function createNoticeCard(notice) {
    const isNew = isNewContent(notice.created_at);
    const isPinned = notice.is_pinned;
    return `
        <div class="notice-card ${isPinned ? 'pinned' : ''}" onclick="navigateTo('/notices/${notice.id}')">
            <div class="notice-header">
                ${isPinned ? '<span class="badge badge-pinned">고정</span>' : ''}
                ${isNew ? '<span class="badge badge-new">N</span>' : ''}
                ${notice.attendance_survey_enabled ? '<span class="badge badge-survey">참석조사</span>' : ''}
            </div>
            <h3 class="notice-title">${escapeHtml(notice.title)}</h3>
            ${notice.content ? `<p class="notice-preview">${escapeHtml(notice.content.substring(0, 100))}${notice.content.length > 100 ? '...' : ''}</p>` : ''}
            <div class="notice-meta">
                <div class="notice-author">
                    ${notice.author_image ?
                        `<img src="${notice.author_image}" alt="${notice.author_name}" class="author-avatar-small">` :
                        `<div class="author-avatar-small-placeholder">${notice.author_name ? notice.author_name[0] : '?'}</div>`
                    }
                    <span class="author-name">${escapeHtml(notice.author_name || '알 수 없음')}</span>
                </div>
                <div class="notice-info">
                    <span class="notice-date">${formatRelativeTime(notice.created_at)}</span>
                    ${notice.views > 0 ? `<span class="notice-views"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${notice.views}</span>` : ''}
                    ${notice.comments_count > 0 ? `<span class="notice-comments"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${notice.comments_count}</span>` : ''}
                    ${notice.likes_count > 0 ? `<span class="notice-likes"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg> ${notice.likes_count}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

async function showNoticeDetailScreen(noticeId) {
    const screen = document.getElementById('notices-screen');
    const container = document.getElementById('notice-list');
    if (!screen || !container) return;
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    screen.classList.add('active');
    container.innerHTML = '<div class="content-loading">공지사항 로딩 중...</div>';

    try {
        const result = await apiClient.getNotice(noticeId);
        if (!result.success || !result.notice) {
            container.innerHTML = '<div class="error-state">공지사항을 불러올 수 없습니다.</div>';
            return;
        }
        const notice = result.notice;
        const canEdit = isNoticeAuthorOrAdmin(notice);
        container.innerHTML = `
            <div class="post-detail">
                <div class="post-detail-actions" style="margin-bottom:12px">
                    <button class="btn btn-secondary btn-sm" data-action="notice-back-list">← 목록</button>
                    ${canEdit ? `<button class="btn btn-primary btn-sm" data-action="notice-edit" data-id="${notice.id}">수정</button>` : ''}
                    ${canEdit ? `<button class="btn btn-danger btn-sm" data-action="notice-delete" data-id="${notice.id}">삭제</button>` : ''}
                </div>
                <h1 class="post-detail-title">${escapeHtml(notice.title || '')}</h1>
                <div class="post-detail-meta">
                    <span>작성자: ${escapeHtml(notice.author_name || '알 수 없음')}</span>
                    <span>${formatRelativeTime(notice.created_at)}</span>
                    <span><svg class="icon-sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${notice.views || 0}</span>
                </div>
                <div class="post-detail-body">${escapeHtml(notice.content || '').replace(/\n/g, '<br>')}</div>
                <div id="notice-linked-schedule-container"></div>
                ${notice.attendance_survey_enabled ? `
                    <div class="post-detail-comments">
                        <h4>참석자 조사</h4>
                        <div class="post-detail-actions">
                            <button class="btn btn-secondary btn-sm" data-attend="attending" data-id="${notice.id}">참석</button>
                            <button class="btn btn-secondary btn-sm" data-attend="not_attending" data-id="${notice.id}">불참</button>
                            <button class="btn btn-secondary btn-sm" data-attend="undecided" data-id="${notice.id}">미정</button>
                        </div>
                        <div id="notice-attendance-box" class="text-muted" style="margin-top:8px">현황 로딩 중...</div>
                    </div>
                ` : ''}
            </div>
        `;
        if (notice.attendance_survey_enabled) {
            await loadNoticeAttendance(notice.id);
        }
        // M-12: 연결된 일정 표시
        loadNoticeLinkedSchedule(notice.schedule_id || notice.linked_schedule_id);
    } catch (e) {
        container.innerHTML = '<div class="error-state">공지사항을 불러올 수 없습니다.</div>';
    }
}

function renderNoticeCreateForm(data = {}) {
    const container = document.getElementById('notice-list');
    if (!container) return;
    container.innerHTML = `
        <form id="notice-create-form" class="auth-form">
            <div class="form-group">
                <button type="button" class="btn btn-secondary btn-sm" data-action="notice-back-list">← 목록</button>
            </div>
            <div class="form-group">
                <label for="notice-title">제목</label>
                <input type="text" id="notice-title" maxlength="200" required value="${escapeHtml(data.title || '')}">
            </div>
            <div class="form-group">
                <label for="notice-content">내용</label>
                <textarea id="notice-content" rows="8" required>${escapeHtml(data.content || '')}</textarea>
            </div>
            <div class="form-group">
                <label><input type="checkbox" id="notice-is-pinned" ${data.is_pinned ? 'checked' : ''}> 상단 고정</label>
            </div>
            <div class="form-group">
                <label><input type="checkbox" id="notice-attendance-enabled" ${data.attendance_survey_enabled ? 'checked' : ''}> 참석자 조사 활성화</label>
            </div>
            <div class="form-group">
                <label for="notice-schedule-id">연결 일정 <span class="optional-badge" style="font-size:11px;color:#9CA3AF;font-weight:400">선택</span></label>
                <select id="notice-schedule-id">
                    <option value="">연결 일정 없음</option>
                </select>
            </div>
            <div class="inline-error-message" id="notice-form-error"></div>
            <button type="submit" class="btn btn-primary" id="notice-submit-btn">
                <span class="btn-text">${data.id ? '수정 저장' : '등록'}</span>
                <span class="btn-loading" style="display:none;"><span class="spinner"></span></span>
            </button>
        </form>
    `;
    // M-12: 일정 드롭다운 로드
    loadNoticeScheduleOptions(data.schedule_id || data.linked_schedule_id || null);
}

async function loadNoticeScheduleOptions(selectedId) {
    const sel = document.getElementById('notice-schedule-id');
    if (!sel) return;
    try {
        const res = await apiClient.getSchedules(true);
        const schedules = res.schedules || (res.data && (res.data.schedules || res.data.items)) || [];
        let html = '<option value="">연결 일정 없음</option>';
        schedules.forEach(function(s) {
            const dateStr = s.start_date ? s.start_date.split('T')[0] : '';
            const label = (dateStr ? '[' + dateStr + '] ' : '') + (s.title || '제목 없음');
            const selected = selectedId && String(s.id) === String(selectedId) ? ' selected' : '';
            html += '<option value="' + s.id + '"' + selected + '>' + escapeHtml(label) + '</option>';
        });
        sel.innerHTML = html;
    } catch (_) {}
}

function handleCreateNotice() {
    renderNoticeCreateForm();
}

async function handleEditNotice(noticeId) {
    const res = await apiClient.getNotice(noticeId);
    if (!res.success || !res.notice) {
        alert('공지를 불러오지 못했습니다.');
        return;
    }
    renderNoticeCreateForm(res.notice);
    const form = document.getElementById('notice-create-form');
    if (form) form.dataset.editId = String(noticeId);
}

async function handleNoticeFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const titleEl = document.getElementById('notice-title');
    const contentEl = document.getElementById('notice-content');
    const pinnedEl = document.getElementById('notice-is-pinned');
    const attendEl = document.getElementById('notice-attendance-enabled');
    const btn = document.getElementById('notice-submit-btn');
    const errEl = document.getElementById('notice-form-error');
    if (!titleEl || !contentEl || !btn) return;

    const schedIdEl = document.getElementById('notice-schedule-id');
    const scheduleId = schedIdEl && schedIdEl.value ? parseInt(schedIdEl.value, 10) : null;
    const payload = {
        title: (titleEl.value || '').trim(),
        content: (contentEl.value || '').trim(),
        is_pinned: !!(pinnedEl && pinnedEl.checked),
        attendance_survey_enabled: !!(attendEl && attendEl.checked),
    };
    if (scheduleId && !isNaN(scheduleId)) payload.schedule_id = scheduleId;
    if (!payload.title || !payload.content) {
        if (errEl) showInlineError('notice-form-error', '제목과 내용을 입력해주세요.');
        return;
    }
    setButtonLoading(btn, true);
    try {
        const editId = form.dataset.editId;
        const res = editId
            ? await apiClient.updateNotice(editId, payload)
            : await apiClient.createNotice(payload);
        if (!res.success) {
            showInlineError('notice-form-error', res.message || '저장에 실패했습니다.');
            return;
        }
        if (editId) {
            await showNoticeDetailScreen(editId);
        } else if (res.noticeId) {
            await showNoticeDetailScreen(res.noticeId);
        } else {
            await loadNoticesScreen();
        }
    } catch (e) {
        showInlineError('notice-form-error', e.message || '저장 중 오류가 발생했습니다.');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function handleDeleteNotice(noticeId) {
    if (!confirm('공지사항을 삭제할까요?')) return;
    try {
        const res = await apiClient.deleteNotice(noticeId);
        if (!res.success) {
            alert(res.message || '삭제에 실패했습니다.');
            return;
        }
        await loadNoticesScreen();
    } catch (e) {
        alert(e.message || '삭제 중 오류가 발생했습니다.');
    }
}

async function loadNoticeAttendance(noticeId) {
    const box = document.getElementById('notice-attendance-box');
    if (!box) return;
    try {
        const res = await apiClient.getNoticeAttendance(noticeId);
        if (!res.success) {
            box.textContent = '참석 현황을 불러오지 못했습니다.';
            return;
        }
        const s = res.summary || {};
        box.innerHTML = `
            참석 ${s.attending || 0}명 · 불참 ${s.not_attending || 0}명 · 미정 ${s.undecided || 0}명
            <br>내 상태: ${res.myStatus || 'undecided'}
        `;
    } catch (_) {
        box.textContent = '참석 현황을 불러오지 못했습니다.';
    }
}

async function handleNoticeAttend(noticeId, status) {
    try {
        const res = await apiClient.updateNoticeAttendance(noticeId, status);
        if (!res.success) {
            alert(res.message || '저장에 실패했습니다.');
            return;
        }
        await loadNoticeAttendance(noticeId);
    } catch (e) {
        alert(e.message || '저장 중 오류가 발생했습니다.');
    }
}

// M-12: 공지 상세에서 연결된 일정 표시
async function loadNoticeLinkedSchedule(scheduleId) {
    const container = document.getElementById('notice-linked-schedule-container');
    if (!container || !scheduleId) { if (container) container.innerHTML = ''; return; }
    try {
        const res = await apiClient.getSchedule(scheduleId);
        const sched = res.schedule || (res.data && res.data) || null;
        if (!sched) { container.innerHTML = ''; return; }
        const catLabels = typeof CATEGORY_LABELS !== 'undefined' ? CATEGORY_LABELS : {};
        const catClasses = typeof CATEGORY_BADGE_CLASS !== 'undefined' ? CATEGORY_BADGE_CLASS : {};
        const catLabel = catLabels[sched.category] || sched.category || '';
        const catClass = catClasses[sched.category] || 'badge-other';
        const dateStr = sched.start_date ? new Date(sched.start_date).toLocaleDateString('ko-KR') : '';
        let timeStr = '';
        if (sched.start_date && sched.start_date.includes('T')) {
            const st = sched.start_date.split('T')[1]?.substring(0, 5) || '';
            const et = sched.end_date && sched.end_date.includes('T') ? sched.end_date.split('T')[1]?.substring(0, 5) || '' : '';
            if (st && st !== '00:00') timeStr = et ? st + '~' + et : st;
        }
        container.innerHTML = `
            <div class="linked-schedule-banner" onclick="navigateTo('/schedules/${sched.id}')" style="margin-top:12px">
                <div class="linked-schedule-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                <div class="linked-schedule-info">
                    <div class="linked-schedule-label">연결된 일정</div>
                    <div class="linked-schedule-title">
                        <span class="schedule-category-badge ${catClass}">${catLabel}</span>
                        ${escapeHtml(sched.title || '')}
                    </div>
                    <div class="linked-schedule-meta">
                        ${dateStr ? '<span>' + dateStr + '</span>' : ''}
                        ${timeStr ? '<span>' + timeStr + '</span>' : ''}
                        ${sched.location ? '<span>' + escapeHtml(sched.location) + '</span>' : ''}
                    </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
        `;
    } catch (_) { container.innerHTML = ''; }
}

// 공지사항 작성 권한 확인 및 버튼 표시
function checkNoticeCreatePermission() {
    const user = getCurrentUserSafe();
    const createBtn = document.getElementById('create-notice-btn');
    if (!createBtn || !user) return;
    createBtn.style.display = ['super_admin', 'admin'].includes(user.role)
        ? 'block'
        : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const createNoticeBtn = document.getElementById('create-notice-btn');
    if (createNoticeBtn) {
        createNoticeBtn.addEventListener('click', handleCreateNotice);
    }

    const noticeList = document.getElementById('notice-list');
    if (noticeList) {
        noticeList.addEventListener('submit', (e) => {
            if (e.target && e.target.id === 'notice-create-form') {
                handleNoticeFormSubmit(e);
            }
        });
        noticeList.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action],[data-attend]');
            if (!target) return;
            const action = target.dataset.action;
            if (action === 'notice-back-list') loadNoticesScreen();
            if (action === 'notice-edit') handleEditNotice(target.dataset.id);
            if (action === 'notice-delete') handleDeleteNotice(target.dataset.id);
            if (target.dataset.attend) {
                handleNoticeAttend(target.dataset.id, target.dataset.attend);
            }
        });
    }
});

console.log('✅ Notices 모듈 로드 완료 (Railway API)');
