// 그룹 게시판 (조직도 그룹별 전용 게시판)

var _currentGroupBoardId = null;
var _currentGroupBoardName = '';
var _groupBoardPage = 1;
var _groupBoardLoading = false;
var _editingGroupPostId = null;
var _currentGBTab = 'posts';

// ========== 그룹 게시판 메인 ==========

function openGroupBoard(groupId, groupName) {
    _currentGroupBoardId = groupId;
    _currentGroupBoardName = groupName;
    _groupBoardPage = 1;
    _currentGBTab = 'posts';

    var titleEl = document.getElementById('group-board-title');
    if (titleEl) titleEl.textContent = groupName;

    navigateToScreen('group-board');
}

async function loadGroupBoardScreen() {
    if (!_currentGroupBoardId) return;
    var container = document.getElementById('group-board-content');
    if (!container) return;

    // 타이틀 갱신
    var titleEl = document.getElementById('group-board-title');
    if (titleEl) titleEl.textContent = _currentGroupBoardName || '그룹 게시판';

    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
        var res = await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts?page=1&limit=20');
        _groupBoardPage = 1;
        var posts = (res && res.posts) || [];
        var html = '';

        // 탭 바
        html += '<div class="gb-tab-bar">';
        html += '<button class="gb-tab-item' + (_currentGBTab === 'posts' ? ' active' : '') + '" onclick="switchGroupBoardTab(\'posts\', this)">게시글</button>';
        html += '<button class="gb-tab-item' + (_currentGBTab === 'schedules' ? ' active' : '') + '" onclick="switchGroupBoardTab(\'schedules\', this)">일정</button>';
        html += '</div>';

        // 게시글 섹션
        html += '<div id="gb-posts-section"' + (_currentGBTab !== 'posts' ? ' style="display:none"' : '') + '>';
        if (posts.length === 0) {
            html += '<div class="gb-empty-state">';
            html += '<div class="gb-empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="13" y2="13"/></svg></div>';
            html += '<p class="gb-empty-text">아직 게시글이 없습니다</p>';
            html += '<p class="gb-empty-sub">첫 번째 게시글을 작성해보세요</p>';
            html += '</div>';
        } else {
            posts.forEach(function(p) {
                html += renderGroupPostCard(p);
            });
            if (res.totalPages > 1) {
                html += '<button class="gb-load-more" onclick="loadMoreGroupPosts()">더 보기</button>';
            }
        }
        html += '</div>';

        // 일정 섹션
        html += '<div id="gb-schedules-section"' + (_currentGBTab !== 'schedules' ? ' style="display:none"' : '') + '></div>';

        container.innerHTML = html;

        // FAB 표시 및 연결
        updateGroupBoardFAB();

        // 일정 탭 활성 상태면 일정 로드
        if (_currentGBTab === 'schedules') {
            loadGroupSchedules();
        }
    } catch (err) {
        console.error('Group board load error:', err);
        container.innerHTML = '<div class="gb-empty-state"><div class="gb-empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="#D1D5DB"/></svg></div><p class="gb-empty-text">게시글을 불러올 수 없습니다</p><button class="gb-retry-btn" onclick="loadGroupBoardScreen()">다시 시도</button></div>';
    }
}

function updateGroupBoardFAB() {
    var fab = document.getElementById('create-group-post-btn');
    if (!fab) return;
    fab.style.display = '';
    if (_currentGBTab === 'schedules') {
        fab.onclick = function() { showGroupScheduleForm(); };
    } else {
        fab.onclick = function() { showGroupPostForm(); };
    }
}

