// 일정 기능 (Railway API 연동)

let schedulesLoading = false;

const CATEGORY_LABELS = {
    event: '행사',
    meeting: '정기회의',
    training: '교육',
    holiday: '공휴일',
    other: '기타'
};

const CATEGORY_COLORS = {
    event: '#1F4FD8',
    meeting: '#059669',
    training: '#F59E0B',
    holiday: '#DC2626',
    other: '#6B7280'
};

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
        const result = await apiClient.getSchedules(false);
        if (result.success && Array.isArray(result.schedules)) {
            if (result.schedules.length === 0) {
                container.innerHTML =
                    '<div class="empty-state">등록된 일정이 없습니다.</div>';
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
    const groupedSchedules = {};

    schedules.forEach(schedule => {
        const raw = schedule.start_date || schedule.event_date || '';
        const date = raw.split('T')[0];
        if (!groupedSchedules[date]) {
            groupedSchedules[date] = [];
        }
        groupedSchedules[date].push(schedule);
    });

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
    const category = schedule.category || '';
    const categoryLabel = CATEGORY_LABELS[category] || category;
    const categoryColor = CATEGORY_COLORS[category] || '#6B7280';
    const startRaw = schedule.start_date || schedule.event_date || '';
    const endRaw = schedule.end_date || '';

    // 시간 추출
    let timeStr = '';
    if (startRaw.includes('T')) {
        const startTime = startRaw.split('T')[1]?.substring(0, 5);
        if (startTime && startTime !== '00:00') {
            timeStr = startTime;
            if (endRaw.includes('T')) {
                const endTime = endRaw.split('T')[1]?.substring(0, 5);
                if (endTime && endTime !== '00:00') {
                    timeStr += ` - ${endTime}`;
                }
            }
        }
    }

    return `
        <div class="schedule-card" onclick="navigateTo('/schedules/${schedule.id}')">
            <div class="schedule-header">
                ${categoryLabel ? `<span class="badge" style="background:${categoryColor}15;color:${categoryColor};font-size:11px;padding:2px 8px;border-radius:4px;">${categoryLabel}</span>` : ''}
                ${isNew ? '<span class="badge badge-new">N</span>' : ''}
            </div>

            <h3 class="schedule-title">${escapeHtml(schedule.title)}</h3>

            <div class="schedule-details">
                ${timeStr ? `
                    <div class="schedule-detail-item">
                        <span class="schedule-icon">⏰</span>
                        <span class="schedule-time">${timeStr}</span>
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
            (String(user.id) === String(s.author_id || s.created_by) ||
                ['super_admin', 'admin'].includes(user.role));

        const category = s.category || '';
        const categoryLabel = CATEGORY_LABELS[category] || category;
        const categoryColor = CATEGORY_COLORS[category] || '#6B7280';
        const startRaw = s.start_date || s.event_date || '';
        const endRaw = s.end_date || '';

        let dateStr = '';
        let timeStr = '';
        if (startRaw) {
            const startDt = new Date(startRaw);
            dateStr = `${startDt.getFullYear()}년 ${startDt.getMonth()+1}월 ${startDt.getDate()}일 (${getWeekday(startRaw)})`;
            const sh = startDt.getHours(), sm = startDt.getMinutes();
            if (sh !== 0 || sm !== 0) {
                timeStr = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`;
            }
            if (endRaw) {
                const endDt = new Date(endRaw);
                if (endDt.toDateString() !== startDt.toDateString()) {
                    dateStr += ` ~ ${endDt.getFullYear()}년 ${endDt.getMonth()+1}월 ${endDt.getDate()}일 (${getWeekday(endRaw)})`;
                }
                const eh = endDt.getHours(), em = endDt.getMinutes();
                if (eh !== 0 || em !== 0) {
                    const endTimeStr = `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`;
                    timeStr = timeStr ? `${timeStr} ~ ${endTimeStr}` : endTimeStr;
                }
            }
        }

        container.innerHTML = `
            <div class="post-detail">
                <div class="post-detail-actions" style="margin-bottom:12px">
                    <button class="btn btn-secondary btn-sm" data-action="schedule-back-list">← 목록</button>
                    ${canEdit ? `<button class="btn btn-primary btn-sm" data-action="schedule-edit" data-id="${s.id}">수정</button>` : ''}
                    ${canEdit ? `<button class="btn btn-danger btn-sm" data-action="schedule-delete" data-id="${s.id}">삭제</button>` : ''}
                </div>
                ${categoryLabel ? `<span class="badge" style="background:${categoryColor}15;color:${categoryColor};font-size:12px;padding:3px 10px;border-radius:12px;margin-bottom:8px;display:inline-block;">${categoryLabel}</span>` : ''}
                <h1 class="post-detail-title">${escapeHtml(s.title || '')}</h1>
                <div class="post-detail-meta">
                    ${dateStr ? `<span>📅 ${dateStr}</span>` : ''}
                    ${timeStr ? `<span>⏰ ${timeStr}</span>` : ''}
                    ${s.location ? `<span>📍 ${escapeHtml(s.location)}</span>` : ''}
                    ${s.author_name ? `<span>👤 ${escapeHtml(s.author_name)}</span>` : ''}
                </div>
                ${s.description ? `<div class="post-detail-body">${escapeHtml(s.description).replace(/\n/g, '<br>')}</div>` : ''}
            </div>
        `;
    } catch (_) {
        container.innerHTML = '<div class="error-state">일정을 불러오지 못했습니다.</div>';
    }
}

function renderScheduleForm(data = {}) {
    const container = document.getElementById('schedule-list');
    if (!container) return;
    const isEdit = !!data.id;
    const startRaw = data.start_date || data.event_date || '';
    const endRaw = data.end_date || '';
    const startDate = startRaw ? startRaw.split('T')[0] : '';
    const endDate = endRaw ? endRaw.split('T')[0] : '';
    let startTime = data.start_time || '';
    let endTime = data.end_time || '';
    if (!startTime && startRaw.includes('T')) {
        const t = startRaw.split('T')[1]?.substring(0, 5);
        if (t && t !== '00:00') startTime = t;
    }
    if (!endTime && endRaw.includes('T')) {
        const t = endRaw.split('T')[1]?.substring(0, 5);
        if (t && t !== '00:00') endTime = t;
    }
    const currentCategory = data.category || 'event';

    const categoryOptions = Object.entries(CATEGORY_LABELS)
        .map(([k, v]) => `<option value="${k}" ${k === currentCategory ? 'selected' : ''}>${v}</option>`)
        .join('');

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
                <label for="schedule-category">분류</label>
                <select id="schedule-category">${categoryOptions}</select>
            </div>
            <div class="form-group">
                <label for="schedule-start-date">시작일</label>
                <input type="date" id="schedule-start-date" required value="${startDate}">
            </div>
            <div class="form-group">
                <label for="schedule-start-time">시작 시간</label>
                <input type="time" id="schedule-start-time" value="${startTime}">
            </div>
            <div class="form-group">
                <label for="schedule-end-date">종료일 (선택)</label>
                <input type="date" id="schedule-end-date" value="${endDate}">
            </div>
            <div class="form-group">
                <label for="schedule-end-time">종료 시간 (선택)</label>
                <input type="time" id="schedule-end-time" value="${endTime}">
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
                <span class="btn-text">${isEdit ? '수정 저장' : '등록'}</span>
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
    const startDate = (document.getElementById('schedule-start-date')?.value || '').trim();
    const startTime = (document.getElementById('schedule-start-time')?.value || '').trim();
    const endDate = (document.getElementById('schedule-end-date')?.value || '').trim();
    const endTime = (document.getElementById('schedule-end-time')?.value || '').trim();
    const category = (document.getElementById('schedule-category')?.value || '').trim();
    const location = (document.getElementById('schedule-location')?.value || '').trim();
    const description = (document.getElementById('schedule-description')?.value || '').trim();
    const errId = 'schedule-form-error';
    const btn = document.getElementById('schedule-submit-btn');

    if (!title || !startDate) {
        showInlineError(errId, '제목과 시작일은 필수입니다.');
        return;
    }

    // ISO 날짜+시간 조합
    const start_date = startTime ? `${startDate}T${startTime}:00` : `${startDate}T00:00:00`;
    const end_date = endDate ? (endTime ? `${endDate}T${endTime}:00` : `${endDate}T00:00:00`) : null;

    const payload = { title, start_date, end_date, location, description, category };
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
