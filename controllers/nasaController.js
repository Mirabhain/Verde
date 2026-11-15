import { getWeather, getSoil, getWaterTrend, getTerrain, getVegetation, getForecast } from "../services/nasaServices.js";
import { getDaily, getClimate } from "../services/nasaPower.js";

function parse(req, res, maxDays = 365) {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const days = Math.min(Math.max(parseInt(req.query.days) || 14, 1), maxDays);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
        res.status(400).json({ error: "lat and lon are required" });
        return null;
    }
    return { lat, lon, days };
}

const handler = (fn, defaultDays = 14, maxDays = 365) => async (req, res) => {
    const q = parse(req, res, maxDays);
    if (!q) return;
    try {
        res.json(await fn(q.lat, q.lon, q.days || defaultDays));
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
};

export const weather = handler(getWeather, 14, 90);
export const soil = handler(getSoil, 14, 90);
export const waterTrend = handler(getWaterTrend, 90, 365);
export const terrain = handler(getTerrain);
export const vegetation = handler(getVegetation);
export const forecast = handler((lat, lon) => getForecast(lat, lon, 7));

// ---- Routes used by dashboard, rotation, calendar, chat and the landing page ----
const coords = (req) => [Number(req.query.lat), Number(req.query.lon)];
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
  try {
    const [lat, lon] = coords(req);

    const data = await getDaily(lat, lon, 45);

    res.json(data);
  } catch (e) {
    fail(res, e);
  }
}
