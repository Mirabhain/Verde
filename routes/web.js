import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    "/weather.html": "weather.html",
    "/verdeai": "verdeai.html",
    "/verdeai.html": "verdeai.html"
};

for (const [route, file] of Object.entries(pages)) {
    router.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, "../public", file));
    });
}

export default router;
