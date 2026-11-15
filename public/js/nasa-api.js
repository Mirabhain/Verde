/**
 * NASA API INTEGRATION — EDIT THIS FILE.
 * NASA POWER public API: no API key needed.
 * Official docs: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
 * Base URL below is the place to change NASA API endpoints if required.
 * Parameters T2M (°C), PRECTOTCORR (mm/day), RH2M (%) are used.
 * IMPORTANT: POWER values are gridded area estimates, not a farm soil sensor.
 * For SMAP / MODIS / GPM integrations, create separate API modules; those
 * datasets are NOT retrieved by this MVP.
 */
export const NASA_POWER_BASE_URL='https://power.larc.nasa.gov/api/temporal/daily/point';
export const NASA_PARAMETERS=['T2M','PRECTOTCORR','RH2M'];
function ymd(date){return date.toISOString().slice(0,10).replaceAll('-','')}
export async function fetchNasaPower(lat,lon){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw Error('Invalid coordinates.');
 // Request a completed historical period, avoiding the most recent 10 days
 // because some NASA products are published with a delay.
 const end=new Date();end.setUTCDate(end.getUTCDate()-10);
 const start=new Date(end);start.setUTCDate(start.getUTCDate()-89);
 const url=new URL(NASA_POWER_BASE_URL);
 url.searchParams.set('parameters',NASA_PARAMETERS.join(','));
 url.searchParams.set('community','AG');
 url.searchParams.set('longitude',String(lon));url.searchParams.set('latitude',String(lat));
 url.searchParams.set('start',ymd(start));url.searchParams.set('end',ymd(end));
 url.searchParams.set('format','JSON');
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);
 let response;
 try{response=await fetch(url,{signal:controller.signal})}catch(e){throw Error('NASA request failed or timed out. Check internet access and retry. '+e.message)}finally{clearTimeout(timeout)}
 if(!response.ok)throw Error('NASA POWER returned HTTP '+response.status);
 const json=await response.json();const p=json?.properties?.parameter;
 if(!p?.T2M||!p?.PRECTOTCORR||!p?.RH2M)throw Error('NASA response is missing required parameters.');
 const dates=Object.keys(p.T2M).sort();
 const valid=v=>typeof v==='number'&&Number.isFinite(v)&&v>-900;
 const records=dates.map(date=>({date,temp:p.T2M[date],rain:p.PRECTOTCORR[date],humidity:p.RH2M[date]})).filter(x=>valid(x.temp)&&valid(x.rain)&&valid(x.humidity));
 if(!records.length)throw Error('NASA returned no usable observations for this location and period.');
 return {records,url:url.toString(),start:ymd(start),end:ymd(end)};
}
