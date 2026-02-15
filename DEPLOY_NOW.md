# 🚀 Railway 최종 배포 - 실행 가이드

## ✅ GitHub 푸시 완료!
- **저장소**: https://github.com/msgyeong/jc
- **최신 커밋**: `e0d9bc3 - Add final Railway deployment guide`
- **배포 준비**: 완료 ✅

---

## 📋 **지금 바로 실행할 단계**

### 🎯 **1단계: Railway 프로젝트 생성** (클릭하여 시작)

**👉 [Railway 대시보드 열기](https://railway.app/dashboard)**

실행할 작업:
```
1. "New Project" 버튼 클릭
2. "Deploy from GitHub repo" 선택
3. "msgyeong/jc" 저장소 선택
4. "Deploy Now" 클릭
```

**예상 시간**: 3-5분 (자동 빌드)

---

### 🔧 **2단계: PostgreSQL 추가**

Railway 프로젝트 화면에서:
```
1. "+ New" 버튼 클릭
2. "Database" 선택
3. "Add PostgreSQL" 클릭
4. 웹 앱 서비스 → Variables 탭
5. "+ New Variable" → "Add Reference"
6. PostgreSQL → DATABASE_URL 추가
```

**예상 시간**: 2분

---

### 🌐 **3단계: 도메인 생성**

```
1. 웹 앱 서비스 클릭
2. Settings 탭
3. Networking 섹션
4. "Generate Domain" 버튼 클릭
5. 생성된 URL 복사!
```

생성된 URL 예시: `https://jc-production-XXXX.up.railway.app`

**예상 시간**: 1분

---

### 📊 **4단계: 데이터베이스 초기화**

**👉 [초기화 SQL 보기](./database/railway_init.sql)**

Railway PostgreSQL → Data → Query에서:

#### 4-1. 테이블 생성
```sql
-- railway_init.sql 파일 내용 전체 복사하여 실행
-- 또는 아래 링크의 전체 SQL 실행
```

#### 4-2. 관리자 생성
```sql
INSERT INTO users (email, password_hash, name, role, status)
VALUES ('admin@jc.com', 'admin1234', '총관리자', 'super_admin', 'active')
ON CONFLICT (email) DO NOTHING;
```

#### 4-3. 테스트 회원 생성
```sql
INSERT INTO users (email, password_hash, name, phone, address, role, status)
VALUES ('minsu@jc.com', 'test1234', '경민수', '010-1234-5678', '서울시 영등포구', 'member', 'active')
ON CONFLICT (email) DO NOTHING;
```

#### 4-4. 확인
```sql
SELECT id, email, name, role, status FROM users;
```

**예상 시간**: 3-5분

---

### ✅ **5단계: 테스트**

생성된 URL로 접속:
```
https://jc-production-XXXX.up.railway.app
```

#### 로그인 테스트
1. **일반 회원**:
   - 이메일: `minsu@jc.com`
   - 비밀번호: `test1234`
   - ✅ 로그인 성공, 이름 "경민수" 표시

2. **관리자**:
   - 이메일: `admin@jc.com`
   - 비밀번호: `admin1234`
   - ✅ 관리자 페이지 접근 가능

3. **미등록 계정**:
   - 임의 이메일 입력
   - ❌ "등록되지 않은 계정입니다" 메시지

**예상 시간**: 2분

---

## 🎯 **빠른 링크**

| 단계 | 링크 | 설명 |
|------|------|------|
| 1️⃣ | [Railway 대시보드](https://railway.app/dashboard) | 프로젝트 생성 |
| 2️⃣ | [GitHub 저장소](https://github.com/msgyeong/jc) | 소스 코드 확인 |
| 3️⃣ | [railway_init.sql](./database/railway_init.sql) | DB 초기화 SQL |
| 4️⃣ | [create_admin.sql](./database/create_admin.sql) | 관리자 생성 SQL |
| 5️⃣ | [create_test_member.sql](./database/create_test_member.sql) | 테스트 회원 SQL |
| 📖 | [상세 가이드](./RAILWAY_DEPLOYMENT_FINAL.md) | 전체 배포 문서 |

---

## 📊 **배포 체크리스트**

- [ ] Railway 프로젝트 생성
- [ ] GitHub 저장소 연결 (`msgyeong/jc`)
- [ ] PostgreSQL 추가
- [ ] DATABASE_URL 환경변수 연결
- [ ] 도메인 생성
- [ ] 데이터베이스 테이블 생성
- [ ] 관리자 계정 생성
- [ ] 테스트 회원 생성
- [ ] 웹 앱 접속 테스트
- [ ] 로그인 테스트

---

## 🎉 **배포 완료 후**

### 배포 정보 공유
```markdown
🎉 JC 앱 배포 완료!

📍 URL: https://jc-production-XXXX.up.railway.app

👤 테스트 계정:
- 이메일: minsu@jc.com
- 비밀번호: test1234
- 이름: 경민수

🔧 관리자 계정:
- 이메일: admin@jc.com
- 비밀번호: admin1234

✅ 기능:
- 승인된 회원만 로그인 가능
- 게시판, 공지사항, 일정 관리
- 회원 관리 (관리자)
```

---

## 🆘 **문제가 발생했나요?**

1. **배포 실패**: [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md) 참고
2. **로그인 안 됨**: Railway PostgreSQL Query에서 계정 확인
3. **503 에러**: Logs 탭에서 에러 확인
4. **데이터베이스 연결 안 됨**: Variables에서 DATABASE_URL 확인

---

## 📞 **추가 문서**

- 📖 [RAILWAY_DEPLOYMENT_FINAL.md](./RAILWAY_DEPLOYMENT_FINAL.md) - 상세 배포 가이드
- 🚀 [QUICKSTART.md](./QUICKSTART.md) - 빠른 시작 가이드
- 🔑 [TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md) - 테스트 계정 정보
- 🤝 [COLLABORATION_STATUS.md](./COLLABORATION_STATUS.md) - 협업 가이드

---

**총 예상 시간**: 10-15분  
**난이도**: ⭐⭐☆☆☆ (쉬움)

**🚀 지금 바로 시작하세요!**

👉 **[Railway 대시보드 열기](https://railway.app/dashboard)**
