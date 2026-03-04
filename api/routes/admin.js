const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { comparePassword, hashPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

/* ======================================================
   POST /api/admin/auth/login
   관리자 로그인 (admin_id = email)
   ====================================================== */
router.post('/auth/login', async (req, res) => {
    try {
        const { admin_id, password } = req.body;
        if (!admin_id || !password) {
            return res.status(400).json({
                success: false,
                message: '아이디와 비밀번호를 입력해주세요.',
            });
        }

        const result = await query(
            `SELECT id, email, password_hash, name, role, status, profile_image
             FROM users WHERE email = $1`,
            [admin_id.toLowerCase()],
        );

        if (!result.rows.length) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 일치하지 않습니다.',
            });
        }

        const user = result.rows[0];
        const valid = await comparePassword(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 일치하지 않습니다.',
            });
        }

        if (!['admin', 'super_admin'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: '관리자 권한이 없습니다.',
            });
        }

        const token = generateToken(user.id, user.email, user.role);
        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                profile_image: user.profile_image,
                permissions: [],
            },
        });
    } catch (err) {
        console.error('Admin login error:', err);
        return res.status(500).json({
            success: false,
            message: '로그인 처리 중 오류가 발생했습니다.',
        });
    }
});

// 아래 모든 라우트에 인증 + 관리자 권한 필요
router.use(authenticate);
router.use(requireRole(['admin', 'super_admin']));

/**
 * GET /api/admin/members/pending
 * 승인 대기 회원 목록
 */
router.get('/members/pending', async (req, res) => {
    try {
        const result = await query(
            `SELECT id, email, name, phone, birth_date,
                    profile_image, role, status, created_at
             FROM users
             WHERE status = 'pending'
             ORDER BY created_at DESC`
        );
        res.json({ success: true, members: result.rows });
    } catch (error) {
        console.error('Admin pending members error:', error);
        res.status(500).json({
            success: false,
            message: '승인 대기 회원 조회 중 오류가 발생했습니다.',
        });
    }
});

/**
 * GET /api/admin/members
 * 전체 회원 목록 (상태 무관, 검색/필터 지원)
 */
