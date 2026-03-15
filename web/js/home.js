// 홈 화면 기능 (Railway API 연동)

// 홈 화면 데이터 로드
async function loadHomeData() {
    console.log('🏠 홈 화면 데이터 로드 시작');
    
    try {
        // 공지사항 요약 로드
        await loadNoticeSummary();
        
        // 일정 요약 로드
        await loadScheduleSummary();
        
        // 배너 로드 (API 동적 데이터)
        await loadBannerSummary();
        
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
                            ${post.is_pinned ? '<span class="badge badge-pinned">고정</span>' : ''}
                            ${showN ? '<span class="badge badge-new">N</span>' : ''}
                        </div>
                        <h3 class="notice-title">${escapeHtml(post.title)}</h3>
                        <div class="notice-meta">
                            <span class="notice-date">${formatRelativeTime(post.created_at)}</span>
                            ${post.comments_count > 0 ? `<span class="notice-comments"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${post.comments_count}</span>` : ''}
                            ${post.likes_count > 0 ? `<span class="notice-likes"><svg class="icon-sm" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg> ${post.likes_count}</span>` : ''}
                        </div>
                    </div>
                `;
                }).join('');
            } else {
                container.innerHTML = renderEmptyState('document', '최근 공지사항이 없습니다');
            }
        } else {
            container.innerHTML = renderEmptyState('document', '등록된 공지가 없습니다');
        }

    } catch (error) {
        console.error('공지사항 요약 로드 실패:', error);
        container.innerHTML = renderErrorState('공지사항을 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'loadNoticeSummary()');
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
                            ${timeStr ? `<span>${timeStr}</span>` : ''}
                            ${schedule.location ? `<span>${escapeHtml(schedule.location)}</span>` : ''}
                        </div>
                    </div>
                    ${(() => { const show = isNewContent(schedule.created_at) && schedNBadgeCount < 2; if (show) schedNBadgeCount++; return show ? '<span class="home-badge-new">N</span>' : ''; })()}
                </div>`;
            }).join('');
        } else {
            container.innerHTML = renderEmptyState('calendar', '예정된 일정이 없습니다');
        }

    } catch (error) {
        console.error('일정 요약 로드 실패:', error);
        container.innerHTML = renderErrorState('일정을 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'loadScheduleSummary()');
    }
}

