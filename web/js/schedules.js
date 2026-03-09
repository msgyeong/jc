// 일정 기능 - 캘린더 + 일정 목록 (Railway API 연동)

let calYear, calMonth, calSelectedDate;
let calSchedules = [];
let schedulesLoading = false;

const CATEGORY_LABELS = {
    event: '행사', meeting: '정기회의', training: '교육', holiday: '공휴일', other: '기타'
};
const CATEGORY_COLORS = {
    event: '#1F4FD8', meeting: '#059669', training: '#F59E0B', holiday: '#DC2626', other: '#6B7280'
};

function getCurrentUserSafe() {
    try {
        return typeof getCurrentUser === 'function'
            ? getCurrentUser()
            : JSON.parse(localStorage.getItem('user_info') || 'null');
    } catch (_) { return null; }
}

function canCreateSchedule() {
    const user = getCurrentUserSafe();
    return !!(user && ['super_admin', 'admin'].includes(user.role));
}

// ========== 캘린더 로직 ==========

async function loadSchedulesScreen() {
    const now = new Date();
    if (!calYear) calYear = now.getFullYear();
    if (!calMonth) calMonth = now.getMonth();
    if (!calSelectedDate) calSelectedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    checkScheduleCreatePermission();
    await loadMonthSchedules();
    renderCalendar();
    renderDaySchedules();
}

async function loadMonthSchedules() {
    if (schedulesLoading) return;
    schedulesLoading = true;
    try {
        const result = await apiClient.getSchedulesByMonth(calYear, calMonth + 1);
        if (result.success && Array.isArray(result.schedules)) {
            calSchedules = result.schedules;
        } else {
            calSchedules = [];
        }
    } catch (e) {
        console.error('월별 일정 로드 실패:', e);
        calSchedules = [];
    } finally {
        schedulesLoading = false;
    }
}

function renderCalendar() {
    const titleEl = document.getElementById('cal-title');
    const gridEl = document.getElementById('cal-grid');
    if (!titleEl || !gridEl) return;

    titleEl.textContent = `${calYear}년 ${calMonth + 1}월`;

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const lastDate = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    // 일정이 있는 날짜 Set
    const eventDates = new Set();
    const eventCategoriesByDate = {};
    calSchedules.forEach(s => {
        const d = (s.start_date || '').split('T')[0];
        if (d) {
            eventDates.add(d);
            if (!eventCategoriesByDate[d]) eventCategoriesByDate[d] = new Set();
            eventCategoriesByDate[d].add(s.category || 'other');
        }
    });

    let html = '';

    // 빈 칸 (이전 달)
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="cal-day empty"></div>';
    }

    // 날짜
    for (let d = 1; d <= lastDate; d++) {
        const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === calSelectedDate;
        const hasEvent = eventDates.has(dateStr);
        const dayOfWeek = new Date(calYear, calMonth, d).getDay();

        let classes = 'cal-day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (hasEvent) classes += ' has-event';
        if (dayOfWeek === 0) classes += ' sun';
        if (dayOfWeek === 6) classes += ' sat';

        let dots = '';
        if (hasEvent) {
            const cats = Array.from(eventCategoriesByDate[dateStr] || []).slice(0, 3);
            dots = '<div class="cal-dots">' + cats.map(c =>
                `<span class="cal-dot" style="background:${CATEGORY_COLORS[c] || '#6B7280'}"></span>`
            ).join('') + '</div>';
        }

        html += `<div class="${classes}" data-date="${dateStr}">
            <span class="cal-day-num">${d}</span>
            ${dots}
        </div>`;
    }

    gridEl.innerHTML = html;
}

function renderDaySchedules() {
    const headerEl = document.getElementById('schedule-day-header');
    const listEl = document.getElementById('schedule-list');
    if (!headerEl || !listEl) return;

    if (!calSelectedDate) {
        headerEl.innerHTML = '';
        listEl.innerHTML = '<div class="empty-state">날짜를 선택하세요</div>';
        return;
    }

    const selDate = new Date(calSelectedDate);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    headerEl.innerHTML = `<span class="schedule-day-text">${selDate.getMonth()+1}월 ${selDate.getDate()}일 (${weekdays[selDate.getDay()]})</span>`;

    const daySchedules = calSchedules.filter(s => {
        const d = (s.start_date || '').split('T')[0];
        return d === calSelectedDate;
    });

    if (daySchedules.length === 0) {
        listEl.innerHTML = '<div class="empty-state-mini">이 날짜에 일정이 없습니다.</div>';
        return;
    }

    listEl.innerHTML = daySchedules.map(s => createScheduleCard(s)).join('');
}

