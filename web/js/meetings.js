// 회의 기능 (meetings)

async function loadMeetingsScreen() {
    const container = document.getElementById('meetings-content');
    if (!container) return;
    container.innerHTML = renderSkeleton('list');

    var userInfo = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user_info') || 'null');
    var isAdminUser = userInfo && ['admin', 'super_admin', 'local_admin'].includes(userInfo.role);

    try {
        const res = await apiClient.request('/meetings');
        if (!res.success) throw new Error(res.message);
        const meetings = res.data?.items || res.data || [];

        // 관리자용 회의 생성 FAB 버튼
        var createBtn = isAdminUser ? '<button class="fab" onclick="showCreateMeetingForm()" style="position:fixed;right:20px;bottom:80px;z-index:100;width:56px;height:56px;border-radius:50%;background:var(--primary-color,#2563EB);color:#fff;border:none;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.15);cursor:pointer">+</button>' : '';
        var createFormHtml = `<div id="create-meeting-form" style="display:none;margin-bottom:20px;padding:16px;border:1px solid var(--border-color);border-radius:12px;background:var(--card-bg,#fff)">
            <h3 style="margin:0 0 12px;font-size:16px">새 회의 생성</h3>
            <div style="display:flex;flex-direction:column;gap:10px">
                <input type="text" id="new-meeting-title" placeholder="회의 제목" style="padding:10px;border:1px solid var(--border-color);border-radius:8px">
                <select id="new-meeting-type" style="padding:10px;border:1px solid var(--border-color);border-radius:8px">
                    <option value="regular">정기회의</option>
                    <option value="board">이사회</option>
                    <option value="general_assembly">정기총회</option>
                    <option value="extraordinary">임시총회</option>
                </select>
                <input type="datetime-local" id="new-meeting-date" style="padding:10px;border:1px solid var(--border-color);border-radius:8px">
                <input type="text" id="new-meeting-location" placeholder="장소" style="padding:10px;border:1px solid var(--border-color);border-radius:8px">
                <textarea id="new-meeting-desc" placeholder="설명 (선택)" rows="2" style="padding:10px;border:1px solid var(--border-color);border-radius:8px;resize:vertical"></textarea>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-primary btn-sm" onclick="submitCreateMeeting()">등록</button>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('create-meeting-form').style.display='none'">취소</button>
                </div>
            </div>
        </div>`;

        if (meetings.length === 0) {
            container.innerHTML = createBtn + createFormHtml + renderEmptyState('calendar', '등록된 회의가 없습니다', '새 회의를 등록해보세요');
            return;
        }

        container.innerHTML = createBtn + createFormHtml + meetings.map(m => {
            const statusLabel = { scheduled: '예정', in_progress: '진행 중', completed: '완료', cancelled: '취소' }[m.status] || m.status;
            const statusClass = m.status === 'in_progress' ? 'badge-active' : m.status === 'completed' ? 'badge-done' : '';
            const dateStr = m.meeting_date ? formatDate(m.meeting_date) : '';
            const typeLabel = { regular: '정기회의', board: '이사회', general_assembly: '정기총회', extraordinary: '임시총회' }[m.meeting_type] || m.meeting_type;

            var deleteBtn = isAdminUser ? `<button class="btn-meeting-delete" onclick="event.stopPropagation();deleteMeeting(${m.id},'${escapeHtml(m.title).replace(/'/g,"\\'")}')">삭제</button>` : '';
            return `<div class="meeting-card" onclick="showMeetingDetail(${m.id})">
                <div class="meeting-card-header">
                    <span class="meeting-type-badge">${escapeHtml(typeLabel)}</span>
                    <span class="meeting-status ${statusClass}">${escapeHtml(statusLabel)}</span>
                    ${deleteBtn}
                </div>
                <h3 class="meeting-title">${escapeHtml(m.title)}</h3>
                <div class="meeting-meta">
                    <span>${dateStr}</span>
                    ${m.location ? '<span> · ' + escapeHtml(m.location) + '</span>' : ''}
                </div>
                ${m.attendance_count ? '<div class="meeting-attendance-count">참석 ' + m.attendance_count + '명</div>' : ''}
            </div>`;
        }).join('');
    } catch (err) {
        container.innerHTML = renderErrorState('회의 목록을 불러올 수 없습니다', err.message, 'loadMeetingsScreen()');
    }
}

