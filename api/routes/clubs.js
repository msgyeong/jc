const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * 소모임 멤버십 확인
 */
async function verifyClubMember(userId, clubId) {
    const result = await query(
        "SELECT id, role FROM club_members WHERE club_id = $1 AND user_id = $2 AND status = 'accepted'",
        [clubId, userId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
}

function isClubAdmin(membership) {
    return membership && ['owner', 'admin'].includes(membership.role);
}

// ========== 소모임 관리 ==========

/**
 * GET /api/clubs/my-schedules/all
 * 내 소모임 전체 일정 (캘린더 통합용) — 반드시 :clubId 라우트보다 위에 선언
 */
router.get('/my-schedules/all', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { year, month } = req.query;

        let dateFilter = '';
        const params = [userId];

        if (year && month) {
            dateFilter = 'AND EXTRACT(YEAR FROM cs.start_date) = $2 AND EXTRACT(MONTH FROM cs.start_date) = $3';
            params.push(parseInt(year), parseInt(month));
        }

        const result = await query(
            `SELECT cs.*, c.name as club_name, u.name as creator_name
             FROM club_schedules cs
             JOIN clubs c ON cs.club_id = c.id
             JOIN users u ON cs.created_by = u.id
             WHERE cs.club_id IN (
                 SELECT cm.club_id FROM club_members cm WHERE cm.user_id = $1 AND cm.status = 'accepted'
             )
             ${dateFilter}
             ORDER BY cs.start_date ASC`,
            params
        );

        res.json({ success: true, schedules: result.rows });
    } catch (error) {
        console.error('My club schedules error:', error);
        res.status(500).json({ success: false, error: '소모임 일정을 불러올 수 없습니다.' });
    }
});

/**
 * GET /api/clubs
 * 내가 속한 소모임 목록 + 초대 대기중
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await query(
            `SELECT c.*, cm.role as my_role, cm.status as my_status,
                    u.name as creator_name,
                    (SELECT COUNT(*) FROM club_members WHERE club_id = c.id AND status = 'accepted') as member_count,
                    (SELECT COUNT(*) FROM club_posts WHERE club_id = c.id) as post_count,
                    (SELECT COUNT(*) FROM club_posts cp
                     WHERE cp.club_id = c.id
                     AND NOT EXISTS (SELECT 1 FROM club_post_reads cpr WHERE cpr.post_id = cp.id AND cpr.user_id = $1)
                    ) as unread_count
             FROM clubs c
             JOIN club_members cm ON cm.club_id = c.id AND cm.user_id = $1
             JOIN users u ON c.created_by = u.id
             WHERE c.is_active = true
             ORDER BY cm.status ASC, c.updated_at DESC`,
            [userId]
        );

        res.json({ success: true, clubs: result.rows });
    } catch (error) {
        console.error('Clubs list error:', error);
        res.status(500).json({ success: false, error: '소모임 목록을 불러올 수 없습니다.' });
    }
});

/**
 * POST /api/clubs
 * 소모임 생성 (모든 active 회원)
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: '소모임 이름을 입력하세요.' });
        }

        const result = await query(
            `INSERT INTO clubs (name, description, created_by) VALUES ($1, $2, $3) RETURNING *`,
            [name.trim(), description || null, userId]
        );

        // 생성자를 owner로 자동 추가
        await query(
            `INSERT INTO club_members (club_id, user_id, role, status, invited_by) VALUES ($1, $2, 'owner', 'accepted', $2)`,
            [result.rows[0].id, userId]
        );

        res.json({ success: true, club: result.rows[0] });
    } catch (error) {
        console.error('Club create error:', error);
        res.status(500).json({ success: false, error: '소모임 생성에 실패했습니다.' });
    }
});

/**
 * GET /api/clubs/:clubId
 * 소모임 상세 (멤버 목록 포함)
 */
