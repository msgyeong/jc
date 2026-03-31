// 일정 기능 - 캘린더 + 일정 목록 (Railway API 연동)

let calYear, calMonth, calSelectedDate;
let calSchedules = [];
let schedulesLoading = false;

const CATEGORY_LABELS = {
    event: '행사', meeting: '회의', training: '교육', holiday: '휴일', other: '기타'
};
const CATEGORY_COLORS = {
    event: '#2563EB', meeting: '#F59E0B', training: '#059669', holiday: '#DC2626', birthday: '#EC4899', other: '#6B7280'
};
const CATEGORY_BADGE_CLASS = {
    event: 'badge-event', meeting: 'badge-meeting', training: 'badge-training', holiday: 'badge-holiday', other: 'badge-other'
};

// getCurrentUserSafe → utils.js로 통합됨

function canCreateSchedule() {
    const user = getCurrentUserSafe();
    return !!(user && ['super_admin', 'admin'].includes(user.role));
}

// ========== 캘린더 로직 ==========

async function loadSchedulesScreen() {
    // 상세/폼 화면이 활성화 중이면 목록 로드 스킵 (덮어쓰여지는 것 방지)
    if (_scheduleDetailActive) return;
    if (_scheduleFormActive) return;

    const now = new Date();
    if (calYear == null) calYear = now.getFullYear();
    if (calMonth == null) calMonth = now.getMonth();
    if (!calSelectedDate) calSelectedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    // 캘린더/헤더 복원 (상세에서 돌아왔을 때)
    var calContainer = document.getElementById('calendar-container');
    var dayHeader = document.getElementById('schedule-day-header');
    if (calContainer) calContainer.style.display = '';
    if (dayHeader) dayHeader.style.display = '';

    checkScheduleCreatePermission();
    await loadMonthSchedules();
    renderCalendar();
    renderDaySchedules();
}

