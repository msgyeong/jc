// JC 지도 — 카카오맵 회원 사업장 표시

var jcMap = null;
var jcMapMarkers = [];
var jcMapLoaded = false;

async function loadJcMapScreen() {
    var loadingEl = document.getElementById('jc-map-loading');

    // 카카오맵 SDK 체크
    if (typeof kakao === 'undefined' || !kakao.maps) {
        if (loadingEl) loadingEl.textContent = '카카오맵 SDK 로드 실패';
        return;
    }

    try {
        // 맵 초기화 (한 번만)
        if (!jcMapLoaded) {
            var mapContainer = document.getElementById('jc-kakao-map');
            if (!mapContainer) return;
            var options = {
                center: new kakao.maps.LatLng(37.5175, 126.9077), // 영등포 기본 좌표
                level: 7
            };
            jcMap = new kakao.maps.Map(mapContainer, options);
            jcMapLoaded = true;

            // 줌 컨트롤
            jcMap.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);

            // 내 위치 버튼 추가
            var myLocBtn = document.createElement('button');
            myLocBtn.innerHTML = '📍';
            myLocBtn.title = '내 위치';
            myLocBtn.style.cssText = 'position:absolute;bottom:20px;right:12px;z-index:10;width:44px;height:44px;border-radius:50%;background:#fff;border:1px solid #D1D5DB;box-shadow:0 2px 6px rgba(0,0,0,0.15);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center';
            myLocBtn.onclick = showMyLocation;
            mapContainer.parentElement.appendChild(myLocBtn);

            // 자동으로 내 위치 표시
            showMyLocation();
        }

        if (loadingEl) loadingEl.style.display = 'none';

        // 기존 마커 제거
        jcMapMarkers.forEach(function(m) { m.setMap(null); });
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

        var bounds = new kakao.maps.LatLngBounds();

        members.forEach(function(m) {
            var pos = new kakao.maps.LatLng(m.business_lat, m.business_lng);

            // 마커 생성
            var marker = new kakao.maps.Marker({
                map: jcMap,
                position: pos,
                title: m.name
            });

            // 인포윈도우 내용
            var industry = '';
            if (m.industry) {
                var industryMap = {law:'법률',finance:'금융',medical:'의료',construction:'건설/부동산',it:'IT/기술',manufacturing:'제조',food:'요식',retail:'유통',service:'서비스',realestate:'부동산',culture:'문화',public:'공공',other:'기타'};
                industry = industryMap[m.industry] || m.industry;
                if (m.industry_detail) industry += ' · ' + m.industry_detail;
            }

            var content = '<div style="padding:12px;min-width:200px;max-width:280px;font-size:13px;line-height:1.5">'
                + '<div style="font-size:15px;font-weight:700;margin-bottom:4px">' + escapeHtml(m.name) + '</div>';
            if (m.company) content += '<div style="color:#374151">' + escapeHtml(m.company) + (m.position ? ' / ' + escapeHtml(m.position) : '') + '</div>';
            if (industry) content += '<div style="color:#6B7280">' + escapeHtml(industry) + '</div>';
            if (m.business_address) content += '<div style="color:#6B7280;margin-top:4px">📍 ' + escapeHtml(m.business_address) + '</div>';
            if (m.phone) content += '<div style="margin-top:4px"><a href="tel:' + escapeHtml(m.phone) + '" style="color:#2563EB">📞 ' + escapeHtml(m.phone) + '</a></div>';
            if (m.website) content += '<div><a href="' + escapeHtml(m.website) + '" target="_blank" style="color:#2563EB">🌐 홈페이지</a></div>';
            content += '</div>';

            var infowindow = new kakao.maps.InfoWindow({ content: content });

            kakao.maps.event.addListener(marker, 'click', function() {
                // 다른 인포윈도우 닫기
                jcMapMarkers.forEach(function(mk) { if (mk._iw) mk._iw.close(); });
                infowindow.open(jcMap, marker);
            });

            marker._iw = infowindow;
            jcMapMarkers.push(marker);
            bounds.extend(pos);
        });

        // 모든 마커가 보이도록 범위 조정
        if (members.length > 0) {
            jcMap.setBounds(bounds);
        }

    } catch (err) {
        if (loadingEl) {
            loadingEl.style.display = 'block';
            loadingEl.textContent = '지도 로드 실패: ' + (err.message || '');
        }
    }
}

// 내 위치 표시
var myLocationMarker = null;
var myLocationOverlay = null;

function showMyLocation() {
    if (!navigator.geolocation) {
        showToast('이 브라우저는 위치 서비스를 지원하지 않습니다', 'error');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        function(pos) {
            var lat = pos.coords.latitude;
            var lng = pos.coords.longitude;
            var myPos = new kakao.maps.LatLng(lat, lng);

            // 기존 내 위치 마커 제거
            if (myLocationMarker) myLocationMarker.setMap(null);
            if (myLocationOverlay) myLocationOverlay.setMap(null);

            // 파란 원 마커 (내 위치)
            myLocationOverlay = new kakao.maps.CustomOverlay({
                position: myPos,
                content: '<div style="width:16px;height:16px;background:#2563EB;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(37,99,235,0.5)"></div>',
                zIndex: 100
            });
            myLocationOverlay.setMap(jcMap);

            // 반경 원 (정확도)
            if (myLocationMarker) myLocationMarker.setMap(null);
            myLocationMarker = new kakao.maps.Circle({
                center: myPos,
                radius: pos.coords.accuracy || 50,
                strokeWeight: 1,
                strokeColor: '#2563EB',
                strokeOpacity: 0.3,
                fillColor: '#2563EB',
                fillOpacity: 0.1
            });
            myLocationMarker.setMap(jcMap);

            // 내 위치로 이동
            jcMap.setCenter(myPos);
            jcMap.setLevel(4);
        },
        function(err) {
            showToast('위치를 가져올 수 없습니다: ' + err.message, 'error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
}
