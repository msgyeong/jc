// 조직도 관리 (리뉴얼 디자인)

var DEFAULT_AVATAR_SVG_OC = '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="15" r="6" fill="#A0C4E8"/><ellipse cx="20" cy="32" rx="11" ry="8" fill="#A0C4E8"/></svg>';

async function loadOrgChartScreen() {
    var container = document.getElementById('org-chart-content');
    if (!container) return;

    var userInfo = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user_info') || 'null');
    var isManager = userInfo && ['admin', 'super_admin', 'local_admin'].includes(userInfo.role);

    container.innerHTML = '<div class="oc-loading">로딩 중...</div>';

    try {
        var res = await apiClient.request('/orgchart');
        if (!res.success) throw new Error(res.error);
        var groups = res.data || [];

        var html = '';

        // 그룹 추가 폼 (관리자용 — 숨김 상태)
        if (isManager) {
            html += '<div id="add-group-form" class="oc-add-group-form" style="display:none">'
                + '<input type="text" id="new-group-name" class="oc-input" placeholder="그룹명 (예: 회장단, 운영위원회)">'
                + '<div class="oc-form-actions">'
                + '<button class="oc-btn oc-btn-primary" onclick="addOrgGroup()">등록</button>'
                + '<button class="oc-btn oc-btn-ghost" onclick="document.getElementById(\'add-group-form\').style.display=\'none\'">취소</button>'
                + '</div></div>';
        }

        if (groups.length === 0) {
            html += '<div class="oc-empty">조직도가 아직 등록되지 않았습니다.</div>';
        } else {
            groups.forEach(function(g) {
                html += renderOrgGroup(g, isManager);
            });
        }

        // 하단: 그룹 추가 버튼 (관리자)
        if (isManager) {
            html += '<button class="oc-add-group-btn" onclick="showAddGroupForm()">'
                + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
                + ' 그룹 추가</button>';
        }

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<div class="oc-error">' + escapeHtml(err.message || '조직도를 불러올 수 없습니다.') + '</div>';
    }
}

function renderOrgGroup(g, isManager) {
    var html = '<div class="oc-group">';

    // 그룹 헤더
    html += '<div class="oc-group-header">';
    html += '<div class="oc-group-title">';
    html += '<span class="oc-group-name">' + escapeHtml(g.name) + '</span>';
    html += '<span class="oc-group-count">' + (g.members ? g.members.length : 0) + '명</span>';
    html += '</div>';
    if (isManager) {
        html += '<div class="oc-group-actions">'
            + '<button class="oc-header-btn oc-header-btn-add" onclick="showAddMemberForm(' + g.id + ')">'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>'
            + ' 인원 추가</button>'
            + '<button class="oc-header-btn oc-header-btn-delete" onclick="deleteOrgGroup(' + g.id + ')" aria-label="그룹 삭제">'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>'
            + '</button>'
            + '</div>';
    }
    html += '</div>';

    // 멤버 목록
    html += '<div class="oc-member-list">';
    if (g.members && g.members.length > 0) {
        g.members.forEach(function(m) {
            html += renderOrgMember(m, isManager);
        });
    } else {
        html += '<div class="oc-member-empty">등록된 인원이 없습니다.</div>';
    }
    html += '</div>';

    // 인원 추가 폼 (숨김)
    if (isManager) {
        html += '<div id="add-member-form-' + g.id + '" class="oc-add-member-form" style="display:none">'
            + '<div class="oc-search-row">'
            + '<input type="text" id="member-search-' + g.id + '" class="oc-input" placeholder="회원 이름 검색" onkeyup="handleOcSearchKey(event,' + g.id + ')">'
            + '<button class="oc-btn oc-btn-primary" onclick="searchOrgchartMember(' + g.id + ')">검색</button>'
            + '</div>'
            + '<div id="member-search-results-' + g.id + '" class="oc-search-results"></div>'
            + '<div class="oc-manual-divider"><span>또는</span></div>'
            + '<div class="oc-manual-row">'
            + '<input type="text" id="member-position-' + g.id + '" class="oc-input oc-input-sm" placeholder="직책">'
            + '<input type="text" id="member-manual-name-' + g.id + '" class="oc-input" placeholder="이름 (수기 입력)">'
            + '<button class="oc-btn oc-btn-secondary" onclick="addOrgMemberManual(' + g.id + ')">등록</button>'
            + '</div>'
            + '<button class="oc-btn oc-btn-ghost oc-btn-cancel" onclick="document.getElementById(\'add-member-form-' + g.id + '\').style.display=\'none\'">닫기</button>'
            + '</div>';
    }

    html += '</div>';
    return html;
}

function renderOrgMember(m, isManager) {
    var name = m.user_name || m.manual_name || '미지정';
    var sub = [];
    if (m.user_position) sub.push(m.user_position);
    if (m.user_company) sub.push(m.user_company);
    var subText = sub.length > 0 ? sub.join(' · ') : '';

    var html = '<div class="oc-member">';
    html += '<div class="oc-member-left">';
    if (m.profile_image) {
        html += '<img src="' + escapeHtml(m.profile_image) + '" class="oc-avatar" alt="">';
    } else {
        html += '<div class="oc-avatar oc-avatar-default">' + DEFAULT_AVATAR_SVG_OC + '</div>';
    }
    html += '<div class="oc-member-info">';
    html += '<div class="oc-member-top">';
    html += '<span class="oc-member-pos">' + escapeHtml(m.position_title) + '</span>';
    html += '<span class="oc-member-name">' + escapeHtml(name) + '</span>';
    html += '</div>';
    if (subText) {
        html += '<div class="oc-member-sub">' + escapeHtml(subText) + '</div>';
    }
    html += '</div></div>';
    if (isManager) {
        html += '<button class="oc-member-delete" onclick="deleteOrgMember(' + m.id + ')" aria-label="삭제">'
            + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
            + '</button>';
    }
    html += '</div>';
    return html;
}

