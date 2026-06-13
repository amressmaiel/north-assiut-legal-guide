/**
 * ⏱️ فهرس المواعيد القانونية المدمج — المرحلة 3.2
 * القانون الساري + الجزء المرفوع من القانون الجديد
 */
const LEGAL_DEADLINE_PRESETS = [
  {
    id:"custom-manual",category:"حساب يدوي",title:"ميعاد مخصص — إدخال يدوي",
    description:"استخدمه لأي ميعاد غير مسجل بعد مراجعة النص القانوني المنظم.",
    duration:{value:null,unit:"days"},trigger:{label:"تاريخ بداية الحساب",excludeTriggerDay:true},
    calculationMode:"manual",legalBasis:{lawTitle:"",articleNumber:"",textSummary:""},
    warnings:["أدخل المدة وطريقة الحساب بعد مراجعة النص الرسمي."],status:"manual",
    lawSystem:"manual",effectiveFrom:"",effectiveTo:"",sourceFile:"",coverageStatus:"manual",reviewNotes:""
  },
  ...(window.LEGAL_DEADLINES_CURRENT || []),
  ...(window.LEGAL_DEADLINES_NEW_LAW_PARTIAL || [])
];
window.LEGAL_DEADLINE_PRESETS = LEGAL_DEADLINE_PRESETS;
window.LEGAL_DEADLINE_SYSTEMS = [
  {
    "id": "current-criminal-procedure",
    "title": "قانون الإجراءات الجنائية رقم 150 لسنة 1950",
    "effectiveFrom": "1950-11-15",
    "effectiveTo": "2026-09-30",
    "sourceFile": "text.txt",
    "coverageStatus": "full-current-text",
    "notes": "النص المرفوع يتضمن نسخة مجمعة سارية بحسب ظاهر المصدر."
  },
  {
    "id": "criminal-procedure-174-2025",
    "title": "قانون الإجراءات الجنائية رقم 174 لسنة 2025",
    "effectiveFrom": "2026-10-01",
    "effectiveTo": "",
    "sourceFile": "قانون الإجراءات الجنائية رقم 174 لسنة 2025.pdf",
    "coverageStatus": "partial-pdf-20-pages",
    "notes": "الملف المرفوع 20 صفحة فقط؛ قاعدة مواعيد القانون الجديد غير مكتملة حتى رفع النص الكامل."
  }
];
console.log(`✅ تم تحميل ${LEGAL_DEADLINE_PRESETS.length} قالبًا للمواعيد القضائية.`);
