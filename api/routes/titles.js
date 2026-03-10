const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * GET /api/titles/:userId
 * 특정 회원의 연도별 직함 이력
 */
router.get('/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await query(
            `SELECT id, year, title, position, created_at
             FROM title_history
             WHERE user_id = $1
             ORDER BY year DESC`,
            [userId]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get title history error:', error);
        res.status(500).json({ success: false, message: '직함 이력 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * POST /api/titles/:userId
 * 직함 추가 (관리자)
 */
router.post('/:userId', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { userId } = req.params;
        const { year, title, position } = req.body;

        if (!year || !title) {
            return res.status(400).json({ success: false, message: 'year와 title은 필수입니다.' });
        }

        // 대상 회원 존재 확인
        const userCheck = await query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        const result = await query(
            `INSERT INTO title_history (user_id, year, title, position)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [userId, year, title, position || null]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: '해당 연도에 이미 직함이 등록되어 있습니다.' });
        }
        console.error('Add title error:', error);
        res.status(500).json({ success: false, message: '직함 추가 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/titles/:userId/:titleId
 * 직함 수정 (관리자)
 */
router.put('/:userId/:titleId', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { userId, titleId } = req.params;
        const { year, title, position } = req.body;

        const result = await query(
            `UPDATE title_history
             SET year = COALESCE($1, year),
                 title = COALESCE($2, title),
                 position = $3
             WHERE id = $4 AND user_id = $5
             RETURNING *`,
            [year, title, position || null, titleId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '직함 이력을 찾을 수 없습니다.' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: '해당 연도에 이미 직함이 등록되어 있습니다.' });
        }
        console.error('Update title error:', error);
        res.status(500).json({ success: false, message: '직함 수정 중 오류가 발생했습니다.' });
    }
});

/**
 * DELETE /api/titles/:userId/:titleId
 * 직함 삭제 (관리자)
 */
router.delete('/:userId/:titleId', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { userId, titleId } = req.params;

        const result = await query(
            'DELETE FROM title_history WHERE id = $1 AND user_id = $2 RETURNING id',
            [titleId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '직함 이력을 찾을 수 없습니다.' });
        }

        res.json({ success: true, data: null });
    } catch (error) {
        console.error('Delete title error:', error);
        res.status(500).json({ success: false, message: '직함 삭제 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
