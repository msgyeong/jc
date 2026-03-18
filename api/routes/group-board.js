const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * 그룹 멤버십 확인 미들웨어
 * orgchart_members 테이블에서 user_id로 그룹 소속 여부 확인
 */
async function verifyGroupMember(userId, groupId) {
    const result = await query(
        'SELECT id FROM orgchart_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
    );
    return result.rows.length > 0;
}

function isManagerRole(role) {
    return ['super_admin', 'admin', 'local_admin'].includes(role);
}

// ========== 그룹 게시글 ==========

/**
 * GET /api/group-board/:groupId/posts
 * 그룹 게시글 목록 (멤버만 접근 가능)
 */
router.get('/:groupId/posts', authenticate, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const userId = req.user.userId;

        // 멤버십 확인
        const isMember = await verifyGroupMember(userId, groupId);
        if (!isMember && !isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '이 그룹의 멤버만 접근할 수 있습니다.' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const offset = (page - 1) * limit;

        // 게시글 목록 + 작성자 정보 + 읽음 여부
        const result = await query(
            `SELECT gp.*, u.name as author_name, u.profile_image as author_image,
                    u.position as author_position,
                    CASE WHEN gpr.id IS NOT NULL THEN true ELSE false END as is_read
             FROM group_posts gp
             JOIN users u ON gp.author_id = u.id
             LEFT JOIN group_post_reads gpr ON gpr.post_id = gp.id AND gpr.user_id = $1
             WHERE gp.group_id = $2
             ORDER BY gp.is_pinned DESC, gp.created_at DESC
             LIMIT $3 OFFSET $4`,
            [userId, groupId, limit, offset]
        );

        const countResult = await query(
            'SELECT COUNT(*) as total FROM group_posts WHERE group_id = $1',
            [groupId]
        );

        res.json({
            success: true,
            posts: result.rows,
            total: parseInt(countResult.rows[0].total),
            page,
            totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        });
    } catch (error) {
        console.error('Group posts list error:', error);
        res.status(500).json({ success: false, error: '게시글을 불러올 수 없습니다.' });
    }
});

/**
 * GET /api/group-board/:groupId/posts/:postId
 * 그룹 게시글 상세 (멤버만)
 */
router.get('/:groupId/posts/:postId', authenticate, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const postId = parseInt(req.params.postId);
        const userId = req.user.userId;

        const isMember = await verifyGroupMember(userId, groupId);
        if (!isMember && !isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '이 그룹의 멤버만 접근할 수 있습니다.' });
        }

        // 조회수 증가
        await query('UPDATE group_posts SET views = views + 1 WHERE id = $1 AND group_id = $2', [postId, groupId]);

        // 읽음 처리
        await query(
            'INSERT INTO group_post_reads (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING',
            [postId, userId]
        );

        // 게시글 상세
        const result = await query(
            `SELECT gp.*, u.name as author_name, u.profile_image as author_image,
                    u.position as author_position
             FROM group_posts gp
             JOIN users u ON gp.author_id = u.id
             WHERE gp.id = $1 AND gp.group_id = $2`,
            [postId, groupId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
        }

        // 댓글 조회
        const comments = await query(
            `SELECT gc.*, u.name as author_name, u.profile_image as author_image
             FROM group_post_comments gc
             JOIN users u ON gc.author_id = u.id
             WHERE gc.post_id = $1 AND gc.is_deleted = false
             ORDER BY gc.created_at ASC`,
            [postId]
        );

        res.json({
            success: true,
            post: result.rows[0],
            comments: comments.rows
        });
    } catch (error) {
        console.error('Group post detail error:', error);
        res.status(500).json({ success: false, error: '게시글을 불러올 수 없습니다.' });
    }
});

/**
 * POST /api/group-board/:groupId/posts
 * 그룹 게시글 작성 (멤버만)
 */
