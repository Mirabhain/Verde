// Shared navigation: every menu item is a REAL HTML link (no hidden page switching).
const current=location.pathname.split('/').pop()||'index.html';
document.querySelectorAll('.sidebar a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===current));
const user=JSON.parse(localStorage.getItem('verdeai_demo_user')||'null');
const status=document.querySelector('#userStatus');if(status)status.textContent=user?`Farmer: ${user.name} · local demo`:'Guest demo · data stored in this browser';
