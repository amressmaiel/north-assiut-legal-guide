# إعداد Cloudflare D1 للمرحلة 5.5.2

## 1. إنشاء قاعدة D1

```bash
wrangler d1 create sand_auth_db
```

احفظ اسم وقيمة database_id الناتجة.

## 2. إضافة binding إلى wrangler.toml

```toml
[[d1_databases]]
binding = "AUTH_DB"
database_name = "sand_auth_db"
database_id = "PUT_DATABASE_ID_HERE"
```

## 3. تطبيق الجداول

```bash
wrangler d1 execute sand_auth_db --file=backend/d1/schema-auth-5.5.2.sql
```

## 4. إنشاء مفاتيح التوقيع

```bash
cd backend/tools
node generate-auth-keypair.mjs
```

سينتج:

```text
public-auth-key.jwk
private-auth-key.jwk
```

ممنوع رفع `private-auth-key.jwk` إلى GitHub.

## 5. وضع المفتاح العام في Cloudflare

ضع محتوى `public-auth-key.jwk` كمتغير بيئة في Worker باسم:

```text
AUTH_PUBLIC_JWK
```

## 6. نشر Worker الأساس

استخدم ملف:

```text
backend/cloudflare-worker-auth-foundation.js
```

أو ادمج endpoints الخاصة به مع Worker الحالي في مرحلة الربط.
