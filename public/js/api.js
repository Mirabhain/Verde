// Thin fetch wrapper: JSON in/out, readable errors.
export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: method !== 'GET' ? { 'Content-Type': 'application/json' } : undefined,
      body: method !== 'GET' ? JSON.stringify(body ?? {}) : undefined,
      credentials: 'same-origin'
    });
  } catch {
    throw new Error('Cannot reach the VerdeAI server. Check that it is running and you are online.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const escapeHTML = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// NASA daily data with a short session cache so moving between pages is instant.
export async function getNasaDaily(farm) {
  const key = `verdeai_nasa_${Number(farm.lat).toFixed(2)}_${Number(farm.lon).toFixed(2)}`;
  try {
    const hit = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (hit && Date.now() - hit.at < 30 * 60 * 1000) return hit.data;
  } catch { /* ignore */ }
  const data = await api(`/api/nasa/daily?lat=${farm.lat}&lon=${farm.lon}`);
  try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch { /* quota */ }
  return data;
}

export async function getNasaClimate(farm) {
  const key = `verdeai_clim_${Number(farm.lat).toFixed(2)}_${Number(farm.lon).toFixed(2)}`;
  try {
    const hit = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (hit && Date.now() - hit.at < 6 * 60 * 60 * 1000) return hit.data;
  } catch { /* ignore */ }
  const data = await api(`/api/nasa/climate?lat=${farm.lat}&lon=${farm.lon}`);
  try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch { /* quota */ }
  return data;
}

export const fmt = (v, d = 1, unit = '') => (v === null || v === undefined || Number.isNaN(v) ? 'n/a' : `${Number(v).toFixed(d)}${unit}`);
