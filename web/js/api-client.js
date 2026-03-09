// API 클라이언트 (Railway 백엔드 연동)
class ApiClient {
    constructor() {
        // 로컬 테스트: localhost:3000 사용, Railway 배포: /api 사용
        this.baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api' 
            : '/api';
        this.token = localStorage.getItem('auth_token');
        console.log('📡 API Base URL:', this.baseURL);
    }
    
    /**
     * JWT 토큰 설정
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
        console.log('✅ JWT 토큰 저장됨');
    }
    
    /**
     * JWT 토큰 제거
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        console.log('🗑️ JWT 토큰 제거됨');
    }
    
    /**
     * HTTP 요청 헬퍼
     */
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
            ...options.headers
        };
        
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                console.error('API 에러:', data.message || data);
                throw new Error(data.message || 'API 요청 실패');
            }
            
            return data;
        } catch (error) {
            if (error.message && !error.message.startsWith('API')) {
                console.error('API 요청 실패:', error.message);
            }
            throw error;
        }
    }
    
    // ============================================
    // 인증 API
    // ============================================
    
    /**
     * 로그인
     */
    async login(email, password) {
        const result = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (result.token) {
            this.setToken(result.token);
        }
        
        return result;
    }
    
    /**
     * 회원가입
     */
    async signup(userData) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    
    /**
     * 로그아웃
     */
    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.log('로그아웃 API 호출 실패 (무시)');
        } finally {
            this.clearToken();
        }
    }
    
    /**
     * 현재 사용자 정보 조회
     */
    async getMe() {
        return this.request('/auth/me');
    }
    
    /**
     * 비밀번호 재설정 (이메일 + 이름 확인)
     */
    async resetPassword(email, name) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, name })
        });
    }
    
    // ============================================
    // 게시판 API
    // ============================================
    
    /**
     * 게시글 목록 조회
     */
    async getPosts(page = 1, limit = 20, category = null) {
        let url = `/posts?page=${page}&limit=${limit}`;
        if (category) url += `&category=${category}`;
        return this.request(url);
    }
    
    /**
     * 게시글 상세 조회
     */
    async getPost(id) {
        return this.request(`/posts/${id}`);
    }
    
    /**
     * 게시글 작성
     */
    async createPost(postData) {
        return this.request('/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    }
    
    /**
     * 게시글 수정
     */
    async updatePost(id, postData) {
        return this.request(`/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    }
    
    /**
     * 게시글 삭제
     */
    async deletePost(id) {
        return this.request(`/posts/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * 게시글 이미지 1장 업로드 (multipart). 반환: { success, url }
     */
    async uploadPostImage(file) {
        const url = `${this.baseURL}/upload`;
        const form = new FormData();
        form.append('image', file);
        const res = await fetch(url, {
            method: 'POST',
            headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
            body: form
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || '업로드 실패');
        return data;
    }

    /**
     * 게시글 댓글 목록
     */
    async getPostComments(postId) {
        return this.request(`/posts/${postId}/comments`);
    }

    /**
     * 게시글 댓글 작성
     */
    async createPostComment(postId, content) {
        return this.request(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    /**
     * 게시글 공감 토글
     */
    async togglePostLike(postId) {
        return this.request(`/posts/${postId}/like`, {
            method: 'POST'
        });
    }
    
    // ============================================
    // 공지사항 API
    // ============================================
    
    /**
     * 공지사항 목록 조회
     */
    async getNotices(page = 1, limit = 20) {
        return this.request(`/notices?page=${page}&limit=${limit}`);
    }
    
    /**
     * 공지사항 상세 조회
     */
    async getNotice(id) {
        return this.request(`/notices/${id}`);
    }
    
    /**
     * 공지사항 작성
     */
    async createNotice(noticeData) {
        return this.request('/notices', {
            method: 'POST',
            body: JSON.stringify(noticeData)
        });
    }
    
    /**
     * 공지사항 수정
     */
    async updateNotice(id, noticeData) {
        return this.request(`/notices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(noticeData)
        });
    }
    
    /**
     * 공지사항 삭제
     */
    async deleteNotice(id) {
        return this.request(`/notices/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * 공지 참석 현황 조회
     */
    async getNoticeAttendance(id) {
        return this.request(`/notices/${id}/attendance`);
    }

    /**
     * 공지 참석 상태 업데이트
     */
    async updateNoticeAttendance(id, status) {
        return this.request(`/notices/${id}/attendance`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
    }
    
    // ============================================
    // 일정 API
    // ============================================
    
    /**
     * 일정 목록 조회
     */
    async getSchedules(upcoming = true) {
        return this.request(`/schedules?upcoming=${upcoming}`);
    }
    
    /**
     * 일정 상세 조회
     */
    async getSchedule(id) {
        return this.request(`/schedules/${id}`);
    }
    
    /**
     * 일정 등록
     */
    async createSchedule(scheduleData) {
        return this.request('/schedules', {
            method: 'POST',
            body: JSON.stringify(scheduleData)
        });
    }
    
    /**
     * 일정 수정
     */
    async updateSchedule(id, scheduleData) {
        return this.request(`/schedules/${id}`, {
            method: 'PUT',
            body: JSON.stringify(scheduleData)
        });
    }
    
    /**
     * 일정 삭제
     */
    async deleteSchedule(id) {
        return this.request(`/schedules/${id}`, {
            method: 'DELETE'
        });
    }
    
    // ============================================
    // 회원 API
    // ============================================
    
    /**
     * 회원 목록 조회
     */
    async getMembers(page = 1, limit = 50) {
        return this.request(`/members?page=${page}&limit=${limit}`);
    }
    
    /**
     * 회원 검색
     */
    async searchMembers(query) {
        return this.request(`/members/search?q=${encodeURIComponent(query)}`);
    }
    
    /**
     * 회원 프로필 조회
     */
    async getMember(id) {
        return this.request(`/members/${id}`);
    }
    
    // ============================================
    // 프로필 API
    // ============================================
    
    /**
     * 내 프로필 조회
     */
    async getProfile() {
        return this.request('/profile');
    }
    
    /**
     * 프로필 수정
     */
    async updateProfile(profileData) {
        return this.request('/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }
    
    /**
     * 프로필 이미지 URL 업데이트
     */
    async updateProfileImage(imageUrl) {
        return this.request('/profile/image', {
            method: 'PUT',
            body: JSON.stringify({ profile_image: imageUrl })
        });
    }

    /**
     * 비밀번호 변경
     */
    async changePassword(currentPassword, newPassword) {
        return this.request('/profile/password', {
            method: 'PUT',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        });
    }
}

// 전역 API 클라이언트 인스턴스
window.apiClient = new ApiClient();

console.log('✅ API 클라이언트 초기화 완료');
