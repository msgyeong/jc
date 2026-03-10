const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/members
 * 회원 목록 조회 (페이지네이션)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        // 전체 활성 회원 수
        const countResult = await query(
            "SELECT COUNT(*) FROM users WHERE status = 'active'"
        );
        const total = parseInt(countResult.rows[0].count);

        // 회원 목록 (활성 회원만, 즐겨찾기 여부 포함)
        const result = await query(
            `SELECT
                u.id, u.email, u.name, u.phone, u.address,
                u.profile_image, u.role, u.status,
                u.company, u.position, u.department,
                u.created_at,
                CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited
             FROM users u
             LEFT JOIN favorites f ON f.target_member_id = u.id AND f.user_id = $3
             WHERE u.status = 'active'
             ORDER BY u.name ASC
             LIMIT $1 OFFSET $2`,
            [limit, offset, req.user.userId]
        );

        res.json({
            success: true,
            members: result.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({
            success: false,
            message: '회원 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/members/search
 * 회원 검색
 */
router.get('/search', authenticate, async (req, res) => {
    try {
        const searchQuery = req.query.q || '';

        if (!searchQuery) {
            return res.json({
                success: true,
                members: [],
                total: 0
            });
        }

        // 검색 (이름, 이메일, 전화번호, 주소로 검색)
        const result = await query(
            `SELECT
                id, email, name, phone, address,
                profile_image, role, status,
                company, position, department,
                created_at
             FROM users
             WHERE status = 'active'
             AND (
                name ILIKE $1
                OR email ILIKE $1
                OR phone ILIKE $1
                OR address ILIKE $1
                OR company ILIKE $1
             )
             ORDER BY name ASC
             LIMIT 50`,
            [`%${searchQuery}%`]
        );

        res.json({
            success: true,
            members: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Search members error:', error);
        res.status(500).json({
            success: false,
            message: '회원 검색 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/members/:id
 * 회원 프로필 상세 조회
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // 회원 조회
        const result = await query(
            `SELECT
                id, email, name, phone, address,
                profile_image, role, status,
                birth_date, gender,
                company, position, department, work_phone,
                created_at, updated_at
             FROM users
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '회원을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            member: result.rows[0]
        });
    } catch (error) {
        console.error('Get member error:', error);
        res.status(500).json({
            success: false,
            message: '회원 조회 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
