/* ================================================
   영등포 JC — 관리자 대시보드
   ================================================ */

function renderDashboard(container) {
    container.innerHTML = `
        <div class="stats-grid" id="stats-grid">
            <div class="stat-card"><div class="skeleton skeleton-cell" style="width:100%;height:60px"></div></div>
            <div class="stat-card"><div class="skeleton skeleton-cell" style="width:100%;height:60px"></div></div>
            <div class="stat-card"><div class="skeleton skeleton-cell" style="width:100%;height:60px"></div></div>
            <div class="stat-card"><div class="skeleton skeleton-cell" style="width:100%;height:60px"></div></div>
        </div>
        <div class="two-col" id="dashboard-activity">
            <div class="card"><div class="card-header">최근 가입 회원</div><div class="card-body"><div class="skeleton skeleton-cell" style="width:100%;height:120px"></div></div></div>
            <div class="card"><div class="card-header">최근 게시글</div><div class="card-body"><div class="skeleton skeleton-cell" style="width:100%;height:120px"></div></div></div>
        </div>
    `;

    loadDashboardStats();
    loadRecentActivity();
}

async function loadDashboardStats() {
    try {
        const res = await AdminAPI.get('/api/admin/dashboard/stats');
        if (!res.success) return;
        const d = res.data;

        document.getElementById('stats-grid').innerHTML = `
            <div class="stat-card">
                <div class="stat-icon blue">
                    <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${d.members.total}</div>
                    <div class="stat-label">전체 회원</div>
                </div>
            </div>
            <div class="stat-card stat-card-clickable" onclick="membersState.status='pending';membersState.page=1;navigateAdmin('members')" title="승인 대기 회원 목록 보기">
                <div class="stat-icon yellow">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${d.members.pending}</div>
                    <div class="stat-label">승인 대기</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${d.posts.total}</div>
                    <div class="stat-label">전체 게시글</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red">
                    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div class="stat-info">
                    <div class="stat-value">${d.schedules.total}</div>
                    <div class="stat-label">전체 일정</div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Dashboard stats error:', err);
    }
}

async function loadRecentActivity() {
    try {
        const res = await AdminAPI.get('/api/admin/dashboard/recent-activity');
        if (!res.success) return;
        const d = res.data;

        let membersHtml = '';
        if (d.recent_members && d.recent_members.length) {
            membersHtml = '<ul class="recent-list">';
            d.recent_members.forEach(m => {
                membersHtml += `
                    <li class="recent-item">
                        <div class="avatar avatar-sm">${escapeHtml((m.name || '?').charAt(0))}</div>
                        <div class="recent-text">
                            <div class="recent-name">${escapeHtml(m.name)}</div>
                            <div class="recent-sub">${escapeHtml(m.email)}</div>
                        </div>
                        <span>${statusBadge(m.status)}</span>
                        <span class="recent-time">${formatDate(m.created_at)}</span>
                    </li>`;
            });
            membersHtml += '</ul>';
        } else {
            membersHtml = '<div class="table-empty"><p>최근 가입 회원이 없습니다.</p></div>';
        }

        let postsHtml = '';
        if (d.recent_posts && d.recent_posts.length) {
            postsHtml = '<ul class="recent-list">';
            d.recent_posts.forEach(p => {
                postsHtml += `
                    <li class="recent-item">
                        ${categoryBadge(p.category)}
                        <div class="recent-text">
                            <div class="recent-name">${escapeHtml(p.title)}</div>
                            <div class="recent-sub">${escapeHtml(p.author_name || '알 수 없음')}</div>
                        </div>
                        <span class="recent-time">${formatDate(p.created_at)}</span>
                    </li>`;
            });
            postsHtml += '</ul>';
        } else {
            postsHtml = '<div class="table-empty"><p>최근 게시글이 없습니다.</p></div>';
        }

        document.getElementById('dashboard-activity').innerHTML = `
            <div class="card">
                <div class="card-header">최근 가입 회원</div>
                <div class="card-body">${membersHtml}</div>
            </div>
            <div class="card">
                <div class="card-header">최근 게시글</div>
                <div class="card-body">${postsHtml}</div>
            </div>
        `;
    } catch (err) {
        console.error('Recent activity error:', err);
    }
}
