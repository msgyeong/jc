const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

function isManagerRole(role) {
    return ['super_admin', 'admin', 'local_admin'].includes(role);
}

/**
 * GET /api/orgchart
 * 조직도 조회 (그룹 + 멤버)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const groups = await query(
            `SELECT og.*,
                (SELECT json_agg(json_build_object(
                    'id', om.id, 'position_title', om.position_title,
                    'user_id', om.user_id, 'user_name', COALESCE(u.name, om.manual_name),
                    'manual_name', om.manual_name, 'sort_order', om.sort_order,
                    'profile_image', u.profile_image,
                    'user_position', u.position, 'user_company', u.company
                ) ORDER BY om.sort_order)
                FROM orgchart_members om
                LEFT JOIN users u ON om.user_id = u.id
                WHERE om.group_id = og.id
                ) as members
             FROM orgchart_groups og
             WHERE og.org_id = $1 OR og.org_id IS NULL
             ORDER BY og.sort_order, og.id`,
            [req.user.orgId || 1]
        );

        res.json({
            success: true,
            data: groups.rows.map(g => ({
                ...g,
                members: g.members || []
            }))
        });
    } catch (error) {
        console.error('Orgchart get error:', error);
        res.status(500).json({ success: false, error: '조직도를 불러올 수 없습니다.' });
    }
});

/**
 * POST /api/orgchart/groups
 * 그룹 추가 (관리자)
 */
router.post('/groups', authenticate, async (req, res) => {
    try {
        if (!isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '관리 권한이 필요합니다.' });
        }
        const { name, sort_order } = req.body;
        if (!name) return res.status(400).json({ success: false, error: '그룹명을 입력하세요.' });

        const result = await query(
            `INSERT INTO orgchart_groups (org_id, name, sort_order) VALUES ($1, $2, $3) RETURNING *`,
            [req.user.orgId || 1, name, sort_order || 0]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/orgchart/groups/:id
 * 그룹 수정
 */
router.put('/groups/:id', authenticate, async (req, res) => {
    try {
        if (!isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '관리 권한이 필요합니다.' });
        }
        const { name, sort_order } = req.body;
        await query(
            `UPDATE orgchart_groups SET name = COALESCE($1, name), sort_order = COALESCE($2, sort_order), updated_at = NOW() WHERE id = $3`,
            [name, sort_order, req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/orgchart/groups/:id
 * 그룹 삭제 (멤버도 함께)
 */
router.delete('/groups/:id', authenticate, async (req, res) => {
    try {
        if (!isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '관리 권한이 필요합니다.' });
        }
        await query('DELETE FROM orgchart_groups WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/orgchart/members
 * 멤버 추가 (회원 매칭 또는 수기 입력)
 */
router.post('/members', authenticate, async (req, res) => {
    try {
        if (!isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '관리 권한이 필요합니다.' });
        }
        const { group_id, position_title, user_id, manual_name, sort_order } = req.body;
        if (!group_id) return res.status(400).json({ success: false, error: '그룹을 선택하세요.' });
        if (!user_id && !manual_name) return res.status(400).json({ success: false, error: '회원을 선택하거나 이름을 입력하세요.' });

        // position_title: 입력값 우선, 없으면 회원 프로필의 position 사용
        let finalPosition = position_title;
        if (!finalPosition && user_id) {
            const userRow = await query('SELECT position FROM users WHERE id = $1', [user_id]);
            finalPosition = (userRow.rows[0] && userRow.rows[0].position) || '회원';
        }
        if (!finalPosition && manual_name) {
            return res.status(400).json({ success: false, error: '수기 등록 시 직책명을 입력하세요.' });
        }

        const result = await query(
            `INSERT INTO orgchart_members (group_id, position_title, user_id, manual_name, sort_order)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [group_id, finalPosition, user_id || null, manual_name || null, sort_order || 0]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/orgchart/members/:id
 * 멤버 삭제
 */
router.delete('/members/:id', authenticate, async (req, res) => {
    try {
        if (!isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '관리 권한이 필요합니다.' });
        }
        await query('DELETE FROM orgchart_members WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
