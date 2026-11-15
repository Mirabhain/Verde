
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// VerdeAI system instructions
const SYSTEM_INSTRUCTIONS = `
You are VerdeAI, an agricultural assistant specialising
in Malaysian crop cultivation and crop rotation.

Your responsibilities:
- Explain crop rotation concepts.
- Help farmers understand soil and environmental conditions.
- Explain crop nutrient requirements.
- Discuss common crop pests and diseases.
- Explain crop rotation recommendations provided by the system.
- Consider the farmer's location, soil conditions and crop history.

Guidelines:
- Prioritise reliable Malaysian agricultural sources such as DOA and MARDI.
- Do not invent agricultural statistics or scientific facts.
- Clearly state when information is uncertain or insufficient.
- Distinguish satellite-based estimates from actual soil measurements.
- Do not claim NASA data can determine actual soil NPK levels.
- Explain recommendations in simple language.
- Encourage farmers to consult agricultural officers when necessary.
`;

export async function chat(req, res) {
    try {
        const { message, farmContext, history = [] } = req.body || {};

        // Validate user message
        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Please provide a valid message."
            });
        }

        // Check API key
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({
                error: "Groq API key is missing. Check your .env file."
            });
        }

        // Keep only valid conversation messages
        const recentHistory = Array.isArray(history)
            ? history
                .filter(item =>
                    ["user", "assistant"].includes(item.role) &&
                    typeof item.content === "string"
                )
                .slice(-10)
            : [];

        // Include current farm information
        const systemMessage = `
${SYSTEM_INSTRUCTIONS}

Current farm information:
${JSON.stringify(farmContext || {}, null, 2)}
`;

        // Construct Groq conversation
        const messages = [
            {
                role: "system",
                content: systemMessage
            },
            ...recentHistory,
            {
                role: "user",
                content: message
            }
        ];

        // Request Groq response
        const completion = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
            messages
        });

        const reply = completion.choices?.[0]?.message?.content;

        if (!reply) {
            throw new Error("Groq returned an empty response.");
        }

        return res.json({
            reply
        });

    } catch (error) {
        console.error("Groq API error:", {
            message: error.message,
            status: error.status,
            code: error.code,
            type: error.type
        });

        return res.status(error.status || 500).json({
            error: process.env.NODE_ENV === "development"
                ? error.message
                : "Unable to generate a response. Please try again."
        });
    }
}
