// Doubts module: localStorage-backed Q/A for students and teachers
(function(){
  const KEY = 'brainiac_doubts_v1';
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||[]; }catch{ return []; } }
  function save(list){ localStorage.setItem(KEY, JSON.stringify(list)); }
  function newId(){ return 'd_'+Math.random().toString(36).slice(2,9); }
  function now(){ return new Date().toISOString(); }
  function currentUser(){ return window.Gamification?.currentUserId?.() || 'guest'; }
  function getSessionUser(){ return window.localStorage.getItem('brainiac_session_userId') || 'guest'; }

  function postDoubt({ title, topic }){
    const list = load();
    const item = { id:newId(), title: (title||'').trim(), topic:(topic||'').trim(), by: currentUser(), at: now(), status:'open', answers:[] };
    if (!item.title) return null;
    list.unshift(item); save(list); return item;
  }
  function addAnswer(id, text, answeredBy, mode){
    const list = load(); const it = list.find(x=>x.id===id); if (!it) return false;
    it.answers = it.answers||[]; it.answers.push({ text, by: answeredBy||currentUser(), at: now(), via: mode||'teacher' });
    it.status = 'answered'; save(list); return true;
  }
  function getAll(){ return load(); }
  function getOpen(){ return load().filter(x=>x.status==='open'); }
  function getMine(){ const uid=currentUser(); return load().filter(x=>x.by===uid); }

  function filterItems(filter){
    const all = getAll(); const uid = currentUser();
    switch(filter){
      case 'open': return all.filter(x=>x.status==='open');
      case 'answered': return all.filter(x=>x.status==='answered');
      case 'mine': return all.filter(x=>x.by===uid);
      default: return all;
    }
  }

  // toast utility
  function toast(msg){
    const t = document.createElement('div');
    t.className = 'fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-semibold glass-container z-50';
    t.textContent = msg; document.body.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(8px)'; t.style.transition='all .3s'; }, 2000);
    setTimeout(()=> t.remove(), 2600);
  }

  // Simple AI helper: use Gyani if available
  async function askAI(question){
    if (!question) return 'Ask a clear question.';
    // Reuse Gyani's call if exposed, else fallback to a message
    try{
      if (window.Gyani?.ask){ return await window.Gyani.ask(question); }
      if (window.i18n?.speak) window.i18n.speak('Opening AI assistant', { category:'chat' });
      const fab = document.getElementById('gyani-fab'); if (fab) fab.click();
      return 'Open the AI assistant to continue the chat.';
    }catch(e){ return 'AI not available.'; }
  }

  // Student UI wiring
  function renderStudent(){
    const listEl = document.getElementById('doubts-list'); if (!listEl) return;
    const active = localStorage.getItem('brainiac_dfilter')||'all';
    highlightFilterButtons('#doubt-filters', active, 'data-dfilter');
    const items = filterItems(active);
    listEl.innerHTML = items.map(it=>{
      const ans = (it.answers||[]).slice(-1)[0];
      const status = it.status==='answered' ? '<span class="chip chip-success">Answered</span>' : '<span class="chip chip-info">Open</span>';
      const topic = it.topic ? `<span class=\"chip chip-info\">${it.topic}</span>` : '';
      const answerHtml = ans ? `<div class=\"mt-2 text-sm text-gray-300\"><i class=\"fa-solid fa-reply mr-1\"></i>${ans.text}</div>` : '';
      return `<div class=\"bg-slate-800/60 rounded p-3\">
        <div class=\"flex items-center justify-between\"><div class=\"font-semibold\">${it.title}</div><div class=\"text-xs space-x-2\">${topic}${status}</div></div>
        <div class=\"text-xs text-gray-400\">by ${it.by} • ${new Date(it.at).toLocaleString()}</div>
        ${answerHtml}
        <div class=\"mt-2 flex justify-end gap-2\">
          <button class=\"stylish-btn text-xs py-1\" data-dopen-id=\"${it.id}\"><i class=\"fa-solid fa-eye mr-1\"></i>Open</button>
          ${it.status!=='answered' ? `<button class=\"stylish-btn text-xs py-1\" data-dquickai-id=\"${it.id}\"><i class=\"fa-solid fa-robot mr-1\"></i>Ask AI</button>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  function highlightFilterButtons(containerSel, active, attr){
    const wrap = document.querySelector(containerSel); if (!wrap) return;
    wrap.querySelectorAll('button').forEach(b=>{
      if (b.getAttribute(attr)===active) b.classList.add('chip-success'); else b.classList.remove('chip-success');
    });
  }

  function openStudentModal(item){
    const modal = document.getElementById('doubt-modal'); if (!modal) return;
    const body = document.getElementById('doubt-modal-body');
    const title = document.getElementById('doubt-modal-title');
    title.textContent = item.title;
    const answers = (item.answers||[]).map(a=>`<div class="p-2 rounded bg-slate-900/40 text-sm">${a.text} <span class="text-xs text-gray-500">— ${a.by}</span></div>`).join('');
    const inputBlock = item.status==='open' ? `<div class="flex gap-2 mt-2"><input id="dmodal-input" class="cool-input" placeholder="Type your answer or notes..."/><button class="stylish-btn text-xs py-1" id="dmodal-ai"><i class="fa-solid fa-robot mr-1"></i>Ask AI</button><button class="stylish-btn text-xs py-1" id="dmodal-post"><i class="fa-solid fa-paper-plane mr-1"></i>Post</button></div>` : '';
    body.innerHTML = `<div class="text-xs text-gray-400 mb-2">Topic: ${item.topic||'—'} • by ${item.by} • ${new Date(item.at).toLocaleString()}</div>${answers||'<div class="text-xs text-gray-500">No answers yet.</div>'}${inputBlock}`;
    modal.style.display='flex';
    // Bind buttons
    const aiBtn = document.getElementById('dmodal-ai'); if (aiBtn){ aiBtn.onclick = async ()=>{
      const q = item.title; const ans = await askAI(q); if (ans){ addAnswer(item.id, ans, 'ai', 'ai'); renderStudent(); openStudentModal(load().find(x=>x.id===item.id)); toast('AI answer added'); }
    }; }
    const postBtn = document.getElementById('dmodal-post'); if (postBtn){ postBtn.onclick = ()=>{
      const val = document.getElementById('dmodal-input')?.value?.trim(); if (!val) return; addAnswer(item.id, val, getSessionUser(), 'student'); renderStudent(); openStudentModal(load().find(x=>x.id===item.id)); toast('Answer posted');
    }; }
    const close = document.getElementById('doubt-modal-close'); if (close){ close.onclick = ()=>{ modal.style.display='none'; }; }
    modal.addEventListener('click', (e)=>{ if (e.target===modal) modal.style.display='none'; }, { once:true });
  }

  function bindStudent(){
    document.addEventListener('submit', async (e)=>{
      if (e.target?.id==='doubt-form'){
        e.preventDefault();
        const title = document.getElementById('doubt-title')?.value;
        const topic = document.getElementById('doubt-topic')?.value;
        const item = postDoubt({ title, topic });
        if (!item){ return; }
        document.getElementById('doubt-form').reset();
        renderStudent();
      }
    });
    document.addEventListener('click', async (e)=>{
      const ask = e.target?.closest('#doubt-ask-ai'); if (ask){
        const q = document.getElementById('doubt-title')?.value?.trim();
        const ans = await askAI(q);
        if (ans && q){ const newest = getAll().find(d=>d.title===q); if (newest){ addAnswer(newest.id, ans, 'ai', 'ai'); renderStudent(); } }
      }
      const refresh = e.target?.closest('#doubt-refresh'); if (refresh){ renderStudent(); }
      const filt = e.target?.closest('[data-dfilter]'); if (filt){ localStorage.setItem('brainiac_dfilter', filt.getAttribute('data-dfilter')); renderStudent(); }
      const openBtn = e.target?.closest('[data-dopen-id]'); if (openBtn){ const id = openBtn.getAttribute('data-dopen-id'); const item = load().find(x=>x.id===id); if (item) openStudentModal(item); }
      const quickAI = e.target?.closest('[data-dquickai-id]'); if (quickAI){ const id = quickAI.getAttribute('data-dquickai-id'); const item = load().find(x=>x.id===id); if (item){ const ans = await askAI(item.title); if (ans){ addAnswer(item.id, ans, 'ai', 'ai'); renderStudent(); toast('AI answer added'); } } }
    });
    document.addEventListener('DOMContentLoaded', renderStudent);
    window.addEventListener('auth:login', renderStudent);
    window.addEventListener('auth:logout', renderStudent);
  }

  // Teacher UI wiring
  function renderTeacher(){
    const listEl = document.getElementById('teacher-doubts-list'); if (!listEl) return;
    const active = localStorage.getItem('brainiac_tdfilter')||'all';
    highlightFilterButtons('#teacher-doubt-filters', active, 'data-tdfilter');
    const items = filterItems(active);
    listEl.innerHTML = items.map(it=>{
      const answers = (it.answers||[]).map(a=>`<div class=\"mt-1 text-sm text-gray-300\">• ${a.text} <span class=\"text-xs text-gray-500\">— ${a.by}</span></div>`).join('');
      return `<div class=\"bg-slate-800/60 rounded p-3\">
        <div class=\"font-semibold\">${it.title}</div>
        <div class=\"text-xs text-gray-400\">by ${it.by} • ${new Date(it.at).toLocaleString()}</div>
        <div class=\"mt-2\">${answers||'<span class=\"text-xs text-gray-500\">No answers yet.</span>'}</div>
        <div class=\"mt-2 flex flex-wrap gap-2 justify-end\">
          ${it.status!=='answered'?`<button class=\"stylish-btn text-xs py-1\" data-t-ai=\"${it.id}\"><i class=\"fa-solid fa-robot mr-1\"></i>AI Suggest</button>`:''}
          <button class=\"stylish-btn text-xs py-1\" data-t-open=\"${it.id}\"><i class=\"fa-solid fa-eye mr-1\"></i>Open</button>
        </div>
      </div>`;
    }).join('');
  }
  function bindTeacher(){
    document.addEventListener('click', async (e)=>{
      const filt = e.target?.closest('[data-tdfilter]'); if (filt){ localStorage.setItem('brainiac_tdfilter', filt.getAttribute('data-tdfilter')); renderTeacher(); }
      const open = e.target?.closest('[data-t-open]'); if (open){ const id = open.getAttribute('data-t-open'); const item = load().find(x=>x.id===id); if (item) openTeacherModal(item); }
      const ai = e.target?.closest('[data-t-ai]'); if (ai){ const id = ai.getAttribute('data-t-ai'); const item = load().find(x=>x.id===id); if (item){ const ans = await askAI(item.title); if (ans){ addAnswer(item.id, ans, 'ai', 'ai'); renderTeacher(); toast('AI suggestion added'); } } }
    });
    document.addEventListener('DOMContentLoaded', renderTeacher);
  }

  function openTeacherModal(item){
    const modal = document.getElementById('teacher-doubt-modal'); if (!modal) return;
    const body = document.getElementById('teacher-doubt-modal-body');
    const title = document.getElementById('teacher-doubt-modal-title');
    title.textContent = item.title;
    const answers = (item.answers||[]).map(a=>`<div class="p-2 rounded bg-slate-900/40 text-sm">${a.text} <span class="text-xs text-gray-500">— ${a.by}</span></div>`).join('');
    body.innerHTML = `<div class="text-xs text-gray-400 mb-2">Topic: ${item.topic||'—'} • by ${item.by} • ${new Date(item.at).toLocaleString()}</div>${answers||'<div class="text-xs text-gray-500">No answers yet.</div>'}
    <div class="flex gap-2 mt-3"><input id="tdmodal-input" class="cool-input" placeholder="Type teacher answer..."/><button class="stylish-btn text-xs py-1" id="tdmodal-post"><i class="fa-solid fa-paper-plane mr-1"></i>Post</button></div>`;
    modal.style.display='flex';
    const post = document.getElementById('tdmodal-post'); if (post){ post.onclick = ()=>{ const val = document.getElementById('tdmodal-input')?.value?.trim(); if (!val) return; addAnswer(item.id, val, getSessionUser()||'teacher', 'teacher'); renderTeacher(); openTeacherModal(load().find(x=>x.id===item.id)); toast('Answer posted'); } }
    const close = document.getElementById('teacher-doubt-modal-close'); if (close){ close.onclick = ()=>{ modal.style.display='none'; }; }
    modal.addEventListener('click', (e)=>{ if (e.target===modal) modal.style.display='none'; }, { once:true });
  }

  // Expose small API
  window.Doubts = { postDoubt, addAnswer, getAll, getOpen, getMine, askAI };

  // Auto-bind for both portals if containers exist
  bindStudent();
  bindTeacher();
})();
