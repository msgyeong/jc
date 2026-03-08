// 게시판 기능 (Railway API 연동) — 서브탭 + 카드 재디자인

const MAX_POST_IMAGES = 5;

let currentPostsPage = 0;
let postsLoading = false;
let hasMorePosts = true;
let postsInfiniteScrollSetup = false;
let postCreateImageUrls = [];
let postEditImageUrls = [];

// ── 현재 활성 탭 카테고리 ──
let currentBoardCategory = 'notice';

// ── 게시글 목록 로드 (카테고리별) ──
async function loadPosts(page = 1) {
    if (postsLoading) return;

    const container = document.getElementById('post-list');
    if (!container) return;

    postsLoading = true;

    try {
        if (page === 1) {
            container.innerHTML = '<div class="content-loading">게시글 로딩 중...</div>';
        }

        const result = await apiClient.getPosts(page, 20, currentBoardCategory);

        if (result.success && result.posts) {
            if (result.posts.length === 0) {
                if (page === 1) {
                    const msg = currentBoardCategory === 'notice'
                        ? '등록된 공지가 없습니다.'
                        : '등록된 게시글이 없습니다.';
                    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-message">${msg}</div></div>`;
                }
                hasMorePosts = false;
            } else {
                // 공지탭: pinned 상단 정렬
                let posts = result.posts;
                if (currentBoardCategory === 'notice' && page === 1) {
                    const pinned = posts.filter(p => p.is_pinned);
                    const rest = posts.filter(p => !p.is_pinned);
                    posts = [...pinned, ...rest];
                }

                const postsHtml = posts.map(post => createPostCard(post)).join('');

                if (page === 1) {
                    container.innerHTML = postsHtml;
                } else {
                    container.insertAdjacentHTML('beforeend', postsHtml);
                }

                currentPostsPage = page;
                hasMorePosts = page < result.totalPages;
            }
        } else {
            container.innerHTML = '<div class="error-state">게시글을 불러올 수 없습니다.</div>';
        }
    } catch (error) {
        console.error('게시글 목록 로드 실패:', error);
        container.innerHTML = '<div class="error-state">게시글을 불러올 수 없습니다.</div>';
    } finally {
        postsLoading = false;
    }
}

// ── 게시글 카드 생성 (재디자인) ──
function createPostCard(post) {
    const isNew = isNewContent(post.created_at);
    const unread = isNew && (post.read_by_current_user !== true);
    const hasImages = post.images && post.images.length > 0;
    const firstImage = hasImages ? post.images[0] : null;
    const isPinned = post.is_pinned === true;

    const avatarHtml = post.author_image
        ? `<img src="${post.author_image}" alt="" class="pc-avatar-img">`
        : `<span class="pc-avatar-text">${post.author_name ? escapeHtml(post.author_name[0]) : '?'}</span>`;

    const pinnedHtml = isPinned
        ? `<span class="pc-pinned">📌 [고정]</span>`
        : '';

    const thumbnailHtml = firstImage
        ? `<div class="pc-thumb"><img src="${firstImage}" alt="" onerror="this.parentElement.style.display='none'"></div>`
        : '';

    const nBadgeHtml = unread
        ? `<span class="pc-badge-n">N</span>`
        : '';

    return `
        <div class="pc-card" onclick="navigateTo('/posts/${post.id}')">
            <div class="pc-top">
                <div class="pc-avatar">${avatarHtml}</div>
                <span class="pc-author">${escapeHtml(post.author_name || '알 수 없음')}</span>
                <span class="pc-dot">·</span>
                <span class="pc-time">${formatRelativeTime(post.created_at)}</span>
                <span class="pc-top-spacer"></span>
                ${nBadgeHtml}
            </div>
            <div class="pc-body">
                <div class="pc-text">
                    ${pinnedHtml}
                    <h3 class="pc-title">${escapeHtml(post.title)}</h3>
                    ${post.content ? `<p class="pc-preview">${escapeHtml(post.content.substring(0, 120))}${post.content.length > 120 ? '...' : ''}</p>` : ''}
                </div>
                ${thumbnailHtml}
            </div>
            <div class="pc-stats">
                <span class="pc-stat">💬 ${post.comments_count || 0}</span>
                <span class="pc-stat">❤️ ${post.likes_count || 0}</span>
                <span class="pc-stat">👁️ ${post.views || 0}</span>
            </div>
        </div>
    `;
}

