// 영등포 JC — 환경설정 모듈 (이슈 #9)

const FONT_SIZES = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' };
const FONT_SIZE_LABELS = { small: '작게', medium: '보통', large: '크게', xlarge: '아주 크게' };

// 환경설정 화면 표시
function showSettingsScreen() {
    navigateToScreen('settings');
    renderSettingsScreen();
}

// 환경설정 메인 화면 렌더링
function renderSettingsScreen() {
    var container = document.getElementById('settings-screen-content');
    if (!container) return;

    var currentTheme = localStorage.getItem('theme') || 'light';
    var currentFontSize = localStorage.getItem('font_size') || 'medium';
    var isDark = currentTheme === 'dark';
    var fontLabel = FONT_SIZE_LABELS[currentFontSize] || '보통';

    var chevronSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';

    container.innerHTML = ''
        // 화면 섹션
        + '<div class="settings-group">'
        + '<div class="settings-group-title">화면</div>'
        + '<div class="settings-item settings-item--toggle">'
        + '<span class="settings-item-icon">&#127769;</span>'
        + '<span class="settings-item-label">다크모드</span>'
        + '<label class="toggle-switch"><input type="checkbox" id="settings-dark-toggle"' + (isDark ? ' checked' : '') + '><span class="toggle-slider"></span></label>'
        + '</div>'
        + '<div class="settings-item" onclick="showFontSizePicker()">'
        + '<span class="settings-item-icon">&#128292;</span>'
        + '<span class="settings-item-label">글꼴 크기</span>'
        + '<span class="settings-item-value" id="settings-font-label">' + fontLabel + '</span>'
        + '<span class="settings-item-chevron">' + chevronSvg + '</span>'
        + '</div>'
        + '</div>'

        // 알림 섹션
        + '<div class="settings-group">'
        + '<div class="settings-group-title">알림</div>'
        + '<div class="settings-item" onclick="showNotificationSettingsScreen()">'
        + '<span class="settings-item-icon">&#128276;</span>'
        + '<span class="settings-item-label">알림 설정</span>'
        + '<span class="settings-item-chevron">' + chevronSvg + '</span>'
        + '</div>'
        + '</div>'

        // 데이터 섹션
        + '<div class="settings-group">'
        + '<div class="settings-group-title">데이터</div>'
        + '<div class="settings-item" onclick="handleClearCache()">'
        + '<span class="settings-item-icon">&#128465;</span>'
        + '<span class="settings-item-label">캐시 삭제</span>'
        + '<span class="settings-item-chevron">' + chevronSvg + '</span>'
        + '</div>'
        + '</div>'

        // 계정 섹션
        + '<div class="settings-group">'
        + '<div class="settings-group-title">계정</div>'
        + '<div class="settings-item" onclick="showChangePasswordFromSettings()">'
        + '<span class="settings-item-icon">&#128274;</span>'
        + '<span class="settings-item-label">비밀번호 변경</span>'
        + '<span class="settings-item-chevron">' + chevronSvg + '</span>'
        + '</div>'
        + '<div class="settings-item settings-item--danger" onclick="handleLogoutFromSettings()">'
        + '<span class="settings-item-icon">&#10132;</span>'
        + '<span class="settings-item-label">로그아웃</span>'
        + '</div>'
        + '<div class="settings-item settings-item--danger" onclick="showWithdrawScreen()">'
        + '<span class="settings-item-icon">&#9888;</span>'
        + '<span class="settings-item-label">회원 탈퇴</span>'
        + '<span class="settings-item-chevron">' + chevronSvg + '</span>'
        + '</div>'
        + '</div>'

        // 정보 섹션
        + '<div class="settings-group">'
        + '<div class="settings-group-title">정보</div>'
        + '<div class="settings-item" onclick="showTermsPage()">'
        + '<span class="settings-item-icon">&#128203;</span>'
        + '<span class="settings-item-label">이용약관</span>'
        + '<span class="settings-item-chevron">' + chevronSvg + '</span>'
        + '</div>'
        + '<div class="settings-item" onclick="showPrivacyPage()">'
        + '<span class="settings-item-icon">&#128272;</span>'
        + '<span class="settings-item-label">개인정보 처리방침</span>'
        + '<span class="settings-item-chevron">' + chevronSvg + '</span>'
        + '</div>'
        + '<div class="settings-item settings-item--static">'
        + '<span class="settings-item-icon">&#8505;</span>'
        + '<span class="settings-item-label">앱 버전</span>'
        + '<span class="settings-item-value">v1.0.0 (웹앱)</span>'
        + '</div>'
        + '</div>';

    // 다크모드 토글 이벤트
    var darkToggle = document.getElementById('settings-dark-toggle');
    if (darkToggle) {
        darkToggle.addEventListener('change', function() {
            toggleDarkMode(this.checked);
        });
    }
}

