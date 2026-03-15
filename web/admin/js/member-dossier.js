/* ================================================
   영등포 JC — 관리자 인물카드 (8탭)
   ================================================ */

let dossierData = null;
let dossierMemberId = null;
let dossierPositions = []; // 직책 목록 캐시

async function openMemberDossier(memberId) {
    closeModal();
    dossierMemberId = memberId;

    const main = document.getElementById('main-content');
    main.innerHTML = '<div class="table-empty"><p>인물카드 로딩 중...</p></div>';

    // 헤더 제목 업데이트
    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.textContent = '인물카드';

    try {
        const [res, posRes] = await Promise.all([
            AdminAPI.get('/api/admin/members/' + memberId + '/dossier'),
            AdminAPI.get('/api/admin/positions')
        ]);
        if (!res.success) throw new Error(res.message);
        dossierData = res.data;
        const posData = (posRes.success && posRes.data) || {};
        dossierPositions = Array.isArray(posData) ? posData : (posData.items || []);
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
        '부회장': 'background:#DBEAFE;color:#1E40AF;border:1px solid #93C5FD',
        '총무': 'background:#DBEAFE;color:#1E40AF;border:1px solid #93C5FD',
        '이사': 'background:#E0F2FE;color:#0369A1;border:1px solid #7DD3FC',
        '감사': 'background:#E0F2FE;color:#0369A1;border:1px solid #7DD3FC',
        '일반회원': 'background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB'
    };
    var style = colorMap[posName] || 'background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB';
    return ' <span class="badge" style="margin-left:6px;font-size:11px;' + style + '">' + escapeHtml(posName) + '</span>';
}

// 직책 변경 저장
async function saveDossierPosition() {
    var sel = document.getElementById('dossier-position-select');
    if (!sel) return;
    var positionId = sel.value ? parseInt(sel.value) : null;
    if (!positionId) {
        showAdminToast('직책을 선택해주세요.', 'error');
        return;
    }
    try {
        await AdminAPI.put('/api/admin/members/' + dossierMemberId + '/position', {
            position_id: positionId
        });
        showAdminToast('직책이 변경되었습니다.');
        // 인물카드 새로고침
        await refreshDossier();
        var main = document.getElementById('main-content');
        if (main) renderDossierPage(main);
    } catch (err) {
        showAdminToast('직책 변경 실패: ' + err.message, 'error');
    }
}

function renderDossierPage(container) {
    const m = dossierData;
    const tabs = [
        { id: 'basic', label: '기본정보' },
        { id: 'jc', label: 'JC 이력' },
        { id: 'education', label: '학력' },
        { id: 'activities', label: '활동' },
        { id: 'career', label: '경력' },
        { id: 'family', label: '가족' },
        { id: 'hobbies', label: '취미/특기' },
        { id: 'memo', label: '관리자 메모' }
    ];

    container.innerHTML = `
        <div class="dossier-page">
            <div class="dossier-back">
                <button class="btn btn-ghost btn-sm" onclick="navigateAdmin('members')">← 회원 목록</button>
            </div>
            <div class="dossier-profile-card">
                <div class="dossier-avatar dossier-avatar-lg">${m.profile_image
                    ? '<img src="' + escapeHtml(m.profile_image) + '" alt="">'
                    : '<span>' + escapeHtml((m.name || '?').charAt(0)) + '</span>'
                }</div>
                <div class="dossier-profile-info">
                    <div class="dossier-name">${escapeHtml(m.name || '이름 없음')}
                        ${m.position_name ? dossierPositionBadge(m.position_name) : ''}
                    </div>
                    <div class="dossier-meta">
                        ${m.email ? '<span>' + escapeHtml(m.email) + '</span>' : ''}
                        ${m.phone ? '<span>' + escapeHtml(m.phone) + '</span>' : ''}
                    </div>
                    <div class="dossier-meta">
                        ${m.company ? '<span>' + escapeHtml(m.company) + '</span>' : ''}
                        ${m.department ? '<span>' + escapeHtml(m.department) + '</span>' : ''}
                    </div>
                    <div class="dossier-position-edit" style="margin-top:8px">
                        <select id="dossier-position-select" style="padding:4px 8px;border:1px solid var(--c-border);border-radius:6px;font-size:12px">
                            <option value="">직책 미지정</option>
                            ${dossierPositions.map(function(p) {
                                var selected = m.position_id === p.id ? ' selected' : '';
                                return '<option value="' + p.id + '"' + selected + '>' + escapeHtml(p.name) + '</option>';
                            }).join('')}
                        </select>
                        <button class="btn btn-primary btn-sm" style="padding:3px 10px;font-size:11px;margin-left:4px" onclick="saveDossierPosition()">변경</button>
                    </div>
                </div>
                <div style="margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                    <div>${statusBadge(m.status)} ${roleBadge(m.role)}</div>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="openMemberQuickModal(${m.id})">빠른편집</button>
                    </div>
                </div>
            </div>
            <div class="dossier-tabs">
                ${tabs.map((t, i) => '<button class="dossier-tab' + (i === 0 ? ' active' : '') + '" data-tab="' + t.id + '" onclick="switchDossierTab(\'' + t.id + '\')">' + t.label + '</button>').join('')}
            </div>
            <div class="dossier-tab-content" id="dossier-tab-content"></div>
        </div>
    `;

    switchDossierTab('basic');
}