router.get('/:clubId', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const userId = req.user.userId;

        const membership = await verifyClubMember(userId, clubId);
        if (!membership) {
            // 초대 대기 중인지 확인
            const pending = await query(
                "SELECT id FROM club_members WHERE club_id = $1 AND user_id = $2 AND status = 'pending'",
                [clubId, userId]
            );
            if (pending.rows.length === 0) {
                return res.status(403).json({ success: false, error: '소모임 멤버만 접근할 수 있습니다.' });
            }
        }

        const club = await query(
            `SELECT c.*, u.name as creator_name
             FROM clubs c JOIN users u ON c.created_by = u.id WHERE c.id = $1`,
            [clubId]
        );
        if (club.rows.length === 0) {
            return res.status(404).json({ success: false, error: '소모임을 찾을 수 없습니다.' });
        }

        const members = await query(
            `SELECT cm.*, u.name, u.profile_image, u.company, u.position,
                    o.name as org_name
             FROM club_members cm
             JOIN users u ON cm.user_id = u.id
             LEFT JOIN organizations o ON o.id = u.org_id
             WHERE cm.club_id = $1
             ORDER BY
                CASE cm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
                cm.joined_at ASC`,
            [clubId]
        );

        res.json({
            success: true,
            club: club.rows[0],
            members: members.rows,
            my_role: membership ? membership.role : 'pending'
        });
    } catch (error) {
        console.error('Club detail error:', error);
        res.status(500).json({ success: false, error: '소모임 정보를 불러올 수 없습니다.' });
    }
});

/**
 * PUT /api/clubs/:clubId
 * 소모임 수정 (owner/admin)
 */
router.put('/:clubId', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const userId = req.user.userId;
        const membership = await verifyClubMember(userId, clubId);

        if (!isClubAdmin(membership)) {
            return res.status(403).json({ success: false, error: '수정 권한이 없습니다.' });
        }

        const { name, description } = req.body;
        await query(
            `UPDATE clubs SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = NOW() WHERE id = $3`,
            [name, description, clubId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Club update error:', error);
        res.status(500).json({ success: false, error: '소모임 수정에 실패했습니다.' });
    }
});

/**
 * DELETE /api/clubs/:clubId
 * 소모임 삭제 (owner만)
 */
router.delete('/:clubId', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const userId = req.user.userId;
        const membership = await verifyClubMember(userId, clubId);

        if (!membership || membership.role !== 'owner') {
            return res.status(403).json({ success: false, error: '소모임 개설자만 삭제할 수 있습니다.' });
        }

        await query('UPDATE clubs SET is_active = false, updated_at = NOW() WHERE id = $1', [clubId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Club delete error:', error);
        res.status(500).json({ success: false, error: '소모임 삭제에 실패했습니다.' });
    }
});

// ========== 멤버 초대/관리 ==========

/**
 * POST /api/clubs/:clubId/invite
 * 멤버 초대 (타로컬 포함)
 */
router.post('/:clubId/invite', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const userId = req.user.userId;
        const membership = await verifyClubMember(userId, clubId);

        if (!membership) {
            return res.status(403).json({ success: false, error: '소모임 멤버만 초대할 수 있습니다.' });
        }

        const { user_ids } = req.body; // 배열
        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({ success: false, error: '초대할 회원을 선택하세요.' });
        }

        let invited = 0;
        for (const targetId of user_ids) {
            try {
                await query(
                    `INSERT INTO club_members (club_id, user_id, role, status, invited_by)
                     VALUES ($1, $2, 'member', 'pending', $3)
                     ON CONFLICT (club_id, user_id) DO NOTHING`,
                    [clubId, targetId, userId]
                );
                invited++;
            } catch (_) { /* 이미 멤버 */ }
        }

        res.json({ success: true, invited });
    } catch (error) {
        console.error('Club invite error:', error);
        res.status(500).json({ success: false, error: '초대에 실패했습니다.' });
    }
});

/**
 * PUT /api/clubs/:clubId/invite/:memberId
 * 초대 수락/거절
 */
router.put('/:clubId/invite/:memberId', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const memberId = parseInt(req.params.memberId);
        const userId = req.user.userId;
        const { action } = req.body; // 'accept' or 'reject'

        // 본인 초대만 처리 가능
        const invite = await query(
            "SELECT id FROM club_members WHERE id = $1 AND club_id = $2 AND user_id = $3 AND status = 'pending'",
            [memberId, clubId, userId]
        );
        if (invite.rows.length === 0) {
            return res.status(404).json({ success: false, error: '초대를 찾을 수 없습니다.' });
        }

        if (action === 'accept') {
            await query("UPDATE club_members SET status = 'accepted', joined_at = NOW() WHERE id = $1", [memberId]);
        } else {
            await query('DELETE FROM club_members WHERE id = $1', [memberId]);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Club invite response error:', error);
        res.status(500).json({ success: false, error: '처리에 실패했습니다.' });
    }
});

/**
 * DELETE /api/clubs/:clubId/members/:userId
 * 멤버 제거 (admin) 또는 탈퇴 (본인)
 */
