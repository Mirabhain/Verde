import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map URL paths to HTML files
const pages = {
    "/": "index.html",
    "/index": "index.html",
    "/index.html": "index.html",
    "/login": "login.html",
    "/login.html": "login.html",
    "/dashboard": "dashboard.html",
    "/dashboard.html": "dashboard.html",
    "/farm": "farm.html",
    "/farm.html": "farm.html",
    "/calendar": "calendar.html",
    "/calendar.html": "calendar.html",
    "/rotation": "rotation.html",
    "/rotation.html": "rotation.html",
    "/soil": "soil.html",
    "/soil.html": "soil.html",
    "/weather": "weather.html",
    "/weather.html": "weather.html"
};

// Register page routes
for (const [route, file] of Object.entries(pages)) {
    router.get(route, (req, res) => {
        res.sendFile(
            path.join(__dirname, "../public", file)
        );
    });
}

export default router;