function switchDossierTab(tabId) {
    document.querySelectorAll('.dossier-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    const content = document.getElementById('dossier-tab-content');
    if (!content) return;

    const renderers = {
        basic: renderDossierBasic,
        jc: renderDossierJC,
        education: renderDossierEducation,
        activities: renderDossierActivities,
        career: renderDossierCareer,
        family: renderDossierFamily,
        hobbies: renderDossierHobbies,
        memo: renderDossierMemo
    };

    const renderer = renderers[tabId];
    if (renderer) renderer(content);
    else content.innerHTML = '<p>준비 중입니다.</p>';
}

// ═══ Tab 1: 기본정보 ═══
function renderDossierBasic(el) {
    const m = dossierData;
    el.innerHTML = `
        <div class="dossier-section">
            <h4 class="dossier-section-title">기본 정보</h4>
            <div class="dossier-grid">
                ${dossierField('이름', m.name)}
                ${dossierField('이메일', m.email)}
                ${dossierField('연락처', m.phone)}
                ${dossierField('생년월일', formatDate(m.birth_date))}
                ${dossierField('성별', m.gender === 'male' ? '남성' : m.gender === 'female' ? '여성' : '-')}
                ${dossierField('주소', (m.address || '') + (m.address_detail ? ' ' + m.address_detail : ''))}
            </div>
        </div>
        <div class="dossier-section">
            <h4 class="dossier-section-title">직장 정보</h4>
            <div class="dossier-grid">
                ${dossierField('회사', m.company)}
                ${dossierField('직책', m.position)}
                ${dossierField('부서', m.department)}
                ${dossierField('업종', m.industry)}
                ${dossierField('업종 상세', m.industry_detail)}
                ${dossierField('직장 전화', m.work_phone)}
            </div>
        </div>
        <div class="dossier-section">
            <h4 class="dossier-section-title">기타</h4>
            <div class="dossier-grid">
                ${dossierField('긴급연락처', m.emergency_contact)}
                ${dossierField('긴급연락자', m.emergency_contact_name)}
                ${dossierField('관계', m.emergency_relationship)}
                ${dossierField('가입일', formatDateTime(m.created_at))}
                ${dossierField('가입번호', m.join_number)}
            </div>
        </div>
    `;
}

// ═══ Tab 2: JC 이력 ═══
function renderDossierJC(el) {
    const history = dossierData.position_history || [];
    el.innerHTML = `
        <div class="dossier-section">
            <h4 class="dossier-section-title">JC 직책 이력</h4>
            ${history.length === 0 ? '<p class="text-sub">등록된 이력이 없습니다.</p>' : `
            <table style="width:100%;font-size:13px">
                <thead><tr><th>직책</th><th>시작일</th><th>종료일</th><th>변경자</th></tr></thead>
                <tbody>${history.map(h => `<tr>
                    <td>${escapeHtml(h.position_name || '-')}</td>
                    <td>${formatDate(h.started_at)}</td>
                    <td>${h.ended_at ? formatDate(h.ended_at) : '현재'}</td>
                    <td>${escapeHtml(h.changed_by_name || '-')}</td>
                </tr>`).join('')}</tbody>
            </table>`}
        </div>
        <div class="dossier-section">
            <h4 class="dossier-section-title">JC 특이사항</h4>
            <p class="text-sub">${escapeHtml(dossierData.special_notes || '없음')}</p>
        </div>
    `;
}

// ═══ Tab 3: 학력 ═══
function renderDossierEducation(el) {
    const educations = parseJsonbField(dossierData.educations);
    el.innerHTML = `
        <div class="dossier-section">
            <div class="dossier-section-header-row">
                <h4 class="dossier-section-title">학력</h4>
                <button class="btn btn-primary btn-sm" onclick="addDossierEducation()">+ 추가</button>
            </div>
            ${educations.length === 0 ? '<p class="text-sub">등록된 학력이 없습니다.</p>' : educations.map((e, i) => `
                <div class="dossier-item-card">
                    <div><strong>${escapeHtml(e.school || '-')}</strong></div>
                    <div class="text-sub text-sm">${escapeHtml(e.major || '')} ${e.degree ? '(' + escapeHtml(e.degree) + ')' : ''}</div>
                    <div class="text-sub text-sm">${escapeHtml(e.start_year || '')}${e.end_year ? ' ~ ' + escapeHtml(e.end_year) : ''}</div>
                    <button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="removeDossierJsonbItem('educations', ${i})">삭제</button>
                </div>
            `).join('')}
        </div>
    `;
}

function addDossierEducation() {
    openModal(`
        <div class="modal modal-sm">
            <div class="modal-header"><h3>학력 추가</h3><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
            <div class="modal-body">
                <div class="form-field"><label>학교명</label><input id="edu-school" placeholder="학교명"></div>
                <div class="form-field"><label>전공</label><input id="edu-major" placeholder="전공"></div>
                <div class="form-field"><label>학위</label><select id="edu-degree"><option value="">선택</option><option>학사</option><option>석사</option><option>박사</option><option>고졸</option></select></div>
                <div class="form-field"><label>입학년도</label><input id="edu-start" placeholder="2010"></div>
                <div class="form-field"><label>졸업년도</label><input id="edu-end" placeholder="2014"></div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="saveDossierEducation()">저장</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button></div>
        </div>
    `);
}

async function saveDossierEducation() {
    const item = {
        school: document.getElementById('edu-school')?.value?.trim() || '',
        major: document.getElementById('edu-major')?.value?.trim() || '',
        degree: document.getElementById('edu-degree')?.value || '',
        start_year: document.getElementById('edu-start')?.value?.trim() || '',
        end_year: document.getElementById('edu-end')?.value?.trim() || ''
    };
    if (!item.school) { showAdminToast('학교명을 입력하세요', 'error'); return; }
    const educations = parseJsonbField(dossierData.educations);
    educations.push(item);
    await saveDossierField('educations', educations);
}

// ═══ Tab 4: 활동 ═══
function renderDossierActivities(el) {
    const activities = dossierData.activities || [];
    el.innerHTML = `
        <div class="dossier-section">
            <div class="dossier-section-header-row">
                <h4 class="dossier-section-title">활동 이력</h4>
                <button class="btn btn-primary btn-sm" onclick="addDossierActivity()">+ 추가</button>
            </div>
            ${activities.length === 0 ? '<p class="text-sub">등록된 활동이 없습니다.</p>' : activities.map(a => `
                <div class="dossier-item-card">
                    <div><span class="badge badge-admin" style="font-size:11px">${escapeHtml(a.activity_type || '기타')}</span> <strong>${escapeHtml(a.title || '-')}</strong></div>
                    <div class="text-sub text-sm">${a.date ? formatDate(a.date) : ''} ${a.description ? '— ' + escapeHtml(a.description) : ''}</div>
                    <button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="deleteDossierActivity(${a.id})">삭제</button>
                </div>
            `).join('')}
        </div>
    `;
}

function addDossierActivity() {
    openModal(`
        <div class="modal modal-sm">
            <div class="modal-header"><h3>활동 추가</h3><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
            <div class="modal-body">
                <div class="form-field"><label>유형</label><select id="act-type"><option value="event">행사</option><option value="meeting">회의</option><option value="training">교육</option><option value="volunteer">봉사</option><option value="award">수상</option><option value="other">기타</option></select></div>
                <div class="form-field"><label>제목</label><input id="act-title" placeholder="활동 제목"></div>
                <div class="form-field"><label>날짜</label><input type="date" id="act-date"></div>
                <div class="form-field"><label>설명</label><textarea id="act-desc" rows="3" placeholder="활동 설명"></textarea></div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="saveDossierActivity()">저장</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button></div>
        </div>
    `);
}

async function saveDossierActivity() {
    const body = {
        activity_type: document.getElementById('act-type')?.value || 'other',
        title: document.getElementById('act-title')?.value?.trim() || '',
        date: document.getElementById('act-date')?.value || null,
        description: document.getElementById('act-desc')?.value?.trim() || ''
    };
    if (!body.title) { showAdminToast('제목을 입력하세요', 'error'); return; }
    try {
        await AdminAPI.post('/api/admin/members/' + dossierMemberId + '/activities', body);
        closeModal();
        showAdminToast('활동이 추가되었습니다.');
        await refreshDossier();
        switchDossierTab('activities');
    } catch (err) { showAdminToast(err.message, 'error'); }
}

async function deleteDossierActivity(activityId) {
    if (!confirm('이 활동을 삭제할까요?')) return;
    try {
        await AdminAPI.delete('/api/admin/members/' + dossierMemberId + '/activities/' + activityId);
        showAdminToast('삭제되었습니다.');
        await refreshDossier();
        switchDossierTab('activities');
    } catch (err) { showAdminToast(err.message, 'error'); }
}

// ═══ Tab 5: 경력 ═══
function renderDossierCareer(el) {
    const careers = parseJsonbField(dossierData.careers);
    el.innerHTML = `
        <div class="dossier-section">
            <div class="dossier-section-header-row">
                <h4 class="dossier-section-title">경력</h4>
                <button class="btn btn-primary btn-sm" onclick="addDossierCareer()">+ 추가</button>
            </div>
            ${careers.length === 0 ? '<p class="text-sub">등록된 경력이 없습니다.</p>' : careers.map((c, i) => `
                <div class="dossier-item-card">
                    <div><strong>${escapeHtml(c.company || '-')}</strong> ${c.position ? '— ' + escapeHtml(c.position) : ''}</div>
                    <div class="text-sub text-sm">${escapeHtml(c.start_year || '')}${c.end_year ? ' ~ ' + escapeHtml(c.end_year) : ' ~ 현재'}</div>
                    ${c.description ? '<div class="text-sub text-sm">' + escapeHtml(c.description) + '</div>' : ''}
                    <button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="removeDossierJsonbItem('careers', ${i})">삭제</button>
                </div>
            `).join('')}
        </div>
    `;
}

function addDossierCareer() {
    openModal(`
        <div class="modal modal-sm">
            <div class="modal-header"><h3>경력 추가</h3><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
            <div class="modal-body">
                <div class="form-field"><label>회사명</label><input id="car-company" placeholder="회사명"></div>
                <div class="form-field"><label>직책</label><input id="car-position" placeholder="직책"></div>
                <div class="form-field"><label>시작년도</label><input id="car-start" placeholder="2015"></div>
                <div class="form-field"><label>종료년도</label><input id="car-end" placeholder="현재이면 비워두세요"></div>
                <div class="form-field"><label>설명</label><textarea id="car-desc" rows="2" placeholder="업무 내용"></textarea></div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="saveDossierCareer()">저장</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button></div>
        </div>
    `);
}

async function saveDossierCareer() {
    const item = {
        company: document.getElementById('car-company')?.value?.trim() || '',
        position: document.getElementById('car-position')?.value?.trim() || '',
        start_year: document.getElementById('car-start')?.value?.trim() || '',
        end_year: document.getElementById('car-end')?.value?.trim() || '',
        description: document.getElementById('car-desc')?.value?.trim() || ''
    };
    if (!item.company) { showAdminToast('회사명을 입력하세요', 'error'); return; }
    const careers = parseJsonbField(dossierData.careers);
    careers.push(item);
    await saveDossierField('careers', careers);
}

// ═══ Tab 6: 가족 ═══
function renderDossierFamily(el) {
    const families = parseJsonbField(dossierData.families);
    el.innerHTML = `
        <div class="dossier-section">
            <div class="dossier-section-header-row">
                <h4 class="dossier-section-title">가족</h4>
                <button class="btn btn-primary btn-sm" onclick="addDossierFamily()">+ 추가</button>
            </div>
            ${families.length === 0 ? '<p class="text-sub">등록된 가족 정보가 없습니다.</p>' : families.map((f, i) => `
                <div class="dossier-item-card">
                    <div><strong>${escapeHtml(f.name || '-')}</strong> (${escapeHtml(f.relationship || '-')})</div>
                    ${f.birth_date ? '<div class="text-sub text-sm">생년월일: ' + escapeHtml(f.birth_date) + '</div>' : ''}
                    ${f.phone ? '<div class="text-sub text-sm">연락처: ' + escapeHtml(f.phone) + '</div>' : ''}
                    <button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="removeDossierJsonbItem('families', ${i})">삭제</button>
                </div>
            `).join('')}
        </div>
    `;
}

function addDossierFamily() {
    openModal(`
        <div class="modal modal-sm">
            <div class="modal-header"><h3>가족 추가</h3><button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
            <div class="modal-body">
                <div class="form-field"><label>이름</label><input id="fam-name" placeholder="이름"></div>
                <div class="form-field"><label>관계</label><select id="fam-rel"><option value="배우자">배우자</option><option value="자녀">자녀</option><option value="부모">부모</option><option value="형제/자매">형제/자매</option><option value="기타">기타</option></select></div>
                <div class="form-field"><label>생년월일</label><input type="date" id="fam-birth"></div>
                <div class="form-field"><label>연락처</label><input id="fam-phone" placeholder="010-0000-0000"></div>
            </div>
            <div class="modal-footer"><button class="btn btn-primary btn-sm" onclick="saveDossierFamily()">저장</button><button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button></div>
        </div>
    `);
}

async function saveDossierFamily() {
    const item = {
        name: document.getElementById('fam-name')?.value?.trim() || '',
        relationship: document.getElementById('fam-rel')?.value || '',
        birth_date: document.getElementById('fam-birth')?.value || '',
        phone: document.getElementById('fam-phone')?.value?.trim() || ''
    };
    if (!item.name) { showAdminToast('이름을 입력하세요', 'error'); return; }
    const families = parseJsonbField(dossierData.families);
    families.push(item);
    await saveDossierField('families', families);
}

// ═══ Tab 7: 취미/특기 ═══
function renderDossierHobbies(el) {
    const hobbies = dossierData.hobbies || '';
    el.innerHTML = `
        <div class="dossier-section">
            <h4 class="dossier-section-title">취미 / 특기</h4>
            <textarea id="dossier-hobbies" rows="5" style="width:100%;padding:10px;border:1px solid var(--c-border);border-radius:8px;font-size:14px;resize:vertical">${escapeHtml(hobbies)}</textarea>
            <div style="margin-top:12px;text-align:right">
                <button class="btn btn-primary btn-sm" onclick="saveDossierHobbies()">저장</button>
            </div>
        </div>
    `;
}

async function saveDossierHobbies() {
    const val = document.getElementById('dossier-hobbies')?.value || '';
    await saveDossierField('hobbies', val);
}

// ═══ Tab 8: 관리자 메모 ═══
function renderDossierMemo(el) {
    const memo = dossierData.admin_memo || '';
    el.innerHTML = `
        <div class="dossier-section">
            <h4 class="dossier-section-title">관리자 메모</h4>
            <p class="text-sub text-sm" style="margin-bottom:8px">이 메모는 관리자만 볼 수 있습니다.</p>
            <textarea id="dossier-memo" rows="8" style="width:100%;padding:10px;border:1px solid var(--c-border);border-radius:8px;font-size:14px;resize:vertical">${escapeHtml(memo)}</textarea>
            <div style="margin-top:12px;text-align:right">
                <button class="btn btn-primary btn-sm" onclick="saveDossierMemo()">저장</button>
            </div>
        </div>
    `;
}

async function saveDossierMemo() {
    const val = document.getElementById('dossier-memo')?.value || '';
    await saveDossierField('admin_memo', val);
}

// ═══ 공통 유틸 ═══

function parseJsonbField(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (_) { return []; }
    }
    return [];
}

function dossierField(label, value) {
    return '<div class="dossier-field"><span class="dossier-field-label">' + label + '</span><span class="dossier-field-value">' + escapeHtml(value || '-') + '</span></div>';
}

async function saveDossierField(field, value) {
    try {
        const body = {};
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
    const arr = parseJsonbField(dossierData[field]);
    arr.splice(index, 1);
    await saveDossierField(field, arr);
    // Re-render current tab
    const activeTab = document.querySelector('.dossier-tab.active');
    if (activeTab) switchDossierTab(activeTab.dataset.tab);
}

async function refreshDossier() {
    try {
        const res = await AdminAPI.get('/api/admin/members/' + dossierMemberId + '/dossier');
        if (res.success) dossierData = res.data;
    } catch (_) {}
}
