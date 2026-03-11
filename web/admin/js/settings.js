/* ================================================
   영등포 JC — 관리자 시스템 설정
   ================================================ */

function renderSettings(container) {

    function render() {
        var html = '';

        // Toolbar
        html += '<div class="page-toolbar">';
        html += '  <h2 class="page-title">시스템 설정</h2>';
        html += '</div>';

        // App Settings
        html += '<div class="settings-section">';
        html += '  <div class="settings-section-header">';
        html += '    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
        html += '    <h3>앱 설정</h3>';
        html += '  </div>';
        html += '  <div class="settings-section-body">';
        html += '    <div class="form-field">';
        html += '      <label for="setting-app-name">앱 이름</label>';
        html += '      <input type="text" id="setting-app-name" placeholder="영등포 JC">';
        html += '    </div>';
        html += '    <div class="form-field">';
        html += '      <label for="setting-app-desc">앱 설명</label>';
        html += '      <textarea id="setting-app-desc" placeholder="영등포청년회의소 회원관리 커뮤니티 앱"></textarea>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';

        // Member Settings
        html += '<div class="settings-section">';
        html += '  <div class="settings-section-header">';
        html += '    <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
        html += '    <h3>회원 설정</h3>';
        html += '  </div>';
        html += '  <div class="settings-section-body">';
        html += '    <div class="settings-row">';
        html += '      <div class="settings-row-text">';
        html += '        <div class="settings-row-label">가입 시 승인 필요</div>';
        html += '        <div class="settings-row-desc">새 회원 가입 시 관리자 승인을 거쳐야 합니다.</div>';
        html += '      </div>';
        html += '      <label class="toggle-switch">';
        html += '        <input type="checkbox" id="setting-require-approval" checked>';
        html += '        <span class="toggle-slider"></span>';
        html += '      </label>';
        html += '    </div>';
        html += '    <div class="form-field" style="margin-top:16px">';
        html += '      <label for="setting-default-role">신규 회원 기본 역할</label>';
        html += '      <select id="setting-default-role">';
        html += '        <option value="member">일반 회원</option>';
        html += '        <option value="admin">관리자</option>';
        html += '      </select>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';

        // Notification Settings
        html += '<div class="settings-section">';
        html += '  <div class="settings-section-header">';
        html += '    <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
        html += '    <h3>알림 설정</h3>';
        html += '  </div>';
        html += '  <div class="settings-section-body">';
        html += '    <div class="settings-row">';
        html += '      <div class="settings-row-text">';
        html += '        <div class="settings-row-label">푸시 알림 활성화</div>';
        html += '        <div class="settings-row-desc">회원에게 푸시 알림을 전송합니다.</div>';
        html += '      </div>';
        html += '      <label class="toggle-switch">';
        html += '        <input type="checkbox" id="setting-push-enabled" checked>';
        html += '        <span class="toggle-slider"></span>';
        html += '      </label>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';

        // Save bar
        html += '<div class="save-bar">';
        html += '  <button class="btn btn-primary" id="settings-save-btn">설정 저장</button>';
        html += '</div>';

        container.innerHTML = html;

        // Load existing settings
        loadSettings();

        // Save button
        document.getElementById('settings-save-btn').addEventListener('click', saveSettings);
    }

    function loadSettings() {
        AdminAPI.get('/api/admin/settings')
            .then(function(res) {
                var s = {};
                if (res && res.success && res.data) {
                    s = res.data;
                } else if (res && res.settings) {
                    s = res.settings;
                }

                if (s.app_name) document.getElementById('setting-app-name').value = s.app_name;
                if (s.app_description) document.getElementById('setting-app-desc').value = s.app_description;
                if (s.require_approval !== undefined) document.getElementById('setting-require-approval').checked = !!s.require_approval;
                if (s.default_role) document.getElementById('setting-default-role').value = s.default_role;
                if (s.push_enabled !== undefined) document.getElementById('setting-push-enabled').checked = !!s.push_enabled;
            })
            .catch(function() {
                // API may not exist yet, use defaults
            });
    }

    function saveSettings() {
        var btn = document.getElementById('settings-save-btn');
        btn.disabled = true;
        btn.textContent = '저장 중...';

        var payload = {
            app_name: document.getElementById('setting-app-name').value.trim(),
            app_description: document.getElementById('setting-app-desc').value.trim(),
            require_approval: document.getElementById('setting-require-approval').checked,
            default_role: document.getElementById('setting-default-role').value,
            push_enabled: document.getElementById('setting-push-enabled').checked,
        };

        AdminAPI.put('/api/admin/settings', payload)
            .then(function() {
                showAdminToast('설정이 저장되었습니다', 'success');
            })
            .catch(function(err) {
                showAdminToast(err.message || '설정 저장에 실패했습니다', 'error');
            })
            .finally(function() {
                btn.disabled = false;
                btn.textContent = '설정 저장';
            });
    }

    render();
}
