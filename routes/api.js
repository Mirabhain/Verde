import express from "express";
import { chat } from "../controllers/chatController.js";

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

export default router;
