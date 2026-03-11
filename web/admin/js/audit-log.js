/* ================================================
   영등포 JC — 관리자 감사 로그
   ================================================ */

function renderAuditLog(container) {
    var currentPage = 1;
    var currentAction = '';
    var startDate = '';
    var endDate = '';

    function actionBadge(action) {
        if (!action) return '<span class="action-badge action-info">-</span>';
        var map = {
            member_approve: { cls: 'action-info', label: '회원 승인' },
            member_reject: { cls: 'action-warning', label: '가입 거절' },
            member_suspend: { cls: 'action-danger', label: '회원 정지' },
            member_unsuspend: { cls: 'action-info', label: '정지 해제' },
            member_role_change: { cls: 'action-warning', label: '역할 변경' },
            member_delete: { cls: 'action-danger', label: '회원 삭제' },
            password_reset: { cls: 'action-warning', label: '비밀번호 초기화' },
            post_delete: { cls: 'action-danger', label: '게시글 삭제' },
            comment_delete: { cls: 'action-danger', label: '댓글 삭제' },
            notice_create: { cls: 'action-info', label: '공지 작성' },
            notice_update: { cls: 'action-warning', label: '공지 수정' },
            notice_delete: { cls: 'action-danger', label: '공지 삭제' },
            schedule_create: { cls: 'action-info', label: '일정 생성' },
            schedule_update: { cls: 'action-warning', label: '일정 수정' },
            schedule_delete: { cls: 'action-danger', label: '일정 삭제' },
            login: { cls: 'action-view', label: '로그인' },
            settings_update: { cls: 'action-warning', label: '설정 변경' },
        };
        var m = map[action];
        if (m) return '<span class="action-badge ' + m.cls + '">' + escapeHtml(m.label) + '</span>';
        return '<span class="action-badge action-view">' + escapeHtml(action) + '</span>';
    }

    function render() {
        var html = '';

        // Toolbar
        html += '<div class="page-toolbar">';
        html += '  <h2 class="page-title">감사 로그</h2>';
        html += '</div>';

        // Filters
        html += '<div class="filter-bar audit-filter-bar">';
        html += '  <select class="filter-select" id="audit-action-filter">';
        html += '    <option value="">전체 액션</option>';
        html += '    <option value="member_approve">회원 승인</option>';
        html += '    <option value="member_reject">가입 거절</option>';
        html += '    <option value="member_suspend">회원 정지</option>';
        html += '    <option value="member_unsuspend">정지 해제</option>';
        html += '    <option value="member_role_change">역할 변경</option>';
        html += '    <option value="member_delete">회원 삭제</option>';
        html += '    <option value="password_reset">비밀번호 초기화</option>';
        html += '    <option value="post_delete">게시글 삭제</option>';
        html += '    <option value="comment_delete">댓글 삭제</option>';
        html += '    <option value="notice_create">공지 작성</option>';
        html += '    <option value="notice_delete">공지 삭제</option>';
        html += '    <option value="schedule_create">일정 생성</option>';
        html += '    <option value="schedule_delete">일정 삭제</option>';
        html += '    <option value="login">로그인</option>';
        html += '    <option value="settings_update">설정 변경</option>';
        html += '  </select>';
        html += '  <div class="date-range-filter">';
        html += '    <input type="date" class="filter-date" id="audit-start-date" placeholder="시작일">';
        html += '    <span class="date-separator">~</span>';
        html += '    <input type="date" class="filter-date" id="audit-end-date" placeholder="종료일">';
        html += '  </div>';
        html += '</div>';

        // Table
        html += '<div class="table-wrap">';
        html += '  <table class="audit-log-table">';
        html += '    <thead><tr>';
        html += '      <th>시간</th>';
        html += '      <th>관리자</th>';
        html += '      <th>액션</th>';
        html += '      <th>대상</th>';
        html += '      <th>상세</th>';
        html += '      <th>IP</th>';
        html += '    </tr></thead>';
        html += '    <tbody id="audit-log-body"></tbody>';
        html += '  </table>';
        html += '</div>';

        // Pagination
        html += '<div id="audit-pagination"></div>';

        container.innerHTML = html;

        // Event listeners
        document.getElementById('audit-action-filter').addEventListener('change', function() {
            currentAction = this.value;
            currentPage = 1;
            loadAuditLog();
        });

        document.getElementById('audit-start-date').addEventListener('change', function() {
            startDate = this.value;
            currentPage = 1;
            loadAuditLog();
        });

        document.getElementById('audit-end-date').addEventListener('change', function() {
            endDate = this.value;
            currentPage = 1;
            loadAuditLog();
        });

        loadAuditLog();
    }

    function loadAuditLog() {
        var tbody = document.getElementById('audit-log-body');
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;"><div class="skeleton" style="width:60%;height:16px;margin:8px auto"></div><div class="skeleton" style="width:80%;height:16px;margin:8px auto"></div><div class="skeleton" style="width:50%;height:16px;margin:8px auto"></div></td></tr>';

        var params = 'page=' + currentPage + '&limit=20';
        if (currentAction) params += '&action=' + encodeURIComponent(currentAction);
        if (startDate) params += '&start_date=' + encodeURIComponent(startDate);
        if (endDate) params += '&end_date=' + encodeURIComponent(endDate);

        AdminAPI.get('/api/admin/audit-log?' + params)
            .then(function(res) {
                var items = [];
                var total = 0;
                var totalPages = 1;

                if (res && res.success && res.data) {
                    items = res.data.items || res.data.logs || [];
                    total = res.data.total || items.length;
                    totalPages = res.data.totalPages || Math.ceil(total / 20) || 1;
                } else if (res && Array.isArray(res.data)) {
                    items = res.data;
                    total = items.length;
                }

                if (items.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="table-empty"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg><p>감사 로그가 없습니다.</p></td></tr>';
                    document.getElementById('audit-pagination').innerHTML = '';
                    return;
                }

                var html = '';
                items.forEach(function(log) {
                    html += '<tr>';
                    html += '<td class="text-sm">' + formatDateTime(log.created_at || log.timestamp) + '</td>';
                    html += '<td>' + escapeHtml(log.admin_name || log.admin || '-') + '</td>';
                    html += '<td>' + actionBadge(log.action || log.action_type) + '</td>';
                    html += '<td>' + escapeHtml(log.target || log.target_name || '-') + '</td>';
                    html += '<td class="text-sm text-sub">' + escapeHtml(log.details || log.description || '-') + '</td>';
                    html += '<td class="text-sm text-sub">' + escapeHtml(log.ip || log.ip_address || '-') + '</td>';
                    html += '</tr>';
                });
                tbody.innerHTML = html;

                renderPagination(
                    document.getElementById('audit-pagination'),
                    currentPage,
                    totalPages,
                    function(p) { currentPage = p; loadAuditLog(); }
                );
            })
            .catch(function(err) {
                tbody.innerHTML = '<tr><td colspan="6" class="table-empty"><p>감사 로그를 불러올 수 없습니다.</p><p class="text-sm text-sub">' + escapeHtml(err.message) + '</p></td></tr>';
                document.getElementById('audit-pagination').innerHTML = '';
            });
    }

    render();
}
