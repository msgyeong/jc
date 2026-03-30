/* ================================================
   영등포 JC — 관리자 로컬(조직) 관리
   ================================================ */

let orgsState = { page: 1, search: '', total: 0, totalPages: 0 };

function renderOrganizations(container) {
    container.innerHTML = `
        <div class="page-toolbar">
            <h2 class="page-title">로컬 관리</h2>
            <span class="page-count" id="orgs-count">-</span>
            <div class="search-box">
                <svg class="search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" class="search-input" id="orgs-search" placeholder="로컬 이름, 코드 검색..." value="${escapeHtml(orgsState.search)}">
            </div>
            <button class="btn btn-primary" onclick="openOrgModal()">+ 새 로컬 생성</button>
        </div>
        <div id="orgs-table-wrap"></div>
        <div id="orgs-pagination"></div>
    `;

    var searchTimer = null;
    var searchInput = document.getElementById('orgs-search');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () {
                orgsState.search = searchInput.value.trim();
                orgsState.page = 1;
                loadOrganizations();
            }, 400);
        });
    }

    loadOrganizations();
}

async function loadOrganizations() {
    var wrap = document.getElementById('orgs-table-wrap');
    if (!wrap) return;
    showTableSkeleton(wrap, 6);

    try {
        var params = '?page=' + orgsState.page + '&limit=20';
        if (orgsState.search) params += '&search=' + encodeURIComponent(orgsState.search);

        var res = await AdminAPI.get('/api/organizations' + params);
        var data = res.data || res;
        var items = data.items || data.organizations || data || [];
        if (Array.isArray(res)) items = res;
        if (Array.isArray(data)) items = data;

        var total = data.total || items.length;
        var totalPages = data.totalPages || 1;
        orgsState.total = total;
        orgsState.totalPages = totalPages;

        var countEl = document.getElementById('orgs-count');
        if (countEl) countEl.textContent = '총 ' + total + '개';

        if (!items.length) {
            wrap.innerHTML = '<div class="table-empty"><p>등록된 로컬이 없습니다.</p></div>';
            return;
        }

        var html = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
            '<th>이름</th>' +
            '<th>코드</th>' +
            '<th>지구</th>' +
            '<th>지역</th>' +
            '<th>회원 수</th>' +
            '<th>상태</th>' +
            '<th>생성일</th>' +
            '<th>관리</th>' +
            '</tr></thead><tbody>';

        for (var i = 0; i < items.length; i++) {
            var org = items[i];
            var isActive = org.is_active !== false && org.status !== 'inactive';
            var statusHtml = isActive
                ? '<span class="badge badge-active">활성</span>'
                : '<span class="badge badge-suspended">비활성</span>';
            var memberCount = org.member_count != null ? org.member_count : (org.members_count != null ? org.members_count : '-');

            var nameEsc = escapeHtml(org.name).replace(/'/g, "\\'");
            html += '<tr>' +
                '<td><a href="javascript:void(0)" style="color:var(--c-primary);font-weight:600;text-decoration:underline;cursor:pointer" onclick="selectOrg(' + org.id + ',\'' + nameEsc + '\')">' + escapeHtml(org.name) + '</a></td>' +
                '<td>' + escapeHtml(org.code || '-') + '</td>' +
                '<td>' + escapeHtml(org.district || '-') + '</td>' +
                '<td>' + escapeHtml(org.region || '-') + '</td>' +
                '<td>' + memberCount + '</td>' +
                '<td>' + statusHtml + '</td>' +
                '<td>' + formatDate(org.created_at) + '</td>' +
                '<td class="actions-cell">' +
                    '<button class="btn btn-sm btn-primary" onclick="selectOrg(' + org.id + ',\'' + nameEsc + '\')">관리</button> ' +
                    '<button class="btn btn-sm btn-outline" onclick="openOrgModal(' + org.id + ')">편집</button> ' +
                    '<button class="btn btn-sm ' + (isActive ? 'btn-danger-outline' : 'btn-outline') + '" onclick="toggleOrgActive(' + org.id + ', ' + isActive + ')">' + (isActive ? '비활성화' : '활성화') + '</button>' +
                '</td>' +
                '</tr>';
        }

        html += '</tbody></table></div>';
        wrap.innerHTML = html;

        var pagEl = document.getElementById('orgs-pagination');
        if (pagEl) {
            renderPagination(pagEl, orgsState.page, totalPages, function (p) {
                orgsState.page = p;
                loadOrganizations();
            });
        }
    } catch (err) {
        wrap.innerHTML = '<div class="table-empty"><p>로컬 목록을 불러오지 못했습니다.<br>' + escapeHtml(err.message) + '</p></div>';
    }
}

/* ---------- Create / Edit Modal ---------- */
function openOrgModal(orgId) {
    var title = orgId ? '로컬 수정' : '새 로컬 생성';
    var btnText = orgId ? '수정' : '생성';

    var modalHtml = '<div class="modal">' +
        '<div class="modal-header"><h3>' + title + '</h3><button class="modal-close" onclick="closeModal()">&times;</button></div>' +
        '<div class="modal-body">' +
            '<div class="form-field"><label>로컬 이름 *</label><input type="text" id="org-name" class="form-input" placeholder="예: 영등포JC"></div>' +
            '<div class="form-field"><label>코드</label><input type="text" id="org-code" class="form-input" placeholder="예: YDP"></div>' +
            '<div class="form-field"><label>지구</label><input type="text" id="org-district" class="form-input" placeholder="예: 서울지구"></div>' +
            '<div class="form-field"><label>지역</label><input type="text" id="org-region" class="form-input" placeholder="예: 서울특별시"></div>' +
            '<div class="form-field"><label>설명</label><textarea id="org-description" class="form-input" rows="3" placeholder="로컬 설명 (선택)"></textarea></div>' +
            '<div class="form-error" id="org-modal-error" style="color:var(--c-danger);margin-bottom:12px;display:none"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
            '<button class="btn btn-outline" onclick="closeModal()">취소</button>' +
            '<button class="btn btn-primary" id="org-save-btn" onclick="saveOrg(' + (orgId || 'null') + ')">' + btnText + '</button>' +
        '</div>' +
    '</div>';

    openModal(modalHtml);

    if (orgId) {
        loadOrgForEdit(orgId);
    }
}

async function loadOrgForEdit(orgId) {
    try {
        var res = await AdminAPI.get('/api/organizations/' + orgId);
        var org = res.data || res;

        var nameEl = document.getElementById('org-name');
        var codeEl = document.getElementById('org-code');
        var districtEl = document.getElementById('org-district');
        var regionEl = document.getElementById('org-region');
        var descEl = document.getElementById('org-description');

        if (nameEl) nameEl.value = org.name || '';
        if (codeEl) codeEl.value = org.code || '';
        if (districtEl) districtEl.value = org.district || '';
        if (regionEl) regionEl.value = org.region || '';
        if (descEl) descEl.value = org.description || '';
    } catch (err) {
        var errEl = document.getElementById('org-modal-error');
        if (errEl) {
            errEl.textContent = '로컬 정보를 불러오지 못했습니다: ' + err.message;
            errEl.style.display = 'block';
        }
    }
}

async function saveOrg(orgId) {
    var nameEl = document.getElementById('org-name');
    var codeEl = document.getElementById('org-code');
    var districtEl = document.getElementById('org-district');
    var regionEl = document.getElementById('org-region');
    var descEl = document.getElementById('org-description');
    var errEl = document.getElementById('org-modal-error');
    var btn = document.getElementById('org-save-btn');

    var name = nameEl ? nameEl.value.trim() : '';
    if (!name) {
        if (errEl) {
            errEl.textContent = '로컬 이름은 필수입니다.';
            errEl.style.display = 'block';
        }
        return;
    }

    var body = {
        name: name,
        code: codeEl ? codeEl.value.trim() : '',
        district: districtEl ? districtEl.value.trim() : '',
        region: regionEl ? regionEl.value.trim() : '',
        description: descEl ? descEl.value.trim() : ''
    };

    if (btn) btn.disabled = true;
    if (errEl) errEl.style.display = 'none';

    try {
        if (orgId) {
            await AdminAPI.put('/api/organizations/' + orgId, body);
            showAdminToast('로컬이 수정되었습니다.', 'success');
        } else {
            await AdminAPI.post('/api/organizations', body);
            showAdminToast('새 로컬이 생성되었습니다.', 'success');
        }
        closeModal();
        loadOrganizations();
    } catch (err) {
        if (errEl) {
            errEl.textContent = err.message || '저장에 실패했습니다.';
            errEl.style.display = 'block';
        }
    } finally {
        if (btn) btn.disabled = false;
    }
}

/* ---------- Toggle Active / Deactivate ---------- */
async function toggleOrgActive(orgId, currentlyActive) {
    var action = currentlyActive ? '비활성화' : '활성화';
    if (!confirm('이 로컬을 ' + action + '하시겠습니까?')) return;

    try {
        if (currentlyActive) {
            await AdminAPI.delete('/api/organizations/' + orgId);
        } else {
            await AdminAPI.put('/api/organizations/' + orgId, { is_active: true, status: 'active' });
        }
        showAdminToast('로컬이 ' + action + '되었습니다.', 'success');
        loadOrganizations();
    } catch (err) {
        showAdminToast('처리 실패: ' + err.message, 'error');
    }
}

/* ---------- Assign Local Admin ---------- */
function openAssignAdminModal(orgId, orgName) {
    var modalHtml = '<div class="modal">' +
        '<div class="modal-header"><h3>관리자 지정 - ' + escapeHtml(orgName) + '</h3><button class="modal-close" onclick="closeModal()">&times;</button></div>' +
        '<div class="modal-body">' +
            '<div class="form-field">' +
                '<label>회원 검색</label>' +
                '<input type="text" id="admin-search-input" class="form-input" placeholder="이름 또는 이메일로 검색...">' +
            '</div>' +
            '<div id="admin-search-results" style="max-height:300px;overflow-y:auto;margin-top:8px"></div>' +
            '<div class="form-error" id="assign-admin-error" style="color:var(--c-danger);margin-top:8px;display:none"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
            '<button class="btn btn-outline" onclick="closeModal()">닫기</button>' +
        '</div>' +
    '</div>';

    openModal(modalHtml);

    var searchTimer = null;
    var searchInput = document.getElementById('admin-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () {
                searchAdminCandidates(orgId, searchInput.value.trim());
            }, 400);
        });
        searchInput.focus();
    }
}

