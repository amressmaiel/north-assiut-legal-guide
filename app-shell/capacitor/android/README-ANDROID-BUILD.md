# Android Build Notes — Phase 5.26.6

هذه المرحلة تجهز المنصة لتعمل كتطبيق Android باستخدام Capacitor.

## المتطلبات

- Node.js
- Android Studio
- Android SDK
- Java JDK مناسب لإصدار Android Gradle Plugin
- جهاز Android حقيقي أو Emulator

## أوامر البداية

```bash
npm install
npm run android:add
npm run android:sync
npm run android:open
```

بعد فتح Android Studio:

1. انتظر Gradle Sync.
2. اختر جهاز Android أو Emulator.
3. اضغط Run للتجربة.
4. للبناء النهائي استخدم Build > Generate Signed Bundle / APK.

## ملاحظات

- التطبيق يستخدم نفس Web Core للمنصة.
- خدمات الذكاء الاصطناعي والتواصل والاجتماعات تحتاج إنترنت.
- البيانات المحلية تعمل بنظام Local-first مثل نسخة الويب.
