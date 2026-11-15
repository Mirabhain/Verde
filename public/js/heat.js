/* Thermal stress and evaporation helpers for the weather page. Pure functions, no browser needed. */

const toF = (c) => (c * 9) / 5 + 32;
const toC = (f) => ((f - 32) * 5) / 9;

// Saturation vapour pressure in hPa (Magnus formula)
const satVapour = (c) => 6.1094 * Math.exp((17.625 * c) / (c + 243.04));

/* POWER gives the daily mean humidity. The afternoon maximum temperature is far drier,
   so humidity at the maximum is estimated from the daily mean dew point. */
export function rhAtTemp(tempC, dewC) {
  if (tempC == null || dewC == null) return null;
  return Math.min(100, (100 * satVapour(dewC)) / satVapour(tempC));
}

// NWS heat index in degrees F: Steadman first, then the Rothfusz regression with its two adjustments
export function heatIndexF(tF, rh) {
  let hi = 0.5 * (tF + 61.0 + (tF - 68.0) * 1.2 + rh * 0.094);
  if ((hi + tF) / 2 >= 80) {
    hi =
      -42.379 + 2.04901523 * tF + 10.14333127 * rh - 0.22475541 * tF * rh
      - 0.00683783 * tF * tF - 0.05481717 * rh * rh + 0.00122874 * tF * tF * rh
      + 0.00085282 * tF * rh * rh - 0.00000199 * tF * tF * rh * rh;
    if (rh < 13 && tF >= 80 && tF <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tF - 95)) / 17);
    else if (rh > 85 && tF >= 80 && tF <= 87) hi += ((rh - 85) / 10) * ((87 - tF) / 5);
  }
  return hi;
}

export const heatIndexC = (tC, rh) => toC(heatIndexF(toF(tC), rh));

/* NWS categories converted to degrees C (80, 90, 103 and 125 degrees F).
   These are human heat thresholds, used here as a general thermal stress proxy, not crop limits. */
export const HEAT_LEVELS = [
  { max: 26.7, rank: 0, label: "Normal", bg: "#e5f3e8", fg: "#244d30" },
  { max: 32.2, rank: 1, label: "Caution", bg: "#fbefd0", fg: "#6b4a00" },
  { max: 39.4, rank: 2, label: "Extreme caution", bg: "#fbdcb5", fg: "#7a3d00" },
  { max: 51.7, rank: 3, label: "Danger", bg: "#f6c9c2", fg: "#7a1f17" },
  { max: Infinity, rank: 4, label: "Extreme danger", bg: "#e8a9a0", fg: "#5a0f08" },
];

export const heatLevel = (hiC) => (hiC == null ? null : HEAT_LEVELS.find((l) => hiC < l.max));

export function doyOf(yyyymmdd) {
  const y = +yyyymmdd.slice(0, 4), m = +yyyymmdd.slice(4, 6) - 1, d = +yyyymmdd.slice(6, 8);
  return Math.round((Date.UTC(y, m, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
}

// FAO 56 extraterrestrial radiation in MJ per m2 per day
export function extraterrestrialRadiation(latDeg, doy) {
  const phi = (latDeg * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos(((2 * Math.PI) / 365) * doy);
  const delta = 0.409 * Math.sin(((2 * Math.PI) / 365) * doy - 1.39);
  const x = Math.min(1, Math.max(-1, -Math.tan(phi) * Math.tan(delta)));
  const ws = Math.acos(x);
  return (
    ((24 * 60) / Math.PI) * 0.082 * dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws))
  );
}

/* Hargreaves Samani reference evapotranspiration in mm per day.
   Only used when NASA POWER evaporation (EVLAND) is unavailable. It is an estimate, not an observation. */
export function hargreavesEt0(tmax, tmin, latDeg, doy) {
  if (tmax == null || tmin == null) return null;
  const tmean = (tmax + tmin) / 2;
  const ra = extraterrestrialRadiation(latDeg, doy);
  return 0.0023 * (tmean + 17.8) * Math.sqrt(Math.max(tmax - tmin, 0)) * 0.408 * ra;
}
