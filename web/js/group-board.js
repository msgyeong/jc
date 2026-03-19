// 그룹 게시판 (공지 게시판과 동일한 포맷 — 일정은 게시글 내 첨부)

var _currentGroupBoardId = null;
var _currentGroupBoardName = '';
var _groupBoardPage = 1;
var _groupBoardLoading = false;
var _editingGroupPostId = null;
var _gpScheduleAttached = false;
var _gpPushSetting = 'immediate';
var _gpAttendanceEnabled = false;

// ========== 그룹 게시판 메인 ==========

function openGroupBoard(groupId, groupName) {
    // 모든 상태 초기화
    _currentGroupBoardId = groupId;
    _currentGroupBoardName = groupName;
    _groupBoardPage = 1;
    _groupBoardLoading = false;
    _editingGroupPostId = null;
    _gpScheduleAttached = false;
    _gpAttendanceEnabled = false;

    var titleEl = document.getElementById('group-board-title');
    if (titleEl) titleEl.textContent = groupName;

    // FAB 초기화
    var fab = document.getElementById('create-group-post-btn');
    if (fab) fab.style.display = '';

    // 화면 전환 + 데이터 로드
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    var screen = document.getElementById('group-board-screen');
    if (screen) {
        screen.classList.add('active');
        screen.scrollTop = 0;
    }
    if (!window._navPopstate) {
        history.pushState({ screen: 'group-board', groupId: groupId, groupName: groupName }, '', '#group-board');
    }
    loadGroupBoardScreen();
}

async function loadGroupBoardScreen() {
    if (!_currentGroupBoardId) return;
    var container = document.getElementById('group-board-content');
    if (!container) return;

    var titleEl = document.getElementById('group-board-title');
    if (titleEl) titleEl.textContent = _currentGroupBoardName || '그룹 게시판';

    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
        var res = await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts?page=1&limit=20');
        _groupBoardPage = 1;
        var posts = (res && res.posts) || [];
        var html = '';

        // 게시글 목록 (탭 없음 — 단일 게시글 목록)
        if (posts.length === 0) {
            html += '<div class="gb-empty-state">';
            html += '<div class="gb-empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="13" y2="13"/></svg></div>';
            html += '<p class="gb-empty-text">아직 게시글이 없습니다</p>';
            html += '<p class="gb-empty-sub">첫 번째 게시글을 작성해보세요</p>';
            html += '</div>';
        } else {
            html += '<div class="gb-post-list">';
            posts.forEach(function(p) {
                html += renderGroupPostCard(p);
            });
            html += '</div>';
            if (res.totalPages > 1) {
                html += '<button class="gb-load-more" data-action="load-more">더 보기</button>';
            }
        }

        container.innerHTML = html;

        // FAB 표시
        var fab = document.getElementById('create-group-post-btn');
        if (fab) fab.style.display = '';
    } catch (err) {
        console.error('Group board load error:', err);
        container.innerHTML = '<div class="gb-empty-state">'
            + '<div class="gb-empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="#D1D5DB"/></svg></div>'
            + '<p class="gb-empty-text">게시글을 불러올 수 없습니다</p>'
            + '<p class="gb-empty-sub">' + escapeHtml(err.message || '') + '</p>'
            + '<button class="gb-retry-btn" data-action="retry-load">다시 시도</button>'
            + '</div>';
    }
}

