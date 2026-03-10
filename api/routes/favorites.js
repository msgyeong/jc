const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/favorites/:targetId
 * 즐겨찾기 추가
 */
router.post('/:targetId', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const targetId = parseInt(req.params.targetId);

        // 본인 즐겨찾기 불가
        if (userId === targetId) {
            return res.status(400).json({ success: false, message: '본인을 즐겨찾기할 수 없습니다.' });
        }

        // 대상 회원 존재 확인
        const targetCheck = await query("SELECT id FROM users WHERE id = $1 AND status = 'active'", [targetId]);
        if (targetCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: '대상 회원을 찾을 수 없습니다.' });
        }

        const result = await query(
            `INSERT INTO favorites (user_id, target_member_id)
             VALUES ($1, $2)
             RETURNING id, target_member_id, created_at`,
            [userId, targetId]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: '이미 즐겨찾기에 추가된 회원입니다.' });
        }
        console.error('Add favorite error:', error);
        res.status(500).json({ success: false, message: '즐겨찾기 추가 중 오류가 발생했습니다.' });
    }
});

/**
 * DELETE /api/favorites/:targetId
 * 즐겨찾기 해제
 */
router.delete('/:targetId', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const targetId = parseInt(req.params.targetId);

        const result = await query(
            'DELETE FROM favorites WHERE user_id = $1 AND target_member_id = $2 RETURNING id',
            [userId, targetId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '즐겨찾기에 없는 회원입니다.' });
        }

        res.json({ success: true, data: null });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ success: false, message: '즐겨찾기 해제 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/favorites
 * 내 즐겨찾기 목록
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await query(
            `SELECT u.id, u.name, u.position, u.company, u.phone, u.profile_image, f.created_at as favorited_at
             FROM favorites f
             JOIN users u ON u.id = f.target_member_id
             WHERE f.user_id = $1 AND u.status = 'active'
             ORDER BY u.name ASC`,
            [userId]
        );

        res.json({
            success: true,
            data: { items: result.rows, total: result.rows.length }
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ success: false, message: '즐겨찾기 목록 조회 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
