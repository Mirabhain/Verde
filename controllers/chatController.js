import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = (process.env.OPENAI_API_KEY || "").trim();

const openai = new OpenAI({
    apiKey: apiKey
});

// VerdeAI AI instructions
const SYSTEM_INSTRUCTIONS = `
You are VerdeAI AI, an agricultural assistant specialising
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
        const { message, farmContext, history = [] } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Please provide a valid message."
            });
        }

        // Keep the conversation history manageable
        const recentHistory = Array.isArray(history)
            ? history.slice(-10)
            : [];

        // Construct the conversation
        const conversation = [
            {
                role: "user",
                content: `Farm information:
                ${JSON.stringify(farmContext || {})}`
            },
            ...recentHistory,
            {
                role: "user",
                content: message
            }
        ];

        const response = await openai.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-5.5",
            instructions: SYSTEM_INSTRUCTIONS,
            input: conversation
        });

        res.json({
            reply: response.output_text
        });

    } catch (error) {
        console.error("OpenAI API error:", error);

        res.status(500).json({
            error: "Unable to generate a response. Please try again."
        });
    }
}
