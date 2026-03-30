/**
 * CommentComponent — 통합 댓글 UI 컴포넌트
 *
 * posts, schedules, clubs, group-board 4곳의 댓글 렌더링/제출/삭제/좋아요를
 * 하나의 컴포넌트로 통합. config로 차이점을 흡수.
 *
 * 사용법:
 *   var comments = new CommentComponent({
 *     apiBase: '/posts/' + postId + '/comments',
 *     likeApiBase: '/posts/' + postId + '/comments',  // 좋아요 API (null이면 미지원)
 *     containerId: 'my-comments-section',
 *     showLikes: true,
 *     showReplies: true,
 *     showInput: true,
 *     inputStyle: 'bottom',  // 'bottom' (입력바 하단) | 'inline' (섹션 내부)
 *     onCountChange: function(count) { ... },
 *     onLoad: function() { ... }
 *   });
 *   comments.load();
 */

function CommentComponent(config) {
    this.config = config;
    this._container = null;
}

// ─── LOAD & RENDER ───

CommentComponent.prototype.load = async function () {
    var self = this;
    var container = document.getElementById(this.config.containerId);
    if (!container) return;
    this._container = container;

    try {
        var res = await apiClient.request(this.config.apiBase);
        // 다양한 응답 형태 대응
        var rawComments = [];
        if (res.data && res.data.items) {
            // schedules 형태: { data: { items: [...] } } — 대댓글 구조화 됨
            rawComments = res.data.items;
        } else if (res.comments) {
            // posts 형태: { comments: [...] } — flat 배열
            rawComments = res.comments;
        } else if (res.data && Array.isArray(res.data)) {
            rawComments = res.data;
        }

        // flat 배열을 parent/reply 구조로 변환
        var allComments = this._flatten(rawComments);
        var count = allComments.length;

        var userInfo = typeof currentUser !== 'undefined' ? currentUser : JSON.parse(localStorage.getItem('user_info') || 'null');
        var myId = userInfo ? userInfo.id : null;

        var html = this._renderSection(allComments, count, myId);
        container.innerHTML = html;

        // 이벤트 위임 바인딩 (container에 1회만 — innerHTML 교체해도 container 자체는 유지됨)
        if (!this._eventsBound) {
            this._bindEvents(container);
            this._eventsBound = true;
        }

        // 입력창 바인딩 (innerHTML 교체 후 매번 필요)
        this._bindInput(container);

        if (this.config.onCountChange) this.config.onCountChange(count);
        if (this.config.onLoad) this.config.onLoad();
    } catch (e) {
        container.innerHTML = '';
    }
};

// ─── FLATTEN (대댓글 구조 → flat 배열) ───

CommentComponent.prototype._flatten = function (comments) {
    var result = [];
    var seen = new Set(); // 중복 방지

    function addComment(c, isReply, parentIdOverride) {
        if (seen.has(c.id)) return;
        seen.add(c.id);
        var name = c.author_name || (c.author && c.author.name) || '알 수 없음';
        var authorId = c.author_id || (c.author && c.author.id);
        result.push({
            id: c.id,
            author_id: authorId,
            author_name: name,
            author_image: c.author_image || (c.author && c.author.profile_image),
            content: c.content,
            created_at: c.created_at,
            parent_id: c.parent_id || parentIdOverride || null,
            likes_count: c.likes_count || 0,
            liked: c.liked || false,
            _isReply: isReply || !!c.parent_id
        });
    }

    comments.forEach(function (c) {
        addComment(c, false, null);
        if (c.replies && c.replies.length > 0) {
            c.replies.forEach(function (r) { addComment(r, true, c.id); });
        }
    });

    return result;
};

// ─── RENDER SECTION ───

