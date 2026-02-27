// 일정 기능 (Railway API 연동)

let schedulesLoading = false;

function getCurrentUserSafe() {
    try {
        return typeof getCurrentUser === 'function'
            ? getCurrentUser()
            : JSON.parse(localStorage.getItem('user_info') || 'null');
    } catch (_) {
        return null;
    }
}

function canCreateSchedule() {
    const user = getCurrentUserSafe();
    return !!(user && ['super_admin', 'admin'].includes(user.role));
}

async function loadSchedulesScreen() {
    await loadSchedules();
    checkScheduleCreatePermission();
}

// 일정 목록 로드
async function loadSchedules() {
    if (schedulesLoading) return;
    const container = document.getElementById('schedule-list');
    if (!container) return;
    schedulesLoading = true;
    try {
        container.innerHTML = '<div class="content-loading">일정 로딩 중...</div>';
        const result = await apiClient.getSchedules(true);
        if (result.success && Array.isArray(result.schedules)) {
            if (result.schedules.length === 0) {
                container.innerHTML =
                    '<div class="empty-state">예정된 일정이 없습니다.</div>';
            } else {
                container.innerHTML = renderSchedulesByDate(result.schedules);
            }
        } else {
            container.innerHTML = '<div class="error-state">일정을 불러올 수 없습니다.</div>';
        }
    } catch (error) {
        console.error('일정 목록 로드 실패:', error);
        container.innerHTML = '<div class="error-state">일정을 불러올 수 없습니다.</div>';
    } finally {
        schedulesLoading = false;
    }
}

// 날짜별로 일정 그룹핑 및 렌더링
function renderSchedulesByDate(schedules) {
    // 날짜별로 그룹핑
    const groupedSchedules = {};
    
    schedules.forEach(schedule => {
        const date = schedule.event_date.split('T')[0]; // YYYY-MM-DD
        if (!groupedSchedules[date]) {
            groupedSchedules[date] = [];
        }
        groupedSchedules[date].push(schedule);
    });
    
    // HTML 생성
    let html = '';
    
    for (const date in groupedSchedules) {
        const schedulesForDate = groupedSchedules[date];
        
        html += `
            <div class="schedule-group">
                <div class="schedule-date-header">
                    <div class="schedule-date-large">
                        <div class="schedule-day">${formatDate(date, 'DD')}</div>
                        <div class="schedule-month">${formatDate(date, 'MM월')}</div>
                        <div class="schedule-weekday">${getWeekday(date)}</div>
                    </div>
                </div>
                <div class="schedule-list-group">
                    ${schedulesForDate.map(schedule => createScheduleCard(schedule)).join('')}
                </div>
            </div>
        `;
    }
    
    return html;
}

