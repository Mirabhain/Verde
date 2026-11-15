// Floating AI assistant (Groq on the server; the API key never reaches the browser).
import { api, escapeHTML } from './api.js';
import { getFarm } from './storage.js';

// Safe mini-markdown: escape first, then allow bold, bullet lists and paragraphs.
export function renderMarkdown(text) {
  const lines = escapeHTML(text).split(/\r?\n/);
  let html = '', list = false;
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
  for (const raw of lines) {
    const line = raw.trim();
    const li = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (li) { if (!list) { html += '<ul>'; list = true; } html += `<li>${inline(li[1])}</li>`; continue; }
    if (list) { html += '</ul>'; list = false; }
    if (line) html += `<p>${inline(line.replace(/^#{1,4}\s+/, ''))}</p>`;
  }
  if (list) html += '</ul>';
  return html;
}

export function initChat(user) {
  const key = `verdeai_${user.id}_chat`;
  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(key) || '[]'); } catch { /* ignore */ }

  const fab = document.createElement('button');
  fab.className = 'chat-fab';
  fab.type = 'button';
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>Ask VerdeAI';

  const box = document.createElement('section');
  box.className = 'chat';
  box.hidden = true;
  box.setAttribute('aria-label', 'VerdeAI assistant');
  box.innerHTML = `
    <header><div><b>Ask VerdeAI</b><span>Uses your farm profile and NASA data</span></div><button type="button" aria-label="Close chat" id="chatClose">×</button></header>
    <div class="chat-log" id="chatLog" aria-live="polite"></div>
    <div class="chips" id="chatChips">
      <button type="button">What should I plant after my current crop?</button>
      <button type="button">Is the weather too dry or wet for my farm?</button>
      <button type="button">Which pests should I watch for?</button>
    </div>
    <form id="chatForm" autocomplete="off">
      <input id="chatInput" maxlength="1500" placeholder="Ask in Bahasa Malaysia or English" aria-label="Your question" required>
      <button type="submit">Send</button>
    </form>`;
  document.body.append(fab, box);

  const log = box.querySelector('#chatLog');
  const input = box.querySelector('#chatInput');
  const form = box.querySelector('#chatForm');

  const add = (text, cls) => {
    const d = document.createElement('div');
    d.className = `msg ${cls}`;
    if (cls === 'bot') d.innerHTML = renderMarkdown(text); else d.textContent = text;
    log.append(d);
    log.scrollTop = log.scrollHeight;
    return d;
  };
  const greet = () => add(`Salam ${user.name.split(' ')[0]}! I can explain your NASA data, suggest crop rotations and answer questions about pests and soil. What would you like to know?`, 'bot');

  if (history.length) history.forEach((m) => add(m.content, m.role === 'user' ? 'user' : 'bot')); else greet();

  const open = () => { box.hidden = false; fab.hidden = true; input.focus(); };
  const close = () => { box.hidden = true; fab.hidden = false; fab.focus(); };
  fab.addEventListener('click', open);
  box.querySelector('#chatClose').addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) close(); });
  box.querySelectorAll('#chatChips button').forEach((b) => b.addEventListener('click', () => { input.value = b.textContent; form.requestSubmit(); }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    add(message, 'user');
    input.value = '';
    box.querySelector('#chatChips').hidden = true;
    const typing = add('Thinking…', 'bot typing');
    input.disabled = true;
    form.querySelector('button').disabled = true;
    try {
      const data = await api('/api/chat', { method: 'POST', body: { message, history, farm: getFarm() } });
      typing.remove();
      add(data.reply, 'bot');
      history.push({ role: 'user', content: message }, { role: 'assistant', content: data.reply });
      history = history.slice(-20);
      try { sessionStorage.setItem(key, JSON.stringify(history)); } catch { /* quota */ }
    } catch (err) {
      typing.remove();
      add(err.message, 'err');
    } finally {
      input.disabled = false;
      form.querySelector('button').disabled = false;
      input.focus();
    }
  });
}
