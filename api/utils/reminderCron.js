const cron = require('node-cron');
const { query } = require('../config/database');
const { sendPushToUser } = require('./pushSender');

function startReminderCron() {
    // 매일 09:00 KST (UTC 00:00) 실행
    cron.schedule('0 0 * * *', async () => {
        console.log('[Reminder] D-1 리마인더 cron 실행:', new Date().toISOString());

        try {
            // 내일(KST 기준) 일정 조회
            const schedulesResult = await query(`
                SELECT id, title, start_date, location
                FROM schedules
                WHERE DATE(start_date AT TIME ZONE 'Asia/Seoul') = (CURRENT_DATE AT TIME ZONE 'Asia/Seoul' + INTERVAL '1 day')::date
            `);

            if (schedulesResult.rows.length === 0) {
                console.log('[Reminder] 내일 일정 없음');
                return;
            }

            // reminder_push ON인 전체 사용자 조회
            const usersResult = await query(`
                SELECT DISTINCT ps.user_id
                FROM push_subscriptions ps
                LEFT JOIN notification_settings ns ON ns.user_id = ps.user_id
                WHERE (ns.all_push IS NULL OR ns.all_push = true)
                  AND (ns.reminder_push IS NULL OR ns.reminder_push = true)
            `);

            for (const schedule of schedulesResult.rows) {
                const startDate = new Date(schedule.start_date);
                const timeStr = startDate.toLocaleTimeString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                const title = '\u23F0 \uB0B4\uC77C \uC77C\uC815';
                const body = `내일 ${timeStr} ${schedule.title}${schedule.location ? ' — ' + schedule.location : ''}`;

                for (const user of usersResult.rows) {
                    await sendPushToUser(user.user_id, {
                        title,
                        body: body.substring(0, 80),
                        data: { url: `/#schedules/${schedule.id}`, schedule_id: schedule.id },
                        type: 'N-03'
                    });
                }
            }

            console.log(`[Reminder] ${schedulesResult.rows.length}개 일정, ${usersResult.rows.length}명 발송 완료`);
        } catch (err) {
            console.error('[Reminder] cron 에러:', err.message);
        }
    }, { timezone: 'Asia/Seoul' });

    console.log('[Reminder] D-1 리마인더 cron 등록 (매일 09:00 KST)');
}

module.exports = { startReminderCron };