// 일정 카드 생성
function createScheduleCard(schedule) {
    const isNew = isNewContent(schedule.created_at);
    
    return `
        <div class="schedule-card" onclick="navigateTo('/schedules/${schedule.id}')">
            <div class="schedule-header">
                ${isNew ? '<span class="badge badge-new">N</span>' : ''}
            </div>
            
            <h3 class="schedule-title">${escapeHtml(schedule.title)}</h3>
            
            <div class="schedule-details">
                ${schedule.start_time ? `
                    <div class="schedule-detail-item">
                        <span class="schedule-icon">⏰</span>
                        <span class="schedule-time">${schedule.start_time}${schedule.end_time ? ` - ${schedule.end_time}` : ''}</span>
                    </div>
                ` : ''}
                
                ${schedule.location ? `
                    <div class="schedule-detail-item">
                        <span class="schedule-icon">📍</span>
                        <span class="schedule-location">${escapeHtml(schedule.location)}</span>
                    </div>
                ` : ''}
                
                ${schedule.description ? `
                    <div class="schedule-detail-item">
                        <p class="schedule-description">${escapeHtml(schedule.description.substring(0, 100))}${schedule.description.length > 100 ? '...' : ''}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="schedule-meta">
                <div class="schedule-author">
                    ${schedule.author_image ? 
                        `<img src="${schedule.author_image}" alt="${schedule.author_name}" class="author-avatar-small">` :
                        `<div class="author-avatar-small-placeholder">${schedule.author_name ? schedule.author_name[0] : '?'}</div>`
                    }
                    <span class="author-name">${escapeHtml(schedule.author_name || '알 수 없음')}</span>
                </div>
                <div class="schedule-stats">
                    ${schedule.comments_count > 0 ? `<span class="schedule-comments">💬 ${schedule.comments_count}</span>` : ''}
                    ${schedule.likes_count > 0 ? `<span class="schedule-likes">❤️ ${schedule.likes_count}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// 요일 가져오기
function getWeekday(dateString) {
    const date = new Date(dateString);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return weekdays[date.getDay()];
}

// 일정 등록 권한 확인 및 버튼 표시
function checkScheduleCreatePermission() {
    const user = getCurrentUserSafe();
    const createBtn = document.getElementById('create-schedule-btn');
    
    if (createBtn && user) {
        createBtn.style.display = canCreateSchedule() ? 'block' : 'none';
    }
}

// 일정 등록 버튼 클릭
function handleCreateSchedule() {
    if (!canCreateSchedule()) {
        alert('일정 등록 권한이 없습니다.');
        return;
    }
    renderScheduleForm();
}

async function showScheduleDetailScreen(scheduleId) {
    const screen = document.getElementById('schedules-screen');
    const container = document.getElementById('schedule-list');
    if (!screen || !container) return;
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    screen.classList.add('active');
    container.innerHTML = '<div class="content-loading">일정 로딩 중...</div>';
    try {
        const res = await apiClient.getSchedule(scheduleId);
        if (!res.success || !res.schedule) {
            container.innerHTML = '<div class="error-state">일정을 불러오지 못했습니다.</div>';
            return;
        }
        const s = res.schedule;
        const user = getCurrentUserSafe();
        const canEdit =
            user &&
            (String(user.id) === String(s.author_id) ||
                ['super_admin', 'admin'].includes(user.role));
        container.innerHTML = `
            <div class="post-detail">
                <div class="post-detail-actions" style="margin-bottom:12px">
                    <button class="btn btn-secondary btn-sm" data-action="schedule-back-list">← 목록</button>
                    ${canEdit ? `<button class="btn btn-primary btn-sm" data-action="schedule-edit" data-id="${s.id}">수정</button>` : ''}
                    ${canEdit ? `<button class="btn btn-danger btn-sm" data-action="schedule-delete" data-id="${s.id}">삭제</button>` : ''}
                </div>
                <h1 class="post-detail-title">${escapeHtml(s.title || '')}</h1>
                <div class="post-detail-meta">
                    <span>📅 ${formatDate(s.event_date, 'YYYY-MM-DD')}</span>
                    ${s.start_time ? `<span>⏰ ${s.start_time}${s.end_time ? ` - ${s.end_time}` : ''}</span>` : ''}
                    ${s.location ? `<span>📍 ${escapeHtml(s.location)}</span>` : ''}
                </div>
                ${s.description ? `<div class="post-detail-body">${escapeHtml(s.description).replace(/\n/g, '<br>')}</div>` : ''}
                <div class="post-detail-comments">
                    <h4>댓글/공감</h4>
                    <p class="text-muted">💬 ${s.comments_count || 0} · ❤️ ${s.likes_count || 0} (연동 유지)</p>
                </div>
            </div>
        `;
    } catch (_) {
        container.innerHTML = '<div class="error-state">일정을 불러오지 못했습니다.</div>';
    }
}

function renderScheduleForm(data = {}) {
    const container = document.getElementById('schedule-list');
    if (!container) return;
    container.innerHTML = `
        <form id="schedule-form" class="auth-form" data-edit-id="${data.id || ''}">
            <div class="form-group">
                <button type="button" class="btn btn-secondary btn-sm" data-action="schedule-back-list">← 목록</button>
            </div>
            <div class="form-group">
                <label for="schedule-title">제목</label>
                <input type="text" id="schedule-title" required maxlength="200" value="${escapeHtml(data.title || '')}">
            </div>
            <div class="form-group">
                <label for="schedule-date">날짜</label>
                <input type="date" id="schedule-date" required value="${(data.event_date || '').slice(0, 10)}">
            </div>
            <div class="form-group">
                <label for="schedule-start-time">시작 시간</label>
                <input type="time" id="schedule-start-time" value="${data.start_time || ''}">
            </div>
            <div class="form-group">
                <label for="schedule-end-time">종료 시간 (선택)</label>
                <input type="time" id="schedule-end-time" value="${data.end_time || ''}">
            </div>
            <div class="form-group">
                <label for="schedule-location">장소</label>
                <input type="text" id="schedule-location" value="${escapeHtml(data.location || '')}">
            </div>
            <div class="form-group">
                <label for="schedule-description">설명</label>
                <textarea id="schedule-description" rows="6">${escapeHtml(data.description || '')}</textarea>
            </div>
            <div class="inline-error-message" id="schedule-form-error"></div>
            <button type="submit" class="btn btn-primary" id="schedule-submit-btn">
                <span class="btn-text">${data.id ? '수정 저장' : '등록'}</span>
                <span class="btn-loading" style="display:none;"><span class="spinner"></span></span>
            </button>
        </form>
    `;
}

async function handleEditSchedule(scheduleId) {
    const res = await apiClient.getSchedule(scheduleId);
    if (!res.success || !res.schedule) {
        alert('일정을 불러오지 못했습니다.');
        return;
    }
    renderScheduleForm(res.schedule);
}

async function handleScheduleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const title = (document.getElementById('schedule-title')?.value || '').trim();
    const event_date = (document.getElementById('schedule-date')?.value || '').trim();
    const start_time = (document.getElementById('schedule-start-time')?.value || '').trim();
    const end_time = (document.getElementById('schedule-end-time')?.value || '').trim();
    const location = (document.getElementById('schedule-location')?.value || '').trim();
    const description = (document.getElementById('schedule-description')?.value || '').trim();
    const errId = 'schedule-form-error';
    const btn = document.getElementById('schedule-submit-btn');
    if (!title || !event_date) {
        showInlineError(errId, '제목과 날짜는 필수입니다.');
        return;
    }
    const payload = { title, event_date, start_time, end_time, location, description };
    setButtonLoading(btn, true);
    try {
        const editId = form.dataset.editId;
        const res = editId
            ? await apiClient.updateSchedule(editId, payload)
            : await apiClient.createSchedule(payload);
        if (!res.success) {
            showInlineError(errId, res.message || '저장에 실패했습니다.');
            return;
        }
        const id = editId || res.scheduleId;
        if (id) await showScheduleDetailScreen(id);
        else await loadSchedulesScreen();
    } catch (e) {
        showInlineError(errId, e.message || '저장 중 오류가 발생했습니다.');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function handleDeleteSchedule(scheduleId) {
    if (!confirm('일정을 삭제할까요?')) return;
    try {
        const res = await apiClient.deleteSchedule(scheduleId);
        if (!res.success) {
            alert(res.message || '삭제에 실패했습니다.');
            return;
        }
        await loadSchedulesScreen();
    } catch (e) {
        alert(e.message || '삭제 중 오류가 발생했습니다.');
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    const createScheduleBtn = document.getElementById('create-schedule-btn');
    if (createScheduleBtn) {
        createScheduleBtn.addEventListener('click', handleCreateSchedule);
    }

    const scheduleList = document.getElementById('schedule-list');
    if (scheduleList) {
        scheduleList.addEventListener('submit', (e) => {
            if (e.target && e.target.id === 'schedule-form') {
                handleScheduleFormSubmit(e);
            }
        });
        scheduleList.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            const action = target.dataset.action;
            const id = target.dataset.id;
            if (action === 'schedule-back-list') loadSchedulesScreen();
            if (action === 'schedule-edit' && id) handleEditSchedule(id);
            if (action === 'schedule-delete' && id) handleDeleteSchedule(id);
        });
    }
});

console.log('✅ Schedules 모듈 로드 완료 (Railway API)');
