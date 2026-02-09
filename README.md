# 영등포 JC 회원관리 시스템

본 프로젝트의 모든 작업 규칙은 [Docs/contributing.md](Docs/contributing.md)를 따른다.

영등포 JC 회원관리를 위한 **Flutter 앱** 및 **웹 애플리케이션**입니다.

---

## 🚀 프로젝트 구성

### 📱 Flutter 앱 (모바일)
- **기술 스택**: Flutter, Supabase, Riverpod, GoRouter
- **플랫폼**: iOS, Android
- **상태**: 개발 중

### 🌐 웹 애플리케이션
- **기술 스택**: HTML, CSS, JavaScript, Supabase
- **배포**: Railway (Docker + Nginx)
- **상태**: ✅ 배포 완료

**배포된 웹 앱**: https://jc-production-7db6.up.railway.app

---

## 🌐 웹 버전 빠른 시작

### 온라인 접속
배포된 웹 앱에 바로 접속하세요:
- **URL**: https://jc-production-7db6.up.railway.app
- **관리자 계정**:
  - 이메일: `admin@jc.com`
  - 비밀번호: `admin1234`

### 로컬 실행
```bash
cd web
python -m http.server 8000
# http://localhost:8000 접속
```

자세한 내용은 [web/README.md](web/README.md) 참고.

---

## 📱 Flutter 앱 시작하기

### 1. Flutter SDK 설치
- [Flutter 공식 문서](https://docs.flutter.dev/get-started/install) 참고

### 2. 의존성 설치
```bash
flutter pub get
```

### 3. 앱 실행
```bash
flutter run
```

---

## 📚 문서

- **웹 버전**: [web/README.md](web/README.md)
- **작업 가이드**: [Docs/contributing.md](Docs/contributing.md)
- **기능 체크리스트**: [Docs/tasks/WEB_VERSION_CHECKLIST.md](Docs/tasks/WEB_VERSION_CHECKLIST.md)
- **Railway 배포**: [RAILWAY_ONLY_SETUP.md](RAILWAY_ONLY_SETUP.md)

---

## 🗄️ 데이터베이스

### Railway PostgreSQL
- **호스팅**: Railway
- **초기화 스크립트**: `database/railway_init.sql`
- **관리자 계정 생성**: `database/create_admin.sql`

---

## 🛠️ 기술 스택

### Flutter 앱
- Flutter 3.x
- Supabase (Auth, Database, Storage)
- Riverpod (상태 관리)
- GoRouter (라우팅)

### 웹 앱
- Vanilla JavaScript (ES6+)
- Supabase JS Client
- Nginx (웹 서버)
- Docker (컨테이너)

---

## 📄 라이선스

Copyright © 2026 영등포 JC. All rights reserved.

---

**최종 업데이트**: 2026-02-06
