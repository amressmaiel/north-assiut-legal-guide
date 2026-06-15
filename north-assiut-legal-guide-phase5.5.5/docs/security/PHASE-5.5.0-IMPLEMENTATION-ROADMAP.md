# خارطة تنفيذ نظام العضويات والترخيص بعد 5.5.0

## 5.5.1 — واجهة إدارة محلية مطابقة للنظام النهائي

- شاشة المستخدمين
- شاشة الأدوار والصلاحيات
- شاشة التراخيص
- شاشة الأجهزة
- شاشة سجل العمليات
- شاشة سياسات الأمان
- حفظ مؤقت في localStorage باسم واضح
- منع الأزرار والوظائف بناءً على الصلاحيات محليًا للاختبار فقط

## 5.5.2 — Cloudflare D1

- إنشاء قاعدة D1
- تنفيذ `schema-auth-5.5.0.sql`
- seed للأدوار والصلاحيات الأساسية
- إعداد Wrangler أو خطوات Cloudflare Dashboard

## 5.5.3 — Worker Auth API

- إضافة routes المصادقة
- login/logout/me
- users/roles/licenses/devices/audit
- middleware للصلاحيات
- middleware للترخيص والجهاز

## 5.5.4 — جلسات حقيقية

- Session token آمن
- token hash في D1
- انتهاء الجلسة
- revoke sessions
- قفل بعد محاولات فاشلة

## 5.5.5 — الترخيص والأجهزة

- import license envelope
- verify signature
- device binding
- max devices
- device replacement requests
- offline grace

## 5.5.6 — Audit حقيقي

- تسجيل العمليات الحرجة
- فلترة السجل
- تصدير السجل

## 5.5.7 — Hardening

- Rate limit
- CORS صارم
- منع الأسرار في الواجهة
- عدم إرجاع تفاصيل أمنية زائدة
- مراجعة صلاحيات Super Owner
