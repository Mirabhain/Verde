/*
import { withDb, readDb } from "../lib/db.js";

const num = (v, min, max) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const str = (v, max = 80) => String(v ?? "").slice(0, max);

function cleanFarm(f = {}) {
    const lat = num(f.lat, -90, 90), lon = num(f.lon, -180, 180), size = num(f.size, 0.01, 100000);
    if (lat === null || lon === null || size === null) return null;
    const ph = f.ph === "" || f.ph == null ? "" : num(f.ph, 0, 14);
    if (ph === null) return null;
    return {
        name: str(f.name) || "My farm", state: str(f.state), lat, lon, size, ph,
        crop: str(f.crop, 30), previous: str(f.previous, 30), soil: str(f.soil, 30),
        irrigation: str(f.irrigation, 30), fertilizer: str(f.fertilizer, 40),
        goal: str(f.goal, 30), care: str(f.care, 40)
    };
}

function cleanTasks(tasks) {
    if (!Array.isArray(tasks)) return [];
    return tasks.slice(0, 500).map((t) => ({
        id: str(t.id, 60), date: str(t.date, 10), task: str(t.task, 200)
    })).filter((t) => t.id && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && t.task);
}

export async function getProfile(req, res) {
    const u = await readDb((db) => db.users.find((x) => x.id === req.userId));
    res.json({ farm: u.farm, tasks: u.tasks || [] });
}

export async function putProfile(req, res) {
    const body = req.body || {};
    let farm;
    if ("farm" in body) {
        farm = cleanFarm(body.farm);
        if (!farm) return res.status(400).json({ error: "Check the farm values: latitude, longitude, land size and pH." });
    }
    const tasks = "tasks" in body ? cleanTasks(body.tasks) : undefined;
    const saved = await withDb((db) => {
        const u = db.users.find((x) => x.id === req.userId);
        if (farm) u.farm = farm;
        if (tasks) u.tasks = tasks;
        return { farm: u.farm, tasks: u.tasks };
    });
    res.json(saved);
}

*/