// 공지 게시판과 동일한 카드 (pc-card 패턴)
function renderGroupPostCard(p) {
    var date = formatRelativeDate(p.created_at);
    var isNew = isWithin3Days(p.created_at) && !p.is_read;

    var avatarHtml = p.author_image
        ? '<img src="' + escapeHtml(p.author_image) + '" alt="" class="pc-avatar-img">'
        : '<span class="pc-avatar-text">' + escapeHtml((p.author_name || '?')[0]) + '</span>';

    var pinnedHtml = p.is_pinned ? '<span class="pc-pinned">[고정]</span>' : '';
    var nBadgeHtml = isNew ? '<span class="pc-badge-n">N</span>' : '';

    return '<div class="pc-card" data-action="open-post" data-post-id="' + p.id + '">'
        + '<div class="pc-top">'
        + '<div class="pc-avatar">' + avatarHtml + '</div>'
        + '<span class="pc-author">' + escapeHtml(p.author_name || '알 수 없음') + '</span>'
        + '<span class="pc-dot">&middot;</span>'
        + '<span class="pc-time">' + date + '</span>'
        + '<span class="pc-top-spacer"></span>'
        + nBadgeHtml
        + '</div>'
        + '<div class="pc-body"><div class="pc-text">'
        + pinnedHtml
        + '<h3 class="pc-title">' + escapeHtml(p.title) + '</h3>'
        + (p.content ? '<p class="pc-preview">' + escapeHtml((p.content || '').substring(0, 120)) + (p.content.length > 120 ? '...' : '') + '</p>' : '')
        + '</div></div>'
        + '<div class="pc-stats">'
        + '<span class="pc-stat"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ' + (p.comments_count || 0) + '</span>'
        + '<span class="pc-stat"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg> ' + (p.likes_count || 0) + '</span>'
        + '<span class="pc-stat"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ' + (p.views || 0) + '</span>'
        + '</div>'
        + '</div>';
}

function isWithin3Days(dateStr) {
    if (!dateStr) return false;
    return (new Date() - new Date(dateStr)) < 3 * 24 * 60 * 60 * 1000;
}

function formatRelativeDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    var diffMin = Math.floor((new Date() - d) / 60000);
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
        var section = document.querySelector('#group-board-content .gb-post-list');
        if (!section) return;
        var moreBtn = document.querySelector('#group-board-content .gb-load-more');
        if (moreBtn) moreBtn.remove();
        section.insertAdjacentHTML('beforeend', posts.map(function(p) { return renderGroupPostCard(p); }).join(''));
        if (res.totalPages > _groupBoardPage) {
            section.insertAdjacentHTML('afterend', '<button class="gb-load-more" data-action="load-more">더 보기</button>');
        }
    } catch (_) {} finally { _groupBoardLoading = false; }
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
            html += '<button class="gb-action-btn" data-action="edit-post" data-post-id="' + post.id + '">수정</button>';
            html += '<button class="gb-action-btn gb-action-delete" data-action="delete-post" data-post-id="' + post.id + '">삭제</button>';
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

        // 연결된 일정 표시
        var schedule = res.schedule;
        if (schedule) {
            var sd = new Date(schedule.start_date);
            var schedDateStr = sd.getFullYear() + '.' + String(sd.getMonth()+1).padStart(2,'0') + '.' + String(sd.getDate()).padStart(2,'0');
            var schedTimeStr = String(sd.getHours()).padStart(2,'0') + ':' + String(sd.getMinutes()).padStart(2,'0');
            var schedEndStr = '';
            if (schedule.end_date) {
                var ed = new Date(schedule.end_date);
                var endDatePart = ed.getFullYear() + '.' + String(ed.getMonth()+1).padStart(2,'0') + '.' + String(ed.getDate()).padStart(2,'0');
                var endTimePart = String(ed.getHours()).padStart(2,'0') + ':' + String(ed.getMinutes()).padStart(2,'0');
                schedEndStr = (endDatePart !== schedDateStr ? ' ~ ' + endDatePart + ' ' : ' ~ ') + endTimePart;
            }
            var catLabels = { event: '행사', meeting: '회의', training: '교육', other: '기타' };
            html += '<div class="gb-detail-schedule">'
                + '<div class="gb-detail-schedule-title">'
                + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
                + ' 첨부 일정</div>'
                + '<div class="gb-detail-schedule-info">'
                + '<span class="gb-sched-cat">' + (catLabels[schedule.category] || schedule.category) + '</span>'
                + '<span class="gb-sched-date">' + schedDateStr + ' ' + schedTimeStr + schedEndStr + '</span>'
                + (schedule.location ? '<span class="gb-sched-loc">📍 ' + escapeHtml(schedule.location) + '</span>' : '')
                + '</div></div>';
        }

        // 참석 확인 (attendance_enabled인 경우)
        if (post.attendance_enabled) {
            html += '<div id="gp-attendance-container" data-post-id="' + post.id + '"></div>';
        }

        // 좋아요 + 통계
        var liked = post.user_has_liked;
        html += '<div class="gb-detail-stats-row">'
            + '<button class="gb-like-btn' + (liked ? ' liked' : '') + '" data-action="toggle-like" data-post-id="' + post.id + '">'
            + '<svg width="18" height="18" viewBox="0 0 24 24"' + (liked ? ' fill="#DC2626" stroke="#DC2626"' : ' fill="none" stroke="currentColor"') + ' stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>'
            + ' <span class="gb-likes-count">' + (post.likes_count || 0) + '</span></button>'
            + '<span class="gb-stat-text">조회 ' + (post.views || 0) + ' · 댓글 ' + (post.comments_count || 0) + '</span>'
            + '</div>';

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
        html += '<button class="gb-comment-submit" data-action="submit-comment" data-post-id="' + post.id + '">등록</button>';
        html += '</div>';

        html += '</div></article>';
        container.innerHTML = html;

        // 참석 확인 로드
        if (post.attendance_enabled) {
            loadGpAttendance(post.id);
        }
    } catch (err) {
        container.innerHTML = '<div class="gb-empty-state"><p class="gb-empty-text">' + escapeHtml(err.message) + '</p></div>';
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
        + '<button class="gb-comment-like-btn" data-action="like-comment" data-comment-id="' + c.id + '" data-post-id="' + c.post_id + '">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>'
        + ' <span class="gb-comment-likes-num">' + (c.likes_count || 0) + '</span></button>'
        + (!isReply ? '<button class="gb-reply-btn" data-action="show-reply" data-comment-id="' + c.id + '">답글</button>' : '')
        + ((isAuthor || isAdmin) ? '<button class="gb-delete-comment-btn" data-action="delete-comment" data-post-id="' + c.post_id + '" data-comment-id="' + c.id + '">삭제</button>' : '')
        + '</div>'
        + '<div id="reply-input-' + c.id + '" class="gb-reply-input-wrap" style="display:none">'
        + '<textarea class="gb-comment-textarea" id="reply-text-' + c.id + '" placeholder="답글 입력" rows="2"></textarea>'
        + '<button class="gb-comment-submit" data-action="submit-reply" data-post-id="' + c.post_id + '" data-parent-id="' + c.id + '">등록</button>'
        + '</div>'
        + '</div>';
}

