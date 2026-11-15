import { ready } from '../layout.js';
import { getNasaDaily, escapeHTML, fmt } from '../api.js';
import { getTasks } from '../storage.js';
import { cropName } from '/data/crops.js';
import { dailyChart } from '../charts.js';

const { user, farm } = await ready;
const $ = (s) => document.querySelector(s);
$('#hello').textContent = `Salam, ${user.name.split(' ')[0]}`;
const body = $('#dashBody');

if (!farm) {
  body.innerHTML = `<div class="empty"><h3>Add your farm to get started</h3><p>VerdeAI needs your farm location and crops to read NASA data and compare rotations.</p><a class="btn btn-primary" href="/farm">Add my farm</a></div>`;
} else {
  $('#helloSub').textContent = `${farm.name}${farm.state ? ', ' + farm.state : ''}: live NASA observations for your pin.`;
  body.innerHTML = `
    <div class="grid g4" id="metrics">${'<div class="panel"><div class="skeleton" style="height:64px"></div></div>'.repeat(4)}</div>
    <div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);margin-top:18px;align-items:start" id="lower">
      <section class="panel"><h2>Last 60 days at your farm</h2><div class="chart-box"><canvas id="miniChart" aria-label="Daily rainfall and temperature from NASA"></canvas></div><p class="fine" id="src" style="margin-top:10px"></p></section>
      <div class="grid">
        <section class="panel"><h2>Farm profile</h2>
          <dl class="kv">
            <dt>Current crop</dt><dd>${escapeHTML(cropName(farm.crop))}</dd>
            <dt>Previous crop</dt><dd>${escapeHTML(cropName(farm.previous))}</dd>
            <dt>Size</dt><dd>${escapeHTML(farm.size)} ha</dd>
            <dt>Soil</dt><dd>${escapeHTML(farm.soil || 'Not set')}</dd>
            <dt>Pin</dt><dd>${Number(farm.lat).toFixed(3)}, ${Number(farm.lon).toFixed(3)}</dd>
          </dl>
          <a class="btn btn-outline btn-sm" style="margin-top:14px" href="/farm">Edit farm</a>
        </section>
        <section class="panel"><h2>Next activities</h2><div id="upcoming"></div></section>
      </div>
    </div>
    <div id="dashNotice"></div>`;

  const today = new Date().toISOString().slice(0, 10);
  const next = getTasks().filter((t) => t.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  $('#upcoming').innerHTML = next.length
    ? next.map((t) => `<div class="task"><span><b>${escapeHTML(t.date)}</b> ${escapeHTML(t.task)}</span></div>`).join('')
    : '<p class="muted">Nothing planned. <a href="/calendar">Add an activity</a>.</p>';

  try {
    const d = await getNasaDaily(farm);
    const l = d.summary.last30;
    $('#metrics').innerHTML = `
      <div class="panel metric navy"><h4>Temperature, last 30 days</h4><b>${fmt(l.meanTempC, 1, '°C')}</b><small>average</small></div>
      <div class="panel metric sky"><h4>Rainfall, last 30 days</h4><b>${fmt(l.totalRainMm, 0, ' mm')}</b><small>total</small></div>
      <div class="panel metric leaf"><h4>Root-zone soil wetness</h4><b>${l.meanSoilRootWetness === null ? 'n/a' : Math.round(l.meanSoilRootWetness * 100) + '%'}</b><small>of saturation, NASA estimate</small></div>
      <div class="panel metric"><h4>Elevation of pin</h4><b>${d.elevationM === null ? 'n/a' : Math.round(d.elevationM) + ' m'}</b><small>NASA terrain model</small></div>`;
    dailyChart($('#miniChart'), d.records.slice(-60));
    $('#src').textContent = `NASA POWER daily data, ${d.summary.from} to ${d.summary.to}. Area estimates, not farm sensors.`;
    if (d.stale) $('#dashNotice').innerHTML = `<p class="notice warn" style="margin-top:18px">${escapeHTML(d.warning)}</p>`;
  } catch (e) {
    $('#metrics').innerHTML = `<div class="notice err" style="grid-column:1/-1"><b>Could not load NASA data.</b> ${escapeHTML(e.message)} <button class="btn btn-outline btn-sm" id="retry" style="margin-left:10px">Try again</button></div>`;
    $('#retry').addEventListener('click', () => location.reload());
    $('#lower .chart-box').innerHTML = '<p class="muted">The chart appears when NASA data loads.</p>';
  }
}
