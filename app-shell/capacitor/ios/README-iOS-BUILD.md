# Phase 5.26.3 — iPhone / iPad Build Guide

هذه المرحلة تجهّز المنصة لتكون تطبيق iOS/iPadOS باستخدام Capacitor دون كسر نسخة الويب أو Windows Desktop.

## المتطلبات

1. جهاز Mac.
2. Xcode حديث.
3. Node.js و npm.
4. حساب Apple Developer عند استخدام TestFlight أو النشر.

## أوامر التجهيز الأولى

من داخل فولدر المشروع:

```bash
npm install
npm run ios:add
npm run ios:sync
npm run ios:open
```

سيتم فتح مشروع iOS داخل Xcode.

## داخل Xcode

- اختر Team الخاص بحساب Apple Developer.
- تأكد أن Bundle Identifier هو:

```text
eg.prosecution.northassiut.sand
```

- جرّب التشغيل على iPhone حقيقي أو Simulator.

## ملاحظات مهمة

- لا يتم تخزين أي مفاتيح سرية داخل التطبيق.
- روابط Workers فقط تُدار من إعدادات المنصة.
- iOS يحتاج اختبار فعلي للكاميرا/الصوت/الملفات/الاجتماعات.
- إشعارات Push الحقيقية ستكون مرحلة لاحقة مستقلة.