function createScheduleCard(schedule) {
    const category = schedule.category || 'other';
    const categoryLabel = CATEGORY_LABELS[category] || category;
    const categoryColor = CATEGORY_COLORS[category] || '#6B7280';
    const startRaw = schedule.start_date || '';
    const endRaw = schedule.end_date || '';

    let timeStr = '';
    if (startRaw.includes('T')) {
        const st = startRaw.split('T')[1]?.substring(0, 5);
        if (st && st !== '00:00') {
            timeStr = st;
            if (endRaw.includes('T')) {
                const et = endRaw.split('T')[1]?.substring(0, 5);
                if (et && et !== '00:00') timeStr += ` ~ ${et}`;
            }
        }
    }

    return `
        <div class="schedule-card-v2" onclick="navigateTo('/schedules/${schedule.id}')" style="border-left: 4px solid ${categoryColor}">
            <div class="schedule-card-top">
                <span class="schedule-cat-badge" style="background:${categoryColor}15;color:${categoryColor}">${categoryLabel}</span>
                ${timeStr ? `<span class="schedule-time-badge">${timeStr}</span>` : ''}
            </div>
            <h3 class="schedule-card-title">${escapeHtml(schedule.title)}</h3>
            ${schedule.location ? `<div class="schedule-card-loc">${escapeHtml(schedule.location)}</div>` : ''}
            ${schedule.description ? `<p class="schedule-card-desc">${escapeHtml(schedule.description.substring(0, 80))}${schedule.description.length > 80 ? '...' : ''}</p>` : ''}
        </div>
    `;
}

// ========== 상세/등록/수정/삭제 ==========

