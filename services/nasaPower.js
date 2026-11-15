// NASA POWER (Prediction Of Worldwide Energy Resources) client.
// Public API, NO API KEY REQUIRED: https://power.larc.nasa.gov/docs/services/api/
// Values are gridded model/satellite estimates for the area (MERRA-2 / CERES / IMERG),
// not readings from sensors on the farm.
const BASE = process.env.NASA_POWER_BASE_URL || "https://power.larc.nasa.gov/api/temporal";
const FILL = -999;

export const DAILY_PARAMS = {
    T2M: "Mean air temperature at 2 m (°C)",
    T2M_MAX: "Maximum air temperature at 2 m (°C)",
    T2M_MIN: "Minimum air temperature at 2 m (°C)",
    PRECTOTCORR: "Corrected precipitation (mm/day)",
    RH2M: "Relative humidity at 2 m (%)",
    GWETROOT: "Root-zone soil wetness (0–1)",
    GWETTOP: "Surface soil wetness (0–1)",
    EVLAND: "Evaporation over land (mm/day)",
    ALLSKY_SFC_SW_DWN: "Solar radiation at surface (kWh/m²/day)"
};
const CORE = ["T2M", "PRECTOTCORR", "RH2M"];
const MONTHLY = ["T2M", "PRECTOTCORR", "RH2M", "GWETROOT"];

const cache = new Map();
const TTL = 6 * 60 * 60 * 1000;

const ymd = (d) => d.toISOString().slice(0, 10).replaceAll("-", "");
const valid = (v) => typeof v === "number" && Number.isFinite(v) && v > FILL + 1;
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const sum = (a) => a.reduce((s, x) => s + x, 0);
const round = (v, d = 2) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);

export function validateCoords(lat, lon) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
        throw Object.assign(new Error("Invalid coordinates."), { status: 400 });
}

async function getJson(url, tries = 3) {
    let lastErr;
    for (let i = 0; i < tries; i++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 30000);
        try {
            const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json", "User-Agent": "VerdeAI/1.0 (crop rotation decision support)" } });
            const text = await r.text();
            let json = null;
            try { json = JSON.parse(text); } catch { /* not json */ }
            if (r.ok && json) return json;
            const detail = json?.messages?.join(" ") || text.slice(0, 160);
            lastErr = Object.assign(new Error(`NASA POWER returned HTTP ${r.status}. ${detail}`.trim()), { status: r.status, client: r.status >= 400 && r.status < 500 && r.status !== 429 });
            if (lastErr.client) throw lastErr;
        } catch (e) {
            if (e.client) throw e;
            lastErr = e.name === "AbortError" ? new Error("NASA POWER did not answer within 30 seconds.") : new Error("Could not reach NASA POWER (power.larc.nasa.gov). Check that the server has internet access.");
        } finally { clearTimeout(timer); }
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
    throw Object.assign(new Error(lastErr?.message || "Could not reach NASA POWER."), { status: 502 });
}

function pointUrl(kind, params, lat, lon, start, end) {
    const u = new URL(`${BASE}/${kind}/point`);
    u.searchParams.set("parameters", params.join(","));
    u.searchParams.set("community", "AG");
    u.searchParams.set("longitude", lon.toFixed(4));
    u.searchParams.set("latitude", lat.toFixed(4));
    u.searchParams.set("start", start);
    u.searchParams.set("end", end);
    u.searchParams.set("format", "JSON");
    return u;
}

/** Parse a POWER daily response into per-day records. Exported for tests. */
export function parseDaily(json) {
    const p = json?.properties?.parameter;
    if (!p || !p.T2M || !p.PRECTOTCORR || !p.RH2M) throw Object.assign(new Error("NASA response is missing temperature, rainfall or humidity."), { status: 502 });
    const dates = Object.keys(p.T2M).sort();
    const g = (k, d) => (valid(p[k]?.[d]) ? p[k][d] : null);
    const records = dates.map((date) => ({
        date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
        temp: g("T2M", date), tmax: g("T2M_MAX", date), tmin: g("T2M_MIN", date),
        rain: g("PRECTOTCORR", date), humidity: g("RH2M", date),
        soilRoot: g("GWETROOT", date), soilTop: g("GWETTOP", date),
        evap: g("EVLAND", date), solar: g("ALLSKY_SFC_SW_DWN", date)
    })).filter((r) => r.temp !== null && r.rain !== null && r.humidity !== null);
    if (!records.length) throw Object.assign(new Error("NASA returned no usable observations for this location and period."), { status: 502 });
    const available = Object.keys(DAILY_PARAMS).filter((k) => dates.some((d) => valid(p[k]?.[d])));
    return { records, available, elevationM: json?.geometry?.coordinates?.[2] ?? null };
}

