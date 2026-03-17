// 조직도 관리 (수기 입력 + 회원 매칭)

async function loadOrgChartScreen() {
    var container = document.getElementById('org-chart-content');
    if (!container) return;

    var userInfo = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user_info') || 'null');
    var isManager = userInfo && ['admin', 'super_admin', 'local_admin'].includes(userInfo.role);

    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-secondary)">로딩 중...</div>';

    try {
        var res = await apiClient.request('/orgchart');
        if (!res.success) throw new Error(res.error);
        var groups = res.data || [];

        var html = '';
        if (isManager) {
            html += '<div style="margin-bottom:16px"><button class="btn btn-primary btn-sm" onclick="showAddGroupForm()">+ 그룹 추가</button></div>';
            html += '<div id="add-group-form" style="display:none;margin-bottom:16px;padding:12px;border:1px solid var(--border-color);border-radius:8px">'
                + '<input type="text" id="new-group-name" placeholder="그룹명 (예: 회장단, 운영위원회)" style="width:100%;padding:8px;border:1px solid var(--border-color);border-radius:6px;margin-bottom:8px;box-sizing:border-box">'
                + '<div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" onclick="addOrgGroup()">등록</button>'
                + '<button class="btn btn-secondary btn-sm" onclick="document.getElementById(\'add-group-form\').style.display=\'none\'">취소</button></div></div>';
        }

        if (groups.length === 0) {
            html += '<div style="text-align:center;padding:40px 0;color:var(--text-secondary)">조직도가 아직 등록되지 않았습니다.</div>';
        } else {
            groups.forEach(function(g) {
                html += '<div class="orgchart-group" style="margin-bottom:20px;border:1px solid var(--border-color);border-radius:12px;overflow:hidden">';
                html += '<div class="orgchart-group-header" style="background:#F3F4F6;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">';
                html += '<h3 style="margin:0;font-size:15px;font-weight:700">' + escapeHtml(g.name) + '</h3>';
                if (isManager) {
                    html += '<div style="display:flex;gap:6px">'
                        + '<button class="btn btn-sm btn-secondary" style="font-size:11px" onclick="showAddMemberForm(' + g.id + ')">+ 인원 추가</button>'
                        + '<button class="btn btn-sm" style="font-size:11px;color:#DC2626" onclick="deleteOrgGroup(' + g.id + ')">삭제</button>'
                        + '</div>';
                }
                html += '</div>';

                // 멤버 목록
                html += '<div style="padding:8px 16px">';
                if (g.members && g.members.length > 0) {
                    g.members.forEach(function(m) {
                        var name = m.user_name || m.manual_name || '미지정';
                        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F3F4F6">';
                        html += '<div style="display:flex;align-items:center;gap:10px">';
                        if (m.profile_image) {
                            html += '<img src="' + escapeHtml(m.profile_image) + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover">';
                        } else {
                            html += '<div style="width:32px;height:32px;border-radius:50%;background:#DBEAFE;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#1E40AF">' + escapeHtml(name[0]) + '</div>';
                        }
                        html += '<div><span style="font-weight:600;font-size:14px">' + escapeHtml(m.position_title) + '</span>'
                            + ' <span style="color:var(--text-secondary);font-size:13px">' + escapeHtml(name) + '</span></div>';
                        html += '</div>';
                        if (isManager) {
                            html += '<button style="background:none;border:none;color:#DC2626;cursor:pointer;font-size:12px" onclick="deleteOrgMember(' + m.id + ')">삭제</button>';
                        }
                        html += '</div>';
                    });
                } else {
                    html += '<div style="color:var(--text-secondary);font-size:13px;padding:8px 0">등록된 인원이 없습니다.</div>';
                }
                html += '</div>';

                // 인원 추가 폼 (숨김)
                if (isManager) {
                    html += '<div id="add-member-form-' + g.id + '" style="display:none;padding:12px 16px;border-top:1px solid var(--border-color);background:#FAFAFA">'
                        + '<div style="display:flex;gap:8px;margin-bottom:8px">'
                        + '<input type="text" id="member-position-' + g.id + '" placeholder="직책 (예: 회장, 부회장)" style="flex:1;padding:8px;border:1px solid var(--border-color);border-radius:6px">'
                        + '</div>'
                        + '<div style="display:flex;gap:8px;margin-bottom:8px">'
                        + '<input type="text" id="member-search-' + g.id + '" placeholder="회원 이름 검색 또는 수기 입력" style="flex:1;padding:8px;border:1px solid var(--border-color);border-radius:6px">'
                        + '<button class="btn btn-sm btn-secondary" onclick="searchOrgchartMember(' + g.id + ')">검색</button>'
                        + '</div>'
                        + '<div id="member-search-results-' + g.id + '"></div>'
                        + '<div style="margin-top:8px"><button class="btn btn-sm btn-primary" onclick="addOrgMemberManual(' + g.id + ')">수기 등록</button>'
                        + ' <button class="btn btn-sm btn-secondary" onclick="document.getElementById(\'add-member-form-' + g.id + '\').style.display=\'none\'">취소</button></div>'
                        + '</div>';
                }

                html += '</div>';
            });
        }

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<div style="color:#DC2626;text-align:center;padding:40px">' + escapeHtml(err.message || '조직도를 불러올 수 없습니다.') + '</div>';
    }
}

