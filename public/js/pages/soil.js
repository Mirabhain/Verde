import { getFarmLocation, getSoil, mountMap, shortDate, show } from "../nasa-api.js";

const metrics = document.getElementById("soilMetrics");
const status = document.getElementById("soilStatus");
const table = document.getElementById("soilTable");

// Starting thresholds, adjust with local agronomy advice
function wetnessStatus(v) {
  if (v == null) return "No recent soil data. Check again later.";
  if (v < 0.3) return "Root zone is dry. Consider irrigating soon.";
  if (v > 0.8) return "Root zone is very wet. Watch drainage and nutrient leaching.";
  return "Root zone moisture is adequate.";
}

const card = (label, value) =>
  `<div class="panel"><span class="muted">${label}</span><div class="score">${value}</div></div>`;

async function init() {
  const farm = getFarmLocation();
  mountMap("map", farm.lat, farm.lon, ["ndvi", "evi", "trueColor"]);

  try {
    const d = await getSoil(farm.lat, farm.lon, 14);
    const s = d.summary;
    const pct = (v) => (v == null ? "n/a" : `${Math.round(v * 100)}%`);

    metrics.innerHTML =
      card("Root zone wetness (latest)", pct(s.latestRoot)) +
      card("Surface wetness (latest)", pct(s.latestSurface)) +
      card("Rainfall, 14 days", show(s.totalRainMm, " mm", 0));
    status.textContent = wetnessStatus(s.latestRoot);

    table.innerHTML =
      "<thead><tr><th>Date</th><th>Surface</th><th>Root zone</th><th>Profile</th><th>Rain</th></tr></thead><tbody>" +
      d.daily
        .slice()
        .reverse()
        .map(
          (r) => `<tr><td>${shortDate(r.date)}</td><td>${pct(r.surface)}</td><td>${pct(r.root)}</td>
            <td>${pct(r.profile)}</td><td>${show(r.rainMm, " mm")}</td></tr>`
        )
        .join("") +
      "</tbody>";
  } catch (err) {
    status.textContent = `Could not load soil data: ${err.message}`;
  }
}

init();