async function searchAdminCandidates(orgId, query) {
    var resultsEl = document.getElementById('admin-search-results');
    if (!resultsEl) return;

    if (!query || query.length < 1) {
        resultsEl.innerHTML = '<p style="color:var(--c-text-sub);text-align:center;padding:16px">검색어를 입력하세요.</p>';
        return;
    }

    resultsEl.innerHTML = '<p style="color:var(--c-text-sub);text-align:center;padding:16px">검색 중...</p>';

    try {
        var res = await AdminAPI.get('/api/members?search=' + encodeURIComponent(query) + '&limit=10&status=active');
        var data = res.data || res;
        var items = data.items || data.members || data || [];
        if (Array.isArray(res)) items = res;
        if (Array.isArray(data)) items = data;

        if (!items.length) {
            resultsEl.innerHTML = '<p style="color:var(--c-text-sub);text-align:center;padding:16px">검색 결과가 없습니다.</p>';
            return;
        }

        var html = '<div style="display:flex;flex-direction:column;gap:8px">';
        for (var i = 0; i < items.length; i++) {
            var m = items[i];
            html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid var(--c-border);border-radius:8px">' +
                '<div>' +
                    '<strong>' + escapeHtml(m.name) + '</strong>' +
                    '<span style="color:var(--c-text-sub);margin-left:8px;font-size:13px">' + escapeHtml(m.email) + '</span>' +
                '</div>' +
                '<button class="btn btn-sm btn-primary" onclick="assignLocalAdmin(' + orgId + ', ' + m.id + ')">지정</button>' +
            '</div>';
        }
        html += '</div>';
        resultsEl.innerHTML = html;
    } catch (err) {
        resultsEl.innerHTML = '<p style="color:var(--c-danger);text-align:center;padding:16px">' + escapeHtml(err.message) + '</p>';
    }
}