// ── 무한 스크롤 ──
function setupPostsInfiniteScroll() {
    if (postsInfiniteScrollSetup) return;
    const sentinel = document.querySelector('#posts-screen .posts-scroll-sentinel');
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && hasMorePosts && !postsLoading) {
                loadPosts(currentPostsPage + 1);
            }
        });
    }, { rootMargin: '100px' });
    observer.observe(sentinel);
    postsInfiniteScrollSetup = true;
}

// ── 게시판 탭 진입 ──
async function loadPostsScreen() {
    currentPostsPage = 0;
    hasMorePosts = true;
    await loadPosts(1);
    setupPostsInfiniteScroll();
    updateCreatePostBtnVisibility();
}

// ── 서브탭 전환 ──
function switchBoardTab(category) {
    currentBoardCategory = category;

    document.querySelectorAll('.board-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });

    currentPostsPage = 0;
    hasMorePosts = true;
    loadPosts(1);
    updateCreatePostBtnVisibility();
}

// ── FAB 노출: 공지탭은 관리자만 ──
function updateCreatePostBtnVisibility() {
    const btn = document.getElementById('create-post-btn');
    if (!btn) return;

    if (currentBoardCategory === 'notice') {
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        btn.style.display = userInfo.can_post_notice ? '' : 'none';
    } else {
        btn.style.display = '';
    }
}

// ── 이미지 유틸 ──
function sanitizeImageUrls(arr) {
    if (!Array.isArray(arr)) return [];
    return arr
        .filter(u => u && typeof u === 'string' && u.trim().length > 0)
        .map(u => u.trim())
        .slice(0, MAX_POST_IMAGES);
}

function renderPostFormImages(containerId, urls, onRemove) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const list = sanitizeImageUrls(urls);
    el.innerHTML = list.map((url, idx) => `
        <div class="post-form-image-item" data-index="${idx}">
            <img src="${escapeHtml(url)}" alt="첨부" class="post-form-image-thumb" onerror="this.parentElement.classList.add('thumb-error')">
            <button type="button" class="post-form-image-remove" data-index="${idx}" aria-label="제거">×</button>
        </div>
    `).join('');
    list.forEach((_, idx) => {
        const btn = el.querySelector(`.post-form-image-remove[data-index="${idx}"]`);
        if (btn) btn.addEventListener('click', () => onRemove(idx));
    });
    // 이미지 카운트 업데이트
    const countEl = document.getElementById('post-create-images-count');
    if (countEl) countEl.textContent = `(${list.length}/${MAX_POST_IMAGES})`;
}

function getPostCreateImages() {
    return sanitizeImageUrls(postCreateImageUrls);
}

function getPostEditImages() {
    return sanitizeImageUrls(postEditImageUrls);
}

function removePostCreateImage(idx) {
    postCreateImageUrls = getPostCreateImages().filter((_, i) => i !== idx);
    renderPostFormImages('post-create-images-list', postCreateImageUrls, removePostCreateImage);
}

// ── 작성 화면: 파일 선택 ──
async function handlePostCreateFileSelect(e) {
    const file = e.target && e.target.files && e.target.files[0];
    if (!file || getPostCreateImages().length >= MAX_POST_IMAGES) return;
    e.target.value = '';
    const errEl = document.getElementById('post-create-error');
    try {
        const result = await apiClient.uploadPostImage(file);
        if (result && result.url) {
            postCreateImageUrls = getPostCreateImages().concat([result.url]).slice(0, MAX_POST_IMAGES);
            renderPostFormImages('post-create-images-list', postCreateImageUrls, removePostCreateImage);
        }
        if (errEl) errEl.textContent = '';
    } catch (err) {
        if (errEl) {
            errEl.textContent = err.message || '이미지 업로드에 실패했습니다.';
            errEl.classList.add('show');
        }
    }
}

