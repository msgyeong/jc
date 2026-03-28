const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, addOrgFilter } = require('../middleware/auth');

/**
 * [하위호환] GET /api/notices → /api/posts?category=notice 로 프록시
 * notices.js 기능은 posts.js category=notice 로 통합됨.
 * 기존 클라이언트 호환을 위해 프록시 유지.
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const userId = req.user.userId;

        // org_id 필터 적용
        const countConditions = ["p.category = 'notice'"];
        const countParams = [];
        addOrgFilter(countConditions, countParams, req, 'p');
        const countResult = await query(
            `SELECT COUNT(*) FROM posts p WHERE ${countConditions.join(' AND ')}`,
            countParams
        );
        const total = parseInt(countResult.rows[0].count);

        let result;
        try {
            const listConditions = ["p.category = 'notice'"];
            const listParams = [];
            addOrgFilter(listConditions, listParams, req, 'p');
            listParams.push(userId);
            const userIdx = listParams.length;
            listParams.push(limit, offset);
            const limitIdx = listParams.length - 1;
            const offsetIdx = listParams.length;
            result = await query(
                `SELECT
                    p.id, p.title, p.content, p.images, p.category,
                    p.is_pinned, p.views, p.likes_count, p.comments_count,
                    p.created_at, p.updated_at,
                    u.id as author_id, u.name as author_name, u.profile_image as author_image,
                    pr.read_at as read_at
                 FROM posts p
                 LEFT JOIN users u ON p.author_id = u.id
                 LEFT JOIN read_status pr ON pr.post_id = p.id AND pr.user_id = $${userIdx}
                 WHERE ${listConditions.join(' AND ')}
                 ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC
                 LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
                listParams
            );
        } catch (e) {
            const fbConditions = ["p.category = 'notice'"];
            const fbParams = [];
            addOrgFilter(fbConditions, fbParams, req, 'p');
            fbParams.push(limit, offset);
            const fbLimitIdx = fbParams.length - 1;
            const fbOffsetIdx = fbParams.length;
            result = await query(
                `SELECT
                    p.id, p.title, p.content, p.images, p.category,
                    p.is_pinned, p.views, p.likes_count, p.comments_count,
                    p.created_at, p.updated_at,
                    u.id as author_id, u.name as author_name, u.profile_image as author_image
                 FROM posts p
                 LEFT JOIN users u ON p.author_id = u.id
                 WHERE ${fbConditions.join(' AND ')}
                 ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC
                 LIMIT $${fbLimitIdx} OFFSET $${fbOffsetIdx}`,
                fbParams
            );
        }

        const notices = result.rows.map(row => {
            const { read_at, ...post } = row;
            return { ...post, read_by_current_user: !!read_at };
        });

        res.json({
            success: true,
            notices,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Get notices (compat) error:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * [하위호환] GET /api/notices/:id → posts 테이블에서 조회
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await query('UPDATE posts SET views = views + 1 WHERE id = $1', [id]);

        const result = await query(
            `SELECT
                p.id, p.title, p.content, p.images, p.category,
                p.is_pinned, p.views, p.likes_count, p.comments_count,
                p.created_at, p.updated_at,
                u.id as author_id, u.name as author_name, u.profile_image as author_image
             FROM posts p
             LEFT JOIN users u ON p.author_id = u.id
             WHERE p.id = $1 AND p.category = 'notice'`,
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
        console.error('Get notice (compat) error:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * [하위호환] POST /api/notices → posts 테이블에 category=notice로 작성
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, content, is_pinned } = req.body;
        const authorId = req.user.userId;
        const role = req.user.role;

        if (!['super_admin', 'admin'].includes(role)) {
            return res.status(403).json({
                success: false,
                message: '공지사항 작성 권한이 없습니다.'
            });
        }

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: '제목과 내용을 입력해주세요.'
            });
        }

        const result = await query(
            `INSERT INTO posts (author_id, title, content, category, is_pinned, org_id, created_at, updated_at)
             VALUES ($1, $2, $3, 'notice', $4, $5, NOW(), NOW())
             RETURNING id`,
            [authorId, title, content, is_pinned || false, req.user.orgId || null]
        );

        res.status(201).json({
            success: true,
            message: '공지사항이 작성되었습니다.',
            noticeId: result.rows[0].id
        });
    } catch (error) {
        console.error('Create notice (compat) error:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 작성 중 오류가 발생했습니다.'
        });
    }
});

/**
 * [하위호환] PUT /api/notices/:id → posts 테이블에서 수정
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, is_pinned } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const postResult = await query(
            "SELECT author_id FROM posts WHERE id = $1 AND category = 'notice'",
            [id]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '공지사항을 찾을 수 없습니다.'
            });
        }

        const isAuthor = Number(postResult.rows[0].author_id) === Number(userId);
        const isAdmin = ['super_admin', 'admin'].includes(userRole);
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '공지사항 수정 권한이 없습니다.'
            });
        }

        await query(
            `UPDATE posts
             SET title = $1, content = $2, is_pinned = $3, updated_at = NOW()
             WHERE id = $4`,
            [title, content, is_pinned || false, id]
        );

        res.json({
            success: true,
            message: '공지사항이 수정되었습니다.'
        });
    } catch (error) {
        console.error('Update notice (compat) error:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 수정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * [하위호환] DELETE /api/notices/:id → posts 테이블에서 삭제
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const postResult = await query(
            "SELECT author_id FROM posts WHERE id = $1 AND category = 'notice'",
            [id]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '공지사항을 찾을 수 없습니다.'
            });
        }

        const isAuthor = Number(postResult.rows[0].author_id) === Number(userId);
        const isAdmin = ['super_admin', 'admin'].includes(userRole);
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '공지사항 삭제 권한이 없습니다.'
            });
        }

        await query('UPDATE posts SET deleted_at = NOW() WHERE id = $1', [id]);

        res.json({
            success: true,
            message: '공지사항이 삭제되었습니다.'
        });
    } catch (error) {
        console.error('Delete notice (compat) error:', error);
        res.status(500).json({
            success: false,
            message: '공지사항 삭제 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
