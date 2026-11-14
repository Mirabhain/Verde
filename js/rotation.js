import {CROPS} from '../data/crops.js';
// Explicit heuristic, NOT a trained AI model or scientifically calibrated probability.
// Score = 40 base + 30 family difference + 15 water goal + 15 nitrogen goal.
// For diversity goal, add 15 for family difference from previous crop and
// 15 for family difference from current crop; cap to 100.
export function rotationOptions(farm,weather){
 const current=CROPS.find(c=>c.id===farm.crop)||CROPS[0];
 const previous=CROPS.find(c=>c.id===farm.previous)||current;
 const pool=CROPS.filter(c=>c.id!==current.id&&c.id!=='rice'); // Rice needs separate land/water suitability checks.
 const scoreCrop=c=>{
  let score=40;let reasons=[];
  if(c.family!==current.family){score+=30;reasons.push('Different crop family from current crop')}else{reasons.push('Same family may maintain pest/disease pressure')}
  if(farm.goal==='water'){if(c.water==='low'){score+=15;reasons.push('Lower relative water-demand category')}else if(c.water==='medium')score+=7}
  if(farm.goal==='nitrogen'&&c.family==='Fabaceae'){score+=15;reasons.push('Legume with possible nitrogen contribution')}
  if(farm.goal==='diversity'){if(c.family!==previous.family)score+=15;if(c.family!==current.family)score+=15}
  // NASA is used as context, not a precise agronomic suitability model.
  if(weather?.records?.length){const avg=weather.records.reduce((s,r)=>s+r.rain,0)/weather.records.length;if(avg<2&&c.water==='high'){score-=10;reasons.push('Historical rainfall was low; check irrigation')}}
  if(c.id==='rice')score-=30;
  return {crop:c,score:Math.max(0,Math.min(100,score)),reasons};
 };
 const ranked=pool.map(scoreCrop).sort((a,b)=>b.score-a.score||a.crop.name.localeCompare(b.crop.name));
 return ranked.slice(0,3).map((x,i)=>({...x,label:'Option '+String.fromCharCode(65+i),sequence:[current.name,x.crop.name],risk:'Crop suitability also depends on soil tests, pests, season, drainage and local practice.'}));
}