function renderGroupPostCard(p) {
    var date = formatRelativeDate(p.created_at);
    var isNew = isWithin3Days(p.created_at) && !p.is_read;
    var pinned = p.is_pinned ? '<span class="gb-pin-badge">고정</span>' : '';
    var newBadge = isNew ? '<span class="gb-new-badge">N</span>' : '';

    return '<div class="gb-post-card" onclick="openGroupPostDetail(' + p.id + ')">'
        + '<div class="gb-post-header">'
        + (p.author_image ? '<img src="' + escapeHtml(p.author_image) + '" class="gb-post-avatar" alt="">' : '<div class="gb-post-avatar gb-post-avatar-default"></div>')
        + '<div class="gb-post-meta">'
        + '<span class="gb-post-author">' + escapeHtml(p.author_name || '알 수 없음') + '</span>'
        + '<span class="gb-post-date">' + date + '</span>'
        + '</div>'
        + pinned + newBadge
        + '</div>'
        + '<h3 class="gb-post-title">' + escapeHtml(p.title) + '</h3>'
        + (p.content ? '<p class="gb-post-excerpt">' + escapeHtml((p.content || '').substring(0, 100)) + '</p>' : '')
        + '<div class="gb-post-stats">'
        + '<span>조회 ' + (p.views || 0) + '</span>'
        + '<span>댓글 ' + (p.comments_count || 0) + '</span>'
        + '</div>'
        + '</div>';
}

function isWithin3Days(dateStr) {
    if (!dateStr) return false;
    var d = new Date(dateStr);
    var now = new Date();
    return (now - d) < 3 * 24 * 60 * 60 * 1000;
}

function formatRelativeDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var now = new Date();
    var diffMs = now - d;
    var diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return diffMin + '분 전';
    var diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return diffHr + '시간 전';
    var diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return diffDay + '일 전';
    return (d.getMonth() + 1) + '/' + d.getDate();
}

async function loadMoreGroupPosts() {
    if (_groupBoardLoading) return;
    _groupBoardLoading = true;
    _groupBoardPage++;
    try {
        var res = await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts?page=' + _groupBoardPage + '&limit=20');
        var posts = res.posts || [];
        var section = document.getElementById('gb-posts-section');
        if (!section) return;
        // Remove "더 보기" button
        var moreBtn = section.querySelector('.gb-load-more');
        if (moreBtn) moreBtn.remove();
        // Append new posts
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = posts.map(function(p) { return renderGroupPostCard(p); }).join('');
        while (tempDiv.firstChild) section.appendChild(tempDiv.firstChild);
        if (res.totalPages > _groupBoardPage) {
            section.insertAdjacentHTML('beforeend', '<button class="gb-load-more" onclick="loadMoreGroupPosts()">더 보기</button>');
        }
    } catch (_) {} finally { _groupBoardLoading = false; }
}

// ========== 탭 전환 (게시글/일정) ==========

function switchGroupBoardTab(tab, btnEl) {
    _currentGBTab = tab;
    document.querySelectorAll('.gb-tab-item').forEach(function(t) { t.classList.remove('active'); });
    if (btnEl) btnEl.classList.add('active');

    var postsSection = document.getElementById('gb-posts-section');
    var schedulesSection = document.getElementById('gb-schedules-section');

    if (tab === 'posts') {
        if (postsSection) postsSection.style.display = '';
        if (schedulesSection) schedulesSection.style.display = 'none';
    } else {
        if (postsSection) postsSection.style.display = 'none';
        if (schedulesSection) { schedulesSection.style.display = ''; loadGroupSchedules(); }
    }
    updateGroupBoardFAB();
}

// ========== 그룹 일정 (게시판 내 탭) ==========

async function loadGroupSchedules() {
    var section = document.getElementById('gb-schedules-section');
    if (!section || !_currentGroupBoardId) return;
    section.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
        var res = await apiClient.request('/group-board/' + _currentGroupBoardId + '/schedules');
        if (!res.success) throw new Error(res.error);
        var schedules = res.schedules || [];

        if (schedules.length === 0) {
            section.innerHTML = '<div class="gb-empty">'
                + '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
                + '<p>등록된 일정이 없습니다</p></div>';
            return;
        }

        section.innerHTML = schedules.map(function(s) {
            return renderGroupScheduleCard(s);
        }).join('');
    } catch (err) {
        section.innerHTML = '<div class="gb-error">' + escapeHtml(err.message) + '</div>';
    }
}