async function assignLocalAdmin(orgId, userId) {
    var errEl = document.getElementById('assign-admin-error');
    try {
        await AdminAPI.post('/api/organizations/' + orgId + '/assign-admin', { user_id: userId });
        showAdminToast('관리자가 지정되었습니다.', 'success');
        closeModal();
        loadOrganizations();
    } catch (err) {
        if (errEl) {
            errEl.textContent = '관리자 지정 실패: ' + err.message;
            errEl.style.display = 'block';
        } else {
            showAdminToast('관리자 지정 실패: ' + err.message, 'error');
        }
    }
}

// 로컬 선택 → 로컬 상세 페이지
var selectedOrgId = null;
var selectedOrgName = '';
function selectOrg(orgId, orgName) {
    selectedOrgId = orgId;
    selectedOrgName = orgName;
    // 사이드바 하위 메뉴 표시
    var subNav = document.getElementById('org-sub-nav');
    var subLabel = document.getElementById('org-sub-label');
    if (subNav) subNav.style.display = 'block';
    if (subLabel) subLabel.textContent = orgName;
    // 로컬 상세 페이지 렌더링
    renderOrgDetail(orgId, orgName);
}

function renderOrgDetail(orgId, orgName) {
    var container = document.getElementById('main-content');
    var titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.textContent = orgName + ' 관리';

    container.innerHTML = '<div style="padding:0">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">' +
            '<button class="btn btn-ghost" onclick="navigateAdmin(\'organizations\')">← 로컬 목록</button>' +
            '<h2 style="margin:0">' + escapeHtml(orgName) + '</h2>' +
        '</div>' +
        '<div class="org-detail-tabs" style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">' +
            '<button class="btn btn-primary btn-sm org-tab active" data-tab="members" onclick="switchOrgTab(\'members\',' + orgId + ')">회원 관리</button>' +
            '<button class="btn btn-ghost btn-sm org-tab" data-tab="admins" onclick="switchOrgTab(\'admins\',' + orgId + ')">관리자</button>' +
            '<button class="btn btn-ghost btn-sm org-tab" data-tab="posts" onclick="switchOrgTab(\'posts\',' + orgId + ')">게시판</button>' +
            '<button class="btn btn-ghost btn-sm org-tab" data-tab="schedules" onclick="switchOrgTab(\'schedules\',' + orgId + ')">일정</button>' +
            '<button class="btn btn-ghost btn-sm org-tab" data-tab="stats" onclick="switchOrgTab(\'stats\',' + orgId + ')">통계</button>' +
        '</div>' +
        '<div id="org-detail-content">로딩 중...</div>' +
    '</div>';

    // 기본: 회원 목록
    switchOrgTab('members', orgId);
}