async function deleteMeeting(meetingId, title) {
    if (!confirm('"' + title + '" 회의를 삭제하시겠습니까?')) return;
    try {
        var res = await apiClient.request('/meetings/' + meetingId, { method: 'DELETE' });
        if (res.success) { loadMeetingsScreen(); }
    } catch (err) { console.error('Delete meeting error:', err); }
}

async function showMeetingDetail(meetingId) {
    const container = document.getElementById('meetings-content');
    if (!container) return;
    container.innerHTML = renderSkeleton('detail');

    try {
        const res = await apiClient.request('/meetings/' + meetingId);
        if (!res.success) throw new Error(res.message);
        const m = res.data;

        const typeLabel = { regular: '정기회의', board: '이사회', general_assembly: '정기총회', extraordinary: '임시총회' }[m.meeting_type] || m.meeting_type;
        const statusLabel = { scheduled: '예정', in_progress: '진행 중', completed: '완료', cancelled: '취소' }[m.status] || m.status;

        var userInfo = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user_info') || 'null');
        var isAdminUser = userInfo && ['admin', 'super_admin', 'local_admin'].includes(userInfo.role);

        let html = `<div class="detail-view">
            <button class="btn-back" onclick="loadMeetingsScreen()">← 회의 목록</button>
            <div style="padding:16px 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span class="meeting-type-badge">${escapeHtml(typeLabel)}</span>
                <span class="meeting-status ${m.status === 'in_progress' ? 'badge-active' : ''}">${escapeHtml(statusLabel)}</span>
                ${isAdminUser && m.status === 'scheduled' ? `<button class="btn btn-primary btn-sm" onclick="startMeeting(${meetingId})">회의 시작</button>` : ''}
                ${isAdminUser && m.status === 'in_progress' ? `<button class="btn btn-secondary btn-sm" style="color:#DC2626" onclick="endMeeting(${meetingId})">회의 종료</button>` : ''}
            </div>
            <h2 style="margin:0 0 8px">${escapeHtml(m.title)}</h2>
            <div style="color:var(--text-secondary);font-size:14px;margin-bottom:16px">
                ${m.meeting_date ? formatDate(m.meeting_date) : ''}
                ${m.location ? ' · ' + escapeHtml(m.location) : ''}
            </div>
            ${m.description ? '<p style="margin-bottom:16px">' + escapeHtml(m.description) + '</p>' : ''}`;

        // 참석 체크
        html += `<div class="info-section">
            <h3 class="info-section-title">참석 현황</h3>
            <div id="meeting-attendance-${meetingId}">로딩 중...</div>
            ${m.status !== 'completed' ? `<div style="margin-top:12px">
                <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">참석 조사 (본인)</div>
                <div style="display:flex;gap:8px">
                    <button class="btn btn-primary btn-sm" onclick="markAttendance(${meetingId},'attending')">참석 예정</button>
                    <button class="btn btn-secondary btn-sm" onclick="markAttendance(${meetingId},'absent')">불참</button>
                </div>
            </div>` : ''}
        </div>`;

        // 투표
        html += `<div class="info-section">
            <h3 class="info-section-title">투표 <span style="font-size:12px;color:var(--text-secondary)">(익명 투표)</span></h3>
            ${isAdminUser && m.status === 'in_progress' ? `<div style="margin-bottom:12px">
                <button class="btn btn-primary btn-sm" onclick="showCreateVoteForm(${meetingId})">+ 투표 추가</button>
            </div>
            <div id="create-vote-form-${meetingId}" style="display:none;margin-bottom:16px;padding:12px;border:1px solid var(--border-color);border-radius:8px">
                <input type="text" id="new-vote-title-${meetingId}" placeholder="투표 제목 (예: 예산안 승인)" style="width:100%;padding:8px;border:1px solid var(--border-color);border-radius:6px;margin-bottom:8px;box-sizing:border-box">
                <div style="display:flex;gap:8px">
                    <button class="btn btn-primary btn-sm" onclick="createVote(${meetingId})">등록</button>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('create-vote-form-${meetingId}').style.display='none'">취소</button>
                </div>
            </div>` : ''}
            <div id="meeting-votes-${meetingId}">로딩 중...</div>
        </div>`;

        // 회의록
        html += `<div class="info-section">
            <h3 class="info-section-title">회의록 (PDF)</h3>
            ${isAdminUser ? `<div style="margin-bottom:12px">
                <input type="file" id="minutes-file-${meetingId}" accept="application/pdf" style="display:none" onchange="uploadMinutes(${meetingId})">
                <button class="btn btn-primary btn-sm" onclick="document.getElementById('minutes-file-${meetingId}').click()">PDF 업로드</button>
            </div>` : ''}
            <div id="meeting-minutes-${meetingId}">로딩 중...</div>
        </div>`;

        html += '</div>';
        container.innerHTML = html;

        loadMeetingAttendance(meetingId);
        loadMeetingVotes(meetingId);
        loadMeetingMinutes(meetingId);
    } catch (err) {
        container.innerHTML = renderErrorState('회의 정보를 불러올 수 없습니다', err.message, 'showMeetingDetail(' + meetingId + ')');
    }
}

