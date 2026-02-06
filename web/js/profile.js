// 프로필 기능

let currentUserProfile = null;

// 프로필 화면 로드
async function loadProfileScreen() {
    const container = document.getElementById('profile-content');
    container.innerHTML = '<div class="content-loading">프로필 로딩 중...</div>';
    
    await loadMyProfile();
}

// 내 프로필 로드
async function loadMyProfile() {
    const container = document.getElementById('profile-content');
    
    if (CONFIG.DEMO_MODE) {
        // 데모 모드: 샘플 프로필
        const demoProfile = {
            id: 1,
            name: '홍길동',
            email: 'hong@example.com',
            phone: '010-1234-5678',
            address: '서울시 영등포구',
            address_detail: '여의도동 123-45',
            company_name: '홍길동 회사',
            position: '대표',
            jc_role: '회장',
            is_special_member: true,
            profile_image_url: null
        };
        
        currentUserProfile = demoProfile;
        renderProfile(demoProfile);
        return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('사용자 정보를 찾을 수 없습니다');
        }

        const { data, error } = await supabase
            .from('members')
            .select(`
                id, name, email, phone, address, address_detail,
                company_name, position, jc_role, is_special_member,
                profile_image_url, birth_date, gender
            `)
            .eq('user_id', user.id)
            .single();

        if (error) throw error;

        currentUserProfile = data;
        renderProfile(data);
    } catch (error) {
        console.error('프로필 로드 오류:', error);
        container.innerHTML = '<div class="empty-state"><div class="empty-state-message">프로필을 불러올 수 없습니다</div></div>';
    }
}

// 프로필 렌더링
function renderProfile(profile) {
    const container = document.getElementById('profile-content');
    
    container.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar-large">
                ${profile.profile_image_url ? 
                    `<img src="${profile.profile_image_url}" alt="${profile.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
                    '👤'
                }
            </div>
            <div class="profile-name">
                ${profile.name}
                ${profile.is_special_member ? '<span class="special-member-badge">특우회</span>' : ''}
            </div>
            ${profile.jc_role ? `<div class="profile-role">${profile.jc_role}</div>` : ''}
        </div>

        <div class="profile-section">
            <h3 class="profile-section-title">기본 정보</h3>
            <div class="profile-field">
                <span class="profile-field-label">이메일</span>
                <span class="profile-field-value">${profile.email || '-'}</span>
            </div>
            <div class="profile-field">
                <span class="profile-field-label">휴대폰</span>
                <span class="profile-field-value">${profile.phone || '-'}</span>
            </div>
            <div class="profile-field">
                <span class="profile-field-label">주소</span>
                <span class="profile-field-value">${profile.address || '-'}</span>
            </div>
            ${profile.address_detail ? `
                <div class="profile-field">
                    <span class="profile-field-label">상세 주소</span>
                    <span class="profile-field-value">${profile.address_detail}</span>
                </div>
            ` : ''}
            ${profile.birth_date ? `
                <div class="profile-field">
                    <span class="profile-field-label">생년월일</span>
                    <span class="profile-field-value">${new Date(profile.birth_date).toLocaleDateString('ko-KR')}</span>
                </div>
            ` : ''}
        </div>

        ${profile.company_name || profile.position ? `
            <div class="profile-section">
                <h3 class="profile-section-title">직장 정보</h3>
                ${profile.company_name ? `
                    <div class="profile-field">
                        <span class="profile-field-label">회사명</span>
                        <span class="profile-field-value">${profile.company_name}</span>
                    </div>
                ` : ''}
                ${profile.position ? `
                    <div class="profile-field">
                        <span class="profile-field-label">직책</span>
                        <span class="profile-field-value">${profile.position}</span>
                    </div>
                ` : ''}
            </div>
        ` : ''}

        ${profile.jc_role ? `
            <div class="profile-section">
                <h3 class="profile-section-title">JC 정보</h3>
                <div class="profile-field">
                    <span class="profile-field-label">JC 직책</span>
                    <span class="profile-field-value">${profile.jc_role}</span>
                </div>
                <div class="profile-field">
                    <span class="profile-field-label">특우회 여부</span>
                    <span class="profile-field-value">${profile.is_special_member ? '특우회' : '일반회원'}</span>
                </div>
            </div>
        ` : ''}
    `;
}

// 프로필 수정 버튼 클릭
function handleEditProfile() {
    alert('프로필 수정 화면은 개발 중입니다.');
}