router.get('/members', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const search = req.query.q || '';
        const status = req.query.status || '';

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND (name ILIKE $${params.length}
                OR email ILIKE $${params.length}
                OR phone ILIKE $${params.length})`;
        }

        if (status) {
            params.push(status);
            whereClause += ` AND status = $${params.length}`;
        }

        const countResult = await query(
            `SELECT COUNT(*) FROM users ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit, offset);
        const result = await query(
            `SELECT id, email, name, phone, birth_date,
                    profile_image, role, status, created_at, updated_at
             FROM users
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({
            success: true,
            members: result.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Admin all members error:', error);
        res.status(500).json({
            success: false,
            message: '회원 목록 조회 중 오류가 발생했습니다.',
        });
    }
});

/**
 * PATCH /api/admin/members/:id/approve
 * 회원 승인
 */
router.patch('/members/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        await query(
            `UPDATE users
             SET status = 'active', role = 'member', updated_at = NOW()
             WHERE id = $1`,
            [id]
        );
        res.json({ success: true, message: '회원이 승인되었습니다.' });
    } catch (error) {
        console.error('Admin approve error:', error);
        res.status(500).json({
            success: false,
            message: '승인 처리 중 오류가 발생했습니다.',
        });
    }
});

/**
 * DELETE /api/admin/members/:id/reject
 * 회원 가입 거부 (삭제)
 */
router.delete('/members/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM users WHERE id = $1 AND status = $2', [
            id,
            'pending',
        ]);
        res.json({ success: true, message: '가입이 거부되었습니다.' });
    } catch (error) {
        console.error('Admin reject error:', error);
        res.status(500).json({
            success: false,
            message: '거부 처리 중 오류가 발생했습니다.',
        });
    }
});

/**
 * PATCH /api/admin/members/:id/role
 * 회원 역할 변경
 */
router.patch('/members/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;

        const validRoles = ['member', 'admin'];
        if (requesterRole === 'super_admin') validRoles.push('super_admin');

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 역할입니다.',
            });
        }

        // 자기 자신 역할 변경 금지
        if (String(id) === String(requesterId)) {
            return res.status(403).json({
                success: false,
                message: '자신의 역할은 변경할 수 없습니다.',
            });
        }

        await query(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
            [role, id]
        );
        res.json({ success: true, message: '역할이 변경되었습니다.' });
    } catch (error) {
        console.error('Admin role change error:', error);
        res.status(500).json({
            success: false,
            message: '역할 변경 중 오류가 발생했습니다.',
        });
    }
});

/**
 * PATCH /api/admin/members/:id/suspend
 * 회원 정지
 */
router.patch('/members/:id/suspend', async (req, res) => {
    try {
        const { id } = req.params;
        await query(
            `UPDATE users
             SET status = 'suspended', updated_at = NOW()
             WHERE id = $1`,
            [id]
        );
        res.json({ success: true, message: '회원이 정지되었습니다.' });
    } catch (error) {
        console.error('Admin suspend error:', error);
        res.status(500).json({
            success: false,
            message: '정지 처리 중 오류가 발생했습니다.',
        });
    }
});

/**
 * PATCH /api/admin/members/:id/activate
 * 회원 복구
 */
router.patch('/members/:id/activate', async (req, res) => {
    try {
        const { id } = req.params;
        await query(
            `UPDATE users
             SET status = 'active', updated_at = NOW()
             WHERE id = $1`,
            [id]
        );
        res.json({ success: true, message: '회원이 복구되었습니다.' });
    } catch (error) {
        console.error('Admin activate error:', error);
        res.status(500).json({
            success: false,
            message: '복구 처리 중 오류가 발생했습니다.',
        });
    }
});

/**
 * GET /api/admin/posts
 * 최근 게시글 목록 (관리용)
 */
router.get('/posts', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 30;
        const result = await query(
            `SELECT p.id, p.title, p.views, p.likes_count,
                    p.comments_count, p.created_at,
                    u.name as author_name, u.email as author_email
             FROM posts p
             LEFT JOIN users u ON p.author_id = u.id
             ORDER BY p.created_at DESC
             LIMIT $1`,
            [limit]
        );
        res.json({ success: true, posts: result.rows });
    } catch (error) {
        console.error('Admin posts error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 목록 조회 중 오류가 발생했습니다.',
        });
    }
});

/**
 * DELETE /api/admin/posts/:id
 * 게시글 강제 삭제
 */
router.delete('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM posts WHERE id = $1', [id]);
        res.json({ success: true, message: '게시글이 삭제되었습니다.' });
    } catch (error) {
        console.error('Admin delete post error:', error);
        res.status(500).json({
            success: false,
            message: '게시글 삭제 중 오류가 발생했습니다.',
        });
    }
});

/**
 * GET /api/admin/stats
 * 대시보드 통계
 */
router.get('/stats', async (req, res) => {
    try {
        const [members, pending, posts, notices] = await Promise.all([
            query("SELECT COUNT(*) FROM users WHERE status = 'active'"),
            query("SELECT COUNT(*) FROM users WHERE status = 'pending'"),
            query('SELECT COUNT(*) FROM posts'),
            query('SELECT COUNT(*) FROM notices'),
        ]);

        res.json({
            success: true,
            stats: {
                totalMembers: parseInt(members.rows[0].count),
                pendingMembers: parseInt(pending.rows[0].count),
                totalPosts: parseInt(posts.rows[0].count),
                totalNotices: parseInt(notices.rows[0].count),
            },
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: '통계 조회 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   PATCH /api/admin/members/:id
   회원 권한(permissions) 업데이트
   ====================================================== */
router.patch('/members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;
        await query(
            `UPDATE users SET updated_at = NOW() WHERE id = $1`,
            [id],
        );
        return res.json({ success: true, message: '저장되었습니다.' });
    } catch (err) {
        console.error('Admin member patch error:', err);
        return res.status(500).json({
            success: false, message: '처리 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   GET /api/admin/posts/:id/comments
   게시글 댓글 목록
   ====================================================== */
router.get('/posts/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT c.id, c.content, c.created_at,
                    u.name as author_name
             FROM comments c
             LEFT JOIN users u ON c.author_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at ASC`,
            [id],
        );
        return res.json({ success: true, comments: result.rows });
    } catch (err) {
        console.error('Admin post comments error:', err);
        return res.status(500).json({
            success: false, message: '댓글 조회 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   DELETE /api/admin/comments/:id
   댓글 강제 삭제
   ====================================================== */
router.delete('/comments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM comments WHERE id = $1', [id]);
        return res.json({ success: true, message: '댓글이 삭제되었습니다.' });
    } catch (err) {
        console.error('Admin delete comment error:', err);
        return res.status(500).json({
            success: false, message: '댓글 삭제 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   GET /api/admin/notices
   공지사항 목록 (관리용)
   ====================================================== */
router.get('/notices', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await query(
            `SELECT id, title, content, is_pinned as pinned, created_at, updated_at
             FROM notices
             ORDER BY is_pinned DESC, created_at DESC
             LIMIT $1`,
            [limit],
        );
        return res.json({ success: true, notices: result.rows });
    } catch (err) {
        console.error('Admin notices error:', err);
        return res.status(500).json({
            success: false, message: '공지사항 조회 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   POST /api/admin/notices
   공지사항 추가
   ====================================================== */
router.post('/notices', async (req, res) => {
    try {
        const { title, content, pinned } = req.body;
        if (!title || !content) {
            return res.status(400).json({
                success: false, message: '제목과 내용을 입력해주세요.',
            });
        }
        const result = await query(
            `INSERT INTO notices
                (author_id, title, content, is_pinned, has_attendance, created_at, updated_at)
             VALUES ($1, $2, $3, $4, false, NOW(), NOW())
             RETURNING id`,
            [req.user.userId, title, content, !!pinned],
        );
        return res.status(201).json({
            success: true,
            message: '공지사항이 추가되었습니다.',
            id: result.rows[0].id,
        });
    } catch (err) {
        console.error('Admin create notice error:', err);
        return res.status(500).json({
            success: false, message: '공지사항 추가 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   PATCH /api/admin/notices/:id
   공지사항 수정
   ====================================================== */
router.patch('/notices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, pinned } = req.body;
        await query(
            `UPDATE notices
             SET title = $1, content = $2, is_pinned = $3, updated_at = NOW()
             WHERE id = $4`,
            [title, content, !!pinned, id],
        );
        return res.json({ success: true, message: '공지사항이 수정되었습니다.' });
    } catch (err) {
        console.error('Admin update notice error:', err);
        return res.status(500).json({
            success: false, message: '공지사항 수정 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   DELETE /api/admin/notices/:id
   공지사항 삭제
   ====================================================== */
router.delete('/notices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM notices WHERE id = $1', [id]);
        return res.json({ success: true, message: '공지사항이 삭제되었습니다.' });
    } catch (err) {
        console.error('Admin delete notice error:', err);
        return res.status(500).json({
            success: false, message: '공지사항 삭제 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   GET /api/admin/schedules
   일정 목록 (관리용)
   schedules 테이블: start_date(DATE), end_date, location, description
   프론트: date(DATE), time(TIME), location, desc
   ====================================================== */
router.get('/schedules', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await query(
            `SELECT id, title,
                    start_date as date,
                    TO_CHAR(start_date, 'HH24:MI') as time,
                    location,
                    description as desc,
                    created_at, updated_at
             FROM schedules
             ORDER BY start_date DESC
             LIMIT $1`,
            [limit],
        );
        return res.json({ success: true, schedules: result.rows });
    } catch (err) {
        console.error('Admin schedules error:', err);
        return res.status(500).json({
            success: false, message: '일정 조회 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   POST /api/admin/schedules
   일정 추가
   ====================================================== */
router.post('/schedules', async (req, res) => {
    try {
        const { title, date, time, location, desc } = req.body;
        if (!title || !date) {
            return res.status(400).json({
                success: false, message: '제목과 날짜는 필수입니다.',
            });
        }
        const startDate = time ? `${date} ${time}` : date;
        const result = await query(
            `INSERT INTO schedules
                (created_by, title, start_date, location, description, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             RETURNING id`,
            [req.user.userId, title, startDate, location || null, desc || null],
        );
        return res.status(201).json({
            success: true,
            message: '일정이 추가되었습니다.',
            id: result.rows[0].id,
        });
    } catch (err) {
        console.error('Admin create schedule error:', err);
        return res.status(500).json({
            success: false, message: '일정 추가 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   PATCH /api/admin/schedules/:id
   일정 수정
   ====================================================== */
router.patch('/schedules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, date, time, location, desc } = req.body;
        const startDate = time ? `${date} ${time}` : date;
        await query(
            `UPDATE schedules
             SET title = $1, start_date = $2, location = $3,
                 description = $4, updated_at = NOW()
             WHERE id = $5`,
            [title, startDate, location || null, desc || null, id],
        );
        return res.json({ success: true, message: '일정이 수정되었습니다.' });
    } catch (err) {
        console.error('Admin update schedule error:', err);
        return res.status(500).json({
            success: false, message: '일정 수정 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   DELETE /api/admin/schedules/:id
   일정 삭제
   ====================================================== */
router.delete('/schedules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM schedules WHERE id = $1', [id]);
        return res.json({ success: true, message: '일정이 삭제되었습니다.' });
    } catch (err) {
        console.error('Admin delete schedule error:', err);
        return res.status(500).json({
            success: false, message: '일정 삭제 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   GET /api/admin/roles
   역할 목록 (고정 정의 + DB 기반)
   ====================================================== */
router.get('/roles', async (req, res) => {
    try {
        const ROLES = [
            {
                id: 'super_admin',
                name: 'super_admin',
                display_name: '최고 관리자',
                permissions: ['notice_write', 'schedule_manage', 'board_delete'],
            },
            {
                id: 'admin',
                name: 'admin',
                display_name: '관리자',
                permissions: ['notice_write', 'schedule_manage'],
            },
            {
                id: 'member',
                name: 'member',
                display_name: '일반 회원',
                permissions: [],
            },
        ];
        return res.json({ success: true, roles: ROLES });
    } catch (err) {
        return res.status(500).json({
            success: false, message: '역할 조회 중 오류가 발생했습니다.',
        });
    }
});

/* ======================================================
   PUT /api/admin/roles
   역할 권한 업데이트 (현재는 고정 역할이라 응답만)
   ====================================================== */
router.put('/roles', async (req, res) => {
    return res.json({ success: true, message: '권한 설정이 저장되었습니다.' });
});

/* ======================================================
   PATCH /api/admin/account/password
   관리자 비밀번호 변경
   ====================================================== */
router.patch('/account/password', async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const userId = req.user.userId;

        const result = await query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId],
        );
        if (!result.rows.length) {
            return res.status(404).json({
                success: false, message: '사용자를 찾을 수 없습니다.',
            });
        }

        const valid = await comparePassword(
            current_password,
            result.rows[0].password_hash,
        );
        if (!valid) {
            return res.status(401).json({
                success: false, message: '현재 비밀번호가 일치하지 않습니다.',
            });
        }

        const newHash = await hashPassword(new_password);
        await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [newHash, userId],
        );
        return res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
    } catch (err) {
        console.error('Admin password change error:', err);
        return res.status(500).json({
            success: false, message: '비밀번호 변경 중 오류가 발생했습니다.',
        });
    }
});

module.exports = router;