function renderGroupScheduleCard(s) {
    var catLabels = { event: '행사', meeting: '회의', training: '교육', holiday: '휴일', other: '기타' };
    var catColors = { event: '#1E3A5F', meeting: '#F59E0B', training: '#059669', holiday: '#DC2626', other: '#6B7280' };
    var cat = s.category || 'other';
    var color = catColors[cat] || '#6B7280';
    var label = catLabels[cat] || cat;

    var startDate = s.start_date ? new Date(s.start_date) : null;
    var dateStr = startDate ? (startDate.getMonth() + 1) + '/' + startDate.getDate() : '';
    var timeStr = '';
    if (s.start_date && s.start_date.includes('T')) {
        var t = s.start_date.split('T')[1]?.substring(0, 5);
        if (t && t !== '00:00') timeStr = t;
    }

    return '<div class="gb-schedule-card" style="border-left:4px solid ' + color + '">'
        + '<div class="gb-schedule-top">'
        + '<span class="gb-schedule-badge" style="background:' + color + '15;color:' + color + '">' + label + '</span>'
        + '<span class="gb-schedule-date">' + dateStr + (timeStr ? ' ' + timeStr : '') + '</span>'
        + '</div>'
        + '<h4 class="gb-schedule-title">' + escapeHtml(s.title) + '</h4>'
        + (s.location ? '<div class="gb-schedule-loc">' + escapeHtml(s.location) + '</div>' : '')
        + (s.description ? '<p class="gb-schedule-desc">' + escapeHtml((s.description || '').substring(0, 80)) + '</p>' : '')
        + '</div>';
}

// ========== 게시글 상세 ==========

async function openGroupPostDetail(postId) {
    if (!_currentGroupBoardId) return;
    navigateToScreen('group-post-detail');

    var container = document.getElementById('group-post-detail-content');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
        var res = await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId);
        if (!res.success) throw new Error(res.error);
        var post = res.post;
        var comments = res.comments || [];

        var userInfo = getCurrentUserSafe();
        var isAuthor = userInfo && post.author_id === userInfo.id;
        var isAdmin = userInfo && ['admin', 'super_admin'].includes(userInfo.role);

        var html = '<article class="gb-detail">';

        // 헤더
        html += '<div class="gb-detail-header">';
        html += '<div class="gb-detail-author-row">';
        html += (post.author_image ? '<img src="' + escapeHtml(post.author_image) + '" class="gb-detail-avatar" alt="">' : '<div class="gb-detail-avatar gb-post-avatar-default"></div>');
        html += '<div><strong>' + escapeHtml(post.author_name) + '</strong>';
        if (post.author_position) html += '<span class="gb-detail-position"> · ' + escapeHtml(post.author_position) + '</span>';
        html += '<br><span class="gb-detail-date">' + formatFullDate(post.created_at) + '</span></div>';
        html += '</div>';

        if (isAuthor || isAdmin) {
            html += '<div class="gb-detail-actions">';
            html += '<button class="gb-action-btn" onclick="editGroupPost(' + post.id + ')">수정</button>';
            html += '<button class="gb-action-btn gb-action-delete" onclick="deleteGroupPost(' + post.id + ')">삭제</button>';
            html += '</div>';
        }
        html += '</div>';

        // 본문
        html += '<h2 class="gb-detail-title">' + escapeHtml(post.title) + '</h2>';
        if (post.content) {
            html += '<div class="gb-detail-content">' + escapeHtml(post.content).replace(/\n/g, '<br>') + '</div>';
        }

        // 이미지
        if (post.images) {
            try {
                var imgs = JSON.parse(post.images);
                if (Array.isArray(imgs) && imgs.length > 0) {
                    html += '<div class="gb-detail-images">';
                    imgs.forEach(function(imgUrl) {
                        html += '<img src="' + escapeHtml(imgUrl) + '" class="gb-detail-img" alt="" loading="lazy">';
                    });
                    html += '</div>';
                }
            } catch (_) {}
        }

        html += '<div class="gb-detail-stats">조회 ' + (post.views || 0) + ' · 댓글 ' + (post.comments_count || 0) + '</div>';

        // 댓글
        html += '<div class="gb-comments">';
        html += '<h3 class="gb-comments-title">댓글 ' + comments.length + '</h3>';

        var topComments = comments.filter(function(c) { return !c.parent_id; });
        topComments.forEach(function(c) {
            html += renderGroupComment(c, userInfo);
            var replies = comments.filter(function(r) { return r.parent_id === c.id; });
            replies.forEach(function(r) {
                html += renderGroupComment(r, userInfo, true);
            });
        });

        // 댓글 입력
        html += '<div class="gb-comment-input">';
        html += '<textarea id="gb-comment-text" class="gb-comment-textarea" placeholder="댓글을 입력하세요" rows="2"></textarea>';
        html += '<button class="gb-comment-submit" onclick="submitGroupComment(' + post.id + ')">등록</button>';
        html += '</div>';

        html += '</div></article>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<div class="gb-error">' + escapeHtml(err.message) + '</div>';
    }
}

