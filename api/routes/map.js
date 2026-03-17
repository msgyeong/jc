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

module.exports = router;
