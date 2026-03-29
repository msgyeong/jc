const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, addOrgFilter } = require('../middleware/auth');
const { sendPushToAll, sendPushToUser } = require('../utils/pushSender');
const commentService = require('../services/comment-service');
const attendanceService = require('../services/attendance-service');

// 일정 댓글 config
const scheduleCommentConfig = {
    commentTable: 'comments',
    fkColumn: 'schedule_id',
    parentTable: 'schedules',
    updateCommentCount: false,   // 일정은 comments_count 미갱신
    commentLikeTable: 'comment_likes',
    push: {
        getAuthorQuery: 'SELECT created_by, title FROM schedules WHERE id = $1',
        authorIdColumn: 'created_by',
        urlTemplate: '/#schedules/{id}',
        dataKey: 'schedule_id'
    }
};

// 일정 참석 config
const scheduleAttendanceConfig = {
    table: 'schedule_attendance',
    fkColumn: 'schedule_id',
    allowedStatuses: ['attending', 'not_attending'],
    includeNoResponse: true,
    parentTable: 'schedules'
};

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
                s.views,
                s.created_at, s.updated_at,
                s.created_by as author_id, u.name as author_name, u.profile_image as author_image
            FROM schedules s
            LEFT JOIN users u ON s.created_by = u.id
        `;

        const conditions = ['s.deleted_at IS NULL'];
        const params = [];

        // 멀티테넌트 org_id 필터
        addOrgFilter(conditions, params, req, 's');

        // 월별 조회 (캘린더용)
        if (year && month) {
            params.push(year, month);
            conditions.push(`EXTRACT(YEAR FROM s.start_date) = $${params.length - 1}`);
            conditions.push(`EXTRACT(MONTH FROM s.start_date) = $${params.length}`);
        } else if (upcoming) {
            conditions.push('s.start_date >= CURRENT_DATE');
        }

        sqlQuery += ' WHERE ' + conditions.join(' AND ');

        sqlQuery += ' ORDER BY s.start_date ASC';

        const result = await query(sqlQuery, params);

        // 생일 회원 조회 (월별 캘린더 요청 시)
        let birthdays = [];
        if (year && month) {
            try {
                const bdayResult = await query(
                    `SELECT id, name, birth_date, profile_image
                     FROM users
                     WHERE EXTRACT(MONTH FROM birth_date) = $1
                       AND status = 'active'
                       AND birth_date IS NOT NULL
                     ORDER BY EXTRACT(DAY FROM birth_date)`,
                    [month]
                );
                birthdays = bdayResult.rows.map(u => ({
                    id: 'bday-' + u.id,
                    title: u.name + '님 생일 🎂',
                    start_date: year + '-' + String(month).padStart(2, '0') + '-' + String(new Date(u.birth_date).getDate()).padStart(2, '0') + 'T00:00:00',
                    category: 'birthday',
                    is_birthday: true,
                    member_id: u.id,
                    member_name: u.name,
                    member_image: u.profile_image
                }));
            } catch (e) { console.error('Birthday query error:', e.message); }
        }

        res.json({
            success: true,
            schedules: result.rows,
            birthdays: birthdays,
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
        await query('UPDATE schedules SET views = COALESCE(views, 0) + 1 WHERE id = $1', [id]);

        // 일정 조회 (linked_post_id + views 포함)
        const result = await query(
            `SELECT
                s.id, s.title, s.start_date, s.end_date,
                s.location, s.description, s.category,
                s.linked_post_id, s.views, s.org_id,
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

        // 멀티테넌트: org_id 소속 확인 (super_admin 제외)
        if (req.user.role !== 'super_admin' && req.user.orgId && schedule.org_id && schedule.org_id !== req.user.orgId) {
            return res.status(403).json({
                success: false,
                message: '다른 조직의 일정에 접근할 수 없습니다.'
            });
        }

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
            } catch (catchErr) { console.error("[silent-catch]", catchErr.message); }
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

        // 종료일이 시작일보다 빠른 경우 차단
        if (end_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({
                success: false,
                message: '종료일은 시작일보다 빠를 수 없습니다.'
            });
        }

        // 일정 생성
        const result = await query(
            `INSERT INTO schedules (created_by, title, start_date, end_date, location, description, category, org_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
             RETURNING id`,
            [authorId, title, start_date, end_date, location, description, category, req.user.orgId || null]
        );

        const newScheduleId = result.rows[0].id;

        // N-02 일정 등록 알림
        const startObj = new Date(start_date);
        const dateStr = startObj.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
        const timeStr = startObj.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
        sendPushToAll({
            title: '\uD83D\uDCC5 \uC0C8 \uC77C\uC815 \uB4F1\uB85D',
            body: `${title} \u2014 ${dateStr} ${timeStr}${location ? ' ' + location : ''}`.substring(0, 80),
            data: { url: `/#schedules/${newScheduleId}`, schedule_id: newScheduleId },
            type: 'N-02'
        }, authorId).catch(e => console.error('[Push] N-02 발송 에러:', e.message));

        res.status(201).json({
            success: true,
            message: '일정이 등록되었습니다.',
            scheduleId: newScheduleId
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
        const isAuthor = Number(scheduleResult.rows[0].created_by) === Number(userId);
        const isAdmin = ['super_admin', 'admin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '일정 수정 권한이 없습니다.'
            });
        }

        // 종료일이 시작일보다 빠른 경우 차단
        if (end_date && start_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({
                success: false,
                message: '종료일은 시작일보다 빠를 수 없습니다.'
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

        // N-04 일정 변경 알림
        sendPushToAll({
            title: '\uD83D\uDCC5 \uC77C\uC815 \uBCC0\uACBD',
            body: `${title} \uC77C\uC815\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4`.substring(0, 80),
            data: { url: `/#schedules/${id}`, schedule_id: parseInt(id) },
            type: 'N-04'
        }, userId).catch(e => console.error('[Push] N-04 발송 에러:', e.message));

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
        const isAuthor = Number(scheduleResult.rows[0].created_by) === Number(userId);
        const isAdmin = ['super_admin', 'admin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '일정 삭제 권한이 없습니다.'
            });
        }

        // 일정 삭제
        await query('UPDATE schedules SET deleted_at = NOW() WHERE id = $1', [id]);

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
 * GET /api/schedules/:id/comments — comment-service 위임
 */
router.get('/:id/comments', authenticate, async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        const userId = req.user.userId;
        const data = await commentService.listComments(scheduleCommentConfig, scheduleId, userId);
        res.json({ success: true, data: { items: data.items, total: data.total } });
    } catch (error) {
        console.error('Get schedule comments error:', error);
        res.status(500).json({ success: false, message: '댓글 목록 조회에 실패했습니다.' });
    }
});

