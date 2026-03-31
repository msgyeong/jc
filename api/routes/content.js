const express = require('express');
const multer = require('multer');
const { authenticate, requireRole } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// 허용된 콘텐츠 타입
const VALID_TYPES = ['org_chart', 'vision', 'roles', 'map', 'charter'];

// 이미지/파일 업로드 설정 (메모리 스토리지, 최대 10MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * GET /api/content/:type
 * 콘텐츠 조회 (인증된 사용자)
 */
router.get('/:type', authenticate, async (req, res) => {
    try {
        const { type } = req.params;

        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 콘텐츠 타입입니다.'
            });
        }

        const result = await query(
            `SELECT id, content_type, title, body,
                    CASE WHEN image_data IS NOT NULL THEN true ELSE false END AS has_image,
                    image_mime,
                    file_name, file_mime,
                    CASE WHEN file_data IS NOT NULL THEN true ELSE false END AS has_file,
                    updated_by, created_at, updated_at
             FROM site_content
             WHERE content_type = $1
             ORDER BY updated_at DESC
             LIMIT 1`,
            [type]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: null
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('콘텐츠 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '콘텐츠를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/content/:type/image
 * 콘텐츠 이미지 바이너리 반환
 */
router.get('/:type/image', authenticate, async (req, res) => {
    try {
        const { type } = req.params;

        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({ success: false, message: '유효하지 않은 콘텐츠 타입입니다.' });
        }

        const result = await query(
            `SELECT image_data, image_mime FROM site_content
             WHERE content_type = $1 AND image_data IS NOT NULL
             ORDER BY updated_at DESC LIMIT 1`,
            [type]
        );

        if (result.rows.length === 0 || !result.rows[0].image_data) {
            return res.status(404).json({ success: false, message: '이미지가 없습니다.' });
        }

        const { image_data, image_mime } = result.rows[0];
        res.set('Content-Type', image_mime || 'image/png');
        res.set('Cache-Control', 'public, max-age=300');
        res.send(image_data);
    } catch (error) {
        console.error('콘텐츠 이미지 조회 오류:', error);
        res.status(500).json({ success: false, message: '이미지를 불러오는 중 오류가 발생했습니다.' });
    }
});

/**
 * GET /api/content/:type/file
 * 콘텐츠 첨부파일 다운로드
 */
router.get('/:type/file', authenticate, async (req, res) => {
    try {
        const { type } = req.params;

        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({ success: false, message: '유효하지 않은 콘텐츠 타입입니다.' });
        }

        const result = await query(
            `SELECT file_data, file_name, file_mime FROM site_content
             WHERE content_type = $1 AND file_data IS NOT NULL
             ORDER BY updated_at DESC LIMIT 1`,
            [type]
        );

        if (result.rows.length === 0 || !result.rows[0].file_data) {
            return res.status(404).json({ success: false, message: '파일이 없습니다.' });
        }

        const { file_data, file_name, file_mime } = result.rows[0];
        res.set('Content-Type', file_mime || 'application/octet-stream');
        // PDF는 인라인, 나머지는 다운로드
        if (file_mime === 'application/pdf') {
            res.set('Content-Disposition', `inline; filename="${encodeURIComponent(file_name || 'file')}"`);
        } else {
            res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(file_name || 'file')}"`);
        }
        res.send(file_data);
    } catch (error) {
        console.error('콘텐츠 파일 다운로드 오류:', error);
        res.status(500).json({ success: false, message: '파일을 다운로드하는 중 오류가 발생했습니다.' });
    }
});

/**
 * PUT /api/content/:type
 * 콘텐츠 수정 (관리자 전용) — JSON body { title, body }
 */
