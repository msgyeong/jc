const express = require('express');
const multer = require('multer');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const photoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
        else cb(new Error('허용 형식: JPEG, PNG, GIF, WebP'));
    }
});

/**
 * GET /api/profile
 * 내 프로필 조회
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 프로필 조회
        const result = await query(
            `SELECT
                id, email, name, phone, address,
                profile_image, role, status,
                birth_date, gender,
                company, position, department, work_phone,
                industry, industry_detail,
                position_id,
                created_at, updated_at
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '프로필을 찾을 수 없습니다.'
            });
        }

        // 앱 관리 권한 조회
        const { getMobilePermissions } = require('../middleware/mobileAdmin');
        const mobilePerms = await getMobilePermissions(userId, result.rows[0].role);

        res.json({
            success: true,
            profile: {
                ...result.rows[0],
                mobile_permissions: mobilePerms
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 조회 중 오류가 발생했습니다.'
        });
    }
});

// 관리자 전용 필드 — 일반 회원이 PUT /api/profile로 수정 불가
const ADMIN_ONLY_FIELDS = ['position', 'department', 'join_number', 'role', 'status'];

/**
 * PUT /api/profile
 * 프로필 수정 (일반 회원용)
 * position, department, join_number, role, status 필드는 무시됨 (관리자만 수정 가능)
 */
router.put('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { name, phone, address, birth_date, gender, company, work_phone, industry, industry_detail, website, map_visible, business_address, business_lat, business_lng } = req.body;

        // 유효성 검증
        if (!name) {
            return res.status(400).json({
                success: false,
                message: '이름은 필수 항목입니다.'
            });
        }

        // 업종 코드 유효성 검증
        const VALID_INDUSTRY_CODES = ['law','finance','medical','construction','it','manufacturing','food','retail','service','realestate','culture','public','other'];
        if (industry && !VALID_INDUSTRY_CODES.includes(industry)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 업종 코드입니다.'
            });
        }

        if (industry_detail && String(industry_detail).length > 100) {
            return res.status(400).json({
                success: false,
                message: '업종 상세는 100자 이내로 입력해주세요.'
            });
        }

        // 관리자 전용 필드가 요청에 포함되었는지 경고 (무시 처리)
        const attemptedAdminFields = ADMIN_ONLY_FIELDS.filter(f => req.body[f] !== undefined);
        const isAdmin = userRole && ['super_admin', 'admin'].includes(userRole);

        if (attemptedAdminFields.length > 0 && !isAdmin) {
            console.log(`[M-10] 일반 회원(id=${userId})이 관리자 전용 필드 수정 시도 → 무시됨: ${attemptedAdminFields.join(', ')}`);
        }

        // 관리자인 경우 자기 자신의 관리자 필드도 수정 허용
        if (isAdmin && attemptedAdminFields.length > 0) {
            const { position, department, join_number } = req.body;
            await query(
                `UPDATE users
                 SET name = $1, phone = $2, address = $3,
                     birth_date = $4, gender = $5,
                     company = $6, position = $7, department = $8, work_phone = $9,
                     industry = $10, industry_detail = $11, join_number = $12,
                     website = $13, updated_at = NOW()
                 WHERE id = $14`,
                [name, phone, address, birth_date, gender, company, position || null, department || null, work_phone, industry || null, industry_detail || null, join_number || null, website || null, userId]
            );
        } else {
            // 일반 회원: position, department, join_number 필드 제외
            await query(
                `UPDATE users
                 SET name = $1, phone = $2, address = $3,
                     birth_date = $4, gender = $5,
                     company = $6, work_phone = $7,
                     industry = $8, industry_detail = $9,
                     website = $10,
                     map_visible = COALESCE($11, map_visible),
                     business_address = COALESCE($12, business_address),
                     business_lat = COALESCE($13, business_lat),
                     business_lng = COALESCE($14, business_lng),
                     updated_at = NOW()
                 WHERE id = $15`,
                [name, phone, address, birth_date, gender, company, work_phone, industry || null, industry_detail || null, website || null, map_visible !== undefined ? map_visible : null, business_address || null, business_lat || null, business_lng || null, userId]
            );
        }

        res.json({
            success: true,
            message: '프로필이 수정되었습니다.'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 수정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/profile/password
 * 비밀번호 변경
 */
router.put('/password', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: '현재 비밀번호와 새 비밀번호를 입력해주세요.'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '새 비밀번호는 6자 이상이어야 합니다.'
            });
        }

        // 현재 비밀번호 확인
        const userResult = await query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        const bcrypt = require('bcryptjs');
        const isValid = await bcrypt.compare(current_password, userResult.rows[0].password_hash);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: '현재 비밀번호가 일치하지 않습니다.'
            });
        }

        // 새 비밀번호 해싱 및 저장
        const newHash = await bcrypt.hash(new_password, 12);
        await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [newHash, userId]
        );

        res.json({
            success: true,
            message: '비밀번호가 변경되었습니다.'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 변경 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/profile/image
 * 프로필 이미지 URL 업데이트 (하위호환)
 */
router.put('/image', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { profile_image } = req.body;

        if (!profile_image) {
            return res.status(400).json({
                success: false,
                message: '프로필 이미지 URL을 입력해주세요.'
            });
        }

        await query(
            'UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2',
            [profile_image, userId]
        );

        res.json({
            success: true,
            message: '프로필 이미지가 업데이트되었습니다.'
        });
    } catch (error) {
        console.error('Update profile image error:', error);
        res.status(500).json({
            success: false,
            message: '프로필 이미지 업데이트 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/profile/photo
 * 프로필 사진 파일 업로드 → DB(post_images) 저장 → users.profile_image 업데이트
 */
router.put('/photo', authenticate, photoUpload.single('photo'), async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ success: false, message: '사진 파일을 선택해주세요.' });
        }

        const ext = (req.file.originalname || 'photo.jpg').replace(/[^a-zA-Z0-9.-]/g, '_').slice(-40);
        const filename = `profile-${userId}-${Date.now()}-${ext}`;

        const imgResult = await query(
            `INSERT INTO post_images (filename, mime_type, image_data, file_size, uploaded_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [filename, req.file.mimetype, req.file.buffer, req.file.size, userId]
        );

        const imageUrl = `/api/upload/images/${imgResult.rows[0].id}`;

        await query(
            'UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2',
            [imageUrl, userId]
        );

        res.json({ success: true, message: '프로필 사진이 업데이트되었습니다.', imageUrl });
    } catch (error) {
        console.error('Upload profile photo error:', error);
        res.status(500).json({ success: false, message: '프로필 사진 업로드 중 오류가 발생했습니다.' });
    }
});

/**
 * DELETE /api/profile/photo
 * 프로필 사진 삭제 (users.profile_image = NULL)
 */
router.delete('/photo', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        await query(
            'UPDATE users SET profile_image = NULL, updated_at = NOW() WHERE id = $1',
            [userId]
        );
        res.json({ success: true, message: '프로필 사진이 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete profile photo error:', error);
        res.status(500).json({ success: false, message: '프로필 사진 삭제 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
