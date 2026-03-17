const express = require('express');
const router = express.Router();
const multer = require('multer');
const { query, transaction } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

// Multer: memoryStorage, PDF only, max 20MB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('PDF 파일만 업로드 가능합니다.'));
        }
        cb(null, true);
    }
});

/**
 * 관리자 여부 확인
 */
function isAdmin(role) {
    return role && ['admin', 'super_admin'].includes(role);
}

// ============================================================
// 정적 경로 (/:id 보다 먼저 등록해야 함)
// ============================================================

/**
 * GET /api/meetings/minutes/:minuteId
 * 회의록 PDF 다운로드/보기
 */
router.get('/minutes/:minuteId', authenticate, async (req, res) => {
    try {
        const minuteId = parseInt(req.params.minuteId);
        if (isNaN(minuteId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 회의록 ID입니다.' });
        }

        const result = await query(
            'SELECT * FROM meeting_minutes WHERE id = $1',
            [minuteId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: '회의록을 찾을 수 없습니다.' });
        }

        const minute = result.rows[0];

        res.set({
            'Content-Type': minute.mime_type || 'application/pdf',
            'Content-Disposition': `inline; filename="${encodeURIComponent(minute.file_name || 'meeting-minutes.pdf')}"`,
            'Content-Length': minute.file_size
        });

        return res.send(minute.file_data);
    } catch (error) {
        console.error('회의록 다운로드 오류:', error);
        return res.status(500).json({
            success: false,
            error: '회의록을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// ============================================================
// 회의 CRUD
// ============================================================

/**
 * GET /api/meetings
 * 회의 목록 조회 (페이지네이션)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status; // optional filter
        const meetingType = req.query.type; // optional filter

        let whereClause = '';
        const params = [];
        const conditions = [];

        if (status) {
            params.push(status);
            conditions.push(`m.status = $${params.length}`);
        }
        if (meetingType) {
            params.push(meetingType);
            conditions.push(`m.meeting_type = $${params.length}`);
        }

        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }

        // Count
        const countResult = await query(
            `SELECT COUNT(*) FROM meetings m ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // List
        const listParams = [...params];
        listParams.push(limit, offset);
        const limitIdx = listParams.length - 1;
        const offsetIdx = listParams.length;

        const result = await query(
            `SELECT
                m.id, m.title, m.description, m.meeting_type,
                m.meeting_date, m.location, m.status,
                m.created_at, m.updated_at,
                u.id as creator_id, u.name as creator_name,
                (SELECT COUNT(*) FROM meeting_attendance ma WHERE ma.meeting_id = m.id AND ma.status = 'attending') as attendee_count,
                (SELECT COUNT(*) FROM meeting_votes mv WHERE mv.meeting_id = m.id) as vote_count
             FROM meetings m
             LEFT JOIN users u ON m.created_by = u.id
             ${whereClause}
             ORDER BY m.meeting_date DESC
             LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
            listParams
        );

        return res.json({
            success: true,
            data: {
                items: result.rows,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('회의 목록 조회 오류:', error);
        return res.status(500).json({
            success: false,
            error: '회의 목록을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/meetings
 * 회의 생성 (관리자만)
 */
router.post('/', authenticate, async (req, res) => {
    try {
        if (!isAdmin(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: '관리자만 회의를 생성할 수 있습니다.'
            });
        }

        const { title, description, meeting_type, meeting_date, location } = req.body;

        if (!title || !meeting_date) {
            return res.status(400).json({
                success: false,
                error: '제목과 회의 일시는 필수 입력 항목입니다.'
            });
        }

        const allowedTypes = ['regular', 'board', 'general_assembly'];
        const type = allowedTypes.includes(meeting_type) ? meeting_type : 'regular';

        const result = await query(
            `INSERT INTO meetings (title, description, meeting_type, meeting_date, location, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [title, description || null, type, meeting_date, location || null, req.user.userId]
        );

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('회의 생성 오류:', error);
        return res.status(500).json({
            success: false,
            error: '회의를 생성하는 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/meetings/:id
 * 회의 상세 조회 (참석 + 투표 포함)
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        if (isNaN(meetingId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 회의 ID입니다.' });
        }

        // 회의 기본 정보
        const meetingResult = await query(
            `SELECT m.*, u.name as creator_name
             FROM meetings m
             LEFT JOIN users u ON m.created_by = u.id
             WHERE m.id = $1`,
            [meetingId]
        );

        if (meetingResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: '회의를 찾을 수 없습니다.' });
        }

        const meeting = meetingResult.rows[0];

        // 참석 현황
        const attendanceResult = await query(
            `SELECT ma.*, u.name as user_name, u.profile_image
             FROM meeting_attendance ma
             LEFT JOIN users u ON ma.user_id = u.id
             WHERE ma.meeting_id = $1
             ORDER BY ma.checked_in_at DESC NULLS LAST`,
            [meetingId]
        );

        // 투표 목록
        const votesResult = await query(
            `SELECT mv.*, u.name as creator_name,
                (SELECT COUNT(*) FROM meeting_vote_responses mvr WHERE mvr.vote_id = mv.id) as response_count
             FROM meeting_votes mv
             LEFT JOIN users u ON mv.created_by = u.id
             WHERE mv.meeting_id = $1
             ORDER BY mv.created_at DESC`,
            [meetingId]
        );

        // 회의록 목록 (파일 데이터 제외)
        const minutesResult = await query(
            `SELECT id, meeting_id, title, file_name, file_size, mime_type, uploaded_by, created_at
             FROM meeting_minutes
             WHERE meeting_id = $1
             ORDER BY created_at DESC`,
            [meetingId]
        );

        // 투표별 결과 집계
        const votesWithResults = await Promise.all(votesResult.rows.map(async (vote) => {
            const respResult = await query(
                'SELECT selected_option, COUNT(*) as cnt FROM meeting_vote_responses WHERE vote_id = $1 GROUP BY selected_option',
                [vote.id]
            );
            const results = {};
            const options = vote.options || [];
            options.forEach(opt => { results[opt] = 0; });
            respResult.rows.forEach(r => { results[r.selected_option] = parseInt(r.cnt); });

            // 현재 사용자의 투표 확인
            const myVoteResult = await query(
                'SELECT selected_option FROM meeting_vote_responses WHERE vote_id = $1 AND user_id = $2',
                [vote.id, req.user.userId]
            );
            return {
                ...vote,
                results,
                my_vote: myVoteResult.rows.length > 0 ? myVoteResult.rows[0].selected_option : null
            };
        }));

        return res.json({
            success: true,
            data: {
                ...meeting,
                attendance: attendanceResult.rows,
                votes: votesWithResults,
                minutes: minutesResult.rows
            }
        });
    } catch (error) {
        console.error('회의 상세 조회 오류:', error);
        return res.status(500).json({
            success: false,
            error: '회의 정보를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/meetings/:id
 * 회의 수정 (관리자 또는 작성자)
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        if (isNaN(meetingId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 회의 ID입니다.' });
        }

        // 권한 확인: 관리자이거나 작성자
        const existing = await query('SELECT * FROM meetings WHERE id = $1', [meetingId]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, error: '회의를 찾을 수 없습니다.' });
        }

        if (!isAdmin(req.user.role) && existing.rows[0].created_by !== req.user.userId) {
            return res.status(403).json({ success: false, error: '수정 권한이 없습니다.' });
        }

        const { title, description, meeting_type, meeting_date, location, status } = req.body;

        const allowedTypes = ['regular', 'board', 'general_assembly'];
        const allowedStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];

        const updates = [];
        const params = [];
        let paramIdx = 0;

        if (title !== undefined) {
            paramIdx++;
            updates.push(`title = $${paramIdx}`);
            params.push(title);
        }
        if (description !== undefined) {
            paramIdx++;
            updates.push(`description = $${paramIdx}`);
            params.push(description);
        }
        if (meeting_type !== undefined && allowedTypes.includes(meeting_type)) {
            paramIdx++;
            updates.push(`meeting_type = $${paramIdx}`);
            params.push(meeting_type);
        }
        if (meeting_date !== undefined) {
            paramIdx++;
            updates.push(`meeting_date = $${paramIdx}`);
            params.push(meeting_date);
        }
        if (location !== undefined) {
            paramIdx++;
            updates.push(`location = $${paramIdx}`);
            params.push(location);
        }
        if (status !== undefined && allowedStatuses.includes(status)) {
            paramIdx++;
            updates.push(`status = $${paramIdx}`);
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: '수정할 항목이 없습니다.' });
        }

        paramIdx++;
        updates.push(`updated_at = NOW()`);
        params.push(meetingId);

        const result = await query(
            `UPDATE meetings SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
            params
        );

        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('회의 수정 오류:', error);
        return res.status(500).json({
            success: false,
            error: '회의를 수정하는 중 오류가 발생했습니다.'
        });
    }
});

/**
 * DELETE /api/meetings/:id
 * 회의 삭제 (관리자 또는 작성자)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        if (isNaN(meetingId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 회의 ID입니다.' });
        }

        const existing = await query('SELECT * FROM meetings WHERE id = $1', [meetingId]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, error: '회의를 찾을 수 없습니다.' });
        }

        if (!isAdmin(req.user.role) && existing.rows[0].created_by !== req.user.userId) {
            return res.status(403).json({ success: false, error: '삭제 권한이 없습니다.' });
        }

        await query('DELETE FROM meetings WHERE id = $1', [meetingId]);

        return res.json({
            success: true,
            data: { message: '회의가 삭제되었습니다.' }
        });
    } catch (error) {
        console.error('회의 삭제 오류:', error);
        return res.status(500).json({
            success: false,
            error: '회의를 삭제하는 중 오류가 발생했습니다.'
        });
    }
});

// ============================================================
// 회의 참석
// ============================================================

/**
 * POST /api/meetings/:id/attend
 * 참석 상태 등록/변경
 */
router.post('/:id/attend', authenticate, async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        if (isNaN(meetingId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 회의 ID입니다.' });
        }

        const { status } = req.body;
        const allowedStatuses = ['attending', 'absent'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: '참석 상태는 attending 또는 absent 중 하나여야 합니다.'
            });
        }

        // 회의 존재 확인
        const meetingResult = await query('SELECT id, status FROM meetings WHERE id = $1', [meetingId]);
        if (meetingResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: '회의를 찾을 수 없습니다.' });
        }

        const checkedInAt = status === 'attending' ? new Date() : null;

        const result = await query(
            `INSERT INTO meeting_attendance (meeting_id, user_id, status, checked_in_at)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (meeting_id, user_id)
             DO UPDATE SET status = $3, checked_in_at = $4
             RETURNING *`,
            [meetingId, req.user.userId, status, checkedInAt]
        );

        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('참석 등록 오류:', error);
        return res.status(500).json({
            success: false,
            error: '참석 상태를 변경하는 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/meetings/:id/attendance
 * 참석 현황 조회
 */
router.get('/:id/attendance', authenticate, async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        if (isNaN(meetingId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 회의 ID입니다.' });
        }

        const result = await query(
            `SELECT ma.*, u.name as user_name, u.profile_image, u.email
             FROM meeting_attendance ma
             LEFT JOIN users u ON ma.user_id = u.id
             WHERE ma.meeting_id = $1
             ORDER BY ma.status ASC, u.name ASC`,
            [meetingId]
        );

        const summary = {
            attending: result.rows.filter(r => r.status === 'attending').length,
            absent: result.rows.filter(r => r.status === 'absent').length,
            pending: result.rows.filter(r => r.status === 'pending').length,
            total: result.rows.length
        };

        return res.json({
            success: true,
            data: {
                items: result.rows,
                summary
            }
        });
    } catch (error) {
        console.error('참석 현황 조회 오류:', error);
        return res.status(500).json({
            success: false,
            error: '참석 현황을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// ============================================================
// 회의 투표
// ============================================================

/**
 * POST /api/meetings/:id/votes
 * 투표 주제 생성 (관리자만)
 */
router.post('/:id/votes', authenticate, async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        if (isNaN(meetingId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 회의 ID입니다.' });
        }

        if (!isAdmin(req.user.role)) {
            return res.status(403).json({ success: false, error: '관리자만 투표를 생성할 수 있습니다.' });
        }

        // 회의 존재 확인
        const meetingResult = await query('SELECT id FROM meetings WHERE id = $1', [meetingId]);
        if (meetingResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: '회의를 찾을 수 없습니다.' });
        }

        const { title, description, vote_type, options } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: '투표 제목은 필수 입력 항목입니다.' });
        }

        const allowedVoteTypes = ['yesno', 'multiple_choice'];
        const type = allowedVoteTypes.includes(vote_type) ? vote_type : 'yesno';

        // yesno 기본 옵션, multiple_choice는 사용자 제공 옵션 사용
        let voteOptions;
        if (type === 'yesno') {
            voteOptions = JSON.stringify(['찬성', '반대', '기권']);
        } else {
            if (!options || !Array.isArray(options) || options.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: '객관식 투표는 최소 2개의 선택지가 필요합니다.'
                });
            }
            voteOptions = JSON.stringify(options);
        }

        const result = await query(
            `INSERT INTO meeting_votes (meeting_id, title, description, vote_type, options, created_by)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6)
             RETURNING *`,
            [meetingId, title, description || null, type, voteOptions, req.user.userId]
        );

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('투표 생성 오류:', error);
        return res.status(500).json({
            success: false,
            error: '투표를 생성하는 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/meetings/:id/votes/:voteId/cast
 * 투표하기
 */
router.post('/:id/votes/:voteId/cast', authenticate, async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        const voteId = parseInt(req.params.voteId);
        if (isNaN(meetingId) || isNaN(voteId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 ID입니다.' });
        }

        const { option } = req.body;
        if (!option) {
            return res.status(400).json({ success: false, error: '투표 선택지를 지정해 주세요.' });
        }

        // 투표 존재 및 상태 확인
        const voteResult = await query(
            'SELECT * FROM meeting_votes WHERE id = $1 AND meeting_id = $2',
            [voteId, meetingId]
        );

        if (voteResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: '투표를 찾을 수 없습니다.' });
        }

        const vote = voteResult.rows[0];

        if (vote.status !== 'open') {
            return res.status(400).json({ success: false, error: '이미 종료된 투표입니다.' });
        }

        // 유효한 선택지인지 확인
        const validOptions = vote.options; // JSONB, already parsed by pg
        if (!Array.isArray(validOptions) || !validOptions.includes(option)) {
            return res.status(400).json({
                success: false,
                error: '유효하지 않은 선택지입니다.',
                data: { validOptions }
            });
        }

        // UPSERT: 중복 투표 시 변경
        const result = await query(
            `INSERT INTO meeting_vote_responses (vote_id, user_id, selected_option)
             VALUES ($1, $2, $3)
             ON CONFLICT (vote_id, user_id)
             DO UPDATE SET selected_option = $3, voted_at = NOW()
             RETURNING *`,
            [voteId, req.user.userId, option]
        );

        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('투표 오류:', error);
        return res.status(500).json({
            success: false,
            error: '투표하는 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/meetings/:id/votes/:voteId/close
 * 투표 종료 (관리자만)
 */
router.put('/:id/votes/:voteId/close', authenticate, async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        const voteId = parseInt(req.params.voteId);
        if (isNaN(meetingId) || isNaN(voteId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 ID입니다.' });
        }

        if (!isAdmin(req.user.role)) {
            return res.status(403).json({ success: false, error: '관리자만 투표를 종료할 수 있습니다.' });
        }

        const result = await query(
            `UPDATE meeting_votes
             SET status = 'closed', closed_at = NOW()
             WHERE id = $1 AND meeting_id = $2 AND status = 'open'
             RETURNING *`,
            [voteId, meetingId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '진행 중인 투표를 찾을 수 없습니다.'
            });
        }

        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('투표 종료 오류:', error);
        return res.status(500).json({
            success: false,
            error: '투표를 종료하는 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/meetings/:id/votes/:voteId
 * 투표 결과 조회
 */
router.get('/:id/votes/:voteId', authenticate, async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        const voteId = parseInt(req.params.voteId);
        if (isNaN(meetingId) || isNaN(voteId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 ID입니다.' });
        }

        // 투표 정보
        const voteResult = await query(
            `SELECT mv.*, u.name as creator_name
             FROM meeting_votes mv
             LEFT JOIN users u ON mv.created_by = u.id
             WHERE mv.id = $1 AND mv.meeting_id = $2`,
            [voteId, meetingId]
        );

        if (voteResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: '투표를 찾을 수 없습니다.' });
        }

        const vote = voteResult.rows[0];

        // 응답 목록
        const responsesResult = await query(
            `SELECT mvr.*, u.name as user_name
             FROM meeting_vote_responses mvr
             LEFT JOIN users u ON mvr.user_id = u.id
             WHERE mvr.vote_id = $1
             ORDER BY mvr.voted_at DESC`,
            [voteId]
        );

        // 선택지별 집계
        const options = vote.options || [];
        const tally = {};
        for (const opt of options) {
            tally[opt] = 0;
        }
        for (const resp of responsesResult.rows) {
            if (tally[resp.selected_option] !== undefined) {
                tally[resp.selected_option]++;
            }
        }

        // 현재 사용자의 투표 여부
        const myVote = responsesResult.rows.find(r => r.user_id === req.user.userId);

        return res.json({
            success: true,
            data: {
                vote,
                responses: responsesResult.rows,
                tally,
                totalVotes: responsesResult.rows.length,
                myVote: myVote ? myVote.selected_option : null
            }
        });
    } catch (error) {
        console.error('투표 결과 조회 오류:', error);
        return res.status(500).json({
            success: false,
            error: '투표 결과를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// ============================================================
// 회의록 (PDF)
// ============================================================

/**
 * POST /api/meetings/:id/minutes
 * PDF 회의록 업로드 (관리자만)
 */
router.post('/:id/minutes', authenticate, upload.single('file'), async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        if (isNaN(meetingId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 회의 ID입니다.' });
        }

        if (!isAdmin(req.user.role)) {
            return res.status(403).json({ success: false, error: '관리자만 회의록을 업로드할 수 있습니다.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'PDF 파일을 첨부해 주세요.' });
        }

        // 회의 존재 확인
        const meetingResult = await query('SELECT id FROM meetings WHERE id = $1', [meetingId]);
        if (meetingResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: '회의를 찾을 수 없습니다.' });
        }

        const title = req.body.title || req.file.originalname;

        const result = await query(
            `INSERT INTO meeting_minutes (meeting_id, title, file_data, file_name, file_size, mime_type, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, meeting_id, title, file_name, file_size, mime_type, uploaded_by, created_at`,
            [meetingId, title, req.file.buffer, req.file.originalname, req.file.size, req.file.mimetype, req.user.userId]
        );

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('회의록 업로드 오류:', error);
        if (error.message === 'PDF 파일만 업로드 가능합니다.') {
            return res.status(400).json({ success: false, error: error.message });
        }
        return res.status(500).json({
            success: false,
            error: '회의록을 업로드하는 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/meetings/:id/minutes
 * 회의록 목록 조회
 */
router.get('/:id/minutes', authenticate, async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        if (isNaN(meetingId)) {
            return res.status(400).json({ success: false, error: '유효하지 않은 회의 ID입니다.' });
        }

        const result = await query(
            `SELECT mm.id, mm.meeting_id, mm.title, mm.file_name, mm.file_size, mm.mime_type,
                    mm.uploaded_by, mm.created_at, u.name as uploader_name
             FROM meeting_minutes mm
             LEFT JOIN users u ON mm.uploaded_by = u.id
             WHERE mm.meeting_id = $1
             ORDER BY mm.created_at DESC`,
            [meetingId]
        );

        return res.json({
            success: true,
            data: { items: result.rows }
        });
    } catch (error) {
        console.error('회의록 목록 조회 오류:', error);
        return res.status(500).json({
            success: false,
            error: '회의록 목록을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
