/* VerdeAI browser helpers for NASA POWER, GIBS and the forecast and terrain routes. */

import { getFarm } from "./storage.js";

// The pin the user saved on the Farm page (same storage as the dashboard).
// Returns null when no valid location has been saved, so pages can ask the user to add their farm.
export function getFarmLocation() {
  const f = getFarm();
  if (!f || f.lat == null || f.lat === "" || f.lon == null || f.lon === "") return null;
  const lat = Number(f.lat), lon = Number(f.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { ...f, lat, lon };
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const getWeather = (lat, lon, days = 14) => getJSON(`/api/weather?lat=${lat}&lon=${lon}&days=${days}`);
export const getSoil = (lat, lon, days = 14) => getJSON(`/api/soil?lat=${lat}&lon=${lon}&days=${days}`);
export const getForecast = (lat, lon) => getJSON(`/api/forecast?lat=${lat}&lon=${lon}`);
export const getTerrain = (lat, lon) => getJSON(`/api/terrain?lat=${lat}&lon=${lon}`);
export const getWaterTrend = (lat, lon, days = 90) => getJSON(`/api/water-trend?lat=${lat}&lon=${lon}&days=${days}`);
export const getVegetation = (lat, lon) => getJSON(`/api/vegetation?lat=${lat}&lon=${lon}`);

export const shortDate = (s) => `${s.slice(6, 8)}/${s.slice(4, 6)}`; // POWER format YYYYMMDD
export const show = (v, unit = "", digits = 1) => (v == null ? "n/a" : `${(+v).toFixed(digits)}${unit}`);

/* ------------------------------------------------------------------ */
/* GIBS                                                                */
/* ------------------------------------------------------------------ */

const GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";

// Level7 is about 1 km and Level9 about 250 m per pixel.
const LAYERS = {
  trueColor: {
    id: "MODIS_Terra_CorrectedReflectance_TrueColor",
    ext: "jpg", matrix: "GoogleMapsCompatible_Level9", maxZoom: 9, period: "daily",
    label: "True colour (daily)",
  },
  lst: {
    id: "MODIS_Terra_Land_Surface_Temp_Day",
    ext: "png", matrix: "GoogleMapsCompatible_Level7", maxZoom: 7, period: "daily",
    label: "Land surface temperature (day)",
  },
  // Format and matrix for the two vegetation layers are not verified, check GetCapabilities if blank.
  ndvi: {
    id: "MODIS_Terra_NDVI_8Day",
    ext: "png", matrix: "GoogleMapsCompatible_Level9", maxZoom: 9, period: "8day",
    label: "NDVI vegetation (8 day)",
  },
  evi: {
    id: "MODIS_Terra_EVI_8Day",
    ext: "png", matrix: "GoogleMapsCompatible_Level9", maxZoom: 9, period: "8day",
    label: "EVI vegetation (8 day)",
  },
};

const iso = (d) => d.toISOString().slice(0, 10);

// MODIS 8 day composites start on day 1 of each year, then every 8 days (1, 9, 17 ...).
export function eightDayStart(date) {
  const y = date.getUTCFullYear();
  const doy = Math.floor((Date.UTC(y, date.getUTCMonth(), date.getUTCDate()) - Date.UTC(y, 0, 1)) / 86400000) + 1;
  const startDoy = Math.floor((doy - 1) / 8) * 8 + 1;
  return iso(new Date(Date.UTC(y, 0, startDoy)));
}

// Daily layers use 2 days back. 8 day layers use the composite that began at least 16 days ago.
export function gibsDate(period, now = new Date()) {
  if (period === "8day") return eightDayStart(new Date(now.getTime() - 16 * 86400000));
  return iso(new Date(now.getTime() - 2 * 86400000));
}

function gibsLayer(key) {
  const cfg = LAYERS[key];
  const date = gibsDate(cfg.period);
  const layer = L.tileLayer(`${GIBS}/${cfg.id}/default/${date}/${cfg.matrix}/{z}/{y}/{x}.${cfg.ext}`, {
    tileSize: 256,
    maxNativeZoom: cfg.maxZoom,
    maxZoom: 12,
    noWrap: true,
    opacity: 0.8,
    attribution: `NASA EOSDIS GIBS (${date})`,
  });
  let warned = false;
  layer.on("tileerror", (e) => {
    if (warned) return;
    warned = true;
    console.warn(`GIBS tile failed for "${cfg.label}". Open this URL to see the error:`, e.tile.src);
  });
  return layer;
}

/* ------------------------------------------------------------------ */
/* POWER grid cell overlay                                             */
/* ------------------------------------------------------------------ */

// POWER meteorology comes from a 0.5 degree by 0.625 degree grid, so one value covers a whole cell.
export function powerCellBounds(lat, lon) {
  const latC = Math.round(lat / 0.5) * 0.5;
  const lonC = -180 + Math.round((lon + 180) / 0.625) * 0.625;
  return [[latC - 0.25, lonC - 0.3125], [latC + 0.25, lonC + 0.3125]];
}

// Indicative colour classes for 14 day rainfall, adjust with local advice.
function rainColour(mm) {
  if (mm == null) return "#8a8f98";
  if (mm < 20) return "#c0462b";
  if (mm > 120) return "#2f6fb0";
  return "#2e8537";
}

function powerCell(lat, lon, power) {
  const p = power.summary;
  const f = power.forecast?.summary;
  const rect = L.rectangle(powerCellBounds(lat, lon), {
    color: rainColour(p?.totalRainMm),
    weight: 2,
    fillOpacity: 0.18,
  });
  rect.bindPopup(
    `<b>NASA POWER cell (about 50 km)</b><br>` +
    `Average temperature: ${show(p?.avgTempC, " °C")}<br>` +
    `Rain, last ${p?.daysWithData ?? "?"} days: ${show(p?.totalRainMm, " mm", 0)}<br>` +
    `Humidity: ${show(p?.avgHumidityPct, "%", 0)}` +
    (f ? `<br>Forecast rain, next ${f.days} days: ${show(f.totalRainMm, " mm", 0)} (Open-Meteo)` : "")
  );
  return rect;
}

/* ------------------------------------------------------------------ */
/* Map                                                                 */
/* ------------------------------------------------------------------ */

export function mountMap(elementId, lat, lon, keys, { power } = {}) {
  if (typeof L === "undefined") throw new Error("Leaflet is not loaded. Check the script tag order in the page.");

  const map = L.map(elementId).setView([lat, lon], 7);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "OpenStreetMap",
  }).addTo(map);

  const overlays = {};
  keys.forEach((k, i) => {
    const layer = gibsLayer(k);
    overlays[LAYERS[k].label] = layer;
    if (i === 0) layer.addTo(map); // the first key is shown, the rest are toggled in the panel
  });

  if (power?.summary) {
    const cell = powerCell(lat, lon, power).addTo(map);
    overlays["NASA POWER grid cell (data)"] = cell;
  }

  L.control.layers(null, overlays, { collapsed: false }).addTo(map);
  L.marker([lat, lon]).addTo(map).bindPopup("Your farm");

  // The page layout can change the container size after Leaflet starts.
  setTimeout(() => map.invalidateSize(), 250);
  window.addEventListener("resize", () => map.invalidateSize());
  return map;
}