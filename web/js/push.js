// 영등포 JC — Web Push 구독 모듈

let swRegistration = null;
let pushSubscription = null;

// SW 등록 + 구독 상태 확인
async function initPush() {
  if (!('serviceWorker' in navigator)) {
    console.log('[Push] Service Worker 미지원');
    return;
  }

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
    console.log('[Push] SW 등록 완료');

    // 새 SW 감지 → 즉시 활성화 + 자동 리로드
    swRegistration.addEventListener('updatefound', () => {
      const newWorker = swRegistration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            console.log('[SW] 새 버전 활성화됨 — 페이지 새로고침');
            window.location.reload();
          }
        });
      }
    });

    // 페이지 로드 시 SW 업데이트 확인
    swRegistration.update().catch(() => {});

    // 새 SW가 컨트롤 인계 시 리로드 (controllerchange)
    var _swReloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!_swReloading) {
        _swReloading = true;
        window.location.reload();
      }
    });

    // SW 메시지 수신 (알림 클릭 → 화면 이동)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        handleNotificationNavigation(event.data.url);
      }
    });

    // 기존 구독 확인
    pushSubscription = await swRegistration.pushManager.getSubscription();
    if (pushSubscription) {
      console.log('[Push] 기존 구독 있음');
    } else if ('Notification' in window && Notification.permission === 'granted') {
      // 권한은 허용했지만 구독이 없는 경우 → 자동 재구독 시도 (배너 없이)
      console.log('[Push] 권한 허용됨, 자동 재구독 시도');
      try {
        const vapidKey = await getVapidPublicKey();
        if (vapidKey) {
          pushSubscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
          });
          await apiClient.request('/push/subscribe', {
            method: 'POST',
            body: JSON.stringify({
              subscription: {
                endpoint: pushSubscription.endpoint,
                keys: {
                  p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(pushSubscription.getKey('p256dh')))),
                  auth: btoa(String.fromCharCode.apply(null, new Uint8Array(pushSubscription.getKey('auth'))))
                }
              }
            })
          });
          console.log('[Push] 자동 재구독 완료');
        }
      } catch (resubErr) {
        console.warn('[Push] 자동 재구독 실패:', resubErr);
      }
    } else {
      console.log('[Push] 구독 없음');
      showPushSubscribeBanner();
    }

    updatePushStatusUI();
  } catch (err) {
    console.error('[Push] SW 등록 실패:', err);
  }
}

// VAPID 공개키 가져오기
async function getVapidPublicKey() {
  try {
    const result = await apiClient.request('/push/vapid-key');
    if (result.success && result.data) {
      return result.data.vapidPublicKey || result.data.publicKey;
    }
    if (result.publicKey) return result.publicKey;
    if (result.vapidPublicKey) return result.vapidPublicKey;
  } catch (err) {
    console.error('[Push] VAPID 키 조회 실패:', err);
  }
  return null;
}

// 구독 요청
async function subscribePush() {
  if (!swRegistration) {
    return false;
  }

  // iOS standalone 체크
  if (isIOS() && !isStandalone()) {
    showPWAInstallBanner();
    return false;
  }

  // PushManager 지원 체크
  if (!('PushManager' in window)) {
    return false;
  }

  // 권한 요청
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    showPushDeniedMessage();
    return false;
  }

  // VAPID 키 가져오기
  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) {
    return false;
  }

  try {
    pushSubscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    // 서버에 구독 등록
    await apiClient.request('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        subscription: {
          endpoint: pushSubscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(pushSubscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(pushSubscription.getKey('auth'))))
          }
        }
      })
    });

    hidePushSubscribeBanner();
    updatePushStatusUI();
    return true;
  } catch (err) {
    console.error('[Push] 구독 실패:', err);
    return false;
  }
}

// 구독 해제
async function unsubscribePush() {
  if (!pushSubscription) return false;

  try {
    const endpoint = pushSubscription.endpoint;
    await pushSubscription.unsubscribe();

    await apiClient.request('/push/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint: endpoint })
    });

    pushSubscription = null;
    updatePushStatusUI();
    return true;
  } catch (err) {
    console.error('[Push] 구독 해제 실패:', err);
    return false;
  }
}

// 구독 유도 배너 표시
function showPushSubscribeBanner() {
  // 이미 권한 거부됨
  if ('Notification' in window && Notification.permission === 'denied') return;
  // PushManager 미지원
  if (!('PushManager' in window)) return;
  // 로그인 안 됨
  if (!apiClient.token) return;

  // localStorage 닫기 플래그 확인
  const dismissed = localStorage.getItem('push_banner_dismissed');
  const dismissCount = parseInt(localStorage.getItem('push_banner_dismiss_count') || '0', 10);
  if (dismissCount >= 3) return;
  if (dismissed) {
    const dismissedAt = parseInt(dismissed, 10);
    if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
  }

  // 이미 표시 중이면 스킵
  if (document.querySelector('.push-subscribe-banner')) return;

  const banner = document.createElement('div');
  banner.className = 'push-subscribe-banner';
  banner.setAttribute('role', 'alert');
  banner.setAttribute('aria-live', 'polite');
  banner.innerHTML = `
    <div class="push-subscribe-message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <p>알림을 켜면 공지와 일정을<br>바로 받아볼 수 있어요!</p>
    </div>
    <div class="push-subscribe-actions">
      <button class="push-subscribe-btn push-subscribe-btn--ghost" onclick="dismissPushBanner()">나중에</button>
      <button class="push-subscribe-btn push-subscribe-btn--primary" onclick="handlePushSubscribeClick()">알림 켜기</button>
    </div>
  `;
  document.body.appendChild(banner);
}

