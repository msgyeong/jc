const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const safe = (file.originalname || 'img').replace(/[^a-zA-Z0-9.-]/g, '_');
        const base = path.basename(safe, path.extname(safe)).slice(0, 30);
        cb(null, `${base}-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
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
 * 게시글용 이미지 1장 업로드. 인증 필요. 반환: { success, url }
 */
router.post('/', authenticate, upload.single('image'), (req, res) => {
    try {
        if (!req.file || !req.file.filename) {
            return res.status(400).json({
                success: false,
                message: '이미지 파일을 선택해주세요.'
            });
        }
        const baseUrl = process.env.UPLOAD_BASE_URL ||
            `${req.protocol}://${req.get('host')}`;
        const url = `${baseUrl}/uploads/${req.file.filename}`;
        return res.json({ success: true, url });
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || '업로드 중 오류가 발생했습니다.'
        });
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
