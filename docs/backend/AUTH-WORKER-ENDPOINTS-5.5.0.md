# 5.5.0 — مسودة Endpoints لنظام العضويات والترخيص

هذه المسارات ستكون داخل Cloudflare Worker لاحقًا. الواجهة لا تعتمد عليها في 5.5.0، لكنها وثيقة التنفيذ المعتمدة للمرحلة 5.5.3.

## Auth

```text
POST /api/auth/bootstrap/status
POST /api/auth/bootstrap/request
POST /api/auth/bootstrap/complete
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/change-password
POST /api/auth/revoke-my-sessions
```

## Users

```text
GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id
POST   /api/users/:id/disable
POST   /api/users/:id/enable
POST   /api/users/:id/extend
POST   /api/users/:id/reset-password
POST   /api/users/:id/revoke-sessions
```

## Roles and permissions

```text
GET   /api/roles
POST  /api/roles
PATCH /api/roles/:id
GET   /api/permissions
PUT   /api/roles/:id/permissions
```

## Licenses

```text
GET  /api/licenses
POST /api/licenses/import
POST /api/licenses/:licenseId/revoke
POST /api/licenses/check-online
GET  /api/licenses/status
```

## Devices

```text
GET  /api/devices
GET  /api/users/:id/devices
POST /api/devices/:id/suspend
POST /api/devices/:id/reactivate
POST /api/users/:id/reset-devices
POST /api/device-replacement-requests
GET  /api/device-replacement-requests
POST /api/device-replacement-requests/:id/approve
POST /api/device-replacement-requests/:id/reject
```

## Audit

```text
GET /api/audit
GET /api/audit/export
```

## Settings

```text
GET   /api/settings
PATCH /api/settings
```

## Security rules

كل endpoint يجب أن يمر على:

```text
1. تحقق الجلسة
2. تحقق انتهاء العضوية
3. تحقق الترخيص
4. تحقق الجهاز
5. تحقق الصلاحية
6. تسجيل Audit عند اللزوم
```

## أمثلة صلاحيات مطلوبة

```text
/api/users              users.manage
/api/roles              roles.manage
/api/licenses           licenses.manage
/api/audit              audit.view
/api/settings           settings.manage
/api/auth/me            أي مستخدم نشط
/api/case/analyze       case.analysis.use
/api/report/export      case.report.export.word أو case.report.export.pdf
```