function renderGroupComment(c, userInfo, isReply) {
    var isAuthor = userInfo && c.author_id === userInfo.id;
    var isAdmin = userInfo && ['admin', 'super_admin'].includes(userInfo.role);
    var indent = isReply ? ' gb-comment-reply' : '';

    return '<div class="gb-comment' + indent + '">'
        + '<div class="gb-comment-header">'
        + (c.author_image ? '<img src="' + escapeHtml(c.author_image) + '" class="gb-comment-avatar" alt="">' : '<div class="gb-comment-avatar gb-post-avatar-default"></div>')
        + '<strong>' + escapeHtml(c.author_name) + '</strong>'
        + '<span class="gb-comment-date">' + formatRelativeDate(c.created_at) + '</span>'
        + '</div>'
        + '<p class="gb-comment-body">' + escapeHtml(c.content).replace(/\n/g, '<br>') + '</p>'
        + '<div class="gb-comment-actions">'
        + (!isReply ? '<button class="gb-reply-btn" onclick="showReplyInput(' + c.id + ')">답글</button>' : '')
        + ((isAuthor || isAdmin) ? '<button class="gb-delete-comment-btn" onclick="deleteGroupComment(' + c.post_id + ',' + c.id + ')">삭제</button>' : '')
        + '</div>'
        + '<div id="reply-input-' + c.id + '" class="gb-reply-input-wrap" style="display:none">'
        + '<textarea class="gb-comment-textarea" id="reply-text-' + c.id + '" placeholder="답글 입력" rows="2"></textarea>'
        + '<button class="gb-comment-submit" onclick="submitGroupReply(' + c.post_id + ',' + c.id + ')">등록</button>'
        + '</div>'
        + '</div>';
}

function formatFullDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate() + ' ' +
        String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function showReplyInput(commentId) {
    var el = document.getElementById('reply-input-' + commentId);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
        if (el.style.display === 'block') {
            var textarea = document.getElementById('reply-text-' + commentId);
            if (textarea) textarea.focus();
        }
    }
}

// ========== 댓글 CRUD ==========

async function submitGroupComment(postId) {
    var textarea = document.getElementById('gb-comment-text');
    if (!textarea || !textarea.value.trim()) return;
    try {
        await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId + '/comments', {
            method: 'POST',
            body: JSON.stringify({ content: textarea.value.trim() })
        });
        openGroupPostDetail(postId);
    } catch (err) { console.error('Comment error:', err); }
}

async function submitGroupReply(postId, parentId) {
    var textarea = document.getElementById('reply-text-' + parentId);
    if (!textarea || !textarea.value.trim()) return;
    try {
        await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId + '/comments', {
            method: 'POST',
            body: JSON.stringify({ content: textarea.value.trim(), parent_id: parentId })
        });
        openGroupPostDetail(postId);
    } catch (err) { console.error('Reply error:', err); }
}

async function deleteGroupComment(postId, commentId) {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    try {
        await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId + '/comments/' + commentId, { method: 'DELETE' });
        openGroupPostDetail(postId);
    } catch (err) { console.error('Delete comment error:', err); }
}

// ========== 게시글 작성/수정 ==========

function showGroupPostForm(postId) {
    _editingGroupPostId = postId || null;
    var titleEl = document.getElementById('group-post-form-title');
    if (titleEl) titleEl.textContent = postId ? '게시글 수정' : '게시글 작성';

    var form = document.getElementById('group-post-form');
    if (form) form.reset();

    // 이미지 프리뷰 초기화
    var preview = document.getElementById('gp-image-preview');
    if (preview) preview.innerHTML = '';

    if (postId) {
        loadGroupPostForEdit(postId);
    }

    navigateToScreen('group-post-form');
}

