// 소모임 (Clubs) — 게시판 + 일정 + 멤버 초대
var _currentClubId = null;
var _currentClubName = '';
var _clubPage = 1;
var _clubLoading = false;
var _editingClubPostId = null;
var _currentClubTab = 'posts';
var _editingClubScheduleId = null;
var _clubInviteSelected = [];

// ========== 소모임 목록 ==========

async function loadClubsScreen() {
    var container = document.getElementById('clubs-content');
    if (!container) return;
    container.innerHTML = '<div class="content-placeholder">로딩 중...</div>';

    try {
        var res = await apiClient.request('/clubs');
        if (!res.success) throw new Error(res.error);

        var clubs = res.clubs || [];
        if (clubs.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>'
                + '<p class="empty-state-text">아직 소모임이 없습니다</p>'
                + '<p class="empty-state-sub">+ 버튼으로 소모임을 만들어보세요</p></div>';
            return;
        }

        // 초대 대기 먼저
        var pending = clubs.filter(function(c) { return c.my_status === 'pending'; });
        var active = clubs.filter(function(c) { return c.my_status === 'accepted'; });
        var html = '';

        if (pending.length > 0) {
            html += '<div class="club-section-title">초대 대기중</div>';
            pending.forEach(function(c) {
                html += renderClubInviteCard(c);
            });
        }

        if (active.length > 0) {
            if (pending.length > 0) html += '<div class="club-section-title" style="margin-top:16px">내 소모임</div>';
            active.forEach(function(c) {
                html += renderClubCard(c);
            });
        }

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<div class="error-state">소모임을 불러올 수 없습니다.</div>';
        console.error('loadClubsScreen error:', err);
    }
}