function switchOrgTab(tab, orgId) {
    document.querySelectorAll('.org-tab').forEach(function(b) {
        b.classList.remove('btn-primary');
        b.classList.add('btn-ghost');
        if (b.dataset.tab === tab) {
            b.classList.remove('btn-ghost');
            b.classList.add('btn-primary');
        }
    });
    var el = document.getElementById('org-detail-content');
    if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--c-text-hint)">로딩 중...</div>';

    if (tab === 'members') loadOrgMembers(orgId, el);
    else if (tab === 'admins') loadOrgAdmins(orgId, el);
    else if (tab === 'posts') el.innerHTML = '<div style="color:var(--c-text-hint);padding:24px;text-align:center">게시판 관리는 앱 내 로컬 관리에서 진행합니다.</div>';
    else if (tab === 'schedules') el.innerHTML = '<div style="color:var(--c-text-hint);padding:24px;text-align:center">일정 관리는 앱 내 로컬 관리에서 진행합니다.</div>';
    else if (tab === 'stats') loadOrgStats(orgId, el);
}

async function loadOrgMembers(orgId, el) {
    try {
        var res = await AdminAPI.get('/api/admin/members?limit=100');
        if (!res.success) throw new Error(res.message);
        var allMembers = res.members || (res.data && res.data.items) || [];
        // org_id 필터 + super_admin 제외
        var members = allMembers.filter(function(m) {
            if (m.role === 'super_admin') return false;
            return m.org_id === orgId || (!m.org_id && orgId === 1);
        });
        if (members.length === 0) {
            el.innerHTML = '<div style="color:var(--c-text-hint);padding:24px;text-align:center">이 로컬에 소속된 회원이 없습니다.</div>';
            return;
        }
        var html = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
            '<th>이름</th><th>이메일</th><th>역할</th><th>상태</th><th>관리</th>' +
            '</tr></thead><tbody>';
        members.forEach(function(m) {
            var roleSelect = '<select onchange="changeOrgMemberRole(' + m.id + ',this.value,' + orgId + ')" style="padding:4px;border:1px solid var(--c-border);border-radius:4px;font-size:12px">' +
                '<option value="member"' + (m.role==='member'?' selected':'') + '>회원</option>' +
                '<option value="local_admin"' + (m.role==='local_admin'?' selected':'') + '>중간관리자</option>' +
                '<option value="admin"' + (m.role==='admin'?' selected':'') + '>관리자</option>' +
                '</select>';
            html += '<tr>' +
                '<td><strong>' + escapeHtml(m.name || '') + '</strong></td>' +
                '<td style="font-size:13px;color:var(--c-text-sub)">' + escapeHtml(m.email || '') + '</td>' +
                '<td>' + roleSelect + '</td>' +
                '<td>' + statusBadge(m.status) + '</td>' +
                '<td class="actions-cell">' +
                    (m.status==='pending' ? '<button class="btn btn-sm btn-primary" onclick="orgApproveMember(' + m.id + ',' + orgId + ')">승인</button> ' : '') +
                    (m.status==='active' ? '<button class="btn btn-sm btn-outline" onclick="orgSuspendMember(' + m.id + ',' + orgId + ')">정지</button> ' : '') +
                    (m.status==='suspended' ? '<button class="btn btn-sm btn-outline" onclick="orgActivateMember(' + m.id + ',' + orgId + ')">해제</button> ' : '') +
                    '<button class="btn btn-sm btn-danger-outline" onclick="orgDeleteMember(' + m.id + ',\'' + escapeHtml(m.name).replace(/'/g,"\\'") + '\',' + orgId + ')">삭제</button>' +
                '</td>' +
                '</tr>';
        });
        html += '</tbody></table></div>';
        el.innerHTML = html;
    } catch (err) {
        el.innerHTML = '<div style="color:var(--c-danger);padding:24px">회원 목록 로드 실패: ' + escapeHtml(err.message) + '</div>';
    }
}

async function changeOrgMemberRole(memberId, newRole, orgId) {
    try {
        await AdminAPI.put('/api/admin/members/' + memberId, { role: newRole });
        showAdminToast('역할이 변경되었습니다.');
    } catch (err) { showAdminToast('역할 변경 실패: ' + err.message, 'error'); }
}

async function orgApproveMember(memberId, orgId) {
    try {
        await AdminAPI.post('/api/admin/members/' + memberId + '/approve', {});
        showAdminToast('승인 완료');
        switchOrgTab('members', orgId);
    } catch (err) { showAdminToast('승인 실패: ' + err.message, 'error'); }
}

async function orgSuspendMember(memberId, orgId) {
    if (!confirm('이 회원을 정지하시겠습니까?')) return;
    try {
        await AdminAPI.put('/api/admin/members/' + memberId, { status: 'suspended' });
        showAdminToast('정지 처리 완료');
        switchOrgTab('members', orgId);
    } catch (err) { showAdminToast('정지 실패: ' + err.message, 'error'); }
}

async function orgActivateMember(memberId, orgId) {
    try {
        await AdminAPI.put('/api/admin/members/' + memberId, { status: 'active' });
        showAdminToast('활성화 완료');
        switchOrgTab('members', orgId);
    } catch (err) { showAdminToast('활성화 실패: ' + err.message, 'error'); }
}

async function orgDeleteMember(memberId, name, orgId) {
    if (!confirm(name + ' 회원을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
    if (!confirm('정말 삭제하시겠습니까? (최종 확인)')) return;
    try {
        var res = await AdminAPI.delete('/api/admin/members/' + memberId + '/permanent');
        showAdminToast(res.message || '삭제 완료');
        switchOrgTab('members', orgId);
    } catch (err) { showAdminToast('삭제 실패: ' + err.message, 'error'); }
}

async function loadOrgAdmins(orgId, el) {
    try {
        var res = await AdminAPI.get('/api/admin/members?limit=100');
        if (!res.success) throw new Error(res.message);
        var allMembers = res.members || (res.data && res.data.items) || [];
        // org_id 필터
        var orgMembers = allMembers.filter(function(m) {
            return m.org_id === orgId || (!m.org_id && orgId === 1);
        });
        var admins = orgMembers.filter(function(m) {
            return ['admin', 'local_admin', 'super_admin'].includes(m.role);
        });

        var html = '<h3 style="font-size:16px;margin:0 0 12px">현재 관리자 (' + admins.length + '명)</h3>';
        if (admins.length > 0) {
            html += '<div style="margin-bottom:16px">';
            admins.forEach(function(a) {
                html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--c-bg)">' +
                    '<span style="font-weight:500">' + escapeHtml(a.name) + '</span>' +
                    '<span style="font-size:12px;color:var(--c-text-sub)">' + escapeHtml(a.email) + '</span>' +
                    roleBadge(a.role) +
                    '</div>';
            });
            html += '</div>';
        }

        // 관리자 추가
        html += '<h3 style="font-size:16px;margin:16px 0 12px">관리자 추가</h3>' +
            '<div style="display:flex;gap:8px;margin-bottom:12px">' +
                '<input type="text" id="admin-search-input" placeholder="회원 이름 검색..." style="flex:1;padding:8px 12px;border:1px solid var(--c-border);border-radius:6px">' +
                '<button class="btn btn-primary btn-sm" onclick="searchAndAssignAdmin(' + orgId + ')">검색</button>' +
            '</div>' +
            '<div id="admin-search-results"></div>';

        el.innerHTML = html;
    } catch (err) {
        el.innerHTML = '<div style="color:var(--c-danger);padding:24px">관리자 목록 로드 실패</div>';
    }
}

async function searchAndAssignAdmin(orgId) {
    var q = document.getElementById('admin-search-input')?.value?.trim();
    if (!q) return;
    var el = document.getElementById('admin-search-results');
    if (!el) return;
    el.innerHTML = '검색 중...';
    try {
        var res = await AdminAPI.get('/api/admin/members?search=' + encodeURIComponent(q) + '&limit=20');
        if (!res.success) throw new Error(res.message);
        var members = res.members || (res.data && res.data.items) || [];
        if (members.length === 0) {
            el.innerHTML = '<div style="color:var(--c-text-hint)">검색 결과 없음</div>';
            return;
        }
        el.innerHTML = members.map(function(m) {
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px;border:1px solid var(--c-border);border-radius:6px;margin-bottom:6px">' +
                '<div><strong>' + escapeHtml(m.name) + '</strong> <span style="color:var(--c-text-sub);font-size:13px">' + escapeHtml(m.email) + '</span></div>' +
                '<button class="btn btn-primary btn-sm" onclick="doAssignAdmin(' + orgId + ',' + m.id + ',\'' + escapeHtml(m.name).replace(/'/g,"\\'") + '\')">관리자 지정</button>' +
                '</div>';
        }).join('');
    } catch (err) {
        el.innerHTML = '<div style="color:var(--c-danger)">검색 실패: ' + escapeHtml(err.message) + '</div>';
    }
}

async function doAssignAdmin(orgId, userId, userName) {
    try {
        var res = await AdminAPI.post('/api/organizations/' + orgId + '/assign-admin', { user_id: userId });
        if (res.success) {
            showAdminToast(userName + '님이 관리자로 지정되었습니다.');
            switchOrgTab('admins', orgId);
        } else {
            showAdminToast(res.error || '지정 실패', 'error');
        }
    } catch (err) {
        showAdminToast('관리자 지정 실패: ' + err.message, 'error');
    }
}

async function loadOrgStats(orgId, el) {
    try {
        var res = await AdminAPI.get('/api/admin/dashboard/stats');
        if (!res.success) throw new Error();
        var d = res.data;
        el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">' +
            '<div style="background:var(--c-success-bg);padding:16px;border-radius:8px;text-align:center"><div style="font-size:24px;font-weight:700;color:#16A34A">' + (d.members?.total || 0) + '</div><div style="font-size:13px;color:var(--c-text-sub)">전체 회원</div></div>' +
            '<div style="background:var(--c-warning-bg);padding:16px;border-radius:8px;text-align:center"><div style="font-size:24px;font-weight:700;color:#D97706">' + (d.members?.pending || 0) + '</div><div style="font-size:13px;color:var(--c-text-sub)">승인 대기</div></div>' +
            '<div style="background:var(--c-primary-light);padding:16px;border-radius:8px;text-align:center"><div style="font-size:24px;font-weight:700;color:var(--c-primary)">' + (d.posts?.total || 0) + '</div><div style="font-size:13px;color:var(--c-text-sub)">게시글</div></div>' +
            '<div style="background:var(--c-danger-bg);padding:16px;border-radius:8px;text-align:center"><div style="font-size:24px;font-weight:700;color:var(--c-danger)">' + (d.schedules?.total || 0) + '</div><div style="font-size:13px;color:var(--c-text-sub)">일정</div></div>' +
            '</div>';
    } catch (_) {
        el.innerHTML = '<div style="color:var(--c-text-hint);padding:24px;text-align:center">통계를 불러올 수 없습니다.</div>';
    }
}