CommentComponent.prototype._renderSection = function (comments, count, myId) {
    var self = this;
    var listHtml;

    if (count === 0) {
        listHtml = '<div class="cc-empty">아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</div>';
    } else {
        // 부모 먼저, 그 다음 대댓글 순서로 렌더링
        var parents = comments.filter(function (c) { return !c._isReply; });
        var replies = comments.filter(function (c) { return c._isReply; });

        listHtml = parents.map(function (c) {
            var childHtml = replies.filter(function (r) { return r.parent_id === c.id; })
                .map(function (r) { return self._renderComment(r, myId, true); }).join('');
            return self._renderComment(c, myId, false) + childHtml;
        }).join('');
    }

    var inputHtml = '';
    if (this.config.showInput !== false) {
        inputHtml = '<div class="cc-input-bar">'
            + '<input type="text" class="cc-input" data-cc-input placeholder="댓글을 입력하세요..." maxlength="500">'
            + '<button class="cc-send-btn" data-cc-send disabled>'
            + '<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>'
            + '</button></div>';
    }

    return '<div class="cc-section">'
        + '<div class="cc-title">댓글 <span class="cc-count">(' + count + ')</span></div>'
        + '<div class="cc-list">' + listHtml + '</div>'
        + inputHtml
        + '</div>';
};

// ─── RENDER SINGLE COMMENT ───

CommentComponent.prototype._renderComment = function (c, myId, isReply) {
    var isMe = myId && Number(c.author_id) === Number(myId);
    var liked = c.liked ? ' cc-liked' : '';
    var likeCount = c.likes_count || 0;
    var initial = (c.author_name || '?')[0];

    var likeBtn = '';
    if (this.config.showLikes) {
        likeBtn = '<button class="cc-like-btn' + liked + '" data-action="cc-like" data-comment-id="' + c.id + '">'
            + '<svg width="14" height="14" viewBox="0 0 24 24" fill="' + (c.liked ? '#DC2626' : 'none') + '" stroke="' + (c.liked ? '#DC2626' : '#9CA3AF') + '" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>'
            + ' <span class="cc-like-count">' + (likeCount > 0 ? likeCount : '') + '</span></button>';
    }

    var replyBtn = '';
    if (this.config.showReplies && !isReply) {
        replyBtn = '<button class="cc-reply-btn" data-action="cc-show-reply" data-comment-id="' + c.id + '">답글</button>';
    }

    var deleteBtn = '';
    if (isMe) {
        deleteBtn = '<button class="cc-delete-btn" data-action="cc-delete" data-comment-id="' + c.id + '">삭제</button>';
    }

    return '<div class="cc-item' + (isReply ? ' cc-reply' : '') + '" data-comment-id="' + c.id + '">'
        + '<div class="cc-header">'
        + '<div class="cc-avatar">' + escapeHtml(initial) + '</div>'
        + '<span class="cc-author">' + escapeHtml(c.author_name) + '</span>'
        + '<span class="cc-date">' + (typeof formatRelativeTime === 'function' ? formatRelativeTime(c.created_at) : formatDate(c.created_at)) + '</span>'
        + '</div>'
        + '<div class="cc-content">' + escapeHtml(c.content || '') + '</div>'
        + '<div class="cc-actions">' + likeBtn + replyBtn + deleteBtn + '</div>'
        + '</div>';
};

// ─── EVENT DELEGATION ───

CommentComponent.prototype._bindEvents = function (container) {
    var self = this;
    container.addEventListener('click', function (e) {
        var target = e.target.closest('[data-action]');
        if (!target) return;

        var action = target.getAttribute('data-action');
        var commentId = target.getAttribute('data-comment-id');

        switch (action) {
            case 'cc-like':
                self._handleLike(commentId, target);
                break;
            case 'cc-show-reply':
                self._showReplyInput(commentId, target);
                break;
            case 'cc-delete':
                self._handleDelete(commentId);
                break;
            case 'cc-submit-reply':
                self._submitReply(target.getAttribute('data-parent-id'), target);
                break;
        }
    });
};

// ─── INPUT BINDING ───

