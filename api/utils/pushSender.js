const webpush = require('web-push');
const { query } = require('../config/database');

// VAPID 설정
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@ydpjc.org';

let vapidConfigured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
} else {
    console.warn('[Push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY 환경변수 미설정 — 푸시 발송 비활성');
}

// 알림 유형 → notification_settings 컬럼 매핑
const TYPE_TO_SETTING = {
    'N-01': 'notice_push',
    'N-02': 'schedule_push',
    'N-03': 'reminder_push',
    'N-04': 'schedule_push',
    'N-05': 'comment_push',
};

/**
 * 특정 사용자에게 푸시 발송
 */
async function sendPushToUser(userId, { title, body, data, type }) {
    if (!vapidConfigured) return;

    try {
        // 알림 설정 확인
        const settingCol = TYPE_TO_SETTING[type];
        if (settingCol) {
            const settingsResult = await query(
                `SELECT all_push, ${settingCol} FROM notification_settings WHERE user_id = $1`,
                [userId]
            );
            if (settingsResult.rows.length > 0) {
                const settings = settingsResult.rows[0];
                if (!settings.all_push || !settings[settingCol]) return;
            }
            // 설정 행이 없으면 기본값(전부 true)으로 발송
        }

        // 구독 정보 조회
        const subsResult = await query(
            'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
            [userId]
        );

        const payload = JSON.stringify({ title, body, data, type });

        for (const sub of subsResult.rows) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload
                );
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
                } else {
                    console.error(`[Push] 발송 실패 (user=${userId}, sub=${sub.id}):`, err.message);
                }
            }
        }

        // notification_log 기록
        await query(
            `INSERT INTO notification_log (user_id, type, title, body, data) VALUES ($1, $2, $3, $4, $5)`,
            [userId, type, title, body || null, data ? JSON.stringify(data) : null]
        );
    } catch (err) {
        console.error('[Push] sendPushToUser 에러:', err.message);
    }
}

/**
 * 전체 회원에게 푸시 발송 (excludeUserId 제외)
 */
async function sendPushToAll({ title, body, data, type }, excludeUserId) {
    if (!vapidConfigured) return;

    try {
        const settingCol = TYPE_TO_SETTING[type];

        // 발송 대상 조회: 해당 알림 유형 ON인 사용자의 구독 정보
        let usersQuery;
        let usersParams;

        if (settingCol) {
            usersQuery = `
                SELECT DISTINCT ps.user_id
                FROM push_subscriptions ps
                LEFT JOIN notification_settings ns ON ns.user_id = ps.user_id
                WHERE (ns.all_push IS NULL OR ns.all_push = true)
                  AND (ns.${settingCol} IS NULL OR ns.${settingCol} = true)
            `;
        } else {
            usersQuery = 'SELECT DISTINCT user_id FROM push_subscriptions';
        }

        if (excludeUserId) {
            usersQuery += ` AND ps.user_id != $1`;
            usersParams = [excludeUserId];
        } else {
            usersParams = [];
        }

        const usersResult = await query(usersQuery, usersParams);

        for (const row of usersResult.rows) {
            // 구독 정보 조회
            const subsResult = await query(
                'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
                [row.user_id]
            );

            const payload = JSON.stringify({ title, body, data, type });

            for (const sub of subsResult.rows) {
                try {
                    await webpush.sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        payload
                    );
                } catch (err) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
                    } else {
                        console.error(`[Push] 발송 실패 (user=${row.user_id}, sub=${sub.id}):`, err.message);
                    }
                }
            }

            // notification_log 기록
            await query(
                `INSERT INTO notification_log (user_id, type, title, body, data) VALUES ($1, $2, $3, $4, $5)`,
                [row.user_id, type, title, body || null, data ? JSON.stringify(data) : null]
            );
        }

        // excludeUserId 제외된 사용자 중 설정 OFF인 사용자도 notification_log는 남김 (알림 센터용)
        // → 설정 OFF 사용자에게는 이미 쿼리에서 제외됨. 의도적으로 log도 미기록.
    } catch (err) {
        console.error('[Push] sendPushToAll 에러:', err.message);
    }
}

module.exports = { sendPushToUser, sendPushToAll, VAPID_PUBLIC_KEY };
