/* ================================================
   영등포 JC — 관리자 일정 관리
   ================================================ */

var schedulesState = { search: '', category: '', month: '' };

function renderSchedules(container) {
    var now = new Date();
    var curMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    if (!schedulesState.month) schedulesState.month = '';

    container.innerHTML =
        '<div class="page-toolbar">' +
            '<h2 class="page-title">일정 관리</h2>' +
            '<span class="page-count" id="schedules-count">-</span>' +
            '<button class="btn btn-primary btn-sm" onclick="openScheduleModal()">+ 일정 추가</button>' +
            '<div class="search-box">' +
                '<svg class="search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                '<input type="text" class="search-input" id="schedules-search" placeholder="제목, 장소 검색...">' +
            '</div>' +
        '</div>' +
        '<div class="filter-bar">' +
            '<select class="filter-select" id="filter-sched-month">' +
                '<option value="">전체 기간</option>' +
                buildMonthOptions(curMonth) +
            '</select>' +
            '<select class="filter-select" id="filter-sched-cat">' +
                '<option value="">전체 카테고리</option>' +
                '<option value="행사">행사</option>' +
                '<option value="회의">회의</option>' +
                '<option value="교육">교육</option>' +
                '<option value="공휴일">공휴일</option>' +
                '<option value="기타">기타</option>' +
            '</select>' +
        '</div>' +
        '<div id="schedules-table-wrap"></div>';

    document.getElementById('filter-sched-month').value = schedulesState.month;
    document.getElementById('filter-sched-cat').value = schedulesState.category;

    var searchTimer;
    document.getElementById('schedules-search').addEventListener('input', function(e) {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function() {
            schedulesState.search = e.target.value.trim();
            loadSchedules();
        }, 400);
    });

    document.getElementById('filter-sched-month').addEventListener('change', function(e) {
        schedulesState.month = e.target.value;
        loadSchedules();
    });

    document.getElementById('filter-sched-cat').addEventListener('change', function(e) {
        schedulesState.category = e.target.value;
        loadSchedules();
    });

    loadSchedules();
}

function buildMonthOptions(curMonth) {
    var html = '';
    var parts = curMonth.split('-');
    var y = parseInt(parts[0]);
    var m = parseInt(parts[1]);
    for (var i = 0; i < 12; i++) {
        var my = m - i <= 0 ? y - 1 : y;
        var mm = m - i <= 0 ? m - i + 12 : m - i;
        var val = my + '-' + String(mm).padStart(2, '0');
        html += '<option value="' + val + '">' + my + '년 ' + mm + '월</option>';
    }
    return html;
}

function scheduleCatBadge(cat) {
    var colors = {
        '행사': 'blue', '회의': 'green', '교육': 'yellow', '공휴일': 'red', '기타': ''
    };
    var c = colors[cat] || '';
    if (c) return '<span class="badge badge-cat-' + c + '">' + escapeHtml(cat) + '</span>';
    return '<span class="badge badge-general">' + escapeHtml(cat || '-') + '</span>';
}

async function loadSchedules() {
    var wrap = document.getElementById('schedules-table-wrap');
    showTableSkeleton(wrap, 5);

    try {
        var params = new URLSearchParams({ limit: 50 });
        if (schedulesState.month) params.set('month', schedulesState.month);
        if (schedulesState.category) params.set('category', schedulesState.category);

        var res = await AdminAPI.get('/api/admin/schedules?' + params.toString());
        if (!res.success) throw new Error(res.message);

        var schedules = res.schedules || [];

        // Client-side search filter
        if (schedulesState.search) {
            var q = schedulesState.search.toLowerCase();
            schedules = schedules.filter(function(s) {
                return (s.title && s.title.toLowerCase().indexOf(q) >= 0) ||
                       (s.location && s.location.toLowerCase().indexOf(q) >= 0);
            });
        }

        document.getElementById('schedules-count').textContent = '총 ' + schedules.length + '건';

        if (!schedules.length) {
            wrap.innerHTML = '<div class="table-wrap"><div class="table-empty"><p>일정이 없습니다.</p></div></div>';
            return;
        }

        var html = '<div class="table-wrap"><table>' +
            '<thead><tr>' +
                '<th>날짜</th><th>시간</th><th>제목</th><th>장소</th><th>카테고리</th><th>관리</th>' +
            '</tr></thead><tbody>';

        schedules.forEach(function(s) {
            html += '<tr>' +
                '<td class="text-sub text-sm">' + formatDate(s.date) + '</td>' +
                '<td class="text-sub text-sm">' + escapeHtml(s.time || '-') + '</td>' +
                '<td><span style="font-weight:500">' + escapeHtml(s.title) + '</span></td>' +
                '<td class="text-sub">' + escapeHtml(s.location || '-') + '</td>' +
                '<td>' + scheduleCatBadge(s.category) + '</td>' +
                '<td><div class="action-btns">' +
                    '<button class="btn btn-ghost btn-sm" onclick="showAttendanceModal(' + s.id + ')">참석현황</button>' +
                    '<button class="btn btn-ghost btn-sm" onclick="openScheduleModal(' + s.id + ')">수정</button>' +
                    '<button class="btn btn-danger btn-sm" onclick="confirmDeleteSchedule(' + s.id + ')">삭제</button>' +
                '</div></td>' +
            '</tr>';
        });

        html += '</tbody></table></div>';
        wrap.innerHTML = html;
    } catch (err) {
        wrap.innerHTML = '<div class="table-wrap"><div class="table-empty"><p>일정을 불러올 수 없습니다.</p></div></div>';
        console.error('Load schedules error:', err);
    }
}

