import {farm,cropName,escapeHTML} from './shared.js';
document.querySelector('#dashboardFarm').textContent=farm.name;
document.querySelector('#farmSummary').innerHTML=`<p><b>Crop:</b> ${escapeHTML(cropName(farm.crop))}</p><p><b>Soil:</b> ${escapeHTML(farm.soil)}</p><p><b>Size:</b> ${escapeHTML(farm.size)} ha</p><p><b>Coordinates:</b> ${escapeHTML(farm.lat)}, ${escapeHTML(farm.lon)}</p>`;
document.querySelector('#weatherSummary').textContent='Open Weather Analysis to fetch historical NASA observations.';
