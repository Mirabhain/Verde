// Reference table for the rotation logic.
// "family" is botanical taxonomy (factual). "water" and "nitrogen" are coarse relative categories and
// "pests" lists commonly reported problems: use them as a starting point and verify with DOA / MARDI.
export const CROPS = [
 {id:'chili',name:'Chili / Cili',family:'Solanaceae',water:'medium',nitrogen:'high',fixesN:false,pests:['anthracnose','bacterial wilt','thrips and mites'],note:'Avoid repeating Solanaceae (chili, tomato, brinjal) on the same plot: soil-borne diseases such as bacterial wilt build up.'},
 {id:'longbean',name:'Long bean / Kacang panjang',family:'Fabaceae',water:'medium',nitrogen:'low',fixesN:true,pests:['pod borer','aphids','rust'],note:'Legume: can add some nitrogen to the soil, but the amount depends on nodulation and management.'},
 {id:'mustard',name:'Mustard greens / Sawi',family:'Brassicaceae',water:'medium',nitrogen:'medium',fixesN:false,pests:['diamondback moth','flea beetle','soft rot'],note:'Short-season leafy vegetable. Watch irrigation and caterpillar pressure.'},
 {id:'corn',name:'Corn / Jagung',family:'Poaceae',water:'high',nitrogen:'high',fixesN:false,pests:['fall armyworm','stem borer','downy mildew'],note:'Needs good moisture and nitrogen. Often follows a legume well.'},
 {id:'groundnut',name:'Groundnut / Kacang tanah',family:'Fabaceae',water:'low',nitrogen:'low',fixesN:true,pests:['leaf spot','rust','aphids'],note:'Legume with lower water demand. Needs well-drained soil.'},
 {id:'cucumber',name:'Cucumber / Timun',family:'Cucurbitaceae',water:'high',nitrogen:'medium',fixesN:false,pests:['downy mildew','melon fly','aphids'],note:'Needs steady moisture. Humid weather raises mildew risk.'},
 {id:'okra',name:'Okra / Bendi',family:'Malvaceae',water:'medium',nitrogen:'medium',fixesN:false,pests:['aphids','fruit borer','leaf curl virus'],note:'Different family from most vegetables, so it breaks pest cycles. Tolerates heat.'},
 {id:'rice',name:'Rice / Padi',family:'Poaceae',water:'high',nitrogen:'high',fixesN:false,pests:['blast','brown planthopper','stem borer'],note:'Needs paddy-specific water management. Not included in vegetable rotation suggestions.'}
];
export const cropById = (id) => CROPS.find((c) => c.id === id);
export const cropName = (id) => cropById(id)?.name || id || 'Not set';