// 다크모드 토글
function toggleDarkMode(enabled) {
    var theme = enabled ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    // 서버 동기화 (실패해도 무관)
    if (window.apiClient && apiClient.token) {
        apiClient.request('/settings', {
            method: 'PUT',
            body: JSON.stringify({ theme: theme })
        }).catch(function() {});
    }
}

// 글꼴 크기 선택 화면
function showFontSizePicker() {
    var container = document.getElementById('settings-screen-content');
    if (!container) return;
    var current = localStorage.getItem('font_size') || 'medium';

    container.innerHTML = ''
        + '<div style="padding:16px 0">'
        + '<button class="btn-back" onclick="renderSettingsScreen()" style="margin-bottom:12px;background:none;border:none;color:var(--text-primary);font-size:15px;cursor:pointer">&larr; 돌아가기</button>'
        + '<h3 style="font-size:17px;font-weight:600;margin-bottom:16px">글꼴 크기</h3>'
        + '<div class="settings-group">'
        + Object.keys(FONT_SIZES).map(function(key) {
            var checked = key === current ? ' checked' : '';
            return '<label class="settings-item" style="cursor:pointer">'
                + '<input type="radio" name="font-size-radio" value="' + key + '"' + checked + ' style="width:18px;height:18px;accent-color:var(--primary-color)">'
                + '<span class="settings-item-label">' + FONT_SIZE_LABELS[key] + ' (' + FONT_SIZES[key] + ')</span>'
                + '</label>';
        }).join('')
        + '</div>'
        + '<div style="margin-top:16px;padding:16px;border:1px solid var(--border-color);border-radius:12px">'
        + '<div style="font-size:var(--text-base,15px);color:var(--text-primary)">미리보기: 가나다라마바사 ABC 123</div>'
        + '<div style="font-size:var(--text-base,15px);color:var(--text-secondary)">이 크기로 텍스트가 표시됩니다.</div>'
        + '</div>'
        + '</div>';

    container.querySelectorAll('input[name="font-size-radio"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            changeFontSize(this.value);
        });
    });
}

// 글꼴 크기 변경
function changeFontSize(size) {
    localStorage.setItem('font_size', size);
    document.documentElement.style.fontSize = FONT_SIZES[size] || '16px';
    // 라벨 업데이트
    var label = document.getElementById('settings-font-label');
    if (label) label.textContent = FONT_SIZE_LABELS[size] || '보통';
    // 서버 동기화
    if (window.apiClient && apiClient.token) {
        apiClient.request('/settings', {
            method: 'PUT',
            body: JSON.stringify({ font_size: size })
        }).catch(function() {});
    }
}

// 캐시 삭제
function handleClearCache() {
    if (!confirm('캐시를 삭제하시겠습니까?\n저장된 임시 데이터를 삭제합니다.\n로그인 상태는 유지됩니다.')) return;
    var keepKeys = ['auth_token', 'user_info', 'theme', 'font_size', 'push_banner_dismissed'];
    Object.keys(localStorage).forEach(function(key) {
        if (!keepKeys.includes(key)) localStorage.removeItem(key);
    });
    if ('caches' in window) {
        caches.keys().then(function(names) {
            names.forEach(function(name) { caches.delete(name); });
        });
    }
    showToast('캐시가 삭제되었습니다', 'success');
}

