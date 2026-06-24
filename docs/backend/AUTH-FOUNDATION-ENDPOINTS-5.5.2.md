# Auth Foundation Endpoints — 5.5.2

## GET /api/auth/health
يتأكد من عمل طبقة التهيئة.

## GET /api/bootstrap/status
يعرض هل يوجد Super Owner أم لا.

## POST /api/bootstrap/request
ينشئ requestNonce مؤقتًا لاستخدامه في ملف Bootstrap موقّع.

## POST /api/bootstrap/complete
ينشئ أول Super Owner بعد التحقق من التوقيع الرقمي.

Body:

```json
{
  "envelope": {
    "alg": "RSA-PSS-SHA256",
    "payload": { "type": "bootstrap_owner" },
    "signature": "..."
  }
}
```

## POST /api/license/verify
يتحقق من Envelope ترخيص موقّع دون إنشاء مستخدم.

## المرحلة التالية 5.5.3
ستضيف:

```text
/api/auth/login
/api/auth/logout
/api/auth/me
/api/users
/api/roles
/api/licenses
/api/devices
/api/audit
```
