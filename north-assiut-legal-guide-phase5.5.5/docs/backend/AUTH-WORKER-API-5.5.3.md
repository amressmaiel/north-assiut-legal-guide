# AUTH WORKER API — Phase 5.5.3

## Public

### GET /api/auth/health
يرجع حالة Worker.

### GET /api/bootstrap/status
يعرف هل توجد تهيئة مالك أم لا.

### POST /api/bootstrap/request
ينشئ طلب Bootstrap موقتًا.

### POST /api/bootstrap/complete
يقبل Envelope موقعًا لإنشاء أول Super Owner.

### POST /api/auth/register
يسجل طلب عضوية بحالة `pending_approval`.

Body:
```json
{
  "fullName": "...",
  "username": "...",
  "email": "...",
  "password": "..."
}
```

### POST /api/auth/check-username
يفحص توفر اسم المستخدم.

### POST /api/auth/login
يسجل الدخول ويرجع Session Token.

Headers:
- `x-device-fingerprint`
- `x-device-label` اختياري

## Protected
كل ما يلي يحتاج:

`Authorization: Bearer <token>`

### GET /api/auth/me
معلومات المستخدم الحالي وصلاحياته.

### POST /api/auth/logout
إلغاء الجلسة الحالية.

### GET /api/users
إدارة المستخدمين — يحتاج `users.manage`.

### GET /api/users/pending
طلبات العضوية — يحتاج `users.manage`.

### POST /api/users/approve
قبول مستخدم وتحديد الدور والمدة وعدد الأجهزة.

```json
{
  "userId":"...",
  "roleId":"role_member",
  "validFrom":"2026-01-01",
  "validUntil":"2026-12-31",
  "maxDevices":1
}
```

### POST /api/users/reject
رفض طلب عضوية.

### POST /api/users/update-status
تفعيل/تعليق/حظر/إنهاء مستخدم.

### GET /api/roles
قائمة الأدوار.

### GET /api/permissions
قائمة الصلاحيات.

### GET /api/devices
الأجهزة المسجلة.

### POST /api/devices/update-status
تعليق أو إلغاء جهاز.

### GET /api/audit
سجل العمليات.
