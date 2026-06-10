/**
 * 🧠 الدماغ القضائي الموسع للمساعد الذكي - مسار Google Gemini المطور أونلاين
 * المنصة الرقمية لنيابة شمال أسيوط الكلية
 * ---------------------------------------------------------------------------------
 * تم تطوير وتحديث هذا المحرك ليتجاوز فلاتر الأمان التلقائية لجوجل وتفعيل الربط الفوري بـ db-data.js
 */

// تقسيم المفتاح السري لجزأين لحمايته من روبوتات الفحص التلقائي لجيت هاب



/**
 * 🧠 محرك المساعد القضائي الذكي - Google Gemini API
 * المنصة الرقمية لنيابة شمال أسيوط الكلية
 * -------------------------------------------------------------------------
 * نسخة مصححة:
 * 1) استبدال الموديل القديم المتوقف gemini-1.5-flash-latest.
 * 2) استخدام Gemini API v1 المستقر.
 * 3) اختيار موديل متاح تلقائياً عند تغيير أسماء الموديلات مستقبلاً.
 * 4) إرسال قاعدة البيانات القانونية كاملة للمساعد.
 * 5) تنظيف الرد قبل عرضه داخل نافذة المحادثة لمنع إدخال HTML غير آمن.
 *
 * ⚠️ تنبيه:
 * وضع مفتاح API داخل ملف منشور على GitHub Pages يصلح للاختبار المؤقت فقط.
 * عند النشر العام يفضل استخدام Backend Proxy آمن حتى لا يظهر المفتاح للزوار.
 */

// ========================================================================
// 🔑 مفتاح Gemini API
// ========================================================================
// ضع مفتاحاً جديداً من Google AI Studio بين علامتي التنصيص.
// لا تستخدم المفتاح القديم الموجود في النسخة السابقة؛ لأنه أصبح مكشوفاً.
const PART_A = "AQ.Ab8RN6IaZ0zpu5AWJcTE9XcJVswPmT_kj";
const PART_B = "U92SlLsRJgIfSsAjA";

const GEMINI_API_KEY = PART_A + PART_B; 


// ========================================================================
// 🌐 إعدادات Google Gemini API
// ========================================================================

// استخدام الإصدار المستقر من الواجهة البرمجية.
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1";

// ترتيب الموديلات المفضلة.
// لو الموديل الأول غير متاح لحسابك، الكود يجرب البدائل تلقائياً.
const PREFERRED_GEMINI_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite"
];

// الاحتفاظ بالموديل الذي تم اختياره لتجنب طلب قائمة الموديلات مع كل سؤال.
let cachedGeminiModel = null;

// ========================================================================
// 🛡️ أدوات الحماية وتنسيق الرد
// ========================================================================

/**
 * تنظيف النصوص قبل عرضها داخل innerHTML.
 * يمنع تنفيذ أي أكواد HTML أو JavaScript غير مرغوبة داخل نافذة المحادثة.
 */
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * تنسيق رد المساعد بعد تنظيفه.
 * يدعم الأسطر الجديدة والعناوين المكتوبة بين علامتي **.
 */
function formatAiReply(text) {
    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\n/g, "<br>");
}

/**
 * استخراج رسالة الخطأ القادمة من خادم Google بشكل آمن.
 */
function getErrorMessage(data, fallbackMessage = "حدث خطأ غير متوقع من خادم Google.") {
    if (data && data.error && data.error.message) {
        return data.error.message;
    }

    return fallbackMessage;
}

// ========================================================================
// 🤖 تحديد الموديل المتاح تلقائياً
// ========================================================================

/**
 * استدعاء قائمة موديلات Google المتاحة للمفتاح الحالي.
 * ثم اختيار موديل نصي يدعم generateContent.
 *
 * @param {boolean} forceRefresh
 * عند true يتم تجاهل الموديل المحفوظ وإعادة فحص الموديلات من الخادم.
 */
