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
}

// 비밀번호 변경 (설정 화면에서)
function showChangePasswordFromSettings() {
    var container = document.getElementById('settings-screen-content');
    if (!container) return;

    container.innerHTML = ''
        + '<div style="padding:16px 0">'
        + '<button class="btn-back" onclick="renderSettingsScreen()" style="margin-bottom:12px;background:none;border:none;color:var(--text-primary);font-size:15px;cursor:pointer">&larr; 돌아가기</button>'
        + '<h3 style="font-size:17px;font-weight:600;margin-bottom:16px">비밀번호 변경</h3>'
        + '<form onsubmit="handlePwChangeFromSettings(event)">'
        + '<div class="form-group"><label>현재 비밀번호</label><input type="password" id="settings-pw-current" required style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:8px"></div>'
        + '<div class="form-group"><label>새 비밀번호 (6자 이상)</label><input type="password" id="settings-pw-new" required minlength="6" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:8px"></div>'
        + '<div class="form-group"><label>새 비밀번호 확인</label><input type="password" id="settings-pw-confirm" required minlength="6" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:8px"></div>'
        + '<div id="settings-pw-error" style="color:#DC2626;font-size:13px;margin-bottom:8px"></div>'
        + '<button type="submit" class="btn btn-primary" id="settings-pw-btn">비밀번호 변경</button>'
        + '</form></div>';
}

async function handlePwChangeFromSettings(e) {
    e.preventDefault();
    var current = document.getElementById('settings-pw-current')?.value;
    var newPw = document.getElementById('settings-pw-new')?.value;
    var confirm = document.getElementById('settings-pw-confirm')?.value;
    var errEl = document.getElementById('settings-pw-error');
    var btn = document.getElementById('settings-pw-btn');

    if (errEl) errEl.textContent = '';
    if (newPw !== confirm) { if (errEl) errEl.textContent = '새 비밀번호가 일치하지 않습니다.'; return; }
    if (newPw.length < 6) { if (errEl) errEl.textContent = '비밀번호는 6자 이상이어야 합니다.'; return; }

    if (btn) { btn.disabled = true; btn.textContent = '변경 중...'; }
    try {
        var res = await apiClient.request('/profile/password', {
            method: 'PUT',
            body: JSON.stringify({ current_password: current, new_password: newPw })
        });
        if (res.success) {
            renderSettingsScreen();
        } else {
            if (errEl) errEl.textContent = res.message || '변경 실패';
        }
    } catch (err) {
        if (errEl) errEl.textContent = err.message || '오류 발생';
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '비밀번호 변경'; }
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
        } else {
            if (errorEl) { errorEl.textContent = result.message || '탈퇴 처리에 실패했습니다.'; errorEl.classList.add('show'); }
        }
    } catch (err) {
        if (errorEl) { errorEl.textContent = err.message || '탈퇴 처리 중 오류가 발생했습니다.'; errorEl.classList.add('show'); }
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '회원 탈퇴하기'; }
    }
}

// 이용약관
function showTermsPage() {
    var container = document.getElementById('settings-screen-content');
    if (!container) return;

    container.innerHTML = ''
        + '<div style="padding:16px 0">'
        + '<button class="btn-back" onclick="renderSettingsScreen()" style="margin-bottom:12px;background:none;border:none;color:var(--text-primary);font-size:15px;cursor:pointer">&larr; 돌아가기</button>'
        + '<h3 style="font-size:17px;font-weight:600;margin-bottom:16px">이용약관</h3>'
        + '<div class="legal-content">'
        + '<h4>영등포 JC 회원관리 앱 이용약관</h4>'
        + '<p><strong>제1조 (목적)</strong><br>이 약관은 영등포청년회의소(이하 "회의소")가 제공하는 회원관리 앱(이하 "서비스")의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>'
        + '<p><strong>제2조 (이용자격)</strong><br>서비스는 회의소 회원으로 가입 승인된 자에 한하여 이용할 수 있습니다.</p>'
        + '<p><strong>제3조 (서비스의 내용)</strong><br>회의소는 다음과 같은 서비스를 제공합니다:<br>① 공지사항 및 게시판 기능<br>② 일정 관리 및 참석 여부 확인<br>③ 회원 정보 조회<br>④ 푸시 알림 서비스</p>'
        + '<p><strong>제4조 (이용자의 의무)</strong><br>① 이용자는 타인의 개인정보를 부정 사용하거나 유출해서는 안 됩니다.<br>② 서비스를 통해 취득한 정보를 회의소의 사전 승인 없이 외부에 공개하거나 상업적으로 이용할 수 없습니다.</p>'
        + '<p><strong>제5조 (서비스 변경 및 중단)</strong><br>회의소는 운영상 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있으며, 사전에 공지합니다.</p>'
        + '<p><strong>제6조 (탈퇴 및 자격상실)</strong><br>① 회원은 언제든지 탈퇴를 요청할 수 있습니다.<br>② 탈퇴 시 작성한 게시글 및 개인정보는 삭제됩니다.</p>'
        + '<p style="color:var(--text-secondary);font-size:13px;margin-top:16px">시행일: 2026년 1월 1일</p>'
        + '</div>'
        + '</div>';
}

// 개인정보 처리방침
function showPrivacyPage() {
    var container = document.getElementById('settings-screen-content');
    if (!container) return;

    container.innerHTML = ''
        + '<div style="padding:16px 0">'
        + '<button class="btn-back" onclick="renderSettingsScreen()" style="margin-bottom:12px;background:none;border:none;color:var(--text-primary);font-size:15px;cursor:pointer">&larr; 돌아가기</button>'
        + '<h3 style="font-size:17px;font-weight:600;margin-bottom:16px">개인정보 처리방침</h3>'
        + '<div class="legal-content">'
        + '<h4>영등포 JC 개인정보 처리방침</h4>'
        + '<p><strong>1. 수집하는 개인정보 항목</strong><br>① 필수: 이름, 이메일, 비밀번호, 연락처<br>② 선택: 주소, 생년월일, 성별, 회사/직책/부서, 업종, 프로필 사진</p>'
        + '<p><strong>2. 개인정보의 이용 목적</strong><br>① 회원 식별 및 가입 승인<br>② 공지사항, 일정 등 서비스 제공<br>③ 푸시 알림 발송<br>④ 회원 간 연락처 공유 (앱 내 한정)</p>'
        + '<p><strong>3. 개인정보의 보유 및 이용 기간</strong><br>① 회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.<br>② 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>'
        + '<p><strong>4. 개인정보의 제3자 제공</strong><br>회의소는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.</p>'
        + '<p><strong>5. 개인정보의 파기</strong><br>보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 파기합니다.</p>'
        + '<p><strong>6. 개인정보 보호 책임자</strong><br>영등포청년회의소 사무국<br>문의: 앱 내 관리자 연락</p>'
        + '<p style="color:var(--text-secondary);font-size:13px;margin-top:16px">시행일: 2026년 1월 1일</p>'
        + '</div>'
        + '</div>';
}

console.log('Settings module loaded');
