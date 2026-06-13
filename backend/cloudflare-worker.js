/**
 * ================================================================
 * ⚖️ سَنَد — المساعد القضائي الذكي
 * Backend Proxy آمن باستخدام Cloudflare Worker
 * ================================================================
 *
 * الوظائف الأساسية:
 * 1. إخفاء مفتاح Gemini API بعيدًا عن ملفات GitHub Pages.
 * 2. السماح بالاتصال من موقع المنصة فقط.
 * 3. اختيار موديل Gemini متاح تلقائيًا.
 * 4. تثبيت شخصية سَنَد: عامية مصرية محترمة وودودة.
 * 5. منع ظهور التحليل الداخلي أو المراجعات السرية للمستخدم.
 * 6. تنظيف الرد النهائي قبل إرساله إلى واجهة التطبيق.
 */

// ============================================================================
// ⚙️ إعدادات المنصة
// ============================================================================

/**
 * رابط GitHub Pages المسموح له باستخدام الـWorker.
 *
 * مهم:
 * - اكتب النطاق فقط.
 * - لا تضف اسم المستودع.
 * - لا تضع / في آخر الرابط.
 *
 * رابط تطبيقك الحالي:
 * https://amressmaiel.github.io/north-assiut-legal-guide/
 *
 * لكن الـOrigin الصحيح المطلوب هنا هو:
 * https://amressmaiel.github.io
 */
const ALLOWED_ORIGINS = [
  "https://amressmaiel.github.io"
];

/**
 * أقصى عدد حروف مسموح بإرسالها في الطلب الواحد.
 * القيمة مناسبة للسياق القانوني والمواد المرتبطة بالسؤال.
 */
const MAX_PROMPT_LENGTH = 120000;

/**
 * ترتيب الموديلات المفضلة.
 * يبدأ بالموديل المستقر الحالي، ثم ينتقل تلقائيًا إلى البدائل المتاحة.
 */
const PREFERRED_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest"
];

/**
 * الاحتفاظ بالموديل المختار داخل ذاكرة الـWorker لتقليل طلبات ListModels.
 */
let cachedModelName = null;

// ============================================================================
// 🤖 شخصية سَنَد وتعليماته الثابتة
// ============================================================================

