// 홈 화면 기능

let currentBannerIndex = 0;
let bannerInterval = null;

// 홈 화면 로드
async function loadHomeScreen() {
    try {
        // 병렬로 데이터 로드
        await Promise.all([
            loadBanners(),
            loadNoticeSummary(),
            loadScheduleSummary()
        ]);
    } catch (error) {
        console.error('홈 화면 로드 오류:', error);
        showError('홈 화면을 불러오는 중 오류가 발생했습니다.');
    }
}

// 배너 로드
async function loadBanners() {
    const slider = document.getElementById('banner-slider');
    const indicators = document.getElementById('banner-indicators');
    
    if (CONFIG.DEMO_MODE) {
        // 데모 모드: 샘플 배너 표시
        const demoBanners = [
            { id: 1, title: '영등포 JC에 오신 것을 환영합니다', image_url: null },
            { id: 2, title: '정기 회의 안내', image_url: null },
            { id: 3, title: '신규 회원 모집', image_url: null }
        ];
        renderBanners(demoBanners);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            slider.innerHTML = '<div class="banner-loading">배너가 없습니다</div>';
            return;
        }

        renderBanners(data);
    } catch (error) {
        console.error('배너 로드 오류:', error);
        slider.innerHTML = '<div class="banner-loading">배너 로딩 실패</div>';
    }
}

// 배너 렌더링
function renderBanners(banners) {
    const slider = document.getElementById('banner-slider');
    const indicators = document.getElementById('banner-indicators');
    
    if (banners.length === 0) {
        slider.innerHTML = '<div class="banner-loading">배너가 없습니다</div>';
        return;
    }

    slider.innerHTML = banners.map((banner, index) => `
        <div class="banner-item" onclick="handleBannerClick('${banner.link_url || ''}')">
            ${banner.image_url ? 
                `<img src="${banner.image_url}" alt="${banner.title}">` :
                `<div style="height: 200px; background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 700; padding: 20px; text-align: center;">${banner.title}</div>`
            }
        </div>
    `).join('');

    // 인디케이터 생성 (1개 이상일 때만)
    if (banners.length > 1) {
        indicators.innerHTML = banners.map((_, index) => 
            `<div class="banner-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`
        ).join('');

        // 인디케이터 클릭 이벤트
        indicators.querySelectorAll('.banner-indicator').forEach(indicator => {
            indicator.addEventListener('click', () => {
                const index = parseInt(indicator.dataset.index);
                scrollToBanner(index);
            });
        });

        // 자동 슬라이드
        startBannerAutoScroll(banners.length);
    }

    // 스크롤 이벤트
    slider.addEventListener('scroll', () => {
        updateBannerIndicators();
    });
}

// 배너 자동 스크롤
function startBannerAutoScroll(count) {
    if (bannerInterval) clearInterval(bannerInterval);
    
    bannerInterval = setInterval(() => {
        currentBannerIndex = (currentBannerIndex + 1) % count;
        scrollToBanner(currentBannerIndex);
    }, 5000); // 5초마다 자동 전환
}

// 배너 스크롤
function scrollToBanner(index) {
    const slider = document.getElementById('banner-slider');
    const banners = slider.querySelectorAll('.banner-item');
    
    if (banners[index]) {
        banners[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        currentBannerIndex = index;
        updateBannerIndicators();
    }
}

// 배너 인디케이터 업데이트
function updateBannerIndicators() {
    const slider = document.getElementById('banner-slider');
    const indicators = document.querySelectorAll('.banner-indicator');
    const scrollLeft = slider.scrollLeft;
    const width = slider.offsetWidth;
    const index = Math.round(scrollLeft / width);
    
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
    
    currentBannerIndex = index;
}

// 배너 클릭 처리
function handleBannerClick(url) {
    if (url && url.trim() !== '') {
        window.open(url, '_blank');
    }
}

// 공지사항 요약 로드
async function loadNoticeSummary() {
    const container = document.getElementById('notice-summary');
    
    if (CONFIG.DEMO_MODE) {
        // 데모 모드: 샘플 공지사항
        const demoNotices = [
            { 
                id: 1, 
                title: '2월 정기 회의 안내', 
                created_at: new Date().toISOString(),
                is_pinned: true,
                comment_count: 5,
                like_count: 12
            },
            { 
                id: 2, 
                title: '신규 회원 환영 행사', 
                created_at: new Date(Date.now() - 86400000).toISOString(),
                is_pinned: false,
                comment_count: 3,
                like_count: 8
            }
        ];
        renderNoticeSummary(demoNotices);
        return;
    }

    try {
        const { data, error } = await supabase
            .from('notices')
            .select('id, title, created_at, is_pinned, comment_count, like_count')
            .eq('is_deleted', false)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        renderNoticeSummary(data || []);
    } catch (error) {
        console.error('공지사항 요약 로드 오류:', error);
        container.innerHTML = '<div class="empty-state"><div class="empty-state-message">공지사항을 불러올 수 없습니다</div></div>';
    }
}

// 공지사항 요약 렌더링
function renderNoticeSummary(notices) {
    const container = document.getElementById('notice-summary');
    
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
                <span class="card-date">${formatDate(notice.created_at)}</span>
            </div>
            <div class="card-stats">
                <span class="card-stat">💬 ${notice.comment_count || 0}</span>
                <span class="card-stat">👍 ${notice.like_count || 0}</span>
            </div>
        </div>
    `).join('');
}

// 일정 요약 로드
async function loadScheduleSummary() {
    const container = document.getElementById('schedule-summary');
    
    if (CONFIG.DEMO_MODE) {
        // 데모 모드: 샘플 일정
        const demoSchedules = [
            { 
                id: 1, 
                title: '정기 회의', 
                schedule_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
                start_time: '18:00',
                location: '영등포구청',
                created_at: new Date().toISOString()
            },
            { 
                id: 2, 
                title: '봉사 활동', 
                schedule_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
                start_time: '09:00',
                location: '양로원',
                created_at: new Date().toISOString()
            }
        ];
        renderScheduleSummary(demoSchedules);
        return;
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('schedules')
            .select('id, title, schedule_date, start_time, location, created_at')
            .eq('is_deleted', false)
            .gte('schedule_date', today)
            .order('schedule_date', { ascending: true })
            .order('start_time', { ascending: true })
            .limit(5);

        if (error) throw error;

        renderScheduleSummary(data || []);
    } catch (error) {
        console.error('일정 요약 로드 오류:', error);
        container.innerHTML = '<div class="empty-state"><div class="empty-state-message">일정을 불러올 수 없습니다</div></div>';
    }
}

// 일정 요약 렌더링
function renderScheduleSummary(schedules) {
    const container = document.getElementById('schedule-summary');
    
    if (schedules.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-message">다가오는 일정이 없습니다</div></div>';
        return;
    }

    container.innerHTML = schedules.map(schedule => {
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
                    <div class="schedule-time">${schedule.start_time || ''}</div>
                    ${schedule.location ? `<div class="schedule-location">📍 ${schedule.location}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 공지사항 상세로 이동 (임시)
function navigateToNoticeDetail(id) {
    alert(`공지사항 상세 (ID: ${id}) 화면은 개발 중입니다.`);
}

// 일정 상세로 이동 (임시)
function navigateToScheduleDetail(id) {
    alert(`일정 상세 (ID: ${id}) 화면은 개발 중입니다.`);
}

// 화면 정리 시 배너 자동 스크롤 중지
function cleanupHomeScreen() {
    if (bannerInterval) {
        clearInterval(bannerInterval);
        bannerInterval = null;
    }
}
