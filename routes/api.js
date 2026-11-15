import express from "express";
import { chat } from "../controllers/chatController.js";
import { weather, soil, waterTrend, terrain, vegetation } from "../controllers/nasaController.js";

const router = express.Router();

// Auth (paths match what layout.js calls)
//router.post("/auth/register", register);
//router.post("/auth/login", login);
//router.post("/auth/logout", logout);
//router.get("/auth/me", me);

// AI chatbot
router.post("/chat", chat);

// Farm information (future extension)
router.get("/farms", async (req, res) => {
    res.json({ message: "Farm retrieval endpoint placeholder." });
});

router.post("/farms", async (req, res) => {
    res.json({ message: "Farm save endpoint placeholder." });
});

// Crop rotation (future extension)
router.post("/rotation/recommend", async (req, res) => {
    res.json({ message: "Rotation recommendation endpoint placeholder." });
});

// NASA Integration endpoints
router.get("/weather", weather);
router.get("/soil", soil);
router.get("/water-trend", waterTrend);
router.get("/terrain", terrain);
router.get("/vegetation", vegetation);

router.get('/nasa/daily', async (req, res) => {
    try {
        const { lat, lon } = req.query;

        const latitude = Number(lat);
        const longitude = Number(lon);

        if (
            !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
            !Number.isFinite(longitude) || longitude < -180 || longitude > 180
        ) {
            return res.status(400).json({ error: 'Invalid coordinates.' });
        }

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);

        const formatDate = (date) =>
            date.toISOString().slice(0, 10).replaceAll('-', '');

        const params = new URLSearchParams({
            parameters: 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M',
            community: 'AG',
            longitude: String(longitude),
            latitude: String(latitude),
            start: formatDate(start),
            end: formatDate(end),
            format: 'JSON'
        });

        const response = await fetch(
            `https://power.larc.nasa.gov/api/temporal/daily/point?${params}`
        );

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'NASA API request failed.'
            });
        }

        res.json(await response.json());

    } catch (error) {
        console.error('NASA API error:', error);
        res.status(500).json({ error: 'Unable to fetch NASA data.' });
    }
});

export default router;