function renderClubCard(c) {
    var unread = c.unread_count > 0 ? '<span class="club-badge">' + c.unread_count + '</span>' : '';
    return '<div class="club-card" onclick="openClubDetail(' + c.id + ',\'' + escapeHtml(c.name).replace(/'/g, "\\'") + '\')">'
        + '<div class="club-card-header">'
        + '<div class="club-card-name">' + escapeHtml(c.name) + unread + '</div>'
        + '<div class="club-card-meta">' + escapeHtml(c.creator_name) + ' · ' + c.member_count + '명</div>'
        + '</div>'
        + (c.description ? '<div class="club-card-desc">' + escapeHtml(c.description).substring(0, 80) + '</div>' : '')
        + '</div>';
}

function renderClubInviteCard(c) {
    return '<div class="club-card club-card-pending">'
        + '<div class="club-card-header">'
        + '<div class="club-card-name">' + escapeHtml(c.name) + '</div>'
        + '<div class="club-card-meta">' + escapeHtml(c.creator_name) + '님이 초대</div>'
        + '</div>'
        + '<div class="club-invite-actions">'
        + '<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();respondClubInvite(' + c.id + ',\'accept\')">수락</button>'
        + '<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();respondClubInvite(' + c.id + ',\'reject\')">거절</button>'
        + '</div></div>';
}

async function respondClubInvite(clubId, action) {
    try {
        // 먼저 멤버십 ID를 가져와야 함
        var res = await apiClient.request('/clubs/' + clubId);
        if (!res.success) return;
        var myMember = res.members.find(function(m) { return m.user_id === (currentUser && currentUser.id); });
        if (!myMember) return;

        await apiClient.request('/clubs/' + clubId + '/invite/' + myMember.id, {
            method: 'PUT', body: JSON.stringify({ action: action })
        });
        loadClubsScreen();
    } catch (err) {
        console.error('respondClubInvite error:', err);
    }
}

// ========== 소모임 생성 ==========

function showClubCreateForm() {
    navigateToScreen('club-create');
}

function initClubCreateForm() {
    var form = document.getElementById('club-create-form');
    if (!form) return;
    var newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var name = document.getElementById('club-name').value.trim();
        var desc = document.getElementById('club-description').value.trim();
        if (!name) { showToast('소모임 이름을 입력하세요', 'error'); return; }

        var submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            var res = await apiClient.request('/clubs', {
                method: 'POST', body: JSON.stringify({ name: name, description: desc })
            });
            if (res.success) {
                showToast('소모임이 생성되었습니다');
                newForm.reset();
                openClubDetail(res.club.id, res.club.name);
            } else {
                showToast(res.message || '소모임 생성에 실패했습니다', 'error');
            }
        } catch (err) {
            console.error('Club create error:', err);
            showToast(err.message || '소모임 생성 중 오류가 발생했습니다', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// ========== 소모임 상세 ==========

function openClubDetail(clubId, clubName) {
    _currentClubId = clubId;
    _currentClubName = clubName;
    _clubPage = 1;
    _currentClubTab = 'posts';
    var titleEl = document.getElementById('club-detail-title');
    if (titleEl) titleEl.textContent = clubName;
    navigateToScreen('club-detail');
}

async function loadClubDetailScreen() {
    if (!_currentClubId) return;
    var container = document.getElementById('club-detail-content');
    if (!container) return;
    container.innerHTML = '<div class="content-placeholder">로딩 중...</div>';

    // FAB 표시
    var fab = document.getElementById('club-action-btn');
    if (fab) fab.style.display = '';

    try {
        var res = await apiClient.request('/clubs/' + _currentClubId);
        if (!res.success) throw new Error(res.error);

        var club = res.club;
        var members = res.members || [];
        var acceptedMembers = members.filter(function(m) { return m.status === 'accepted'; });
        var myRole = res.my_role;

        // 멤버 아바타 행
        var membersHtml = '<div class="club-members-row">';
        acceptedMembers.slice(0, 8).forEach(function(m) {
            var avatar = m.profile_image
                ? '<img src="' + m.profile_image + '" class="club-member-avatar">'
                : '<div class="club-member-avatar club-member-avatar-default">' + escapeHtml(m.name).charAt(0) + '</div>';
            membersHtml += avatar;
        });
        if (acceptedMembers.length > 8) membersHtml += '<div class="club-member-avatar club-member-more">+' + (acceptedMembers.length - 8) + '</div>';
        membersHtml += '<button class="club-member-add-btn" onclick="openClubInvite()">+</button>';
        membersHtml += '</div>';

        // 관리 버튼 (owner/admin)
        var adminHtml = '';
        if (['owner', 'admin'].includes(myRole)) {
            adminHtml = '<div class="club-admin-row">'
                + '<button class="btn btn-secondary btn-sm" onclick="openClubInvite()">멤버 초대</button>'
                + (myRole === 'owner' ? '<button class="btn btn-secondary btn-sm" onclick="deleteClub()">삭제</button>' : '')
                + '</div>';
        }

        // 탭
        var tabsHtml = '<div class="gb-tabs">'
            + '<button class="gb-tab' + (_currentClubTab === 'posts' ? ' active' : '') + '" onclick="switchClubTab(\'posts\')">게시판</button>'
            + '<button class="gb-tab' + (_currentClubTab === 'schedules' ? ' active' : '') + '" onclick="switchClubTab(\'schedules\')">일정</button>'
            + '<button class="gb-tab' + (_currentClubTab === 'members' ? ' active' : '') + '" onclick="switchClubTab(\'members\')">멤버 ' + acceptedMembers.length + '</button>'
            + '</div>';

        var contentHtml = '<div id="club-tab-content"></div>';

        container.innerHTML = membersHtml + adminHtml + tabsHtml + contentHtml;

        // 탭 컨텐츠 로드
        if (_currentClubTab === 'posts') loadClubPosts();
        else if (_currentClubTab === 'schedules') loadClubSchedules();
        else loadClubMembersList(members);
    } catch (err) {
        container.innerHTML = '<div class="error-state">소모임 정보를 불러올 수 없습니다.</div>';
        console.error('loadClubDetailScreen error:', err);
    }
}

function switchClubTab(tab) {
    _currentClubTab = tab;
    _clubPage = 1;
    document.querySelectorAll('.gb-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.gb-tab').forEach(function(t) {
        if (t.textContent.trim().startsWith(tab === 'posts' ? '게시판' : tab === 'schedules' ? '일정' : '멤버')) t.classList.add('active');
    });

    // FAB 동작 변경
    var fab = document.getElementById('club-action-btn');
    if (fab) {
        fab.onclick = tab === 'schedules' ? function() { showClubScheduleForm(); } : function() { showClubPostForm(); };
        fab.style.display = tab === 'members' ? 'none' : '';
    }

    if (tab === 'posts') loadClubPosts();
    else if (tab === 'schedules') loadClubSchedules();
    else {
        // 멤버 탭은 다시 fetch
        apiClient.request('/clubs/' + _currentClubId).then(function(res) {
            if (res.success) loadClubMembersList(res.members);
        });
    }
}

// ========== 게시글 ==========

async function loadClubPosts() {
    var tc = document.getElementById('club-tab-content');
    if (!tc) return;
    tc.innerHTML = '<div class="content-placeholder">로딩 중...</div>';

    try {
        var res = await apiClient.request('/clubs/' + _currentClubId + '/posts?page=' + _clubPage + '&limit=20');
        if (!res.success) throw new Error(res.error);

        if (!res.posts || res.posts.length === 0) {
            tc.innerHTML = '<div class="empty-state"><p class="empty-state-text">아직 게시글이 없습니다</p></div>';
            return;
        }

        var html = '';
        res.posts.forEach(function(p) { html += renderClubPostCard(p); });

        if (res.page < res.totalPages) {
            html += '<button class="btn btn-secondary btn-load-more" onclick="loadMoreClubPosts()">더 보기</button>';
        }
        tc.innerHTML = html;
    } catch (err) {
        tc.innerHTML = '<div class="error-state">게시글을 불러올 수 없습니다.</div>';
    }
}

function renderClubPostCard(p) {
    var readClass = p.is_read ? '' : ' gb-post-unread';
    var pinIcon = p.is_pinned ? '<span class="gb-pin-icon">📌</span>' : '';
    var dateStr = formatRelativeTime(p.created_at);
    return '<div class="gb-post-card' + readClass + '" onclick="openClubPostDetail(' + p.id + ')">'
        + '<div class="gb-post-title">' + pinIcon + escapeHtml(p.title) + '</div>'
        + '<div class="gb-post-meta">'
        + '<span>' + escapeHtml(p.author_name) + '</span>'
        + '<span>' + dateStr + '</span>'
        + '<span>조회 ' + (p.views || 0) + '</span>'
        + '<span>댓글 ' + (p.comments_count || 0) + '</span>'
        + '</div></div>';
}

async function loadMoreClubPosts() {
    _clubPage++;
    try {
        var res = await apiClient.request('/clubs/' + _currentClubId + '/posts?page=' + _clubPage + '&limit=20');
        if (!res.success) return;
        var tc = document.getElementById('club-tab-content');
        if (!tc) return;
        // 더보기 버튼 제거
        var loadBtn = tc.querySelector('.btn-load-more');
        if (loadBtn) loadBtn.remove();
        var html = '';
        res.posts.forEach(function(p) { html += renderClubPostCard(p); });
        if (res.page < res.totalPages) {
            html += '<button class="btn btn-secondary btn-load-more" onclick="loadMoreClubPosts()">더 보기</button>';
        }
        tc.insertAdjacentHTML('beforeend', html);
    } catch (_) {}
}

async function openClubPostDetail(postId) {
    navigateToScreen('club-post-detail');
    var container = document.getElementById('club-post-detail-content');
    if (!container) return;
    container.innerHTML = '<div class="content-placeholder">로딩 중...</div>';

    try {
        var res = await apiClient.request('/clubs/' + _currentClubId + '/posts/' + postId);
        if (!res.success) throw new Error(res.error);
        var p = res.post;
        var comments = res.comments || [];

        var images = '';
        try {
            var imgs = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
            if (imgs && imgs.length > 0) {
                images = '<div class="gb-post-images">';
                imgs.forEach(function(url) {
                    images += '<img src="' + url + '" class="gb-post-image" onclick="window.open(this.src)">';
                });
                images += '</div>';
            }
        } catch(_) {}

        var isAuthor = currentUser && p.author_id === currentUser.id;
        var actionBtns = isAuthor ? '<div class="gb-post-actions">'
            + '<button class="btn btn-secondary btn-sm" onclick="editClubPost(' + p.id + ')">수정</button>'
            + '<button class="btn btn-secondary btn-sm" onclick="deleteClubPost(' + p.id + ')">삭제</button></div>' : '';

        var commentsHtml = '<div class="gb-comments-section"><h4 class="gb-comments-title">댓글 ' + comments.length + '개</h4>';
        var topLevel = comments.filter(function(c) { return !c.parent_id; });
        topLevel.forEach(function(c) {
            commentsHtml += renderClubComment(c, false);
            var replies = comments.filter(function(r) { return r.parent_id === c.id; });
            replies.forEach(function(r) { commentsHtml += renderClubComment(r, true); });
        });
        commentsHtml += '</div>';

        // 댓글 입력
        var commentForm = '<div class="gb-comment-form">'
            + '<input type="text" id="club-comment-input" placeholder="댓글을 입력하세요" class="gb-comment-input">'
            + '<button class="btn btn-primary btn-sm" onclick="submitClubComment(' + p.id + ')">등록</button></div>';

        container.innerHTML = '<div class="gb-post-detail">'
            + '<div class="gb-post-author"><span class="gb-author-name">' + escapeHtml(p.author_name) + '</span>'
            + '<span class="gb-post-date">' + formatRelativeTime(p.created_at) + '</span></div>'
            + '<h2 class="gb-post-detail-title">' + escapeHtml(p.title) + '</h2>'
            + '<div class="gb-post-body">' + escapeHtml(p.content || '').replace(/\n/g, '<br>') + '</div>'
            + images + actionBtns + commentsHtml + commentForm + '</div>';
    } catch (err) {
        container.innerHTML = '<div class="error-state">게시글을 불러올 수 없습니다.</div>';
    }
}

function renderClubComment(c, isReply) {
    var isAuthor = currentUser && c.author_id === currentUser.id;
    var replyBtn = !isReply ? '<button class="gb-reply-btn" onclick="showClubReplyInput(' + c.id + ')">답글</button>' : '';
    var deleteBtn = isAuthor ? '<button class="gb-reply-btn" onclick="deleteClubComment(' + c.post_id + ',' + c.id + ')">삭제</button>' : '';

    return '<div class="gb-comment' + (isReply ? ' gb-comment-reply' : '') + '">'
        + '<div class="gb-comment-author">' + escapeHtml(c.author_name) + ' <span class="gb-comment-date">' + formatRelativeTime(c.created_at) + '</span></div>'
        + '<div class="gb-comment-content">' + escapeHtml(c.content) + '</div>'
        + '<div class="gb-comment-actions">' + replyBtn + deleteBtn + '</div>'
        + '<div id="club-reply-input-' + c.id + '" style="display:none" class="gb-reply-form">'
        + '<input type="text" placeholder="답글 입력" class="gb-comment-input">'
        + '<button class="btn btn-primary btn-sm" onclick="submitClubReply(' + c.post_id + ',' + c.id + ')">등록</button></div>'
        + '</div>';
}

function showClubReplyInput(commentId) {
    var el = document.getElementById('club-reply-input-' + commentId);
    if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

async function submitClubComment(postId) {
    var input = document.getElementById('club-comment-input');
    if (!input || !input.value.trim()) return;
    try {
        await apiClient.request('/clubs/' + _currentClubId + '/posts/' + postId + '/comments', {
            method: 'POST', body: JSON.stringify({ content: input.value.trim() })
        });
        openClubPostDetail(postId);
    } catch (_) {}
}

async function submitClubReply(postId, parentId) {
    var container = document.getElementById('club-reply-input-' + parentId);
    if (!container) return;
    var input = container.querySelector('input');
    if (!input || !input.value.trim()) return;
    try {
        await apiClient.request('/clubs/' + _currentClubId + '/posts/' + postId + '/comments', {
            method: 'POST', body: JSON.stringify({ content: input.value.trim(), parent_id: parentId })
        });
        openClubPostDetail(postId);
    } catch (_) {}
}

async function deleteClubComment(postId, commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
        await apiClient.request('/clubs/' + _currentClubId + '/posts/' + postId + '/comments/' + commentId, { method: 'DELETE' });
        openClubPostDetail(postId);
    } catch (_) {}
}

// ========== 게시글 작성/수정 ==========

function showClubPostForm(postId) {
    _editingClubPostId = postId || null;
    var titleEl = document.getElementById('club-post-form-title');
    if (titleEl) titleEl.textContent = postId ? '게시글 수정' : '게시글 작성';
    document.getElementById('cp-title') && (document.getElementById('cp-title').value = '');
    document.getElementById('cp-content') && (document.getElementById('cp-content').value = '');
    var preview = document.getElementById('cp-image-preview');
    if (preview) preview.innerHTML = '';
    if (postId) loadClubPostForEdit(postId);
    navigateToScreen('club-post-form');
}

async function loadClubPostForEdit(postId) {
    try {
        var res = await apiClient.request('/clubs/' + _currentClubId + '/posts/' + postId);
        if (res.success) {
            document.getElementById('cp-title').value = res.post.title;
            document.getElementById('cp-content').value = res.post.content || '';
        }
    } catch (_) {}
}

function editClubPost(postId) { showClubPostForm(postId); }

async function deleteClubPost(postId) {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;
    try {
        await apiClient.request('/clubs/' + _currentClubId + '/posts/' + postId, { method: 'DELETE' });
        history.back();
    } catch (_) {}
}

function initClubPostForm() {
    var form = document.getElementById('club-post-form');
    if (!form) return;
    // 매번 새로 바인딩
    var newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var title = document.getElementById('cp-title').value.trim();
        var content = document.getElementById('cp-content').value.trim();
        if (!title) { showToast('제목을 입력하세요', 'error'); return; }
        if (!_currentClubId) { showToast('소모임 정보를 찾을 수 없습니다', 'error'); return; }

        var submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        // 이미지 업로드
        var images = null;
        var fileInput = document.getElementById('cp-images');
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            images = await uploadClubPostImages(fileInput.files);
        }

        var body = { title: title, content: content };
        if (images) body.images = JSON.stringify(images);

        try {
            if (_editingClubPostId) {
                await apiClient.request('/clubs/' + _currentClubId + '/posts/' + _editingClubPostId, {
                    method: 'PUT', body: JSON.stringify(body)
                });
            } else {
                await apiClient.request('/clubs/' + _currentClubId + '/posts', {
                    method: 'POST', body: JSON.stringify(body)
                });
            }
            showToast(_editingClubPostId ? '게시글이 수정되었습니다' : '게시글이 등록되었습니다');
            newForm.reset();
            history.back();
        } catch (err) {
            console.error('Club post submit error:', err);
            showToast(err.message || '게시글 등록 중 오류가 발생했습니다', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    // 이미지 프리뷰
    var fileInput = document.getElementById('cp-images');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            var preview = document.getElementById('cp-image-preview');
            if (!preview) return;
            preview.innerHTML = '';
            Array.from(this.files).slice(0, 5).forEach(function(file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML += '<img src="' + e.target.result + '" class="gb-preview-img">';
                };
                reader.readAsDataURL(file);
            });
        });
    }
}