async function showScheduleDetailScreen(scheduleId) {
    const screen = document.getElementById('schedules-screen');
    const container = document.getElementById('schedule-list');
    const calContainer = document.getElementById('calendar-container');
    const dayHeader = document.getElementById('schedule-day-header');
    if (!screen || !container) return;

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
    if (calContainer) calContainer.style.display = 'none';
    if (dayHeader) dayHeader.style.display = 'none';
    container.innerHTML = '<div class="content-loading">일정 로딩 중...</div>';

    try {
        const res = await apiClient.getSchedule(scheduleId);
        if (!res.success || !res.schedule) {
            container.innerHTML = '<div class="error-state">일정을 불러오지 못했습니다.</div>';
            return;
        }
        const s = res.schedule;
        const user = getCurrentUserSafe();
        const canEdit = user && (String(user.id) === String(s.author_id || s.created_by) || ['super_admin', 'admin'].includes(user.role));

        const category = s.category || '';
        const categoryLabel = CATEGORY_LABELS[category] || category;
        const categoryColor = CATEGORY_COLORS[category] || '#6B7280';
        const startRaw = s.start_date || '';
        const endRaw = s.end_date || '';
        const weekdays = ['일','월','화','수','목','금','토'];

        let dateStr = '', timeStr = '';
        if (startRaw) {
            const sd = new Date(startRaw);
            dateStr = `${sd.getFullYear()}년 ${sd.getMonth()+1}월 ${sd.getDate()}일 (${weekdays[sd.getDay()]})`;
            const sh = sd.getHours(), sm = sd.getMinutes();
            if (sh !== 0 || sm !== 0) timeStr = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`;
            if (endRaw) {
                const ed = new Date(endRaw);
                if (ed.toDateString() !== sd.toDateString()) {
                    dateStr += ` ~ ${ed.getFullYear()}년 ${ed.getMonth()+1}월 ${ed.getDate()}일 (${weekdays[ed.getDay()]})`;
                }
                const eh = ed.getHours(), em = ed.getMinutes();
                if (eh !== 0 || em !== 0) {
                    const endT = `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`;
                    timeStr = timeStr ? `${timeStr} ~ ${endT}` : endT;
                }
            }
        }

        container.innerHTML = `
            <div class="detail-view">
                <button class="btn-back" data-action="schedule-back-list">← 목록으로</button>
                <div class="detail-header">
                    <span class="detail-cat-badge" style="background:${categoryColor}15;color:${categoryColor}">${categoryLabel}</span>
                    ${canEdit ? `<div class="detail-actions">
                        <button class="btn-icon" data-action="schedule-edit" data-id="${s.id}" title="수정">&#9998;</button>
                        <button class="btn-icon btn-icon-danger" data-action="schedule-delete" data-id="${s.id}" title="삭제">&#128465;</button>
                    </div>` : ''}
                </div>
                <h1 class="detail-title">${escapeHtml(s.title || '')}</h1>
                <div class="detail-meta-list">
                    ${dateStr ? `<div class="detail-meta-item"><span class="detail-meta-icon">&#128197;</span><span>${dateStr}</span></div>` : ''}
                    ${timeStr ? `<div class="detail-meta-item"><span class="detail-meta-icon">&#9200;</span><span>${timeStr}</span></div>` : ''}
                    ${s.location ? `<div class="detail-meta-item"><span class="detail-meta-icon">&#128205;</span><span>${escapeHtml(s.location)}</span></div>` : ''}
                    ${s.author_name ? `<div class="detail-meta-item"><span class="detail-meta-icon">&#128100;</span><span>${escapeHtml(s.author_name)}</span></div>` : ''}
                </div>
                ${s.description ? `<div class="detail-body">${escapeHtml(s.description).replace(/\n/g, '<br>')}</div>` : ''}
            </div>
        `;
    } catch (_) {
        container.innerHTML = '<div class="error-state">일정을 불러오지 못했습니다.</div>';
    }
}

function backToScheduleList() {
    const calContainer = document.getElementById('calendar-container');
    const dayHeader = document.getElementById('schedule-day-header');
    if (calContainer) calContainer.style.display = '';
    if (dayHeader) dayHeader.style.display = '';
    renderCalendar();
    renderDaySchedules();
    checkScheduleCreatePermission();
}

function checkScheduleCreatePermission() {
    const createBtn = document.getElementById('create-schedule-btn');
    if (createBtn) createBtn.style.display = canCreateSchedule() ? 'flex' : 'none';
}

function handleCreateSchedule() {
    if (!canCreateSchedule()) return;
    const calContainer = document.getElementById('calendar-container');
    const dayHeader = document.getElementById('schedule-day-header');
    if (calContainer) calContainer.style.display = 'none';
    if (dayHeader) dayHeader.style.display = 'none';
    renderScheduleForm();
}

function renderScheduleForm(data = {}) {
    const container = document.getElementById('schedule-list');
    if (!container) return;
    const isEdit = !!data.id;
    const startRaw = data.start_date || '';
    const endRaw = data.end_date || '';
    const startDate = startRaw ? startRaw.split('T')[0] : (calSelectedDate || '');
    const endDate = endRaw ? endRaw.split('T')[0] : '';
    let startTime = '', endTime = '';
    if (startRaw.includes('T')) { const t = startRaw.split('T')[1]?.substring(0,5); if (t && t !== '00:00') startTime = t; }
    if (endRaw.includes('T')) { const t = endRaw.split('T')[1]?.substring(0,5); if (t && t !== '00:00') endTime = t; }
    const currentCategory = data.category || 'event';

    const categoryOptions = Object.entries(CATEGORY_LABELS)
        .map(([k, v]) => `<option value="${k}" ${k === currentCategory ? 'selected' : ''}>${v}</option>`).join('');

    container.innerHTML = `
        <form id="schedule-form" class="form-card" data-edit-id="${data.id || ''}">
            <button type="button" class="btn-back" data-action="schedule-back-list">← 목록으로</button>
            <h2 class="form-card-title">${isEdit ? '일정 수정' : '새 일정 등록'}</h2>
            <div class="form-group"><label>제목 *</label><input type="text" id="schedule-title" required maxlength="200" value="${escapeHtml(data.title || '')}" placeholder="일정 제목을 입력하세요"></div>
            <div class="form-group"><label>분류</label><select id="schedule-category">${categoryOptions}</select></div>
            <div class="form-row">
                <div class="form-group flex-1"><label>시작일 *</label><input type="date" id="schedule-start-date" required value="${startDate}"></div>
                <div class="form-group flex-1"><label>시작 시간</label><input type="time" id="schedule-start-time" value="${startTime}"></div>
            </div>
            <div class="form-row">
                <div class="form-group flex-1"><label>종료일</label><input type="date" id="schedule-end-date" value="${endDate}"></div>
                <div class="form-group flex-1"><label>종료 시간</label><input type="time" id="schedule-end-time" value="${endTime}"></div>
            </div>
            <div class="form-group"><label>장소</label><input type="text" id="schedule-location" value="${escapeHtml(data.location || '')}" placeholder="장소를 입력하세요"></div>
            <div class="form-group"><label>설명</label><textarea id="schedule-description" rows="5" placeholder="일정 설명을 입력하세요">${escapeHtml(data.description || '')}</textarea></div>
            <div class="inline-error-message" id="schedule-form-error"></div>
            <button type="submit" class="btn btn-primary btn-full" id="schedule-submit-btn">
                <span class="btn-text">${isEdit ? '수정 저장' : '등록'}</span>
                <span class="btn-loading" style="display:none;"><span class="spinner"></span></span>
            </button>
        </form>
    `;
}

async function handleEditSchedule(scheduleId) {
    const res = await apiClient.getSchedule(scheduleId);
    if (!res.success || !res.schedule) { alert('일정을 불러오지 못했습니다.'); return; }
    const calContainer = document.getElementById('calendar-container');
    const dayHeader = document.getElementById('schedule-day-header');
    if (calContainer) calContainer.style.display = 'none';
    if (dayHeader) dayHeader.style.display = 'none';
    renderScheduleForm(res.schedule);
}

async function handleScheduleFormSubmit(e) {
    e.preventDefault();
    const title = (document.getElementById('schedule-title')?.value || '').trim();
    const startDate = (document.getElementById('schedule-start-date')?.value || '').trim();
    const startTime = (document.getElementById('schedule-start-time')?.value || '').trim();
    const endDate = (document.getElementById('schedule-end-date')?.value || '').trim();
    const endTime = (document.getElementById('schedule-end-time')?.value || '').trim();
    const category = (document.getElementById('schedule-category')?.value || '').trim();
    const location = (document.getElementById('schedule-location')?.value || '').trim();
    const description = (document.getElementById('schedule-description')?.value || '').trim();
    const btn = document.getElementById('schedule-submit-btn');

    if (!title || !startDate) { showInlineError('schedule-form-error', '제목과 시작일은 필수입니다.'); return; }

    const start_date = startTime ? `${startDate}T${startTime}:00` : `${startDate}T00:00:00`;
    const end_date = endDate ? (endTime ? `${endDate}T${endTime}:00` : `${endDate}T00:00:00`) : null;
    const payload = { title, start_date, end_date, location, description, category };

    setButtonLoading(btn, true);
    try {
        const editId = e.target.dataset.editId;
        const res = editId ? await apiClient.updateSchedule(editId, payload) : await apiClient.createSchedule(payload);
        if (!res.success) { showInlineError('schedule-form-error', res.message || '저장에 실패했습니다.'); return; }
        // 저장 후 캘린더로 돌아가기
        calSelectedDate = startDate;
        calYear = new Date(startDate).getFullYear();
        calMonth = new Date(startDate).getMonth();
        await loadMonthSchedules();
        backToScheduleList();
    } catch (err) {
        showInlineError('schedule-form-error', err.message || '저장 중 오류가 발생했습니다.');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function handleDeleteSchedule(scheduleId) {
    if (!confirm('일정을 삭제할까요?')) return;
    try {
        const res = await apiClient.deleteSchedule(scheduleId);
        if (!res.success) { alert(res.message || '삭제에 실패했습니다.'); return; }
        await loadMonthSchedules();
        backToScheduleList();
    } catch (e) { alert(e.message || '삭제 중 오류가 발생했습니다.'); }
}

// ========== 이벤트 바인딩 ==========

document.addEventListener('DOMContentLoaded', () => {
    // 캘린더 네비게이션
    document.getElementById('cal-prev')?.addEventListener('click', async () => {
        calMonth--;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        await loadMonthSchedules();
        renderCalendar();
        renderDaySchedules();
    });
    document.getElementById('cal-next')?.addEventListener('click', async () => {
        calMonth++;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        await loadMonthSchedules();
        renderCalendar();
        renderDaySchedules();
    });

    // 오늘 버튼
    document.getElementById('schedule-today-btn')?.addEventListener('click', async () => {
        const now = new Date();
        calYear = now.getFullYear();
        calMonth = now.getMonth();
        calSelectedDate = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        await loadMonthSchedules();
        backToScheduleList();
    });

    // 날짜 클릭 (이벤트 위임)
    document.getElementById('cal-grid')?.addEventListener('click', (e) => {
        const dayEl = e.target.closest('.cal-day:not(.empty)');
        if (!dayEl) return;
        calSelectedDate = dayEl.dataset.date;
        renderCalendar();
        renderDaySchedules();
    });

    // 일정 생성 버튼
    document.getElementById('create-schedule-btn')?.addEventListener('click', handleCreateSchedule);

    // 일정 목록 이벤트 위임 (폼 제출, 버튼 클릭)
    const scheduleList = document.getElementById('schedule-list');
    if (scheduleList) {
        scheduleList.addEventListener('submit', (e) => {
            if (e.target && e.target.id === 'schedule-form') handleScheduleFormSubmit(e);
        });
        scheduleList.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            const action = target.dataset.action;
            const id = target.dataset.id;
            if (action === 'schedule-back-list') backToScheduleList();
            if (action === 'schedule-edit' && id) handleEditSchedule(id);
            if (action === 'schedule-delete' && id) handleDeleteSchedule(id);
        });
    }
});

console.log('✅ Schedules 모듈 로드 완료 (캘린더 + Railway API)');
