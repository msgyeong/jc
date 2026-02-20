const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * 공지사항 게시판(category=notice) 작성 가능 여부: super_admin, admin만
 */
function canPostNotice(role) {
    return role && ['super_admin', 'admin'].includes(role);
}

/**
 * GET /api/posts
 * 게시글 목록 조회 (페이지네이션). 개인별 읽음(read_at) 포함.
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const userId = req.user.userId;

        const countResult = await query('SELECT COUNT(*) FROM posts');
        const total = parseInt(countResult.rows[0].count);

        let posts;
        try {
            const result = await query(
                `SELECT 
                    p.id, p.title, p.content, p.images, p.category,
                    p.views, p.likes_count, p.comments_count,
                    p.created_at, p.updated_at,
                    p.schedule_id,
                    u.id as author_id, u.name as author_name, u.profile_image as author_image,
                    pr.read_at as read_at
                 FROM posts p
                 LEFT JOIN users u ON p.author_id = u.id
                 LEFT JOIN post_reads pr ON pr.post_id = p.id AND pr.user_id = $3
                 ORDER BY p.created_at DESC
                 LIMIT $1 OFFSET $2`,
                [limit, offset, userId]
            );
            posts = result.rows.map(row => {
                const { read_at, ...post } = row;
                return { ...post, read_by_current_user: !!read_at };
            });
        } catch (e) {
            const msg = (e && e.message) || '';
            if (msg.includes('post_reads') || msg.includes('schedule_id')) {
                const result = await query(
                    `SELECT 
                        p.id, p.title, p.content, p.images, p.category,
                        p.views, p.likes_count, p.comments_count,
                        p.created_at, p.updated_at,
                        u.id as author_id, u.name as author_name, u.profile_image as author_image
                     FROM posts p
                     LEFT JOIN users u ON p.author_id = u.id
                     ORDER BY p.created_at DESC
                     LIMIT $1 OFFSET $2`,
                    [limit, offset]
                );
                posts = result.rows.map(p => ({ ...p, read_by_current_user: false }));
            } else {
                throw e;
            }
        }

        res.json({
            success: true,
            posts,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/posts/:id/comments
 * 댓글 목록 (테이블 comments 필요: id, author_id, post_id, content, created_at, author_name 등)
 */
router.get('/:id/comments', authenticate, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const q = await query(
            `SELECT c.id, c.author_id, c.content, c.created_at, u.name as author_name, u.profile_image as author_image
             FROM comments c
             LEFT JOIN users u ON c.author_id = u.id
             WHERE c.post_id = $1 AND (c.is_deleted = false OR c.is_deleted IS NULL)
             ORDER BY c.created_at ASC`,
            [postId]
        );
        return res.json({ success: true, comments: q.rows || [] });
    } catch (err) {
        console.error('Get comments error:', err);
        return res.status(500).json({
            success: false,
            message: '댓글 목록 조회에 실패했습니다.'
        });
    }
});

/**
 * POST /api/posts/:id/comments
 * 댓글 작성 (테이블 comments: author_id, post_id, content)
 */
router.post('/:id/comments', authenticate, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { content } = req.body || {};
        const authorId = req.user.userId;
        if (!content || !String(content).trim()) {
            return res.status(400).json({
                success: false,
                message: '댓글 내용을 입력해주세요.'
            });
        }
        await query(
            `INSERT INTO comments (author_id, post_id, content)
             VALUES ($1, $2, $3)`,
            [authorId, postId, String(content).trim()]
        );
        const countResult = await query(
            'SELECT COUNT(*) FROM comments WHERE post_id = $1 AND (is_deleted = false OR is_deleted IS NULL)',
            [postId]
        );
        const comments_count = parseInt(countResult.rows[0]?.count || 0, 10);
        await query(
            'UPDATE posts SET comments_count = $1, updated_at = NOW() WHERE id = $2',
            [comments_count, postId]
        );
        return res.json({ success: true, message: '댓글이 등록되었습니다.', comments_count });
    } catch (err) {
        console.error('Create comment error:', err);
        return res.status(500).json({
            success: false,
            message: '댓글 등록에 실패했습니다.'
        });
    }
});

/**
 * POST /api/posts/:id/like
 * 공감 토글 (테이블 likes: member_id, post_id. 여기서 member_id = req.user.userId 사용)
 */
router.post('/:id/like', authenticate, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const memberId = req.user.userId;
        const existing = await query(
            'SELECT id FROM likes WHERE member_id = $1 AND post_id = $2',
            [memberId, postId]
        );
        if (existing.rows.length > 0) {
            await query('DELETE FROM likes WHERE member_id = $1 AND post_id = $2', [memberId, postId]);
            const countResult = await query(
                'SELECT COUNT(*) FROM likes WHERE post_id = $1',
                [postId]
            );
            const likes_count = parseInt(countResult.rows[0]?.count || 0, 10);
            await query(
                'UPDATE posts SET likes_count = $1, updated_at = NOW() WHERE id = $2',
                [likes_count, postId]
            );
            return res.json({ success: true, liked: false, likes_count });
        }
        await query(
            'INSERT INTO likes (member_id, post_id, created_at) VALUES ($1, $2, NOW())',
            [memberId, postId]
        );
        const countResult = await query(
            'SELECT COUNT(*) FROM likes WHERE post_id = $1',
            [postId]
        );
        const likes_count = parseInt(countResult.rows[0]?.count || 0, 10);
        await query(
            'UPDATE posts SET likes_count = $1, updated_at = NOW() WHERE id = $2',
            [likes_count, postId]
        );
        return res.json({ success: true, liked: true, likes_count });
    } catch (err) {
        console.error('Toggle like error:', err);
        return res.status(500).json({
            success: false,
            message: '공감 처리에 실패했습니다.'
        });
    }
});

