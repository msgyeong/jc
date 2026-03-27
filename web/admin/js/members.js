/* ================================================
   영등포 JC — 관리자 회원 관리
   ================================================ */

let membersState = { page: 1, search: '', status: '', role: '', total: 0, totalPages: 0 };

var ADMIN_DEFAULT_AVATAR = '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="15" r="6" fill="#A0C4E8"/><ellipse cx="20" cy="32" rx="11" ry="8" fill="#A0C4E8"/></svg>';

// 직책 뱃지 (관리자용)
function adminPositionBadge(posName) {
    if (!posName) return '';
    const colorMap = {
        '회장': 'background:#FEF3C7;color:#92400E',
        '수석부회장': 'background:#F3F4F6;color:#374151',
        '부회장': 'background:#DBEAFE;color:#1E40AF',
        '총무': 'background:#DBEAFE;color:#1E40AF',
        '이사': 'background:#E0F2FE;color:#0369A1',
        '감사': 'background:#E0F2FE;color:#0369A1',
        '일반회원': 'background:#F3F4F6;color:#6B7280'
    };
    const style = colorMap[posName] || 'background:#F3F4F6;color:#6B7280';
    return '<span class="badge" style="' + style + '">' + escapeHtml(posName) + '</span>';
}

function renderMembers(container) {
    container.innerHTML = `
        <div class="page-toolbar">
            <h2 class="page-title">회원 관리</h2>
            <span class="page-count" id="members-count">-</span>
            <button class="btn btn-ghost btn-sm" onclick="printMembers()" style="margin-left:auto;display:inline-flex;align-items:center;gap:4px">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                인쇄
            </button>
            <button class="btn btn-ghost btn-sm" onclick="downloadMembersCSV()" style="display:inline-flex;align-items:center;gap:4px">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                CSV
            </button>
            <div class="search-box">
                <svg class="search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" class="search-input" id="members-search" placeholder="이름, 이메일, 전화번호 검색…" value="${escapeHtml(membersState.search)}">
            </div>
        </div>
        <div class="filter-bar">
            <select class="filter-select" id="filter-status">
                <option value="">전체 상태</option>
                <option value="active">활동</option>
                <option value="pending">대기</option>
                <option value="suspended">정지</option>
                <option value="withdrawn">탈퇴</option>
            </select>
            <select class="filter-select" id="filter-role">
                <option value="">전체 역할</option>
                <option value="member">회원</option>
                <option value="admin">관리자</option>
                <option value="super_admin">슈퍼관리자</option>
            </select>
        </div>
        <div id="members-table-wrap"></div>
        <div id="members-pagination"></div>
    `;

    // Set filter values
    document.getElementById('filter-status').value = membersState.status;
    document.getElementById('filter-role').value = membersState.role;

    // Events
    let searchTimer;
    document.getElementById('members-search').addEventListener('input', e => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            membersState.search = e.target.value.trim();
            membersState.page = 1;
            loadMembers();
        }, 400);
    });

    document.getElementById('filter-status').addEventListener('change', e => {
        membersState.status = e.target.value;
        membersState.page = 1;
        loadMembers();
    });

    document.getElementById('filter-role').addEventListener('change', e => {
        membersState.role = e.target.value;
        membersState.page = 1;
        loadMembers();
    });

    loadMembers();
}

