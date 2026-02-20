const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/profile
 * 내 프로필 조회
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 프로필 조회
        const result = await query(
            `SELECT 
                id, email, name, phone, address,
                profile_image, role, status,
                birth_date, gender,
                created_at, updated_at
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '프로필을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            profile: result.rows[0]
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/profile
 * 프로필 수정
 */
router.put('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, phone, address, birth_date, gender } = req.body;

        // 유효성 검증
        if (!name || !phone || !address) {
            return res.status(400).json({
                success: false,
                message: '필수 항목을 모두 입력해주세요.'
            });
        }

        // 프로필 수정
        await query(
            `UPDATE users 
             SET name = $1, phone = $2, address = $3, 
                 birth_date = $4, gender = $5, updated_at = NOW()
             WHERE id = $6`,
            [name, phone, address, birth_date, gender, userId]
        );

        res.json({
            success: true,
            message: '프로필이 수정되었습니다.'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 수정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/profile/image
 * 프로필 이미지 URL 업데이트
 * (실제 이미지 업로드는 별도 Storage 서비스 필요)
 */
router.put('/image', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { profile_image } = req.body;

        if (!profile_image) {
            return res.status(400).json({
                success: false,
                message: '프로필 이미지 URL을 입력해주세요.'
            });
        }

        // 프로필 이미지 URL 업데이트
        await query(
            'UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2',
            [profile_image, userId]
        );

        res.json({
            success: true,
            message: '프로필 이미지가 업데이트되었습니다.'
        });
    } catch (error) {
        console.error('Update profile image error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 이미지 업데이트 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
