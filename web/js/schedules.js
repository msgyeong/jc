// 일정 기능

// 일정 화면 로드
async function loadSchedulesScreen() {
    const container = document.getElementById('schedule-list');
    container.innerHTML = '<div class="content-loading">일정 로딩 중...</div>';
    
    // 권한 확인 (일정 작성 권한)
    await checkSchedulePermission();
    
    await loadSchedules();
}

// 일정 작성 권한 확인
async function checkSchedulePermission() {
    const createBtn = document.getElementById('create-schedule-btn');
    
    if (CONFIG.DEMO_MODE) {
        createBtn.style.display = 'block'; // 데모 모드에서는 보이기
        return;
    }

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return;

        // 사용자의 role_permissions 확인
        const { data, error } = await supabase
            .from('members')
            .select('jc_role, role_permissions(can_create_schedule)')
            .eq('user_id', user.id)
            .single();

        if (error) throw error;

        if (data?.role_permissions?.can_create_schedule) {
            createBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('권한 확인 오류:', error);
    }
}

// 일정 목록 로드
async function loadSchedules() {
    const container = document.getElementById('schedule-list');
    
    if (CONFIG.DEMO_MODE) {
        // 데모 모드: 샘플 일정
        const demoSchedules = Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            title: `일정 ${i + 1}`,
            schedule_date: new Date(Date.now() + i * 86400000 * 2).toISOString().split('T')[0],
            start_time: ['09:00', '14:00', '18:00'][i % 3],
            end_time: i % 2 === 0 ? ['11:00', '16:00', '20:00'][i % 3] : null,
            location: ['회의실', '강당', '야외'][i % 3],
            created_at: new Date().toISOString(),
            comment_count: Math.floor(Math.random() * 5),
            like_count: Math.floor(Math.random() * 15)
        }));
        
        renderSchedules(demoSchedules);
        return;
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('schedules')
            .select('id, title, schedule_date, start_time, end_time, location, created_at, comment_count, like_count')
            .eq('is_deleted', false)
            .gte('schedule_date', today)
            .order('schedule_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;

        renderSchedules(data || []);
    } catch (error) {
        console.error('일정 로드 오류:', error);
        container.innerHTML = '<div class="empty-state"><div class="empty-state-message">일정을 불러올 수 없습니다</div></div>';
    }
}

// 일정 렌더링
function renderSchedules(schedules) {
    const container = document.getElementById('schedule-list');
    
    if (schedules.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-message">다가오는 일정이 없습니다</div></div>';
        return;
    }

    // 날짜별 그룹핑
    const groupedSchedules = {};
    schedules.forEach(schedule => {
        const dateKey = schedule.schedule_date;
        if (!groupedSchedules[dateKey]) {
            groupedSchedules[dateKey] = [];
        }
        groupedSchedules[dateKey].push(schedule);
    });

    let html = '';
    
    Object.keys(groupedSchedules).forEach(dateKey => {
        const date = new Date(dateKey);
        const dateLabel = formatScheduleDate(date);
        
        html += `
            <div class="schedule-date-group">
                <h3 style="font-size: 16px; font-weight: 700; color: var(--primary-color); margin: 20px 0 12px; padding-bottom: 8px; border-bottom: 2px solid var(--primary-color);">
                    ${dateLabel}
                </h3>
                ${groupedSchedules[dateKey].map(schedule => {
                    const date = new Date(schedule.schedule_date);
                    const month = date.toLocaleDateString('ko-KR', { month: 'short' });
                    const day = date.getDate();
                    
                    return `
                        <div class="card schedule-card" onclick="navigateToScheduleDetail(${schedule.id})">
                            <div class="schedule-date-box">
                                <div class="schedule-date-day">${day}</div>
                                <div class="schedule-date-month">${month}</div>
                            </div>
                            <div class="schedule-content">
                                <div class="card-title">
                                    ${schedule.title}
                                    ${isNew(schedule.created_at) ? '<span class="new-badge">N</span>' : ''}
                                </div>
                                <div class="schedule-time">
                                    ${schedule.start_time || ''}${schedule.end_time ? ` - ${schedule.end_time}` : ''}
                                </div>
                                ${schedule.location ? `<div class="schedule-location">📍 ${schedule.location}</div>` : ''}
                                <div class="card-stats" style="margin-top: 8px;">
                                    <span class="card-stat">💬 ${schedule.comment_count || 0}</span>
                                    <span class="card-stat">👍 ${schedule.like_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 일정 날짜 포맷팅
function formatScheduleDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = targetDate - today;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays === 2) return '모레';
    
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}

// 일정 작성 버튼 클릭
function handleCreateSchedule() {
    alert('일정 등록 화면은 개발 중입니다.');
}
