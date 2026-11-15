// App shell for signed-in pages: auth guard, sidebar, user box and the AI assistant.
import { escapeHTML } from './api.js';
import { getFarm } from './storage.js';
import { getCurrentUser, logout } from './auth.js';

const ICONS = {
  dashboard: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  farm: '<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  rotation: '<path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4"/>',
  soil: '<path d="M12 3c3.5 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2.5-6 6-10z"/>',
  weather: '<path d="M7 18a4 4 0 1 1 .9-7.9A5.5 5.5 0 0 1 18.5 11 3.5 3.5 0 0 1 18 18z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
};
const NAV = [
  ['dashboard', '/dashboard', 'Dashboard'],
  ['farm', '/farm', 'My farm'],
  ['weather', '/weather', 'NASA weather'],
  ['soil', '/soil', 'Soil and water'],
  ['rotation', '/rotation', 'Crop rotation'],
  ['calendar', '/calendar', 'Farm calendar']
];
const svg = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

async function boot() {
const user = getCurrentUser();

    if (!user) {
        location.replace('/login?next=' + encodeURIComponent(location.pathname));
        return new Promise(() => {});
    }

  const content = document.getElementById('content');
  const path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const shell = document.createElement('div');
  shell.className = 'shell';
  shell.innerHTML = `
    <aside class="side" id="side">
      <a class="brand" href="/"><img src="/img/logo.svg" alt="" width="38" height="38">VerdeAI</a>
      <nav aria-label="Main">${NAV.map(([n, href, label]) => `<a href="${href}" ${href === path ? 'aria-current="page"' : ''}>${svg(n)}${label}</a>`).join('')}</nav>
      <div class="who"><b>${escapeHTML(user.name)}</b><span>${escapeHTML(user.email)}</span><br><button type="button" id="logoutBtn">Log out</button></div>
    </aside>
    <div class="main">
      <div class="mobilebar"><a class="brand" href="/" style="font-size:19px"><img src="/img/logo.svg" alt="" width="30" height="30">VerdeAI</a><button type="button" id="menuBtn" aria-expanded="false" aria-controls="side">Menu</button></div>
      <main class="content" id="main"></main>
    </div>`;
  document.body.prepend(shell);
  shell.querySelector('#main').append(...content.childNodes);
  content.remove();

  const side = shell.querySelector('#side');
  shell.querySelector('#menuBtn').addEventListener('click', (e) => {
    const open = side.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });
  shell.querySelector('#logoutBtn').addEventListener('click', () => {
    logout();
    location.href = '/login';
});

  const { initChat } = await import('/js/chat.js');
  initChat(user);
  return { user, farm: getFarm() };
}

export const ready = boot();
