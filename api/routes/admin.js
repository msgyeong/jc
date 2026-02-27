const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

// 모든 관리자 라우트에 인증 + 관리자 권한 필요
router.use(authenticate);
router.use(requireRole(['admin', 'super_admin']));

/**
 * GET /api/admin/members/pending
 * 승인 대기 회원 목록
 */
router.get('/members/pending', async (req, res) => {
    try {
        const result = await query(
            `SELECT id, email, name, phone, birth_date,
                    profile_image, role, status, created_at
             FROM users
             WHERE status = 'pending'
             ORDER BY created_at DESC`
        );
        res.json({ success: true, members: result.rows });
    } catch (error) {
        console.error('Admin pending members error:', error);
        res.status(500).json({
            success: false,
            message: '승인 대기 회원 조회 중 오류가 발생했습니다.',
        });
    }
});

/**
 * GET /api/admin/members
 * 전체 회원 목록 (상태 무관, 검색/필터 지원)
 */
router.get('/members', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const search = req.query.q || '';
        const status = req.query.status || '';

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND (name ILIKE $${params.length}
                OR email ILIKE $${params.length}
                OR phone ILIKE $${params.length})`;
        }

        if (status) {
            params.push(status);
            whereClause += ` AND status = $${params.length}`;
        }

        const countResult = await query(
            `SELECT COUNT(*) FROM users ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit, offset);
        const result = await query(
            `SELECT id, email, name, phone, birth_date,
                    profile_image, role, status, created_at, updated_at
             FROM users
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({
            success: true,
            members: result.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Admin all members error:', error);
        res.status(500).json({
            success: false,
            message: '회원 목록 조회 중 오류가 발생했습니다.',
        });
    }
});

/**
 * PATCH /api/admin/members/:id/approve
 * 회원 승인
 */
router.patch('/members/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        await query(
            `UPDATE users
             SET status = 'active', role = 'member', updated_at = NOW()
             WHERE id = $1`,
            [id]
        );
        res.json({ success: true, message: '회원이 승인되었습니다.' });
    } catch (error) {
        console.error('Admin approve error:', error);
        res.status(500).json({
            success: false,
            message: '승인 처리 중 오류가 발생했습니다.',
        });
    }
});

/**
 * DELETE /api/admin/members/:id/reject
 * 회원 가입 거부 (삭제)
 */
router.delete('/members/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM users WHERE id = $1 AND status = $2', [
            id,
            'pending',
        ]);
        res.json({ success: true, message: '가입이 거부되었습니다.' });
    } catch (error) {
        console.error('Admin reject error:', error);
        res.status(500).json({
            success: false,
            message: '거부 처리 중 오류가 발생했습니다.',
        });
    }
});

/**
 * PATCH /api/admin/members/:id/role
 * 회원 역할 변경
 */
router.patch('/members/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;

        const validRoles = ['member', 'admin'];
        if (requesterRole === 'super_admin') validRoles.push('super_admin');

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 역할입니다.',
            });
        }

        // 자기 자신 역할 변경 금지
        if (String(id) === String(requesterId)) {
            return res.status(403).json({
                success: false,
                message: '자신의 역할은 변경할 수 없습니다.',
            });
        }

        await query(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
            [role, id]
        );
        res.json({ success: true, message: '역할이 변경되었습니다.' });
    } catch (error) {
        console.error('Admin role change error:', error);
        res.status(500).json({
            success: false,
            message: '역할 변경 중 오류가 발생했습니다.',
        });
    }
});

/**
 * PATCH /api/admin/members/:id/suspend
 * 회원 정지
 */
router.patch('/members/:id/suspend', async (req, res) => {
    try {
        const { id } = req.params;
        await query(
            `UPDATE users
             SET status = 'suspended', updated_at = NOW()
             WHERE id = $1`,
            [id]
        );
        res.json({ success: true, message: '회원이 정지되었습니다.' });
    } catch (error) {
        console.error('Admin suspend error:', error);
        res.status(500).json({
            success: false,
            message: '정지 처리 중 오류가 발생했습니다.',
        });
    }
});

/**
 * PATCH /api/admin/members/:id/activate
 * 회원 복구
 */
router.patch('/members/:id/activate', async (req, res) => {
    try {
        const { id } = req.params;
        await query(
            `UPDATE users
             SET status = 'active', updated_at = NOW()
             WHERE id = $1`,
            [id]
        );
        res.json({ success: true, message: '회원이 복구되었습니다.' });
    } catch (error) {
        console.error('Admin activate error:', error);
        res.status(500).json({
            success: false,
            message: '복구 처리 중 오류가 발생했습니다.',
        });
    }
});

/**
 * GET /api/admin/posts
 * 최근 게시글 목록 (관리용)
 */
router.get('/posts', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 30;
        const result = await query(
            `SELECT p.id, p.title, p.views, p.likes_count,
                    p.comments_count, p.created_at,
                    u.name as author_name, u.email as author_email
             FROM posts p
             LEFT JOIN users u ON p.author_id = u.id
             ORDER BY p.created_at DESC
             LIMIT $1`,
            [limit]
        );
        res.json({ success: true, posts: result.rows });
    } catch (error) {
        console.error('Admin posts error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 목록 조회 중 오류가 발생했습니다.',
        });
    }
});

/**
 * DELETE /api/admin/posts/:id
 * 게시글 강제 삭제
 */
router.delete('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM posts WHERE id = $1', [id]);
        res.json({ success: true, message: '게시글이 삭제되었습니다.' });
    } catch (error) {
        console.error('Admin delete post error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 삭제 중 오류가 발생했습니다.',
        });
    }
});

/**
 * GET /api/admin/stats
 * 대시보드 통계
 */
router.get('/stats', async (req, res) => {
    try {
        const [members, pending, posts, notices] = await Promise.all([
            query("SELECT COUNT(*) FROM users WHERE status = 'active'"),
            query("SELECT COUNT(*) FROM users WHERE status = 'pending'"),
            query('SELECT COUNT(*) FROM posts'),
            query('SELECT COUNT(*) FROM notices'),
        ]);

        res.json({
            success: true,
            stats: {
                totalMembers: parseInt(members.rows[0].count),
                pendingMembers: parseInt(pending.rows[0].count),
                totalPosts: parseInt(posts.rows[0].count),
                totalNotices: parseInt(notices.rows[0].count),
            },
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: '통계 조회 중 오류가 발생했습니다.',
        });
    }
});

module.exports = router;
