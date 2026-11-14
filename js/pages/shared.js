import {CROPS} from '../../data/crops.js';
import {getFarm} from '../storage.js';
export const farm=getFarm();
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const cropName=id=>CROPS.find(c=>c.id===id)?.name||id;
