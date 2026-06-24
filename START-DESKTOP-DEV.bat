@echo off
chcp 65001 >nul
title SAND Judicial Platform - Desktop Dev
cd /d "%~dp0"
echo.
echo ============================================
echo   تشغيل نسخة سطح المكتب - الدليل القضائي الذكي
echo ============================================
echo.
if not exist node_modules (
  echo يتم تثبيت حزم Electron لأول مرة...
  npm install
)
npm run desktop
pause
