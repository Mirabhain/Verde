// Minimal in-memory fixed-window rate limiter.
export function rateLimit({ windowMs, max, message }) {
    const hits = new Map();
    setInterval(() => {
        const now = Date.now();
        for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    }, windowMs).unref();
    return (req, res, next) => {
        const key = req.ip || req.socket.remoteAddress || "anon";
        const now = Date.now();
        let h = hits.get(key);
        if (!h || h.reset < now) h = { count: 0, reset: now + windowMs };
        h.count += 1;
        hits.set(key, h);
        if (h.count > max) {
            res.setHeader("Retry-After", Math.ceil((h.reset - now) / 1000));
            return res.status(429).json({ error: message || "Too many requests. Please wait and try again." });
        }
        next();
    };
}