function openScheduleModal(editId) {
    var isEdit = !!editId;
    var titleText = isEdit ? '일정 수정' : '일정 추가';

    var html =
        '<div class="modal">' +
            '<div class="modal-header"><h3>' + titleText + '</h3>' +
                '<button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<div class="form-field"><label>제목 *</label><input type="text" id="sched-title"></div>' +
                '<div style="display:flex;gap:12px">' +
                    '<div class="form-field" style="flex:1"><label>날짜 *</label><input type="date" id="sched-date"></div>' +
                    '<div class="form-field" style="flex:1"><label>시간</label><input type="time" id="sched-time"></div>' +
                '</div>' +
                '<div class="form-field"><label>장소</label><input type="text" id="sched-location"></div>' +
                '<div class="form-field"><label>카테고리</label>' +
                    '<select id="sched-category">' +
                        '<option value="">선택</option>' +
                        '<option value="행사">행사</option><option value="회의">회의</option>' +
                        '<option value="교육">교육</option><option value="공휴일">공휴일</option>' +
                        '<option value="기타">기타</option>' +
                    '</select>' +
                '</div>' +
                '<div class="form-field"><label>설명</label><textarea id="sched-desc" rows="3"></textarea></div>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button>' +
                '<button class="btn btn-primary btn-sm" id="sched-save-btn">' + (isEdit ? '수정' : '추가') + '</button>' +
            '</div>' +
        '</div>';

    openModal(html);

    if (isEdit) {
        loadScheduleForEdit(editId);
    }

    document.getElementById('sched-save-btn').addEventListener('click', function() {
        saveSchedule(editId || null);
    });
}

async function loadScheduleForEdit(id) {
    try {
        var res = await AdminAPI.get('/api/admin/schedules?limit=200');
        if (!res.success) return;
        var s = (res.schedules || []).find(function(x) { return x.id === id; });
        if (!s) return;

        document.getElementById('sched-title').value = s.title || '';
        if (s.date) {
            var d = new Date(s.date);
            document.getElementById('sched-date').value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        }
        document.getElementById('sched-time').value = s.time || '';
        document.getElementById('sched-location').value = s.location || '';
        document.getElementById('sched-category').value = s.category || '';
        document.getElementById('sched-desc').value = s.desc || '';
    } catch (err) {
        console.error('Load schedule for edit error:', err);
    }
}

async function saveSchedule(editId) {
    var title = document.getElementById('sched-title').value.trim();
    var date = document.getElementById('sched-date').value;
    var time = document.getElementById('sched-time').value;
    var location = document.getElementById('sched-location').value.trim();
    var category = document.getElementById('sched-category').value;
    var desc = document.getElementById('sched-desc').value.trim();

    if (!title || !date) {
        showAdminToast('제목과 날짜는 필수입니다.', 'error');
        return;
    }

    var body = { title: title, date: date, time: time, location: location, category: category, desc: desc };

    try {
        if (editId) {
            await AdminAPI.put('/api/admin/schedules/' + editId, body);
            showAdminToast('일정이 수정되었습니다.');
        } else {
            await AdminAPI.post('/api/admin/schedules', body);
            showAdminToast('일정이 추가되었습니다.');
        }
        closeModal();
        loadSchedules();
    } catch (err) {
        showAdminToast('저장 실패: ' + err.message, 'error');
    }
}

function confirmDeleteSchedule(id) {
    openModal(
        '<div class="modal modal-sm">' +
            '<div class="modal-header"><h3>일정 삭제</h3></div>' +
            '<div class="modal-body"><p>이 일정을 삭제하시겠습니까?</p></div>' +
            '<div class="modal-footer">' +
                '<button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteSchedule(' + id + ')">삭제</button>' +
            '</div>' +
        '</div>'
    );
}

