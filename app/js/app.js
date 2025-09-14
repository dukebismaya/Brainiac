// Core app bootstrap shared by all pages
(function(){
  // Theme init
  if (localStorage.theme === 'light' || (!('theme' in localStorage) && matchMedia('(prefers-color-scheme: light)').matches)) {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }

  // Theme toggle if present
  const themeToggle = document.getElementById('theme-icon-container');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const html = document.documentElement;
      const isDark = html.classList.toggle('dark');
      localStorage.theme = isDark ? 'dark' : 'light';
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) themeMeta.setAttribute('content', isDark ? '#000000' : '#4f46e5');
    });
  }

  // PWA: register SW
  window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').then(reg => {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing; if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
      }).catch(console.error);
    }
  });

  // Render local leaderboard if present
  document.addEventListener('DOMContentLoaded', ()=>{
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    try{
      const store = JSON.parse(localStorage.getItem('brainiac_gamification_v1')) || { users:{} };
      const rows = Object.entries(store.users).map(([id,u])=>({ id, xp:u.xp||0 })).sort((a,b)=>b.xp-a.xp).slice(0,5);
      list.innerHTML = rows.map(r=>`<li class="mb-1"><span class="font-semibold">${r.id}</span> — ${r.xp} XP</li>`).join('');
    }catch(e){ /* ignore */ }
  });

  // TTS toggle in Student Portal header
  function updateTTSToggleUI(){
    const btn = document.getElementById('tts-toggle'); if (!btn) return;
    const enabled = window.i18n?.isTTS ? window.i18n.isTTS() : false;
    btn.setAttribute('aria-pressed', String(enabled));
    const text = btn.querySelector('span');
    const icon = btn.querySelector('i');
    if (enabled){
      if (icon) icon.className = 'fa-solid fa-volume-high';
      if (text) text.textContent = 'TTS On';
      btn.title = 'Turn TTS Off';
    } else {
      if (icon) icon.className = 'fa-solid fa-volume-xmark';
      if (text) text.textContent = 'TTS Off';
      btn.title = 'Turn TTS On';
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    updateTTSToggleUI();
    const btn = document.getElementById('tts-toggle');
    if (btn){
      btn.addEventListener('click', ()=>{
        const curr = window.i18n?.isTTS ? window.i18n.isTTS() : false;
        if (window.i18n?.setTTS) window.i18n.setTTS(!curr);
        updateTTSToggleUI();
      });
    }
    // TTS menu
    const menuBtn = document.getElementById('tts-menu-btn');
    const menu = document.getElementById('tts-menu');
    const syncMenu = ()=>{
      const prefs = window.i18n?.getTTSPrefs ? window.i18n.getTTSPrefs() : null;
      if (!prefs) return;
      const map = { chat: 'tts-cat-chat', lessons: 'tts-cat-lessons', games: 'tts-cat-games', system: 'tts-cat-system' };
      Object.entries(map).forEach(([k,id])=>{ const el=document.getElementById(id); if (el) el.checked = !!prefs[k]; });
    };
    if (menuBtn && menu){
      menuBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const willOpen = menu.classList.contains('hidden');
        if (willOpen){ syncMenu(); menu.classList.remove('hidden'); menu.style.display='block'; }
        else { menu.classList.add('hidden'); menu.style.display='none'; }
      });
      document.addEventListener('click', (e)=>{
        if (!menu.classList.contains('hidden')){
          const inside = e.target.closest('#tts-menu') || e.target.closest('#tts-menu-btn');
          if (!inside){ menu.classList.add('hidden'); menu.style.display='none'; }
        }
      });
      // Stop clicks within menu from bubbling to document
      menu.addEventListener('click', (e)=>{ e.stopPropagation(); });
      // Change handlers
      const map = { chat: 'tts-cat-chat', lessons: 'tts-cat-lessons', games: 'tts-cat-games', system: 'tts-cat-system' };
      Object.entries(map).forEach(([k,id])=>{
        const el = document.getElementById(id);
        if (el){
          el.addEventListener('change', ()=>{
            if (window.i18n?.setTTSPrefs){ const patch={}; patch[k]=!!el.checked; window.i18n.setTTSPrefs(patch); }
          });
        }
      });
    }
  });

  window.addEventListener('tts:changed', updateTTSToggleUI);
  window.addEventListener('tts:prefsChanged', updateTTSToggleUI);
  window.addEventListener('tts:prefsChanged', ()=>{
    // If menu is open, keep checkboxes in sync
    const menu = document.getElementById('tts-menu'); if (!menu || menu.classList.contains('hidden')) return;
    const prefs = window.i18n?.getTTSPrefs ? window.i18n.getTTSPrefs() : null; if (!prefs) return;
    const map = { chat: 'tts-cat-chat', lessons: 'tts-cat-lessons', games: 'tts-cat-games', system: 'tts-cat-system' };
    Object.entries(map).forEach(([k,id])=>{ const el=document.getElementById(id); if (el) el.checked = !!prefs[k]; });
  });

  // Simple hash-based page navigation between #home and #student
  function showPage(id){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const el = document.getElementById(id) || document.getElementById('home');
    if (el) el.classList.add('active');
    // If we enter student view, refresh student render
    if (id==='student' && window.Gamification){
      window.dispatchEvent(new CustomEvent('gamification:xp')); // triggers render hook
    }
  }
  function onHash(){ const id = (location.hash||'#home').replace('#',''); showPage(id); }
  window.addEventListener('hashchange', onHash);
  document.addEventListener('DOMContentLoaded', onHash);

  // Ensure clicking Student Portal card always switches view immediately
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[href="#student"]');
    if (a){
      e.preventDefault();
      showPage('student');
      if (location.hash !== '#student') history.pushState(null, '', '#student');
    }
    const back = e.target.closest('a[href="#home"]');
    if (back){
      e.preventDefault();
      showPage('home');
      if (location.hash !== '#home') history.pushState(null, '', '#home');
    }
    const histBack = e.target.closest('a[data-back="history"]');
    if (histBack){
      e.preventDefault();
      // Use history.back when there is navigation history; fallback to home or student
      const canGoBack = (window.history.length > 1);
      if (canGoBack) {
        window.history.back();
      } else {
        // If opened fresh, a sensible fallback
        if (location.pathname.endsWith('games.html') || location.pathname.endsWith('teacher.html')) {
          window.location.href = 'index.html#home';
        } else {
          showPage('home');
          if (location.hash !== '#home') history.pushState(null, '', '#home');
        }
      }
    }
  });
})();
