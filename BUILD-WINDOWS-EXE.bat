@echo off
chcp 65001 >nul
title Build SAND Judicial Platform EXE
cd /d "%~dp0"
echo.
echo ============================================
echo   بناء نسخة Windows EXE - الدليل القضائي الذكي
echo ============================================
echo.
if not exist node_modules (
  echo يتم تثبيت الحزم المطلوبة...
  npm install
)
echo.
echo يتم بناء ملف التثبيت داخل dist-desktop ...
npm run build:win
echo.
echo انتهى البناء. افتح مجلد dist-desktop للعثور على ملف التثبيت.
pause
