// Rule-based crop rotation comparison. It is a transparent heuristic (not a trained model and not a
// validated yield forecast). Every score point is explained on the card.
import { CROPS, cropById } from '/data/crops.js';

const GOALS = {
  water: 'save water', nitrogen: 'add nitrogen', pest: 'reduce pests and disease', diversity: 'diversify crops'
};
export const goalLabel = (g) => GOALS[g] || 'not set';

function scoreCandidate(c, ctx) {
  const { current, previous, farm, nasa } = ctx;
  let score = 40;
  const why = [], evidence = [], benefits = [], gaps = [], risks = [];

  if (current) {
    if (c.family !== current.family) { score += 25; why.push(`${c.name.split(' /')[0]} is in a different plant family (${c.family}) from ${current.name.split(' /')[0]} (${current.family}).`); benefits.push('Breaks pest and disease cycles that build up when the same family is grown again.'); }
    else { score -= 10; why.push(`Same family as the current crop (${c.family}).`); risks.push('Same-family crops share pests and soil diseases, so pressure can carry over.'); }
  }
  if (previous && c.family !== previous.family) { score += 8; why.push('Also differs from the crop before the current one.'); }

  const goal = farm.goal;
  if (goal === 'water') {
    if (c.water === 'low') { score += 15; benefits.push('Lower relative water demand.'); }
    else if (c.water === 'medium') score += 6;
    else { score -= 8; risks.push('High relative water demand.'); }
  }
  if (goal === 'nitrogen') {
    if (c.fixesN) { score += 15; benefits.push('Legume: can supply some nitrogen to the next crop (amount varies).'); }
  }
  if (goal === 'pest' && c.family !== current?.family && c.family !== previous?.family) score += 10;
  if (goal === 'diversity' && c.family !== current?.family) score += 8;

  if (current?.nitrogen === 'high' && c.fixesN) { score += 6; why.push(`Follows a nitrogen-hungry crop (${current.name.split(' /')[0]}), so a legume helps rebuild fertility.`); }
  if (c.nitrogen === 'high' && farm.fertilizer === 'None') { score -= 8; risks.push('High nitrogen demand but no fertiliser reported.'); }

  if (nasa) {
    const s = nasa.summary, l = s.last30;
    const dry = l.totalRainMm !== null && l.totalRainMm < 60;
    const wet = l.totalRainMm !== null && l.totalRainMm > 450;
    evidence.push(`NASA last 30 days: ${l.totalRainMm} mm rain, root-zone wetness ${l.meanSoilRootWetness === null ? 'n/a' : Math.round(l.meanSoilRootWetness * 100) + '%'}, mean ${l.meanTempC} °C.`);
    if (dry && farm.irrigation === 'Rain-fed') {
      if (c.water === 'high') { score -= 12; risks.push('Recent rainfall was low and the farm is rain-fed; this crop needs a lot of water.'); }
      else if (c.water === 'low') { score += 6; benefits.push('Handles the recent dry spell better than high-water crops.'); }
    }
    if (wet) risks.push('Recent rainfall was very high: make sure the plot drains well.');
  } else {
    gaps.push('NASA data was not loaded, so weather was not part of this score.');
  }

  if (farm.ph === '' || farm.ph === null || farm.ph === undefined) gaps.push('Soil pH not provided.');
  gaps.push('No laboratory soil test (N, P, K) is available; nutrient status is unknown.');
  c.pests.length && risks.push(`Commonly reported problems: ${c.pests.join(', ')}.`);

  return { crop: c, score: Math.max(0, Math.min(100, score)), why, evidence, benefits, gaps, risks };
}

export function compareRotations(farm, nasa) {
  const current = cropById(farm.crop);
  const previous = cropById(farm.previous);
  if (!current) return null;
  const ctx = { current, previous, farm, nasa };
  // Baseline: how the farmer's existing sequence (previous -> current) scores with the same rules.
  const baseline = previous ? scoreCandidate(current, { current: previous, previous: null, farm, nasa }) : null;
  const options = CROPS.filter((c) => c.id !== current.id && c.id !== 'rice')
    .map((c) => scoreCandidate(c, ctx))
    .sort((a, b) => b.score - a.score || a.crop.name.localeCompare(b.crop.name))
    .slice(0, 3)
    .map((o, i) => ({ ...o, label: `Option ${String.fromCharCode(65 + i)}`, sequence: [previous?.name, current.name, o.crop.name].filter(Boolean) }));
  return { current, previous, baseline, options };
}
