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
            org_id,
            // Step 2: 기본 정보 추가
            ssnFront, ssnBack, postal_code, profile_image, birth_date, gender, join_date,
            // Step 3: 직장 정보
            company, position, department, work_phone, work_address, website,
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

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '올바른 이메일 형식을 입력해주세요.'
            });
        }

        // 비밀번호 길이 검증 (최소 8자)
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: '비밀번호는 8자 이상이어야 합니다.'
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
        
        // 주민등록번호: ssnFront(앞6자리) + ssnBack(뒤1자리) 분리 수신
        // DB 저장 형식: "XXXXXX-X" (뒷번호 2~7자리는 절대 저장하지 않음)
        let maskedSsn = null;
        if (ssnFront && ssnBack) {
            const front = String(ssnFront).replace(/[^0-9]/g, '');
            const back = String(ssnBack).replace(/[^0-9]/g, '');

            // ssnFront: 정확히 6자리 숫자
            if (front.length !== 6) {
                return res.status(400).json({
                    success: false,
                    message: '주민번호 앞자리는 6자리 숫자여야 합니다.'
                });
            }

            // ssnFront: YYMMDD 날짜 유효성 검증
            const yy = parseInt(front.slice(0, 2), 10);
            const mm = parseInt(front.slice(2, 4), 10);
            const dd = parseInt(front.slice(4, 6), 10);
            if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
                return res.status(400).json({
                    success: false,
                    message: '주민번호 앞자리의 생년월일이 유효하지 않습니다.'
                });
            }

            // ssnBack: 정확히 1자리 숫자 (1~4)
            if (back.length !== 1 || !['1','2','3','4'].includes(back)) {
                return res.status(400).json({
                    success: false,
                    message: '주민번호 뒷자리 첫째 자리는 1~4 중 하나여야 합니다.'
                });
            }

            maskedSsn = front + '-' + back;
        }

        // 사용자 생성 (6단계 전체 정보 저장)
        const result = await query(
            `INSERT INTO users (
                email, password_hash, name, phone, address, address_detail, postal_code,
                ssn, profile_image, birth_date, gender,
                company, position, department, work_phone, work_address, website,
                educations, careers, families,
                hobbies, emergency_contact_name, emergency_contact, emergency_relationship, special_notes,
                org_id, join_date, role, status, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, 'member', 'pending', NOW(), NOW())
            RETURNING id, email, name, role, status`,
            [
                email.toLowerCase(), passwordHash, name, phone, address,
                address_detail || null, postal_code || null,
                maskedSsn, profile_image || null, birth_date || null, gender || null,
                company || null, position || null, department || null, work_phone || null, work_address || null, website || null,
                educations, careers, families,
                hobbies || null, emergency_contact_name || null, emergency_contact || null,
                emergency_relationship || null, special_notes || null,
                org_id || null,
                join_date || null
            ]
        );

        const user = result.rows[0];

        // 주소가 있으면 자동 좌표 변환 (비동기, 실패해도 가입은 완료)
        if (address) {
            try {
                const https = require('https');
                const geoUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
                const kakaoRes = await new Promise((resolve, reject) => {
                    https.get(geoUrl, {
                        headers: { 'Authorization': `KakaoAK ${process.env.KAKAO_REST_API_KEY || 'bf233c9ee97fc1e97870c696f6375006'}` }
                    }, (response) => {
                        let data = '';
                        response.on('data', chunk => data += chunk);
                        response.on('end', () => resolve(JSON.parse(data)));
                    }).on('error', reject);
                });
                const docs = kakaoRes.documents || [];
                if (docs.length > 0) {
                    await query(
                        `UPDATE users SET business_address = $1, business_lat = $2, business_lng = $3 WHERE id = $4`,
                        [address, parseFloat(docs[0].y), parseFloat(docs[0].x), user.id]
                    );
                }
            } catch (catchErr) { console.error("[silent-catch]", catchErr.message); }
        }

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
            'SELECT id, email, password_hash, name, role, status, profile_image, org_id FROM users WHERE email = $1',
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

        if (user.status === 'rejected') {
            return res.status(403).json({
                success: false,
                message: '가입이 거절된 계정입니다. 관리자에게 문의하세요.',
                status: 'rejected'
            });
        }

        if (user.status === 'withdrawn') {
            return res.status(403).json({
                success: false,
                message: '탈퇴한 계정입니다.',
                status: 'withdrawn'
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
                org_id: user.org_id,
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

// ── 비밀번호 재설정 본인확인 토큰 저장소 ──
const crypto = require('crypto');
const resetTokens = new Map(); // token → { userId, question, answer, attempts, expiresAt }

// 만료된 토큰 정리 (5분마다)
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of resetTokens) {
        if (now > data.expiresAt) resetTokens.delete(token);
    }
}, 5 * 60 * 1000);

