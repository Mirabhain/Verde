
const AUTH_KEY = 'verdeai_user';

// Get currently logged-in user
export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    } catch {
        return null;
    }
}

// Dummy login
export function login(name, email) {
    const user = {
        id: 'demo-user',
        name: name || 'Demo User',
        email: email || 'demo@verdeai.com'
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(user));

    return user;
}

// Dummy registration
export function register(name, email) {
    return login(name, email);
}

// Logout
export function logout() {
    localStorage.removeItem(AUTH_KEY);
}

// Check authentication
export function isAuthenticated() {
    return !!getCurrentUser();
}