CommentComponent.prototype._bindInput = function (container) {
    var self = this;
    var input = container.querySelector('[data-cc-input]');
    var sendBtn = container.querySelector('[data-cc-send]');
    if (!input || !sendBtn) return;

    input.addEventListener('input', function () {
        sendBtn.disabled = !input.value.trim();
    });
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey && input.value.trim()) {
            e.preventDefault();
            self._submitComment(input, sendBtn);
        }
    });
    sendBtn.addEventListener('click', function () {
        self._submitComment(input, sendBtn);
    });
};

// ─── SUBMIT COMMENT ───

CommentComponent.prototype._submitComment = async function (input, sendBtn) {
    var content = input.value.trim();
    if (!content) return;
    // 중복 제출 방지
    if (this._commentSubmitting) return;
    this._commentSubmitting = true;
    sendBtn.disabled = true;
    try {
        var res = await apiClient.request(this.config.apiBase, {
            method: 'POST',
            body: JSON.stringify({ content: content })
        });
        if (res.success) {
            input.value = '';
            sendBtn.disabled = true;
            await this.load();
        } else {
            sendBtn.disabled = false;
        }
    } catch (e) {
        sendBtn.disabled = false;
    }
    this._commentSubmitting = false;
};

// ─── LIKE TOGGLE ───

CommentComponent.prototype._handleLike = async function (commentId, btn) {
    if (!this.config.likeApiBase || btn.disabled) return;
    btn.disabled = true;
    try {
        var res = await apiClient.request(this.config.likeApiBase + '/' + commentId + '/like', { method: 'POST' });
        if (res.success) {
            var svg = btn.querySelector('svg path');
            var countEl = btn.querySelector('.cc-like-count');
            if (res.liked) {
                svg.setAttribute('fill', '#DC2626');
                svg.setAttribute('stroke', '#DC2626');
                btn.classList.add('cc-liked');
            } else {
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', '#9CA3AF');
                btn.classList.remove('cc-liked');
            }
            if (countEl) countEl.textContent = res.likes_count > 0 ? res.likes_count : '';
        }
    } catch (e) { }
    btn.disabled = false;
};

// ─── SHOW REPLY INPUT ───

CommentComponent.prototype._showReplyInput = function (parentId, btn) {
    var container = this._container;
    // 기존 답글 입력창 제거
    container.querySelectorAll('.cc-reply-bar').forEach(function (el) { el.remove(); });

    var commentItem = btn.closest('.cc-item');
    var bar = document.createElement('div');
    bar.className = 'cc-reply-bar';
    bar.innerHTML = '<input type="text" class="cc-input cc-reply-input" placeholder="답글을 입력하세요..." maxlength="500">'
        + '<button class="cc-send-btn cc-reply-send" data-action="cc-submit-reply" data-parent-id="' + parentId + '">'
        + '<svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg></button>';
    commentItem.after(bar);

    var input = bar.querySelector('input');
    input.focus();
    var self = this;
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            self._submitReply(parentId, bar.querySelector('button'));
        }
    });
};

// ─── SUBMIT REPLY ───

CommentComponent.prototype._submitReply = async function (parentId, btn) {
    // 중복 제출 방지
    if (this._replySubmitting) return;
    this._replySubmitting = true;

    var bar = btn.closest('.cc-reply-bar');
    if (!bar) { this._replySubmitting = false; return; }
    var input = bar.querySelector('input');
    var content = input.value.trim();
    if (!content) { this._replySubmitting = false; return; }
    btn.disabled = true;
    try {
        await apiClient.request(this.config.apiBase, {
            method: 'POST',
            body: JSON.stringify({ content: content, parent_id: parseInt(parentId) })
        });
        bar.remove();
        await this.load();
    } catch (e) {
        btn.disabled = false;
    }
    this._replySubmitting = false;
};

// ─── DELETE COMMENT ───

CommentComponent.prototype._handleDelete = async function (commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
        await apiClient.request(this.config.apiBase + '/' + commentId, { method: 'DELETE' });
        await this.load();
    } catch (e) { }
};

// 전역 등록
window.CommentComponent = CommentComponent;
