# 5.5.0 — تصميم نظام العضويات والصلاحيات والترخيص المؤسسي

هذه الوثيقة هي مرحلة مواءمة قبل التنفيذ. الهدف منها نقل أفكار نظام العضويات والترخيص من ملفات التطبيق الآخر إلى منصة **الدليل القضائي الذكي** بصورة آمنة تناسب GitHub Pages + Cloudflare Worker + Cloudflare D1.

## 1. المبدأ الحاكم

لا يجوز أن يكون الأمان الحقيقي داخل ملفات الواجهة الأمامية فقط. الواجهة يمكنها إخفاء الأزرار وتحسين التجربة، لكن قرار السماح أو المنع يجب أن يصدر من Backend.

المعمارية المعتمدة:

```text
GitHub Pages Frontend
↓
Cloudflare Worker Auth API
↓
Cloudflare D1 Database
↓
KV/R2 لاحقًا للإعدادات والنسخ الاحتياطي والملفات غير الحساسة
```

## 2. ما تم استخلاصه من الملفات المرفقة

الملفات المرفقة من تطبيق آخر تحتوي على أفكار ممتازة يجب تبنيها، أهمها:

```text
authService.js                  تسجيل الدخول والجلسات والصلاحيات
secureBootstrapService.js       تهيئة أول مالك للنظام بملف موقّع
licenseClientService.js         الترخيص الموقّع، بصمة الجهاز، التحقق أونلاين/أوفلاين
usersController.js              إدارة المستخدمين والأدوار والصلاحيات
licenseClientController.js      طلبات الترخيص والاعتماد المبدئي والنهائي
accountLifecycleController.js   دورة حياة الحساب واستبدال الأجهزة
profileController.js            ملف المستخدم وصلاحياته وأجهزته
profile.js / users.js / login.js واجهات إدارة وتجربة مستخدم جيدة
```

## 3. عناصر سننقلها كما هي من حيث الفكرة

### 3.1 Secure Bootstrap

لا يتم إنشاء مالك النظام تلقائيًا بكلمة مرور افتراضية. في وضع الإنتاج، أول تشغيل يطلب ملف Bootstrap موقّع.

```text
أول تشغيل
↓
لا يوجد Super Owner
↓
النظام يولّد طلب تهيئة .sandbootreq
↓
المالك يصدر ملف تصريح .sandbootstrap موقّع
↓
النظام يتحقق من التوقيع والمدة والبصمة والـNonce
↓
ينشئ Super Owner مرة واحدة فقط
```

### 3.2 License Envelope

الترخيص يكون ملف JSON موقّع رقميًا، وليس كودًا عاديًا قابلًا للتعديل.

```text
payload + signature
```

أي تعديل في payload يبطل التوقيع.

### 3.3 Device Binding

كل مستخدم له عدد أجهزة محدد. أول دخول يسجل الجهاز، وبعد بلوغ الحد الأقصى يتم رفض جهاز جديد أو طلب استبدال.

### 3.4 Audit Log

كل عملية مهمة يجب تسجيلها، خصوصًا إدارة المستخدمين والتراخيص والتصدير وتغيير القوالب وشخصية سَنَد.

### 3.5 Owner Protection

لا يمكن حذف أو تعطيل أو تخفيض صلاحيات Super Owner من أي حساب آخر.

## 4. ما سيتم تعديله ليناسب منصة سَنَد

التطبيق القديم يبدو Electron/Node/SQLite. منصة سَنَد حاليًا Web Static + Cloudflare. لذلك:

```text
bcrypt/jswebtoken في Node
↓
سيتم استبداله في Worker بواجهات Web Crypto أو مكتبات متوافقة مع Cloudflare Workers

SQLite local
↓
Cloudflare D1

ملفات محلية لحفظ device id
↓
localStorage + بصمة محدودة + device registration داخل D1

Express routes
↓
Cloudflare Worker routes
```

## 5. الأدوار الأساسية

```text
SUPER_OWNER        مالك النظام — غير قابل للحذف أو التعطيل
SYSTEM_ADMIN       مدير نظام — يدير المستخدمين دون المساس بالمالك
CONTENT_MANAGER    مدير محتوى — يدير القوانين والقوالب وشخصية سَنَد
PROSECUTION_MEMBER عضو نيابة — يستخدم التحليل والتقارير والمسودات
REVIEWER           مراجع — يراجع تقارير ومسودات دون إدارة النظام
READ_ONLY          قراءة فقط
TRIAL_USER         تجربة محددة المدة والاستخدام
```

## 6. الصلاحيات التفصيلية المقترحة

```text
sand.text.use
sand.voice.use
case.analysis.use
case.report.generate
case.report.export.word
case.report.export.pdf
case.drafts.generate
case.drafts.edit
case.files.save
laws.view
laws.manage
templates.manage
sand.profile.manage
settings.manage
users.view
users.manage
roles.manage
licenses.manage
devices.manage
audit.view
backup.export
backup.import
security.manage
```

## 7. حالات الحساب

