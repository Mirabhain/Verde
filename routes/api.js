import express from "express";
import { chat } from "../controllers/chatController.js";
import { weather, soil, waterTrend, terrain, vegetation, forecast, daily, climate, snapshot } from "../controllers/nasaController.js";
import { rateLimit } from "../lib/rateLimit.js";

const router = express.Router();

const nasaLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
router.use(["/weather", "/soil", "/water-trend", "/terrain", "/vegetation", "/forecast", "/nasa", "/public"], nasaLimiter);

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

router.get("/forecast", forecast);

// Dashboard, rotation, calendar, chat and landing page (shape defined in services/nasaPower.js)
router.get("/nasa/daily", daily);
router.get("/nasa/climate", climate);
router.get("/public/nasa-snapshot", snapshot);

export default router;
