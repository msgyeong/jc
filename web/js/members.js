// 회원 관련 기능 (Railway API 연동)

let currentMembersPage = 1;
let membersLoading = false;
let searchTimeout = null;

// 회원 목록 로드
async function loadMembers(page = 1) {
    if (membersLoading) return;
    
    console.log(`👥 회원 목록 로드 (페이지 ${page})`);
    
    const container = document.getElementById('member-list');
    if (!container) return;
    
    membersLoading = true;
    
    try {
        if (page === 1) {
            container.innerHTML = '<div class="content-loading">회원 목록 로딩 중...</div>';
        }
        
        // API로 회원 목록 조회
        const result = await apiClient.getMembers(page, 50);
        
        if (result.success && result.members) {
            if (result.members.length === 0) {
                container.innerHTML = '<div class="empty-state">등록된 회원이 없습니다.</div>';
            } else {
                container.innerHTML = result.members.map(member => createMemberCard(member)).join('');
                currentMembersPage = page;
            }
        } else {
            container.innerHTML = '<div class="error-state">회원 목록을 불러올 수 없습니다.</div>';
        }
        
    } catch (error) {
        console.error('회원 목록 로드 실패:', error);
        container.innerHTML = '<div class="error-state">회원 목록을 불러올 수 없습니다.</div>';
    } finally {
        membersLoading = false;
    }
}

// 회원 검색
async function searchMembers(query) {
    if (!query || query.trim() === '') {
        loadMembers(1);
        return;
    }
    
    console.log(`🔍 회원 검색: ${query}`);
    
    const container = document.getElementById('member-list');
    if (!container) return;
    
    try {
        container.innerHTML = '<div class="content-loading">검색 중...</div>';
        
        // API로 회원 검색
        const result = await apiClient.searchMembers(query);
        
        if (result.success && result.members) {
            if (result.members.length === 0) {
                container.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
            } else {
                container.innerHTML = result.members.map(member => createMemberCard(member)).join('');
            }
        } else {
            container.innerHTML = '<div class="error-state">검색에 실패했습니다.</div>';
        }
        
    } catch (error) {
        console.error('회원 검색 실패:', error);
        container.innerHTML = '<div class="error-state">검색에 실패했습니다.</div>';
    }
}

// 회원 카드 생성
function createMemberCard(member) {
    return `
        <div class="member-card" onclick="navigateTo('/members/${member.id}')">
            <div class="member-avatar">
                ${member.profile_image ? 
                    `<img src="${member.profile_image}" alt="${member.name}">` :
                    `<div class="member-avatar-placeholder">${member.name ? member.name[0] : '?'}</div>`
                }
            </div>
            
            <div class="member-info">
                <div class="member-name-row">
                    <h3 class="member-name">${escapeHtml(member.name || '이름 없음')}</h3>
                    ${member.role === 'super_admin' ? '<span class="badge badge-admin">총관리자</span>' : ''}
                    ${member.role === 'admin' ? '<span class="badge badge-admin">관리자</span>' : ''}
                </div>
                
                ${member.phone ? `<div class="member-phone">📞 ${escapeHtml(member.phone)}</div>` : ''}
                ${member.address ? `<div class="member-address">📍 ${escapeHtml(member.address)}</div>` : ''}
            </div>
        </div>
    `;
}

// 검색 입력 처리 (디바운싱)
function handleMemberSearch(event) {
    const query = event.target.value.trim();
    
    // 이전 타임아웃 취소
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // 300ms 후 검색 실행 (디바운싱)
    searchTimeout = setTimeout(() => {
        searchMembers(query);
    }, 300);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 회원 화면이 활성화될 때 데이터 로드
    const membersScreen = document.getElementById('members-screen');
    if (membersScreen) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (membersScreen.classList.contains('active')) {
                        if (currentMembersPage === 0) {
                            loadMembers(1);
                        }
                    }
                }
            });
        });
        
        observer.observe(membersScreen, { attributes: true });
    }
    
    // 회원 검색 입력
    const searchInput = document.getElementById('member-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleMemberSearch);
    }
});

console.log('✅ Members 모듈 로드 완료 (Railway API)');
