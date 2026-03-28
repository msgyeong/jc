// 유틸리티 함수

// 이메일 유효성 검사
function validateEmail(email) {
    const re = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return re.test(email.toLowerCase());
}

// 비밀번호 유효성 검사
function validatePassword(password) {
    return password && password.length >= 8;
}

// 전화번호 포맷팅
function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phone;
}

// 전화번호 입력 자동 포맷팅
function setupPhoneFormatting(input) {
    input.addEventListener('input', (e) => {
        const cleaned = e.target.value.replace(/\D/g, '');
        e.target.value = formatPhone(cleaned);
    });
}

// 에러 메시지 표시
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

// 에러 메시지 숨기기
function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
        element.style.display = 'none';
    }
}

// 모든 에러 메시지 숨기기
function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    document.querySelectorAll('.inline-error-message').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
}

// 인라인 에러 메시지 표시
function showInlineError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

// 로딩 상태 설정
function setButtonLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    if (isLoading) {
        button.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'flex';
    } else {
        button.disabled = false;
        if (btnText) btnText.style.display = 'block';
        if (btnLoading) btnLoading.style.display = 'none';
    }
}

// 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 로컬 스토리지 헬퍼
const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('로컬 스토리지 저장 실패:', e);
        }
    },
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('로컬 스토리지 읽기 실패:', e);
            return null;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('로컬 스토리지 삭제 실패:', e);
        }
    }
};

// 세션 스토리지 헬퍼
const sessionStore = {
    set: (key, value) => {
        try {
            window.sessionStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('세션 스토리지 저장 실패:', e);
        }
    },
    get: (key) => {
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('세션 스토리지 읽기 실패:', e);
            return null;
        }
    },
    remove: (key) => {
        try {
            window.sessionStorage.removeItem(key);
        } catch (e) {
            console.error('세션 스토리지 삭제 실패:', e);
        }
    }
};

// 날짜가 3일 이내인지 확인
function isNew(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
}

// 날짜 포맷팅 (format 파라미터 지원)
// format 미지정 시 상대 시간, 'YYYY-MM-DD' / 'DD' / 'MM월' 지원
function formatDate(dateString, format) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (format) {
        switch (format) {
            case 'DD': return day;
            case 'MM월': return `${parseInt(month)}월`;
            case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
            default: return `${year}-${month}-${day}`;
        }
    }

    // 상대 시간 (format 미지정)
    const now = new Date();
    const diffTime = now - date;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 상대 시간 포맷 별칭 (formatDate의 format 미지정 = 상대 시간)
function formatRelativeTime(dateString) { return formatDate(dateString); }

// 현재 사용자 정보 (안전하게)
function getCurrentUserSafe() {
    try {
        return typeof getCurrentUser === 'function'
            ? getCurrentUser()
            : JSON.parse(localStorage.getItem('user_info') || 'null');
    } catch (_) { return null; }
}

// HTML 이스케이프
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== 토스트 알림 (큐잉 — 최대 3개 동시 표시) ==========
var _toastQueue = [];
var _toastMaxVisible = 3;

function showToast(message, type = 'success') {
    const iconMap = {
        success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
        error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    // 최대 개수 초과 시 가장 오래된 것 즉시 제거
    var existing = document.querySelectorAll('.toast');
    if (existing.length >= _toastMaxVisible) {
        existing[0].remove();
    }

    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.innerHTML = (iconMap[type] || '') + '<span>' + escapeHtml(message) + '</span>';
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.classList.add('toast--exit');
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

// ========== 빈 상태 HTML 생성 ==========
function renderEmptyState(iconType, title, desc, cta) {
    const icons = {
        document: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        edit: '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        chat: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    };
    let html = '<div class="empty-state"><div class="empty-state-icon">' + (icons[iconType] || icons.document) + '</div>';
    html += '<div class="empty-state-title">' + title + '</div>';
    if (desc) html += '<div class="empty-state-desc">' + desc + '</div>';
    if (cta) html += '<button class="empty-state-cta" onclick="' + cta.action + '">' + cta.label + '</button>';
    html += '</div>';
    return html;
}

// ========== 에러 상태 HTML 생성 ==========
function renderErrorState(title, desc, retryFn) {
    let html = '<div class="error-state">';
    html += '<div class="error-state-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>';
    html += '<div class="error-state-title">' + title + '</div>';
    if (desc) html += '<div class="error-state-desc">' + desc + '</div>';
    if (retryFn) html += '<button class="error-state-retry" onclick="' + retryFn + '">다시 시도</button>';
    html += '</div>';
    return html;
}

// ========== 로딩 상태 HTML 생성 ==========
function renderLoadingState(message) {
    return '<div class="loading-state"><div class="loading-spinner"></div>' +
        (message ? '<div class="loading-state-text">' + message + '</div>' : '') +
        '</div>';
}

// ========== 스켈레톤 로딩 HTML ==========
function renderSkeleton(type) {
    if (type === 'schedule-detail') {
        return '<div style="padding:16px"><div class="skeleton skeleton--title" style="width:40%;margin-bottom:8px"></div><div class="skeleton skeleton--title" style="width:80%"></div><div class="skeleton skeleton--text" style="width:70%;margin-top:16px"></div><div class="skeleton skeleton--text" style="width:60%"></div><div class="skeleton skeleton--text" style="width:50%"></div><div class="skeleton skeleton--text" style="width:40%"></div><div style="margin-top:16px"><div class="skeleton skeleton--text" style="width:90%"></div><div class="skeleton skeleton--text" style="width:80%"></div><div class="skeleton skeleton--text" style="width:70%"></div></div></div>';
    }
    if (type === 'list') {
        let html = '';
        for (let i = 0; i < 4; i++) {
            html += '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #F3F4F6"><div class="skeleton skeleton--avatar"></div><div style="flex:1"><div class="skeleton skeleton--title" style="width:' + (60 + i * 5) + '%"></div><div class="skeleton skeleton--text" style="width:' + (70 + i * 3) + '%"></div></div></div>';
        }
        return html;
    }
    if (type === 'grid') {
        var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px">';
        for (var i = 0; i < 4; i++) {
            html += '<div style="border-radius:12px;overflow:hidden"><div class="skeleton" style="height:100px;width:100%"></div><div style="padding:8px"><div class="skeleton skeleton--title" style="width:' + (60 + i * 8) + '%"></div><div class="skeleton skeleton--text" style="width:' + (50 + i * 5) + '%"></div></div></div>';
        }
        html += '</div>';
        return html;
    }
    if (type === 'member') {
        var html = '';
        for (var i = 0; i < 5; i++) {
            html += '<div style="display:flex;gap:12px;padding:12px 16px;align-items:center"><div class="skeleton skeleton--circle" style="width:44px;height:44px;flex-shrink:0"></div><div style="flex:1"><div class="skeleton skeleton--title" style="width:' + (40 + i * 10) + '%"></div><div class="skeleton skeleton--text" style="width:' + (55 + i * 5) + '%"></div></div></div>';
        }
        return html;
    }
    if (type === 'calendar') {
        var html = '<div style="padding:16px"><div class="skeleton" style="height:24px;width:30%;margin:0 auto 16px"></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">';
        for (var i = 0; i < 35; i++) {
            html += '<div class="skeleton" style="aspect-ratio:1;border-radius:8px"></div>';
        }
        html += '</div></div>';
        return html;
    }
    return '<div style="padding:24px;text-align:center"><div class="loading-spinner"></div></div>';
}