// ========== 이벤트 핸들러 ==========

function showAddGroupForm() {
    var form = document.getElementById('add-group-form');
    if (form) { form.style.display = 'block'; document.getElementById('new-group-name').focus(); }
}

async function addOrgGroup() {
    var name = document.getElementById('new-group-name')?.value?.trim();
    if (!name) { showToast('그룹명을 입력하세요', 'error'); return; }
    try {
        var res = await apiClient.request('/orgchart/groups', {
            method: 'POST', body: JSON.stringify({ name: name })
        });
        if (res.success) { showToast('그룹이 추가되었습니다'); loadOrgChartScreen(); }
        else showToast(res.error || '추가 실패', 'error');
    } catch (err) { showToast('오류: ' + err.message, 'error'); }
}

async function deleteOrgGroup(groupId) {
    if (!confirm('이 그룹을 삭제하시겠습니까?\n소속 인원도 함께 삭제됩니다.')) return;
    try {
        var res = await apiClient.request('/orgchart/groups/' + groupId, { method: 'DELETE' });
        if (res.success) { showToast('삭제 완료'); loadOrgChartScreen(); }
        else showToast(res.error || '삭제 실패', 'error');
    } catch (err) { showToast('오류: ' + err.message, 'error'); }
}

function showAddMemberForm(groupId) {
    // 다른 폼 모두 닫기
    document.querySelectorAll('.oc-add-member-form').forEach(function(f) { f.style.display = 'none'; });
    var form = document.getElementById('add-member-form-' + groupId);
    if (form) { form.style.display = 'block'; document.getElementById('member-search-' + groupId).focus(); }
}

function handleOcSearchKey(e, groupId) {
    if (e.key === 'Enter') searchOrgchartMember(groupId);
}

async function searchOrgchartMember(groupId) {
    var q = document.getElementById('member-search-' + groupId)?.value?.trim();
    if (!q) return;
    var el = document.getElementById('member-search-results-' + groupId);
    if (!el) return;
    el.innerHTML = '<div class="oc-searching">검색 중...</div>';
    try {
        var res = await apiClient.request('/members/search?q=' + encodeURIComponent(q));
        var members = res.members || [];
        if (members.length === 0) {
            el.innerHTML = '<div class="oc-no-results">검색 결과가 없습니다</div>';
            return;
        }
        el.innerHTML = members.slice(0, 10).map(function(m) {
            var info = [];
            if (m.position) info.push(m.position);
            if (m.company) info.push(m.company);
            var infoText = info.length > 0 ? info.join(' · ') : '';
            return '<div class="oc-result-item">'
                + '<div class="oc-result-avatar" style="background:#DBEAFE">'
                + (m.profile_image ? '<img src="' + escapeHtml(m.profile_image) + '" alt="">' : DEFAULT_AVATAR_SVG_OC)
                + '</div>'
                + '<div class="oc-result-info">'
                + '<span class="oc-result-name">' + escapeHtml(m.name) + '</span>'
                + (infoText ? '<span class="oc-result-sub">' + escapeHtml(infoText) + '</span>' : '')
                + '</div>'
                + '<button class="oc-btn oc-btn-select" onclick="addOrgMemberUser(' + groupId + ',' + m.id + ',\'' + escapeHtml(m.name).replace(/'/g, "\\'") + '\')">추가</button>'
                + '</div>';
        }).join('');
    } catch (_) { el.innerHTML = '<div class="oc-no-results" style="color:var(--error-color)">검색 실패</div>'; }
}

async function addOrgMemberUser(groupId, userId, userName) {
    try {
        var res = await apiClient.request('/orgchart/members', {
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, user_id: userId })
        });
        if (res.success) { showToast(userName + ' 추가 완료'); loadOrgChartScreen(); }
        else showToast(res.error || '추가 실패', 'error');
    } catch (err) { showToast('오류: ' + err.message, 'error'); }
}

async function addOrgMemberManual(groupId) {
    var position = document.getElementById('member-position-' + groupId)?.value?.trim();
    var name = document.getElementById('member-manual-name-' + groupId)?.value?.trim();
    if (!position) { showToast('직책을 입력하세요', 'error'); return; }
    if (!name) { showToast('이름을 입력하세요', 'error'); return; }
    try {
        var res = await apiClient.request('/orgchart/members', {
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, position_title: position, manual_name: name })
        });
        if (res.success) { showToast(name + ' 추가 완료'); loadOrgChartScreen(); }
        else showToast(res.error || '추가 실패', 'error');
    } catch (err) { showToast('오류: ' + err.message, 'error'); }
}

async function deleteOrgMember(memberId) {
    if (!confirm('이 인원을 삭제하시겠습니까?')) return;
    try {
        var res = await apiClient.request('/orgchart/members/' + memberId, { method: 'DELETE' });
        if (res.success) { showToast('삭제 완료'); loadOrgChartScreen(); }
        else showToast(res.error || '삭제 실패', 'error');
    } catch (err) { showToast('오류: ' + err.message, 'error'); }
}

console.log('✅ OrgChart 모듈 로드 완료 (리뉴얼)');