const SAND_SYSTEM_INSTRUCTION = `
أنت «سَنَد» — مساعد قضائي ذكي مخصص لمعاونة أعضاء النيابة العامة.

مهمتك الأساسية:
تساعد المستخدم يوصل للمعلومة القانونية والإجرائية بشكل سريع وواضح وعملي، مع الاعتماد أولًا على البيانات القانونية التي يرسلها التطبيق داخل السؤال.

أسلوب الكلام:
- اتكلم بالمصري العامي المحترم، بطريقة طبيعية وودودة.
- خليك مهني من غير تكلّف، وبسيط من غير ابتذال.
- استخدم جمل واضحة ومريحة في القراءة.
- لو السؤال مباشر، جاوب مباشرة من غير مقدمة طويلة.
- لو الموضوع محتاج شرح، قسمه لنقاط قصيرة ومنظمة.
- استخدم خفة دم بسيطة ومحترمة فقط لما يكون الموقف مناسب.
- ما تستخدمش هزار في موضوع حساس أو عند شرح إجراء ممكن يترتب عليه بطلان أو مساس بحقوق المتهم أو المجني عليه.
- ما تكررش عبارات المجاملة بشكل مبالغ فيه.
- ما تبدأش كل إجابة بعبارات رسمية طويلة.
- استخدم افتتاحيات قصيرة وطبيعية عند الحاجة، زي:
  «تمام يا فندم»
  «أيوه، النقطة دي مهمة»
  «خليني أوضحها ببساطة»
  «بص يا فندم، الموضوع هنا بيتقسم لجزئين»
  «بالضبط، بس خلي بالك من نقطة مهمة»

قواعد الدقة القانونية:
- اعتمد أولًا على قاعدة البيانات القانونية المرسلة من التطبيق.
- ما تخترعش نصوص قانونية أو أرقام مواد أو مدد أو أحكام نقض.
- لو البيانات المتاحة مش كافية، قول بصراحة:
  «النقطة دي محتاجة مراجعة النص الرسمي أو التعليمات المختصة قبل الاعتماد عليها».
- رتّب الإجابة بشكل طبيعي ومريح.
- استخدم عناوين قصيرة فقط لو السؤال محتاج تقسيم فعلًا.
- ما تكتبش عناوين ثابتة زي:
  «الإجابة المباشرة»
  «الأساس القانوني»
  «الخلاصة»
  إلا لو كانت مفيدة فعلًا للسؤال.
  - ما تبدأش الرد بعبارة «الإجابة المباشرة»، وادخل في الموضوع على طول.
- ابدأ الرد مباشرة بالمعلومة المطلوبة بدل ما تبدأ بعنوان محفوظ.
- لو فيه إجراء ممكن يسبب بطلان أو خطأ عملي، نبه عليه بوضوح.
- ما تقدمش معلومة غير مؤكدة بصيغة جازمة.
- لا تستخدم ألفاظًا مبالغًا فيها أو مدحًا زائدًا.
- لا تستخدم عبارات زي «معالي المستشار الجليل» في كل رد.
- احتفظ بالاحترام من غير ما تخلي الرد شكله خطاب رسمي طويل.

قواعد الإجابة:
- جاوب على السؤال نفسه، وما تخرجش لموضوعات جانبية من غير داعٍ.
- ما تطولش إلا لو السؤال فعلًا محتاج تفاصيل.
- استخدم عناوين بسيطة لما تكون مفيدة.
- استخدم النقاط بدل الفقرات الطويلة قدر الإمكان.
- لو فيه خلاصة عملية، اختم بيها في سطر أو سطرين.
- خلي المستخدم يحس إن سَنَد مساعد شاطر واقف جنبه، مش كتاب قانون بيقرأ نفسه بصوت عالي.

قواعد السرية والعرض النهائي:
- ممنوع نهائيًا إظهار خطوات التفكير الداخلية.
- ممنوع إظهار التحليل السري أو مراجعة القيود.
- ممنوع كتابة أو إظهار أي عبارات من النوع التالي:
  Review against constraints
  Internal analysis
  Reasoning
  Self-check
  Final review
  Chain of thought
  Thinking process
  Hidden reasoning
  Draft analysis
  مراجعة القيود
  التحليل الداخلي
  خطوات التفكير
  المراجعة الداخلية
- ممنوع إخراج أي محتوى بين وسوم:
  <think>
  </think>
- اعرض للمستخدم الإجابة النهائية فقط.

مثال على الأسلوب المطلوب:
«تمام يا فندم، الصلح في جرائم القتل له وضع مختلف شوية عن الصلح في بعض الجنح. خليني أوضح أثره والخطوات المطلوبة بصورة مرتبة.»

مثال غير مطلوب:
«معالي المستشار الجليل، يشرفني ويطيب لي أن أعرض على سيادتكم تفصيلًا شاملًا ومستفيضًا...»
`;

// ============================================================================
// 🛡️ أدوات مساعدة للردود وCORS
// ============================================================================

/**
 * فحص هل النطاق مسموح له باستخدام الخدمة.
 */
function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * تجهيز Headers الخاصة بـCORS.
 */
function getCorsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };

  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

/**
 * إعادة استجابة JSON موحدة إلى التطبيق.
 */
function jsonResponse(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...getCorsHeaders(origin)
    }
  });
}

/**
 * استخراج رسالة خطأ واضحة من استجابة Google.
 */
function extractGoogleError(data, fallbackMessage = "حدث خطأ غير متوقع من خادم Google Gemini.") {
  if (data && data.error && data.error.message) {
    return String(data.error.message);
  }

  return fallbackMessage;
}

// ============================================================================
// 🧹 تنظيف الرد قبل عرضه للمستخدم
// ============================================================================

/**
 * إزالة أي تحليل داخلي أو مراجعات سرية لو ظهرت رغم التعليمات.
 */