async function markAttendance(meetingId, status) {
    try {
        var res = await fetch('/api/meetings/' + meetingId + '/attend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
            body: JSON.stringify({ status: status })
        });
        var data = await res.json();
        if (data.success) { loadMeetingAttendance(meetingId); }
    } catch (err) { console.error('Attendance error:', err); }
}

async function loadMeetingAttendance(meetingId) {
    const el = document.getElementById('meeting-attendance-' + meetingId);
    if (!el) return;
    try {
        const res = await apiClient.request('/meetings/' + meetingId + '/attendance');
        if (!res.success) { el.innerHTML = '참석 정보 없음'; return; }
        const att = (res.data && res.data.items) || res.data || [];
        const confirmed = Array.isArray(att) ? att.filter(a => a.status === 'confirmed') : [];
        const observers = Array.isArray(att) ? att.filter(a => a.status === 'observer') : [];
        const attending = Array.isArray(att) ? att.filter(a => a.status === 'attending') : [];
        const absent = Array.isArray(att) ? att.filter(a => a.status === 'absent') : [];

        var userInfo3 = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        var isAdmin3 = userInfo3 && ['admin', 'super_admin', 'local_admin'].includes(userInfo3.role);

        el.innerHTML = `<div style="font-size:14px;display:flex;gap:12px;flex-wrap:wrap">
            <span style="color:#16A34A;font-weight:600">실제참석 ${confirmed.length}명</span>
            <span style="color:#6B7280">옵서버 ${observers.length}명</span>
            <span style="color:#3B82F6">참석예정 ${attending.length}명</span>
            <span style="color:#DC2626">불참 ${absent.length}명</span>
        </div>
        ${confirmed.length > 0 ? '<div style="margin-top:6px;font-size:13px"><span style="color:#16A34A">실제참석:</span> ' + confirmed.map(a => escapeHtml(a.user_name)).join(', ') + '</div>' : ''}
        ${observers.length > 0 ? '<div style="margin-top:4px;font-size:13px"><span style="color:#6B7280">옵서버:</span> ' + observers.map(a => escapeHtml(a.user_name)).join(', ') + '</div>' : ''}
        ${attending.length > 0 ? '<div style="margin-top:4px;font-size:13px"><span style="color:#3B82F6">참석예정:</span> ' + attending.map(a => escapeHtml(a.user_name)).join(', ') + '</div>' : ''}
        ${isAdmin3 ? '<div style="margin-top:12px;font-size:12px;color:var(--text-secondary)">관리자: 참석 예정자를 "실제참석" 또는 "옵서버"로 변경할 수 있습니다</div><div id="admin-attendance-controls-' + meetingId + '" style="margin-top:8px"></div>' : ''}`

        if (isAdmin3) {
            var ctrlEl = document.getElementById('admin-attendance-controls-' + meetingId);
            if (ctrlEl && attending.length > 0) {
                ctrlEl.innerHTML = attending.map(a =>
                    '<div style="display:flex;align-items:center;gap:8px;padding:4px 0">' +
                    '<span style="font-size:13px;min-width:60px">' + escapeHtml(a.user_name) + '</span>' +
                    '<button class="btn btn-sm btn-primary" style="font-size:11px" onclick="setAttendanceStatus(' + meetingId + ',' + a.user_id + ',\'confirmed\')">실제참석</button>' +
                    '<button class="btn btn-sm btn-secondary" style="font-size:11px" onclick="setAttendanceStatus(' + meetingId + ',' + a.user_id + ',\'observer\')">옵서버</button>' +
                    '</div>'
                ).join('');
            }
        }
    } catch (_) {
        el.innerHTML = '참석 정보를 불러올 수 없습니다';
    }
}

