// Advanced STEM: Logic Truth Table Fill
(function(){
  const html = `
  <div id="logic-modal" class="game-modal" style="display:none;">
    <div class="modal-card text-center w-full max-w-2xl mx-4">
      <h2 class="text-2xl font-bold text-white mb-2">Logic Truth Table</h2>
      <p class="text-gray-300 mb-3">Fill the output column for the given boolean expression.</p>
      <p id="logic-expr" class="font-semibold mb-2"></p>
      <div class="overflow-auto">
        <table class="w-full text-sm">
          <thead><tr id="logic-head"></tr></thead>
          <tbody id="logic-body"></tbody>
        </table>
      </div>
      <div class="flex gap-2 mt-3">
        <button id="logic-new" class="stylish-btn">New</button>
        <button id="logic-check" class="stylish-btn">Check</button>
        <button id="logic-close" class="stylish-btn">Close</button>
      </div>
      <p id="logic-msg" class="text-sm mt-2"></p>
    </div>
  </div>`;

  const problems = [
    { vars:['A','B'], expr:'A ∧ ¬B', fn:(A,B)=>A && !B },
    { vars:['A','B'], expr:'A ⊕ B', fn:(A,B)=>A!==B },
    { vars:['A','B','C'], expr:'(A ∨ B) ∧ ¬C', fn:(A,B,C)=>(A||B)&&!C },
    { vars:['P','Q'], expr:'P → Q', fn:(P,Q)=>(!P) || Q },
    { vars:['P','Q','R'], expr:'(P ∧ Q) ∨ (¬Q ∧ R)', fn:(P,Q,R)=>(P&&Q)||((!Q)&&R) }
  ];

  let idx=0;
  function ensureModal(){ if(!document.getElementById('logic-modal')) document.body.insertAdjacentHTML('beforeend', html); }
  function open(){ ensureModal(); document.getElementById('logic-modal').style.display='flex'; next(); }
  function close(){ const m=document.getElementById('logic-modal'); if(m) m.style.display='none'; }

  function next(){
    idx = Math.floor(Math.random()*problems.length);
    const p = problems[idx];
    document.getElementById('logic-expr').textContent = `Expression: ${p.expr}`;
    const head = document.getElementById('logic-head');
    const body = document.getElementById('logic-body');
    head.innerHTML = p.vars.map(v=>`<th class="px-2 py-1">${v}</th>`).join('') + '<th class="px-2 py-1">Output</th>';
    const rows = 1<<p.vars.length;
    body.innerHTML = '';
    for (let r=0;r<rows;r++){
      const vals = p.vars.map((_,i)=>!!(r & (1<<(p.vars.length-1-i))));
      const tr = document.createElement('tr');
      tr.innerHTML = vals.map(v=>`<td class="px-2 py-1">${v?1:0}</td>`).join('') + `<td class="px-2 py-1"><select class="logic-out p-1 bg-slate-800/50 border border-slate-600 text-white rounded"><option value="0">0</option><option value="1">1</option></select></td>`;
      tr.dataset.vals = JSON.stringify(vals);
      body.appendChild(tr);
    }
    document.getElementById('logic-msg').textContent='';
  }

  function check(){
    const p = problems[idx];
    const body = document.getElementById('logic-body');
    const rows = Array.from(body.querySelectorAll('tr'));
    let correct = 0;
    rows.forEach(tr=>{
      const vals = JSON.parse(tr.dataset.vals||'[]');
      const expected = p.fn.apply(null, vals) ? '1' : '0';
      const sel = tr.querySelector('select');
      if (sel.value===expected){ correct++; sel.className='logic-out p-1 bg-emerald-900/60 border border-emerald-600 text-emerald-200 rounded'; }
      else { sel.className='logic-out p-1 bg-rose-900/60 border border-rose-600 text-rose-200 rounded'; }
    });
    const total = rows.length;
    const msg = document.getElementById('logic-msg');
    msg.textContent = `Score: ${correct}/${total}`;
    msg.className = 'text-sm ' + (correct===total ? 'text-green-400' : 'text-yellow-400');
    try{
      const uid = window.Gamification?.currentUserId()||'guest';
      window.Gamification?.recordGame(uid,'logic-truth-table', correct);
      if (correct===total) window.Gamification?.awardBadge(uid,'Boolean Boss','boolean-boss');
      if (window.i18n?.speak) window.i18n.speak(`You scored ${correct} out of ${total}`, { category: 'games' });
    }catch(e){}
  }

  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='logic-close') close(); });
  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='logic-new') next(); });
  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='logic-check') check(); });

  window.LogicTruthTable = { open, close };
})();
