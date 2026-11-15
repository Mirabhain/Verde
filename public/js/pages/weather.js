import { getFarmLocation, getWeather, getTerrain, mountMap, shortDate, show } from "../nasa-api.js";

const metrics = document.getElementById("nasaMetrics");
const tableBody = document.querySelector("#weatherTable tbody");
const note = document.getElementById("weatherNote");
const subtext = document.getElementById("wxSub");
const heatBadge = document.getElementById("heatStressBadge");
const heatStats = document.getElementById("heatStressStats");
const heatAdvisory = document.getElementById("heatStressAdvisory");
const waterBadge = document.getElementById("waterBalanceBadge");
const terrainBadge = document.getElementById("terrainQuickBadge");
const tableDateRange = document.getElementById("tableDateRange");

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

function getHeatBadge(level) {
  switch (level) {
    case "Severe":
      return '<span class="status-badge badge-severe">Severe Stress</span>';
    case "Moderate":
      return '<span class="status-badge badge-warn">Moderate Stress</span>';
    case "Mild":
      return '<span class="status-badge badge-mild">Mild Stress</span>';
    default:
      return '<span class="status-badge badge-optimal">Optimal / Normal</span>';
  }
}

let heatChartInst = null;
let waterChartInst = null;

function renderCharts(daily) {
  if (typeof Chart === "undefined") return;

  const labels = daily.map((r) => shortDate(r.date));

  // 1. Heat Stress & Temperature Chart
  const ctxHeat = document.getElementById("heatChart")?.getContext("2d");
  if (ctxHeat) {
    if (heatChartInst) heatChartInst.destroy();
    heatChartInst = new Chart(ctxHeat, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Heat Index (°C)",
            data: daily.map((r) => r.heatIndexC),
            borderColor: "#c92a2a",
            backgroundColor: "rgba(201, 42, 42, 0.1)",
            fill: true,
            tension: 0.3,
            borderWidth: 2.5,
            pointRadius: 3,
            yAxisID: "y",
          },
          {
            label: "Max Temp (°C)",
            data: daily.map((r) => r.maxC),
            borderColor: "#e06714",
            borderDash: [4, 4],
            tension: 0.2,
            borderWidth: 2,
            pointRadius: 0,
            yAxisID: "y",
          },
          {
            label: "Min Temp (°C)",
            data: daily.map((r) => r.minC),
            borderColor: "#2e8537",
            borderDash: [2, 2],
            tension: 0.2,
            borderWidth: 1.5,
            pointRadius: 0,
            yAxisID: "y",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { grid: { display: false } },
          y: {
            title: { display: true, text: "Temperature / Heat Index (°C)" },
            suggestedMin: 22,
            suggestedMax: 44,
          },
        },
        plugins: {
          legend: { position: "top", labels: { boxWidth: 14 } },
        },
      },
    });
  }

  // 2. Rainfall vs Evaporation Chart
  const ctxWater = document.getElementById("waterChart")?.getContext("2d");
  if (ctxWater) {
    if (waterChartInst) waterChartInst.destroy();
    waterChartInst = new Chart(ctxWater, {
      data: {
        labels,
        datasets: [
          {
            type: "bar",
            label: "Rainfall (mm/day)",
            data: daily.map((r) => r.rainMm),
            backgroundColor: "rgba(31, 111, 196, 0.65)",
            borderColor: "#1f6fc4",
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: "y",
          },
          {
            type: "bar",
            label: "Evaporation (mm/day)",
            data: daily.map((r) => r.evapMm),
            backgroundColor: "rgba(230, 161, 0, 0.65)",
            borderColor: "#e6a100",
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: "y",
          },
          {
            type: "line",
            label: "Daily Water Balance (mm)",
            data: daily.map((r) => r.waterBalanceMm),
            borderColor: "#2e8537",
            backgroundColor: "#2e8537",
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 2,
            yAxisID: "y",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { grid: { display: false } },
          y: {
            title: { display: true, text: "Millimeters (mm)" },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: { position: "top", labels: { boxWidth: 14 } },
        },
      },
    });
  }
}

async function init() {
  const farm = getFarmLocation();
  subtext.textContent = `Observations for ${farm.name || "Farm"} (${farm.lat.toFixed(4)}°N, ${farm.lon.toFixed(4)}°E)`;

  // Mount Leaflet satellite map with GIBS TrueColor, NDVI, and EVI
  mountMap("map", farm.lat, farm.lon, ["trueColor", "ndvi", "evi"]);

  try {
    // Parallel fetch weather and terrain data
    const [w, terrain] = await Promise.all([
      getWeather(farm.lat, farm.lon, 14),
      getTerrain(farm.lat, farm.lon).catch(() => null),
    ]);

    const s = w.summary;
    const hs = s.heatStress || {};

    // 1. Primary Metrics Grid
    const balanceSign = s.netWaterBalanceMm >= 0 ? "+" : "";
    const balanceClass = s.netWaterBalanceMm >= 0 ? "badge-optimal" : "badge-warn";

    metrics.innerHTML =
      metricCard("Average Temperature", show(s.avgTempC, " °C"), `Min ${show(s.avgMinC, "°C")} / Max ${show(s.avgMaxC, "°C")}`) +
      metricCard("Rainfall (14 Days)", show(s.totalRainMm, " mm", 0), `${s.rainyDays} rainy days out of ${s.daysWithData}`) +
      metricCard("Evaporation (14 Days)", show(s.totalEvapMm, " mm", 0), `Avg ${show(s.avgEvapMm, " mm/day", 1)} loss`) +
      metricCard(
        "Net Water Balance",
        `${balanceSign}${show(s.netWaterBalanceMm, " mm")}`,
        s.netWaterBalanceMm >= 0 ? "Cumulative surplus" : "Cumulative deficit",
        `<span class="status-badge ${balanceClass}">${s.netWaterBalanceMm >= 0 ? "Surplus" : "Deficit"}</span>`
      ) +
      metricCard(
        "Heat Stress Risk",
        hs.riskLevel || "Low",
        `Max Heat Index: ${show(hs.maxHeatIndex, " °C")}`,
        getHeatBadge(hs.riskLevel)
      ) +
      metricCard(
        "Terrain Elevation",
        terrain?.elevationM != null ? `${terrain.elevationM} m` : show(w.location.elevationM, " m", 0),
        terrain?.slopePct != null ? `Slope: ${terrain.slopePct}% (${terrain.slopeDeg}°)` : w.location.altitudeZone
      );

    // 2. Heat Stress Section
    heatBadge.innerHTML = getHeatBadge(hs.riskLevel);
    heatStats.innerHTML = `
      <div class="panel-card">
        <h4>Current Heat Index</h4>
        <div class="value">${show(hs.currentHeatIndex, " °C")}</div>
        <div class="subtext">Feels-like thermal load</div>
      </div>
      <div class="panel-card">
        <h4>Peak Heat Index</h4>
        <div class="value">${show(hs.maxHeatIndex, " °C")}</div>
        <div class="subtext">Highest recorded in 14 days</div>
      </div>
      <div class="panel-card">
        <h4>Heat Stress Days</h4>
        <div class="value">${hs.heatStressDays} <span style="font-size:16px;color:#67707b">/ ${s.daysWithData}</span></div>
        <div class="subtext">Days with Heat Index ≥ 36°C</div>
      </div>
      <div class="panel-card">
        <h4>Night Thermal Stress</h4>
        <div class="value">${hs.nightStressDays} <span style="font-size:16px;color:#67707b">days</span></div>
        <div class="subtext">Nights with Min Temp ≥ 24.5°C</div>
      </div>
    `;

    const advisoryClass = hs.riskLevel === "Severe" ? "severe" : hs.riskLevel === "Moderate" ? "warn" : "";
    heatAdvisory.className = `advisory-box ${advisoryClass}`;
    heatAdvisory.innerHTML = `
      <b>Agro-climatic Advisory (${hs.riskLevel} Risk):</b> ${hs.advisory}
    `;

    // 3. Water Balance Badge
    waterBadge.innerHTML = `
      <span class="status-badge ${balanceClass}">
        ${s.netWaterBalanceMm >= 0 ? "Cumulative Surplus (+)" : "Cumulative Deficit (-)"}
      </span>
    `;

    // 4. Terrain quick badge
    if (terrain) {
      terrainBadge.innerHTML = `
        <span class="status-badge badge-info">Elevation: ${terrain.elevationM}m · Slope: ${terrain.slopePct}% (${terrain.slopeClass.split("·")[0]})</span>
      `;
    }

    // 5. Render charts
    renderCharts(w.daily);

    // 6. Observations Table
    tableDateRange.textContent = `Period: ${shortDate(w.daily[0]?.date)} – ${shortDate(w.daily.at(-1)?.date)}`;

    tableBody.innerHTML = w.daily
      .slice()
      .reverse()
      .map((r) => {
        const balSign = (r.waterBalanceMm ?? 0) >= 0 ? "+" : "";
        const balColor = (r.waterBalanceMm ?? 0) >= 0 ? "#1b6928" : "#c44d00";
        const stressBadge = getHeatBadge(r.heatStressClass === "severe" ? "Severe" : r.heatStressClass === "moderate" ? "Moderate" : r.heatStressClass === "mild" ? "Mild" : "Low");

        return `
          <tr>
            <td><b>${shortDate(r.date)}</b></td>
            <td>${show(r.tempC, " °C")}</td>
            <td>${show(r.minC, "", 0)} / ${show(r.maxC, " °C", 0)}</td>
            <td>${show(r.rainMm, " mm")}</td>
            <td>${show(r.evapMm, " mm")}</td>
            <td style="color:${balColor};font-weight:600">${balSign}${show(r.waterBalanceMm, " mm")}</td>
            <td>${show(r.humidityPct, "%", 0)}</td>
            <td><b>${show(r.heatIndexC, " °C")}</b></td>
            <td>${stressBadge}</td>
          </tr>
        `;
      })
      .join("");

    note.textContent = `Data sources: NASA POWER daily agroclimatology & MERRA-2 gridded observations. Latest reading: ${s.lastDataDate ? shortDate(s.lastDataDate) : "n/a"}. Coordinates: ${farm.lat.toFixed(4)}, ${farm.lon.toFixed(4)}.`;
  } catch (err) {
    metrics.innerHTML = `<div class="notice" style="background:#fde6e4;color:#b52216">Could not load weather data: ${err.message}</div>`;
  }
}

init();
