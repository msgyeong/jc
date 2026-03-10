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
            container.innerHTML = renderSkeleton('list');
        }

        const result = await apiClient.getPosts(page, 20, currentBoardCategory);

        if (result.success && result.posts) {
            if (result.posts.length === 0) {
                if (page === 1) {
                    const msg = currentBoardCategory === 'notice'
                        ? '등록된 공지가 없습니다'
                        : '등록된 게시글이 없습니다';
                    const cta = currentBoardCategory === 'general'
                        ? { label: '글 작성하기', action: 'handleCreatePost()' }
                        : null;
                    container.innerHTML = renderEmptyState('document', msg, null, cta);
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
            container.innerHTML = renderErrorState('게시글을 불러올 수 없습니다', '잠시 후 다시 시도해주세요', 'loadPosts(1)');
        }
    } catch (error) {
        console.error('게시글 목록 로드 실패:', error);
        container.innerHTML = renderErrorState('게시글을 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'loadPosts(1)');
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
        ? `<span class="pc-pinned">[고정]</span>`
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
                <span class="pc-stat"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${post.comments_count || 0}</span>
                <span class="pc-stat"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg> ${post.likes_count || 0}</span>
                <span class="pc-stat"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${post.views || 0}</span>
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

// ── M-12: 일정 첨부 토글 상태 ──
let postCreateScheduleAttached = false;

function renderScheduleAttachSection(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
        <div class="schedule-attach-section">
            <div class="schedule-attach-header" onclick="toggleScheduleAttach('${containerId}')">
                <span class="schedule-attach-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> 일정 첨부</span>
                <label class="toggle-switch" onclick="event.stopPropagation()">
                    <input type="checkbox" id="schedule-attach-toggle" onchange="toggleScheduleAttach('${containerId}')">
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="schedule-attach-fields" id="schedule-attach-fields" style="display:none">
                <div class="form-group">
                    <label>일정 제목</label>
                    <input type="text" id="schedule-attach-title" placeholder="공지 제목이 기본값으로 사용됩니다">
                </div>
                <div class="form-group">
                    <label>카테고리</label>
                    <select id="schedule-attach-category">
                        <option value="event">행사</option>
                        <option value="meeting">회의</option>
                        <option value="training">교육</option>
                        <option value="other">기타</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>시작 날짜/시간</label>
                    <div class="date-time-row">
                        <input type="date" id="schedule-attach-start-date">
                        <input type="time" id="schedule-attach-start-time" value="09:00">
                    </div>
                </div>
                <div class="form-group">
                    <label>종료 날짜/시간</label>
                    <div class="date-time-row">
                        <input type="date" id="schedule-attach-end-date">
                        <input type="time" id="schedule-attach-end-time" value="18:00">
                    </div>
                </div>
                <div class="form-group">
                    <label>장소</label>
                    <input type="text" id="schedule-attach-location" placeholder="장소를 입력하세요">
                </div>
            </div>
        </div>
    `;
}

function toggleScheduleAttach(containerId) {
    const toggle = document.getElementById('schedule-attach-toggle');
    const fields = document.getElementById('schedule-attach-fields');
    if (!toggle || !fields) return;
    postCreateScheduleAttached = toggle.checked;
    fields.style.display = postCreateScheduleAttached ? '' : 'none';
    // 일정 제목 기본값: 공지 제목
    if (postCreateScheduleAttached) {
        const postTitle = document.getElementById('post-create-title');
        const schedTitle = document.getElementById('schedule-attach-title');
        if (postTitle && schedTitle && !schedTitle.value) {
            schedTitle.value = postTitle.value;
        }
    }
}

function getScheduleAttachData() {
    if (!postCreateScheduleAttached) return null;
    const title = (document.getElementById('schedule-attach-title')?.value || '').trim();
    const category = document.getElementById('schedule-attach-category')?.value || 'event';
    const startDate = document.getElementById('schedule-attach-start-date')?.value || '';
    const startTime = document.getElementById('schedule-attach-start-time')?.value || '09:00';
    const endDate = document.getElementById('schedule-attach-end-date')?.value || '';
    const endTime = document.getElementById('schedule-attach-end-time')?.value || '18:00';
    const location = (document.getElementById('schedule-attach-location')?.value || '').trim();

    if (!startDate) return null;
    return {
        title: title || document.getElementById('post-create-title')?.value?.trim() || '',
        category,
        start_date: `${startDate}T${startTime}:00`,
        end_date: endDate ? `${endDate}T${endTime}:00` : `${startDate}T${endTime}:00`,
        location
    };
}

// ── 게시글 작성 버튼 → 작성 화면 이동 ──
function handleCreatePost() {
    postCreateImageUrls = [];
    postCreateScheduleAttached = false;
    renderPostFormImages('post-create-images-list', [], removePostCreateImage);

    // 현재 탭의 카테고리 자동 적용
    const categoryEl = document.getElementById('post-create-category');
    if (categoryEl) categoryEl.value = currentBoardCategory;

    // 공지 옵션 표시/숨김
    const noticeOpts = document.getElementById('post-create-notice-options');
    if (noticeOpts) noticeOpts.style.display = currentBoardCategory === 'notice' ? '' : 'none';

    // 일정 첨부 섹션 (공지탭일 때만)
    const schedAttachContainer = document.getElementById('post-create-schedule-attach');
    if (schedAttachContainer) {
        if (currentBoardCategory === 'notice') {
            renderScheduleAttachSection('post-create-schedule-attach');
        } else {
            schedAttachContainer.innerHTML = '';
        }
    }

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
        // M-12: 일정 첨부 데이터
        const scheduleData = getScheduleAttachData();
        if (scheduleData) {
            payload.schedule = scheduleData;
        }
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

    container.innerHTML = renderSkeleton('list');

    try {
        const result = await apiClient.getPost(postId);
        if (result.success && result.post) {
            container.innerHTML = renderPostDetail(result.post);
            loadCommentsForPost(postId);
            loadLinkedScheduleForPost(result.post);
        } else {
            container.innerHTML = renderErrorState('게시글을 불러올 수 없습니다', null, `loadPostDetail(${postId})`);
        }
    } catch (err) {
        console.error('게시글 상세 로드 실패:', err);
        container.innerHTML = renderErrorState('게시글을 불러올 수 없습니다', '네트워크 연결을 확인해주세요', `loadPostDetail(${postId})`);
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
            listEl.innerHTML = renderEmptyState('chat', '댓글이 없습니다', '첫 댓글을 남겨보세요');
        }
    } catch (_) {
        listEl.innerHTML = renderErrorState('댓글을 불러올 수 없습니다', null, `loadCommentsForPost(${postId})`);
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
            btn.innerHTML = '<svg class="icon-sm" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"' + (result.liked ? ' fill="#DC2626" stroke="#DC2626"' : '') + '/></svg> <span class="post-detail-likes-count">' + (result.likes_count || 0) + '</span>';
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
        showToast(err.message || '댓글 등록에 실패했습니다.', 'error');
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
                ${post.views > 0 ? `<span><svg class="icon-sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${post.views}</span>` : ''}
                <span class="post-detail-comments-count"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> <span class="num">${post.comments_count || 0}</span></span>
                <button type="button" class="btn-like" data-action="like" data-post-id="${post.id}" aria-pressed="${liked ? 'true' : 'false'}">
                    <svg class="icon-sm" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"${liked ? ' fill="#DC2626" stroke="#DC2626"' : ''}/></svg> <span class="post-detail-likes-count">${post.likes_count || 0}</span>
                </button>
            </div>
            <div id="post-linked-schedule-container"></div>
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
                showToast(result.message || '삭제에 실패했습니다.', 'error');
            }
        })
        .catch((err) => {
            showToast(err.message || '삭제 중 오류가 발생했습니다.', 'error');
        });
}

