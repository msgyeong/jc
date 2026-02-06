@echo off
SETLOCAL EnableDelayedExpansion

REM ============================================
REM Supabase 데이터베이스 백업 스크립트
REM ============================================

echo.
echo =====================================
echo  📦 Supabase 데이터베이스 백업
echo =====================================
echo.

REM 설정 (아래 값을 수정하세요)
SET PROJECT_ID=your-project-id
SET BACKUP_DIR=C:\JC_Backups
SET DATE_STAMP=%date:~0,4%%date:~5,2%%date:~8,2%
SET TIME_STAMP=%time:~0,2%%time:~3,2%%time:~6,2%
SET TIME_STAMP=%TIME_STAMP: =0%

REM 백업 파일 이름
SET BACKUP_FILE=%BACKUP_DIR%\jc_backup_%DATE_STAMP%_%TIME_STAMP%.sql

REM 백업 디렉토리 생성
if not exist "%BACKUP_DIR%" (
    echo 📁 백업 디렉토리 생성: %BACKUP_DIR%
    mkdir "%BACKUP_DIR%"
)

echo 📋 백업 정보:
echo    - 프로젝트 ID: %PROJECT_ID%
echo    - 백업 경로: %BACKUP_FILE%
echo    - 날짜/시간: %DATE_STAMP% %TIME_STAMP%
echo.

REM Supabase CLI 설치 확인
where supabase >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI가 설치되어 있지 않습니다.
    echo.
    echo 📥 설치 방법:
    echo    1. Node.js 설치: https://nodejs.org/
    echo    2. PowerShell에서 실행: npm install -g supabase
    echo    3. 설치 확인: supabase --version
    echo.
    echo ⚠️  또는 수동 백업 방법:
    echo    1. Supabase 대시보드 접속
    echo    2. Database → Backups 탭
    echo    3. "Create backup" 클릭
    echo    4. 백업 파일 다운로드
    echo.
    pause
    exit /b 1
)

echo ✅ Supabase CLI 확인 완료
echo.

REM 프로젝트 ID 확인
if "%PROJECT_ID%"=="your-project-id" (
    echo ⚠️  프로젝트 ID를 설정해주세요!
    echo.
    echo 📝 프로젝트 ID 찾는 방법:
    echo    1. Supabase 대시보드 → Settings → General
    echo    2. "Reference ID" 복사
    echo    3. 이 파일(backup-supabase.bat)을 메모장으로 열기
    echo    4. "SET PROJECT_ID=your-project-id" 줄을 찾아서
    echo       실제 프로젝트 ID로 변경
    echo.
    pause
    exit /b 1
)

echo 🔄 백업 시작...
echo.

REM 데이터베이스 백업 (pg_dump 사용)
supabase db dump --project-id %PROJECT_ID% -f "%BACKUP_FILE%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ 백업 실패!
    echo.
    echo 💡 해결 방법:
    echo    1. Supabase 로그인: supabase login
    echo    2. 프로젝트 ID 확인
    echo    3. 인터넷 연결 확인
    echo.
    pause
    exit /b 1
)

echo.
echo =====================================
echo  ✅ 백업 완료!
echo =====================================
echo.
echo 📁 백업 파일: %BACKUP_FILE%
echo 📊 파일 크기: 
dir "%BACKUP_FILE%" | find "jc_backup"
echo.

REM 7일 이상 된 백업 파일 자동 삭제 (선택)
echo 🗑️  오래된 백업 파일 정리...
forfiles /P "%BACKUP_DIR%" /M jc_backup*.sql /D -7 /C "cmd /c del @path" 2>nul
echo ✅ 7일 이상 된 백업 파일 삭제 완료
echo.

echo 📋 현재 백업 목록:
dir "%BACKUP_DIR%\jc_backup*.sql" /O-D 2>nul
echo.

echo =====================================
echo  💡 다음 단계
echo =====================================
echo.
echo 1. 백업 파일을 안전한 곳에 추가 저장하세요:
echo    - Google Drive
echo    - 외장 하드
echo    - 다른 컴퓨터
echo.
echo 2. Windows 작업 스케줄러로 자동 백업 설정:
echo    - taskschd.msc 실행
echo    - "작업 만들기" 클릭
echo    - 트리거: 매주 일요일 오전 3시
echo    - 동작: "%~f0" 실행
echo.
echo 3. 복구 방법 (긴급 상황):
echo    - Supabase → SQL Editor
echo    - 백업 파일 내용 붙여넣기
echo    - "RUN" 클릭
echo.

ENDLOCAL
pause
