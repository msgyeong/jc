// 영등포 JC — 알림 설정 모듈

let notificationSettings = null;

// 알림 설정 화면 표시
function showNotificationSettingsScreen() {
  navigateToScreen('notification-settings');
  loadNotificationSettings();
}

// 알림 설정 로드
async function loadNotificationSettings() {
  var container = document.getElementById('notification-settings-content');
  if (!container) return;

  try {
    container.innerHTML = renderSkeleton('list');
    var result = await apiClient.request('/notifications/settings');

    if (result.success && result.data) {
      notificationSettings = result.data;
      container.innerHTML = renderNotificationSettingsUI(result.data);
      setupSettingsToggleEvents();
      updatePushStatusUI();
    } else {
      container.innerHTML = renderErrorState('설정을 불러올 수 없습니다', '', 'loadNotificationSettings()');
    }
  } catch (err) {
    console.error('[NotificationSettings] 로드 실패:', err);
    container.innerHTML = renderErrorState('설정을 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'loadNotificationSettings()');
  }
}

// 알림 설정 UI 렌더링
function renderNotificationSettingsUI(s) {
  var masterChecked = s.all_push !== false;
  var disabledClass = masterChecked ? '' : ' disabled';

  return '<div class="alert-settings-page">'
    // 마스터 스위치
    + '<div class="alert-settings-master">'
    + '<svg class="alert-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>'
    + '<path d="M13.73 21a2 2 0 0 1-3.46 0"/>'
    + '</svg>'
    + '<div class="alert-settings-text"><div class="alert-settings-label" style="font-size:15px;font-weight:600">전체 알림</div></div>'
    + renderToggle('all_push', masterChecked, '전체 알림')
    + '</div>'

    // 알림 유형 섹션
    + '<div class="alert-settings-section-title">알림 유형</div>'
    + '<div class="alert-settings-group' + disabledClass + '" id="alert-settings-group">'

    + renderSettingsItem(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        '공지 알림', '새 공지사항이 등록되면 알림', 'notice_push', s.notice_push !== false)

    + renderSettingsItem(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        '일정 알림', '일정 등록/변경/취소 시 알림', 'schedule_push', s.schedule_push !== false)

    + renderSettingsItem(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        '일정 리마인더', '일정 하루 전 오전 9시 알림', 'reminder_push', s.reminder_push !== false)

    + renderSettingsItem(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        '댓글 알림', '내 글에 댓글이 달리면 알림', 'comment_push', s.comment_push !== false)

    + renderSettingsItem(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        '생일 알림', '회원 생일에 축하 알림', 'birthday_push', s.birthday_push !== false)

    + '</div>'

    // 푸시 상태
    + '<div class="alert-settings-section-title">푸시 상태</div>'
    + '<div class="alert-settings-status">'
    + '<span>푸시 알림:</span>'
    + '<span class="push-status-indicator">'
    + (pushSubscription ? '<span class="status-dot active"></span> 활성' : '<span class="status-dot inactive"></span> 비활성')
    + '</span>'
    + '</div>'
    + (pushSubscription ? '' : '<div style="padding:12px 16px"><button class="push-subscribe-btn push-subscribe-btn--primary" style="width:100%" onclick="handleResubscribePush()">푸시 알림 재등록</button></div>')

    + '</div>';
}

// 설정 아이템 렌더링
function renderSettingsItem(iconSvg, label, desc, key, checked) {
  return '<div class="alert-settings-item">'
    + '<div class="alert-settings-icon">' + iconSvg + '</div>'
    + '<div class="alert-settings-text">'
    + '<div class="alert-settings-label">' + label + '</div>'
    + '<div class="alert-settings-desc">' + desc + '</div>'
    + '</div>'
    + renderToggle(key, checked, label)
    + '</div>';
}

// 토글 스위치 렌더링
function renderToggle(key, checked, ariaLabel) {
  return '<label class="alert-settings-toggle">'
    + '<input type="checkbox" data-key="' + key + '"' + (checked ? ' checked' : '') + ' role="switch" aria-checked="' + !!checked + '" aria-label="' + ariaLabel + '">'
    + '<span class="toggle-track"></span>'
    + '<span class="toggle-knob"></span>'
    + '</label>';
}

// 토글 이벤트 연결
function setupSettingsToggleEvents() {
  document.querySelectorAll('.alert-settings-toggle input').forEach(function(input) {
    input.addEventListener('change', function() {
      var key = this.dataset.key;
      var checked = this.checked;

      if (key === 'all_push') {
        // 마스터 스위치
        var group = document.getElementById('alert-settings-group');
        if (group) {
          if (checked) {
            group.classList.remove('disabled');
          } else {
            group.classList.add('disabled');
          }
        }
      }

      saveNotificationSetting(key, checked);
    });
  });
}

// 설정 저장
async function saveNotificationSetting(key, value) {
  if (!notificationSettings) notificationSettings = {};
  notificationSettings[key] = value;

  try {
    await apiClient.request('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(notificationSettings)
    });
  } catch (err) {
    console.error('[NotificationSettings] 저장 실패:', err);
    showToast('설정 저장에 실패했습니다', 'error');
  }
}

// 재구독 버튼
async function handleResubscribePush() {
  var success = await subscribePush();
  if (success) {
    loadNotificationSettings();
  }
}
