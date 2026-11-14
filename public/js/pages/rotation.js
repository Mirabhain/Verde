
import { rotationOptions } from '../rotation.js';
import { cropName, escapeHTML } from './shared.js';
import { getFarm, getWeather } from '../storage.js';

document.querySelector('#recommendBtn').addEventListener('click', () => {
const farm = getFarm();
document.querySelector('#currentRotation').textContent =
  `Current rotation: ${cropName(farm.previous)} → ${cropName(farm.crop)}`;
const weather = getWeather(farm);
const options = rotationOptions(farm, weather).slice(0,2);


  document.querySelector('#recommendations').innerHTML =
    options
      .map(o => `
        <article class="panel">
          <h4>${escapeHTML(o.label)}</h4>
          <div class="score">${o.score}/100</div>

          <p><b>${o.sequence.map(escapeHTML).join(' → ')}</b></p>
          <p><b>Why:</b> ${escapeHTML(o.reasons.join('; ') || 'Crop diversification')}</p>
          <p><b>Consideration:</b> ${escapeHTML(o.crop.note)}</p>
          <p class="fine">${escapeHTML(o.risk)}</p>
        </article>
      `)
      .join('') +
    `
      <p class="fine">
        Rule-based prototype scores; not validated success probabilities.
        Weather API observations are shown separately on Weather Analysis.
      </p>
    `;
});