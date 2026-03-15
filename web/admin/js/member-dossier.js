/* ================================================
   영등포 JC — 관리자 인물카드 (7탭, 개선판)
   ================================================ */

var dossierData = null;
var dossierMemberId = null;
var dossierPositions = [];

async function openMemberDossier(memberId) {
    closeModal();
    dossierMemberId = memberId;

    var main = document.getElementById('main-content');
    main.innerHTML = '<div class="table-empty"><p>인물카드 로딩 중...</p></div>';

    var titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.textContent = '인물카드';

    try {
        var res = await AdminAPI.get('/api/admin/members/' + memberId + '/dossier');
        if (!res.success) throw new Error(res.message);
        dossierData = res.data;
        renderDossierPage(main);
    } catch (err) {
        main.innerHTML = '<div class="table-empty"><p>인물카드를 불러올 수 없습니다: ' + escapeHtml(err.message) + '</p></div>';
        console.error('Dossier load error:', err);
    }
}

// 직책 뱃지 (색상 코딩)
function dossierPositionBadge(posName) {
    if (!posName) return '';
    var colorMap = {
        '회장': 'background:#FEF3C7;color:#92400E;border:1px solid #F59E0B',
        '수석부회장': 'background:#F3F4F6;color:#374151;border:1px solid #9CA3AF',
        '상임부회장': 'background:#F3F4F6;color:#374151;border:1px solid #9CA3AF',
        '부회장': 'background:#DBEAFE;color:#1E40AF;border:1px solid #93C5FD',
        '총무': 'background:#DBEAFE;color:#1E40AF;border:1px solid #93C5FD',
        '이사': 'background:#E0F2FE;color:#0369A1;border:1px solid #7DD3FC',
        '감사': 'background:#E0F2FE;color:#0369A1;border:1px solid #7DD3FC',
        '일반회원': 'background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB'
    };
    var style = colorMap[posName] || 'background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB';
    return ' <span class="badge" style="margin-left:6px;font-size:11px;' + style + '">' + escapeHtml(posName) + '</span>';
}

// 직책 텍스트 저장
async function saveDossierPositionText() {
    var input = document.getElementById('dossier-position-input');
    if (!input) return;
    var posName = input.value.trim();
    try {
        // position 필드를 PUT /admin/members/:id로 업데이트
        await AdminAPI.put('/api/admin/members/' + dossierMemberId, { position: posName || null });
        showAdminToast('직책이 저장되었습니다.');
        await refreshDossier();
        var main = document.getElementById('main-content');
        if (main) renderDossierPage(main);
    } catch (err) {
        showAdminToast('직책 저장 실패: ' + err.message, 'error');
    }
}

