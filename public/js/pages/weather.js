import { ready } from '../layout.js';
import { getNasaDaily, getNasaClimate, escapeHTML, fmt } from '../api.js';
import { dailyChart, soilChart, monthlyChart } from '../charts.js';
import { riskGridHTML, RISK_NOTE } from '../risk.js';

const { farm } = await ready;
const body = document.querySelector('#wxBody');
const btn = document.querySelector('#refreshBtn');

if (!farm) {
  btn.hidden = true;
  body.innerHTML = `<div class="empty"><h3>Set your farm location first</h3><p>NASA data is fetched for the pin on your farm.</p><a class="btn btn-primary" href="/farm">Add my farm</a></div>`;
} else load();

btn.addEventListener('click', () => { sessionStorage.clear(); load(); });

async function load() {
  btn.disabled = true;
  document.querySelector('#wxSub').textContent = `Real observations from NASA POWER for ${farm.name} (${Number(farm.lat).toFixed(3)}, ${Number(farm.lon).toFixed(3)}).`;
  body.innerHTML = '<div class="skeleton" style="height:200px"></div><p class="muted" style="margin-top:12px">Fetching NASA observations. This can take up to 30 seconds the first time.</p>';
  try {
    const [d, clim] = await Promise.all([getNasaDaily(farm), getNasaClimate(farm).catch((e) => ({ error: e.message }))]);
    const s = d.summary;
    const avail = new Set(d.availableParameters);
    body.innerHTML = `
      ${d.stale ? `<p class="notice warn" style="margin-bottom:16px">${escapeHTML(d.warning)}</p>` : ''}
      <div class="grid g4">
        <div class="panel metric navy"><h4>Average temperature</h4><b>${fmt(s.meanTempC, 1, '°C')}</b><small>max avg ${fmt(s.meanMaxTempC, 1, '°C')}</small></div>
        <div class="panel metric sky"><h4>Total rainfall</h4><b>${fmt(s.totalRainMm, 0, ' mm')}</b><small>${s.rainyDays} rainy days of ${s.days}</small></div>
        <div class="panel metric"><h4>Average humidity</h4><b>${fmt(s.meanHumidityPct, 0, '%')}</b><small>relative, 2 m</small></div>
        <div class="panel metric leaf"><h4>Root-zone soil wetness</h4><b>${s.meanSoilRootWetness === null ? 'n/a' : Math.round(s.meanSoilRootWetness * 100) + '%'}</b><small>${avail.has('EVLAND') ? 'evaporation ' + fmt(s.meanEvapMmDay, 1, ' mm/day') : 'of saturation'}</small></div>
      </div>
      <section class="panel" style="margin-top:18px"><h2>Daily rainfall and temperature</h2><div class="chart-box"><canvas id="cDaily" aria-label="Daily rainfall and temperature"></canvas></div></section>
      <div class="grid g2" style="margin-top:18px">
        <section class="panel"><h2>Soil wetness</h2><div class="chart-box sm" id="soilBox"><canvas id="cSoil" aria-label="Soil wetness"></canvas></div></section>
        <section class="panel"><h2>Other NASA variables</h2>
          <dl class="kv">
            <dt>Solar radiation</dt><dd>${fmt(s.meanSolarKwhM2, 1, ' kWh/m²/day')}</dd>
            <dt>Evaporation</dt><dd>${fmt(s.meanEvapMmDay, 1, ' mm/day')}</dd>
            <dt>Surface soil wetness</dt><dd>${s.meanSoilTopWetness === null ? 'n/a' : Math.round(s.meanSoilTopWetness * 100) + '%'}</dd>
            <dt>Terrain elevation</dt><dd>${d.elevationM === null ? 'n/a' : Math.round(d.elevationM) + ' m above sea level'}</dd>
            <dt>Period</dt><dd>${s.from} to ${s.to}</dd>
          </dl>
        </section>
      </div>
      <section class="panel" style="margin-top:18px"><h2>Typical year at your farm</h2>
        ${clim.error ? `<p class="notice err">${escapeHTML(clim.error)}</p>` : `
        <div class="chart-box"><canvas id="cMonthly" aria-label="Monthly average rainfall and temperature"></canvas></div>
        <h3 style="margin:22px 0 10px;font-size:17px">Wetter and drier months</h3>
        <div class="risk-grid">${riskGridHTML(clim.months)}</div>
        <p class="fine" style="margin-top:10px">${RISK_NOTE}</p>
        <p class="fine">Based on NASA POWER monthly averages, ${clim.years[0]} to ${clim.years.at(-1)}.</p>`}
      </section>
      <p class="notice" style="margin-top:18px">NASA POWER gives gridded satellite and model estimates for your area, not readings from sensors on your farm. Vegetation health and terrain slope need other NASA datasets (MODIS, SRTM) that are not included yet. Source: <a href="${escapeHTML(d.requestUrl)}" target="_blank" rel="noopener">exact NASA request</a>.</p>`;
    dailyChart(document.querySelector('#cDaily'), d.records);
    if (!soilChart(document.querySelector('#cSoil'), d.records)) document.querySelector('#soilBox').innerHTML = '<p class="muted">NASA did not return soil wetness for this location.</p>';
    if (!clim.error) monthlyChart(document.querySelector('#cMonthly'), clim.months);
  } catch (e) {
    body.innerHTML = `<div class="notice err"><b>Could not load NASA data.</b> ${escapeHTML(e.message)}</div><p style="margin-top:14px"><button class="btn btn-primary" id="retry">Try again</button></p>`;
    document.querySelector('#retry').addEventListener('click', load);
  } finally { btn.disabled = false; }
}
