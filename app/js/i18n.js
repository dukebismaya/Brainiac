// Simple i18n loader for locales/*.json
window.i18n = (function(){
  const PREFS_KEY = 'brainiac_tts_prefs';
  const defaultPrefs = { chat: false, lessons: true, games: true, system: true };
  function loadPrefs(){ try{ const p = JSON.parse(localStorage.getItem(PREFS_KEY)||'{}'); return { ...defaultPrefs, ...p }; }catch(_){ return { ...defaultPrefs }; } }
  function savePrefs(p){ try{ localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }catch(_){} }

  const state = {
    lang: localStorage.getItem('brainiac_lang') || 'en',
    dict: {},
    tts: (localStorage.getItem('brainiac_tts') ?? 'on') !== 'off',
    prefs: loadPrefs()
  };
  async function load(lang){
    try {
      const res = await fetch(`locales/${lang}.json`);
      state.dict = await res.json();
      state.lang = lang;
      localStorage.setItem('brainiac_lang', lang);
      apply();
    } catch(e){ console.warn('i18n load failed', e); }
  }
  function t(key){ return state.dict[key] || key; }
  function apply(){
    document.querySelectorAll('[data-lang-key]').forEach(el => {
      const k = el.getAttribute('data-lang-key');
      if (k && state.dict[k]) el.textContent = state.dict[k];
    });
    const btn = document.getElementById('lang-btn-text');
    if (btn) btn.textContent = state.lang === 'hi' ? 'हिन्दी' : 'English';
  }
  // attach switcher if exists
  document.addEventListener('change', (e)=>{
    const sel = e.target;
    if (sel && sel.id === 'language-switcher') load(sel.value);
  });
  // initial load
  load(state.lang);
  // Text-to-Speech helper
  function setTTS(enabled){
    state.tts = !!enabled;
    try{ localStorage.setItem('brainiac_tts', enabled ? 'on' : 'off'); }catch(_){ }
    if (!state.tts && 'speechSynthesis' in window){
      try { window.speechSynthesis.cancel(); } catch(_){}
    }
    try{ window.dispatchEvent(new CustomEvent('tts:changed', { detail: { enabled: state.tts, prefs: getTTSPrefs() } })); }catch(_){ }
  }
  function isTTS(){ return !!state.tts; }
  function setTTSPrefs(patch){ state.prefs = { ...state.prefs, ...patch }; savePrefs(state.prefs); try{ window.dispatchEvent(new CustomEvent('tts:prefsChanged', { detail: { enabled: state.tts, prefs: getTTSPrefs() } })); }catch(_){ } }
  function getTTSPrefs(){ return { ...state.prefs }; }
  function isTTSEnabledFor(category){ if (!state.tts) return false; if (!category) return true; const v = state.prefs?.[category]; return v === undefined ? true : !!v; }
  function speak(text, opts={}){
    try{
      if (!state.tts) return;
      const cat = opts.category;
      if (cat && !isTTSEnabledFor(cat)) return;
      if (!('speechSynthesis' in window)) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = state.lang === 'hi' ? 'hi-IN' : 'en-US';
      utter.rate = opts.rate || 1;
      utter.pitch = opts.pitch || 1;
      utter.volume = opts.volume ?? 1;
      window.speechSynthesis.speak(utter);
    }catch(e){ /* no-op */ }
  }
  return { load, t, apply, speak, setTTS, isTTS, setTTSPrefs, getTTSPrefs, isTTSEnabledFor, get lang(){return state.lang;} };
})();
