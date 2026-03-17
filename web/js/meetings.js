// 회의 기능 (meetings)

async function loadMeetingsScreen() {
    const container = document.getElementById('meetings-content');
    if (!container) return;
    container.innerHTML = renderSkeleton('list');

    try {
        const res = await apiClient.request('/meetings');
        if (!res.success) throw new Error(res.message);
        const meetings = res.data?.items || res.data || [];

        if (meetings.length === 0) {
            container.innerHTML = renderEmptyState('calendar', '등록된 회의가 없습니다');
            return;
        }

        container.innerHTML = meetings.map(m => {
            const statusLabel = { scheduled: '예정', in_progress: '진행 중', completed: '완료', cancelled: '취소' }[m.status] || m.status;
            const statusClass = m.status === 'in_progress' ? 'badge-active' : m.status === 'completed' ? 'badge-done' : '';
            const dateStr = m.meeting_date ? formatDate(m.meeting_date) : '';
            const typeLabel = { regular: '정기회의', board: '이사회', general_assembly: '정기총회' }[m.meeting_type] || m.meeting_type;

            return `<div class="meeting-card" onclick="showMeetingDetail(${m.id})">
                <div class="meeting-card-header">
                    <span class="meeting-type-badge">${escapeHtml(typeLabel)}</span>
                    <span class="meeting-status ${statusClass}">${escapeHtml(statusLabel)}</span>
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

async function showMeetingDetail(meetingId) {
    const container = document.getElementById('meetings-content');
    if (!container) return;
    container.innerHTML = renderSkeleton('detail');

    try {
        const res = await apiClient.request('/meetings/' + meetingId);
        if (!res.success) throw new Error(res.message);
        const m = res.data;

        const typeLabel = { regular: '정기회의', board: '이사회', general_assembly: '정기총회' }[m.meeting_type] || m.meeting_type;
        const statusLabel = { scheduled: '예정', in_progress: '진행 중', completed: '완료', cancelled: '취소' }[m.status] || m.status;

        let html = `<div class="detail-view">
            <button class="btn-back" onclick="loadMeetingsScreen()">← 회의 목록</button>
            <div style="padding:16px 0">
                <span class="meeting-type-badge">${escapeHtml(typeLabel)}</span>
                <span class="meeting-status">${escapeHtml(statusLabel)}</span>
            </div>
            <h2 style="margin:0 0 8px">${escapeHtml(m.title)}</h2>
            <div style="color:var(--text-secondary);font-size:14px;margin-bottom:16px">
                ${m.meeting_date ? formatDate(m.meeting_date) : ''}
                ${m.location ? ' · ' + escapeHtml(m.location) : ''}
            </div>
            ${m.description ? '<p style="margin-bottom:16px">' + escapeHtml(m.description) + '</p>' : ''}`;

        // 참석 현황
        html += `<div class="info-section">
            <h3 class="info-section-title">참석 현황</h3>
            <div id="meeting-attendance-${meetingId}">로딩 중...</div>
            ${m.status !== 'completed' ? `<div style="display:flex;gap:8px;margin-top:12px">
                <button class="btn btn-primary btn-sm" onclick="markAttendance(${meetingId},'attending')">참석</button>
                <button class="btn btn-secondary btn-sm" onclick="markAttendance(${meetingId},'absent')">불참</button>
            </div>` : ''}
        </div>`;

        // 투표
        html += `<div class="info-section">
            <h3 class="info-section-title">투표</h3>
            <div id="meeting-votes-${meetingId}">로딩 중...</div>
        </div>`;

        // 회의록
        html += `<div class="info-section">
            <h3 class="info-section-title">회의록 (PDF)</h3>
            <div id="meeting-minutes-${meetingId}">로딩 중...</div>
        </div>`;

        html += '</div>';
        container.innerHTML = html;

        // 비동기 로드
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
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
            },
            body: JSON.stringify({ status: status })
        });
        var data = await res.json();
        if (data.success) {
            showToast(status === 'attending' ? '참석으로 표시했습니다' : '불참으로 표시했습니다');
            loadMeetingAttendance(meetingId);
        } else {
            showToast(data.message || '참석 처리 실패', 'error');
        }
    } catch (err) {
        showToast('참석 처리 실패: ' + (err.message || '네트워크 오류'), 'error');
    }
}

async function loadMeetingAttendance(meetingId) {
    const el = document.getElementById('meeting-attendance-' + meetingId);
    if (!el) return;
    try {
        const res = await apiClient.request('/meetings/' + meetingId + '/attendance');
        if (!res.success) { el.innerHTML = '참석 정보 없음'; return; }
        const att = res.data || [];
        const attending = att.filter(a => a.status === 'attending');
        const absent = att.filter(a => a.status === 'absent');
        el.innerHTML = `<div style="font-size:14px">
            <span style="color:#16A34A;font-weight:600">참석 ${attending.length}명</span>
            <span style="color:#DC2626;margin-left:12px">불참 ${absent.length}명</span>
        </div>
        ${attending.length > 0 ? '<div style="margin-top:8px;font-size:13px;color:var(--text-secondary)">' + attending.map(a => escapeHtml(a.user_name)).join(', ') + '</div>' : ''}`;
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
        el.innerHTML = res.data.votes.map(v => {
            const options = v.options || ['찬성', '반대', '기권'];
            const results = v.results || {};
            const totalVotes = Object.values(results).reduce((s, n) => s + n, 0);
            return `<div class="vote-card">
                <div style="font-weight:600;margin-bottom:8px">${escapeHtml(v.title)}</div>
                ${v.status === 'open' ? `<div style="display:flex;gap:8px;margin-bottom:8px">
                    ${options.map(opt => `<button class="btn btn-sm ${v.my_vote === opt ? 'btn-primary' : 'btn-secondary'}"
                        onclick="castVote(${meetingId},${v.id},'${escapeHtml(opt)}')">${escapeHtml(opt)}</button>`).join('')}
                </div>` : ''}
                <div style="font-size:13px;color:var(--text-secondary)">
                    ${options.map(opt => `${escapeHtml(opt)}: ${results[opt] || 0}표`).join(' · ')}
                    (총 ${totalVotes}표) ${v.status === 'closed' ? '· 마감' : ''}
                </div>
            </div>`;
        }).join('');
    } catch (_) {
        el.innerHTML = '투표 정보를 불러올 수 없습니다';
    }
}

async function castVote(meetingId, voteId, option) {
    try {
        var res = await fetch('/api/meetings/' + meetingId + '/votes/' + voteId + '/cast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
            },
            body: JSON.stringify({ option: option })
        });
        var data = await res.json();
        if (data.success) {
            showToast(option + '에 투표했습니다');
            loadMeetingVotes(meetingId);
        } else {
            showToast(data.message || '투표 실패', 'error');
        }
    } catch (err) {
        showToast('투표 실패: ' + (err.message || '네트워크 오류'), 'error');
    }
}

async function loadMeetingMinutes(meetingId) {
    const el = document.getElementById('meeting-minutes-' + meetingId);
    if (!el) return;
    try {
        const res = await apiClient.request('/meetings/' + meetingId + '/minutes');
        if (!res.success || !res.data || res.data.length === 0) {
            el.innerHTML = '<div style="color:var(--text-secondary);font-size:14px">등록된 회의록이 없습니다</div>';
            return;
        }
        el.innerHTML = res.data.map(m => `<a href="/api/meetings/minutes/${m.id}" target="_blank"
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
