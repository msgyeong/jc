// JC 지도 — Leaflet + OpenStreetMap

var jcMap = null;
var jcMapMarkers = [];
var myLocationMarker = null;
var myLocationCircle = null;
var jcMapShowAll = false;
var jcMapSearchTimeout = null;

function getMapUserOrgId() {
    try {
        var user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : JSON.parse(localStorage.getItem('user_info') || 'null');
        return (user && user.org_id) ? user.org_id : null;
    } catch (_) { return null; }
}

async function loadJcMapScreen() {
    var loadingEl = document.getElementById('jc-map-loading');

    if (typeof L === 'undefined') {
        if (loadingEl) loadingEl.textContent = '지도 라이브러리 로드 실패';
        return;
    }

    try {
        var mapContainer = document.getElementById('jc-kakao-map');
        if (!mapContainer) return;

        // 화면이 active 아니면 대기
        var screen = document.getElementById('jc-map-screen');
        if (screen && !screen.classList.contains('active')) {
            setTimeout(loadJcMapScreen, 200);
            return;
        }

        // 지도 화면 — 일반 screen으로 유지 (fixed 사용 안 함)
        var contentEl = document.getElementById('jc-map-content');
        if (contentEl) {
            contentEl.style.width = '100%';
            contentEl.style.height = 'calc(100vh - 56px - 60px)';
            contentEl.style.position = 'relative';
        }
        mapContainer.style.width = '100%';
        mapContainer.style.height = '100%';

        // 기존 맵 제거 후 새로 생성
        if (jcMap) {
            try { jcMap.remove(); } catch (e) {}
            jcMap = null;
        }

        jcMap = L.map(mapContainer, { zoomControl: true }).setView([37.5175, 126.9077], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
        }).addTo(jcMap);

        // 검색 + 필터 UI 삽입
        var existingControls = contentEl ? contentEl.querySelector('.jc-map-controls') : null;
        if (!existingControls && contentEl) {
            var controlsDiv = document.createElement('div');
            controlsDiv.className = 'jc-map-controls';
            controlsDiv.style.cssText = 'position:absolute;top:8px;left:8px;right:8px;z-index:1000;display:flex;gap:6px;align-items:center';
            controlsDiv.innerHTML =
                '<input type="text" id="jc-map-search" placeholder="회원명/업종/로컬명 검색" style="flex:1;height:38px;border:1px solid var(--border-color);border-radius:8px;padding:0 12px;font-size:13px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.1)">'
                + '<label style="display:flex;align-items:center;gap:4px;background:#fff;padding:4px 10px;border-radius:8px;font-size:12px;white-space:nowrap;border:1px solid var(--border-color);box-shadow:0 2px 6px rgba(0,0,0,0.1);cursor:pointer">'
                + '<input type="checkbox" id="jc-map-show-all" style="accent-color:var(--primary-color)">'
                + '<span>모두보기</span></label>';
            contentEl.appendChild(controlsDiv);

            // 이벤트 바인딩
            var searchInput = document.getElementById('jc-map-search');
            if (searchInput) {
                searchInput.addEventListener('input', function () {
                    clearTimeout(jcMapSearchTimeout);
                    jcMapSearchTimeout = setTimeout(function () { loadMapMembers(); }, 400);
                });
            }
            var showAllCheck = document.getElementById('jc-map-show-all');
            if (showAllCheck) {
                showAllCheck.checked = jcMapShowAll;
                showAllCheck.addEventListener('change', function () {
                    jcMapShowAll = this.checked;
                    loadMapMembers();
                });
            }
        }

        // 내 위치 버튼
        var existingBtn = mapContainer.parentElement.querySelector('.jc-map-loc-btn');
        if (!existingBtn) {
            var myLocBtn = document.createElement('button');
            myLocBtn.className = 'jc-map-loc-btn';
            myLocBtn.innerHTML = '📍';
            myLocBtn.title = '내 위치';
            myLocBtn.style.cssText = 'position:absolute;bottom:20px;right:12px;z-index:1000;width:44px;height:44px;border-radius:50%;background:#fff;border:1px solid var(--border-color);box-shadow:0 2px 6px rgba(0,0,0,0.15);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center';
            myLocBtn.onclick = showMyLocation;
            mapContainer.parentElement.appendChild(myLocBtn);
        }

        // 사이즈 확정
        setTimeout(function () {
            if (jcMap) {
                jcMap.invalidateSize();
                showMyLocation();
            }
        }, 300);

        if (loadingEl) loadingEl.style.display = 'none';

        // 회원 마커 로드
        await loadMapMembers();

    } catch (err) {
        if (loadingEl) {
            loadingEl.style.display = 'block';
            loadingEl.textContent = '지도 로드 실패: ' + (err.message || '');
        }
    }
}

