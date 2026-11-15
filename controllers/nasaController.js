import { getDaily, getClimate } from "../services/nasaServices.js";

function coords(req) {
    return [Number(req.query.lat), Number(req.query.lon)];
}
const fail = (res, e) =>
    res.status(e.status && e.status >= 400 && e.status < 600 ? (e.status === 422 ? 502 : e.status) : 502).json({ error: e.message });

export async function daily(req, res) {
    try { const [lat, lon] = coords(req); res.json(await getDaily(lat, lon)); }
    catch (e) { fail(res, e); }
}

export async function climate(req, res) {
    try { const [lat, lon] = coords(req); res.json(await getClimate(lat, lon)); }
    catch (e) { fail(res, e); }
}

// Landing-page preview: fixed location (Kuantan, Pahang), real NASA data, no login needed.
export async function snapshot(req, res) {
    try { res.json(await getDaily(3.8077, 103.326, 45)); }
    catch (e) { fail(res, e); }
}
