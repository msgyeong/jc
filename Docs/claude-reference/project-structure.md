# 프로젝트 구조

```
E:/app/jc/
├── api/                    # Node.js Express API 서버
│   ├── server.js           # 메인 서버 (PORT || 3000)
│   ├── config/database.js  # Railway PostgreSQL 연결
│   ├── middleware/          # auth.js (JWT), errorHandler.js
│   ├── routes/             # auth, posts, notices, schedules, members, profile
│   └── utils/              # jwt.js, password.js, pushSender.js
├── web/                    # 프론트엔드 웹앱 (실제 서비스 코드)
│   ├── index.html          # SPA 메인 페이지
│   ├── js/                 # JavaScript 모듈 (app, auth, api-client, 각 화면별)
│   ├── styles/main.css     # 전체 스타일
│   ├── admin/              # 관리자 콘솔 (별도 SPA)
│   └── image/              # 이미지 리소스
├── database/migrations/    # SQL 마이그레이션 파일
├── Dockerfile              # Multi-stage: Node.js + Nginx
├── nginx.conf              # API 프록시 + 정적 파일
├── start.sh                # 컨테이너 시작 스크립트
└── Docs/                   # PRD, 태스크, 디자인 시스템 문서
    ├── prd/                # 00-overview ~ 08-design
    ├── tasks-web/          # 웹 구현 태스크
    ├── tasks-common/       # 공통 체크리스트
    ├── design-system/      # 색상, 타이포, 컴포넌트
    ├── wireframes/         # 화면별 와이어프레임
    └── user-flows/         # 유저 플로우
```
