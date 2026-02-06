// 회원 관리 기능

let membersPage = 1;
const membersPerPage = 50;
let isLoadingMembers = false;
let hasMoreMembers = true;
let searchTimeout = null;

// 회원 화면 로드
async function loadMembersScreen() {
    // 초기화
    membersPage = 1;
    hasMoreMembers = true;
    const container = document.getElementById('member-list');
    container.innerHTML = '<div class="content-loading">회원 목록 로딩 중...</div>';
    
    // 검색 이벤트 리스너
    const searchInput = document.getElementById('member-search');
    searchInput.addEventListener('input', handleMemberSearch);
    
    await loadMembers();
    
    // 무한 스크롤 이벤트 리스너
    const screenContent = document.querySelector('#members-screen .screen-content');
    screenContent.addEventListener('scroll', handleMembersScroll);
}

// 회원 검색 핸들러 (디바운싱)
function handleMemberSearch(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        membersPage = 1;
        hasMoreMembers = true;
        const container = document.getElementById('member-list');
        container.innerHTML = '<div class="content-loading">검색 중...</div>';
        await loadMembers(e.target.value);
    }, 500);
}

// 회원 목록 로드
async function loadMembers(searchTerm = '') {
    if (isLoadingMembers || !hasMoreMembers) return;
    
    isLoadingMembers = true;
    const container = document.getElementById('member-list');
    
    if (CONFIG.DEMO_MODE) {
        // 데모 모드: 샘플 회원
        const demoMembers = Array.from({ length: 15 }, (_, i) => ({
            id: i + 1,
            name: `회원${i + 1}`,
            jc_role: i % 3 === 0 ? '회장' : i % 3 === 1 ? '총무' : null,
            company_name: i % 2 === 0 ? `회사${i + 1}` : null,
            is_special_member: i % 5 === 0,
            profile_image_url: null
        }));
        
        renderMembers(demoMembers);
        hasMoreMembers = false;
        isLoadingMembers = false;
        return;
    }

    try {
        const from = (membersPage - 1) * membersPerPage;
        const to = from + membersPerPage - 1;

        let query = supabase
            .from('members')
            .select('id, name, jc_role, company_name, is_special_member, profile_image_url', { count: 'exact' })
            .eq('is_approved', true)
            .eq('is_deleted', false);

        // 검색어가 있으면 검색 조건 추가
        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,jc_role.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query
            .order('name', { ascending: true })
            .range(from, to);

        if (error) throw error;

        if (membersPage === 1) {
            container.innerHTML = '';
        }

        if (!data || data.length === 0) {
            if (membersPage === 1) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">👥</div>
                        <div class="empty-state-message">${searchTerm ? '검색 결과가 없습니다' : '회원이 없습니다'}</div>
                    </div>
                `;
            }
            hasMoreMembers = false;
        } else {
            renderMembers(data);
            membersPage++;
            hasMoreMembers = (from + data.length) < count;
        }
    } catch (error) {
        console.error('회원 목록 로드 오류:', error);
        if (membersPage === 1) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-message">회원 목록을 불러올 수 없습니다</div></div>';
        }
    } finally {
        isLoadingMembers = false;
    }
}

// 회원 렌더링
function renderMembers(members) {
    const container = document.getElementById('member-list');
    
    const membersHTML = members.map(member => `
        <div class="card member-card" onclick="navigateToMemberProfile(${member.id})">
            <div class="member-avatar">
                ${member.profile_image_url ? 
                    `<img src="${member.profile_image_url}" alt="${member.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
                    '👤'
                }
            </div>
            <div class="member-info">
                <div class="member-name">
                    ${member.name}
                    ${member.is_special_member ? '<span class="special-member-badge">특우회</span>' : ''}
                </div>
                ${member.jc_role ? `<div class="member-role">${member.jc_role}</div>` : ''}
                ${member.company_name ? `<div class="member-company">${member.company_name}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    if (membersPage === 1) {
        container.innerHTML = membersHTML;
    } else {
        container.innerHTML += membersHTML;
    }
}

// 무한 스크롤 핸들러
function handleMembersScroll(e) {
    const element = e.target;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 100) {
        const searchTerm = document.getElementById('member-search').value;
        loadMembers(searchTerm);
    }
}

// 회원 프로필로 이동 (임시)
function navigateToMemberProfile(id) {
    alert(`회원 프로필 (ID: ${id}) 화면은 개발 중입니다.`);
}
