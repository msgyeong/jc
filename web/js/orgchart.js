// 로컬조직도 관리 (리뉴얼 디자인 — 이벤트 위임 방식)

var DEFAULT_AVATAR_SVG_OC = '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="15" r="6" fill="#A0C4E8"/><ellipse cx="20" cy="32" rx="11" ry="8" fill="#A0C4E8"/></svg>';

async function loadOrgChartScreen() {
    var container = document.getElementById('org-chart-content');
    if (!container) return;

    var userInfo = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user_info') || 'null');
    var isManager = userInfo && ['admin', 'super_admin', 'local_admin'].includes(userInfo.role);

    container.innerHTML = renderSkeleton('list');

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
                + '<button class="oc-btn oc-btn-primary" data-action="add-group">등록</button>'
                + '<button class="oc-btn oc-btn-ghost" data-action="cancel-add-group">취소</button>'
                + '</div></div>';
        }

        var currentUserId = userInfo ? userInfo.id : null;

        if (groups.length === 0) {
            html += renderEmptyState('users', '로컬조직도가 아직 등록되지 않았습니다', '관리자가 로컬조직도를 등록할 수 있습니다');
        } else {
            groups.forEach(function(g) {
                html += renderOrgGroup(g, isManager, currentUserId);
            });
        }

        // 하단: 그룹 추가 버튼 (관리자)
        if (isManager) {
            html += '<button class="oc-add-group-btn" data-action="show-add-group">'
                + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
                + ' 그룹 추가</button>';
        }

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = renderErrorState('로컬조직도를 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'loadOrgChartScreen()');
    }
}

function renderOrgGroup(g, isManager, currentUserId) {
    var html = '<div class="oc-group" data-group-id="' + g.id + '">';

    // 그룹 헤더
    html += '<div class="oc-group-header">';
    html += '<div class="oc-group-title">';
    html += '<span class="oc-group-name">' + escapeHtml(g.name) + '</span>';
    html += '<span class="oc-group-count">' + (g.members ? g.members.length : 0) + '명</span>';
    html += '</div>';
    if (isManager) {
        html += '<div class="oc-group-actions">'
            + '<button class="oc-header-btn oc-header-btn-add" data-action="show-add-member" data-group-id="' + g.id + '">'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>'
            + ' 인원 추가</button>'
            + '<button class="oc-header-btn oc-header-btn-delete" data-action="delete-group" data-group-id="' + g.id + '" aria-label="그룹 삭제">'
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

    // 게시판 바로가기 버튼 (관리자 또는 해당 그룹 멤버만 표시)
    var isMemberOfGroup = isManager || (g.members && g.members.some(function(m) { return m.user_id === currentUserId || m.id === currentUserId; }));
    if (isMemberOfGroup) {
        html += '<div class="oc-board-btn-wrap">'
            + '<button class="oc-board-btn" data-action="open-board" data-group-id="' + g.id + '" data-group-name="' + escapeHtml(g.name) + '">'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="13" y2="13"/></svg>'
            + ' 게시판</button>'
            + '</div>';
    }

    // 인원 추가 폼 (숨김)
    if (isManager) {
        html += '<div id="add-member-form-' + g.id + '" class="oc-add-member-form" style="display:none">'
            + '<div class="oc-search-row">'
            + '<input type="text" id="member-search-' + g.id + '" class="oc-input" placeholder="회원 이름 검색" data-group-id="' + g.id + '">'
            + '<button class="oc-btn oc-btn-primary" data-action="search-member" data-group-id="' + g.id + '">검색</button>'
            + '</div>'
            + '<label class="oc-checkbox-row"><input type="checkbox" id="member-search-all-' + g.id + '"><span>모든 조직에서 검색 (타 로컬 포함)</span></label>'
            + '<div id="member-search-results-' + g.id + '" class="oc-search-results"></div>'
            + '<button class="oc-btn oc-btn-ghost oc-btn-cancel" data-action="cancel-add-member" data-group-id="' + g.id + '">닫기</button>'
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
        html += '<button class="oc-member-delete" data-action="delete-member" data-member-id="' + m.id + '" aria-label="삭제">'
            + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
            + '</button>';
    }
    html += '</div>';
    return html;
}

// ========== 이벤트 위임 (단일 핸들러) ==========

document.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById('org-chart-content');
    if (!container) return;

    // 클릭 이벤트 위임
    container.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;

        var action = btn.getAttribute('data-action');
        var groupId = btn.getAttribute('data-group-id');
        var memberId = btn.getAttribute('data-member-id');

        switch (action) {
            case 'show-add-group':
                showAddGroupForm();
                break;
            case 'add-group':
                addOrgGroup();
                break;
            case 'cancel-add-group':
                var form = document.getElementById('add-group-form');
                if (form) form.style.display = 'none';
                break;
            case 'delete-group':
                deleteOrgGroup(parseInt(groupId));
                break;
            case 'show-add-member':
                showAddMemberForm(parseInt(groupId));
                break;
            case 'search-member':
                searchOrgchartMember(parseInt(groupId));
                break;
            case 'cancel-add-member':
                var mForm = document.getElementById('add-member-form-' + groupId);
                if (mForm) mForm.style.display = 'none';
                break;
            case 'add-member-user':
                var userId = btn.getAttribute('data-user-id');
                addOrgMemberUser(parseInt(groupId), parseInt(userId));
                break;
            case 'delete-member':
                deleteOrgMember(parseInt(memberId));
                break;
            case 'open-board':
                e.preventDefault();
                e.stopPropagation();
                var groupName = btn.getAttribute('data-group-name');
                if (typeof openGroupBoard === 'function') {
                    openGroupBoard(parseInt(groupId), groupName);
                } else {
                    console.error('openGroupBoard is not defined');
                }
                break;
        }
    });

    // 검색 인풋 엔터키 처리
    container.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            var input = e.target;
            var groupId = input.getAttribute('data-group-id');
            if (groupId && input.classList.contains('oc-input')) {
                searchOrgchartMember(parseInt(groupId));
            }
        }
    });
});

