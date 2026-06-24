# دليل تنفيذ نسخة iPhone / iPad عبر TestFlight

هذا الدليل يبدأ من بعد رفع المشروع على GitHub، وينتهي عند رفع build تجريبي إلى TestFlight.

## 1) المتطلبات على جهاز Mac

- تثبيت Xcode من App Store.
- تثبيت Node.js LTS.
- تثبيت Git.
- تسجيل الدخول إلى حساب Apple Developer داخل Xcode.

## 2) تحميل المشروع من GitHub

```bash
git clone https://github.com/amressmaiel/north-assiut-legal-guide.git
cd north-assiut-legal-guide
npm install
```

## 3) فحص جاهزية ملفات iOS

```bash
npm run ios:doctor
```

لو الفحص أظهر ملفات ناقصة، عالجها قبل فتح Xcode.

## 4) إنشاء مشروع iOS أو تحديثه

لو أول مرة:

```bash
npm run ios:add
```

بعد أي تعديل في ملفات الويب:

```bash
npm run ios:sync
```

ثم افتح Xcode:

```bash
npm run ios:open
```

## 5) إعدادات مهمة داخل Xcode

افتح Target الخاص بالتطبيق واضبط:

- Display Name: الدليل القضائي الذكي
- Bundle Identifier: eg.prosecution.northassiut.sand
- Version: 5.26.5
- Build: رقم متزايد مثل 1 ثم 2 ثم 3
- Signing Team: حساب Apple Developer الخاص بك
- Deployment Target: حسب الحد الأدنى الذي ستدعمه الجهة

## 6) إضافة Privacy Manifest عند الحاجة

استخدم القالب:

```text
app-shell/capacitor/ios/templates/PrivacyInfo.xcprivacy
```

وانسخه داخل مشروع iOS في Xcode إذا لم ينشئه Capacitor تلقائيًا.

## 7) اختبار على iPhone حقيقي

- وصل iPhone بالـ Mac.
- اختر الجهاز من Xcode.
- اضغط Run.
- اختبر تسجيل الدخول، سند، مكتبة القوانين، التدريب، الاجتماعات، وضع العرض الرسمي، والـ Safe Area.

## 8) أرشفة التطبيق

من Xcode:

```text
Product → Archive
```

بعد انتهاء الأرشفة افتح Organizer ثم اختر:

```text
Distribute App → App Store Connect → Upload
```

## 9) TestFlight

داخل App Store Connect:

- أنشئ التطبيق بنفس Bundle ID.
- انتظر معالجة الـ build.
- أضف بيانات الاختبار.
- أضف testers.
- أرسل رابط TestFlight للمجموعة المستهدفة.

## 10) اختبار إلزامي قبل أي عرض رسمي

- فتح التطبيق من الأيقونة.
- أول شاشة لا يظهر فيها أي خطأ تقني.
- القوائم لا تدخل تحت الـ Notch أو Home Indicator.
- الأزرار مريحة للمس.
- الروابط الخارجية تفتح بشكل سليم.
- الاجتماعات تفتح خارج التطبيق أو داخل المتصفح المناسب.
- لا توجد مفاتيح سرية ظاهرة.
- وضع العرض الرسمي يعمل بسلاسة.

