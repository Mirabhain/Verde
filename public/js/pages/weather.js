// Weather page: this file builds and fills everything inside #weatherRoot.
// Data comes only from the server routes (NASA POWER, NASA GIBS, Open-Meteo); nothing is hard-coded.
import { ready } from "../layout.js";
import { getFarmLocation, getWeather, getForecast, getTerrain, mountMap, shortDate, show } from "../nasa-api.js";

const DAYS = 14;
const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fcShort = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`; // forecast dates are YYYY-MM-DD
const nums = (rows, k) => rows.map((r) => r[k]).filter((v) => v != null);
const sumOf = (a) => a.reduce((x, y) => x + y, 0);
const avgOf = (a) => (a.length ? sumOf(a) / a.length : null);

/* ---------------- Heat stress (calculated in the browser from the NASA values) ---------------- */

// NOAA / Rothfusz heat index, input and output in Celsius
function heatIndexC(tC, rh) {
  if (tC == null || rh == null) return null;
  const t = tC * 1.8 + 32;
  let hi = 0.5 * (t + 61 + (t - 68) * 1.2 + rh * 0.094);
  if (hi >= 80) {
    hi = -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh - 0.00683783 * t * t
      - 0.05481717 * rh * rh + 0.00122874 * t * t * rh + 0.00085282 * t * rh * rh - 0.00000199 * t * t * rh * rh;
  }
  return +((hi - 32) / 1.8).toFixed(1);
}

const stressLevel = (hi) => (hi == null ? "Low" : hi < 32 ? "Low" : hi < 36 ? "Mild" : hi < 41 ? "Moderate" : "Severe");

const BADGES = {
  Severe: '<span class="status-badge badge-severe">Severe Stress</span>',
  Moderate: '<span class="status-badge badge-warn">Moderate Stress</span>',
  Mild: '<span class="status-badge badge-mild">Mild Stress</span>',
  Low: '<span class="status-badge badge-optimal">Optimal / Normal</span>',
};
const ADVISORY = {
  Severe: "Severe canopy heat stress. Irrigate in early morning or late evening, keep soil mulched, and avoid foliar fertiliser in peak heat.",
  Moderate: "Moderate heat stress. Watch soil moisture closely because crops are losing more water; consider shade netting for seedlings.",
  Mild: "Mild thermal stress. Crop water uptake is higher than usual; your normal irrigation schedule should be enough.",
  Low: "Thermal conditions are favourable. No heat stress action needed.",
};

// Adds heat index, stress level and daily water balance to each NASA row
function prepare(weather) {
  return (weather?.daily ?? [])
    .filter((r) => r.tempC != null)
    .slice(-DAYS)
    .map((r) => {
      const hi = r.maxC != null && r.humidityPct != null ? heatIndexC(r.maxC, r.humidityPct) : null;
      const bal = r.rainMm != null && r.evlandMm != null ? +(r.rainMm - r.evlandMm).toFixed(1) : null;
      return { ...r, hi, bal, stress: stressLevel(hi) };
    });
}

function summarise(rows) {
  const his = nums(rows, "hi");
  const both = rows.filter((r) => r.bal != null);
  const stressDays = rows.filter((r) => (r.hi ?? 0) >= 36).length;
  const severeDays = rows.filter((r) => (r.hi ?? 0) >= 41).length;
  const risk = severeDays > 0 ? "Severe" : stressDays >= 4 ? "Moderate" : stressDays > 0 ? "Mild" : "Low";
  return {
    n: rows.length,
    avgTemp: avgOf(nums(rows, "tempC")),
    avgMin: avgOf(nums(rows, "minC")),
    avgMax: avgOf(nums(rows, "maxC")),
    rain: sumOf(nums(rows, "rainMm")),
    rainyDays: rows.filter((r) => (r.rainMm ?? 0) >= 1).length,
    evap: both.length ? sumOf(both.map((r) => r.evlandMm)) : null,
    avgEvap: both.length ? avgOf(both.map((r) => r.evlandMm)) : null,
    balance: both.length ? +sumOf(both.map((r) => r.bal)).toFixed(1) : null,
    currentHI: rows.at(-1)?.hi ?? null,
    maxHI: his.length ? Math.max(...his) : null,
    stressDays,
    nightDays: rows.filter((r) => (r.minC ?? 0) >= 24.5).length,
    risk,
  };
}

/* ---------------- Page markup ---------------- */

const card = (title, value, sub = "", pill = "") => `
  <div class="panel-card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start"><h4>${title}</h4>${pill}</div>
    <div class="value">${value}</div>
    <div class="subtext">${sub}</div>
  </div>`;

const sectionHead = (title, text, slotId) => `
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px">
    <div><h3 style="font-size:20px;margin:0 0 4px 0">${title}</h3><p class="muted" style="font-size:14px">${text}</p></div>
    ${slotId ? `<div id="${slotId}"></div>` : ""}
  </div>`;

const skeletons = (n) => Array.from({ length: n }, () => '<div class="panel-card"><div class="skeleton" style="height:70px"></div></div>').join("");

const TABLE_HEAD = (cols) => `<thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>`;

function renderLayout() {
  $("weatherRoot").innerHTML = `
    <div id="weatherErrors"></div>
    <div class="stat-grid" id="nasaMetrics">${skeletons(6)}</div>

    <section class="panel" style="margin-bottom:20px">
      ${sectionHead("Crop Heat Stress Analysis", "Thermal stress calculated from daily maximum temperature and relative humidity (NOAA/Rothfusz heat index). Indicative only: it uses daily mean humidity.", "heatStressBadge")}
      <div class="stat-grid" id="heatStressStats" style="margin-bottom:14px"></div>
      <div id="heatStressAdvisory"></div>
      <div style="margin-top:16px;height:240px"><canvas id="heatChart" aria-label="Heat index and temperature chart"></canvas></div>
    </section>

    <section class="panel" style="margin-bottom:20px">
      ${sectionHead("Rainfall vs Evaporation (Water Balance)", "Daily NASA POWER rainfall against land evaporation (EVLAND).", "waterBalanceBadge")}
      <div style="height:260px"><canvas id="waterChart" aria-label="Rainfall versus evaporation chart"></canvas></div>
    </section>

    <section class="panel" style="margin-bottom:20px">
      ${sectionHead("Humidity &amp; Solar Radiation", "Daily mean relative humidity and surface solar radiation (NASA POWER).")}
      <div style="height:240px"><canvas id="chartHum" aria-label="Humidity and solar radiation chart"></canvas></div>
    </section>

    <section class="panel" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="font-size:20px;margin:0">Daily Observations (Last ${DAYS} Days)</h3><span class="fine" id="tableDateRange"></span>
      </div>
      <div style="overflow-x:auto"><table class="data-table" id="weatherTable">
        ${TABLE_HEAD(["Date", "Avg Temp", "Min / Max", "Rainfall", "Evaporation", "Net Balance", "Humidity", "Heat Index", "Heat Stress"])}<tbody></tbody>
      </table></div>
      <p class="fine" id="weatherNote" style="margin-top:10px"></p>
    </section>

    <section class="panel" style="margin-bottom:20px">
      ${sectionHead("Forecast (Next 7 Days)", "Short range forecast from Open-Meteo. NASA POWER does not provide forecasts.")}
      <div style="overflow-x:auto"><table class="data-table" id="forecastTable">
        ${TABLE_HEAD(["Date", "Min / Max", "Rainfall", "Rain Chance"])}<tbody></tbody>
      </table></div>
    </section>

    <section class="panel">
      ${sectionHead("NASA EOSDIS Satellite View &amp; Vegetation Health", "MODIS Terra satellite imagery and 8-day NDVI/EVI vegetation health layers from NASA GIBS.", "terrainQuickBadge")}
      <div id="map" class="nasa-map"></div>
    </section>

    <details class="panel" style="margin-top:20px">
      <summary>Raw API response (proof the numbers above come from the server APIs)</summary>
      <pre id="rawJson" style="background:#0b1f3a;color:#d7e6f7;padding:14px;border-radius:10px;overflow:auto;max-height:420px;font-size:12px;margin:12px 0 0">Loading...</pre>
    </details>`;
}

/* ---------------- Charts ---------------- */

const charts = {};
function makeChart(id, config) {
  const ctx = $(id)?.getContext("2d");
  if (!ctx) return;
  charts[id]?.destroy();
  charts[id] = new Chart(ctx, config);
}
const baseOptions = (yTitle, extra = {}) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  scales: { x: { grid: { display: false } }, y: { title: { display: true, text: yTitle }, ...extra } },
  plugins: { legend: { position: "top", labels: { boxWidth: 14 } } },
});

function drawCharts(rows) {
  const labels = rows.map((r) => shortDate(r.date));
  const line = (label, key, color, extra = {}) => ({
    label, data: rows.map((r) => r[key]), borderColor: color, tension: 0.3, borderWidth: 2, pointRadius: 0, ...extra,
  });

  makeChart("heatChart", {
    type: "line",
    data: {
      labels,
      datasets: [
        line("Heat Index (°C)", "hi", "#c92a2a", { backgroundColor: "rgba(201,42,42,.1)", fill: true, borderWidth: 2.5, pointRadius: 3 }),
        line("Max Temp (°C)", "maxC", "#e06714", { borderDash: [4, 4] }),
        line("Min Temp (°C)", "minC", "#2e8537", { borderDash: [2, 2], borderWidth: 1.5 }),
      ],
    },
    options: baseOptions("Temperature / Heat Index (°C)", { suggestedMin: 22, suggestedMax: 44 }),
  });

  makeChart("waterChart", {
    data: {
      labels,
      datasets: [
        { type: "bar", label: "Rainfall (mm/day)", data: rows.map((r) => r.rainMm), backgroundColor: "rgba(31,111,196,.65)", borderColor: "#1f6fc4", borderWidth: 1, borderRadius: 4 },
        { type: "bar", label: "Evaporation (mm/day)", data: rows.map((r) => r.evlandMm), backgroundColor: "rgba(230,161,0,.65)", borderColor: "#e6a100", borderWidth: 1, borderRadius: 4 },
        { type: "line", label: "Daily Water Balance (mm)", data: rows.map((r) => r.bal), borderColor: "#2e8537", backgroundColor: "#2e8537", tension: 0.3, borderWidth: 2, pointRadius: 2 },
      ],
    },
    options: baseOptions("Millimetres (mm)", { beginAtZero: true }),
  });

  makeChart("chartHum", {
    data: {
      labels,
      datasets: [
        { type: "line", label: "Humidity (%)", data: rows.map((r) => r.humidityPct), borderColor: "#1f6fc4", tension: 0.3, borderWidth: 2, pointRadius: 0, yAxisID: "y" },
        { type: "bar", label: "Solar radiation (MJ/m²/day)", data: rows.map((r) => r.solarMJ), backgroundColor: "rgba(230,161,0,.55)", borderRadius: 4, yAxisID: "y1" },
      ],
    },
    options: {
      ...baseOptions("Humidity (%)", { suggestedMin: 40, suggestedMax: 100 }),
      scales: {
        x: { grid: { display: false } },
        y: { position: "left", title: { display: true, text: "Humidity (%)" }, suggestedMin: 40, suggestedMax: 100 },
        y1: { position: "right", title: { display: true, text: "MJ/m²/day" }, beginAtZero: true, grid: { drawOnChartArea: false } },
      },
    },
  });
}

/* ---------------- Fill the sections ---------------- */

function fillSummary(s, w, terrain) {
  const surplus = s.balance != null && s.balance >= 0;
  const balPill = s.balance == null ? "" : `<span class="status-badge ${surplus ? "badge-optimal" : "badge-warn"}">${surplus ? "Surplus" : "Deficit"}</span>`;

  $("nasaMetrics").innerHTML =
    card("Average Temperature", show(s.avgTemp, " °C"), `Min ${show(s.avgMin, "°C")} / Max ${show(s.avgMax, "°C")}`) +
    card(`Rainfall (${s.n} Days)`, show(s.rain, " mm", 0), `${s.rainyDays} rainy days out of ${s.n}`) +
    card(`Evaporation (${s.n} Days)`, show(s.evap, " mm", 0), s.avgEvap == null ? "EVLAND not returned by NASA" : `Avg ${show(s.avgEvap, " mm/day")} loss`) +
    card("Net Water Balance", s.balance == null ? "n/a" : `${surplus ? "+" : ""}${show(s.balance, " mm")}`, s.balance == null ? "Needs evaporation data" : surplus ? "Cumulative surplus" : "Cumulative deficit", balPill) +
    card("Heat Stress Risk", s.risk, `Max Heat Index: ${show(s.maxHI, " °C")}`, BADGES[s.risk]) +
    card("Terrain Elevation", terrain?.elevationM != null ? `${show(terrain.elevationM, " m", 0)}` : show(w?.location?.elevationM, " m", 0),
      terrain?.slopePct != null ? `Slope: ${terrain.slopePct}% (${terrain.slopeDeg}°)` : "Slope unavailable");

  $("heatStressBadge").innerHTML = BADGES[s.risk];
  $("heatStressStats").innerHTML =
    card("Current Heat Index", show(s.currentHI, " °C"), "Latest day, feels-like load") +
    card("Peak Heat Index", show(s.maxHI, " °C"), `Highest in ${s.n} days`) +
    card("Heat Stress Days", `${s.stressDays} <span style="font-size:16px;color:#67707b">/ ${s.n}</span>`, "Days with Heat Index ≥ 36°C") +
    card("Night Thermal Stress", `${s.nightDays} <span style="font-size:16px;color:#67707b">days</span>`, "Nights with Min Temp ≥ 24.5°C");
  $("heatStressAdvisory").className = `advisory-box ${s.risk === "Severe" ? "severe" : s.risk === "Moderate" ? "warn" : ""}`;
  $("heatStressAdvisory").innerHTML = `<b>Agro-climatic Advisory (${s.risk} Risk):</b> ${ADVISORY[s.risk]}`;

  $("waterBalanceBadge").innerHTML = s.balance == null ? "" :
    `<span class="status-badge ${surplus ? "badge-optimal" : "badge-warn"}">${surplus ? "Cumulative Surplus (+)" : "Cumulative Deficit (-)"}</span>`;
}

function fillObservations(rows, farm, w) {
  $("tableDateRange").textContent = rows.length ? `Period: ${shortDate(rows[0].date)} – ${shortDate(rows.at(-1).date)}` : "";
  $("weatherTable").tBodies[0].innerHTML = rows.slice().reverse().map((r) => {
    const bal = r.bal == null ? "n/a" : `${r.bal >= 0 ? "+" : ""}${show(r.bal, " mm")}`;
    return `<tr>
      <td><b>${shortDate(r.date)}</b></td>
      <td>${show(r.tempC, " °C")}</td>
      <td>${show(r.minC, "", 0)} / ${show(r.maxC, " °C", 0)}</td>
      <td>${show(r.rainMm, " mm")}</td>
      <td>${show(r.evlandMm, " mm")}</td>
      <td style="color:${(r.bal ?? 0) >= 0 ? "#1b6928" : "#c44d00"};font-weight:600">${bal}</td>
      <td>${show(r.humidityPct, "%", 0)}</td>
      <td><b>${show(r.hi, " °C")}</b></td>
      <td>${BADGES[r.stress]}</td>
    </tr>`;
  }).join("");
  $("weatherNote").textContent =
    `Source: NASA POWER daily agroclimatology (gridded model estimates, not farm sensors). Latest reading: ${rows.length ? shortDate(rows.at(-1).date) : "n/a"}. ` +
    `Coordinates: ${farm.lat.toFixed(4)}, ${farm.lon.toFixed(4)}. Heat index is calculated in this page from the NASA temperature and humidity.`;
}

function fillForecast(forecast) {
  $("forecastTable").tBodies[0].innerHTML = (forecast?.daily ?? []).map((r) => `<tr>
    <td><b>${fcShort(r.date)}</b></td>
    <td>${show(r.minC, "", 0)} / ${show(r.maxC, " °C", 0)}</td>
    <td>${show(r.rainMm, " mm")}</td>
    <td>${show(r.rainProbPct, "%", 0)}</td></tr>`).join("") ||
    '<tr><td colspan="4" class="muted">Forecast not available.</td></tr>';
}

/* ---------------- Start ---------------- */

async function init() {
  await ready; // adds the left sidebar and checks the login
  const farm = getFarmLocation();
  if (!farm) {
    $("wxSub").textContent = "Add your farm location to see NASA weather for your pin.";
    $("weatherRoot").innerHTML = `<div class="empty"><h3>Add your farm to get started</h3><p>VerdeAI needs your farm location to read NASA data for your exact pin. Place the pin on the My Farm page, then come back here.</p><a class="btn btn-primary" href="/farm">Add my farm</a></div>`;
    return;
  }
  $("wxSub").innerHTML = `Observations for <b>${esc(farm.name || "Your farm")}</b> (${farm.lat.toFixed(4)}°, ${farm.lon.toFixed(4)}°) · <a href="/farm">Change location</a>`;
  renderLayout();

  const q = `lat=${farm.lat}&lon=${farm.lon}`;
  const requests = [`/api/weather?${q}&days=${DAYS}`, `/api/forecast?${q}`, `/api/terrain?${q}`];
  const [wr, fr, tr] = await Promise.allSettled([getWeather(farm.lat, farm.lon, DAYS), getForecast(farm.lat, farm.lon), getTerrain(farm.lat, farm.lon)]);
  const w = wr.status === "fulfilled" ? wr.value : null;
  const forecast = fr.status === "fulfilled" ? fr.value : null;
  const terrain = tr.status === "fulfilled" ? tr.value : null;

  const errors = [["NASA POWER weather", wr], ["Forecast", fr], ["Terrain", tr]]
    .filter(([, r]) => r.status === "rejected")
    .map(([name, r]) => `<div class="notice err" style="margin-bottom:10px">${esc(name)} could not be loaded: ${esc(r.reason?.message)}</div>`);
  $("weatherErrors").innerHTML = errors.join("");

  const rows = prepare(w);
  if (w && rows.length) {
    fillSummary(summarise(rows), w, terrain);
    fillObservations(rows, farm, w);
    if (typeof Chart === "undefined") {
      $("weatherErrors").innerHTML += '<div class="notice err">Chart.js is not loaded. Check the script tag in the page.</div>';
    } else {
      drawCharts(rows);
    }
  } else {
    $("nasaMetrics").innerHTML = "";
  }
  fillForecast(forecast);
  if (terrain) {
    $("terrainQuickBadge").innerHTML = `<span class="status-badge badge-info">Elevation: ${show(terrain.elevationM, "m", 0)} · Slope: ${terrain.slopePct}% (${esc(terrain.slopeClass)})</span>`;
  }

  // The map works even if the data calls failed; the NASA POWER cell is added when the data is available.
  try {
    mountMap("map", farm.lat, farm.lon, ["trueColor", "ndvi", "evi"], { power: w ? { summary: w.summary, forecast } : undefined });
  } catch (e) {
    $("map").innerHTML = `<div class="notice err">${esc(e.message)}</div>`;
  }

  // Exactly what the server returned, untouched
  $("rawJson").textContent = JSON.stringify({ requests, weather: w, forecast, terrain }, null, 2);
}

init();