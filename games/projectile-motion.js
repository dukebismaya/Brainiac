// Advanced STEM: Projectile Motion Challenge
(function(){
  const html = `
  <div id="projectile-modal" class="game-modal" style="display:none;">
    <div class="modal-card text-center w-full max-w-lg mx-4">
      <h2 class="text-2xl font-bold text-white mb-2">Projectile Motion</h2>
      <p class="text-gray-300 mb-4">Given v₀ and θ (degrees), compute the selected quantity. Use g = 9.81 m/s².</p>
      <div class="grid grid-cols-3 gap-2 mb-3">
        <input id="pm-v0" placeholder="v0 (m/s)" class="p-2 rounded bg-slate-800/50 border border-slate-600 text-white text-center"/>
        <input id="pm-theta" placeholder="θ (deg)" class="p-2 rounded bg-slate-800/50 border border-slate-600 text-white text-center"/>
        <select id="pm-target" class="p-2 rounded bg-slate-800/50 border border-slate-600 text-white text-center">
          <option value="range">Range R</option>
          <option value="time">Time of Flight T</option>
          <option value="height">Max Height H</option>
        </select>
      </div>
      <div class="flex gap-2 mb-2">
        <button id="pm-generate" class="stylish-btn">Generate Problem</button>
        <button id="pm-check" class="stylish-btn">Compute</button>
        <button id="pm-close" class="stylish-btn">Close</button>
      </div>
      <p id="pm-msg" class="text-sm mt-2"></p>
    </div>
  </div>`;

  const g = 9.81;
  function ensureModal(){ if(!document.getElementById('projectile-modal')) document.body.insertAdjacentHTML('beforeend', html); }
  function open(){ ensureModal(); document.getElementById('projectile-modal').style.display='flex'; randomize(); }
  function close(){ const m=document.getElementById('projectile-modal'); if(m) m.style.display='none'; }

  function randomize(){
    const v0 = 10 + Math.floor(Math.random()*40); // 10..50 m/s
    const theta = 15 + Math.floor(Math.random()*60); // 15..75 degrees
    document.getElementById('pm-v0').value = String(v0);
    document.getElementById('pm-theta').value = String(theta);
    const targetOpts = ['range','time','height'];
    document.getElementById('pm-target').value = targetOpts[Math.floor(Math.random()*3)];
    document.getElementById('pm-msg').textContent = '';
  }

  function compute(){
    const v0 = parseFloat(document.getElementById('pm-v0').value);
    const thetaDeg = parseFloat(document.getElementById('pm-theta').value);
    const mode = document.getElementById('pm-target').value;
  const msg = document.getElementById('pm-msg');
    if (!isFinite(v0) || !isFinite(thetaDeg)) { msg.textContent = 'Enter valid v0 and θ.'; msg.className='text-sm text-yellow-400'; return; }
    const th = thetaDeg*Math.PI/180;
    let result=null, units='';
    if (mode==='range'){
      // R = v0^2 sin(2θ)/g
      result = (v0*v0*Math.sin(2*th))/g; units='m';
    } else if (mode==='time'){
      // T = 2 v0 sinθ / g
      result = (2*v0*Math.sin(th))/g; units='s';
    } else {
      // H = v0^2 sin^2 θ / (2g)
      result = (v0*v0*Math.sin(th)*Math.sin(th))/(2*g); units='m';
    }
    msg.textContent = `Answer: ${result.toFixed(2)} ${units}`;
    msg.className = 'text-sm text-green-400';
    try{
      const uid = window.Gamification?.currentUserId()||'guest';
      window.Gamification?.recordGame(uid,'projectile-motion', Math.round(result));
      if (window.i18n?.speak) window.i18n.speak('Computation complete', { category: 'games' });
    }catch(e){}
  }

  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='pm-close') close(); });
  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='pm-generate') randomize(); });
  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='pm-check') compute(); });

  window.ProjectileMotion = { open, close };
})();
