@echo off
setlocal

echo [INFO] Fetch latest from origin...
git fetch origin
if errorlevel 1 (
  echo [ERROR] git fetch failed.
  exit /b 1
)

echo [INFO] Rebase local main onto origin/main...
git pull --rebase origin main
if errorlevel 1 (
  echo [ERROR] Rebase failed. Resolve conflicts, then retry.
  exit /b 1
)

echo [INFO] Push to origin/main...
git push origin main
if errorlevel 1 (
  echo [ERROR] Push failed. Check GitHub permission/token.
  exit /b 1
)

echo [OK] Push to origin/main completed.
endlocal