router.post('/:groupId/posts', authenticate, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const userId = req.user.userId;

        const isMember = await verifyGroupMember(userId, groupId);
        if (!isMember && !isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '이 그룹의 멤버만 게시글을 작성할 수 있습니다.' });
        }

        const { title, content, images, is_pinned } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: '제목을 입력하세요.' });
        }

        const result = await query(
            `INSERT INTO group_posts (group_id, author_id, title, content, images, is_pinned)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [groupId, userId, title.trim(), content || '', images || null, is_pinned || false]
        );

        res.json({ success: true, post: result.rows[0] });
    } catch (error) {
        console.error('Group post create error:', error);
        res.status(500).json({ success: false, error: '게시글 작성에 실패했습니다.' });
    }
});

/**
 * PUT /api/group-board/:groupId/posts/:postId
 * 그룹 게시글 수정 (작성자 또는 관리자)
 */
router.put('/:groupId/posts/:postId', authenticate, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const postId = parseInt(req.params.postId);
        const userId = req.user.userId;

        // 권한 확인: 작성자 또는 관리자
        const post = await query('SELECT author_id FROM group_posts WHERE id = $1 AND group_id = $2', [postId, groupId]);
        if (post.rows.length === 0) {
            return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
        }
        if (post.rows[0].author_id !== userId && !isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '수정 권한이 없습니다.' });
        }

        const { title, content, images, is_pinned } = req.body;
        await query(
            `UPDATE group_posts SET title = COALESCE($1, title), content = COALESCE($2, content),
             images = COALESCE($3, images), is_pinned = COALESCE($4, is_pinned), updated_at = NOW()
             WHERE id = $5 AND group_id = $6`,
            [title, content, images, is_pinned, postId, groupId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Group post update error:', error);
        res.status(500).json({ success: false, error: '게시글 수정에 실패했습니다.' });
    }
});

/**
 * DELETE /api/group-board/:groupId/posts/:postId
 * 그룹 게시글 삭제 (작성자 또는 관리자)
 */
router.delete('/:groupId/posts/:postId', authenticate, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const postId = parseInt(req.params.postId);
        const userId = req.user.userId;

        const post = await query('SELECT author_id FROM group_posts WHERE id = $1 AND group_id = $2', [postId, groupId]);
        if (post.rows.length === 0) {
            return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
        }
        if (post.rows[0].author_id !== userId && !isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '삭제 권한이 없습니다.' });
        }

        await query('DELETE FROM group_posts WHERE id = $1', [postId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Group post delete error:', error);
        res.status(500).json({ success: false, error: '게시글 삭제에 실패했습니다.' });
    }
});

/**
 * POST /api/group-board/:groupId/posts/:postId/comments
 * 그룹 게시글 댓글 작성 (멤버만)
 */
router.post('/:groupId/posts/:postId/comments', authenticate, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const postId = parseInt(req.params.postId);
        const userId = req.user.userId;

        const isMember = await verifyGroupMember(userId, groupId);
        if (!isMember && !isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '이 그룹의 멤버만 댓글을 작성할 수 있습니다.' });
        }

        const { content, parent_id } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, error: '댓글 내용을 입력하세요.' });
        }

        // 대대댓글 방지
        if (parent_id) {
            const parent = await query('SELECT parent_id FROM group_post_comments WHERE id = $1', [parent_id]);
            if (parent.rows.length > 0 && parent.rows[0].parent_id) {
                return res.status(400).json({ success: false, error: '대대댓글은 지원하지 않습니다.' });
            }
        }

        const result = await query(
            `INSERT INTO group_post_comments (post_id, author_id, content, parent_id)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [postId, userId, content.trim(), parent_id || null]
        );

        // 댓글 수 업데이트
        await query(
            'UPDATE group_posts SET comments_count = (SELECT COUNT(*) FROM group_post_comments WHERE post_id = $1 AND is_deleted = false) WHERE id = $1',
            [postId]
        );

        res.json({ success: true, comment: result.rows[0] });
    } catch (error) {
        console.error('Group post comment error:', error);
        res.status(500).json({ success: false, error: '댓글 작성에 실패했습니다.' });
    }
});

