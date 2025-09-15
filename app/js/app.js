// Core app bootstrap shared by all pages
(function(){
  // Helpers: auth logout and role switching
  function logoutSession(){
    try { if (window.Auth?.logout) { window.Auth.logout(); } else { localStorage.removeItem('brainiac_session_userId'); window.dispatchEvent(new Event('auth:logout')); } } catch {}
  }
  function switchRole(role){
    // Always logout when switching roles
    logoutSession();
    try { localStorage.setItem('brainiac_role', role); } catch {}
  }
  // Theme init
  if (localStorage.theme === 'light' || (!('theme' in localStorage) && matchMedia('(prefers-color-scheme: light)').matches)) {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }

  // Apply role class to body for contextual hiding
  function applyRoleClass(){
    const role = localStorage.getItem('brainiac_role');
    document.body.classList.remove('role-student','role-teacher','role-guest');
    if (role==='student') document.body.classList.add('role-student');
    else if (role==='teacher') document.body.classList.add('role-teacher');
    else document.body.classList.add('role-guest');
  }
  document.addEventListener('DOMContentLoaded', applyRoleClass);
  window.addEventListener('auth:login', applyRoleClass);
  window.addEventListener('auth:logout', applyRoleClass);

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

  // Minimalist theme toggle via localStorage flag
  function applyMinimalist(){
    const enable = localStorage.getItem('brainiac_minimalist') === '1';
    document.body.classList.toggle('minimalist', enable);
  }
  document.addEventListener('DOMContentLoaded', applyMinimalist);

  // Expose quick keyboard toggle (Shift+M) to preview
  document.addEventListener('keydown', (e)=>{
    if (e.shiftKey && (e.key==='M' || e.key==='m')){
      const curr = localStorage.getItem('brainiac_minimalist') === '1';
      localStorage.setItem('brainiac_minimalist', curr ? '0' : '1');
      applyMinimalist();
    }
  });

  // Scroll reveal with IntersectionObserver
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function initReveal(){
    if (prefersReduced) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(ent=>{ if (ent.isIntersecting){ ent.target.classList.add('visible'); io.unobserve(ent.target); } });
    }, { threshold: 0.1 });
    // Auto-mark common containers as reveal for sleek entrance
    document.querySelectorAll('.portal-card, .glass-container').forEach(el=> el.classList.add('reveal'));
    document.querySelectorAll('.reveal').forEach(el=> io.observe(el));
  }
  document.addEventListener('DOMContentLoaded', initReveal);

  // Subtle parallax on background ripples
  function initParallax(){
    if (prefersReduced) return;
    let ticking = false;
    function onScroll(){
      if (!ticking){
        window.requestAnimationFrame(()=>{
          const y = window.scrollY || 0;
          document.querySelectorAll('.ripple').forEach((el, idx)=>{
            const depth = (idx+1)*0.02; // small movement
            el.style.transform = `translate3d(0, ${y*depth}px, 0)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  document.addEventListener('DOMContentLoaded', initParallax);

  // Tilt and ripple interactions
  function initTiltAndRipple(){
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Tilt for portal cards
    if (!reduced){
      document.querySelectorAll('.portal-card').forEach(card=>{
        card.setAttribute('data-tilt','');
        const content = card.querySelector('.portal-card-content'); if (!content) return;
        let rafId = 0;
        card.addEventListener('mousemove', (e)=>{
          if (rafId) cancelAnimationFrame(rafId);
          const rect = card.getBoundingClientRect();
          const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
          const dx = (e.clientX - cx) / rect.width; const dy = (e.clientY - cy) / rect.height;
          const rx = (-dy * 10).toFixed(2)+'deg'; const ry = (dx * 12).toFixed(2)+'deg';
          const sx = e.clientX - rect.left; const sy = e.clientY - rect.top;
          rafId = requestAnimationFrame(()=>{
            content.style.setProperty('--rx', rx);
            content.style.setProperty('--ry', ry);
            content.style.setProperty('--shine-x', sx + 'px');
            content.style.setProperty('--shine-y', sy + 'px');
          });
        });
        card.addEventListener('mouseleave', ()=>{ content.style.setProperty('--rx','0deg'); content.style.setProperty('--ry','0deg'); });
      });
    }
    // Ripple for buttons
    document.body.addEventListener('click', (e)=>{
      const btn = e.target.closest('.stylish-btn'); if (!btn) return;
      const r = document.createElement('span'); r.className = 'btn-ripple';
      const rect = btn.getBoundingClientRect(); r.style.left = (e.clientX - rect.left) + 'px'; r.style.top = (e.clientY - rect.top) + 'px';
      btn.appendChild(r); setTimeout(()=> r.remove(), 650);
    });
  }
  document.addEventListener('DOMContentLoaded', initTiltAndRipple);

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

  // Grade filter
  document.addEventListener('DOMContentLoaded', ()=>{
    const sel = document.getElementById('grade-filter');
    if (!sel) return;
    // init
    const val = localStorage.getItem('brainiac_grade_filter') || 'all';
    sel.value = val;
    sel.addEventListener('change', ()=>{
      localStorage.setItem('brainiac_grade_filter', sel.value);
      // trigger a student re-render
      window.dispatchEvent(new CustomEvent('gamification:xp'));
    });
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

  // Continue CTA on Student page
  function updateContinueCTA(){
    const cta = document.getElementById('continue-cta');
    if (!cta || !window.Gamification) return;
    const uid = window.Gamification.currentUserId();
    const last = window.Gamification.getLastOpenedLesson(uid);
    const next = window.Gamification.getNextUnlockedLesson(uid);
    const target = last || next;
    const labelEl = document.getElementById('continue-label');
    const btn = document.getElementById('continue-btn');
    if (target){
      const meta = window.Gamification.getLessonMeta?.(target);
      const title = meta?.title || target;
      // find status for target
      const s = window.Gamification.getUserSummary?.(uid);
      const status = s?.learningPath?.find(l=>l.id===target)?.status || '';
      const statusTxt = status==='completed' ? 'Completed' : status==='unlocked' ? 'Unlocked' : '';
      if (labelEl) labelEl.textContent = statusTxt ? `${title} • ${statusTxt}` : title;
      if (btn) btn.setAttribute('data-lesson-id', target);
      cta.classList.remove('hidden');
    } else {
      cta.classList.add('hidden');
    }
  }
  document.addEventListener('DOMContentLoaded', updateContinueCTA);
  window.addEventListener('gamification:lesson', updateContinueCTA);
  window.addEventListener('gamification:xp', updateContinueCTA);
  window.addEventListener('gamification:continue', updateContinueCTA);
  window.addEventListener('auth:login', updateContinueCTA);
  window.addEventListener('auth:logout', updateContinueCTA);

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('#continue-btn');
    if (!btn) return;
    const id = btn.getAttribute('data-lesson-id');
    if (!id) return;
    const uid = window.Gamification?.currentUserId?.();
    if (uid) window.Gamification?.setLastOpenedLesson(uid, id);
    if (window.Lessons?.open) {
      e.preventDefault();
      window.Lessons.open(id);
    }
  });

  // Simple hash-based page navigation between #home and #student
  // Note: Student portal now lives on student.html, so we only ensure #home is active on landing
  function showPage(id){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const el = document.getElementById(id) || document.getElementById('home');
    if (el) el.classList.add('active');
  }
  document.addEventListener('DOMContentLoaded', ()=> showPage('home'));

  // Role selection + navigation
  document.addEventListener('click', (e)=>{
    // Persist role on landing
    const roleLink = e.target.closest('a[data-role]');
    if (roleLink){
      const role = roleLink.getAttribute('data-role');
      if (role) {
        try { localStorage.setItem('brainiac_role', role); } catch {}
      }
    }
    // Landing role chooser buttons
    const roleBtn = e.target.closest('[data-role-select]');
    if (roleBtn){
      const r = roleBtn.getAttribute('data-role-select');
      if (r==='guest'){ logoutSession(); localStorage.setItem('brainiac_role','student'); window.location.href='student.html'; return; }
      if (r==='student'){ localStorage.setItem('brainiac_role','student'); window.location.href='student.html'; return; }
      if (r==='teacher'){ localStorage.setItem('brainiac_role','teacher'); window.location.href='teacher.html'; return; }
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
    const switchRoleBtn = e.target.closest('[data-action="switch-role"]');
    if (switchRoleBtn){
      try { localStorage.removeItem('brainiac_role'); } catch {}
      logoutSession();
      window.location.href = 'index.html';
    }
    // Intercept direct nav to student/teacher portals to enforce logout + role switch
    const toTeacher = e.target.closest('a[href$="teacher.html"]');
    if (toTeacher){
      e.preventDefault();
      switchRole('teacher');
      window.location.href = 'teacher.html';
      return;
    }
    const toStudent = e.target.closest('a[href$="student.html"]');
    if (toStudent){
      e.preventDefault();
      switchRole('student');
      window.location.href = 'student.html';
      return;
    }
    // Profile modal open/close
    const profileBtn = e.target.closest('#profile-btn');
    if (profileBtn){
      const m = document.getElementById('profile-modal'); if (m){ m.style.display='flex'; populateProfile(); }
    }
    const profileClose = e.target.closest('#profile-close');
    if (profileClose){ const m = document.getElementById('profile-modal'); if (m){ m.style.display='none'; } }
  });

  function populateProfile(){
    const uid = window.Gamification?.currentUserId?.() || 'guest';
    const sum = window.Gamification?.getUserSummary?.(uid);
    const usernameEl = document.getElementById('profile-username'); if (usernameEl) usernameEl.textContent = uid==='guest' ? 'Guest' : uid;
    const avatar = document.getElementById('profile-avatar');
    if (avatar){
      const initials = (uid && uid!=='guest') ? uid.split(/\s+/).map(p=>p[0]).slice(0,2).join('').toUpperCase() : '👩‍🎓';
      avatar.textContent = initials;
    }
    if (sum){
      const lvl = document.getElementById('profile-level'); if (lvl) lvl.textContent = String(sum.level||1);
      const xp = document.getElementById('profile-xp'); if (xp) xp.textContent = String(sum.xp||0);
      const grid = document.getElementById('profile-badges'); if (grid){
        const meta = window.Gamification?.getBadgesMeta?.();
        const all = (sum.badges||[]).slice().sort((a,b)=>b.at-a.at);
        const items = all.slice(0,9);
        grid.innerHTML = items.map(b=>{
          const key = Object.keys(meta||{}).find(k=> b.code.startsWith(k)) || 'level-up';
          const icon = meta?.[key]?.icon || 'fa-medal';
          return `<div class="badge-chip"><i class="fa-solid ${icon}"></i><div class="meta"><span class="name">${b.name}</span></div></div>`;
        }).join('') || '<div class="text-sm text-gray-500">No badges yet.</div>';
        // simple view all behavior: if more than 9, clicking grid toggles full list
        grid.onclick = ()=>{
          if (!all.length) return;
          const expanded = grid.getAttribute('data-expanded')==='1';
          const arr = expanded ? all.slice(0,9) : all;
          grid.innerHTML = arr.map(b=>{
            const key = Object.keys(meta||{}).find(k=> b.code.startsWith(k)) || 'level-up';
            const icon = meta?.[key]?.icon || 'fa-medal';
            return `<div class="badge-chip"><i class="fa-solid ${icon}"></i><div class="meta"><span class="name">${b.name}</span></div></div>`;
          }).join('');
          grid.setAttribute('data-expanded', expanded ? '0' : '1');
        };
      }
    }
  }

  // Auto-redirect from landing page if a role is already chosen
  document.addEventListener('DOMContentLoaded', ()=>{
    const onLanding = /(^|\/)index\.html?$/.test(location.pathname) || location.pathname.endsWith('/');
    if (onLanding){
      const role = localStorage.getItem('brainiac_role');
      if (role === 'student') {
        // Defer to allow SW/theme init, then redirect
        setTimeout(()=>{ window.location.href = 'student.html'; }, 0);
      } else if (role === 'teacher') {
        setTimeout(()=>{ window.location.href = 'teacher.html'; }, 0);
      }
    }
    // On portal pages, enforce role alignment and logout when mismatched
    const isStudent = location.pathname.endsWith('student.html');
    const isTeacher = location.pathname.endsWith('teacher.html');
    if (isStudent || isTeacher){
      const required = isStudent ? 'student' : 'teacher';
      const current = localStorage.getItem('brainiac_role');
      if (current !== required){
        switchRole(required);
      }
      // Hide opposite portal nav links
      const hideSel = isStudent ? 'a[href$="teacher.html"]' : 'a[href$="student.html"]';
      document.querySelectorAll(hideSel).forEach(a=>{ a.style.display='none'; });
    }
  });
})();
