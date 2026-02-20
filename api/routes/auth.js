const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/signup
 * 회원가입
 */
router.post('/signup', async (req, res) => {
    try {
        const { 
            email, password, name, phone, address, address_detail,
            // Step 2: 기본 정보 추가
            ssn, postal_code, profile_image, birth_date, gender,
            // Step 3: 직장 정보
            company, position, department, work_phone, work_address,
            // Step 4: 학력/경력 정보 (문자열)
            education, career,
            // Step 5: 가족 정보 (문자열)
            family,
            // Step 6: 기타 정보
            hobbies, emergency_contact_name, emergency_contact, 
            emergency_relationship, special_notes
        } = req.body;

        // 유효성 검증
        if (!email || !password || !name || !phone || !address) {
            return res.status(400).json({
                success: false,
                message: '필수 항목을 모두 입력해주세요.'
            });
        }

        // 이메일 중복 확인
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 사용 중인 이메일입니다.'
            });
        }

        // 비밀번호 해싱
        const passwordHash = await hashPassword(password);
        
        // 학력/경력/가족 정보를 JSONB 배열로 변환
        const educations = education ? JSON.stringify(education.split('\n').filter(e => e.trim()).map(e => ({ description: e.trim() }))) : '[]';
        const careers = career ? JSON.stringify(career.split('\n').filter(c => c.trim()).map(c => ({ description: c.trim() }))) : '[]';
        const families = family ? JSON.stringify(family.split('\n').filter(f => f.trim()).map(f => ({ description: f.trim() }))) : '[]';
        
        // 주민등록번호 마스킹 (앞 6자리-뒤 1자리만 입력받고, 나머지는 ******로 저장)
        // 입력: 900101-1 → 저장: 900101-1******
        const maskedSsn = ssn ? (ssn + '******') : null;

        // 사용자 생성 (6단계 전체 정보 저장)
        const result = await query(
            `INSERT INTO users (
                email, password_hash, name, phone, address, address_detail, postal_code,
                ssn, profile_image, birth_date, gender,
                company, position, department, work_phone, work_address,
                educations, careers, families,
                hobbies, emergency_contact_name, emergency_contact, emergency_relationship, special_notes,
                role, status, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 'member', 'pending', NOW(), NOW())
            RETURNING id, email, name, role, status`,
            [
                email.toLowerCase(), passwordHash, name, phone, address, 
                address_detail || null, postal_code || null,
                maskedSsn, profile_image || null, birth_date || null, gender || null,
                company || null, position || null, department || null, work_phone || null, work_address || null,
                educations, careers, families,
                hobbies || null, emergency_contact_name || null, emergency_contact || null, 
                emergency_relationship || null, special_notes || null
            ]
        );

        const user = result.rows[0];

        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.',
            userId: user.id
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: '회원가입 처리 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/auth/login
 * 로그인
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 유효성 검증
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '이메일과 비밀번호를 입력해주세요.'
            });
        }

        // 사용자 조회
        const result = await query(
            'SELECT id, email, password_hash, name, role, status, profile_image FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: '등록되지 않은 이메일이거나 비밀번호가 맞지 않아요.'
            });
        }

        const user = result.rows[0];

        // 비밀번호 검증
        const isPasswordValid = await comparePassword(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '등록되지 않은 이메일이거나 비밀번호가 맞지 않아요.'
            });
        }

        // 회원 상태 확인
        if (user.status === 'pending') {
            return res.status(403).json({
                success: false,
                message: '승인 대기 중입니다. 관리자 승인을 기다려주세요.',
                status: 'pending'
            });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: '정지된 계정입니다. 관리자에게 문의하세요.',
                status: 'suspended'
            });
        }

        // JWT 토큰 생성
        const token = generateToken(user.id, user.email, user.role);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                profile_image: user.profile_image,
                can_post_notice: ['super_admin', 'admin'].includes(user.role || '')
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: '로그인 처리 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/auth/me
 * 현재 사용자 정보 조회
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        const result = await query(
            'SELECT id, email, name, phone, address, role, status, profile_image, created_at FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        const user = result.rows[0];
        user.can_post_notice = ['super_admin', 'admin'].includes(user.role || '');

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: '사용자 정보 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/auth/logout
 * 로그아웃 (클라이언트에서 토큰 삭제)
 */
router.post('/logout', authenticate, (req, res) => {
    res.json({
        success: true,
        message: '로그아웃되었습니다.'
    });
});

module.exports = router;