// 비밀번호 변경 (기존 프로필 함수 활용)
function showChangePasswordFromSettings() {
    if (typeof showChangePasswordDialog === 'function') {
        showChangePasswordDialog();
    }
}

// 로그아웃
function handleLogoutFromSettings() {
    if (typeof handleLogout === 'function') {
        handleLogout();
    }
}

// 회원 탈퇴 화면
function showWithdrawScreen() {
    var container = document.getElementById('settings-screen-content');
    if (!container) return;

    container.innerHTML = ''
        + '<div style="padding:16px 0">'
        + '<button class="btn-back" onclick="renderSettingsScreen()" style="margin-bottom:12px;background:none;border:none;color:var(--text-primary);font-size:15px;cursor:pointer">&larr; 돌아가기</button>'
        + '<h3 style="font-size:17px;font-weight:600;margin-bottom:16px;color:var(--error-color)">회원 탈퇴</h3>'
        + '<div style="padding:16px;background:var(--error-bg);border-radius:12px;margin-bottom:16px;font-size:14px;color:var(--error-text)">'
        + '회원 탈퇴 시 아래 데이터가 삭제되며, 복구할 수 없습니다.<br><br>'
        + '&bull; 작성한 게시글 및 댓글<br>'
        + '&bull; 프로필 정보<br>'
        + '&bull; 알림 설정 및 구독 정보'
        + '</div>'
        + '<div class="form-group"><label>탈퇴 사유 (선택)</label><textarea id="withdraw-reason" rows="3" style="width:100%;padding:10px 12px;border:1px solid var(--border-color);border-radius:8px;font-family:inherit;font-size:14px;resize:vertical" placeholder="탈퇴 사유를 입력해주세요"></textarea></div>'
        + '<div class="form-group"><label>비밀번호 확인</label><input type="password" id="withdraw-password" placeholder="현재 비밀번호를 입력하세요" style="width:100%;min-height:44px;padding:10px 12px;border:1px solid var(--border-color);border-radius:8px;font-size:15px"></div>'
        + '<div id="withdraw-error" class="inline-error-message"></div>'
        + '<button class="btn btn-danger" id="withdraw-submit-btn" onclick="handleWithdraw()" style="margin-top:8px">회원 탈퇴하기</button>'
        + '</div>';
}

// 회원 탈퇴 처리
async function handleWithdraw() {
    var password = (document.getElementById('withdraw-password')?.value || '').trim();
    var reason = (document.getElementById('withdraw-reason')?.value || '').trim();
    var errorEl = document.getElementById('withdraw-error');
    var submitBtn = document.getElementById('withdraw-submit-btn');

    if (!password) {
        if (errorEl) { errorEl.textContent = '비밀번호를 입력해주세요.'; errorEl.classList.add('show'); }
        return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '처리 중...'; }
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('show'); }

    try {
        var result = await apiClient.request('/auth/withdraw', {
            method: 'POST',
            body: JSON.stringify({ password: password, reason: reason })
        });
        if (result.success) {
            apiClient.clearToken();
            navigateToScreen('login');
            showToast('회원 탈퇴가 완료되었습니다', 'success');
        } else {
            if (errorEl) { errorEl.textContent = result.message || '탈퇴 처리에 실패했습니다.'; errorEl.classList.add('show'); }
        }
    } catch (err) {
        if (errorEl) { errorEl.textContent = err.message || '탈퇴 처리 중 오류가 발생했습니다.'; errorEl.classList.add('show'); }
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '회원 탈퇴하기'; }
    }
}

// 이용약관 / 개인정보 처리방침 (placeholder)
function showTermsPage() {
    alert('이용약관 페이지는 준비 중입니다.');
}

function showPrivacyPage() {
    alert('개인정보 처리방침 페이지는 준비 중입니다.');
}

console.log('Settings module loaded');
