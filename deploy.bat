@echo off
echo ========================================
echo   영등포 JC - GitHub Push 스크립트
echo ========================================
echo.

cd /d C:\jcK

echo [1/4] 원격 저장소 설정...
git remote set-url origin https://github.com/k50004950-ctrl/jc.git

echo [2/4] 변경사항 확인...
git status

echo [3/4] 커밋 확인...
git log --oneline -1

echo [4/4] Push 시작...
git push -u origin main

echo.
echo ========================================
echo   완료! GitHub에서 확인하세요:
echo   https://github.com/k50004950-ctrl/jc
echo ========================================
pause