// ── M-12: 공지 상세에서 연결된 일정 표시 ──
async function loadLinkedScheduleForPost(post) {
    const container = document.getElementById('post-linked-schedule-container');
    if (!container) return;
    const scheduleId = post.linked_schedule_id || post.schedule_id;
    if (!scheduleId) { container.innerHTML = ''; return; }
    try {
        const res = await apiClient.getSchedule(scheduleId);
        const sched = res.schedule || (res.data && res.data) || null;
        if (!sched) { container.innerHTML = ''; return; }
        const catLabel = (typeof CATEGORY_LABELS !== 'undefined' && CATEGORY_LABELS[sched.category]) || sched.category || '';
        const catClass = (typeof CATEGORY_BADGE_CLASS !== 'undefined' && CATEGORY_BADGE_CLASS[sched.category]) || 'badge-other';
        const dateStr = sched.start_date ? new Date(sched.start_date).toLocaleDateString('ko-KR') : '';
        let timeStr = '';
        if (sched.start_date && sched.start_date.includes('T')) {
            const st = sched.start_date.split('T')[1]?.substring(0, 5) || '';
            const et = sched.end_date && sched.end_date.includes('T') ? sched.end_date.split('T')[1]?.substring(0, 5) || '' : '';
            if (st && st !== '00:00') timeStr = et ? `${st}~${et}` : st;
        }
        container.innerHTML = `
            <div class="linked-schedule-banner" onclick="navigateTo('/schedules/${sched.id}')">
                <div class="linked-schedule-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                <div class="linked-schedule-info">
                    <div class="linked-schedule-label">연결된 일정</div>
                    <div class="linked-schedule-title">
                        <span class="schedule-category-badge ${catClass}">${catLabel}</span>
                        ${escapeHtml(sched.title || '')}
                    </div>
                    <div class="linked-schedule-meta">
                        ${dateStr ? `<span>${dateStr}</span>` : ''}
                        ${timeStr ? `<span>${timeStr}</span>` : ''}
                        ${sched.location ? `<span>${escapeHtml(sched.location)}</span>` : ''}
                    </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
        `;
    } catch (_) { container.innerHTML = ''; }
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
