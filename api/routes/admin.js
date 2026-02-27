const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// 관리자 권한 확인 미들웨어
const requireAdmin = (req, res, next) => {
    if (!['super_admin', 'admin'].includes(req.user?.role)) {
        return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
    }
    next();
};

/**
 * GET /api/admin/pending
 * 승인 대기 회원 목록
 */
router.get('/pending', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await query(
            `SELECT id, email, name, phone, address, company, position,
                    educations, careers, ssn, emergency_contact_name,
                    emergency_contact, emergency_relationship, special_notes,
                    role, status, created_at
             FROM users WHERE status = 'pending'
             ORDER BY created_at DESC`
        );
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('Pending users error:', error);
        res.status(500).json({ success: false, message: '조회 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/admin/approve/:id
 * 회원 승인
 */
router.put('/approve/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `UPDATE users SET status = 'active', role = 'member', updated_at = NOW()
             WHERE id = $1 AND status = 'pending'
             RETURNING id, name, email, status`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '해당 회원을 찾을 수 없습니다.' });
        }
        res.json({ success: true, message: `${result.rows[0].name} 님이 승인되었습니다.`, user: result.rows[0] });
    } catch (error) {
        console.error('Approve error:', error);
        res.status(500).json({ success: false, message: '승인 처리 중 오류가 발생했습니다.' });
    }
});

/**
 * DELETE /api/admin/reject/:id
 * 회원 거부 (계정 삭제)
 */
router.delete('/reject/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `DELETE FROM users WHERE id = $1 AND status = 'pending' RETURNING name`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '해당 회원을 찾을 수 없습니다.' });
        }
        res.json({ success: true, message: `${result.rows[0].name} 님의 가입이 거부되었습니다.` });
    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ success: false, message: '거부 처리 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/users
 * 전체 회원 목록 (관리자용)
 */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await query(
            `SELECT id, email, name, phone, company, position,
                    profile_image, role, status, created_at
             FROM users ORDER BY created_at DESC`
        );
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('All users error:', error);
        res.status(500).json({ success: false, message: '조회 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/admin/users/:id/role
 * 역할 변경
 */
router.put('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const validRoles = ['member', 'admin', 'super_admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: '유효하지 않은 역할입니다.' });
        }
        // super_admin만 super_admin 권한 부여 가능
        if (role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: '총관리자만 총관리자 권한을 부여할 수 있습니다.' });
        }
        const result = await query(
            `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, role`,
            [role, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }
        res.json({ success: true, message: '역할이 변경되었습니다.', user: result.rows[0] });
    } catch (error) {
        console.error('Role change error:', error);
        res.status(500).json({ success: false, message: '역할 변경 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/admin/users/:id/status
 * 계정 상태 변경 (정지/복구)
 */
router.put('/users/:id/status', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: '유효하지 않은 상태입니다.' });
        }
        const result = await query(
            `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, status`,
            [status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }
        const msg = status === 'suspended' ? '정지' : '복구';
        res.json({ success: true, message: `${result.rows[0].name} 님이 ${msg}되었습니다.`, user: result.rows[0] });
    } catch (error) {
        console.error('Status change error:', error);
        res.status(500).json({ success: false, message: '상태 변경 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
