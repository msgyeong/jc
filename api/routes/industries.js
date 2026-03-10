const express = require('express');
const router = express.Router();

// 업종 카테고리 상수
const INDUSTRY_CATEGORIES = [
    { code: 'law', name: '법률/법무' },
    { code: 'finance', name: '금융/보험' },
    { code: 'medical', name: '의료/건강' },
    { code: 'construction', name: '건설/부동산' },
    { code: 'it', name: 'IT/기술' },
    { code: 'manufacturing', name: '제조/생산' },
    { code: 'food', name: '요식/식음료' },
    { code: 'retail', name: '유통/판매' },
    { code: 'service', name: '서비스' },
    { code: 'realestate', name: '부동산/임대' },
    { code: 'culture', name: '문화/예술' },
    { code: 'public', name: '공공/기관' },
    { code: 'other', name: '기타' }
];

/**
 * GET /api/industries
 * 업종 카테고리 목록 반환
 */
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: INDUSTRY_CATEGORIES
    });
});

module.exports = router;
