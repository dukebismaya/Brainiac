// Simple modal game implementation
(function(){
  const html = `
  <div id="speed-arithmetic-modal" class="game-modal" style="display:none;">
    <div class="modal-card text-center w-full max-w-md mx-4">
      <div id="game-intro">
        <h2 class="text-2xl font-bold text-white mb-2">Speed Arithmetic Challenge</h2>
        <p class="text-gray-300 mb-6">Solve as many problems as you can in 30 seconds!</p>
        <button id="start-speed-game-btn" class="stylish-btn">Start Game</button>
      </div>
      <div id="game-main" class="hidden">
        <div class="game-meta">
          <p class="text-lg">Score: <span id="game-score" class="font-bold">0</span></p>
          <p class="text-lg">Time: <span id="game-timer" class="font-bold">30</span></p>
        </div>
        <div class="progress-track mb-4"><div id="game-progress" class="progress-bar"></div></div>
        <p id="game-problem" class="mb-4 text-white">12 + 5</p>
        <input type="number" id="game-answer" class="w-full p-2 rounded bg-slate-800/50 border border-slate-600 text-white text-center">
      </div>
      <div id="game-results" class="hidden">
        <h2 class="text-2xl font-bold text-white mb-2">Time's Up!</h2>
        <p class="text-gray-300 mb-6">You solved <span id="final-score" class="font-bold text-xl text-yellow-400">0</span> problems correctly!</p>
        <button id="close-speed-game-btn" class="stylish-btn">Close</button>
      </div>
    </div>
  </div>`;

  function el(id){ return document.getElementById(id); }

  function open(){ el('speed-arithmetic-modal').style.display = 'flex'; }
  function close(){ el('speed-arithmetic-modal').style.display = 'none'; }

  let score=0, t=30, a=0, combo=0, level=1, timerId=null;
  function next(){
    const max = 10 + level*10;
    const x = Math.floor(Math.random()*max)+1; const y = Math.floor(Math.random()*max)+1; a = x+y;
    el('game-problem').textContent = `${x} + ${y}`;
    el('game-answer').value='';
    el('game-answer').focus();
  }
  function start(){
    score=0; t=30; combo=0; level=1; el('game-score').textContent=score; el('game-timer').textContent=t.toString();
    el('game-intro').classList.add('hidden'); el('game-main').classList.remove('hidden'); el('game-results').classList.add('hidden');
    next();
    const progress = el('game-progress');
    if (timerId) clearInterval(timerId);
    timerId = setInterval(()=>{
      t--; el('game-timer').textContent=t.toString();
      progress.style.width = `${(30-t)/30*100}%`;
      if (t<=0){ clearInterval(timerId); timerId=null; end(); }
    },1000);
  }
  function end(){
    el('game-main').classList.add('hidden'); el('game-results').classList.remove('hidden');
    el('final-score').textContent = String(score);
    try{
      const uid = window.Gamification?.currentUserId() || 'guest';
      window.Gamification?.recordGame(uid, 'speed-arithmetic', score);
  if (window.i18n?.speak) i18n.speak(`You scored ${score} points`, { category: 'games' });
      if (score >= 25) window.Gamification?.awardBadge(uid, 'Arithmetic Ace', 'game-mathninja-speed');
    }catch(e){}
  }
  function onAnswer(e){
    if (e.key==='Enter'){
      const v=parseInt(e.target.value||'0',10);
      if (v===a){ score++; combo++; if (combo%5===0) level++; el('game-score').textContent=String(score); next(); }
      else { combo=0; }
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    document.body.insertAdjacentHTML('beforeend', html);
    document.body.addEventListener('click', (e)=>{ if (e.target && e.target.id==='start-speed-game-btn') start(); });
    document.body.addEventListener('click', (e)=>{ if (e.target && e.target.id==='close-speed-game-btn') close(); });
    document.body.addEventListener('keydown', (e)=>{ if (e.target && e.target.id==='game-answer') onAnswer(e); });
  });

  window.SpeedArithmetic = { open, close };
})();
