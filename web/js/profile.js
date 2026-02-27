// 프로필 관련 기능 (Railway API 연동)

let profileLoaded = false;

// 내 프로필 로드
async function loadProfile() {
    console.log('👤 프로필 로드');
    
    const container = document.getElementById('profile-content');
    if (!container) return;
    
    try {
        container.innerHTML = '<div class="content-loading">프로필 로딩 중...</div>';
        
        // API로 프로필 조회
        const result = await apiClient.getProfile();
        
        if (result.success && result.profile) {
            container.innerHTML = renderProfile(result.profile);
            profileLoaded = true;
        } else {
            container.innerHTML = '<div class="error-state">프로필을 불러올 수 없습니다.</div>';
        }
        
    } catch (error) {
        console.error('프로필 로드 실패:', error);
        container.innerHTML = '<div class="error-state">프로필을 불러올 수 없습니다.</div>';
    }
}

// 프로필 렌더링
function renderProfile(profile) {
    return `
        <div class="profile-container">
            <!-- 프로필 헤더 -->
            <div class="profile-header">
                <div class="profile-avatar-large">
                    ${profile.profile_image ? 
                        `<img src="${profile.profile_image}" alt="${profile.name}">` :
                        `<div class="profile-avatar-large-placeholder">${profile.name ? profile.name[0] : '?'}</div>`
                    }
                </div>
                <h2 class="profile-name">${escapeHtml(profile.name || '이름 없음')}</h2>
                <div class="profile-role">
                    ${getRoleText(profile.role)}
                </div>
                <div class="profile-status">
                    ${getStatusBadge(profile.status)}
                </div>
            </div>
            
            <!-- 기본 정보 -->
            <div class="profile-section">
                <h3 class="profile-section-title">기본 정보</h3>
                <div class="profile-info-grid">
                    <div class="profile-info-item">
                        <span class="profile-info-label">이메일</span>
                        <span class="profile-info-value">${escapeHtml(profile.email || '-')}</span>
                    </div>
                    <div class="profile-info-item">
                        <span class="profile-info-label">휴대폰</span>
                        <span class="profile-info-value">${escapeHtml(profile.phone || '-')}</span>
                    </div>
                    <div class="profile-info-item">
                        <span class="profile-info-label">주소</span>
                        <span class="profile-info-value">${escapeHtml(profile.address || '-')}</span>
                    </div>
                    ${profile.birth_date ? `
                        <div class="profile-info-item">
                            <span class="profile-info-label">생년월일</span>
                            <span class="profile-info-value">${formatDate(profile.birth_date, 'YYYY-MM-DD')}</span>
                        </div>
                    ` : ''}
                    ${profile.gender ? `
                        <div class="profile-info-item">
                            <span class="profile-info-label">성별</span>
                            <span class="profile-info-value">${getGenderText(profile.gender)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- 가입 정보 -->
            <div class="profile-section">
                <h3 class="profile-section-title">가입 정보</h3>
                <div class="profile-info-grid">
                    <div class="profile-info-item">
                        <span class="profile-info-label">가입일</span>
                        <span class="profile-info-value">${formatDate(profile.created_at, 'YYYY-MM-DD')}</span>
                    </div>
                    ${profile.updated_at ? `
                        <div class="profile-info-item">
                            <span class="profile-info-label">최종 수정일</span>
                            <span class="profile-info-value">${formatDate(profile.updated_at, 'YYYY-MM-DD')}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            ${['super_admin', 'admin'].includes(profile.role) ? `
            <!-- 관리자 메뉴 -->
            <div class="profile-section">
                <button onclick="navigateToScreen('admin')" style="
                    width:100%;padding:16px;background:#4f6ef7;color:#fff;
                    border:none;border-radius:12px;font-size:16px;font-weight:600;
                    cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
                    🔧 관리자 메뉴
                </button>
            </div>
            ` : ''}
        </div>
    `;
}

// 역할 텍스트 변환
function getRoleText(role) {
    const roleMap = {
        'super_admin': '총관리자',
        'admin': '관리자',
        'member': '회원',
        'pending': '가입 대기'
    };
    
    return roleMap[role] || role;
}

// 상태 배지 생성
function getStatusBadge(status) {
    const statusMap = {
        'active': '<span class="badge badge-success">활성</span>',
        'pending': '<span class="badge badge-warning">승인 대기</span>',
        'suspended': '<span class="badge badge-danger">정지</span>'
    };
    
    return statusMap[status] || status;
}

// 성별 텍스트 변환
function getGenderText(gender) {
    const genderMap = {
        'male': '남성',
        'female': '여성',
        'other': '기타'
    };
    
    return genderMap[gender] || gender;
}

// 프로필 수정 버튼 클릭
function handleEditProfile() {
    // TODO: 프로필 수정 화면으로 이동
    alert('프로필 수정 기능은 준비 중입니다.');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 프로필 화면이 활성화될 때 데이터 로드
    const profileScreen = document.getElementById('profile-screen');
    if (profileScreen) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (profileScreen.classList.contains('active')) {
                        if (!profileLoaded) {
                            loadProfile();
                        }
                    }
                }
            });
        });
        
        observer.observe(profileScreen, { attributes: true });
    }
    
    // 프로필 수정 버튼
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', handleEditProfile);
    }
});

console.log('✅ Profile 모듈 로드 완료 (Railway API)');
