const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
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
                    p.comments_count, p.linked_schedule_id, p.created_at, p.updated_at,
                    u.name as author_name,
                    s.title as schedule_title, s.start_date as schedule_start_date
             FROM posts p
             LEFT JOIN users u ON p.author_id = u.id
             LEFT JOIN schedules s ON p.linked_schedule_id = s.id
             ${whereClause}
             ORDER BY p.is_pinned DESC NULLS LAST, p.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params,
        );

        const notices = result.rows.map(row => {
            const { schedule_title, schedule_start_date, ...notice } = row;
            if (notice.linked_schedule_id) {
                notice.linked_schedule = { id: notice.linked_schedule_id, title: schedule_title, start_date: schedule_start_date };
            }
            return notice;
        });

        return res.json({
            success: true,
            notices,
            data: {
                items: notices,
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
        const { title, content, pinned, images, schedule_id, schedule } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
        }

        // schedule 객체가 있으면 트랜잭션으로 일정 동시 생성 (M-12)
        if (schedule) {
            const result = await transaction(async (client) => {
                const postResult = await client.query(
                    `INSERT INTO posts (author_id, title, content, images, category, is_pinned, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, 'notice', $5, NOW(), NOW())
                     RETURNING id`,
                    [req.user.userId, title, content, images || [], !!pinned]
                );
                const postId = postResult.rows[0].id;

                const schedResult = await client.query(
                    `INSERT INTO schedules (created_by, title, start_date, end_date, location, description, category, linked_post_id, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                     RETURNING id`,
                    [req.user.userId, schedule.title || title, schedule.start_date, schedule.end_date || null, schedule.location || null, schedule.description || null, schedule.category || 'event', postId]
                );
                const scheduleId = schedResult.rows[0].id;

                await client.query('UPDATE posts SET linked_schedule_id = $1 WHERE id = $2', [scheduleId, postId]);

                return { postId, scheduleId };
            });
            writeAuditLog({
                adminId: req.user.userId, action: 'notice.create',
                targetType: 'post', targetId: result.postId,
                description: `공지 작성 (일정 연동 id=${result.scheduleId}): ${title}`,
                ipAddress: req.ip,
            });
            return res.status(201).json({
                success: true, message: '공지사항과 일정이 함께 추가되었습니다.',
                id: result.postId, schedule_id: result.scheduleId
            });
        }

        // schedule_id로 기존 일정에 연결
        const linkedScheduleId = schedule_id ? parseInt(schedule_id) : null;
        const result = await query(
            `INSERT INTO posts (author_id, title, content, images, category, is_pinned, linked_schedule_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, 'notice', $5, $6, NOW(), NOW())
             RETURNING id`,
            [req.user.userId, title, content, images || [], !!pinned, linkedScheduleId],
        );
        const postId = result.rows[0].id;

        // 양방향 연결
        if (linkedScheduleId) {
            await query('UPDATE schedules SET linked_post_id = $1 WHERE id = $2', [postId, linkedScheduleId]);
        }

        writeAuditLog({
            adminId: req.user.userId, action: 'notice.create',
            targetType: 'post', targetId: postId,
            description: `공지 작성${linkedScheduleId ? ' (일정 연동 id=' + linkedScheduleId + ')' : ''}: ${title}`,
            ipAddress: req.ip,
        });
        return res.status(201).json({ success: true, message: '공지사항이 추가되었습니다.', id: postId });
    } catch (err) {
        console.error('Admin create notice error:', err);
        return res.status(500).json({ success: false, message: '공지사항 추가 중 오류가 발생했습니다.' });
    }
});

