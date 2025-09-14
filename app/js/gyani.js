// Gyani - Floating AI Chat Assistant (using free/local/backends)
(function(){
  const STORAGE_KEY = 'brainiac_gyani_settings_v1';
  const CHAT_KEY = 'brainiac_gyani_chat_v1';

  const defaultSettings = {
    provider: 'ollama', // 'ollama' (local), 'openrouter', 'together' (placeholders)
    endpoint: 'http://localhost:11434', // Ollama default
    model: 'llama3.1:8b',
    apiKey: '' // not used for local; for cloud, user-provided
  };

  function loadSettings(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultSettings; } catch{ return defaultSettings; }
  }
  function saveSettings(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  function loadChat(){ try{ return JSON.parse(localStorage.getItem(CHAT_KEY)) || []; } catch{ return []; } }
  function saveChat(h){ localStorage.setItem(CHAT_KEY, JSON.stringify(h.slice(-100))); }

  const ui = `
  <div id="gyani-widget" class="gyani">
    <button id="gyani-fab" class="stylish-btn" title="Ask Gyani"><i class="fa-solid fa-robot"></i></button>
    <div id="gyani-panel" class="gyani-panel" style="display:none;">
      <div class="gyani-header">
        <div class="title"><i class="fa-solid fa-robot"></i><span>Gyani</span></div>
        <div class="actions"><button id="gyani-settings-btn" title="Settings"><i class="fa-solid fa-gear"></i></button><button id="gyani-close" title="Close"><i class="fa-solid fa-xmark"></i></button></div>
      </div>
      <div id="gyani-messages" class="gyani-messages"></div>
      <div class="gyani-input">
        <input id="gyani-text" placeholder="Ask a question... (e.g., Explain Ohm's Law)" />
        <button id="gyani-send" class="stylish-btn">Send</button>
      </div>
      <div class="gyani-quick">
        <button data-gyani="open:lesson:physics-1">Open Forces Lesson</button>
        <button data-gyani="open:game:speed-arithmetic">Play Speed Math</button>
        <button data-gyani="language:toggle">Switch Language</button>
        <button data-gyani="tts:toggle">Toggle TTS</button>
      </div>
    </div>
    <div id="gyani-settings" class="gyani-settings" style="display:none;">
      <div class="gyani-header"><div class="title"><i class="fa-solid fa-gear"></i><span>Gyani Settings</span></div><div class="actions"><button id="gyani-settings-close"><i class="fa-solid fa-xmark"></i></button></div></div>
      <div class="gyani-body">
        <label>Provider<select id="gyani-provider"><option value="ollama">Ollama (Local)</option><option value="openrouter">OpenRouter (Key)</option><option value="together">Together (Key)</option></select></label>
        <label>Endpoint<input id="gyani-endpoint" placeholder="http://localhost:11434" /></label>
        <label>Model<input id="gyani-model" placeholder="llama3.1:8b" /></label>
        <label>API Key<input id="gyani-key" type="password" placeholder="Optional for local" /></label>
        <label style="display:flex;align-items:center;gap:8px;">Text-to-Speech
          <input id="gyani-tts" type="checkbox" style="transform: scale(1.1);" />
        </label>
        <div class="tts-cats" style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
          <label style="display:flex;align-items:center;gap:6px; font-size:12px;">Chat <input id="gyani-tts-chat" type="checkbox"></label>
          <label style="display:flex;align-items:center;gap:6px; font-size:12px;">Lessons <input id="gyani-tts-lessons" type="checkbox"></label>
          <label style="display:flex;align-items:center;gap:6px; font-size:12px;">Games <input id="gyani-tts-games" type="checkbox"></label>
          <label style="display:flex;align-items:center;gap:6px; font-size:12px;">System <input id="gyani-tts-system" type="checkbox"></label>
        </div>
        <button id="gyani-save" class="stylish-btn">Save</button>
      </div>
    </div>
  </div>`;

  function ensureUI(){ if (!document.getElementById('gyani-widget')) document.body.insertAdjacentHTML('beforeend', ui); }

  function appendMessage(role, text){
    const box = document.getElementById('gyani-messages'); if (!box) return;
    const el = document.createElement('div'); el.className = `msg ${role}`; el.innerHTML = `<div class="bubble">${text.replace(/</g,'&lt;')}</div>`;
    box.appendChild(el); box.scrollTop = box.scrollHeight;
  }

  async function callAI(settings, history, userText){
    // Provider switch; defaults to Ollama streaming if available
    if (settings.provider === 'ollama'){
      try{
        const resp = await fetch(`${settings.endpoint}/api/generate`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: settings.model, prompt: buildPrompt(history, userText), stream: false })
        });
        const data = await resp.json();
        return data.response || 'Sorry, I could not generate a response.';
      }catch(e){ return 'Gyani is offline. Ensure Ollama is running at '+settings.endpoint; }
    }
    // Cloud placeholders (user provides key)
    return 'Configure Gyani in Settings (API key required for selected provider).';
  }

  function buildPrompt(history, userText){
    const context = `You are Gyani, a helpful STEM learning assistant for a rural-friendly gamified PWA named Brainiac. Be concise, encouraging, and explain with simple steps. You can suggest opening lessons (physics-1, chemistry-1, biology-1, math-1) or games (speed-arithmetic, memory-match, ohms-law) using commands like open:lesson:<id> or open:game:<id>.`;
    const recent = history.slice(-6).map(m=>`${m.role.toUpperCase()}: ${m.text}`).join('\n');
    return `${context}\n${recent}\nUSER: ${userText}\nASSISTANT:`;
  }

  function speak(text){ try{ if (window.i18n?.speak) window.i18n.speak(text, { category: 'chat' }); } catch(e){} }

  function handleCommand(cmd){
    if (cmd.startsWith('open:lesson:')){
      const id = cmd.split(':')[2];
      const btn = document.querySelector(`button.start-btn[data-lesson-id="${id}"]`);
      if (btn){ btn.click(); return 'Opening lesson...'; }
      window.location.href = `index.html#student`; setTimeout(()=>{
        const b = document.querySelector(`button.start-btn[data-lesson-id="${id}"]`); if (b) b.click();
      }, 300);
      return 'Opening lesson...';
    }
    if (cmd.startsWith('open:game:')){
      const id = cmd.split(':')[2];
      if (id==='speed-arithmetic' && window.SpeedArithmetic?.open) { window.SpeedArithmetic.open(); return 'Launching game...'; }
      if (id==='memory-match' && window.MemoryMatch?.open) { window.MemoryMatch.open(); return 'Launching game...'; }
      if (id==='ohms-law' && window.OhmsLaw?.open) { window.OhmsLaw.open(); return 'Launching game...'; }
      window.location.href = 'games.html';
      return 'Launching game hub...';
    }
    if (cmd==='language:toggle'){
      const sel = document.getElementById('language-switcher'); if (sel){ sel.value = (sel.value==='en'?'hi':'en'); sel.dispatchEvent(new Event('change')); return 'Language switched.'; }
      return 'Language switcher not found.';
    }
    if (cmd==='tts:toggle'){
      if (window.i18n?.setTTS && window.i18n?.isTTS){ const now = !window.i18n.isTTS(); window.i18n.setTTS(now); return now ? 'TTS enabled.' : 'TTS disabled.'; }
      return 'TTS control not available.';
    }
    return null;
  }

  async function send(){
    const input = document.getElementById('gyani-text'); if (!input) return;
    const text = (input.value||'').trim(); if (!text) return;
    const settings = loadSettings();
    const history = loadChat();
    input.value=''; appendMessage('user', text);

    // Command quick handling
    if (text.startsWith('open:') || text.startsWith('language:')){
      const msg = handleCommand(text);
      appendMessage('assistant', msg||'Done.');
      speak(msg||'');
      history.push({ role:'user', text }); history.push({ role:'assistant', text: msg||'Done.' }); saveChat(history);
      return;
    }

    appendMessage('assistant', 'Thinking...');
    const reply = await callAI(settings, history, text);
    const box = document.getElementById('gyani-messages'); if (box){ box.lastChild.querySelector('.bubble').textContent = reply; }
    speak(reply);
    history.push({ role:'user', text }); history.push({ role:'assistant', text: reply }); saveChat(history);
  }

  function isOpen(el){ return el && getComputedStyle(el).display !== 'none' && !el.classList.contains('closing'); }
  function prefersReduced(){ try{ return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(_){ return false; } }
  function openPanel(){
    const p=document.getElementById('gyani-panel'); if(!p) return;
    if (p.classList.contains('opening') || p.dataset.state==='open') return;
    p.style.display='block';
    p.classList.remove('closing');
    p.classList.add('opening');
    p.dataset.state='opening';
    const finalizeOpen=()=>{ p.classList.remove('opening'); p.dataset.state='open'; const input=document.getElementById('gyani-text'); if(input) { try{ input.focus(); }catch(_){} } };
    if (prefersReduced()) { finalizeOpen(); }
    else {
      const onEnd=(e)=>{ if(e.target!==p || e.animationName!=='gyaniIn') return; p.removeEventListener('animationend', onEnd); finalizeOpen(); };
      p.addEventListener('animationend', onEnd);
    }
    const fab=document.getElementById('gyani-fab'); if(fab){ fab.classList.add('fab-bounce'); setTimeout(()=>fab.classList.remove('fab-bounce'), 650); }
  }
  function closePanel(){
    const p=document.getElementById('gyani-panel'); const s=document.getElementById('gyani-settings');
    const closeEl=(el)=>{
      if(!el) return;
      if (getComputedStyle(el).display==='none') return;
      if (el.classList.contains('closing')) return;
      el.classList.remove('opening');
      el.classList.add('closing');
      el.dataset.state='closing';
      const finalizeClose=()=>{ el.classList.remove('closing'); el.style.display='none'; el.dataset.state='closed'; };
      if (prefersReduced()) { finalizeClose(); }
      else {
        const onEnd=(e)=>{ if(e.target!==el || e.animationName!=='gyaniOut') return; el.removeEventListener('animationend', onEnd); finalizeClose(); };
        el.addEventListener('animationend', onEnd);
      }
    };
    closeEl(s); closeEl(p);
  }
  function togglePanel(){ const p=document.getElementById('gyani-panel'); if(!p) return; if (isOpen(p)) closePanel(); else openPanel(); }
  function openSettings(){ const s=document.getElementById('gyani-settings'); if(!s) return; if(s.classList.contains('opening')) return; s.style.display='block'; s.classList.remove('closing'); s.classList.add('opening'); s.dataset.state='opening'; const finalize=()=>{ s.classList.remove('opening'); s.dataset.state='open'; }; if (prefersReduced()) { finalize(); } else { const onEnd=(e)=>{ if(e.target!==s || e.animationName!=='gyaniIn') return; s.removeEventListener('animationend', onEnd); finalize(); }; s.addEventListener('animationend', onEnd); } }
  function closeSettings(){ const s=document.getElementById('gyani-settings'); if(!s) return; if(getComputedStyle(s).display==='none' || s.classList.contains('closing')) return; s.classList.remove('opening'); s.classList.add('closing'); s.dataset.state='closing'; const finalize=()=>{ s.classList.remove('closing'); s.style.display='none'; s.dataset.state='closed'; }; if (prefersReduced()) { finalize(); } else { const onEnd=(e)=>{ if(e.target!==s || e.animationName!=='gyaniOut') return; s.removeEventListener('animationend', onEnd); finalize(); }; s.addEventListener('animationend', onEnd); } }

  function bind(){
    document.addEventListener('click', (e)=>{
      if (e.target?.closest('#gyani-fab')){ togglePanel(); return; }
      if (e.target?.closest('#gyani-close')){ closePanel(); return; }
      if (e.target?.closest('#gyani-send')){ send(); return; }
      if (e.target?.closest('#gyani-settings-btn')){ const s=loadSettings(); document.getElementById('gyani-provider').value=s.provider; document.getElementById('gyani-endpoint').value=s.endpoint; document.getElementById('gyani-model').value=s.model; document.getElementById('gyani-key').value=s.apiKey||''; const ttsBox=document.getElementById('gyani-tts'); if (ttsBox && window.i18n?.isTTS) ttsBox.checked = window.i18n.isTTS();
        const prefs = window.i18n?.getTTSPrefs ? window.i18n.getTTSPrefs() : null;
        if (prefs){ const m=(id,v)=>{ const el=document.getElementById(id); if(el) el.checked=!!v; }; m('gyani-tts-chat', prefs.chat); m('gyani-tts-lessons', prefs.lessons); m('gyani-tts-games', prefs.games); m('gyani-tts-system', prefs.system); }
        openSettings(); return; }
  if (e.target?.closest('#gyani-settings-close')){ closeSettings(); return; }
      if (e.target?.closest('#gyani-save')){ const s={ provider: document.getElementById('gyani-provider').value, endpoint: document.getElementById('gyani-endpoint').value, model: document.getElementById('gyani-model').value, apiKey: document.getElementById('gyani-key').value }; saveSettings(s); const ttsBox=document.getElementById('gyani-tts'); if (ttsBox && window.i18n?.setTTS) window.i18n.setTTS(!!ttsBox.checked);
        if (window.i18n?.setTTSPrefs){ window.i18n.setTTSPrefs({ chat: !!document.getElementById('gyani-tts-chat')?.checked, lessons: !!document.getElementById('gyani-tts-lessons')?.checked, games: !!document.getElementById('gyani-tts-games')?.checked, system: !!document.getElementById('gyani-tts-system')?.checked }); }
        closeSettings(); return; }
      const quick = e.target?.closest('[data-gyani]'); if (quick){ const cmd=quick.getAttribute('data-gyani'); const msg=handleCommand(cmd); appendMessage('assistant', msg||''); speak(msg||''); return; }
      // Outside click closes the panel (but ignore clicks inside the panel or settings or fab)
      const panel = document.getElementById('gyani-panel');
      if (isOpen(panel) && !e.target.closest('#gyani-panel') && !e.target.closest('#gyani-settings') && !e.target.closest('#gyani-fab')){ closePanel(); }
    });
    document.addEventListener('keydown', (e)=>{
      if (e.key==='Enter' && document.activeElement && document.activeElement.id==='gyani-text') { e.preventDefault(); send(); }
      if (e.key==='Escape'){ closePanel(); }
    });
  }

  function style(){
    const css = `
    .gyani { position: fixed; right: 18px; bottom: 18px; z-index: 9999; }
    #gyani-fab { border-radius: 9999px; padding: 0.85rem 1rem; box-shadow: 0 10px 25px rgba(79,70,229,0.35); }
    .gyani-panel { width: min(360px, 92vw); height: 520px; display: none; margin-top: 10px; border-radius: 1rem; overflow: hidden; background: rgba(15,23,42,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 12px 40px rgba(2,6,23,0.6); }
    .gyani-header { display:flex; align-items:center; justify-content: space-between; padding: 10px 12px; background: linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.25)); }
    .gyani-header .title { display:flex; align-items:center; gap:8px; font-weight: 800; }
    .gyani-header .actions button { background: transparent; color: #e5e7eb; padding: 6px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); }
    .gyani-messages { height: 330px; overflow: auto; padding: 10px; display:flex; flex-direction: column; gap: 8px; }
    .gyani-input { display:flex; gap: 8px; padding: 10px; }
    .gyani-input input { flex:1; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); background: rgba(2,6,23,0.6); color: #e5e7eb; }
    .gyani-quick { display:flex; gap:6px; padding: 8px 10px 12px; flex-wrap: wrap; }
    .gyani-quick button { font-size: 12px; background: rgba(99,102,241,0.18); color: #e5e7eb; border: 1px solid rgba(255,255,255,0.12); border-radius: 9999px; padding: 6px 10px; }
    .msg { display:flex; }
    .msg .bubble { padding: 8px 10px; border-radius: 12px; max-width: 80%; }
    .msg.user { justify-content: flex-end; }
    .msg.user .bubble { background: rgba(59,130,246,0.25); border: 1px solid rgba(59,130,246,0.35); color: #dbeafe; }
    .msg.assistant .bubble { background: rgba(16,185,129,0.18); border: 1px solid rgba(16,185,129,0.35); color: #bbf7d0; }
    .gyani-settings { position: fixed; right: 18px; bottom: 18px; width: min(360px,92vw); border-radius: 1rem; overflow:hidden; background: rgba(15,23,42,0.85); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 16px 50px rgba(2,6,23,0.7); }
    .gyani-settings .gyani-body { padding: 12px; display:grid; gap:10px; }
    .gyani-settings label { display:grid; gap:6px; font-size: 12px; color:#cbd5e1; }
    .gyani-settings input, .gyani-settings select { padding:8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(2,6,23,0.6); color: #e5e7eb; }
    /* Animations */
    @keyframes gyaniIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes gyaniOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(12px) scale(0.98); } }
    @keyframes fabBounce { 0%,100% { transform: translateY(0);} 30% { transform: translateY(-6px);} 60% { transform: translateY(0);} }
    #gyani-fab.fab-bounce { animation: fabBounce .6s cubic-bezier(0.22, 1, 0.36, 1); }
    .gyani-panel.opening { animation: gyaniIn .24s ease forwards; will-change: transform, opacity; }
    .gyani-panel.closing { animation: gyaniOut .18s ease forwards; will-change: transform, opacity; }
    .gyani-settings.opening { animation: gyaniIn .24s ease forwards; will-change: transform, opacity; }
    .gyani-settings.closing { animation: gyaniOut .18s ease forwards; will-change: transform, opacity; }
    @media (prefers-reduced-motion: reduce) {
      .gyani-panel.opening, .gyani-panel.closing, .gyani-settings.opening, .gyani-settings.closing { animation: none !important; }
      #gyani-fab.fab-bounce { animation: none !important; }
    }
    `;
    const tag = document.createElement('style'); tag.textContent = css; document.head.appendChild(tag);
  }

  document.addEventListener('DOMContentLoaded', ()=>{ ensureUI(); style(); bind();
    // Restore chat messages
    const history = loadChat(); history.forEach(m=>appendMessage(m.role, m.text));
  });
})();