/**
 * POST /api/schedules/:id/comments — comment-service 위임
 */
router.post('/:id/comments', authenticate, async (req, res) => {
    try {
        const { id: scheduleId } = req.params;
        const { content, parent_id } = req.body || {};
        const userId = req.user.userId;

        const result = await commentService.createComment(scheduleCommentConfig, scheduleId, userId, content, parent_id);
        if (result.error) return res.status(result.status).json({ success: false, message: result.message });

        res.status(201).json({ success: true, data: result.comment });
    } catch (error) {
        console.error('Create schedule comment error:', error);
        res.status(500).json({ success: false, message: '댓글 등록에 실패했습니다.' });
    }
});

/**
 * DELETE /api/schedules/:id/comments/:commentId — comment-service 위임
 */
router.delete('/:id/comments/:commentId', authenticate, async (req, res) => {
    try {
        const { id: scheduleId, commentId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const result = await commentService.deleteComment(scheduleCommentConfig, commentId, scheduleId, userId, userRole);
        if (result.error) return res.status(result.status).json({ success: false, message: result.message });

        res.json({ success: true, message: '댓글이 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete schedule comment error:', error);
        res.status(500).json({ success: false, message: '댓글 삭제에 실패했습니다.' });
    }
});

/**
 * POST /api/schedules/:id/comments/:commentId/like — comment-service 위임
 */
router.post('/:id/comments/:commentId/like', authenticate, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;
        const result = await commentService.toggleCommentLike(scheduleCommentConfig, commentId, userId);
        if (result.error) return res.status(result.status).json({ success: false, message: result.message });
        res.json({ success: true, liked: result.liked, likes_count: result.likes_count });
    } catch (err) {
        console.error('Schedule comment like error:', err);
        res.status(500).json({ success: false, message: '좋아요 처리 실패' });
    }
});

// ==================== 참석 여부 — attendance-service 위임 ====================

/** POST /api/schedules/:id/attendance */
router.post('/:id/attendance', authenticate, async (req, res) => {
    try {
        const result = await attendanceService.setAttendance(scheduleAttendanceConfig, req.params.id, req.user.userId, req.body.status);
        if (result.error) return res.status(result.status).json({ success: false, message: result.message });
        res.json({ success: true, data: result.data });
    } catch (error) {
        console.error('Set attendance error:', error);
        res.status(500).json({ success: false, message: '참석 여부 등록 중 오류가 발생했습니다.' });
    }
});

/** DELETE /api/schedules/:id/attendance */
router.delete('/:id/attendance', authenticate, async (req, res) => {
    try {
        await attendanceService.deleteAttendance(scheduleAttendanceConfig, req.params.id, req.user.userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete attendance error:', error);
        res.status(500).json({ success: false, message: '참석 여부 취소 중 오류가 발생했습니다.' });
    }
});

/** GET /api/schedules/:id/attendance/summary */
router.get('/:id/attendance/summary', authenticate, async (req, res) => {
    try {
        const data = await attendanceService.getSummary(scheduleAttendanceConfig, req.params.id, req.user.userId);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({ success: false, message: '참석 현황 조회 중 오류가 발생했습니다.' });
    }
});

/** GET /api/schedules/:id/attendance/details */
router.get('/:id/attendance/details', authenticate, async (req, res) => {
    try {
        const data = await attendanceService.getDetails(scheduleAttendanceConfig, req.params.id, req.user.userId, req.user.role);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Get attendance details error:', error);
        res.status(500).json({ success: false, message: '참석 명단 조회 중 오류가 발생했습니다.' });
    }
});

/** GET /api/schedules/:id/attendance/export — CSV 내보내기 */
router.get('/:id/attendance/export', authenticate, async (req, res) => {
    try {
        const scheduleId = req.params.id;
        const schedResult = await query('SELECT title FROM schedules WHERE id = $1', [scheduleId]);
        if (schedResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '일정을 찾을 수 없습니다.' });
        }
        const result = await attendanceService.exportCsv(scheduleAttendanceConfig, scheduleId, req.user.userId, req.user.role, schedResult.rows[0].title);
        if (result.error) return res.status(result.status).json({ success: false, message: result.message });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.csv);
    } catch (error) {
        console.error('Export attendance error:', error);
        res.status(500).json({ success: false, message: 'CSV 내보내기 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
