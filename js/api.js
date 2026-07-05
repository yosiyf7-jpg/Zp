// ==========================================
// Lumi AI - Groq API
// ==========================================

const API_KEY = "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";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ✨ موديل النصوص (الأساسي)
const TEXT_MODEL = "llama-3.3-70b-versatile";

// ✨ موديل تحليل الصور (Vision)
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// ==========================================

const SYSTEM_PROMPT = `
أنت Lumi AI.
تجيب دائماً بالعربية إذا كانت رسالة المستخدم بالعربية.
استخدم Markdown عند الحاجة.
عند كتابة كود ضعه داخل code block.
`;

// ==========================================
// ✨ فحص إذا كانت الرسائل تحتوي على صور
// ==========================================

function hasImages(history){

    return history.some(msg => {

        // لو المحتوى Array فهو يحتوي على صور
        return Array.isArray(msg.content)
            && msg.content.some(item => item.type === "image_url");

    });

}

// ==========================================
// ✨ تحضير الرسائل للإرسال
// ==========================================

function prepareMessages(history, useVision){

    // لو موديل Vision، مبنبعتش system prompt (بعض موديلات vision مش بتدعمه كويس)
    // ونحضر الرسائل بالشكل الصح
    const messages = [];

    if(!useVision){

        messages.push({
            role: "system",
            content: SYSTEM_PROMPT
        });

    }

    // نسخة نظيفة من التاريخ (بدون بيانات إضافية)
    history.forEach(msg => {

        messages.push({
            role: msg.role,
            content: msg.content
        });

    });

    return messages;

}

// ==========================================
// Main API Call
// ==========================================

export async function fetchBotResponse(history){

    // ✨ اختيار الموديل تلقائياً
    const useVision = hasImages(history);

    const model = useVision ? VISION_MODEL : TEXT_MODEL;

    const messages = prepareMessages(history, useVision);

    const response = await fetch(API_URL,{

        method:"POST",

        headers:{

            "Content-Type":"application/json",

            "Authorization":"Bearer " + API_KEY

        },

        body:JSON.stringify({

            model: model,

            messages,

            temperature:0.7,

            max_tokens:2048,

            stream:false

        })

    });

    if(!response.ok){

        let message="حدث خطأ.";

        try{

            const error=await response.json();

            message=

                error.error?.message ||

                JSON.stringify(error);

        }

        catch{

            message=await response.text();

        }

        throw new Error(message);

    }

    const data=await response.json();

    return data.choices[0].message.content;

}