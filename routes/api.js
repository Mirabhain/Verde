import express from "express";
import { chat } from "../controllers/chatController.js";
import { register, login, logout, me, requireAuth } from "../controllers/authController.js";
import { getProfile, putProfile } from "../controllers/farmController.js";
import { daily, climate, snapshot } from "../controllers/nasaController.js";
import { rateLimit } from "../lib/rateLimit.js";

const router = express.Router();

// Only accept JSON for state-changing requests (also blocks simple cross-site form posts).
router.use((req, res, next) => {
    if (["POST", "PUT", "PATCH"].includes(req.method) && !req.is("application/json"))
        return res.status(415).json({ error: "Send JSON." });
    next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: "Too many attempts. Try again in a few minutes." });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 12, message: "You are asking too fast. Wait a minute and try again." });
const nasaLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post("/auth/register", authLimiter, wrap(register));
router.post("/auth/login", authLimiter, wrap(login));
router.post("/auth/logout", logout);
router.get("/auth/me", wrap(me));

router.get("/profile", wrap(requireAuth), wrap(getProfile));
router.put("/profile", wrap(requireAuth), wrap(putProfile));

router.get("/nasa/daily", nasaLimiter, wrap(requireAuth), daily);
router.get("/nasa/climate", nasaLimiter, wrap(requireAuth), climate);
router.get("/public/nasa-snapshot", nasaLimiter, snapshot); // landing page live preview (fixed location)

router.post("/chat", chatLimiter, wrap(requireAuth), wrap(chat));

router.use((req, res) => res.status(404).json({ error: "Not found." }));

export default router;
