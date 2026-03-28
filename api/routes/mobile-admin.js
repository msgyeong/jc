const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireMobilePermission, getMobilePermissions } = require('../middleware/mobileAdmin');

// 모든 라우트에 인증 필요
router.use(authenticate);

/* ======================================================
   GET /pending-members
   가입 대기 회원 목록 (member_approve 권한)
   ====================================================== */
router.get('/pending-members', requireMobilePermission('member_approve'), async (req, res) => {
    try {
        // local_admin은 같은 로컬 대기 회원만
        const orgId = req.user.orgId;
        const isSuperAdmin = req.user.role === 'super_admin';
        let sql = `SELECT id, name, email, phone, created_at FROM users WHERE status = 'pending'`;
        const params = [];
        if (!isSuperAdmin && orgId) {
            params.push(orgId);
            sql += ` AND org_id = $${params.length}`;
        }
        sql += ` ORDER BY created_at DESC`;
        const result = await query(sql, params);
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
   POST /members/:id/approve
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
   POST /members/:id/reject
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
   PUT /members/:id/role
   회원 역할 변경 (member_approve 권한)
   local_admin은 member/local_admin만 할당 가능
   ====================================================== */
router.put('/members/:id/role', requireMobilePermission('member_approve'), async (req, res) => {
    try {
        const memberId = parseInt(req.params.id);
        const { role } = req.body;
        const callerRole = req.user.role;

        // 허용 역할 목록 — local_admin은 member/local_admin만, admin/super_admin은 추가로 admin 가능
        const allowedRoles = ['member', 'local_admin'];
        if (callerRole === 'admin' || callerRole === 'super_admin') {
            allowedRoles.push('admin');
        }

        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: '허용되지 않는 역할입니다.' });
        }

        // 대상 회원의 현재 역할 확인 — admin/super_admin은 변경 불가
        const current = await query('SELECT role FROM users WHERE id = $1', [memberId]);
        if (current.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }
        if (['admin', 'super_admin'].includes(current.rows[0].role) && callerRole !== 'super_admin') {
            return res.status(403).json({ success: false, message: '상위 관리자의 역할은 변경할 수 없습니다.' });
        }

        const result = await query(
            `UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1 RETURNING id, name, role`,
            [memberId, role]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Change member role error:', err);
        res.status(500).json({ success: false, message: '역할 변경 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   DELETE /posts/bulk  ← bulk 라우트를 :id 라우트보다 먼저 정의
   게시글 일괄 삭제 (post_manage 권한)
   FK CASCADE로 comments, likes, post_reads, post_attendance 등 자동 삭제
   ====================================================== */
router.delete('/posts/bulk', requireMobilePermission('post_manage'), async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: '삭제할 게시글 ID 배열을 입력해주세요.' });
        }

        const safeIds = ids.map(Number).filter(n => Number.isInteger(n) && n > 0);
        if (safeIds.length === 0) {
            return res.status(400).json({ success: false, message: '유효한 게시글 ID가 없습니다.' });
        }

        await transaction(async (client) => {
            // 연결 일정의 linked_post_id 해제
            await client.query(
                `UPDATE schedules SET linked_post_id = NULL WHERE linked_post_id = ANY($1)`,
                [safeIds]
            );
            // 게시글 삭제 (FK CASCADE로 관련 데이터 자동 삭제)
            await client.query(
                `UPDATE posts SET deleted_at = NOW() WHERE id = ANY($1)`,
                [safeIds]
            );
        });

        res.json({ success: true, deletedCount: safeIds.length });
    } catch (err) {
        console.error('Bulk delete posts error:', err);
        res.status(500).json({ success: false, message: '게시글 일괄 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   PUT /posts/:id
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
             WHERE id = $1
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
   DELETE /posts/:id
   게시글 삭제 (post_manage 권한)
   ====================================================== */
router.delete('/posts/:id', requireMobilePermission('post_manage'), async (req, res) => {
    try {
        const postId = parseInt(req.params.id);

        await transaction(async (client) => {
            await client.query(
                `UPDATE schedules SET linked_post_id = NULL WHERE linked_post_id = $1`,
                [postId]
            );
            await client.query('UPDATE posts SET deleted_at = NOW() WHERE id = $1', [postId]);
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete post error:', err);
        res.status(500).json({ success: false, message: '게시글 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   DELETE /schedules/bulk  ← bulk 라우트를 :id 라우트보다 먼저 정의
   일정 일괄 삭제 (schedule_manage 권한)
   FK CASCADE로 schedule_attendance, comments 등 자동 삭제
   ====================================================== */
router.delete('/schedules/bulk', requireMobilePermission('schedule_manage'), async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: '삭제할 일정 ID 배열을 입력해주세요.' });
        }

        const safeIds = ids.map(Number).filter(n => Number.isInteger(n) && n > 0);
        if (safeIds.length === 0) {
            return res.status(400).json({ success: false, message: '유효한 일정 ID가 없습니다.' });
        }

        await transaction(async (client) => {
            // 연결 게시글의 linked_schedule_id 해제
            await client.query(
                `UPDATE posts SET linked_schedule_id = NULL WHERE linked_schedule_id = ANY($1)`,
                [safeIds]
            );
            // 일정 삭제 (FK CASCADE로 관련 데이터 자동 삭제)
            await client.query(
                `UPDATE schedules SET deleted_at = NOW() WHERE id = ANY($1)`,
                [safeIds]
            );
        });

        res.json({ success: true, deletedCount: safeIds.length });
    } catch (err) {
        console.error('Bulk delete schedules error:', err);
        res.status(500).json({ success: false, message: '일정 일괄 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   PUT /schedules/:id
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
             WHERE id = $1
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
   DELETE /schedules/:id
   일정 삭제 (schedule_manage 권한)
   ====================================================== */
router.delete('/schedules/:id', requireMobilePermission('schedule_manage'), async (req, res) => {
    try {
        const scheduleId = parseInt(req.params.id);

        await transaction(async (client) => {
            await client.query(
                `UPDATE posts SET linked_schedule_id = NULL WHERE linked_schedule_id = $1`,
                [scheduleId]
            );
            await client.query('UPDATE schedules SET deleted_at = NOW() WHERE id = $1', [scheduleId]);
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete schedule error:', err);
        res.status(500).json({ success: false, message: '일정 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   GET /notices
   공지 목록 (notice_manage 권한)
   ====================================================== */
router.get('/notices', requireMobilePermission('notice_manage'), async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = parseInt(req.query.offset) || 0;

        const countResult = await query(
            `SELECT COUNT(*) FROM posts WHERE category = 'notice'`
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await query(
            `SELECT p.id, p.title, p.content, p.is_pinned, p.views, p.likes_count,
                    p.comments_count, p.created_at, p.updated_at,
                    u.name AS author_name
             FROM posts p
             LEFT JOIN users u ON u.id = p.author_id
             WHERE p.category = 'notice'
             ORDER BY p.is_pinned DESC, p.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: {
                items: result.rows,
                total,
                limit,
                offset
            }
        });
    } catch (err) {
        console.error('Get notices (admin-app) error:', err);
        res.status(500).json({ success: false, message: '공지 목록 조회 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   POST /notices
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
   DELETE /notices/bulk  ← bulk 라우트를 :id 라우트보다 먼저 정의
   공지 일괄 삭제 (notice_manage 권한)
   ====================================================== */
router.delete('/notices/bulk', requireMobilePermission('notice_manage'), async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: '삭제할 공지 ID 배열을 입력해주세요.' });
        }

        const safeIds = ids.map(Number).filter(n => Number.isInteger(n) && n > 0);
        if (safeIds.length === 0) {
            return res.status(400).json({ success: false, message: '유효한 공지 ID가 없습니다.' });
        }

        const result = await query(
            `UPDATE posts SET deleted_at = NOW() WHERE id = ANY($1) AND category = 'notice' RETURNING id`,
            [safeIds]
        );

        res.json({ success: true, deletedCount: result.rows.length });
    } catch (err) {
        console.error('Bulk delete notices error:', err);
        res.status(500).json({ success: false, message: '공지 일괄 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   PUT /notices/:id
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
             WHERE id = $1 AND category = 'notice'
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
   DELETE /notices/:id
   공지 삭제 (notice_manage 권한)
   ====================================================== */
router.delete('/notices/:id', requireMobilePermission('notice_manage'), async (req, res) => {
    try {
        const noticeId = parseInt(req.params.id);

        const result = await query(
            `UPDATE posts SET deleted_at = NOW() WHERE id = $1 AND category = 'notice' RETURNING id`,
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
   POST /push/send
   긴급 푸시 발송 (push_send 권한)
   - target: 'all' | 'selected'
   - userIds: [1,2,3] (target='selected' 시 필수)
   ====================================================== */
router.post('/push/send', requireMobilePermission('push_send'), async (req, res) => {
    try {
        const { title, body: pushBody, content, target, target_value, linked_post_id, userIds } = req.body;
        const msgBody = pushBody || content;

        if (!title || !msgBody) {
            return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
        }

        // 대상 구독자 조회
        let subscriptionQuery = `
            SELECT ps.endpoint, ps.p256dh, ps.auth, ps.user_id
            FROM push_subscriptions ps
            JOIN users u ON u.id = ps.user_id
            WHERE u.status = 'active'
        `;
        const params = [];
        let targetType = 'all';
        let targetUserIds = null;

        if (target === 'selected' && Array.isArray(userIds) && userIds.length > 0) {
            targetType = 'selected';
            targetUserIds = userIds.map(Number);
            subscriptionQuery += ` AND ps.user_id = ANY($1)`;
            params.push(targetUserIds);
        } else if (target === 'position' && target_value) {
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
                    body: msgBody,
                    data: { post_id: linked_post_id || null }
                });

                for (const sub of subscriptions) {
                    try {
                        await webpush.sendNotification({
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth }
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

        // 발송 이력 저장
        const targetCount = targetType === 'selected' ? (targetUserIds ? targetUserIds.length : 0) : subscriptions.length;
        const logStatus = (sentCount > 0 || subscriptions.length === 0) ? 'sent' : 'failed';
        try {
            await query(
                `INSERT INTO push_send_log (title, content, target_type, target_user_ids, target_count, sent_by, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [title, msgBody, targetType, targetUserIds, targetCount, req.user.userId, logStatus]
            );
        } catch (logErr) {
            console.error('Push log save error:', logErr);
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

/* ======================================================
   GET /push-log
   푸시 발송 이력 조회 (push_send 권한)
   ====================================================== */
router.get('/push-log', requireMobilePermission('push_send'), async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = parseInt(req.query.offset) || 0;

        const countResult = await query('SELECT COUNT(*) FROM push_send_log');
        const total = parseInt(countResult.rows[0].count);

        const result = await query(
            `SELECT pl.id, pl.title, pl.content, pl.target_type, pl.target_user_ids,
                    pl.target_count, pl.sent_at, pl.status,
                    u.name AS sent_by_name
             FROM push_send_log pl
             LEFT JOIN users u ON u.id = pl.sent_by
             ORDER BY pl.sent_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: {
                items: result.rows,
                total,
                limit,
                offset
            }
        });
    } catch (err) {
        console.error('Get push log error:', err);
        res.status(500).json({ success: false, message: '푸시 이력 조회 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   GET /members-simple
   푸시 대상 선택용 간단 회원 목록 (push_send 권한)
   ====================================================== */
router.get('/members-simple', requireMobilePermission('push_send'), async (req, res) => {
    try {
        const result = await query(
            `SELECT u.id, u.name, u.phone, p.name AS position_name
             FROM users u
             LEFT JOIN positions p ON p.id = u.position_id
             WHERE u.status = 'active'
             ORDER BY u.name`
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Get simple members error:', err);
        res.status(500).json({ success: false, message: '회원 목록 조회 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
