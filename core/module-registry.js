/**
 * module-registry.js
 * سجل مؤسسي يصف وحدات المنصة ومساراتها الحالية.
 * المرحلة 5.1 لا تكسر المسارات القديمة؛ لكنها تضيف خريطة معمارية تمهيدًا للفصل الكامل في 5.2 وما بعدها.
 */
(function(){
  const modules = [
    {
      id: "laws",
      name: "مكتبة القوانين",
      status: "active",
      files: [
        "data/laws-index.js",
        "data/laws/criminal-procedure-174-2025.js",
        "data/laws/penal-code-58-1937.js"
      ],
      responsibilities: ["فهرسة القوانين", "عرض المواد", "البحث القانوني المحلي"]
    },
    {
      id: "sand",
      name: "سَنَد — المساعد القضائي",
      status: "active",
      files: ["assets/js/assistant-ui.js", "assets/js/ai-brain.js", "assets/js/live-voice.js"],
      responsibilities: ["المحادثة النصية", "الحوار الصوتي", "ربط الإجابات بسياق القوانين"]
    },
    {
      id: "case-analysis",
      name: "غرفة تحليل الواقعة",
      status: "active",
      files: ["assets/js/case-analysis.js", "assets/js/case-classification-engine.js", "assets/js/document-intake.js"],
      responsibilities: ["تحليل الواقعة", "التكييف المبدئي", "قوالب التحليل", "مركز الجودة", "خطة التحقيق"]
    },
    {
      id: "reports",
      name: "التقارير والتصدير",
      status: "active",
      files: ["assets/js/case-analysis.js"],
      responsibilities: ["تقرير تحليل الواقعة", "تصدير Word/HTML", "طباعة/Save as PDF"]
    },
    {
      id: "drafts",
      name: "مركز المسودات القضائية",
      status: "active",
      files: ["assets/js/case-analysis.js"],
      responsibilities: ["مسودات التصرف", "قوالب أوامر النيابة", "محرر المسودات الذكي", "فلترة المسودات"]
    },
    {
      id: "judicial-tools",
      name: "الأدوات التنفيذية",
      status: "active",
      files: ["assets/js/judicial-tools.js", "data/tools/legal-deadlines.js"],
      responsibilities: ["حاسبة المواعيد", "درع المراجعة", "قوائم الاستيفاء", "مراجعة الاختصاص"]
    },
    {
      id: "admin",
      name: "لوحة الإدارة",
      status: "planned",
      files: ["modules/admin/README.md"],
      responsibilities: ["إدارة الهوية", "إدارة القوالب", "إدارة القوانين", "إعدادات سَنَد"]
    }
  ];
  window.SAND_MODULE_REGISTRY = Object.freeze({
    version: "5.1.0",
    architecture: "modular-front-end-with-backend-ready-boundaries",
    modules,
    getModule(id){ return modules.find(m => m.id === id) || null; },
    listActive(){ return modules.filter(m => m.status === "active"); },
    listPlanned(){ return modules.filter(m => m.status === "planned"); }
  });
})();
