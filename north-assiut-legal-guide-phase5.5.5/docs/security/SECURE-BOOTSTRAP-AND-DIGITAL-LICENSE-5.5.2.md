# المرحلة 5.5.2 — Secure Bootstrap + Digital License Foundation

هذه المرحلة تنقل نظام العضويات من مجرد واجهة محلية إلى بداية أمان مؤسسي حقيقي.

## المبادئ المعتمدة

1. لا يوجد Admin افتراضي في الإنتاج.
2. إنشاء أول مالك للنظام لا يتم إلا عبر Bootstrap Grant موقّع رقميًا.
3. التراخيص والتهيئة تستخدم Envelope موقّع بتوقيع RSA-PSS-SHA256.
4. المفتاح الخاص لا يوضع أبدًا داخل GitHub أو Cloudflare Worker.
5. Cloudflare Worker يتحقق فقط من التوقيع باستخدام المفتاح العام.
6. قاعدة D1 هي مصدر الحقيقة للمستخدمين والتراخيص والجلسات وسجل العمليات.

## دورة إنشاء أول مالك

```text
/api/bootstrap/status
↓
لو لا يوجد مالك: bootstrapRequired = true
↓
/api/bootstrap/request
↓
النظام يصدر requestNonce صالحًا لمدة 30 دقيقة
↓
المالك يضع requestNonce داخل ملف bootstrap payload
↓
يوقّع الملف بالمفتاح الخاص خارج المنصة
↓
/api/bootstrap/complete
↓
Worker يتحقق من التوقيع والصلاحية وعدم استخدام grant سابقًا
↓
إنشاء Super Owner + Owner License + Audit Log
```

## ملفات المرحلة

```text
backend/d1/schema-auth-5.5.2.sql
backend/cloudflare-worker-auth-foundation.js
backend/tools/generate-auth-keypair.mjs
backend/tools/sign-auth-envelope.mjs
backend/tools/bootstrap-payload.example.json
```

## حدود المرحلة

هذه المرحلة لا تضيف تسجيل دخول نهائي كامل بعد. تسجيل الدخول والجلسات والصلاحيات من الخادم تبدأ في 5.5.3.