// 배너 로드 (M-01: API 기반 동적 배너 + 스와이프 캐러셀)
async function loadBannerSummary() {
    const section = document.querySelector('.banner-section');
    if (!section) return;

    const banners = [
        {
            gradient: 'linear-gradient(135deg, #1E3A5F 0%, #3D6B99 100%)',
            title: '영등포 JC',
            subtitle: '회원관리 커뮤니티 앱에 오신 것을 환영합니다',
            cta: '둘러보기'
        }
    ];

    try {
        // 다가오는 일정 배너
        const schedRes = await apiClient.getSchedules(true);
        const scheds = schedRes.schedules || (schedRes.data && (schedRes.data.schedules || schedRes.data.items)) || [];
        if (scheds.length > 0) {
            const next = scheds[0];
            const dateField = next.start_date || next.event_date || '';
            let dateLabel = '';
            if (dateField) {
                const d = new Date(dateField);
                const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                dateLabel = `${d.getMonth()+1}/${d.getDate()}(${weekdays[d.getDay()]})`;
                if (dateField.includes('T')) {
                    const t = dateField.split('T')[1]?.substring(0, 5);
                    if (t && t !== '00:00') dateLabel += ' ' + t;
                }
            }
            banners.push({
                gradient: 'linear-gradient(135deg, #162D4A 0%, #2D5F8A 100%)',
                title: escapeHtml(next.title),
                subtitle: dateLabel + (next.location ? ' · ' + escapeHtml(next.location) : ''),
                cta: '일정 보기',
                action: "navigateTo('/schedules/" + next.id + "')"
            });
        } else {
            banners.push({
                gradient: 'linear-gradient(135deg, #162D4A 0%, #2D5F8A 100%)',
                title: '일정 확인',
                subtitle: '다가오는 모임과 행사 일정을 확인하세요',
                cta: '일정 보기',
                action: "switchTab('schedules')"
            });
        }

        // 최신 공지 배너
        const noticeRes = await apiClient.getPosts(1, 5, 'notice');
        const notices = noticeRes.posts || (noticeRes.data && (noticeRes.data.posts || noticeRes.data.items)) || [];
        if (notices.length > 0) {
            const latest = notices[0];
            banners.push({
                gradient: 'linear-gradient(135deg, #1E3A5F 0%, #6B9BC3 100%)',
                title: escapeHtml(latest.title),
                subtitle: formatDate(latest.created_at),
                cta: '공지 보기',
                action: "navigateTo('/posts/" + latest.id + "')"
            });
        } else {
            banners.push({
                gradient: 'linear-gradient(135deg, #1E3A5F 0%, #6B9BC3 100%)',
                title: '회원 소통',
                subtitle: '공지사항과 게시판을 통해 소식을 나누세요',
                cta: '게시판 가기',
                action: "switchTab('posts')"
            });
        }
    } catch (_) {
        // API 실패 시 기본 배너 추가
        banners.push(
            { gradient: 'linear-gradient(135deg, #162D4A 0%, #2D5F8A 100%)', title: '일정 확인', subtitle: '다가오는 모임과 행사 일정을 확인하세요', cta: '일정 보기', action: "switchTab('schedules')" },
            { gradient: 'linear-gradient(135deg, #1E3A5F 0%, #6B9BC3 100%)', title: '회원 소통', subtitle: '공지사항과 게시판을 통해 소식을 나누세요', cta: '게시판 가기', action: "switchTab('posts')" }
        );
    }

    section.innerHTML = `
        <div class="banner-carousel" role="region" aria-label="홈 배너" aria-roledescription="carousel">
            <div class="banner-track" id="banner-track">
                ${banners.map((b, i) => `
                    <div class="banner-slide" role="group" aria-roledescription="slide" aria-label="배너 ${i+1}/${banners.length}" style="background:${b.gradient}${b.action ? ';cursor:pointer' : ''}" ${b.action ? 'onclick="' + b.action + '"' : ''}>
                        <div class="banner-title">${b.title}</div>
                        <div class="banner-subtitle">${b.subtitle}</div>
                        ${b.cta ? `<span class="banner-cta"${b.action ? ' onclick="' + b.action + '"' : ''}>${b.cta}</span>` : ''}
                    </div>
                `).join('')}
            </div>
            ${banners.length > 1 ? `<div class="banner-indicators">
                ${banners.map((_, i) => `<span class="banner-dot${i === 0 ? ' active' : ''}" data-index="${i}" aria-label="배너 ${i+1}으로 이동"></span>`).join('')}
            </div>` : ''}
        </div>
    `;

    if (banners.length > 1) {
        initBannerCarousel(banners.length);
    }
}

var bannerAutoTimer = null;
var bannerCurrentIndex = 0;
const BANNER_INTERVAL = 4000;

function initBannerCarousel(total) {
    const track = document.getElementById('banner-track');
    const dots = document.querySelectorAll('.banner-dot');
    if (!track || dots.length === 0) return;

    bannerCurrentIndex = 0;

    function goToSlide(index) {
        bannerCurrentIndex = ((index % total) + total) % total;
        track.style.transform = `translateX(-${bannerCurrentIndex * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === bannerCurrentIndex));
    }

    // 자동 전환
    function startAuto() {
        stopAuto();
        bannerAutoTimer = setInterval(() => goToSlide(bannerCurrentIndex + 1), BANNER_INTERVAL);
    }
    function stopAuto() { clearInterval(bannerAutoTimer); }

    startAuto();

    // 인디케이터 클릭
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goToSlide(i); stopAuto(); setTimeout(startAuto, BANNER_INTERVAL); }));

    // 스와이프
    let touchStartX = 0, touchStartY = 0, isDragging = false;
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDragging = true;
        stopAuto();
        track.style.transition = 'none';
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy)) {
            const offset = -(bannerCurrentIndex * 100) + (dx / track.parentElement.clientWidth * 100);
            track.style.transform = `translateX(${offset}%)`;
        }
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        track.style.transition = 'transform 0.4s ease';
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 30) {
            goToSlide(dx < 0 ? bannerCurrentIndex + 1 : bannerCurrentIndex - 1);
        } else {
            goToSlide(bannerCurrentIndex);
        }
        setTimeout(startAuto, BANNER_INTERVAL);
    });

    // 화면 비활성 시 정지
    document.addEventListener('visibilitychange', () => {
        document.hidden ? stopAuto() : startAuto();
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

// formatDate, escapeHtml → utils.js로 통합됨

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 홈 화면이 활성화될 때 데이터 로드
    const homeScreen = document.getElementById('home-screen');
    // MutationObserver 제거 — navigateToScreen에서 loadHomeData() 호출하므로 중복 방지
});

console.log('✅ Home 모듈 로드 완료 (Railway API)');
