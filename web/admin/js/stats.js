/* ================================================
   영등포 JC — 관리자 통계/분석
   CSS-only 차트 (외부 라이브러리 없음)
   ================================================ */

function renderStats(container) {
    container.innerHTML =
        '<div class="page-toolbar">' +
            '<h2 class="page-title">통계 / 분석</h2>' +
        '</div>' +
        '<div class="stats-grid" id="stats-summary"></div>' +
        '<div class="two-col mb-24" id="stats-charts-row1">' +
            '<div class="card"><div class="card-header">역할별 회원 분포</div><div class="card-body" id="chart-role-dist"><div class="skeleton skeleton-cell" style="width:100%;height:180px"></div></div></div>' +
            '<div class="card"><div class="card-header">상태별 회원 분포</div><div class="card-body" id="chart-status-dist"><div class="skeleton skeleton-cell" style="width:100%;height:180px"></div></div></div>' +
        '</div>' +
        '<div class="card mb-24">' +
            '<div class="card-header">월별 가입자 추이 (최근 6개월)</div>' +
            '<div class="card-body" id="chart-monthly-members"><div class="skeleton skeleton-cell" style="width:100%;height:200px"></div></div>' +
        '</div>';

    loadStatsData();
}

async function loadStatsData() {
    try {
        var res = await AdminAPI.get('/api/admin/dashboard/stats');
        if (!res.success) return;
        var d = res.data;

        // Summary cards
        document.getElementById('stats-summary').innerHTML =
            buildStatCard('blue', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>', d.members.total, '전체 회원') +
            buildStatCard('green', '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>', d.members.active, '활동 회원') +
            buildStatCard('yellow', '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>', d.members.pending, '승인 대기') +
            buildStatCard('red', '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>', d.posts.total, '전체 게시글');

        // Role distribution (horizontal bar chart)
        var roleData = [
            { label: '일반 회원', value: Math.max(0, d.members.total - d.members.active - d.members.pending), color: 'var(--c-primary)' },
            { label: '활동 회원', value: d.members.active, color: 'var(--c-success)' },
            { label: '승인 대기', value: d.members.pending, color: 'var(--c-warning)' }
        ];
        document.getElementById('chart-role-dist').innerHTML = buildHorizontalBarChart(roleData);

        // Status distribution (donut via CSS)
        var total = d.members.total || 1;
        var activeP = Math.round((d.members.active / total) * 100);
        var pendingP = Math.round((d.members.pending / total) * 100);
        var otherP = 100 - activeP - pendingP;
        document.getElementById('chart-status-dist').innerHTML = buildDonutChart([
            { label: '활동', pct: activeP, color: '#10B981' },
            { label: '대기', pct: pendingP, color: '#F59E0B' },
            { label: '기타', pct: otherP, color: '#E2E8F0' }
        ], d.members.total);

        // Monthly members — use recent-activity for a rough approximation
        loadMonthlyChart();
    } catch (err) {
        console.error('Stats load error:', err);
    }
}

async function loadMonthlyChart() {
    try {
        var res = await AdminAPI.get('/api/admin/dashboard/recent-activity');
        if (!res.success) return;

        // Build monthly counts from recent members (approximation with available data)
        var monthCounts = {};
        var now = new Date();
        for (var i = 5; i >= 0; i--) {
            var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            monthCounts[key] = 0;
        }

        (res.data.recent_members || []).forEach(function(m) {
            if (!m.created_at) return;
            var md = new Date(m.created_at);
            var key = md.getFullYear() + '-' + String(md.getMonth() + 1).padStart(2, '0');
            if (key in monthCounts) monthCounts[key]++;
        });

        var labels = Object.keys(monthCounts);
        var values = labels.map(function(k) { return monthCounts[k]; });
        var maxVal = Math.max.apply(null, values.concat([1]));

        var html = '<div class="bar-chart">';
        labels.forEach(function(label, idx) {
            var pct = Math.round((values[idx] / maxVal) * 100);
            var monthLabel = label.split('-')[1] + '월';
            html += '<div class="bar-col">' +
                '<div class="bar-value">' + values[idx] + '</div>' +
                '<div class="bar-track"><div class="bar-fill" style="height:' + Math.max(pct, 4) + '%"></div></div>' +
                '<div class="bar-label">' + monthLabel + '</div>' +
            '</div>';
        });
        html += '</div>';
        html += '<p class="text-sub text-sm" style="text-align:center;margin-top:8px">* 최근 가입 데이터 기반 (샘플)</p>';

        document.getElementById('chart-monthly-members').innerHTML = html;
    } catch (err) {
        console.error('Monthly chart error:', err);
    }
}

function buildStatCard(color, svgContent, value, label) {
    return '<div class="stat-card">' +
        '<div class="stat-icon ' + color + '"><svg viewBox="0 0 24 24">' + svgContent + '</svg></div>' +
        '<div class="stat-info"><div class="stat-value">' + value + '</div><div class="stat-label">' + label + '</div></div>' +
    '</div>';
}

function buildHorizontalBarChart(data) {
    var maxVal = Math.max.apply(null, data.map(function(d) { return d.value; }).concat([1]));
    var html = '<div class="h-bar-chart">';
    data.forEach(function(item) {
        var pct = Math.round((item.value / maxVal) * 100);
        html += '<div class="h-bar-row">' +
            '<div class="h-bar-label">' + item.label + '</div>' +
            '<div class="h-bar-track"><div class="h-bar-fill" style="width:' + Math.max(pct, 2) + '%;background:' + item.color + '"></div></div>' +
            '<div class="h-bar-value">' + item.value + '</div>' +
        '</div>';
    });
    html += '</div>';
    return html;
}

function buildDonutChart(segments, total) {
    // CSS conic-gradient donut
    var gradientParts = [];
    var cumPct = 0;
    segments.forEach(function(seg) {
        gradientParts.push(seg.color + ' ' + cumPct + '% ' + (cumPct + seg.pct) + '%');
        cumPct += seg.pct;
    });

    var html = '<div style="display:flex;align-items:center;gap:24px">';
    html += '<div class="donut-chart" style="background:conic-gradient(' + gradientParts.join(', ') + ')">';
    html += '<div class="donut-center"><span class="donut-total">' + total + '</span><span class="donut-label">전체</span></div>';
    html += '</div>';

    html += '<div class="donut-legend">';
    segments.forEach(function(seg) {
        html += '<div class="legend-item">' +
            '<span class="legend-dot" style="background:' + seg.color + '"></span>' +
            '<span>' + seg.label + '</span>' +
            '<span class="text-sub" style="margin-left:auto">' + seg.pct + '%</span>' +
        '</div>';
    });
    html += '</div></div>';
    return html;
}
