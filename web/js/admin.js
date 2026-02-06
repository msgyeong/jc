// 관리자 페이지 JavaScript

// 페이지 초기화
function initAdminPage() {
    console.log('🔧 관리자 페이지 초기화...');
    
    // 관리자 권한 확인
    if (!checkAdminPermission()) {
        showError('admin-error', '관리자 권한이 없습니다.');
        setTimeout(() => navigateTo('/home'), 2000);
        return;
    }

    // 탭 전환 이벤트
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = tab.dataset.tab;
            switchAdminTab(target);
        });
    });

    // 기본 탭 로드
    switchAdminTab('pending-users');
}

// 관리자 권한 확인
function checkAdminPermission() {
    const user = storage.get(STORAGE_KEYS.USER_SESSION);
    if (!user) return false;
    
    return user.role === 'super_admin' || user.role === 'admin';
}

// 탭 전환
function switchAdminTab(tabName) {
    // 모든 탭 비활성화
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 모든 콘텐츠 숨기기
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 선택된 탭 활성화
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    const activeContent = document.getElementById(`${tabName}-tab`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
    
    // 탭별 데이터 로드
    switch(tabName) {
        case 'pending-users':
            loadPendingUsers();
            break;
        case 'all-users':
            loadAllUsers();
            break;
        case 'content-management':
            loadContentManagement();
            break;
    }
}

// ============================================
// 승인 대기 회원 관리
// ============================================

async function loadPendingUsers() {
    const container = document.getElementById('pending-users-list');
    
    try {
        if (CONFIG.DEMO_MODE) {
            const demoUsers = getDemoPendingUsers();
            renderPendingUsers(demoUsers);
            return;
        }
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        renderPendingUsers(data || []);
    } catch (error) {
        console.error('승인 대기 회원 로딩 실패:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p>회원 정보를 불러올 수 없습니다.</p>
                <p class="error-detail">${error.message}</p>
            </div>
        `;
    }
}

function renderPendingUsers(users) {
    const container = document.getElementById('pending-users-list');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>승인 대기 중인 회원이 없습니다.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-info">
                <div class="user-avatar">
                    ${user.profile_image ? 
                        `<img src="${user.profile_image}" alt="${user.name}">` :
                        `<div class="avatar-placeholder">${user.name.charAt(0)}</div>`
                    }
                </div>
                <div class="user-details">
                    <h3>${user.name}</h3>
                    <p class="user-email">${user.email}</p>
                    <p class="user-meta">
                        ${user.phone ? `📞 ${user.phone}` : ''}
                        ${user.birth_date ? `🎂 ${formatDate(user.birth_date)}` : ''}
                    </p>
                    <p class="user-date">가입 신청: ${formatDateTime(user.created_at)}</p>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-success" onclick="approveUser('${user.id}', '${user.name}')">
                    ✅ 승인
                </button>
                <button class="btn btn-danger" onclick="rejectUser('${user.id}', '${user.name}')">
                    ❌ 거부
                </button>
            </div>
        </div>
    `).join('');
}

// 회원 승인
async function approveUser(userId, userName) {
    if (!confirm(`${userName} 님을 승인하시겠습니까?`)) return;
    
    try {
        if (CONFIG.DEMO_MODE) {
            alert('✅ 데모 모드: 승인 완료 (실제로는 저장되지 않음)');
            loadPendingUsers();
            return;
        }
        
        const { error } = await supabase
            .from('users')
            .update({ 
                status: 'active',
                role: 'member',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) throw error;
        
        alert(`✅ ${userName} 님이 승인되었습니다.`);
        loadPendingUsers();
    } catch (error) {
        console.error('회원 승인 실패:', error);
        alert('❌ 승인 처리 중 오류가 발생했습니다.');
    }
}

// 회원 거부
async function rejectUser(userId, userName) {
    if (!confirm(`${userName} 님의 가입을 거부하시겠습니까?\n\n해당 회원의 계정이 삭제됩니다.`)) return;
    
    try {
        if (CONFIG.DEMO_MODE) {
            alert('✅ 데모 모드: 거부 완료 (실제로는 삭제되지 않음)');
            loadPendingUsers();
            return;
        }
        
        // Supabase Auth에서 사용자 삭제 (관리자 권한 필요)
        const { error } = await supabase.auth.admin.deleteUser(userId);
        
        if (error) throw error;
        
        alert(`✅ ${userName} 님의 가입이 거부되었습니다.`);
        loadPendingUsers();
    } catch (error) {
        console.error('회원 거부 실패:', error);
        alert('❌ 거부 처리 중 오류가 발생했습니다.\n\nSupabase 대시보드에서 직접 삭제해주세요.');
    }
}

// ============================================
// 전체 회원 관리
// ============================================

async function loadAllUsers() {
    const container = document.getElementById('all-users-list');
    
    try {
        if (CONFIG.DEMO_MODE) {
            const demoUsers = getDemoAllUsers();
            renderAllUsers(demoUsers);
            return;
        }
        
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        renderAllUsers(data || []);
    } catch (error) {
        console.error('전체 회원 로딩 실패:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p>회원 정보를 불러올 수 없습니다.</p>
            </div>
        `;
    }
}

function renderAllUsers(users) {
    const container = document.getElementById('all-users-list');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>등록된 회원이 없습니다.</p>
            </div>
        `;
        return;
    }
    
    // 역할별 필터링
    const currentUser = storage.get(STORAGE_KEYS.USER_SESSION);
    const isSuperAdmin = currentUser?.role === 'super_admin';
    
    container.innerHTML = users.map(user => {
        const roleOptions = getRoleOptions(user.role, isSuperAdmin);
        const statusBadge = getStatusBadge(user.status);
        const roleBadge = getRoleBadge(user.role);
        
        return `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-info">
                    <div class="user-avatar">
                        ${user.profile_image ? 
                            `<img src="${user.profile_image}" alt="${user.name}">` :
                            `<div class="avatar-placeholder">${user.name.charAt(0)}</div>`
                        }
                    </div>
                    <div class="user-details">
                        <h3>
                            ${user.name}
                            ${statusBadge}
                            ${roleBadge}
                        </h3>
                        <p class="user-email">${user.email}</p>
                        <p class="user-meta">
                            ${user.phone ? `📞 ${user.phone}` : ''}
                            ${user.birth_date ? `🎂 ${formatDate(user.birth_date)}` : ''}
                        </p>
                        <p class="user-date">가입일: ${formatDate(user.created_at)}</p>
                    </div>
                </div>
                <div class="user-actions">
                    ${user.id !== currentUser?.id ? `
                        <select class="role-select" onchange="changeUserRole('${user.id}', this.value, '${user.name}')">
                            ${roleOptions}
                        </select>
                        ${user.status === 'active' ? `
                            <button class="btn btn-warning" onclick="suspendUser('${user.id}', '${user.name}')">
                                ⏸️ 정지
                            </button>
                        ` : user.status === 'suspended' ? `
                            <button class="btn btn-success" onclick="activateUser('${user.id}', '${user.name}')">
                                ▶️ 복구
                            </button>
                        ` : ''}
                    ` : '<span class="text-muted">본인 계정</span>'}
                </div>
            </div>
        `;
    }).join('');
}

function getRoleOptions(currentRole, isSuperAdmin) {
    const roles = [
        { value: 'member', label: '일반 회원' },
        { value: 'admin', label: '관리자' }
    ];
    
    if (isSuperAdmin) {
        roles.push({ value: 'super_admin', label: '총관리자' });
    }
    
    return roles.map(role => 
        `<option value="${role.value}" ${role.value === currentRole ? 'selected' : ''}>
            ${role.label}
        </option>`
    ).join('');
}

function getStatusBadge(status) {
    const badges = {
        'active': '<span class="badge badge-success">활성</span>',
        'pending': '<span class="badge badge-warning">대기</span>',
        'suspended': '<span class="badge badge-danger">정지</span>'
    };
    return badges[status] || '';
}

function getRoleBadge(role) {
    const badges = {
        'super_admin': '<span class="badge badge-admin">총관리자</span>',
        'admin': '<span class="badge badge-admin">관리자</span>',
        'member': '<span class="badge badge-member">회원</span>',
        'pending': '<span class="badge badge-pending">미승인</span>'
    };
    return badges[role] || '';
}

// 회원 역할 변경
async function changeUserRole(userId, newRole, userName) {
    if (!confirm(`${userName} 님의 권한을 변경하시겠습니까?`)) {
        loadAllUsers(); // 선택 취소 시 리로드
        return;
    }
    
    try {
        if (CONFIG.DEMO_MODE) {
            alert('✅ 데모 모드: 권한 변경 완료 (실제로는 저장되지 않음)');
            loadAllUsers();
            return;
        }
        
        const { error } = await supabase
            .from('users')
            .update({ 
                role: newRole,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) throw error;
        
        alert(`✅ ${userName} 님의 권한이 변경되었습니다.`);
        loadAllUsers();
    } catch (error) {
        console.error('권한 변경 실패:', error);
        alert('❌ 권한 변경 중 오류가 발생했습니다.');
        loadAllUsers();
    }
}

// 회원 정지
async function suspendUser(userId, userName) {
    if (!confirm(`${userName} 님을 정지하시겠습니까?`)) return;
    
    try {
        if (CONFIG.DEMO_MODE) {
            alert('✅ 데모 모드: 정지 완료 (실제로는 저장되지 않음)');
            loadAllUsers();
            return;
        }
        
        const { error } = await supabase
            .from('users')
            .update({ 
                status: 'suspended',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) throw error;
        
        alert(`✅ ${userName} 님이 정지되었습니다.`);
        loadAllUsers();
    } catch (error) {
        console.error('회원 정지 실패:', error);
        alert('❌ 정지 처리 중 오류가 발생했습니다.');
    }
}

// 회원 복구
async function activateUser(userId, userName) {
    if (!confirm(`${userName} 님을 복구하시겠습니까?`)) return;
    
    try {
        if (CONFIG.DEMO_MODE) {
            alert('✅ 데모 모드: 복구 완료 (실제로는 저장되지 않음)');
            loadAllUsers();
            return;
        }
        
        const { error } = await supabase
            .from('users')
            .update({ 
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (error) throw error;
        
        alert(`✅ ${userName} 님이 복구되었습니다.`);
        loadAllUsers();
    } catch (error) {
        console.error('회원 복구 실패:', error);
        alert('❌ 복구 처리 중 오류가 발생했습니다.');
    }
}

// ============================================
// 콘텐츠 관리
// ============================================

async function loadContentManagement() {
    const container = document.getElementById('content-management-list');
    
    try {
        if (CONFIG.DEMO_MODE) {
            const demoContent = getDemoContentManagement();
            renderContentManagement(demoContent);
            return;
        }
        
        // 최근 게시글 및 댓글 로드
        const [postsResult, commentsResult] = await Promise.all([
            supabase
                .from('posts')
                .select(`
                    *,
                    author:users(name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(20),
            supabase
                .from('comments')
                .select(`
                    *,
                    author:users(name, email),
                    post:posts(title)
                `)
                .order('created_at', { ascending: false })
                .limit(20)
        ]);
        
        if (postsResult.error) throw postsResult.error;
        if (commentsResult.error) throw commentsResult.error;
        
        renderContentManagement({
            posts: postsResult.data || [],
            comments: commentsResult.data || []
        });
    } catch (error) {
        console.error('콘텐츠 관리 로딩 실패:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p>콘텐츠를 불러올 수 없습니다.</p>
            </div>
        `;
    }
}

function renderContentManagement(content) {
    const container = document.getElementById('content-management-list');
    
    const postsHtml = content.posts.length > 0 ? `
        <div class="content-section">
            <h3>최근 게시글</h3>
            ${content.posts.map(post => `
                <div class="content-item" data-id="${post.id}">
                    <div class="content-info">
                        <h4>${post.title}</h4>
                        <p class="content-meta">
                            작성자: ${post.author?.name || '알 수 없음'} | 
                            ${formatDateTime(post.created_at)} |
                            👁️ ${post.views} 👍 ${post.likes_count} 💬 ${post.comments_count}
                        </p>
                    </div>
                    <div class="content-actions">
                        <button class="btn btn-danger btn-sm" onclick="deletePost('${post.id}', '${post.title}')">
                            🗑️ 삭제
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : '';
    
    const commentsHtml = content.comments.length > 0 ? `
        <div class="content-section">
            <h3>최근 댓글</h3>
            ${content.comments.map(comment => `
                <div class="content-item" data-id="${comment.id}">
                    <div class="content-info">
                        <p>${comment.content}</p>
                        <p class="content-meta">
                            작성자: ${comment.author?.name || '알 수 없음'} | 
                            게시글: ${comment.post?.title || '알 수 없음'} |
                            ${formatDateTime(comment.created_at)}
                        </p>
                    </div>
                    <div class="content-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteComment('${comment.id}')">
                            🗑️ 삭제
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : '';
    
    container.innerHTML = postsHtml + commentsHtml || `
        <div class="empty-state">
            <p>관리할 콘텐츠가 없습니다.</p>
        </div>
    `;
}

// 게시글 삭제
async function deletePost(postId, title) {
    if (!confirm(`"${title}" 게시글을 삭제하시겠습니까?`)) return;
    
    try {
        if (CONFIG.DEMO_MODE) {
            alert('✅ 데모 모드: 삭제 완료 (실제로는 삭제되지 않음)');
            loadContentManagement();
            return;
        }
        
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);
        
        if (error) throw error;
        
        alert('✅ 게시글이 삭제되었습니다.');
        loadContentManagement();
    } catch (error) {
        console.error('게시글 삭제 실패:', error);
        alert('❌ 삭제 중 오류가 발생했습니다.');
    }
}

// 댓글 삭제
async function deleteComment(commentId) {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    
    try {
        if (CONFIG.DEMO_MODE) {
            alert('✅ 데모 모드: 삭제 완료 (실제로는 삭제되지 않음)');
            loadContentManagement();
            return;
        }
        
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);
        
        if (error) throw error;
        
        alert('✅ 댓글이 삭제되었습니다.');
        loadContentManagement();
    } catch (error) {
        console.error('댓글 삭제 실패:', error);
        alert('❌ 삭제 중 오류가 발생했습니다.');
    }
}

// ============================================
// 데모 데이터
// ============================================

function getDemoPendingUsers() {
    return [
        {
            id: '1',
            name: '홍길동',
            email: 'hong@example.com',
            phone: '010-1234-5678',
            birth_date: '1990-01-01',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
            status: 'pending',
            role: 'pending'
        },
        {
            id: '2',
            name: '김영희',
            email: 'kim@example.com',
            phone: '010-9876-5432',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
            status: 'pending',
            role: 'pending'
        }
    ];
}

function getDemoAllUsers() {
    return [
        {
            id: 'current-user',
            name: '테스트 관리자',
            email: 'admin@example.com',
            phone: '010-0000-0000',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            status: 'active',
            role: 'super_admin'
        },
        {
            id: '3',
            name: '이철수',
            email: 'lee@example.com',
            phone: '010-1111-2222',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
            status: 'active',
            role: 'admin'
        },
        {
            id: '4',
            name: '박민수',
            email: 'park@example.com',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            status: 'active',
            role: 'member'
        },
        ...getDemoPendingUsers()
    ];
}

function getDemoContentManagement() {
    return {
        posts: [
            {
                id: '1',
                title: '첫 번째 게시글입니다',
                author: { name: '박민수', email: 'park@example.com' },
                created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                views: 42,
                likes_count: 5,
                comments_count: 3
            },
            {
                id: '2',
                title: '공지사항 - 정기 모임',
                author: { name: '이철수', email: 'lee@example.com' },
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                views: 128,
                likes_count: 12,
                comments_count: 8
            }
        ],
        comments: [
            {
                id: '1',
                content: '좋은 글 감사합니다!',
                author: { name: '홍길동', email: 'hong@example.com' },
                post: { title: '첫 번째 게시글입니다' },
                created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
            },
            {
                id: '2',
                content: '참석하겠습니다.',
                author: { name: '김영희', email: 'kim@example.com' },
                post: { title: '공지사항 - 정기 모임' },
                created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
            }
        ]
    };
}

// 날짜/시간 포맷팅
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}
