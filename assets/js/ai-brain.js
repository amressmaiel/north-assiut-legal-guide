/**
 * 🧠 سَنَد — محرك الواجهة الآمن على GitHub Pages
 * الاتصال يتم من خلال Cloudflare Worker، ولا يوجد مفتاح Gemini داخل المتصفح.
 */

// ضع رابط Cloudflare Worker بعد نشره.
// مثال: https://north-assiut-legal-ai-proxy.username.workers.dev
const AI_PROXY_URL = "https://north-assiut-legal-ai-proxy.amressmaiel.workers.dev";

// آخر 6 رسائل فقط داخل الجلسة الحالية، حتى يظل الحوار طبيعيًا وخفيفًا.
const SAND_MAX_HISTORY_MESSAGES = 6;
const sandConversationHistory = [];

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeClientReply(text) {
  let cleaned = String(text ?? "").trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/<analysis>[\s\S]*?<\/analysis>/gi, "");
  const markers = [
    /(?:^|\n)\s*\d*[.)-]?\s*review\s+against\s+constraints\s*:?/i,
    /(?:^|\n)\s*\d*[.)-]?\s*self[- ]?check\s*:?/i,
    /(?:^|\n)\s*\d*[.)-]?\s*internal\s+(?:analysis|review|reasoning)\s*:?/i,
    /(?:^|\n)\s*\d*[.)-]?\s*final\s+review\s*:?/i,
    /(?:^|\n)\s*\d*[.)-]?\s*chain\s+of\s+thought\s*:?/i
  ];
  let cutAt = -1;
  for (const marker of markers) {
    const match = cleaned.match(marker);
    if (match && typeof match.index === "number") {
      cutAt = cutAt === -1 ? match.index : Math.min(cutAt, match.index);
    }
  }
  if (cutAt !== -1) cleaned = cleaned.slice(0, cutAt);
  return cleaned.trim();
}