async function uploadClubPostImages(files) {
    var urls = [];
    for (var i = 0; i < Math.min(files.length, 5); i++) {
        var formData = new FormData();
        formData.append('image', files[i]);
        try {
            var res = await fetch('/api/upload/image', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') },
                body: formData
            });
            var data = await res.json();
            if (data.success && data.url) urls.push(data.url);
        } catch (_) {}
    }
    return urls;
}

// ========== 일정 ==========

async function loadClubSchedules() {
    var tc = document.getElementById('club-tab-content');
    if (!tc) return;
    tc.innerHTML = '<div class="content-placeholder">로딩 중...</div>';

    try {
        var res = await apiClient.request('/clubs/' + _currentClubId + '/schedules');
        if (!res.success) throw new Error(res.error);

        if (!res.schedules || res.schedules.length === 0) {
            tc.innerHTML = '<div class="empty-state"><p class="empty-state-text">아직 일정이 없습니다</p></div>';
            return;
        }

        var html = '';
        res.schedules.forEach(function(s) {
            var start = new Date(s.start_date);
            var dateStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
            var timeStr = String(start.getHours()).padStart(2, '0') + ':' + String(start.getMinutes()).padStart(2, '0');
            var isCreator = currentUser && s.created_by === currentUser.id;
            html += '<div class="gb-schedule-card">'
                + '<div class="gb-schedule-date">' + dateStr + ' ' + timeStr + '</div>'
                + '<div class="gb-schedule-title">' + escapeHtml(s.title) + '</div>'
                + (s.location ? '<div class="gb-schedule-location">' + escapeHtml(s.location) + '</div>' : '')
                + '<div class="gb-schedule-creator">' + escapeHtml(s.creator_name) + '</div>'
                + (isCreator ? '<div class="gb-schedule-actions">'
                    + '<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();editClubSchedule(' + s.id + ')">수정</button>'
                    + '<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();deleteClubSchedule(' + s.id + ')">삭제</button>'
                    + '</div>' : '')
                + '</div>';
        });
        tc.innerHTML = html;
    } catch (err) {
        tc.innerHTML = '<div class="error-state">일정을 불러올 수 없습니다.</div>';
    }
}

