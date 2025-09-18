// Lessons modal quiz system for Learning Path
(function(){
  const QUIZ_BANK = {
    'physics-1': [
      { q: 'What is the equation for Newton\'s second law?', a: ['F = ma','V = IR','E = mc^2','P = VI'], correct: 0 },
      { q: 'A net force causes an object to ...', a: ['Remain at rest','Accelerate','Move at constant velocity','Gain mass'], correct: 1 },
      { q: 'Unit of force is ...', a: ['Joule','Watt','Newton','Pascal'], correct: 2 }
    ],
    'chemistry-1': [
      { q: 'Symbol for Oxygen is ...', a: ['Ox','O','Og','On'], correct: 1 },
      { q: 'Atomic number counts ...', a: ['Electrons','Protons','Neutrons','Molecules'], correct: 1 },
      { q: 'H2O is commonly called ...', a: ['Hydrogen gas','Water','Ozone','Salt'], correct: 1 }
    ],
    'biology-1': [
      { q: 'Basic unit of life is ...', a: ['Atom','Cell','Organ','DNA'], correct: 1 },
      { q: 'Plants make food by ...', a: ['Respiration','Photosynthesis','Fermentation','Digestion'], correct: 1 },
      { q: 'DNA carries ...', a: ['Energy','Genetic information','Minerals','Water'], correct: 1 }
    ],
    'math-1': [
      { q: '5 + 7 = ?', a: ['10','11','12','13'], correct: 2 },
      { q: 'Solve: 3x = 12, x = ?', a: ['2','3','4','6'], correct: 2 },
      { q: 'Which is even?', a: ['7','9','11','12'], correct: 3 }
    ]
  };

  const html = `
  <div id="lesson-quiz-modal" class="game-modal" style="display:none;">
    <div class="modal-card text-left w-full max-w-lg mx-4">
      <div id="lesson-quiz-header" class="flex items-center justify-between mb-2">
        <h2 id="lesson-quiz-title" class="text-2xl font-bold text-white">Lesson Quiz</h2>
        <button id="lesson-quiz-close" class="stylish-btn">Close</button>
      </div>
      <div class="game-meta mb-2"><p class="text-sm">Question <span id="quiz-num">1</span>/<span id="quiz-total">3</span></p><p class="text-sm">Score: <span id="quiz-score">0</span></p></div>
      <div class="progress-track mb-3"><div id="quiz-progress" class="progress-bar" style="width:0;"></div></div>
      <div id="quiz-body"></div>
      <div id="quiz-footer" class="mt-4 flex justify-between">
        <button id="quiz-prev" class="stylish-btn" disabled>Previous</button>
        <button id="quiz-next" class="stylish-btn">Next</button>
      </div>
    </div>
  </div>`;

  function ensureModal(){ if (!document.getElementById('lesson-quiz-modal')) document.body.insertAdjacentHTML('beforeend', html); }

  let state = { lessonId: null, idx:0, answers:[], score:0, total:0 };

  function recomputeScore(){
    const bank = QUIZ_BANK[state.lessonId] || [];
    let correct = 0;
    bank.forEach((q,i)=>{ if (state.answers[i] !== undefined && state.answers[i] === q.correct) correct++; });
    state.score = correct;
  }

  function renderQuestion(){
    const bank = QUIZ_BANK[state.lessonId] || [];
    state.total = bank.length;
    const q = bank[state.idx];
    const body = document.getElementById('quiz-body');
    const selected = state.answers[state.idx];
    const list = q ? q.a.map((opt,i)=>{
      const checked = (selected === i) ? 'checked' : '';
      return `<label class="block mb-2 quiz-option" data-opt="${i}"><input type="radio" name="quiz-opt" value="${i}" class="mr-2" ${checked}>${opt}</label>`;
    }).join('') : '';
    body.innerHTML = q ? `<p class="mb-3 text-lg">${q.q}</p>${list}` : '<p>No questions</p>';
    document.getElementById('quiz-num').textContent = String(state.idx+1);
    document.getElementById('quiz-total').textContent = String(state.total);
    recomputeScore();
    document.getElementById('quiz-score').textContent = String(state.score);
    document.getElementById('quiz-prev').disabled = state.idx===0;
    document.getElementById('quiz-next').textContent = (state.idx===state.total-1) ? 'Submit' : 'Next';
    const prog = document.getElementById('quiz-progress');
    const answered = state.answers.filter(a=>a!==undefined).length;
    prog.style.width = `${(answered/Math.max(1,state.total))*100}%`;
  }

  function collectAnswer(){
    const sel = document.querySelector('input[name="quiz-opt"]:checked');
    if (!sel) return null;
    return parseInt(sel.value,10);
  }

  function submit(){
    const bank = QUIZ_BANK[state.lessonId] || [];
    let correctCount = 0;
    bank.forEach((q,i)=>{ if (state.answers[i] === q.correct) correctCount++; });
    const uid = window.Gamification?.currentUserId()||'guest';
    if (window.Gamification?.setLastOpenedLesson) window.Gamification.setLastOpenedLesson(uid, state.lessonId);
    window.Gamification?.completeLesson(uid, state.lessonId, correctCount, bank.length);
    // Fire an explicit event to force immediate UI refresh
    try{ window.dispatchEvent(new CustomEvent('gamification:lesson', { detail: { userId: uid, lessonId: state.lessonId, score: correctCount, total: bank.length }})); }catch(e){}
  if (window.i18n?.speak) window.i18n.speak(`Quiz complete. Score ${correctCount} out of ${bank.length}`, { category: 'lessons' });
    close();
  }

  function open(lessonId){
    ensureModal();
    state = { lessonId, idx:0, answers:[], score:0, total:0 };
    document.getElementById('lesson-quiz-title').textContent = `Quiz: ${lessonId}`;
    document.getElementById('lesson-quiz-modal').style.display='flex';
    const uid = window.Gamification?.currentUserId()||'guest';
    if (window.Gamification?.setLastOpenedLesson) window.Gamification.setLastOpenedLesson(uid, lessonId);
    try{ window.dispatchEvent(new CustomEvent('gamification:continue', { detail: { userId: uid, lessonId }})); }catch(e){}
    renderQuestion();
  }
  function close(){ const m=document.getElementById('lesson-quiz-modal'); if(m){m.style.display='none';} }

  // Navigation
  document.addEventListener('click', (e)=>{
    if (e.target && e.target.id==='lesson-quiz-close') close();
    if (e.target && e.target.id==='quiz-prev'){
      const ans = collectAnswer(); if (ans!==null) state.answers[state.idx] = ans; recomputeScore();
      state.idx = Math.max(0, state.idx-1); renderQuestion();
    }
    if (e.target && e.target.id==='quiz-next'){
      const bank = QUIZ_BANK[state.lessonId] || [];
      const ans = collectAnswer();
      if (ans===null){
        // No selection: shake
        const card = document.querySelector('#lesson-quiz-modal .modal-card');
        if (card){ card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
  if (window.i18n?.speak) window.i18n.speak('Please select an answer', { category: 'lessons' });
        return;
      }
      // Save answer and show feedback
      state.answers[state.idx] = ans; recomputeScore();
      const scoreEl = document.getElementById('quiz-score'); if (scoreEl) scoreEl.textContent = String(state.score);
      const correct = bank[state.idx]?.correct;
      const selectedLabel = document.querySelector(`#quiz-body label[data-opt="${ans}"]`);
      const correctLabel = document.querySelector(`#quiz-body label[data-opt="${correct}"]`);
      const isCorrect = ans === correct;
      if (isCorrect){
        if (selectedLabel){ selectedLabel.classList.add('answer-correct'); }
  if (window.i18n?.speak) window.i18n.speak('Correct', { category: 'lessons' });
      } else {
        if (selectedLabel){ selectedLabel.classList.add('answer-wrong'); }
        if (correctLabel){ correctLabel.classList.add('answer-correct'); }
        const card = document.querySelector('#lesson-quiz-modal .modal-card');
        if (card){ card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
  if (window.i18n?.speak) window.i18n.speak('Try again', { category: 'lessons' });
      }
      // Advance after a short delay
      setTimeout(()=>{
        if (state.idx < bank.length-1){ state.idx++; renderQuestion(); }
        else { submit(); }
      }, isCorrect ? 400 : 650);
    }
  });

  // Live update score when user selects an option
  document.addEventListener('change', (e)=>{
    if (e.target && e.target.matches('input[name="quiz-opt"]')){
      const val = parseInt(e.target.value,10);
      if (!isNaN(val)){
        state.answers[state.idx] = val; recomputeScore();
        const scoreEl = document.getElementById('quiz-score'); if (scoreEl) scoreEl.textContent = String(state.score);
        const prog = document.getElementById('quiz-progress'); if (prog){
          const answered = state.answers.filter(a=>a!==undefined).length;
          prog.style.width = `${(answered/Math.max(1,state.total))*100}%`;
        }
      }
    }
  });

  // Hook Student Portal buttons
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('.start-btn');
    if (!t) return;
    const id = t.getAttribute('data-lesson-id');
    e.preventDefault();
    open(id);
  });

  window.Lessons = { open, close };
})();
