// 홈 화면 기능 (Railway API 연동)

// 홈 화면 데이터 로드
async function loadHomeData() {
    console.log('🏠 홈 화면 데이터 로드 시작');
    
    try {
        // 공지사항 요약 로드
        await loadNoticeSummary();
        
        // 일정 요약 로드
        await loadScheduleSummary();
        
        // 배너 로드 (현재는 샘플 데이터)
        loadBannerSummary();
        
        console.log('✅ 홈 화면 데이터 로드 완료');
        
    } catch (error) {
        console.error('❌ 홈 화면 데이터 로드 실패:', error);
    }
}

// 공지사항 요약 로드
async function loadNoticeSummary() {
    const container = document.getElementById('notice-summary');
    if (!container) return;
    
    try {
        container.innerHTML = '<div class="content-loading">공지사항 로딩 중...</div>';
        
        // API로 공지사항 목록 조회 (최대 5개)
        const result = await apiClient.getNotices(1, 5);
        
        if (result.success && result.notices && result.notices.length > 0) {
            container.innerHTML = result.notices.map(notice => `
                <div class="notice-card" onclick="navigateTo('/notices/${notice.id}')">
                    <div class="notice-header">
                        ${notice.is_pinned ? '<span class="badge badge-pinned">📌 고정</span>' : ''}
                        ${isNewContent(notice.created_at) ? '<span class="badge badge-new">N</span>' : ''}
                    </div>
                    <h3 class="notice-title">${escapeHtml(notice.title)}</h3>
                    <div class="notice-meta">
                        <span class="notice-date">${formatRelativeTime(notice.created_at)}</span>
                        ${notice.comments_count > 0 ? `<span class="notice-comments">💬 ${notice.comments_count}</span>` : ''}
                        ${notice.likes_count > 0 ? `<span class="notice-likes">❤️ ${notice.likes_count}</span>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state">등록된 공지사항이 없습니다.</div>';
        }
        
    } catch (error) {
        console.error('공지사항 요약 로드 실패:', error);
        container.innerHTML = '<div class="error-state">공지사항을 불러올 수 없습니다.</div>';
    }
}

// 일정 요약 로드
async function loadScheduleSummary() {
    const container = document.getElementById('schedule-summary');
    if (!container) return;
    
    try {
        container.innerHTML = '<div class="content-loading">일정 로딩 중...</div>';
        
        // API로 다가오는 일정 조회 (최대 5개)
        const result = await apiClient.getSchedules(true);
        
        if (result.success && result.schedules && result.schedules.length > 0) {
            // 최대 5개만 표시
            const schedules = result.schedules.slice(0, 5);
            
            container.innerHTML = schedules.map(schedule => `
                <div class="schedule-card" onclick="navigateTo('/schedules/${schedule.id}')">
                    <div class="schedule-date">
                        <div class="schedule-day">${formatDate(schedule.event_date, 'DD')}</div>
                        <div class="schedule-month">${formatDate(schedule.event_date, 'MM월')}</div>
                    </div>
                    <div class="schedule-info">
                        <h3 class="schedule-title">${escapeHtml(schedule.title)}</h3>
                        <div class="schedule-meta">
                            ${schedule.start_time ? `<span class="schedule-time">⏰ ${schedule.start_time}</span>` : ''}
                            ${schedule.location ? `<span class="schedule-location">📍 ${escapeHtml(schedule.location)}</span>` : ''}
                        </div>
                    </div>
                    ${isNewContent(schedule.created_at) ? '<span class="badge badge-new">N</span>' : ''}
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state">예정된 일정이 없습니다.</div>';
        }
        
    } catch (error) {
        console.error('일정 요약 로드 실패:', error);
        container.innerHTML = '<div class="error-state">일정을 불러올 수 없습니다.</div>';
    }
}

// 1x1 투명 픽셀 데이터 URI (404 방지용 플레이스홀더)
var BANNER_PLACEHOLDER_DATA = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200" viewBox="0 0 800 200">' +
    '<rect width="800" height="200" fill="#E6ECFA"/>' +
    '<text x="400" y="110" text-anchor="middle" fill="#1F4FD8" font-family="sans-serif" font-size="18">영등포 JC</text>' +
    '</svg>'
);

// 배너 로드 (샘플 데이터, 404 없음)
function loadBannerSummary() {
    const container = document.getElementById('banner-slider');
    if (!container) return;
    
    // 샘플 배너 (실제 이미지 없을 때 데이터 URI 사용 → 콘솔 404 제거)
    const banners = [
        { id: 1, image: BANNER_PLACEHOLDER_DATA, title: '영등포 JC 회원관리 시스템', link: null },
        { id: 2, image: BANNER_PLACEHOLDER_DATA, title: '영등포 JC', link: null },
        { id: 3, image: BANNER_PLACEHOLDER_DATA, title: '회원관리 앱', link: null }
    ];
    
    if (banners.length > 0) {
        container.innerHTML = banners.map(banner => `
            <div class="banner-slide ${banner.link ? 'clickable' : ''}" 
                 ${banner.link ? `onclick="window.location.href='${banner.link}'"` : ''}>
                <img src="${banner.image}" alt="${banner.title}">
            </div>
        `).join('');
        
        // 배너 인디케이터
        const indicators = document.getElementById('banner-indicators');
        if (indicators && banners.length > 0) {
            indicators.innerHTML = banners.map((_, index) => `
                <span class="banner-indicator ${index === 0 ? 'active' : ''}" 
                      data-index="${index}" aria-label="배너 ${index + 1}"></span>
            `).join('');
        }
        
        // 자동 슬라이드 회전 (5초마다)
        if (banners.length > 1) {
            startBannerAutoRotate();
        }
    } else {
        container.innerHTML = '<div class="banner-empty">배너가 없습니다.</div>';
    }
}

var bannerRotateInterval = null;

function startBannerAutoRotate() {
    const slider = document.getElementById('banner-slider');
    const indicators = document.querySelectorAll('.banner-indicator');
    if (!slider || indicators.length === 0) return;
    
    var currentIndex = 0;
    
    function goToSlide(index) {
        currentIndex = (index + indicators.length) % indicators.length;
        slider.scrollTo({ left: slider.clientWidth * currentIndex, behavior: 'smooth' });
        indicators.forEach((el, i) => el.classList.toggle('active', i === currentIndex));
    }
    
    if (bannerRotateInterval) clearInterval(bannerRotateInterval);
    bannerRotateInterval = setInterval(function () {
        goToSlide(currentIndex + 1);
    }, 5000);
    
    indicators.forEach((el, index) => {
        el.addEventListener('click', function () {
            goToSlide(index);
        });
    });
}

// 새 콘텐츠 여부 확인 (3일 이내)
function isNewContent(createdAt) {
    if (!createdAt) return false;
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    
    return diffDays <= 3;
}

// 상대 시간 포맷 (예: "2시간 전", "3일 전")
function formatRelativeTime(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return '방금 전';
    } else if (diffMin < 60) {
        return `${diffMin}분 전`;
    } else if (diffHour < 24) {
        return `${diffHour}시간 전`;
    } else if (diffDay < 7) {
        return `${diffDay}일 전`;
    } else {
        return formatDate(dateString, 'YYYY-MM-DD');
    }
}

// 날짜 포맷 (DD, MM월, YYYY-MM-DD 등)
function formatDate(dateString, format) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch (format) {
        case 'DD':
            return day;
        case 'MM월':
            return `${parseInt(month)}월`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        default:
            return `${year}-${month}-${day}`;
    }
}

// HTML 이스케이프
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 홈 화면이 활성화될 때 데이터 로드
    const homeScreen = document.getElementById('home-screen');
    if (homeScreen) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (homeScreen.classList.contains('active')) {
                        loadHomeData();
                    }
                }
            });
        });
        
        observer.observe(homeScreen, { attributes: true });
    }
});

console.log('✅ Home 모듈 로드 완료 (Railway API)');
