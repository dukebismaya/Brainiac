// Teacher portal logic
(function(){
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
  });
})();
