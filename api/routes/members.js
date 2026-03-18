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

// 초성(자음)만으로 구성되어 있는지 판별
function isAllChosung(str) {
    return /^[ㄱ-ㅎ]+$/.test(str);
}

/**
 * GET /api/members/search
 * 회원 검색 (텍스트/초성 + 업종 필터 AND 조합)
 */
router.get('/search', authenticate, async (req, res) => {
    try {
        const searchQuery = (req.query.q || '').trim();
        const industry = req.query.industry;

        if (!searchQuery && !industry) {
            return res.json({ success: true, members: [], total: 0 });
        }

        const conditions = ["u.status = 'active'", "u.role != 'super_admin'"];
        const params = [req.user.userId];

        if (searchQuery) {
            if (isAllChosung(searchQuery)) {
                // 초성 검색 모드
                params.push(`%${searchQuery}%`);
                conditions.push(`u.name_chosung LIKE $${params.length}`);
            } else {
                // 일반 텍스트 검색
                params.push(`%${searchQuery}%`);
                conditions.push(`(
                    u.name ILIKE $${params.length}
                    OR u.email ILIKE $${params.length}
                    OR u.phone ILIKE $${params.length}
                    OR u.company ILIKE $${params.length}
                    OR u.position ILIKE $${params.length}
                    OR u.profession ILIKE $${params.length}
                )`);
            }
        }

        if (industry && VALID_INDUSTRY_CODES.includes(industry)) {
            params.push(industry);
            conditions.push(`u.industry = $${params.length}`);
        }

        const result = await query(
            `SELECT
                u.id, u.email, u.name, u.phone, u.address,
                u.profile_image, u.role, u.status,
                u.company, u.position, u.department,
                u.industry, u.industry_detail, u.profession,
                u.created_at,
                CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited
             FROM users u
             LEFT JOIN favorites f ON f.target_member_id = u.id AND f.user_id = $1
             WHERE ${conditions.join(' AND ')}
             ORDER BY u.name ASC
             LIMIT 50`,
            params
        );

        const members = result.rows.map(m => ({
            ...m,
            industry_name: m.industry ? (INDUSTRY_CATEGORIES.find(c => c.code === m.industry) || {}).name || null : null
        }));

        res.json({ success: true, members, total: members.length });
    } catch (error) {
        console.error('Search members error:', error);
        res.status(500).json({ success: false, message: '회원 검색 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/members/search-all
 * 전체 조직(타로컬 포함) 회원 검색 — 초성 지원
 * 프라이버시: 타 조직 회원은 전화번호/주소/이메일 미반환
 */
router.get('/search-all', authenticate, async (req, res) => {
    try {
        const searchQuery = (req.query.q || '').trim();
        const industry = req.query.industry;
        const orgId = req.query.org_id;

        if (!searchQuery && !industry && !orgId) {
            return res.json({ success: true, members: [], total: 0 });
        }

        const myOrgResult = await query(
            `SELECT u.org_id, o.district FROM users u LEFT JOIN organizations o ON o.id = u.org_id WHERE u.id = $1`,
            [req.user.userId]
        );
        const myOrgId = myOrgResult.rows[0] ? myOrgResult.rows[0].org_id : null;
        const myDistrict = myOrgResult.rows[0] ? myOrgResult.rows[0].district : null;

        const conditions = ["u.status = 'active'", "u.role != 'super_admin'"];
        const params = [req.user.userId];

        if (searchQuery) {
            if (isAllChosung(searchQuery)) {
                params.push(`%${searchQuery}%`);
                conditions.push(`u.name_chosung LIKE $${params.length}`);
            } else {
                params.push(`%${searchQuery}%`);
                conditions.push(`(
                    u.name ILIKE $${params.length}
                    OR u.company ILIKE $${params.length}
                    OR u.profession ILIKE $${params.length}
                    OR o.name ILIKE $${params.length}
                )`);
            }
        }

        if (industry && VALID_INDUSTRY_CODES.includes(industry)) {
            params.push(industry);
            conditions.push(`u.industry = $${params.length}`);
        }

        if (orgId) {
            params.push(parseInt(orgId));
            conditions.push(`u.org_id = $${params.length}`);
        }

        const result = await query(
            `SELECT
                u.id, u.name, u.profile_image,
                u.company, u.position, u.industry, u.profession,
                u.org_id, u.phone_visibility,
                COALESCE(o.name, '소속 없음') as org_name,
                o.district as org_district,
                CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorited,
                CASE
                    WHEN u.org_id = ${myOrgId ? myOrgId : 'NULL'} THEN u.phone
                    WHEN COALESCE(u.phone_visibility, 'local') = 'all' THEN u.phone
                    WHEN COALESCE(u.phone_visibility, 'local') = 'district'
                         AND o.district = ${myDistrict ? "'" + myDistrict.replace(/'/g, "''") + "'" : 'NULL'} THEN u.phone
                    ELSE NULL
                END as phone
             FROM users u
             LEFT JOIN organizations o ON o.id = u.org_id
             LEFT JOIN favorites f ON f.target_member_id = u.id AND f.user_id = $1
             WHERE ${conditions.join(' AND ')}
             ORDER BY
                CASE WHEN u.org_id = ${myOrgId ? myOrgId : 'NULL'} THEN 0 ELSE 1 END,
                o.name ASC, u.name ASC
             LIMIT 100`,
            params
        );

        const members = result.rows.map(m => ({
            ...m,
            is_same_org: myOrgId && m.org_id === myOrgId,
            industry_name: m.industry ? (INDUSTRY_CATEGORIES.find(c => c.code === m.industry) || {}).name || null : null
        }));

        res.json({ success: true, members, total: members.length });
    } catch (error) {
        console.error('Search all members error:', error);
        res.status(500).json({ success: false, message: '전체 회원 검색 중 오류가 발생했습니다.' });
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
                u.id, u.email, u.name, u.phone, u.address,
                u.profile_image, u.role, u.status,
                u.birth_date, u.gender,
                u.company, u.position, u.department, u.work_phone,
                u.industry, u.industry_detail, u.profession,
                u.position_id, u.website, u.phone_visibility,
                u.org_id, u.created_at, u.updated_at,
                o.district as org_district
             FROM users u
             LEFT JOIN organizations o ON o.id = u.org_id
             WHERE u.id = $1 AND u.status NOT IN ('withdrawn', 'rejected')`,
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

        // 타 조직 회원 전화번호 공개 범위 적용
        const myOrgResult = await query('SELECT u.org_id, o.district FROM users u LEFT JOIN organizations o ON o.id = u.org_id WHERE u.id = $1', [req.user.userId]);
        const myOrgId = myOrgResult.rows[0] ? myOrgResult.rows[0].org_id : null;
        const myDistrict = myOrgResult.rows[0] ? myOrgResult.rows[0].district : null;
        const isSameOrg = myOrgId && member.org_id === myOrgId;
        const isSelf = String(id) === String(req.user.userId);

        if (!isSelf && !isSameOrg) {
            const vis = member.phone_visibility || 'local';
            if (vis === 'local') {
                member.phone = null;
                member.work_phone = null;
            } else if (vis === 'district') {
                if (member.org_district !== myDistrict) {
                    member.phone = null;
                    member.work_phone = null;
                }
            }
            // vis === 'all': 전화번호 공개
        }

        // 내부 필드 제거
        delete member.org_district;
        delete member.phone_visibility;

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