router.delete('/:clubId/members/:targetUserId', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const targetUserId = parseInt(req.params.targetUserId);
        const userId = req.user.userId;
        const membership = await verifyClubMember(userId, clubId);

        // 본인 탈퇴 또는 admin 이상
        if (targetUserId !== userId && !isClubAdmin(membership)) {
            return res.status(403).json({ success: false, error: '권한이 없습니다.' });
        }

        // owner는 제거 불가
        const target = await query('SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2', [clubId, targetUserId]);
        if (target.rows.length > 0 && target.rows[0].role === 'owner') {
            return res.status(400).json({ success: false, error: '개설자는 제거할 수 없습니다.' });
        }

        await query('DELETE FROM club_members WHERE club_id = $1 AND user_id = $2', [clubId, targetUserId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Club member remove error:', error);
        res.status(500).json({ success: false, error: '멤버 처리에 실패했습니다.' });
    }
});

// ========== 소모임 게시글 ==========

/**
 * GET /api/clubs/:clubId/posts
 */
router.get('/:clubId/posts', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const userId = req.user.userId;

        const membership = await verifyClubMember(userId, clubId);
        if (!membership) {
            return res.status(403).json({ success: false, error: '소모임 멤버만 접근할 수 있습니다.' });
        }

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
        const offset = (page - 1) * limit;

        const result = await query(
            `SELECT cp.*, u.name as author_name, u.profile_image as author_image,
                    u.position as author_position,
                    CASE WHEN cpr.id IS NOT NULL THEN true ELSE false END as is_read
             FROM club_posts cp
             JOIN users u ON cp.author_id = u.id
             LEFT JOIN club_post_reads cpr ON cpr.post_id = cp.id AND cpr.user_id = $1
             WHERE cp.club_id = $2
             ORDER BY cp.is_pinned DESC, cp.created_at DESC
             LIMIT $3 OFFSET $4`,
            [userId, clubId, limit, offset]
        );

        const countResult = await query(
            'SELECT COUNT(*) as total FROM club_posts WHERE club_id = $1',
            [clubId]
        );

        res.json({
            success: true,
            posts: result.rows,
            total: parseInt(countResult.rows[0].total),
            page,
            totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        });
    } catch (error) {
        console.error('Club posts list error:', error);
        res.status(500).json({ success: false, error: '게시글을 불러올 수 없습니다.' });
    }
});

/**
 * GET /api/clubs/:clubId/posts/:postId
 */
router.get('/:clubId/posts/:postId', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const postId = parseInt(req.params.postId);
        const userId = req.user.userId;

        const membership = await verifyClubMember(userId, clubId);
        if (!membership) {
            return res.status(403).json({ success: false, error: '소모임 멤버만 접근할 수 있습니다.' });
        }

        await query('UPDATE club_posts SET views = views + 1 WHERE id = $1 AND club_id = $2', [postId, clubId]);
        await query(
            'INSERT INTO club_post_reads (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING',
            [postId, userId]
        );

        const result = await query(
            `SELECT cp.*, u.name as author_name, u.profile_image as author_image, u.position as author_position
             FROM club_posts cp JOIN users u ON cp.author_id = u.id
             WHERE cp.id = $1 AND cp.club_id = $2`,
            [postId, clubId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
        }

        const comments = await query(
            `SELECT cc.*, u.name as author_name, u.profile_image as author_image
             FROM club_post_comments cc JOIN users u ON cc.author_id = u.id
             WHERE cc.post_id = $1 AND cc.is_deleted = false ORDER BY cc.created_at ASC`,
            [postId]
        );

        res.json({ success: true, post: result.rows[0], comments: comments.rows });
    } catch (error) {
        console.error('Club post detail error:', error);
        res.status(500).json({ success: false, error: '게시글을 불러올 수 없습니다.' });
    }
});

/**
 * POST /api/clubs/:clubId/posts
 */