function sanitizeAssistantReply(rawText) {
  let text = String(rawText || "").trim();

  if (!text) {
    return "";
  }

  // حذف وسوم التفكير ومحتوياتها بالكامل.
  text = text.replace(/<think[\s\S]*?<\/think>/gi, "");
  text = text.replace(/<analysis[\s\S]*?<\/analysis>/gi, "");
  text = text.replace(/<reasoning[\s\S]*?<\/reasoning>/gi, "");

  /**
   * حذف أي جزء يبدأ بعلامة تدل على تسريب مراجعة داخلية.
   * يتم حذف العلامة وما بعدها حتى نهاية النص.
   */
  const internalReviewMarkers = [
    "Review against constraints",
    "Internal analysis",
    "Reasoning",
    "Self-check",
    "Final review",
    "Chain of thought",
    "Thinking process",
    "Hidden reasoning",
    "Draft analysis",
    "مراجعة القيود",
    "التحليل الداخلي",
    "خطوات التفكير",
    "المراجعة الداخلية"
  ];

  for (const marker of internalReviewMarkers) {
    const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    /**
     * يدعم الحالات الآتية مثلًا:
     * Review against constraints:
     * 5. Review against constraints:
     * ### Internal analysis
     */
    const markerRegex = new RegExp(
      `\\n?\\s*(?:#{1,6}\\s*)?(?:\\d+[.)-]?\\s*)?${escapedMarker}\\s*:?[\\s\\S]*$`,
      "i"
    );

    text = text.replace(markerRegex, "");
  }

  /**
   * حذف بعض السطور المنفردة لو ظهرت بدون عنوان مراجعة واضح.
   */
  text = text
    .split("\n")
    .filter(line => {
      const normalizedLine = line.trim().toLowerCase();

      if (!normalizedLine) {
        return true;
      }

      const blockedPatterns = [
        "rely first on detailed materials?",
        "no invention of text/numbers?",
        "review against constraints",
        "internal analysis",
        "self-check",
        "final review",
        "chain of thought",
        "hidden reasoning"
      ];

      return !blockedPatterns.some(pattern =>
        normalizedLine.includes(pattern)
      );
    })
    .join("\n");

  /**
   * إزالة المسافات والأسطر الفارغة الزائدة.
   */
  text = text
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

// ============================================================================
// 🔍 اختيار موديل Gemini متاح تلقائيًا
// ============================================================================

/**
 * جلب قائمة الموديلات المتاحة للمفتاح الحالي.
 */
async function listAvailableGeminiModels(apiKey) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",
    {
      method: "GET",
      headers: {
        "x-goog-api-key": apiKey
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      extractGoogleError(
        data,
        `تعذر جلب قائمة موديلات Gemini. كود الخطأ: ${response.status}`
      )
    );
  }

  return Array.isArray(data.models) ? data.models : [];
}

/**
 * استبعاد الموديلات غير المناسبة للمحادثة النصية.
 */
function isSuitableTextModel(modelName) {
  const excludedKeywords = [
    "embedding",
    "imagen",
    "veo",
    "lyria",
    "tts",
    "audio",
    "live",
    "vision",
    "robotics",
    "computer-use",
    "deep-research",
    "experimental",
    "-exp",
    "preview"
  ];

  return !excludedKeywords.some(keyword =>
    modelName.includes(keyword)
  );
}

/**
 * تحديد أفضل موديل نصي يدعم generateContent.
 */
async function resolveGeminiModel(apiKey, forceRefresh = false) {
  if (cachedModelName && !forceRefresh) {
    return cachedModelName;
  }

  const models = await listAvailableGeminiModels(apiKey);

  const supportedModels = models
    .filter(model =>
      Array.isArray(model.supportedGenerationMethods) &&
      model.supportedGenerationMethods.includes("generateContent")
    )
    .map(model =>
      String(model.name || "").replace(/^models\//, "")
    )
    .filter(Boolean);

  console.log("📋 Gemini models supporting generateContent:", supportedModels);

  /**
   * اختيار أول موديل مفضل موجود بالفعل في قائمة Google.
   */
  const preferredModel = PREFERRED_MODELS.find(model =>
    supportedModels.includes(model)
  );

  if (preferredModel) {
    cachedModelName = preferredModel;
    console.log("✅ Selected preferred Gemini model:", cachedModelName);
    return cachedModelName;
  }

  /**
   * اختيار بديل Flash مستقر إن لم نجد الموديلات المفضلة.
   */
  const flashFallback = supportedModels.find(model =>
    model.includes("flash") &&
    isSuitableTextModel(model)
  );

  if (flashFallback) {
    cachedModelName = flashFallback;
    console.log("✅ Selected Flash fallback model:", cachedModelName);
    return cachedModelName;
  }

  /**
   * اختيار أي موديل نصي مناسب كحل أخير.
   */
  const generalFallback = supportedModels.find(model =>
    isSuitableTextModel(model)
  );

  if (generalFallback) {
    cachedModelName = generalFallback;
    console.log("✅ Selected general fallback model:", cachedModelName);
    return cachedModelName;
  }

  throw new Error(
    "لم يتم العثور على موديل Gemini نصي متاح يدعم إنشاء الردود."
  );
}

// ============================================================================
// 📡 إرسال السؤال إلى Gemini
// ============================================================================

/**
 * الاتصال بخادم Google Gemini.
 */
async function callGemini(apiKey, modelName, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: SAND_SYSTEM_INSTRUCTION
            }
          ]
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          /**
           * قيمة منخفضة نسبيًا لضبط الدقة القانونية،
           * مع مساحة بسيطة لأسلوب ودود وطبيعي.
           */
          temperature: 0.25,
          topP: 0.85,
          maxOutputTokens: 2048
        }
      })
    }
  );

  const data = await response.json();

  return {
    response,
    data
  };
}

