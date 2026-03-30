/* ================================================
   영등포 JC — 관리자 공지사항 관리
   ================================================ */

var noticesState = { search: '', pinFilter: '' };

function renderNotices(container) {
    container.innerHTML =
        '<div class="page-toolbar">' +
            '<h2 class="page-title">공지사항 관리</h2>' +
            '<span class="page-count" id="notices-count">-</span>' +
            '<button class="btn btn-primary btn-sm" onclick="openNoticeModal()">+ 공지 작성</button>' +
            '<div class="search-box">' +
                '<svg class="search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                '<input type="text" class="search-input" id="notices-search" placeholder="제목 검색...">' +
            '</div>' +
        '</div>' +
        '<div class="filter-bar">' +
            '<select class="filter-select" id="filter-pin">' +
                '<option value="">전체</option>' +
                '<option value="pinned">고정 공지만</option>' +
                '<option value="normal">일반 공지만</option>' +
            '</select>' +
        '</div>' +
        '<div id="notices-table-wrap"></div>';

    document.getElementById('filter-pin').value = noticesState.pinFilter;

    var searchTimer;
    document.getElementById('notices-search').addEventListener('input', function(e) {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function() {
            noticesState.search = e.target.value.trim();
            loadNotices();
        }, 400);
    });

    document.getElementById('filter-pin').addEventListener('change', function(e) {
        noticesState.pinFilter = e.target.value;
        loadNotices();
    });

    loadNotices();
}

async function loadNotices() {
    var wrap = document.getElementById('notices-table-wrap');
    showTableSkeleton(wrap, 5);

    try {
        var res = await AdminAPI.get('/api/admin/notices?limit=100');
        if (!res.success) throw new Error(res.message);

        var notices = res.notices || [];

        // Client-side filtering
        if (noticesState.search) {
            var q = noticesState.search.toLowerCase();
            notices = notices.filter(function(n) {
                return n.title && n.title.toLowerCase().indexOf(q) >= 0;
            });
        }
        if (noticesState.pinFilter === 'pinned') {
            notices = notices.filter(function(n) { return n.pinned; });
        } else if (noticesState.pinFilter === 'normal') {
            notices = notices.filter(function(n) { return !n.pinned; });
        }

        document.getElementById('notices-count').textContent = '총 ' + notices.length + '건';

        if (!notices.length) {
            wrap.innerHTML = '<div class="table-wrap"><div class="table-empty"><p>공지사항이 없습니다.</p></div></div>';
            return;
        }

        var html = '<div class="table-wrap"><table>' +
            '<thead><tr>' +
                '<th style="width:40px"></th><th>제목</th><th>작성자</th><th>조회</th><th>작성일</th><th>관리</th>' +
            '</tr></thead><tbody>';

        notices.forEach(function(n) {
            var pinIcon = n.pinned
                ? '<span class="pin-badge pinned" title="고정 해제" onclick="toggleNoticePin(' + n.id + ', false)" style="cursor:pointer">&#x1f4cc;</span>'
                : '<span class="pin-badge" title="고정" onclick="toggleNoticePin(' + n.id + ', true)" style="cursor:pointer;opacity:0.3">&#x1f4cc;</span>';

            html += '<tr>' +
                '<td>' + pinIcon + '</td>' +
                '<td><span style="font-weight:500">' + escapeHtml(n.title) + '</span></td>' +
                '<td class="text-sub">' + escapeHtml(n.author_name || '-') + '</td>' +
                '<td class="text-sub text-sm">' + (n.views || 0) + '</td>' +
                '<td class="text-sub text-sm">' + formatDate(n.created_at) + '</td>' +
                '<td><div class="action-btns">' +
                    '<button class="btn btn-ghost btn-sm" onclick="openNoticeModal(' + n.id + ')">수정</button>' +
                    '<button class="btn btn-danger btn-sm" onclick="confirmDeleteNotice(' + n.id + ')">삭제</button>' +
                '</div></td>' +
            '</tr>';
        });

        html += '</tbody></table></div>';
        wrap.innerHTML = html;
    } catch (err) {
        wrap.innerHTML = '<div class="table-wrap"><div class="table-empty"><p>공지사항을 불러올 수 없습니다.</p></div></div>';
        console.error('Load notices error:', err);
    }
}