async function loadMeetingVotes(meetingId) {
    const el = document.getElementById('meeting-votes-' + meetingId);
    if (!el) return;
    try {
        const res = await apiClient.request('/meetings/' + meetingId);
        if (!res.success || !res.data.votes || res.data.votes.length === 0) {
            el.innerHTML = '<div style="color:var(--text-secondary);font-size:14px">등록된 투표가 없습니다</div>';
            return;
        }
        var userInfo2 = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user_info') || 'null');
        var isAdmin2 = userInfo2 && ['admin', 'super_admin', 'local_admin'].includes(userInfo2.role);

        el.innerHTML = res.data.votes.map(v => {
            const options = v.options || ['찬성', '반대', '기권'];
            const results = v.results || {};
            const totalVotes = Object.values(results).reduce((s, n) => s + n, 0);
            return `<div class="vote-card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <span style="font-weight:600">${escapeHtml(v.title)}</span>
                    ${v.status === 'open' && isAdmin2 ? `<button class="btn btn-sm" style="color:#DC2626;font-size:11px" onclick="closeVote(${meetingId},${v.id})">마감</button>` : ''}
                    ${v.status === 'closed' ? '<span style="color:#DC2626;font-size:12px;font-weight:600">마감</span>' : ''}
                </div>
                ${v.status === 'open' ? `<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
                    ${options.map(opt => `<button class="btn btn-sm ${v.my_vote === opt ? 'btn-primary' : 'btn-secondary'}"
                        onclick="castVote(${meetingId},${v.id},'${escapeHtml(opt)}')">${escapeHtml(opt)}</button>`).join('')}
                </div>
                <div style="font-size:11px;color:#9CA3AF;margin-bottom:4px">* 참석 체크된 회원만 투표 가능 (익명)</div>` : ''}
                <div style="font-size:13px;color:var(--text-secondary)">
                    ${options.map(opt => `${escapeHtml(opt)}: ${results[opt] || 0}표`).join(' · ')}
                    (총 ${totalVotes}표)
                </div>
            </div>`;
        }).join('');
    } catch (_) {
        el.innerHTML = '투표 정보를 불러올 수 없습니다';
    }
}

function showCreateMeetingForm() {
    var form = document.getElementById('create-meeting-form');
    if (form) form.style.display = 'block';
    var titleInput = document.getElementById('new-meeting-title');
    if (titleInput) { titleInput.value = ''; titleInput.focus(); }
}

async function submitCreateMeeting() {
    var title = document.getElementById('new-meeting-title')?.value?.trim();
    var meetingType = document.getElementById('new-meeting-type')?.value || 'regular';
    var meetingDate = document.getElementById('new-meeting-date')?.value;
    var location = document.getElementById('new-meeting-location')?.value?.trim();
    var description = document.getElementById('new-meeting-desc')?.value?.trim();
    if (!title || !meetingDate) return;

    try {
        var res = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
            body: JSON.stringify({ title: title, meeting_type: meetingType, meeting_date: meetingDate, location: location || null, description: description || null })
        });
        var data = await res.json();
        if (data.success) { loadMeetingsScreen(); }
    } catch (err) { console.error('Create meeting error:', err); }
}

async function castVote(meetingId, voteId, option) {
    try {
        var res = await fetch('/api/meetings/' + meetingId + '/votes/' + voteId + '/cast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
            body: JSON.stringify({ option: option })
        });
        var data = await res.json();
        if (data.success) { loadMeetingVotes(meetingId); }
    } catch (err) { console.error('Vote error:', err); }
}

