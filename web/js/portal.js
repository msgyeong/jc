// 포털 — 타 로컬 JC 방문

async function loadPortalScreen() {
    var container = document.getElementById('portal-content');
    if (!container) return;
    container.innerHTML = renderSkeleton ? renderSkeleton('list') : '<div class="content-loading">로딩 중...</div>';

    try {
        var res = await fetch('/api/organizations/public');
        var data = await res.json();
        if (!data.success) throw new Error(data.message);

        var orgs = (data.data && data.data.items) || data.data || [];
        var userInfo = typeof getCurrentUser === 'function' ? getCurrentUser() : JSON.parse(localStorage.getItem('user_info') || 'null');
        var myOrgId = userInfo ? userInfo.org_id : null;

        if (orgs.length === 0) {
            container.innerHTML = '<div class="content-placeholder">등록된 로컬이 없습니다.</div>';
            return;
        }

        // 지구별 그룹핑
        var districts = {};
        orgs.forEach(function(org) {
            var d = org.district || '기타';
            if (!districts[d]) districts[d] = [];
            districts[d].push(org);
        });

        var html = '<div style="padding:8px 0">';
        html += '<p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">다른 JC 로컬을 방문하여 공개된 정보를 확인할 수 있습니다.</p>';

        Object.keys(districts).sort().forEach(function(district) {
            html += '<h3 style="font-size:15px;font-weight:600;margin:16px 0 8px;color:var(--text-primary)">' + escapeHtml(district) + '</h3>';
            districts[district].forEach(function(org) {
                var isMine = myOrgId && org.id === myOrgId;
                html += '<div class="portal-org-card' + (isMine ? ' portal-mine' : '') + '" onclick="visitOrg(' + org.id + ',\'' + escapeHtml(org.name).replace(/'/g, "\\'") + '\')">';
                html += '<div class="portal-org-icon">' + escapeHtml(org.name.substring(0, 2)) + '</div>';
                html += '<div class="portal-org-info">';
                html += '<div class="portal-org-name">' + escapeHtml(org.name) + (isMine ? ' <span style="color:#16A34A;font-size:12px">(내 소속)</span>' : '') + '</div>';
                html += '<div class="portal-org-district">' + escapeHtml(org.district || '') + '</div>';
                html += '</div>';
                html += '<span style="color:var(--text-secondary);font-size:20px">›</span>';
                html += '</div>';
            });
        });

        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = typeof renderErrorState === 'function'
            ? renderErrorState('로컬 목록을 불러올 수 없습니다', err.message, 'loadPortalScreen()')
            : '<div class="content-placeholder">로컬 목록을 불러올 수 없습니다.</div>';
    }
}

async function visitOrg(orgId, orgName) {
    var container = document.getElementById('portal-content');
    if (!container) return;
    container.innerHTML = renderSkeleton ? renderSkeleton('detail') : '<div class="content-loading">로딩 중...</div>';

    // 앱바 타이틀 변경
    var appBar = container.closest('.screen')?.querySelector('.app-bar-title');
    if (appBar) appBar.textContent = orgName;

    try {
        // 해당 로컬의 공개 정보 조회 (공지, 일정, 회원수)
        var token = localStorage.getItem('auth_token');
        var headers = token ? { 'Authorization': 'Bearer ' + token } : {};

        var html = '<div style="padding:8px 0">';
        html += '<button class="btn-back" onclick="loadPortalScreen();var t=document.querySelector(\'#portal-screen .app-bar-title\');if(t)t.textContent=\'JC 포털\'">← 포털 목록</button>';

        // 로컬 기본 정보
        html += '<div style="text-align:center;padding:24px 0">';
        html += '<div style="width:64px;height:64px;border-radius:50%;background:#DBEAFE;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:20px;font-weight:700;color:#1E40AF">' + escapeHtml(orgName.substring(0, 2)) + '</div>';
        html += '<h2 style="margin:0 0 4px">' + escapeHtml(orgName) + '</h2>';
        html += '</div>';

        // 최근 공지 (해당 로컬)
        html += '<div class="info-section">';
        html += '<h3 class="info-section-title">최근 공지</h3>';
        html += '<div id="portal-notices-' + orgId + '">로딩 중...</div>';
        html += '</div>';

        // 다가오는 일정
        html += '<div class="info-section">';
        html += '<h3 class="info-section-title">다가오는 일정</h3>';
        html += '<div id="portal-schedules-' + orgId + '">로딩 중...</div>';
        html += '</div>';

        html += '</div>';
        container.innerHTML = html;

        // 공지/일정 비동기 로드 (현재는 같은 DB이므로 전체 데이터)
        // 추후 org_id 필터 적용
        loadPortalNotices(orgId);
        loadPortalSchedules(orgId);

    } catch (err) {
        container.innerHTML = '<div class="content-placeholder">로컬 정보를 불러올 수 없습니다.</div>';
    }
}

async function loadPortalNotices(orgId) {
    var el = document.getElementById('portal-notices-' + orgId);
    if (!el) return;
    try {
        var res = await apiClient.request('/posts?page=1&limit=5&category=notice');
        var posts = res.posts || (res.data && (res.data.posts || res.data.items)) || [];
        if (posts.length === 0) {
            el.innerHTML = '<div style="color:var(--text-secondary);font-size:14px">공지가 없습니다</div>';
            return;
        }
        el.innerHTML = posts.slice(0, 3).map(function(p) {
            return '<div style="padding:8px 0;border-bottom:1px solid var(--border-color)">'
                + '<div style="font-size:14px;font-weight:500">' + escapeHtml(p.title) + '</div>'
                + '<div style="font-size:12px;color:var(--text-secondary)">' + formatDate(p.created_at) + '</div>'
                + '</div>';
        }).join('');
    } catch (_) {
        el.innerHTML = '<div style="color:var(--text-secondary);font-size:14px">공지를 불러올 수 없습니다</div>';
    }
}

async function loadPortalSchedules(orgId) {
    var el = document.getElementById('portal-schedules-' + orgId);
    if (!el) return;
    try {
        var res = await apiClient.request('/schedules?upcoming=true');
        var scheds = res.schedules || (res.data && (res.data.schedules || res.data.items)) || [];
        if (scheds.length === 0) {
            el.innerHTML = '<div style="color:var(--text-secondary);font-size:14px">다가오는 일정이 없습니다</div>';
            return;
        }
        el.innerHTML = scheds.slice(0, 3).map(function(s) {
            return '<div style="padding:8px 0;border-bottom:1px solid var(--border-color)">'
                + '<div style="font-size:14px;font-weight:500">' + escapeHtml(s.title) + '</div>'
                + '<div style="font-size:12px;color:var(--text-secondary)">'
                + (s.start_date ? formatDate(s.start_date) : '') + (s.location ? ' · ' + escapeHtml(s.location) : '')
                + '</div></div>';
        }).join('');
    } catch (_) {
        el.innerHTML = '<div style="color:var(--text-secondary);font-size:14px">일정을 불러올 수 없습니다</div>';
    }
}