function showAddGroupForm() {
    var form = document.getElementById('add-group-form');
    if (form) { form.style.display = 'block'; document.getElementById('new-group-name').focus(); }
}

async function addOrgGroup() {
    var name = document.getElementById('new-group-name')?.value?.trim();
    if (!name) { showToast('그룹명을 입력하세요', 'error'); return; }
    try {
        var res = await fetch('/api/orgchart/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
            body: JSON.stringify({ name: name })
        });
        var data = await res.json();
        if (data.success) { showToast('그룹이 추가되었습니다'); loadOrgChartScreen(); }
        else showToast(data.error || '추가 실패', 'error');
    } catch (err) { showToast('오류: ' + err.message, 'error'); }
}

async function deleteOrgGroup(groupId) {
    if (!confirm('이 그룹을 삭제하시겠습니까?\n소속 인원도 함께 삭제됩니다.')) return;
    try {
        var res = await fetch('/api/orgchart/groups/' + groupId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
        });
        var data = await res.json();
        if (data.success) { showToast('삭제 완료'); loadOrgChartScreen(); }
        else showToast(data.error || '삭제 실패', 'error');
    } catch (err) { showToast('오류: ' + err.message, 'error'); }
}

function showAddMemberForm(groupId) {
    var form = document.getElementById('add-member-form-' + groupId);
    if (form) form.style.display = 'block';
}

async function searchOrgchartMember(groupId) {
    var q = document.getElementById('member-search-' + groupId)?.value?.trim();
    if (!q) return;
    var el = document.getElementById('member-search-results-' + groupId);
    if (!el) return;
    el.innerHTML = '검색 중...';
    try {
        var res = await apiClient.request('/members/search?q=' + encodeURIComponent(q));
        var members = res.members || [];
        if (members.length === 0) { el.innerHTML = '<div style="font-size:13px;color:var(--text-secondary)">검색 결과 없음</div>'; return; }
        el.innerHTML = members.map(function(m) {
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F3F4F6">'
                + '<span style="font-size:13px">' + escapeHtml(m.name) + ' (' + escapeHtml(m.email) + ')</span>'
                + '<button class="btn btn-sm btn-primary" style="font-size:11px" onclick="addOrgMemberUser(' + groupId + ',' + m.id + ',\'' + escapeHtml(m.name).replace(/'/g,"\\'") + '\')">선택</button>'
                + '</div>';
        }).join('');
    } catch (_) { el.innerHTML = '<div style="color:#DC2626;font-size:13px">검색 실패</div>'; }
}

async function addOrgMemberUser(groupId, userId, userName) {
    var position = document.getElementById('member-position-' + groupId)?.value?.trim();
    if (!position) { showToast('직책을 입력하세요', 'error'); return; }
    try {
        var res = await fetch('/api/orgchart/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
            body: JSON.stringify({ group_id: groupId, position_title: position, user_id: userId })
        });
        var data = await res.json();
        if (data.success) { showToast(userName + ' 추가 완료'); loadOrgChartScreen(); }
        else showToast(data.error || '추가 실패', 'error');
    } catch (err) { showToast('오류: ' + err.message, 'error'); }
}

async function addOrgMemberManual(groupId) {
    var position = document.getElementById('member-position-' + groupId)?.value?.trim();
    var name = document.getElementById('member-search-' + groupId)?.value?.trim();
    if (!position) { showToast('직책을 입력하세요', 'error'); return; }
    if (!name) { showToast('이름을 입력하세요', 'error'); return; }
    try {
        var res = await fetch('/api/orgchart/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
            body: JSON.stringify({ group_id: groupId, position_title: position, manual_name: name })
        });
        var data = await res.json();
        if (data.success) { showToast(name + ' 추가 완료'); loadOrgChartScreen(); }
        else showToast(data.error || '추가 실패', 'error');
    } catch (err) { showToast('오류: ' + err.message, 'error'); }
}

async function deleteOrgMember(memberId) {
    if (!confirm('이 인원을 삭제하시겠습니까?')) return;
    try {
        var res = await fetch('/api/orgchart/members/' + memberId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
        });
        var data = await res.json();
        if (data.success) { showToast('삭제 완료'); loadOrgChartScreen(); }
        else showToast(data.error || '삭제 실패', 'error');
    } catch (err) { showToast('오류: ' + err.message, 'error'); }
}
