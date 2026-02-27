@echo off
REM ================================================
REM API 서버 로컬 테스트 스크립트 (Windows)
REM ================================================

echo ================================================
echo 🧪 API 서버 로컬 테스트
echo ================================================
echo.

REM 1. 의존성 설치 확인
echo [1/4] 📦 의존성 확인 중...
cd api
if not exist "node_modules" (
    echo ⚠️  node_modules가 없습니다. npm install 실행 중...
    call npm install
    if errorlevel 1 (
        echo ❌ npm install 실패!
        pause
        exit /b 1
    )
    echo ✅ 의존성 설치 완료
) else (
    echo ✅ node_modules 존재
)
echo.

REM 2. 환경 변수 확인
echo [2/4] ⚙️  환경 변수 확인 중...
if not exist ".env" (
    echo ⚠️  .env 파일이 없습니다.
    echo 📝 .env.example을 참고하여 .env 파일을 생성해주세요.
    echo.
    echo 필요한 환경 변수:
    echo   - DATABASE_URL (Railway PostgreSQL)
    echo   - JWT_SECRET (32자 이상)
    echo.
    pause
    exit /b 1
)
echo ✅ .env 파일 존재
echo.

REM 3. 환경 변수 로드 테스트
echo [3/4] 🔍 환경 변수 로드 테스트...
node -e "require('dotenv').config(); if (!process.env.DATABASE_URL) { console.log('❌ DATABASE_URL 없음'); process.exit(1); } if (!process.env.JWT_SECRET) { console.log('❌ JWT_SECRET 없음'); process.exit(1); } console.log('✅ 환경 변수 로드 성공');"
if errorlevel 1 (
    echo.
    echo ⚠️  환경 변수 설정을 확인해주세요.
    pause
    exit /b 1
)
echo.

REM 4. API 서버 시작
echo [4/4] 🚀 API 서버 시작...
echo ================================================
echo 📡 서버 주소: http://localhost:3000
echo 🔌 API 문서: http://localhost:3000/api
echo 🏥 헬스체크: http://localhost:3000/health
echo ================================================
echo.
echo 💡 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

node server.js

pause