// ========== 좋아요 ==========

async function toggleGroupPostLike(postId, btn) {
    if (!_currentGroupBoardId || btn.disabled) return;
    btn.disabled = true;
    try {
        var res = await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId + '/like', { method: 'POST' });
        if (res.success) {
            var countEl = btn.querySelector('.gb-likes-count');
            if (countEl) countEl.textContent = res.likes_count || 0;
            var svg = btn.querySelector('svg');
            if (svg) {
                svg.setAttribute('fill', res.liked ? '#DC2626' : 'none');
                svg.setAttribute('stroke', res.liked ? '#DC2626' : 'currentColor');
            }
            btn.classList.toggle('liked', res.liked);
        }
    } catch (_) {}
    btn.disabled = false;
}

async function toggleGroupCommentLike(commentId, btn) {
    if (!_currentGroupBoardId || btn.disabled) return;
    btn.disabled = true;
    try {
        var res = await apiClient.request('/group-board/' + _currentGroupBoardId + '/comments/' + commentId + '/like', { method: 'POST' });
        if (res.success) {
            var countEl = btn.querySelector('.gb-comment-likes-num');
            if (countEl) countEl.textContent = res.likes_count || 0;
        }
    } catch (_) {}
    btn.disabled = false;
}

function formatFullDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate() + ' ' +
        String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// ========== 댓글 CRUD ==========

