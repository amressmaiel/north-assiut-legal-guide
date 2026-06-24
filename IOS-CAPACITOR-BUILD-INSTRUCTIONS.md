# 5.26.3 — تعليمات تجهيز نسخة iPhone / iPad

هذه المرحلة لا تنتج ملف IPA مباشرة داخل Windows، لأن بناء iOS يحتاج Mac و Xcode وتوقيع Apple.

## على Windows

يمكنك رفع المشروع إلى GitHub بعد هذه المرحلة، ثم فتحه على Mac.

## على Mac

```bash
git clone https://github.com/amressmaiel/north-assiut-legal-guide.git
cd north-assiut-legal-guide
npm install
npm run ios:add
npm run ios:sync
npm run ios:open
```

بعد فتح Xcode:

1. اختر Apple Developer Team.
2. اختبر على iPhone أو Simulator.
3. استخدم Product > Archive عند التجهيز لـ TestFlight.

## توزيع الاختبار

المسار المقترح: TestFlight.

## ملاحظة

هذه المرحلة هي iOS App Shell Preparation، وليست رفعًا إلى App Store أو TestFlight بعد.