router.post('/:clubId/posts', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const userId = req.user.userId;

        const membership = await verifyClubMember(userId, clubId);
        if (!membership) {
            return res.status(403).json({ success: false, error: '소모임 멤버만 게시글을 작성할 수 있습니다.' });
        }

        const { title, content, images, is_pinned } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: '제목을 입력하세요.' });
        }

        const result = await query(
            `INSERT INTO club_posts (club_id, author_id, title, content, images, is_pinned)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [clubId, userId, title.trim(), content || '', images || null, is_pinned || false]
        );

        res.json({ success: true, post: result.rows[0] });
    } catch (error) {
        console.error('Club post create error:', error);
        res.status(500).json({ success: false, error: '게시글 작성에 실패했습니다.' });
    }
});

/**
 * PUT /api/clubs/:clubId/posts/:postId
 */
router.put('/:clubId/posts/:postId', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const postId = parseInt(req.params.postId);
        const userId = req.user.userId;

        const post = await query('SELECT author_id FROM club_posts WHERE id = $1 AND club_id = $2', [postId, clubId]);
        if (post.rows.length === 0) {
            return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
        }
        const membership = await verifyClubMember(userId, clubId);
        if (post.rows[0].author_id !== userId && !isClubAdmin(membership)) {
            return res.status(403).json({ success: false, error: '수정 권한이 없습니다.' });
        }

        const { title, content, images, is_pinned } = req.body;
        await query(
            `UPDATE club_posts SET title = COALESCE($1, title), content = COALESCE($2, content),
             images = COALESCE($3, images), is_pinned = COALESCE($4, is_pinned), updated_at = NOW()
             WHERE id = $5 AND club_id = $6`,
            [title, content, images, is_pinned, postId, clubId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Club post update error:', error);
        res.status(500).json({ success: false, error: '게시글 수정에 실패했습니다.' });
    }
});

/**
 * DELETE /api/clubs/:clubId/posts/:postId
 */
router.delete('/:clubId/posts/:postId', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const postId = parseInt(req.params.postId);
        const userId = req.user.userId;

        const post = await query('SELECT author_id FROM club_posts WHERE id = $1 AND club_id = $2', [postId, clubId]);
        if (post.rows.length === 0) {
            return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
        }
        const membership = await verifyClubMember(userId, clubId);
        if (post.rows[0].author_id !== userId && !isClubAdmin(membership)) {
            return res.status(403).json({ success: false, error: '삭제 권한이 없습니다.' });
        }

        await query('DELETE FROM club_posts WHERE id = $1', [postId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Club post delete error:', error);
        res.status(500).json({ success: false, error: '게시글 삭제에 실패했습니다.' });
    }
});

// ========== 소모임 댓글 ==========

/**
 * POST /api/clubs/:clubId/posts/:postId/comments
 */
router.post('/:clubId/posts/:postId/comments', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const postId = parseInt(req.params.postId);
        const userId = req.user.userId;

        const membership = await verifyClubMember(userId, clubId);
        if (!membership) {
            return res.status(403).json({ success: false, error: '소모임 멤버만 댓글을 작성할 수 있습니다.' });
        }

        const { content, parent_id } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, error: '댓글 내용을 입력하세요.' });
        }

        // 대대댓글 방지
        if (parent_id) {
            const parent = await query('SELECT parent_id FROM club_post_comments WHERE id = $1', [parent_id]);
            if (parent.rows.length > 0 && parent.rows[0].parent_id) {
                return res.status(400).json({ success: false, error: '대대댓글은 지원하지 않습니다.' });
            }
        }

        const result = await query(
            `INSERT INTO club_post_comments (post_id, author_id, content, parent_id)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [postId, userId, content.trim(), parent_id || null]
        );

        await query(
            'UPDATE club_posts SET comments_count = (SELECT COUNT(*) FROM club_post_comments WHERE post_id = $1 AND is_deleted = false) WHERE id = $1',
            [postId]
        );

        res.json({ success: true, comment: result.rows[0] });
    } catch (error) {
        console.error('Club comment error:', error);
        res.status(500).json({ success: false, error: '댓글 작성에 실패했습니다.' });
    }
});

/**
 * DELETE /api/clubs/:clubId/posts/:postId/comments/:commentId
 */
router.delete('/:clubId/posts/:postId/comments/:commentId', authenticate, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const commentId = parseInt(req.params.commentId);
        const userId = req.user.userId;
        const clubId = parseInt(req.params.clubId);

        const comment = await query('SELECT author_id FROM club_post_comments WHERE id = $1', [commentId]);
        if (comment.rows.length === 0) {
            return res.status(404).json({ success: false, error: '댓글을 찾을 수 없습니다.' });
        }
        const membership = await verifyClubMember(userId, clubId);
        if (comment.rows[0].author_id !== userId && !isClubAdmin(membership)) {
            return res.status(403).json({ success: false, error: '삭제 권한이 없습니다.' });
        }

        await query('UPDATE club_post_comments SET is_deleted = true WHERE id = $1', [commentId]);
        await query(
            'UPDATE club_posts SET comments_count = (SELECT COUNT(*) FROM club_post_comments WHERE post_id = $1 AND is_deleted = false) WHERE id = $1',
            [postId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Club comment delete error:', error);
        res.status(500).json({ success: false, error: '댓글 삭제에 실패했습니다.' });
    }
});

// ========== 소모임 일정 ==========

