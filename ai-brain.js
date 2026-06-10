/**
 * 🧠 الدماغ القضائي الموسع للمساعد الذكي - مسار Google Gemini المطور أونلاين
 * المنصة الرقمية لنيابة شمال أسيوط الكلية
 * ---------------------------------------------------------------------------------
 * يعتمد هذا المحرك كلياً على قراءة وتحليل البيانات المحقونة داخل ملف db-data.js
 */

const GEMINI_API_KEY = "AQ.Ab8RN6KZUoN2gXyb6iWe-UDqgqtpNJbRKBqLRpbMZ6-AfPkORg"; 

/**
 * 💬 محرك الاتصال والذكاء القضائي المتكامل (Gemini Cloud Interface)
 */
async function processHumanIntelligence(query) {
    // التحقق الآمن من تعبئة مصفوفة البيانات بملف db-data.js
    if (typeof LEGAL_DATABASE === 'undefined' || LEGAL_DATABASE.length === 0) {
        return `معالي المستشار الجليل، أرجو المعذرة... ملف البيانات db-data.js فارغ أو غير مقروء برمجياً، يرجى التحقق من صياغته يا فندم.`;
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "") {
        return `<b>💡 تنبيه برمجى لمعالي المستشار:</b><br>يرجى لصق الـ <code>API Key</code> الصحيح الخاص بجوجل داخل ملف <code>ai-brain.js</code> لتفعيل المحادثة الحوارية لـ Gemini.`;
    }

    // [تحسين جوهري]: تحويل كامل محتويات ملف db-data.js لنص مدمج لإرساله لسياق جيرمني أونلاين
    let dbContextText = "";
    LEGAL_DATABASE.forEach(item => {
        dbContextText += `\nالباب: ${item.chapter}\nالعنوان: ${item.title}\nالنص: ${item.analysis}\n`;
    });

    const systemPrompt = `
        أنت مستشار قضائي رقمي ومساعد ذكي لأعضاء النيابة العامة بمصر. لغتك هي العربية الفصحى الرصينة والوقورة جداً زمالاتياً.
        عند الإجابة على سؤال المحقق، يجب عليك الدمج والربط الذكي بين مصدرين:
        1) المصدر الأول والأهم (الملف المرفق لك): وهو محتويات قاعدة بيانات "db-data.js" التفصيلية لنيابة شمال أسيوط الكلية.
        2) المصدر الثاني (موسوعتك القانونية العامة): قانون العقوبات المصري، أحكام محكمة النقض، والتعليمات العامة للنيابة.
        
        صغ الرد بأسلوب حواري بشري تفاعلي رصين ومؤدب (استخدم دائماً بافتتاحية توقيرية مثل: معالي المستشار الجليل، يا فندم، زميلي المستشار الموقر). لا تسرد نصوصاً جامدة كأوراق البحث، بل ناقش وحاور وقدم الحلول الإجرائية والتحصينات القضائية والأخطاء الشائعة بوضوح تام.
        
        إليك سياق قاعدة البيانات المعتمد بملف db-data.js لتستند عليه بالكامل:
        ${dbContextText}
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `سؤال عضو النيابة المستعلم هو: ${query}` }]
                }],
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: { 
                    temperature: 0.2, 
                    maxOutputTokens: 2048 
                } 
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            let aiReply = data.candidates[0].content.parts[0].text;
            
            aiReply = aiReply.replace(/\n/g, "<br>");
            aiReply = aiReply.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"); 
            return aiReply;
        } else {
            return "معالي المستشار، استقبلت الخوادم الطلب ولكن حدثت خطأ في معالجة صياغة الرد الفقهي، يرجى إعادة توجيه السؤال مرة أخرى.";
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        return `للأسف تعذر الاتصال بخوادم الذكاء الاصطناعي أونلاين، يرجى التحقق من اتصال الإنترنت أو صلاحية مفتاح الـ API الخاص بـ Gemini يا فندم.`;
    }
}