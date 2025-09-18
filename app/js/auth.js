// Simple client-side Auth: username/password with salted SHA-256 hashes, stored in localStorage
(function () {
  const USERS_KEY = 'brainiac_auth_users_v1';
  const SESSION_KEY = 'brainiac_session_userId';

  function loadUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || { users: {} }; } catch (_) { return { users: {} }; } }
  function saveUsers(db) { localStorage.setItem(USERS_KEY, JSON.stringify(db)); }
  function currentUser() { return localStorage.getItem(SESSION_KEY) || null; }
  function setSession(username) { if (username) localStorage.setItem(SESSION_KEY, username); else localStorage.removeItem(SESSION_KEY); }

  async function sha256Hex(str) { const enc = new TextEncoder(); const buf = await crypto.subtle.digest('SHA-256', enc.encode(str)); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''); }
  function genSalt(len = 16) { const a = new Uint8Array(len); crypto.getRandomValues(a); return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join(''); }

  async function signup(username, password) {
    username = (username || '').trim(); password = (password || '');
    if (username.length < 3) throw new Error('Username must be at least 3 characters.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
    const db = loadUsers(); if (db.users[username]) throw new Error('Username already exists.');
    const salt = genSalt(12); const hash = await sha256Hex(salt + password);
    db.users[username] = { salt, hash, createdAt: Date.now() };
    saveUsers(db); setSession(username);
    try { window.dispatchEvent(new CustomEvent('auth:login', { detail: { username } })); } catch (_) { }
    return { username };
  }

  async function login(username, password) {
    username = (username || '').trim(); password = (password || '');
    const db = loadUsers(); const rec = db.users[username]; if (!rec) throw new Error('Invalid username or password.');
    const hash = await sha256Hex(rec.salt + password);
    if (hash !== rec.hash) throw new Error('Invalid username or password.');
    setSession(username);
    try { window.dispatchEvent(new CustomEvent('auth:login', { detail: { username } })); } catch (_) { }
    return { username };
  }

  function logout() { const user = currentUser(); setSession(null); try { window.dispatchEvent(new CustomEvent('auth:logout', { detail: { username: user } })); } catch (_) { } }

  // UI Helpers
  function ensureUI() {
    if (document.getElementById('auth-modal')) return;
    const html = `
  <div id="auth-modal" class="auth-modal" style="display:none;">
    <div class="auth-card">
      <header class="auth-header">
        <div class="title"><i class="fa-solid fa-user"></i><span>Welcome to Brainiac</span></div>
        <button id="auth-close" class="x"><i class="fa-solid fa-xmark"></i></button>
      </header>
      <div class="auth-tabs">
        <button id="auth-tab-login" class="tab active">Login</button>
        <button id="auth-tab-signup" class="tab">Sign Up</button>
      </div>
      <div class="auth-body">
        <!-- LOGIN -->
        <form id="auth-form-login" class="auth-form" autocomplete="on">
          <div class="input-group">
            <i class="fa-solid fa-user input-icon"></i>
            <input id="auth-login-username" class="cool-input" placeholder="Enter your username" required minlength="3" />
            <label for="auth-login-username" class="cool-label">Username</label>
          </div>
          <div class="input-group">
            <i class="fa-solid fa-lock input-icon"></i>
            <input id="auth-login-password" class="cool-input password-field" type="password" placeholder="Enter your password" required minlength="6" />
            <label for="auth-login-password" class="cool-label">Password</label>
            <i class="fa-solid fa-eye toggle-eye"></i>
          </div>
          <button class="stylish-btn" type="submit">Login</button>
          <div id="auth-login-error" class="auth-error"></div>
        </form>
        <!-- SIGNUP -->
        <form id="auth-form-signup" class="auth-form" style="display:none;" autocomplete="on">
          <div class="input-group">
            <i class="fa-solid fa-user-plus input-icon"></i>
            <input id="auth-signup-username" class="cool-input" placeholder="Choose a username" required minlength="3" />
            <label for="auth-signup-username" class="cool-label">Username</label>
          </div>
          <div class="input-group">
            <i class="fa-solid fa-lock input-icon"></i>
            <input id="auth-signup-password" class="cool-input password-field" type="password" placeholder="Create a password" required minlength="6" />
            <label for="auth-signup-password" class="cool-label">Password</label>
            <i class="fa-solid fa-eye toggle-eye"></i>
          </div>
          <button class="stylish-btn" type="submit">Create Account</button>
          <div id="auth-signup-error" class="auth-error"></div>
        </form>
      </div>
    </div>
  </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const css = `
    .auth-modal{ position: fixed; inset:0; background: rgba(0,0,0,0.65); display:none; align-items:center; justify-content:center; z-index: 60; }
    .auth-card{ width:min(380px,92vw); background: rgba(15,23,42,0.8); backdrop-filter: blur(12px); border:1px solid rgba(255,255,255,0.12); border-radius: 1rem; padding: 0.75rem 1rem; }
    .auth-header{ display:flex; align-items:center; justify-content:space-between; padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);} 
    .auth-header .title{ display:flex; gap:8px; align-items:center; font-weight:800; }
    .auth-header .x{ background: transparent; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; color: #e5e7eb; padding: 6px; }
    .auth-tabs{ display:flex; gap:6px; padding: 8px; }
    .auth-tabs .tab{ flex:1; padding: 8px; border-radius: 8px; border:1px solid rgba(255,255,255,0.12); color:#e5e7eb; background: rgba(2,6,23,0.4); font-weight:700; }
    .auth-tabs .tab.active{ background: rgba(79,70,229,0.4); border-color: rgba(79,70,229,0.7); }
    .auth-body{ padding: 10px; }
    .auth-form{ display:grid; gap:14px; }
    .auth-error{ color:#fecaca; font-size: 0.85rem; min-height: 1.25rem; }
    .auth-form button.stylish-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  border: none;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #4f46e5, #3b82f6); /* indigo → blue */
  transition: background 0.3s ease, transform 0.2s ease;
}

.auth-form button.stylish-btn:hover {
  background: linear-gradient(135deg, #6366f1, #2563eb);
  transform: translateY(-2px);
}

.auth-form button.stylish-btn:active {
  transform: translateY(0);
}


    /* input groups */
    .input-group{ position:relative; }
    .input-icon{ position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); color:#64748b; pointer-events:none; }
    .cool-input{ width:100%; background:rgba(30,41,59,0.5); border:1px solid #334155; border-radius:0.5rem; padding:0.75rem 2.5rem; font-size:1rem; color:#fff; }
    .cool-input::placeholder{ color:transparent; }
    .cool-input:focus{ border-color:#4f46e5; outline:none; }
    .cool-label{ position:absolute; left:2.5rem; top:0.9rem; font-size:1rem; color:#94a3b8; transition:all 0.3s ease; pointer-events:none; }
    .cool-input:focus + .cool-label,
    .cool-input:not(:placeholder-shown) + .cool-label { top:-0.5rem; left:2rem; font-size:0.75rem; color:#60a5fa; background:#0f172a; padding:0 0.25rem; border-radius:0.25rem; }
    .cool-input:focus ~ .input-icon { color:#60a5fa; }

    /* eye icon */
    .toggle-eye{ position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); color:#94a3b8; cursor:pointer; }
    .toggle-eye.active{ color:#60a5fa; }
  `;
    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

    // JS for eye toggle
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('toggle-eye')) {
        const eye = e.target;
        const input = eye.parentElement.querySelector('.password-field');
        if (input.type === 'password') { input.type = 'text'; eye.classList.add('active'); eye.classList.replace('fa-eye', 'fa-eye-slash'); }
        else { input.type = 'password'; eye.classList.remove('active'); eye.classList.replace('fa-eye-slash', 'fa-eye'); }
      }
    });
  }


  function renderAuthMenu() {
    const slot = document.getElementById('auth-menu'); if (!slot) return;
    const user = currentUser();
    if (!user) {
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
  function ensureRoleChooserUI() {
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
  function showRoleChooser() { ensureRoleChooserUI(); const m = document.getElementById('role-chooser-modal'); if (m) m.style.display = 'flex'; }
  function hideRoleChooser() { const m = document.getElementById('role-chooser-modal'); if (m) m.style.display = 'none'; }
  function applyRoleAndNavigate(kind) {
    try {
      if (kind === 'guest') { window.Auth?.logout?.(); localStorage.setItem('brainiac_role', 'student'); hideRoleChooser(); window.location.href = 'student.html'; return; }
      if (kind === 'student') { localStorage.setItem('brainiac_role', 'student'); hideRoleChooser(); window.location.href = 'student.html'; return; }
      if (kind === 'teacher') { localStorage.setItem('brainiac_role', 'teacher'); hideRoleChooser(); window.location.href = 'teacher.html'; return; }
    } catch (_) { }
  }

  function bind() {
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#auth-open')) { ensureUI(); document.getElementById('auth-modal').style.display = 'flex'; return; }
      if (e.target.closest('#auth-close')) { const m = document.getElementById('auth-modal'); if (m) m.style.display = 'none'; return; }
      if (e.target.closest('#auth-tab-login')) { document.getElementById('auth-tab-login').classList.add('active'); document.getElementById('auth-tab-signup').classList.remove('active'); document.getElementById('auth-form-login').style.display = 'grid'; document.getElementById('auth-form-signup').style.display = 'none'; return; }
      if (e.target.closest('#auth-tab-signup')) { document.getElementById('auth-tab-signup').classList.add('active'); document.getElementById('auth-tab-login').classList.remove('active'); document.getElementById('auth-form-signup').style.display = 'grid'; document.getElementById('auth-form-login').style.display = 'none'; return; }
      const userBtn = e.target.closest('#auth-user-btn');
      if (userBtn) { const menu = document.getElementById('auth-user-menu'); if (menu) { menu.classList.toggle('hidden'); menu.style.display = menu.classList.contains('hidden') ? 'none' : 'block'; } return; }
      if (!e.target.closest('#auth-user-menu')) { const menu = document.getElementById('auth-user-menu'); if (menu) { menu.classList.add('hidden'); menu.style.display = 'none'; } }
      if (e.target.closest('#role-chooser-close')) { hideRoleChooser(); return; }
      const roleBtn = e.target.closest('[data-role-select]'); if (roleBtn) { const role = roleBtn.getAttribute('data-role-select'); applyRoleAndNavigate(role); return; }
    });

    document.addEventListener('submit', async (e) => {
      if (e.target && e.target.id === 'auth-form-login') {
        e.preventDefault(); const u = document.getElementById('auth-login-username').value; const p = document.getElementById('auth-login-password').value; const err = document.getElementById('auth-login-error'); err.textContent = '';
        try { await login(u, p); document.getElementById('auth-modal').style.display = 'none'; renderAuthMenu(); if (!localStorage.getItem('brainiac_role')) showRoleChooser(); }
        catch (ex) { err.textContent = ex.message || 'Login failed.'; }
      }
      if (e.target && e.target.id === 'auth-form-signup') {
        e.preventDefault(); const u = document.getElementById('auth-signup-username').value; const p = document.getElementById('auth-signup-password').value; const err = document.getElementById('auth-signup-error'); err.textContent = '';
        try { await signup(u, p); document.getElementById('auth-modal').style.display = 'none'; renderAuthMenu(); if (!localStorage.getItem('brainiac_role')) showRoleChooser(); }
        catch (ex) { err.textContent = ex.message || 'Signup failed.'; }
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'auth-logout') { logout(); renderAuthMenu(); }
    });

    window.addEventListener('auth:login', () => { renderAuthMenu(); });
    window.addEventListener('auth:logout', () => { renderAuthMenu(); });
    document.addEventListener('DOMContentLoaded', renderAuthMenu);
  }

  // Public API
  window.Auth = { signup, login, logout, currentUser, renderAuthMenu, showRoleChooser };

  document.addEventListener('DOMContentLoaded', () => { ensureUI(); ensureRoleChooserUI(); bind(); renderAuthMenu(); });
})();