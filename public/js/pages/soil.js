// Soil & Water page: this file builds and fills everything inside #soilRoot.
// Data comes only from the server routes (NASA POWER, NASA GIBS/MODIS, Open-Meteo); nothing is hard-coded.
import { ready } from "../layout.js";
import { getFarmLocation, getSoil, getVegetation, getWaterTrend, getTerrain, mountMap, shortDate, show } from "../nasa-api.js";

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pct = (v) => (v == null ? "n/a" : `${Math.round(v * 100)}%`);

const card = (title, value, sub = "", pill = "") => `
  <div class="panel-card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start"><h4>${title}</h4>${pill}</div>
    <div class="value">${value}</div>
    <div class="subtext">${sub}</div>
  </div>`;

const sectionHead = (title, text, slot = "") => `
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px">
    <div><h3 style="font-size:20px;margin:0 0 4px 0">${title}</h3><p class="muted" style="font-size:14px">${text}</p></div>
    ${slot}
  </div>`;

const skeletons = (n) => Array.from({ length: n }, () => '<div class="panel-card"><div class="skeleton" style="height:70px"></div></div>').join("");

// Slope guidance is indicative and based on slope only, adjust with local advice
const SLOPE = {
  flat: { erosion: "Very low", tips: ["Suited to paddy rice and mechanised field crops.", "Needs surface drainage channels so water does not pond in heavy rain."] },
  gentle: { erosion: "Low", tips: ["Good for vegetables, orchards and annual crops.", "Natural drainage is usually enough; keep the ground covered or mulched."] },
  moderate: { erosion: "Moderate", tips: ["Plant and till across the slope (contour planting).", "Add grass buffer strips and avoid bare fallow in the rainy months."] },
  steep: { erosion: "High", tips: ["Build terraces or soil bunds before planting annual crops.", "Perennial trees and cover crops are safer than clean-tilled vegetables."] },
  "very steep": { erosion: "Severe", tips: ["Not suitable for annual cropping because of erosion and landslide risk.", "Keep permanent tree cover and never leave the soil bare."] },
};

/* ---------------- Page markup ---------------- */

