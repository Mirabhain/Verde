// DEMO ONLY: no server authentication. Never store passwords.
let mode='signup';const $=id=>document.getElementById(id);
function setMode(next){mode=next;$('nameField').style.display=mode==='signup'?'flex':'none';$('signupTab').classList.toggle('selected',mode==='signup');$('loginTab').classList.toggle('selected',mode==='login');$('authHeading').textContent=mode==='signup'?'Create your account':'Welcome back';}
$('signupTab').addEventListener('click',()=>setMode('signup'));
$('loginTab').addEventListener('click',()=>setMode('login'));
$('loginForm').addEventListener('submit',e=>{e.preventDefault();const email=$('authEmail').value.trim();const pw=$('authPassword').value;const name=$('authName').value.trim()||email.split('@')[0];if(!email.includes('@')||pw.length<8){$('authError').textContent='Enter a valid email and a password of at least 8 characters.';return;}localStorage.setItem('verdeai_demo_user',JSON.stringify({name,email}));$('authPassword').value='';window.location.href='dashboard.html';});