router.put('/notices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, pinned, images, schedule_id, schedule } = req.body;

        // 기존 연결 확인
        const existing = await query(
            "SELECT linked_schedule_id FROM posts WHERE id = $1 AND category = 'notice'",
            [id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: '공지사항을 찾을 수 없습니다.' });
        }
        const existingScheduleId = existing.rows[0].linked_schedule_id;

        // schedule 객체로 연결 일정 동기화 (M-12)
        if (schedule !== undefined) {
            await transaction(async (client) => {
                if (schedule === null) {
                    // 연결 해제
                    await client.query(
                        `UPDATE posts SET title=$1, content=$2, is_pinned=$3, images=$4, linked_schedule_id=NULL, updated_at=NOW()
                         WHERE id=$5 AND category='notice'`,
                        [title, content, !!pinned, images || [], id]
                    );
                    if (existingScheduleId) {
                        await client.query('UPDATE schedules SET linked_post_id = NULL WHERE id = $1', [existingScheduleId]);
                    }
                } else if (existingScheduleId) {
                    // 기존 연결 일정 업데이트
                    await client.query(
                        `UPDATE posts SET title=$1, content=$2, is_pinned=$3, images=$4, updated_at=NOW()
                         WHERE id=$5 AND category='notice'`,
                        [title, content, !!pinned, images || [], id]
                    );
                    await client.query(
                        `UPDATE schedules SET title=$1, start_date=$2, end_date=$3, location=$4, description=$5, category=$6, updated_at=NOW() WHERE id=$7`,
                        [schedule.title || title, schedule.start_date, schedule.end_date || null, schedule.location || null, schedule.description || null, schedule.category || 'event', existingScheduleId]
                    );
                } else {
                    // 신규 일정 생성 + 연결
                    const schedResult = await client.query(
                        `INSERT INTO schedules (created_by, title, start_date, end_date, location, description, category, linked_post_id, created_at, updated_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING id`,
                        [req.user.userId, schedule.title || title, schedule.start_date, schedule.end_date || null, schedule.location || null, schedule.description || null, schedule.category || 'event', id]
                    );
                    await client.query(
                        `UPDATE posts SET title=$1, content=$2, is_pinned=$3, images=$4, linked_schedule_id=$5, updated_at=NOW()
                         WHERE id=$6 AND category='notice'`,
                        [title, content, !!pinned, images || [], schedResult.rows[0].id, id]
                    );
                }
            });
        } else {
            // schedule_id 직접 지정 (기존 일정 연결/해제)
            const newScheduleId = schedule_id !== undefined ? (schedule_id ? parseInt(schedule_id) : null) : existingScheduleId;
            await query(
                `UPDATE posts SET title = $1, content = $2, is_pinned = $3, images = $4, linked_schedule_id = $5, updated_at = NOW()
                 WHERE id = $6 AND category = 'notice'`,
                [title, content, !!pinned, images || [], newScheduleId, id],
            );
            // 양방향 연결 동기화
            if (newScheduleId && newScheduleId !== existingScheduleId) {
                await query('UPDATE schedules SET linked_post_id = $1 WHERE id = $2', [parseInt(id), newScheduleId]);
                if (existingScheduleId) {
                    await query('UPDATE schedules SET linked_post_id = NULL WHERE id = $1', [existingScheduleId]);
                }
            } else if (!newScheduleId && existingScheduleId) {
                await query('UPDATE schedules SET linked_post_id = NULL WHERE id = $1', [existingScheduleId]);
            }
        }

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
        const deleteLinkedSchedule = req.query.delete_linked_schedule === 'true';

        const before = await query("SELECT title, linked_schedule_id FROM posts WHERE id = $1 AND category = 'notice'", [id]);
        if (before.rows.length === 0) {
            return res.status(404).json({ success: false, message: '공지사항을 찾을 수 없습니다.' });
        }

        const linkedScheduleId = before.rows[0].linked_schedule_id;

        await transaction(async (client) => {
            if (linkedScheduleId) {
                if (deleteLinkedSchedule) {
                    await client.query('UPDATE posts SET linked_schedule_id = NULL WHERE id = $1', [id]);
                    await client.query('DELETE FROM schedules WHERE id = $1', [linkedScheduleId]);
                } else {
                    await client.query('UPDATE posts SET linked_schedule_id = NULL WHERE id = $1', [id]);
                    await client.query('UPDATE schedules SET linked_post_id = NULL WHERE id = $1', [linkedScheduleId]);
                }
            }
            await client.query("DELETE FROM posts WHERE id = $1 AND category = 'notice'", [id]);
        });

        writeAuditLog({
            adminId: req.user.userId, action: 'notice.delete',
            targetType: 'post', targetId: parseInt(id),
            description: `공지 삭제${linkedScheduleId ? (deleteLinkedSchedule ? ' (연결 일정도 삭제)' : ' (연결 일정 해제)') : ''}: ${before.rows[0].title}`,
            ipAddress: req.ip,
        });
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
   PUT /api/admin/auth/profile
   관리자 프로필 수정 (이름, 전화번호)
   ====================================================== */
