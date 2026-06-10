/**
 * 🧠 الدماغ القضائي الموسع للمساعد الذكي - مسار Google Gemini المطور أونلاين
 * المنصة الرقمية لنيابة شمال أسيوط الكلية
 * ---------------------------------------------------------------------------------
 * يقوم هذا المحرك بدمج ملف الدليل الخاص بسيادتكم مع الموسوعة القانونية العامة لـ Gemini
 * لتقديم إجابات حوارية فقهية وبشرية على أعلى مستوى من الدقة والوقار القضائي.
 */

// استبدل هذا المتغير بمفتاح الربط الخاص بك من Google AI Studio مستقبلاً
const GEMINI_API_KEY = "ضع_مفتاح_الـ_API_الخاص_بك_هنا"; 

let COMPACT_GUIDE_TEXT = "";

// 1. سحب محتوى الدليل الـ 102 صفحة فوراً أونلاين عند فتح الموقع
async function hydrateGuideContext() {
    try {
        const response = await fetch('legal_guide_unified_cairo_readable_compact.html');
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // تحويل الدليل بالكامل إلى نص مكثف جاهز لإرساله لعقل الجيل الرابع من جيرمني
        COMPACT_GUIDE_TEXT = doc.body.innerText.substring(0, 150000); // سحب أول 150 ألف حرف لضمان السرعة والشمولية
        console.log("⚙️ محرك Gemini: تم تحميل وحقن سياق الدليل الشامل بنجاح.");
    } catch (error) {
        console.error("خطأ في سحب ملف الدليل أونلاين:", error);
    }
}

/**
 * 💬 محرك الاتصال والذكاء القضائي المتكامل (Gemini Cloud Interface)
 */
async function processHumanIntelligence(query) {
    if (!COMPACT_GUIDE_TEXT) {
        return `معالي المستشار الجليل، أرجو المعذرة... جاري استدعاء الذاكرة الرقمية للدليل في الخلفية أونلاين، تفضل بإعادة إرسال سؤالكم خلال لحظات يا فندم.`;
    }

    // إذا لم يقم المستشار بوضع مفتاح الـ API بعد، يعمل المحرك الذكي محلياً كـ Fallback لحين التفعيل
    if (GEMINI_API_KEY === "AQ.Ab8RN6KZUoN2gXyb6iWe-UDqgqtpNJbRKBqLRpbMZ6-AfPkORg") {
        return `<b>💡 تنبيه برمجى لمعالي المستشار:</b><br>الموقع مرفوع أونلاين بنجاح وجاهز للربط الفوري! يرجى لصق الـ <code>API Key</code> الخاص بجوجل داخل ملف <code>ai-brain.js</code> لتفعيل العقل المفكر لـ Gemini.<br><br><u>محتوى سؤالك القضائي:</u> "${query}"`;
    }

    // هندسة الأوامر القضائية (System Prompt Engineering) لتوجيه الذكاء الاصطناعي لكيفية الدمج
    const systemInstruction = `
        أنت مستشار قضائي رقمي ومساعد ذكي لأعضاء النيابة العامة بمصر. لغتك هي العربية الفصحى الرصينة والوقورة جداً زمالاتياً.
        عند الإجابة على سؤال المحقق، يجب عليك الدمج والربط الذكي بين مصدرين:
        1) المصدر الأول والأهم (الملف الخاص المرفق لك): وهو "الدليل الإجرائي لنيابة شمال أسيوط الكلية" ورصد الاختلافات بين قانون الإجراءات القديم والجديد.
        2) المصدر الثاني (موسوعتك القانونية العامة): قانون العقوبات المصري، أحكام محكمة النقض، والتعليمات العامة للنيابة.
        
        صغ الرد بأسلوب حواري بشري تفاعلي رصين ومؤدب (استخدم ألفاظ مثل: معالي المستشار الجليل، يا فندم، زميلي المستشار الموقر). لا تسرد نصوصاً جامدة كأوراق البحث، بل ناقش وحاور وقدم الحلول الإجرائية والتحصينات القضائية بوضوح.
        
        إليك سياق الدليل الخاص المعتمد بنسبة 100%:
        ${COMPACT_GUIDE_TEXT}
    `;

    try {
        // الاتصال المباشر بخوادم Google Gemini (نموذج Gemini 1.5 Flash السريع والاقتصادي)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: systemInstruction },
                        { text: `سؤال عضو النيابة المستعلم هو: ${query}` }
                    ]
                }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 2048 } // درجة حرارة منخفضة لضمان الالتزام الصارم بالقانون دون تأليف
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            let aiReply = data.candidates[0].content.parts[0].text;
            // تحويل السطور الجديدة إلى وسم HTML لضمان التنسيق داخل فقرة المحادثة
            return aiReply.replace(/\n/g, "<br>");
        } else {
            return "معالي المستشار، استقبلت الخوادم الطلب ولكن حدثت خطأ في معالجة صياغة الرد، يرجى المحاولة مرة أخرى.";
        }
    } catch (error) {
        return `للأسف تعذر الاتصال بخوادم الذكاء الاصطناعي أونلاين، يرجى التحقق من اتصال الإنترنت أو صلاحية مفتاح الـ API الخاص بـ Gemini يا فندم.`;
    }
}

// تشغيل محرك السحب التلقائي فور تشغيل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    hydrateGuideContext();
});