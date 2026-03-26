/* 배너 광고 관리 */

async function renderBannerManagement(container) {
    container.innerHTML = '<div class="page-toolbar"><h2 class="page-title">배너 광고 관리</h2><button class="btn btn-primary btn-sm" onclick="showBannerForm()">+ 새 배너</button></div><div id="banner-list"></div>';
    await loadBannerList();
}

async function loadBannerList() {
    var wrap = document.getElementById('banner-list');
    if (!wrap) return;
    try {
        var res = await AdminAPI.get('/api/admin/banners');
        var banners = res.data || [];
        if (banners.length === 0) {
            wrap.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF">등록된 배너가 없습니다.<br>회원 사업장 배너를 등록해보세요.</div>';
            return;
        }
        wrap.innerHTML = '<table class="data-table"><thead><tr><th>이미지</th><th>제목</th><th>설명</th><th>상태</th><th>순서</th><th>관리</th></tr></thead><tbody>'
            + banners.map(function(b) {
                return '<tr>'
                    + '<td>' + (b.image_url ? '<img src="' + b.image_url + '" style="width:80px;height:40px;object-fit:cover;border-radius:4px">' : '<span style="color:#9CA3AF">없음</span>') + '</td>'
                    + '<td><strong>' + escapeHtml(b.title) + '</strong></td>'
                    + '<td>' + escapeHtml(b.description || '-') + '</td>'
                    + '<td>' + (b.is_active ? '<span class="badge badge-active">활성</span>' : '<span class="badge badge-inactive">비활성</span>') + '</td>'
                    + '<td>' + (b.order_index || 0) + '</td>'
                    + '<td style="display:flex;gap:4px">'
                    + '<button class="btn btn-ghost btn-sm" onclick="showBannerImageUpload(' + b.id + ')">이미지</button>'
                    + '<button class="btn btn-ghost btn-sm" onclick="toggleBannerActive(' + b.id + ',' + !b.is_active + ')">' + (b.is_active ? '비활성' : '활성') + '</button>'
                    + '<button class="btn btn-danger btn-sm" onclick="deleteBanner(' + b.id + ')">삭제</button>'
                    + '</td></tr>';
            }).join('')
            + '</tbody></table>';
    } catch (err) {
        wrap.innerHTML = '<div style="color:#DC2626;padding:16px">배너 목록 로드 실패: ' + err.message + '</div>';
    }
}

function showBannerForm() {
    var wrap = document.getElementById('banner-list');
    if (!wrap) return;
    var formHtml = '<div style="padding:20px;border:1px solid #E5E7EB;border-radius:12px;margin-bottom:16px;background:#fff">'
        + '<h3 style="margin:0 0 16px;font-size:16px">새 배너 등록</h3>'
        + '<div style="display:flex;flex-direction:column;gap:10px">'
        + '<input type="text" id="banner-title" placeholder="배너 제목 (예: 김영등 회원 - 프리미엄식품)" style="padding:10px;border:1px solid #E5E7EB;border-radius:8px">'
        + '<input type="text" id="banner-desc" placeholder="한 줄 설명 (선택)" style="padding:10px;border:1px solid #E5E7EB;border-radius:8px">'
        + '<input type="url" id="banner-link" placeholder="링크 URL (선택, 클릭 시 이동)" style="padding:10px;border:1px solid #E5E7EB;border-radius:8px">'
        + '<input type="number" id="banner-order" placeholder="순서 (0이 가장 먼저)" value="0" style="padding:10px;border:1px solid #E5E7EB;border-radius:8px;width:100px">'
        + '<div style="display:flex;gap:8px">'
        + '<button class="btn btn-primary btn-sm" onclick="submitBannerForm()">등록</button>'
        + '<button class="btn btn-ghost btn-sm" onclick="loadBannerList()">취소</button>'
        + '</div></div></div>';
    wrap.innerHTML = formHtml;
}

async function submitBannerForm() {
    var title = (document.getElementById('banner-title') || {}).value;
    if (!title) { showAdminToast('제목을 입력하세요.', 'error'); return; }
    try {
        var res = await AdminAPI.post('/api/admin/banners', {
            title: title,
            description: (document.getElementById('banner-desc') || {}).value || null,
            link_url: (document.getElementById('banner-link') || {}).value || null,
            order_index: parseInt((document.getElementById('banner-order') || {}).value) || 0
        });
        if (res.success) {
            showAdminToast('배너가 등록되었습니다. 이미지를 업로드하세요.');
            await loadBannerList();
        } else {
            showAdminToast(res.message || '등록 실패', 'error');
        }
    } catch (err) {
        showAdminToast('배너 등록 실패: ' + err.message, 'error');
    }
}

function showBannerImageUpload(bannerId) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function() {
        if (!input.files[0]) return;
        var formData = new FormData();
        formData.append('image', input.files[0]);
        try {
            var token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');
            var res = await fetch('/api/admin/banners/' + bannerId + '/image', {
                method: 'PUT',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData
            });
            var data = await res.json();
            if (data.success) {
                showAdminToast('배너 이미지가 업로드되었습니다.');
                await loadBannerList();
            } else {
                showAdminToast(data.message || '업로드 실패', 'error');
            }
        } catch (err) {
            showAdminToast('이미지 업로드 실패: ' + err.message, 'error');
        }
    };
    input.click();
}

async function toggleBannerActive(bannerId, active) {
    try {
        await AdminAPI.put('/api/admin/banners/' + bannerId, { is_active: active });
        showAdminToast(active ? '배너가 활성화되었습니다.' : '배너가 비활성화되었습니다.');
        await loadBannerList();
    } catch (err) {
        showAdminToast('상태 변경 실패: ' + err.message, 'error');
    }
}

async function deleteBanner(bannerId) {
    if (!confirm('이 배너를 삭제하시겠습니까?')) return;
    try {
        await AdminAPI.delete('/api/admin/banners/' + bannerId);
        showAdminToast('배너가 삭제되었습니다.');
        await loadBannerList();
    } catch (err) {
        showAdminToast('삭제 실패: ' + err.message, 'error');
    }
}
