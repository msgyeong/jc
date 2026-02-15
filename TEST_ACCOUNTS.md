# 🧪 테스트 계정 정보

## 📋 계정 목록

### 관리자 계정
- **이메일**: `admin@jc.com`
- **비밀번호**: `admin1234`
- **권한**: 슈퍼 관리자 (super_admin)
- **기능**: 회원 승인, 권한 관리, 콘텐츠 관리

### 테스트 회원 계정
- **이메일**: `test@jc.com`
- **비밀번호**: `test1234`
- **권한**: 일반 회원 (member)
- **상태**: 활성화 (바로 로그인 가능)

---

## 🚀 Railway에서 테스트 계정 생성하기

### 1단계: 데이터베이스 초기화
Railway PostgreSQL → Data → Query 탭에서 실행:
```sql
-- database/railway_init.sql 파일 내용 전체 복사 & 실행
```

### 2단계: 관리자 계정 생성
```sql
-- database/create_admin.sql 파일 내용 실행
```

### 3단계: 테스트 회원 계정 생성
```sql
-- database/create_test_member.sql 파일 내용 실행
```

---

## 🎯 테스트 시나리오

### 관리자로 테스트
1. `admin@jc.com` / `admin1234`로 로그인
2. 프로필 → 관리자 페이지 접속
3. 회원 승인/관리 기능 테스트
4. 공지사항/일정 작성 테스트

### 일반 회원으로 테스트
1. `test@jc.com` / `test1234`로 로그인
2. 홈 화면에서 공지사항/일정 확인
3. 게시판에 글 작성
4. 회원 목록 조회
5. 프로필 수정

---

## 🔐 보안 참고사항

### 개발 환경
- 현재 비밀번호는 **평문**으로 저장됨
- 테스트 목적으로만 사용
- 실제 개인정보 입력 금지

### 프로덕션 환경 (나중에)
- 비밀번호 암호화 필수 (bcrypt/pgcrypto)
- HTTPS 필수
- 강력한 비밀번호 정책 적용

---

## 💡 추가 테스트 계정 생성

필요하면 Railway Query에서 직접 실행:

```sql
-- 추가 회원 계정
INSERT INTO users (email, password_hash, name, phone, role, status)
VALUES (
    'member@jc.com',
    'member1234',
    '일반회원',
    '010-9999-9999',
    'member',
    'active'
);
```

---

## 📞 문제 해결

### 로그인 안 됨
1. Railway PostgreSQL → Query에서 확인:
   ```sql
   SELECT * FROM users WHERE email = 'test@jc.com';
   ```
2. 계정이 없으면 `create_test_member.sql` 다시 실행
3. `status`가 'pending'이면 'active'로 변경:
   ```sql
   UPDATE users SET status = 'active' WHERE email = 'test@jc.com';
   ```

### 비밀번호 틀림
Railway Query에서 비밀번호 재설정:
```sql
UPDATE users 
SET password_hash = 'test1234' 
WHERE email = 'test@jc.com';
```

---

**생성일**: 2026-02-15  
**버전**: 1.0