async function submitGroupComment(postId) {
    var textarea = document.getElementById('gb-comment-text');
    if (!textarea || !textarea.value.trim()) return;
    try {
        await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId + '/comments', {
            method: 'POST', body: JSON.stringify({ content: textarea.value.trim() })
        });
        openGroupPostDetail(postId);
    } catch (err) { alert('댓글 작성에 실패했습니다.'); }
}

async function submitGroupReply(postId, parentId) {
    var textarea = document.getElementById('reply-text-' + parentId);
    if (!textarea || !textarea.value.trim()) return;
    try {
        await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId + '/comments', {
            method: 'POST', body: JSON.stringify({ content: textarea.value.trim(), parent_id: parentId })
        });
        openGroupPostDetail(postId);
    } catch (err) { alert('답글 작성에 실패했습니다.'); }
}

async function deleteGroupComment(postId, commentId) {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    try {
        await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId + '/comments/' + commentId, { method: 'DELETE' });
        openGroupPostDetail(postId);
    } catch (err) { alert('댓글 삭제에 실패했습니다.'); }
}

// ========== 게시글 작성/수정 (공지 게시판 포맷) ==========

function showGroupPostForm(postId) {
    _editingGroupPostId = postId || null;
    _gpScheduleAttached = false;

    var titleEl = document.getElementById('group-post-form-title');
    if (titleEl) titleEl.textContent = postId ? '게시글 수정' : '글쓰기';

    var form = document.getElementById('group-post-form');
    if (form) form.reset();

    var preview = document.getElementById('gp-image-preview');
    if (preview) preview.innerHTML = '';

    var countEl = document.getElementById('gp-images-count');
    if (countEl) countEl.textContent = '(0/5)';

    // 참석 확인 섹션
    _gpAttendanceEnabled = false;
    renderGpAttendanceToggle();

    // 일정 첨부 섹션 렌더링 (공지 게시판과 동일)
    renderGpScheduleAttach();

    if (postId) {
        loadGroupPostForEdit(postId);
    }

    navigateToScreen('group-post-form');

    // Push 알림 설정 렌더링 (화면 전환 후 DOM 확보)
    setTimeout(function() { renderGpPushSetting(); }, 0);
}

function renderGpScheduleAttach() {
    var el = document.getElementById('gp-schedule-attach');
    if (!el) return;
    el.innerHTML = ''
        + '<div class="schedule-attach-section">'
        + '<div class="schedule-attach-header" data-action="toggle-gp-schedule">'
        + '<span class="schedule-attach-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> 일정 첨부</span>'
        + '<label class="toggle-switch" onclick="event.stopPropagation()">'
        + '<input type="checkbox" id="gp-schedule-toggle" data-action="toggle-gp-schedule">'
        + '<span class="toggle-slider"></span>'
        + '</label>'
        + '</div>'
        + '<div class="schedule-attach-fields" id="gp-schedule-fields" style="display:none">'
        + '<div class="form-group"><label>카테고리</label>'
        + '<select id="gp-sched-category"><option value="event">행사</option><option value="meeting">회의</option><option value="training">교육</option><option value="other">기타</option></select></div>'
        + '<div class="form-group"><label>시작 날짜/시간</label>'
        + '<div class="date-time-row"><input type="date" id="gp-sched-start-date"><input type="time" id="gp-sched-start-time" value="09:00"></div></div>'
        + '<div class="form-group"><label>종료 날짜/시간</label>'
        + '<div class="date-time-row"><input type="date" id="gp-sched-end-date"><input type="time" id="gp-sched-end-time" value="18:00"></div></div>'
        + '<div class="form-group"><label>장소</label>'
        + '<input type="text" id="gp-sched-location" placeholder="장소를 입력하세요"></div>'
        + '</div>'
        + '</div>';
}

function toggleGpSchedule() {
    var toggle = document.getElementById('gp-schedule-toggle');
    var fields = document.getElementById('gp-schedule-fields');
    if (!toggle || !fields) return;
    _gpScheduleAttached = toggle.checked;
    fields.style.display = _gpScheduleAttached ? '' : 'none';
    // 일정 첨부 상태 변경 시 Push 설정도 갱신 (일정 연동 알림 활성화/비활성화)
    renderGpPushSetting();
}