// 이미지 파일 선택 시 프리뷰 표시
document.addEventListener('DOMContentLoaded', function() {
    var gpImages = document.getElementById('gp-images');
    if (gpImages) {
        gpImages.addEventListener('change', function() {
            var preview = document.getElementById('gp-image-preview');
            if (!preview) return;
            preview.innerHTML = '';
            var files = gpImages.files;
            for (var i = 0; i < Math.min(files.length, 5); i++) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    var img = document.createElement('div');
                    img.className = 'gb-preview-thumb';
                    img.style.backgroundImage = 'url(' + e.target.result + ')';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(files[i]);
            }
            // 파일 선택 라벨 업데이트
            var label = document.querySelector('.gb-file-upload span');
            if (label) label.textContent = files.length + '장 선택됨';
        });
    }
});

async function loadGroupPostForEdit(postId) {
    try {
        var res = await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId);
        if (res.success && res.post) {
            document.getElementById('gp-title').value = res.post.title || '';
            document.getElementById('gp-content').value = res.post.content || '';
        }
    } catch (_) {}
}

function editGroupPost(postId) {
    showGroupPostForm(postId);
}

// 폼 submit 핸들러
document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('group-post-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            var title = document.getElementById('gp-title').value.trim();
            var content = document.getElementById('gp-content').value.trim();
            var submitBtn = form.querySelector('button[type="submit"]');
            if (!title) return;

            // 이미지 업로드
            var imagesInput = document.getElementById('gp-images');
            var imageUrls = null;
            if (imagesInput && imagesInput.files.length > 0) {
                imageUrls = await uploadGroupPostImages(imagesInput.files);
            }

            var body = { title: title, content: content };
            if (imageUrls) body.images = JSON.stringify(imageUrls);

            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '등록 중...'; }

            try {
                var url = '/group-board/' + _currentGroupBoardId + '/posts';
                var method = 'POST';
                if (_editingGroupPostId) {
                    url += '/' + _editingGroupPostId;
                    method = 'PUT';
                }
                await apiClient.request(url, { method: method, body: JSON.stringify(body) });
                _editingGroupPostId = null;
                _currentGBTab = 'posts';
                history.back();
            } catch (err) {
                console.error('Post submit error:', err);
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '등록'; }
            }
        });
    }

    // 그룹 일정 폼
    var schedForm = document.getElementById('group-schedule-form');
    if (schedForm) {
        schedForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var title = document.getElementById('gs-title').value.trim();
            var description = document.getElementById('gs-description').value.trim();
            var location = document.getElementById('gs-location').value.trim();
            var startDate = document.getElementById('gs-start-date').value;
            var endDate = document.getElementById('gs-end-date').value;
            var category = document.getElementById('gs-category').value;
            var submitBtn = schedForm.querySelector('button[type="submit"]');

            if (!title || !startDate) return;

            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '등록 중...'; }

            try {
                await apiClient.request('/group-board/' + _currentGroupBoardId + '/schedules', {
                    method: 'POST',
                    body: JSON.stringify({ title: title, description: description, location: location, start_date: startDate, end_date: endDate || null, category: category })
                });
                _currentGBTab = 'schedules';
                history.back();
            } catch (err) {
                console.error('Schedule submit error:', err);
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '등록'; }
            }
        });
    }
});

async function uploadGroupPostImages(files) {
    var urls = [];
    for (var i = 0; i < Math.min(files.length, 5); i++) {
        try {
            var formData = new FormData();
            formData.append('image', files[i]);
            var res = await fetch('/api/upload/image', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
                body: formData
            });
            var data = await res.json();
            if (data.success && data.imageUrl) urls.push(data.imageUrl);
        } catch (_) {}
    }
    return urls.length > 0 ? urls : null;
}

// ========== 게시글 삭제 ==========

async function deleteGroupPost(postId) {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
    try {
        await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId, { method: 'DELETE' });
        history.back();
    } catch (err) { console.error('Delete post error:', err); }
}

// ========== 그룹 일정 폼 ==========

function showGroupScheduleForm() {
    var form = document.getElementById('group-schedule-form');
    if (form) form.reset();
    navigateToScreen('group-schedule-form');
}

function getCurrentUserSafe() {
    try {
        return typeof getCurrentUser === 'function'
            ? getCurrentUser()
            : JSON.parse(localStorage.getItem('user_info') || 'null');
    } catch (_) { return null; }
}

console.log('✅ GroupBoard 모듈 로드 완료');
