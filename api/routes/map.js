const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/map/members
 * 지도에 표시할 회원 목록 (map_visible=true, 좌표 있는 회원만)
 */
router.get('/members', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT id, name, company, position, department, industry, industry_detail,
                    phone, work_phone, profile_image, business_address,
                    business_lat, business_lng, website
             FROM users
             WHERE status = 'active'
               AND role != 'super_admin'
               AND map_visible = true
               AND business_lat IS NOT NULL
               AND business_lng IS NOT NULL`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Map members error:', error);
        res.status(500).json({ success: false, error: '지도 데이터를 불러올 수 없습니다.' });
    }
});

/**
 * PUT /api/map/my-location
 * 내 사업장 좌표 + 지도 표기 설정 업데이트
 */
router.put('/my-location', authenticate, async (req, res) => {
    try {
        const { business_address, business_lat, business_lng, map_visible } = req.body;
        const updates = [];
        const params = [];

        if (business_address !== undefined) {
            params.push(business_address);
            updates.push(`business_address = $${params.length}`);
        }
        if (business_lat !== undefined) {
            params.push(business_lat);
            updates.push(`business_lat = $${params.length}`);
        }
        if (business_lng !== undefined) {
            params.push(business_lng);
            updates.push(`business_lng = $${params.length}`);
        }
        if (map_visible !== undefined) {
            params.push(map_visible);
            updates.push(`map_visible = $${params.length}`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: '변경할 정보가 없습니다.' });
        }

        params.push(req.user.userId);
        updates.push('updated_at = NOW()');

        await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length}`,
            params
        );

        res.json({ success: true, message: '위치 정보가 업데이트되었습니다.' });
    } catch (error) {
        console.error('Map update error:', error);
        res.status(500).json({ success: false, error: '위치 업데이트 실패' });
    }
});

/**
 * PUT /api/map/admin-set/:userId
 * 관리자가 회원의 좌표 설정
 */
router.put('/admin-set/:userId', authenticate, async (req, res) => {
    try {
        if (!['super_admin', 'admin', 'local_admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, error: '관리 권한이 필요합니다.' });
        }
        const { business_address, business_lat, business_lng, map_visible } = req.body;
        await query(
            `UPDATE users SET business_address = $1, business_lat = $2, business_lng = $3,
             map_visible = COALESCE($4, true), updated_at = NOW() WHERE id = $5`,
            [business_address, business_lat, business_lng, map_visible, req.params.userId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/map/geocode
 * 주소 → 좌표 변환 (카카오 API 프록시)
 */
router.post('/geocode', authenticate, async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) return res.status(400).json({ success: false, error: '주소를 입력하세요.' });

        const https = require('https');
        const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;

        const kakaoRes = await new Promise((resolve, reject) => {
            https.get(url, {
                headers: { 'Authorization': 'KakaoAK bf233c9ee97fc1e97870c696f6375006' }
            }, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });

        const docs = kakaoRes.documents || [];
        if (docs.length === 0) {
            return res.json({ success: true, data: null, message: '좌표를 찾을 수 없습니다.' });
        }
        res.json({
            success: true,
            data: { lat: parseFloat(docs[0].y), lng: parseFloat(docs[0].x), address: docs[0].address_name || address }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/map/auto-geocode-all
 * 기존 회원 주소 일괄 좌표 변환 (관리자)
 */
router.post('/auto-geocode-all', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'super_admin만 가능합니다.' });
        }
        // business_lat이 없고 address가 있는 회원
        const members = await query(
            `SELECT id, address, company FROM users WHERE business_lat IS NULL AND address IS NOT NULL AND status = 'active'`
        );
        let updated = 0;
        const https = require('https');

        for (const m of members.rows) {
            try {
                const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(m.address)}`;
                const kakaoRes = await new Promise((resolve, reject) => {
                    https.get(url, {
                        headers: { 'Authorization': 'KakaoAK bf233c9ee97fc1e97870c696f6375006' }
                    }, (response) => {
                        let data = '';
                        response.on('data', chunk => data += chunk);
                        response.on('end', () => resolve(JSON.parse(data)));
                    }).on('error', reject);
                });
                const docs = kakaoRes.documents || [];
                if (docs.length > 0) {
                    await query(
                        `UPDATE users SET business_address = $1, business_lat = $2, business_lng = $3, updated_at = NOW() WHERE id = $4`,
                        [m.address, parseFloat(docs[0].y), parseFloat(docs[0].x), m.id]
                    );
                    updated++;
                }
            } catch (catchErr) { console.error("[silent-catch]", catchErr.message); }
        }
        res.json({ success: true, data: { total: members.rows.length, updated } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
