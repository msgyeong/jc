const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireMobilePermission, getMobilePermissions } = require('../middleware/mobileAdmin');

// 모든 라우트에 인증 필요
router.use(authenticate);

/* ======================================================
   GET /api/mobile-admin/pending-members
   가입 대기 회원 목록 (member_approve 권한)
   ====================================================== */
router.get('/pending-members', requireMobilePermission('member_approve'), async (req, res) => {
    try {
        const result = await query(
            `SELECT id, name, email, phone, created_at
             FROM users
             WHERE status = 'pending'
             ORDER BY created_at DESC`
        );
        res.json({
            success: true,
            data: {
                items: result.rows,
                total: result.rows.length
            }
        });
    } catch (err) {
        console.error('Get pending members error:', err);
        res.status(500).json({ success: false, message: '대기 회원 조회 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   POST /api/mobile-admin/members/:id/approve
   회원 승인 (member_approve 권한)
   ====================================================== */
router.post('/members/:id/approve', requireMobilePermission('member_approve'), async (req, res) => {
    try {
        const memberId = parseInt(req.params.id);
        const result = await query(
            `UPDATE users SET status = 'active', updated_at = NOW()
             WHERE id = $1 AND status = 'pending'
             RETURNING id, name, status`,
            [memberId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '대기 중인 회원을 찾을 수 없습니다.' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Approve member error:', err);
        res.status(500).json({ success: false, message: '회원 승인 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   POST /api/mobile-admin/members/:id/reject
   회원 거부 (member_approve 권한)
   ====================================================== */
router.post('/members/:id/reject', requireMobilePermission('member_approve'), async (req, res) => {
    try {
        const memberId = parseInt(req.params.id);
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, message: '거부 사유를 입력해주세요.' });
        }

        const result = await query(
            `UPDATE users SET status = 'rejected', rejection_reason = $2, updated_at = NOW()
             WHERE id = $1 AND status = 'pending'
             RETURNING id, name`,
            [memberId, reason]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '대기 중인 회원을 찾을 수 없습니다.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Reject member error:', err);
        res.status(500).json({ success: false, message: '회원 거부 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   PUT /api/mobile-admin/posts/:id
   게시글 수정 (post_manage 권한)
   ====================================================== */
router.put('/posts/:id', requireMobilePermission('post_manage'), async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
        }

        const result = await query(
            `UPDATE posts SET title = $2, content = $3, updated_at = NOW()
             WHERE id = $1 AND (deleted_at IS NULL)
             RETURNING id`,
            [postId, title, content]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Admin edit post error:', err);
        res.status(500).json({ success: false, message: '게시글 수정 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   DELETE /api/mobile-admin/posts/:id
   게시글 삭제 — soft delete (post_manage 권한)
   ====================================================== */
router.delete('/posts/:id', requireMobilePermission('post_manage'), async (req, res) => {
    try {
        const postId = parseInt(req.params.id);

        const result = await query(
            `UPDATE posts SET deleted_at = NOW(), updated_at = NOW()
             WHERE id = $1 AND (deleted_at IS NULL)
             RETURNING id`,
            [postId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete post error:', err);
        res.status(500).json({ success: false, message: '게시글 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   PUT /api/mobile-admin/schedules/:id
   일정 수정 (schedule_manage 권한)
   ====================================================== */
router.put('/schedules/:id', requireMobilePermission('schedule_manage'), async (req, res) => {
    try {
        const scheduleId = parseInt(req.params.id);
        const { title, description, start_date, end_date, location } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: '제목을 입력해주세요.' });
        }

        const result = await query(
            `UPDATE schedules SET title = $2, description = $3, start_date = $4, end_date = $5, location = $6, updated_at = NOW()
             WHERE id = $1 AND (deleted_at IS NULL)
             RETURNING id`,
            [scheduleId, title, description || null, start_date, end_date || null, location || null]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '일정을 찾을 수 없습니다.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Admin edit schedule error:', err);
        res.status(500).json({ success: false, message: '일정 수정 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   DELETE /api/mobile-admin/schedules/:id
   일정 삭제 — soft delete (schedule_manage 권한)
   ====================================================== */
router.delete('/schedules/:id', requireMobilePermission('schedule_manage'), async (req, res) => {
    try {
        const scheduleId = parseInt(req.params.id);

        const result = await query(
            `UPDATE schedules SET deleted_at = NOW(), updated_at = NOW()
             WHERE id = $1 AND (deleted_at IS NULL)
             RETURNING id`,
            [scheduleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '일정을 찾을 수 없습니다.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete schedule error:', err);
        res.status(500).json({ success: false, message: '일정 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   POST /api/mobile-admin/notices
   공지 작성 (notice_manage 권한)
   ====================================================== */
router.post('/notices', requireMobilePermission('notice_manage'), async (req, res) => {
    try {
        const { title, content, is_pinned } = req.body;
        const userId = req.user.userId;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
        }

        const result = await query(
            `INSERT INTO posts (title, content, category, author_id, is_pinned, created_at, updated_at)
             VALUES ($1, $2, 'notice', $3, $4, NOW(), NOW())
             RETURNING id`,
            [title, content, userId, is_pinned || false]
        );

        res.json({ success: true, data: { id: result.rows[0].id } });
    } catch (err) {
        console.error('Admin create notice error:', err);
        res.status(500).json({ success: false, message: '공지 작성 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   PUT /api/mobile-admin/notices/:id
   공지 수정 (notice_manage 권한)
   ====================================================== */
router.put('/notices/:id', requireMobilePermission('notice_manage'), async (req, res) => {
    try {
        const noticeId = parseInt(req.params.id);
        const { title, content, is_pinned } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
        }

        const result = await query(
            `UPDATE posts SET title = $2, content = $3, is_pinned = $4, updated_at = NOW()
             WHERE id = $1 AND category = 'notice' AND (deleted_at IS NULL)
             RETURNING id`,
            [noticeId, title, content, is_pinned !== undefined ? is_pinned : false]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '공지를 찾을 수 없습니다.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Admin edit notice error:', err);
        res.status(500).json({ success: false, message: '공지 수정 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   DELETE /api/mobile-admin/notices/:id
   공지 삭제 — soft delete (notice_manage 권한)
   ====================================================== */
router.delete('/notices/:id', requireMobilePermission('notice_manage'), async (req, res) => {
    try {
        const noticeId = parseInt(req.params.id);

        const result = await query(
            `UPDATE posts SET deleted_at = NOW(), updated_at = NOW()
             WHERE id = $1 AND category = 'notice' AND (deleted_at IS NULL)
             RETURNING id`,
            [noticeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '공지를 찾을 수 없습니다.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete notice error:', err);
        res.status(500).json({ success: false, message: '공지 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   POST /api/mobile-admin/push/send
   긴급 푸시 발송 (push_send 권한)
   ====================================================== */
router.post('/push/send', requireMobilePermission('push_send'), async (req, res) => {
    try {
        const { title, body, target, target_value, linked_post_id } = req.body;

        if (!title || !body) {
            return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
        }

        // 대상 구독자 조회
        let subscriptionQuery = `
            SELECT ps.endpoint, ps.p256dh, ps.auth_key
            FROM push_subscriptions ps
            JOIN users u ON u.id = ps.user_id
            WHERE u.status = 'active'
        `;
        const params = [];

        if (target === 'position' && target_value) {
            subscriptionQuery += ` AND u.position_id = $1`;
            params.push(target_value);
        } else if (target === 'department' && target_value) {
            subscriptionQuery += ` AND u.department = $1`;
            params.push(target_value);
        }

        const subsResult = await query(subscriptionQuery, params);
        const subscriptions = subsResult.rows;

        let sentCount = 0;
        let failedCount = 0;

        // web-push 모듈 사용
        try {
            const webpush = require('web-push');
            const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
            const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

            if (vapidPublicKey && vapidPrivateKey) {
                webpush.setVapidDetails(
                    'mailto:admin@jc.com',
                    vapidPublicKey,
                    vapidPrivateKey
                );

                const payload = JSON.stringify({
                    title,
                    body,
                    data: { post_id: linked_post_id || null }
                });

                for (const sub of subscriptions) {
                    try {
                        await webpush.sendNotification({
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth_key }
                        }, payload);
                        sentCount++;
                    } catch (e) {
                        failedCount++;
                    }
                }
            } else {
                failedCount = subscriptions.length;
            }
        } catch (e) {
            console.error('Push send error:', e);
            failedCount = subscriptions.length;
        }

        res.json({
            success: true,
            data: { sent_count: sentCount, failed_count: failedCount }
        });
    } catch (err) {
        console.error('Admin push send error:', err);
        res.status(500).json({ success: false, message: '푸시 발송 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
