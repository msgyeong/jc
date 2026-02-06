@echo off
echo ====================================
echo 영등포 JC 웹 앱 서버 시작
echo ====================================
echo.
echo 브라우저에서 http://localhost:8000 으로 접속하세요.
echo 종료하려면 Ctrl+C를 누르세요.
echo.
python -m http.server 8000
pause
