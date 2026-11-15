import { getWeather, getSoil, getWaterTrend, getTerrain, getVegetation } from "../services/nasaServices.js";

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
