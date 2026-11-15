import { ready } from '../layout.js';
import { getNasaClimate, escapeHTML } from '../api.js';
import { getTasks, saveTasks } from '../storage.js';
import { riskGridHTML, RISK_NOTE } from '../risk.js';

const { farm } = await ready;
const $ = (s) => document.querySelector(s);
let tasks = getTasks();
const msg = $('#taskMsg');

function render() {
  const sorted = [...tasks].sort((a, b) => a.date.localeCompare(b.date));
  $('#taskList').innerHTML = sorted.length
    ? sorted.map((t) => `<div class="task"><span><b>${escapeHTML(t.date)}</b> ${escapeHTML(t.task)}</span><button type="button" data-id="${escapeHTML(t.id)}" aria-label="Delete ${escapeHTML(t.task)}">Delete</button></div>`).join('')
    : '<p class="muted" style="margin-top:14px">No activities yet. Add your first one above.</p>';
}
async function persist(next) {
  try { tasks = await saveTasks(next); msg.hidden = true; }
  catch (e) { msg.textContent = e.message; msg.hidden = false; }
  render();
}
$('#taskList').addEventListener('click', (e) => { const id = e.target.dataset?.id; if (id) persist(tasks.filter((t) => t.id !== id)); });
$('#taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const d = Object.fromEntries(new FormData(form));
  await persist([...tasks, { id: crypto.randomUUID(), date: d.date, task: d.task.trim() }]);
  form.reset();
});
render();

const box = $('#riskBox');
if (!farm) box.innerHTML = '<p class="muted">Add your farm to see wetter and drier months from NASA data.</p><p style="margin-top:10px"><a class="btn btn-primary btn-sm" href="/farm">Add my farm</a></p>';
else try {
  const c = await getNasaClimate(farm);
  box.innerHTML = `<div class="risk-grid">${riskGridHTML(c.months)}</div><p class="fine" style="margin-top:10px">${RISK_NOTE}</p><p class="fine">NASA POWER monthly averages, ${c.years[0]} to ${c.years.at(-1)}.</p>`;
} catch (e) { box.innerHTML = `<p class="notice err">Could not load NASA data. ${escapeHTML(e.message)}</p>`; }
