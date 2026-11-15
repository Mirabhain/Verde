import { api } from '../api.js';

const $ = (id) => document.getElementById(id);
let mode = 'signup';
const params = new URLSearchParams(location.search);
const next = params.get('next') && /^\/[^/\\]/.test(params.get('next')) ? params.get('next') : '/dashboard';
if (params.get('mode') === 'login') setMode('login');

// Already logged in? Go straight on.
api('/api/auth/me').then(() => location.replace(next)).catch(() => {});

function setMode(m) {
  mode = m;
  const signup = m === 'signup';
  $('nameField').hidden = !signup;
  $('signupTab').classList.toggle('selected', signup);
  $('loginTab').classList.toggle('selected', !signup);
  $('signupTab').setAttribute('aria-selected', signup);
  $('loginTab').setAttribute('aria-selected', !signup);
  $('authHeading').textContent = signup ? 'Create your account' : 'Welcome back';
  $('authSubmit').textContent = signup ? 'Create account' : 'Log in';
  $('authPassword').autocomplete = signup ? 'new-password' : 'current-password';
  $('authError').hidden = true;
}
$('signupTab').addEventListener('click', () => setMode('signup'));
$('loginTab').addEventListener('click', () => setMode('login'));
setMode(mode === 'login' ? 'login' : 'signup');

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('authError');
  const email = $('authEmail').value.trim();
  const password = $('authPassword').value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Enter a valid email address.'; err.hidden = false; return; }
  if (password.length < 8) { err.textContent = 'Password must be at least 8 characters.'; err.hidden = false; return; }
  const btn = $('authSubmit');
  btn.disabled = true;
  try {
    await api(`/api/auth/${mode === 'signup' ? 'register' : 'login'}`, { method: 'POST', body: { name: $('authName').value.trim(), email, password } });
    location.href = next;
  } catch (ex) {
    err.textContent = ex.message; err.hidden = false;
    btn.disabled = false;
  }
});
