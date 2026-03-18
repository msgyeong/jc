// 콘텐츠 관리 (조직도, JC 비전·목표, 직책 업무, JC 지도, 정관)

// 화면 이름 → content_type 매핑
var CONTENT_TYPE_MAP = {
    'jc-vision': 'vision',
    'jc-roles': 'roles',
    'jc-charter': 'charter'
};

// 화면 이름 → 제목 매핑
var CONTENT_TITLE_MAP = {
    'jc-vision': 'JC 비전·목표',
    'jc-roles': '직책 업무',
    'jc-charter': '정관'
};

/**
 * 콘텐츠 화면 로드
 */
async function loadContentScreen(screenName) {
    var contentType = CONTENT_TYPE_MAP[screenName];
    var pageTitle = CONTENT_TITLE_MAP[screenName] || screenName;

    if (!contentType) {
        console.error('알 수 없는 콘텐츠 화면:', screenName);
        return;
    }

    // 동적 화면 컨테이너 확보
    var screen = document.getElementById('content-screen');
    if (!screen) {
        screen = document.createElement('div');
        screen.id = 'content-screen';
        screen.className = 'screen';
        document.getElementById('app').appendChild(screen);
    }

    // 모든 화면 숨기기 + 이 화면 표시
    document.querySelectorAll('.screen').forEach(function(s) {
        s.classList.remove('active');
    });
    screen.classList.add('active');

    // 로딩 상태
    screen.innerHTML =
        '<div class="app-bar">' +
            '<button class="back-btn" onclick="goBackFromContent()" aria-label="뒤로가기">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>' +
            '</button>' +
            '<h1 class="app-bar-title">' + escapeHtml(pageTitle) + '</h1>' +
            '<div style="width:40px"></div>' +
        '</div>' +
        '<div class="screen-content" style="padding:16px;padding-top:72px;">' +
            '<div class="loading-container" style="text-align:center;padding:40px 0;">' +
                '<div class="loading-spinner"></div>' +
                '<p style="color:#6B7280;margin-top:12px;">불러오는 중...</p>' +
            '</div>' +
        '</div>';

    // history
    if (!window._navPopstate) {
        history.pushState({ screen: screenName }, '', '#' + screenName);
    }

    // 사용자 정보
    var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    var isAdmin = user && ['admin', 'super_admin', 'local_admin'].includes(user.role);

    try {
        var token = localStorage.getItem('auth_token');
        var baseURL = window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api'
            : '/api';

        var resp = await fetch(baseURL + '/content/' + contentType, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        var json = await resp.json();

        if (!resp.ok) {
            throw new Error(json.message || '콘텐츠 로드 실패');
        }

        var data = json.data; // null if no content yet

        renderContentView(screen, screenName, contentType, pageTitle, data, isAdmin);
    } catch (error) {
        console.error('콘텐츠 로드 오류:', error);
        var contentArea = screen.querySelector('.screen-content');
        if (contentArea) {
            contentArea.innerHTML =
                '<div class="empty-state" style="text-align:center;padding:60px 20px;">' +
                    '<p style="color:#6B7280;font-size:14px;">콘텐츠를 불러올 수 없습니다.</p>' +
                    '<p style="color:#9CA3AF;font-size:12px;margin-top:4px;">' + escapeHtml(error.message) + '</p>' +
                    (isAdmin ? '<button class="btn btn-primary" style="margin-top:16px;" onclick="openContentEditor(\'' + screenName + '\', null)">콘텐츠 등록</button>' : '') +
                '</div>';
        }
    }
}

/**
 * 콘텐츠 뷰 렌더링
 */
function renderContentView(screen, screenName, contentType, pageTitle, data, isAdmin) {
    var contentArea = screen.querySelector('.screen-content');
    if (!contentArea) return;

    var html = '';

    // 관리자 편집 버튼
    if (isAdmin) {
        html += '<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">' +
            '<button class="btn btn-outline" style="font-size:13px;padding:6px 14px;" onclick="openContentEditor(\'' + screenName + '\', ' + (data ? 'true' : 'null') + ')">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;vertical-align:middle;">' +
                    '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
                    '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
                '</svg>' +
                (data ? '편집' : '등록') +
            '</button>' +
        '</div>';
    }

    if (!data) {
        // 콘텐츠 없음
        html += '<div class="empty-state" style="text-align:center;padding:60px 20px;">' +
            '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5" style="margin-bottom:12px;">' +
                '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
                '<polyline points="14 2 14 8 20 8"/>' +
            '</svg>' +
            '<p style="color:#6B7280;font-size:14px;">등록된 콘텐츠가 없습니다.</p>' +
        '</div>';
    } else {
        // 제목
        if (data.title) {
            html += '<h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:16px;">' + escapeHtml(data.title) + '</h2>';
        }

        // 이미지
        if (data.has_image) {
            var baseURL = window.location.hostname === 'localhost'
                ? 'http://localhost:3000/api'
                : '/api';
            html += '<div style="margin-bottom:16px;border-radius:12px;overflow:hidden;background:#F3F4F6;">' +
                '<img src="' + baseURL + '/content/' + contentType + '/image?t=' + Date.now() + '" ' +
                    'alt="' + escapeHtml(pageTitle) + '" ' +
                    'style="width:100%;display:block;cursor:pointer;" ' +
                    'onclick="openContentImageFullscreen(this.src)" ' +
                    'onerror="this.parentElement.style.display=\'none\'">' +
            '</div>';
        }

        // 본문
        if (data.body) {
            html += '<div class="content-body" style="font-size:14px;line-height:1.8;color:#374151;white-space:pre-wrap;word-break:break-word;">' +
                escapeHtml(data.body) +
            '</div>';
        }

        // 첨부파일
        if (data.has_file && data.file_name) {
            var baseURL2 = window.location.hostname === 'localhost'
                ? 'http://localhost:3000/api'
                : '/api';
            html += '<div style="margin-top:16px;padding:12px;background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;">' +
                '<a href="' + baseURL2 + '/content/' + contentType + '/file" ' +
                    'style="display:flex;align-items:center;gap:8px;color:#1F4FD8;text-decoration:none;font-size:13px;" download>' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
                        '<polyline points="7 10 12 15 17 10"/>' +
                        '<line x1="12" y1="15" x2="12" y2="3"/>' +
                    '</svg>' +
                    escapeHtml(data.file_name) +
                '</a>' +
            '</div>';
        }

        // 최종 수정일
        if (data.updated_at) {
            var dateStr = new Date(data.updated_at).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            html += '<p style="margin-top:20px;font-size:12px;color:#9CA3AF;text-align:right;">최종 수정: ' + dateStr + '</p>';
        }
    }

    contentArea.innerHTML = html;
}

/**
 * 콘텐츠 이미지 풀스크린 뷰어
 */
function openContentImageFullscreen(src) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
    overlay.onclick = function() { document.body.removeChild(overlay); };

    var img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width:95%;max-height:95%;object-fit:contain;';
    overlay.appendChild(img);

    // 닫기 버튼
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;top:16px;right:16px;background:none;border:none;color:#fff;font-size:32px;cursor:pointer;';
    closeBtn.onclick = function(e) { e.stopPropagation(); document.body.removeChild(overlay); };
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);
}

