# PRD - 기술 스택

## 10. 기술 스택

> 2026-03-09 업데이트: Flutter/Next.js에서 하이브리드 웹앱으로 전환 반영

### 프런트엔드 (웹앱)
- HTML, CSS, Vanilla JavaScript
- SPA (Single Page Application) 구조
- 하단 탭 네비게이션 기반 화면 전환

### 프런트엔드 (관리자 웹)
- web/admin/ (HTML + JavaScript, 동일 SPA 구조)

### 백엔드
- Node.js Express API
- JWT 인증 (jsonwebtoken + bcrypt)
- Railway PostgreSQL (pg 라이브러리)
- Cloudinary (파일 스토리지, 추후)

### 배포
- Docker (Nginx + Node.js 멀티스테이지)
- Railway 자동 배포 (main 브랜치 push)
- URL: https://jc-production-7db6.up.railway.app
