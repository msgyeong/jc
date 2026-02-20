@echo off
REM ================================================
REM 웹 서버 로컬 테스트 스크립트 (Windows)
REM ================================================

echo ================================================
echo 🌐 웹 서버 로컬 테스트
echo ================================================
echo.

echo [1/2] 📦 Python 확인 중...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python이 설치되어 있지 않습니다.
    echo 💡 Python 설치: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo ✅ Python 설치됨
echo.

echo [2/2] 🚀 웹 서버 시작...
cd web
echo ================================================
echo 🌐 웹 주소: http://localhost:8000
echo 📱 브라우저에서 접속하세요!
echo ================================================
echo.
echo 💡 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

python -m http.server 8000

pause
