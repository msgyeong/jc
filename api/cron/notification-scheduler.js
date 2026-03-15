const cron = require('node-cron');
const { query } = require('../config/database');
const { sendPushToAll } = require('../utils/pushSender');

/**
 * 예약 알림 스케줄러
 * - 5분마다 scheduled_notifications에서 발송 대기 알림을 조회
 * - scheduled_at <= NOW() AND status='pending' 인 항목을 발송
 */
function startNotificationScheduler() {
    // 5분마다 실행
    cron.schedule('*/5 * * * *', async () => {
        try {
            const result = await query(
                `SELECT sn.id, sn.post_id, sn.schedule_id, sn.notification_type,
                        p.title as post_title,
                        s.title as schedule_title
                 FROM scheduled_notifications sn
                 LEFT JOIN posts p ON sn.post_id = p.id
                 LEFT JOIN schedules s ON sn.schedule_id = s.id
                 WHERE sn.status = 'pending' AND sn.scheduled_at <= NOW()
                 ORDER BY sn.scheduled_at ASC
                 LIMIT 50`
            );

            if (result.rows.length === 0) return;

            console.log(`[NotifScheduler] ${result.rows.length}건 예약 알림 발송 시작`);

            for (const notif of result.rows) {
                try {
                    const title = notif.post_title || notif.schedule_title || '알림';
                    let pushTitle, pushBody, pushData;

                    if (notif.notification_type === 'immediate' || notif.notification_type === 'scheduled') {
                        pushTitle = '📢 새 알림';
                        pushBody = title.substring(0, 80);
                        pushData = notif.post_id
                            ? { url: `/#posts/${notif.post_id}`, post_id: notif.post_id }
                            : { url: `/#schedules/${notif.schedule_id}`, schedule_id: notif.schedule_id };
                    } else if (notif.notification_type.startsWith('d_day')) {
                        // d_day_7, d_day_3, d_day_1, d_day_0
                        const dayMap = { d_day_7: 'D-7', d_day_3: 'D-3', d_day_1: 'D-1', d_day_0: 'D-Day' };
                        const label = dayMap[notif.notification_type] || notif.notification_type;
                        pushTitle = `⏰ ${label} 일정 알림`;
                        pushBody = `${title}`.substring(0, 80);
                        pushData = notif.schedule_id
                            ? { url: `/#schedules/${notif.schedule_id}`, schedule_id: notif.schedule_id }
                            : { url: `/#posts/${notif.post_id}`, post_id: notif.post_id };
                    } else {
                        pushTitle = '📢 알림';
                        pushBody = title.substring(0, 80);
                        pushData = {};
                    }

                    await sendPushToAll({
                        title: pushTitle,
                        body: pushBody,
                        data: pushData,
                        type: 'N-SCHEDULED'
                    });

                    // 발송 완료 처리
                    await query(
                        `UPDATE scheduled_notifications SET status = 'sent', sent_at = NOW() WHERE id = $1`,
                        [notif.id]
                    );
                } catch (pushErr) {
                    console.error(`[NotifScheduler] 알림 ${notif.id} 발송 실패:`, pushErr.message);
                    // 실패해도 다음 알림 계속 처리
                }
            }

            console.log(`[NotifScheduler] ${result.rows.length}건 처리 완료`);
        } catch (err) {
            console.error('[NotifScheduler] cron 에러:', err.message);
        }
    });

    console.log('[NotifScheduler] 예약 알림 스케줄러 등록 (5분 간격)');
}

/**
 * 게시글 작성 시 push_setting에 따라 예약 알림 등록
 * @param {object} options
 * @param {number} options.postId
 * @param {number} options.scheduleId
 * @param {string} options.pushSetting - 'immediate' | 'scheduled' | 'd_day' | 'none'
 * @param {string} options.scheduledAt - ISO date string (pushSetting='scheduled' 일 때)
 * @param {string} options.eventDate - 일정 날짜 (pushSetting='d_day' 일 때)
 * @param {object} options.dDayOptions - D-day 개별 선택 {d7: true, d3: true, d1: false, d0: true}
 */
async function createScheduledNotifications({ postId, scheduleId, pushSetting, scheduledAt, eventDate, dDayOptions }) {
    if (!pushSetting || pushSetting === 'none') return;

    if (pushSetting === 'immediate') {
        await query(
            `INSERT INTO scheduled_notifications (post_id, schedule_id, notification_type, scheduled_at, status)
             VALUES ($1, $2, 'immediate', NOW(), 'pending')`,
            [postId || null, scheduleId || null]
        );
    } else if (pushSetting === 'scheduled' && scheduledAt) {
        await query(
            `INSERT INTO scheduled_notifications (post_id, schedule_id, notification_type, scheduled_at)
             VALUES ($1, $2, 'scheduled', $3)`,
            [postId || null, scheduleId || null, scheduledAt]
        );
    } else if (pushSetting === 'd_day' && eventDate) {
        // D-7, D-3, D-1, 당일(D-0) — 개별 선택 지원
        const allDDays = [
            { type: 'd_day_7', offset: -7, key: 'd7' },
            { type: 'd_day_3', offset: -3, key: 'd3' },
            { type: 'd_day_1', offset: -1, key: 'd1' },
            { type: 'd_day_0', offset: 0,  key: 'd0' },
        ];

        // dDayOptions가 있으면 선택된 항목만, 없으면 전체 등록
        const dDays = dDayOptions
            ? allDDays.filter(d => dDayOptions[d.key] === true)
            : allDDays;

        for (const d of dDays) {
            // 과거 날짜는 건너뜀
            await query(
                `INSERT INTO scheduled_notifications (post_id, schedule_id, notification_type, scheduled_at)
                 SELECT $1, $2, $3, ($4::date + $5 * INTERVAL '1 day' + INTERVAL '9 hours')
                 WHERE ($4::date + $5 * INTERVAL '1 day') >= CURRENT_DATE`,
                [postId || null, scheduleId || null, d.type, eventDate, d.offset]
            );
        }
    }
}

module.exports = { startNotificationScheduler, createScheduledNotifications };