function hidePushSubscribeBanner() {
  const banner = document.querySelector('.push-subscribe-banner');
  if (!banner) return;
  banner.classList.add('hiding');
  setTimeout(() => banner.remove(), 200);
}

function dismissPushBanner() {
  localStorage.setItem('push_banner_dismissed', String(Date.now()));
  const count = parseInt(localStorage.getItem('push_banner_dismiss_count') || '0', 10);
  localStorage.setItem('push_banner_dismiss_count', String(count + 1));
  hidePushSubscribeBanner();
}

async function handlePushSubscribeClick() {
  const btn = document.querySelector('.push-subscribe-btn--primary');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '설정 중...';
  }
  await subscribePush();
  if (btn) {
    btn.disabled = false;
    btn.textContent = '알림 켜기';
  }
}

// 권한 거부 메시지
function showPushDeniedMessage() {
  const banner = document.querySelector('.push-subscribe-banner');
  if (banner) {
    banner.innerHTML = `
      <div class="push-subscribe-message">
        <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
        <p style="color:#6B7280">브라우저 설정에서 알림을<br>허용해주세요</p>
      </div>
      <div class="push-subscribe-actions">
        <button class="push-subscribe-btn push-subscribe-btn--ghost" onclick="hidePushSubscribeBanner()">확인</button>
      </div>
    `;
  }
}

// PWA 설치 안내 배너
function showPWAInstallBanner() {
  if (isStandalone()) return;
  if (!('PushManager' in window)) return;

  const dismissed = localStorage.getItem('pwa_install_dismissed');
  if (dismissed) {
    const dismissedAt = parseInt(dismissed, 10);
    if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
  }

  if (document.querySelector('.push-install-banner')) return;

  const banner = document.createElement('div');
  banner.className = 'push-install-banner';
  banner.setAttribute('role', 'banner');
  banner.setAttribute('aria-label', 'PWA 설치 안내');
  banner.innerHTML = `
    <button class="push-install-close" aria-label="배너 닫기" onclick="dismissPWAInstallBanner()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    <div class="push-install-message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
      <p>홈 화면에 추가하면<br>알림을 받을 수 있어요!</p>
    </div>
    <div class="push-install-action">
      <button onclick="showPWAInstallGuide()">추가 방법 보기</button>
    </div>
  `;
  document.body.appendChild(banner);
}

function dismissPWAInstallBanner() {
  localStorage.setItem('pwa_install_dismissed', String(Date.now()));
  const banner = document.querySelector('.push-install-banner');
  if (banner) {
    banner.classList.add('hiding');
    setTimeout(() => banner.remove(), 200);
  }
}

function showPWAInstallGuide() {
  const overlay = document.createElement('div');
  overlay.className = 'pwa-guide-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div class="pwa-guide-modal">
      <div class="pwa-guide-header">
        <h3>홈 화면에 추가하기</h3>
        <button class="pwa-guide-close" onclick="this.closest('.pwa-guide-overlay').remove()" aria-label="닫기">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="pwa-guide-body">
        <div class="pwa-guide-section">
          <h4>Android (Chrome)</h4>
          <ol>
            <li><strong>1.</strong> 우측 상단 <strong>&#8942;</strong> (더보기) 클릭</li>
            <li><strong>2.</strong> "홈 화면에 추가" 선택</li>
            <li><strong>3.</strong> "추가" 확인</li>
          </ol>
        </div>
        <div class="pwa-guide-section">
          <h4>iOS (Safari)</h4>
          <ol>
            <li><strong>1.</strong> 하단 <strong>&#9741;</strong> (공유) 버튼 탭</li>
            <li><strong>2.</strong> "홈 화면에 추가" 선택</li>
            <li><strong>3.</strong> "추가" 확인</li>
          </ol>
          <p class="pwa-guide-note">※ iOS는 Safari에서만 가능합니다</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// 푸시 상태 UI 업데이트 (알림 설정 화면용)
function updatePushStatusUI() {
  const statusEl = document.querySelector('.push-status-indicator');
  if (!statusEl) return;

  if (pushSubscription) {
    statusEl.innerHTML = '<span class="status-dot active"></span> 활성';
  } else {
    statusEl.innerHTML = '<span class="status-dot inactive"></span> 비활성';
  }
}

// 알림 클릭 후 화면 이동 처리
function handleNotificationNavigation(url) {
  if (!url || url === '/') return;

  // /#posts/15 or /posts/15 형태 처리
  const cleanUrl = url.replace(/^\/#?/, '/');
  if (typeof navigateTo === 'function') {
    navigateTo(cleanUrl);
  }
}

// VAPID key 변환 유틸
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// iOS 체크
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// PWA standalone 모드 체크
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
