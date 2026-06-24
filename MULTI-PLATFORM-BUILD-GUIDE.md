# الدليل المركزي للتنفيذ والتجميع متعدد المنصات

## الدليل القضائي الذكي لأعضاء النيابة العامة — سَنَد

**المرحلة:** 5.26.7  
**الغرض:** تجميع كل خطوات إخراج نسخ المنصة من نفس الكود الأساسي إلى: Web، Windows Desktop، iPhone/iPad، Android.

---

## 1) الفكرة العامة

المنصة الآن تعتمد على **Web Core واحد**، ويتم تشغيله بعدة أغلفة:

| المنصة | التقنية | الناتج |
|---|---|---|
| Web / GitHub Pages | HTML/CSS/JS | رابط ويب |
| Windows | Electron | EXE / Portable |
| iPhone / iPad | Capacitor + Xcode | TestFlight / IPA |
| Android | Capacitor + Android Studio | APK / AAB |

القاعدة الذهبية:  
**لا نعدل كل منصة على حدة إلا في ملفات الغلاف فقط. أصل المنصة يظل واحدًا.**

---

## 2) تجهيز المشروع محليًا على Windows

افتح PowerShell داخل فولدر المشروع:

```powershell
cd C:\Users\original\Downloads\north-assiut-legal-guide
npm install
```

للتأكد من وجود Git:

```powershell
git --version
```

للتأكد من حالة المشروع:

```powershell
git status
```

---

## 3) رفع التعديلات إلى GitHub

بعد نسخ أي مرحلة جديدة فوق فولدر المشروع:

```powershell
cd C:\Users\original\Downloads\north-assiut-legal-guide
git add .
git commit -m "Update latest phase"
git push origin main
```

لو ظهر `working tree clean`، معناها لا توجد تغييرات جديدة.

---

## 4) نسخة Web / GitHub Pages

### قبل الرفع

تأكد من وجود:

- `index.html`
- `assets/`
- `config/`
- `data/`
- `manifest.webmanifest`

### النشر

ارفع المشروع إلى GitHub، ثم من إعدادات المستودع:

1. Settings.
2. Pages.
3. Source: Deploy from branch.
4. Branch: `main`.
5. Folder: `/root` أو `/docs` حسب مكان `index.html`.
6. Save.

### اختبار سريع

افتح الرابط من iPhone وWindows، وراجع:

- تسجيل الدخول.
- مركز القيادة.
- سند.
- مكتبة القوانين.
- وضع العرض السينمائي.

---

## 5) نسخة Windows Desktop EXE

### تشغيل تجريبي

```powershell
cd C:\Users\original\Downloads\north-assiut-legal-guide
npm install
npm run desktop
```

أو شغّل:

```text
START-DESKTOP-DEV.bat
```

### بناء EXE

```powershell
npm run build:win
```

أو شغّل:

```text
BUILD-WINDOWS-EXE.bat
```

### مكان الملف الناتج

```text
dist-desktop
```

### اختبار نسخة Windows

افتح التطبيق وتأكد من:

- يفتح Maximize.
- الروابط الخارجية تفتح خارج التطبيق.
- وضع العرض الرسمي يمكن تكبيره.
- الطباعة تعمل.
- النسخ الاحتياطي يصدّر ملف JSON.

---

## 6) نسخة iPhone / iPad — TestFlight

> التنفيذ الحقيقي يحتاج Mac + Xcode + Apple Developer Account.

### على Windows

ارفع آخر نسخة إلى GitHub:

```powershell
git add .
git commit -m "Prepare iOS build"
git push origin main
```

### على Mac

```bash
git clone https://github.com/amressmaiel/north-assiut-legal-guide.git
cd north-assiut-legal-guide
npm install
npm run ios:doctor
npm run ios:add
npm run ios:sync
npm run ios:open
```

### داخل Xcode

1. اختر مشروع iOS.
2. اضبط Bundle Identifier.
3. اختر Team الخاص بحساب Apple Developer.
4. اضبط Version وBuild Number.
5. اختبر على iPhone حقيقي.
6. Product > Archive.
7. Distribute App.
8. App Store Connect.
9. Upload.
10. افتح App Store Connect ثم TestFlight.

### ملفات iOS المهمة

- `capacitor.config.ts`
- `IOS-TESTFLIGHT-EXECUTION-GUIDE.md`
- `app-shell/capacitor/ios/IOS-TESTFLIGHT-CHECKLIST.md`
- `app-shell/capacitor/ios/templates/PrivacyInfo.xcprivacy`
- `app-shell/capacitor/ios/templates/ExportOptions-AppStore.plist`

