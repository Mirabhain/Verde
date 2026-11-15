import { ready } from '../layout.js';
import { getNasaDaily, escapeHTML, fmt } from '../api.js';
import { soilChart } from '../charts.js';
import { cropById, cropName } from '/data/crops.js';

const { farm } = await ready;
const body = document.querySelector('#soilBody');

function phNote(ph) {
  if (ph === '' || ph === null || ph === undefined) return 'Not provided. A pH test from DOA or a local lab is inexpensive and improves every recommendation.';
  if (ph < 5.0) return `${ph}: strongly acidic. Many vegetables struggle; ask DOA about liming.`;
  if (ph < 5.5) return `${ph}: acidic. Some crops tolerate it, many vegetables do better around 5.5 to 6.8.`;
  if (ph <= 6.8) return `${ph}: within the range most vegetables prefer (about 5.5 to 6.8).`;
  return `${ph}: above the usual vegetable range. Check with DOA before adding lime.`;
}

function nutrientOutlook(farm) {
  const c = cropById(farm.crop), p = cropById(farm.previous);
  const out = [];
  if (c) out.push(`${cropName(c.id)} has ${c.nitrogen} relative nitrogen demand.`);
  if (c?.nitrogen === 'high' && farm.fertilizer === 'None') out.push('You reported no fertiliser: nitrogen may run short for this crop.');
  if (c?.nitrogen === 'high' && farm.fertilizer === 'Compost or manure') out.push('Compost or manure releases nitrogen slowly; a high-demand crop may still need extra.');
  if (p?.fixesN) out.push(`${cropName(p.id)} before it is a legume, which can leave some nitrogen behind.`);
  if (p && c && p.family === c.family) out.push('Same plant family two seasons in a row can drain the same nutrients and keep soil diseases.');
  if (out.length === 0) out.push('Add your crops on the farm page to see an outlook.');
  return out;
}

if (!farm) {
  body.innerHTML = `<div class="empty"><h3>Set your farm first</h3><p>Soil analysis uses your location and crops.</p><a class="btn btn-primary" href="/farm">Add my farm</a></div>`;
} else {
  body.innerHTML = '<div class="skeleton" style="height:200px"></div>';
  let d = null, err = null;
  try { d = await getNasaDaily(farm); } catch (e) { err = e; }
  const s = d?.summary;
  const wet = s?.meanSoilRootWetness;
  const state = wet == null ? null : wet < 0.35 ? 'dry' : wet > 0.8 ? 'very wet' : 'moderate';
  body.innerHTML = `
    ${err ? `<p class="notice err" style="margin-bottom:16px"><b>Could not load NASA soil moisture.</b> ${escapeHTML(err.message)}</p>` : ''}
    <div class="grid g3">
      <div class="panel metric leaf"><h4>Root-zone wetness (NASA)</h4><b>${wet == null ? 'n/a' : Math.round(wet * 100) + '%'}</b><small>${state ? 'currently ' + state : 'average of the last 120 days'}</small></div>
      <div class="panel metric sky"><h4>Surface wetness (NASA)</h4><b>${s?.meanSoilTopWetness == null ? 'n/a' : Math.round(s.meanSoilTopWetness * 100) + '%'}</b><small>top few centimetres</small></div>
      <div class="panel metric navy"><h4>Elevation of your pin</h4><b>${d?.elevationM == null ? 'n/a' : Math.round(d.elevationM) + ' m'}</b><small>terrain slope not included</small></div>
    </div>
    <div class="grid g2" style="margin-top:18px;align-items:start">
      <section class="panel"><h2>Soil moisture over time</h2><div class="chart-box sm" id="soilBox"><canvas id="cSoil" aria-label="Soil wetness"></canvas></div><p class="fine" style="margin-top:10px">NASA estimates how wet the soil is as a share of saturation. It is a regional model value, not a probe in your field.</p></section>
      <section class="panel"><h2>What you reported</h2>
        <dl class="kv">
          <dt>Soil type</dt><dd>${escapeHTML(farm.soil || 'Not set')}</dd>
          <dt>Soil pH</dt><dd>${escapeHTML(phNote(farm.ph))}</dd>
          <dt>Fertiliser</dt><dd>${escapeHTML(farm.fertilizer || 'Not set')}</dd>
          <dt>Irrigation</dt><dd>${escapeHTML(farm.irrigation || 'Not set')}</dd>
        </dl>
      </section>
    </div>
    <section class="panel" style="margin-top:18px"><h2>Nutrient outlook</h2>
      <ul style="margin:0 0 12px;padding-left:20px;color:var(--ink-2)">${nutrientOutlook(farm).map((x) => `<li>${escapeHTML(x)}</li>`).join('')}</ul>
      <p class="notice warn">This outlook comes from the crops and fertiliser you entered. It is not a measurement. Soil nitrogen, phosphorus and potassium cannot be read from satellites: get a laboratory soil test (DOA or MARDI) before changing fertiliser.</p>
    </section>`;
  if (d && !soilChart(document.querySelector('#cSoil'), d.records)) document.querySelector('#soilBox').innerHTML = '<p class="muted">NASA did not return soil wetness for this location.</p>';
  if (!d) document.querySelector('#soilBox').innerHTML = '<p class="muted">Chart appears when NASA data loads.</p>';
}
