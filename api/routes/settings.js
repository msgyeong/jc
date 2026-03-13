const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/settings
 * 내 환경설정 조회 (theme, font_size)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await query(
            'SELECT theme, font_size FROM user_settings WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: { theme: 'light', font_size: 'medium' }
            });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Get settings error:', err);
        res.status(500).json({ success: false, message: '환경설정 조회에 실패했습니다.' });
    }
});

/**
 * PUT /api/settings
 * 환경설정 변경 (부분 업데이트 지원)
 */
router.put('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { theme, font_size } = req.body;

        // 유효성 검증
        if (theme !== undefined && !['light', 'dark'].includes(theme)) {
            return res.status(400).json({
                success: false,
                message: 'theme은 light 또는 dark이어야 합니다.'
            });
        }
        if (font_size !== undefined && !['small', 'medium', 'large', 'xlarge'].includes(font_size)) {
            return res.status(400).json({
                success: false,
                message: 'font_size는 small, medium, large, xlarge 중 하나여야 합니다.'
            });
        }

        await query(
            `INSERT INTO user_settings (user_id, theme, font_size, updated_at)
             VALUES ($1, COALESCE($2, 'light'), COALESCE($3, 'medium'), NOW())
             ON CONFLICT (user_id) DO UPDATE SET
                theme = COALESCE($2, user_settings.theme),
                font_size = COALESCE($3, user_settings.font_size),
                updated_at = NOW()`,
            [userId, theme || null, font_size || null]
        );

        res.json({ success: true, message: '환경설정이 변경되었습니다.' });
    } catch (err) {
        console.error('Update settings error:', err);
        res.status(500).json({ success: false, message: '환경설정 변경에 실패했습니다.' });
    }
});

module.exports = router;