function renderDossierPage(container) {
    var m = dossierData;
    var tabs = [
        { id: 'basic', label: '기본정보' },
        { id: 'jc', label: 'JC 이력/활동/교육' },
        { id: 'career', label: '경력' },
        { id: 'family', label: '가족' },
        { id: 'hobbies', label: '취미/특기' },
        { id: 'memo', label: '관리자 메모' }
    ];

    container.innerHTML = ''
        + '<div class="dossier-page">'
        + '<div class="dossier-back">'
        + '<button class="btn btn-ghost btn-sm" onclick="navigateAdmin(\'members\')">← 회원 목록</button>'
        + '</div>'
        + '<div class="dossier-profile-card">'
        + '<div class="dossier-avatar dossier-avatar-lg">'
        + (m.profile_image
            ? '<img src="' + escapeHtml(m.profile_image) + '" alt="">'
            : '<span>' + escapeHtml((m.name || '?').charAt(0)) + '</span>')
        + '</div>'
        + '<div class="dossier-profile-info">'
        + '<div class="dossier-name">' + escapeHtml(m.name || '이름 없음')
        + (m.position ? dossierPositionBadge(m.position) : (m.position_name ? dossierPositionBadge(m.position_name) : ''))
        + '</div>'
        + '<div class="dossier-meta">'
        + (m.email ? '<span>' + escapeHtml(m.email) + '</span>' : '')
        + (m.phone ? '<span>' + escapeHtml(m.phone) + '</span>' : '')
        + '</div>'
        + '<div class="dossier-meta">'
        + (m.company ? '<span>' + escapeHtml(m.company) + '</span>' : '')
        + (m.department ? '<span>' + escapeHtml(m.department) + '</span>' : '')
        + '</div>'
        + '<div class="dossier-position-edit" style="margin-top:8px;display:flex;align-items:center;gap:4px">'
        + '<input id="dossier-position-input" type="text" value="' + escapeHtml(m.position || '') + '" placeholder="직책을 입력하세요 (예: 회장, 상임부회장, 감사...)" style="padding:4px 8px;border:1px solid var(--c-border);border-radius:6px;font-size:12px;width:260px">'
        + '<button class="btn btn-primary btn-sm" style="padding:3px 10px;font-size:11px" onclick="saveDossierPositionText()">저장</button>'
        + '</div>'
        + '</div>'
        + '<div style="margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:6px">'
        + '<div>' + statusBadge(m.status) + ' ' + roleBadge(m.role) + '</div>'
        + '<button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="openMemberQuickModal(' + m.id + ')">빠른편집</button>'
        + '</div>'
        + '</div>'
        + '<div class="dossier-tabs">'
        + tabs.map(function(t, i) { return '<button class="dossier-tab' + (i === 0 ? ' active' : '') + '" data-tab="' + t.id + '" onclick="switchDossierTab(\'' + t.id + '\')">' + t.label + '</button>'; }).join('')
        + '</div>'
        + '<div class="dossier-tab-content" id="dossier-tab-content"></div>'
        + '</div>';

    switchDossierTab('basic');
}

