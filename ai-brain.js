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
  if (typeof EXECUTIVE_ARTICLES === "undefined" || !Array.isArray(EXECUTIVE_ARTICLES)) return [];

  const normalizedQuery = normalizeArabic(query);
  const stopWords = new Set([
    "ما", "هي", "هو", "عن", "في", "من", "على", "الى", "اشرح", "وضح",
    "هل", "متى", "كيف", "ايه", "اية", "عايز", "ممكن", "لو", "طيب"
  ]);
  const tokens = normalizedQuery.split(" ").filter(token => token.length >= 2 && !stopWords.has(token));
  const articleNumbers = normalizedQuery.match(/\b\d{1,3}\b/g) || [];

  return EXECUTIVE_ARTICLES
    .map(article => {
      const title = normalizeArabic(article.shortTitle);
      const searchable = normalizeArabic([
        article.articleNumber, article.shortTitle, article.topic, article.officialText,
        article.practicalExplanation, article.executivePoints, article.hypotheticalExamples,
        article.correctAction, article.commonErrors
      ].join(" "));
      let score = 0;
      let titleMatches = 0;
      for (const token of tokens) {
        const variants = [...new Set([token, token.replace(/^ال/, "")].filter(v => v.length >= 2))];
        if (variants.some(v => searchable.includes(v))) score += token.length >= 5 ? 5 : 2;
        if (variants.some(v => title.includes(v))) { score += 10; titleMatches += 1; }
      }
      if (tokens.length && titleMatches === tokens.length) score += 25;
      if (articleNumbers.includes(String(article.articleNumber))) score += 100;
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
المادة: ${article.articleNumber}
العنوان: ${article.shortTitle}
التصنيف التحريري: ${article.classificationLabel}
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

async function processHumanIntelligence(query) {
  if (!query || !query.trim()) return { html: "اكتب سؤالك الأول يا فندم.", suggestions: [] };

  if (!AI_PROXY_URL || AI_PROXY_URL.includes("ضع_رابط") || !AI_PROXY_URL.startsWith("https://")) {
    return {
      html: '<b>💡 سَنَد جاهز للربط:</b><br>افتح ملف <code>ai-brain.js</code> وضع رابط Cloudflare Worker داخل المتغير <code>AI_PROXY_URL</code>.',
      suggestions: []
    };
  }

  if (typeof EXECUTIVE_ARTICLES === "undefined" || !Array.isArray(EXECUTIVE_ARTICLES)) {
    return { html: '<b>⚠️ تعذر قراءة البيانات:</b><br>تأكد من تحميل ملف <code>db-data.js</code> قبل ملف <code>ai-brain.js</code>.', suggestions: [] };
  }

  const clarification = detectAmbiguousQuestion(query);
  if (clarification) {
    rememberSandMessage("user", query);
    rememberSandMessage("assistant", clarification);
    return { html: formatAiReply(clarification), suggestions: getSandFollowUpSuggestions(query, clarification) };
  }

  const relevantArticles = selectRelevantArticles(query);
  const selectedArticles = relevantArticles.length ? relevantArticles : EXECUTIVE_ARTICLES.slice(0, 8);
  const guideContext = Array.isArray(LEGAL_DATABASE) ? LEGAL_DATABASE.slice(0, 10).map(guideToPrompt).join("\n") : "";
  const articlesContext = selectedArticles.map(articleToPrompt).join("\n");
  const historyContext = getSandHistoryPrompt();

  const prompt = `
سياق المحادثة السابقة داخل الجلسة الحالية:
${historyContext}

مقتطفات محورية من الدليل:
${guideContext}

المواد الأكثر صلة بالسؤال الحالي:
${articlesContext}

السؤال الحالي:
${query}
`;

  try {
    const aiText = sanitizeClientReply(await callAiProxy(prompt));
    if (!aiText) {
      return { html: "وصل رد غير مكتمل. جرّب تعيد صياغة السؤال بشكل أوضح يا فندم.", suggestions: [] };
    }
    rememberSandMessage("user", query);
    rememberSandMessage("assistant", aiText);
    return { html: formatAiReply(aiText), suggestions: getSandFollowUpSuggestions(query, aiText) };
  } catch (error) {
    console.error("SAND Proxy Error:", error);
    return { html: `<b>⚠️ تعذر تشغيل سَنَد:</b><br>${escapeHtml(error.message || "تعذر الاتصال بالخادم.")}`, suggestions: [] };
  }
}
