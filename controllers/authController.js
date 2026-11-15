import crypto from "node:crypto";
import { promisify } from "node:util";
import { withDb, readDb } from "../lib/db.js";
import { setSessionCookie, clearSessionCookie, sessionUserId } from "../lib/session.js";

const scrypt = promisify(crypto.scrypt);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

async function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const key = await scrypt(password, salt, 64);
    return { salt, hash: key.toString("hex") };
}

export async function register(req, res) {
    const { name = "", email = "", password = "" } = req.body || {};
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim().slice(0, 80) || cleanEmail.split("@")[0];

    if (!EMAIL_RE.test(cleanEmail)) return res.status(400).json({ error: "Enter a valid email address." });
    if (typeof password !== "string" || password.length < 8 || password.length > 200)
        return res.status(400).json({ error: "Password must be at least 8 characters." });

    const { salt, hash } = await hashPassword(password);
    const result = await withDb((db) => {
        if (db.users.some((u) => u.email === cleanEmail)) return null;
        const user = {
            id: crypto.randomUUID(), name: cleanName, email: cleanEmail,
            salt, hash, createdAt: new Date().toISOString(), farm: null, tasks: []
        };
        db.users.push(user);
        return user;
    });
    if (!result) return res.status(409).json({ error: "An account with this email already exists. Log in instead." });

    setSessionCookie(req, res, result.id);
    res.status(201).json({ user: publicUser(result) });
}

export async function login(req, res) {
    const { email = "", password = "" } = req.body || {};
    const cleanEmail = String(email).trim().toLowerCase();
    const user = await readDb((db) => db.users.find((u) => u.email === cleanEmail));
    // Same message and similar work for unknown email / wrong password.
    const { hash } = await hashPassword(String(password), user?.salt);
    const ok = user && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.hash));
    if (!ok) return res.status(401).json({ error: "Email or password is incorrect." });
    setSessionCookie(req, res, user.id);
    res.json({ user: publicUser(user) });
}

export function logout(req, res) {
    clearSessionCookie(res);
    res.json({ ok: true });
}

export async function me(req, res) {
    const uid = sessionUserId(req);
    const user = uid && (await readDb((db) => db.users.find((u) => u.id === uid)));
    if (!user) return res.status(401).json({ error: "Not logged in." });
    res.json({ user: publicUser(user) });
}

// Middleware: attaches req.userId or rejects.
export async function requireAuth(req, res, next) {
    const uid = sessionUserId(req);
    const exists = uid && (await readDb((db) => db.users.some((u) => u.id === uid)));
    if (!exists) return res.status(401).json({ error: "Please log in first." });
    req.userId = uid;
    next();
}
