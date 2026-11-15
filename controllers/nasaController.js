import { getWeather, getSoil } from "../services/nasaServices.js";

function parse(req, res) {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const days = Math.min(parseInt(req.query.days) || 14, 60);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
        res.status(400).json({ error: "lat and lon are required" });
        return null;
    }
    return { lat, lon, days };
}

const handler = (fn) => async (req, res) => {
    const q = parse(req, res);
    if (!q) return;
    try {
        res.json(await fn(q.lat, q.lon, q.days));
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
};

export const weather = handler(getWeather);
export const soil = handler(getSoil);