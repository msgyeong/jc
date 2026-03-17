const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

/* ======================================================
   GET /api/organizations/public
   공개 목록 (회원가입 드롭다운용, 인증 불필요)
   ====================================================== */
router.get('/public', async (req, res) => {
    try {
        const result = await query(
            `SELECT id, name, code, district
             FROM organizations
             WHERE is_active = true
             ORDER BY name ASC`
        );

        return res.json({
            success: true,
            data: { items: result.rows }
        });
    } catch (error) {
        console.error('조직 공개 목록 조회 오류:', error);
        return res.status(500).json({
            success: false,
            error: '조직 목록을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

/* ======================================================
   GET /api/organizations
   전체 조직 목록 (인증 필요)
   ====================================================== */
router.get('/', authenticate, requireRole(['super_admin']), async (req, res) => {
    try {
        const { page = 1, limit = 20, search, is_active } = req.query;
        const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
        const params = [];
        const conditions = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(o.name ILIKE $${params.length} OR o.code ILIKE $${params.length} OR o.district ILIKE $${params.length})`);
        }

        if (is_active !== undefined) {
            params.push(is_active === 'true');
            conditions.push(`o.is_active = $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // 총 개수
        const countResult = await query(
            `SELECT COUNT(*) FROM organizations o ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        // 목록 조회 (회원 수 포함)
        const listParams = [...params, Number(limit), offset];
        const result = await query(
            `SELECT o.id, o.name, o.code, o.district, o.region, o.description,
                    o.is_active, o.created_at, o.updated_at,
                    COUNT(u.id) FILTER (WHERE u.is_approved = true AND u.is_deleted = false) AS member_count
             FROM organizations o
             LEFT JOIN users u ON u.org_id = o.id
             ${whereClause}
             GROUP BY o.id
             ORDER BY o.created_at DESC
             LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
            listParams
        );

        return res.json({
            success: true,
            data: {
                items: result.rows,
                total,
                page: Number(page),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('조직 목록 조회 오류:', error);
        return res.status(500).json({
            success: false,
            error: '조직 목록을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

/* ======================================================
   GET /api/organizations/:id
   조직 상세 조회 (회원 수 포함)
   ====================================================== */
router.get('/:id', authenticate, requireRole(['super_admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT o.id, o.name, o.code, o.district, o.region, o.description,
                    o.is_active, o.created_by, o.created_at, o.updated_at,
                    COUNT(u.id) FILTER (WHERE u.is_approved = true AND u.is_deleted = false) AS member_count
             FROM organizations o
             LEFT JOIN users u ON u.org_id = o.id
             WHERE o.id = $1
             GROUP BY o.id`,
            [id]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                error: '해당 조직을 찾을 수 없습니다.'
            });
        }

        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('조직 상세 조회 오류:', error);
        return res.status(500).json({
            success: false,
            error: '조직 정보를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

/* ======================================================
   POST /api/organizations
   조직 생성 (super_admin 전용)
   ====================================================== */
router.post('/', authenticate, requireRole(['super_admin']), async (req, res) => {
    try {
        const { name, code, district, region, description } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                success: false,
                error: '조직명과 코드는 필수 항목입니다.'
            });
        }

        // 코드 중복 체크
        const existing = await query(
            `SELECT id FROM organizations WHERE code = $1`,
            [code]
        );
        if (existing.rows.length) {
            return res.status(409).json({
                success: false,
                error: '이미 사용 중인 조직 코드입니다.'
            });
        }

        const result = await query(
            `INSERT INTO organizations (name, code, district, region, description, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, name, code, district, region, description, is_active, created_at`,
            [name, code.toUpperCase(), district || null, region || null, description || null, req.user.userId]
        );

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('조직 생성 오류:', error);
        return res.status(500).json({
            success: false,
            error: '조직 생성 중 오류가 발생했습니다.'
        });
    }
});

/* ======================================================
   PUT /api/organizations/:id
   조직 수정 (super_admin 전용)
   ====================================================== */
router.put('/:id', authenticate, requireRole(['super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, district, region, description } = req.body;

        // 존재 여부 확인
        const existing = await query(
            `SELECT id FROM organizations WHERE id = $1`,
            [id]
        );
        if (!existing.rows.length) {
            return res.status(404).json({
                success: false,
                error: '해당 조직을 찾을 수 없습니다.'
            });
        }

        // 코드 변경 시 중복 체크
        if (code) {
            const codeCheck = await query(
                `SELECT id FROM organizations WHERE code = $1 AND id != $2`,
                [code, id]
            );
            if (codeCheck.rows.length) {
                return res.status(409).json({
                    success: false,
                    error: '이미 사용 중인 조직 코드입니다.'
                });
            }
        }

        const result = await query(
            `UPDATE organizations
             SET name = COALESCE($1, name),
                 code = COALESCE($2, code),
                 district = COALESCE($3, district),
                 region = COALESCE($4, region),
                 description = COALESCE($5, description),
                 updated_at = NOW()
             WHERE id = $6
             RETURNING id, name, code, district, region, description, is_active, updated_at`,
            [name || null, code ? code.toUpperCase() : null, district || null, region || null, description || null, id]
        );

        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('조직 수정 오류:', error);
        return res.status(500).json({
            success: false,
            error: '조직 수정 중 오류가 발생했습니다.'
        });
    }
});

/* ======================================================
   DELETE /api/organizations/:id
   조직 비활성화 (super_admin 전용, soft delete)
   ====================================================== */
router.delete('/:id', authenticate, requireRole(['super_admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await query(
            `SELECT id, is_active FROM organizations WHERE id = $1`,
            [id]
        );
        if (!existing.rows.length) {
            return res.status(404).json({
                success: false,
                error: '해당 조직을 찾을 수 없습니다.'
            });
        }

        if (!existing.rows[0].is_active) {
            return res.status(400).json({
                success: false,
                error: '이미 비활성화된 조직입니다.'
            });
        }

        await query(
            `UPDATE organizations SET is_active = false, updated_at = NOW() WHERE id = $1`,
            [id]
        );

        return res.json({
            success: true,
            data: { message: '조직이 비활성화되었습니다.' }
        });
    } catch (error) {
        console.error('조직 비활성화 오류:', error);
        return res.status(500).json({
            success: false,
            error: '조직 비활성화 중 오류가 발생했습니다.'
        });
    }
});

/* ======================================================
   POST /api/organizations/:id/assign-admin
   로컬 관리자 지정 (super_admin 전용)
   ====================================================== */
router.post('/:id/assign-admin', authenticate, requireRole(['super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                error: '사용자 ID는 필수 항목입니다.'
            });
        }

        // 조직 존재 여부
        const org = await query(
            `SELECT id, name, is_active FROM organizations WHERE id = $1`,
            [id]
        );
        if (!org.rows.length) {
            return res.status(404).json({
                success: false,
                error: '해당 조직을 찾을 수 없습니다.'
            });
        }
        if (!org.rows[0].is_active) {
            return res.status(400).json({
                success: false,
                error: '비활성화된 조직에는 관리자를 지정할 수 없습니다.'
            });
        }

        // 사용자 존재 및 소속 확인
        const user = await query(
            `SELECT id, name, role, org_id, is_approved, is_deleted
             FROM users WHERE id = $1`,
            [user_id]
        );
        if (!user.rows.length) {
            return res.status(404).json({
                success: false,
                error: '해당 사용자를 찾을 수 없습니다.'
            });
        }

        const targetUser = user.rows[0];
        if (targetUser.is_deleted) {
            return res.status(400).json({
                success: false,
                error: '탈퇴한 사용자입니다.'
            });
        }
        if (!targetUser.is_approved) {
            return res.status(400).json({
                success: false,
                error: '승인되지 않은 사용자입니다.'
            });
        }

        // 사용자의 org_id를 해당 조직으로 설정하고 role을 local_admin으로 변경
        await query(
            `UPDATE users SET role = 'local_admin', org_id = $1, updated_at = NOW() WHERE id = $2`,
            [id, user_id]
        );

        return res.json({
            success: true,
            data: {
                message: `${targetUser.name}님이 ${org.rows[0].name}의 관리자로 지정되었습니다.`,
                user_id: targetUser.id,
                org_id: Number(id),
                role: 'local_admin'
            }
        });
    } catch (error) {
        console.error('관리자 지정 오류:', error);
        return res.status(500).json({
            success: false,
            error: '관리자 지정 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
