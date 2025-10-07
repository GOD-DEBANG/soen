import { GoogleGenerativeAI } from "@google/generative-ai"


let model = null;
function getModel() {
    const key = process.env.GOOGLE_AI_KEY;
    if (!key) {
        throw new Error("GOOGLE_AI_KEY is not set in environment");
    }
    if (!model) {
        const genAI = new GoogleGenerativeAI(key);
        model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.4,
            },
            systemInstruction: `You are an expert AI assistant for developers, coders, and programmers. Always reply in strict JSON matching {"text": string, "fileTree"?: object}. Keep answers concise but accurate.`,
        });
    }
    return model;
}

export const generateResult = async (prompt) => {
    try {
        const mdl = getModel();
        const result = await mdl.generateContent(prompt);
        let text = result?.response?.text?.() ?? "";

        // Ensure valid JSON for the client
        try {
            JSON.parse(text);
        } catch {
            text = JSON.stringify({ text });
        }
        return text;
    } catch (err) {
        const safe = JSON.stringify({ text: `AI Error: ${err.message}` });
        return safe;
    }
}