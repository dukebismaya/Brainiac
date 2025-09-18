// Advanced STEM: Shortest Path (Dijkstra) Trainer
(function(){
  const html = `
  <div id="sp-modal" class="game-modal" style="display:none;">
    <div class="modal-card text-center w-full max-w-2xl mx-4">
      <h2 class="text-2xl font-bold text-white mb-2">Shortest Path</h2>
      <p class="text-gray-300 mb-3">Find the shortest distance from source to target using Dijkstra on a small weighted graph.</p>
      <div id="sp-graph" class="grid grid-cols-3 gap-2 mb-2"></div>
      <div class="flex gap-2 mb-2">
        <button id="sp-new" class="stylish-btn">New</button>
        <button id="sp-check" class="stylish-btn">Check</button>
        <button id="sp-close" class="stylish-btn">Close</button>
      </div>
      <p id="sp-msg" class="text-sm"></p>
    </div>
  </div>`;

  function ensureModal(){ if(!document.getElementById('sp-modal')) document.body.insertAdjacentHTML('beforeend', html); }
  function open(){ ensureModal(); document.getElementById('sp-modal').style.display='flex'; build(); }
  function close(){ const m=document.getElementById('sp-modal'); if(m) m.style.display='none'; }

  // Predefined small graphs
  const graphs = [
    { nodes:['A','B','C','D','E'], edges:[['A','B',4],['A','C',2],['B','C',1],['B','D',5],['C','D',8],['C','E',10],['D','E',2]], src:'A', dst:'E' },
    { nodes:['S','T','U','V'], edges:[['S','T',3],['S','U',6],['T','U',2],['T','V',4],['U','V',1]], src:'S', dst:'V' },
    { nodes:['P','Q','R','S','T'], edges:[['P','Q',7],['P','R',3],['Q','R',1],['Q','S',2],['R','S',5],['S','T',1],['R','T',9]], src:'P', dst:'T' }
  ];

  let gi = 0, answer = 0;

  function build(){
    gi = Math.floor(Math.random()*graphs.length);
    const g = graphs[gi];
    const cont = document.getElementById('sp-graph');

    // Render simple edge list and input
    const edgeList = g.edges.map(([u,v,w])=>`${u} — ${v} : ${w}`).join('<br/>');
    cont.innerHTML = `
      <div class="glass-container col-span-3 rounded p-3 text-left">
        <p><strong>Nodes:</strong> ${g.nodes.join(', ')}</p>
        <p><strong>Edges:</strong><br/> ${edgeList}</p>
        <p class="mt-2"><strong>Source:</strong> ${g.src} &nbsp; <strong>Target:</strong> ${g.dst}</p>
        <div class="mt-2 flex items-center gap-2">
          <label class="text-sm">Shortest distance</label>
          <input id="sp-input" type="number" class="w-24 p-1 rounded bg-slate-800/50 border border-slate-600 text-white text-center"/>
        </div>
      </div>`;
    answer = dijkstra(g, g.src, g.dst).dist;
    document.getElementById('sp-msg').textContent = '';
  }

  function dijkstra(g, src, dst){
    const nodes = g.nodes; const edges = g.edges;
    const adj = new Map(nodes.map(n=>[n,[]]));
    edges.forEach(([u,v,w])=>{ adj.get(u).push([v,w]); adj.get(v).push([u,w]); });
    const dist = new Map(nodes.map(n=>[n, Infinity])); dist.set(src,0);
    const vis = new Set();
    while (vis.size < nodes.length){
      let u=null, best=Infinity;
      nodes.forEach(n=>{ if(!vis.has(n) && dist.get(n)<best){ best=dist.get(n); u=n; } });
      if (u===null) break; vis.add(u);
      if (u===dst) break;
      adj.get(u).forEach(([v,w])=>{
        if (dist.get(u)+w < dist.get(v)) dist.set(v, dist.get(u)+w);
      });
    }
    return { dist: dist.get(dst) };
  }

  function check(){
    const val = parseFloat(document.getElementById('sp-input').value);
    const msg = document.getElementById('sp-msg');
    if (!isFinite(val)){ msg.textContent='Enter a number'; msg.className='text-sm text-yellow-400'; return; }
    if (Math.abs(val - answer) < 1e-9){
      msg.textContent='Correct!'; msg.className='text-sm text-green-400';
      try{
        const uid = window.Gamification?.currentUserId()||'guest';
        window.Gamification?.recordGame(uid,'shortest-path', 15);
        window.Gamification?.awardBadge?.(uid,'Graph Guru','graph-guru');
        if (window.i18n?.speak) window.i18n.speak('Correct', { category: 'games' });
      }catch(e){}
    } else {
      msg.textContent=`Not quite. Answer = ${answer}`; msg.className='text-sm text-rose-400';
    }
  }

  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='sp-close') close(); });
  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='sp-new') build(); });
  document.addEventListener('click', (e)=>{ if (e.target && e.target.id==='sp-check') check(); });

  window.ShortestPath = { open, close };
})();