async function loadMapMembers() {
    if (!jcMap) return;
    var loadingEl = document.getElementById('jc-map-loading');

    // 기존 마커 제거
    jcMapMarkers.forEach(function (m) { jcMap.removeLayer(m); });
    jcMapMarkers = [];

    // 쿼리 파라미터 빌드
    var params = [];
    if (!jcMapShowAll) {
        var orgId = getMapUserOrgId();
        if (orgId) params.push('org_id=' + encodeURIComponent(orgId));
    }
    var searchEl = document.getElementById('jc-map-search');
    var searchVal = searchEl ? searchEl.value.trim() : '';
    if (searchVal) params.push('search=' + encodeURIComponent(searchVal));

    var url = '/map/members' + (params.length > 0 ? '?' + params.join('&') : '');

    try {
        var res = await apiClient.request(url);
        if (!res.success) return;
        var members = res.data || [];

        if (members.length === 0) {
            if (loadingEl) {
                loadingEl.style.display = 'block';
                loadingEl.textContent = '표시할 사업장이 없습니다.';
            }
            return;
        }
        if (loadingEl) loadingEl.style.display = 'none';

        var bounds = L.latLngBounds();

        members.forEach(function (m) {
            var marker = L.marker([m.business_lat, m.business_lng]).addTo(jcMap);

            var industry = '';
            if (m.industry) {
                var industryMap = { law: '법률', finance: '금융', medical: '의료', construction: '건설/부동산', it: 'IT/기술', manufacturing: '제조', food: '요식', retail: '유통', service: '서비스', realestate: '부동산', culture: '문화', public: '공공', other: '기타' };
                industry = industryMap[m.industry] || m.industry;
                if (m.industry_detail) industry += ' · ' + m.industry_detail;
            }

            var popup = '<div style="min-width:180px;font-size:13px;line-height:1.5">'
                + '<div style="font-size:15px;font-weight:700;margin-bottom:4px">' + escapeHtml(m.name) + '</div>';
            if (m.org_name) popup += '<div style="color:var(--primary-color);font-size:12px;margin-bottom:2px">' + escapeHtml(m.org_name) + '</div>';
            if (m.company) popup += '<div>' + escapeHtml(m.company) + (m.position ? ' / ' + escapeHtml(m.position) : '') + '</div>';
            if (industry) popup += '<div style="color:var(--text-hint)">' + escapeHtml(industry) + '</div>';
            if (m.business_address) popup += '<div style="color:var(--text-hint);margin-top:4px">📍 ' + escapeHtml(m.business_address) + '</div>';
            if (m.phone) popup += '<div style="margin-top:4px"><a href="tel:' + escapeHtml(m.phone) + '">📞 ' + escapeHtml(m.phone) + '</a></div>';
            if (m.website) popup += '<div><a href="' + escapeHtml(m.website) + '" target="_blank">🌐 사이트</a></div>';
            popup += '<div style="margin-top:6px;text-align:center"><a href="#" onclick="event.preventDefault();jcMap.closePopup();navigateToScreen(\'member-detail\');loadMemberDetail(' + m.id + ')" style="color:var(--primary-color);font-weight:600;font-size:13px">프로필 보기</a></div>';
            popup += '</div>';

            marker.bindPopup(popup);
            jcMapMarkers.push(marker);
            bounds.extend([m.business_lat, m.business_lng]);
        });

        if (members.length > 0) {
            jcMap.fitBounds(bounds, { padding: [30, 30] });
        }
    } catch (err) {
        console.error('Map members load error:', err);
    }
}

function showMyLocation() {
    if (!navigator.geolocation || !jcMap) return;
    navigator.geolocation.getCurrentPosition(
        function (pos) {
            var lat = pos.coords.latitude;
            var lng = pos.coords.longitude;

            if (myLocationMarker) jcMap.removeLayer(myLocationMarker);
            if (myLocationCircle) jcMap.removeLayer(myLocationCircle);

            myLocationMarker = L.circleMarker([lat, lng], {
                radius: 8, fillColor: '#2563EB', color: '#fff',
                weight: 3, fillOpacity: 1
            }).addTo(jcMap).bindPopup('내 위치');

            myLocationCircle = L.circle([lat, lng], {
                radius: pos.coords.accuracy || 50,
                color: '#2563EB', fillColor: '#2563EB',
                fillOpacity: 0.1, weight: 1
            }).addTo(jcMap);

            jcMap.setView([lat, lng], 14);
        },
        function () {},
        { enableHighAccuracy: true, timeout: 10000 }
    );
}
