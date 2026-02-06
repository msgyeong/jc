// 게시판 기능

let postsPage = 1;
const postsPerPage = 20;
let isLoadingPosts = false;
let hasMorePosts = true;

// 게시판 화면 로드
async function loadPostsScreen() {
    // 초기화
    postsPage = 1;
    hasMorePosts = true;
    const container = document.getElementById('post-list');
    container.innerHTML = '<div class="content-loading">게시글 로딩 중...</div>';
    
    await loadPosts();
    
    // 무한 스크롤 이벤트 리스너
    const screenContent = document.querySelector('#posts-screen .screen-content');
    screenContent.addEventListener('scroll', handlePostsScroll);
}

// 게시글 목록 로드
async function loadPosts() {
    if (isLoadingPosts || !hasMorePosts) return;
    
    isLoadingPosts = true;
    const container = document.getElementById('post-list');
    
    if (CONFIG.DEMO_MODE) {
        // 데모 모드: 샘플 게시글
        const demoPosts = Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            title: `게시글 제목 ${i + 1}`,
            content: '게시글 내용 미리보기...',
            author: { name: `회원${i + 1}` },
            created_at: new Date(Date.now() - i * 86400000).toISOString(),
            comment_count: Math.floor(Math.random() * 10),
            like_count: Math.floor(Math.random() * 20),
            image_urls: i % 3 === 0 ? ['https://via.placeholder.com/150'] : []
        }));
        
        renderPosts(demoPosts);
        hasMorePosts = false;
        isLoadingPosts = false;
        return;
    }

    try {
        const from = (postsPage - 1) * postsPerPage;
        const to = from + postsPerPage - 1;

        const { data, error, count } = await supabase
            .from('posts')
            .select(`
                id, title, content, created_at, comment_count, like_count, image_urls,
                author:members!posts_author_id_fkey(name)
            `, { count: 'exact' })
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        if (postsPage === 1) {
            container.innerHTML = '';
        }

        if (!data || data.length === 0) {
            if (postsPage === 1) {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-message">게시글이 없습니다</div></div>';
            }
            hasMorePosts = false;
        } else {
            renderPosts(data);
            postsPage++;
            hasMorePosts = (from + data.length) < count;
        }
    } catch (error) {
        console.error('게시글 로드 오류:', error);
        if (postsPage === 1) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-message">게시글을 불러올 수 없습니다</div></div>';
        }
    } finally {
        isLoadingPosts = false;
    }
}

// 게시글 렌더링
function renderPosts(posts) {
    const container = document.getElementById('post-list');
    
    const postsHTML = posts.map(post => `
        <div class="card" onclick="navigateToPostDetail(${post.id})">
            <div class="card-header">
                <div class="card-title">
                    ${post.title}
                    ${isNew(post.created_at) ? '<span class="new-badge">N</span>' : ''}
                </div>
            </div>
            ${post.content ? `
                <div class="card-preview" style="font-size: 14px; color: var(--text-secondary); margin: 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${post.content.substring(0, 100)}...
                </div>
            ` : ''}
            <div class="card-meta">
                <span>${post.author?.name || '알 수 없음'}</span>
                <span class="card-date">${formatDate(post.created_at)}</span>
            </div>
            <div class="card-stats">
                <span class="card-stat">💬 ${post.comment_count || 0}</span>
                <span class="card-stat">👍 ${post.like_count || 0}</span>
                ${post.image_urls && post.image_urls.length > 0 ? `<span class="card-stat">🖼️ ${post.image_urls.length}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    if (postsPage === 1) {
        container.innerHTML = postsHTML;
    } else {
        container.innerHTML += postsHTML;
    }
}

// 무한 스크롤 핸들러
function handlePostsScroll(e) {
    const element = e.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 100) {
        loadPosts();
    }
}

// 게시글 상세로 이동 (임시)
function navigateToPostDetail(id) {
    alert(`게시글 상세 (ID: ${id}) 화면은 개발 중입니다.`);
}

// 게시글 작성 버튼 클릭
function handleCreatePost() {
    alert('게시글 작성 화면은 개발 중입니다.');
}