async function loadGroupPostForEdit(postId) {
    try {
        var res = await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId);
        if (res.success && res.post) {
            document.getElementById('gp-title').value = res.post.title || '';
            document.getElementById('gp-content').value = res.post.content || '';
        }
    } catch (_) {}
}

async function deleteGroupPost(postId) {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
    try {
        await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId, { method: 'DELETE' });
        history.back();
    } catch (err) { alert('게시글 삭제에 실패했습니다.'); }
}

function getCurrentUserSafe() {
    try {
        return typeof getCurrentUser === 'function'
            ? getCurrentUser()
            : JSON.parse(localStorage.getItem('user_info') || 'null');
    } catch (_) { return null; }
}

// ========== 참석 확인 ==========

async function loadGpAttendance(postId) {
    var el = document.getElementById('gp-attendance-container');
    if (!el) return;
    try {
        var res = await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId + '/attendance');
        if (!res.success) return;
        var d = res.data;
        el.innerHTML = ''
            + '<div class="attendance-section">'
            + '<div class="attendance-section-title">참석 여부</div>'
            + '<div class="attendance-summary-row">'
            + '<span class="attendance-count-badge attend">참석 ' + d.attending + '</span>'
            + '<span class="attendance-count-badge absent">불참 ' + d.not_attending + '</span>'
            + '</div>'
            + '<div class="attendance-buttons">'
            + '<button type="button" class="attendance-btn' + (d.my_status === 'attending' ? ' active-attending' : '') + '" onclick="submitGpAttendance(\'attending\',' + postId + ')">'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> 참석</button>'
            + '<button type="button" class="attendance-btn' + (d.my_status === 'not_attending' ? ' active-not-attending' : '') + '" onclick="submitGpAttendance(\'not_attending\',' + postId + ')">'
            + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> 불참</button>'
            + '</div></div>';
    } catch (_) {}
}

async function submitGpAttendance(status, postId) {
    try {
        await apiClient.request('/group-board/' + _currentGroupBoardId + '/posts/' + postId + '/attendance', {
            method: 'POST', body: JSON.stringify({ status: status })
        });
        loadGpAttendance(postId);
    } catch (_) { alert('참석 처리에 실패했습니다.'); }
}

function renderGpAttendanceToggle() {
    var el = document.getElementById('gp-attendance-section');
    if (!el) return;
    el.innerHTML = ''
        + '<div class="post-create-divider"></div>'
        + '<div class="schedule-attach-header" style="cursor:default">'
        + '<span class="schedule-attach-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> 참석 확인</span>'
        + '<label class="toggle-switch" onclick="event.stopPropagation()">'
        + '<input type="checkbox" id="gp-attendance-toggle" onchange="_gpAttendanceEnabled=this.checked">'
        + '<span class="toggle-slider"></span>'
        + '</label>'
        + '</div>';
}

// ========== Push 알림 설정 ==========

