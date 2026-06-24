# Deployment Checklist — Phase 5.5.3

## 1. إنشاء D1

استخدم ملف:

`backend/d1/schema-auth-5.5.2.sql`

لتجهيز الجداول.

## 2. نشر Worker المصادقة

استخدم:

`backend/cloudflare-worker-auth-api.js`

Bindings المطلوبة:

- `AUTH_DB` = D1 database
- `AUTH_PUBLIC_JWK` = Public JWK JSON
- `ALLOWED_ORIGINS` = رابط GitHub Pages

## 3. إنشاء مفاتيح التوقيع

من جهازك فقط:

```bash
node backend/tools/generate-auth-keypair.mjs
```

لا ترفع `private-auth-key.jwk` إلى GitHub.

## 4. Bootstrap

- افتح `/api/bootstrap/status`
- أنشئ request من `/api/bootstrap/request`
- وقّع grant باستخدام أداة التوقيع
- أرسله إلى `/api/bootstrap/complete`

## 5. تسجيل أول دخول

استخدم بيانات Super Owner الناتجة من ملف Bootstrap.

## 6. ربط الواجهة

في المرحلة الحالية يمكن ضبط رابط Worker من localStorage:

```js
localStorage.setItem('SAND_AUTH_API_BASE', 'https://YOUR-AUTH-WORKER.workers.dev')
```

الربط الكامل مع واجهات الإدارة سيكون في 5.5.4.