function formatAiReply(text) {
  return escapeHtml(sanitizeClientReply(text))
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/^###\s(.+)$/gm, '<b class="ai-section-title">$1</b>')
    .replace(/^##\s(.+)$/gm, '<b class="ai-section-title">$1</b>')
    .replace(/\n/g, "<br>");
}

function normalizeArabic(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rememberSandMessage(role, content) {
  sandConversationHistory.push({ role, content: String(content ?? "").trim() });
  while (sandConversationHistory.length > SAND_MAX_HISTORY_MESSAGES) {
    sandConversationHistory.shift();
  }
}

function getSandHistoryPrompt() {
  if (!sandConversationHistory.length) return "لا توجد رسائل سابقة في المحادثة الحالية.";
  return sandConversationHistory
    .map(item => `${item.role === "user" ? "المستخدم" : "سَنَد"}: ${item.content}`)
    .join("\n");
}

function resetSandConversation() {
  sandConversationHistory.splice(0, sandConversationHistory.length);
}
window.resetSandConversation = resetSandConversation;

function selectRelevantArticles(query, maxItems = 12) {
  const sourceArticles = typeof allAppData === "function" ? allAppData() : (Array.isArray(window.EXECUTIVE_ARTICLES) ? window.EXECUTIVE_ARTICLES : []);
  if (!Array.isArray(sourceArticles) || !sourceArticles.length) return [];

  const normalizedQuery = normalizeArabic(query);
  const stopWords = new Set([
    "ما", "هي", "هو", "عن", "في", "من", "على", "الى", "اشرح", "وضح",
    "هل", "متى", "كيف", "ايه", "اية", "عايز", "ممكن", "لو", "طيب"
  ]);
  const tokens = normalizedQuery.split(" ").filter(token => token.length >= 2 && !stopWords.has(token));
  const articleNumbers = normalizedQuery.match(/\b\d{1,4}\b/g) || [];

  return sourceArticles
    .map(article => {
      const title = normalizeArabic(article.shortTitle);
      const searchable = normalizeArabic([
        article.lawName, article.lawNumber, article.articleNumber, article.shortTitle, article.topic, article.officialText,
        article.practicalExplanation, article.executivePoints, article.hypotheticalExamples,
        article.correctAction, article.commonErrors, article.searchText, (article.keywords || []).join(" ")
      ].join(" "));
      let score = 0;
      let titleMatches = 0;
      for (const token of tokens) {
        const variants = [...new Set([token, token.replace(/^ال/, "")].filter(v => v.length >= 2))];
        if (variants.some(v => searchable.includes(v))) score += token.length >= 5 ? 5 : 2;
        if (variants.some(v => title.includes(v))) { score += 10; titleMatches += 1; }
      }
      if (tokens.length && titleMatches === tokens.length) score += 25;
      const numberText = String(article.articleNumber || "");
      const normalizedArticleNumbers = numberText.match(/\d{1,4}/g) || [];
      if (articleNumbers.some(num => normalizedArticleNumbers.includes(num))) score += 100;
      return { article, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0)
    .slice(0, maxItems)
    .map(item => item.article);
}

function articleToPrompt(article) {
  return `
==================================================
القانون: ${article.lawName || "غير محدد"} ${article.lawNumber ? `— ${article.lawNumber}` : ""}
المادة: ${article.articleNumber}
العنوان: ${article.shortTitle}
التصنيف: ${article.classificationLabel}
المحور: ${article.topic}

النص الرسمي:
${article.officialText}

الشرح التفسيري العملي:
${article.practicalExplanation}

النقاط التنفيذية:
${article.executivePoints}

الأمثلة الافتراضية:
${article.hypotheticalExamples}

التصرف الصحيح:
${article.correctAction}

الأخطاء الشائعة:
${article.commonErrors}
==================================================`;
}

function guideToPrompt(item) {
  return `
الباب: ${item.chapter || "غير محدد"}
الموضوع: ${item.title || "غير محدد"}
المضمون: ${item.analysis || ""}
التنبيه: ${item.aiCounter || ""}`;
}

function detectAmbiguousQuestion(query) {
  const normalized = normalizeArabic(query);
  const words = normalized.split(" ").filter(Boolean);
  const broadQuestions = [
    "الصلح", "التصالح", "الحبس", "الاعلان", "المحامي", "الطعن", "التظلم",
    "التنفيذ", "التحقيق", "الاستجواب", "الشكوى", "الحضور"
  ];
  if (words.length <= 2 && broadQuestions.some(topic => normalized === topic || normalized === `عن ${topic}`)) {
    return `تمام يا فندم، تقصد ${query.trim()} في أنهي حالة تحديدًا؟ اكتب نوع الجريمة أو مرحلة الدعوى أو رقم المادة علشان أديك إجابة دقيقة بدل ما نفترض حاجة مش مقصودة.`;
  }
  return "";
}

function getSandFollowUpSuggestions(query, reply = "") {
  const text = normalizeArabic(`${query} ${reply}`);
  if (text.includes("صلح") || text.includes("تصالح") || text.includes("ورث")) {
    return ["ما المستندات المطلوبة لإثبات الصلح؟", "هل يلزم حضور جميع الورثة؟", "ما أثر الصلح على العقوبة؟", "اديني مثال عملي على إثبات الصلح"];
  }
  if (text.includes("حبس") || text.includes("تدابير")) {
    return ["ما بدائل الحبس الاحتياطي؟", "إيه المدد اللي لازم أخلي بالي منها؟", "اديني مثال عملي", "إيه الأخطاء اللي ممكن تسبب بطلان؟"];
  }
  if (text.includes("محامي") || text.includes("استجواب")) {
    return ["متى يكون حضور المحامي وجوبيًا؟", "إيه التصرف الصحيح لو المحامي لم يحضر؟", "اديني مثال عملي", "إيه الأخطاء اللي لازم أتجنبها؟"];
  }
  if (text.includes("اعلان") || text.includes("الكتروني") || text.includes("رقمي")) {
    return ["إيه الشروط التنفيذية؟", "اديني مثال عملي", "إيه الأخطاء الشائعة؟", "اعرض لي المادة المرتبطة"];
  }
  return ["اديني مثال عملي", "إيه الخطوات التنفيذية؟", "إيه الأخطاء اللي لازم أتجنبها؟"];
}
window.getSandFollowUpSuggestions = getSandFollowUpSuggestions;

async function callAiProxy(fullPromptContext) {
  const response = await fetch(AI_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: fullPromptContext })
  });

  let data;
  try { data = await response.json(); }
  catch { throw new Error("وصل رد غير صالح من خادم سَنَد."); }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `تعذر الاتصال بسَنَد. كود الخطأ: ${response.status}`);
  }
  return String(data.reply || "").trim();
}

