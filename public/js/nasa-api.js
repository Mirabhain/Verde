const FARM_KEY = "verdeFarm"; // adapt to storage.js if you save the farm there
const DEFAULT_FARM = { lat: 1.5535, lon: 110.3593, name: "Kuching" };

export function getFarmLocation() {
  try {
    const f = JSON.parse(localStorage.getItem(FARM_KEY));
    if (f && Number.isFinite(f.lat) && Number.isFinite(f.lon)) return f;
  } catch {}
  return DEFAULT_FARM;
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const getWeather = (lat, lon, days = 14) => getJSON(`/api/weather?lat=${lat}&lon=${lon}&days=${days}`);
export const getSoil = (lat, lon, days = 14) => getJSON(`/api/soil?lat=${lat}&lon=${lon}&days=${days}`);

export const shortDate = (s) => `${s.slice(6, 8)}/${s.slice(4, 6)}`;
export const show = (v, unit = "", digits = 1) => (v == null ? "n/a" : `${(+v).toFixed(digits)}${unit}`);

/* GIBS map (needs Leaflet loaded as the global L) */
const GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
const LAYERS = {
  trueColor: { id: "MODIS_Terra_CorrectedReflectance_TrueColor", ext: "jpg", label: "True colour" },
  ndvi: { id: "MODIS_Terra_NDVI_8Day", ext: "png", label: "NDVI (vegetation)" },
  evi: { id: "MODIS_Terra_EVI_8Day", ext: "png", label: "EVI (vegetation)" },
};

function gibsLayer(key, date) {
  const { id, ext } = LAYERS[key];
  return L.tileLayer(`${GIBS}/${id}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.${ext}`, {
    tileSize: 256,
    maxNativeZoom: 9,
    maxZoom: 12,
    noWrap: true,
    opacity: 0.8,
    attribution: "NASA EOSDIS GIBS",
  });
}

export function mountMap(elementId, lat, lon, keys, daysBack = 12) {
  const date = new Date(Date.now() - daysBack * 86400000).toISOString().slice(0, 10);
  const map = L.map(elementId).setView([lat, lon], 8);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "OpenStreetMap",
  }).addTo(map);

  const overlays = {};
  keys.forEach((k, i) => {
    const layer = gibsLayer(k, date);
    overlays[LAYERS[k].label] = layer;
    if (i === 0) layer.addTo(map);
  });
  L.control.layers(null, overlays, { collapsed: false }).addTo(map);
  L.marker([lat, lon]).addTo(map).bindPopup("Your farm");
  return map;
}