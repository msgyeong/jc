/**
 * AttendanceComponent — 통합 참석 UI 컴포넌트
 *
 * schedules, posts, group-board 3곳의 참석 UI를 하나로 통합.
 *
 * 사용법:
 *   var att = new AttendanceComponent({
 *     apiBase: '/schedules/' + id + '/attendance',
 *     containerId: 'attendance-section',
 *     showProgressBar: true,       // 진행률 바 표시
 *     showAttendeeList: true,      // 참석자 명단 표시
 *     showNoResponse: true,        // 미응답 수 표시
 *     labels: { attending: '참석', not_attending: '불참' }
 *   });
 *   att.load();
 */

function AttendanceComponent(config) {
    this.config = Object.assign({
        showProgressBar: false,
        showAttendeeList: false,
        showNoResponse: false,
        labels: { attending: '참석', not_attending: '불참' }
    }, config);
    this._container = null;
}

// ─── LOAD ───

AttendanceComponent.prototype.load = async function () {
    var container = document.getElementById(this.config.containerId);
    if (!container) return;
    this._container = container;

    try {
        var res = await apiClient.request(this.config.apiBase + '/summary');
        if (!res.success || !res.data) { container.innerHTML = ''; return; }
        var d = res.data;
        container.innerHTML = this._render(d);
        this._bindEvents(container);

        // 참석자 명단 로드
        if (this.config.showAttendeeList) {
            this._loadAttendeeList();
        }
    } catch (e) {
        container.innerHTML = '';
    }
};

// ─── RENDER ───

AttendanceComponent.prototype._render = function (d) {
    var labels = this.config.labels;
    var attending = d.attending || 0;
    var notAttending = d.not_attending || 0;
    var myStatus = d.my_status;

    // 진행률 계산
    var total = d.total_members || d.total || (attending + notAttending) || 1;
    var attendPct = (attending / total * 100);
    var absentPct = (notAttending / total * 100);
    var noResponse = d.no_response || 0;
    var noRespPct = total > 0 ? (noResponse / total * 100) : 0;
    var voted = attending + notAttending;

    var html = '<div class="ac-section">';
    html += '<div class="ac-title">참석 여부</div>';

    // 투표 버튼
    html += '<div class="ac-buttons">';
    html += '<button class="ac-vote-btn ac-attend' + (myStatus === 'attending' ? ' ac-selected' : '') + '" data-action="ac-vote" data-status="attending">';
    html += '<span class="ac-vote-icon" style="color:#2563EB">&#10003;</span>';
    html += '<span class="ac-vote-label">' + labels.attending + '</span>';
    html += '<span class="ac-vote-count">' + attending + '</span>';
    html += '</button>';
    html += '<button class="ac-vote-btn ac-absent' + (myStatus === 'not_attending' ? ' ac-selected' : '') + '" data-action="ac-vote" data-status="not_attending">';
    html += '<span class="ac-vote-icon" style="color:#EF4444">&#10007;</span>';
    html += '<span class="ac-vote-label">' + labels.not_attending + '</span>';
    html += '<span class="ac-vote-count">' + notAttending + '</span>';
    html += '</button>';
    html += '</div>';

    // 진행률 바
    if (this.config.showProgressBar) {
        html += '<div class="ac-progress">';
        html += '<div class="ac-progress-attend" style="width:' + attendPct + '%"></div>';
        html += '<div class="ac-progress-absent" style="width:' + absentPct + '%"></div>';
        if (this.config.showNoResponse) {
            html += '<div class="ac-progress-no-response" style="width:' + noRespPct + '%"></div>';
        }
        html += '</div>';
        html += '<div class="ac-progress-label">응답 ' + voted + '명 / 전체 ' + total + '명';
        if (this.config.showNoResponse) html += ' (미응답 ' + noResponse + '명)';
        html += '</div>';
    }

    // 참석자 명단 영역
    if (this.config.showAttendeeList) {
        html += '<div class="ac-attendee-list" id="ac-attendee-list-' + this.config.containerId + '"></div>';
    }

    html += '</div>';
    return html;
};

// ─── LOAD ATTENDEE LIST ───

AttendanceComponent.prototype._loadAttendeeList = async function () {
    var listId = 'ac-attendee-list-' + this.config.containerId;
    var listEl = document.getElementById(listId);
    if (!listEl) return;

    try {
        var res = await apiClient.request(this.config.apiBase + '/details');
        if (!res.success || !res.data) return;
        var d = res.data;
        var html = '';

        if (d.attending && d.attending.length > 0) {
            html += '<div class="ac-group"><span class="ac-group-label ac-group-attend">참석 (' + d.attending.length + ')</span>';
            html += '<div class="ac-group-names">' + d.attending.map(function (a) { return escapeHtml(a.name || '알 수 없음'); }).join(', ') + '</div></div>';
        }
        if (d.not_attending && d.not_attending.length > 0) {
            html += '<div class="ac-group"><span class="ac-group-label ac-group-absent">불참 (' + d.not_attending.length + ')</span>';
            html += '<div class="ac-group-names">' + d.not_attending.map(function (a) { return escapeHtml(a.name || '알 수 없음'); }).join(', ') + '</div></div>';
        }
        if (d.no_response && d.no_response.length > 0) {
            html += '<div class="ac-group"><span class="ac-group-label ac-group-no-response">미응답 (' + d.no_response.length + ')</span>';
            html += '<div class="ac-group-names">' + d.no_response.map(function (a) { return escapeHtml(a.name || '알 수 없음'); }).join(', ') + '</div></div>';
        }

        listEl.innerHTML = html;
    } catch (e) { }
};

// ─── EVENT BINDING ───

AttendanceComponent.prototype._bindEvents = function (container) {
    var self = this;
    container.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action="ac-vote"]');
        if (!btn) return;
        var status = btn.getAttribute('data-status');
        self._submit(status);
    });
};

// ─── SUBMIT VOTE ───

AttendanceComponent.prototype._submit = async function (status) {
    try {
        var res = await apiClient.request(this.config.apiBase, {
            method: 'POST',
            body: JSON.stringify({ status: status })
        });
        if (res.success) {
            this.load();
        }
    } catch (e) { }
};

// 전역 등록
window.AttendanceComponent = AttendanceComponent;
