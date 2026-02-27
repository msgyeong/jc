const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * GET /api/notices
 * 공지사항 목록 조회 (고정 공지 우선)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // 전체 공지사항 수
        const countResult = await query(
            'SELECT COUNT(*) FROM notices'
        );
        const total = parseInt(countResult.rows[0].count);

        // 공지사항 목록 (고정 공지 우선, 작성자 정보 포함)
        const result = await query(
            `SELECT 
                n.id, n.title, n.content, n.is_pinned,
                n.has_attendance, n.views,
                n.created_at, n.updated_at,
                u.id as author_id, u.name as author_name, u.profile_image as author_image
             FROM notices n
             LEFT JOIN users u ON n.author_id = u.id
             ORDER BY n.is_pinned DESC, n.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            notices: result.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get notices error:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/notices/:id
 * 공지사항 상세 조회
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // 조회수 증가
        await query(
            'UPDATE notices SET views = views + 1 WHERE id = $1',
            [id]
        );

        // 공지사항 조회
        const result = await query(
            `SELECT 
                n.id, n.title, n.content, n.is_pinned,
                n.has_attendance, n.views,
                n.created_at, n.updated_at,
                u.id as author_id, u.name as author_name, u.profile_image as author_image
             FROM notices n
             LEFT JOIN users u ON n.author_id = u.id
             WHERE n.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '공지사항을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            notice: result.rows[0]
        });
    } catch (error) {
        console.error('Get notice error:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/notices
 * 공지사항 작성 (권한 필요)
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, content, is_pinned, has_attendance } = req.body;
        const authorId = req.user.userId;

        // 공지사항 작성 권한 확인
        const userResult = await query(
            'SELECT role FROM users WHERE id = $1',
            [authorId]
        );

        const userRole = userResult.rows[0].role;
        
        // super_admin, admin만 작성 가능
        if (!['super_admin', 'admin'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: '공지사항 작성 권한이 없습니다.'
            });
        }

        // 유효성 검증
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: '제목과 내용을 입력해주세요.'
            });
        }

        // 공지사항 생성
        const result = await query(
            `INSERT INTO notices (author_id, title, content, is_pinned, has_attendance, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             RETURNING id`,
            [authorId, title, content, is_pinned || false, has_attendance || false]
        );

        res.status(201).json({
            success: true,
            message: '공지사항이 작성되었습니다.',
            noticeId: result.rows[0].id
        });
    } catch (error) {
        console.error('Create notice error:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 작성 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/notices/:id
 * 공지사항 수정
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, is_pinned, has_attendance } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // 공지사항 소유자 확인
        const noticeResult = await query(
            'SELECT author_id FROM notices WHERE id = $1',
            [id]
        );

        if (noticeResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '공지사항을 찾을 수 없습니다.'
            });
        }

        // 작성자 본인이거나 관리자인 경우만 수정 가능
        const isAuthor = noticeResult.rows[0].author_id === userId;
        const isAdmin = ['super_admin', 'admin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '공지사항 수정 권한이 없습니다.'
            });
        }

        // 공지사항 수정
        await query(
            `UPDATE notices 
             SET title = $1, content = $2, is_pinned = $3, has_attendance = $4, updated_at = NOW()
             WHERE id = $5`,
            [title, content, is_pinned || false, has_attendance || false, id]
        );

        res.json({
            success: true,
            message: '공지사항이 수정되었습니다.'
        });
    } catch (error) {
        console.error('Update notice error:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 수정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * DELETE /api/notices/:id
 * 공지사항 삭제
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // 공지사항 소유자 확인
        const noticeResult = await query(
            'SELECT author_id FROM notices WHERE id = $1',
            [id]
        );

        if (noticeResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '공지사항을 찾을 수 없습니다.'
            });
        }

        // 작성자 본인이거나 관리자인 경우만 삭제 가능
        const isAuthor = noticeResult.rows[0].author_id === userId;
        const isAdmin = ['super_admin', 'admin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '공지사항 삭제 권한이 없습니다.'
            });
        }

        // 공지사항 삭제
        await query('DELETE FROM notices WHERE id = $1', [id]);

        res.json({
            success: true,
            message: '공지사항이 삭제되었습니다.'
        });
    } catch (error) {
        console.error('Delete notice error:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 삭제 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/notices/:id/attendance
 * 공지 참석자 현황 조회
 */
router.get('/:id/attendance', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const rows = await query(
            `SELECT na.user_id, na.status, na.updated_at, u.name as user_name
             FROM notice_attendance na
             LEFT JOIN users u ON na.user_id = u.id
             WHERE na.notice_id = $1
             ORDER BY na.updated_at DESC`,
            [id]
        );

        const summary = { attending: 0, not_attending: 0, undecided: 0 };
        let myStatus = 'undecided';
        for (const row of rows.rows || []) {
            if (row.status in summary) summary[row.status] += 1;
            if (String(row.user_id) === String(userId)) {
                myStatus = row.status || 'undecided';
            }
        }

        return res.json({
            success: true,
            summary,
            myStatus,
            attendees: rows.rows || [],
        });
    } catch (error) {
        console.error('Get notice attendance error:', error);
        return res.status(500).json({
            success: false,
            message: '참석자 현황 조회 중 오류가 발생했습니다.',
        });
    }
});

/**
 * POST /api/notices/:id/attendance
 * 내 참석 상태 저장/변경
 */
router.post('/:id/attendance', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};
        const userId = req.user.userId;

        if (!['attending', 'not_attending', 'undecided'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 참석 상태입니다.',
            });
        }

        await query(
            `INSERT INTO notice_attendance (notice_id, user_id, status, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             ON CONFLICT (notice_id, user_id)
             DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()`,
            [id, userId, status]
        );

        return res.json({
            success: true,
            message: '참석 상태가 저장되었습니다.',
        });
    } catch (error) {
        console.error('Update notice attendance error:', error);
        return res.status(500).json({
            success: false,
            message: '참석 상태 저장 중 오류가 발생했습니다.',
        });
    }
});

module.exports = router;