function showClubScheduleForm(scheduleId) {
    _editingClubScheduleId = scheduleId || null;
    document.getElementById('cs-title') && (document.getElementById('cs-title').value = '');
    document.getElementById('cs-description') && (document.getElementById('cs-description').value = '');
    document.getElementById('cs-location') && (document.getElementById('cs-location').value = '');
    document.getElementById('cs-start-date') && (document.getElementById('cs-start-date').value = '');
    document.getElementById('cs-end-date') && (document.getElementById('cs-end-date').value = '');
    if (scheduleId) loadClubScheduleForEdit(scheduleId);
    navigateToScreen('club-schedule-form');
}

async function loadClubScheduleForEdit(scheduleId) {
    try {
        var res = await apiClient.request('/clubs/' + _currentClubId + '/schedules');
        if (res.success) {
            var s = res.schedules.find(function(x) { return x.id === scheduleId; });
            if (s) {
                document.getElementById('cs-title').value = s.title || '';
                document.getElementById('cs-description').value = s.description || '';
                document.getElementById('cs-location').value = s.location || '';
                if (s.start_date) document.getElementById('cs-start-date').value = s.start_date.substring(0, 16);
                if (s.end_date) document.getElementById('cs-end-date').value = s.end_date.substring(0, 16);
                if (s.category) document.getElementById('cs-category').value = s.category;
            }
        }
    } catch (_) {}
}