function renderGpPushSetting() {
    var el = document.getElementById('gp-push-setting');
    if (!el) return;
    var hasSchedule = _gpScheduleAttached;
    el.innerHTML = ''
        + '<div class="post-create-divider"></div>'
        + '<span class="post-create-section-label">Push 알림 설정</span>'
        + '<div class="push-setting-options">'
        + '<label class="push-setting-option">'
        + '<input type="radio" name="gp_push_setting" value="immediate" checked onchange="handleGpPushChange(this.value)">'
        + '<div class="push-setting-text"><span class="push-setting-title">즉시 발송</span>'
        + '<span class="push-setting-desc">게시 즉시 그룹 멤버에게 알림</span></div></label>'
        + '<label class="push-setting-option">'
        + '<input type="radio" name="gp_push_setting" value="scheduled" onchange="handleGpPushChange(this.value)">'
        + '<div class="push-setting-text"><span class="push-setting-title">예약 발송</span>'
        + '<span class="push-setting-desc">특정 날짜/시간에 알림</span></div></label>'
        + '<div class="push-scheduled-fields" id="gp-push-scheduled-fields" style="display:none">'
        + '<div class="date-time-row">'
        + '<input type="date" id="gp-push-scheduled-date">'
        + '<input type="time" id="gp-push-scheduled-time" value="09:00">'
        + '</div></div>'
        + '<label class="push-setting-option' + (hasSchedule ? '' : ' disabled') + '">'
        + '<input type="radio" name="gp_push_setting" value="d_day" ' + (hasSchedule ? '' : 'disabled') + ' onchange="handleGpPushChange(this.value)">'
        + '<div class="push-setting-text"><span class="push-setting-title">일정 연동 알림</span>'
        + '<span class="push-setting-desc">' + (hasSchedule ? 'D-day 기준 알림' : '일정 첨부 시 활성화') + '</span></div></label>'
        + '<div class="push-dday-fields" id="gp-push-dday-fields" style="display:none">'
        + '<label class="checkbox-label"><input type="checkbox" value="7" class="gp-push-dday-check" checked> D-7 (7일 전)</label>'
        + '<label class="checkbox-label"><input type="checkbox" value="3" class="gp-push-dday-check" checked> D-3 (3일 전)</label>'
        + '<label class="checkbox-label"><input type="checkbox" value="1" class="gp-push-dday-check" checked> D-1 (1일 전)</label>'
        + '<label class="checkbox-label"><input type="checkbox" value="0" class="gp-push-dday-check" checked> 당일 오전 9시</label>'
        + '</div>'
        + '<label class="push-setting-option">'
        + '<input type="radio" name="gp_push_setting" value="none" onchange="handleGpPushChange(this.value)">'
        + '<div class="push-setting-text"><span class="push-setting-title">알림 없음</span>'
        + '<span class="push-setting-desc">Push 알림을 보내지 않음</span></div></label>'
        + '</div>';
    _gpPushSetting = 'immediate';
}

function handleGpPushChange(value) {
    _gpPushSetting = value;
    var schedFields = document.getElementById('gp-push-scheduled-fields');
    var ddayFields = document.getElementById('gp-push-dday-fields');
    if (schedFields) schedFields.style.display = value === 'scheduled' ? '' : 'none';
    if (ddayFields) ddayFields.style.display = value === 'd_day' ? '' : 'none';
}

// ========== 이벤트 위임 ==========

