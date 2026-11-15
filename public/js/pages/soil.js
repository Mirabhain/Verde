import {
  getFarmLocation,
  getSoil,
  getVegetation,
  getWaterTrend,
  getTerrain,
  mountMap,
  shortDate,
  show,
} from "../nasa-api.js";

const metrics = document.getElementById("soilMetrics");
const status = document.getElementById("soilStatus");
const subtext = document.getElementById("soilSub");
const tableBody = document.querySelector("#soilTable tbody");
const soilDateRange = document.getElementById("soilDateRange");

// Vegetation elements
const vegBadge = document.getElementById("vegBadge");
const ndviValue = document.getElementById("ndviValue");
const ndviScoreBadge = document.getElementById("ndviScoreBadge");
const ndviGaugeFill = document.getElementById("ndviGaugeFill");
const ndviInterpretation = document.getElementById("ndviInterpretation");
const eviValue = document.getElementById("eviValue");
const eviScoreBadge = document.getElementById("eviScoreBadge");
const eviGaugeFill = document.getElementById("eviGaugeFill");
const eviInterpretation = document.getElementById("eviInterpretation");

// Water trend elements
const waterTrendStats = document.getElementById("waterTrendStats");
const waterTrendMessage = document.getElementById("waterTrendMessage");
const rangeButtons = document.querySelectorAll(".trend-btn");

// Terrain elements
const terrainBadge = document.getElementById("terrainBadge");
const terrainMetrics = document.getElementById("terrainMetrics");
const terElev = document.getElementById("terElev");
const terSlopePct = document.getElementById("terSlopePct");
const terSlopeDeg = document.getElementById("terSlopeDeg");
const terAspect = document.getElementById("terAspect");
const terDrainage = document.getElementById("terDrainage");
const terRecommendations = document.getElementById("terRecommendations");

const pct = (v) => (v == null ? "n/a" : `${Math.round(v * 100)}%`);

function metricCard(title, value, sub = "", pillHtml = "") {
  return `
    <div class="panel-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <h4>${title}</h4>
        ${pillHtml}
      </div>
      <div class="value">${value}</div>
      <div class="subtext">${sub}</div>
    </div>
  `;
}

let waterTrendChartInst = null;

function renderWaterTrendChart(data) {
  if (typeof Chart === "undefined") return;
  const ctx = document.getElementById("waterTrendChart")?.getContext("2d");
  if (!ctx) return;

  const labels = data.timeline.map((r) => shortDate(r.date));

  if (waterTrendChartInst) waterTrendChartInst.destroy();
  waterTrendChartInst = new Chart(ctx, {
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Daily Rain (mm)",
          data: data.timeline.map((r) => r.rainMm),
          backgroundColor: "rgba(31, 111, 196, 0.45)",
          borderColor: "#1f6fc4",
          borderWidth: 1,
          borderRadius: 2,
          yAxisID: "y",
          order: 3,
        },
        {
          type: "bar",
          label: "Daily Evap (mm)",
          data: data.timeline.map((r) => r.evapMm),
          backgroundColor: "rgba(230, 161, 0, 0.45)",
          borderColor: "#e6a100",
          borderWidth: 1,
          borderRadius: 2,
          yAxisID: "y",
          order: 4,
        },
        {
          type: "line",
          label: "Cumulative Water Balance (mm)",
          data: data.timeline.map((r) => r.cumBalanceMm),
          borderColor: "#10223c",
          backgroundColor: "rgba(16, 34, 60, 0.05)",
          fill: true,
          tension: 0.2,
          borderWidth: 2.5,
          pointRadius: 0,
          yAxisID: "y",
          order: 2,
        },
        {
          type: "line",
          label: "Root Moisture 7d SMA (%)",
          data: data.timeline.map((r) => (r.movingAvgRoot != null ? +(r.movingAvgRoot * 100).toFixed(1) : null)),
          borderColor: "#2e8537",
          tension: 0.3,
          borderWidth: 2.5,
          pointRadius: 0,
          yAxisID: "y1",
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 12 },
        },
        y: {
          title: { display: true, text: "Rainfall & Evaporation (mm)" },
          beginAtZero: false,
        },
        y1: {
          position: "right",
          title: { display: true, text: "Root Wetness (% saturation)" },
          min: 0,
          max: 100,
          grid: { display: false },
        },
      },
      plugins: {
        legend: { position: "top", labels: { boxWidth: 14 } },
      },
    },
  });
}