function editClubSchedule(scheduleId) { showClubScheduleForm(scheduleId); }

async function deleteClubSchedule(scheduleId) {
    if (!confirm('일정을 삭제하시겠습니까?')) return;
    try {
        await apiClient.request('/clubs/' + _currentClubId + '/schedules/' + scheduleId, { method: 'DELETE' });
        loadClubSchedules();
    } catch (_) {}
}

function initClubScheduleForm() {
    var form = document.getElementById('club-schedule-form');
    if (!form) return;
    // 매번 새로 바인딩 (이전 리스너 제거 후)
    var newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    // cloneNode 후 필드 재초기화
    if (!_editingClubScheduleId) {
        var fields = ['cs-title','cs-description','cs-location','cs-start-date','cs-end-date'];
        fields.forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
        var catEl = document.getElementById('cs-category'); if (catEl) catEl.value = 'meeting';
    }
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var title = document.getElementById('cs-title').value.trim();
        var desc = document.getElementById('cs-description').value.trim();
        var loc = document.getElementById('cs-location').value.trim();
        var startDate = document.getElementById('cs-start-date').value;
        var endDate = document.getElementById('cs-end-date').value;
        var category = document.getElementById('cs-category').value;

        if (!title) { showToast('제목을 입력하세요', 'error'); return; }
        if (!startDate) { showToast('시작 날짜를 입력하세요', 'error'); return; }
        if (!_currentClubId) { showToast('소모임 정보를 찾을 수 없습니다', 'error'); return; }

        var submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            var url = '/clubs/' + _currentClubId + '/schedules' + (_editingClubScheduleId ? '/' + _editingClubScheduleId : '');
            var method = _editingClubScheduleId ? 'PUT' : 'POST';
            var res = await apiClient.request(url, {
                method: method,
                body: JSON.stringify({
                    title: title, description: desc, location: loc,
                    start_date: startDate, end_date: endDate || null, category: category
                })
            });
            if (res.success) {
                showToast(_editingClubScheduleId ? '일정이 수정되었습니다' : '일정이 등록되었습니다');
                newForm.reset();
                history.back();
            } else {
                showToast((res.detail || res.error || res.message || '일정 등록에 실패했습니다'), 'error');
            }
        } catch (err) {
            console.error('Club schedule create error:', err);
            showToast(err.message || '일정 등록 중 오류가 발생했습니다', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// ========== 멤버 목록 ==========

function loadClubMembersList(members) {
    var tc = document.getElementById('club-tab-content');
    if (!tc) return;
    var accepted = members.filter(function(m) { return m.status === 'accepted'; });

    var html = '';
    accepted.forEach(function(m) {
        var roleTag = m.role === 'owner' ? '<span class="club-role-tag owner">개설자</span>'
            : m.role === 'admin' ? '<span class="club-role-tag admin">관리자</span>' : '';
        var avatar = m.profile_image
            ? '<img src="' + m.profile_image + '" class="member-card-v2-avatar">'
            : '<div class="member-card-v2-avatar member-avatar-default">' + escapeHtml(m.name).charAt(0) + '</div>';
        html += '<div class="club-member-card" onclick="navigateToScreen(\'member-detail\');loadMemberDetail(' + m.user_id + ')">'
            + avatar
            + '<div class="club-member-info">'
            + '<div class="club-member-name">' + escapeHtml(m.name) + roleTag + '</div>'
            + (m.company ? '<div class="club-member-sub">' + escapeHtml(m.company) + (m.position ? ' · ' + escapeHtml(m.position) : '') + '</div>' : '')
            + (m.org_name ? '<div class="club-member-org">' + escapeHtml(m.org_name) + '</div>' : '')
            + '</div></div>';
    });
    tc.innerHTML = html || '<div class="empty-state"><p class="empty-state-text">멤버가 없습니다</p></div>';
}

// ========== 멤버 초대 ==========

function openClubInvite() {
    _clubInviteSelected = [];
    navigateToScreen('club-invite');
}

function loadClubInviteScreen() {
    var queryInput = document.getElementById('club-invite-query');
    var resultsDiv = document.getElementById('club-invite-results');
    var selectedDiv = document.getElementById('club-invite-selected');
    var submitBtn = document.getElementById('club-invite-submit-btn');

    if (resultsDiv) resultsDiv.innerHTML = '';
    if (selectedDiv) selectedDiv.innerHTML = '';
    if (submitBtn) submitBtn.style.display = 'none';
    _clubInviteSelected = [];

    if (queryInput && !queryInput._bound) {
        queryInput._bound = true;
        var debounceTimer;
        queryInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            var q = this.value.trim();
            debounceTimer = setTimeout(function() {
                if (q.length >= 1) searchClubInviteMembers(q);
                else if (resultsDiv) resultsDiv.innerHTML = '';
            }, 300);
        });
    }
}

