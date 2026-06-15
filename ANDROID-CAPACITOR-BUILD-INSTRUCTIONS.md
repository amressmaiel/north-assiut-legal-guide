# خطوات تجهيز وتشغيل نسخة Android — Phase 5.26.6

## على Windows

```powershell
cd C:\Users\original\Downloads\north-assiut-legal-guide
npm install
npm run android:add
npm run android:sync
npm run android:open
```

سيفتح Android Studio. بعد ذلك:

1. انتظر Gradle Sync.
2. اختر Emulator أو جهاز Android متصل USB.
3. اضغط Run.

## بناء APK / AAB

من Android Studio:

- Build > Build Bundle(s) / APK(s) > Build APK(s)
- أو Generate Signed Bundle / APK للنشر.

## اختبار سريع

```powershell
npm run android:doctor
```

## ملاحظات مهمة

- iPhone هو الأولوية للفئة المستهدفة، لكن Android هنا جاهز كمسار إضافي.
- لا تحفظ أي مفاتيح سرية داخل ملفات الواجهة.
- روابط Workers يتم ضبطها من مركز الإعدادات العامة المتقدم.
