const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticate, requireRole, addOrgFilter } = require('../middleware/auth');
const { sendPushToAll, sendPushToUser } = require('../utils/pushSender');
const { createScheduledNotifications } = require('../cron/notification-scheduler');

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
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
        const offset = (page - 1) * limit;
        const userId = req.user.userId;
        const category = req.query.category; // 'notice' or 'general'

        // Category filter (parameterized)
        const cat = category === 'notice' ? 'notice' : category === 'general' ? 'general' : null;

        // Count query with org_id filter
        const countConditions = ['p.deleted_at IS NULL'];
        const countParams = [];
        if (cat) {
            countParams.push(cat);
            countConditions.push(`p.category = $${countParams.length}`);
        }
        addOrgFilter(countConditions, countParams, req, 'p');

        const countResult = await query(
            `SELECT COUNT(*) FROM posts p WHERE ${countConditions.join(' AND ')}`,
            countParams
        );
        const total = parseInt(countResult.rows[0].count);

        // Notice category: pinned first, then by date
        const orderClause = cat === 'notice'
            ? 'ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC'
            : 'ORDER BY p.created_at DESC';

        // Build parameterized query with org_id filter
        const listConditions = ['p.deleted_at IS NULL'];
        const listParams = [];
        if (cat) {
            listParams.push(cat);
            listConditions.push(`p.category = $${listParams.length}`);
        }
        addOrgFilter(listConditions, listParams, req, 'p');
        listParams.push(userId);
        const userIdx = listParams.length;
        listParams.push(limit, offset);
        const limitIdx = listParams.length - 1;
        const offsetIdx = listParams.length;
        const listWhereClause = `WHERE ${listConditions.join(' AND ')}`;

        let posts;
        try {
            const result = await query(
                `SELECT
                    p.id, p.title, p.content, p.images, p.category,
                    p.is_pinned,
                    p.views, p.likes_count, p.comments_count,
                    p.created_at, p.updated_at,
                    u.id as author_id, u.name as author_name, u.profile_image as author_image,
                    pr.read_at as read_at
                 FROM posts p
                 LEFT JOIN users u ON p.author_id = u.id
                 LEFT JOIN read_status pr ON pr.post_id = p.id AND pr.user_id = $${userIdx}
                 ${listWhereClause}
                 ${orderClause}
                 LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
                listParams
            );
            posts = result.rows.map(row => {
                const { read_at, ...post } = row;
                return { ...post, read_by_current_user: !!read_at };
            });
        } catch (e) {
            const msg = (e && e.message) || '';
            if (msg.includes('read_status') || msg.includes('schedule_id') || msg.includes('is_pinned')) {
                const fbConditions = [];
                const fallbackParams = [];
                if (cat) {
                    fallbackParams.push(cat);
                    fbConditions.push(`p.category = $${fallbackParams.length}`);
                }
                addOrgFilter(fbConditions, fallbackParams, req, 'p');
                fallbackParams.push(limit, offset);
                const fbLimitIdx = fallbackParams.length - 1;
                const fbOffsetIdx = fallbackParams.length;
                const fbWhere = fbConditions.length > 0 ? 'WHERE ' + fbConditions.join(' AND ') : '';
                const result = await query(
                    `SELECT
                        p.id, p.title, p.content, p.images, p.category,
                        p.views, p.likes_count, p.comments_count,
                        p.created_at, p.updated_at,
                        u.id as author_id, u.name as author_name, u.profile_image as author_image
                     FROM posts p
                     LEFT JOIN users u ON p.author_id = u.id
                     ${fbWhere}
                     ORDER BY p.created_at DESC
                     LIMIT $${fbLimitIdx} OFFSET $${fbOffsetIdx}`,
                    fallbackParams
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
        const userId = req.user.userId;
        let result;
        try {
            result = await query(
                `SELECT c.id, c.author_id, c.content, c.parent_id, c.is_deleted, c.created_at,
                        u.name as author_name, u.profile_image as author_image,
                        COALESCE((SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id), 0)::int as likes_count,
                        EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $2) as liked
                 FROM comments c
                 LEFT JOIN users u ON c.author_id = u.id
                 WHERE c.post_id = $1 AND (c.is_deleted = false OR c.is_deleted IS NULL)
                 ORDER BY c.created_at ASC`,
                [postId, userId]
            );
        } catch (e) {
            result = await query(
                `SELECT c.id, c.author_id, c.content, c.parent_id, c.created_at,
                        u.name as author_name, u.profile_image as author_image
                 FROM comments c
                 LEFT JOIN users u ON c.author_id = u.id
                 WHERE c.post_id = $1
                 ORDER BY c.created_at ASC`,
                [postId]
            );
        }
        return res.json({ success: true, comments: result.rows || [] });
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
        const { content, parent_id } = req.body || {};
        const authorId = req.user.userId;
        if (!content || !String(content).trim()) {
            return res.status(400).json({
                success: false,
                message: '댓글 내용을 입력해주세요.'
            });
        }
        try {
            await query(
                `INSERT INTO comments (author_id, post_id, content, parent_id)
                 VALUES ($1, $2, $3, $4)`,
                [authorId, postId, String(content).trim(), parent_id || null]
            );
        } catch (e) {
            // parent_id 컬럼이 없을 경우 폴백
            await query(
                `INSERT INTO comments (author_id, post_id, content)
                 VALUES ($1, $2, $3)`,
                [authorId, postId, String(content).trim()]
            );
        }
        let countResult;
        try {
            countResult = await query(
                'SELECT COUNT(*) FROM comments WHERE post_id = $1 AND (is_deleted = false OR is_deleted IS NULL)',
                [postId]
            );
        } catch (e) {
            countResult = await query(
                'SELECT COUNT(*) FROM comments WHERE post_id = $1',
                [postId]
            );
        }
        const comments_count = parseInt(countResult.rows[0]?.count || 0, 10);
        await query(
            'UPDATE posts SET comments_count = $1, updated_at = NOW() WHERE id = $2',
            [comments_count, postId]
        );
        // N-05 댓글 알림: 게시글 작성자에게 발송 (본인 제외)
        try {
            const postResult = await query('SELECT author_id, title FROM posts WHERE id = $1', [postId]);
            if (postResult.rows.length > 0) {
                const postAuthorId = postResult.rows[0].author_id;
                if (postAuthorId !== authorId) {
                    const commenterResult = await query('SELECT name FROM users WHERE id = $1', [authorId]);
                    const commenterName = commenterResult.rows[0]?.name || '회원';
                    sendPushToUser(postAuthorId, {
                        title: '\uD83D\uDCAC \uC0C8 \uB313\uAE00',
                        body: `${commenterName}님이 댓글을 남겼습니다: ${String(content).trim().substring(0, 50)}`,
                        data: { url: `/#posts/${postId}`, post_id: parseInt(postId) },
                        type: 'N-05'
                    }).catch(e => console.error('[Push] N-05 발송 에러:', e.message));
                }
            }
        } catch (catchErr) { console.error("[silent-catch]", catchErr.message); }

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
 * DELETE /api/posts/:id/comments/:commentId
 * 댓글 삭제 (soft delete)
 */