/**
 * DELETE /api/group-board/:groupId/posts/:postId/comments/:commentId
 * 댓글 삭제 (작성자 또는 관리자)
 */
router.delete('/:groupId/posts/:postId/comments/:commentId', authenticate, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const commentId = parseInt(req.params.commentId);
        const userId = req.user.userId;

        const comment = await query('SELECT author_id FROM group_post_comments WHERE id = $1', [commentId]);
        if (comment.rows.length === 0) {
            return res.status(404).json({ success: false, error: '댓글을 찾을 수 없습니다.' });
        }
        if (comment.rows[0].author_id !== userId && !isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '삭제 권한이 없습니다.' });
        }

        await query('UPDATE group_post_comments SET is_deleted = true WHERE id = $1', [commentId]);
        await query(
            'UPDATE group_posts SET comments_count = (SELECT COUNT(*) FROM group_post_comments WHERE post_id = $1 AND is_deleted = false) WHERE id = $1',
            [postId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Group comment delete error:', error);
        res.status(500).json({ success: false, error: '댓글 삭제에 실패했습니다.' });
    }
});

// ========== 그룹 일정 ==========

/**
 * GET /api/group-board/:groupId/schedules
 * 그룹 일정 목록 (멤버만)
 */
router.get('/:groupId/schedules', authenticate, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const userId = req.user.userId;

        const isMember = await verifyGroupMember(userId, groupId);
        if (!isMember && !isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '이 그룹의 멤버만 접근할 수 있습니다.' });
        }

        const { year, month } = req.query;
        let whereClause = 'WHERE gs.group_id = $1';
        const params = [groupId];

        if (year && month) {
            whereClause += ` AND EXTRACT(YEAR FROM gs.start_date) = $2 AND EXTRACT(MONTH FROM gs.start_date) = $3`;
            params.push(parseInt(year), parseInt(month));
        }

        const result = await query(
            `SELECT gs.*, u.name as creator_name
             FROM group_schedules gs
             JOIN users u ON gs.created_by = u.id
             ${whereClause}
             ORDER BY gs.start_date ASC`,
            params
        );

        res.json({ success: true, schedules: result.rows });
    } catch (error) {
        console.error('Group schedules list error:', error);
        res.status(500).json({ success: false, error: '일정을 불러올 수 없습니다.' });
    }
});

/**
 * POST /api/group-board/:groupId/schedules
 * 그룹 일정 생성 (멤버만)
 */
