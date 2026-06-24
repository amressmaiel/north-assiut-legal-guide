# Phase 5.5.4 — Auth Frontend Integration

هذه المرحلة تربط واجهات العضويات في المنصة بـ Cloudflare Worker Auth API.

## المتطلبات قبل التشغيل

1. إنشاء Cloudflare D1 database.
2. تطبيق:

```sql
backend/d1/schema-auth-5.5.2.sql
```

3. نشر Worker:

```text
backend/cloudflare-worker-auth-api.js
```

4. إضافة Bindings/Variables:

```text
AUTH_DB
AUTH_PUBLIC_JWK
ALLOWED_ORIGINS=https://amressmaiel.github.io
```

5. داخل المنصة افتح:

```text
⚙️ إعدادات المنصة
```

ثم ضع رابط Worker الخاص بالعضويات في:

```text
رابط Worker الخاص بالعضويات Auth API
```

## الواجهات المرتبطة

- تسجيل عضوية جديدة.
- تسجيل دخول.
- إدارة طلبات العضوية.
- قبول ورفض الطلبات.
- تحديث حالة المستخدم.
- إدارة الأجهزة.
- عرض سجل العمليات المركزي.
- فحص حالة Secure Bootstrap.

## ملاحظة أمنية

الواجهة لا تقرر الصلاحيات وحدها. الصلاحيات الفعلية تصدر من Worker بعد تسجيل الدخول وتُخزن مؤقتًا في المتصفح لاستخدامها في إظهار/إخفاء عناصر الواجهة.