// ── 게시글 작성 버튼 → 작성 화면 이동 ──
function handleCreatePost() {
    postCreateImageUrls = [];
    renderPostFormImages('post-create-images-list', [], removePostCreateImage);

    // 현재 탭의 카테고리 자동 적용
    const categoryEl = document.getElementById('post-create-category');
    if (categoryEl) categoryEl.value = currentBoardCategory;

    // 공지 옵션 표시/숨김
    const noticeOpts = document.getElementById('post-create-notice-options');
    if (noticeOpts) noticeOpts.style.display = currentBoardCategory === 'notice' ? '' : 'none';

    // 폼 초기화
    const titleEl = document.getElementById('post-create-title');
    const contentEl = document.getElementById('post-create-content');
    const pinnedEl = document.getElementById('post-create-is-pinned');
    if (titleEl) titleEl.value = '';
    if (contentEl) contentEl.value = '';
    if (pinnedEl) pinnedEl.checked = false;

    navigateToScreen('post-create');
}

// ── 게시글 작성 폼 제출 ──
async function handlePostCreateSubmit(e) {
    e.preventDefault();
    const titleEl = document.getElementById('post-create-title');
    const contentEl = document.getElementById('post-create-content');
    const errorEl = document.getElementById('post-create-error');
    const submitBtn = document.getElementById('post-create-submit');
    if (!titleEl || !contentEl || !submitBtn) return;

    const title = (titleEl.value || '').trim();
    const content = (contentEl.value || '').trim();

    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('show');
    }
    if (!title) {
        if (errorEl) {
            errorEl.textContent = '제목을 입력해주세요.';
            errorEl.classList.add('show');
        }
        titleEl.focus();
        return;
    }
    if (!content) {
        if (errorEl) {
            errorEl.textContent = '내용을 입력해주세요.';
            errorEl.classList.add('show');
        }
        contentEl.focus();
        return;
    }

    const categoryEl = document.getElementById('post-create-category');
    const category = (categoryEl && categoryEl.value) || 'general';
    if (category === 'notice') {
        const u = JSON.parse(localStorage.getItem('user_info') || '{}');
        if (!u.can_post_notice) {
            if (errorEl) {
                errorEl.textContent = '공지사항은 관리자만 작성할 수 있습니다.';
                errorEl.classList.add('show');
            }
            return;
        }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중...';
    try {
        const images = getPostCreateImages();
        const isPinned = document.getElementById('post-create-is-pinned');
        const payload = {
            title,
            content,
            images,
            category,
            is_pinned: isPinned ? isPinned.checked : false,
        };
        const result = await apiClient.createPost(payload);
        if (result.success) {
            if (typeof loadPostsScreen === 'function') {
                await loadPostsScreen();
            }
            navigateToScreen('posts');
            if (typeof updateNavigation === 'function') {
                updateNavigation('posts');
            }
            titleEl.value = '';
            contentEl.value = '';
            postCreateImageUrls = [];
            renderPostFormImages('post-create-images-list', [], removePostCreateImage);
        } else {
            if (errorEl) {
                errorEl.textContent = result.message || '게시글 작성에 실패했습니다.';
                errorEl.classList.add('show');
            }
        }
    } catch (err) {
        console.error('게시글 작성 실패:', err);
        if (errorEl) {
            errorEl.textContent = err.message || '게시글 작성 중 오류가 발생했습니다.';
            errorEl.classList.add('show');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '등록';
    }
}

// ── 작성 화면 취소 ──
function handlePostCreateCancel() {
    navigateToScreen('posts');
    if (typeof updateNavigation === 'function') {
        updateNavigation('posts');
    }
}

// ── 게시글 상세 화면 표시 ──
function showPostDetailScreen(postId) {
    const detailScreen = document.getElementById('post-detail-screen');
    if (!detailScreen) return;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    detailScreen.classList.add('active');
    loadPostDetail(postId);
}

// ── 게시글 상세 로드 ──
async function loadPostDetail(postId) {
    const container = document.getElementById('post-detail-content');
    if (!container) return;

    container.innerHTML = '<div class="content-loading">로딩 중...</div>';

    try {
        const result = await apiClient.getPost(postId);
        if (result.success && result.post) {
            container.innerHTML = renderPostDetail(result.post);
            loadCommentsForPost(postId);
        } else {
            container.innerHTML = '<div class="error-state">게시글을 불러올 수 없습니다.</div>';
        }
    } catch (err) {
        console.error('게시글 상세 로드 실패:', err);
        container.innerHTML =
            '<div class="error-state">' +
            (err.message || '게시글을 불러올 수 없습니다.') +
            '</div>';
    }
}

// ── 댓글 목록 로드 ──
async function loadCommentsForPost(postId) {
    const listEl = document.getElementById('post-detail-comments-list');
    if (!listEl) return;

    try {
        const result = await apiClient.getPostComments(postId);
        if (result.success && result.comments && result.comments.length > 0) {
            listEl.innerHTML = result.comments.map(c => `
                <div class="comment-item">
                    <div class="comment-author">${escapeHtml(c.author_name || '알 수 없음')}</div>
                    <div class="comment-content">${escapeHtml(c.content || '')}</div>
                    <div class="comment-date">${formatRelativeTime(c.created_at)}</div>
                </div>
            `).join('');
        } else {
            listEl.innerHTML = '<p class="text-muted">댓글이 없습니다.</p>';
        }
    } catch (_) {
        listEl.innerHTML = '<p class="text-muted">댓글을 불러올 수 없습니다.</p>';
    }
}

// ── 공감 토글 ──
async function handlePostLikeClick(postId) {
    const btn = document.querySelector(`[data-action="like"][data-post-id="${postId}"]`);
    if (!btn || btn.disabled) return;

    btn.disabled = true;
    try {
        const result = await apiClient.togglePostLike(postId);
        if (result && result.success) {
            const countEl = btn.querySelector('.post-detail-likes-count');
            if (countEl) countEl.textContent = result.likes_count || 0;
            btn.setAttribute('aria-pressed', result.liked ? 'true' : 'false');
            btn.innerHTML = (result.liked ? '❤️' : '🤍') + ' <span class="post-detail-likes-count">' + (result.likes_count || 0) + '</span>';
        }
    } catch (_) {}
    btn.disabled = false;
}

// ── 댓글 등록 ──
async function handlePostCommentSubmit(postId, content) {
    content = String(content || '').trim();
    if (!content) return;

    try {
        const result = await apiClient.createPostComment(postId, content);
        if (result && result.success) {
            await loadCommentsForPost(postId);
            const numEl = document.querySelector('.post-detail-comments-count .num');
            if (numEl) numEl.textContent = result.comments_count != null ? result.comments_count : (parseInt(numEl.textContent, 10) + 1);
            const form = document.getElementById('post-detail-comment-form');
            if (form) form.reset();
        }
    } catch (err) {
        alert(err.message || '댓글 등록에 실패했습니다.');
    }
}

// ── 게시글 상세 HTML ──
function renderPostDetail(post) {
    const userInfo = typeof currentUser !== 'undefined'
        ? currentUser
        : JSON.parse(localStorage.getItem('user_info') || 'null');
    const userId = userInfo ? userInfo.id : null;
    const isAdmin = userInfo && ['admin', 'super_admin'].includes(userInfo.role);
    const isAuthor = userId && String(post.author_id) === String(userId);
    const canEdit = isAuthor || isAdmin;

    const liked = post.user_has_liked === true;
    const images = post.images && Array.isArray(post.images) ? post.images : [];
    const imagesHtml = images.length > 0
        ? `<div class="post-detail-images">
            ${images.map(url =>
                `<img src="${String(url).replace(/"/g, '&quot;')}" alt="첨부" class="post-detail-image" onerror="this.style.display='none'">`
            ).join('')}
           </div>`
        : '';

    const actionsHtml = canEdit
        ? `<div class="post-detail-actions">
            <button type="button" class="btn btn-secondary btn-sm" onclick="handlePostEdit(${post.id})">수정</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="handlePostDelete(${post.id})">삭제</button>
           </div>`
        : '';

    return `
        <article class="post-detail" data-post-id="${post.id}">
            <div class="post-detail-header">
                <div class="post-author">
                    ${post.author_image
                        ? `<img src="${escapeHtml(post.author_image)}" alt="" class="author-avatar">`
                        : `<div class="author-avatar-placeholder">${post.author_name ? post.author_name[0] : '?'}</div>`
                    }
                    <div class="post-author-info">
                        <span class="author-name">${escapeHtml(post.author_name || '알 수 없음')}</span>
                        <span class="post-date">${formatRelativeTime(post.created_at)}</span>
                    </div>
                </div>
                ${actionsHtml}
            </div>
            <h1 class="post-detail-title">${escapeHtml(post.title || '')}</h1>
            <div class="post-detail-body">${escapeHtml(post.content || '').replace(/\n/g, '<br>')}</div>
            ${imagesHtml}
            <div class="post-detail-meta">
                ${post.views > 0 ? `<span>👁️ ${post.views}</span>` : ''}
                <span class="post-detail-comments-count">💬 <span class="num">${post.comments_count || 0}</span></span>
                <button type="button" class="btn-like" data-action="like" data-post-id="${post.id}" aria-pressed="${liked ? 'true' : 'false'}">
                    ${liked ? '❤️' : '🤍'} <span class="post-detail-likes-count">${post.likes_count || 0}</span>
                </button>
            </div>
            <div class="post-detail-comments">
                <h4>댓글</h4>
                <div class="post-detail-comments-list" id="post-detail-comments-list"></div>
                <form class="post-detail-comment-form" id="post-detail-comment-form" data-post-id="${post.id}">
                    <textarea name="content" placeholder="댓글을 입력하세요" rows="2" maxlength="1000"></textarea>
                    <button type="submit" class="btn btn-primary btn-sm">등록</button>
                </form>
            </div>
        </article>
    `;
}

// ── 상세 뒤로가기 ──
function handlePostDetailBack() {
    navigateToScreen('posts');
    if (typeof updateNavigation === 'function') {
        updateNavigation('posts');
    }
}

// ── 수정 화면 ──
function showPostEditScreen(postId) {
    const editScreen = document.getElementById('post-edit-screen');
    if (!editScreen) return;
    document.getElementById('post-edit-id').value = postId;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    editScreen.classList.add('active');
    loadPostForEdit(postId);
}

async function loadPostForEdit(postId) {
    const titleEl = document.getElementById('post-edit-title');
    const contentEl = document.getElementById('post-edit-content');
    const errorEl = document.getElementById('post-edit-error');
    if (!titleEl || !contentEl) return;

    errorEl.textContent = '';
    titleEl.value = '';
    contentEl.value = '';
    titleEl.disabled = true;
    contentEl.disabled = true;

    try {
        const result = await apiClient.getPost(postId);
        if (result.success && result.post) {
            const p = result.post;
            titleEl.value = p.title || '';
            contentEl.value = p.content || '';
            const catEl = document.getElementById('post-edit-category');
            if (catEl) catEl.value = (p.category === 'notice' ? 'notice' : 'general');
            const sidEl = document.getElementById('post-edit-schedule-id');
            if (sidEl) sidEl.value = (p.schedule_id != null && p.schedule_id !== '') ? p.schedule_id : '';
            postEditImageUrls = Array.isArray(p.images)
                ? p.images.filter(u => u && typeof u === 'string')
                : [];
            renderPostFormImages('post-edit-images-list', postEditImageUrls, removePostEditImage);
        } else {
            errorEl.textContent = '게시글을 불러올 수 없습니다.';
        }
    } catch (err) {
        errorEl.textContent = err.message || '게시글을 불러올 수 없습니다.';
    } finally {
        titleEl.disabled = false;
        contentEl.disabled = false;
    }
}

async function handlePostEditSubmit(e) {
    e.preventDefault();
    const idEl = document.getElementById('post-edit-id');
    const titleEl = document.getElementById('post-edit-title');
    const contentEl = document.getElementById('post-edit-content');
    const errorEl = document.getElementById('post-edit-error');
    const submitBtn = document.getElementById('post-edit-submit');
    if (!idEl || !titleEl || !contentEl || !submitBtn) return;

    const postId = idEl.value.trim();
    const title = titleEl.value.trim();
    const content = contentEl.value.trim();

    errorEl.textContent = '';
    if (!title) { errorEl.textContent = '제목을 입력해주세요.'; titleEl.focus(); return; }
    if (!content) { errorEl.textContent = '내용을 입력해주세요.'; contentEl.focus(); return; }

    const categoryEl = document.getElementById('post-edit-category');
    const scheduleIdEl = document.getElementById('post-edit-schedule-id');
    const category = (categoryEl && categoryEl.value) || 'general';
    const scheduleId = scheduleIdEl && scheduleIdEl.value && scheduleIdEl.value.trim()
        ? parseInt(scheduleIdEl.value.trim(), 10) : null;

    setButtonLoading(submitBtn, true);
    try {
        const images = getPostEditImages();
        const payload = { title, content, images, category };
        if (scheduleId !== null && !isNaN(scheduleId) && scheduleId > 0) payload.schedule_id = scheduleId;
        else payload.schedule_id = null;
        const result = await apiClient.updatePost(postId, payload);
        if (result && result.success) {
            if (typeof showPostDetailScreen === 'function') {
                showPostDetailScreen(postId);
            }
        } else {
            errorEl.textContent = (result && result.message) || '수정에 실패했습니다.';
        }
    } catch (err) {
        errorEl.textContent = err.message || '수정 중 오류가 발생했습니다.';
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// ── 수정 이미지 ──
function handlePostEditAddUrl() {
    const input = document.getElementById('post-edit-image-url');
    if (!input || getPostEditImages().length >= MAX_POST_IMAGES) return;
    const url = (input.value || '').trim();
    if (!url) return;
    try { new URL(url); } catch (_) { return; }
    postEditImageUrls = getPostEditImages().concat([url]).slice(0, MAX_POST_IMAGES);
    renderPostFormImages('post-edit-images-list', postEditImageUrls, removePostEditImage);
    input.value = '';
}

function removePostEditImage(idx) {
    postEditImageUrls = getPostEditImages().filter((_, i) => i !== idx);
    renderPostFormImages('post-edit-images-list', postEditImageUrls, removePostEditImage);
}

async function handlePostEditFileSelect(e) {
    const file = e.target && e.target.files && e.target.files[0];
    if (!file || getPostEditImages().length >= MAX_POST_IMAGES) return;
    e.target.value = '';
    try {
        const result = await apiClient.uploadPostImage(file);
        if (result && result.url) {
            postEditImageUrls = getPostEditImages().concat([result.url]).slice(0, MAX_POST_IMAGES);
            renderPostFormImages('post-edit-images-list', postEditImageUrls, removePostEditImage);
        }
    } catch (_) {}
}

function handlePostEditBack() {
    const idEl = document.getElementById('post-edit-id');
    const postId = idEl ? idEl.value : null;
    if (postId && typeof showPostDetailScreen === 'function') {
        showPostDetailScreen(postId);
    } else {
        navigateToScreen('posts');
        if (typeof updateNavigation === 'function') updateNavigation('posts');
    }
}

function handlePostEdit(postId) {
    showPostEditScreen(postId);
}

function handlePostDelete(postId) {
    if (!confirm('이 게시글을 삭제할까요?')) return;
    apiClient.deletePost(postId)
        .then((result) => {
            if (result && result.success) {
                handlePostDetailBack();
            } else {
                alert(result.message || '삭제에 실패했습니다.');
            }
        })
        .catch((err) => {
            alert(err.message || '삭제 중 오류가 발생했습니다.');
        });
}

// ── DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', () => {
    // 서브탭 클릭 이벤트
    document.querySelectorAll('.board-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchBoardTab(tab.dataset.category);
        });
    });

    // 게시판 화면 활성화 감지
    const postsScreen = document.getElementById('posts-screen');
    if (postsScreen) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (postsScreen.classList.contains('active')) {
                        if (currentPostsPage === 0) {
                            loadPosts(1);
                            setupPostsInfiniteScroll();
                        }
                    }
                }
            });
        });
        observer.observe(postsScreen, { attributes: true });
    }

    // 게시글 작성 버튼
    const createPostBtn = document.getElementById('create-post-btn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', handleCreatePost);
    }

    // 게시글 작성 폼
    const postCreateForm = document.getElementById('post-create-form');
    if (postCreateForm) {
        postCreateForm.addEventListener('submit', handlePostCreateSubmit);
    }
    const postCreateBack = document.getElementById('post-create-back');
    if (postCreateBack) {
        postCreateBack.addEventListener('click', handlePostCreateCancel);
    }

    // 이미지 파일 선택
    const postCreateUploadBtn = document.getElementById('post-create-upload-btn');
    const postCreateFileInput = document.getElementById('post-create-image-file');
    if (postCreateUploadBtn && postCreateFileInput) {
        postCreateUploadBtn.addEventListener('click', () => postCreateFileInput.click());
    }
    if (postCreateFileInput) {
        postCreateFileInput.addEventListener('change', handlePostCreateFileSelect);
    }

    // 수정 화면 이벤트
    const postEditAddUrlBtn = document.getElementById('post-edit-add-url-btn');
    if (postEditAddUrlBtn) {
        postEditAddUrlBtn.addEventListener('click', handlePostEditAddUrl);
    }
    const postEditUploadBtn = document.getElementById('post-edit-upload-btn');
    const postEditFileInput = document.getElementById('post-edit-image-file');
    if (postEditUploadBtn && postEditFileInput) {
        postEditUploadBtn.addEventListener('click', () => postEditFileInput.click());
    }
    if (postEditFileInput) {
        postEditFileInput.addEventListener('change', handlePostEditFileSelect);
    }

    const postDetailBack = document.getElementById('post-detail-back');
    if (postDetailBack) {
        postDetailBack.addEventListener('click', handlePostDetailBack);
    }

    const postEditForm = document.getElementById('post-edit-form');
    if (postEditForm) {
        postEditForm.addEventListener('submit', handlePostEditSubmit);
    }
    const postEditBack = document.getElementById('post-edit-back');
    if (postEditBack) {
        postEditBack.addEventListener('click', handlePostEditBack);
    }

    // 상세: 공감/댓글 이벤트 위임
    document.addEventListener('click', (e) => {
        const likeBtn = e.target.closest('[data-action="like"][data-post-id]');
        if (likeBtn) {
            e.preventDefault();
            handlePostLikeClick(likeBtn.dataset.postId);
        }
    });
    document.addEventListener('submit', (e) => {
        const form = e.target.closest('.post-detail-comment-form');
        if (form) {
            e.preventDefault();
            const postId = form.dataset.postId;
            const contentEl = form.querySelector('[name="content"]');
            if (postId && contentEl) {
                handlePostCommentSubmit(postId, contentEl.value);
            }
        }
    });
});

console.log('✅ Posts 모듈 로드 완료 (서브탭 + 카드 재디자인)');