function openNoticeModal(editId) {
    var isEdit = !!editId;
    var titleText = isEdit ? '공지 수정' : '공지 작성';

    var html =
        '<div class="modal">' +
            '<div class="modal-header"><h3>' + titleText + '</h3>' +
                '<button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<div class="form-field"><label>제목 *</label><input type="text" id="notice-title"></div>' +
                '<div class="form-field"><label>내용 *</label><textarea id="notice-content" rows="6"></textarea></div>' +
                '<div class="form-field" style="display:flex;align-items:center;gap:8px">' +
                    '<input type="checkbox" id="notice-pinned" style="width:auto">' +
                    '<label for="notice-pinned" style="margin:0;cursor:pointer">상단 고정</label>' +
                '</div>' +
                '<div class="form-field">' +
                    '<label>연결 일정 <span style="font-size:11px;color:var(--c-text-hint);font-weight:400">(선택)</span></label>' +
                    '<select id="notice-schedule-id"><option value="">연결 일정 없음</option></select>' +
                '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
                '<button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button>' +
                '<button class="btn btn-primary btn-sm" id="notice-save-btn">' + (isEdit ? '수정' : '작성') + '</button>' +
            '</div>' +
        '</div>';

    openModal(html);

    // M-12: 일정 드롭다운 로드
    loadAdminScheduleOptions();

    if (isEdit) {
        loadNoticeForEdit(editId);
    }

    document.getElementById('notice-save-btn').addEventListener('click', function() {
        saveNotice(editId || null);
    });
}

async function loadNoticeForEdit(id) {
    try {
        var res = await AdminAPI.get('/api/admin/notices?limit=200');
        if (!res.success) return;
        var n = (res.notices || []).find(function(x) { return x.id === id; });
        if (!n) return;

        document.getElementById('notice-title').value = n.title || '';
        document.getElementById('notice-content').value = n.content || '';
        document.getElementById('notice-pinned').checked = !!n.pinned;
        var schedSel = document.getElementById('notice-schedule-id');
        if (schedSel && (n.schedule_id || n.linked_schedule_id)) {
            schedSel.value = String(n.schedule_id || n.linked_schedule_id);
        }
    } catch (err) {
        console.error('Load notice for edit error:', err);
    }
}

// M-12: 관리자 일정 드롭다운 로드
async function loadAdminScheduleOptions() {
    var sel = document.getElementById('notice-schedule-id');
    if (!sel) return;
    try {
        var res = await AdminAPI.get('/api/admin/schedules?limit=100');
        if (!res.success) return;
        var schedules = res.schedules || [];
        var html = '<option value="">연결 일정 없음</option>';
        schedules.forEach(function(s) {
            var dateStr = s.start_date ? s.start_date.split('T')[0] : '';
            var label = (dateStr ? '[' + dateStr + '] ' : '') + (s.title || '제목 없음');
            html += '<option value="' + s.id + '">' + escapeHtml(label) + '</option>';
        });
        sel.innerHTML = html;
    } catch (err) {
        console.error('Load schedules error:', err);
    }
}

async function saveNotice(editId) {
    var title = document.getElementById('notice-title').value.trim();
    var content = document.getElementById('notice-content').value.trim();
    var pinned = document.getElementById('notice-pinned').checked;

    if (!title || !content) {
        showAdminToast('제목과 내용을 입력하세요.', 'error');
        return;
    }

    var schedSel = document.getElementById('notice-schedule-id');
    var scheduleId = schedSel && schedSel.value ? parseInt(schedSel.value, 10) : null;
    var body = { title: title, content: content, pinned: pinned };
    if (scheduleId && !isNaN(scheduleId)) body.schedule_id = scheduleId;

    try {
        if (editId) {
            await AdminAPI.put('/api/admin/notices/' + editId, body);
            showAdminToast('공지사항이 수정되었습니다.');
        } else {
            await AdminAPI.post('/api/admin/notices', body);
            showAdminToast('공지사항이 작성되었습니다.');
        }
        closeModal();
        loadNotices();
    } catch (err) {
        showAdminToast('저장 실패: ' + err.message, 'error');
    }
}

async function toggleNoticePin(id, pinned) {
    try {
        // Fetch current notice data to preserve title/content
        var res = await AdminAPI.get('/api/admin/notices?limit=200');
        if (!res.success) throw new Error(res.message);
        var n = (res.notices || []).find(function(x) { return x.id === id; });
        if (!n) throw new Error('공지를 찾을 수 없습니다.');

        await AdminAPI.put('/api/admin/notices/' + id, {
            title: n.title,
            content: n.content,
            pinned: pinned
        });
        showAdminToast(pinned ? '공지가 고정되었습니다.' : '고정이 해제되었습니다.');
        loadNotices();
    } catch (err) {
        showAdminToast('고정 변경 실패: ' + err.message, 'error');
    }
}

function confirmDeleteNotice(id) {
    openModal(
        '<div class="modal modal-sm">' +
            '<div class="modal-header"><h3>공지 삭제</h3></div>' +
            '<div class="modal-body"><p>이 공지사항을 삭제하시겠습니까?<br>삭제된 공지는 복구할 수 없습니다.</p></div>' +
            '<div class="modal-footer">' +
                '<button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteNotice(' + id + ')">삭제</button>' +
            '</div>' +
        '</div>'
    );
}

async function deleteNotice(id) {
    try {
        await AdminAPI.delete('/api/admin/notices/' + id);
        showAdminToast('공지사항이 삭제되었습니다.');
        closeModal();
        loadNotices();
    } catch (err) {
        showAdminToast('삭제 실패: ' + err.message, 'error');
    }
}
