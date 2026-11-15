import { getFarmLocation, getWeather, mountMap, shortDate, show } from "../nasa-api.js";

const metrics = document.getElementById("nasaMetrics");
const table = document.getElementById("weatherTable");
const note = document.getElementById("weatherNote");

function card(label, value) {
  return `<div class="panel"><span class="muted">${label}</span><div class="score">${value}</div></div>`;
}

async function init() {
  const farm = getFarmLocation();
  mountMap("map", farm.lat, farm.lon, ["trueColor", "ndvi"]);

  try {
    const w = await getWeather(farm.lat, farm.lon, 14);
    const s = w.summary;
    metrics.innerHTML =
      card("Average temperature", show(s.avgTempC, " °C")) +
      card("Rainfall, 14 days", show(s.totalRainMm, " mm", 0)) +
      card("Rainy days", `${s.rainyDays} of ${s.daysWithData}`);

    table.innerHTML =
      "<thead><tr><th>Date</th><th>Temp</th><th>Min / Max</th><th>Rain</th><th>Humidity</th><th>Wind</th></tr></thead><tbody>" +
      w.daily
        .slice()
        .reverse()
        .map(
          (r) => `<tr><td>${shortDate(r.date)}</td><td>${show(r.tempC, " °C")}</td>
            <td>${show(r.minC, "", 0)} / ${show(r.maxC, " °C", 0)}</td><td>${show(r.rainMm, " mm")}</td>
            <td>${show(r.humidityPct, "%", 0)}</td><td>${show(r.windMs, " m/s")}</td></tr>`
        )
        .join("") +
      "</tbody>";

    note.textContent = `Source: NASA POWER. Latest data: ${s.lastDataDate ? shortDate(s.lastDataDate) : "n/a"}. Recent days can be missing.`;
  } catch (err) {
    metrics.innerHTML = `<div class="notice">Could not load weather data: ${err.message}</div>`;
  }
}

init();