router.put('/:type', authenticate, requireRole(['admin', 'super_admin', 'local_admin']), async (req, res) => {
    try {
        const { type } = req.params;

        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 콘텐츠 타입입니다.'
            });
        }

        const { title, body } = req.body;

        // 기존 콘텐츠 확인
        const existing = await query(
            `SELECT id FROM site_content WHERE content_type = $1 ORDER BY updated_at DESC LIMIT 1`,
            [type]
        );

        let result;
        if (existing.rows.length > 0) {
            // 업데이트
            result = await query(
                `UPDATE site_content
                 SET title = COALESCE($1, title),
                     body = COALESCE($2, body),
                     updated_by = $3,
                     updated_at = NOW()
                 WHERE id = $4
                 RETURNING id, content_type, title, body, updated_at`,
                [title, body, req.user.userId, existing.rows[0].id]
            );
        } else {
            // 새로 생성
            result = await query(
                `INSERT INTO site_content (content_type, title, body, updated_by)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, content_type, title, body, updated_at`,
                [type, title || '', body || '', req.user.userId]
            );
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('콘텐츠 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '콘텐츠 수정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/content/:type/upload
 * 이미지/파일 업로드 (관리자 전용)
 * multipart form: field "image" 또는 "file"
 */
router.post('/:type/upload', authenticate, requireRole(['admin', 'super_admin', 'local_admin']),
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'file', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const { type } = req.params;

            if (!VALID_TYPES.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: '유효하지 않은 콘텐츠 타입입니다.'
                });
            }

            const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
            const attachFile = req.files && req.files['file'] ? req.files['file'][0] : null;

            if (!imageFile && !attachFile) {
                return res.status(400).json({
                    success: false,
                    message: '업로드할 파일을 선택해주세요.'
                });
            }

            // 기존 콘텐츠 확인
            const existing = await query(
                `SELECT id FROM site_content WHERE content_type = $1 ORDER BY updated_at DESC LIMIT 1`,
                [type]
            );

            let result;

            if (existing.rows.length > 0) {
                const id = existing.rows[0].id;
                const updates = [];
                const values = [];
                let paramIdx = 1;

                if (imageFile) {
                    updates.push(`image_data = $${paramIdx++}`);
                    values.push(imageFile.buffer);
                    updates.push(`image_mime = $${paramIdx++}`);
                    values.push(imageFile.mimetype);
                }
                if (attachFile) {
                    updates.push(`file_data = $${paramIdx++}`);
                    values.push(attachFile.buffer);
                    updates.push(`file_name = $${paramIdx++}`);
                    values.push(attachFile.originalname);
                    updates.push(`file_mime = $${paramIdx++}`);
                    values.push(attachFile.mimetype);
                }

                updates.push(`updated_by = $${paramIdx++}`);
                values.push(req.user.userId);
                updates.push(`updated_at = NOW()`);

                values.push(id);

                result = await query(
                    `UPDATE site_content SET ${updates.join(', ')} WHERE id = $${paramIdx}
                     RETURNING id, content_type, title, updated_at`,
                    values
                );
            } else {
                // 새로 생성
                const cols = ['content_type'];
                const vals = [type];
                const placeholders = ['$1'];
                let idx = 2;

                if (imageFile) {
                    cols.push('image_data', 'image_mime');
                    vals.push(imageFile.buffer, imageFile.mimetype);
                    placeholders.push(`$${idx++}`, `$${idx++}`);
                }
                if (attachFile) {
                    cols.push('file_data', 'file_name', 'file_mime');
                    vals.push(attachFile.buffer, attachFile.originalname, attachFile.mimetype);
                    placeholders.push(`$${idx++}`, `$${idx++}`, `$${idx++}`);
                }

                cols.push('updated_by');
                vals.push(req.user.userId);
                placeholders.push(`$${idx++}`);

                result = await query(
                    `INSERT INTO site_content (${cols.join(', ')}) VALUES (${placeholders.join(', ')})
                     RETURNING id, content_type, title, updated_at`,
                    vals
                );
            }

            res.json({
                success: true,
                data: result.rows[0],
                message: '업로드 완료'
            });
        } catch (error) {
            console.error('콘텐츠 업로드 오류:', error);
            if (error.message && error.message.includes('File too large')) {
                return res.status(413).json({
                    success: false,
                    message: '파일 크기는 10MB 이하여야 합니다.'
                });
            }
            res.status(500).json({
                success: false,
                message: '파일 업로드 중 오류가 발생했습니다.'
            });
        }
    }
);

/**
 * DELETE /api/content/:type/image
 * 콘텐츠 이미지 삭제 (관리자 전용)
 */
router.delete('/:type/image', authenticate, requireRole(['admin', 'super_admin', 'local_admin']), async (req, res) => {
    try {
        const { type } = req.params;

        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({ success: false, message: '유효하지 않은 콘텐츠 타입입니다.' });
        }

        await query(
            `UPDATE site_content SET image_data = NULL, image_mime = NULL, updated_at = NOW()
             WHERE content_type = $1`,
            [type]
        );

        res.json({ success: true, message: '이미지가 삭제되었습니다.' });
    } catch (error) {
        console.error('콘텐츠 이미지 삭제 오류:', error);
        res.status(500).json({ success: false, message: '이미지 삭제 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
