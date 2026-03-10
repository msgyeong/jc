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

// 공지사항 요약 로드 (게시판 category=notice 연동, 7일 이내, 최대 5개)
async function loadNoticeSummary() {
    const container = document.getElementById('notice-summary');
    if (!container) return;

    try {
        container.innerHTML = '<div class="content-loading">공지사항 로딩 중...</div>';

        // 게시판 API에서 공지 카테고리 조회
        const result = await apiClient.getPosts(1, 20, 'notice');

        const posts = result.posts || (result.data && (result.data.posts || result.data.items)) || [];
        if (result.success && posts.length > 0) {
            // 7일 이내 게시글만 필터 (고정 공지 포함 모두 동일 적용)
            const now = new Date();
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            const filtered = posts.filter(post => {
                const created = new Date(post.created_at);
                return (now - created) <= sevenDaysMs;
            });

            // 최대 5개
            const notices = filtered.slice(0, 5);

            if (notices.length > 0) {
                let nBadgeCount = 0;
                container.innerHTML = notices.map(post => {
                    const showN = isNewContent(post.created_at) && nBadgeCount < 2;
                    if (showN) nBadgeCount++;
                    return `
                    <div class="notice-card" onclick="navigateTo('/posts/${post.id}')">
                        <div class="notice-header">
                            ${post.is_pinned ? '<span class="badge badge-pinned">📌 고정</span>' : ''}
                            ${showN ? '<span class="badge badge-new">N</span>' : ''}
                        </div>
                        <h3 class="notice-title">${escapeHtml(post.title)}</h3>
                        <div class="notice-meta">
                            <span class="notice-date">${formatRelativeTime(post.created_at)}</span>
                            ${post.comments_count > 0 ? `<span class="notice-comments">💬 ${post.comments_count}</span>` : ''}
                            ${post.likes_count > 0 ? `<span class="notice-likes">❤️ ${post.likes_count}</span>` : ''}
                        </div>
                    </div>
                `;
                }).join('');
            } else {
                container.innerHTML = '<div class="empty-state">최근 공지사항이 없습니다.</div>';
            }
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
        
        // API 응답 호환: result.schedules 또는 result.data.schedules
        const schedules = result.schedules || (result.data && (result.data.schedules || result.data.items)) || [];
        if (result.success && schedules.length > 0) {
            const items = schedules.slice(0, 5);

            let schedNBadgeCount = 0;
            container.innerHTML = items.map(schedule => {
                const dateField = schedule.start_date || schedule.event_date || '';
                const dateObj = dateField ? new Date(dateField) : null;
                const day = dateObj ? String(dateObj.getDate()).padStart(2, '0') : '--';
                const month = dateObj ? `${dateObj.getMonth() + 1}월` : '';
                let timeStr = '';
                if (dateField && dateField.includes('T')) {
                    const t = dateField.split('T')[1]?.substring(0, 5);
                    if (t && t !== '00:00') timeStr = t;
                }
                return `
                <div class="home-schedule-card" onclick="navigateTo('/schedules/${schedule.id}')">
                    <div class="home-schedule-date-box">
                        <div class="home-schedule-day">${day}</div>
                        <div class="home-schedule-month">${month}</div>
                    </div>
                    <div class="home-schedule-info">
                        <h3 class="home-schedule-title">${escapeHtml(schedule.title)}</h3>
                        <div class="home-schedule-meta">
                            ${timeStr ? `<span>⏰ ${timeStr}</span>` : ''}
                            ${schedule.location ? `<span>📍 ${escapeHtml(schedule.location)}</span>` : ''}
                        </div>
                    </div>
                    ${(() => { const show = isNewContent(schedule.created_at) && schedNBadgeCount < 2; if (show) schedNBadgeCount++; return show ? '<span class="home-badge-new">N</span>' : ''; })()}
                </div>`;
            }).join('');
        } else {
            container.innerHTML = '<div class="empty-state">예정된 일정이 없습니다.</div>';
        }
        
    } catch (error) {
        console.error('일정 요약 로드 실패:', error);
        container.innerHTML = '<div class="error-state">일정을 불러올 수 없습니다.</div>';
    }
}

// 배너 SVG 생성 함수
function createBannerSvg(bgGradient, title, subtitle, icon) {
    return 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="200" viewBox="0 0 800 200">' +
        '<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">' + bgGradient + '</linearGradient></defs>' +
        '<rect width="800" height="200" fill="url(#bg)"/>' +
        '<text x="400" y="85" text-anchor="middle" fill="white" font-family="sans-serif" font-size="28" font-weight="bold">' + icon + ' ' + title + '</text>' +
        '<text x="400" y="130" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="sans-serif" font-size="16">' + subtitle + '</text>' +
        '</svg>'
    );
}

// 배너 로드
function loadBannerSummary() {
    const container = document.getElementById('banner-slider');
    if (!container) return;

    const banners = [
        {
            id: 1,
            image: createBannerSvg(
                '<stop offset="0%" style="stop-color:#2563EB"/><stop offset="100%" style="stop-color:#60A5FA"/>',
                '영등포 JC', '회원관리 커뮤니티 앱에 오신 것을 환영합니다', ''
            ),
            title: '영등포 JC 환영'
        },
        {
            id: 2,
            image: createBannerSvg(
                '<stop offset="0%" style="stop-color:#1E40AF"/><stop offset="100%" style="stop-color:#3B82F6"/>',
                '일정 확인', '다가오는 모임과 행사 일정을 확인하세요', ''
            ),
            title: '일정 안내'
        },
        {
            id: 3,
            image: createBannerSvg(
                '<stop offset="0%" style="stop-color:#1D4ED8"/><stop offset="100%" style="stop-color:#93C5FD"/>',
                '회원 소통', '공지사항과 게시판을 통해 소식을 나누세요', ''
            ),
            title: '회원 소통'
        }
    ];

    container.innerHTML = banners.map(banner => `
        <div class="banner-slide">
            <img src="${banner.image}" alt="${banner.title}">
        </div>
    `).join('');

    const indicators = document.getElementById('banner-indicators');
    if (indicators && banners.length > 0) {
        indicators.innerHTML = banners.map((_, index) => `
            <span class="banner-indicator ${index === 0 ? 'active' : ''}"
                  data-index="${index}" aria-label="배너 ${index + 1}"></span>
        `).join('');
    }

    if (banners.length > 1) {
        startBannerAutoRotate();
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
