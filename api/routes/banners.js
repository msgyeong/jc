const express = require('express');
const multer = require('multer');
const { authenticate, requireRole } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('허용 형식: JPEG, PNG, GIF, WebP'));
        }
    }
});

// ============================================================
// 공개 API (앱용)
// ============================================================

/**
 * GET /api/banners
 * 활성 배너 목록 (is_active=true, sort_order ASC)
 */
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT id, title, description, image_url, link_url, sort_order
             FROM banners
             WHERE is_active = true
             ORDER BY sort_order ASC, created_at DESC`
        );
        return res.json({ success: true, data: { banners: result.rows } });
    } catch (err) {
        console.error('Get banners error:', err);
        return res.status(500).json({ success: false, error: '배너 목록 조회 중 오류가 발생했습니다.' });
    }
});

// ============================================================
// 관리자 API
// ============================================================

/**
 * GET /api/banners/admin
 * 전체 배너 목록 (관리자용, 비활성 포함)
 */
router.get('/admin', authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const result = await query(
            `SELECT b.id, b.title, b.description, b.image_url, b.link_url,
                    b.is_active, b.sort_order, b.created_by, b.created_at, b.updated_at,
                    u.name AS creator_name
             FROM banners b
             LEFT JOIN users u ON b.created_by = u.id
             ORDER BY b.sort_order ASC, b.created_at DESC`
        );
        return res.json({ success: true, data: { banners: result.rows } });
    } catch (err) {
        console.error('Get admin banners error:', err);
        return res.status(500).json({ success: false, error: '배너 목록 조회 중 오류가 발생했습니다.' });
    }
});

/**
 * POST /api/banners/admin
 * 배너 등록
 */
router.post('/admin', authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { title, description, link_url } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: '배너 제목은 필수입니다.' });
        }

        // 현재 최대 sort_order 조회
        const maxSort = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM banners');
        const nextOrder = maxSort.rows[0].next_order;

        const result = await query(
            `INSERT INTO banners (title, description, link_url, sort_order, created_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [title.trim(), description || null, link_url || null, nextOrder, req.user.userId]
        );

        return res.json({ success: true, data: { banner: result.rows[0] } });
    } catch (err) {
        console.error('Create banner error:', err);
        return res.status(500).json({ success: false, error: '배너 등록 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/banners/admin/reorder
 * 배너 순서 일괄 변경 (must be before :id routes)
 * Body: { orders: [{ id: 1, sort_order: 0 }, { id: 2, sort_order: 1 }, ...] }
 */
router.put('/admin/reorder', authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { orders } = req.body;
        if (!Array.isArray(orders) || orders.length === 0) {
            return res.status(400).json({ success: false, error: '순서 데이터가 필요합니다.' });
        }

        for (const item of orders) {
            await query(
                'UPDATE banners SET sort_order = $1, updated_at = NOW() WHERE id = $2',
                [item.sort_order, item.id]
            );
        }

        return res.json({ success: true, data: { message: '순서가 변경되었습니다.' } });
    } catch (err) {
        console.error('Reorder banners error:', err);
        return res.status(500).json({ success: false, error: '순서 변경 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/banners/admin/:id
 * 배너 수정
 */
router.put('/admin/:id', authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, link_url, sort_order } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: '배너 제목은 필수입니다.' });
        }

        const result = await query(
            `UPDATE banners
             SET title = $1, description = $2, link_url = $3, sort_order = $4, updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [title.trim(), description || null, link_url || null, sort_order || 0, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: '배너를 찾을 수 없습니다.' });
        }

        return res.json({ success: true, data: { banner: result.rows[0] } });
    } catch (err) {
        console.error('Update banner error:', err);
        return res.status(500).json({ success: false, error: '배너 수정 중 오류가 발생했습니다.' });
    }
});

/**
 * DELETE /api/banners/admin/:id
 * 배너 삭제
 */
router.delete('/admin/:id', authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query('DELETE FROM banners WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: '배너를 찾을 수 없습니다.' });
        }

        return res.json({ success: true, data: { message: '배너가 삭제되었습니다.' } });
    } catch (err) {
        console.error('Delete banner error:', err);
        return res.status(500).json({ success: false, error: '배너 삭제 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/banners/admin/:id/image
 * 배너 이미지 업로드 (multer → post_images 테이블 저장)
 */
router.put('/admin/:id/image', authenticate, requireRole(['admin', 'super_admin']), upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ success: false, error: '이미지 파일을 선택해주세요.' });
        }

        // 배너 존재 확인
        const bannerCheck = await query('SELECT id FROM banners WHERE id = $1', [id]);
        if (bannerCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: '배너를 찾을 수 없습니다.' });
        }

        // post_images 테이블에 이미지 저장
        const ext = req.file.originalname
            ? req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-40)
            : 'image.jpg';
        const filename = `banner-${Date.now()}-${ext}`;

        const imgResult = await query(
            `INSERT INTO post_images (filename, mime_type, image_data, file_size, uploaded_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [filename, req.file.mimetype, req.file.buffer, req.file.size, req.user.userId]
        );

        const imageId = imgResult.rows[0].id;
        const imageUrl = `/api/upload/images/${imageId}`;

        // 배너 image_url 업데이트
        await query(
            'UPDATE banners SET image_url = $1, updated_at = NOW() WHERE id = $2',
            [imageUrl, id]
        );

        return res.json({ success: true, data: { image_url: imageUrl } });
    } catch (err) {
        console.error('Banner image upload error:', err);
        return res.status(500).json({ success: false, error: '이미지 업로드 중 오류가 발생했습니다.' });
    }
});

/**
 * PATCH /api/banners/admin/:id/toggle
 * 활성/비활성 토글
 */
router.patch('/admin/:id/toggle', authenticate, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `UPDATE banners
             SET is_active = NOT is_active, updated_at = NOW()
             WHERE id = $1
             RETURNING id, is_active`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: '배너를 찾을 수 없습니다.' });
        }

        return res.json({ success: true, data: { banner: result.rows[0] } });
    } catch (err) {
        console.error('Toggle banner error:', err);
        return res.status(500).json({ success: false, error: '배너 상태 변경 중 오류가 발생했습니다.' });
    }
});

// multer 에러 핸들러
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, error: '파일 크기는 5MB 이하여야 합니다.' });
        }
    }
    return res.status(400).json({ success: false, error: err.message || '요청 처리 중 오류가 발생했습니다.' });
});

module.exports = router;