/**
 * GET /api/posts/:id
 * 게시글 상세 조회
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await query(
            'UPDATE posts SET views = views + 1 WHERE id = $1',
            [id]
        );

        let result;
        try {
            result = await query(
                `SELECT 
                    p.id, p.title, p.content, p.images, p.category,
                    p.views, p.likes_count, p.comments_count,
                    p.created_at, p.updated_at,
                    p.schedule_id,
                    u.id as author_id, u.name as author_name, u.profile_image as author_image
                 FROM posts p
                 LEFT JOIN users u ON p.author_id = u.id
                 WHERE p.id = $1`,
                [id]
            );
        } catch (e) {
            if ((e && e.message && e.message.includes('schedule_id')) || !e) {
                result = await query(
                    `SELECT 
                        p.id, p.title, p.content, p.images, p.category,
                        p.views, p.likes_count, p.comments_count,
                        p.created_at, p.updated_at,
                        u.id as author_id, u.name as author_name, u.profile_image as author_image
                     FROM posts p
                     LEFT JOIN users u ON p.author_id = u.id
                     WHERE p.id = $1`,
                    [id]
                );
            } else throw e;
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        const post = result.rows[0];
        let user_has_liked = false;
        try {
            const likeRow = await query(
                'SELECT 1 FROM likes WHERE member_id = $1 AND post_id = $2',
                [userId, id]
            );
            user_has_liked = (likeRow.rows && likeRow.rows.length > 0);
        } catch (_) { /* post_likes 사용 시: user_id/post_id */ }
        if (!user_has_liked) {
            try {
                const pl = await query(
                    'SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2',
                    [userId, id]
                );
                user_has_liked = (pl.rows && pl.rows.length > 0);
            } catch (_) { }
        }
        post.user_has_liked = user_has_liked;

        try {
            await query(
                `INSERT INTO post_reads (user_id, post_id, read_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (user_id, post_id) DO UPDATE SET read_at = NOW()`,
                [userId, id]
            );
        } catch (_) { /* post_reads 미적용 시 무시 */ }

        res.json({
            success: true,
            post
        });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/posts
 * 게시글 작성. 공지(category=notice)는 관리자만 가능.
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, content, images, category, schedule_id } = req.body;
        const authorId = req.user.userId;
        const role = req.user.role;
        const cat = (category && String(category).trim()) || 'general';

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: '제목과 내용을 입력해주세요.'
            });
        }

        if (cat === 'notice' && !canPostNotice(role)) {
            return res.status(403).json({
                success: false,
                message: '공지사항 게시판은 관리자만 작성할 수 있습니다.'
            });
        }

        let result;
        try {
            result = await query(
                `INSERT INTO posts (author_id, title, content, images, category, schedule_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                 RETURNING id`,
                [authorId, title, content, images || [], cat, schedule_id || null]
            );
        } catch (e) {
            if (e && e.message && e.message.includes('schedule_id')) {
                result = await query(
                    `INSERT INTO posts (author_id, title, content, images, category, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                     RETURNING id`,
                    [authorId, title, content, images || [], cat]
                );
            } else throw e;
        }

        res.status(201).json({
            success: true,
            message: '게시글이 작성되었습니다.',
            postId: result.rows[0].id
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 작성 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/posts/:id
 * 게시글 수정. category를 notice로 바꾸는 경우 관리자만 가능.
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, images, category, schedule_id } = req.body;
        const userId = req.user.userId;
        const cat = (category && String(category).trim()) || 'general';

        const postResult = await query(
            'SELECT author_id, category FROM posts WHERE id = $1',
            [id]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        const isAuthor = postResult.rows[0].author_id === userId;
        const isAdmin = req.user.role && ['super_admin', 'admin'].includes(req.user.role);
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '게시글 수정 권한이 없습니다.'
            });
        }

        if (cat === 'notice' && !canPostNotice(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '공지사항 게시판으로 변경은 관리자만 가능합니다.'
            });
        }

        try {
            await query(
                `UPDATE posts 
                 SET title = $1, content = $2, images = $3, category = $4, schedule_id = $5, updated_at = NOW()
                 WHERE id = $6`,
                [title, content, images || [], cat, schedule_id !== undefined ? schedule_id : null, id]
            );
        } catch (e) {
            if (e && e.message && e.message.includes('schedule_id')) {
                await query(
                    `UPDATE posts 
                     SET title = $1, content = $2, images = $3, category = $4, updated_at = NOW()
                     WHERE id = $5`,
                    [title, content, images || [], cat, id]
                );
            } else throw e;
        }

        res.json({
            success: true,
            message: '게시글이 수정되었습니다.'
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 수정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * DELETE /api/posts/:id
 * 게시글 삭제
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // 게시글 소유자 확인
        const postResult = await query(
            'SELECT author_id FROM posts WHERE id = $1',
            [id]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        // 작성자 본인이거나 관리자인 경우만 삭제 가능
        const isAuthor = postResult.rows[0].author_id === userId;
        const isAdmin = ['super_admin', 'admin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '게시글 삭제 권한이 없습니다.'
            });
        }

        // 게시글 삭제
        await query('DELETE FROM posts WHERE id = $1', [id]);

        res.json({
            success: true,
            message: '게시글이 삭제되었습니다.'
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 삭제 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