async function loadMonthSchedules() {
    if (schedulesLoading) return;
    schedulesLoading = true;
    try {
        // 공통 일정 로드
        const result = await apiClient.getSchedulesByMonth(calYear, calMonth + 1);
        const schedules = result.schedules || (result.data && (result.data.schedules || result.data.items)) || [];
        calSchedules = (result.success && Array.isArray(schedules)) ? schedules : [];

        // 생일 회원 병합 (캘린더에 케이크 이모티콘 표시)
        var birthdays = result.birthdays || [];
        birthdays.forEach(function(b) {
            calSchedules.push(b);
        });

        // 내가 속한 그룹 일정 병합 (그룹 멤버만 볼 수 있음)
        try {
            const groupResult = await apiClient.request('/group-board/my-schedules/all?year=' + calYear + '&month=' + (calMonth + 1));
            if (groupResult.success && Array.isArray(groupResult.schedules)) {
                groupResult.schedules.forEach(function(gs) {
                    gs._isGroupSchedule = true;
                    gs._groupName = gs.group_name || '';
                    calSchedules.push(gs);
                });
            }
        } catch (ge) {
            console.log('그룹 일정 로드 건너뜀:', ge.message);
        }

        // 내가 속한 소모임 일정 병합
        try {
            const clubResult = await apiClient.request('/clubs/my-schedules/all?year=' + calYear + '&month=' + (calMonth + 1));
            if (clubResult.success && Array.isArray(clubResult.schedules)) {
                clubResult.schedules.forEach(function(cs) {
                    cs._isClubSchedule = true;
                    cs._clubName = cs.club_name || '';
                    calSchedules.push(cs);
                });
            }
        } catch (ce) {
            console.log('소모임 일정 로드 건너뜀:', ce.message);
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

    const eventDates = new Set();
    const eventCategoriesByDate = {};
    const birthdayDates = new Set();
    calSchedules.forEach(s => {
        const d = (s.start_date || '').split('T')[0];
        if (d) {
            eventDates.add(d);
            if (!eventCategoriesByDate[d]) eventCategoriesByDate[d] = new Set();
            eventCategoriesByDate[d].add(s.category || 'other');
            if (s.is_birthday) birthdayDates.add(d);
        }
    });

    let html = '';
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';

    for (let d = 1; d <= lastDate; d++) {
        const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === calSelectedDate;
        const hasEvent = eventDates.has(dateStr);
        const hasBirthday = birthdayDates.has(dateStr);
        const dayOfWeek = new Date(calYear, calMonth, d).getDay();

        let classes = 'cal-day';
        if (isToday) classes += ' today';
        if (isSelected) classes += ' selected';
        if (hasEvent) classes += ' has-event';
        if (hasBirthday) classes += ' has-birthday';
        if (dayOfWeek === 0) classes += ' sun';
        if (dayOfWeek === 6) classes += ' sat';

        let birthdayEmoji = hasBirthday ? '<span class="cal-birthday">🎂</span>' : '';

        let dots = '';
        if (hasEvent) {
            const cats = Array.from(eventCategoriesByDate[dateStr] || []).filter(c => c !== 'birthday').slice(0, 3);
            if (cats.length > 0) {
                dots = '<div class="cal-dots">' + cats.map(c =>
                    `<span class="cal-dot" style="background:${CATEGORY_COLORS[c] || 'var(--text-hint)'}"></span>`
                ).join('') + '</div>';
            }
        }

        html += `<div class="${classes}" data-date="${dateStr}"><span class="cal-day-num">${d}</span>${birthdayEmoji}${dots}</div>`;
    }

    gridEl.innerHTML = html;
}

function renderDaySchedules() {
    const headerEl = document.getElementById('schedule-day-header');
    const listEl = document.getElementById('schedule-list');
    if (!headerEl || !listEl) return;

    if (!calSelectedDate) {
        headerEl.innerHTML = '';
        listEl.innerHTML = renderEmptyState('calendar', '날짜를 선택하세요');
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
        listEl.innerHTML = '<div class="empty-state-mini">' + renderEmptyState('calendar', '이 날짜에 일정이 없습니다') + '</div>';
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
    const isGroup = schedule._isGroupSchedule;
    const groupName = schedule._groupName || '';
    const isClub = schedule._isClubSchedule;
    const clubName = schedule._clubName || '';

    let timeStr = '';
    if (startRaw) {
        const sd = new Date(startRaw);
        const sh = sd.getHours(), sm = sd.getMinutes();
        if (sh !== 0 || sm !== 0) {
            const st = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`;
            timeStr = st;
            if (endRaw) {
                const ed = new Date(endRaw);
                const eh = ed.getHours(), em = ed.getMinutes();
                if (eh !== 0 || em !== 0) {
                    timeStr += ` ~ ${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`;
                }
            }
        }
    }

    const clickHandler = isClub ? ''
        : isGroup ? `onclick="showGroupScheduleDetail(${schedule.id}, ${schedule.group_id})"`
        : `onclick="navigateTo('/schedules/${schedule.id}')"`;

    return `
        <div class="schedule-card-v2" ${clickHandler} style="${clickHandler ? 'cursor:pointer;' : ''}border-left: 4px solid ${isClub ? '#8B5CF6' : categoryColor}">
            <div class="schedule-card-top">
                <span class="schedule-cat-badge" style="background:${categoryColor}15;color:${categoryColor}">${categoryLabel}</span>
                ${isGroup ? `<span class="schedule-group-badge">${escapeHtml(groupName)}</span>` : ''}
                ${isClub ? `<span class="schedule-group-badge" style="background:#8B5CF615;color:#8B5CF6">${escapeHtml(clubName)}</span>` : ''}
                ${timeStr ? `<span class="schedule-time-badge">${timeStr}</span>` : ''}
            </div>
            <h3 class="schedule-card-title">${escapeHtml(schedule.title)}</h3>
            ${schedule.location ? `<div class="schedule-card-loc">${escapeHtml(schedule.location)}</div>` : ''}
            ${schedule.description ? `<p class="schedule-card-desc">${escapeHtml(schedule.description.substring(0, 80))}${schedule.description.length > 80 ? '...' : ''}</p>` : ''}
        </div>
    `;
}

// ========== 일정 상세 (M-04) ==========

let scheduleDropdownOpen = false;

var _scheduleDetailActive = false;
var _scheduleFormActive = false;

async function showScheduleDetailScreen(scheduleId) {
    const screen = document.getElementById('schedules-screen');
    const container = document.getElementById('schedule-list');
    const calContainer = document.getElementById('calendar-container');
    const dayHeader = document.getElementById('schedule-day-header');
    if (!screen || !container) return;

    _scheduleDetailActive = true;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
    if (calContainer) calContainer.style.display = 'none';
    if (dayHeader) dayHeader.style.display = 'none';
    container.innerHTML = renderSkeleton('schedule-detail');

    // history state 기록 — popstate에서 일정 목록으로 돌아가기 위함
    if (typeof pushRoute === 'function') pushRoute('schedule-detail', { scheduleId: scheduleId });

    // FAB 숨김
    const createBtn = document.getElementById('create-schedule-btn');
    if (createBtn) createBtn.style.display = 'none';

    try {
        const res = await apiClient.getSchedule(scheduleId);
        if (!res.success || !res.schedule) {
            _scheduleDetailActive = false;
            container.innerHTML = renderErrorState('일정 정보를 불러올 수 없습니다', '', 'showScheduleDetailScreen(' + scheduleId + ')');
            return;
        }
        const s = res.schedule;

        // 일정 읽음 → 배지 갱신
        if (typeof updateNavBadges === 'function') updateNavBadges();

        const user = getCurrentUserSafe();
        const canEdit = user && (String(user.id) === String(s.author_id || s.created_by) || ['super_admin', 'admin'].includes(user.role));
        const hasScheduleManage = typeof hasMobilePermission === 'function' && hasMobilePermission('schedule_manage');
        const canManage = canEdit || hasScheduleManage;

        const category = s.category || 'other';
        const categoryLabel = CATEGORY_LABELS[category] || category;
        const badgeClass = CATEGORY_BADGE_CLASS[category] || 'badge-other';
        const weekdays = ['일','월','화','수','목','금','토'];

        // 날짜/시간 포맷
        const startRaw = s.start_date || '';
        const endRaw = s.end_date || '';
        let dateDisplay = '', timeDisplay = '', isAllDay = false;

        if (startRaw) {
            const sd = new Date(startRaw);
            dateDisplay = `${sd.getFullYear()}.${String(sd.getMonth()+1).padStart(2,'0')}.${String(sd.getDate()).padStart(2,'0')} (${weekdays[sd.getDay()]})`;
            const sh = sd.getHours(), sm = sd.getMinutes();
            if (sh === 0 && sm === 0) {
                isAllDay = true;
            } else {
                timeDisplay = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`;
            }
            if (endRaw) {
                const ed = new Date(endRaw);
                if (ed.toDateString() !== sd.toDateString()) {
                    dateDisplay += ` ~ ${ed.getFullYear()}.${String(ed.getMonth()+1).padStart(2,'0')}.${String(ed.getDate()).padStart(2,'0')} (${weekdays[ed.getDay()]})`;
                }
                const eh = ed.getHours(), em = ed.getMinutes();
                if (eh !== 0 || em !== 0) {
                    const endT = `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`;
                    timeDisplay = timeDisplay ? `${timeDisplay} ~ ${endT}` : endT;
                    isAllDay = false;
                }
            }
        }

        // 등록일
        const createdAt = s.created_at ? formatDate(s.created_at) + ' 등록' : '';

        container.innerHTML = `
            <div class="detail-view schedule-detail">
                <button class="btn-back" data-action="schedule-back-list">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                    목록으로
                </button>

                <!-- 기본 정보 -->
                <div class="schedule-detail-section">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start">
                        <span class="schedule-category-badge ${badgeClass}">${categoryLabel}</span>
                        ${canManage ? `<div style="position:relative">
                            <button class="schedule-more-btn" onclick="toggleScheduleDropdown(event)" style="color:var(--text-hint)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                            </button>
                            <div class="schedule-dropdown" id="schedule-dropdown">
                                ${canEdit ? `<button class="schedule-dropdown-item" data-action="schedule-edit" data-id="${s.id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    수정
                                </button>
                                <div class="schedule-dropdown-divider"></div>` : ''}
                                <button class="schedule-dropdown-item schedule-dropdown-item--danger" data-action="${canEdit ? 'schedule-delete' : 'schedule-admin-delete'}" data-id="${s.id}">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    삭제
                                </button>
                            </div>
                        </div>` : ''}
                    </div>
                    <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);line-height:1.4;margin-top:4px">${escapeHtml(s.title || '')}</h2>

                    <!-- 정보 행 -->
                    <div class="schedule-info-row" style="margin-top:16px">
                        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span class="schedule-info-text date">${dateDisplay}${isAllDay ? '<span class="schedule-allday-badge">종일</span>' : ''}</span>
                    </div>
                    ${timeDisplay ? `<div class="schedule-info-row">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span class="schedule-info-text">${timeDisplay}</span>
                    </div>` : ''}
                    ${s.location ? `<div class="schedule-info-row">
                        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span class="schedule-info-text" style="flex:1">${escapeHtml(s.location)}</span>
                        <span class="schedule-map-icon" onclick="window.open('https://map.naver.com/v5/search/'+encodeURIComponent('${escapeHtml(s.location)}'),'_blank')" title="지도에서 보기">
                            <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </span>
                    </div>` : ''}
                    ${s.author_name ? `<div class="schedule-info-row">
                        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span class="schedule-info-text sub">${escapeHtml(s.author_name)}</span>
                    </div>` : ''}
                    ${createdAt ? `<div class="schedule-info-row">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span class="schedule-info-text sub">${createdAt}</span>
                    </div>` : ''}
                </div>

                <!-- 설명 -->
                ${s.description ? `<div class="schedule-detail-section">
                    <div class="schedule-detail-section-title">설명</div>
                    <div class="schedule-detail-divider"></div>
                    <div style="font-size:15px;color:var(--text-primary);line-height:1.7;white-space:pre-wrap">${escapeHtml(s.description)}</div>
                </div>` : ''}

                <!-- 출석투표 -->
                <div id="attendance-section"></div>

                <!-- 참석자 명단 -->
                <div id="attendee-section"></div>

                <!-- 연결된 공지 -->
                <div id="linked-notice-section"></div>

                <!-- 댓글 -->
                <div id="schedule-comments-section"></div>
            </div>
        `;

        // 각 섹션 비동기 로드
        loadAttendanceVote(scheduleId);
        loadAttendeeList(scheduleId);
        loadLinkedNotice(s.linked_post_id);
        loadScheduleComments(scheduleId);

    } catch (_) {
        _scheduleDetailActive = false;
        container.innerHTML = renderErrorState('일정 정보를 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'showScheduleDetailScreen(' + scheduleId + ')');
    }
}

// ========== 그룹 일정 상세 ==========

async function showGroupScheduleDetail(scheduleId, groupId) {
    const screen = document.getElementById('schedules-screen');
    const container = document.getElementById('schedule-list');
    const calContainer = document.getElementById('calendar-container');
    const dayHeader = document.getElementById('schedule-day-header');
    if (!screen || !container) return;

    _scheduleDetailActive = true;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
    if (calContainer) calContainer.style.display = 'none';
    if (dayHeader) dayHeader.style.display = 'none';
    container.innerHTML = renderSkeleton('schedule-detail');

    if (typeof pushRoute === 'function') pushRoute('schedule-detail', { scheduleId: scheduleId, groupId: groupId });

    const createBtn = document.getElementById('create-schedule-btn');
    if (createBtn) createBtn.style.display = 'none';

    try {
        const res = await apiClient.request('/group-board/' + groupId + '/schedules');
        if (!res.success || !res.schedules) {
            container.innerHTML = renderErrorState('일정 정보를 불러올 수 없습니다', '', 'showGroupScheduleDetail(' + scheduleId + ',' + groupId + ')');
            return;
        }
        const s = res.schedules.find(function(item) { return item.id === scheduleId; });
        if (!s) {
            container.innerHTML = renderErrorState('일정을 찾을 수 없습니다', '', 'showGroupScheduleDetail(' + scheduleId + ',' + groupId + ')');
            return;
        }

        const category = s.category || 'other';
        const categoryLabel = CATEGORY_LABELS[category] || category;
        const badgeClass = CATEGORY_BADGE_CLASS[category] || 'badge-other';
        const weekdays = ['일','월','화','수','목','금','토'];

        const startRaw = s.start_date || '';
        const endRaw = s.end_date || '';
        let dateDisplay = '', timeDisplay = '', isAllDay = false;

        if (startRaw) {
            const sd = new Date(startRaw);
            dateDisplay = `${sd.getFullYear()}.${String(sd.getMonth()+1).padStart(2,'0')}.${String(sd.getDate()).padStart(2,'0')} (${weekdays[sd.getDay()]})`;
            const sh = sd.getHours(), sm = sd.getMinutes();
            if (sh === 0 && sm === 0) {
                isAllDay = true;
            } else {
                timeDisplay = `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`;
            }
            if (endRaw) {
                const ed = new Date(endRaw);
                if (ed.toDateString() !== sd.toDateString()) {
                    dateDisplay += ` ~ ${ed.getFullYear()}.${String(ed.getMonth()+1).padStart(2,'0')}.${String(ed.getDate()).padStart(2,'0')} (${weekdays[ed.getDay()]})`;
                }
                const eh = ed.getHours(), em = ed.getMinutes();
                if (eh !== 0 || em !== 0) {
                    const endT = `${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`;
                    timeDisplay = timeDisplay ? `${timeDisplay} ~ ${endT}` : endT;
                    isAllDay = false;
                }
            }
        }

        const groupName = s.group_name || '';
        const creatorName = s.creator_name || '';

        container.innerHTML = `
            <div class="detail-view schedule-detail">
                <button class="btn-back" data-action="schedule-back-list">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                    목록으로
                </button>

                <div class="schedule-detail-section">
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                        <span class="schedule-category-badge ${badgeClass}">${categoryLabel}</span>
                        ${groupName ? `<span class="schedule-group-badge">${escapeHtml(groupName)}</span>` : ''}
                    </div>
                    <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);line-height:1.4;margin-top:8px">${escapeHtml(s.title || '')}</h2>

                    <div class="schedule-info-row" style="margin-top:16px">
                        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span class="schedule-info-text date">${dateDisplay}${isAllDay ? '<span class="schedule-allday-badge">종일</span>' : ''}</span>
                    </div>
                    ${timeDisplay ? `<div class="schedule-info-row">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span class="schedule-info-text">${timeDisplay}</span>
                    </div>` : ''}
                    ${s.location ? `<div class="schedule-info-row">
                        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span class="schedule-info-text" style="flex:1">${escapeHtml(s.location)}</span>
                        <span class="schedule-map-icon" onclick="window.open('https://map.naver.com/v5/search/'+encodeURIComponent('${escapeHtml(s.location)}'),'_blank')" title="지도에서 보기">
                            <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </span>
                    </div>` : ''}
                    ${creatorName ? `<div class="schedule-info-row">
                        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span class="schedule-info-text sub">${escapeHtml(creatorName)}</span>
                    </div>` : ''}
                </div>

                ${s.description ? `<div class="schedule-detail-section">
                    <div class="schedule-detail-section-title">설명</div>
                    <div class="schedule-detail-divider"></div>
                    <div style="font-size:15px;color:var(--text-primary);line-height:1.7;white-space:pre-wrap">${escapeHtml(s.description)}</div>
                </div>` : ''}
            </div>
        `;
    } catch (_) {
        _scheduleDetailActive = false;
        container.innerHTML = renderErrorState('일정 정보를 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'showGroupScheduleDetail(' + scheduleId + ',' + groupId + ')');
    }
}

function toggleScheduleDropdown(e) {
    e.stopPropagation();
    const dd = document.getElementById('schedule-dropdown');
    if (!dd) return;
    scheduleDropdownOpen = !scheduleDropdownOpen;
    dd.classList.toggle('open', scheduleDropdownOpen);
    if (scheduleDropdownOpen) {
        const close = (ev) => {
            if (!dd.contains(ev.target)) {
                dd.classList.remove('open');
                scheduleDropdownOpen = false;
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    }
}

// ========== 참석자 명단 (schedule_attendance API) ==========

async function loadAttendeeList(scheduleId) {
    const section = document.getElementById('attendee-section');
    if (!section) return;
    try {
        const res = await apiClient.request('/schedules/' + scheduleId + '/attendance/details');
        if (!res.success || !res.data) { section.innerHTML = ''; return; }

        const { attending, not_attending, no_response } = res.data;
        const attendCount = attending ? attending.length : 0;
        const absentCount = not_attending ? not_attending.length : 0;
        const noRespCount = no_response ? no_response.length : 0;
        const totalResp = attendCount + absentCount;

        if (totalResp === 0 && noRespCount === 0) { section.innerHTML = ''; return; }

        // 요약 텍스트
        var summaryParts = [];
        if (attendCount > 0) summaryParts.push('참석 ' + attendCount + '명');
        if (absentCount > 0) summaryParts.push('불참 ' + absentCount + '명');
        if (noRespCount > 0) summaryParts.push('미응답 ' + noRespCount + '명');
        var summaryText = summaryParts.join(' / ');

        // 그룹별 명단 HTML
        function renderGroup(label, colorClass, members) {
            if (!members || members.length === 0) return '';
            var names = members.map(function(m) { return escapeHtml(m.name || '회원'); }).join(', ');
            return '<div class="attendee-group">'
                + '<div class="attendee-group-label ' + colorClass + '">' + label + ' (' + members.length + '명)</div>'
                + '<div class="attendee-group-names">' + names + '</div>'
                + '</div>';
        }

        var detailHtml = renderGroup('참석', 'attendee-attend', attending)
            + renderGroup('불참', 'attendee-absent', not_attending)
            + renderGroup('미응답', 'attendee-noresponse', no_response);

        // 5명 이하면 바로 표시, 초과면 접기/펼치기
        var totalPeople = attendCount + absentCount + noRespCount;
        var needCollapse = totalPeople > 5;

        section.innerHTML = '<div class="schedule-detail-section">'
            + '<div class="schedule-detail-section-title">참석 현황</div>'
            + '<div class="schedule-detail-divider"></div>'
            + '<div class="attendee-summary">' + summaryText + '</div>'
            + (needCollapse
                ? '<div class="attendee-details" id="attendee-details-' + scheduleId + '" style="display:none">' + detailHtml + '</div>'
                  + '<button class="attendee-toggle-btn" id="attendee-toggle-' + scheduleId + '" onclick="toggleAttendeeDetails(' + scheduleId + ')">명단 보기</button>'
                : '<div class="attendee-details">' + detailHtml + '</div>')
            + '</div>';
    } catch (_) {
        section.innerHTML = '';
    }
}

function toggleAttendeeDetails(scheduleId) {
    var details = document.getElementById('attendee-details-' + scheduleId);
    var btn = document.getElementById('attendee-toggle-' + scheduleId);
    if (!details || !btn) return;
    var isHidden = details.style.display === 'none';
    details.style.display = isHidden ? '' : 'none';
    btn.textContent = isHidden ? '명단 접기' : '명단 보기';
}

// ========== 연결된 공지 ==========

async function loadLinkedNotice(linkedPostId) {
    const section = document.getElementById('linked-notice-section');
    if (!section || !linkedPostId) { if (section) section.innerHTML = ''; return; }
    try {
        const res = await apiClient.getPost(linkedPostId);
        if (!res.success || !res.post) { section.innerHTML = ''; return; }
        section.innerHTML = `
            <div class="schedule-detail-section">
                <div class="schedule-detail-section-title">연결된 공지</div>
                <div class="schedule-detail-divider"></div>
                <div class="linked-notice-banner" onclick="navigateTo('/posts/${linkedPostId}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span class="linked-notice-text">${escapeHtml(res.post.title)}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-hint)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
            </div>
        `;
    } catch (_) {
        section.innerHTML = '';
    }
}

// ========== 일정 댓글 — CommentComponent 위임 ==========

var _scheduleCommentComponent = null;

function loadScheduleComments(scheduleId) {
    _scheduleCommentComponent = new CommentComponent({
        apiBase: '/schedules/' + scheduleId + '/comments',
        likeApiBase: '/schedules/' + scheduleId + '/comments',
        containerId: 'schedule-comments-section',
        showLikes: true,
        showReplies: true,
        showInput: true
    });
    _scheduleCommentComponent.load();
}

// ========== 참석 투표 — AttendanceComponent 위임 ==========

function loadAttendanceVote(scheduleId) {
    new AttendanceComponent({
        apiBase: '/schedules/' + scheduleId + '/attendance',
        containerId: 'attendance-section',
        showProgressBar: true,
        showAttendeeList: false,
        showNoResponse: true
    }).load();
}

// 기존 호환용 (상세 화면에서 호출)
function submitAttendance(status, scheduleId) {
    loadAttendanceVote(scheduleId);
}

// ========== 목록 복귀 ==========

function backToScheduleList() {
    _scheduleDetailActive = false;
    _scheduleFormActive = false;
    // calYear/calMonth 미초기화 상태 방지
    if (calYear == null || calMonth == null) {
        var now = new Date();
        calYear = now.getFullYear();
        calMonth = now.getMonth();
        if (!calSelectedDate) calSelectedDate = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
    }
    const calContainer = document.getElementById('calendar-container');
    const dayHeader = document.getElementById('schedule-day-header');
    if (calContainer) calContainer.style.display = '';
    if (dayHeader) dayHeader.style.display = '';
    loadMonthSchedules().then(function() {
        renderCalendar();
        renderDaySchedules();
    });
    checkScheduleCreatePermission();
}

function checkScheduleCreatePermission() {
    const createBtn = document.getElementById('create-schedule-btn');
    if (createBtn) createBtn.style.display = canCreateSchedule() ? 'flex' : 'none';
}

// ========== 일정 등록/수정 (M-05) ==========

function handleCreateSchedule() {
    if (!canCreateSchedule()) return;
    _scheduleFormActive = true;
    const calContainer = document.getElementById('calendar-container');
    const dayHeader = document.getElementById('schedule-day-header');
    if (calContainer) calContainer.style.display = 'none';
    if (dayHeader) dayHeader.style.display = 'none';
    const createBtn = document.getElementById('create-schedule-btn');
    if (createBtn) createBtn.style.display = 'none';
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
    const isAllDay = !startTime && !endTime && startDate;
    const currentCategory = data.category || '';

    const categoryOptions = '<option value="">카테고리를 선택해주세요</option>' +
        Object.entries(CATEGORY_LABELS).map(([k, v]) =>
            `<option value="${k}" ${k === currentCategory ? 'selected' : ''}>${v}</option>`
        ).join('');

    container.innerHTML = `
        <div class="schedule-form-wrapper">
            <button class="btn-back" data-action="schedule-back-list" style="margin:0 0 8px 0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                취소
            </button>
            <form id="schedule-form" data-edit-id="${data.id || ''}">
                <div class="schedule-form-inner">
                    <h2 style="font-size:18px;font-weight:700;margin-bottom:20px">${isEdit ? '일정 수정' : '새 일정 등록'}</h2>

                    <div class="schedule-form-field">
                        <label class="schedule-form-label">제목 <span class="required">*</span></label>
                        <input type="text" class="schedule-form-input" id="sf-title" maxlength="100" value="${escapeHtml(data.title || '')}" placeholder="일정 제목을 입력하세요">
                        <div class="schedule-form-error" id="sf-title-error" style="display:none"></div>
                    </div>

                    <div class="schedule-form-field">
                        <label class="schedule-form-label">카테고리 <span class="required">*</span></label>
                        <select class="schedule-form-input schedule-form-select" id="sf-category">${categoryOptions}</select>
                        <div class="schedule-form-error" id="sf-category-error" style="display:none"></div>
                    </div>

                    <label class="allday-checkbox-wrapper" id="sf-allday-wrapper">
                        <input type="checkbox" id="sf-allday" ${isAllDay ? 'checked' : ''}>
                        <span class="allday-checkbox-label">종일 이벤트</span>
                    </label>

                    <div class="schedule-form-field">
                        <label class="schedule-form-label">시작 날짜/시간 <span class="required">*</span></label>
                        <input type="datetime-local" class="schedule-form-input" id="sf-start-datetime" value="${startDate ? startDate + (startTime ? 'T' + startTime : '') : ''}">
                        <div class="schedule-form-error" id="sf-start-error" style="display:none"></div>
                    </div>

                    <div class="schedule-form-field">
                        <label class="schedule-form-label">종료 날짜/시간</label>
                        <input type="datetime-local" class="schedule-form-input" id="sf-end-datetime" value="${endDate ? endDate + (endTime ? 'T' + endTime : '') : ''}">
                        <div class="schedule-form-error" id="sf-end-error" style="display:none"></div>
                    </div>

                    <div class="schedule-form-field">
                        <label class="schedule-form-label">장소</label>
                        <input type="text" class="schedule-form-input" id="sf-location" maxlength="200" value="${escapeHtml(data.location || '')}" placeholder="장소를 입력하세요">
                        <div class="schedule-form-error" id="sf-location-error" style="display:none"></div>
                    </div>

                    <div class="schedule-form-field">
                        <label class="schedule-form-label">설명</label>
                        <textarea class="schedule-form-textarea" id="sf-description" maxlength="2000" placeholder="일정 설명을 입력하세요" rows="5">${escapeHtml(data.description || '')}</textarea>
                        <div class="schedule-form-error" id="sf-desc-error" style="display:none"></div>
                    </div>

                    <!-- 투표 설정 접이식 -->
                    <div class="vote-collapsible-header" id="sf-vote-header" onclick="toggleVoteCollapsible()">
                        <span class="line"></span>
                        <span class="text">참석 투표 설정</span>
                        <span class="line"></span>
                        <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <div class="vote-collapsible-body" id="sf-vote-body">
                        <div class="vote-toggle-row">
                            <span class="vote-toggle-label">참석 투표 활성화</span>
                            <div class="toggle-switch" id="sf-vote-toggle" onclick="toggleVoteSwitch()">
                                <div class="toggle-thumb"></div>
                            </div>
                        </div>
                        <div id="sf-vote-options" style="display:none">
                            <div class="schedule-form-field">
                                <label class="schedule-form-label">투표 유형 <span class="required">*</span></label>
                                <div class="vote-radio-group">
                                    <label class="vote-radio-option"><input type="radio" name="sf-vote-type" value="board"> <span>이사회</span></label>
                                    <label class="vote-radio-option"><input type="radio" name="sf-vote-type" value="monthly"> <span>월례회</span></label>
                                    <label class="vote-radio-option"><input type="radio" name="sf-vote-type" value="general" checked> <span>일반</span></label>
                                </div>
                            </div>
                            <div class="schedule-form-field">
                                <label class="schedule-form-label">마감일</label>
                                <div class="date-time-row">
                                    <input type="date" class="schedule-form-input date-input" id="sf-vote-deadline-date">
                                    <input type="time" class="schedule-form-input time-input" id="sf-vote-deadline-time">
                                </div>
                                <div class="schedule-form-error" id="sf-vote-deadline-error" style="display:none"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="schedule-form-cta">
                    <button type="submit" class="schedule-form-submit" id="sf-submit-btn">
                        ${isEdit ? '수정 완료' : '일정 등록'}
                    </button>
                </div>
            </form>
        </div>
    `;

    // 인라인 에러 실시간 해제
    ['sf-title', 'sf-category', 'sf-start-datetime', 'sf-end-datetime', 'sf-location', 'sf-description'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => {
            const errEl = document.getElementById(id + '-error') || document.getElementById(id.replace('sf-', 'sf-') + '-error');
            // 간단한 매핑으로 해당 에러 숨기기
            hideScheduleFormError(id);
        });
    });
}

function hideScheduleFormError(fieldId) {
    const map = {
        'sf-title': 'sf-title-error',
        'sf-category': 'sf-category-error',
        'sf-start-datetime': 'sf-start-error',
        'sf-end-datetime': 'sf-end-error',
        'sf-location': 'sf-location-error',
        'sf-description': 'sf-desc-error'
    };
    const errId = map[fieldId];
    if (errId) {
        const el = document.getElementById(errId);
        if (el) { el.style.display = 'none'; el.textContent = ''; }
        const input = document.getElementById(fieldId);
        if (input) input.classList.remove('schedule-form-input--error');
    }
}

function showScheduleFormError(fieldId, errId, message) {
    const el = document.getElementById(errId);
    if (el) { el.textContent = message; el.style.display = 'flex'; }
    const input = document.getElementById(fieldId);
    if (input) input.classList.add('schedule-form-input--error');
}

function toggleVoteCollapsible() {
    const header = document.getElementById('sf-vote-header');
    const body = document.getElementById('sf-vote-body');
    if (header && body) {
        header.classList.toggle('open');
        body.classList.toggle('open');
    }
}

function toggleVoteSwitch() {
    const toggle = document.getElementById('sf-vote-toggle');
    const options = document.getElementById('sf-vote-options');
    if (toggle && options) {
        toggle.classList.toggle('active');
        options.style.display = toggle.classList.contains('active') ? 'block' : 'none';
    }
}

function validateScheduleForm() {
    let valid = true;
    let firstError = null;
    const title = document.getElementById('sf-title')?.value?.trim();
    const category = document.getElementById('sf-category')?.value;
    const startDatetime = document.getElementById('sf-start-datetime')?.value;
    const endDatetime = document.getElementById('sf-end-datetime')?.value;
    const location = document.getElementById('sf-location')?.value?.trim();
    const description = document.getElementById('sf-description')?.value?.trim();

    // Clear all
    document.querySelectorAll('.schedule-form-error').forEach(el => { el.style.display = 'none'; el.textContent = ''; });
    document.querySelectorAll('.schedule-form-input--error').forEach(el => el.classList.remove('schedule-form-input--error'));

    if (!title) {
        showScheduleFormError('sf-title', 'sf-title-error', '제목을 입력해주세요');
        if (!firstError) firstError = 'sf-title';
        valid = false;
    } else if (title.length > 100) {
        showScheduleFormError('sf-title', 'sf-title-error', '제목은 100자 이내로 입력해주세요');
        if (!firstError) firstError = 'sf-title';
        valid = false;
    }

    if (!category) {
        showScheduleFormError('sf-category', 'sf-category-error', '카테고리를 선택해주세요');
        if (!firstError) firstError = 'sf-category';
        valid = false;
    }

    if (!startDatetime) {
        showScheduleFormError('sf-start-datetime', 'sf-start-error', '시작 날짜를 선택해주세요');
        if (!firstError) firstError = 'sf-start-datetime';
        valid = false;
    }

    if (startDatetime && endDatetime && endDatetime < startDatetime) {
        showScheduleFormError('sf-end-datetime', 'sf-end-error', '종료 시간은 시작 시간 이후여야 합니다');
        if (!firstError) firstError = 'sf-end-datetime';
        valid = false;
    }

    // 참석 투표 마감일 검증
    const voteToggle = document.getElementById('sf-vote-toggle');
    if (voteToggle && voteToggle.classList.contains('active') && startDatetime) {
        const deadlineDate = document.getElementById('sf-vote-deadline-date')?.value;
        const deadlineTime = document.getElementById('sf-vote-deadline-time')?.value || '23:59';
        if (deadlineDate) {
            const deadlineFull = deadlineDate + 'T' + deadlineTime;
            if (deadlineFull > startDatetime) {
                showScheduleFormError('sf-vote-deadline-date', 'sf-vote-deadline-error', '투표 마감일은 일정 시작 전이어야 합니다');
                if (!firstError) firstError = 'sf-vote-deadline-date';
                valid = false;
            }
        }
    }

    if (location && location.length > 200) {
        showScheduleFormError('sf-location', 'sf-location-error', '장소는 200자 이내로 입력해주세요');
        if (!firstError) firstError = 'sf-location';
        valid = false;
    }

    if (description && description.length > 2000) {
        showScheduleFormError('sf-description', 'sf-desc-error', '설명은 2000자 이내로 입력해주세요');
        if (!firstError) firstError = 'sf-description';
        valid = false;
    }

    if (firstError) {
        document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return valid;
}

async function handleScheduleFormSubmit(e) {
    e.preventDefault();
    if (!validateScheduleForm()) return;

    const title = document.getElementById('sf-title').value.trim();
    const category = document.getElementById('sf-category').value;
    const startDatetime = document.getElementById('sf-start-datetime').value;
    const endDatetime = document.getElementById('sf-end-datetime')?.value || '';
    const location = document.getElementById('sf-location')?.value?.trim();
    const description = document.getElementById('sf-description')?.value?.trim();

    const start_date = startDatetime ? startDatetime + ':00' : '';
    const end_date = endDatetime ? endDatetime + ':00' : null;
    const payload = { title, start_date, end_date, location, description, category };

    const btn = document.getElementById('sf-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }

    try {
        const editId = e.target.dataset.editId;
        const res = editId
            ? await apiClient.updateSchedule(editId, payload)
            : await apiClient.createSchedule(payload);
        if (!res.success) {
            return;
        }
        const startDateStr = startDatetime.split('T')[0];
        calSelectedDate = startDateStr;
        calYear = new Date(startDateStr).getFullYear();
        calMonth = new Date(startDateStr).getMonth();
        await loadMonthSchedules();
        backToScheduleList();
    } catch (err) {
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = e.target.dataset.editId ? '수정 완료' : '일정 등록'; }
    }
}

async function handleEditSchedule(scheduleId) {
    try {
        _scheduleFormActive = true;
        const res = await apiClient.getSchedule(scheduleId);
        const calContainer = document.getElementById('calendar-container');
        const dayHeader = document.getElementById('schedule-day-header');
        if (calContainer) calContainer.style.display = 'none';
        if (dayHeader) dayHeader.style.display = 'none';
        const createBtn = document.getElementById('create-schedule-btn');
        if (createBtn) createBtn.style.display = 'none';
        renderScheduleForm(res.schedule);
    } catch (_) {
    }
}

async function handleDeleteSchedule(scheduleId) {
    if (!confirm('일정을 삭제하시겠습니까?\n삭제 시 투표 기록도 함께 삭제됩니다.')) return;
    try {
        const res = await apiClient.deleteSchedule(scheduleId);
        await loadMonthSchedules();
        backToScheduleList();
    } catch (e) {
    }
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

    // 일정 목록 이벤트 위임
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
            if (action === 'schedule-back-list') { _scheduleFormActive = false; _scheduleDetailActive = false; goBack(); }
            if (action === 'schedule-edit' && id) handleEditSchedule(id);
            if (action === 'schedule-delete' && id) handleDeleteSchedule(id);
            if (action === 'schedule-admin-delete' && id && typeof adminDeleteSchedule === 'function') adminDeleteSchedule(id);
        });
    }
});

console.log('Schedules module loaded (calendar + detail + form)');
