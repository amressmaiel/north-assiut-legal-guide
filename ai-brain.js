/**
 * 🧠 محرك المساعد القضائي الذكي - نسخة GitHub Pages الآمنة
 * المنصة الرقمية لنيابة شمال أسيوط الكلية
 * -------------------------------------------------------------------------
 * هذه النسخة لا تحتوي على مفتاح Gemini API.
 * الاتصال يتم من خلال Cloudflare Worker وسيط لحماية المفتاح السري.
 */

// ========================================================================
// 🌐 رابط Cloudflare Worker
// ========================================================================
// استبدل الرابط التالي بالرابط الذي تحصل عليه بعد نشر الـ Worker.
// مثال: https://north-assiut-legal-ai-proxy.username.workers.dev
const AI_PROXY_URL = "ضع_رابط_CLOUDFLARE_WORKER_هنا";

// ========================================================================
// 🛡️ أدوات الحماية وتنسيق الرد
// ========================================================================
function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatAiReply(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/^###\s(.+)$/gm, '<b class="ai-section-title">$1</b>')
    .replace(/^##\s(.+)$/gm, '<b class="ai-section-title">$1</b>')
    .replace(/\n/g, "<br>");
}

// ========================================================================
// 🔎 انتقاء المواد الأقرب للسؤال محلياً قبل إرسالها للـ Worker
// ========================================================================
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

function selectRelevantArticles(query, maxItems = 12) {
  if (typeof EXECUTIVE_ARTICLES === "undefined" || !Array.isArray(EXECUTIVE_ARTICLES)) {
    return [];
  }

  const normalizedQuery = normalizeArabic(query);
  const stopWords = new Set([
    "ما", "هي", "هو", "عن", "في", "من", "على", "الى", "إلى",
    "اشرح", "وضح", "هل", "متى", "كيف", "ايه", "إيه"
  ]);

  const tokens = normalizedQuery
    .split(" ")
    .filter(token => token.length >= 2 && !stopWords.has(token));

  const articleNumberMatch = normalizedQuery.match(/\b\d{1,3}\b/g) || [];

  return EXECUTIVE_ARTICLES
    .map(article => {
      const normalizedTitle = normalizeArabic(article.shortTitle);
      const searchable = normalizeArabic([
        article.articleNumber,
        article.shortTitle,
        article.topic,
        article.officialText,
        article.practicalExplanation,
        article.executivePoints,
        article.hypotheticalExamples,
        article.correctAction,
        article.commonErrors
      ].join(" "));

      let score = 0;
      let titleMatches = 0;

      tokens.forEach(token => {
        const variants = [...new Set([
          token,
          token.replace(/^ال/, "")
        ].filter(item => item.length >= 2))];

        const inBody = variants.some(variant => searchable.includes(variant));
        const inTitle = variants.some(variant => normalizedTitle.includes(variant));

        if (inBody) score += token.length >= 5 ? 5 : 2;
        if (inTitle) {
          score += 10;
          titleMatches += 1;
        }
      });

      if (tokens.length && titleMatches === tokens.length) score += 25;
      if (articleNumberMatch.includes(String(article.articleNumber))) score += 100;

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

// ========================================================================
// 📡 الاتصال الآمن بالـ Cloudflare Worker
// ========================================================================
async function callAiProxy(fullPromptContext) {
  const response = await fetch(AI_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: fullPromptContext
    })
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error("وصل رد غير صالح من خادم المساعد الذكي.");
  }

  if (!response.ok || !data.ok) {
    throw new Error(
      data.error || `تعذر الاتصال بالمساعد الذكي. كود الخطأ: ${response.status}`
    );
  }

  return String(data.reply || "").trim();
}

// ========================================================================
// ⚖️ الدالة الرئيسية المستدعاة من index.html
// ========================================================================
async function processHumanIntelligence(query) {
  if (!query || !query.trim()) {
    return "يرجى كتابة السؤال أولاً.";
  }

  if (!AI_PROXY_URL || AI_PROXY_URL.includes("ضع_رابط") || !AI_PROXY_URL.startsWith("https://")) {
    return `
      <b>💡 المساعد الذكي جاهز للربط:</b><br>
      افتح ملف <code>ai-brain.js</code> واستبدل النص الإرشادي داخل المتغير
      <code>AI_PROXY_URL</code> برابط Cloudflare Worker بعد نشره.
    `;
  }

  if (typeof EXECUTIVE_ARTICLES === "undefined" || !Array.isArray(EXECUTIVE_ARTICLES)) {
    return `
      <b>⚠️ تعذر قراءة البيانات:</b><br>
      يرجى التأكد من تحميل ملف <code>db-data.js</code> قبل ملف <code>ai-brain.js</code>.
    `;
  }

  const relevantArticles = selectRelevantArticles(query);
  const selectedArticles = relevantArticles.length
    ? relevantArticles
    : EXECUTIVE_ARTICLES.slice(0, 8);

  const guideContext = Array.isArray(LEGAL_DATABASE)
    ? LEGAL_DATABASE.slice(0, 10).map(guideToPrompt).join("\n")
    : "";

  const articlesContext = selectedArticles.map(articleToPrompt).join("\n");

  const prompt = `
أنت مساعد قضائي رقمي متخصص لمعاونة أعضاء النيابة العامة بجمهورية مصر العربية.
أجب باللغة العربية الفصحى المهنية الواضحة.

قواعد إلزامية:
1. استند أولاً إلى المواد التفصيلية المرفقة أدناه.
2. لا تخترع نصاً أو رقماً أو ميعاداً أو حكماً قضائياً.
3. إذا لم تكف البيانات، صرّح بوضوح بأن المسألة تحتاج إلى الرجوع للنص الرسمي أو التعليمات العامة للنيابة العامة.
4. افصل بين: الإجابة المباشرة، الأساس القانوني المتاح، الخطوات التنفيذية، والأخطاء التي يجب تجنبها.
5. اجعل الإجابة عملية وقابلة للاستخدام أثناء العمل.
6. لا تخرج أكواد HTML أو JavaScript.

مقتطفات محورية من الدليل:
${guideContext}

المواد الأكثر صلة بالسؤال:
${articlesContext}

السؤال:
${query}
`;

  try {
    const aiText = await callAiProxy(prompt);

    if (!aiText) {
      return `
        <b>⚠️ لم يصل رد نصي صالح:</b><br>
        يرجى إعادة صياغة السؤال والمحاولة مرة أخرى.
      `;
    }

    return formatAiReply(aiText);
  } catch (error) {
    console.error("AI Proxy Error:", error);

    return `
      <b>⚠️ تعذر تشغيل المساعد الذكي:</b><br>
      ${escapeHtml(error.message || "تعذر الاتصال بخادم المساعد الذكي.")}
    `;
  }
}
