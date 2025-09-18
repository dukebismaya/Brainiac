// Advanced STEM: Calculus Derivative Challenge
(function(){
  const html = `
  <div id="calc-deriv-modal" class="game-modal" style="display:none;">
    <div class="modal-card text-center w-full max-w-lg mx-4">
      <h2 class="text-2xl font-bold text-white mb-2">Derivative Challenge</h2>
      <p class="text-gray-300 mb-3">Given f(x) and a point x₀, compute f′(x₀). Enter exact numeric value.</p>
      <p id="cd-fx" class="font-semibold mb-2"></p>
      <div class="flex items-center justify-center gap-2 mb-3">
        <label class="text-sm">x₀ =</label>
        <span id="cd-x0" class="px-2 py-1 rounded bg-slate-800/50 border border-slate-600">0</span>
      </div>
      <div class="flex gap-2 mb-2">
        <button id="cd-new" class="stylish-btn">New</button>
        <button id="cd-check" class="stylish-btn">Check</button>
        <button id="cd-close" class="stylish-btn">Close</button>
      </div>
      <div class="flex items-center justify-center gap-2">
        <input id="cd-answer" placeholder="f'(x₀)" class="w-48 p-2 rounded bg-slate-800/50 border border-slate-600 text-white text-center"/>
      </div>
      <p id="cd-msg" class="text-sm mt-2"></p>
    </div>
  </div>`;

  // Problem bank with analytic derivative at x0
  // Form: { label, x0, answer }
  const problems = [
    { label:'f(x) = 3x^2 - 4x + 1', x0:2, answer: 3*2*2 - 4 }, // f' = 6x - 4 => 8
    { label:'f(x) = x^3', x0:3, answer: 3*3*3/3 }, // f' = 3x^2 => 27
    { label:'f(x) = sin(x)', x0:Math.PI/6, answer: Math.cos(Math.PI/6) },
    { label:'f(x) = e^x', x0:0, answer: Math.E**0 },
    { label:'f(x) = ln(x)', x0:1, answer: 1 },
    { label:'f(x) = x^2 * e^x', x0:1, answer: (2*1*Math.E**1) + (1*1*Math.E**1) }, // product rule => (2x e^x + x^2 e^x)
    { label:'f(x) = x / (1+x)', x0:1, answer: 1/(1+1)**2 } // (1*(1+x) - x*1)/(1+x)^2 => 1/(1+x)^2
  ];

  let idx=0;
  function ensureModal(){ if(!document.getElementById('calc-deriv-modal')) document.body.insertAdjacentHTML('beforeend', html); }
  function open(){ ensureModal(); document.getElementById('calc-deriv-modal').style.display='flex'; next(); }
  function close(){ const m=document.getElementById('calc-deriv-modal'); if(m) m.style.display='none'; }

  function next(){
    idx = Math.floor(Math.random()*problems.length);
    const p = problems[idx];
    document.getElementById('cd-fx').textContent = p.label;
    document.getElementById('cd-x0').textContent = (Math.abs(p.x0) < 1e-9 ? 0 : p.x0.toFixed(4));
    document.getElementById('cd-answer').value = '';
    document.getElementById('cd-msg').textContent='';
  }

  function check(){
    const p = problems[idx];
    const val = parseFloat(document.getElementById('cd-answer').value);
    const msg = document.getElementById('cd-msg');
    if (!isFinite(val)){ msg.textContent='Enter a number'; msg.className='text-sm text-yellow-400'; return; }
    const ok = Math.abs(val - p.answer) < 1e-4;
    if (ok){
      msg.textContent = 'Correct!'; msg.className='text-sm text-green-400';
      try{
        const uid = window.Gamification?.currentUserId()||'guest';
        window.Gamification?.recordGame(uid,'calculus-derivative', 10);
        window.Gamification?.awardBadge?.(uid,'Derivative Dynamo','derivative-dynamo');
        if (window.i18n?.speak) window.i18n.speak('Correct', { category: 'games' });
      }catch(e){}
    } else {
      msg.textContent = `Not quite. Answer = ${p.answer.toFixed(6)}`;
      msg.className='text-sm text-rose-400';
    }
  }

  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='cd-close') close(); });
  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='cd-new') next(); });
  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='cd-check') check(); });

  window.CalculusDerivative = { open, close };
})();
