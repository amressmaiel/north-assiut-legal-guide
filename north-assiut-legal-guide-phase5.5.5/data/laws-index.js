/**
 * Registry for legal modules.
 * Add future laws here after loading their dedicated data file.
 */
(function(){
  const executiveFields = Array.isArray(window.EXECUTIVE_FIELDS) ? window.EXECUTIVE_FIELDS : [];
  const criminalArticles = Array.isArray(window.EXECUTIVE_ARTICLES) ? window.EXECUTIVE_ARTICLES.map(item => ({
    ...item,
    lawId: item.lawId || "criminal-procedure-174-2025",
    lawName: item.lawName || "قانون الإجراءات الجنائية الجديد",
    lawNumber: item.lawNumber || "174 لسنة 2025",
    searchText: [item.articleNumber,item.shortTitle,item.topic,item.officialText,item.practicalExplanation,item.executivePoints,item.hypotheticalExamples,item.correctAction,item.commonErrors].filter(Boolean).join(" ")
  })) : [];

  window.LAW_MODULES = [
    {
      id: "criminal-procedure-174-2025",
      title: "قانون الإجراءات الجنائية الجديد",
      number: "174 لسنة 2025",
      shortDescription: "النصوص الرسمية والشرح التنفيذي العملي والمواد المعدلة والمستحدثة.",
      icon: "📘",
      status: "active",
      moduleType: "executive-law",
      articles: criminalArticles,
      fields: executiveFields,
      meta: { ...(window.APP_META || {}), lawId: "criminal-procedure-174-2025", moduleType: "executive-law" },
      guide: Array.isArray(window.LEGAL_DATABASE) ? window.LEGAL_DATABASE : []
    },
    {
      id: "penal-code-58-1937",
      title: "قانون العقوبات المصري",
      number: "58 لسنة 1937",
      shortDescription: "نسخة مجمعة مراجعة ومختبرة تشمل النصوص الرسمية والشرح العملي والأمثلة والتنبيهات.",
      icon: "⚖️",
      status: "active",
      moduleType: "reference-law",
      articles: Array.isArray(window.PENAL_CODE_ARTICLES) ? window.PENAL_CODE_ARTICLES : [],
      fields: executiveFields,
      meta: { ...(window.PENAL_CODE_META || {}), lawId: "penal-code-58-1937", moduleType: "reference-law" },
      guide: []
    }
  ];

  const stored = localStorage.getItem("active_law_module");
  window.ACTIVE_LAW_ID = window.LAW_MODULES.some(item => item.id === stored) ? stored : "criminal-procedure-174-2025";

  window.getLawModules = function(){ return window.LAW_MODULES; };
  window.getActiveLawModule = function(){ return window.LAW_MODULES.find(item => item.id === window.ACTIVE_LAW_ID) || window.LAW_MODULES[0]; };
  window.setActiveLawModule = function(id){
    if(!window.LAW_MODULES.some(item => item.id === id)) return false;
    window.ACTIVE_LAW_ID = id;
    localStorage.setItem("active_law_module", id);
    return true;
  };
  window.getAllLawArticles = function(){ return window.LAW_MODULES.flatMap(module => module.articles || []); };
})();
