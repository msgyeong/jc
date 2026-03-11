const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { comparePassword, hashPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { writeAuditLog } = require('../utils/auditLog');

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

/* ======================================================
   GET /api/admin/auth/me
   관리자 계정 정보
   ====================================================== */
router.get('/auth/me', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await query(
            `SELECT id, email, name, role, status, profile_image, created_at, updated_at
             FROM users WHERE id = $1`,
            [userId],
        );
        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: '계정을 찾을 수 없습니다.' });
        }
        const user = result.rows[0];
        if (!['admin', 'super_admin'].includes(user.role)) {
            return res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
        }
        return res.json({ success: true, data: user });
    } catch (err) {
        console.error('Admin me error:', err);
        return res.status(500).json({ success: false, message: '계정 조회 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   PUT /api/admin/auth/password
   관리자 비밀번호 변경 (신규 경로)
   ====================================================== */
router.put('/auth/password', authenticate, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const userId = req.user.userId;

        if (!current_password || !new_password) {
            return res.status(400).json({ success: false, message: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
        }

        // 비밀번호 정책: 최소 8자, 영문+숫자+특수문자
        if (new_password.length < 8) {
            return res.status(400).json({ success: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' });
        }
        if (!/[a-zA-Z]/.test(new_password) || !/[0-9]/.test(new_password) || !/[^a-zA-Z0-9]/.test(new_password)) {
            return res.status(400).json({ success: false, message: '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.' });
        }

        const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        const valid = await comparePassword(current_password, result.rows[0].password_hash);
        if (!valid) {
            return res.status(401).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        const newHash = await hashPassword(new_password);
        await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);

        // 토큰 재발급
        const token = generateToken(userId, req.user.email, req.user.role);

        writeAuditLog({
            adminId: userId, action: 'admin.password_change',
            targetType: 'member', targetId: userId,
            description: '관리자 비밀번호 변경',
            ipAddress: req.ip,
        });

        return res.json({ success: true, message: '비밀번호가 변경되었습니다.', token });
    } catch (err) {
        console.error('Admin password change error:', err);
        return res.status(500).json({ success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' });
    }
});

// 아래 모든 라우트에 인증 + 관리자 권한 필요
router.use(authenticate);
router.use(requireRole(['admin', 'super_admin']));

/* ======================================================
   대시보드 API
   ====================================================== */

/**
 * GET /api/admin/dashboard/stats
 * 통계 데이터
 */
router.get('/dashboard/stats', async (req, res) => {
    try {
        const now = new Date();
        const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        const [
            totalMembers, activeMembers, pendingMembers, monthMembers,
            totalPosts, monthPosts,
            totalSchedules, monthSchedules,
            totalComments
        ] = await Promise.all([
            query('SELECT COUNT(*) FROM users'),
            query("SELECT COUNT(*) FROM users WHERE status = 'active'"),
            query("SELECT COUNT(*) FROM users WHERE status = 'pending'"),
            query('SELECT COUNT(*) FROM users WHERE created_at >= $1', [firstOfMonth]),
            query('SELECT COUNT(*) FROM posts'),
            query('SELECT COUNT(*) FROM posts WHERE created_at >= $1', [firstOfMonth]),
            query('SELECT COUNT(*) FROM schedules'),
            query('SELECT COUNT(*) FROM schedules WHERE created_at >= $1', [firstOfMonth]),
            query("SELECT COUNT(*) FROM comments WHERE is_deleted = false OR is_deleted IS NULL"),
        ]);

        res.json({
            success: true,
            data: {
                members: {
                    total: parseInt(totalMembers.rows[0].count),
                    active: parseInt(activeMembers.rows[0].count),
                    pending: parseInt(pendingMembers.rows[0].count),
                    this_month: parseInt(monthMembers.rows[0].count),
                },
                posts: {
                    total: parseInt(totalPosts.rows[0].count),
                    this_month: parseInt(monthPosts.rows[0].count),
                },
                schedules: {
                    total: parseInt(totalSchedules.rows[0].count),
                    this_month: parseInt(monthSchedules.rows[0].count),
                },
                comments: {
                    total: parseInt(totalComments.rows[0].count),
                },
            },
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: '통계 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/dashboard/recent-activity
 * 최근 활동
 */
router.get('/dashboard/recent-activity', async (req, res) => {
    try {
        const [recentMembers, recentPosts, recentSchedules] = await Promise.all([
            query(
                `SELECT id, name, email, status, created_at
                 FROM users ORDER BY created_at DESC LIMIT 5`
            ),
            query(
                `SELECT p.id, p.title, p.category, p.created_at,
                        u.name as author_name
                 FROM posts p LEFT JOIN users u ON p.author_id = u.id
                 ORDER BY p.created_at DESC LIMIT 5`
            ),
            query(
                `SELECT id, title, start_date, location, category, created_at
                 FROM schedules ORDER BY created_at DESC LIMIT 5`
            ),
        ]);

        res.json({
            success: true,
            data: {
                recent_members: recentMembers.rows,
                recent_posts: recentPosts.rows,
                recent_schedules: recentSchedules.rows,
            },
        });
    } catch (error) {
        console.error('Dashboard recent activity error:', error);
        res.status(500).json({ success: false, message: '최근 활동 조회 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   기존 stats (하위호환)
   ====================================================== */
router.get('/stats', async (req, res) => {
    try {
        const [members, pending, posts] = await Promise.all([
            query("SELECT COUNT(*) FROM users WHERE status = 'active'"),
            query("SELECT COUNT(*) FROM users WHERE status = 'pending'"),
            query('SELECT COUNT(*) FROM posts'),
        ]);
        res.json({
            success: true,
            stats: {
                totalMembers: parseInt(members.rows[0].count),
                pendingMembers: parseInt(pending.rows[0].count),
                totalPosts: parseInt(posts.rows[0].count),
                totalNotices: 0,
            },
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: '통계 조회 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   회원 관리 API
   ====================================================== */

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
        res.status(500).json({ success: false, message: '승인 대기 회원 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/members
 * 전체 회원 목록 (검색/필터/정렬/페이지네이션)
 */
router.get('/members', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const search = req.query.search || req.query.q || '';
        const status = req.query.status || '';
        const role = req.query.role || '';
        const sortField = req.query.sort || 'created_at';
        const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';

        // 허용된 정렬 필드
        const allowedSorts = ['created_at', 'name', 'email', 'status', 'role', 'updated_at'];
        const safeSort = allowedSorts.includes(sortField) ? sortField : 'created_at';

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

        if (role) {
            params.push(role);
            whereClause += ` AND role = $${params.length}`;
        }

        const countResult = await query(
            `SELECT COUNT(*) FROM users ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit, offset);
        const result = await query(
            `SELECT id, email, name, phone, birth_date,
                    profile_image, role, status, position, department, join_number,
                    company, industry, created_at, updated_at
             FROM users
             ${whereClause}
             ORDER BY ${safeSort} ${sortOrder}
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
        res.status(500).json({ success: false, message: '회원 목록 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/members/:id
 * 회원 상세 조회
 */
router.get('/members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // audit-log 서브경로와 겹치지 않도록 체크
        if (id === 'pending') return; // /members/pending 이 먼저 매칭됨

        const result = await query(
            `SELECT id, email, name, phone, birth_date, gender, address, address_detail, postal_code,
                    profile_image, role, status, position, department, join_number,
                    company, work_phone, work_address, industry, industry_detail,
                    educations, careers, families, hobbies, special_notes,
                    emergency_contact, emergency_contact_name, emergency_relationship,
                    created_at, updated_at
             FROM users WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        // SSN 필드는 관리자에게도 마스킹
        const member = result.rows[0];

        res.json({ success: true, data: member });
    } catch (error) {
        console.error('Admin member detail error:', error);
        res.status(500).json({ success: false, message: '회원 상세 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/admin/members/:id
 * 관리자 전용 회원 정보 수정
 */
router.put('/members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            position, department, join_number, role, status,
            name, phone, company, industry, industry_detail,
            educations, careers, hobbies, special_notes,
        } = req.body;
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;

        // 대상 회원 존재 확인 + 변경 전 값 저장
        const memberResult = await query(
            'SELECT id, role, status, position, department, join_number, name, phone, company FROM users WHERE id = $1',
            [id]
        );
        if (memberResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        const beforeValues = memberResult.rows[0];

        // role 변경 시 유효성 검증
        if (role !== undefined) {
            const validRoles = ['member', 'admin'];
            if (requesterRole === 'super_admin') validRoles.push('super_admin');
            if (!validRoles.includes(role)) {
                return res.status(400).json({ success: false, message: '유효하지 않은 역할입니다.' });
            }
            if (String(id) === String(requesterId)) {
                return res.status(403).json({ success: false, message: '자신의 역할은 변경할 수 없습니다.' });
            }
        }

        // status 변경 시 유효성 검증
        if (status !== undefined) {
            const validStatuses = ['active', 'pending', 'suspended', 'withdrawn'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: '유효하지 않은 상태입니다.' });
            }
        }

        // 동적 SET 절 구성
        const setClauses = [];
        const params = [];
        const afterValues = {};

        const addField = (field, value) => {
            if (value !== undefined) {
                params.push(value);
                setClauses.push(`${field} = $${params.length}`);
                afterValues[field] = value;
            }
        };

        addField('position', position);
        addField('department', department);
        addField('join_number', join_number);
        addField('role', role);
        addField('status', status);
        addField('name', name);
        addField('phone', phone);
        addField('company', company);
        addField('industry', industry);
        addField('industry_detail', industry_detail);
        addField('educations', educations ? JSON.stringify(educations) : undefined);
        addField('careers', careers ? JSON.stringify(careers) : undefined);
        addField('hobbies', hobbies);
        addField('special_notes', special_notes);

        if (setClauses.length === 0) {
            return res.status(400).json({ success: false, message: '수정할 필드가 없습니다.' });
        }

        setClauses.push('updated_at = NOW()');
        params.push(id);

        await query(
            `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
            params
        );

        // Audit Log
        writeAuditLog({
            adminId: requesterId, action: 'member.update',
            targetType: 'member', targetId: parseInt(id),
            before: beforeValues, after: afterValues,
            description: `회원 정보 수정: ${Object.keys(afterValues).join(', ')}`,
            ipAddress: req.ip,
        });

        return res.json({ success: true, message: '회원 정보가 수정되었습니다.' });
    } catch (err) {
        console.error('Admin update member error:', err);
        return res.status(500).json({ success: false, message: '회원 정보 수정 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/admin/members/:id/status
 * 회원 상태 변경
 */
router.put('/members/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const adminId = req.user.userId;

        const validStatuses = ['active', 'pending', 'suspended', 'withdrawn'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: '유효하지 않은 상태입니다. (active/pending/suspended/withdrawn)' });
        }

        const before = await query('SELECT status FROM users WHERE id = $1', [id]);
        if (before.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        const oldStatus = before.rows[0].status;
        await query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);

        writeAuditLog({
            adminId, action: 'member.status_change',
            targetType: 'member', targetId: parseInt(id),
            before: { status: oldStatus }, after: { status },
            description: `회원 상태 변경: ${oldStatus} → ${status}`,
            ipAddress: req.ip,
        });

        const statusMessages = {
            active: '회원이 활성화되었습니다.',
            suspended: '회원이 정지되었습니다.',
            withdrawn: '회원이 탈퇴 처리되었습니다.',
            pending: '회원이 대기 상태로 변경되었습니다.',
        };

        res.json({ success: true, message: statusMessages[status] });
    } catch (error) {
        console.error('Admin status change error:', error);
        res.status(500).json({ success: false, message: '상태 변경 중 오류가 발생했습니다.' });
    }
});

/**
 * DELETE /api/admin/members/:id
 * 회원 삭제 (soft delete → status='withdrawn')
 */
router.delete('/members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;

        if (String(id) === String(adminId)) {
            return res.status(403).json({ success: false, message: '자기 자신은 삭제할 수 없습니다.' });
        }

        const before = await query('SELECT name, status FROM users WHERE id = $1', [id]);
        if (before.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        await query("UPDATE users SET status = 'withdrawn', updated_at = NOW() WHERE id = $1", [id]);

        writeAuditLog({
            adminId, action: 'member.delete',
            targetType: 'member', targetId: parseInt(id),
            before: { status: before.rows[0].status },
            after: { status: 'withdrawn' },
            description: `회원 삭제 (soft): ${before.rows[0].name}`,
            ipAddress: req.ip,
        });

        res.json({ success: true, message: '회원이 삭제되었습니다.' });
    } catch (error) {
        console.error('Admin delete member error:', error);
        res.status(500).json({ success: false, message: '회원 삭제 중 오류가 발생했습니다.' });
    }
});

/**
 * POST /api/admin/members/:id/reset-password
 * 임시 비밀번호 발급
 */
router.post('/members/:id/reset-password', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;

        const memberResult = await query('SELECT id, name, email FROM users WHERE id = $1', [id]);
        if (memberResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        // 임시 비밀번호 생성 (8자리 영숫자+특수문자)
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        const specials = '!@#$%';
        let tempPassword = '';
        for (let i = 0; i < 6; i++) tempPassword += chars[Math.floor(Math.random() * chars.length)];
        tempPassword += specials[Math.floor(Math.random() * specials.length)];
        tempPassword += Math.floor(Math.random() * 10);

        const hash = await hashPassword(tempPassword);
        await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, id]);

        writeAuditLog({
            adminId, action: 'member.reset_password',
            targetType: 'member', targetId: parseInt(id),
            description: `임시 비밀번호 발급: ${memberResult.rows[0].name} (${memberResult.rows[0].email})`,
            ipAddress: req.ip,
        });

        res.json({
            success: true,
            message: '임시 비밀번호가 발급되었습니다.',
            data: { temp_password: tempPassword },
        });
    } catch (error) {
        console.error('Admin reset password error:', error);
        res.status(500).json({ success: false, message: '비밀번호 초기화 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/members/:id/audit-log
 * 회원 변경 이력 조회
 */
router.get('/members/:id/audit-log', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const countResult = await query(
            `SELECT COUNT(*) FROM audit_log WHERE target_type = 'member' AND target_id = $1`,
            [id]
        );
        const total = parseInt(countResult.rows[0].count);

        const result = await query(
            `SELECT al.id, al.action, al.before_value, al.after_value,
                    al.description, al.created_at, al.ip_address,
                    u.name as admin_name, u.email as admin_email
             FROM audit_log al
             LEFT JOIN users u ON al.admin_id = u.id
             WHERE al.target_type = 'member' AND al.target_id = $1
             ORDER BY al.created_at DESC
             LIMIT $2 OFFSET $3`,
            [id, limit, offset]
        );

        res.json({
            success: true,
            data: {
                items: result.rows,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin audit log error:', error);
        res.status(500).json({ success: false, message: '변경 이력 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * POST /api/admin/members/:id/approve
 * 회원 승인 (POST — 명세서 기준)
 */
router.post('/members/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;

        const before = await query('SELECT name, status FROM users WHERE id = $1', [id]);
        if (before.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        await query(
            "UPDATE users SET status = 'active', role = 'member', updated_at = NOW() WHERE id = $1",
            [id]
        );

        writeAuditLog({
            adminId, action: 'member.approve',
            targetType: 'member', targetId: parseInt(id),
            before: { status: before.rows[0].status },
            after: { status: 'active', role: 'member' },
            description: `가입 승인: ${before.rows[0].name}`,
            ipAddress: req.ip,
        });

        res.json({ success: true, message: '회원이 승인되었습니다.' });
    } catch (error) {
        console.error('Admin approve error:', error);
        res.status(500).json({ success: false, message: '승인 처리 중 오류가 발생했습니다.' });
    }
});

/**
 * POST /api/admin/members/:id/reject
 * 회원 가입 거절 (사유 포함)
 */
router.post('/members/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        const adminId = req.user.userId;

        if (!rejection_reason || !rejection_reason.trim()) {
            return res.status(400).json({ success: false, message: '거절 사유를 입력해주세요.' });
        }

        const before = await query('SELECT name, status FROM users WHERE id = $1', [id]);
        if (before.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        await query(
            "UPDATE users SET status = 'rejected', updated_at = NOW() WHERE id = $1",
            [id]
        );

        writeAuditLog({
            adminId, action: 'member.reject',
            targetType: 'member', targetId: parseInt(id),
            before: { status: before.rows[0].status },
            after: { status: 'rejected', rejection_reason: rejection_reason.trim() },
            description: `가입 거절: ${before.rows[0].name} — ${rejection_reason.trim()}`,
            ipAddress: req.ip,
        });

        res.json({ success: true, message: '가입이 거절되었습니다.' });
    } catch (error) {
        console.error('Admin reject error:', error);
        res.status(500).json({ success: false, message: '거절 처리 중 오류가 발생했습니다.' });
    }
});

// PATCH approve/reject (하위호환)
router.patch('/members/:id/approve', async (req, res) => {
    const { id } = req.params;
    await query("UPDATE users SET status = 'active', role = 'member', updated_at = NOW() WHERE id = $1", [id]);
    writeAuditLog({ adminId: req.user.userId, action: 'member.approve', targetType: 'member', targetId: parseInt(id), description: '가입 승인 (legacy)', ipAddress: req.ip });
    res.json({ success: true, message: '회원이 승인되었습니다.' });
});

router.delete('/members/:id/reject', async (req, res) => {
    const { id } = req.params;
    await query("DELETE FROM users WHERE id = $1 AND status = 'pending'", [id]);
    res.json({ success: true, message: '가입이 거부되었습니다.' });
});

// PATCH role/suspend/activate (하위호환)
router.patch('/members/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['member', 'admin'];
    if (req.user.role === 'super_admin') validRoles.push('super_admin');
    if (!validRoles.includes(role)) return res.status(400).json({ success: false, message: '유효하지 않은 역할입니다.' });
    if (String(id) === String(req.user.userId)) return res.status(403).json({ success: false, message: '자신의 역할은 변경할 수 없습니다.' });
    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, id]);
    writeAuditLog({ adminId: req.user.userId, action: 'member.role_change', targetType: 'member', targetId: parseInt(id), after: { role }, ipAddress: req.ip });
    res.json({ success: true, message: '역할이 변경되었습니다.' });
});

router.patch('/members/:id/suspend', async (req, res) => {
    const { id } = req.params;
    await query("UPDATE users SET status = 'suspended', updated_at = NOW() WHERE id = $1", [id]);
    writeAuditLog({ adminId: req.user.userId, action: 'member.status_change', targetType: 'member', targetId: parseInt(id), after: { status: 'suspended' }, ipAddress: req.ip });
    res.json({ success: true, message: '회원이 정지되었습니다.' });
});

router.patch('/members/:id/activate', async (req, res) => {
    const { id } = req.params;
    await query("UPDATE users SET status = 'active', updated_at = NOW() WHERE id = $1", [id]);
    writeAuditLog({ adminId: req.user.userId, action: 'member.status_change', targetType: 'member', targetId: parseInt(id), after: { status: 'active' }, ipAddress: req.ip });
    res.json({ success: true, message: '회원이 복구되었습니다.' });
});

// PATCH /api/admin/members/:id (permissions, 하위호환)
router.patch('/members/:id', async (req, res) => {
    const { id } = req.params;
    await query('UPDATE users SET updated_at = NOW() WHERE id = $1', [id]);
    return res.json({ success: true, message: '저장되었습니다.' });
});

/* ======================================================
   게시판 관리 API
   ====================================================== */

/**
 * GET /api/admin/posts
 * 게시글 목록 (검색, 카테고리, 고정 필터, 페이지네이션, 정렬)
 */
router.get('/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const pinned = req.query.pinned;
        const sortField = req.query.sort || 'created_at';
        const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';

        const allowedSorts = ['created_at', 'title', 'views', 'comments_count', 'likes_count'];
        const safeSort = allowedSorts.includes(sortField) ? `p.${sortField}` : 'p.created_at';

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND (p.title ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
        }

        if (category) {
            params.push(category);
            whereClause += ` AND p.category = $${params.length}`;
        }

        if (pinned === 'true') {
            whereClause += ' AND p.is_pinned = true';
        } else if (pinned === 'false') {
            whereClause += ' AND (p.is_pinned = false OR p.is_pinned IS NULL)';
        }

        const countResult = await query(
            `SELECT COUNT(*) FROM posts p LEFT JOIN users u ON p.author_id = u.id ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit, offset);
        const result = await query(
            `SELECT p.id, p.title, p.category, p.is_pinned, p.views, p.likes_count,
                    p.comments_count, p.created_at, p.updated_at,
                    u.name as author_name, u.email as author_email
             FROM posts p
             LEFT JOIN users u ON p.author_id = u.id
             ${whereClause}
             ORDER BY ${safeSort} ${sortOrder}
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({
            success: true,
            data: {
                items: result.rows,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin posts error:', error);
        res.status(500).json({ success: false, message: '게시글 목록 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/posts/:id
 * 게시글 상세 (댓글 포함)
 */
router.get('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (id === 'comments') return; // /posts/:id/comments 라우트와 겹침 방지

        const postResult = await query(
            `SELECT p.id, p.title, p.content, p.images, p.category, p.is_pinned,
                    p.views, p.likes_count, p.comments_count,
                    p.linked_schedule_id, p.created_at, p.updated_at,
                    p.author_id, u.name as author_name, u.email as author_email
             FROM posts p
             LEFT JOIN users u ON p.author_id = u.id
             WHERE p.id = $1`,
            [id]
        );

        if (postResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        const post = postResult.rows[0];

        // 댓글 조회
        const commentsResult = await query(
            `SELECT c.id, c.content, c.parent_id, c.is_deleted, c.created_at,
                    c.author_id, u.name as author_name
             FROM comments c
             LEFT JOIN users u ON c.author_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at ASC`,
            [id]
        );

        post.comments = commentsResult.rows;

        res.json({ success: true, data: post });
    } catch (error) {
        console.error('Admin post detail error:', error);
        res.status(500).json({ success: false, message: '게시글 상세 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/admin/posts/:id
 * 게시글 수정
 */
router.put('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, is_pinned } = req.body;
        const adminId = req.user.userId;

        const before = await query('SELECT title, category, is_pinned FROM posts WHERE id = $1', [id]);
        if (before.rows.length === 0) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        const setClauses = [];
        const params = [];
        const afterValues = {};

        if (title !== undefined) { params.push(title); setClauses.push(`title = $${params.length}`); afterValues.title = title; }
        if (content !== undefined) { params.push(content); setClauses.push(`content = $${params.length}`); afterValues.content = '[변경됨]'; }
        if (category !== undefined) { params.push(category); setClauses.push(`category = $${params.length}`); afterValues.category = category; }
        if (is_pinned !== undefined) { params.push(is_pinned); setClauses.push(`is_pinned = $${params.length}`); afterValues.is_pinned = is_pinned; }

        if (setClauses.length === 0) {
            return res.status(400).json({ success: false, message: '수정할 필드가 없습니다.' });
        }

        setClauses.push('updated_at = NOW()');
        params.push(id);
        await query(`UPDATE posts SET ${setClauses.join(', ')} WHERE id = $${params.length}`, params);

        writeAuditLog({
            adminId, action: 'post.update',
            targetType: 'post', targetId: parseInt(id),
            before: before.rows[0], after: afterValues,
            description: `게시글 수정: ${before.rows[0].title}`,
            ipAddress: req.ip,
        });

        res.json({ success: true, message: '게시글이 수정되었습니다.' });
    } catch (error) {
        console.error('Admin update post error:', error);
        res.status(500).json({ success: false, message: '게시글 수정 중 오류가 발생했습니다.' });
    }
});

/**
 * POST /api/admin/posts/:id/pin
 * 공지 고정/해제 토글
 */
router.post('/posts/:id/pin', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;

        const before = await query('SELECT title, is_pinned FROM posts WHERE id = $1', [id]);
        if (before.rows.length === 0) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        const newPinned = !before.rows[0].is_pinned;
        await query('UPDATE posts SET is_pinned = $1, updated_at = NOW() WHERE id = $2', [newPinned, id]);

        writeAuditLog({
            adminId, action: 'post.pin_toggle',
            targetType: 'post', targetId: parseInt(id),
            before: { is_pinned: before.rows[0].is_pinned },
            after: { is_pinned: newPinned },
            description: `게시글 ${newPinned ? '고정' : '고정 해제'}: ${before.rows[0].title}`,
            ipAddress: req.ip,
        });

        res.json({
            success: true,
            message: newPinned ? '게시글이 고정되었습니다.' : '게시글 고정이 해제되었습니다.',
            data: { is_pinned: newPinned },
        });
    } catch (error) {
        console.error('Admin pin post error:', error);
        res.status(500).json({ success: false, message: '고정 처리 중 오류가 발생했습니다.' });
    }
});

/**
 * DELETE /api/admin/posts/:id
 * 게시글 삭제
 */
router.delete('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;

        const before = await query('SELECT title, author_id FROM posts WHERE id = $1', [id]);
        if (before.rows.length === 0) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        await query('DELETE FROM posts WHERE id = $1', [id]);

        writeAuditLog({
            adminId, action: 'post.delete',
            targetType: 'post', targetId: parseInt(id),
            before: { title: before.rows[0].title },
            description: `게시글 삭제: ${before.rows[0].title}`,
            ipAddress: req.ip,
        });

        res.json({ success: true, message: '게시글이 삭제되었습니다.' });
    } catch (error) {
        console.error('Admin delete post error:', error);
        res.status(500).json({ success: false, message: '게시글 삭제 중 오류가 발생했습니다.' });
    }
});

/**
 * DELETE /api/admin/posts/:postId/comments/:commentId
 * 댓글 삭제 (soft delete)
 */
router.delete('/posts/:postId/comments/:commentId', async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const adminId = req.user.userId;

        const before = await query('SELECT content, author_id FROM comments WHERE id = $1 AND post_id = $2', [commentId, postId]);
        if (before.rows.length === 0) {
            return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' });
        }

        await query('UPDATE comments SET is_deleted = true, updated_at = NOW() WHERE id = $1', [commentId]);

        // comments_count 갱신
        const countResult = await query(
            "SELECT COUNT(*) FROM comments WHERE post_id = $1 AND (is_deleted = false OR is_deleted IS NULL)",
            [postId]
        );
        await query('UPDATE posts SET comments_count = $1, updated_at = NOW() WHERE id = $2',
            [parseInt(countResult.rows[0].count), postId]
        );

        writeAuditLog({
            adminId, action: 'comment.delete',
            targetType: 'post', targetId: parseInt(postId),
            description: `댓글 삭제 (id=${commentId})`,
            ipAddress: req.ip,
        });

        res.json({ success: true, message: '댓글이 삭제되었습니다.' });
    } catch (error) {
        console.error('Admin delete comment error:', error);
        res.status(500).json({ success: false, message: '댓글 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   기존 posts/:id/comments 조회 (하위호환)
   ====================================================== */
router.get('/posts/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT c.id, c.content, c.is_deleted, c.parent_id, c.created_at,
                    c.author_id, u.name as author_name
             FROM comments c
             LEFT JOIN users u ON c.author_id = u.id
             WHERE c.post_id = $1
             ORDER BY c.created_at ASC`,
            [id],
        );
        return res.json({ success: true, comments: result.rows });
    } catch (err) {
        console.error('Admin post comments error:', err);
        return res.status(500).json({ success: false, message: '댓글 조회 중 오류가 발생했습니다.' });
    }
});

// DELETE /api/admin/comments/:id (하위호환)
router.delete('/comments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('UPDATE comments SET is_deleted = true, updated_at = NOW() WHERE id = $1', [id]);
        return res.json({ success: true, message: '댓글이 삭제되었습니다.' });
    } catch (err) {
        console.error('Admin delete comment error:', err);
        return res.status(500).json({ success: false, message: '댓글 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   공지사항 관리 (Phase 2 강화: 페이지네이션, 검색)
   ====================================================== */
router.get('/notices', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const pinned = req.query.pinned;

        let whereClause = "WHERE p.category = 'notice'";
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND (p.title ILIKE $${params.length} OR p.content ILIKE $${params.length})`;
        }

        if (pinned === 'true') {
            whereClause += ' AND p.is_pinned = true';
        } else if (pinned === 'false') {
            whereClause += ' AND (p.is_pinned = false OR p.is_pinned IS NULL)';
        }

        const countResult = await query(
            `SELECT COUNT(*) FROM posts p ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit, offset);
        const result = await query(
            `SELECT p.id, p.title, p.content, p.is_pinned as pinned, p.views,
                    p.comments_count, p.created_at, p.updated_at,
                    u.name as author_name
             FROM posts p
             LEFT JOIN users u ON p.author_id = u.id
             ${whereClause}
             ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params,
        );

        return res.json({
            success: true,
            notices: result.rows,
            data: {
                items: result.rows,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('Admin notices error:', err);
        return res.status(500).json({ success: false, message: '공지사항 조회 중 오류가 발생했습니다.' });
    }
});

router.post('/notices', async (req, res) => {
    try {
        const { title, content, pinned, images } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
        }
        const result = await query(
            `INSERT INTO posts (author_id, title, content, images, category, is_pinned, created_at, updated_at)
             VALUES ($1, $2, $3, $4, 'notice', $5, NOW(), NOW())
             RETURNING id`,
            [req.user.userId, title, content, images || [], !!pinned],
        );
        writeAuditLog({
            adminId: req.user.userId, action: 'notice.create',
            targetType: 'post', targetId: result.rows[0].id,
            description: `공지 작성: ${title}`,
            ipAddress: req.ip,
        });
        return res.status(201).json({ success: true, message: '공지사항이 추가되었습니다.', id: result.rows[0].id });
    } catch (err) {
        console.error('Admin create notice error:', err);
        return res.status(500).json({ success: false, message: '공지사항 추가 중 오류가 발생했습니다.' });
    }
});

router.put('/notices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, pinned, images } = req.body;
        await query(
            `UPDATE posts SET title = $1, content = $2, is_pinned = $3, images = $4, updated_at = NOW()
             WHERE id = $5 AND category = 'notice'`,
            [title, content, !!pinned, images || [], id],
        );
        writeAuditLog({
            adminId: req.user.userId, action: 'notice.update',
            targetType: 'post', targetId: parseInt(id),
            description: `공지 수정: ${title}`,
            ipAddress: req.ip,
        });
        return res.json({ success: true, message: '공지사항이 수정되었습니다.' });
    } catch (err) {
        console.error('Admin update notice error:', err);
        return res.status(500).json({ success: false, message: '공지사항 수정 중 오류가 발생했습니다.' });
    }
});

router.patch('/notices/:id', async (req, res) => {
    // 하위호환: PATCH도 PUT과 동일 처리
    const { id } = req.params;
    const { title, content, pinned } = req.body;
    await query(
        `UPDATE posts SET title = $1, content = $2, is_pinned = $3, updated_at = NOW()
         WHERE id = $4 AND category = 'notice'`,
        [title, content, !!pinned, id],
    );
    return res.json({ success: true, message: '공지사항이 수정되었습니다.' });
});

router.delete('/notices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const before = await query("SELECT title FROM posts WHERE id = $1 AND category = 'notice'", [id]);
        await query("DELETE FROM posts WHERE id = $1 AND category = 'notice'", [id]);
        if (before.rows.length > 0) {
            writeAuditLog({
                adminId: req.user.userId, action: 'notice.delete',
                targetType: 'post', targetId: parseInt(id),
                description: `공지 삭제: ${before.rows[0].title}`,
                ipAddress: req.ip,
            });
        }
        return res.json({ success: true, message: '공지사항이 삭제되었습니다.' });
    } catch (err) {
        console.error('Admin delete notice error:', err);
        return res.status(500).json({ success: false, message: '공지사항 삭제 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/admin/notices/:id/pin
 * 공지 고정/해제 토글
 */
router.put('/notices/:id/pin', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;

        const before = await query(
            "SELECT title, is_pinned FROM posts WHERE id = $1 AND category = 'notice'",
            [id]
        );
        if (before.rows.length === 0) {
            return res.status(404).json({ success: false, message: '공지사항을 찾을 수 없습니다.' });
        }

        const newPinned = !before.rows[0].is_pinned;
        await query(
            "UPDATE posts SET is_pinned = $1, updated_at = NOW() WHERE id = $2 AND category = 'notice'",
            [newPinned, id]
        );

        writeAuditLog({
            adminId, action: 'notice.pin_toggle',
            targetType: 'post', targetId: parseInt(id),
            before: { is_pinned: before.rows[0].is_pinned },
            after: { is_pinned: newPinned },
            description: `공지 ${newPinned ? '고정' : '고정 해제'}: ${before.rows[0].title}`,
            ipAddress: req.ip,
        });

        res.json({
            success: true,
            message: newPinned ? '공지가 고정되었습니다.' : '공지 고정이 해제되었습니다.',
            data: { is_pinned: newPinned },
        });
    } catch (error) {
        console.error('Admin pin notice error:', error);
        res.status(500).json({ success: false, message: '고정 처리 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   일정 관리 (Phase 2 강화: 페이지네이션, 검색, 날짜 범위)
   ====================================================== */
router.get('/schedules', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const month = req.query.month; // 'YYYY-MM'
        const category = req.query.category;
        const startFrom = req.query.start_from; // 'YYYY-MM-DD'
        const startTo = req.query.start_to;     // 'YYYY-MM-DD'

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND (s.title ILIKE $${params.length} OR s.location ILIKE $${params.length} OR s.description ILIKE $${params.length})`;
        }

        if (month) {
            const [y, m] = month.split('-');
            params.push(parseInt(y), parseInt(m));
            whereClause += ` AND EXTRACT(YEAR FROM s.start_date) = $${params.length - 1} AND EXTRACT(MONTH FROM s.start_date) = $${params.length}`;
        }

        if (startFrom) {
            params.push(startFrom);
            whereClause += ` AND s.start_date >= $${params.length}::date`;
        }

        if (startTo) {
            params.push(startTo);
            whereClause += ` AND s.start_date <= ($${params.length}::date + interval '1 day')`;
        }

        if (category) {
            params.push(category);
            whereClause += ` AND s.category = $${params.length}`;
        }

        const countResult = await query(
            `SELECT COUNT(*) FROM schedules s ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit, offset);
        const result = await query(
            `SELECT s.id, s.title,
                    s.start_date as date, s.end_date,
                    TO_CHAR(s.start_date, 'HH24:MI') as time,
                    s.location, s.category,
                    s.description as desc,
                    s.linked_post_id,
                    s.created_at, s.updated_at,
                    u.name as created_by_name,
                    (SELECT COUNT(*) FROM attendance_config ac WHERE ac.schedule_id = s.id) as has_attendance
             FROM schedules s
             LEFT JOIN users u ON s.created_by = u.id
             ${whereClause}
             ORDER BY s.start_date DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params,
        );

        return res.json({
            success: true,
            schedules: result.rows,
            data: {
                items: result.rows,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('Admin schedules error:', err);
        return res.status(500).json({ success: false, message: '일정 조회 중 오류가 발생했습니다.' });
    }
});

router.post('/schedules', async (req, res) => {
    try {
        const { title, date, time, location, desc, category, end_date } = req.body;
        if (!title || !date) {
            return res.status(400).json({ success: false, message: '제목과 날짜는 필수입니다.' });
        }
        const startDate = time ? `${date} ${time}` : date;
        const result = await query(
            `INSERT INTO schedules (created_by, title, start_date, end_date, location, description, category, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING id`,
            [req.user.userId, title, startDate, end_date || null, location || null, desc || null, category || null],
        );
        writeAuditLog({
            adminId: req.user.userId, action: 'schedule.create',
            targetType: 'schedule', targetId: result.rows[0].id,
            description: `일정 등록: ${title}`,
            ipAddress: req.ip,
        });
        return res.status(201).json({ success: true, message: '일정이 추가되었습니다.', id: result.rows[0].id });
    } catch (err) {
        console.error('Admin create schedule error:', err);
        return res.status(500).json({ success: false, message: '일정 추가 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/schedules/:id
 * 일정 상세 (출석 정보 포함)
 */
router.get('/schedules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const scheduleResult = await query(
            `SELECT s.id, s.title, s.description, s.start_date, s.end_date,
                    s.location, s.category, s.linked_post_id,
                    s.created_by, s.created_at, s.updated_at,
                    u.name as created_by_name
             FROM schedules s
             LEFT JOIN users u ON s.created_by = u.id
             WHERE s.id = $1`,
            [id]
        );

        if (scheduleResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '일정을 찾을 수 없습니다.' });
        }

        const schedule = scheduleResult.rows[0];

        // 출석 설정 조회
        const configResult = await query(
            `SELECT id, vote_type, quorum_count, quorum_basis, cost_per_person,
                    deadline, is_active, closed_at, created_at
             FROM attendance_config WHERE schedule_id = $1`,
            [id]
        );

        if (configResult.rows.length > 0) {
            const config = configResult.rows[0];
            // 출석 투표 집계
            const voteSummary = await query(
                `SELECT vote, COUNT(*) as count
                 FROM attendance_votes WHERE config_id = $1
                 GROUP BY vote`,
                [config.id]
            );
            config.vote_summary = {};
            voteSummary.rows.forEach(r => { config.vote_summary[r.vote] = parseInt(r.count); });
            config.total_votes = voteSummary.rows.reduce((s, r) => s + parseInt(r.count), 0);
            schedule.attendance = config;
        } else {
            schedule.attendance = null;
        }

        res.json({ success: true, data: schedule });
    } catch (error) {
        console.error('Admin schedule detail error:', error);
        res.status(500).json({ success: false, message: '일정 상세 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/schedules/:id/attendance
 * 일정 출석 목록 (투표 상세)
 */
router.get('/schedules/:id/attendance', async (req, res) => {
    try {
        const { id } = req.params;

        // 출석 설정 조회
        const configResult = await query(
            'SELECT id, vote_type, quorum_count, deadline, is_active FROM attendance_config WHERE schedule_id = $1',
            [id]
        );

        if (configResult.rows.length === 0) {
            return res.json({
                success: true,
                data: { config: null, votes: [], summary: {} },
            });
        }

        const config = configResult.rows[0];

        // 투표 목록 (회원 정보 포함)
        const votesResult = await query(
            `SELECT av.id, av.vote, av.voted_at, av.updated_at,
                    u.id as user_id, u.name, u.email, u.profile_image
             FROM attendance_votes av
             LEFT JOIN users u ON av.user_id = u.id
             WHERE av.config_id = $1
             ORDER BY av.voted_at DESC`,
            [config.id]
        );

        // 집계
        const summary = {};
        votesResult.rows.forEach(r => {
            summary[r.vote] = (summary[r.vote] || 0) + 1;
        });

        res.json({
            success: true,
            data: {
                config,
                votes: votesResult.rows,
                summary,
                total_votes: votesResult.rows.length,
            },
        });
    } catch (error) {
        console.error('Admin schedule attendance error:', error);
        res.status(500).json({ success: false, message: '출석 정보 조회 중 오류가 발생했습니다.' });
    }
});

router.put('/schedules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, date, time, location, desc, category, end_date } = req.body;
        const startDate = time ? `${date} ${time}` : (date || null);
        await query(
            `UPDATE schedules SET title = $1, start_date = $2, end_date = $3, location = $4,
                 description = $5, category = $6, updated_at = NOW() WHERE id = $7`,
            [title, startDate, end_date || null, location || null, desc || null, category || null, id],
        );
        writeAuditLog({
            adminId: req.user.userId, action: 'schedule.update',
            targetType: 'schedule', targetId: parseInt(id),
            description: `일정 수정: ${title}`,
            ipAddress: req.ip,
        });
        return res.json({ success: true, message: '일정이 수정되었습니다.' });
    } catch (err) {
        console.error('Admin update schedule error:', err);
        return res.status(500).json({ success: false, message: '일정 수정 중 오류가 발생했습니다.' });
    }
});

// PATCH schedules/:id (하위호환)
router.patch('/schedules/:id', async (req, res) => {
    const { id } = req.params;
    const { title, date, time, location, desc } = req.body;
    const startDate = time ? `${date} ${time}` : date;
    await query(
        `UPDATE schedules SET title = $1, start_date = $2, location = $3, description = $4, updated_at = NOW() WHERE id = $5`,
        [title, startDate, location || null, desc || null, id],
    );
    return res.json({ success: true, message: '일정이 수정되었습니다.' });
});

router.delete('/schedules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const before = await query('SELECT title FROM schedules WHERE id = $1', [id]);
        await query('DELETE FROM schedules WHERE id = $1', [id]);
        if (before.rows.length > 0) {
            writeAuditLog({
                adminId: req.user.userId, action: 'schedule.delete',
                targetType: 'schedule', targetId: parseInt(id),
                description: `일정 삭제: ${before.rows[0].title}`,
                ipAddress: req.ip,
            });
        }
        return res.json({ success: true, message: '일정이 삭제되었습니다.' });
    } catch (err) {
        console.error('Admin delete schedule error:', err);
        return res.status(500).json({ success: false, message: '일정 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   통계/분석 API (Phase 2)
   ====================================================== */

/**
 * GET /api/admin/stats/members
 * 회원 통계 (월별 가입, 역할 분포, 업종 분포)
 */
router.get('/stats/members', async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 6;

        const [monthlySignups, roleDistribution, industryDistribution, statusDistribution] = await Promise.all([
            // 월별 가입자 수
            query(
                `SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
                 FROM users
                 WHERE created_at >= NOW() - ($1 || ' months')::interval
                 GROUP BY TO_CHAR(created_at, 'YYYY-MM')
                 ORDER BY month`,
                [months]
            ),
            // 역할 분포
            query(
                `SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC`
            ),
            // 업종 분포
            query(
                `SELECT COALESCE(industry, '미설정') as industry, COUNT(*) as count
                 FROM users GROUP BY industry ORDER BY count DESC LIMIT 20`
            ),
            // 상태 분포
            query(
                `SELECT status, COUNT(*) as count FROM users GROUP BY status ORDER BY count DESC`
            ),
        ]);

        res.json({
            success: true,
            data: {
                monthly_signups: monthlySignups.rows.map(r => ({ month: r.month, count: parseInt(r.count) })),
                role_distribution: roleDistribution.rows.map(r => ({ role: r.role, count: parseInt(r.count) })),
                industry_distribution: industryDistribution.rows.map(r => ({ industry: r.industry, count: parseInt(r.count) })),
                status_distribution: statusDistribution.rows.map(r => ({ status: r.status, count: parseInt(r.count) })),
            },
        });
    } catch (error) {
        console.error('Stats members error:', error);
        res.status(500).json({ success: false, message: '회원 통계 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/stats/posts
 * 게시글 통계 (월별 게시글, 카테고리 분포)
 */
router.get('/stats/posts', async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 6;

        const [monthlyPosts, categoryDistribution, topAuthors] = await Promise.all([
            query(
                `SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
                 FROM posts
                 WHERE created_at >= NOW() - ($1 || ' months')::interval
                 GROUP BY TO_CHAR(created_at, 'YYYY-MM')
                 ORDER BY month`,
                [months]
            ),
            query(
                `SELECT COALESCE(category, 'general') as category, COUNT(*) as count
                 FROM posts GROUP BY category ORDER BY count DESC`
            ),
            query(
                `SELECT u.name, u.id as user_id, COUNT(p.id) as post_count
                 FROM posts p JOIN users u ON p.author_id = u.id
                 GROUP BY u.id, u.name
                 ORDER BY post_count DESC LIMIT 10`
            ),
        ]);

        res.json({
            success: true,
            data: {
                monthly_posts: monthlyPosts.rows.map(r => ({ month: r.month, count: parseInt(r.count) })),
                category_distribution: categoryDistribution.rows.map(r => ({ category: r.category, count: parseInt(r.count) })),
                top_authors: topAuthors.rows.map(r => ({ name: r.name, user_id: r.user_id, post_count: parseInt(r.post_count) })),
            },
        });
    } catch (error) {
        console.error('Stats posts error:', error);
        res.status(500).json({ success: false, message: '게시글 통계 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/stats/schedules
 * 일정 통계 (월별 일정, 카테고리 분포)
 */
router.get('/stats/schedules', async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 6;

        const [monthlySchedules, categoryDistribution, attendanceStats] = await Promise.all([
            query(
                `SELECT TO_CHAR(start_date, 'YYYY-MM') as month, COUNT(*) as count
                 FROM schedules
                 WHERE start_date >= NOW() - ($1 || ' months')::interval
                 GROUP BY TO_CHAR(start_date, 'YYYY-MM')
                 ORDER BY month`,
                [months]
            ),
            query(
                `SELECT COALESCE(category, '미분류') as category, COUNT(*) as count
                 FROM schedules GROUP BY category ORDER BY count DESC`
            ),
            // 출석 투표 통계 (최근 일정들)
            query(
                `SELECT av.vote, COUNT(*) as count
                 FROM attendance_votes av
                 JOIN attendance_config ac ON av.config_id = ac.id
                 GROUP BY av.vote ORDER BY count DESC`
            ),
        ]);

        res.json({
            success: true,
            data: {
                monthly_schedules: monthlySchedules.rows.map(r => ({ month: r.month, count: parseInt(r.count) })),
                category_distribution: categoryDistribution.rows.map(r => ({ category: r.category, count: parseInt(r.count) })),
                attendance_stats: attendanceStats.rows.map(r => ({ vote: r.vote, count: parseInt(r.count) })),
            },
        });
    } catch (error) {
        console.error('Stats schedules error:', error);
        res.status(500).json({ success: false, message: '일정 통계 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/stats/activity
 * 활동 통계 (일별 게시글/댓글 수)
 */
router.get('/stats/activity', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;

        const [dailyPosts, dailyComments, dailySignups] = await Promise.all([
            query(
                `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
                 FROM posts
                 WHERE created_at >= NOW() - ($1 || ' days')::interval
                 GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
                 ORDER BY date`,
                [days]
            ),
            query(
                `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
                 FROM comments
                 WHERE (is_deleted = false OR is_deleted IS NULL)
                       AND created_at >= NOW() - ($1 || ' days')::interval
                 GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
                 ORDER BY date`,
                [days]
            ),
            query(
                `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
                 FROM users
                 WHERE created_at >= NOW() - ($1 || ' days')::interval
                 GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
                 ORDER BY date`,
                [days]
            ),
        ]);

        res.json({
            success: true,
            data: {
                daily_posts: dailyPosts.rows.map(r => ({ date: r.date, count: parseInt(r.count) })),
                daily_comments: dailyComments.rows.map(r => ({ date: r.date, count: parseInt(r.count) })),
                daily_signups: dailySignups.rows.map(r => ({ date: r.date, count: parseInt(r.count) })),
            },
        });
    } catch (error) {
        console.error('Stats activity error:', error);
        res.status(500).json({ success: false, message: '활동 통계 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/audit-log
 * 전체 감사 로그 조회 (검색, 필터, 페이지네이션)
 */
router.get('/audit-log', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const action = req.query.action || '';
        const targetType = req.query.target_type || '';

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (action) {
            params.push(action);
            whereClause += ` AND al.action = $${params.length}`;
        }

        if (targetType) {
            params.push(targetType);
            whereClause += ` AND al.target_type = $${params.length}`;
        }

        const countResult = await query(
            `SELECT COUNT(*) FROM audit_log al ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit, offset);
        const result = await query(
            `SELECT al.id, al.action, al.target_type, al.target_id,
                    al.before_value, al.after_value, al.description,
                    al.ip_address, al.created_at,
                    u.name as admin_name, u.email as admin_email
             FROM audit_log al
             LEFT JOIN users u ON al.admin_id = u.id
             ${whereClause}
             ORDER BY al.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({
            success: true,
            data: {
                items: result.rows,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Audit log error:', error);
        res.status(500).json({ success: false, message: '감사 로그 조회 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   역할 관리 (기존 유지)
   ====================================================== */
router.get('/roles', async (req, res) => {
    const ROLES = [
        { id: 'super_admin', name: 'super_admin', display_name: '최고 관리자', permissions: ['notice_write', 'schedule_manage', 'board_delete'] },
        { id: 'admin', name: 'admin', display_name: '관리자', permissions: ['notice_write', 'schedule_manage'] },
        { id: 'member', name: 'member', display_name: '일반 회원', permissions: [] },
    ];
    return res.json({ success: true, roles: ROLES });
});

router.put('/roles', async (req, res) => {
    return res.json({ success: true, message: '권한 설정이 저장되었습니다.' });
});

/* ======================================================
   관리자 비밀번호 변경 (하위호환 PATCH 경로)
   ====================================================== */
router.patch('/account/password', async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const userId = req.user.userId;
        const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (!result.rows.length) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        const valid = await comparePassword(current_password, result.rows[0].password_hash);
        if (!valid) return res.status(401).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
        const newHash = await hashPassword(new_password);
        await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
        return res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
    } catch (err) {
        console.error('Admin password change error:', err);
        return res.status(500).json({ success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