---

## 7) نسخة Android APK / AAB

### المتطلبات

- Node.js.
- Android Studio.
- Java JDK مناسب.
- Android SDK.

### الأوامر

```powershell
cd C:\Users\original\Downloads\north-assiut-legal-guide
npm install
npm run android:doctor
npm run android:add
npm run android:sync
npm run android:open
```

### داخل Android Studio

1. انتظر Gradle Sync.
2. اختبر على Emulator أو جهاز حقيقي.
3. Build > Build Bundle(s) / APK(s).
4. اختر APK للتجربة أو AAB للنشر على Google Play.

### ملفات Android المهمة

- `ANDROID-CAPACITOR-BUILD-INSTRUCTIONS.md`
- `app-shell/capacitor/android/ANDROID-APP-READINESS-CHECKLIST.md`
- `app-shell/capacitor/android/android-readiness-check.mjs`

---

## 8) تحديث رقم الإصدار

قبل أي إصدار رسمي، راجع:

- `platform.manifest.json`
- `package.json`
- `capacitor.config.ts`
- رقم Version داخل Xcode.
- رقم Version داخل Android Studio.

اقتراح ترقيم:

```text
5.26.7-demo.1
5.26.7-ios-testflight.1
5.26.7-win-demo.1
```

---

## 9) Checklist قبل البناء

- لا توجد علامات تعارض Git:

```powershell
Get-ChildItem -Recurse -File | Select-String -Pattern "<<<<<<<",">>>>>>>" -ErrorAction SilentlyContinue
```

- Git نظيف:

```powershell
git status
```

- المشروع يعمل Web.
- المشروع يعمل Desktop.
- لا توجد مفاتيح سرية داخل الواجهة.
- روابط Workers مضبوطة من مركز الإعدادات.
- وضع العرض السينمائي يعمل.
- مركز النسخ الاحتياطي يعمل.
- شاشة الضيوف معزولة.

---

## 10) Checklist بعد البناء

### Windows

- فتح من أيقونة سطح المكتب.
- Maximize عند التشغيل.
- الطباعة والتصدير.
- وضع العرض الرسمي.

### iPhone

- Safe Area صحيحة.
- لا يوجد زر مختفي تحت Home Indicator.
- لا يوجد Zoom مزعج عند الكتابة.
- الشريط السفلي يعمل.
- الاجتماع يفتح بشكل مناسب.

### Android

- الأزرار كبيرة وواضحة.
- الرجوع Back لا يكسر الشاشة.
- الروابط الخارجية لا تفتح داخل التطبيق بدون تحكم.

---

## 11) أشهر الأخطاء وحلولها

### Git يقول nothing to commit

لا توجد تغييرات جديدة.

### Git يرفض push بسبب remote يحتوي تغييرات

```powershell
git pull origin main --allow-unrelated-histories
```

ولو ظهر conflict، راجع الملفات قبل commit.

### npm install يفشل

احذف `node_modules` و `package-lock.json` ثم أعد التثبيت:

```powershell
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
```

### iOS لا يفتح

تأكد أن الأوامر تُنفذ على Mac، وأن Xcode مثبت.

### Android Gradle يفشل

افتح Android Studio واتركه يثبت الـ SDK المطلوب ثم أعد Sync.

---

## 12) ملاحظات أمان

- لا تحفظ مفاتيح Gemini أو أي API Secret داخل الواجهة.
- استخدم Cloudflare Secrets للسرّيات.
- روابط Workers فقط توضع في مركز الإعدادات.
- لا تنشر بيانات حقيقية داخل بيانات العرض التجريبية.
- راجع مركز الأمن قبل أي عرض رسمي.

---

## 13) المسار المقترح للإصدار الرسمي

1. رفع آخر نسخة إلى GitHub.
2. بناء Windows EXE.
3. تجهيز iOS على Mac ورفعه TestFlight.
4. بناء Android APK للتجربة.
5. اختبار وضع العرض الرسمي السينمائي.
6. اختبار الزائر والضيف والعضو والمدير.
7. أخذ Backup قبل العرض.
8. تجهيز جهاز العرض الرسمي.
9. تشغيل المنصة في Fullscreen Presentation Mode.

---

## خاتمة

هذا الدليل هو المرجع المركزي لتجميع المنصة على كل المنصات. أي تعديل مستقبلي في طريقة البناء يجب أن يضاف هنا بدل ما التعليمات تتوه في ملفات متفرقة.
