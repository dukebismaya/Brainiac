// Gamification engine: XP, levels, badges, streaks, leaderboard
(function(){
  const KEY = 'brainiac_gamification_v1';
  const USERS_KEY = 'brainiac_users';
  const SESSION_KEY = 'brainiac_session_userId';

  const defaultState = () => ({
    users: {}, // userId -> { xp, level, badges:[], streak:{count,last}, stats:{gamesPlayed:0, highScore:0} }
    leaderboard: [], // [{userId, xp}]
    lessons: {
      order: ['physics-1','chemistry-1','biology-1','math-1'],
      meta: {
        'physics-1': { title: 'Intro to Forces', unlocks: ['chemistry-1'], grade: '6-7' },
        'chemistry-1': { title: 'Periodic Table', unlocks: ['biology-1'], grade: '6-7' },
        'biology-1': { title: 'Cells & Organisms', unlocks: ['math-1'], grade: '6-7' },
        'math-1': { title: 'Basics of Algebra', unlocks: [], grade: '6-7' }
      }
    },
    badges: {
      'level-up': { icon: 'fa-star', desc: 'Leveled up by earning XP' },
      'streak-7': { icon: 'fa-fire', desc: '7-day learning streak' },
      'quiz-aplus': { icon: 'fa-medal', desc: 'Scored A+ on a quiz' },
      'game-mathninja': { icon: 'fa-calculator', desc: 'High score in Speed Arithmetic' },
      'memory-master': { icon: 'fa-brain', desc: 'Quick and efficient Memory Match' },
      'ohms-champion': { icon: 'fa-bolt', desc: "Perfect run in Ohm's Law" }
    }
  });

  const state = loadState();

  function loadState(){
    try { return JSON.parse(localStorage.getItem(KEY)) || defaultState(); }
    catch { return defaultState(); }
  }
  function saveState(){ localStorage.setItem(KEY, JSON.stringify(state)); }

  // Migrate legacy lesson scores to best/last
  (function migrate(){
    try{
      const users = state.users || {};
      Object.values(users).forEach(u=>{
        if (!u || !Array.isArray(u.learningPath)) return;
        u.learningPath.forEach(it=>{
          if (!it) return;
          if (it.bestScore === undefined && it.score !== undefined){
            it.bestScore = it.score;
          }
          if (it.lastScore === undefined && it.score !== undefined){
            it.lastScore = it.score;
          }
        });
      });
      saveState();
    }catch(e){}
  })();

  function todayStr(){ const d = new Date(); return d.toISOString().slice(0,10); }
  function ensureUser(userId){
    if (!state.users[userId]) {
      state.users[userId] = { xp:0, level:1, badges:[], streak:{count:0,last:null}, stats:{gamesPlayed:0, highScore:0}, learningPath: state.lessons.order.map((id,i)=>({id, status: i===0?'unlocked':'locked', score:null, bestScore:null, lastScore:null})) };
      saveState();
    }
    return state.users[userId];
  }

  function addXP(userId, amount, reason){
    const u = ensureUser(userId);
    u.xp += amount;
    const newLevel = 1 + Math.floor(u.xp/100);
    if (newLevel>u.level){ u.level = newLevel; awardBadge(userId, `Level ${newLevel}`, 'level-up'); }
    updateLeaderboard(userId);
    saveState();
    dispatch('xp', { userId, amount, total: u.xp, reason });
  }
  function awardBadge(userId, name, code){
    const u = ensureUser(userId);
    if (!u.badges.find(b=>b.code===code)){
      u.badges.push({ name, code, at: Date.now() });
      saveState();
      dispatch('badge', { userId, name, code });
    }
  }
  function recordStreak(userId){
    const u = ensureUser(userId);
    const today = todayStr();
    if (u.streak.last !== today){
      const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
      u.streak.count = (u.streak.last === yesterday) ? (u.streak.count+1) : 1;
      u.streak.last = today;
      if (u.streak.count % 7 === 0) awardBadge(userId, `${u.streak.count}-day Streak`, `streak-${u.streak.count}`);
      saveState();
      dispatch('streak', { userId, count: u.streak.count });
    }
  }
  function completeLesson(userId, lessonId, score, total){
    const u = ensureUser(userId);
    const lpItem = u.learningPath.find(l=>l.id===lessonId);
    if (!lpItem) return;
    lpItem.status = 'completed';
    lpItem.lastScore = score;
    lpItem.bestScore = Math.max(score, lpItem.bestScore||lpItem.score||0);
    addXP(userId, Math.round((score/Math.max(total,1))*50)+20, 'lesson-complete');
    // unlock next
    const unlocks = state.lessons.meta[lessonId]?.unlocks || [];
    unlocks.forEach(id=>{ const it = u.learningPath.find(l=>l.id===id); if (it && it.status==='locked') it.status='unlocked'; });
    if (score/Math.max(total,1) >= 0.9) awardBadge(userId, 'A+ Quiz', `quiz-aplus-${lessonId}`);
    saveState();
    dispatch('lesson', { userId, lessonId, score, total });
  }
  function recordGame(userId, gameId, score){
    const u = ensureUser(userId);
    u.stats.gamesPlayed += 1;
    if (score > (u.stats.highScore||0)) u.stats.highScore = score;
    addXP(userId, Math.min(30, 10 + Math.floor(score/2)), `game-${gameId}`);
    if (score >= 20) awardBadge(userId, 'Math Ninja', `game-mathninja-${gameId}`);
    saveState();
    dispatch('game', { userId, gameId, score });
  }

  function updateLeaderboard(userId){
    const entries = Object.entries(state.users).map(([id,u])=>({ userId:id, xp:u.xp }));
    entries.sort((a,b)=>b.xp-a.xp);
    state.leaderboard = entries.slice(0,10);
  }

  function getUserSummary(userId){
    const u = ensureUser(userId);
    return { xp:u.xp, level:u.level, badges:u.badges, streak:u.streak, learningPath:u.learningPath, stats:u.stats };
  }
  function getLessonMeta(lessonId){ return state.lessons.meta[lessonId]; }
  function getLessonsMeta(){ return state.lessons.meta; }

  // Track last opened lesson per user (for Continue CTA)
  const LAST_OPEN_KEY = (userId) => `brainiac_last_lesson_${userId}`;
  function setLastOpenedLesson(userId, lessonId){ try{ localStorage.setItem(LAST_OPEN_KEY(userId), lessonId); }catch(e){} }
  function getLastOpenedLesson(userId){ try{ return localStorage.getItem(LAST_OPEN_KEY(userId)); }catch(e){ return null; } }
  function getNextUnlockedLesson(userId){
    const u = ensureUser(userId);
    // Prefer first unlocked that is not completed
    const next = (u.learningPath||[]).find(l=> l.status==='unlocked');
    return next ? next.id : (u.learningPath||[]).find(l=> l.status!=='locked')?.id || null;
  }

  function currentUserId(){ return localStorage.getItem(SESSION_KEY) || 'guest'; }

  function dispatch(type, detail){ window.dispatchEvent(new CustomEvent(`gamification:${type}`, { detail })); }

  // Public API
  function getBadgesMeta(){ return (loadState()?.badges) || defaultState().badges; }
  window.Gamification = { addXP, awardBadge, recordStreak, completeLesson, recordGame, getUserSummary, currentUserId, setLastOpenedLesson, getLastOpenedLesson, getNextUnlockedLesson, getLessonMeta, getLessonsMeta, getBadgesMeta };

  // Minimal UI binding for Student Portal (if present)
  let lastUpdatedLessonId = null;
  function renderStudent(){
    const uid = currentUserId();
    // Update welcome heading with username (fallback to Learner for guest)
    const heading = document.getElementById('student-welcome-title');
    if (heading){
      const display = (uid && uid !== 'guest') ? uid : 'Learner';
      heading.textContent = `Welcome, ${display}!`;
    }
    const s = getUserSummary(uid);
    const xpEl = document.getElementById('student-xp'); if (xpEl) xpEl.textContent = (s.xp||0).toLocaleString();
    const streakEl = document.getElementById('student-streak'); if (streakEl) streakEl.textContent = `${s.streak?.count||0} Days`;
    const badgesEl = document.getElementById('student-badges'); if (badgesEl) badgesEl.textContent = (s.badges||[]).length;
    const lp = document.getElementById('learning-path-container'); if (lp){
      lp.innerHTML = '';
      const filter = localStorage.getItem('brainiac_grade_filter') || 'all';
      s.learningPath.forEach(item=>{
        const meta = state.lessons.meta[item.id]; if (!meta) return;
        if (filter!=='all' && meta.grade && meta.grade!==filter) return;
        const isLocked = item.status==='locked'; const isCompleted = item.status==='completed';
        const best = (item.bestScore !== undefined) ? item.bestScore : (item.score || 0);
        const current = (item.lastScore !== undefined) ? item.lastScore : (item.score || 0);
        const improved = (current === best && current>0);
        const popCls = (lastUpdatedLessonId && lastUpdatedLessonId===item.id) ? ' score-pop' : '';
        const chips = isCompleted ? `
          <span class="chip chip-success${popCls}">Best: ${best}${improved? ' <i class=\"fa-solid fa-arrow-trend-up\"></i>': ''}</span>
          <span class="chip chip-info${popCls}">Current: ${current}</span>
          ${improved? '<span class="chip chip-improved">Improved!</span>': ''}
        ` : '';
        lp.innerHTML += `<div class="learning-path-item glass-container rounded-xl p-4 flex items-center justify-between ${isLocked?'locked':''}">
          <div class="flex items-center">
            <i class="fa-solid ${isCompleted ? 'fa-check-circle text-green-500' : (isLocked ? 'fa-lock text-gray-500' : 'fa-circle-play text-blue-500')} text-2xl mr-4"></i>
            <div>
              <p class="font-bold dark:text-white">${meta.title}</p>
              <p class="text-sm text-gray-400">Lesson & Quiz</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            ${chips}
            ${isCompleted?`<i class=\"fa-solid fa-medal text-yellow-400\" title=\"Badge Earned!\"></i>`:''}
            <button data-lesson-id="${item.id}" class="start-btn px-4 py-2 text-sm font-semibold rounded-lg ${isLocked?'bg-gray-700':'bg-blue-600 hover:bg-blue-700'}" ${isLocked?'disabled':''}>${isCompleted?'Review':(isLocked?'Locked':'Start')}</button>
          </div>
        </div>`;
      });
    }
    // Badges grid rendering
    const grid = document.getElementById('badges-grid');
    if (grid){
      const store = loadState();
      const meta = (store && store.badges) ? store.badges : defaultState().badges;
      const items = (s.badges||[]).slice().sort((a,b)=>b.at-a.at);
      grid.innerHTML = items.map(b=>{
        const key = Object.keys(meta).find(k=> b.code.startsWith(k)) || 'level-up';
        const m = meta[key] || { icon:'fa-award', desc:'' };
        return `<div class="badge-chip"><i class="fa-solid ${m.icon}"></i><div class="meta"><span class="name">${b.name}</span><span class="desc">${m.desc}</span></div></div>`;
      }).join('');
    }
  }
  function attachEvents(){
    document.addEventListener('click', (e)=>{
      const t = e.target.closest('.start-btn');
      if (!t) return;
      const id = t.getAttribute('data-lesson-id');
      const uid = currentUserId();
      setLastOpenedLesson(uid, id);
      window.dispatchEvent(new CustomEvent('gamification:continue', { detail: { userId: uid, lessonId: id }}));
      // If the Lessons modal is available, let it handle opening the quiz
      if (window.Lessons && typeof window.Lessons.open === 'function'){
        return; // lessons.js will intercept and open the modal
      }
      // Fallback: use deep-link to Games Hub quiz
      window.location.href = 'games.html#quiz:'+id;
    });
    window.addEventListener('gamification:xp', (e)=>{ renderStudent();
      const el = document.getElementById('student-xp'); if (el){ el.classList.remove('score-pop'); void el.offsetWidth; el.classList.add('score-pop'); }
    });
    window.addEventListener('gamification:badge', renderStudent);
    window.addEventListener('gamification:lesson', (e)=>{ lastUpdatedLessonId = e.detail?.lessonId || null; renderStudent(); setTimeout(()=>{ lastUpdatedLessonId=null; }, 1000); });
    window.addEventListener('auth:login', renderStudent);
    window.addEventListener('auth:logout', renderStudent);
    window.addEventListener('gamification:continue', ()=>{});
    document.addEventListener('DOMContentLoaded', renderStudent);
  }
  attachEvents();
})();