router.delete('/:id/comments/:commentId', authenticate, async (req, res) => {
    try {
        const { id: postId, commentId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const commentResult = await query(
            'SELECT author_id FROM comments WHERE id = $1 AND post_id = $2',
            [commentId, postId]
        );
        if (commentResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' });
        }

        const isAuthor = Number(commentResult.rows[0].author_id) === Number(userId);
        const isAdmin = userRole && ['super_admin', 'admin'].includes(userRole);
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ success: false, message: '댓글 삭제 권한이 없습니다.' });
        }

        try {
            await query('UPDATE comments SET is_deleted = true WHERE id = $1', [commentId]);
        } catch (e) {
            // is_deleted 컬럼이 없으면 실제 삭제
            await query('DELETE FROM comments WHERE id = $1', [commentId]);
        }

        let countResult;
        try {
            countResult = await query(
                'SELECT COUNT(*) FROM comments WHERE post_id = $1 AND (is_deleted = false OR is_deleted IS NULL)',
                [postId]
            );
        } catch (e) {
            countResult = await query(
                'SELECT COUNT(*) FROM comments WHERE post_id = $1',
                [postId]
            );
        }
        const comments_count = parseInt(countResult.rows[0]?.count || 0, 10);
        await query('UPDATE posts SET comments_count = $1, updated_at = NOW() WHERE id = $2', [comments_count, postId]);

        return res.json({ success: true, message: '댓글이 삭제되었습니다.', comments_count });
    } catch (err) {
        console.error('Delete comment error:', err);
        return res.status(500).json({ success: false, message: '댓글 삭제에 실패했습니다.' });
    }
});

