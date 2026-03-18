const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/member-groups
 * 내 그룹 목록 (멤버 수 포함)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT g.id, g.name, g.sort_order, g.created_at,
                    COUNT(gi.id)::int as member_count
             FROM member_groups g
             LEFT JOIN member_group_items gi ON gi.group_id = g.id
             WHERE g.user_id = $1
             GROUP BY g.id
             ORDER BY g.sort_order ASC, g.created_at ASC`,
            [req.user.userId]
        );
        res.json({ success: true, data: { items: result.rows } });
    } catch (error) {
        console.error('Get member groups error:', error);
        res.status(500).json({ success: false, message: '그룹 목록 조회 실패' });
    }
});

/**
 * POST /api/member-groups
 * 그룹 생성
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: '그룹 이름을 입력해주세요.' });
        }
        const result = await query(
            `INSERT INTO member_groups (user_id, name) VALUES ($1, $2) RETURNING id, name, sort_order, created_at`,
            [req.user.userId, name.trim()]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Create member group error:', error);
        res.status(500).json({ success: false, message: '그룹 생성 실패' });
    }
});

/**
 * PUT /api/member-groups/:id
 * 그룹 이름 변경
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: '그룹 이름을 입력해주세요.' });
        }
        const result = await query(
            `UPDATE member_groups SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name`,
            [name.trim(), req.params.id, req.user.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '그룹을 찾을 수 없습니다.' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Update member group error:', error);
        res.status(500).json({ success: false, message: '그룹 수정 실패' });
    }
});

/**
 * DELETE /api/member-groups/:id
 * 그룹 삭제 (cascade로 멤버도 삭제)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const result = await query(
            `DELETE FROM member_groups WHERE id = $1 AND user_id = $2 RETURNING id`,
            [req.params.id, req.user.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '그룹을 찾을 수 없습니다.' });
        }
        res.json({ success: true, message: '그룹이 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete member group error:', error);
        res.status(500).json({ success: false, message: '그룹 삭제 실패' });
    }
});

/**
 * GET /api/member-groups/:id/members
 * 그룹 멤버 목록
 */
router.get('/:id/members', authenticate, async (req, res) => {
    try {
        // 먼저 그룹 소유권 확인
        const groupCheck = await query(
            `SELECT id FROM member_groups WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.userId]
        );
        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: '그룹을 찾을 수 없습니다.' });
        }

        const result = await query(
            `SELECT u.id, u.name, u.profile_image, u.position, u.company, u.phone,
                    gi.created_at as added_at
             FROM member_group_items gi
             JOIN users u ON u.id = gi.target_member_id
             WHERE gi.group_id = $1 AND u.status = 'active'
             ORDER BY u.name ASC`,
            [req.params.id]
        );
        res.json({ success: true, data: { items: result.rows } });
    } catch (error) {
        console.error('Get group members error:', error);
        res.status(500).json({ success: false, message: '그룹 멤버 조회 실패' });
    }
});

/**
 * POST /api/member-groups/:id/members
 * 그룹에 멤버 추가
 */
router.post('/:id/members', authenticate, async (req, res) => {
    try {
        const { target_member_id } = req.body;
        if (!target_member_id) {
            return res.status(400).json({ success: false, message: '멤버 ID를 입력해주세요.' });
        }

        // 그룹 소유권 확인
        const groupCheck = await query(
            `SELECT id FROM member_groups WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.userId]
        );
        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: '그룹을 찾을 수 없습니다.' });
        }

        const result = await query(
            `INSERT INTO member_group_items (group_id, target_member_id)
             VALUES ($1, $2)
             ON CONFLICT (group_id, target_member_id) DO NOTHING
             RETURNING id`,
            [req.params.id, target_member_id]
        );

        if (result.rows.length === 0) {
            return res.status(409).json({ success: false, message: '이미 그룹에 추가된 멤버입니다.' });
        }

        res.status(201).json({ success: true, message: '멤버가 그룹에 추가되었습니다.' });
    } catch (error) {
        console.error('Add group member error:', error);
        res.status(500).json({ success: false, message: '멤버 추가 실패' });
    }
});

/**
 * DELETE /api/member-groups/:id/members/:memberId
 * 그룹에서 멤버 제거
 */
router.delete('/:id/members/:memberId', authenticate, async (req, res) => {
    try {
        // 그룹 소유권 확인
        const groupCheck = await query(
            `SELECT id FROM member_groups WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.userId]
        );
        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: '그룹을 찾을 수 없습니다.' });
        }

        await query(
            `DELETE FROM member_group_items WHERE group_id = $1 AND target_member_id = $2`,
            [req.params.id, req.params.memberId]
        );

        res.json({ success: true, message: '멤버가 그룹에서 제거되었습니다.' });
    } catch (error) {
        console.error('Remove group member error:', error);
        res.status(500).json({ success: false, message: '멤버 제거 실패' });
    }
});

module.exports = router;
