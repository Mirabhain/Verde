import { ready } from '../layout.js';
import { saveFarm } from '../storage.js';
import { CROPS } from '/data/crops.js';

const { farm } = await ready;
const form = document.querySelector('#farmForm');
const msg = document.querySelector('#farmMessage');
const opts = CROPS.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
document.querySelector('#cropSelect').innerHTML = opts;
document.querySelector('#previousSelect').innerHTML = opts;
if (farm) for (const [k, v] of Object.entries(farm)) form.elements.namedItem(k) && (form.elements.namedItem(k).value = v);

// Map (Leaflet is vendored; tiles come from OpenStreetMap).
const start = farm ? [farm.lat, farm.lon] : [3.8, 103.3];
const map = L.map('map').setView(start, farm ? 11 : 7);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap contributors' }).addTo(map);
L.Icon.Default.imagePath = '/vendor/leaflet/images/';
let pin = farm ? L.marker(start).addTo(map) : null;
function setPin(lat, lon, zoom) {
  lat = Number(lat.toFixed(5)); lon = Number(lon.toFixed(5));
  form.lat.value = lat; form.lon.value = lon;
  pin ? pin.setLatLng([lat, lon]) : (pin = L.marker([lat, lon]).addTo(map));
  if (zoom) map.setView([lat, lon], zoom);
}
map.on('click', (e) => setPin(e.latlng.lat, e.latlng.lng));
for (const n of ['lat', 'lon']) form[n].addEventListener('change', () => {
  const lat = Number(form.lat.value), lon = Number(form.lon.value);
  if (form.lat.value !== '' && form.lon.value !== '' && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) setPin(lat, lon, 11);
});
document.querySelector('#locateBtn').addEventListener('click', () => {
  if (!navigator.geolocation) { msg.className = 'form-error'; msg.textContent = 'Your browser cannot share its location. Click the map instead.'; return; }
  navigator.geolocation.getCurrentPosition(
    (p) => setPin(p.coords.latitude, p.coords.longitude, 13),
    () => { msg.className = 'form-error'; msg.textContent = 'Location was blocked. Allow location access or click the map.'; },
    { timeout: 10000 }
  );
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  const lat = Number(d.lat), lon = Number(d.lon), size = Number(d.size);
  const ph = d.ph === '' ? '' : Number(d.ph);
  if (!d.name.trim() || d.lat === '' || d.lon === '' || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180) {
    msg.className = 'form-error'; msg.textContent = 'Add a farm name and place the pin on the map (or type latitude and longitude).'; return;
  }
  if (!Number.isFinite(size) || size <= 0) { msg.className = 'form-error'; msg.textContent = 'Enter your land size in hectares.'; return; }
  if (ph !== '' && (!Number.isFinite(ph) || ph < 0 || ph > 14)) { msg.className = 'form-error'; msg.textContent = 'Soil pH must be between 0 and 14.'; return; }
  const btn = document.querySelector('#saveFarmBtn');
  btn.disabled = true;
  try {
    await saveFarm({ ...d, lat, lon, size, ph });
    msg.className = 'form-ok';
    msg.innerHTML = 'Farm saved to your account. Next: <a href="/weather">see NASA weather</a> or <a href="/rotation">compare crop rotations</a>.';
  } catch (err) { msg.className = 'form-error'; msg.textContent = err.message; }
  finally { btn.disabled = false; }
});
