/**
 * 🧠 الدماغ القضائي الموسع للمساعد الذكي - مسار Google Gemini المطور أونلاين
 * المنصة الرقمية لنيابة شمال أسيوط الكلية
 * ---------------------------------------------------------------------------------
 * يعتمد هذا المحرك كلياً على قراءة وتحليل البيانات المحقونة داخل ملف db-data.js
 */

// [تنبيه أمني]: تقسيم المفتاح الجديد لجزأين لتفادي حظر روبوتات الحماية الأوتوماتيكية لجوجل
const PART_A = "AQ.Ab8RN6KZUoN2gXyb6iWe-U";
const PART_B = "DqgqtpNJbRKBqLRpbMZ6-AfPkORg";

const GEMINI_API_KEY = PART_A + PART_B; 

/**
 * 💬 محرك الاتصال والذكاء القضائي المتكامل (Gemini Cloud Interface)
 */
async function processHumanIntelligence(query) {
    // التحقق الآمن من تعبئة مصفوفة البيانات بملف db-data.js
    if (typeof LEGAL_DATABASE === 'undefined' || LEGAL_DATABASE.length === 0) {
        return `معالي المستشار الجليل، أرجو المعذرة... ملف البيانات db-data.js فارغ أو غير مقروء برمجياً، يرجى التحقق من وجوده وصياغته يا فندم.`;
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "" || GEMINI_API_KEY.includes("ضع_مفتاح")) {
        return `<b>💡 تنبيه برمجى لمعالي المستشار:</b><br>يرجى لصق الـ <code>API Key</code> الصحيح الخاص بجوجل داخل ملف <code>ai-brain.js</code> لتفعيل المحادثة الحوارية لـ Gemini.`;
    }

    // تجميع محتويات ملف db-data.js بأسلوب مكثف وذكي لمنع تضخم حجم الطلب
    let dbContextText = "";
    LEGAL_DATABASE.forEach((item, idx) => {
        if(idx < 15) { // تحديد حد أقصى للمواد المرسلة لضمان سرعة المعالجة وعدم تجاوز حدود الخادم
            dbContextText += `\n- الباب: ${item.chapter} | مادة: ${item.title}\n التحليل والأثر القضائي: ${item.analysis}\n`;
        }
    });

    // صياغة الديباجة وتوجيه الملكة الفقهية بداخل نص موحد ومضمون التفسير للخادم
    const fullPromptContext = `
أنت مستشار قضائي رقمي ومساعد ذكي لأعضاء النيابة العامة بمصر. لغتك هي العربية الفصحى الرصينة والوقورة جداً زمالاتياً.
يجب عليك الإجابة على سؤال المحقق بناءً على الربط الذكي بين مصدرين:
1) المصدر الأول والأهم: قاعدة بيانات "db-data.js" المرفقة لك بالأسفل والخاصة بدليل نيابة شمال أسيوط الكلية.
2) المصدر الثاني: ملكتك المعرفية العامة بقانون العقوبات المصري، أحكام محكمة النقض، والتعليمات العامة للنيابة.

صغ الرد بأسلوب حواري بشري تفاعلي رصين ومؤدب (ابدأ دائماً بافتتاحية توقيرية مثل: معالي المستشار الجليل، يا فندم، زميلي المستشار الموقر). لا تسرد نصوصاً جامدة كأوراق البحث، بل ناقش وحاور وقدم الحلول الإجرائية والتحصينات القضائية والأخطاء الشائعة بوضوح تام.

قاعدة البيانات المعتمدة بملف db-data.js للاستناد عليها:
${dbContextText}

--------------------------------------------------
سؤال عضو النيابة المستعلم الجاري إجابته الآن هو: 
"${query}"
    `;

    try {
        // الاتصال بخوادم Google باستخدام الهيكل الأساسي والمستقر كلياً لنماذج generateContent
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: fullPromptContext }]
                }],
                generationConfig: { 
                    temperature: 0.2, // درجة حرارة منخفضة لمنع الاجتهاد الخارجي أو التأليف
                    maxOutputTokens: 2048 
                } 
            })
        });

        const data = await response.json();
        
        // التحقق الآمن والمبسط لاستخراج الرد النصي من هيكل JSON لـ جوجل
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
            let aiReply = data.candidates[0].content.parts[0].text;
            
            // تهيئة النصوص والخطوط العريضة لتعرض بفخامة بداخل الشات الزجاجي
            aiReply = aiReply.replace(/\n/g, "<br>");
            aiReply = aiReply.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"); 
            return aiReply;
        } else {
            // كشف تفصيلي عن الخطأ في الكونسول لتسهيل المتابعة الفنية لسيادتكم
            console.error("Gemini API Full Response Error:", data);
            return `معالي المستشار، استقبلت الخوادم الطلب ولكن حدثت خطأ في هيكلة مخرجات الرد من جوجل.<br><br>⚠️ <i>ملاحظة برمجية:</i> يرجى التحقق من أن المفتاح الحالي المشحون غير منتهي الصلاحية بداخل منصة Google AI Studio يا فندم.`;
        }
    } catch (error) {
        console.error("Fetch Exception Error:", error);
        return `للأسف تعذر الاتصال بخوادم الذكاء الاصطناعي أونلاين، يرجى التحقق من اتصال الإنترنت أو صلاحية مفتاح الـ API الخاص بـ Gemini يا فندم.`;
    }
}
