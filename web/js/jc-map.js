// JC 지도 — Leaflet + OpenStreetMap

var jcMap = null;
var jcMapMarkers = [];
var myLocationMarker = null;
var myLocationCircle = null;

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

        // 지도 화면을 fixed 오버레이로 표시
        var screen = document.getElementById('jc-map-screen');
        if (screen) {
            screen.style.position = 'fixed';
            screen.style.top = '0';
            screen.style.left = '0';
            screen.style.width = '100vw';
            screen.style.height = '100vh';
            screen.style.zIndex = '999';
            screen.style.background = '#fff';
            screen.style.maxWidth = '100vw';
        }
        var contentEl = document.getElementById('jc-map-content');
        if (contentEl) {
            contentEl.style.width = '100%';
            contentEl.style.height = 'calc(100vh - 56px)';
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

        // 내 위치 버튼
        var existingBtn = mapContainer.parentElement.querySelector('.jc-map-loc-btn');
        if (!existingBtn) {
            var myLocBtn = document.createElement('button');
            myLocBtn.className = 'jc-map-loc-btn';
            myLocBtn.innerHTML = '📍';
            myLocBtn.title = '내 위치';
            myLocBtn.style.cssText = 'position:absolute;bottom:20px;right:12px;z-index:1000;width:44px;height:44px;border-radius:50%;background:#fff;border:1px solid #D1D5DB;box-shadow:0 2px 6px rgba(0,0,0,0.15);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center';
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

        // 기존 마커 제거
        jcMapMarkers.forEach(function (m) { jcMap.removeLayer(m); });
        jcMapMarkers = [];

        // 회원 데이터 로드
        var res = await apiClient.request('/map/members');
        if (!res.success) return;
        var members = res.data || [];

        if (members.length === 0) {
            if (loadingEl) {
                loadingEl.style.display = 'block';
                loadingEl.textContent = '표시할 사업장이 없습니다.';
            }
            return;
        }

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
            if (m.company) popup += '<div>' + escapeHtml(m.company) + (m.position ? ' / ' + escapeHtml(m.position) : '') + '</div>';
            if (industry) popup += '<div style="color:#6B7280">' + escapeHtml(industry) + '</div>';
            if (m.business_address) popup += '<div style="color:#6B7280;margin-top:4px">📍 ' + escapeHtml(m.business_address) + '</div>';
            if (m.phone) popup += '<div style="margin-top:4px"><a href="tel:' + escapeHtml(m.phone) + '">📞 ' + escapeHtml(m.phone) + '</a></div>';
            if (m.website) popup += '<div><a href="' + escapeHtml(m.website) + '" target="_blank">🌐 사이트</a></div>';
            popup += '</div>';

            marker.bindPopup(popup);
            jcMapMarkers.push(marker);
            bounds.extend([m.business_lat, m.business_lng]);
        });

        if (members.length > 0) {
            jcMap.fitBounds(bounds, { padding: [30, 30] });
        }

    } catch (err) {
        if (loadingEl) {
            loadingEl.style.display = 'block';
            loadingEl.textContent = '지도 로드 실패: ' + (err.message || '');
        }
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