// ========== 이벤트 핸들러 ==========

function showAddGroupForm() {
    var form = document.getElementById('add-group-form');
    if (form) {
        form.style.display = 'block';
        var input = document.getElementById('new-group-name');
        if (input) input.focus();
    }
}

async function addOrgGroup() {
    var input = document.getElementById('new-group-name');
    var name = input ? input.value.trim() : '';
    if (!name) return;
    try {
        var res = await apiClient.request('/orgchart/groups', {
            method: 'POST', body: JSON.stringify({ name: name })
        });
        if (res.success) { loadOrgChartScreen(); }
        else { alert(res.error || '그룹 추가 실패'); }
    } catch (err) {
        console.error('addOrgGroup error:', err);
        alert('그룹 추가 중 오류가 발생했습니다.');
    }
}

async function deleteOrgGroup(groupId) {
    if (!confirm('이 그룹을 삭제하시겠습니까?\n소속 인원도 함께 삭제됩니다.')) return;
    try {
        var res = await apiClient.request('/orgchart/groups/' + groupId, { method: 'DELETE' });
        if (res.success) { loadOrgChartScreen(); }
        else { alert(res.error || '그룹 삭제 실패'); }
    } catch (err) {
        console.error('deleteOrgGroup error:', err);
        alert('그룹 삭제 중 오류가 발생했습니다.');
    }
}

function showAddMemberForm(groupId) {
    // 다른 폼 모두 닫기
    document.querySelectorAll('.oc-add-member-form').forEach(function(f) { f.style.display = 'none'; });
    var form = document.getElementById('add-member-form-' + groupId);
    if (form) {
        form.style.display = 'block';
        var input = document.getElementById('member-search-' + groupId);
        if (input) input.focus();
    }
}

async function searchOrgchartMember(groupId) {
    var input = document.getElementById('member-search-' + groupId);
    var q = input ? input.value.trim() : '';
    if (!q) return;
    var el = document.getElementById('member-search-results-' + groupId);
    if (!el) return;
    var searchAll = document.getElementById('member-search-all-' + groupId);
    var isAll = searchAll ? searchAll.checked : false;
    el.innerHTML = '<div class="oc-searching">검색 중...</div>';
    try {
        var endpoint = isAll
            ? '/members/search-all?q=' + encodeURIComponent(q)
            : '/members/search?q=' + encodeURIComponent(q);
        var res = await apiClient.request(endpoint);
        var members = res.members || [];
        if (members.length === 0) {
            el.innerHTML = '<div class="oc-no-results">검색 결과가 없습니다</div>';
            return;
        }
        el.innerHTML = members.slice(0, 10).map(function(m) {
            var info = [];
            if (m.position) info.push(m.position);
            if (m.company) info.push(m.company);
            if (isAll && m.org_name) info.push(m.org_name);
            var infoText = info.length > 0 ? info.join(' · ') : '';
            return '<div class="oc-result-item">'
                + '<div class="oc-result-avatar" style="background:#DBEAFE">'
                + (m.profile_image ? '<img src="' + escapeHtml(m.profile_image) + '" alt="">' : DEFAULT_AVATAR_SVG_OC)
                + '</div>'
                + '<div class="oc-result-info">'
                + '<span class="oc-result-name">' + escapeHtml(m.name) + '</span>'
                + (infoText ? '<span class="oc-result-sub">' + escapeHtml(infoText) + '</span>' : '')
                + '</div>'
                + '<button class="oc-btn oc-btn-select" data-action="add-member-user" data-group-id="' + groupId + '" data-user-id="' + m.id + '">추가</button>'
                + '</div>';
        }).join('');
    } catch (err) {
        console.error('Search error:', err);
        el.innerHTML = '<div class="oc-no-results" style="color:var(--error-color)">검색 실패</div>';
    }
}

async function addOrgMemberUser(groupId, userId) {
    try {
        var res = await apiClient.request('/orgchart/members', {
            method: 'POST',
            body: JSON.stringify({ group_id: groupId, user_id: userId })
        });
        if (res.success) {
            if (res.duplicate) {
                alert('이미 등록된 회원입니다.');
            }
            loadOrgChartScreen();
        } else {
            alert(res.error || '인원 추가 실패');
        }
    } catch (err) {
        console.error('Add member error:', err);
        alert('인원 추가 중 오류가 발생했습니다.');
    }
}

async function deleteOrgMember(memberId) {
    if (!confirm('이 인원을 삭제하시겠습니까?')) return;
    try {
        var res = await apiClient.request('/orgchart/members/' + memberId, { method: 'DELETE' });
        if (res.success) { loadOrgChartScreen(); }
        else { alert(res.error || '인원 삭제 실패'); }
    } catch (err) {
        console.error('deleteOrgMember error:', err);
        alert('인원 삭제 중 오류가 발생했습니다.');
    }
}

console.log('✅ OrgChart 모듈 로드 완료 (이벤트 위임)');
