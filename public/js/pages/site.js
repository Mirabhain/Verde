import { api, escapeHTML, fmt } from '../api.js';
import { getCurrentUser } from '../auth.js';

// Show "Go to dashboard" when already signed in.
if (getCurrentUser()) {
  for (const id of ['navCta', 'heroCta']) { const a = document.getElementById(id); if (a) { a.href = '/dashboard'; a.textContent = id === 'navCta' ? 'Open dashboard' : 'Open my dashboard'; } }
}

// Live NASA preview, fixed location (Kuantan). Real data fetched through the server; no placeholder numbers.
const body = document.getElementById('readoutBody');
const dot = document.getElementById('liveDot');
try {
  const d = await api('/api/public/nasa-snapshot');
  const l = d.summary.last30;
  const rec = d.records.slice(-30);
  const max = Math.max(5, ...rec.map((r) => r.rain));
  const bars = rec.map((r, i) => `<rect x="${i * 10 + 1}" width="8" rx="2" y="${60 - (r.rain / max) * 58}" height="${Math.max(1, (r.rain / max) * 58)}" fill="#5aa6ea"/>`).join('');
  body.innerHTML = `
    <div class="readout-grid">
      <div><b>${fmt(l.meanTempC, 1, '°C')}</b><span>average temperature</span></div>
      <div><b>${fmt(l.totalRainMm, 0, ' mm')}</b><span>rain, last 30 days</span></div>
      <div><b>${l.meanSoilRootWetness === null ? 'n/a' : Math.round(l.meanSoilRootWetness * 100) + '%'}</b><span>root-zone soil wetness</span></div>
      <div><b>${d.elevationM === null ? 'n/a' : Math.round(d.elevationM) + ' m'}</b><span>elevation</span></div>
    </div>
    <svg class="spark" viewBox="0 0 300 62" preserveAspectRatio="none" role="img" aria-label="Daily rainfall, last 30 days">${bars}</svg>
    <p class="src">NASA POWER daily data, ${escapeHTML(d.summary.from)} to ${escapeHTML(d.summary.to)}. <a href="${escapeHTML(d.requestUrl)}" target="_blank" rel="noopener">See the NASA request</a></p>`;
  dot.textContent = 'Live from NASA';
} catch (e) {
  dot.textContent = 'NASA not reachable'; dot.classList.add('off');
  body.innerHTML = `<p class="err">Could not load NASA data right now. ${escapeHTML(e.message)}</p>`;
}
