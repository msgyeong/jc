// ========== 공통 카드 컴포넌트 (Phase 3) ==========
// posts.js와 group-board.js의 90% 중복 카드 렌더링을 통합

/**
 * 게시글 카드 렌더링 (공통)
 * @param {Object} post - 게시글 데이터
 * @param {Object} opts - 옵션
 *   opts.clickAttr: 클릭 속성 문자열 (예: 'onclick="..."' 또는 'data-action="open-post" data-post-id="1"')
 *   opts.showThumb: 썸네일 표시 여부 (기본 false)
 *   opts.readField: 읽음 확인 필드명 ('read_by_current_user' 또는 'is_read')
 */
function renderPostCard(post, opts) {
    opts = opts || {};
    var readField = opts.readField || 'read_by_current_user';
    var isNewPost = isNew(post.created_at);
    var unread = isNewPost && !post[readField];

    var avatarHtml = post.author_image
        ? '<img src="' + escapeHtml(post.author_image) + '" alt="' + escapeHtml(post.author_name || '') + '" class="pc-avatar-img">'
        : '<span class="pc-avatar-text">' + escapeHtml((post.author_name || '?')[0]) + '</span>';

    var pinnedHtml = post.is_pinned ? '<span class="pc-pinned">[고정]</span>' : '';
    var nBadgeHtml = unread ? '<span class="pc-badge-n">N</span>' : '';

    var thumbHtml = '';
    if (opts.showThumb) {
        var imgs = parseImageArray ? parseImageArray(post.images) : [];
        if (imgs.length > 0) {
            thumbHtml = '<div class="pc-thumb"><img src="' + imgs[0] + '" alt="게시글 첨부 이미지" loading="lazy" onerror="this.parentElement.style.display=\'none\'"></div>';
        }
    }

    var preview = '';
    if (post.content) {
        var text = (post.content || '').substring(0, 120);
        preview = '<p class="pc-preview">' + escapeHtml(text) + (post.content.length > 120 ? '...' : '') + '</p>';
    }

    var clickAttr = opts.clickAttr || '';

    return '<div class="pc-card" ' + clickAttr + '>'
        + '<div class="pc-top">'
        + '<div class="pc-avatar">' + avatarHtml + '</div>'
        + '<span class="pc-author">' + escapeHtml(post.author_name || '알 수 없음') + '</span>'
        + '<span class="pc-dot">&middot;</span>'
        + '<span class="pc-time">' + formatDateWithRelative(post.created_at) + '</span>'
        + '<span class="pc-top-spacer"></span>'
        + nBadgeHtml
        + '</div>'
        + '<div class="pc-body"><div class="pc-text">'
        + pinnedHtml
        + '<h3 class="pc-title">' + escapeHtml(post.title) + '</h3>'
        + preview
        + '</div>' + thumbHtml + '</div>'
        + '<div class="pc-stats">'
        + '<span class="pc-stat"><svg aria-hidden="true" class="icon-sm" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ' + (post.comments_count || 0) + '</span>'
        + '<span class="pc-stat"><svg aria-hidden="true" class="icon-sm" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg> ' + (post.likes_count || 0) + '</span>'
        + '<span class="pc-stat"><svg aria-hidden="true" class="icon-sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ' + (post.views || 0) + '</span>'
        + '</div>'
        + '</div>';
}

/**
 * 댓글 렌더링 (공통)
 * @param {Object} c - 댓글 데이터
 * @param {Object} opts
 *   opts.isReply: 대댓글 여부
 *   opts.canDelete: 삭제 가능 여부
 *   opts.actions: 추가 액션 버튼 HTML
 *   opts.replyAction: 답글 data-action 속성값
 *   opts.deleteAction: 삭제 data-action 속성값
 */
function renderComment(c, opts) {
    opts = opts || {};
    var indent = opts.isReply ? ' gb-comment-reply' : '';
    var replyAction = opts.replyAction || 'show-reply';
    var deleteAction = opts.deleteAction || 'delete-comment';

    var avatarHtml = c.author_image
        ? '<img src="' + escapeHtml(c.author_image) + '" class="gb-comment-avatar" alt="' + escapeHtml(c.author_name || '') + '">'
        : '<div class="gb-comment-avatar gb-post-avatar-default"></div>';

    return '<div class="gb-comment' + indent + '">'
        + '<div class="gb-comment-header">'
        + avatarHtml
        + '<strong>' + escapeHtml(c.author_name || '알 수 없음') + '</strong>'
        + '<span class="gb-comment-date">' + formatDate(c.created_at) + '</span>'
        + '</div>'
        + '<p class="gb-comment-body">' + escapeHtml(c.content || '').replace(/\n/g, '<br>') + '</p>'
        + '<div class="gb-comment-actions">'
        + (opts.showLike ? '<button class="gb-comment-like-btn" data-action="like-comment" data-comment-id="' + c.id + '" data-post-id="' + c.post_id + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg> <span class="gb-comment-likes-num">' + (c.likes_count || 0) + '</span></button>' : '')
        + (!opts.isReply ? '<button class="gb-reply-btn" data-action="' + replyAction + '" data-comment-id="' + c.id + '">답글</button>' : '')
        + (opts.canDelete ? '<button class="gb-delete-comment-btn" data-action="' + deleteAction + '" data-post-id="' + c.post_id + '" data-comment-id="' + c.id + '">삭제</button>' : '')
        + '</div>'
        + (!opts.isReply ? '<div id="reply-input-' + c.id + '" class="gb-reply-input-wrap" style="display:none"><div class="gb-comment-input"><input type="text" class="gb-comment-input-field" id="reply-text-' + c.id + '" placeholder="댓글 입력"><button class="gb-comment-submit-btn" data-action="submit-reply" data-post-id="' + c.post_id + '" data-parent-id="' + c.id + '">등록</button></div></div>' : '')
        + '</div>';
}

console.log('✅ card-components.js 로드 완료');
