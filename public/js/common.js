// Shared navigation: every menu item is a REAL HTML link (no hidden page switching).
const currentPath = location.pathname.replace(/\/$/, '') || '/';
document.querySelectorAll('.sidebar a').forEach(a => {
  const href = (a.getAttribute('href') || '').replace(/\/$/, '') || '/';
  const cleanHref = href.replace(/\.html$/, '');
  const cleanCurrent = currentPath.replace(/\.html$/, '');
  a.classList.toggle('active', href === currentPath || cleanHref === cleanCurrent);
});
const user=JSON.parse(localStorage.getItem('verdeai_demo_user')||'null');
const status=document.querySelector('#userStatus');if(status)status.textContent=user?`Farmer: ${user.name} · local demo`:'Guest demo · data stored in this browser';