export function summarise(records) {
    const col = (k) => records.map((r) => r[k]).filter((v) => v !== null);
    const last30 = records.slice(-30);
    const l30 = (k) => last30.map((r) => r[k]).filter((v) => v !== null);
    return {
        days: records.length,
        from: records[0].date, to: records.at(-1).date,
        meanTempC: round(mean(col("temp")), 1),
        meanMaxTempC: round(mean(col("tmax")), 1),
        totalRainMm: round(sum(col("rain")), 1),
        meanRainMmDay: round(mean(col("rain")), 2),
        rainyDays: col("rain").filter((v) => v >= 1).length,
        meanHumidityPct: round(mean(col("humidity")), 1),
        meanSoilRootWetness: round(mean(col("soilRoot")), 2),
        meanSoilTopWetness: round(mean(col("soilTop")), 2),
        meanEvapMmDay: round(mean(col("evap")), 2),
        meanSolarKwhM2: round(mean(col("solar")), 2),
        last30: {
            totalRainMm: round(sum(l30("rain")), 1),
            meanTempC: round(mean(l30("temp")), 1),
            meanSoilRootWetness: round(mean(l30("soilRoot")), 2)
        }
    };
}

export async function getDaily(lat, lon, days = 120) {
    validateCoords(lat, lon);
    const key = `d:${lat.toFixed(2)},${lon.toFixed(2)}:${days}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return { ...hit.data, cached: true };

    const end = new Date(); end.setUTCDate(end.getUTCDate() - 3); // newest days are often not published yet
    const start = new Date(end); start.setUTCDate(start.getUTCDate() - (days - 1));
    const params = Object.keys(DAILY_PARAMS);
    try {
        let url = pointUrl("daily", params, lat, lon, ymd(start), ymd(end));
        let json;
        try { json = await getJson(url); }
        catch (e) {
            if (!e.client) throw e;
            url = pointUrl("daily", CORE, lat, lon, ymd(start), ymd(end)); // extra parameters rejected: fall back to core
            json = await getJson(url);
        }
        const { records, available, elevationM } = parseDaily(json);
        const data = {
            source: "NASA POWER daily point API", requestUrl: url.toString(),
            lat, lon, elevationM, fetchedAt: new Date().toISOString(),
            availableParameters: available, records, summary: summarise(records), stale: false
        };
        cache.set(key, { at: Date.now(), data });
        return { ...data, cached: false };
    } catch (e) {
        if (hit) return { ...hit.data, cached: true, stale: true, warning: `Showing saved NASA data from ${hit.data.fetchedAt}: ${e.message}` };
        throw e;
    }
}

const DAYS_IN_MONTH = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Parse POWER monthly response into 12-month climatology. Exported for tests. */
export function parseMonthly(json) {
    const p = json?.properties?.parameter;
    if (!p?.T2M || !p?.PRECTOTCORR) throw Object.assign(new Error("NASA monthly response is missing required parameters."), { status: 502 });
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, t: [], r: [], h: [], s: [] }));
    const years = new Set();
    for (const [k, v] of Object.entries(p.T2M)) {
        const m = Number(k.slice(4)); if (m < 1 || m > 12 || !valid(v)) continue;
        months[m - 1].t.push(v); years.add(k.slice(0, 4));
    }
    for (const [k, v] of Object.entries(p.PRECTOTCORR)) { const m = Number(k.slice(4)); if (m >= 1 && m <= 12 && valid(v)) months[m - 1].r.push(v * DAYS_IN_MONTH[m - 1]); }
    for (const [k, v] of Object.entries(p.RH2M || {})) { const m = Number(k.slice(4)); if (m >= 1 && m <= 12 && valid(v)) months[m - 1].h.push(v); }
    for (const [k, v] of Object.entries(p.GWETROOT || {})) { const m = Number(k.slice(4)); if (m >= 1 && m <= 12 && valid(v)) months[m - 1].s.push(v); }
    const out = months.map((m) => ({ month: m.month, tempC: round(mean(m.t), 1), rainMm: round(mean(m.r), 0), humidityPct: round(mean(m.h), 1), soilRootWetness: round(mean(m.s), 2) }));
    if (out.every((m) => m.tempC === null)) throw Object.assign(new Error("NASA returned no monthly data."), { status: 502 });
    return { months: out, years: [...years].sort() };
}

export async function getClimate(lat, lon) {
    validateCoords(lat, lon);
    const key = `m:${lat.toFixed(2)},${lon.toFixed(2)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < 24 * 60 * 60 * 1000) return { ...hit.data, cached: true };
    const endYear = new Date().getUTCFullYear() - 1;
    const startYear = endYear - 9;
    const url = pointUrl("monthly", MONTHLY, lat, lon, String(startYear), String(endYear));
    try {
        const json = await getJson(url);
        const { months, years } = parseMonthly(json);
        const data = { source: "NASA POWER monthly point API", requestUrl: url.toString(), lat, lon, fetchedAt: new Date().toISOString(), years, months };
        cache.set(key, { at: Date.now(), data });
        return { ...data, cached: false };
    } catch (e) {
        if (hit) return { ...hit.data, cached: true, stale: true, warning: e.message };
        throw e;
    }
}
