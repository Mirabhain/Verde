// Signed, HttpOnly cookie sessions (no external dependency).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./db.js";

const COOKIE = "verde_sid";
const MAX_AGE_S = 60 * 60 * 24 * 7;

function secret() {
    if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
    const file = path.join(DATA_DIR, ".session_secret");
    try {
        return fs.readFileSync(file, "utf8");
    } catch {
        const s = crypto.randomBytes(32).toString("hex");
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(file, s, { mode: 0o600 });
        return s;
    }
}
const SECRET = secret();

const sign = (payload) =>
    crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");

export function createToken(uid) {
    const payload = Buffer.from(
        JSON.stringify({ uid, exp: Date.now() + MAX_AGE_S * 1000 })
    ).toString("base64url");
    return `${payload}.${sign(payload)}`;
}

export function readToken(token) {
    if (typeof token !== "string") return null;
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const data = JSON.parse(Buffer.from(payload, "base64url").toString());
        return data.exp > Date.now() ? data.uid : null;
    } catch {
        return null;
    }
}

export function parseCookies(header = "") {
    return Object.fromEntries(
        header
            .split(";")
            .map((p) => p.trim().split("="))
            .filter(([k]) => k)
            .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
    );
}

export function setSessionCookie(req, res, uid) {
    const secure = req.secure || process.env.NODE_ENV === "production";
    res.setHeader(
        "Set-Cookie",
        `${COOKIE}=${createToken(uid)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_S}${secure ? "; Secure" : ""}`
    );
}

export function clearSessionCookie(res) {
    res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

export function sessionUserId(req) {
    return readToken(parseCookies(req.headers.cookie)[COOKIE]);
}
