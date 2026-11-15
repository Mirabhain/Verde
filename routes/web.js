import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pages = ["index", "login", "dashboard", "farm", "rotation", "soil", "weather", "calendar"];
const file = (name) => path.join(__dirname, "../public", `${name}.html`);

router.get(["/", "/index", "/index.html"], (req, res) => res.sendFile(file("index")));
for (const p of pages.slice(1)) router.get([`/${p}`, `/${p}.html`], (req, res) => res.sendFile(file(p)));

export default router;
