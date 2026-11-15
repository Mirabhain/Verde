// Farm profile + tasks. The server (per account) is the source of truth;
// localStorage is only a fast per-user cache so pages render instantly.
import { api } from './api.js';

let uid = 'guest';
export const setActiveUser = (id) => { uid = id; };
const k = (name) => `verdeai_${uid}_${name}`;
const read = (name, fallback) => { try { return JSON.parse(localStorage.getItem(k(name)) ?? 'null') ?? fallback; } catch { return fallback; } };
const write = (name, v) => { try { localStorage.setItem(k(name), JSON.stringify(v)); } catch { /* quota */ } };

export const getFarm = () => read('farm', null);
export const getTasks = () => read('tasks', []);

export async function pullProfile() {
  const p = await api('/api/profile');
  write('farm', p.farm);
  write('tasks', p.tasks || []);
  return p;
}

export async function saveFarm(farm) {
  const saved = await api('/api/profile', { method: 'PUT', body: { farm } });
  write('farm', saved.farm);
  return saved.farm;
}

export async function saveTasks(tasks) {
  const saved = await api('/api/profile', { method: 'PUT', body: { tasks } });
  write('tasks', saved.tasks);
  return saved.tasks;
}

export function clearLocal() {
  Object.keys(localStorage).filter((x) => x.startsWith('verdeai_')).forEach((x) => localStorage.removeItem(x));
  Object.keys(sessionStorage).filter((x) => x.startsWith('verdeai_')).forEach((x) => sessionStorage.removeItem(x));
}
