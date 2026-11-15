// Indicative wet/dry calendar from the farm's own 10-year NASA monthly averages.
// Months are ranked against the other months at the SAME location (wettest third / driest third).
// This is NOT a pest forecast: it highlights when moisture-related disease or drought stress is more likely.
import { MONTHS } from './charts.js';

export function classifyMonths(months) {
  const rain = months.map((m, i) => ({ i, v: m.rainMm })).filter((x) => x.v !== null).sort((a, b) => a.v - b.v);
  const third = Math.floor(rain.length / 3);
  const dry = new Set(rain.slice(0, third).map((x) => x.i));
  const wet = new Set(rain.slice(-third).map((x) => x.i));
  return months.map((m, i) => ({ ...m, label: MONTHS[i], level: wet.has(i) ? 'high' : dry.has(i) ? 'dry' : 'wet-mid' }));
}

export function riskGridHTML(months) {
  return classifyMonths(months).map((m) => {
    const cls = m.level === 'high' ? 'high' : m.level === 'dry' ? 'dry' : 'wet';
    const txt = m.level === 'high' ? 'Wettest' : m.level === 'dry' ? 'Driest' : 'Middle';
    return `<div class="${cls}">${m.label}<small>${txt}</small><small>${m.rainMm ?? 'n/a'} mm</small></div>`;
  }).join('');
}

export const RISK_NOTE = 'Wettest months are when fungal diseases, waterlogging and washed-out fertiliser are more likely. Driest months are when irrigation and mulching matter most. This ranks months at your location only; it is not a pest forecast.';
