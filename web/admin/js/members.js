/* ================================================
   영등포 JC — 관리자 회원 관리
   ================================================ */

let membersState = { page: 1, search: '', status: '', role: '', total: 0, totalPages: 0 };

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
    showTableSkeleton(wrap, 6);

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
                <th>회원</th>
                <th>이메일</th>
                <th>전화번호</th>
                <th>상태</th>
                <th>역할</th>
                <th>가입일</th>
                <th>관리</th>
            </tr></thead><tbody>`;

        res.members.forEach(m => {
            html += `<tr>
                <td>
                    <div style="display:flex;align-items:center;gap:8px">
                        <div class="avatar avatar-sm">${escapeHtml((m.name || '?').charAt(0))}</div>
                        <span>${escapeHtml(m.name)}</span>
                    </div>
                </td>
                <td class="text-sub">${escapeHtml(m.email)}</td>
                <td class="text-sub">${escapeHtml(m.phone || '-')}</td>
                <td>${statusBadge(m.status)}</td>
                <td>${roleBadge(m.role)}</td>
                <td class="text-sub text-sm">${formatDate(m.created_at)}</td>
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
    try {
        const [res, posRes, histRes] = await Promise.all([
            AdminAPI.get('/api/admin/members/' + id),
            AdminAPI.get('/api/admin/positions'),
            AdminAPI.get('/api/admin/members/' + id + '/position-history')
        ]);
        if (!res.success) throw new Error(res.message);
        const m = res.data;
        const positions = (posRes.success && posRes.data) || [];
        const posHistory = (histRes.success && histRes.data) || [];

        const positionOptions = positions.map(function(p) {
            const selected = m.position === p.name ? ' selected' : '';
            return '<option value="' + p.id + '"' + selected + '>' + escapeHtml(p.name) + ' (Lv.' + p.level + ')</option>';
        }).join('');

        openModal(`
            <div class="modal" style="max-width:540px">
                <div class="modal-header">
                    <h3>회원 상세</h3>
                    <div style="display:flex;gap:8px;align-items:center">
                        <button class="btn btn-primary btn-sm" onclick="openMemberDossier(${m.id})">인물카드</button>
                        <button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                    </div>
                </div>
                <div class="modal-body">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
                        <div class="avatar">${escapeHtml((m.name || '?').charAt(0))}</div>
                        <div>
                            <div style="font-weight:600;font-size:16px">${escapeHtml(m.name)}</div>
                            <div class="text-sub text-sm">${escapeHtml(m.email)}</div>
                        </div>
                        <div style="margin-left:auto">${statusBadge(m.status)} ${roleBadge(m.role)}</div>
                    </div>
                    <table style="width:100%;font-size:13px">
                        <tr><td style="padding:6px 0;color:var(--c-text-sub);width:100px">전화번호</td><td style="padding:6px 0">${escapeHtml(m.phone || '-')}</td></tr>
                        <tr><td style="padding:6px 0;color:var(--c-text-sub)">생년월일</td><td style="padding:6px 0">${formatDate(m.birth_date)}</td></tr>
                        <tr>
                            <td style="padding:6px 0;color:var(--c-text-sub)">JC 직책</td>
                            <td style="padding:6px 0">
                                <select id="member-position-select" style="padding:4px 8px;border:1px solid var(--c-border);border-radius:6px;font-size:13px">
                                    <option value="">미지정</option>
                                    ${positionOptions}
                                </select>
                                <button class="btn btn-primary btn-sm" style="margin-left:6px;padding:3px 10px;font-size:12px" onclick="saveMemberPosition(${m.id})">저장</button>
                            </td>
                        </tr>
                        <tr><td style="padding:6px 0;color:var(--c-text-sub)">부서</td><td style="padding:6px 0">${escapeHtml(m.department || '-')}</td></tr>
                        <tr><td style="padding:6px 0;color:var(--c-text-sub)">회사</td><td style="padding:6px 0">${escapeHtml(m.company || '-')}</td></tr>
                        <tr><td style="padding:6px 0;color:var(--c-text-sub)">업종</td><td style="padding:6px 0">${escapeHtml(m.industry || '-')}</td></tr>
                        <tr><td style="padding:6px 0;color:var(--c-text-sub)">가입일</td><td style="padding:6px 0">${formatDateTime(m.created_at)}</td></tr>
                    </table>

                    ${posHistory.length > 0 ? `
                    <div style="margin-top:16px">
                        <div style="font-size:13px;font-weight:600;color:var(--c-text);margin-bottom:8px">직책 변동 이력</div>
                        <div style="border-left:2px solid var(--c-border);padding-left:12px;margin-left:4px">
                            ${posHistory.map(h => `
                                <div style="position:relative;padding:6px 0;font-size:12px;color:var(--c-text-sub)">
                                    <span style="position:absolute;left:-18px;top:10px;width:8px;height:8px;border-radius:50%;background:var(--c-primary)"></span>
                                    <div><strong style="color:var(--c-text)">${escapeHtml(h.position_name || '-')}</strong></div>
                                    <div>${formatDate(h.assigned_at)}${h.assigned_by_name ? ' · ' + escapeHtml(h.assigned_by_name) : ''}${h.notes ? ' · ' + escapeHtml(h.notes) : ''}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>` : ''}
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
        showAdminToast('회원 정보를 불러올 수 없습니다.', 'error');
    }
}

async function saveMemberPosition(memberId) {
    const sel = document.getElementById('member-position-select');
    if (!sel) return;
    const positionId = sel.value ? parseInt(sel.value) : null;
    try {
        // position_id를 직접 PUT으로 업데이트
        const posName = positionId ? sel.options[sel.selectedIndex].text.split(' (')[0] : null;
        await AdminAPI.put('/api/admin/members/' + memberId, {
            position: posName
        });
        showAdminToast('직책이 변경되었습니다.');
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