function getSandModeInstruction(mode) {
  const instructions = {
    brief: "نمط الإجابة المطلوب: مختصر. قدّم إجابة مباشرة ومركزة في نقاط قليلة، من غير توسع إلا عند وجود تنبيه لازم.",
    executive: "نمط الإجابة المطلوب: تنفيذي. ركز على الخطوات العملية، المستندات أو العناصر الواجب مراجعتها، والأخطاء أو المخاطر الإجرائية المهمة.",
    detailed: "نمط الإجابة المطلوب: تفصيلي. اشرح النص والربط بين المواد والتطبيق العملي بصورة منظمة، من غير تكرار أو إطالة بلا داعٍ.",
    educational: "نمط الإجابة المطلوب: تعليمي. اشرح ببساطة وبالتدرج، وأضف مثالًا عمليًا مختصرًا متى كان مفيدًا."
  };
  return instructions[mode] || instructions.executive;
}

function sandSourceDescriptor(article) {
  return {
    id: article.id,
    articleNumber: article.articleNumber || "مادة قانونية",
    shortTitle: article.shortTitle || "",
    lawName: article.lawName || "",
    lawNumber: article.lawNumber || ""
  };
}

async function processHumanIntelligence(query, options = {}) {
  if (!query || !query.trim()) return { html: "اكتب سؤالك الأول يا فندم.", suggestions: [], sources: [] };

  if (!AI_PROXY_URL || AI_PROXY_URL.includes("ضع_رابط") || !AI_PROXY_URL.startsWith("https://")) {
    return {
      html: '<b>💡 سَنَد جاهز للربط:</b><br>افتح ملف <code>ai-brain.js</code> وضع رابط Cloudflare Worker داخل المتغير <code>AI_PROXY_URL</code>.',
      suggestions: []
    };
  }

  const availableArticles = typeof allAppData === "function" ? allAppData() : (Array.isArray(window.EXECUTIVE_ARTICLES) ? window.EXECUTIVE_ARTICLES : []);
  if (!Array.isArray(availableArticles) || !availableArticles.length) {
    return { html: '<b>⚠️ تعذر قراءة البيانات:</b><br>تأكد من تحميل ملفات القوانين قبل ملف <code>ai-brain.js</code>.', suggestions: [] };
  }

  const clarification = detectAmbiguousQuestion(query);
  if (clarification) {
    rememberSandMessage("user", query);
    rememberSandMessage("assistant", clarification);
    return { html: formatAiReply(clarification), suggestions: getSandFollowUpSuggestions(query, clarification), sources: [] };
  }

  const relevantArticles = selectRelevantArticles(query);
  const contextArticle = options.contextArticleId ? availableArticles.find(article => article.id === options.contextArticleId) : null;
  const selectedArticles = relevantArticles.length ? relevantArticles.slice(0, 12) : availableArticles.slice(0, 8);
  if (contextArticle && !selectedArticles.some(article => article.id === contextArticle.id)) selectedArticles.unshift(contextArticle);
  const finalSelectedArticles = selectedArticles.slice(0, 12);
  const guideContext = Array.isArray(window.LEGAL_DATABASE) ? window.LEGAL_DATABASE.slice(0, 10).map(guideToPrompt).join("\n") : "";
  const articlesContext = finalSelectedArticles.map(articleToPrompt).join("\n");
  const historyContext = getSandHistoryPrompt();
  const modeInstruction = getSandModeInstruction(options.mode);

  const prompt = `
${modeInstruction}

سياق المحادثة السابقة داخل الجلسة الحالية:
${historyContext}

${contextArticle ? `المستخدم فتح المادة التالية قبل طرح السؤال، فاعتبرها سياقًا مباشرًا عند الإجابة ما لم يكن السؤال عن موضوع مختلف بوضوح:\n${articleToPrompt(contextArticle)}\n` : ""}
مقتطفات محورية من الدليل:
${guideContext}

المواد الأكثر صلة بالسؤال الحالي من مكتبة القوانين الكاملة:
${articlesContext}

السؤال الحالي:
${query}
`;

  try {
    const aiText = sanitizeClientReply(await callAiProxy(prompt));
    if (!aiText) {
      return { html: "وصل رد غير مكتمل. جرّب تعيد صياغة السؤال بشكل أوضح يا فندم.", suggestions: [], sources: [] };
    }
    rememberSandMessage("user", query);
    rememberSandMessage("assistant", aiText);
    const displayedSources = relevantArticles.length ? finalSelectedArticles : (contextArticle ? [contextArticle] : []);
    return { html: formatAiReply(aiText), suggestions: getSandFollowUpSuggestions(query, aiText), sources: displayedSources.slice(0, 6).map(sandSourceDescriptor) };
  } catch (error) {
    console.error("SAND Proxy Error:", error);
    return { html: `<b>⚠️ تعذر تشغيل سَنَد:</b><br>${escapeHtml(error.message || "تعذر الاتصال بالخادم.")}`, suggestions: [], sources: [] };
  }
}