function renderLayout() {
  $("soilRoot").innerHTML = `
    <div id="soilErrors"></div>
    <div class="stat-grid" id="soilMetrics">${skeletons(6)}</div>
    <div class="notice" id="soilStatus" style="margin-bottom:20px">Loading NASA soil moisture observations...</div>

    <section class="panel" style="margin-bottom:20px">
      ${sectionHead("Vegetation Health &amp; Biomass (NDVI / EVI)", "Vegetation indices from NASA MODIS Terra (250 m).", '<div id="vegBadge"></div>')}
      <div class="two-col-grid" style="margin-bottom:18px">
        <div class="panel-card" style="border-left:5px solid #2e8537">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h4>Normalized Difference Vegetation Index (NDVI)</h4><span id="ndviScoreBadge" class="status-badge badge-optimal">NDVI</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:10px;margin:8px 0">
            <span class="value" id="ndviValue" style="color:#2e8537;font-size:38px">--</span><span class="muted" style="font-size:15px">/ 1.00</span>
          </div>
          <div class="gauge-box">
            <div class="gauge-bar"><div id="ndviGaugeFill" class="gauge-fill" style="width:0%;background:linear-gradient(90deg,#a52e22,#e06714,#9bc53d,#2e8537)"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#7a889d;margin-top:4px">
              <span>0.0 Bare</span><span>0.2 Sparse</span><span>0.4 Moderate</span><span>0.6 Good</span><span>0.8+ Dense</span>
            </div>
          </div>
          <div class="subtext" id="ndviInterpretation"></div>
        </div>
        <div class="panel-card" style="border-left:5px solid #1f6fc4">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h4>Enhanced Vegetation Index (EVI)</h4><span id="eviScoreBadge" class="status-badge badge-info">EVI</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:10px;margin:8px 0">
            <span class="value" id="eviValue" style="color:#1f6fc4;font-size:38px">--</span><span class="muted" style="font-size:15px">/ 1.00</span>
          </div>
          <div class="gauge-box">
            <div class="gauge-bar"><div id="eviGaugeFill" class="gauge-fill" style="width:0%;background:linear-gradient(90deg,#6c8ebf,#3388ff,#1f6fc4)"></div></div>
          </div>
          <div class="subtext" id="vegSource"></div>
        </div>
      </div>
      <h4 style="margin:0 0 8px 0;font-size:15px;color:#4a5a72">Satellite Vegetation Map (NASA EOSDIS GIBS)</h4>
      <div id="map" class="nasa-map"></div>
    </section>

    <section class="panel" style="margin-bottom:20px">
      ${sectionHead("Water Trend Analysis (60+ Days)", "Cumulative rainfall, land evaporation and soil moisture trajectory from NASA POWER.",
        `<div class="trend-btn-group" id="rangeButtons">
           <button type="button" class="trend-btn" data-days="60">60 Days</button>
           <button type="button" class="trend-btn active" data-days="90">90 Days</button>
           <button type="button" class="trend-btn" data-days="120">120 Days</button>
         </div>`)}
      <div class="stat-grid" id="waterTrendStats" style="margin-bottom:14px"></div>
      <div id="waterTrendMessage" class="advisory-box" style="margin-bottom:16px"></div>
      <div style="height:300px;margin-bottom:10px"><canvas id="waterTrendChart" aria-label="Water trend chart"></canvas></div>
    </section>

    <section class="panel" style="margin-bottom:20px">
      ${sectionHead("Terrain Elevation &amp; Slope Analysis", "Elevation and slope calculated from a 3 x 3 grid of elevation points (Copernicus 90 m DEM via Open-Meteo, not NASA).", '<div id="terrainBadge"></div>')}
      <div class="stat-grid" id="terrainMetrics" style="margin-bottom:16px"></div>
      <div class="panel-card" style="border-left:4px solid #f5ac2d">
        <h4>Soil Conservation &amp; Agronomic Guidance (indicative, from slope only)</h4>
        <ul id="terRecommendations" style="margin:8px 0 0 0;padding-left:18px;font-size:14px;line-height:1.6"></ul>
      </div>
    </section>

    <section class="panel" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div><h3 style="font-size:20px;margin:0 0 4px 0">Soil Moisture Observations (Last 14 Days)</h3>
        <p class="muted" style="font-size:14px">Modelled by NASA POWER MERRA-2 (0 = dry, 1 = saturated).</p></div>
        <span class="fine" id="soilDateRange"></span>
      </div>
      <div style="overflow-x:auto"><table class="data-table" id="soilTable">
        <thead><tr><th>Date</th><th>Surface Wetness (0–5cm)</th><th>Root Zone (0–100cm)</th><th>Profile Wetness</th><th>Rainfall</th><th>Evaporation</th><th>Net Balance</th></tr></thead>
        <tbody></tbody>
      </table></div>
      <p class="fine" style="margin-top:10px">Source: NASA POWER gridded agroclimatology (model estimates, not farm sensors). Always calibrate with a field soil test.</p>
    </section>

    <details class="panel">
      <summary>Raw API response (proof the numbers above come from the server APIs)</summary>
      <pre id="rawJson" style="background:#0b1f3a;color:#d7e6f7;padding:14px;border-radius:10px;overflow:auto;max-height:420px;font-size:12px;margin:12px 0 0">Loading...</pre>
    </details>`;
}

/* ---------------- Water trend chart ---------------- */

