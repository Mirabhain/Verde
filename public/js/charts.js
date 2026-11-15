// Chart.js wrappers (Chart.js is vendored at /vendor/chart.umd.js).
const C = { rain: '#1f6fc4', rainFill: 'rgba(31,111,196,.55)', temp: '#23913f', soil: '#0f2c55', soil2: '#5aa6ea', grid: '#e6edf4', text: '#4a5a72' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function base() {
  Chart.defaults.font.family = '"Figtree","Segoe UI",system-ui,sans-serif';
  Chart.defaults.color = C.text;
}
const store = new WeakMap();
function make(canvas, config) {
  base();
  store.get(canvas)?.destroy();
  const chart = new Chart(canvas, config);
  store.set(canvas, chart);
  return chart;
}
const shortDate = (iso) => { const d = new Date(iso + 'T00:00:00Z'); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };

export function dailyChart(canvas, records) {
  return make(canvas, {
    data: {
      labels: records.map((r) => shortDate(r.date)),
      datasets: [
        { type: 'bar', label: 'Rainfall (mm/day)', data: records.map((r) => r.rain), backgroundColor: C.rainFill, borderRadius: 3, yAxisID: 'y', order: 2 },
        { type: 'line', label: 'Temperature (°C)', data: records.map((r) => r.temp), borderColor: C.temp, backgroundColor: C.temp, tension: .3, pointRadius: 0, borderWidth: 2.5, yAxisID: 'y1', order: 1 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
        y: { beginAtZero: true, title: { display: true, text: 'mm/day' }, grid: { color: C.grid } },
        y1: { position: 'right', title: { display: true, text: '°C' }, grid: { display: false }, suggestedMin: 22, suggestedMax: 34 }
      },
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

export function soilChart(canvas, records) {
  const has = records.some((r) => r.soilRoot !== null);
  if (!has) return null;
  return make(canvas, {
    type: 'line',
    data: {
      labels: records.map((r) => shortDate(r.date)),
      datasets: [
        { label: 'Root zone wetness (%)', data: records.map((r) => r.soilRoot === null ? null : r.soilRoot * 100), borderColor: C.soil, backgroundColor: 'rgba(15,44,85,.1)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2.5 },
        { label: 'Surface wetness (%)', data: records.map((r) => r.soilTop === null ? null : r.soilTop * 100), borderColor: C.soil2, tension: .3, pointRadius: 0, borderWidth: 2 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }, y: { min: 0, max: 100, title: { display: true, text: '% of saturation' }, grid: { color: C.grid } } },
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

export function monthlyChart(canvas, months) {
  return make(canvas, {
    data: {
      labels: MONTHS,
      datasets: [
        { type: 'bar', label: 'Rainfall (mm/month)', data: months.map((m) => m.rainMm), backgroundColor: C.rainFill, borderRadius: 4, yAxisID: 'y', order: 2 },
        { type: 'line', label: 'Temperature (°C)', data: months.map((m) => m.tempC), borderColor: C.temp, backgroundColor: C.temp, tension: .3, borderWidth: 2.5, pointRadius: 3, yAxisID: 'y1', order: 1 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, title: { display: true, text: 'mm/month' }, grid: { color: C.grid } },
        y1: { position: 'right', title: { display: true, text: '°C' }, grid: { display: false }, suggestedMin: 22, suggestedMax: 34 }
      },
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

export { MONTHS };
