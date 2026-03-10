const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { VAPID_PUBLIC_KEY } = require('../utils/pushSender');

// ==================== 푸시 구독 (/api/push) ====================

const pushRouter = express.Router();

/**
 * GET /api/push/vapid-key
 * VAPID 공개키 반환 (프론트에서 구독 시 필요)
 */
pushRouter.get('/vapid-key', (req, res) => {
    if (!VAPID_PUBLIC_KEY) {
        return res.status(503).json({
            success: false,
            message: '푸시 알림이 설정되지 않았습니다.'
        });
    }
    res.json({ success: true, data: { vapidPublicKey: VAPID_PUBLIC_KEY } });
});

/**
 * POST /api/push/subscribe
 * 푸시 구독 등록
 */
pushRouter.post('/subscribe', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { subscription } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({
                success: false,
                message: 'subscription 정보가 올바르지 않습니다.'
            });
        }

        const { endpoint, keys } = subscription;
        if (!keys.p256dh || !keys.auth) {
            return res.status(400).json({
                success: false,
                message: 'p256dh, auth 키가 필요합니다.'
            });
        }

        // endpoint URL 형식 검증
        try {
            new URL(endpoint);
        } catch (_) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 endpoint URL입니다.'
            });
        }

        const userAgent = req.headers['user-agent'] || null;

        await query(
            `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4, user_agent = $5, created_at = NOW()`,
            [userId, endpoint, keys.p256dh, keys.auth, userAgent]
        );

        // 알림 설정 기본행 생성 (없으면)
        await query(
            `INSERT INTO notification_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );

        res.json({ success: true, message: '푸시 구독이 등록되었습니다.' });
    } catch (err) {
        console.error('Push subscribe error:', err);
        res.status(500).json({ success: false, message: '푸시 구독 등록에 실패했습니다.' });
    }
});

/**
 * DELETE /api/push/subscribe
 * 푸시 구독 해제
 */
pushRouter.delete('/subscribe', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({
                success: false,
                message: 'endpoint가 필요합니다.'
            });
        }

        await query(
            'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
            [userId, endpoint]
        );

        res.json({ success: true, message: '푸시 구독이 해제되었습니다.' });
    } catch (err) {
        console.error('Push unsubscribe error:', err);
        res.status(500).json({ success: false, message: '푸시 구독 해제에 실패했습니다.' });
    }
});

// ==================== 알림 설정/내역 (/api/notifications) ====================

/**
 * GET /api/notifications/settings
 * 알림 설정 조회
 */
router.get('/settings', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await query(
            'SELECT all_push, notice_push, schedule_push, reminder_push, comment_push FROM notification_settings WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            // 기본값 반환
            return res.json({
                success: true,
                data: {
                    all_push: true,
                    notice_push: true,
                    schedule_push: true,
                    reminder_push: true,
                    comment_push: true
                }
            });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Get notification settings error:', err);
        res.status(500).json({ success: false, message: '알림 설정 조회에 실패했습니다.' });
    }
});

/**
 * PUT /api/notifications/settings
 * 알림 설정 변경
 */
router.put('/settings', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { all_push, notice_push, schedule_push, reminder_push, comment_push } = req.body;

        await query(
            `INSERT INTO notification_settings (user_id, all_push, notice_push, schedule_push, reminder_push, comment_push, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
                all_push = COALESCE($2, notification_settings.all_push),
                notice_push = COALESCE($3, notification_settings.notice_push),
                schedule_push = COALESCE($4, notification_settings.schedule_push),
                reminder_push = COALESCE($5, notification_settings.reminder_push),
                comment_push = COALESCE($6, notification_settings.comment_push),
                updated_at = NOW()`,
            [userId, all_push, notice_push, schedule_push, reminder_push, comment_push]
        );

        res.json({ success: true, message: '알림 설정이 변경되었습니다.' });
    } catch (err) {
        console.error('Update notification settings error:', err);
        res.status(500).json({ success: false, message: '알림 설정 변경에 실패했습니다.' });
    }
});

/**
 * GET /api/notifications
 * 알림 내역 조회 (페이지네이션)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const countResult = await query(
            'SELECT COUNT(*) FROM notification_log WHERE user_id = $1',
            [userId]
        );
        const total = parseInt(countResult.rows[0].count);

        const unreadResult = await query(
            'SELECT COUNT(*) FROM notification_log WHERE user_id = $1 AND read_at IS NULL',
            [userId]
        );
        const unread_count = parseInt(unreadResult.rows[0].count);

        const result = await query(
            `SELECT id, type, title, body, data, sent_at, read_at
             FROM notification_log
             WHERE user_id = $1
             ORDER BY sent_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        res.json({
            success: true,
            data: {
                items: result.rows,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                unread_count
            }
        });
    } catch (err) {
        console.error('Get notifications error:', err);
        res.status(500).json({ success: false, message: '알림 내역 조회에 실패했습니다.' });
    }
});

/**
 * POST /api/notifications/:id/read
 * 알림 읽음 처리
 */
router.post('/:id/read', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const result = await query(
            'UPDATE notification_log SET read_at = NOW() WHERE id = $1 AND user_id = $2 AND read_at IS NULL RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '알림을 찾을 수 없거나 이미 읽음 처리되었습니다.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Mark notification read error:', err);
        res.status(500).json({ success: false, message: '읽음 처리에 실패했습니다.' });
    }
});

/**
 * POST /api/notifications/read-all
 * 모든 알림 읽음 처리
 */
router.post('/read-all', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await query(
            'UPDATE notification_log SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
            [userId]
        );

        res.json({ success: true, data: { updated: result.rowCount } });
    } catch (err) {
        console.error('Mark all notifications read error:', err);
        res.status(500).json({ success: false, message: '모두 읽음 처리에 실패했습니다.' });
    }
});

module.exports = { notificationsRouter: router, pushRouter };