/**
 * 콘텐츠 편집 모드 열기
 */
function openContentEditor(screenName, hasExisting) {
    var contentType = CONTENT_TYPE_MAP[screenName];
    var pageTitle = CONTENT_TITLE_MAP[screenName] || screenName;

    var screen = document.getElementById('content-screen');
    if (!screen) return;

    var contentArea = screen.querySelector('.screen-content');
    if (!contentArea) return;

    // 기존 데이터 가져오기 위해 API 호출
    var token = localStorage.getItem('auth_token');
    var baseURL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : '/api';

    fetch(baseURL + '/content/' + contentType, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(r) { return r.json(); })
    .then(function(json) {
        var data = json.data || {};
        renderContentEditor(contentArea, screenName, contentType, pageTitle, data);
    })
    .catch(function() {
        renderContentEditor(contentArea, screenName, contentType, pageTitle, {});
    });
}

/**
 * 콘텐츠 편집 폼 렌더링
 */
function renderContentEditor(container, screenName, contentType, pageTitle, data) {
    var html =
        '<div style="margin-bottom:20px;">' +
            '<h3 style="font-size:16px;font-weight:600;color:#111827;margin-bottom:16px;">' + escapeHtml(pageTitle) + ' 편집</h3>' +
        '</div>' +

        // 제목 입력
        '<div class="form-group" style="margin-bottom:16px;">' +
            '<label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">제목</label>' +
            '<input type="text" id="content-edit-title" class="form-input" ' +
                'placeholder="제목을 입력하세요" ' +
                'value="' + escapeHtml(data.title || '') + '" ' +
                'style="width:100%;padding:10px 12px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;">' +
        '</div>' +

        // 본문 입력
        '<div class="form-group" style="margin-bottom:16px;">' +
            '<label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">내용</label>' +
            '<textarea id="content-edit-body" class="form-input" ' +
                'placeholder="내용을 입력하세요" rows="10" ' +
                'style="width:100%;padding:10px 12px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;resize:vertical;line-height:1.6;">' +
                escapeHtml(data.body || '') +
            '</textarea>' +
        '</div>' +

        // 이미지 업로드
        '<div class="form-group" style="margin-bottom:16px;">' +
            '<label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">이미지</label>' +
            (data.has_image
                ? '<div id="content-current-image" style="margin-bottom:8px;position:relative;display:inline-block;">' +
                    '<img src="' + (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api') + '/content/' + contentType + '/image?t=' + Date.now() + '" ' +
                        'style="max-width:200px;border-radius:8px;border:1px solid #E5E7EB;" ' +
                        'onerror="this.parentElement.style.display=\'none\'">' +
                    '<button onclick="removeContentImage(\'' + contentType + '\')" ' +
                        'style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);border:none;color:#fff;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:14px;">x</button>' +
                  '</div>'
                : '') +
            '<input type="file" id="content-edit-image" accept="image/*" ' +
                'style="display:block;font-size:13px;color:#6B7280;">' +
            '<p style="font-size:11px;color:#9CA3AF;margin-top:4px;">최대 10MB (JPG, PNG, GIF, WebP)</p>' +
        '</div>' +

        // 파일 업로드
        '<div class="form-group" style="margin-bottom:24px;">' +
            '<label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">첨부파일</label>' +
            (data.has_file && data.file_name
                ? '<p style="font-size:12px;color:#6B7280;margin-bottom:6px;">현재 파일: ' + escapeHtml(data.file_name) + '</p>'
                : '') +
            '<input type="file" id="content-edit-file" ' +
                'style="display:block;font-size:13px;color:#6B7280;">' +
            '<p style="font-size:11px;color:#9CA3AF;margin-top:4px;">최대 10MB (PDF, HWP, DOCX 등)</p>' +
        '</div>' +

        // 저장/취소 버튼
        '<div style="display:flex;gap:8px;">' +
            '<button class="btn btn-primary" style="flex:1;height:48px;border-radius:8px;font-size:15px;font-weight:600;" ' +
                'onclick="saveContent(\'' + screenName + '\',\'' + contentType + '\')" id="content-save-btn">저장</button>' +
            '<button class="btn btn-outline" style="flex:1;height:48px;border-radius:8px;font-size:15px;" ' +
                'onclick="loadContentScreen(\'' + screenName + '\')">취소</button>' +
        '</div>';

    container.innerHTML = html;
}

/**
 * 콘텐츠 저장
 */
async function saveContent(screenName, contentType) {
    var title = document.getElementById('content-edit-title').value.trim();
    var body = document.getElementById('content-edit-body').value.trim();
    var imageInput = document.getElementById('content-edit-image');
    var fileInput = document.getElementById('content-edit-file');
    var saveBtn = document.getElementById('content-save-btn');

    var token = localStorage.getItem('auth_token');
    var baseURL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : '/api';

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = '저장 중...';
    }

    try {
        // 1) 텍스트 저장 (title + body)
        var resp = await fetch(baseURL + '/content/' + contentType, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ title: title, body: body })
        });
        var json = await resp.json();
        if (!resp.ok) throw new Error(json.message || '저장 실패');

        // 2) 이미지/파일 업로드 (있는 경우)
        var hasImage = imageInput && imageInput.files && imageInput.files.length > 0;
        var hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

        if (hasImage || hasFile) {
            var formData = new FormData();
            if (hasImage) {
                formData.append('image', imageInput.files[0]);
            }
            if (hasFile) {
                formData.append('file', fileInput.files[0]);
            }

            var uploadResp = await fetch(baseURL + '/content/' + contentType + '/upload', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });
            var uploadJson = await uploadResp.json();
            if (!uploadResp.ok) throw new Error(uploadJson.message || '파일 업로드 실패');
        }

        // 완료 — 다시 보기 모드로
        loadContentScreen(screenName);
    } catch (error) {
        console.error('콘텐츠 저장 오류:', error);
        alert(error.message || '저장 중 오류가 발생했습니다.');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '저장';
        }
    }
}

/**
 * 콘텐츠 이미지 삭제
 */
async function removeContentImage(contentType) {
    if (!confirm('이미지를 삭제하시겠습니까?')) return;

    var token = localStorage.getItem('auth_token');
    var baseURL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : '/api';

    try {
        var resp = await fetch(baseURL + '/content/' + contentType + '/image', {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (resp.ok) {
            var el = document.getElementById('content-current-image');
            if (el) el.style.display = 'none';
        }
    } catch (e) {
        console.error('이미지 삭제 오류:', e);
    }
}

/**
 * 콘텐츠 화면에서 뒤로가기
 */
function goBackFromContent() {
    // 홈 화면으로 이동
    if (typeof switchTab === 'function') {
        switchTab('home');
    } else {
        navigateToScreen('home');
    }
}