function switchDossierTab(tabId) {
    document.querySelectorAll('.dossier-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.tab === tabId); });
    var content = document.getElementById('dossier-tab-content');
    if (!content) return;

    var renderers = {
        basic: renderDossierBasic,
        jc: renderDossierJCCombined,
        career: renderDossierCareer,
        family: renderDossierFamily,
        hobbies: renderDossierHobbies,
        memo: renderDossierMemo
    };

    var renderer = renderers[tabId];
    if (renderer) renderer(content);
    else content.innerHTML = '<p>준비 중입니다.</p>';
}

// ═══ Tab 1: 기본정보 ═══
function renderDossierBasic(el) {
    var m = dossierData;
    el.innerHTML = ''
        + '<div class="dossier-section">'
        + '<h4 class="dossier-section-title">기본 정보</h4>'
        + '<div class="dossier-grid">'
        + dossierField('이름', m.name)
        + dossierField('이메일', m.email)
        + dossierField('연락처', m.phone)
        + dossierField('생년월일', formatDate(m.birth_date))
        + dossierField('성별', m.gender === 'male' ? '남성' : m.gender === 'female' ? '여성' : '-')
        + dossierField('주소', (m.address || '') + (m.address_detail ? ' ' + m.address_detail : ''))
        + '</div></div>'
        + '<div class="dossier-section">'
        + '<h4 class="dossier-section-title">직장 정보</h4>'
        + '<div class="dossier-grid">'
        + dossierField('회사', m.company)
        + dossierField('직책', m.position)
        + dossierField('부서', m.department)
        + dossierField('업종', m.industry)
        + dossierField('업종 상세', m.industry_detail)
        + dossierField('직장 전화', m.work_phone)
        + '</div></div>'
        + '<div class="dossier-section">'
        + '<h4 class="dossier-section-title">기타</h4>'
        + '<div class="dossier-grid">'
        + dossierField('긴급연락처', m.emergency_contact)
        + dossierField('긴급연락자', m.emergency_contact_name)
        + dossierField('관계', m.emergency_relationship)
        + dossierField('가입일', formatDateTime(m.created_at))
        + dossierField('가입번호', m.join_number)
        + '</div></div>';
}

// ═══ Tab 2: JC 이력/활동/교육 (통합) ═══
function renderDossierJCCombined(el) {
    var html = '';

    // ── 섹션 A: 직책 이력 ──
    var posHistory = dossierData.position_history || [];
    html += '<div class="dossier-section">'
        + '<div class="dossier-section-header-row">'
        + '<h4 class="dossier-section-title">직책 이력</h4>'
        + '<button class="btn btn-primary btn-sm" onclick="addJcPositionHistory()">+ 추가</button>'
        + '</div>';

    if (posHistory.length === 0) {
        html += '<p class="text-sub">등록된 직책 이력이 없습니다.</p>';
    } else {
        html += '<div class="dossier-timeline">';
        posHistory.forEach(function(h, i) {
            html += '<div class="dossier-timeline-item">'
                + '<div class="dossier-timeline-dot"></div>'
                + '<div class="dossier-timeline-content">'
                + '<div class="dossier-timeline-title">' + escapeHtml(h.position_name || '-') + '</div>'
                + '<div class="text-sub text-sm">' + formatDate(h.assigned_at) + (h.assigned_by_name ? ' · 지정: ' + escapeHtml(h.assigned_by_name) : '') + (h.notes ? ' · ' + escapeHtml(h.notes) : '') + '</div>'
                + '</div>'
                + '</div>';
        });
        html += '</div>';
    }

    // 수동 이력 (specialties JSON)
    var manualHistory = parseJsonbField(dossierData.specialties);
    if (manualHistory.length > 0) {
        html += '<div style="margin-top:12px">';
        manualHistory.forEach(function(h, i) {
            html += '<div class="dossier-item-card">'
                + '<div style="display:flex;align-items:center;justify-content:space-between">'
                + '<div><strong>' + escapeHtml(h.title || '-') + '</strong>'
                + (h.date ? ' <span class="text-sub text-sm">(' + escapeHtml(h.date) + ')</span>' : '')
                + '</div>'
                + '<div class="action-btns">'
                + '<button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px" onclick="editJcManualHistory(' + i + ')">수정</button>'
                + '<button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px;color:var(--c-danger)" onclick="removeJcManualHistory(' + i + ')">삭제</button>'
                + '</div></div>'
                + (h.notes ? '<div class="text-sub text-sm">' + escapeHtml(h.notes) + '</div>' : '')
                + '</div>';
        });
        html += '</div>';
    }
    html += '</div>';

    // ── 섹션 B: JC 활동 ──
    var activities = dossierData.activities || [];
    html += '<div class="dossier-section">'
        + '<div class="dossier-section-header-row">'
        + '<h4 class="dossier-section-title">JC 활동</h4>'
        + '<button class="btn btn-primary btn-sm" onclick="addDossierActivity()">+ 추가</button>'
        + '</div>';

    if (activities.length === 0) {
        html += '<p class="text-sub">등록된 활동이 없습니다.</p>';
    } else {
        activities.forEach(function(a) {
            var typeLabel = { event: '행사', meeting: '회의', training: '교육', volunteer: '봉사', award: '수상', committee: '위원회', other: '기타' }[a.activity_type] || a.activity_type || '기타';
            html += '<div class="dossier-item-card">'
                + '<div style="display:flex;align-items:center;justify-content:space-between">'
                + '<div><span class="badge badge-admin" style="font-size:11px">' + escapeHtml(typeLabel) + '</span> <strong>' + escapeHtml(a.title || '-') + '</strong></div>'
                + '<button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px;color:var(--c-danger)" onclick="deleteDossierActivity(' + a.id + ')">삭제</button>'
                + '</div>'
                + '<div class="text-sub text-sm">' + (a.date ? formatDate(a.date) : '') + (a.description ? ' — ' + escapeHtml(a.description) : '') + '</div>'
                + '</div>';
        });
    }
    html += '</div>';

    // ── 섹션 C: 교육/연수 ──
    var educations = parseJsonbField(dossierData.educations);
    html += '<div class="dossier-section">'
        + '<div class="dossier-section-header-row">'
        + '<h4 class="dossier-section-title">교육/연수</h4>'
        + '<button class="btn btn-primary btn-sm" onclick="addJcTraining()">+ 추가</button>'
        + '</div>';

    if (educations.length === 0) {
        html += '<p class="text-sub">등록된 교육/연수가 없습니다.</p>';
    } else {
        educations.forEach(function(e, i) {
            html += '<div class="dossier-item-card">'
                + '<div style="display:flex;align-items:center;justify-content:space-between">'
                + '<div><strong>' + escapeHtml(e.name || e.school || '-') + '</strong>'
                + (e.type || e.degree ? ' <span class="text-sub text-sm">(' + escapeHtml(e.type || e.degree || '') + ')</span>' : '')
                + '</div>'
                + '<div class="action-btns">'
                + '<button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px" onclick="editJcTraining(' + i + ')">수정</button>'
                + '<button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px;color:var(--c-danger)" onclick="removeDossierJsonbItem(\'educations\',' + i + ')">삭제</button>'
                + '</div></div>'
                + '<div class="text-sub text-sm">'
                + (e.date || e.start_year ? escapeHtml(e.date || e.start_year) : '')
                + (e.completed !== undefined ? ' · ' + (e.completed ? '수료' : '미수료') : '')
                + (e.notes || e.major ? ' · ' + escapeHtml(e.notes || e.major) : '')
                + '</div>'
                + '</div>';
        });
    }
    html += '</div>';

    // ── 섹션 D: JC 특이사항 ──
    html += '<div class="dossier-section">'
        + '<div class="dossier-section-header-row">'
        + '<h4 class="dossier-section-title">JC 특이사항</h4>'
        + '<button class="btn btn-ghost btn-sm" id="special-notes-edit-btn" onclick="toggleSpecialNotesEdit()">편집</button>'
        + '</div>'
        + '<div id="special-notes-view">'
        + '<p class="text-sub">' + escapeHtml(dossierData.special_notes || '없음') + '</p>'
        + '</div>'
        + '<div id="special-notes-edit" style="display:none">'
        + '<textarea id="special-notes-textarea" rows="4" style="width:100%;padding:10px;border:1px solid var(--c-border);border-radius:8px;font-size:14px;resize:vertical">' + escapeHtml(dossierData.special_notes || '') + '</textarea>'
        + '<div style="margin-top:8px;text-align:right">'
        + '<button class="btn btn-ghost btn-sm" onclick="toggleSpecialNotesEdit()">취소</button>'
        + '<button class="btn btn-primary btn-sm" style="margin-left:4px" onclick="saveSpecialNotes()">저장</button>'
        + '</div></div></div>';

    el.innerHTML = html;
}

// ── JC 직책 수동 이력 CRUD ──

function addJcPositionHistory() {
    openModal(''
        + '<div class="modal modal-sm">'
        + '<div class="modal-header"><h3>직책 이력 추가</h3><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
        + '<div class="modal-body">'
        + '<div class="form-field"><label>직책명</label><input id="jch-title" placeholder="예: 회장, 상임부회장, 감사..."></div>'
        + '<div class="form-field"><label>임명일</label><input type="date" id="jch-date"></div>'
        + '<div class="form-field"><label>비고</label><input id="jch-notes" placeholder="비고 (선택)"></div>'
        + '</div>'
        + '<div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="saveJcPositionHistory(-1)">저장</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button></div>'
        + '</div>'
    );
}

function editJcManualHistory(index) {
    var items = parseJsonbField(dossierData.specialties);
    var h = items[index] || {};
    openModal(''
        + '<div class="modal modal-sm">'
        + '<div class="modal-header"><h3>직책 이력 수정</h3><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
        + '<div class="modal-body">'
        + '<div class="form-field"><label>직책명</label><input id="jch-title" value="' + escapeHtml(h.title || '') + '"></div>'
        + '<div class="form-field"><label>임명일</label><input type="date" id="jch-date" value="' + escapeHtml(h.date || '') + '"></div>'
        + '<div class="form-field"><label>비고</label><input id="jch-notes" value="' + escapeHtml(h.notes || '') + '"></div>'
        + '</div>'
        + '<div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="saveJcPositionHistory(' + index + ')">저장</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button></div>'
        + '</div>'
    );
}

async function saveJcPositionHistory(index) {
    var item = {
        title: (document.getElementById('jch-title') || {}).value || '',
        date: (document.getElementById('jch-date') || {}).value || '',
        notes: (document.getElementById('jch-notes') || {}).value || ''
    };
    if (!item.title.trim()) { showAdminToast('직책명을 입력하세요', 'error'); return; }
    item.title = item.title.trim();
    item.notes = item.notes.trim();

    var items = parseJsonbField(dossierData.specialties);
    if (index >= 0 && index < items.length) {
        items[index] = item;
    } else {
        items.push(item);
    }
    // 날짜 내림차순 정렬
    items.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
    await saveDossierField('specialties', JSON.stringify(items));
    switchDossierTab('jc');
}

async function removeJcManualHistory(index) {
    if (!confirm('이 직책 이력을 삭제할까요?')) return;
    var items = parseJsonbField(dossierData.specialties);
    items.splice(index, 1);
    await saveDossierField('specialties', JSON.stringify(items));
    switchDossierTab('jc');
}

// ── JC 활동 CRUD ──

function addDossierActivity() {
    openModal(''
        + '<div class="modal modal-sm">'
        + '<div class="modal-header"><h3>JC 활동 추가</h3><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
        + '<div class="modal-body">'
        + '<div class="form-field"><label>유형</label><select id="act-type"><option value="event">행사참석</option><option value="volunteer">봉사활동</option><option value="committee">위원회</option><option value="meeting">회의</option><option value="training">교육</option><option value="award">수상</option><option value="other">기타</option></select></div>'
        + '<div class="form-field"><label>활동명</label><input id="act-title" placeholder="활동명"></div>'
        + '<div class="form-field"><label>날짜</label><input type="date" id="act-date"></div>'
        + '<div class="form-field"><label>설명</label><textarea id="act-desc" rows="3" placeholder="활동 설명"></textarea></div>'
        + '</div>'
        + '<div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="saveDossierActivity()">저장</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button></div>'
        + '</div>'
    );
}

async function saveDossierActivity() {
    var body = {
        activity_type: (document.getElementById('act-type') || {}).value || 'other',
        title: ((document.getElementById('act-title') || {}).value || '').trim(),
        date: (document.getElementById('act-date') || {}).value || null,
        description: ((document.getElementById('act-desc') || {}).value || '').trim()
    };
    if (!body.title) { showAdminToast('활동명을 입력하세요', 'error'); return; }
    try {
        await AdminAPI.post('/api/admin/members/' + dossierMemberId + '/activities', body);
        closeModal();
        showAdminToast('활동이 추가되었습니다.');
        await refreshDossier();
        switchDossierTab('jc');
    } catch (err) { showAdminToast(err.message, 'error'); }
}

async function deleteDossierActivity(activityId) {
    if (!confirm('이 활동을 삭제할까요?')) return;
    try {
        await AdminAPI.delete('/api/admin/members/' + dossierMemberId + '/activities/' + activityId);
        showAdminToast('삭제되었습니다.');
        await refreshDossier();
        switchDossierTab('jc');
    } catch (err) { showAdminToast(err.message, 'error'); }
}

// ── 교육/연수 CRUD ──

function addJcTraining() {
    openModal(''
        + '<div class="modal modal-sm">'
        + '<div class="modal-header"><h3>교육/연수 추가</h3><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
        + '<div class="modal-body">'
        + '<div class="form-field"><label>연수명</label><input id="trn-name" placeholder="연수/교육명"></div>'
        + '<div class="form-field"><label>종류</label><select id="trn-type"><option value="신입회원연수">신입회원연수</option><option value="기존회원연수">기존회원연수</option><option value="임원연수">임원연수</option><option value="외부교육">외부교육</option><option value="기타">기타</option></select></div>'
        + '<div class="form-field"><label>수행일</label><input type="date" id="trn-date"></div>'
        + '<div class="form-field" style="display:flex;align-items:center;gap:8px"><label style="margin-bottom:0">수료 여부</label><input type="checkbox" id="trn-completed" checked style="width:18px;height:18px;accent-color:var(--c-primary)"></div>'
        + '<div class="form-field"><label>비고</label><input id="trn-notes" placeholder="비고 (선택)"></div>'
        + '</div>'
        + '<div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="saveJcTraining(-1)">저장</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button></div>'
        + '</div>'
    );
}

function editJcTraining(index) {
    var items = parseJsonbField(dossierData.educations);
    var e = items[index] || {};
    var typeVal = e.type || e.degree || '기타';
    openModal(''
        + '<div class="modal modal-sm">'
        + '<div class="modal-header"><h3>교육/연수 수정</h3><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
        + '<div class="modal-body">'
        + '<div class="form-field"><label>연수명</label><input id="trn-name" value="' + escapeHtml(e.name || e.school || '') + '"></div>'
        + '<div class="form-field"><label>종류</label><select id="trn-type">'
        + ['신입회원연수', '기존회원연수', '임원연수', '외부교육', '기타'].map(function(t) { return '<option' + (t === typeVal ? ' selected' : '') + '>' + t + '</option>'; }).join('')
        + '</select></div>'
        + '<div class="form-field"><label>수행일</label><input type="date" id="trn-date" value="' + escapeHtml(e.date || e.start_year || '') + '"></div>'
        + '<div class="form-field" style="display:flex;align-items:center;gap:8px"><label style="margin-bottom:0">수료 여부</label><input type="checkbox" id="trn-completed"' + (e.completed !== false ? ' checked' : '') + ' style="width:18px;height:18px;accent-color:var(--c-primary)"></div>'
        + '<div class="form-field"><label>비고</label><input id="trn-notes" value="' + escapeHtml(e.notes || e.major || '') + '"></div>'
        + '</div>'
        + '<div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="saveJcTraining(' + index + ')">저장</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button></div>'
        + '</div>'
    );
}

async function saveJcTraining(index) {
    var item = {
        name: ((document.getElementById('trn-name') || {}).value || '').trim(),
        type: (document.getElementById('trn-type') || {}).value || '기타',
        date: (document.getElementById('trn-date') || {}).value || '',
        completed: (document.getElementById('trn-completed') || {}).checked || false,
        notes: ((document.getElementById('trn-notes') || {}).value || '').trim()
    };
    if (!item.name) { showAdminToast('연수명을 입력하세요', 'error'); return; }

    var items = parseJsonbField(dossierData.educations);
    if (index >= 0 && index < items.length) {
        items[index] = item;
    } else {
        items.push(item);
    }
    items.sort(function(a, b) { return ((b.date || b.start_year || '')).localeCompare(a.date || a.start_year || ''); });
    await saveDossierField('educations', items);
    switchDossierTab('jc');
}

// ── JC 특이사항 ──

function toggleSpecialNotesEdit() {
    var viewEl = document.getElementById('special-notes-view');
    var editEl = document.getElementById('special-notes-edit');
    if (!viewEl || !editEl) return;
    var isEditing = editEl.style.display !== 'none';
    viewEl.style.display = isEditing ? '' : 'none';
    editEl.style.display = isEditing ? 'none' : '';
}

async function saveSpecialNotes() {
    var val = ((document.getElementById('special-notes-textarea') || {}).value || '').trim();
    await saveDossierField('special_notes', val);
    switchDossierTab('jc');
}

// ═══ Tab 3: 경력 ═══
function renderDossierCareer(el) {
    var careers = parseJsonbField(dossierData.careers);
    el.innerHTML = ''
        + '<div class="dossier-section">'
        + '<div class="dossier-section-header-row">'
        + '<h4 class="dossier-section-title">경력</h4>'
        + '<button class="btn btn-primary btn-sm" onclick="addDossierCareer()">+ 추가</button>'
        + '</div>'
        + (careers.length === 0 ? '<p class="text-sub">등록된 경력이 없습니다.</p>' : careers.map(function(c, i) {
            return '<div class="dossier-item-card">'
                + '<div style="display:flex;align-items:center;justify-content:space-between">'
                + '<div><strong>' + escapeHtml(c.company || '-') + '</strong>' + (c.position ? ' — ' + escapeHtml(c.position) : '') + '</div>'
                + '<button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px;color:var(--c-danger)" onclick="removeDossierJsonbItem(\'careers\',' + i + ')">삭제</button>'
                + '</div>'
                + '<div class="text-sub text-sm">' + escapeHtml(c.start_year || '') + (c.end_year ? ' ~ ' + escapeHtml(c.end_year) : ' ~ 현재') + '</div>'
                + (c.description ? '<div class="text-sub text-sm">' + escapeHtml(c.description) + '</div>' : '')
                + '</div>';
        }).join(''))
        + '</div>';
}

function addDossierCareer() {
    openModal(''
        + '<div class="modal modal-sm">'
        + '<div class="modal-header"><h3>경력 추가</h3><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
        + '<div class="modal-body">'
        + '<div class="form-field"><label>회사명</label><input id="car-company" placeholder="회사명"></div>'
        + '<div class="form-field"><label>직책</label><input id="car-position" placeholder="직책"></div>'
        + '<div class="form-field"><label>시작년도</label><input id="car-start" placeholder="2015"></div>'
        + '<div class="form-field"><label>종료년도</label><input id="car-end" placeholder="현재이면 비워두세요"></div>'
        + '<div class="form-field"><label>설명</label><textarea id="car-desc" rows="2" placeholder="업무 내용"></textarea></div>'
        + '</div>'
        + '<div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="saveDossierCareer()">저장</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button></div>'
        + '</div>'
    );
}

async function saveDossierCareer() {
    var item = {
        company: ((document.getElementById('car-company') || {}).value || '').trim(),
        position: ((document.getElementById('car-position') || {}).value || '').trim(),
        start_year: ((document.getElementById('car-start') || {}).value || '').trim(),
        end_year: ((document.getElementById('car-end') || {}).value || '').trim(),
        description: ((document.getElementById('car-desc') || {}).value || '').trim()
    };
    if (!item.company) { showAdminToast('회사명을 입력하세요', 'error'); return; }
    var careers = parseJsonbField(dossierData.careers);
    careers.push(item);
    await saveDossierField('careers', careers);
}

// ═══ Tab 4: 가족 ═══
function renderDossierFamily(el) {
    var families = parseJsonbField(dossierData.families);
    el.innerHTML = ''
        + '<div class="dossier-section">'
        + '<div class="dossier-section-header-row">'
        + '<h4 class="dossier-section-title">가족</h4>'
        + '<button class="btn btn-primary btn-sm" onclick="addDossierFamily()">+ 추가</button>'
        + '</div>'
        + (families.length === 0 ? '<p class="text-sub">등록된 가족 정보가 없습니다.</p>' : families.map(function(f, i) {
            return '<div class="dossier-item-card">'
                + '<div style="display:flex;align-items:center;justify-content:space-between">'
                + '<div><strong>' + escapeHtml(f.name || '-') + '</strong> (' + escapeHtml(f.relationship || '-') + ')</div>'
                + '<button class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:11px;color:var(--c-danger)" onclick="removeDossierJsonbItem(\'families\',' + i + ')">삭제</button>'
                + '</div>'
                + (f.birth_date ? '<div class="text-sub text-sm">생년월일: ' + escapeHtml(f.birth_date) + '</div>' : '')
                + (f.phone ? '<div class="text-sub text-sm">연락처: ' + escapeHtml(f.phone) + '</div>' : '')
                + '</div>';
        }).join(''))
        + '</div>';
}

function addDossierFamily() {
    openModal(''
        + '<div class="modal modal-sm">'
        + '<div class="modal-header"><h3>가족 추가</h3><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
        + '<div class="modal-body">'
        + '<div class="form-field"><label>이름</label><input id="fam-name" placeholder="이름"></div>'
        + '<div class="form-field"><label>관계</label><select id="fam-rel"><option value="배우자">배우자</option><option value="자녀">자녀</option><option value="부모">부모</option><option value="형제/자매">형제/자매</option><option value="기타">기타</option></select></div>'
        + '<div class="form-field"><label>생년월일</label><input type="date" id="fam-birth"></div>'
        + '<div class="form-field"><label>연락처</label><input id="fam-phone" placeholder="010-0000-0000"></div>'
        + '</div>'
        + '<div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="saveDossierFamily()">저장</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button></div>'
        + '</div>'
    );
}

async function saveDossierFamily() {
    var item = {
        name: ((document.getElementById('fam-name') || {}).value || '').trim(),
        relationship: (document.getElementById('fam-rel') || {}).value || '',
        birth_date: (document.getElementById('fam-birth') || {}).value || '',
        phone: ((document.getElementById('fam-phone') || {}).value || '').trim()
    };
    if (!item.name) { showAdminToast('이름을 입력하세요', 'error'); return; }
    var families = parseJsonbField(dossierData.families);
    families.push(item);
    await saveDossierField('families', families);
}

// ═══ Tab 5: 취미/특기 ═══
function renderDossierHobbies(el) {
    var hobbies = dossierData.hobbies || '';
    el.innerHTML = ''
        + '<div class="dossier-section">'
        + '<h4 class="dossier-section-title">취미 / 특기</h4>'
        + '<textarea id="dossier-hobbies" rows="5" style="width:100%;padding:10px;border:1px solid var(--c-border);border-radius:8px;font-size:14px;resize:vertical">' + escapeHtml(hobbies) + '</textarea>'
        + '<div style="margin-top:12px;text-align:right">'
        + '<button class="btn btn-primary btn-sm" onclick="saveDossierHobbies()">저장</button>'
        + '</div></div>';
}

async function saveDossierHobbies() {
    var val = (document.getElementById('dossier-hobbies') || {}).value || '';
    await saveDossierField('hobbies', val);
}

// ═══ Tab 6: 관리자 메모 ═══
function renderDossierMemo(el) {
    var memo = dossierData.admin_memo || '';
    el.innerHTML = ''
        + '<div class="dossier-section">'
        + '<h4 class="dossier-section-title">관리자 메모</h4>'
        + '<p class="text-sub text-sm" style="margin-bottom:8px">이 메모는 관리자만 볼 수 있습니다.</p>'
        + '<textarea id="dossier-memo" rows="8" style="width:100%;padding:10px;border:1px solid var(--c-border);border-radius:8px;font-size:14px;resize:vertical">' + escapeHtml(memo) + '</textarea>'
        + '<div style="margin-top:12px;text-align:right">'
        + '<button class="btn btn-primary btn-sm" onclick="saveDossierMemo()">저장</button>'
        + '</div></div>';
}

async function saveDossierMemo() {
    var val = (document.getElementById('dossier-memo') || {}).value || '';
    await saveDossierField('admin_memo', val);
}

// ═══ 공통 유틸 ═══

function parseJsonbField(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try { var parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch (_) { return []; }
    }
    return [];
}

function dossierField(label, value) {
    return '<div class="dossier-field"><span class="dossier-field-label">' + label + '</span><span class="dossier-field-value">' + escapeHtml(value || '-') + '</span></div>';
}

async function saveDossierField(field, value) {
    try {
        var body = {};
        body[field] = value;
        await AdminAPI.put('/api/admin/members/' + dossierMemberId + '/dossier', body);
        closeModal();
        showAdminToast('저장되었습니다.');
        await refreshDossier();
    } catch (err) {
        showAdminToast('저장 실패: ' + err.message, 'error');
    }
}

async function removeDossierJsonbItem(field, index) {
    if (!confirm('삭제할까요?')) return;
    var arr = parseJsonbField(dossierData[field]);
    arr.splice(index, 1);
    await saveDossierField(field, arr);
    var activeTab = document.querySelector('.dossier-tab.active');
    if (activeTab) switchDossierTab(activeTab.dataset.tab);
}

async function refreshDossier() {
    try {
        var res = await AdminAPI.get('/api/admin/members/' + dossierMemberId + '/dossier');
        if (res.success) dossierData = res.data;
    } catch (_) {}
}
