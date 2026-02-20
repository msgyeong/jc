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

        let sqlQuery = `
            SELECT 
                s.id, s.title, s.event_date, s.start_time, s.end_time,
                s.location, s.description, s.views,
                s.likes_count, s.comments_count,
                s.created_at, s.updated_at,
                u.id as author_id, u.name as author_name, u.profile_image as author_image
            FROM schedules s
            LEFT JOIN users u ON s.author_id = u.id
        `;

        const params = [];

        // 다가오는 일정만 조회 (오늘 이후)
        if (upcoming) {
            sqlQuery += ' WHERE s.event_date >= CURRENT_DATE';
        }

        sqlQuery += ' ORDER BY s.event_date ASC, s.start_time ASC';

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

        // 조회수 증가
        await query(
            'UPDATE schedules SET views = views + 1 WHERE id = $1',
            [id]
        );

        // 일정 조회
        const result = await query(
            `SELECT 
                s.id, s.title, s.event_date, s.start_time, s.end_time,
                s.location, s.description, s.views,
                s.likes_count, s.comments_count,
                s.created_at, s.updated_at,
                u.id as author_id, u.name as author_name, u.profile_image as author_image
             FROM schedules s
             LEFT JOIN users u ON s.author_id = u.id
             WHERE s.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '일정을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            schedule: result.rows[0]
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
        const { title, event_date, start_time, end_time, location, description } = req.body;
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
        if (!title || !event_date) {
            return res.status(400).json({
                success: false,
                message: '제목과 날짜를 입력해주세요.'
            });
        }

        // 일정 생성
        const result = await query(
            `INSERT INTO schedules (author_id, title, event_date, start_time, end_time, location, description, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING id`,
            [authorId, title, event_date, start_time, end_time, location, description]
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
        const { title, event_date, start_time, end_time, location, description } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // 일정 소유자 확인
        const scheduleResult = await query(
            'SELECT author_id FROM schedules WHERE id = $1',
            [id]
        );

        if (scheduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '일정을 찾을 수 없습니다.'
            });
        }

        // 작성자 본인이거나 관리자인 경우만 수정 가능
        const isAuthor = scheduleResult.rows[0].author_id === userId;
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
             SET title = $1, event_date = $2, start_time = $3, end_time = $4, 
                 location = $5, description = $6, updated_at = NOW()
             WHERE id = $7`,
            [title, event_date, start_time, end_time, location, description, id]
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
            'SELECT author_id FROM schedules WHERE id = $1',
            [id]
        );

        if (scheduleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '일정을 찾을 수 없습니다.'
            });
        }

        // 작성자 본인이거나 관리자인 경우만 삭제 가능
        const isAuthor = scheduleResult.rows[0].author_id === userId;
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

module.exports = router;
