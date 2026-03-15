/* ================================================
   영등포 JC — 관리자 회원 관리
   ================================================ */

let membersState = { page: 1, search: '', status: '', role: '', total: 0, totalPages: 0 };

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

        let html = `<div class="table-wrap"><table>
            <thead><tr>
                <th style="width:40px"></th>
                <th>이름</th>
                <th>JC직책</th>
                <th>가입일</th>
                <th>전화번호</th>
                <th>이메일</th>
                <th>직업</th>
                <th>관리</th>
            </tr></thead><tbody>`;

        res.members.forEach(m => {
            html += `<tr>
                <td>
                    <div class="avatar avatar-sm">${escapeHtml((m.name || '?').charAt(0))}</div>
                </td>
                <td><strong>${escapeHtml(m.name)}</strong></td>
                <td class="inline-editable" onclick="startInlineEditPosition(this, ${m.id}, '${escapeHtml(m.position_name || '')}')">${m.position_name ? adminPositionBadge(m.position_name) : '<span class="text-sub" style="cursor:pointer">-</span>'}</td>
                <td class="text-sub text-sm">${formatDate(m.created_at)}</td>
                <td class="text-sub">${escapeHtml(m.phone || '-')}</td>
                <td class="text-sub">${escapeHtml(m.email)}</td>
                <td class="inline-editable" onclick="startInlineEditProfession(this, ${m.id}, '${escapeHtml(m.profession || '')}')">${m.profession ? '<span class="text-sub" style="cursor:pointer">' + escapeHtml(m.profession) + '</span>' : '<span class="text-sub" style="cursor:pointer">-</span>'}</td>
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

// ── 인라인 편집: JC 직책 ──
var _inlinePositionsCache = null;

function startInlineEditPosition(td, memberId, currentValue) {
    if (td.querySelector('input')) return;
    td.onclick = null;
    var input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.placeholder = '회장, 부회장, 감사, 이사...';
    input.style.cssText = 'border:1px solid #1E3A5F;padding:4px 8px;border-radius:6px;font-size:13px;width:100%;outline:none';
    td.innerHTML = '';
    td.appendChild(input);
    input.focus();
    input.select();

    var saving = false;
    async function save() {
        if (saving) return;
        saving = true;
        var val = input.value.trim();
        try {
            if (!val) {
                // 직책 제거: position_id를 null로
                await AdminAPI.put('/api/admin/members/' + memberId, { position: null });
                showAdminToast('직책이 제거되었습니다.');
            } else {
                // positions 테이블에서 이름으로 검색
                if (!_inlinePositionsCache) {
                    var posRes = await AdminAPI.get('/api/admin/positions');
                    _inlinePositionsCache = (posRes.success && posRes.data && posRes.data.items) || [];
                }
                var match = _inlinePositionsCache.find(function(p) { return p.name === val; });
                if (match) {
                    await AdminAPI.put('/api/admin/members/' + memberId + '/position', { position_id: match.id });
                    showAdminToast('JC 직책이 변경되었습니다.');
                } else {
                    showAdminToast('등록된 JC 직책이 아닙니다: ' + val + '. 설정 > 직책관리에서 먼저 등록하세요.', 'error');
                    saving = false;
                    return;
                }
            }
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

// ── 인라인 편집: 직업(profession) ──
function startInlineEditProfession(td, memberId, currentValue) {
    if (td.querySelector('input')) return;
    td.onclick = null;
    var input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.placeholder = '변호사, 한의사, 개발자, PD 등';
    input.style.cssText = 'border:1px solid #1E3A5F;padding:4px 8px;border-radius:6px;font-size:13px;width:100%;outline:none';
    td.innerHTML = '';
    td.appendChild(input);
    input.focus();
    input.select();

    var saving = false;
    async function save() {
        if (saving) return;
        saving = true;
        var val = input.value.trim();
        try {
            await AdminAPI.put('/api/admin/members/' + memberId, { profession: val || null });
            showAdminToast('직업이 저장되었습니다.');
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
