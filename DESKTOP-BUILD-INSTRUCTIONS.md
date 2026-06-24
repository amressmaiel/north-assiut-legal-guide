# تشغيل وبناء نسخة Windows Desktop

## المتطلبات
- Node.js مثبت على الجهاز.
- npm يعمل من PowerShell.
- اتصال إنترنت عند أول تثبيت للحزم.

## تشغيل التطبيق كتجربة
```powershell
cd C:\Users\original\Downloads\north-assiut-legal-guide
npm install
npm run desktop
```

أو اضغط مرتين على:
`START-DESKTOP-DEV.bat`

## بناء ملف التثبيت EXE
```powershell
cd C:\Users\original\Downloads\north-assiut-legal-guide
npm run build:win
```

أو اضغط مرتين على:
`BUILD-WINDOWS-EXE.bat`

بعد انتهاء البناء ستجد ملف التثبيت داخل:
`dist-desktop`

## رفع التحديثات إلى GitHub
```powershell
git add .
git commit -m "Add phase 5.26.2 Windows desktop Electron build"
git push origin main
```

## لا ترفع هذه المجلدات
- node_modules
- dist-desktop
- dist
- out

تم إضافتها إلى `.gitignore`.