router.post('/:groupId/schedules', authenticate, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const userId = req.user.userId;

        const isMember = await verifyGroupMember(userId, groupId);
        if (!isMember && !isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '이 그룹의 멤버만 일정을 생성할 수 있습니다.' });
        }

        const { title, description, location, start_date, end_date, category } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: '제목을 입력하세요.' });
        }
        if (!start_date) {
            return res.status(400).json({ success: false, error: '시작일을 선택하세요.' });
        }

        const result = await query(
            `INSERT INTO group_schedules (group_id, created_by, title, description, location, start_date, end_date, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [groupId, userId, title.trim(), description || null, location || null, start_date, end_date || null, category || 'meeting']
        );

        res.json({ success: true, schedule: result.rows[0] });
    } catch (error) {
        console.error('Group schedule create error:', error);
        res.status(500).json({ success: false, error: '일정 생성에 실패했습니다.' });
    }
});

/**
 * PUT /api/group-board/:groupId/schedules/:scheduleId
 * 그룹 일정 수정 (작성자 또는 관리자)
 */
router.put('/:groupId/schedules/:scheduleId', authenticate, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const scheduleId = parseInt(req.params.scheduleId);
        const userId = req.user.userId;

        const schedule = await query('SELECT created_by FROM group_schedules WHERE id = $1 AND group_id = $2', [scheduleId, groupId]);
        if (schedule.rows.length === 0) {
            return res.status(404).json({ success: false, error: '일정을 찾을 수 없습니다.' });
        }
        if (schedule.rows[0].created_by !== userId && !isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '수정 권한이 없습니다.' });
        }

        const { title, description, location, start_date, end_date, category } = req.body;
        await query(
            `UPDATE group_schedules SET title = COALESCE($1, title), description = COALESCE($2, description),
             location = COALESCE($3, location), start_date = COALESCE($4, start_date),
             end_date = COALESCE($5, end_date), category = COALESCE($6, category), updated_at = NOW()
             WHERE id = $7 AND group_id = $8`,
            [title, description, location, start_date, end_date, category, scheduleId, groupId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Group schedule update error:', error);
        res.status(500).json({ success: false, error: '일정 수정에 실패했습니다.' });
    }
});

/**
 * DELETE /api/group-board/:groupId/schedules/:scheduleId
 * 그룹 일정 삭제 (작성자 또는 관리자)
 */
router.delete('/:groupId/schedules/:scheduleId', authenticate, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const scheduleId = parseInt(req.params.scheduleId);
        const userId = req.user.userId;

        const schedule = await query('SELECT created_by FROM group_schedules WHERE id = $1 AND group_id = $2', [scheduleId, groupId]);
        if (schedule.rows.length === 0) {
            return res.status(404).json({ success: false, error: '일정을 찾을 수 없습니다.' });
        }
        if (schedule.rows[0].created_by !== userId && !isManagerRole(req.user.role)) {
            return res.status(403).json({ success: false, error: '삭제 권한이 없습니다.' });
        }

        await query('DELETE FROM group_schedules WHERE id = $1', [scheduleId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Group schedule delete error:', error);
        res.status(500).json({ success: false, error: '일정 삭제에 실패했습니다.' });
    }
});

/**
 * GET /api/group-board/my-schedules
 * 내가 속한 모든 그룹의 일정 조회 (일정 탭 통합용)
 * 핵심: 오직 내가 속한 그룹의 일정만 반환
 */
router.get('/my-schedules/all', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { year, month } = req.query;

        let dateFilter = '';
        const params = [userId];

        if (year && month) {
            dateFilter = 'AND EXTRACT(YEAR FROM gs.start_date) = $2 AND EXTRACT(MONTH FROM gs.start_date) = $3';
            params.push(parseInt(year), parseInt(month));
        }

        const result = await query(
            `SELECT gs.*, og.name as group_name, u.name as creator_name
             FROM group_schedules gs
             JOIN orgchart_groups og ON gs.group_id = og.id
             JOIN users u ON gs.created_by = u.id
             WHERE gs.group_id IN (
                 SELECT om.group_id FROM orgchart_members om WHERE om.user_id = $1
             )
             ${dateFilter}
             ORDER BY gs.start_date ASC`,
            params
        );

        res.json({ success: true, schedules: result.rows });
    } catch (error) {
        console.error('My group schedules error:', error);
        res.status(500).json({ success: false, error: '그룹 일정을 불러올 수 없습니다.' });
    }
});

/**
 * GET /api/group-board/my-groups
 * 내가 속한 조직도 그룹 목록 (게시판 접근용)
 */
router.get('/my-groups/list', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await query(
            `SELECT og.id, og.name, og.sort_order,
                    (SELECT COUNT(*) FROM orgchart_members WHERE group_id = og.id) as member_count,
                    (SELECT COUNT(*) FROM group_posts WHERE group_id = og.id) as post_count,
                    (SELECT COUNT(*) FROM group_posts gp
                     WHERE gp.group_id = og.id
                     AND NOT EXISTS (SELECT 1 FROM group_post_reads gpr WHERE gpr.post_id = gp.id AND gpr.user_id = $1)
                    ) as unread_count
             FROM orgchart_groups og
             WHERE og.id IN (SELECT om.group_id FROM orgchart_members om WHERE om.user_id = $1)
             ORDER BY og.sort_order, og.name`,
            [userId]
        );

        res.json({ success: true, groups: result.rows });
    } catch (error) {
        console.error('My groups list error:', error);
        res.status(500).json({ success: false, error: '그룹 목록을 불러올 수 없습니다.' });
    }
});

module.exports = router;