async function deleteSchedule(id) {
    try {
        await AdminAPI.delete('/api/admin/schedules/' + id);
        showAdminToast('일정이 삭제되었습니다.');
        closeModal();
        loadSchedules();
    } catch (err) {
        showAdminToast('삭제 실패: ' + err.message, 'error');
    }
}

// ========== 참석 현황 모달 ==========

async function showAttendanceModal(scheduleId) {
    var html =
        '<div class="modal">' +
            '<div class="modal-header"><h3>참석 현황</h3>' +
                '<button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
            '</div>' +
            '<div class="modal-body" id="attendance-modal-body">' +
                '<div style="text-align:center;padding:24px;color:var(--c-text-hint)">로딩 중...</div>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button class="btn btn-ghost btn-sm" onclick="exportAttendanceCsv(' + scheduleId + ')">CSV 내보내기</button>' +
                '<button class="btn btn-primary btn-sm" onclick="closeModal()">닫기</button>' +
            '</div>' +
        '</div>';

    openModal(html);

    try {
        var summaryRes = await AdminAPI.get('/api/schedules/' + scheduleId + '/attendance/summary');
        var detailRes = await AdminAPI.get('/api/schedules/' + scheduleId + '/attendance/details');

        if (!summaryRes.success || !detailRes.success) throw new Error('데이터 조회 실패');

        var s = summaryRes.data;
        var d = detailRes.data;

        var bodyHtml = '';

        // 통계 요약
        bodyHtml += '<div style="display:flex;gap:12px;margin-bottom:16px">'
            + '<div style="flex:1;text-align:center;padding:12px;background:var(--c-success-bg);border-radius:8px">'
            + '<div style="font-size:20px;font-weight:700;color:var(--c-success)">' + s.attending + '</div>'
            + '<div style="font-size:12px;color:var(--c-text-sub)">참석</div></div>'
            + '<div style="flex:1;text-align:center;padding:12px;background:var(--c-danger-bg);border-radius:8px">'
            + '<div style="font-size:20px;font-weight:700;color:var(--c-danger)">' + s.not_attending + '</div>'
            + '<div style="font-size:12px;color:var(--c-text-sub)">불참</div></div>'
            + '<div style="flex:1;text-align:center;padding:12px;background:var(--c-bg);border-radius:8px">'
            + '<div style="font-size:20px;font-weight:700;color:var(--c-text-hint)">' + s.no_response + '</div>'
            + '<div style="font-size:12px;color:var(--c-text-sub)">미응답</div></div>'
            + '</div>';

        bodyHtml += '<div style="font-size:13px;color:var(--c-text-sub);margin-bottom:12px">전체 회원: ' + s.total_members + '명</div>';

        // 그룹별 명단
        function renderAdminGroup(title, color, members) {
            if (!members || members.length === 0) return '<div style="margin-bottom:12px"><div style="font-weight:600;font-size:13px;color:' + color + ';margin-bottom:4px">' + title + ' (0명)</div><div style="font-size:13px;color:var(--c-text-hint)">없음</div></div>';
            var names = members.map(function(m) {
                var pos = m.jc_position ? ' <span style="color:var(--c-text-hint);font-size:12px">(' + escapeHtml(m.jc_position) + ')</span>' : '';
                return escapeHtml(m.name) + pos;
            }).join(', ');
            return '<div style="margin-bottom:12px"><div style="font-weight:600;font-size:13px;color:' + color + ';margin-bottom:4px">' + title + ' (' + members.length + '명)</div><div style="font-size:13px;line-height:1.6">' + names + '</div></div>';
        }

        bodyHtml += renderAdminGroup('참석', '#16A34A', d.attending);
        bodyHtml += renderAdminGroup('불참', '#DC2626', d.not_attending);
        if (d.no_response) {
            bodyHtml += renderAdminGroup('미응답', '#9CA3AF', d.no_response);
        }

        document.getElementById('attendance-modal-body').innerHTML = bodyHtml;
    } catch (err) {
        document.getElementById('attendance-modal-body').innerHTML = '<div style="text-align:center;padding:24px;color:var(--c-danger)">참석 현황을 불러올 수 없습니다.<br><span style="font-size:13px;color:var(--c-text-hint)">' + escapeHtml(err.message) + '</span></div>';
    }
}

async function exportAttendanceCsv(scheduleId) {
    try {
        var token = AdminAPI.getToken();
        var res = await fetch('/api/schedules/' + scheduleId + '/attendance/export', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('내보내기 실패');
        var blob = await res.blob();
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_' + scheduleId + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        showAdminToast('CSV 파일이 다운로드되었습니다.');
    } catch (err) {
        showAdminToast('CSV 내보내기 실패: ' + err.message, 'error');
    }
}