async function setAttendanceStatus(meetingId, userId, status) {
    try {
        var res = await fetch('/api/meetings/' + meetingId + '/attend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
            body: JSON.stringify({ status: status, user_id: userId })
        });
        var data = await res.json();
        if (data.success) { loadMeetingAttendance(meetingId); }
    } catch (err) { console.error('Set attendance error:', err); }
}

async function startMeeting(meetingId) {
    if (!confirm('회의를 시작하시겠습니까?')) return;
    try {
        var res = await fetch('/api/meetings/' + meetingId + '/start', {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
        });
        var data = await res.json();
        if (data.success) { showMeetingDetail(meetingId); }
    } catch (err) { console.error('Start meeting error:', err); }
}

async function endMeeting(meetingId) {
    if (!confirm('회의를 종료하시겠습니까?\n진행 중인 모든 투표가 마감됩니다.')) return;
    try {
        var res = await fetch('/api/meetings/' + meetingId + '/end', {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
        });
        var data = await res.json();
        if (data.success) { showMeetingDetail(meetingId); }
    } catch (err) { console.error('End meeting error:', err); }
}

function showCreateVoteForm(meetingId) {
    var form = document.getElementById('create-vote-form-' + meetingId);
    if (form) form.style.display = 'block';
    var input = document.getElementById('new-vote-title-' + meetingId);
    if (input) { input.value = ''; input.focus(); }
}

async function createVote(meetingId) {
    var title = document.getElementById('new-vote-title-' + meetingId)?.value?.trim();
    if (!title) return;
    try {
        var res = await fetch('/api/meetings/' + meetingId + '/votes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
            body: JSON.stringify({ title: title, options: ['찬성', '반대', '기권'] })
        });
        var data = await res.json();
        if (data.success) {
            document.getElementById('create-vote-form-' + meetingId).style.display = 'none';
            loadMeetingVotes(meetingId);
        }
    } catch (err) { console.error('Create vote error:', err); }
}

async function closeVote(meetingId, voteId) {
    if (!confirm('이 투표를 마감하시겠습니까?')) return;
    try {
        var res = await fetch('/api/meetings/' + meetingId + '/votes/' + voteId + '/close', {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
        });
        var data = await res.json();
        if (data.success) { loadMeetingVotes(meetingId); }
    } catch (err) { console.error('Close vote error:', err); }
}

async function uploadMinutes(meetingId) {
    var fileInput = document.getElementById('minutes-file-' + meetingId);
    if (!fileInput || !fileInput.files[0]) return;
    var file = fileInput.files[0];
    if (file.type !== 'application/pdf') return;
    var formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace('.pdf', ''));
    try {
        var res = await fetch('/api/meetings/' + meetingId + '/minutes', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
            body: formData
        });
        var data = await res.json();
        if (data.success) { loadMeetingMinutes(meetingId); }
    } catch (err) { console.error('Upload minutes error:', err); }
    fileInput.value = '';
}

async function loadMeetingMinutes(meetingId) {
    const el = document.getElementById('meeting-minutes-' + meetingId);
    if (!el) return;
    try {
        const res = await apiClient.request('/meetings/' + meetingId + '/minutes');
        const minutes = (res.data && res.data.items) || res.data || [];
        if (!res.success || !Array.isArray(minutes) || minutes.length === 0) {
            el.innerHTML = '<div style="color:var(--text-secondary);font-size:14px">등록된 회의록이 없습니다</div>';
            return;
        }
        el.innerHTML = minutes.map(m => `<a href="/api/meetings/minutes/${m.id}" target="_blank"
            style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--border-color);border-radius:8px;margin-bottom:8px;text-decoration:none;color:var(--text-primary)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div>
                <div style="font-size:14px;font-weight:500">${escapeHtml(m.title || m.file_name)}</div>
                <div style="font-size:12px;color:var(--text-secondary)">${formatDate(m.created_at)}</div>
            </div>
        </a>`).join('');
    } catch (_) {
        el.innerHTML = '회의록을 불러올 수 없습니다';
    }
}
