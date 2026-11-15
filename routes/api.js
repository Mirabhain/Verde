import express from "express";
import { chat } from "../controllers/chatController.js";
import { weather, soil, waterTrend, terrain, vegetation } from "../controllers/nasaController.js";

const router = express.Router();

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

export default router;
