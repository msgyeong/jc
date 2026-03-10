const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * POST /api/attendance
 * 투표 설정 생성 (관리자/공지권한자)
 */
router.post('/', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { schedule_id, vote_type, deadline, quorum_count, quorum_basis, cost_per_person } = req.body;

        if (!schedule_id) {
            return res.status(400).json({ success: false, message: 'schedule_id는 필수입니다.' });
        }

        // 일정 존재 확인
        const scheduleCheck = await query('SELECT id FROM schedules WHERE id = $1', [schedule_id]);
        if (scheduleCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: '해당 일정을 찾을 수 없습니다.' });
        }

        const result = await query(
            `INSERT INTO attendance_config (schedule_id, vote_type, deadline, quorum_count, quorum_basis, cost_per_person, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [schedule_id, vote_type || 'general', deadline || null, quorum_count || null, quorum_basis || null, cost_per_person || null, req.user.userId]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: '이 일정에는 이미 투표 설정이 있습니다.' });
        }
        console.error('Create attendance config error:', error);
        res.status(500).json({ success: false, message: '투표 설정 생성 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/attendance/:configId
 * 투표 설정 수정 (관리자)
 */
router.put('/:configId', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { configId } = req.params;
        const { vote_type, deadline, quorum_count, quorum_basis, cost_per_person, is_active } = req.body;

        const result = await query(
            `UPDATE attendance_config
             SET vote_type = COALESCE($1, vote_type),
                 deadline = COALESCE($2, deadline),
                 quorum_count = $3,
                 quorum_basis = $4,
                 cost_per_person = $5,
                 is_active = COALESCE($6, is_active),
                 updated_at = NOW()
             WHERE id = $7
             RETURNING *`,
            [vote_type, deadline, quorum_count || null, quorum_basis || null, cost_per_person || null, is_active, configId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '투표 설정을 찾을 수 없습니다.' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Update attendance config error:', error);
        res.status(500).json({ success: false, message: '투표 설정 수정 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/attendance/:scheduleId
 * 투표 현황 조회 (요약 + 본인 투표)
 */
router.get('/:scheduleId', authenticate, async (req, res) => {
    try {
        const { scheduleId } = req.params;

        // 투표 설정 조회
        const configResult = await query(
            'SELECT * FROM attendance_config WHERE schedule_id = $1',
            [scheduleId]
        );

        if (configResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '이 일정에 투표 설정이 없습니다.' });
        }

        const config = configResult.rows[0];

        // 마감 여부 판단
        const isClosed = config.closed_at || (config.deadline && new Date(config.deadline) < new Date());

        // 투표 집계
        const summaryResult = await query(
            `SELECT vote, COUNT(*)::int as count
             FROM attendance_votes WHERE config_id = $1
             GROUP BY vote`,
            [config.id]
        );

        const summary = { attend: 0, absent: 0, undecided: 0 };
        summaryResult.rows.forEach(r => { summary[r.vote] = r.count; });

        // 전체 활성 회원 수
        const totalResult = await query("SELECT COUNT(*)::int as count FROM users WHERE status = 'active'");
        const totalMembers = totalResult.rows[0].count;
        summary.no_response = totalMembers - summary.attend - summary.absent - summary.undecided;

        // 본인 투표 상태
        const myVoteResult = await query(
            'SELECT vote, voted_at FROM attendance_votes WHERE config_id = $1 AND user_id = $2',
            [config.id, req.user.userId]
        );

        res.json({
            success: true,
            data: {
                config: { ...config, is_closed: isClosed },
                summary,
                my_vote: myVoteResult.rows[0] || null,
                total_members: totalMembers
            }
        });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ success: false, message: '투표 현황 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * POST /api/attendance/:configId/vote
 * 투표하기 (UPSERT)
 */
router.post('/:configId/vote', authenticate, async (req, res) => {
    try {
        const { configId } = req.params;
        const { vote } = req.body;

        if (!vote || !['attend', 'absent', 'undecided'].includes(vote)) {
            return res.status(400).json({ success: false, message: 'vote는 attend, absent, undecided 중 하나여야 합니다.' });
        }

        // 투표 설정 확인 + 마감 체크
        const configResult = await query('SELECT * FROM attendance_config WHERE id = $1', [configId]);
        if (configResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '투표 설정을 찾을 수 없습니다.' });
        }

        const config = configResult.rows[0];
        if (!config.is_active || config.closed_at || (config.deadline && new Date(config.deadline) < new Date())) {
            return res.status(400).json({ success: false, message: '마감된 투표입니다.' });
        }

        // UPSERT
        const result = await query(
            `INSERT INTO attendance_votes (config_id, user_id, vote)
             VALUES ($1, $2, $3)
             ON CONFLICT (config_id, user_id)
             DO UPDATE SET vote = $3, updated_at = NOW()
             RETURNING *`,
            [configId, req.user.userId, vote]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ success: false, message: '투표 처리 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/attendance/:configId/results
 * 투표 결과 상세 (참석자/불참자/미정/미응답 목록)
 */
router.get('/:configId/results', authenticate, async (req, res) => {
    try {
        const { configId } = req.params;

        // 투표 설정 확인
        const configResult = await query('SELECT * FROM attendance_config WHERE id = $1', [configId]);
        if (configResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '투표 설정을 찾을 수 없습니다.' });
        }

        // 투표한 회원 목록
        const votesResult = await query(
            `SELECT av.vote, av.voted_at, u.id as member_id, u.name, u.position, u.company
             FROM attendance_votes av
             JOIN users u ON u.id = av.user_id
             WHERE av.config_id = $1
             ORDER BY av.vote, u.name`,
            [configId]
        );

        // 카테고리별 분류
        const attend = [], absent = [], undecided = [];
        const votedUserIds = new Set();
        votesResult.rows.forEach(r => {
            votedUserIds.add(r.member_id);
            const item = { member_id: r.member_id, name: r.name, position: r.position, company: r.company, voted_at: r.voted_at };
            if (r.vote === 'attend') attend.push(item);
            else if (r.vote === 'absent') absent.push(item);
            else undecided.push(item);
        });

        // 미응답자
        const allMembers = await query("SELECT id, name, position, company FROM users WHERE status = 'active' ORDER BY name");
        const no_response = allMembers.rows
            .filter(m => !votedUserIds.has(m.id))
            .map(m => ({ member_id: m.id, name: m.name, position: m.position, company: m.company }));

        res.json({
            success: true,
            data: { attend, absent, undecided, no_response }
        });
    } catch (error) {
        console.error('Get vote results error:', error);
        res.status(500).json({ success: false, message: '투표 결과 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * POST /api/attendance/:configId/close
 * 투표 조기 마감 (관리자)
 */
router.post('/:configId/close', authenticate, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { configId } = req.params;

        const result = await query(
            `UPDATE attendance_config SET is_active = false, closed_at = NOW(), updated_at = NOW()
             WHERE id = $1 RETURNING *`,
            [configId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '투표 설정을 찾을 수 없습니다.' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Close vote error:', error);
        res.status(500).json({ success: false, message: '투표 마감 처리 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
