// 공지사항 기능

// 공지사항 화면 로드
async function loadNoticesScreen() {
    const container = document.getElementById('notice-list');
    container.innerHTML = '<div class="content-loading">공지사항 로딩 중...</div>';
    
    // 권한 확인 (공지 작성 권한)
    await checkNoticePermission();
    
    await loadNotices();
}

// 공지 작성 권한 확인
async function checkNoticePermission() {
    const createBtn = document.getElementById('create-notice-btn');
    
    if (CONFIG.DEMO_MODE) {
        createBtn.style.display = 'block'; // 데모 모드에서는 보이기
        return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 사용자의 role_permissions 확인
        const { data, error } = await supabase
            .from('members')
            .select('jc_role, role_permissions(can_post_notice)')
            .eq('user_id', user.id)
            .single();

        if (error) throw error;

        if (data?.role_permissions?.can_post_notice) {
            createBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('권한 확인 오류:', error);
    }
}

// 공지사항 목록 로드
async function loadNotices() {
    const container = document.getElementById('notice-list');
    
    if (CONFIG.DEMO_MODE) {
        // 데모 모드: 샘플 공지사항
        const demoNotices = Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            title: `공지사항 ${i + 1}`,
            created_at: new Date(Date.now() - i * 86400000).toISOString(),
            is_pinned: i === 0,
            attendance_survey_enabled: i === 1,
            comment_count: Math.floor(Math.random() * 10),
            like_count: Math.floor(Math.random() * 20),
            author: { name: `관리자${i + 1}` }
        }));
        
        renderNotices(demoNotices);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('notices')
            .select(`
                id, title, created_at, is_pinned, attendance_survey_enabled,
                comment_count, like_count,
                author:members!notices_author_id_fkey(name)
            `)
            .eq('is_deleted', false)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        renderNotices(data || []);
    } catch (error) {
        console.error('공지사항 로드 오류:', error);
        container.innerHTML = '<div class="empty-state"><div class="empty-state-message">공지사항을 불러올 수 없습니다</div></div>';
    }
}

// 공지사항 렌더링
function renderNotices(notices) {
    const container = document.getElementById('notice-list');
    
    if (notices.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📢</div><div class="empty-state-message">공지사항이 없습니다</div></div>';
        return;
    }

    container.innerHTML = notices.map(notice => `
        <div class="card" onclick="navigateToNoticeDetail(${notice.id})">
            <div class="card-header">
                <div class="card-title">
                    ${notice.title}
                    ${notice.is_pinned ? '<span class="pinned-badge">고정</span>' : ''}
                    ${isNew(notice.created_at) ? '<span class="new-badge">N</span>' : ''}
                </div>
            </div>
            <div class="card-meta">
                <span>${notice.author?.name || '관리자'}</span>
                <span class="card-date">${formatDate(notice.created_at)}</span>
            </div>
            <div class="card-stats">
                <span class="card-stat">💬 ${notice.comment_count || 0}</span>
                <span class="card-stat">👍 ${notice.like_count || 0}</span>
                ${notice.attendance_survey_enabled ? '<span class="card-stat">✅ 참석 조사</span>' : ''}
            </div>
        </div>
    `).join('');
}

// 공지사항 작성 버튼 클릭
function handleCreateNotice() {
    alert('공지사항 작성 화면은 개발 중입니다.');
}
