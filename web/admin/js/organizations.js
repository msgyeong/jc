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

            html += '<tr>' +
                '<td><strong>' + escapeHtml(org.name) + '</strong></td>' +
                '<td>' + escapeHtml(org.code || '-') + '</td>' +
                '<td>' + escapeHtml(org.district || '-') + '</td>' +
                '<td>' + escapeHtml(org.region || '-') + '</td>' +
                '<td>' + memberCount + '</td>' +
                '<td>' + statusHtml + '</td>' +
                '<td>' + formatDate(org.created_at) + '</td>' +
                '<td class="actions-cell">' +
                    '<button class="btn btn-sm btn-outline" onclick="openOrgModal(' + org.id + ')">편집</button> ' +
                    '<button class="btn btn-sm ' + (isActive ? 'btn-danger-outline' : 'btn-outline') + '" onclick="toggleOrgActive(' + org.id + ', ' + isActive + ')">' + (isActive ? '비활성화' : '활성화') + '</button> ' +
                    '<button class="btn btn-sm btn-outline" onclick="openAssignAdminModal(' + org.id + ', \'' + escapeHtml(org.name).replace(/'/g, "\\'") + '\')">관리자 지정</button>' +
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
            '<div class="form-error" id="org-modal-error" style="color:#DC2626;margin-bottom:12px;display:none"></div>' +
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
            '<div class="form-error" id="assign-admin-error" style="color:#DC2626;margin-top:8px;display:none"></div>' +
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
        resultsEl.innerHTML = '<p style="color:#6B7280;text-align:center;padding:16px">검색어를 입력하세요.</p>';
        return;
    }

    resultsEl.innerHTML = '<p style="color:#6B7280;text-align:center;padding:16px">검색 중...</p>';

    try {
        var res = await AdminAPI.get('/api/members?search=' + encodeURIComponent(query) + '&limit=10&status=active');
        var data = res.data || res;
        var items = data.items || data.members || data || [];
        if (Array.isArray(res)) items = res;
        if (Array.isArray(data)) items = data;

        if (!items.length) {
            resultsEl.innerHTML = '<p style="color:#6B7280;text-align:center;padding:16px">검색 결과가 없습니다.</p>';
            return;
        }

        var html = '<div style="display:flex;flex-direction:column;gap:8px">';
        for (var i = 0; i < items.length; i++) {
            var m = items[i];
            html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid #E5E7EB;border-radius:8px">' +
                '<div>' +
                    '<strong>' + escapeHtml(m.name) + '</strong>' +
                    '<span style="color:#6B7280;margin-left:8px;font-size:13px">' + escapeHtml(m.email) + '</span>' +
                '</div>' +
                '<button class="btn btn-sm btn-primary" onclick="assignLocalAdmin(' + orgId + ', ' + m.id + ')">지정</button>' +
            '</div>';
        }
        html += '</div>';
        resultsEl.innerHTML = html;
    } catch (err) {
        resultsEl.innerHTML = '<p style="color:#DC2626;text-align:center;padding:16px">' + escapeHtml(err.message) + '</p>';
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