let trendChart = null;
function drawTrendChart(data) {
  const ctx = $("waterTrendChart")?.getContext("2d");
  if (!ctx || typeof Chart === "undefined") return;
  const t = data.timeline;
  trendChart?.destroy();
  trendChart = new Chart(ctx, {
    data: {
      labels: t.map((r) => shortDate(r.date)),
      datasets: [
        { type: "bar", label: "Daily Rain (mm)", data: t.map((r) => r.rainMm), backgroundColor: "rgba(31,111,196,.45)", borderColor: "#1f6fc4", borderWidth: 1, borderRadius: 2, yAxisID: "y", order: 3 },
        { type: "bar", label: "Daily Evap (mm)", data: t.map((r) => r.evapMm), backgroundColor: "rgba(230,161,0,.45)", borderColor: "#e6a100", borderWidth: 1, borderRadius: 2, yAxisID: "y", order: 4 },
        { type: "line", label: "Cumulative Water Balance (mm)", data: t.map((r) => r.cumBalanceMm), borderColor: "#10223c", backgroundColor: "rgba(16,34,60,.05)", fill: true, tension: 0.2, borderWidth: 2.5, pointRadius: 0, yAxisID: "y", order: 2 },
        { type: "line", label: "Root Moisture 7d avg (%)", data: t.map((r) => (r.movingAvgRoot != null ? +(r.movingAvgRoot * 100).toFixed(1) : null)), borderColor: "#2e8537", tension: 0.3, borderWidth: 2.5, pointRadius: 0, yAxisID: "y1", order: 1 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
        y: { title: { display: true, text: "Rainfall & Evaporation (mm)" } },
        y1: { position: "right", title: { display: true, text: "Root Wetness (%)" }, min: 0, max: 100, grid: { display: false } },
      },
      plugins: { legend: { position: "top", labels: { boxWidth: 14 } } },
    },
  });
}

function fillTrend(wt) {
  const s = wt.summary;
  const up = s.netWaterBalanceMm >= 0;
  $("waterTrendStats").innerHTML =
    card(`Total Rainfall (${wt.daysAnalyzed}d)`, `${s.totalRainMm} <span style="font-size:16px;color:#67707b">mm</span>`, `Daily avg: ${s.avgDailyRainMm} mm/day`) +
    card(`Total Evaporation (${wt.daysAnalyzed}d)`, `${s.totalEvapMm} <span style="font-size:16px;color:#67707b">mm</span>`, `Daily avg: ${s.avgDailyEvapMm} mm/day`) +
    card("Cumulative Net Balance", `${up ? "+" : ""}${s.netWaterBalanceMm} <span style="font-size:16px;color:#67707b">mm</span>`,
      `<span class="status-badge ${up ? "badge-optimal" : "badge-warn"}">${up ? "Surplus" : "Deficit"}</span>`) +
    card("Longest Dry Spell", `${s.maxDrySpellDays} <span style="font-size:16px;color:#67707b">days</span>`, "Consecutive days with rain &lt; 1.0 mm");
  $("waterTrendMessage").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <b>Water Trajectory Assessment:</b>
      <span class="status-badge" style="background:${esc(s.trajectoryColor)}22;color:${esc(s.trajectoryColor)}">${esc(s.moistureTrajectory)}</span>
    </div>
    <p style="margin:6px 0 0 0">${esc(s.statusMessage)}</p>`;
  drawTrendChart(wt);
}

/* ---------------- Fill the sections ---------------- */

function fillMetrics(soil, veg, terrain) {
  const s = soil?.summary;
  const rootState = (s?.latestRoot ?? 0) < 0.35 ? "badge-warn" : (s?.latestRoot ?? 0) > 0.8 ? "badge-info" : "badge-optimal";
  const vegClass = veg && (veg.ratingClass === "dense" || veg.ratingClass === "good" || veg.ratingClass === "very-dense") ? "badge-optimal" : "badge-warn";
  const sl = SLOPE[terrain?.slopeClass];

  $("soilMetrics").innerHTML =
    card("Root-Zone Wetness (0–100cm)", pct(s?.latestRoot), `14-day avg: ${pct(s?.avgRoot)}`, s ? `<span class="status-badge ${rootState}">Root Zone</span>` : "") +
    card("Surface Wetness (0–5cm)", pct(s?.latestSurface), `14-day avg: ${pct(s?.avgSurface)}`) +
    card("Profile Soil Wetness", pct(s?.latestProfile), `14-day avg: ${pct(s?.avgProfile)}`) +
    card("NDVI Score", show(veg?.ndvi, "", 2), veg ? `EVI: ${show(veg.evi, "", 2)} · ${veg.biomassPct}% biomass` : "Vegetation data unavailable",
      veg ? `<span class="status-badge ${vegClass}">${esc(veg.rating.split("/")[0].trim())}</span>` : "") +
    card("Terrain Elevation", terrain?.elevationM != null ? `${show(terrain.elevationM, " m", 0)}` : show(soil?.location?.elevationM, " m", 0),
      terrain ? `${Math.round(terrain.elevationM * 3.28084)} ft above sea level` : "Terrain data unavailable") +
    card("Terrain Slope", terrain ? `${terrain.slopePct}%` : "n/a", terrain ? `Angle: ${terrain.slopeDeg}°` : "Terrain data unavailable",
      sl ? `<span class="status-badge badge-info">${esc(terrain.slopeClass)}</span>` : "");

  if (s) {
    $("soilStatus").className = "notice";
    $("soilStatus").innerHTML = `
      <div style="display:flex;align-items:center;gap:10px"><span style="font-size:22px">🌱</span><div>
        <b>NASA Root Zone Assessment:</b> ${esc(s.soilStatus)}
        <div style="font-size:12px;color:#4a5a72;margin-top:4px">
          14-Day Rain: <b>${show(s.totalRainMm, " mm", 0)}</b> | Evaporation: <b>${show(s.totalEvapMm, " mm", 0)}</b> | Net Balance: <b>${esc(s.waterBalanceStatus)}</b>
        </div></div></div>`;
  } else {
    $("soilStatus").remove();
  }
}

function fillVegetation(veg) {
  if (!veg) { $("vegSource").textContent = "Vegetation data unavailable."; return; }
  // Only the MOD13Q1 label means a real MODIS reading; the other labels are model estimates.
  const measured = /MOD13Q1/.test(veg.satelliteSource);
  $("vegBadge").innerHTML = `<span class="status-badge" style="background:${esc(veg.ratingColor)}22;color:${esc(veg.ratingColor)}">${esc(veg.rating)}</span>`;
  $("ndviValue").textContent = show(veg.ndvi, "", 2);
  $("ndviScoreBadge").textContent = `${veg.biomassPct}% Canopy Biomass`;
  $("ndviGaugeFill").style.width = `${Math.min(100, Math.max(5, (veg.ndvi / 0.85) * 100))}%`;
  $("ndviGaugeFill").style.backgroundColor = veg.ratingColor;
  $("ndviInterpretation").textContent = veg.interpretation;
  $("eviValue").textContent = show(veg.evi, "", 2);
  $("eviScoreBadge").textContent = measured ? "MODIS 250m" : "Estimate";
  $("eviGaugeFill").style.width = `${Math.min(100, Math.max(5, (veg.evi / 0.6) * 100))}%`;
  $("vegSource").innerHTML = `Source: ${esc(veg.satelliteSource)} · as of ${esc(veg.asOfDate)}.` +
    (measured ? "" : " <b>This is an estimate, not a satellite measurement</b> (the MODIS service did not answer). Use the map below for the real imagery.");
}

function fillTerrain(terrain) {
  const sl = SLOPE[terrain?.slopeClass];
  if (!terrain || !sl) {
    $("terrainMetrics").innerHTML = "";
    $("terRecommendations").innerHTML = "<li>Terrain data unavailable.</li>";
    return;
  }
  $("terrainBadge").innerHTML = `<span class="status-badge badge-info">Erosion Risk: ${sl.erosion}</span>`;
  $("terrainMetrics").innerHTML =
    card("Elevation", `${terrain.elevationM} <span style="font-size:16px;color:#67707b">m</span>`, `${Math.round(terrain.elevationM * 3.28084)} feet above sea level`) +
    card("Slope Gradient", `${terrain.slopePct} <span style="font-size:16px;color:#67707b">%</span>`, `Angle: ${terrain.slopeDeg}°`) +
    card("Slope Class", `<span style="font-size:22px;text-transform:capitalize">${esc(terrain.slopeClass)}</span>`, "From the slope gradient") +
    card("Erosion Hazard", `<span style="font-size:22px">${sl.erosion}</span>`, "Indicative, from slope only");
  $("terRecommendations").innerHTML = sl.tips.map((t) => `<li>${t}</li>`).join("");
}

function fillTable(soil) {
  const rows = soil?.daily ?? [];
  $("soilDateRange").textContent = rows.length ? `Period: ${shortDate(rows[0].date)} – ${shortDate(rows.at(-1).date)}` : "";
  $("soilTable").tBodies[0].innerHTML = rows.slice().reverse().map((r) => {
    const bal = r.waterBalanceMm == null ? "n/a" : `${r.waterBalanceMm >= 0 ? "+" : ""}${show(r.waterBalanceMm, " mm")}`;
    return `<tr>
      <td><b>${shortDate(r.date)}</b></td><td>${pct(r.surface)}</td><td><b>${pct(r.root)}</b></td><td>${pct(r.profile)}</td>
      <td>${show(r.rainMm, " mm")}</td><td>${show(r.evapMm, " mm")}</td>
      <td style="color:${(r.waterBalanceMm ?? 0) >= 0 ? "#1b6928" : "#c44d00"};font-weight:600">${bal}</td></tr>`;
  }).join("") || '<tr><td colspan="7" class="muted">No soil data available.</td></tr>';
}

