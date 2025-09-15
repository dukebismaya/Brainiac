// Online/Offline banner handling
(function(){
  // Online/Offline banner
  const bannerId = 'offline-banner';
  function ensureBanner(){
    let el = document.getElementById(bannerId);
    if (!el){
      el = document.createElement('div');
      el.id = bannerId;
      el.className = 'offline-banner';
      el.setAttribute('role','status');
      el.setAttribute('aria-live','polite');
      el.innerHTML = '<span class="mr-2">⚠️</span><span>You are offline. Some features may be unavailable.</span>';
      document.body.appendChild(el);
    }
    return el;
  }
  function update(){
    const el = ensureBanner();
    if (navigator.onLine) el.classList.remove('show');
    else el.classList.add('show');
  }
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  document.addEventListener('DOMContentLoaded', update);

  // Offline lessons management on Student page
  const LESSONS = [ 'physics-1', 'chemistry-1', 'biology-1', 'math-1' ];
  const urlsFor = (id) => [ `lessons/${id}.json` ];

  function renderDownloads(){
    const container = document.getElementById('learning-path-container');
    if (!container) return;
    // Append a downloads panel at bottom
    let panel = document.getElementById('offline-downloads');
    if (!panel){
      panel = document.createElement('div');
      panel.id = 'offline-downloads';
      panel.className = 'glass-container rounded-xl p-4 mt-6';
      panel.innerHTML = '<div class="flex items-center justify-between mb-3"><h4 class="font-bold">Offline Lessons</h4><div class="space-x-2"><button id="dl-all" class="stylish-btn text-xs py-1">Download All</button><button id="rm-all" class="stylish-btn text-xs py-1">Remove All</button></div></div><div id="downloads-list" class="grid grid-cols-1 md:grid-cols-2 gap-3"></div>';
      container.parentElement.appendChild(panel);
    }
    const dl = panel.querySelector('#downloads-list');
    dl.innerHTML = LESSONS.map(id=>{
      const cached = localStorage.getItem(`lesson_cached_${id}`)==='1';
      return `<div class="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
        <span class="text-sm">${id}</span>
        <button class="px-3 py-1 text-xs rounded ${cached?'bg-rose-600':'bg-emerald-600'} hover:opacity-90" data-dl-id="${id}" data-action="${cached?'remove':'download'}">${cached?'Remove':'Download'}</button>
      </div>`;
    }).join('');
  }

  async function cacheUrls(urls){
    if (!navigator.serviceWorker?.controller){ return; }
    navigator.serviceWorker.controller.postMessage({ type:'CACHE_URLS', urls });
  }
  async function uncacheUrls(urls){
    if (!navigator.serviceWorker?.controller){ return; }
    navigator.serviceWorker.controller.postMessage({ type:'UNCACHE_URLS', urls });
  }

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-dl-id]'); if (!btn) return;
    const id = btn.getAttribute('data-dl-id');
    const action = btn.getAttribute('data-action');
    const urls = urlsFor(id);
    if (action==='download'){
      cacheUrls(urls);
      localStorage.setItem(`lesson_cached_${id}`,'1');
  i18n.speak('Lesson downloaded for offline.', { category: 'system' });
    } else {
      uncacheUrls(urls);
      localStorage.removeItem(`lesson_cached_${id}`);
  i18n.speak('Lesson removed from offline.', { category: 'system' });
    }
    renderDownloads();
  });

  // Bulk actions
  document.addEventListener('click', (e)=>{
    const dlAll = e.target.closest('#dl-all');
    const rmAll = e.target.closest('#rm-all');
    if (!dlAll && !rmAll) return;
    if (dlAll){
      dlAll.setAttribute('disabled','true'); dlAll.textContent='Downloading…';
      const allUrls = LESSONS.flatMap(urlsFor);
      cacheUrls(allUrls);
      LESSONS.forEach(id=>localStorage.setItem(`lesson_cached_${id}`,'1'));
      i18n.speak('All lessons downloaded for offline.', { category: 'system' });
      setTimeout(()=>{ dlAll.removeAttribute('disabled'); dlAll.textContent='Download All'; }, 600);
    }
    if (rmAll){
      rmAll.setAttribute('disabled','true'); rmAll.textContent='Removing…';
      const allUrls = LESSONS.flatMap(urlsFor);
      uncacheUrls(allUrls);
      LESSONS.forEach(id=>localStorage.removeItem(`lesson_cached_${id}`));
      i18n.speak('All lessons removed from offline.', { category: 'system' });
      setTimeout(()=>{ rmAll.removeAttribute('disabled'); rmAll.textContent='Remove All'; }, 400);
    }
    renderDownloads();
  });

  // Listen for SW cache confirmations to refresh UI
  navigator.serviceWorker?.addEventListener?.('message', (event)=>{
    const data = event.data || {};
    if (data.type==='CACHE_DONE' || data.type==='UNCACHE_DONE'){
      renderDownloads();
    }
  });

  document.addEventListener('DOMContentLoaded', renderDownloads);
})();
