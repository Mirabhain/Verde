import {
  getFarmLocation, getWeather, getForecast, getTerrain, mountMap, shortDate, show,
} from "../nasa-api.js";

const $ = (id) => document.getElementById(id);
const COLORS = { red: "#c0462b", green: "#2e8537", blue: "#2f6fb0", gold: "#f5ac2d" };

const fcShort = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`; // forecast dates are YYYY-MM-DD
const padObs = (arr, nFc) => [...arr, ...Array(nFc).fill(null)];
const padFc = (arr, nObs) => [...Array(nObs).fill(null), ...arr];

function card(label, value) {
  return `<div class="panel"><span class="muted">${label}</span><div class="score">${value}</div></div>`;
}

function makeChart(canvasId, config) {
  const canvas = $(canvasId);
  Chart.getChart(canvas)?.destroy();
  return new Chart(canvas, config);
}

const baseOptions = (yTitle) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: { legend: { position: "bottom" } },
  scales: { y: { title: { display: true, text: yTitle } } },
});

function line(label, data, color, extra = {}) {
  return {
    type: "line", label, data,
    borderColor: color, backgroundColor: color,
    borderWidth: 2, pointRadius: 3, tension: 0.25, spanGaps: false,
    ...extra,
  };
}

function drawCharts(weather, forecast) {
  const obs = weather?.daily ?? [];
  const fc = forecast?.daily ?? [];
  const nObs = obs.length;
  const nFc = fc.length;
  const labels = [...obs.map((r) => shortDate(r.date)), ...fc.map((r) => fcShort(r.date))];

  // Temperature: observed (NASA POWER) and forecast (Open-Meteo) on one axis
  makeChart("chartTemp", {
    data: {
      labels,
      datasets: [
        line("Max, observed", padObs(obs.map((r) => r.maxC), nFc), COLORS.red),
        line("Average, observed", padObs(obs.map((r) => r.tempC), nFc), COLORS.green),
        line("Min, observed", padObs(obs.map((r) => r.minC), nFc), COLORS.blue),
        line("Max, forecast", padFc(fc.map((r) => r.maxC), nObs), COLORS.red, { borderDash: [6, 4] }),
        line("Min, forecast", padFc(fc.map((r) => r.minC), nObs), COLORS.blue, { borderDash: [6, 4] }),
      ],
    },
    options: baseOptions("°C"),
  });

  // Rainfall: one bar per day, green for observed, blue for forecast
  makeChart("chartRain", {
    data: {
      labels,
      datasets: [
        { type: "bar", label: "Rain, observed (mm)", data: padObs(obs.map((r) => r.rainMm), nFc), backgroundColor: COLORS.green },
        { type: "bar", label: "Rain, forecast (mm)", data: padFc(fc.map((r) => r.rainMm), nObs), backgroundColor: COLORS.blue },
      ],
    },
    options: {
      ...baseOptions("mm"),
      scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: "mm" } } },
    },
  });

  // Humidity and solar radiation, observed only, two axes
  makeChart("chartHum", {
    data: {
      labels: obs.map((r) => shortDate(r.date)),
      datasets: [
        line("Humidity (%)", obs.map((r) => r.humidityPct), COLORS.blue, { yAxisID: "y" }),
        line("Solar radiation (MJ per m2 per day)", obs.map((r) => r.solarMJ), COLORS.gold, { yAxisID: "y1" }),
      ],
    },
    options: {
      ...baseOptions("%"),
      scales: {
        y: { title: { display: true, text: "Humidity %" } },
        y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "MJ per m2" } },
      },
    },
  });
}

function table(el, head, rows) {
  el.innerHTML =
    `<thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>` +
    rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("") +
    "</tbody>";
}

function drawTables(weather, forecast) {
  table(
    $("weatherTable"),
    ["Date", "Avg", "Min / Max", "Rain", "Humidity", "Wind", "Solar"],
    (weather?.daily ?? []).slice().reverse().map((r) => [
      shortDate(r.date), show(r.tempC, " °C"), `${show(r.minC, "", 0)} / ${show(r.maxC, " °C", 0)}`,
      show(r.rainMm, " mm"), show(r.humidityPct, "%", 0), show(r.windMs, " m/s"), show(r.solarMJ, "", 1),
    ])
  );
  table(
    $("forecastTable"),
    ["Date", "Min / Max", "Rain", "Rain chance"],
    (forecast?.daily ?? []).map((r) => [
      fcShort(r.date), `${show(r.minC, "", 0)} / ${show(r.maxC, " °C", 0)}`, show(r.rainMm, " mm"), show(r.rainProbPct, "%", 0),
    ])
  );
}

function drawTerrain(t) {
  $("terrainBox").innerHTML = t
    ? `<p><b>Elevation:</b> ${show(t.elevationM, " m", 0)}<br>
       <b>Slope:</b> ${show(t.slopePct, "%")} (${show(t.slopeDeg, "°")}), classed as ${t.slopeClass}</p>
       <p class="muted">Source: ${t.source}. Slope is averaged over roughly 450 m around the pin.</p>`
    : `<p class="muted">Terrain data is unavailable.</p>`;
}

async function init() {
  const farm = getFarmLocation();
  const [w, f, t] = await Promise.allSettled([
    getWeather(farm.lat, farm.lon, 14),
    getForecast(farm.lat, farm.lon),
    getTerrain(farm.lat, farm.lon),
  ]);
  const weather = w.status === "fulfilled" ? w.value : null;
  const forecast = f.status === "fulfilled" ? f.value : null;
  const terrain = t.status === "fulfilled" ? t.value : null;

  const errors = [w, f, t].filter((r) => r.status === "rejected").map((r) => r.reason.message);
  $("weatherErrors").innerHTML = errors.length
    ? `<div class="notice error">${errors.join("<br>")}</div>` : "";

  const s = weather?.summary;
  $("nasaMetrics").innerHTML =
    card("Average temperature, last 14 days", show(s?.avgTempC, " °C")) +
    card("Rainfall, last 14 days", show(s?.totalRainMm, " mm", 0)) +
    card("Rainy days", s ? `${s.rainyDays} of ${s.daysWithData}` : "n/a") +
    card("Forecast rain, next 7 days", show(forecast?.summary?.totalRainMm, " mm", 0)) +
    card("Elevation", show(terrain?.elevationM, " m", 0)) +
    card("Slope", terrain ? `${show(terrain.slopePct, "%")} (${terrain.slopeClass})` : "n/a");

  if (typeof Chart === "undefined") {
    $("weatherErrors").innerHTML += `<div class="notice error">Chart.js is not loaded. Check the script tag in the page.</div>`;
  } else {
    drawCharts(weather, forecast);
  }
  drawTables(weather, forecast);
  drawTerrain(terrain);
  $("rawJson").textContent = JSON.stringify({ weather, forecast, terrain }, null, 2);
  $("weatherNote").textContent =
    `Observed values: NASA POWER, latest ${s?.lastDataDate ? shortDate(s.lastDataDate) : "n/a"}. ` +
    `Forecast: Open-Meteo, not NASA. POWER cannot predict, and its newest days can be missing.`;

  try {
    mountMap("map", farm.lat, farm.lon, ["trueColor", "lst", "ndvi"], { power: { summary: s, forecast } });
  } catch (err) {
    $("weatherErrors").innerHTML += `<div class="notice error">Map error: ${err.message}</div>`;
  }
}

init();