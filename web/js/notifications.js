// 영등포 JC — 알림 센터 모듈

let notificationCache = [];
let notificationUnreadCount = 0;

// 알림 목록 로드
async function loadNotifications(page) {
  if (page === undefined) page = 1;
  const container = document.getElementById('notification-list-content');
  if (!container) return;

  try {
    container.innerHTML = renderSkeleton('list');
    const result = await apiClient.request('/notifications?page=' + page + '&limit=30');

    if (result.success && result.data) {
      notificationCache = result.data.items || [];
      notificationUnreadCount = result.data.unread_count || 0;
      updateNotificationBadge(notificationUnreadCount);

      if (notificationCache.length === 0) {
        container.innerHTML = renderNotificationEmpty();
      } else {
        container.innerHTML = notificationCache.map(renderNotificationItem).join('');
      }

      // 모두 읽음 버튼 상태
      const readAllBtn = document.getElementById('notification-read-all-btn');
      if (readAllBtn) {
        if (notificationUnreadCount > 0) {
          readAllBtn.style.color = 'rgba(255,255,255,0.85)';
          readAllBtn.style.pointerEvents = 'auto';
        } else {
          readAllBtn.style.color = 'rgba(255,255,255,0.4)';
          readAllBtn.style.pointerEvents = 'none';
        }
      }
    } else {
      container.innerHTML = renderErrorState('알림을 불러올 수 없습니다', '', 'loadNotifications()');
    }
  } catch (err) {
    console.error('[Notifications] 로드 실패:', err);
    container.innerHTML = renderErrorState('알림을 불러올 수 없습니다', '네트워크 연결을 확인해주세요', 'loadNotifications()');
  }
}

// 개별 읽음 처리
async function markNotificationAsRead(id) {
  try {
    await apiClient.request('/notifications/' + id + '/read', { method: 'POST' });
    // UI 업데이트
    const item = document.querySelector('.notification-item[data-id="' + id + '"]');
    if (item && item.classList.contains('unread')) {
      item.classList.remove('unread');
      notificationUnreadCount = Math.max(0, notificationUnreadCount - 1);
      updateNotificationBadge(notificationUnreadCount);
    }
  } catch (err) {
    console.error('[Notifications] 읽음 처리 실패:', err);
  }
}

// 전체 읽음 처리
async function markAllNotificationsRead() {
  try {
    await apiClient.request('/notifications/read-all', { method: 'POST' });
    // UI 업데이트
    document.querySelectorAll('.notification-item.unread').forEach(function(item) {
      item.classList.remove('unread');
    });
    notificationUnreadCount = 0;
    updateNotificationBadge(0);

    const readAllBtn = document.getElementById('notification-read-all-btn');
    if (readAllBtn) {
      readAllBtn.style.color = 'rgba(255,255,255,0.4)';
      readAllBtn.style.pointerEvents = 'none';
    }

  } catch (err) {
    console.error('[Notifications] 전체 읽음 실패:', err);
  }
}

// 알림 아이템 클릭
function handleNotificationClick(id, url) {
  markNotificationAsRead(id);
  if (url) {
    handleNotificationNavigation(url);
  }
}

// 알림 아이템 렌더링
function renderNotificationItem(noti) {
  var isUnread = !noti.read_at;
  var iconInfo = getNotificationIcon(noti.type);

  return '<div class="notification-item ' + (isUnread ? 'unread' : '') + '" data-id="' + noti.id + '" onclick="handleNotificationClick(' + noti.id + ', \'' + escapeHtml(noti.data && noti.data.url ? noti.data.url : '') + '\')">'
    + '<div class="notification-dot"></div>'
    + '<div class="notification-icon notification-icon--' + iconInfo.cls + '">' + iconInfo.svg + '</div>'
    + '<div class="notification-content">'
    + '<div class="notification-title">' + escapeHtml(noti.title) + '</div>'
    + (noti.body ? '<div class="notification-body">' + escapeHtml(noti.body) + '</div>' : '')
    + '<div class="notification-time">' + formatNotificationTime(noti.sent_at) + '</div>'
    + '</div>'
    + '</div>';
}

// 빈 상태
function renderNotificationEmpty() {
  return '<div class="notification-empty">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>'
    + '<path d="M13.73 21a2 2 0 0 1-3.46 0"/>'
    + '</svg>'
    + '<p>새로운 알림이 없습니다</p>'
    + '</div>';
}

// 유형별 아이콘
function getNotificationIcon(type) {
  switch (type) {
    case 'N-01':
      return {
        cls: 'notice',
        svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
      };
    case 'N-02':
    case 'N-04':
      return {
        cls: 'schedule',
        svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
      };
    case 'N-03':
      return {
        cls: 'reminder',
        svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
      };
    case 'N-05':
      return {
        cls: 'comment',
        svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
      };
    case 'club_invite':
      return {
        cls: 'club',
        svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>'
      };
    default:
      return {
        cls: 'notice',
        svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
      };
  }
}

// 시간 표시
function formatNotificationTime(dateStr) {
  if (!dateStr) return '';
  var now = new Date();
  var date = new Date(dateStr);
  var diff = now - date;
  var mins = Math.floor(diff / 60000);
  var hours = Math.floor(diff / 3600000);
  var days = Math.floor(diff / 86400000);

  if (mins < 1) return '방금';
  if (mins < 60) return mins + '분 전';
  if (hours < 24) return hours + '시간 전';
  if (days === 1) return '어제';
  if (days < 7) return days + '일 전';
  return (date.getMonth() + 1) + '/' + date.getDate();
}

// 앱바 알림 배지 업데이트
function updateNotificationBadge(count) {
  notificationUnreadCount = count;
  var badge = document.getElementById('notification-badge-count');
  if (!badge) return;

  if (count <= 0) {
    badge.textContent = '';
    badge.style.display = 'none';
  } else {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.style.display = '';
    badge.classList.remove('animate');
    void badge.offsetWidth; // force reflow
    badge.classList.add('animate');
  }
}

// 안읽은 알림 수 조회 (앱바 배지용)
async function fetchUnreadNotificationCount() {
  if (!apiClient.token) return;
  try {
    var result = await apiClient.request('/notifications?page=1&limit=1');
    if (result.success && result.data) {
      updateNotificationBadge(result.data.unread_count || 0);
    }
  } catch (_) {}
}

// 알림 센터 화면 표시
function showNotificationCenter() {
  navigateToScreen('notifications');
  loadNotifications();
}

// 알림 센터 뒤로가기
function closeNotificationCenter() {
  navigateToScreen('home');
}
