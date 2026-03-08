# 🎯 JC 앱 - 빠른 시작 가이드

## ✅ 완료된 작업

1. ✅ 공동 개발자 코드 가져오기 완료
2. ✅ Git 원격 저장소 설정 완료
3. ✅ Flutter 의존성 설치 완료
4. ✅ 테스트 계정 생성 완료
5. ✅ GitHub에 푸시 완료

---

## 🔑 테스트 계정 정보

### 👤 일반 회원 계정 (추천)
```
이메일: minsu@jc.com
비밀번호: test1234
이름: 경민수
```
- **권한**: 일반 회원 (member)
- **상태**: 활성화 (바로 로그인 가능)
- **사용 가능 기능**:
  - 홈 화면 조회
  - 게시판 글 작성/조회
  - 공지사항 확인
  - 일정 확인
  - 회원 목록 조회
  - 프로필 수정

### 🔧 관리자 계정
```
이메일: admin@jc.com
비밀번호: admin1234
```
- **권한**: 슈퍼 관리자 (super_admin)
- **사용 가능 기능**:
  - 모든 회원 기능
  - 회원 승인/거부
  - 권한 변경
  - 콘텐츠 관리
  - 공지사항 작성
  - 일정 생성

---

## 🌐 웹 앱 접속

### 배포된 웹 앱
- **URL**: https://jc-production-7db6.up.railway.app
- **상태**: ✅ 배포 완료 (Railway)

### 로컬 실행
```bash
cd web
python -m http.server 8000
# http://localhost:8000 접속
```

---

## 📱 Flutter 앱 실행

### 1. 환경 설정 (필요 시)
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일에 Railway PostgreSQL 정보 입력
# DATABASE_URL=your_railway_postgres_url
```

### 2. 앱 실행
```bash
flutter run
```

---

## 🗄️ 데이터베이스 설정 (Railway)

Railway PostgreSQL에서 SQL 실행:

### 1단계: 데이터베이스 초기화
```sql
-- database/railway_init.sql 전체 실행
```

### 2단계: 관리자 계정 생성
```sql
-- database/create_admin.sql 실행
```

### 3단계: 테스트 회원 생성
```sql
-- database/create_test_member.sql 실행
```

---

## 📂 프로젝트 구조

```
jc/
├── lib/                    # Flutter 앱 소스
│   ├── models/            # 데이터 모델
│   ├── providers/         # Riverpod 프로바이더
│   ├── screens/           # 화면 UI
│   ├── services/          # API 서비스
│   └── widgets/           # 재사용 위젯
├── web/                   # 웹 애플리케이션
│   ├── js/               # JavaScript 파일
│   ├── styles/           # CSS 파일
│   └── index.html        # 메인 HTML
├── database/              # 데이터베이스 스크립트
│   ├── railway_init.sql          # DB 초기화
│   ├── create_admin.sql          # 관리자 생성
│   └── create_test_member.sql    # 테스트 회원 생성
└── Docs/                  # 프로젝트 문서
```

---

## 🔄 공동 작업 워크플로우

### 공동 개발자 코드 가져오기
```bash
git pull k50004950 main
```

### 본인 작업 후 공유하기
```bash
git add .
git commit -m "작업 내용"
git push origin main
```

### 원격 저장소 확인
```bash
git remote -v
# origin     → msgyeong/jc (본인)
# k50004950  → k50004950-ctrl/jc (공동 개발자)
```

---

## 🎮 테스트 시나리오

### 일반 회원으로 테스트
1. `minsu@jc.com`으로 로그인
2. 홈 화면에서 공지사항 확인
3. 게시판 탭에서 글 작성
4. 회원 탭에서 다른 회원 조회
5. 프로필 탭에서 정보 수정

### 관리자로 테스트
1. `admin@jc.com`으로 로그인
2. 프로필 → 관리자 페이지
3. 승인 대기 회원 관리
4. 공지사항 작성
5. 일정 생성

---

## 📞 문제 해결

### 로그인 안 됨
Railway PostgreSQL → Query에서 확인:
```sql
SELECT * FROM users WHERE email = 'minsu@jc.com';
```

### 계정 활성화
```sql
UPDATE users 
SET status = 'active', role = 'member' 
WHERE email = 'minsu@jc.com';
```

### 비밀번호 재설정
```sql
UPDATE users 
SET password_hash = 'test1234' 
WHERE email = 'minsu@jc.com';
```

---

## 📚 추가 문서

- **웹 버전**: [web/README.md](web/README.md)
- **작업 가이드**: [Docs/contributing.md](Docs/contributing.md)
- **Railway 배포**: [RAILWAY_ONLY_SETUP.md](RAILWAY_ONLY_SETUP.md)
- **테스트 계정 상세**: [TEST_ACCOUNTS.md](TEST_ACCOUNTS.md)

---

**최종 업데이트**: 2026-02-15  
**버전**: 1.0  
**작업자**: msgyeong
