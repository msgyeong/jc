/* ================================================
   영등포 JC — 관리자 게시판 관리
   ================================================ */

let postsState = { page: 1, search: '', category: '', total: 0, totalPages: 0 };

function renderPosts(container) {
    container.innerHTML = `
        <div class="page-toolbar">
            <h2 class="page-title">게시판 관리</h2>
            <span class="page-count" id="posts-count">-</span>
            <div class="search-box">
                <svg class="search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" class="search-input" id="posts-search" placeholder="제목, 작성자 검색…" value="${escapeHtml(postsState.search)}">
            </div>
        </div>
        <div class="filter-bar">
            <select class="filter-select" id="filter-category">
                <option value="">전체 카테고리</option>
                <option value="notice">공지</option>
                <option value="general">일반</option>
            </select>
        </div>
        <div id="posts-table-wrap"></div>
        <div id="posts-pagination"></div>
    `;

    document.getElementById('filter-category').value = postsState.category;

    let searchTimer;
    document.getElementById('posts-search').addEventListener('input', e => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            postsState.search = e.target.value.trim();
            postsState.page = 1;
            loadPosts();
        }, 400);
    });

    document.getElementById('filter-category').addEventListener('change', e => {
        postsState.category = e.target.value;
        postsState.page = 1;
        loadPosts();
    });

    loadPosts();
}

async function loadPosts() {
    const wrap = document.getElementById('posts-table-wrap');
    showTableSkeleton(wrap, 5);

    try {
        const params = new URLSearchParams({
            page: postsState.page,
            limit: 20,
        });
        if (postsState.search) params.set('search', postsState.search);
        if (postsState.category) params.set('category', postsState.category);

        const res = await AdminAPI.get('/api/admin/posts?' + params.toString());
        if (!res.success) throw new Error(res.message);

        const posts = res.posts || res.data?.items || [];
        postsState.total = res.total || 0;
        postsState.totalPages = res.totalPages || 1;

        document.getElementById('posts-count').textContent = '총 ' + postsState.total + '건';

        if (!posts.length) {
            wrap.innerHTML = '<div class="table-wrap"><div class="table-empty"><p>검색 결과가 없습니다.</p></div></div>';
            document.getElementById('posts-pagination').innerHTML = '';
            return;
        }

        let html = `<div class="table-wrap"><table>
            <thead><tr>
                <th>ID</th>
                <th>카테고리</th>
                <th>제목</th>
                <th>작성자</th>
                <th>작성일</th>
                <th>관리</th>
            </tr></thead><tbody>`;

        posts.forEach(p => {
            const pinIcon = p.is_pinned ? ' <span title="고정" style="color:var(--c-warning)">&#x1f4cc;</span>' : '';
            html += `<tr>
                <td class="text-sub text-sm">${p.id}</td>
                <td>${categoryBadge(p.category)}</td>
                <td>
                    <span style="font-weight:500">${escapeHtml(p.title)}</span>${pinIcon}
                </td>
                <td class="text-sub">${escapeHtml(p.author_name || '-')}</td>
                <td class="text-sub text-sm">${formatDate(p.created_at)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-ghost btn-sm" onclick="viewPostComments(${p.id}, '${escapeHtml(p.title).replace(/'/g, "\\'")}')">댓글</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDeletePost(${p.id})">삭제</button>
                    </div>
                </td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        wrap.innerHTML = html;

        renderPagination(
            document.getElementById('posts-pagination'),
            postsState.page, postsState.totalPages,
            p => { postsState.page = p; loadPosts(); }
        );
    } catch (err) {
        wrap.innerHTML = '<div class="table-wrap"><div class="table-empty"><p>게시글 목록을 불러올 수 없습니다.</p></div></div>';
        console.error('Load posts error:', err);
    }
}

function confirmDeletePost(id) {
    openModal(`
        <div class="modal modal-sm">
            <div class="modal-header"><h3>게시글 삭제</h3></div>
            <div class="modal-body"><p>이 게시글을 삭제하시겠습니까?<br>삭제된 게시글은 복구할 수 없습니다.</p></div>
            <div class="modal-footer">
                <button class="btn btn-ghost btn-sm" onclick="closeModal()">취소</button>
                <button class="btn btn-danger btn-sm" onclick="deletePost(${id})">삭제</button>
            </div>
        </div>
    `);
}

async function deletePost(id) {
    try {
        await AdminAPI.delete('/api/admin/posts/' + id);
        showAdminToast('게시글이 삭제되었습니다.');
        closeModal();
        loadPosts();
    } catch (err) {
        showAdminToast('삭제 실패: ' + err.message, 'error');
    }
}

async function viewPostComments(postId, title) {
    try {
        const res = await AdminAPI.get('/api/admin/posts/' + postId + '/comments');
        const comments = res.comments || [];

        let listHtml = '';
        if (comments.length) {
            listHtml = '<ul class="recent-list" style="max-height:300px;overflow-y:auto">';
            comments.forEach(c => {
                listHtml += `
                    <li class="recent-item">
                        <div class="avatar avatar-sm">${escapeHtml((c.author_name || '?').charAt(0))}</div>
                        <div class="recent-text">
                            <div class="recent-name">${escapeHtml(c.author_name || '알 수 없음')}</div>
                            <div class="recent-sub" style="white-space:normal">${escapeHtml(c.content)}</div>
                        </div>
                        <span class="recent-time">${formatDate(c.created_at)}</span>
                        <button class="btn btn-danger btn-sm" onclick="deleteComment(${c.id}, ${postId}, '${escapeHtml(title).replace(/'/g, "\\'")}')">삭제</button>
                    </li>`;
            });
            listHtml += '</ul>';
        } else {
            listHtml = '<div class="table-empty"><p>댓글이 없습니다.</p></div>';
        }

        openModal(`
            <div class="modal">
                <div class="modal-header">
                    <h3>댓글 관리 — ${escapeHtml(title)}</h3>
                    <button class="modal-close" onclick="closeModal()"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>
                <div class="modal-body">${listHtml}</div>
                <div class="modal-footer">
                    <button class="btn btn-ghost btn-sm" onclick="closeModal()">닫기</button>
                </div>
            </div>
        `);
    } catch (err) {
        showAdminToast('댓글을 불러올 수 없습니다.', 'error');
    }
}

async function deleteComment(commentId, postId, title) {
    try {
        await AdminAPI.delete('/api/admin/comments/' + commentId);
        showAdminToast('댓글이 삭제되었습니다.');
        viewPostComments(postId, title);
    } catch (err) {
        showAdminToast('댓글 삭제 실패: ' + err.message, 'error');
    }
}