/**
 * GET /api/clubs/:clubId/schedules
 */
router.get('/:clubId/schedules', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const userId = req.user.userId;

        const membership = await verifyClubMember(userId, clubId);
        if (!membership) {
            return res.status(403).json({ success: false, error: '소모임 멤버만 접근할 수 있습니다.' });
        }

        const { year, month } = req.query;
        let whereClause = 'WHERE cs.club_id = $1';
        const params = [clubId];

        if (year && month) {
            whereClause += ' AND EXTRACT(YEAR FROM cs.start_date) = $2 AND EXTRACT(MONTH FROM cs.start_date) = $3';
            params.push(parseInt(year), parseInt(month));
        }

        const result = await query(
            `SELECT cs.*, u.name as creator_name
             FROM club_schedules cs JOIN users u ON cs.created_by = u.id
             ${whereClause} ORDER BY cs.start_date ASC`,
            params
        );

        res.json({ success: true, schedules: result.rows });
    } catch (error) {
        console.error('Club schedules list error:', error);
        res.status(500).json({ success: false, error: '일정을 불러올 수 없습니다.' });
    }
});

/**
 * POST /api/clubs/:clubId/schedules
 */
router.post('/:clubId/schedules', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const userId = req.user.userId;

        const membership = await verifyClubMember(userId, clubId);
        if (!membership) {
            return res.status(403).json({ success: false, error: '소모임 멤버만 일정을 생성할 수 있습니다.' });
        }

        const { title, description, location, start_date, end_date, category } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: '제목을 입력하세요.' });
        }
        if (!start_date) {
            return res.status(400).json({ success: false, error: '시작일을 선택하세요.' });
        }

        const result = await query(
            `INSERT INTO club_schedules (club_id, created_by, title, description, location, start_date, end_date, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [clubId, userId, title.trim(), description || null, location || null, start_date, end_date || null, category || 'meeting']
        );

        res.json({ success: true, schedule: result.rows[0] });
    } catch (error) {
        console.error('Club schedule create error:', error);
        res.status(500).json({ success: false, error: '일정 생성에 실패했습니다.' });
    }
});

/**
 * PUT /api/clubs/:clubId/schedules/:scheduleId
 */
router.put('/:clubId/schedules/:scheduleId', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const scheduleId = parseInt(req.params.scheduleId);
        const userId = req.user.userId;

        const schedule = await query('SELECT created_by FROM club_schedules WHERE id = $1 AND club_id = $2', [scheduleId, clubId]);
        if (schedule.rows.length === 0) {
            return res.status(404).json({ success: false, error: '일정을 찾을 수 없습니다.' });
        }
        const membership = await verifyClubMember(userId, clubId);
        if (schedule.rows[0].created_by !== userId && !isClubAdmin(membership)) {
            return res.status(403).json({ success: false, error: '수정 권한이 없습니다.' });
        }

        const { title, description, location, start_date, end_date, category } = req.body;
        await query(
            `UPDATE club_schedules SET title = COALESCE($1, title), description = COALESCE($2, description),
             location = COALESCE($3, location), start_date = COALESCE($4, start_date),
             end_date = COALESCE($5, end_date), category = COALESCE($6, category), updated_at = NOW()
             WHERE id = $7 AND club_id = $8`,
            [title, description, location, start_date, end_date, category, scheduleId, clubId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Club schedule update error:', error);
        res.status(500).json({ success: false, error: '일정 수정에 실패했습니다.' });
    }
});

/**
 * DELETE /api/clubs/:clubId/schedules/:scheduleId
 */
router.delete('/:clubId/schedules/:scheduleId', authenticate, async (req, res) => {
    try {
        const clubId = parseInt(req.params.clubId);
        const scheduleId = parseInt(req.params.scheduleId);
        const userId = req.user.userId;

        const schedule = await query('SELECT created_by FROM club_schedules WHERE id = $1 AND club_id = $2', [scheduleId, clubId]);
        if (schedule.rows.length === 0) {
            return res.status(404).json({ success: false, error: '일정을 찾을 수 없습니다.' });
        }
        const membership = await verifyClubMember(userId, clubId);
        if (schedule.rows[0].created_by !== userId && !isClubAdmin(membership)) {
            return res.status(403).json({ success: false, error: '삭제 권한이 없습니다.' });
        }

        await query('DELETE FROM club_schedules WHERE id = $1', [scheduleId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Club schedule delete error:', error);
        res.status(500).json({ success: false, error: '일정 삭제에 실패했습니다.' });
    }
});

module.exports = router;