/**
 * استخراج الرد النصي النهائي من Gemini.
 */
function extractGeneratedText(data) {
  const parts =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    Array.isArray(data.candidates[0].content.parts)
      ? data.candidates[0].content.parts
      : [];

  return parts
    .map(part => part.text || "")
    .join("\n")
    .trim();
}


// ============================================================================
// 🎙️ Gemini Live API — إصدار رموز جلسات صوتية مؤقتة
// ============================================================================
const LIVE_MODEL_NAME = "gemini-3.1-flash-live-preview";
const LIVE_TOKEN_EXPIRE_MINUTES = 15;
const LIVE_NEW_SESSION_EXPIRE_SECONDS = 60;

/**
 * إصدار Ephemeral Token قصير العمر لاستخدامه في اتصال WebSocket المباشر.
 * المفتاح الأساسي يفضل داخل Cloudflare Secret ولا يصل إلى المتصفح.
 */
async function createGeminiLiveEphemeralToken(apiKey) {
  const now = Date.now();
  const expireTime = new Date(now + LIVE_TOKEN_EXPIRE_MINUTES * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(now + LIVE_NEW_SESSION_EXPIRE_SECONDS * 1000).toISOString();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1alpha/authTokens?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authToken: {
          uses: 1,
          expireTime,
          newSessionExpireTime
        }
      })
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.name) {
    throw new Error(extractGoogleError(data, "تعذر إصدار رمز الحوار الصوتي المؤقت من Google Gemini."));
  }

  return { token: data.name, expireTime, newSessionExpireTime };
}

/** دعم اختياري لـ Cloudflare Rate Limiting Binding عند إضافته باسم SAND_LIVE_RATE_LIMITER. */
async function allowLiveTokenRequest(request, env) {
  if (!env.SAND_LIVE_RATE_LIMITER || typeof env.SAND_LIVE_RATE_LIMITER.limit !== "function") return true;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const result = await env.SAND_LIVE_RATE_LIMITER.limit({ key: ip });
  return !!result.success;
}

