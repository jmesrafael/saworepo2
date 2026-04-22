@echo off
REM Auto-sync images and products.json from working directory to git repo and commit

setlocal enabledelayedexpansion

cd /d "%~dp0"
set REPO_DIR=%cd%
set WORK_DIR=%REPO_DIR%\..\saworepo1\saworepo2
set ADMIN_DATA_DIR=%REPO_DIR%\..\saworepo1\sawo-main\frontend\src\Administrator\Local\data

echo [%date% %time%] Starting auto-sync...

REM Sync images from working directory
if exist "%WORK_DIR%\images" (
  echo 📸 Syncing images...
  xcopy "%WORK_DIR%\images\*.webp" "images\" /Y /Q /D
)

REM Sync products.json if it exists
if exist "%ADMIN_DATA_DIR%\products.json" (
  echo 📋 Syncing products.json...
  xcopy "%ADMIN_DATA_DIR%\products.json" . /Y /Q /D
)

REM Check for changes
git status --porcelain > temp_status.txt
if %errorlevel% equ 0 (
  for /f %%%%A in (temp_status.txt) do if "%%%%A" neq "" goto has_changes
  echo ✅ No changes detected
  goto end
)

:has_changes
echo 🔄 Found changes, staging...
git add -A
if %errorlevel% neq 0 goto error

for /f "tokens=*" %%%%A in ('wmic os get localdatetime ^| find "20"') do set DTS=%%%%A
set TIMESTAMP=!DTS:~0,4!-!DTS:~4,2!-!DTS:~6,2! !DTS:~8,2!:!DTS:~10,2!:!DTS:~12,2!

git commit -m "Auto-sync: Product images and data [%TIMESTAMP%]"
if %errorlevel% equ 1 (
  echo ⚠️  No new changes to commit
  goto end
)

echo ✅ Committed changes successfully
echo 📤 Pushing to remote...
git push origin main
if %errorlevel% equ 0 (
  echo ✅ Pushed to remote
) else (
  echo ⚠️  Push failed (network issue or auth problem)
)

goto end

:error
echo ❌ Error during sync
exit /b 1

:end
del /f /q temp_status.txt 2>nul
echo [%date% %time%] Sync complete
