const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// memoryStorage: 파일을 메모리 버퍼로 받음 (Railway ephemeral FS 대응)
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

/**
 * POST /api/upload
 * 이미지 1장 업로드 → DB(post_images)에 저장. 반환: { success, url }
 */
router.post('/', authenticate, upload.single('image'), async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: '이미지 파일을 선택해주세요.'
            });
        }

        const ext = req.file.originalname
            ? req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-40)
            : 'image.jpg';
        const filename = `${Date.now()}-${ext}`;

        const result = await query(
            `INSERT INTO post_images (filename, mime_type, image_data, file_size, uploaded_by)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [filename, req.file.mimetype, req.file.buffer, req.file.size, req.user.userId]
        );

        const imageId = result.rows[0].id;
        const url = `/api/upload/images/${imageId}`;

        return res.json({ success: true, url });
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || '업로드 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/upload/multiple
 * 이미지 최대 5장 업로드 → DB 저장. 반환: { success, urls[] }
 */
router.post('/multiple', authenticate, upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '이미지 파일을 선택해주세요.'
            });
        }

        const urls = [];
        for (const file of req.files) {
            const ext = file.originalname
                ? file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-40)
                : 'image.jpg';
            const filename = `${Date.now()}-${ext}`;

            const result = await query(
                `INSERT INTO post_images (filename, mime_type, image_data, file_size, uploaded_by)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [filename, file.mimetype, file.buffer, file.size, req.user.userId]
            );

            urls.push(`/api/upload/images/${result.rows[0].id}`);
        }

        return res.json({ success: true, urls });
    } catch (err) {
        console.error('Upload multiple error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || '업로드 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/upload/images/:id
 * DB에서 이미지 바이너리 응답 (Content-Type 포함)
 */
router.get('/images/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            'SELECT image_data, mime_type, filename FROM post_images WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: '이미지를 찾을 수 없습니다.' });
        }

        const { image_data, mime_type, filename } = result.rows[0];
        res.set('Content-Type', mime_type);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Content-Disposition', `inline; filename="${filename}"`);
        return res.send(image_data);
    } catch (err) {
        console.error('Get image error:', err);
        return res.status(500).json({ success: false, message: '이미지 조회 중 오류가 발생했습니다.' });
    }
});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '파일 크기는 5MB 이하여야 합니다.'
            });
        }
    }
    return res.status(400).json({
        success: false,
        message: err && err.message ? err.message : '업로드 처리 중 오류가 발생했습니다.'
    });
});

module.exports = router;
