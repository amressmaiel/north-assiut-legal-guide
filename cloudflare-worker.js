/**
 * ⚖️ Cloudflare Worker Proxy آمن للمساعد القضائي الذكي
 * -------------------------------------------------------------------------
 * خطوات الضبط:
 * 1) استبدل رابط GitHub Pages داخل ALLOWED_ORIGINS بالنطاق الصحيح لموقعك.
 * 2) انشر الكود داخل Cloudflare Workers.
 * 3) أضف Secret باسم GEMINI_API_KEY داخل إعدادات الـ Worker.
 * 4) انسخ رابط workers.dev وضعه داخل AI_PROXY_URL في ملف ai-brain.js.
 */

// ========================================================================
// ⚙️ إعدادات يجب مراجعتها قبل النشر
// ========================================================================

/**
 * اكتب نطاق موقع GitHub Pages فقط، من غير مسار المستودع.
 * مثال صحيح: https://amressmaiel.github.io
 * مثال غير صحيح: https://amressmaiel.github.io/legal-guide
 */
const ALLOWED_ORIGINS = [
  "https://ضع-نطاق-GITHUB-PAGES-هنا"
];

/**
 * Gemini 2.5 Flash هو الموديل الأساسي.
 * عند توقفه أو عدم توفره، يحاول الـ Worker استخدام بديل متاح تلقائياً.
 */
const PREFERRED_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview"
];

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MAX_PROMPT_LENGTH = 120000;
let cachedModel = null;

// ========================================================================
// 🛡️ وظائف مساعدة
// ========================================================================
function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin);
}

function getCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonResponse(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...getCorsHeaders(origin)
    }
  });
}

function extractGoogleError(data, fallback = "ورد خطأ غير معروف من Google Gemini.") {
  return data?.error?.message || fallback;
}

function isSuitableTextModel(modelName) {
  const name = String(modelName || "").replace(/^models\//, "");

  return (
    name &&
    !name.includes("image") &&
    !name.includes("imagen") &&
    !name.includes("embedding") &&
    !name.includes("tts") &&
    !name.includes("audio") &&
    !name.includes("live") &&
    !name.includes("veo") &&
    !name.includes("lyria")
  );
}

// ========================================================================
// 🤖 تحديد موديل متاح تلقائياً
// ========================================================================
async function resolveGeminiModel(apiKey, forceRefresh = false) {
  if (cachedModel && !forceRefresh) return cachedModel;

  const listResponse = await fetch(`${GEMINI_API_BASE}/models`, {
    method: "GET",
    headers: {
      "x-goog-api-key": apiKey
    }
  });

  const listData = await listResponse.json();

  if (!listResponse.ok) {
    throw new Error(
      extractGoogleError(listData, `تعذر جلب قائمة موديلات Gemini. كود الخطأ: ${listResponse.status}`)
    );
  }

  const models = (listData.models || [])
    .filter(model => Array.isArray(model.supportedGenerationMethods))
    .filter(model => model.supportedGenerationMethods.includes("generateContent"))
    .map(model => String(model.name || "").replace(/^models\//, ""))
    .filter(isSuitableTextModel);

  const preferred = PREFERRED_MODELS.find(model => models.includes(model));
  const flashFallback = models.find(model => model.includes("flash") && !model.includes("exp"));
  const generalFallback = models[0];

  cachedModel = preferred || flashFallback || generalFallback || null;

  if (!cachedModel) {
    throw new Error("لم يتم العثور على موديل Gemini نصي متاح يدعم generateContent لهذا المفتاح.");
  }

  return cachedModel;
}

// ========================================================================
// 📡 إرسال الطلب إلى Google Gemini
// ========================================================================
async function callGemini(apiKey, model, prompt) {
  const response = await fetch(
    `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 2600
        }
      })
    }
  );

  return {
    response,
    data: await response.json()
  };
}

// ========================================================================
// 🚀 نقطة تشغيل Cloudflare Worker
// ========================================================================
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (!isAllowedOrigin(origin)) {
        return jsonResponse({ ok: false, error: "هذا النطاق غير مصرح له باستخدام الخدمة." }, 403, origin);
      }

      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin)
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "طريقة الطلب غير مسموح بها." }, 405, origin);
    }

    if (!isAllowedOrigin(origin)) {
      return jsonResponse({ ok: false, error: "هذا النطاق غير مصرح له باستخدام الخدمة." }, 403, origin);
    }

    if (!env.GEMINI_API_KEY) {
      return jsonResponse({ ok: false, error: "لم يتم إعداد مفتاح Gemini API داخل Cloudflare Secrets." }, 500, origin);
    }

    try {
      const body = await request.json();
      const prompt = String(body.prompt || "").trim();

      if (!prompt) {
        return jsonResponse({ ok: false, error: "لم يتم إرسال السؤال أو السياق القانوني." }, 400, origin);
      }

      if (prompt.length > MAX_PROMPT_LENGTH) {
        return jsonResponse({ ok: false, error: "حجم الطلب تجاوز الحد المسموح به. يرجى تقليل البيانات المرسلة." }, 413, origin);
      }

      let model = await resolveGeminiModel(env.GEMINI_API_KEY);
      let { response, data } = await callGemini(env.GEMINI_API_KEY, model, prompt);

      // إعادة فحص الموديلات مرة واحدة فقط إذا تغيّر اسم الموديل أو توقف.
      if (response.status === 404) {
        model = await resolveGeminiModel(env.GEMINI_API_KEY, true);
        ({ response, data } = await callGemini(env.GEMINI_API_KEY, model, prompt));
      }

      if (!response.ok) {
        return jsonResponse(
          {
            ok: false,
            error: extractGoogleError(data),
            googleStatus: response.status
          },
          response.status,
          origin
        );
      }

      const parts = data?.candidates?.[0]?.content?.parts || [];
      const reply = parts.map(part => part.text || "").join("\n").trim();

      if (!reply) {
        return jsonResponse({ ok: false, error: "وصل رد من Gemini ولكن لم يتم العثور على نص صالح." }, 502, origin);
      }

      return jsonResponse({ ok: true, reply }, 200, origin);
    } catch (error) {
      console.error("Worker Error:", error);
      return jsonResponse({ ok: false, error: error.message || "تعذر تشغيل خدمة المساعد الذكي." }, 500, origin);
    }
  }
};