document.addEventListener('DOMContentLoaded', function() {

    // 게시판 목록 이벤트
    var boardContent = document.getElementById('group-board-content');
    if (boardContent) {
        boardContent.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) return;
            var action = btn.getAttribute('data-action');
            switch (action) {
                case 'open-post': openGroupPostDetail(parseInt(btn.getAttribute('data-post-id'))); break;
                case 'load-more': loadMoreGroupPosts(); break;
                case 'retry-load': loadGroupBoardScreen(); break;
            }
        });
    }

    // 게시글 상세 이벤트
    var detailContent = document.getElementById('group-post-detail-content');
    if (detailContent) {
        detailContent.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) return;
            var action = btn.getAttribute('data-action');
            var postId = btn.getAttribute('data-post-id');
            var commentId = btn.getAttribute('data-comment-id');
            switch (action) {
                case 'edit-post': showGroupPostForm(parseInt(postId)); break;
                case 'delete-post': deleteGroupPost(parseInt(postId)); break;
                case 'submit-comment': submitGroupComment(parseInt(postId)); break;
                case 'submit-reply':
                    submitGroupReply(parseInt(postId), parseInt(btn.getAttribute('data-parent-id'))); break;
                case 'show-reply':
                    var el = document.getElementById('reply-input-' + commentId);
                    if (el) { el.style.display = el.style.display === 'none' ? 'block' : 'none'; }
                    break;
                case 'delete-comment': deleteGroupComment(parseInt(postId), parseInt(commentId)); break;
                case 'toggle-like': toggleGroupPostLike(parseInt(postId), btn); break;
                case 'like-comment': toggleGroupCommentLike(parseInt(commentId), btn); break;
            }
        });
    }

    // FAB
    var fab = document.getElementById('create-group-post-btn');
    if (fab) {
        fab.addEventListener('click', function() { showGroupPostForm(); });
    }

    // 이미지 업로드
    var gpUploadBtn = document.getElementById('gp-upload-btn');
    var gpImages = document.getElementById('gp-images');
    if (gpUploadBtn && gpImages) {
        gpUploadBtn.addEventListener('click', function() { gpImages.click(); });
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
            var countEl = document.getElementById('gp-images-count');
            if (countEl) countEl.textContent = '(' + Math.min(files.length, 5) + '/5)';
        });
    }

    // 일정 첨부 토글 이벤트 (이벤트 위임)
    document.addEventListener('change', function(e) {
        if (e.target.id === 'gp-schedule-toggle') toggleGpSchedule();
    });
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-action="toggle-gp-schedule"]');
        if (btn && !e.target.closest('.toggle-switch')) {
            var toggle = document.getElementById('gp-schedule-toggle');
            if (toggle) { toggle.checked = !toggle.checked; toggleGpSchedule(); }
        }
    });

    // 폼 submit
    var form = document.getElementById('group-post-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            var title = document.getElementById('gp-title').value.trim();
            var content = document.getElementById('gp-content').value.trim();
            var submitBtn = document.getElementById('gp-submit-btn');
            if (!title) return;

            var imagesInput = document.getElementById('gp-images');
            var imageUrls = null;
            if (imagesInput && imagesInput.files.length > 0) {
                imageUrls = await uploadGroupPostImages(imagesInput.files);
            }

            var body = { title: title, content: content, push_setting: _gpPushSetting || 'immediate', attendance_enabled: _gpAttendanceEnabled || false };
            if (imageUrls) body.images = JSON.stringify(imageUrls);

            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '등록 중...'; }

            try {
                var url = '/group-board/' + _currentGroupBoardId + '/posts';
                var method = 'POST';
                if (_editingGroupPostId) { url += '/' + _editingGroupPostId; method = 'PUT'; }
                var result = await apiClient.request(url, { method: method, body: JSON.stringify(body) });

                // 일정 첨부가 활성화되어 있으면 그룹 일정도 생성
                if (_gpScheduleAttached && !_editingGroupPostId) {
                    var startDate = document.getElementById('gp-sched-start-date');
                    if (startDate && startDate.value) {
                        var startTime = document.getElementById('gp-sched-start-time');
                        var endDate = document.getElementById('gp-sched-end-date');
                        var endTime = document.getElementById('gp-sched-end-time');
                        var startVal = startDate.value + 'T' + (startTime ? startTime.value : '09:00') + ':00';
                        var endVal = (endDate && endDate.value ? endDate.value : startDate.value) + 'T' + (endTime ? endTime.value : '18:00') + ':00';

                        // 시작일 > 종료일 검증
                        if (new Date(endVal) < new Date(startVal)) {
                            alert('종료 날짜/시간이 시작보다 빠릅니다. 일정을 확인해주세요.');
                            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '등록'; }
                            return;
                        }

                        var schedBody = {
                            title: title,
                            category: document.getElementById('gp-sched-category').value || 'event',
                            start_date: startVal,
                            end_date: endVal,
                            location: (document.getElementById('gp-sched-location') || {}).value || ''
                        };
                        await apiClient.request('/group-board/' + _currentGroupBoardId + '/schedules', {
                            method: 'POST', body: JSON.stringify(schedBody)
                        }).catch(function() {});
                    }
                }

                _editingGroupPostId = null;
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '등록'; }
                // 게시글 목록으로 이동 — form 히스토리를 대체하여 뒤로가기 시 form으로 안 감
                history.replaceState({ screen: 'group-board' }, '', '#group-board');
                navigateToScreen('group-board');
            } catch (err) {
                alert('게시글 등록에 실패했습니다.');
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

console.log('✅ GroupBoard 모듈 로드 완료 (공지 게시판 포맷)');
