const LEGAL_DEADLINES_CURRENT = [
  {
    "id": "complaint-three-months",
    "category": "الشكاوى والطلبات",
    "title": "تقديم الشكوى في الجرائم التي يتطلب القانون فيها شكوى",
    "description": "تقديم الشكوى في الجرائم التي يتطلب القانون فيها شكوى",
    "duration": {
      "value": 3,
      "unit": "months"
    },
    "trigger": {
      "label": "تاريخ علم المجني عليه بالجريمة وبمرتكبها",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 3",
      "textSummary": "لا تقبل الشكوى بعد ثلاثة أشهر من يوم علم المجني عليه بالجريمة وبمرتكبها ما لم ينص القانون على خلاف ذلك."
    },
    "warnings": [
      "تحقق من اكتمال العلم بالجريمة وبمرتكبها معًا.",
      "راجع أي نص خاص يقرر مدة مختلفة."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "arrested-send-prosecution-24h",
    "category": "القبض والضبط",
    "title": "إرسال المتهم المضبوط إلى النيابة العامة",
    "description": "إرسال المتهم المضبوط إلى النيابة العامة",
    "duration": {
      "value": 24,
      "unit": "hours"
    },
    "trigger": {
      "label": "تاريخ ووقت ضبط المتهم",
      "excludeTriggerDay": true,
      "requiresTime": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 36",
      "textSummary": "يرسل مأمور الضبط القضائي المتهم في مدى أربع وعشرين ساعة إلى النيابة العامة المختصة."
    },
    "warnings": [
      "أدخل وقت الضبط بدقة."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "prosecution-interrogate-24h",
    "category": "القبض والضبط",
    "title": "استجواب المتهم لدى النيابة بعد تسلمه",
    "description": "استجواب المتهم لدى النيابة بعد تسلمه",
    "duration": {
      "value": 24,
      "unit": "hours"
    },
    "trigger": {
      "label": "تاريخ ووقت تسلم النيابة العامة للمتهم",
      "excludeTriggerDay": true,
      "requiresTime": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 36",
      "textSummary": "يجب على النيابة العامة أن تستجوبه في ظرف أربع وعشرين ساعة."
    },
    "warnings": [
      "أدخل وقت التسلم الفعلي بدقة."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "expert-recusal-three-days",
    "category": "الخبرة",
    "title": "الفصل في طلب رد الخبير",
    "description": "الفصل في طلب رد الخبير",
    "duration": {
      "value": 3,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ تقديم طلب رد الخبير",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 89",
      "textSummary": "على القاضي الفصل في طلب الرد في مدة ثلاثة أيام من يوم تقديمه."
    },
    "warnings": [
      "يرتب تقديم الطلب وقف استمرار الخبير في عمله إلا في حالة الاستعجال بأمر من القاضي."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "monitoring-order-thirty-days",
    "category": "التفتيش والمراقبة",
    "title": "مدة أمر المراقبة أو التسجيل أو الضبط",
    "description": "مدة أمر المراقبة أو التسجيل أو الضبط",
    "duration": {
      "value": 30,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ صدور الأمر",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 95",
      "textSummary": "يكون الأمر لمدة لا تزيد على ثلاثين يومًا قابلة للتجديد لمدة أو مدد أخرى مماثلة."
    },
    "warnings": [
      "راجع أوامر التجديد وأسبابها."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "seized-things-claim-three-years",
    "category": "المضبوطات",
    "title": "المطالبة بالأشياء المضبوطة قبل انتقال ملكيتها للحكومة",
    "description": "المطالبة بالأشياء المضبوطة قبل انتقال ملكيتها للحكومة",
    "duration": {
      "value": 3,
      "unit": "years"
    },
    "trigger": {
      "label": "تاريخ انتهاء الدعوى",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 108",
      "textSummary": "الأشياء المضبوطة التي لا يطلبها أصحابها في ميعاد ثلاث سنوات من تاريخ انتهاء الدعوى تصبح ملكًا للحكومة."
    },
    "warnings": [
      "راجع تاريخ انتهاء الدعوى بصورة نهائية."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "orders-validity-six-months",
    "category": "القبض والضبط",
    "title": "صلاحية تنفيذ أوامر الضبط والإحضار وأوامر الحبس",
    "description": "صلاحية تنفيذ أوامر الضبط والإحضار وأوامر الحبس",
    "duration": {
      "value": 6,
      "unit": "months"
    },
    "trigger": {
      "label": "تاريخ صدور الأمر",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 139",
      "textSummary": "لا يجوز تنفيذ أوامر الضبط والإحضار وأوامر الحبس بعد مضي ستة أشهر من تاريخ صدورها ما لم تعتمد لمدة أخرى."
    },
    "warnings": [
      "راجع وجود اعتماد لاحق من الجهة المختصة."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "detention-initial-fifteen-days",
    "category": "الحبس الاحتياطي",
    "title": "الحبس الاحتياطي الأول أمام قاضي التحقيق",
    "description": "الحبس الاحتياطي الأول أمام قاضي التحقيق",
    "duration": {
      "value": 15,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ بدء حبس المتهم",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 142",
      "textSummary": "ينتهي الحبس الاحتياطي بمضي خمسة عشر يومًا على حبس المتهم."
    },
    "warnings": [
      "راجع جهة إصدار القرار وتوقيت بدايته."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "mandatory-release-misdemeanor-eight-days",
    "category": "الحبس الاحتياطي",
    "title": "الإفراج الحتمي في بعض الجنح بعد الاستجواب",
    "description": "الإفراج الحتمي في بعض الجنح بعد الاستجواب",
    "duration": {
      "value": 8,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ استجواب المتهم",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 142",
      "textSummary": "يجب الإفراج حتمًا بعد مرور ثمانية أيام من تاريخ الاستجواب إذا توافرت الشروط الواردة بالنص."
    },
    "warnings": [
      "تأكد من توافر جميع الشروط الخاصة بالحالة."
    ],
    "status": "verified-current-law-with-review-note",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "detention-referral-present-five-days",
    "category": "الحبس الاحتياطي",
    "title": "عرض أمر الحبس بعد الإعلان بالإحالة",
    "description": "عرض أمر الحبس بعد الإعلان بالإحالة",
    "duration": {
      "value": 5,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ الإعلان بالإحالة",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 143",
      "textSummary": "يجب عرض أمر الحبس خلال خمسة أيام على الأكثر من تاريخ الإعلان بالإحالة."
    },
    "warnings": [
      "عدم العرض في الميعاد يرتب وجوب الإفراج وفق النص."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "detention-max-misdemeanor-six-months",
    "category": "الحبس الاحتياطي",
    "title": "الحد الأقصى للحبس الاحتياطي في الجنح",
    "description": "الحد الأقصى للحبس الاحتياطي في الجنح",
    "duration": {
      "value": 6,
      "unit": "months"
    },
    "trigger": {
      "label": "تاريخ بدء الحبس الاحتياطي",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 143",
      "textSummary": "لا يتجاوز الحبس الاحتياطي ستة أشهر في الجنح مع مراعاة ثلث الحد الأقصى للعقوبة."
    },
    "warnings": [
      "راجع قاعدة ثلث الحد الأقصى للعقوبة."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "detention-max-felony-eighteen-months",
    "category": "الحبس الاحتياطي",
    "title": "الحد الأقصى للحبس الاحتياطي في الجنايات",
    "description": "الحد الأقصى للحبس الاحتياطي في الجنايات",
    "duration": {
      "value": 18,
      "unit": "months"
    },
    "trigger": {
      "label": "تاريخ بدء الحبس الاحتياطي",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 143",
      "textSummary": "لا يتجاوز الحبس الاحتياطي ثمانية عشر شهرًا في الجنايات مع مراعاة ثلث الحد الأقصى للعقوبة."
    },
    "warnings": [
      "راجع قاعدة ثلث الحد الأقصى للعقوبة."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "detention-max-life-death-two-years",
    "category": "الحبس الاحتياطي",
    "title": "الحد الأقصى للحبس في الجرائم المعاقب عليها بالمؤبد أو الإعدام",
    "description": "الحد الأقصى للحبس في الجرائم المعاقب عليها بالمؤبد أو الإعدام",
    "duration": {
      "value": 2,
      "unit": "years"
    },
    "trigger": {
      "label": "تاريخ بدء الحبس الاحتياطي",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 143",
      "textSummary": "لا يتجاوز الحبس الاحتياطي سنتين إذا كانت العقوبة المقررة هي السجن المؤبد أو الإعدام."
    },
    "warnings": [
      "راجع الاستثناءات الخاصة بمحكمة النقض ومحكمة الإحالة."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "post-investigation-requests-detained-three-days",
    "category": "التصرف في التحقيق",
    "title": "طلبات النيابة بعد انتهاء التحقيق والمتهم محبوس",
    "description": "طلبات النيابة بعد انتهاء التحقيق والمتهم محبوس",
    "duration": {
      "value": 3,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ إرسال الأوراق إلى النيابة العامة",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 153",
      "textSummary": "تقدم النيابة طلباتها كتابة خلال ثلاثة أيام إذا كان المتهم محبوسًا."
    },
    "warnings": [
      "أثبت تاريخ استلام الأوراق."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "post-investigation-requests-released-ten-days",
    "category": "التصرف في التحقيق",
    "title": "طلبات النيابة بعد انتهاء التحقيق والمتهم مفرج عنه",
    "description": "طلبات النيابة بعد انتهاء التحقيق والمتهم مفرج عنه",
    "duration": {
      "value": 10,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ إرسال الأوراق إلى النيابة العامة",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 153",
      "textSummary": "تقدم النيابة طلباتها كتابة خلال عشرة أيام إذا كان المتهم مفرجًا عنه."
    },
    "warnings": [
      "أثبت تاريخ استلام الأوراق."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "appeal-investigation-order-prosecution-ten-days",
    "category": "الطعون في الأوامر",
    "title": "استئناف النيابة العامة لأوامر التحقيق — القاعدة العامة",
    "description": "استئناف النيابة العامة لأوامر التحقيق — القاعدة العامة",
    "duration": {
      "value": 10,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ صدور الأمر",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 166",
      "textSummary": "ميعاد الاستئناف عشرة أيام من تاريخ صدور الأمر بالنسبة إلى النيابة العامة."
    },
    "warnings": [
      "لا يستخدم عند استئناف أمر الإفراج المؤقت."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "appeal-release-order-prosecution-24h",
    "category": "الطعون في الأوامر",
    "title": "استئناف النيابة العامة لأمر الإفراج المؤقت",
    "description": "استئناف النيابة العامة لأمر الإفراج المؤقت",
    "duration": {
      "value": 24,
      "unit": "hours"
    },
    "trigger": {
      "label": "تاريخ ووقت صدور أمر الإفراج",
      "excludeTriggerDay": true,
      "requiresTime": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 166",
      "textSummary": "ميعاد استئناف النيابة لأمر الإفراج المؤقت أربع وعشرون ساعة."
    },
    "warnings": [
      "أدخل الساعة والدقيقة بدقة."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "appeal-investigation-order-parties-ten-days",
    "category": "الطعون في الأوامر",
    "title": "استئناف باقي الخصوم لأوامر التحقيق",
    "description": "استئناف باقي الخصوم لأوامر التحقيق",
    "duration": {
      "value": 10,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ إعلان الأمر",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 166",
      "textSummary": "الميعاد عشرة أيام من تاريخ إعلان الأمر بالنسبة إلى باقي الخصوم."
    },
    "warnings": [
      "راجع الحالات الخاصة المتعلقة بأوامر الحبس والإفراج."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "defendant-renew-appeal-thirty-days",
    "category": "الطعون في الأوامر",
    "title": "تجديد استئناف المتهم بعد رفضه",
    "description": "تجديد استئناف المتهم بعد رفضه",
    "duration": {
      "value": 30,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ صدور قرار رفض الاستئناف السابق",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 166",
      "textSummary": "يجوز للمتهم أن يتقدم باستئناف جديد كلما انقضت مدة ثلاثين يومًا من تاريخ صدور قرار الرفض."
    },
    "warnings": [
      "راجع تغير الحالة القانونية بعد القرار السابق."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "execute-release-if-no-decision-three-days",
    "category": "الطعون في الأوامر",
    "title": "تنفيذ أمر الإفراج عند عدم الفصل في الاستئناف",
    "description": "تنفيذ أمر الإفراج عند عدم الفصل في الاستئناف",
    "duration": {
      "value": 3,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ التقرير بالاستئناف",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 168",
      "textSummary": "إذا لم يفصل في الاستئناف خلال ثلاثة أيام من تاريخ التقرير به وجب تنفيذ أمر الإفراج فورًا."
    },
    "warnings": [
      "راجع تاريخ التقرير المثبت بالأوراق."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "prosecution-initial-detention-four-days",
    "category": "الحبس الاحتياطي",
    "title": "الحبس الاحتياطي الصادر من النيابة العامة",
    "description": "الحبس الاحتياطي الصادر من النيابة العامة",
    "duration": {
      "value": 4,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ القبض على المتهم أو تسليمه للنيابة بحسب الحالة",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 201",
      "textSummary": "مدة الأمر الصادر من النيابة العامة أقصاها أربعة أيام تالية للقبض أو التسليم بحسب الحالة."
    },
    "warnings": [
      "حدد نقطة البداية الصحيحة."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "judge-extension-after-prosecution-fifteen-days",
    "category": "الحبس الاحتياطي",
    "title": "مد الحبس أمام القاضي الجزئي بعد الأربعة أيام",
    "description": "مد الحبس أمام القاضي الجزئي بعد الأربعة أيام",
    "duration": {
      "value": 15,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ بدء مدة المد",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 202",
      "textSummary": "للقاضي مد الحبس لمدة أو لمدد متعاقبة لا تجاوز كل منها خمسة عشر يومًا وبحيث لا يزيد المجموع على خمسة وأربعين يومًا."
    },
    "warnings": [
      "راجع المجموع الكلي للمدد."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "civil-claimant-no-case-appeal-ten-days",
    "category": "الأوامر والتصرفات",
    "title": "طعن المدعي بالحقوق المدنية في الأمر بألا وجه",
    "description": "طعن المدعي بالحقوق المدنية في الأمر بألا وجه",
    "duration": {
      "value": 10,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ إعلان المدعي بالحقوق المدنية بالأمر",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 210",
      "textSummary": "يحصل الطعن في ميعاد عشرة أيام من تاريخ الإعلان."
    },
    "warnings": [
      "راجع نطاق الحق في الطعن في ضوء الأحكام الدستورية والتعليمات الأحدث."
    ],
    "status": "verified-current-law-with-review-note",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "attorney-general-cancel-no-case-three-months",
    "category": "الأوامر والتصرفات",
    "title": "إلغاء النائب العام للأمر بألا وجه",
    "description": "إلغاء النائب العام للأمر بألا وجه",
    "duration": {
      "value": 3,
      "unit": "months"
    },
    "trigger": {
      "label": "تاريخ صدور الأمر بألا وجه",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 211",
      "textSummary": "للنائب العام أن يلغي الأمر في مدة الثلاثة أشهر التالية لصدوره وفق الضوابط الواردة بالنص."
    },
    "warnings": [
      "راجع ما إذا كان قد صدر قرار برفض الطعن."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "referral-notification-ten-days",
    "category": "الإحالة والإعلان",
    "title": "إعلان الخصوم بأمر الإحالة إلى محكمة الجنايات",
    "description": "إعلان الخصوم بأمر الإحالة إلى محكمة الجنايات",
    "duration": {
      "value": 10,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ صدور أمر الإحالة",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 214",
      "textSummary": "تعلن النيابة العامة الخصوم بأمر الإحالة خلال العشرة أيام التالية لصدوره."
    },
    "warnings": [
      "راجع تاريخ الإعلان الفعلي."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "summons-contravention-one-day",
    "category": "الإعلان والحضور",
    "title": "تكليف الخصوم بالحضور في المخالفات",
    "description": "تكليف الخصوم بالحضور في المخالفات",
    "duration": {
      "value": 1,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ الإعلان أو التكليف بالحضور",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 233",
      "textSummary": "يكون التكليف بالحضور قبل انعقاد الجلسة بيوم كامل في المخالفات."
    },
    "warnings": [
      "راجع مواعيد المسافة والاستثناءات."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "summons-misdemeanor-three-days",
    "category": "الإعلان والحضور",
    "title": "تكليف الخصوم بالحضور في الجنح",
    "description": "تكليف الخصوم بالحضور في الجنح",
    "duration": {
      "value": 3,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ الإعلان أو التكليف بالحضور",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 233",
      "textSummary": "يكون التكليف بالحضور قبل انعقاد الجلسة بثلاثة أيام كاملة على الأقل في الجنح."
    },
    "warnings": [
      "راجع مواعيد المسافة والاستثناءات."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "criminal-order-review-ten-days",
    "category": "الأوامر الجنائية",
    "title": "تعديل أو إلغاء الأمر الجنائي بواسطة المحامي العام أو رئيس النيابة",
    "description": "تعديل أو إلغاء الأمر الجنائي بواسطة المحامي العام أو رئيس النيابة",
    "duration": {
      "value": 10,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ صدور الأمر الجنائي",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 325 مكررًا",
      "textSummary": "يجوز التعديل أو الإلغاء في ظرف عشرة أيام من تاريخ صدور الأمر الجنائي."
    },
    "warnings": [
      "راجع نوع الأمر والاختصاص."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "criminal-order-reject-prosecution-ten-days",
    "category": "الأوامر الجنائية",
    "title": "إعلان النيابة العامة عدم قبول الأمر الجنائي",
    "description": "إعلان النيابة العامة عدم قبول الأمر الجنائي",
    "duration": {
      "value": 10,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ صدور الأمر الجنائي",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 327",
      "textSummary": "عدم القبول خلال عشرة أيام من تاريخ صدوره بالنسبة للنيابة العامة."
    },
    "warnings": [
      "راجع الجهة التي أصدرت الأمر."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "criminal-order-reject-other-parties-ten-days",
    "category": "الأوامر الجنائية",
    "title": "إعلان باقي الخصوم عدم قبول الأمر الجنائي",
    "description": "إعلان باقي الخصوم عدم قبول الأمر الجنائي",
    "duration": {
      "value": 10,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ إعلان الخصم بالأمر الجنائي",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 327",
      "textSummary": "عدم القبول خلال عشرة أيام من تاريخ الإعلان بالنسبة لباقي الخصوم."
    },
    "warnings": [
      "راجع صحة الإعلان."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "appeal-judgment-ten-days",
    "category": "الطعون في الأحكام",
    "title": "استئناف الحكم — الميعاد العادي",
    "description": "استئناف الحكم — الميعاد العادي",
    "duration": {
      "value": 10,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ النطق بالحكم الحضوري أو إعلان الحكم الغيابي أو الحكم في المعارضة بحسب الحالة",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 406",
      "textSummary": "يحصل الاستئناف في ظرف عشرة أيام بحسب الحالات المبينة بالنص."
    },
    "warnings": [
      "حدد نقطة البداية الصحيحة حسب طبيعة الحكم."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "attorney-general-appeal-thirty-days",
    "category": "الطعون في الأحكام",
    "title": "استئناف النائب العام للحكم",
    "description": "استئناف النائب العام للحكم",
    "duration": {
      "value": 30,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ صدور الحكم",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 406",
      "textSummary": "للنائب العام أن يستأنف في ميعاد ثلاثين يومًا من وقت صدور الحكم."
    },
    "warnings": [
      "راجع صفة مقرر الاستئناف."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "appeal-extension-five-days",
    "category": "الطعون في الأحكام",
    "title": "امتداد ميعاد الاستئناف لباقي الخصوم",
    "description": "امتداد ميعاد الاستئناف لباقي الخصوم",
    "duration": {
      "value": 5,
      "unit": "days"
    },
    "trigger": {
      "label": "تاريخ انتهاء مدة العشرة أيام الأصلية",
      "excludeTriggerDay": true
    },
    "calculationMode": "fixed",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 409",
      "textSummary": "يمتد ميعاد الاستئناف لباقي الخصوم خمسة أيام من تاريخ انتهاء العشرة أيام."
    },
    "warnings": [
      "أدخل تاريخ انتهاء المدة الأصلية."
    ],
    "status": "verified-current-law",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "limitation-criminal-case-felony-ten-years",
    "category": "انقضاء الدعوى",
    "title": "انقضاء الدعوى الجنائية في الجنايات — حساب استرشادي",
    "description": "انقضاء الدعوى الجنائية في الجنايات — حساب استرشادي",
    "duration": {
      "value": 10,
      "unit": "years"
    },
    "trigger": {
      "label": "تاريخ وقوع الجريمة أو آخر إجراء قاطع بعد المراجعة",
      "excludeTriggerDay": true
    },
    "calculationMode": "advanced-review",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المواد 15 إلى 18",
      "textSummary": "تنقضي الدعوى في الجنايات بمضي عشر سنين مع مراعاة الاستثناءات والانقطاع."
    },
    "warnings": [
      "الحساب استرشادي فقط؛ راجع الانقطاع والاستثناءات."
    ],
    "status": "advanced-review",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "limitation-criminal-case-misdemeanor-three-years",
    "category": "انقضاء الدعوى",
    "title": "انقضاء الدعوى الجنائية في الجنح — حساب استرشادي",
    "description": "انقضاء الدعوى الجنائية في الجنح — حساب استرشادي",
    "duration": {
      "value": 3,
      "unit": "years"
    },
    "trigger": {
      "label": "تاريخ وقوع الجريمة أو آخر إجراء قاطع بعد المراجعة",
      "excludeTriggerDay": true
    },
    "calculationMode": "advanced-review",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المواد 15 إلى 18",
      "textSummary": "تنقضي الدعوى في الجنح بمضي ثلاث سنين مع مراعاة الاستثناءات والانقطاع."
    },
    "warnings": [
      "الحساب استرشادي فقط؛ راجع الانقطاع والاستثناءات."
    ],
    "status": "advanced-review",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "limitation-criminal-case-contravention-one-year",
    "category": "انقضاء الدعوى",
    "title": "انقضاء الدعوى الجنائية في المخالفات — حساب استرشادي",
    "description": "انقضاء الدعوى الجنائية في المخالفات — حساب استرشادي",
    "duration": {
      "value": 1,
      "unit": "years"
    },
    "trigger": {
      "label": "تاريخ وقوع الجريمة أو آخر إجراء قاطع بعد المراجعة",
      "excludeTriggerDay": true
    },
    "calculationMode": "advanced-review",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المواد 15 إلى 18",
      "textSummary": "تنقضي الدعوى في المخالفات بمضي سنة مع مراعاة الاستثناءات والانقطاع."
    },
    "warnings": [
      "الحساب استرشادي فقط؛ راجع الانقطاع والاستثناءات."
    ],
    "status": "advanced-review",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "limitation-penalty-felony-twenty-years",
    "category": "سقوط العقوبة",
    "title": "سقوط العقوبة المحكوم بها في جناية",
    "description": "سقوط العقوبة المحكوم بها في جناية",
    "duration": {
      "value": 20,
      "unit": "years"
    },
    "trigger": {
      "label": "تاريخ بدء سريان مدة سقوط العقوبة بعد المراجعة",
      "excludeTriggerDay": true
    },
    "calculationMode": "advanced-review",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 528",
      "textSummary": "تسقط العقوبة المحكوم بها في جناية بمضي عشرين سنة ميلادية."
    },
    "warnings": [
      "راجع أسباب الانقطاع والبدء والاستثناءات."
    ],
    "status": "advanced-review",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "limitation-death-penalty-thirty-years",
    "category": "سقوط العقوبة",
    "title": "سقوط عقوبة الإعدام",
    "description": "سقوط عقوبة الإعدام",
    "duration": {
      "value": 30,
      "unit": "years"
    },
    "trigger": {
      "label": "تاريخ بدء سريان مدة سقوط العقوبة بعد المراجعة",
      "excludeTriggerDay": true
    },
    "calculationMode": "advanced-review",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 528",
      "textSummary": "تسقط عقوبة الإعدام بمضي ثلاثين سنة."
    },
    "warnings": [
      "راجع أسباب الانقطاع والبدء والاستثناءات."
    ],
    "status": "advanced-review",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "limitation-penalty-misdemeanor-five-years",
    "category": "سقوط العقوبة",
    "title": "سقوط العقوبة المحكوم بها في جنحة",
    "description": "سقوط العقوبة المحكوم بها في جنحة",
    "duration": {
      "value": 5,
      "unit": "years"
    },
    "trigger": {
      "label": "تاريخ بدء سريان مدة سقوط العقوبة بعد المراجعة",
      "excludeTriggerDay": true
    },
    "calculationMode": "advanced-review",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 528",
      "textSummary": "تسقط العقوبة المحكوم بها في جنحة بمضي خمس سنين."
    },
    "warnings": [
      "راجع أسباب الانقطاع والبدء والاستثناءات."
    ],
    "status": "advanced-review",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  },
  {
    "id": "limitation-penalty-contravention-two-years",
    "category": "سقوط العقوبة",
    "title": "سقوط العقوبة المحكوم بها في مخالفة",
    "description": "سقوط العقوبة المحكوم بها في مخالفة",
    "duration": {
      "value": 2,
      "unit": "years"
    },
    "trigger": {
      "label": "تاريخ بدء سريان مدة سقوط العقوبة بعد المراجعة",
      "excludeTriggerDay": true
    },
    "calculationMode": "advanced-review",
    "legalBasis": {
      "lawTitle": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
      "articleNumber": "المادة 528",
      "textSummary": "تسقط العقوبة المحكوم بها في مخالفة بمضي سنتين."
    },
    "warnings": [
      "راجع أسباب الانقطاع والبدء والاستثناءات."
    ],
    "status": "advanced-review",
    "lawSystem": "current-criminal-procedure",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "reviewNotes": ""
  }
];
window.LEGAL_DEADLINES_CURRENT = LEGAL_DEADLINES_CURRENT;
console.log(`✅ تم تحميل ${LEGAL_DEADLINES_CURRENT.length} موعدًا من القانون الساري.`);
