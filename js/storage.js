// Guest-only localStorage. NOT real authentication or a cloud database.
const FARM_KEY='verdeai_farm_v1', TASK_KEY='verdeai_tasks_v1';
export const defaultFarm={name:'Sample farm',lat:3.139,lon:101.687,size:1,crop:'chili',previous:'chili',soil:'Loam',ph:'',irrigation:'Rain-fed',fertilizer:'Unknown',goal:'diversity'};
export function getFarm(){try{return {...defaultFarm,...JSON.parse(localStorage.getItem(FARM_KEY)||'{}')}}catch{return {...defaultFarm}}}
export function saveFarm(farm){localStorage.setItem(FARM_KEY,JSON.stringify(farm))}
export function getTasks(){try{return JSON.parse(localStorage.getItem(TASK_KEY)||'[]')}catch{return []}}
export function saveTasks(tasks){localStorage.setItem(TASK_KEY,JSON.stringify(tasks))}
