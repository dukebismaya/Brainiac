// Advanced STEM: Chemical Equation Balancer (guided)
(function(){
  const html = `
  <div id="balancer-modal" class="game-modal" style="display:none;">
    <div class="modal-card text-center w-full max-w-lg mx-4">
      <h2 class="text-2xl font-bold text-white mb-2">Equation Balancer</h2>
      <p class="text-gray-300 mb-3">Enter integer coefficients to balance the equation.</p>
      <p id="bal-eq" class="mb-3 font-semibold"></p>
      <div id="bal-coeffs" class="grid grid-cols-6 gap-2 mb-3"></div>
      <div class="flex gap-2 mb-2">
        <button id="bal-new" class="stylish-btn">New</button>
        <button id="bal-check" class="stylish-btn">Check</button>
        <button id="bal-close" class="stylish-btn">Close</button>
      </div>
      <p id="bal-msg" class="text-sm"></p>
    </div>
  </div>`;

  const equations = [
    { left:[['H2',1],['O2',1]], right:[['H2O',1]], coeffs:[2,1,2] },
    { left:[['Fe',1],['O2',1]], right:[['Fe2O3',1]], coeffs:[4,3,2] },
    { left:[['C2H6',1],['O2',1]], right:[['CO2',1],['H2O',1]], coeffs:[2,7,4,6] },
    { left:[['Al',1],['O2',1]], right:[['Al2O3',1]], coeffs:[4,3,2] },
    { left:[['Na',1],['Cl2',1]], right:[['NaCl',1]], coeffs:[2,1,2] }
  ];

  let current = 0;
  function ensureModal(){ if(!document.getElementById('balancer-modal')) document.body.insertAdjacentHTML('beforeend', html); }
  function open(){ ensureModal(); document.getElementById('balancer-modal').style.display='flex'; next(); }
  function close(){ const m=document.getElementById('balancer-modal'); if(m) m.style.display='none'; }

  function fmt(eq){
    const L = eq.left.map(([f])=>f).join(' + ');
    const R = eq.right.map(([f])=>f).join(' + ');
    return `${L} → ${R}`;
  }
  function next(){
    current = Math.floor(Math.random()*equations.length);
    const eq = equations[current];
    document.getElementById('bal-eq').textContent = fmt(eq);
    const inputs = [];
    const total = eq.left.length + eq.right.length;
    const grid = document.getElementById('bal-coeffs');
    grid.innerHTML = '';
    for (let i=0;i<total;i++){
      const el = document.createElement('input');
      el.type='number'; el.placeholder=String(i+1);
      el.className='p-2 rounded bg-slate-800/50 border border-slate-600 text-white text-center';
      el.min='1'; el.step='1';
      grid.appendChild(el); inputs.push(el);
    }
    grid.dataset.count = String(total);
  }

  function check(){
    const eq = equations[current];
    const total = eq.left.length + eq.right.length;
    const grid = document.getElementById('bal-coeffs');
    const vals = Array.from(grid.querySelectorAll('input')).map(i=>parseInt(i.value||'0',10));
    if (vals.length!==total || vals.some(v=>!isFinite(v) || v<=0)){
      showMsg('Enter all positive integer coefficients.', 'yellow');
      return;
    }
    const ok = vals.every((v,i)=>v===eq.coeffs[i]);
    if (ok){
      showMsg('Balanced correctly!', 'green');
      try{
        const uid = window.Gamification?.currentUserId()||'guest';
        window.Gamification?.recordGame(uid,'equation-balancer', 10);
        window.Gamification?.awardBadge?.(uid,'Chem Balancer','chem-balancer');
        if (window.i18n?.speak) window.i18n.speak('Balanced correctly', { category: 'games' });
      }catch(e){}
    } else {
      showMsg('Not quite. Try again or press New.', 'rose');
    }
  }

  function showMsg(txt, color){
    const el = document.getElementById('bal-msg');
    el.textContent = txt;
    const colorMap = { green:'text-green-400', yellow:'text-yellow-400', rose:'text-rose-400' };
    el.className = `text-sm ${colorMap[color]||''}`;
  }

  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='bal-close') close(); });
  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='bal-new') next(); });
  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='bal-check') check(); });

  window.EquationBalancer = { open, close };
})();
