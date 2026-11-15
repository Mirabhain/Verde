import { ready } from '../layout.js';
import { getNasaDaily, escapeHTML } from '../api.js';
import { compareRotations, goalLabel } from '../rotation.js';

const { farm } = await ready;
const body = document.querySelector('#rotBody');
const btn = document.querySelector('#recommendBtn');
const li = (arr) => arr.length ? `<ul>${arr.map((x) => `<li>${escapeHTML(x)}</li>`).join('')}</ul>` : '<p class="muted">None noted.</p>';

async function run() {
  if (!farm) {
    btn.hidden = true;
    body.innerHTML = `<div class="empty"><h3>Add your farm first</h3><p>Rotation suggestions need your current and previous crops.</p><a class="btn btn-primary" href="/farm">Add my farm</a></div>`;
    return;
  }
  btn.disabled = true;
  body.innerHTML = '<div class="skeleton" style="height:200px"></div>';
  let nasa = null, nasaErr = null;
  try { nasa = await getNasaDaily(farm); } catch (e) { nasaErr = e.message; }
  const r = compareRotations(farm, nasa);
  if (!r) { body.innerHTML = '<div class="notice err">Choose your current crop on the farm page.</div>'; btn.disabled = false; return; }

  const base = r.baseline;
  body.innerHTML = `
    ${nasaErr ? `<p class="notice err" style="margin-bottom:16px"><b>NASA data not loaded.</b> ${escapeHTML(nasaErr)} Scores below do not include weather.</p>` : ''}
    <section class="panel" style="margin-bottom:18px">
      <div class="rot-top"><div><h2>Your current rotation</h2>
        <div class="seq">${[r.previous?.name, r.current.name].filter(Boolean).map((n) => `<span>${escapeHTML(n)}</span>`).join('<i>then</i>')}</div></div>
        ${base ? `<div class="score">${base.score}<small>/100</small></div>` : ''}</div>
      ${base ? `<div class="bar" style="margin:12px 0"><i style="width:${base.score}%"></i></div>${li(base.why.concat(base.risks.slice(0, 2)))}` : '<p class="muted">Add a previous crop to score your current rotation.</p>'}
      <p class="fine" style="margin-top:10px">Your priority: ${escapeHTML(goalLabel(farm.goal))}. ${nasa ? `NASA data: ${nasa.summary.from} to ${nasa.summary.to}.` : ''}</p>
    </section>
    <div class="grid g3" style="align-items:start">
      ${r.options.map((o) => `
        <article class="panel rot-card">
          <div class="rot-top"><div><span class="tag">${o.label}</span></div><div class="score">${o.score}<small>/100</small></div></div>
          <div class="seq">${o.sequence.map((n, i) => `${i ? '<i>then</i>' : ''}<span>${escapeHTML(n.split(' /')[0])}</span>`).join('')}</div>
          <div class="bar"><i style="width:${o.score}%"></i></div>
          <div><h4>Why it is suggested</h4>${li(o.why)}</div>
          ${o.evidence.length ? `<div class="evidence"><b>Evidence:</b> ${o.evidence.map(escapeHTML).join(' ')}</div>` : ''}
          <div><h4>Benefits</h4>${li(o.benefits)}</div>
          <div><h4>Risks</h4>${li(o.risks)}</div>
          <div><h4>What we do not know</h4>${li(o.gaps)}</div>
          <p class="fine">${escapeHTML(o.crop.note)}</p>
        </article>`).join('')}
    </div>
    <p class="notice" style="margin-top:18px">Scores come from clear rules (plant family, water and nitrogen demand, your priority and recent NASA weather). They are not yield predictions. Satellite data and your answers are estimates: use this to support your decision, and confirm with an agricultural officer (Jabatan Pertanian) before big changes.</p>`;
  btn.disabled = false;
}
btn.addEventListener('click', run);
run();