async function searchClubInviteMembers(q) {
    var resultsDiv = document.getElementById('club-invite-results');
    if (!resultsDiv) return;

    try {
        var res = await apiClient.request('/members/search-all?q=' + encodeURIComponent(q));
        if (!res.success) return;
        var members = res.members || [];

        if (members.length === 0) {
            resultsDiv.innerHTML = '<div class="empty-state"><p class="empty-state-text">검색 결과가 없습니다</p></div>';
            return;
        }

        var html = '';
        members.forEach(function(m) {
            var isSelected = _clubInviteSelected.some(function(s) { return s.id === m.id; });
            var orgTag = m.org_name ? ' <span class="member-org-tag">' + escapeHtml(m.org_name) + '</span>' : '';
            html += '<div class="club-invite-item' + (isSelected ? ' selected' : '') + '" onclick="toggleClubInviteMember(' + m.id + ',\'' + escapeHtml(m.name).replace(/'/g, "\\'") + '\')">'
                + '<div class="club-invite-item-name">' + escapeHtml(m.name) + orgTag + '</div>'
                + (m.company ? '<div class="club-invite-item-sub">' + escapeHtml(m.company) + '</div>' : '')
                + '<div class="club-invite-check">' + (isSelected ? '✓' : '') + '</div>'
                + '</div>';
        });
        resultsDiv.innerHTML = html;
    } catch (_) {}
}

function toggleClubInviteMember(id, name) {
    var idx = _clubInviteSelected.findIndex(function(s) { return s.id === id; });
    if (idx >= 0) {
        _clubInviteSelected.splice(idx, 1);
    } else {
        _clubInviteSelected.push({ id: id, name: name });
    }
    updateClubInviteUI();
    // 재검색
    var q = document.getElementById('club-invite-query');
    if (q && q.value.trim()) searchClubInviteMembers(q.value.trim());
}

function updateClubInviteUI() {
    var selectedDiv = document.getElementById('club-invite-selected');
    var submitBtn = document.getElementById('club-invite-submit-btn');
    if (selectedDiv) {
        selectedDiv.innerHTML = _clubInviteSelected.map(function(s) {
            return '<span class="club-invite-tag">' + escapeHtml(s.name) + ' <button onclick="event.stopPropagation();toggleClubInviteMember(' + s.id + ',\'' + escapeHtml(s.name).replace(/'/g, "\\'") + '\')">&times;</button></span>';
        }).join('');
    }
    if (submitBtn) submitBtn.style.display = _clubInviteSelected.length > 0 ? '' : 'none';
}

async function submitClubInvites() {
    if (_clubInviteSelected.length === 0) return;
    try {
        var ids = _clubInviteSelected.map(function(s) { return s.id; });
        var res = await apiClient.request('/clubs/' + _currentClubId + '/invite', {
            method: 'POST', body: JSON.stringify({ user_ids: ids })
        });
        if (res.success) {
            _clubInviteSelected = [];
            history.back();
        }
    } catch (err) {
        console.error('submitClubInvites error:', err);
    }
}

// ========== 소모임 삭제 ==========

async function deleteClub() {
    if (!confirm('소모임을 삭제하시겠습니까? 모든 게시글과 일정이 삭제됩니다.')) return;
    try {
        await apiClient.request('/clubs/' + _currentClubId, { method: 'DELETE' });
        _currentClubId = null;
        navigateToScreen('clubs');
    } catch (_) {}
}

// ========== 회원 프로필 상세 (타인) ==========

async function loadMemberDetail(userId) {
    var container = document.getElementById('member-detail-content');
    if (!container) return;
    container.innerHTML = '<div class="content-placeholder">로딩 중...</div>';

    try {
        var res = await apiClient.request('/members/' + userId);
        if (!res.success) throw new Error(res.error || '회원 정보를 불러올 수 없습니다.');
        var m = res.member || res;

        var avatar = m.profile_image
            ? '<img src="' + m.profile_image + '" class="profile-avatar">'
            : '<div class="profile-avatar profile-avatar-default">' + escapeHtml(m.name).charAt(0) + '</div>';

        var html = '<div class="profile-header">' + avatar
            + '<h2 class="profile-name">' + escapeHtml(m.name) + '</h2>'
            + (m.jc_position ? '<div class="profile-role">' + escapeHtml(m.jc_position) + '</div>' : '')
            + (m.org_name ? '<div class="profile-org-tag">' + escapeHtml(m.org_name) + (m.org_district ? ' (' + escapeHtml(m.org_district) + ')' : '') + '</div>' : '')
            + '</div>';

        // 기본 정보
        html += '<div class="info-section"><h3 class="info-section-title">기본 정보</h3>';
        if (m.phone) html += profileInfoRow('연락처', m.phone, 'phone');
        if (m.email) html += profileInfoRow('이메일', m.email, 'mail');
        html += '</div>';

        // 직장 정보
        if (m.company || m.position || m.industry) {
            html += '<div class="info-section"><h3 class="info-section-title">직장 정보</h3>';
            if (m.company) html += profileInfoRow('회사', m.company, 'company');
            if (m.position) html += profileInfoRow('직책', m.position, 'badge');
            if (m.department) html += profileInfoRow('부서', m.department, 'group');
            if (m.industry) {
                var industryName = typeof getIndustryName === 'function' ? getIndustryName(m.industry) : m.industry;
                html += profileInfoRow('업종', industryName + (m.industry_detail ? ' · ' + m.industry_detail : ''), 'company');
            }
            html += '</div>';
        }

        // 사업 PR
        if (m.one_line_pr || m.service_description) {
            html += '<div class="info-section"><h3 class="info-section-title">사업 PR</h3>';
            if (m.one_line_pr) html += profileInfoRow('한 줄 PR', m.one_line_pr, 'star');
            if (m.service_description) html += profileInfoRow('서비스 설명', m.service_description, 'info');
            html += '</div>';
        }

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<div class="error-state">' + (err.message || '회원 정보를 불러올 수 없습니다.') + '</div>';
    }
}

// ========== 초기화 ==========

document.addEventListener('DOMContentLoaded', function() {
    initClubCreateForm();
    initClubPostForm();
    initClubScheduleForm();
});

console.log('Clubs module loaded');