router.put('/auth/profile', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, phone } = req.body;

        const setClauses = [];
        const params = [];

        if (name !== undefined && name.trim()) {
            params.push(name.trim());
            setClauses.push(`name = $${params.length}`);
        }
        if (phone !== undefined) {
            params.push(phone.trim() || null);
            setClauses.push(`phone = $${params.length}`);
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ success: false, message: '수정할 필드가 없습니다.' });
        }

        setClauses.push('updated_at = NOW()');
        params.push(userId);

        await query(
            `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
            params
        );

        const updated = await query(
            'SELECT id, email, name, phone, role, status, profile_image FROM users WHERE id = $1',
            [userId]
        );

        writeAuditLog({
            adminId: userId, action: 'admin.profile_update',
            targetType: 'member', targetId: userId,
            description: `관리자 프로필 수정: ${setClauses.filter(c => c !== 'updated_at = NOW()').join(', ')}`,
            ipAddress: req.ip,
        });

        return res.json({ success: true, data: updated.rows[0] });
    } catch (err) {
        console.error('Admin profile update error:', err);
        return res.status(500).json({ success: false, message: '프로필 수정 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   GET /api/admin/settings
   시스템 설정 조회
   ====================================================== */
router.get('/settings', async (req, res) => {
    try {
        const result = await query('SELECT * FROM app_settings WHERE id = 1');
        if (result.rows.length === 0) {
            // 기본값 반환
            return res.json({
                success: true,
                data: {
                    app_name: '영등포 JC',
                    app_description: '회원관리 커뮤니티 앱',
                    require_approval: false,
                    default_role: 'member',
                    push_enabled: true,
                    updated_at: null,
                    updated_by: null,
                },
            });
        }
        return res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Admin settings get error:', err);
        return res.status(500).json({ success: false, message: '설정 조회 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   PUT /api/admin/settings
   시스템 설정 변경
   ====================================================== */
router.put('/settings', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { app_name, app_description, require_approval, default_role, push_enabled } = req.body;

        // default_role 유효성 검증
        if (default_role !== undefined) {
            const validRoles = ['member', 'admin'];
            if (!validRoles.includes(default_role)) {
                return res.status(400).json({ success: false, message: '유효하지 않은 기본 역할입니다.' });
            }
        }

        const setClauses = [];
        const params = [];

        if (app_name !== undefined) {
            params.push(app_name.trim());
            setClauses.push(`app_name = $${params.length}`);
        }
        if (app_description !== undefined) {
            params.push(app_description.trim());
            setClauses.push(`app_description = $${params.length}`);
        }
        if (require_approval !== undefined) {
            params.push(!!require_approval);
            setClauses.push(`require_approval = $${params.length}`);
        }
        if (default_role !== undefined) {
            params.push(default_role);
            setClauses.push(`default_role = $${params.length}`);
        }
        if (push_enabled !== undefined) {
            params.push(!!push_enabled);
            setClauses.push(`push_enabled = $${params.length}`);
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ success: false, message: '수정할 항목이 없습니다.' });
        }

        params.push(userId);
        setClauses.push(`updated_by = $${params.length}`);
        setClauses.push('updated_at = NOW()');

        await query(
            `UPDATE app_settings SET ${setClauses.join(', ')} WHERE id = 1`,
            params
        );

        const updated = await query('SELECT * FROM app_settings WHERE id = 1');

        writeAuditLog({
            adminId: userId, action: 'settings.update',
            targetType: 'settings', targetId: 1,
            description: `시스템 설정 변경`,
            ipAddress: req.ip,
        });

        return res.json({ success: true, data: updated.rows[0], message: '설정이 저장되었습니다.' });
    } catch (err) {
        console.error('Admin settings update error:', err);
        return res.status(500).json({ success: false, message: '설정 변경 중 오류가 발생했습니다.' });
    }
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

/* ======================================================
   GET /api/admin/positions
   직책 목록 조회
   ====================================================== */
router.get('/positions', authenticate, async (req, res) => {
    try {
        const userResult = await query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
        if (!userResult.rows.length || !['admin', 'super_admin'].includes(userResult.rows[0].role)) {
            return res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
        }

        const result = await query(
            `SELECT p.id, p.name, p.level, p.description, p.created_at, p.updated_at,
                    (SELECT COUNT(*) FROM position_permissions pp WHERE pp.position_id = p.id AND pp.granted = true)::int AS permission_count
             FROM positions p
             ORDER BY p.level DESC, p.name ASC`
        );

        return res.json({ success: true, data: { items: result.rows, total: result.rows.length } });
    } catch (err) {
        console.error('Get positions error:', err);
        return res.status(500).json({ success: false, message: '직책 목록 조회 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   POST /api/admin/positions
   직책 생성
   ====================================================== */
router.post('/positions', authenticate, async (req, res) => {
    try {
        const userResult = await query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
        if (!userResult.rows.length || !['admin', 'super_admin'].includes(userResult.rows[0].role)) {
            return res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
        }

        const { name, level, description } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, message: '직책 이름을 입력해주세요.' });
        }

        const result = await query(
            `INSERT INTO positions (name, level, description, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             RETURNING id, name, level, description, created_at`,
            [String(name).trim(), level || 0, description || null]
        );

        await writeAuditLog(req.user.userId, 'position.create', 'position', result.rows[0].id, null, result.rows[0], `직책 "${name}" 생성`);

        return res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: '이미 존재하는 직책 이름입니다.' });
        }
        console.error('Create position error:', err);
        return res.status(500).json({ success: false, message: '직책 생성 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   PUT /api/admin/positions/:id
   직책 수정
   ====================================================== */
router.put('/positions/:id', authenticate, async (req, res) => {
    try {
        const userResult = await query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
        if (!userResult.rows.length || !['admin', 'super_admin'].includes(userResult.rows[0].role)) {
            return res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
        }

        const { id } = req.params;
        const { name, level, description } = req.body;

        const existing = await query('SELECT * FROM positions WHERE id = $1', [id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, message: '직책을 찾을 수 없습니다.' });
        }

        const beforeValue = existing.rows[0];

        const sets = [];
        const params = [];
        let paramIdx = 1;

        if (name !== undefined) {
            sets.push(`name = $${paramIdx++}`);
            params.push(String(name).trim());
        }
        if (level !== undefined) {
            sets.push(`level = $${paramIdx++}`);
            params.push(level);
        }
        if (description !== undefined) {
            sets.push(`description = $${paramIdx++}`);
            params.push(description);
        }

        if (sets.length === 0) {
            return res.status(400).json({ success: false, message: '수정할 필드가 없습니다.' });
        }

        sets.push(`updated_at = NOW()`);
        params.push(id);

        const result = await query(
            `UPDATE positions SET ${sets.join(', ')} WHERE id = $${paramIdx} RETURNING id, name, level, description, updated_at`,
            params
        );

        await writeAuditLog(req.user.userId, 'position.update', 'position', id, beforeValue, result.rows[0], `직책 "${result.rows[0].name}" 수정`);

        return res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: '이미 존재하는 직책 이름입니다.' });
        }
        console.error('Update position error:', err);
        return res.status(500).json({ success: false, message: '직책 수정 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   DELETE /api/admin/positions/:id
   직책 삭제
   ====================================================== */
router.delete('/positions/:id', authenticate, async (req, res) => {
    try {
        const userResult = await query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
        if (!userResult.rows.length || !['admin', 'super_admin'].includes(userResult.rows[0].role)) {
            return res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
        }

        const { id } = req.params;

        const existing = await query('SELECT * FROM positions WHERE id = $1', [id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, message: '직책을 찾을 수 없습니다.' });
        }

        await query('DELETE FROM positions WHERE id = $1', [id]);

        await writeAuditLog(req.user.userId, 'position.delete', 'position', id, existing.rows[0], null, `직책 "${existing.rows[0].name}" 삭제`);

        return res.json({ success: true, message: '직책이 삭제되었습니다.' });
    } catch (err) {
        console.error('Delete position error:', err);
        return res.status(500).json({ success: false, message: '직책 삭제 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   GET /api/admin/positions/:id/permissions
   직책별 권한 목록 조회
   ====================================================== */
router.get('/positions/:id/permissions', authenticate, async (req, res) => {
    try {
        const userResult = await query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
        if (!userResult.rows.length || !['admin', 'super_admin'].includes(userResult.rows[0].role)) {
            return res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
        }

        const { id } = req.params;

        const posResult = await query('SELECT id, name, level FROM positions WHERE id = $1', [id]);
        if (!posResult.rows.length) {
            return res.status(404).json({ success: false, message: '직책을 찾을 수 없습니다.' });
        }

        const permResult = await query(
            `SELECT id, permission, granted FROM position_permissions WHERE position_id = $1 ORDER BY permission ASC`,
            [id]
        );

        return res.json({
            success: true,
            data: {
                position: posResult.rows[0],
                permissions: permResult.rows
            }
        });
    } catch (err) {
        console.error('Get position permissions error:', err);
        return res.status(500).json({ success: false, message: '권한 조회 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   PUT /api/admin/positions/:id/permissions
   직책별 권한 일괄 업데이트
   Body: { permissions: [ { permission: 'member.edit', granted: true }, ... ] }
   ====================================================== */
router.put('/positions/:id/permissions', authenticate, async (req, res) => {
    try {
        const userResult = await query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
        if (!userResult.rows.length || !['admin', 'super_admin'].includes(userResult.rows[0].role)) {
            return res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
        }

        const { id } = req.params;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ success: false, message: 'permissions 배열이 필요합니다.' });
        }

        const posResult = await query('SELECT id, name FROM positions WHERE id = $1', [id]);
        if (!posResult.rows.length) {
            return res.status(404).json({ success: false, message: '직책을 찾을 수 없습니다.' });
        }

        // 기존 권한 snapshot (audit용)
        const beforePerms = await query(
            'SELECT permission, granted FROM position_permissions WHERE position_id = $1 ORDER BY permission',
            [id]
        );

        await transaction(async (client) => {
            // 기존 권한 전부 삭제 후 재삽입
            await client.query('DELETE FROM position_permissions WHERE position_id = $1', [id]);

            for (const p of permissions) {
                if (!p.permission || typeof p.permission !== 'string') continue;
                await client.query(
                    `INSERT INTO position_permissions (position_id, permission, granted) VALUES ($1, $2, $3)`,
                    [id, p.permission.trim(), p.granted !== false]
                );
            }
        });

        // 업데이트된 권한 조회
        const afterPerms = await query(
            'SELECT permission, granted FROM position_permissions WHERE position_id = $1 ORDER BY permission',
            [id]
        );

        await writeAuditLog(req.user.userId, 'position.permissions_update', 'position', id,
            { permissions: beforePerms.rows },
            { permissions: afterPerms.rows },
            `직책 "${posResult.rows[0].name}" 권한 업데이트 (${afterPerms.rows.length}개)`
        );

        return res.json({
            success: true,
            data: {
                position: posResult.rows[0],
                permissions: afterPerms.rows
            }
        });
    } catch (err) {
        console.error('Update position permissions error:', err);
        return res.status(500).json({ success: false, message: '권한 업데이트 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   회원 직책 변경 + 이력 API
   ====================================================== */

/**
 * PUT /api/admin/members/:id/position
 * 회원 직책 변경 (position_history 자동 기록)
 */
router.put('/members/:id/position', async (req, res) => {
    try {
        const { id } = req.params;
        const { position_id, notes } = req.body;
        const adminId = req.user.userId;

        if (!position_id) {
            return res.status(400).json({ success: false, message: 'position_id를 입력해주세요.' });
        }

        // 직책 존재 확인
        const posResult = await query('SELECT id, name FROM positions WHERE id = $1', [position_id]);
        if (posResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '존재하지 않는 직책입니다.' });
        }

        // 회원 존재 확인
        const memberResult = await query('SELECT id, name, position_id FROM users WHERE id = $1', [id]);
        if (memberResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        const beforePositionId = memberResult.rows[0].position_id;

        // 트랜잭션: 직책 변경 + 이력 기록
        await transaction(async (client) => {
            await client.query(
                'UPDATE users SET position_id = $1, updated_at = NOW() WHERE id = $2',
                [position_id, id]
            );
            await client.query(
                `INSERT INTO position_history (user_id, position_id, assigned_at, assigned_by, notes)
                 VALUES ($1, $2, NOW(), $3, $4)`,
                [id, position_id, adminId, notes || null]
            );
        });

        writeAuditLog({
            adminId, action: 'member.position_change',
            targetType: 'member', targetId: parseInt(id),
            before: { position_id: beforePositionId },
            after: { position_id },
            description: `회원 ${memberResult.rows[0].name} 직책 변경 → ${posResult.rows[0].name}`,
            ipAddress: req.ip,
        });

        res.json({
            success: true,
            message: `직책이 ${posResult.rows[0].name}(으)로 변경되었습니다.`,
            data: { position_id, position_name: posResult.rows[0].name }
        });
    } catch (err) {
        console.error('Update member position error:', err);
        res.status(500).json({ success: false, message: '직책 변경 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/members/:id/position-history
 * 회원 직책 변동 이력
 */
router.get('/members/:id/position-history', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT ph.id, ph.position_id, p.name as position_name,
                    ph.assigned_at, ph.notes,
                    u.name as assigned_by_name
             FROM position_history ph
             LEFT JOIN positions p ON ph.position_id = p.id
             LEFT JOIN users u ON ph.assigned_by = u.id
             WHERE ph.user_id = $1
             ORDER BY ph.assigned_at DESC`,
            [id]
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Get position history error:', err);
        res.status(500).json({ success: false, message: '직책 이력 조회 중 오류가 발생했습니다.' });
    }
});