/* ---------------- Start ---------------- */

async function init() {
  await ready; // adds the left sidebar and checks the login
  const farm = getFarmLocation();
  if (!farm) {
    $("soilSub").textContent = "Add your farm location to see soil, vegetation and terrain data for your pin.";
    $("soilRoot").innerHTML = `<div class="empty"><h3>Add your farm to get started</h3><p>VerdeAI needs your farm location to read NASA data for your exact pin. Place the pin on the My Farm page, then come back here.</p><a class="btn btn-primary" href="/farm">Add my farm</a></div>`;
    return;
  }
  $("soilSub").innerHTML = `NASA POWER & EOSDIS observations for <b>${esc(farm.name || "your farm")}</b> (${farm.lat.toFixed(4)}°, ${farm.lon.toFixed(4)}°) · <a href="/farm">Change location</a>`;
  renderLayout();

  const q = `lat=${farm.lat}&lon=${farm.lon}`;
  const raw = { requests: [`/api/soil?${q}&days=14`, `/api/vegetation?${q}`, `/api/terrain?${q}`], soil: null, vegetation: null, terrain: null, waterTrend: null };
  const showRaw = () => { $("rawJson").textContent = JSON.stringify(raw, null, 2); };

  // The map does not depend on the data calls
  try {
    mountMap("map", farm.lat, farm.lon, ["ndvi", "evi", "trueColor"]);
  } catch (e) {
    $("map").innerHTML = `<div class="notice err">${esc(e.message)}</div>`;
  }

  async function loadTrend(days) {
    $("waterTrendMessage").textContent = "Loading water trend...";
    try {
      const wt = await getWaterTrend(farm.lat, farm.lon, days);
      raw.waterTrend = wt;
      raw.requests[3] = `/api/water-trend?${q}&days=${days}`;
      fillTrend(wt);
    } catch (e) {
      $("waterTrendMessage").innerHTML = `<span style="color:#a52e22">Could not load water trend: ${esc(e.message)}</span>`;
    }
    showRaw();
  }

  $("rangeButtons").addEventListener("click", (e) => {
    const btn = e.target.closest(".trend-btn");
    if (!btn) return;
    document.querySelectorAll("#rangeButtons .trend-btn").forEach((b) => b.classList.toggle("active", b === btn));
    loadTrend(parseInt(btn.dataset.days, 10));
  });

  // One failing source no longer breaks the whole page
  const [sr, vr, tr] = await Promise.allSettled([getSoil(farm.lat, farm.lon, 14), getVegetation(farm.lat, farm.lon), getTerrain(farm.lat, farm.lon)]);
  const soil = sr.status === "fulfilled" ? sr.value : null;
  const veg = vr.status === "fulfilled" ? vr.value : null;
  const terrain = tr.status === "fulfilled" ? tr.value : null;
  Object.assign(raw, { soil, vegetation: veg, terrain });

  $("soilErrors").innerHTML = [["NASA POWER soil moisture", sr], ["Vegetation index", vr], ["Terrain", tr]]
    .filter(([, r]) => r.status === "rejected")
    .map(([name, r]) => `<div class="notice err" style="margin-bottom:10px">${esc(name)} could not be loaded: ${esc(r.reason?.message)}</div>`).join("");

  fillMetrics(soil, veg, terrain);
  fillVegetation(veg);
  fillTerrain(terrain);
  fillTable(soil);
  showRaw();
  loadTrend(90);
}

init();