/**
 * POST /api/auth/reset-password/verify
 * 1단계: 이메일+이름 확인 → 본인확인 질문 반환
 */
router.post('/reset-password/verify', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            return res.status(400).json({
                success: false,
                message: '이메일과 이름을 모두 입력해주세요.'
            });
        }

        const normalizedEmail = email.toLowerCase().trim().normalize('NFC');
        const normalizedName = name.replace(/\s+/g, '').normalize('NFC');

        const result = await query(
            `SELECT id, email, name, status, phone, company, emergency_contact_name
             FROM users
             WHERE LOWER(TRIM(email)) = $1 AND REPLACE(TRIM(name), ' ', '') = $2`,
            [normalizedEmail, normalizedName]
        );

        if (result.rows.length === 0) {
            const emailCheck = await query(
                'SELECT id, name FROM users WHERE LOWER(TRIM(email)) = $1',
                [normalizedEmail]
            );
            if (emailCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '등록되지 않은 이메일입니다.\n이메일을 다시 확인해주세요.'
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: '이름이 일치하지 않습니다.\n가입 시 등록한 이름을 입력해주세요.'
                });
            }
        }

        const user = result.rows[0];

        if (user.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: '정지된 계정입니다. 관리자에게 문의하세요.'
            });
        }

        // 랜덤 질문 선택 (값이 있는 항목 중에서)
        const questionPool = [];
        if (user.phone && user.phone.replace(/[^0-9]/g, '').length >= 4) {
            const digits = user.phone.replace(/[^0-9]/g, '');
            questionPool.push({
                type: 'phone_last4',
                label: '등록한 전화번호 뒷 4자리를 입력하세요',
                answer: digits.slice(-4)
            });
        }
        if (user.company && user.company.trim()) {
            questionPool.push({
                type: 'company',
                label: '등록한 회사명을 입력하세요',
                answer: user.company.replace(/\s+/g, '').normalize('NFC')
            });
        }
        if (user.emergency_contact_name && user.emergency_contact_name.trim()) {
            questionPool.push({
                type: 'emergency_name',
                label: '등록한 비상연락처 이름을 입력하세요',
                answer: user.emergency_contact_name.replace(/\s+/g, '').normalize('NFC')
            });
        }

        // 질문이 없으면 전화번호 뒷자리라도 기본으로 (가입 시 필수이므로 거의 항상 있음)
        if (questionPool.length === 0) {
            return res.status(400).json({
                success: false,
                message: '본인확인에 필요한 정보가 부족합니다. 관리자에게 문의하세요.'
            });
        }

        const selected = questionPool[Math.floor(Math.random() * questionPool.length)];

        // 토큰 생성 (5분 만료, 3회 시도 제한)
        const token = crypto.randomBytes(32).toString('hex');
        resetTokens.set(token, {
            userId: user.id,
            question: selected.type,
            answer: selected.answer,
            attempts: 0,
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        res.json({
            success: true,
            data: {
                token,
                question: {
                    type: selected.type,
                    label: selected.label
                }
            }
        });
    } catch (error) {
        console.error('Reset password verify error:', error);
        res.status(500).json({
            success: false,
            message: '본인확인 처리 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/auth/reset-password
 * 2단계: 생년월일 + 랜덤 질문 답변 확인 → 임시 비밀번호 발급
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, birthDate, answer } = req.body;

        if (!token || !birthDate || !answer) {
            return res.status(400).json({
                success: false,
                message: '모든 항목을 입력해주세요.'
            });
        }

        // 토큰 검증
        const tokenData = resetTokens.get(token);
        if (!tokenData) {
            return res.status(400).json({
                success: false,
                message: '인증이 만료되었습니다. 처음부터 다시 시도해주세요.',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (Date.now() > tokenData.expiresAt) {
            resetTokens.delete(token);
            return res.status(400).json({
                success: false,
                message: '인증이 만료되었습니다. 처음부터 다시 시도해주세요.',
                code: 'TOKEN_EXPIRED'
            });
        }

        // 시도 횟수 확인
        tokenData.attempts++;
        if (tokenData.attempts > 3) {
            resetTokens.delete(token);
            return res.status(400).json({
                success: false,
                message: '입력 횟수를 초과했습니다. 처음부터 다시 시도해주세요.',
                code: 'TOKEN_EXPIRED'
            });
        }

        // 생년월일 확인 (SSN 앞 6자리)
        const userResult = await query(
            'SELECT ssn FROM users WHERE id = $1',
            [tokenData.userId]
        );

        if (userResult.rows.length === 0) {
            resetTokens.delete(token);
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        const ssn = userResult.rows[0].ssn; // "XXXXXX-X" 형식
        const ssnFront = ssn ? ssn.split('-')[0] : null;
        const inputBirth = birthDate.replace(/[^0-9]/g, '');

        if (!ssnFront || inputBirth !== ssnFront) {
            const remaining = 3 - tokenData.attempts;
            return res.status(400).json({
                success: false,
                message: `생년월일이 일치하지 않습니다. (${remaining}회 남음)`
            });
        }

        // 랜덤 질문 답변 확인
        const normalizedAnswer = answer.replace(/\s+/g, '').normalize('NFC');
        let answerMatch = false;

        if (tokenData.question === 'phone_last4') {
            answerMatch = normalizedAnswer.replace(/[^0-9]/g, '') === tokenData.answer;
        } else {
            answerMatch = normalizedAnswer === tokenData.answer;
        }

        if (!answerMatch) {
            const remaining = 3 - tokenData.attempts;
            return res.status(400).json({
                success: false,
                message: `답변이 일치하지 않습니다. (${remaining}회 남음)`
            });
        }

        // 본인확인 통과 → 토큰을 verified 상태로 전환 (새 비밀번호 입력 대기)
        tokenData.verified = true;
        tokenData.expiresAt = Date.now() + 5 * 60 * 1000; // 5분 연장

        res.json({
            success: true,
            message: '본인확인이 완료되었습니다. 새 비밀번호를 입력해주세요.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 재설정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/auth/reset-password/set
 * 3단계: 본인확인 완료 후 새 비밀번호 설정
 */
router.post('/reset-password/set', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '새 비밀번호를 입력해주세요.'
            });
        }

        // 토큰 검증
        const tokenData = resetTokens.get(token);
        if (!tokenData) {
            return res.status(400).json({
                success: false,
                message: '인증이 만료되었습니다. 처음부터 다시 시도해주세요.',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (Date.now() > tokenData.expiresAt) {
            resetTokens.delete(token);
            return res.status(400).json({
                success: false,
                message: '인증이 만료되었습니다. 처음부터 다시 시도해주세요.',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (!tokenData.verified) {
            return res.status(400).json({
                success: false,
                message: '본인확인이 완료되지 않았습니다.',
                code: 'TOKEN_EXPIRED'
            });
        }

        // 비밀번호 유효성 검사
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: '비밀번호는 8자 이상이어야 합니다.'
            });
        }

        // 비밀번호 해싱 및 저장
        const hashedPassword = await hashPassword(newPassword);

        await query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, tokenData.userId]
        );

        // 토큰 삭제
        resetTokens.delete(token);

        res.json({
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다.'
        });
    } catch (error) {
        console.error('Reset password set error:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 변경 중 오류가 발생했습니다.'
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

/**
 * POST /api/auth/withdraw
 * 회원 탈퇴 (soft delete)
 */
router.post('/withdraw', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { password, reason } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: '비밀번호를 입력해주세요.'
            });
        }

        // 비밀번호 확인
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

        const valid = await comparePassword(password, userResult.rows[0].password_hash);
        if (!valid) {
            return res.status(401).json({
                success: false,
                message: '비밀번호가 일치하지 않습니다.'
            });
        }

        // soft delete: status 변경, withdrawn_at 설정
        await query(
            `UPDATE users SET status = 'withdrawn', withdrawn_at = NOW(), withdrawal_reason = $2 WHERE id = $1`,
            [userId, reason || null]
        );

        // Push 구독 삭제
        try {
            await query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);
        } catch (catchErr) { console.error("[silent-catch]", catchErr.message); }

        res.json({
            success: true,
            message: '회원 탈퇴가 완료되었습니다.'
        });
    } catch (error) {
        console.error('Withdraw error:', error);
        res.status(500).json({
            success: false,
            message: '회원 탈퇴 처리 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/auth/my-permissions
 * 로그인 사용자의 앱 관리 권한 조회
 */
router.get('/my-permissions', authenticate, async (req, res) => {
    try {
        const { getMobilePermissions } = require('../middleware/mobileAdmin');
        const permissions = await getMobilePermissions(req.user.userId, req.user.role);
        const hasAny = Object.values(permissions).some(v => v === true);

        res.json({
            success: true,
            data: {
                role: req.user.role,
                mobile_permissions: permissions,
                has_any_permission: hasAny
            }
        });
    } catch (err) {
        console.error('Get my permissions error:', err);
        res.status(500).json({ success: false, message: '권한 조회 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
