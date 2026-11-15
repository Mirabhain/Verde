import Groq from "groq-sdk";
import { readDb } from "../lib/db.js";
import { getDaily } from "../services/nasaPower.js";

let client;
function groq() {
    client ??= new Groq({
        apiKey: process.env.GROQ_API_KEY,
        ...(process.env.GROQ_BASE_URL ? { baseURL: process.env.GROQ_BASE_URL } : {})
    });
    return client;
}

const SYSTEM_INSTRUCTIONS = `
You are VerdeAI, an agricultural assistant for Malaysian smallholder farmers, specialising in
crop rotation, soil and weather interpretation, nutrient needs and pest/disease management.

Rules:
- Reply in the language the farmer writes in (Bahasa Malaysia or English). Keep answers short, practical and in simple words.
- Use the "Farm profile" and "NASA POWER observations" below when they are provided. Quote the real numbers; never invent numbers.
- NASA POWER values are gridded satellite/model estimates for the area. They are NOT soil NPK measurements and NOT readings from the farm. Say so when it matters.
- If information is missing, say what is missing and what the farmer can do (for example a soil test through DOA/MARDI).
- Do not invent statistics, yields, prices, pesticide brands or doses. For pesticides, recommend integrated pest management and checking the label and Jabatan Pertanian Malaysia (DOA) advice.
- Encourage consulting an agricultural extension officer for important decisions.
`;

const clip = (v, n) => String(v ?? "").slice(0, n);

async function buildContext(userId, clientFarm) {
    // Prefer the farm saved on the server; fall back to what the page sent.
    const saved = userId ? await readDb((db) => db.users.find((u) => u.id === userId)?.farm) : null;
    const f = saved || clientFarm || null;
    if (!f) return { farm: null, nasa: null };
    const farm = {
        name: clip(f.name, 80), state: clip(f.state, 40), lat: Number(f.lat), lon: Number(f.lon),
        sizeHectares: Number(f.size), currentCrop: clip(f.crop, 30), previousCrop: clip(f.previous, 30),
        soilType: clip(f.soil, 30), soilPh: f.ph === "" ? "not provided" : Number(f.ph),
        irrigation: clip(f.irrigation, 30), fertiliser: clip(f.fertilizer, 40),
        farmerPriority: clip(f.goal, 30), cropCare: clip(f.care, 40)
    };
    let nasa = null;
    if (Number.isFinite(farm.lat) && Number.isFinite(farm.lon)) {
        try {
            const d = await getDaily(farm.lat, farm.lon);
            nasa = { source: d.source, elevationM: d.elevationM, fetchedAt: d.fetchedAt, ...d.summary };
        } catch { nasa = null; }
    }
    return { farm, nasa };
}

export async function chat(req, res) {
    try {
        const { message, history = [], farm: clientFarm } = req.body || {};
        if (!message || typeof message !== "string" || !message.trim())
            return res.status(400).json({ error: "Type a question first." });
        if (message.length > 1500)
            return res.status(400).json({ error: "Please keep your question under 1500 characters." });
        if (!process.env.GROQ_API_KEY)
            return res.status(503).json({ error: "The AI assistant is not configured. Add GROQ_API_KEY to the .env file and restart the server." });

        const recent = (Array.isArray(history) ? history : [])
            .filter((m) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 3000) }));

        const { farm, nasa } = await buildContext(req.userId, clientFarm);
        const system = `${SYSTEM_INSTRUCTIONS}
Farm profile: ${farm ? JSON.stringify(farm) : "The farmer has not saved a farm profile yet."}
NASA POWER observations (area estimates): ${nasa ? JSON.stringify(nasa) : "Not available right now."}`;

        const completion = await groq().chat.completions.create({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
            messages: [{ role: "system", content: system }, ...recent, { role: "user", content: message.trim() }],
            temperature: 0.4,
            max_tokens: 900
        });
        const reply = completion.choices?.[0]?.message?.content?.trim();
        if (!reply) throw new Error("Groq returned an empty response.");
        res.json({ reply, usedNasa: Boolean(nasa), usedFarm: Boolean(farm) });
    } catch (error) {
        console.error("Groq API error:", { message: error.message, status: error.status, code: error.code });
        const status = error.status === 401 ? 503 : error.status === 429 ? 429 : 502;
        const msg =
            error.status === 401 ? "The AI key was rejected. Check GROQ_API_KEY in the .env file."
            : error.status === 429 ? "The AI service is busy. Wait a moment and ask again."
            : "The AI assistant could not answer right now. Try again in a moment.";
        res.status(status).json({ error: msg });
    }
}
