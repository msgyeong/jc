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

        // --- N-06: 생일 알림 ---
        try {
            const now = new Date();
            const kstMonth = parseInt(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul', month: 'numeric' }));
            const kstDay = parseInt(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul', day: 'numeric' }));

            const birthdayResult = await query(
                `SELECT id, name FROM users
                 WHERE EXTRACT(MONTH FROM birth_date) = $1
                   AND EXTRACT(DAY FROM birth_date) = $2
                   AND status = 'active'
                   AND birth_date IS NOT NULL`,
                [kstMonth, kstDay]
            );

            if (birthdayResult.rows.length === 0) {
                console.log('[Birthday] 오늘 생일 회원 없음');
            } else {
                // birthday_push ON인 전체 사용자 조회
                const birthdayUsersResult = await query(`
                    SELECT DISTINCT ps.user_id
                    FROM push_subscriptions ps
                    LEFT JOIN notification_settings ns ON ns.user_id = ps.user_id
                    WHERE (ns.all_push IS NULL OR ns.all_push = true)
                      AND (ns.birthday_push IS NULL OR ns.birthday_push = true)
                `);

                for (const bday of birthdayResult.rows) {
                    for (const user of birthdayUsersResult.rows) {
                        // 생일 당사자 본인 제외
                        if (user.user_id === bday.id) continue;
                        await sendPushToUser(user.user_id, {
                            title: '\uD83C\uDF82 \uC624\uB298 \uC0DD\uC77C',
                            body: `오늘은 ${bday.name}님의 생일입니다! 축하 메시지를 보내보세요`,
                            data: { url: `/#members/${bday.id}`, member_id: bday.id },
                            type: 'N-06'
                        });
                    }
                }
                console.log(`[Birthday] ${birthdayResult.rows.length}명 생일 알림 발송 완료`);
            }
        } catch (err) {
            console.error('[Birthday] cron 에러:', err.message);
        }
    }, { timezone: 'Asia/Seoul' });

    console.log('[Reminder] D-1 리마인더 + 생일 알림 cron 등록 (매일 09:00 KST)');
}

module.exports = { startReminderCron };
