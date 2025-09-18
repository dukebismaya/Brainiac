// Games hub logic
(function(){
  // Unlock check for each game based on learning path
  function isUnlocked(gameId){
    const uid = (window.Gamification?.currentUserId && window.Gamification.currentUserId()) || 'guest';
    const s = window.Gamification?.getUserSummary ? window.Gamification.getUserSummary(uid) : null;
    if (!s) return true;
    const map = {
      'speed-arithmetic':'math-1',
      'memory-match':'chemistry-1',
      'ohms-law':'physics-1',
      'projectile-motion':'physics-1',
      'equation-balancer':'chemistry-1',
      'logic-truth-table':'math-1',
      'shortest-path':'math-1',
      'calculus-derivative':'math-1'
    };
    const lessonId = map[gameId];
    const item = s.learningPath.find(l=>l.id===lessonId);
    return item ? item.status !== 'locked' : true;
  }

  function renderGames(){
    const container = document.getElementById('games-container');
    if (!container) return;
    const games = [
      { id: 'projectile-motion', title: 'Projectile Motion', icon: 'fa-parachute-box', color:'text-indigo-400', description: 'Compute range, time of flight, or max height given v₀, θ, g.' },
      { id: 'equation-balancer', title: 'Equation Balancer', icon: 'fa-flask', color:'text-emerald-400', description: 'Balance real chemical equations by choosing correct coefficients.' },
      { id: 'logic-truth-table', title: 'Logic Truth Table', icon: 'fa-diagram-project', color:'text-cyan-400', description: 'Fill the truth table for a given boolean expression.' },
      { id: 'shortest-path', title: 'Shortest Path', icon: 'fa-route', color:'text-rose-400', description: 'Find the shortest distance on a weighted graph (Dijkstra).' },
      { id: 'calculus-derivative', title: 'Derivative Challenge', icon: 'fa-square-root-variable', color:'text-fuchsia-400', description: "Compute f'(x₀) for a given function." },
      { id: 'speed-arithmetic', title: 'Speed Arithmetic', icon: 'fa-calculator', color:'text-purple-400', description: 'Solve math problems against the clock!' },
      { id: 'memory-match', title: 'Memory Match', icon: 'fa-brain', color:'text-emerald-400', description: 'Flip cards to match element symbols quickly.' },
      { id: 'ohms-law', title: "Ohm's Law", icon: 'fa-bolt', color:'text-amber-400', description: 'Find V=IR. Compute voltage, current, or resistance.' }
    ];
    container.innerHTML = games.map(g=>{
      const locked = !isUnlocked(g.id);
      return `
        <div class="glass-container rounded-2xl p-6 flex flex-col shadow-lg">
          <div class="flex items-center gap-3 mb-2">
            <i class="fa-solid ${g.icon} ${g.color}"></i>
            <h3 class="text-xl font-bold">${g.title}</h3>
          </div>
          <p class="text-sm opacity-80 mb-4">${g.description}</p>
          <button data-game-id="${g.id}" class="stylish-btn mt-auto" ${locked? 'disabled' : ''}>${locked? 'Locked' : 'Play'}</button>
        </div>
      `;
    }).join('');
  }

  function onGamesClick(e){
    const btn = e.target.closest('button[data-game-id]');
    if (!btn) return;
    if (btn.disabled) return;
    const id = btn.getAttribute('data-game-id');
    if (id === 'speed-arithmetic'){
      if (window.SpeedArithmetic?.open) window.SpeedArithmetic.open();
    } else if (id === 'memory-match'){
      if (window.MemoryMatch?.open) window.MemoryMatch.open();
    } else if (id === 'ohms-law'){
      if (window.OhmsLaw?.open) window.OhmsLaw.open();
    } else if (id === 'projectile-motion'){
      if (window.ProjectileMotion?.open) window.ProjectileMotion.open();
    } else if (id === 'equation-balancer'){
      if (window.EquationBalancer?.open) window.EquationBalancer.open();
    } else if (id === 'logic-truth-table'){
      if (window.LogicTruthTable?.open) window.LogicTruthTable.open();
    } else if (id === 'shortest-path'){
      if (window.ShortestPath?.open) window.ShortestPath.open();
    } else if (id === 'calculus-derivative'){
      if (window.CalculusDerivative?.open) window.CalculusDerivative.open();
    }
  }

  // Memory Match game
  const MemoryMatch = (function(){
    const html = `
    <div id="memory-modal" class="game-modal" style="display:none;">
      <div class="modal-card text-center w-full max-w-md mx-4">
        <h2 class="text-2xl font-bold text-white mb-2">Memory Match</h2>
        <div class="game-meta"><p class="text-sm">Time: <span id="memory-time">0</span>s</p><p class="text-sm">Moves: <span id="memory-moves">0</span></p></div>
        <div class="progress-track mb-3"><div id="memory-progress" class="progress-bar"></div></div>
        <div id="memory-grid" class="grid grid-cols-4 gap-2 mb-3"></div>
        <p class="text-gray-300 mb-3">Matches: <span id="memory-matches">0</span>/8</p>
        <button id="memory-close" class="stylish-btn">Close</button>
      </div>
    </div>`;

    const symbols = ['H','He','Li','Be','B','C','N','O'];
    let first=null, locked=false, matches=0, moves=0, t=0, timerId=null;

    function ensureModal(){
      if (!document.getElementById('memory-modal')){
        document.body.insertAdjacentHTML('beforeend', html);
      }
    }
    function build(){
      const grid = document.getElementById('memory-grid');
      const deck = [...symbols, ...symbols].sort(()=>Math.random()-0.5);
      grid.innerHTML = deck.map((s,i)=>`<button class="card bg-slate-800/60 rounded p-3" data-idx="${i}" data-sym="${s}">?</button>`).join('');
    }
    function updateHUD(){
      const tm = document.getElementById('memory-time'); if (tm) tm.textContent = String(t);
      const mv = document.getElementById('memory-moves'); if (mv) mv.textContent = String(moves);
      const mm = document.getElementById('memory-matches'); if (mm) mm.textContent = String(matches);
      const progress = document.getElementById('memory-progress'); if (progress) progress.style.width = `${Math.min(100,(t/60)*100)}%`;
    }
    function open(){
      ensureModal();
      const m = document.getElementById('memory-modal');
      matches=0; moves=0; t=0; first=null; locked=false; updateHUD();
      build();
      m.style.display='flex';
      if (timerId) clearInterval(timerId);
      timerId = setInterval(()=>{ t++; updateHUD(); }, 1000);
    }
    function end(){
      if (timerId) { clearInterval(timerId); timerId=null; }
      // Record score and possibly award badge
      try{
        const uid = window.Gamification?.currentUserId()||'guest';
        window.Gamification?.recordGame(uid,'memory-match', 20);
        if (t<=45 && moves<=24){ window.Gamification?.awardBadge(uid,'Memory Master','memory-master'); }
  if (window.i18n?.speak) window.i18n.speak('Great job! You matched all cards.', { category: 'games' });
      }catch(e){}
    }
    function close(){
      const m=document.getElementById('memory-modal');
      if (m){ m.style.display='none'; }
      if (timerId){ clearInterval(timerId); timerId=null; }
    }
    function onGridClick(e){
      const btn = e.target.closest('.card'); if (!btn || locked) return;
      if (btn.disabled) return;
      btn.textContent = btn.dataset.sym; btn.disabled = true;
      if (!first){ first = btn; return; }
      locked = true;
      setTimeout(()=>{
        moves++; updateHUD();
        if (first.dataset.sym === btn.dataset.sym){
          matches++; updateHUD();
          if (matches===8){ end(); close(); }
        } else {
          first.disabled=false; first.textContent='?';
          btn.disabled=false; btn.textContent='?';
        }
        first=null; locked=false;
      }, 500);
    }

    // Global listeners (delegated)
    document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='memory-close') close(); });
    document.addEventListener('click', (e)=>{
      if (document.getElementById('memory-modal') && e.target.closest('#memory-grid')){ onGridClick(e); }
    });

    return { open, close };
  })();

  // Expose to window for launcher
  window.MemoryMatch = MemoryMatch;

  // Ohm's Law mini-tool
  const OhmsLaw = (function(){
    const html = `
    <div id="ohms-modal" class="game-modal" style="display:none;">
      <div class="modal-card text-center w-full max-w-md mx-4">
        <h2 class="text-2xl font-bold text-white mb-2">Ohm's Law</h2>
        <p class="text-gray-300 mb-4">Solve for the missing value: V = I × R</p>
        <div class="grid grid-cols-3 gap-2 mb-4">
          <input id="ohm-v" placeholder="V" class="p-2 rounded bg-slate-800/50 border border-slate-600 text-white text-center"/>
          <input id="ohm-i" placeholder="I" class="p-2 rounded bg-slate-800/50 border border-slate-600 text-white text-center"/>
          <input id="ohm-r" placeholder="R" class="p-2 rounded bg-slate-800/50 border border-slate-600 text-white text-center"/>
        </div>
        <button id="ohm-check" class="stylish-btn mb-2">Check</button>
        <button id="ohm-close" class="stylish-btn">Close</button>
        <p id="ohm-msg" class="mt-3 text-sm"></p>
      </div>
    </div>`;
    function ensureModal(){ if (!document.getElementById('ohms-modal')) document.body.insertAdjacentHTML('beforeend', html); }
    function open(){ ensureModal(); document.getElementById('ohms-modal').style.display='flex'; }
    function close(){ const m=document.getElementById('ohms-modal'); if(m){m.style.display='none';} }
    function check(){
      const V = parseFloat(document.getElementById('ohm-v').value);
      const I = parseFloat(document.getElementById('ohm-i').value);
      const R = parseFloat(document.getElementById('ohm-r').value);
      const msg = document.getElementById('ohm-msg');
      let correct = false;
      if (isNaN(V) && !isNaN(I) && !isNaN(R)) { const val=+(I*R).toFixed(2); document.getElementById('ohm-v').value=String(val); correct=true; }
      else if (isNaN(I) && !isNaN(V) && !isNaN(R)) { const val=+(V/R).toFixed(2); document.getElementById('ohm-i').value=String(val); correct=true; }
      else if (isNaN(R) && !isNaN(V) && !isNaN(I)) { const val=+(V/I).toFixed(2); document.getElementById('ohm-r').value=String(val); correct=true; }
      if (correct){
        msg.textContent='Correct!'; msg.className='mt-3 text-sm text-green-400';
        try{
          const uid = window.Gamification?.currentUserId()||'guest';
          window.Gamification?.recordGame(uid,'ohms-law', 15);
          if (window.i18n?.speak) window.i18n.speak('Correct!', { category: 'games' });
        }catch(e){}
      } else {
        msg.textContent='Fill exactly two fields.'; msg.className='mt-3 text-sm text-yellow-400';
      }
    }
    document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='ohm-close') close(); });
    document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='ohm-check') check(); });
    return { open, close };
  })();

  window.OhmsLaw = OhmsLaw;

  document.addEventListener('DOMContentLoaded', ()=>{
    const container = document.getElementById('games-container');
    if (!container) return; // only on games page
    renderGames();
    container.addEventListener('click', onGamesClick);

    // Support deep link to quiz via hash
    if (location.hash.startsWith('#quiz:')){
      const lessonId = location.hash.slice('#quiz:'.length);
      let score = 0; const total = 3;
      if (confirm(`Start quiz for ${lessonId}?`)){
        for (let i=0;i<total;i++){
          const a = Math.floor(Math.random()*10)+1, b = Math.floor(Math.random()*10)+1;
          const ans = prompt(`${i+1}) What is ${a}+${b}?`);
          if (parseInt(ans||'0',10)===a+b) score++;
        }
        const uid = window.Gamification?.currentUserId()||'guest';
        window.Gamification?.completeLesson(uid, lessonId, score, total);
        alert(`Quiz complete. Score ${score}/${total}`);
        location.hash = '';
      }
    }
  });
})();
