const LEGAL_DEADLINES_NEW_LAW_PARTIAL = [
  {
    "id": "new-law-complaint-three-months",
    "category": "الشكاوى والطلبات — القانون الجديد",
    "title": "تقديم الشكوى — قانون 174 لسنة 2025",
    "description": "تقديم الشكوى — قانون 174 لسنة 2025",
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
      "lawTitle": "قانون الإجراءات الجنائية رقم 174 لسنة 2025",
      "articleNumber": "المادة 5",
      "textSummary": "لا تقبل الشكوى بعد ثلاثة أشهر من يوم علم المجني عليه بالجريمة وبمرتكبها ما لم ينص القانون على خلاف ذلك."
    },
    "warnings": [
      "المصدر المرفوع من القانون الجديد جزئي ويغطي 20 صفحة فقط.",
      "راجع باقي نصوص القانون عند استكمال الملف."
    ],
    "status": "verified-new-law-partial-source",
    "lawSystem": "criminal-procedure-174-2025",
    "effectiveFrom": "2026-10-01",
    "effectiveTo": "",
    "sourceFile": "قانون الإجراءات الجنائية رقم 174 لسنة 2025.pdf",
    "coverageStatus": "partial-pdf-20-pages",
    "reviewNotes": "مستخرج من الجزء المرفوع فقط؛ يلزم استكمال القانون كاملًا."
  }
];
window.LEGAL_DEADLINES_NEW_LAW_PARTIAL = LEGAL_DEADLINES_NEW_LAW_PARTIAL;
console.log(`🟡 تم تحميل ${LEGAL_DEADLINES_NEW_LAW_PARTIAL.length} موعدًا من الجزء المرفوع من القانون الجديد.`);