/* ======================================================
   회원 인물카드(Dossier) API
   ====================================================== */

/**
 * GET /api/admin/members/:id/dossier
 * 인물카드 전체 데이터 (기본정보+교육+경력+가족+활동+메모 통합)
 */
router.get('/members/:id/dossier', async (req, res) => {
    try {
        const { id } = req.params;

        const [memberResult, activitiesResult, posHistoryResult] = await Promise.all([
            query(
                `SELECT u.id, u.email, u.name, u.phone, u.birth_date, u.gender,
                        u.address, u.address_detail, u.postal_code,
                        u.profile_image, u.role, u.status,
                        u.position, u.position_id, p.name as position_name,
                        u.department, u.join_number,
                        u.company, u.work_phone, u.work_address,
                        u.industry, u.industry_detail,
                        u.hobbies, u.specialties, u.special_notes,
                        u.admin_memo,
                        u.educations, u.careers, u.families,
                        u.emergency_contact, u.emergency_contact_name, u.emergency_relationship,
                        u.created_at, u.updated_at
                 FROM users u
                 LEFT JOIN positions p ON u.position_id = p.id
                 WHERE u.id = $1`,
                [id]
            ),
            query(
                `SELECT id, activity_type, title, date, description, created_at
                 FROM member_activities
                 WHERE user_id = $1
                 ORDER BY date DESC NULLS LAST, created_at DESC`,
                [id]
            ),
            query(
                `SELECT ph.id, ph.position_id, pos.name as position_name,
                        ph.assigned_at, ph.notes,
                        u.name as assigned_by_name
                 FROM position_history ph
                 LEFT JOIN positions pos ON ph.position_id = pos.id
                 LEFT JOIN users u ON ph.assigned_by = u.id
                 WHERE ph.user_id = $1
                 ORDER BY ph.assigned_at DESC`,
                [id]
            )
        ]);

        if (memberResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        const member = memberResult.rows[0];

        res.json({
            success: true,
            data: {
                ...member,
                activities: activitiesResult.rows,
                position_history: posHistoryResult.rows
            }
        });
    } catch (err) {
        console.error('Get member dossier error:', err);
        res.status(500).json({ success: false, message: '인물카드 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/admin/members/:id/dossier
 * 인물카드 수정 (섹션별 부분 업데이트)
 */
router.put('/members/:id/dossier', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.userId;
        const {
            hobbies, specialties, special_notes, admin_memo,
            educations, careers, families
        } = req.body;

        const memberResult = await query('SELECT id FROM users WHERE id = $1', [id]);
        if (memberResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        const setClauses = [];
        const params = [];

        const addField = (field, value, isJson) => {
            if (value !== undefined) {
                params.push(isJson ? JSON.stringify(value) : value);
                setClauses.push(`${field} = $${params.length}`);
            }
        };

        addField('hobbies', hobbies);
        addField('specialties', specialties);
        addField('special_notes', special_notes);
        addField('admin_memo', admin_memo);
        addField('educations', educations, true);
        addField('careers', careers, true);
        addField('families', families, true);

        if (setClauses.length === 0) {
            return res.status(400).json({ success: false, message: '수정할 필드가 없습니다.' });
        }

        setClauses.push('updated_at = NOW()');
        params.push(id);

        await query(
            `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
            params
        );

        writeAuditLog({
            adminId, action: 'member.dossier_update',
            targetType: 'member', targetId: parseInt(id),
            description: `인물카드 수정: ${Object.keys(req.body).join(', ')}`,
            ipAddress: req.ip,
        });

        res.json({ success: true, message: '인물카드가 수정되었습니다.' });
    } catch (err) {
        console.error('Update member dossier error:', err);
        res.status(500).json({ success: false, message: '인물카드 수정 중 오류가 발생했습니다.' });
    }
});

/**
 * POST /api/admin/members/:id/activities
 * 활동 이력 추가
 */
router.post('/members/:id/activities', async (req, res) => {
    try {
        const { id } = req.params;
        const { activity_type, title, date, description } = req.body;

        if (!activity_type || !title) {
            return res.status(400).json({ success: false, message: 'activity_type과 title은 필수입니다.' });
        }

        const validTypes = ['committee', 'volunteer', 'award', 'training', 'other'];
        if (!validTypes.includes(activity_type)) {
            return res.status(400).json({ success: false, message: `activity_type은 ${validTypes.join(', ')} 중 하나여야 합니다.` });
        }

        const memberResult = await query('SELECT id FROM users WHERE id = $1', [id]);
        if (memberResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        const result = await query(
            `INSERT INTO member_activities (user_id, activity_type, title, date, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, activity_type, title, date, description, created_at`,
            [id, activity_type, title, date || null, description || null]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Create member activity error:', err);
        res.status(500).json({ success: false, message: '활동 이력 추가 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/admin/members/:id/activities
 * 활동 이력 조회
 */
router.get('/members/:id/activities', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT id, activity_type, title, date, description, created_at
             FROM member_activities
             WHERE user_id = $1
             ORDER BY date DESC NULLS LAST, created_at DESC`,
            [id]
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Get member activities error:', err);
        res.status(500).json({ success: false, message: '활동 이력 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/admin/members/:id/memo
 * 관리자 메모 수정
 */
router.put('/members/:id/memo', async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_memo } = req.body;

        if (admin_memo === undefined) {
            return res.status(400).json({ success: false, message: 'admin_memo 필드가 필요합니다.' });
        }

        const memberResult = await query('SELECT id FROM users WHERE id = $1', [id]);
        if (memberResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '회원을 찾을 수 없습니다.' });
        }

        await query(
            'UPDATE users SET admin_memo = $1, updated_at = NOW() WHERE id = $2',
            [admin_memo, id]
        );

        res.json({ success: true, message: '관리자 메모가 수정되었습니다.' });
    } catch (err) {
        console.error('Update member memo error:', err);
        res.status(500).json({ success: false, message: '관리자 메모 수정 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