/**
 * POST /api/posts/:postId/comments/:commentId/like
 * 댓글 좋아요 토글
 */
router.post('/:postId/comments/:commentId/like', authenticate, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;
        // comment_likes 테이블 자동 생성
        await query(`CREATE TABLE IF NOT EXISTS comment_likes (
            id SERIAL PRIMARY KEY,
            comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(comment_id, user_id)
        )`).catch(() => {});
        const existing = await query('SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
        let liked;
        if (existing.rows.length > 0) {
            await query('DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
            liked = false;
        } else {
            await query('INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)', [commentId, userId]);
            liked = true;
        }
        const countResult = await query('SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1', [commentId]);
        const likes_count = parseInt(countResult.rows[0].count, 10);
        res.json({ success: true, liked, likes_count });
    } catch (err) {
        console.error('Comment like error:', err);
        res.status(500).json({ success: false, message: '좋아요 처리 실패' });
    }
});

/**
 * POST /api/posts/:id/like
 * 공감 토글 (테이블 likes: user_id, post_id)
 */
router.post('/:id/like', authenticate, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user.userId;

        const result = await transaction(async (client) => {
            const existing = await client.query(
                'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2 FOR UPDATE',
                [userId, postId]
            );
            let liked;
            if (existing.rows.length > 0) {
                await client.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
                liked = false;
            } else {
                await client.query(
                    'INSERT INTO likes (user_id, post_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id, post_id) DO NOTHING',
                    [userId, postId]
                );
                liked = true;
            }
            const countResult = await client.query(
                'SELECT COUNT(*) FROM likes WHERE post_id = $1',
                [postId]
            );
            const likes_count = parseInt(countResult.rows[0]?.count || 0, 10);
            await client.query(
                'UPDATE posts SET likes_count = $1, updated_at = NOW() WHERE id = $2',
                [likes_count, postId]
            );
            return { liked, likes_count };
        });

        return res.json({ success: true, liked: result.liked, likes_count: result.likes_count });
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

        const result = await query(
            `SELECT
                p.id, p.title, p.content, p.images, p.category,
                p.is_pinned, p.linked_schedule_id, p.attendance_enabled,
                p.views, p.likes_count, p.comments_count,
                p.created_at, p.updated_at,
                u.id as author_id, u.name as author_name, u.profile_image as author_image
             FROM posts p
             LEFT JOIN users u ON p.author_id = u.id
             WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        const post = result.rows[0];

        // 연결된 일정 정보 조회
        if (post.linked_schedule_id) {
            try {
                const schedResult = await query(
                    `SELECT id, title, start_date, end_date, location, category FROM schedules WHERE id = $1`,
                    [post.linked_schedule_id]
                );
                post.linked_schedule = schedResult.rows[0] || null;
            } catch (catchErr) { console.error("[silent-catch]", catchErr.message); }
        }

        let user_has_liked = false;
        try {
            const likeRow = await query(
                'SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2',
                [userId, id]
            );
            user_has_liked = (likeRow.rows && likeRow.rows.length > 0);
        } catch (catchErr) { console.error("[silent-catch]", catchErr.message); }
        if (!user_has_liked) {
            try {
                const pl = await query(
                    'SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2',
                    [userId, id]
                );
                user_has_liked = (pl.rows && pl.rows.length > 0);
            } catch (catchErr) { console.error("[silent-catch]", catchErr.message); }
        }
        post.user_has_liked = user_has_liked;

        // 읽음 처리 (read_status)
        try {
            await query(
                `INSERT INTO read_status (user_id, post_id, read_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (user_id, post_id) DO UPDATE SET read_at = NOW()`,
                [userId, id]
            );
        } catch (readErr) {
            console.error('[read_status] INSERT 실패:', readErr.message);
            // UNIQUE 제약조건 없으면 테이블 재생성 시도
            try {
                await query(`
                    CREATE TABLE IF NOT EXISTS read_status (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        post_id INTEGER,
                        notice_id INTEGER,
                        schedule_id INTEGER,
                        read_at TIMESTAMP DEFAULT NOW()
                    )
                `);
                // UNIQUE 제약조건 추가 (없으면)
                await query(`
                    CREATE UNIQUE INDEX IF NOT EXISTS read_status_user_post_idx ON read_status (user_id, post_id) WHERE post_id IS NOT NULL
                `);
                // 재시도 (UNIQUE 인덱스 기반)
                await query(
                    `INSERT INTO read_status (user_id, post_id, read_at)
                     VALUES ($1, $2, NOW())
                     ON CONFLICT (user_id, post_id) WHERE post_id IS NOT NULL DO UPDATE SET read_at = NOW()`,
                    [userId, id]
                );
            } catch (retryErr) {
                console.error('[read_status] 재시도 실패:', retryErr.message);
            }
        }

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
 * body.schedule 객체가 있으면 트랜잭션으로 일정도 동시 생성 (M-12 공지-일정 연동).
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, content, images: rawImages, category, is_pinned, schedule, vote_config } = req.body;
        const authorId = req.user.userId;
        const role = req.user.role;
        const cat = (category && String(category).trim()) || 'general';
        const pinned = cat === 'notice' && is_pinned ? true : false;
        // images: 배열 → JSON 문자열로 저장 (TEXT 컬럼)
        const images = Array.isArray(rawImages) && rawImages.length > 0 ? JSON.stringify(rawImages) : null;

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

        // schedule 객체가 있으면 트랜잭션으로 게시글+일정 동시 생성 (공지/일반 모두)
        if (schedule) {
            const result = await transaction(async (client) => {
                // 1. 공지 생성
                const attendance_enabled = req.body.attendance_enabled || false;
                const is_banner = req.body.is_banner || false;
                const postResult = await client.query(
                    `INSERT INTO posts (author_id, title, content, images, category, is_pinned, is_banner, attendance_enabled, org_id, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                     RETURNING id`,
                    [authorId, title, content, images, cat, pinned, is_banner, attendance_enabled, req.user.orgId || null]
                );
                const postId = postResult.rows[0].id;

                // 2. 일정 생성
                const schedResult = await client.query(
                    `INSERT INTO schedules (created_by, title, start_date, end_date, location, description, category, linked_post_id, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                     RETURNING id`,
                    [
                        authorId,
                        schedule.title || title,
                        schedule.start_date,
                        schedule.end_date || null,
                        schedule.location || null,
                        schedule.description || null,
                        schedule.category || 'event',
                        postId
                    ]
                );
                const scheduleId = schedResult.rows[0].id;

                // 3. 양방향 참조: posts.linked_schedule_id 업데이트
                await client.query(
                    'UPDATE posts SET linked_schedule_id = $1 WHERE id = $2',
                    [scheduleId, postId]
                );

                // 4. 투표 설정이 있으면 생성
                if (vote_config) {
                    await client.query(
                        `INSERT INTO attendance_config (schedule_id, vote_type, deadline, quorum_count, quorum_basis, created_by, created_at, updated_at)
                         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                        [
                            scheduleId,
                            vote_config.vote_type || 'general',
                            vote_config.deadline || null,
                            vote_config.quorum_count || null,
                            vote_config.quorum_basis || null,
                            authorId
                        ]
                    );
                }

                return { postId, scheduleId };
            });

            // N-01 공지 알림 발송 (비동기, 실패해도 응답 정상)
            sendPushToAll({
                title: '\uD83D\uDCE2 \uC0C8 \uACF5\uC9C0\uC0AC\uD56D',
                body: (title || '').substring(0, 80),
                data: { url: `/#posts/${result.postId}`, post_id: result.postId },
                type: 'N-01'
            }, authorId).catch(e => console.error('[Push] N-01 발송 에러:', e.message));

            return res.status(201).json({
                success: true,
                message: '공지와 일정이 함께 작성되었습니다.',
                data: {
                    post: { id: result.postId, linked_schedule_id: result.scheduleId },
                    schedule: { id: result.scheduleId, linked_post_id: result.postId }
                }
            });
        }

        // 일정 연동 없는 일반 게시글/공지 작성
        const attendance_enabled = req.body.attendance_enabled || false;
        const is_banner = req.body.is_banner || false;
        const result = await query(
            `INSERT INTO posts (author_id, title, content, images, category, is_pinned, is_banner, attendance_enabled, org_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
             RETURNING id`,
            [authorId, title, content, images, cat, pinned, is_banner, attendance_enabled, req.user.orgId || null]
        );

        const newPostId = result.rows[0].id;

        // push_setting 처리
        const push_setting = req.body.push_setting || 'none';
        if (push_setting === 'immediate' && cat === 'notice') {
            // 즉시 알림 (기존 N-01)
            sendPushToAll({
                title: '\uD83D\uDCE2 \uC0C8 \uACF5\uC9C0\uC0AC\uD56D',
                body: (title || '').substring(0, 80),
                data: { url: `/#posts/${newPostId}`, post_id: newPostId },
                type: 'N-01'
            }, authorId).catch(e => console.error('[Push] N-01 발송 에러:', e.message));
        } else if (cat === 'notice' && push_setting === 'none') {
            // 기존 동작 유지: 공지면 기본 즉시 알림
            sendPushToAll({
                title: '\uD83D\uDCE2 \uC0C8 \uACF5\uC9C0\uC0AC\uD56D',
                body: (title || '').substring(0, 80),
                data: { url: `/#posts/${newPostId}`, post_id: newPostId },
                type: 'N-01'
            }, authorId).catch(e => console.error('[Push] N-01 발송 에러:', e.message));
        }

        // 예약/D-Day 알림 등록
        if (['scheduled', 'd_day'].includes(push_setting)) {
            try {
                await createScheduledNotifications({
                    postId: newPostId,
                    scheduleId: null,
                    pushSetting: push_setting,
                    scheduledAt: req.body.push_scheduled_at,
                    eventDate: req.body.push_event_date,
                    dDayOptions: req.body.push_d_day_options,
                });
            } catch (e) {
                console.error('[Push] 예약 알림 등록 에러:', e.message);
            }
        }

        res.status(201).json({
            success: true,
            message: '게시글이 작성되었습니다.',
            postId: newPostId
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
 * 게시글 수정. schedule 객체 포함 시 연결 일정 동기화 (M-12).
 * schedule: null → 연결 해제, schedule: {...} → 연결 일정 업데이트 또는 신규 생성
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, images: rawEditImages, category, is_pinned, schedule } = req.body;
        const userId = req.user.userId;
        const cat = (category && String(category).trim()) || 'general';
        const pinned = cat === 'notice' && is_pinned ? true : false;
        const images = Array.isArray(rawEditImages) && rawEditImages.length > 0 ? JSON.stringify(rawEditImages) : null;

        const postResult = await query(
            'SELECT author_id, category, linked_schedule_id FROM posts WHERE id = $1',
            [id]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        const isAuthor = Number(postResult.rows[0].author_id) === Number(userId);
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

        const existingScheduleId = postResult.rows[0].linked_schedule_id;

        // schedule 파라미터가 명시적으로 전달된 경우 트랜잭션으로 처리
        if (schedule !== undefined) {
            await transaction(async (client) => {
                // 게시글 업데이트
                if (schedule === null) {
                    // 연결 해제
                    await client.query(
                        `UPDATE posts SET title=$1, content=$2, images=$3, category=$4, is_pinned=$5, linked_schedule_id=NULL, updated_at=NOW() WHERE id=$6`,
                        [title, content, images, cat, pinned, id]
                    );
                    if (existingScheduleId) {
                        await client.query(
                            'UPDATE schedules SET linked_post_id = NULL WHERE id = $1',
                            [existingScheduleId]
                        );
                    }
                } else if (existingScheduleId) {
                    // 연결 일정 업데이트
                    await client.query(
                        `UPDATE posts SET title=$1, content=$2, images=$3, category=$4, is_pinned=$5, updated_at=NOW() WHERE id=$6`,
                        [title, content, images, cat, pinned, id]
                    );
                    await client.query(
                        `UPDATE schedules SET title=$1, start_date=$2, end_date=$3, location=$4, description=$5, category=$6, updated_at=NOW() WHERE id=$7`,
                        [
                            schedule.title || title,
                            schedule.start_date,
                            schedule.end_date || null,
                            schedule.location || null,
                            schedule.description || null,
                            schedule.category || 'event',
                            existingScheduleId
                        ]
                    );
                } else {
                    // 신규 일정 생성 + 연결
                    const schedResult = await client.query(
                        `INSERT INTO schedules (created_by, title, start_date, end_date, location, description, category, linked_post_id, created_at, updated_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                         RETURNING id`,
                        [userId, schedule.title || title, schedule.start_date, schedule.end_date || null, schedule.location || null, schedule.description || null, schedule.category || 'event', id]
                    );
                    await client.query(
                        `UPDATE posts SET title=$1, content=$2, images=$3, category=$4, is_pinned=$5, linked_schedule_id=$6, updated_at=NOW() WHERE id=$7`,
                        [title, content, images, cat, pinned, schedResult.rows[0].id, id]
                    );
                }
            });
        } else {
            // schedule 파라미터 없으면 기존 로직
            await query(
                `UPDATE posts SET title=$1, content=$2, images=$3, category=$4, is_pinned=$5, updated_at=NOW() WHERE id=$6`,
                [title, content, images, cat, pinned, id]
            );
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
 * 게시글 삭제. ?delete_linked_schedule=true 시 연결 일정도 삭제 (M-12).
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const deleteLinkedSchedule = req.query.delete_linked_schedule === 'true';

        const postResult = await query(
            'SELECT author_id, linked_schedule_id FROM posts WHERE id = $1',
            [id]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        const isAuthor = Number(postResult.rows[0].author_id) === Number(userId);
        const isAdmin = ['super_admin', 'admin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '게시글 삭제 권한이 없습니다.'
            });
        }

        const linkedScheduleId = postResult.rows[0].linked_schedule_id;

        await transaction(async (client) => {
            if (linkedScheduleId) {
                if (deleteLinkedSchedule) {
                    // 연결 일정도 함께 삭제
                    await client.query('UPDATE posts SET linked_schedule_id = NULL WHERE id = $1', [id]);
                    await client.query('UPDATE schedules SET deleted_at = NOW() WHERE id = $1', [linkedScheduleId]);
                } else {
                    // 연결만 해제, 일정은 독립 유지
                    await client.query('UPDATE posts SET linked_schedule_id = NULL WHERE id = $1', [id]);
                    await client.query('UPDATE schedules SET linked_post_id = NULL WHERE id = $1', [linkedScheduleId]);
                }
            }
            await client.query('UPDATE posts SET deleted_at = NOW() WHERE id = $1', [id]);
        });

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

/* ======================================================
   게시글 참석/불참 API
   ====================================================== */

/**
 * POST /api/posts/:id/attendance
 * 참석/불참 등록 또는 변경
 */
router.post('/:id/attendance', authenticate, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user.userId;
        const { status } = req.body;

        if (!status || !['attending', 'not_attending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'status는 attending 또는 not_attending이어야 합니다.' });
        }

        // 게시글 확인 + attendance_enabled 체크
        const postResult = await query('SELECT id, attendance_enabled, linked_schedule_id FROM posts WHERE id = $1', [postId]);
        if (postResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        const post = postResult.rows[0];

        // linked_schedule_id가 있으면 schedule_attendance 재활용
        if (post.linked_schedule_id) {
            await query(
                `INSERT INTO schedule_attendance (schedule_id, user_id, status, responded_at, updated_at)
                 VALUES ($1, $2, $3, NOW(), NOW())
                 ON CONFLICT (schedule_id, user_id)
                 DO UPDATE SET status = $3, updated_at = NOW()`,
                [post.linked_schedule_id, userId, status]
            );
        } else {
            await query(
                `INSERT INTO post_attendance (post_id, user_id, status, responded_at)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT (post_id, user_id)
                 DO UPDATE SET status = $3, responded_at = NOW()`,
                [postId, userId, status]
            );
        }

        res.json({ success: true, message: status === 'attending' ? '참석으로 등록되었습니다.' : '불참으로 등록되었습니다.' });
    } catch (err) {
        console.error('Post attendance error:', err);
        res.status(500).json({ success: false, message: '참석 처리에 실패했습니다.' });
    }
});

/**
 * DELETE /api/posts/:id/attendance
 * 참석 취소
 */
router.delete('/:id/attendance', authenticate, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user.userId;

        const postResult = await query('SELECT linked_schedule_id FROM posts WHERE id = $1', [postId]);
        if (postResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        const linkedScheduleId = postResult.rows[0].linked_schedule_id;
        if (linkedScheduleId) {
            await query('DELETE FROM schedule_attendance WHERE schedule_id = $1 AND user_id = $2', [linkedScheduleId, userId]);
        } else {
            await query('DELETE FROM post_attendance WHERE post_id = $1 AND user_id = $2', [postId, userId]);
        }

        res.json({ success: true, message: '참석이 취소되었습니다.' });
    } catch (err) {
        console.error('Delete post attendance error:', err);
        res.status(500).json({ success: false, message: '참석 취소에 실패했습니다.' });
    }
});

/**
 * GET /api/posts/:id/attendance/summary
 * 참석 현황 요약 (참석/불참 수 + 내 상태)
 */
router.get('/:id/attendance/summary', authenticate, async (req, res) => {
    try {
        const { id: postId } = req.params;
        const userId = req.user.userId;

        const postResult = await query('SELECT linked_schedule_id FROM posts WHERE id = $1', [postId]);
        if (postResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        const linkedScheduleId = postResult.rows[0].linked_schedule_id;
        let tableName, fkColumn, fkValue;

        if (linkedScheduleId) {
            tableName = 'schedule_attendance';
            fkColumn = 'schedule_id';
            fkValue = linkedScheduleId;
        } else {
            tableName = 'post_attendance';
            fkColumn = 'post_id';
            fkValue = postId;
        }

        const [countResult, myResult] = await Promise.all([
            query(
                `SELECT status, COUNT(*) as count FROM ${tableName} WHERE ${fkColumn} = $1 GROUP BY status`,
                [fkValue]
            ),
            query(
                `SELECT status FROM ${tableName} WHERE ${fkColumn} = $1 AND user_id = $2`,
                [fkValue, userId]
            )
        ]);

        const counts = { attending: 0, not_attending: 0 };
        for (const row of countResult.rows) {
            counts[row.status] = parseInt(row.count);
        }

        res.json({
            success: true,
            data: {
                attending: counts.attending,
                not_attending: counts.not_attending,
                total: counts.attending + counts.not_attending,
                my_status: myResult.rows.length > 0 ? myResult.rows[0].status : null
            }
        });
    } catch (err) {
        console.error('Post attendance summary error:', err);
        res.status(500).json({ success: false, message: '참석 현황 조회에 실패했습니다.' });
    }
});

/**
 * GET /api/posts/:id/attendance/details
 * 참석 상세 목록 (참석자/불참자 명단)
 */
router.get('/:id/attendance/details', authenticate, async (req, res) => {
    try {
        const { id: postId } = req.params;

        const postResult = await query('SELECT linked_schedule_id FROM posts WHERE id = $1', [postId]);
        if (postResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        const linkedScheduleId = postResult.rows[0].linked_schedule_id;
        let tableName, fkColumn, fkValue;

        if (linkedScheduleId) {
            tableName = 'schedule_attendance';
            fkColumn = 'schedule_id';
            fkValue = linkedScheduleId;
        } else {
            tableName = 'post_attendance';
            fkColumn = 'post_id';
            fkValue = postId;
        }

        const result = await query(
            `SELECT a.status, a.responded_at,
                    u.id as user_id, u.name, u.profile_image
             FROM ${tableName} a
             LEFT JOIN users u ON a.user_id = u.id
             WHERE a.${fkColumn} = $1
             ORDER BY a.responded_at DESC`,
            [fkValue]
        );

        const attending = result.rows.filter(r => r.status === 'attending');
        const not_attending = result.rows.filter(r => r.status === 'not_attending');

        res.json({
            success: true,
            data: {
                attending,
                not_attending
            }
        });
    } catch (err) {
        console.error('Post attendance details error:', err);
        res.status(500).json({ success: false, message: '참석 상세 조회에 실패했습니다.' });
    }
});

module.exports = router;
