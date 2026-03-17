const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// 업종 카테고리 상수
const INDUSTRY_CATEGORIES = [
    { code: 'law', name: '법률/법무' },
    { code: 'finance', name: '금융/보험' },
    { code: 'medical', name: '의료/건강' },
    { code: 'construction', name: '건설/부동산' },
    { code: 'it', name: 'IT/기술' },
    { code: 'manufacturing', name: '제조/생산' },
    { code: 'food', name: '요식/식음료' },
    { code: 'retail', name: '유통/판매' },
    { code: 'service', name: '서비스' },
    { code: 'realestate', name: '부동산/임대' },
    { code: 'culture', name: '문화/예술' },
    { code: 'public', name: '공공/기관' },
    { code: 'other', name: '기타' }
];

const VALID_INDUSTRY_CODES = INDUSTRY_CATEGORIES.map(c => c.code);

/**
 * GET /api/members
 * 회원 목록 조회 (페이지네이션 + 업종 필터)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const industry = req.query.industry;

        const conditions = ["u.status = 'active'", "u.role != 'super_admin'"];
        const params = [limit, offset, req.user.userId];

        if (industry && VALID_INDUSTRY_CODES.includes(industry)) {
            params.push(industry);
            conditions.push(`u.industry = $${params.length}`);
        }

        const whereClause = conditions.join(' AND ');

        const countParams = [];
        const countConditions = ["status = 'active'", "role != 'super_admin'"];
        if (industry && VALID_INDUSTRY_CODES.includes(industry)) {
            countParams.push(industry);
            countConditions.push(`industry = $${countParams.length}`);
        }
        const countRes = await query(
            `SELECT COUNT(*) FROM users WHERE ${countConditions.join(' AND ')}`,
            countParams
        );
        const total = parseInt(countRes.rows[0].count);

        const industryName = industry ? (INDUSTRY_CATEGORIES.find(c => c.code === industry) || {}).name : null;

        const result = await query(
            `SELECT
                u.id, u.email, u.name, u.phone, u.address,
                u.profile_image, u.role, u.status,
                u.company, u.position, u.department,
                u.industry, u.industry_detail, u.profession,
                u.position_id,
                u.created_at,
                CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited
             FROM users u
             LEFT JOIN favorites f ON f.target_member_id = u.id AND f.user_id = $3
             WHERE ${whereClause}
             ORDER BY u.name ASC
             LIMIT $1 OFFSET $2`,
            params
        );

        // industry_name 추가
        const members = result.rows.map(m => ({
            ...m,
            industry_name: m.industry ? (INDUSTRY_CATEGORIES.find(c => c.code === m.industry) || {}).name || null : null
        }));

        res.json({
            success: true,
            members,
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
 * 회원 검색 (텍스트 + 업종 필터 AND 조합)
 */
router.get('/search', authenticate, async (req, res) => {
    try {
        const searchQuery = req.query.q || '';
        const industry = req.query.industry;

        if (!searchQuery && !industry) {
            return res.json({
                success: true,
                members: [],
                total: 0
            });
        }

        const conditions = ["status = 'active'"];
        const params = [];

        if (searchQuery) {
            params.push(`%${searchQuery}%`);
            conditions.push(`(
                name ILIKE $${params.length}
                OR email ILIKE $${params.length}
                OR phone ILIKE $${params.length}
                OR address ILIKE $${params.length}
                OR company ILIKE $${params.length}
            )`);
        }

        if (industry && VALID_INDUSTRY_CODES.includes(industry)) {
            params.push(industry);
            conditions.push(`industry = $${params.length}`);
        }

        const result = await query(
            `SELECT
                id, email, name, phone, address,
                profile_image, role, status,
                company, position, department,
                industry, industry_detail,
                created_at
             FROM users
             WHERE ${conditions.join(' AND ')}
             ORDER BY name ASC
             LIMIT 50`,
            params
        );

        const members = result.rows.map(m => ({
            ...m,
            industry_name: m.industry ? (INDUSTRY_CATEGORIES.find(c => c.code === m.industry) || {}).name || null : null
        }));

        res.json({
            success: true,
            members,
            total: members.length
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

        const result = await query(
            `SELECT
                id, email, name, phone, address,
                profile_image, role, status,
                birth_date, gender,
                company, position, department, work_phone,
                industry, industry_detail, profession,
                position_id, website,
                created_at, updated_at
             FROM users
             WHERE id = $1 AND status NOT IN ('withdrawn', 'rejected')`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '회원을 찾을 수 없습니다.'
            });
        }

        const member = result.rows[0];
        member.industry_name = member.industry
            ? (INDUSTRY_CATEGORIES.find(c => c.code === member.industry) || {}).name || null
            : null;

        res.json({
            success: true,
            member
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
