const POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";
const GROUPS = {
  weather: ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN"],
  soil: ["GWETTOP", "GWETROOT", "GWETPROF", "PRECTOTCORR"],
};
const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map();

const ymd = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
const clean = (v) => (v === -999 || v == null ? null : v);
const vals = (rows, k) => rows.map((r) => r[k]).filter((x) => x != null);
const avg = (rows, k) => {
  const v = vals(rows, k);
  return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : null;
};
const sum = (rows, k) => +vals(rows, k).reduce((a, b) => a + b, 0).toFixed(1);

async function fetchPower(group, lat, lon, days) {
  const key = `${group}:${lat.toFixed(1)},${lon.toFixed(1)},${days}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

  const qs = new URLSearchParams({
    parameters: GROUPS[group].join(","),
    community: "AG",
    longitude: lon,
    latitude: lat,
    start: ymd(new Date(Date.now() - (days - 1) * 86400000)),
    end: ymd(new Date()),
    format: "JSON",
  });
  const res = await fetch(`${POWER_URL}?${qs}`);
  if (!res.ok) throw new Error(`NASA POWER request failed (${res.status})`);
  const json = await res.json();

  const data = {
    elevationM: json.geometry?.coordinates?.[2] ?? null,
    p: json.properties.parameter,
  };
  cache.set(key, { at: Date.now(), data });
  return data;
}

async function getWeather(lat, lon, days = 14) {
  const { p, elevationM } = await fetchPower("weather", lat, lon, days);
  const daily = Object.keys(p.T2M).map((d) => ({
    date: d,
    tempC: clean(p.T2M[d]),
    maxC: clean(p.T2M_MAX[d]),
    minC: clean(p.T2M_MIN[d]),
    rainMm: clean(p.PRECTOTCORR[d]),
    humidityPct: clean(p.RH2M[d]),
    windMs: clean(p.WS2M[d]),
    solarMJ: clean(p.ALLSKY_SFC_SW_DWN[d]),
  }));
  const valid = daily.filter((r) => r.tempC !== null);
  return {
    location: { lat, lon, elevationM },
    daily,
    summary: {
      daysWithData: valid.length,
      avgTempC: avg(valid, "tempC"),
      totalRainMm: sum(valid, "rainMm"),
      rainyDays: valid.filter((r) => (r.rainMm ?? 0) >= 1).length,
      avgHumidityPct: avg(valid, "humidityPct"),
      avgSolarMJ: avg(valid, "solarMJ"),
      lastDataDate: valid.at(-1)?.date ?? null,
    },
    fetchedAt: new Date().toISOString(),
  };
}

async function getSoil(lat, lon, days = 14) {
  const { p, elevationM } = await fetchPower("soil", lat, lon, days);
  const daily = Object.keys(p.GWETROOT).map((d) => ({
    date: d,
    surface: clean(p.GWETTOP[d]),
    root: clean(p.GWETROOT[d]),
    profile: clean(p.GWETPROF[d]),
    rainMm: clean(p.PRECTOTCORR[d]),
  }));
  const valid = daily.filter((r) => r.root !== null);
  const latest = valid.at(-1) ?? null;
  return {
    location: { lat, lon, elevationM },
    daily,
    summary: {
      latestRoot: latest?.root ?? null,
      latestSurface: latest?.surface ?? null,
      avgRoot: avg(valid, "root"),
      daysBelow03: valid.filter((r) => r.root < 0.3).length,
      totalRainMm: sum(valid, "rainMm"),
      lastDataDate: latest?.date ?? null,
    },
    fetchedAt: new Date().toISOString(),
  };
}

export { getWeather, getSoil };