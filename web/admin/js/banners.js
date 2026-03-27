/* ================================================
   배너 광고 관리
   ================================================ */

async function renderBanners(container) {
    container.innerHTML = `
        <div class="page-header">
            <h2>배너 광고 관리</h2>
            <button class="btn btn-primary" onclick="openBannerForm()">+ 새 배너</button>
        </div>
        <div class="card">
            <div id="banners-table-wrap">
                <div class="table-empty"><p>로딩 중...</p></div>
            </div>
        </div>
    `;
    await loadBannersTable();
}

async function loadBannersTable() {
    const wrap = document.getElementById('banners-table-wrap');
    if (!wrap) return;

    try {
        const res = await AdminAPI.get('/api/banners/admin');
        const banners = (res.data && res.data.banners) || [];

        if (banners.length === 0) {
            wrap.innerHTML = '<div class="table-empty"><p>등록된 배너가 없습니다.</p></div>';
            return;
        }

        wrap.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:50px">순서</th>
                        <th style="width:80px">이미지</th>
                        <th>제목</th>
                        <th style="width:100px">상태</th>
                        <th style="width:120px">생성일</th>
                        <th style="width:200px">액션</th>
                    </tr>
                </thead>
                <tbody id="banners-tbody">
                    ${banners.map((b, idx) => renderBannerRow(b, idx, banners.length)).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        wrap.innerHTML = `<div class="table-empty"><p>배너 목록을 불러올 수 없습니다.</p></div>`;
        console.error('Load banners error:', err);
    }
}

function renderBannerRow(b, idx, total) {
    const statusClass = b.is_active ? 'badge-success' : 'badge-muted';
    const statusText = b.is_active ? '활성' : '비활성';
    const createdAt = b.created_at ? new Date(b.created_at).toLocaleDateString('ko-KR') : '-';
    const imgThumb = b.image_url
        ? `<img src="${b.image_url}" alt="" style="width:60px;height:36px;object-fit:cover;border-radius:4px">`
        : '<span style="color:#9CA3AF;font-size:12px">없음</span>';

    return `
        <tr data-id="${b.id}">
            <td>
                <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
                    ${idx > 0 ? `<button class="btn-icon-sm" onclick="moveBanner(${b.id}, 'up')" title="위로">&#9650;</button>` : '<span style="width:20px"></span>'}
                    <span>${b.sort_order}</span>
                    ${idx < total - 1 ? `<button class="btn-icon-sm" onclick="moveBanner(${b.id}, 'down')" title="아래로">&#9660;</button>` : '<span style="width:20px"></span>'}
                </div>
            </td>
            <td>${imgThumb}</td>
            <td>
                <strong>${escapeAdminHtml(b.title)}</strong>
                ${b.description ? `<div style="font-size:12px;color:#6B7280;margin-top:2px">${escapeAdminHtml(b.description)}</div>` : ''}
                ${b.link_url ? `<div style="font-size:11px;color:#3B82F6;margin-top:2px">${escapeAdminHtml(b.link_url)}</div>` : ''}
            </td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>${createdAt}</td>
            <td>
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                    <button class="btn btn-sm btn-outline" onclick="openBannerForm(${b.id})">수정</button>
                    <button class="btn btn-sm btn-outline" onclick="uploadBannerImage(${b.id})">이미지</button>
                    <button class="btn btn-sm ${b.is_active ? 'btn-warning' : 'btn-success'}" onclick="toggleBanner(${b.id})">${b.is_active ? '비활성' : '활성'}</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBanner(${b.id}, '${escapeAdminHtml(b.title)}')">삭제</button>
                </div>
            </td>
        </tr>
    `;
}

function escapeAdminHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ---- 배너 등록/수정 모달 ----

async function openBannerForm(bannerId) {
    let banner = null;
    if (bannerId) {
        try {
            const res = await AdminAPI.get('/api/banners/admin');
            const banners = (res.data && res.data.banners) || [];
            banner = banners.find(b => b.id === bannerId);
        } catch (e) {
            showAdminToast('배너 정보를 불러올 수 없습니다.', 'error');
            return;
        }
    }

    const isEdit = !!banner;
    const title = isEdit ? escapeAdminHtml(banner.title) : '';
    const description = isEdit ? escapeAdminHtml(banner.description || '') : '';
    const linkUrl = isEdit ? escapeAdminHtml(banner.link_url || '') : '';
    const sortOrder = isEdit ? banner.sort_order : 0;

    openModal(`
        <div class="modal-card" style="max-width:500px;width:100%">
            <div class="modal-header">
                <h3>${isEdit ? '배너 수정' : '새 배너 등록'}</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <form id="banner-form" onsubmit="saveBanner(event, ${bannerId || 'null'})">
                <div class="modal-body">
                    <div class="form-field">
                        <label for="banner-title">제목 <span style="color:#DC2626">*</span></label>
                        <input type="text" id="banner-title" value="${title}" placeholder="배너 제목" required maxlength="200">
                    </div>
                    <div class="form-field">
                        <label for="banner-desc">설명</label>
                        <textarea id="banner-desc" placeholder="배너 설명 (선택)" rows="3">${description}</textarea>
                    </div>
                    <div class="form-field">
                        <label for="banner-link">링크 URL</label>
                        <input type="url" id="banner-link" value="${linkUrl}" placeholder="https://...">
                    </div>
                    ${isEdit ? `
                    <div class="form-field">
                        <label for="banner-sort">순서</label>
                        <input type="number" id="banner-sort" value="${sortOrder}" min="0">
                    </div>` : ''}
                    <div id="banner-form-error" style="color:#DC2626;font-size:13px;margin-top:4px"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">취소</button>
                    <button type="submit" class="btn btn-primary" id="banner-save-btn">${isEdit ? '수정' : '등록'}</button>
                </div>
            </form>
        </div>
    `);
}

async function saveBanner(e, bannerId) {
    e.preventDefault();
    const btn = document.getElementById('banner-save-btn');
    const errEl = document.getElementById('banner-form-error');
    btn.disabled = true;
    errEl.textContent = '';

    const title = document.getElementById('banner-title').value.trim();
    const description = document.getElementById('banner-desc').value.trim();
    const link_url = document.getElementById('banner-link').value.trim();

    if (!title) {
        errEl.textContent = '제목을 입력하세요.';
        btn.disabled = false;
        return;
    }

    try {
        if (bannerId) {
            const sortEl = document.getElementById('banner-sort');
            const sort_order = sortEl ? parseInt(sortEl.value, 10) || 0 : 0;
            await AdminAPI.put(`/api/banners/admin/${bannerId}`, { title, description, link_url, sort_order });
            showAdminToast('배너가 수정되었습니다.');
        } else {
            await AdminAPI.post('/api/banners/admin', { title, description, link_url });
            showAdminToast('배너가 등록되었습니다.');
        }
        closeModal();
        await loadBannersTable();
    } catch (err) {
        errEl.textContent = err.message || '저장 중 오류가 발생했습니다.';
    } finally {
        btn.disabled = false;
    }
}

// ---- 이미지 업로드 ----

function uploadBannerImage(bannerId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showAdminToast('파일 크기는 5MB 이하여야 합니다.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            showAdminToast('이미지 업로드 중...', 'info');
            const token = AdminAPI.getToken();
            const res = await fetch(`/api/banners/admin/${bannerId}/image`, {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                showAdminToast('이미지가 업로드되었습니다.');
                await loadBannersTable();
            } else {
                showAdminToast(data.error || '업로드 실패', 'error');
            }
        } catch (err) {
            showAdminToast('이미지 업로드 중 오류가 발생했습니다.', 'error');
        }
    };
    input.click();
}

// ---- 활성/비활성 토글 ----

async function toggleBanner(bannerId) {
    try {
        const token = AdminAPI.getToken();
        const res = await fetch(`/api/banners/admin/${bannerId}/toggle`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });
        const data = await res.json();
        if (data.success) {
            const newState = data.data.banner.is_active ? '활성' : '비활성';
            showAdminToast(`배너가 ${newState} 상태로 변경되었습니다.`);
            await loadBannersTable();
        } else {
            showAdminToast(data.error || '상태 변경 실패', 'error');
        }
    } catch (err) {
        showAdminToast('상태 변경 중 오류가 발생했습니다.', 'error');
    }
}

// ---- 삭제 ----

async function deleteBanner(bannerId, title) {
    if (!confirm(`"${title}" 배너를 삭제하시겠습니까?`)) return;

    try {
        await AdminAPI.delete(`/api/banners/admin/${bannerId}`);
        showAdminToast('배너가 삭제되었습니다.');
        await loadBannersTable();
    } catch (err) {
        showAdminToast('삭제 중 오류가 발생했습니다.', 'error');
    }
}

// ---- 순서 이동 ----

async function moveBanner(bannerId, direction) {
    try {
        const res = await AdminAPI.get('/api/banners/admin');
        const banners = (res.data && res.data.banners) || [];
        const idx = banners.findIndex(b => b.id === bannerId);
        if (idx < 0) return;

        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= banners.length) return;

        // 두 배너의 sort_order 교환
        const orders = [
            { id: banners[idx].id, sort_order: banners[swapIdx].sort_order },
            { id: banners[swapIdx].id, sort_order: banners[idx].sort_order }
        ];

        const token = AdminAPI.getToken();
        const reorderRes = await fetch('/api/banners/admin/reorder', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ orders })
        });
        const data = await reorderRes.json();
        if (data.success) {
            await loadBannersTable();
        } else {
            showAdminToast(data.error || '순서 변경 실패', 'error');
        }
    } catch (err) {
        showAdminToast('순서 변경 중 오류가 발생했습니다.', 'error');
    }
}