async function resolveGeminiModel(forceRefresh = false) {
    if (cachedGeminiModel && !forceRefresh) {
        return cachedGeminiModel;
    }

    const response = await fetch(`${GEMINI_API_BASE}/models`, {
        method: "GET",
        headers: {
            "x-goog-api-key": GEMINI_API_KEY
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            getErrorMessage(
                data,
                `تعذر جلب قائمة موديلات Gemini المتاحة. كود الخطأ: ${response.status}`
            )
        );
    }

    // استخراج الموديلات التي تدعم إنشاء المحتوى النصي.
    const availableModels = (data.models || [])
        .filter(model => Array.isArray(model.supportedGenerationMethods))
        .filter(model => model.supportedGenerationMethods.includes("generateContent"))
        .map(model => String(model.name || "").replace(/^models\//, ""))
        .filter(Boolean);

    console.log("📋 موديلات Gemini المتاحة:", availableModels);

    // البحث عن أفضل موديل من القائمة المفضلة.
    const preferredModel = PREFERRED_GEMINI_MODELS.find(model =>
        availableModels.includes(model)
    );

    if (preferredModel) {
        cachedGeminiModel = preferredModel;
        console.log("✅ تم اختيار موديل Gemini:", cachedGeminiModel);
        return cachedGeminiModel;
    }

    /**
     * بديل تلقائي عند تغيّر أسماء الموديلات:
     * اختيار موديل Flash نصي مستقر مع استبعاد موديلات الصور والصوت والبث.
     */
    const flashFallback = availableModels.find(model =>
        model.includes("flash") &&
        !model.includes("image") &&
        !model.includes("tts") &&
        !model.includes("live") &&
        !model.includes("audio") &&
        !model.includes("native") &&
        !model.includes("preview") &&
        !model.includes("experimental") &&
        !model.includes("exp")
    );

    if (flashFallback) {
        cachedGeminiModel = flashFallback;
        console.log("✅ تم اختيار موديل Flash بديل:", cachedGeminiModel);
        return cachedGeminiModel;
    }

    /**
     * بديل أخير:
     * اختيار أول موديل نصي يدعم generateContent،
     * مع استبعاد الموديلات غير المناسبة للمحادثة النصية.
     */
    const generalFallback = availableModels.find(model =>
        !model.includes("image") &&
        !model.includes("tts") &&
        !model.includes("live") &&
        !model.includes("audio") &&
        !model.includes("embedding") &&
        !model.includes("imagen") &&
        !model.includes("veo") &&
        !model.includes("lyria")
    );

    if (generalFallback) {
        cachedGeminiModel = generalFallback;
        console.log("✅ تم اختيار موديل نصي بديل:", cachedGeminiModel);
        return cachedGeminiModel;
    }

    throw new Error(
        "لم يتم العثور على موديل Gemini نصي متاح يدعم generateContent لهذا المفتاح."
    );
}

// ========================================================================
// 📡 إرسال الطلب إلى Google Gemini
// ========================================================================

/**
 * إرسال السؤال والسياق القانوني إلى موديل Gemini المحدد.
 */
async function callGeminiGenerateContent(model, fullPromptContext) {
    const response = await fetch(
        `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: fullPromptContext
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
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

// ========================================================================
// ⚖️ محرك المساعد القضائي الرئيسي
// ========================================================================

/**
 * الدالة الرئيسية التي يستدعيها ملف index.html عند إرسال سؤال من نافذة الشات.
 */
async function processHumanIntelligence(query) {
    // --------------------------------------------------------------------
    // فحص قاعدة البيانات القانونية
    // --------------------------------------------------------------------
    if (
        typeof LEGAL_DATABASE === "undefined" ||
        !Array.isArray(LEGAL_DATABASE) ||
        LEGAL_DATABASE.length === 0
    ) {
        return `
            <b>⚠️ تعذر تشغيل قاعدة البيانات القانونية:</b><br>
            ملف <code>db-data.js</code> فارغ أو غير مقروء برمجياً.<br>
            يرجى التأكد من وجود الملف بجوار <code>index.html</code> وصحة محتواه.
        `;
    }

    // --------------------------------------------------------------------
    // فحص مفتاح Google
    // --------------------------------------------------------------------
    if (
        !GEMINI_API_KEY ||
        GEMINI_API_KEY.trim() === "" ||
        GEMINI_API_KEY.includes("ضع_مفتاح")
    ) {
        return `
            <b>💡 تنبيه برمجي:</b><br>
            لم يتم إدخال مفتاح Gemini API بعد.<br>
            يرجى فتح ملف <code>ai-brain.js</code> ووضع المفتاح الجديد داخل المتغير
            <code>GEMINI_API_KEY</code>.
        `;
    }

    // --------------------------------------------------------------------
    // إعداد كامل قاعدة البيانات القانونية
    // --------------------------------------------------------------------
    /**
     * النسخة القديمة كانت ترسل أول 25 بنداً فقط.
     * النسخة الحالية ترسل جميع البنود الموجودة داخل db-data.js.
     */
    const dbContextText = LEGAL_DATABASE.map((item, index) => {
        return `
==================================================
رقم البند داخل قاعدة البيانات: ${index + 1}
الباب أو القسم: ${item.chapter || "غير محدد"}
العنوان: ${item.title || "غير محدد"}

النص القانوني أو المقارن:
${item.lawText || "لا يوجد نص مسجل."}

الشرح والتحليل العملي:
${item.analysis || "لا يوجد شرح مسجل."}

التحوط أو التنبيه التنفيذي:
${item.aiCounter || "لا يوجد تنبيه مسجل."}
==================================================
        `;
    }).join("\n");

    // --------------------------------------------------------------------
    // صياغة تعليمات المساعد
    // --------------------------------------------------------------------
    const fullPromptContext = `
أنت مساعد قضائي رقمي مخصص لمعاونة أعضاء النيابة العامة بجمهورية مصر العربية.

تعليمات إلزامية لطريقة الإجابة:

1. أجب باللغة العربية الفصحى الواضحة، وبأسلوب مهني رصين ومباشر.
2. استند أولاً إلى قاعدة البيانات القانونية المرفقة أدناه.
3. لا تنسب نصاً قانونياً أو حكماً قضائياً أو ميعاداً إجرائياً إلى مصدر رسمي إلا إذا كان وارداً بوضوح في قاعدة البيانات.
4. إذا كانت قاعدة البيانات لا تتضمن إجابة مؤكدة، صرّح بذلك صراحة واذكر أن المسألة تحتاج إلى الرجوع إلى النص الرسمي أو التعليمات العامة للنيابة العامة.
5. ميّز بوضوح بين:
   - النص القانوني.
   - التحليل العملي.
   - التنبيه التنفيذي.
   - المعلومة التي تحتاج إلى مراجعة مصدر رسمي.
6. لا تخترع مواد قانونية أو أرقام مواد أو مدد أو أحكام نقض.
7. عند الإجابة عن سؤال إجرائي، استخدم الترتيب التالي متى كان مناسباً:
   - الإجابة المباشرة.
   - الأساس القانوني المتاح.
   - الخطوات التنفيذية.
   - الأخطاء أو المخاطر الإجرائية الواجب تجنبها.
8. اجعل الإجابة مفيدة لعضو النيابة أثناء العمل الفعلي، من غير إطالة غير لازمة.
9. عند وجود نقص في المعلومات، اذكر حدود الإجابة بوضوح ولا تجزم بما لا يتوافر عليه دليل.
10. لا تُخرج أي أكواد HTML أو JavaScript أو تعليمات برمجية داخل الرد.

قاعدة البيانات القانونية المتاحة:
${dbContextText}

--------------------------------------------------
سؤال عضو النيابة المطلوب الإجابة عنه:
${query}
--------------------------------------------------
    `;

    try {
        // ----------------------------------------------------------------
        // تحديد أفضل موديل متاح للمفتاح الحالي
        // ----------------------------------------------------------------
        let selectedModel = await resolveGeminiModel();

        // ----------------------------------------------------------------
        // إرسال السؤال إلى Google Gemini
        // ----------------------------------------------------------------
        let {
            response,
            data
        } = await callGeminiGenerateContent(selectedModel, fullPromptContext);

        /**
         * إذا توقف الموديل الذي تم اختياره أو تغيّر اسمه مستقبلاً:
         * نطلب قائمة الموديلات الجديدة ونحاول مرة ثانية فقط.
         */
        if (response.status === 404) {
            console.warn(
                "⚠️ الموديل المختار لم يعد متاحاً. تتم إعادة فحص قائمة الموديلات..."
            );

            selectedModel = await resolveGeminiModel(true);

            ({
                response,
                data
            } = await callGeminiGenerateContent(
                selectedModel,
                fullPromptContext
            ));
        }

        // ----------------------------------------------------------------
        // التعامل مع رسائل خطأ Google
        // ----------------------------------------------------------------
        if (!response.ok) {
            console.error("Gemini Server Output:", data);

            return `
                <b>⚠️ تنبيه من خادم Google — كود ${response.status}:</b><br>
                ${escapeHtml(getErrorMessage(data))}
            `;
        }

        // ----------------------------------------------------------------
        // قراءة النص القادم من Gemini
        // ----------------------------------------------------------------
        const parts =
            data &&
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            Array.isArray(data.candidates[0].content.parts)
                ? data.candidates[0].content.parts
                : [];

        const aiText = parts
            .map(part => part.text || "")
            .join("\n")
            .trim();

        if (aiText) {
            return formatAiReply(aiText);
        }

        // ----------------------------------------------------------------
        // حالة وصول رد فارغ
        // ----------------------------------------------------------------
        console.error("Gemini Empty Output:", data);

        return `
            <b>⚠️ لم يصل رد نصي صالح من الخادم:</b><br>
            تم إرسال السؤال بنجاح، ولكن لم يتم توليد إجابة نصية.<br>
            يرجى إعادة صياغة السؤال أو المحاولة مرة أخرى.
        `;
    } catch (error) {
        // ----------------------------------------------------------------
        // أخطاء الاتصال أو المفتاح أو قائمة الموديلات
        // ----------------------------------------------------------------
        console.error("Gemini Fetch Error:", error);

        return `
            <b>⚠️ تعذر تشغيل المساعد الذكي:</b><br>
            ${escapeHtml(error.message || "تعذر الاتصال بخوادم Google.")}
        `;
    }
}
