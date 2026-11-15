// Tiny JSON-file database (users + their farm profile + tasks).
// Good for a prototype / single server. Swap for SQLite/Postgres for production.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data_store");
const FILE = path.join(DIR, "db.json");

let cache = null;
let queue = Promise.resolve();

async function load() {
    if (cache) return cache;
    try {
        cache = JSON.parse(await fs.readFile(FILE, "utf8"));
    } catch (e) {
        if (e.code !== "ENOENT") throw e;
        cache = { users: [] };
    }
    return cache;
}

async function persist() {
    await fs.mkdir(DIR, { recursive: true });
    const tmp = FILE + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(cache, null, 2));
    await fs.rename(tmp, FILE);
}

// Serialise every read-modify-write so concurrent requests cannot clobber each other.
export function withDb(fn) {
    const run = queue.then(async () => {
        const db = await load();
        const result = await fn(db);
        await persist();
        return result;
    });
    queue = run.catch(() => {});
    return run;
}

export async function readDb(fn) {
    await queue;
    return fn(await load());
}

export { DIR as DATA_DIR };
