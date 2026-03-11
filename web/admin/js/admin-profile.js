/* ================================================
   영등포 JC — 관리자 프로필
   ================================================ */

function renderAdminProfile(container) {

    function render() {
        var html = '';

        html += '<div class="page-toolbar">';
        html += '  <h2 class="page-title">내 프로필</h2>';
        html += '</div>';

        // Profile card
        html += '<div class="profile-card" id="admin-profile-card">';
        html += '  <div class="profile-card-loading"><div class="skeleton" style="width:64px;height:64px;border-radius:50%"></div><div class="skeleton" style="width:160px;height:20px;margin-top:12px"></div><div class="skeleton" style="width:120px;height:16px;margin-top:8px"></div></div>';
        html += '</div>';

        // Profile edit section
        html += '<div class="settings-section">';
        html += '  <div class="settings-section-header">';
        html += '    <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        html += '    <h3>프로필 수정</h3>';
        html += '  </div>';
        html += '  <div class="settings-section-body">';
        html += '    <div class="form-field">';
        html += '      <label for="profile-name">이름</label>';
        html += '      <input type="text" id="profile-name" placeholder="이름">';
        html += '    </div>';
        html += '    <div class="form-field">';
        html += '      <label for="profile-phone">연락처</label>';
        html += '      <input type="tel" id="profile-phone" placeholder="010-0000-0000">';
        html += '    </div>';
        html += '    <div style="text-align:right">';
        html += '      <button class="btn btn-primary" id="profile-save-btn">프로필 저장</button>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';

        // Password change section
        html += '<div class="settings-section">';
        html += '  <div class="settings-section-header">';
        html += '    <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
        html += '    <h3>비밀번호 변경</h3>';
        html += '  </div>';
        html += '  <div class="settings-section-body password-form">';
        html += '    <div class="form-field">';
        html += '      <label for="pw-current">현재 비밀번호</label>';
        html += '      <input type="password" id="pw-current" placeholder="현재 비밀번호 입력">';
        html += '    </div>';
        html += '    <div class="form-field">';
        html += '      <label for="pw-new">새 비밀번호</label>';
        html += '      <input type="password" id="pw-new" placeholder="새 비밀번호 (6자 이상)">';
        html += '    </div>';
        html += '    <div class="form-field">';
        html += '      <label for="pw-confirm">새 비밀번호 확인</label>';
        html += '      <input type="password" id="pw-confirm" placeholder="새 비밀번호 다시 입력">';
        html += '      <div class="pw-mismatch-warning" id="pw-mismatch" style="display:none">비밀번호가 일치하지 않습니다.</div>';
        html += '    </div>';
        html += '    <div style="text-align:right">';
        html += '      <button class="btn btn-primary" id="pw-change-btn">비밀번호 변경</button>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';

        container.innerHTML = html;

        // Load profile data
        loadProfile();

        // Password mismatch real-time check
        var pwNew = document.getElementById('pw-new');
        var pwConfirm = document.getElementById('pw-confirm');
        var mismatchEl = document.getElementById('pw-mismatch');

        function checkPasswordMatch() {
            var newVal = pwNew.value;
            var confirmVal = pwConfirm.value;
            if (confirmVal.length > 0 && newVal !== confirmVal) {
                mismatchEl.style.display = 'block';
                pwConfirm.classList.add('error');
            } else {
                mismatchEl.style.display = 'none';
                pwConfirm.classList.remove('error');
            }
        }

        pwNew.addEventListener('input', checkPasswordMatch);
        pwConfirm.addEventListener('input', checkPasswordMatch);

        // Save profile
        document.getElementById('profile-save-btn').addEventListener('click', saveProfile);

        // Change password
        document.getElementById('pw-change-btn').addEventListener('click', changePassword);
    }

    function loadProfile() {
        AdminAPI.get('/api/admin/auth/me')
            .then(function(res) {
                var user = null;
                if (res && res.success && res.data) {
                    user = res.data;
                } else if (res && res.user) {
                    user = res.user;
                } else if (res && res.success) {
                    user = res;
                }

                if (!user) {
                    // fallback to localStorage
                    user = AdminAPI.getUser() || {};
                }

                renderProfileCard(user);

                // Fill edit form
                if (user.name) document.getElementById('profile-name').value = user.name;
                if (user.phone) document.getElementById('profile-phone').value = user.phone;
            })
            .catch(function() {
                // fallback to localStorage
                var user = AdminAPI.getUser() || {};
                renderProfileCard(user);
                if (user.name) document.getElementById('profile-name').value = user.name;
                if (user.phone) document.getElementById('profile-phone').value = user.phone;
            });
    }

    function renderProfileCard(user) {
        var card = document.getElementById('admin-profile-card');
        var initial = (user.name || 'A').charAt(0).toUpperCase();
        var role = user.role === 'super_admin' ? '슈퍼관리자' : (user.role === 'admin' ? '관리자' : (user.role || '관리자'));
        var joined = user.created_at ? formatDate(user.created_at) : (user.joined_at ? formatDate(user.joined_at) : '-');

        var html = '';
        html += '<div class="profile-card-avatar">' + escapeHtml(initial) + '</div>';
        html += '<div class="profile-card-info">';
        html += '  <div class="profile-card-name">' + escapeHtml(user.name || '관리자') + '</div>';
        html += '  <div class="profile-card-email">' + escapeHtml(user.email || user.admin_id || '-') + '</div>';
        html += '  <div class="profile-card-meta">';
        html += '    <span class="badge badge-admin">' + escapeHtml(role) + '</span>';
        html += '    <span class="profile-card-joined">가입일: ' + joined + '</span>';
        html += '  </div>';
        html += '</div>';

        card.innerHTML = html;
    }

    function saveProfile() {
        var btn = document.getElementById('profile-save-btn');
        var name = document.getElementById('profile-name').value.trim();
        var phone = document.getElementById('profile-phone').value.trim();

        if (!name) {
            showAdminToast('이름을 입력하세요.', 'error');
            return;
        }

        btn.disabled = true;
        btn.textContent = '저장 중...';

        AdminAPI.put('/api/admin/auth/profile', { name: name, phone: phone })
            .then(function(res) {
                showAdminToast('프로필이 저장되었습니다.', 'success');

                // Update localStorage and header
                var user = AdminAPI.getUser() || {};
                user.name = name;
                user.phone = phone;
                AdminAPI.setUser(user);

                var headerUser = document.getElementById('header-user');
                if (headerUser) headerUser.textContent = name;
                var sidebarName = document.getElementById('sidebar-user-name');
                if (sidebarName) sidebarName.textContent = name;
                var sidebarAvatar = document.getElementById('sidebar-avatar');
                if (sidebarAvatar) sidebarAvatar.textContent = name.charAt(0);

                // Refresh card
                loadProfile();
            })
            .catch(function(err) {
                showAdminToast(err.message || '프로필 저장에 실패했습니다.', 'error');
            })
            .finally(function() {
                btn.disabled = false;
                btn.textContent = '프로필 저장';
            });
    }

    function changePassword() {
        var btn = document.getElementById('pw-change-btn');
        var current = document.getElementById('pw-current').value;
        var newPw = document.getElementById('pw-new').value;
        var confirm = document.getElementById('pw-confirm').value;

        if (!current) {
            showAdminToast('현재 비밀번호를 입력하세요.', 'error');
            return;
        }
        if (!newPw || newPw.length < 6) {
            showAdminToast('새 비밀번호는 6자 이상이어야 합니다.', 'error');
            return;
        }
        if (newPw !== confirm) {
            showAdminToast('새 비밀번호가 일치하지 않습니다.', 'error');
            return;
        }

        btn.disabled = true;
        btn.textContent = '변경 중...';

        AdminAPI.put('/api/admin/auth/password', {
            current_password: current,
            new_password: newPw,
        })
            .then(function() {
                showAdminToast('비밀번호가 변경되었습니다.', 'success');
                document.getElementById('pw-current').value = '';
                document.getElementById('pw-new').value = '';
                document.getElementById('pw-confirm').value = '';
                document.getElementById('pw-mismatch').style.display = 'none';
            })
            .catch(function(err) {
                showAdminToast(err.message || '비밀번호 변경에 실패했습니다.', 'error');
            })
            .finally(function() {
                btn.disabled = false;
                btn.textContent = '비밀번호 변경';
            });
    }

    render();
}
