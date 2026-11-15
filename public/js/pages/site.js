import { api, escapeHTML, fmt } from '../api.js';
import { getCurrentUser } from '../auth.js';

// Show "Go to dashboard" when already signed in.
if (getCurrentUser()) {
  for (const id of ['navCta', 'heroCta']) { const a = document.getElementById(id); if (a) { a.href = '/dashboard'; a.textContent = id === 'navCta' ? 'Open dashboard' : 'Open my dashboard'; } }
}

// Live NASA preview, fixed location (Kuantan). Real data fetched through the server; no placeholder numbers.

const body = document.getElementById('readoutBody');
const dot = document.getElementById('liveDot');
const locationName = document.getElementById('locationName');

function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => resolve({
        lat: position.coords.latitude,
        lon: position.coords.longitude
      }),
      error => reject(new Error(error.message)),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}

async function loadNASA() {
  try {
    dot.textContent = 'Detecting location...';

    const { lat, lon } = await detectLocation();

   locationName.textContent = 'Finding location name...';

try {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?` +
    `lat=${encodeURIComponent(lat)}&` +
    `lon=${encodeURIComponent(lon)}&` +
    `format=json&addressdetails=1&zoom=10`,
    {
      headers: {
        'Accept-Language': 'en'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Location lookup failed');
  }

  const data = await response.json();
  const address = data.address || {};

  const city =
    address.city ||
    address.town ||
    address.municipality ||
    address.district ||
    address.county ||
    address.village;

  const state = address.state;

  locationName.textContent =
    [city, state].filter(Boolean).join(', ') ||
    'Location unavailable';

} catch (error) {
  console.error('Reverse geocoding error:', error);

  locationName.textContent =
    `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
}

    dot.textContent = 'Fetching NASA data...';

    const d = await api(
      `/api/public/nasa-snapshot?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    );

    const l = d.summary.last30;
    const rec = d.records.slice(-30);

    const max = Math.max(
      5,
      ...rec.map(r => r.rain ?? 0)
    );

    const bars = rec.map((r, i) => {
      const height = ((r.rain ?? 0) / max) * 58;

      return `<rect
        x="${i * 10 + 1}"
        width="8"
        rx="2"
        y="${60 - height}"
        height="${Math.max(1, height)}"
        fill="#5aa6ea"
      />`;
    }).join('');

    body.innerHTML = `
      <div class="readout-grid">
        <div>
          <b>${fmt(l.meanTempC, 1, '°C')}</b>
          <span>average temperature</span>
        </div>
        <div>
          <b>${fmt(l.totalRainMm, 0, ' mm')}</b>
          <span>rain, last 30 days</span>
        </div>
        <div>
          <b>${l.meanSoilRootWetness == null
            ? 'n/a'
            : Math.round(l.meanSoilRootWetness * 100) + '%'}</b>
          <span>root-zone soil wetness</span>
        </div>
        <div>
          <b>${d.elevationM == null
            ? 'n/a'
            : Math.round(d.elevationM) + ' m'}</b>
          <span>elevation</span>
        </div>
      </div>

      <svg class="spark"
        viewBox="0 0 300 62"
        preserveAspectRatio="none">
        ${bars}
      </svg>

      <p class="src">
        NASA POWER daily data,
        ${escapeHTML(d.summary.from)}
        to ${escapeHTML(d.summary.to)}.
        ${d.stale ? 'Older cached observations. ' : ''}
        <a href="${escapeHTML(d.requestUrl)}"
           target="_blank" rel="noopener">
          See NASA request
        </a>
      </p>
    `;

    dot.textContent = d.stale
      ? 'Saved NASA data (stale)'
      : d.cached
        ? 'NASA data (cached)'
        : 'NASA data fetched';

  } catch (error) {
    dot.textContent = 'Location or NASA unavailable';
    dot.classList.add('off');

    locationName.textContent = 'Location unavailable';

    body.innerHTML = `
      <p class="err">
        ${escapeHTML(error.message)}
      </p>
      <p>Please allow location access and reload.</p>
    `;
  }
}

loadNASA();