```text
bootstrap_owner       مالك النظام الأول
pending_activation    بانتظار التفعيل
provisional_active    اعتماد مؤقت
licensed_active       ترخيص نهائي نشط
suspended             موقوف مؤقتًا
expired               منتهي الصلاحية
revoked               ملغى
locked                مقفل بسبب محاولات دخول فاشلة
```

## 8. حالات الترخيص

```text
active
expired
revoked
suspended
pending_online_check
offline_grace
invalid_signature
not_started
```

## 9. سياسة المدة

كل مستخدم غير Super Owner يجب أن يكون له تاريخ انتهاء فعّال:

```text
valid_from
valid_until
```

عند انتهاء المدة:

```text
يمنع الدخول
تمنع API الحساسة
تظهر رسالة تواصل مع الإدارة للتجديد
يسجل الحدث في Audit Log
```

## 10. سياسة الأجهزة

```text
unlimited   للمالك فقط أو تراخيص مؤسسية خاصة
limited     عدد أجهزة محدد
blocked     منع تسجيل أجهزة جديدة
```

كل جهاز:

```text
device_id
device_fingerprint_hash
device_label
platform
first_seen
last_seen
status
```

## 11. سياسة الجلسات

```text
مدة جلسة افتراضية: 12 ساعة
انتهاء جلسة عند الخمول لاحقًا
إلغاء كل الجلسات عند تغيير كلمة المرور
إلغاء جلسة محددة من لوحة الإدارة
قفل الحساب بعد محاولات فاشلة
```

## 12. سياسة التراخيص

### ترخيص مؤسسة

يتحكم في:

```text
الجهة
عدد المستخدمين
عدد الأجهزة الإجمالي
المزايا المفعلة
مدة الترخيص
فترة السماح Offline
سياسة التحقق أونلاين
```

### ترخيص مستخدم

يتحكم في:

```text
المستخدم
الدور
الصلاحيات
مدة العضوية
عدد الأجهزة
المزايا المفعلة
```

## 13. تنسيق ملف الترخيص المقترح

```json
{
  "payload": {
    "schema_version": 1,
    "product_id": "SAND_LEGAL_GUIDE",
    "license_id": "SAND-LIC-2026-0001",
    "license_type": "user",
    "issued_to": "User Name",
    "organization": "North Assiut Prosecution",
    "local_user_id": 1,
    "role_code": "PROSECUTION_MEMBER",
    "permissions": ["sand.text.use", "case.analysis.use"],
    "features": {
      "sandText": true,
      "sandVoice": true,
      "caseAnalysis": true,
      "exportWord": true
    },
    "device_policy": { "mode": "limited", "max_devices": 1 },
    "valid_from": "2026-01-01T00:00:00Z",
    "valid_until": "2026-12-31T23:59:59Z",
    "license_revision": 1,
    "status": "active"
  },
  "signature": "base64-ed25519-signature"
}
```

## 14. حماية Super Owner

قواعد ملزمة:

```text
لا يمكن إنشاء أكثر من Super Owner إلا بملف Recovery Bootstrap خاص
لا يمكن تعطيل Super Owner
لا يمكن حذف Super Owner
لا يمكن تعديل صلاحيات Super Owner من مستخدم آخر
لا يمكن نقل ملكية النظام إلا بإجراء موقّع ومؤرشف
كل عمليات Super Owner تسجل في Audit Log
```

## 15. سياسة Audit Log

العمليات الحرجة:

```text
AUTH_LOGIN_SUCCESS
AUTH_LOGIN_FAILED
AUTH_LOGOUT
USER_CREATED
USER_UPDATED
USER_DISABLED
USER_EXTENDED
ROLE_UPDATED
PERMISSIONS_UPDATED
LICENSE_IMPORTED
LICENSE_REVOKED
DEVICE_REGISTERED
DEVICE_SUSPENDED
SETTINGS_UPDATED
SAND_PROFILE_UPDATED
TEMPLATE_CREATED
TEMPLATE_DISABLED
CASE_ANALYSIS_RUN
REPORT_EXPORTED
DRAFT_EXPORTED
BOOTSTRAP_REQUEST_CREATED
BOOTSTRAP_COMPLETED
```

درجات الخطورة:

```text
info
notice
warning
critical
```

## 16. مسار التنفيذ بعد 5.5.0

```text
5.5.1 واجهة إدارة المستخدمين والصلاحيات محليًا مع نفس نموذج D1
5.5.2 إنشاء Cloudflare D1 schema
5.5.3 إضافة Worker Auth API
5.5.4 تسجيل دخول وجلسات حقيقية
5.5.5 نظام ترخيص وتفعيل أجهزة
5.5.6 Audit Log فعلي
5.5.7 Hardening وRate Limit وCORS ونسخ احتياطي
```

## 17. قرار معماري مهم

مرحلة 5.5.1 ستكون محلية للاختبار فقط، لكن يجب أن تستخدم نفس أسماء الحقول والأدوار والصلاحيات والجداول النهائية حتى لا نعيد البناء عند الانتقال إلى Cloudflare D1.
