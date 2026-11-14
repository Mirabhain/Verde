import { getFarm, saveWeather } from '../storage.js';
import { fetchNasaPower } from '../nasa-api.js';
import { drawWeatherChart } from '../chart.js';

const $ = s => document.querySelector(s);

$('#fetchNasaBtn').addEventListener('click', async () => {
  const btn = $('#fetchNasaBtn');

  btn.disabled = true;
  $('#nasaStatus').textContent =
    'Fetching historical NASA POWER observations...';

  try {
    const farm = getFarm();
    const nasa = await fetchNasaPower(Number(farm.lat), Number(farm.lon));
    saveWeather(farm, nasa);
    const r = nasa.records;
    const avg = k => r.reduce((s, x) => s + x[k], 0) / r.length;

    $('#nasaMetrics').innerHTML = `
      <article class="panel">
        <h4>Mean temperature</h4>
        <div class="score">${avg('temp').toFixed(1)}°C</div>
      </article>

      <article class="panel">
        <h4>Total rainfall</h4>
        <div class="score">${r.reduce((s, x) => s + x.rain, 0).toFixed(1)} mm</div>
      </article>

      <article class="panel">
        <h4>Mean humidity</h4>
        <div class="score">${avg('humidity').toFixed(1)}%</div>
      </article>
    `;

    drawWeatherChart($('#weatherChart'), r);

    $('#nasaStatus').textContent =
      `Loaded ${r.length} historical days (${nasa.start} to ${nasa.end}) for ${farm.name}.`;

    const a = document.createElement('a');
    a.href = nasa.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Open exact NASA request';

    $('#nasaSource').replaceChildren(
      document.createTextNode('NASA POWER daily point API · '),
      a
    );
  } catch (e) {
    $('#nasaStatus').textContent = 'Error: ' + e.message;
    $('#nasaMetrics').replaceChildren();
    drawWeatherChart($('#weatherChart'), []);
  } finally {
    btn.disabled = false;
  }
});