async function loadMembers() {
    const wrap = document.getElementById('members-table-wrap');
    showTableSkeleton(wrap, 8);

    try {
        const params = new URLSearchParams({
            page: membersState.page,
            limit: 20,
        });
        if (membersState.search) params.set('search', membersState.search);
        if (membersState.status) params.set('status', membersState.status);
        if (membersState.role) params.set('role', membersState.role);

        const res = await AdminAPI.get('/api/admin/members?' + params.toString());
        if (!res.success) throw new Error(res.message);

        membersState.total = res.total;
        membersState.totalPages = res.totalPages;

        document.getElementById('members-count').textContent = '총 ' + res.total + '명';

        if (!res.members || !res.members.length) {
            wrap.innerHTML = '<div class="table-wrap"><div class="table-empty"><p>검색 결과가 없습니다.</p></div></div>';
            document.getElementById('members-pagination').innerHTML = '';
            return;
        }

        var CELL_EDIT_ICON = '<svg class="cell-edit-icon" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.13 1.87a1.25 1.25 0 0 1 1.77 0l1.23 1.23a1.25 1.25 0 0 1 0 1.77L5.04 13.96l-3.37.84.84-3.37L11.13 1.87z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

        let html = `<div class="table-wrap"><table class="member-table">
            <colgroup>
                <col style="width:50px">
                <col style="width:80px">
                <col style="width:90px">
                <col style="width:100px">
                <col style="width:130px">
                <col style="width:200px">
                <col style="width:90px">
                <col style="width:60px">
            </colgroup>
            <thead><tr>
                <th></th>
                <th>이름</th>
                <th>직책</th>
                <th>가입일</th>
                <th>전화번호</th>
                <th>이메일</th>
                <th>직업</th>
                <th>관리</th>
            </tr></thead><tbody>`;

        res.members.forEach(m => {
            var posDisplay = m.position_name
                ? adminPositionBadge(m.position_name)
                : '<span class="edit-placeholder">회원</span>';
            var profDisplay = m.profession
                ? '<span>' + escapeHtml(m.profession) + '</span>'
                : '<span class="edit-placeholder">-</span>';
            var avatarHtml = m.profile_image
                ? '<div class="avatar avatar-sm"><img src="' + escapeHtml(m.profile_image) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%"></div>'
                : '<div class="avatar avatar-sm" style="background:#DBEAFE">' + ADMIN_DEFAULT_AVATAR + '</div>';
            html += `<tr>
                <td>${avatarHtml}</td>
                <td><strong>${escapeHtml(m.name)}</strong></td>
                <td class="editable-cell" onclick="startInlineEditPosition(this, ${m.id}, '${escapeHtml(m.position_name || '')}')">${posDisplay}${CELL_EDIT_ICON}</td>
                <td class="text-sub text-sm">${formatDate(m.created_at)}</td>
                <td class="text-sub">${escapeHtml(m.phone || '-')}</td>
                <td class="text-sub" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(m.email)}</td>
                <td class="editable-cell" onclick="startInlineEditProfession(this, ${m.id}, '${escapeHtml(m.profession || '')}')">${profDisplay}${CELL_EDIT_ICON}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-ghost btn-sm" onclick="openMemberDetail(${m.id})">상세</button>
                        ${m.status === 'pending' ? '<button class="btn btn-primary btn-sm" onclick="approveMember(' + m.id + ')">승인</button>' : ''}
                    </div>
                </td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        wrap.innerHTML = html;

        renderPagination(
            document.getElementById('members-pagination'),
            membersState.page, membersState.totalPages,
            p => { membersState.page = p; loadMembers(); }
        );
    } catch (err) {
        wrap.innerHTML = '<div class="table-wrap"><div class="table-empty"><p>회원 목록을 불러올 수 없습니다.</p></div></div>';
        console.error('Load members error:', err);
    }
}

async function openMemberDetail(id) {
    // 인물카드(dossier)로 바로 이동
    if (typeof openMemberDossier === 'function') {
        openMemberDossier(id);
    } else {
        showAdminToast('인물카드 모듈을 로드할 수 없습니다.', 'error');
    }
}

// 빠른 편집 모달 (상태 변경 + 직책 변경용)
async function openMemberQuickModal(id) {
    try {
        const res = await AdminAPI.get('/api/admin/members/' + id);
        if (!res.success) throw new Error(res.message);
        const m = res.data;

        openModal(`
            <div class="modal" style="max-width:440px">
                <div class="modal-header">
                    <h3>빠른 편집 — ${escapeHtml(m.name)}</h3>
                    <button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>
                <div class="modal-body">
                    <table style="width:100%;font-size:13px">
                        <tr><td style="padding:6px 0;color:var(--c-text-sub);width:80px">상태</td><td style="padding:6px 0">${statusBadge(m.status)}</td></tr>
                        <tr><td style="padding:6px 0;color:var(--c-text-sub)">역할</td><td style="padding:6px 0">${roleBadge(m.role)}</td></tr>
                        <tr><td style="padding:6px 0;color:var(--c-text-sub)">가입일</td><td style="padding:6px 0">${formatDateTime(m.created_at)}</td></tr>
                    </table>
                </div>
                <div class="modal-footer">
                    ${m.status === 'pending' ? '<button class="btn btn-primary btn-sm" onclick="approveMember(' + m.id + ');closeModal()">승인</button>' : ''}
                    ${m.status === 'active' ? '<button class="btn btn-danger btn-sm" onclick="changeMemberStatus(' + m.id + ',\'suspended\')">정지</button>' : ''}
                    ${m.status === 'suspended' ? '<button class="btn btn-primary btn-sm" onclick="changeMemberStatus(' + m.id + ',\'active\')">해제</button>' : ''}
                    <button class="btn btn-danger btn-sm" onclick="permanentDeleteMember(${m.id},'${escapeHtml(m.name)}')">완전삭제</button>
                    <button class="btn btn-ghost btn-sm" onclick="closeModal()">닫기</button>
                </div>
            </div>
        `);
    } catch (err) {
        console.error('Quick modal error:', err);
        showAdminToast('회원 정보를 불러올 수 없습니다: ' + err.message, 'error');
    }
}

async function saveMemberPosition(memberId) {
    const sel = document.getElementById('member-position-select');
    if (!sel) return;
    const positionId = sel.value ? parseInt(sel.value) : null;
    if (!positionId) {
        showAdminToast('직책을 선택해주세요.', 'error');
        return;
    }
    try {
        await AdminAPI.put('/api/admin/members/' + memberId + '/position', {
            position_id: positionId
        });
        showAdminToast('직책이 변경되었습니다.');
        closeModal();
        loadMembers();
    } catch (err) {
        showAdminToast('직책 변경 실패: ' + err.message, 'error');
    }
}

async function approveMember(id) {
    try {
        await AdminAPI.put('/api/admin/members/' + id, { status: 'active' });
        showAdminToast('회원이 승인되었습니다.');
        loadMembers();
    } catch (err) {
        showAdminToast('승인 실패: ' + err.message, 'error');
    }
}

async function changeMemberStatus(id, status) {
    const label = status === 'suspended' ? '정지' : '활성화';
    try {
        await AdminAPI.put('/api/admin/members/' + id, { status });
        showAdminToast('회원 상태가 ' + label + '로 변경되었습니다.');
        closeModal();
        loadMembers();
    } catch (err) {
        showAdminToast('상태 변경 실패: ' + err.message, 'error');
    }
}

async function permanentDeleteMember(id, name) {
    if (!confirm('⚠️ ' + name + ' 회원을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.\n회원의 게시글, 댓글, 참석 기록 등 모든 데이터가 삭제됩니다.')) return;
    if (!confirm('정말로 완전 삭제하시겠습니까? (최종 확인)')) return;
    try {
        const res = await AdminAPI.delete('/api/admin/members/' + id + '/permanent');
        showAdminToast(res.message || '완전 삭제 완료');
        closeModal();
        loadMembers();
    } catch (err) {
        showAdminToast('완전 삭제 실패: ' + err.message, 'error');
    }
}

// ── 인라인 편집: 공통 (hover-to-edit 패턴) ──
function startInlineEdit(td, memberId, currentValue, placeholder, saveCallback) {
    if (td.querySelector('.cell-input')) return;
    td.onclick = null;
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'cell-input';
    input.value = currentValue;
    input.placeholder = placeholder;
    td.innerHTML = '';
    td.appendChild(input);
    input.focus();
    input.select();

    var saving = false;
    async function save() {
        if (saving) return;
        saving = true;
        try {
            await saveCallback(input.value.trim());
            loadMembers();
        } catch (err) {
            showAdminToast('저장 실패: ' + err.message, 'error');
            saving = false;
            loadMembers();
        }
    }

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); save(); }
        if (e.key === 'Escape') { loadMembers(); }
    });
    input.addEventListener('blur', function() { save(); });
}

function startInlineEditPosition(td, memberId, currentValue) {
    startInlineEdit(td, memberId, currentValue, '', async function(val) {
        if (val) {
            await AdminAPI.put('/api/admin/members/' + memberId + '/position', { position_name: val });
        } else {
            // 빈 값 → position_id 제거
            await AdminAPI.put('/api/admin/members/' + memberId, { position: null });
        }
        showAdminToast('직책이 저장되었습니다.');
    });
}

function startInlineEditProfession(td, memberId, currentValue) {
    startInlineEdit(td, memberId, currentValue, '변호사, 한의사, 개발자, PD 등', async function(val) {
        await AdminAPI.put('/api/admin/members/' + memberId, { profession: val || null });
        showAdminToast('직업이 저장되었습니다.');
    });
}

// ── 인쇄 기능 ──
async function printMembers() {
    try {
        const params = new URLSearchParams({ page: 1, limit: 9999 });
        if (membersState.search) params.set('search', membersState.search);
        if (membersState.status) params.set('status', membersState.status);
        if (membersState.role) params.set('role', membersState.role);

        const res = await AdminAPI.get('/api/admin/members?' + params.toString());
        if (!res.success) throw new Error(res.message);

        const members = res.members || [];
        const statusMap = { active: '활동', pending: '대기', suspended: '정지', withdrawn: '탈퇴' };

        let rows = members.map(function(m) {
            return '<tr>' +
                '<td>' + escapeHtml(m.name) + '</td>' +
                '<td>' + escapeHtml(m.position_name || '-') + '</td>' +
                '<td>' + escapeHtml(m.phone || '-') + '</td>' +
                '<td>' + escapeHtml(m.email || '-') + '</td>' +
                '<td>' + escapeHtml(m.company || '-') + '</td>' +
                '<td>' + escapeHtml(m.industry || '-') + '</td>' +
                '</tr>';
        }).join('');

        var printHtml = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
            '<title>회원 목록</title>' +
            '<style>' +
            'body { font-family: "Noto Sans KR", sans-serif; padding: 20px; color: #111827; }' +
            'h1 { font-size: 18px; margin-bottom: 4px; }' +
            '.meta { font-size: 12px; color: #6B7280; margin-bottom: 16px; }' +
            'table { width: 100%; border-collapse: collapse; font-size: 13px; }' +
            'th, td { border: 1px solid #D1D5DB; padding: 6px 10px; text-align: left; }' +
            'th { background: #F3F4F6; font-weight: 600; }' +
            'tr:nth-child(even) td { background: #F9FAFB; }' +
            '@media print { body { padding: 0; } }' +
            '</style></head><body>' +
            '<h1>영등포 JC 회원 목록</h1>' +
            '<div class="meta">출력일: ' + new Date().toLocaleDateString('ko-KR') + ' | 총 ' + members.length + '명</div>' +
            '<table><thead><tr>' +
            '<th>이름</th><th>직책</th><th>연락처</th><th>이메일</th><th>회사</th><th>업종</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table>' +
            '</body></html>';

        var w = window.open('', '_blank');
        w.document.write(printHtml);
        w.document.close();
        w.onload = function() { w.print(); };
    } catch (err) {
        console.error('Print error:', err);
        showAdminToast('인쇄 준비 중 오류: ' + err.message, 'error');
    }
}

// ── CSV 다운로드 ──
async function downloadMembersCSV() {
    try {
        var token = AdminAPI.getToken();
        var res = await fetch('/api/admin/members/export/csv', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) {
            var err = await res.json().catch(function() { return {}; });
            throw new Error(err.message || 'CSV 다운로드 실패');
        }
        var blob = await res.blob();
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        var now = new Date();
        var dateStr = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0');
        a.href = url;
        a.download = 'members_' + dateStr + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showAdminToast('CSV 파일이 다운로드되었습니다.');
    } catch (err) {
        console.error('CSV download error:', err);
        showAdminToast('CSV 다운로드 실패: ' + err.message, 'error');
    }
}
