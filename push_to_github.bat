@echo off
title Push to GitHub - Digitalized Citizen Awareness Portal
echo ====================================================================
echo DCAP - Push Project to GitHub Repository
echo ====================================================================
echo.

:: Check if git is installed
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your system PATH.
    echo Please install Git from https://git-scm.com and try again.
    pause
    exit /b
)

:: Initialize git if not already done
if not exist .git (
    echo [INFO] Initializing new Git repository...
    git init
    if %errorlevel% neq 0 goto error
) else (
    echo [INFO] Git repository already initialized.
)

:: Set remote URL
echo [INFO] Configuring remote origin to:
echo https://github.com/PadmavathiPachitala/Digitalized-Citizen-Awareness-Portal.git
git remote remove origin >nul 2>&1
git remote add origin https://github.com/PadmavathiPachitala/Digitalized-Citizen-Awareness-Portal.git
if %errorlevel% neq 0 (
    echo [WARNING] Could not set remote origin directly. Trying to update it...
    git remote set-url origin https://github.com/PadmavathiPachitala/Digitalized-Citizen-Awareness-Portal.git
)

:: Stage files
echo [INFO] Staging all files...
git add .
if %errorlevel% neq 0 goto error

:: Commit
set /p commit_msg="Enter commit message (Press Enter for default: 'Updates and navbar enhancements'): "
if "%commit_msg%"=="" (
    set commit_msg=Updates and navbar enhancements
)

echo [INFO] Committing changes...
git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo [INFO] No changes to commit or commit succeeded.
)

:: Set branch to main
git branch -M main

:: Push options
echo.
echo Select push option:
echo [1] Normal Push (git push -u origin main)
echo [2] Force Push (git push -f -u origin main) - WARNING: Overwrites remote history
echo.
set /p push_choice="Enter choice (1 or 2): "

if "%push_choice%"=="2" (
    echo [INFO] Performing force push...
    git push -f -u origin main
) else (
    echo [INFO] Performing normal push...
    git push -u origin main
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. If the repository is not empty, you might need to force push option 2 or pull changes first.
    pause
    exit /b
)

echo.
echo ====================================================================
echo [SUCCESS] Code successfully pushed to GitHub!
echo ====================================================================
pause
exit /b

:error
echo.
echo [ERROR] An error occurred during execution.
pause
exit /b
