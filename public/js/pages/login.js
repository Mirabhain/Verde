
import { login, register, getCurrentUser } from '../auth.js';

const $ = (id) => document.getElementById(id);
let mode = 'signup';

const params = new URLSearchParams(location.search);
const nextParam = params.get('next');
const next = nextParam && /^\/(?:[^/\\]|$)/.test(nextParam) ? nextParam : '/dashboard';

// Already logged in? Go straight to dashboard.
if (getCurrentUser()) {
    location.replace(next);
}

function setMode(m) {
    mode = m;
    const signup = m === 'signup';

    $('nameField').hidden = !signup;
    $('signupTab').classList.toggle('selected', signup);
    $('loginTab').classList.toggle('selected', !signup);

    $('signupTab').setAttribute('aria-selected', signup);
    $('loginTab').setAttribute('aria-selected', !signup);

    $('authHeading').textContent = signup
        ? 'Create your account'
        : 'Welcome back';

    $('authSubmit').textContent = signup
        ? 'Create account'
        : 'Log in';

    $('authPassword').autocomplete = signup
        ? 'new-password'
        : 'current-password';

    $('authError').hidden = true;
}

$('signupTab').addEventListener('click', () => setMode('signup'));
$('loginTab').addEventListener('click', () => setMode('login'));

setMode(params.get('mode') === 'login' ? 'login' : 'signup');

$('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const err = $('authError');
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value;
    const name = $('authName').value.trim();

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        err.textContent = 'Enter a valid email address.';
        err.hidden = false;
        return;
    }

    // Validate password length (demo only)
    if (password.length < 8) {
        err.textContent = 'Password must be at least 8 characters.';
        err.hidden = false;
        return;
    }

    // Validate name during signup
    if (mode === 'signup' && !name) {
        err.textContent = 'Please enter your name.';
        err.hidden = false;
        return;
    }

    const btn = $('authSubmit');
    btn.disabled = true;

    try {
        if (mode === 'signup') {
            register(name, email);
        } else {
            login(name, email);
        }

        location.href = next;

    } catch (ex) {
        err.textContent = ex.message || 'Something went wrong.';
        err.hidden = false;
        btn.disabled = false;
    }
});