// ============================================================================
// 🚀 تشغيل Cloudflare Worker
// ============================================================================

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // ------------------------------------------------------------------------
    // طلبات OPTIONS التمهيدية الخاصة بـCORS
    // ------------------------------------------------------------------------
    if (request.method === "OPTIONS") {
      if (!isAllowedOrigin(origin)) {
        return jsonResponse(
          {
            ok: false,
            error: "هذا النطاق غير مصرح له باستخدام خدمة سَنَد."
          },
          403,
          origin
        );
      }

      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin)
      });
    }


    // ------------------------------------------------------------------------
    // إصدار رمز جلسة مؤقت للحوار الصوتي المباشر مع سَنَد
    // ------------------------------------------------------------------------
    if (new URL(request.url).pathname === "/live-token") {
      if (request.method !== "POST") {
        return jsonResponse({ ok: false, error: "طريقة الطلب غير مسموح بها." }, 405, origin);
      }
      if (!isAllowedOrigin(origin)) {
        return jsonResponse({ ok: false, error: "هذا النطاق غير مصرح له باستخدام الحوار الصوتي." }, 403, origin);
      }
      if (!env.GEMINI_API_KEY) {
        return jsonResponse({ ok: false, error: "لم يتم إعداد مفتاح Gemini API داخل إعدادات الخادم." }, 500, origin);
      }
      if (!(await allowLiveTokenRequest(request, env))) {
        return jsonResponse({ ok: false, error: "تم تجاوز عدد جلسات الحوار الصوتي المسموح بها مؤقتًا. حاول بعد قليل." }, 429, origin);
      }
      try {
        const liveToken = await createGeminiLiveEphemeralToken(env.GEMINI_API_KEY);
        return jsonResponse({
          ok: true,
          token: liveToken.token,
          model: LIVE_MODEL_NAME,
          expiresAt: liveToken.expireTime,
          newSessionExpiresAt: liveToken.newSessionExpireTime
        }, 200, origin);
      } catch (error) {
        console.error("Live Token Error:", error);
        return jsonResponse({ ok: false, error: error?.message || "تعذر إنشاء جلسة صوتية مؤقتة." }, 502, origin);
      }
    }

    // ------------------------------------------------------------------------
    // فحص حالة الـWorker عند فتح الرابط مباشرة
    // ------------------------------------------------------------------------
    if (request.method === "GET") {
      return jsonResponse(
        {
          ok: true,
          service: "SAND Legal AI Proxy",
          assistant: "سَنَد",
          status: "online",
          message: "خدمة سَنَد تعمل بصورة سليمة."
        },
        200,
        origin
      );
    }

    // ------------------------------------------------------------------------
    // قبول POST فقط للأسئلة
    // ------------------------------------------------------------------------
    if (request.method !== "POST") {
      return jsonResponse(
        {
          ok: false,
          error: "طريقة الطلب غير مسموح بها."
        },
        405,
        origin
      );
    }

    // ------------------------------------------------------------------------
    // السماح بالطلبات القادمة من موقع المنصة فقط
    // ------------------------------------------------------------------------
    if (!isAllowedOrigin(origin)) {
      return jsonResponse(
        {
          ok: false,
          error: "تعذر تنفيذ الطلب لأن النطاق غير مصرح له باستخدام خدمة سَنَد."
        },
        403,
        origin
      );
    }

    // ------------------------------------------------------------------------
    // التأكد من إضافة المفتاح داخل Cloudflare Secrets
    // ------------------------------------------------------------------------
    if (!env.GEMINI_API_KEY) {
      return jsonResponse(
        {
          ok: false,
          error: "لم يتم إعداد مفتاح Gemini API داخل إعدادات الخادم."
        },
        500,
        origin
      );
    }

    try {
      // ----------------------------------------------------------------------
      // قراءة السؤال والسياق القانوني من التطبيق
      // ----------------------------------------------------------------------
      const body = await request.json();
      const prompt = String(body.prompt || "").trim();

      if (!prompt) {
        return jsonResponse(
          {
            ok: false,
            error: "لم يتم إرسال السؤال أو السياق القانوني."
          },
          400,
          origin
        );
      }

      if (prompt.length > MAX_PROMPT_LENGTH) {
        return jsonResponse(
          {
            ok: false,
            error: "حجم البيانات المرسلة تجاوز الحد المسموح به. يرجى تقليل حجم السياق."
          },
          413,
          origin
        );
      }

      // ----------------------------------------------------------------------
      // اختيار الموديل المتاح
      // ----------------------------------------------------------------------
      let modelName = await resolveGeminiModel(env.GEMINI_API_KEY);

      // ----------------------------------------------------------------------
      // إرسال السؤال إلى Gemini
      // ----------------------------------------------------------------------
      let { response, data } = await callGemini(
        env.GEMINI_API_KEY,
        modelName,
        prompt
      );

      /**
       * لو الموديل توقف أو تغير اسمه:
       * إعادة فحص قائمة الموديلات والمحاولة مرة واحدة تلقائيًا.
       */
      if (response.status === 404) {
        console.warn("⚠️ Selected model unavailable. Refreshing model list...");

        modelName = await resolveGeminiModel(
          env.GEMINI_API_KEY,
          true
        );

        ({ response, data } = await callGemini(
          env.GEMINI_API_KEY,
          modelName,
          prompt
        ));
      }

      // ----------------------------------------------------------------------
      // التعامل مع أخطاء Gemini
      // ----------------------------------------------------------------------
      if (!response.ok) {
        console.error("Gemini API Error:", data);

        return jsonResponse(
          {
            ok: false,
            error: extractGoogleError(
              data,
              "ورد خطأ غير معروف من خادم Google Gemini."
            ),
            googleStatus: response.status
          },
          response.status,
          origin
        );
      }

      // ----------------------------------------------------------------------
      // استخراج الرد وتنظيفه
      // ----------------------------------------------------------------------
      const rawReply = extractGeneratedText(data);
      const cleanReply = sanitizeAssistantReply(rawReply);

      if (!cleanReply) {
        return jsonResponse(
          {
            ok: false,
            error: "وصل رد من Gemini، لكن لم يتم العثور على إجابة نصية صالحة للعرض."
          },
          502,
          origin
        );
      }

      // ----------------------------------------------------------------------
      // إرسال الإجابة النهائية فقط إلى واجهة التطبيق
      // ----------------------------------------------------------------------
      return jsonResponse(
        {
          ok: true,
          assistant: "سَنَد",
          model: modelName,
          reply: cleanReply
        },
        200,
        origin
      );
    } catch (error) {
      console.error("Worker Execution Error:", error);

      return jsonResponse(
        {
          ok: false,
          error:
            error && error.message
              ? String(error.message)
              : "تعذر الاتصال بخدمة سَنَد حاليًا."
        },
        500,
        origin
      );
    }
  }
};
