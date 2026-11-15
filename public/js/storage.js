
// Farm profile + tasks using browser LocalStorage.
// No database or backend API required.

const FARM_KEY = 'verdeai_farm';
const TASKS_KEY = 'verdeai_tasks';

// Save farm profile
export function saveFarm(farm) {
    localStorage.setItem(FARM_KEY, JSON.stringify(farm));
    return farm;
}

// Retrieve farm profile
export function getFarm() {
    try {
        return JSON.parse(localStorage.getItem(FARM_KEY) || 'null');
    } catch {
        return null;
    }
}

// Save farm tasks
export function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return tasks;
}

// Retrieve farm tasks
export function getTasks() {
    try {
        return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
    } catch {
        return [];
    }
}

// Clear all Verde local data
export function clearLocal() {
    localStorage.removeItem(FARM_KEY);
    localStorage.removeItem(TASKS_KEY);
}
