// Teacher portal logic
(function(){
  const ASSIGN_KEY = 'brainiac_assignments_v1';
  const CREATED_LESSONS_KEY = 'brainiac_lessons_custom_v1';
  function getData(){
    try{ return JSON.parse(localStorage.getItem('brainiac_gamification_v1')) || { users:{} }; }
    catch{ return { users:{} }; }
  }
  function computeMetrics(users){
    const values = Object.values(users);
    const total = values.length || 1;
    const completionRates = values.map(u=>{
      const lp = u.learningPath||[]; const comp = lp.filter(x=>x.status==='completed').length; return (comp/(lp.length||1))*100; });
    const avgCompletion = Math.round((completionRates.reduce((a,b)=>a+b,0)/total));
    const avgScore = Math.round((values.reduce((sum,u)=> sum + (u.stats?.highScore||0),0)/total));
    const avgTime = 60 + Math.round(Math.random()*90); // placeholder minutes
    return { avgScore, avgCompletion, avgTime };
  }
  function renderHeader(metrics){
    const avg = document.getElementById('class-avg-score'); if (!avg) return false;
    const completion = document.getElementById('class-completion-rate');
    const time = document.getElementById('class-avg-time');
    avg.textContent = metrics.avgScore + '%';
    completion.textContent = metrics.avgCompletion + '%';
    time.textContent = metrics.avgTime + ' min';
    return true;
  }
  function renderRoster(users){
    const container = document.getElementById('student-list-container'); if (!container) return;
    const entries = Object.entries(users);
    container.innerHTML = entries.map(([id,u])=>{
      const comp = (u.learningPath||[]).filter(x=>x.status==='completed').length;
      return `<div class="flex items-center justify-between p-3 bg-slate-800/50 rounded">
        <div>
          <p class="font-semibold">${id}</p>
          <p class="text-xs text-gray-400">XP: ${u.xp} • Level ${u.level} • Badges: ${(u.badges||[]).length}</p>
        </div>
        <span class="text-sm">Completed: ${comp}</span>
      </div>`;
    }).join('');
  }
  function renderCharts(users){
    if (!window.TeacherCharts?.renderProgressChart) return;
    const labels = Object.keys(users);
    const data = Object.values(users).map(u=>u.xp);
    TeacherCharts.renderProgressChart({ labels, data });
  }
  function setupTabs(){
    document.querySelectorAll('#teacher-tools-container .tab-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('#teacher-tools-container .tab-btn').forEach(b=>b.classList.remove('active'));
        document.querySelectorAll('#teacher-tools-container .tab-content').forEach(c=>c.classList.remove('active'));
        btn.classList.add('active');
        const id = btn.getAttribute('data-tab');
        document.getElementById(id+'-tab')?.classList.add('active');
      });
    });
  }
  function exportCSV(users){
    const rows = [['User','XP','Level','Badges','Completed','HighScore']];
    Object.entries(users).forEach(([id,u])=>{
      const comp = (u.learningPath||[]).filter(x=>x.status==='completed').length;
      rows.push([id, u.xp||0, u.level||1, (u.badges||[]).length, comp, u.stats?.highScore||0]);
    });
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'brainiac-class.csv'; a.click(); URL.revokeObjectURL(url);
  }
  function awardTop(users){
    // pick top 3 by XP and award a special badge
    const arr = Object.entries(users).map(([id,u])=>({ id, xp:u.xp||0 })).sort((a,b)=>b.xp-a.xp).slice(0,3);
    const store = getData();
    arr.forEach(({id})=>{
      const u = store.users[id]; if (!u) return;
      if (!u.badges) u.badges = [];
      if (!u.badges.find(b=>b.code==='teacher-top')){
        u.badges.push({ name:'Top Performer', code:'teacher-top', at: Date.now() });
      }
    });
    localStorage.setItem('brainiac_gamification_v1', JSON.stringify(store));
    if (window.i18n?.speak) window.i18n.speak('Top performers awarded badges', { category:'system' });
  }
  function setupActions(users){
    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) exportBtn.addEventListener('click', ()=> exportCSV(users));
    const awardBtn = document.getElementById('award-top-btn');
    if (awardBtn) awardBtn.addEventListener('click', ()=>{ awardTop(users); renderRoster(getData().users); renderCharts(getData().users); });
  }

  // Assignments: save selected lesson/group selection
  function setupAssignments(){
    const selectLesson = document.getElementById('assign-lesson-select');
    const selectGroup = document.getElementById('assign-group-select');
    const btn = document.getElementById('assign-content-btn');
    if (!selectLesson || !btn) return;
    // Populate lessons based on Gamification meta
    const meta = window.Gamification?.getLessonsMeta?.() || {};
    selectLesson.innerHTML = Object.entries(meta).map(([id,m])=>`<option value="${id}">${m.title||id}</option>`).join('');
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const lessonId = selectLesson.value;
      const group = selectGroup?.value || 'all';
      const rec = { lessonId, group, at: Date.now() };
      const arr = JSON.parse(localStorage.getItem(ASSIGN_KEY) || '[]');
      arr.push(rec);
      localStorage.setItem(ASSIGN_KEY, JSON.stringify(arr));
      if (window.i18n?.speak) window.i18n.speak('Assignment queued', { category:'system' });
    });
  }

  // Content creation: basic local persistence
  function setupCreateLesson(){
    const form = document.getElementById('create-lesson-form'); if (!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const title = document.getElementById('create-title')?.value?.trim();
      const content = document.getElementById('create-content')?.value?.trim();
      const q = document.getElementById('create-q')?.value?.trim();
      const a = document.getElementById('create-a')?.value?.trim();
      const fileInput = document.getElementById('create-file-input');
      const fileNameDisplay = document.getElementById('file-name-display');
      const id = `custom-${Date.now()}`;
      const lesson = { id, title: title || id, content: content || '', quiz: (q && a) ? [{ q, a: [a], correct: 0 }] : [] };
      const arr = JSON.parse(localStorage.getItem(CREATED_LESSONS_KEY) || '[]'); arr.push(lesson);
      localStorage.setItem(CREATED_LESSONS_KEY, JSON.stringify(arr));
      if (fileInput?.files?.length) {
        // We cannot persist file binary offline without IndexedDB/FS; store name as reference
        const name = fileInput.files[0].name; if (fileNameDisplay) fileNameDisplay.textContent = name;
      }
      if (window.i18n?.speak) window.i18n.speak('Lesson created locally', { category:'system' });
      form.reset();
    });
    const fileInput = document.getElementById('create-file-input');
    if (fileInput){ fileInput.addEventListener('change', ()=>{ const el=document.getElementById('file-name-display'); if (el) el.textContent = fileInput.files?.[0]?.name || 'No file chosen.'; }); }
  }
  function setupSync(){
    function sync(){ if (!navigator.onLine) return; /* TODO: send to server */ }
    window.addEventListener('online', sync);
    setInterval(sync, 30000);
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    const store = getData();
    const ok = renderHeader(computeMetrics(store.users)); if (!ok) return; // only on teacher page
    renderRoster(store.users);
    renderCharts(store.users);
    setupTabs();
    setupSync();
    setupActions(store.users);
    setupAssignments();
    setupCreateLesson();
  });
})();
