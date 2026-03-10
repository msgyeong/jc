const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/schedules
 * 일정 목록 조회
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const upcoming = req.query.upcoming === 'true';
        const year = parseInt(req.query.year);
        const month = parseInt(req.query.month);

        let sqlQuery = `
            SELECT
                s.id, s.title, s.start_date, s.end_date,
                s.location, s.description, s.category,
                s.created_at, s.updated_at,
                s.created_by as author_id, u.name as author_name, u.profile_image as author_image
            FROM schedules s
            LEFT JOIN users u ON s.created_by = u.id
        `;

        const conditions = [];
        const params = [];

        // 월별 조회 (캘린더용)
        if (year && month) {
            params.push(year, month);
            conditions.push(`EXTRACT(YEAR FROM s.start_date) = $${params.length - 1}`);
            conditions.push(`EXTRACT(MONTH FROM s.start_date) = $${params.length}`);
        } else if (upcoming) {
            conditions.push('s.start_date >= CURRENT_DATE');
        }

        if (conditions.length > 0) {
            sqlQuery += ' WHERE ' + conditions.join(' AND ');
        }

        sqlQuery += ' ORDER BY s.start_date ASC';

        const result = await query(sqlQuery, params);

        res.json({
            success: true,
            schedules: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Get schedules error:', error);
        res.status(500).json({
            success: false,
            message: '일정 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/schedules/:id
 * 일정 상세 조회
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // 일정 조회 (linked_post_id 포함)
        const result = await query(
            `SELECT
                s.id, s.title, s.start_date, s.end_date,
                s.location, s.description, s.category,
                s.linked_post_id,
                s.created_at, s.updated_at,
                s.created_by as author_id, u.name as author_name, u.profile_image as author_image
             FROM schedules s
             LEFT JOIN users u ON s.created_by = u.id
             WHERE s.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '일정을 찾을 수 없습니다.'
            });
        }

        const schedule = result.rows[0];

        // 연결된 공지 정보 조회
        if (schedule.linked_post_id) {
            try {
                const postResult = await query(
                    `SELECT p.id, p.title, p.created_at, u.name as author_name
                     FROM posts p LEFT JOIN users u ON p.author_id = u.id
                     WHERE p.id = $1`,
                    [schedule.linked_post_id]
                );
                schedule.linked_post = postResult.rows[0] || null;
            } catch (_) {
                schedule.linked_post = null;
            }
        }

        res.json({
            success: true,
            schedule
        });
    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({
            success: false,
            message: '일정 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/schedules
 * 일정 등록 (권한 필요)
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, start_date, end_date, location, description, category } = req.body;
        const authorId = req.user.userId;

        // 일정 등록 권한 확인
        const userResult = await query(
            'SELECT role FROM users WHERE id = $1',
            [authorId]
        );

        const userRole = userResult.rows[0].role;
        
        // super_admin, admin만 작성 가능
        if (!['super_admin', 'admin'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: '일정 등록 권한이 없습니다.'
            });
        }

        // 유효성 검증
        if (!title || !start_date) {
            return res.status(400).json({
                success: false,
                message: '제목과 날짜를 입력해주세요.'
            });
        }

        // 일정 생성
        const result = await query(
            `INSERT INTO schedules (created_by, title, start_date, end_date, location, description, category, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING id`,
            [authorId, title, start_date, end_date, location, description, category]
        );

        res.status(201).json({
            success: true,
            message: '일정이 등록되었습니다.',
            scheduleId: result.rows[0].id
        });
    } catch (error) {
        console.error('Create schedule error:', error);
        res.status(500).json({
            success: false,
            message: '일정 등록 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/schedules/:id
 * 일정 수정
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, start_date, end_date, location, description, category } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // 일정 소유자 확인
        const scheduleResult = await query(
            'SELECT created_by FROM schedules WHERE id = $1',
            [id]
        );

        if (scheduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '일정을 찾을 수 없습니다.'
            });
        }

        // 작성자 본인이거나 관리자인 경우만 수정 가능
        const isAuthor = scheduleResult.rows[0].created_by === userId;
        const isAdmin = ['super_admin', 'admin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '일정 수정 권한이 없습니다.'
            });
        }

        // 일정 수정
        await query(
            `UPDATE schedules 
             SET title = $1, start_date = $2, end_date = $3, 
                 location = $4, description = $5, category = $6, updated_at = NOW()
             WHERE id = $7`,
            [title, start_date, end_date, location, description, category, id]
        );

        res.json({
            success: true,
            message: '일정이 수정되었습니다.'
        });
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({
            success: false,
            message: '일정 수정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * DELETE /api/schedules/:id
 * 일정 삭제
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // 일정 소유자 확인
        const scheduleResult = await query(
            'SELECT created_by FROM schedules WHERE id = $1',
            [id]
        );

        if (scheduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '일정을 찾을 수 없습니다.'
            });
        }

        // 작성자 본인이거나 관리자인 경우만 삭제 가능
        const isAuthor = scheduleResult.rows[0].created_by === userId;
        const isAdmin = ['super_admin', 'admin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '일정 삭제 권한이 없습니다.'
            });
        }

        // 일정 삭제
        await query('DELETE FROM schedules WHERE id = $1', [id]);

        res.json({
            success: true,
            message: '일정이 삭제되었습니다.'
        });
    } catch (error) {
        console.error('Delete schedule error:', error);
        res.status(500).json({
            success: false,
            message: '일정 삭제 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/schedules/:id/comments
 * 일정 댓글 목록 조회 (대댓글 포함)
 */
router.get('/:id/comments', authenticate, async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        const userId = req.user.userId;

        const result = await query(
            `SELECT c.id, c.author_id, c.content, c.parent_id, c.is_deleted, c.created_at,
                    u.name as author_name, u.profile_image as author_image, u.position as author_position
             FROM comments c
             LEFT JOIN users u ON c.author_id = u.id
             WHERE c.schedule_id = $1 AND (c.is_deleted = false OR c.is_deleted IS NULL)
             ORDER BY c.created_at ASC`,
            [scheduleId]
        );

        // 대댓글 구조화
        const topLevel = [];
        const replyMap = {};

        for (const row of result.rows) {
            row.author = { id: row.author_id, name: row.author_name, position: row.author_position, profile_image: row.author_image };
            row.replies = [];
            if (!row.parent_id) {
                topLevel.push(row);
                replyMap[row.id] = row;
            }
        }

        for (const row of result.rows) {
            if (row.parent_id && replyMap[row.parent_id]) {
                replyMap[row.parent_id].replies.push(row);
            }
        }

        res.json({
            success: true,
            data: {
                items: topLevel,
                total: result.rows.length
            }
        });
    } catch (error) {
        console.error('Get schedule comments error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 목록 조회에 실패했습니다.'
        });
    }
});

/**
 * POST /api/schedules/:id/comments
 * 일정 댓글 작성
 */
router.post('/:id/comments', authenticate, async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        const { content, parent_id } = req.body || {};
        const authorId = req.user.userId;

        if (!content || !String(content).trim()) {
            return res.status(400).json({
                success: false,
                message: '댓글 내용을 입력해주세요.'
            });
        }

        // 일정 존재 확인
        const scheduleResult = await query('SELECT id FROM schedules WHERE id = $1', [scheduleId]);
        if (scheduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '일정을 찾을 수 없습니다.'
            });
        }

        // 대댓글인 경우 부모 댓글 확인
        if (parent_id) {
            const parentResult = await query(
                'SELECT id, parent_id FROM comments WHERE id = $1 AND schedule_id = $2',
                [parent_id, scheduleId]
            );
            if (parentResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '부모 댓글을 찾을 수 없습니다.'
                });
            }
            // 대대댓글 방지
            if (parentResult.rows[0].parent_id) {
                return res.status(400).json({
                    success: false,
                    message: '대댓글에는 답글을 달 수 없습니다.'
                });
            }
        }

        const result = await query(
            `INSERT INTO comments (author_id, schedule_id, content, parent_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING id, content, created_at`,
            [authorId, scheduleId, String(content).trim(), parent_id || null]
        );

        // 작성자 정보 조회
        const userResult = await query(
            'SELECT name, position, profile_image FROM users WHERE id = $1',
            [authorId]
        );

        const comment = result.rows[0];
        comment.author = {
            id: authorId,
            name: userResult.rows[0]?.name,
            position: userResult.rows[0]?.position
        };
        comment.parent_id = parent_id || null;

        res.status(201).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.error('Create schedule comment error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 등록에 실패했습니다.'
        });
    }
});

/**
 * DELETE /api/schedules/:id/comments/:commentId
 * 일정 댓글 삭제 (soft delete)
 */
router.delete('/:id/comments/:commentId', authenticate, async (req, res) => {
    try {
        const { id: scheduleId, commentId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const commentResult = await query(
            'SELECT author_id FROM comments WHERE id = $1 AND schedule_id = $2',
            [commentId, scheduleId]
        );
        if (commentResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' });
        }

        const isAuthor = commentResult.rows[0].author_id === userId;
        const isAdmin = userRole && ['super_admin', 'admin'].includes(userRole);
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ success: false, message: '댓글 삭제 권한이 없습니다.' });
        }

        await query('UPDATE comments SET is_deleted = true, updated_at = NOW() WHERE id = $1', [commentId]);

        res.json({ success: true, message: '댓글이 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete schedule comment error:', error);
        res.status(500).json({ success: false, message: '댓글 삭제에 실패했습니다.' });
    }
});

module.exports = router;
