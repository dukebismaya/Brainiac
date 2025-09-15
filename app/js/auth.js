// Simple client-side Auth: username/password with salted SHA-256 hashes, stored in localStorage
(function(){
  const USERS_KEY = 'brainiac_auth_users_v1';
  const SESSION_KEY = 'brainiac_session_userId';

  function loadUsers(){ try{ return JSON.parse(localStorage.getItem(USERS_KEY)) || { users:{} }; }catch(_){ return { users:{} }; } }
  function saveUsers(db){ localStorage.setItem(USERS_KEY, JSON.stringify(db)); }
  function currentUser(){ return localStorage.getItem(SESSION_KEY) || null; }
  function setSession(username){ if (username) localStorage.setItem(SESSION_KEY, username); else localStorage.removeItem(SESSION_KEY); }

  async function sha256Hex(str){ const enc = new TextEncoder(); const buf = await crypto.subtle.digest('SHA-256', enc.encode(str)); return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join(''); }
  function genSalt(len=16){ const a = new Uint8Array(len); crypto.getRandomValues(a); return Array.from(a).map(b=>b.toString(16).padStart(2,'0')).join(''); }

  async function signup(username, password){
    username = (username||'').trim(); password = (password||'');
    if (username.length < 3) throw new Error('Username must be at least 3 characters.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    const db = loadUsers(); if (db.users[username]) throw new Error('Username already exists.');
    const salt = genSalt(12); const hash = await sha256Hex(salt + password);
    db.users[username] = { salt, hash, createdAt: Date.now() };
    saveUsers(db); setSession(username);
    try{ window.dispatchEvent(new CustomEvent('auth:login', { detail:{ username } })); }catch(_){ }
    return { username };
  }

  async function login(username, password){
    username = (username||'').trim(); password = (password||'');
    const db = loadUsers(); const rec = db.users[username]; if (!rec) throw new Error('Invalid username or password.');
    const hash = await sha256Hex(rec.salt + password);
    if (hash !== rec.hash) throw new Error('Invalid username or password.');
    setSession(username);
    try{ window.dispatchEvent(new CustomEvent('auth:login', { detail:{ username } })); }catch(_){ }
    return { username };
  }

  function logout(){ const user = currentUser(); setSession(null); try{ window.dispatchEvent(new CustomEvent('auth:logout', { detail:{ username: user } })); }catch(_){ } }

  // UI Helpers
  function ensureUI(){
    if (document.getElementById('auth-modal')) return;
    const html = `
    <div id="auth-modal" class="auth-modal" style="display:none;">
      <div class="auth-card">
        <header class="auth-header"><div class="title"><i class="fa-solid fa-user"></i><span>Sign in to Brainiac</span></div><button id="auth-close" class="x"><i class="fa-solid fa-xmark"></i></button></header>
        <div class="auth-tabs">
          <button id="auth-tab-login" class="tab active">Login</button>
          <button id="auth-tab-signup" class="tab">Sign Up</button>
        </div>
        <div class="auth-body">
          <form id="auth-form-login" class="auth-form" autocomplete="on">
            <label>Username<input id="auth-login-username" required minlength="3" /></label>
            <label>Password<input id="auth-login-password" type="password" required minlength="6" /></label>
            <button class="stylish-btn" type="submit">Login</button>
            <div id="auth-login-error" class="auth-error"></div>
          </form>
          <form id="auth-form-signup" class="auth-form" style="display:none;" autocomplete="on">
            <label>Username<input id="auth-signup-username" required minlength="3" /></label>
            <label>Password<input id="auth-signup-password" type="password" required minlength="6" /></label>
            <button class="stylish-btn" type="submit">Create Account</button>
            <div id="auth-signup-error" class="auth-error"></div>
          </form>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const css = `
      .auth-modal{ position: fixed; inset:0; background: rgba(0,0,0,0.65); display:none; align-items:center; justify-content:center; z-index: 60; }
      .auth-card{ width:min(380px,92vw); background: rgba(15,23,42,0.7); backdrop-filter: blur(10px); border:1px solid rgba(255,255,255,0.12); border-radius: 1rem; padding: 0.5rem 0.75rem; }
      .auth-header{ display:flex; align-items:center; justify-content:space-between; padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);} 
      .auth-header .title{ display:flex; gap:8px; align-items:center; font-weight:800; }
      .auth-header .x{ background: transparent; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: #e5e7eb; padding: 6px; }
      .auth-tabs{ display:flex; gap:6px; padding: 8px; }
      .auth-tabs .tab{ flex:1; padding: 8px; border-radius: 8px; border:1px solid rgba(255,255,255,0.12); color:#e5e7eb; background: rgba(2,6,23,0.4); font-weight:700; }
      .auth-tabs .tab.active{ background: rgba(79,70,229,0.35); border-color: rgba(79,70,229,0.6); }
      .auth-body{ padding: 8px; }
      .auth-form{ display:grid; gap:10px; }
      .auth-form label{ display:grid; gap:6px; color:#cbd5e1; font-size: 0.9rem; }
      .auth-form input{ padding: 10px; border-radius: 10px; border:1px solid rgba(255,255,255,0.12); background: rgba(2,6,23,0.5); color:#e5e7eb; }
      .auth-error{ color:#fecaca; font-size: 0.85rem; min-height: 1.25rem; }
    `;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  }

  function renderAuthMenu(){
    const slot = document.getElementById('auth-menu'); if (!slot) return;
    const user = currentUser();
    if (!user){
      slot.innerHTML = `<button id="auth-open" class="stylish-btn text-sm py-2"><i class="fa-solid fa-right-to-bracket"></i><span class="hidden sm:inline"> Login / Sign Up</span></button>`;
    } else {
      slot.innerHTML = `
        <div class="relative">
          <button id="auth-user-btn" class="stylish-btn text-sm py-2"><i class="fa-solid fa-user"></i><span class="hidden sm:inline"> ${user}</span></button>
          <div id="auth-user-menu" class="hidden absolute right-0 top-full mt-2 w-44 glass-container rounded-xl p-3 z-50">
            <button id="auth-logout" class="w-full text-left px-2 py-1 rounded hover:bg-slate-700"><i class="fa-solid fa-arrow-right-from-bracket mr-2"></i>Logout</button>
          </div>
        </div>`;
    }
  }

  // Role chooser modal
  function ensureRoleChooserUI(){
    if (document.getElementById('role-chooser-modal')) return;
    const html = `
    <div id="role-chooser-modal" class="auth-modal" style="display:none;">
      <div class="auth-card">
        <header class="auth-header"><div class="title"><i class="fa-solid fa-user-gear"></i><span>Choose your role</span></div><button id="role-chooser-close" class="x"><i class="fa-solid fa-xmark"></i></button></header>
        <div class="auth-body">
          <div class="grid gap-3">
            <button class="stylish-btn justify-center" data-role-select="student"><i class="fa-solid fa-user-graduate"></i><span>I am Student</span></button>
            <button class="stylish-btn justify-center" data-role-select="teacher"><i class="fa-solid fa-chalkboard-user"></i><span>I am Teacher</span></button>
            <button class="stylish-btn justify-center" data-role-select="guest"><i class="fa-solid fa-user"></i><span>Continue as Guest</span></button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }
  function showRoleChooser(){ ensureRoleChooserUI(); const m=document.getElementById('role-chooser-modal'); if(m) m.style.display='flex'; }
  function hideRoleChooser(){ const m=document.getElementById('role-chooser-modal'); if(m) m.style.display='none'; }
  function applyRoleAndNavigate(kind){
    try{
      if (kind==='guest'){ window.Auth?.logout?.(); localStorage.setItem('brainiac_role','student'); hideRoleChooser(); window.location.href='student.html'; return; }
      if (kind==='student'){ localStorage.setItem('brainiac_role','student'); hideRoleChooser(); window.location.href='student.html'; return; }
      if (kind==='teacher'){ localStorage.setItem('brainiac_role','teacher'); hideRoleChooser(); window.location.href='teacher.html'; return; }
    }catch(_){ }
  }

  function bind(){
    document.addEventListener('click', async (e)=>{
      if (e.target.closest('#auth-open')){ ensureUI(); document.getElementById('auth-modal').style.display='flex'; return; }
      if (e.target.closest('#auth-close')){ const m=document.getElementById('auth-modal'); if(m) m.style.display='none'; return; }
      if (e.target.closest('#auth-tab-login')){ document.getElementById('auth-tab-login').classList.add('active'); document.getElementById('auth-tab-signup').classList.remove('active'); document.getElementById('auth-form-login').style.display='grid'; document.getElementById('auth-form-signup').style.display='none'; return; }
      if (e.target.closest('#auth-tab-signup')){ document.getElementById('auth-tab-signup').classList.add('active'); document.getElementById('auth-tab-login').classList.remove('active'); document.getElementById('auth-form-signup').style.display='grid'; document.getElementById('auth-form-login').style.display='none'; return; }
      const userBtn = e.target.closest('#auth-user-btn');
      if (userBtn){ const menu = document.getElementById('auth-user-menu'); if(menu){ menu.classList.toggle('hidden'); menu.style.display = menu.classList.contains('hidden')? 'none':'block'; } return; }
      if (!e.target.closest('#auth-user-menu')){ const menu=document.getElementById('auth-user-menu'); if(menu){ menu.classList.add('hidden'); menu.style.display='none'; } }
      if (e.target.closest('#role-chooser-close')){ hideRoleChooser(); return; }
      const roleBtn = e.target.closest('[data-role-select]'); if (roleBtn){ const role = roleBtn.getAttribute('data-role-select'); applyRoleAndNavigate(role); return; }
    });

    document.addEventListener('submit', async (e)=>{
      if (e.target && e.target.id==='auth-form-login'){
        e.preventDefault(); const u=document.getElementById('auth-login-username').value; const p=document.getElementById('auth-login-password').value; const err=document.getElementById('auth-login-error'); err.textContent='';
        try{ await login(u,p); document.getElementById('auth-modal').style.display='none'; renderAuthMenu(); if (!localStorage.getItem('brainiac_role')) showRoleChooser(); }
        catch(ex){ err.textContent = ex.message || 'Login failed.'; }
      }
      if (e.target && e.target.id==='auth-form-signup'){
        e.preventDefault(); const u=document.getElementById('auth-signup-username').value; const p=document.getElementById('auth-signup-password').value; const err=document.getElementById('auth-signup-error'); err.textContent='';
        try{ await signup(u,p); document.getElementById('auth-modal').style.display='none'; renderAuthMenu(); if (!localStorage.getItem('brainiac_role')) showRoleChooser(); }
        catch(ex){ err.textContent = ex.message || 'Signup failed.'; }
      }
    });

    document.addEventListener('click', (e)=>{
      if (e.target && e.target.id==='auth-logout'){ logout(); renderAuthMenu(); }
    });

    window.addEventListener('auth:login', ()=>{ renderAuthMenu(); });
    window.addEventListener('auth:logout', ()=>{ renderAuthMenu(); });
    document.addEventListener('DOMContentLoaded', renderAuthMenu);
  }

  // Public API
  window.Auth = { signup, login, logout, currentUser, renderAuthMenu, showRoleChooser };

  document.addEventListener('DOMContentLoaded', ()=>{ ensureUI(); ensureRoleChooserUI(); bind(); renderAuthMenu(); });
})();