async function loadWaterTrend(lat, lon, days = 90) {
  try {
    const wt = await getWaterTrend(lat, lon, days);
    const s = wt.summary;
    const balanceSign = s.netWaterBalanceMm >= 0 ? "+" : "";
    const balanceClass = s.netWaterBalanceMm >= 0 ? "badge-optimal" : "badge-warn";

    waterTrendStats.innerHTML = `
      <div class="panel-card">
        <h4>Total Rainfall (${wt.daysAnalyzed}d)</h4>
        <div class="value">${s.totalRainMm} <span style="font-size:16px;color:#67707b">mm</span></div>
        <div class="subtext">Daily avg: ${s.avgDailyRainMm} mm/day</div>
      </div>
      <div class="panel-card">
        <h4>Total Evaporation (${wt.daysAnalyzed}d)</h4>
        <div class="value">${s.totalEvapMm} <span style="font-size:16px;color:#67707b">mm</span></div>
        <div class="subtext">Daily avg: ${s.avgDailyEvapMm} mm/day</div>
      </div>
      <div class="panel-card">
        <h4>Cumulative Net Balance</h4>
        <div class="value">${balanceSign}${s.netWaterBalanceMm} <span style="font-size:16px;color:#67707b">mm</span></div>
        <div class="subtext"><span class="status-badge ${balanceClass}">${s.netWaterBalanceMm >= 0 ? "Surplus" : "Deficit"}</span></div>
      </div>
      <div class="panel-card">
        <h4>Longest Dry Spell</h4>
        <div class="value">${s.maxDrySpellDays} <span style="font-size:16px;color:#67707b">days</span></div>
        <div class="subtext">Consecutive days rain &lt; 1.0mm</div>
      </div>
    `;

    waterTrendMessage.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <b>Water Trajectory Assessment:</b>
        <span class="status-badge" style="background:${s.trajectoryColor}22;color:${s.trajectoryColor}">${s.moistureTrajectory}</span>
      </div>
      <p style="margin:6px 0 0 0">${s.statusMessage}</p>
    `;

    renderWaterTrendChart(wt);
  } catch (err) {
    waterTrendMessage.innerHTML = `<span style="color:#a52e22">Could not load water trend: ${err.message}</span>`;
  }
}

async function init() {
  const farm = getFarmLocation();
  subtext.textContent = `Gridded NASA POWER & EOSDIS observations for ${farm.name || "Farm"} (${farm.lat.toFixed(4)}°N, ${farm.lon.toFixed(4)}°E)`;

  // Mount Leaflet satellite vegetation map (NDVI, EVI, True Color)
  mountMap("map", farm.lat, farm.lon, ["ndvi", "evi", "trueColor"]);

  // Set up 60+ days range button listeners
  rangeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      rangeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const d = parseInt(btn.dataset.days, 10);
      loadWaterTrend(farm.lat, farm.lon, d);
    });
  });

  try {
    // Parallel fetch all data: soil, vegetation (numerical NDVI), water trend, and terrain
    const [soilData, vegData, terrainData] = await Promise.all([
      getSoil(farm.lat, farm.lon, 14),
      getVegetation(farm.lat, farm.lon),
      getTerrain(farm.lat, farm.lon),
    ]);

    const s = soilData.summary;

    // 1. Overview Metrics Grid
    const rootState = (s.latestRoot ?? 0) < 0.35 ? "badge-warn" : (s.latestRoot ?? 0) > 0.8 ? "badge-info" : "badge-optimal";
    const vegClass = vegData.ratingClass === "dense" || vegData.ratingClass === "good" ? "badge-optimal" : "badge-warn";

    metrics.innerHTML =
      metricCard(
        "Root-Zone Wetness (0–100cm)",
        pct(s.latestRoot),
        `14-day avg: ${pct(s.avgRoot)}`,
        `<span class="status-badge ${rootState}">Root Zone</span>`
      ) +
      metricCard("Surface Wetness (0–5cm)", pct(s.latestSurface), `14-day avg: ${pct(s.avgSurface)}`) +
      metricCard("Profile Soil Wetness", pct(s.latestProfile), `14-day avg: ${pct(s.avgProfile)}`) +
      metricCard(
        "Numerical NDVI Score",
        show(vegData.ndvi, "", 2),
        `EVI: ${show(vegData.evi, "", 2)} · ${vegData.biomassPct}% Biomass`,
        `<span class="status-badge ${vegClass}">${vegData.rating.split("/")[0].trim()}</span>`
      ) +
      metricCard(
        "Terrain Elevation",
        terrainData.elevationM != null ? `${terrainData.elevationM} m` : show(soilData.location.elevationM, " m"),
        `${terrainData.elevationFt} ft · ${terrainData.altitudeZone.split("·")[0].trim()}`
      ) +
      metricCard(
        "Terrain Slope",
        `${terrainData.slopePct}%`,
        `Angle: ${terrainData.slopeDeg}° · ${terrainData.aspect}`,
        `<span class="status-badge badge-info">${terrainData.slopeClass.split("·")[0].trim()}</span>`
      );

    // 2. Soil Status Banner
    status.className = "notice";
    status.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:22px">🌱</span>
        <div>
          <b>NASA Root Zone Assessment:</b> ${s.soilStatus}
          <div style="font-size:12px;color:#4a5a72;margin-top:4px">
            14-Day Cumulative Rain: <b>${show(s.totalRainMm, " mm", 0)}</b> | Evaporation: <b>${show(s.totalEvapMm, " mm", 0)}</b> | Net Balance: <b>${s.waterBalanceStatus}</b>
          </div>
        </div>
      </div>
    `;

    // 3. Numerical NDVI & EVI Section
    vegBadge.innerHTML = `
      <span class="status-badge" style="background:${vegData.ratingColor}22;color:${vegData.ratingColor}">
        ${vegData.rating}
      </span>
    `;
    ndviValue.textContent = show(vegData.ndvi, "", 2);
    ndviScoreBadge.textContent = `${vegData.biomassPct}% Canopy Biomass`;
    ndviGaugeFill.style.width = `${Math.min(100, Math.max(5, (vegData.ndvi / 0.85) * 100))}%`;
    ndviGaugeFill.style.backgroundColor = vegData.ratingColor;
    ndviInterpretation.textContent = vegData.interpretation;

    eviValue.textContent = show(vegData.evi, "", 2);
    eviScoreBadge.textContent = "MODIS 250m";
    eviGaugeFill.style.width = `${Math.min(100, Math.max(5, (vegData.evi / 0.6) * 100))}%`;

    // 4. Terrain Section
    terrainBadge.innerHTML = `
      <span class="status-badge badge-info">Erosion Risk: ${terrainData.erosionRisk}</span>
    `;

    terrainMetrics.innerHTML = `
      <div class="panel-card">
        <h4>Elevation</h4>
        <div class="value">${terrainData.elevationM} <span style="font-size:16px;color:#67707b">m</span></div>
        <div class="subtext">${terrainData.elevationFt} feet above sea level</div>
      </div>
      <div class="panel-card">
        <h4>Slope Gradient</h4>
        <div class="value">${terrainData.slopePct} <span style="font-size:16px;color:#67707b">%</span></div>
        <div class="subtext">Angle: ${terrainData.slopeDeg}° (${terrainData.slopeClass.split("·")[0]})</div>
      </div>
      <div class="panel-card">
        <h4>Downslope Aspect</h4>
        <div class="value" style="font-size:22px">${terrainData.aspect}</div>
        <div class="subtext">Primary surface runoff orientation</div>
      </div>
      <div class="panel-card">
        <h4>Erosion Hazard</h4>
        <div class="value" style="font-size:22px">${terrainData.erosionRisk}</div>
        <div class="subtext">${terrainData.drainageClass}</div>
      </div>
    `;

    terElev.textContent = `${terrainData.elevationM} m (${terrainData.elevationFt} ft) · ${terrainData.altitudeZone}`;
    terSlopePct.textContent = `${terrainData.slopePct}% grade`;
    terSlopeDeg.textContent = `${terrainData.slopeDeg} degrees`;
    terAspect.textContent = terrainData.aspect;
    terDrainage.textContent = terrainData.drainageClass;

    terRecommendations.innerHTML = terrainData.recommendations.map((r) => `<li>${r}</li>`).join("");

    // 5. Initial 90-day Water Trend
    loadWaterTrend(farm.lat, farm.lon, 90);

    // 6. 14-day Observation Table
    soilDateRange.textContent = `Period: ${shortDate(soilData.daily[0]?.date)} – ${shortDate(soilData.daily.at(-1)?.date)}`;

    tableBody.innerHTML = soilData.daily
      .slice()
      .reverse()
      .map((r) => {
        const balSign = (r.waterBalanceMm ?? 0) >= 0 ? "+" : "";
        const balColor = (r.waterBalanceMm ?? 0) >= 0 ? "#1b6928" : "#c44d00";

        return `
          <tr>
            <td><b>${shortDate(r.date)}</b></td>
            <td>${pct(r.surface)}</td>
            <td><b>${pct(r.root)}</b></td>
            <td>${pct(r.profile)}</td>
            <td>${show(r.rainMm, " mm")}</td>
            <td>${show(r.evapMm, " mm")}</td>
            <td style="color:${balColor};font-weight:600">${balSign}${show(r.waterBalanceMm, " mm")}</td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    status.innerHTML = `<span style="color:#a52e22">Could not load soil data: ${err.message}</span>`;
  }
}

init();
