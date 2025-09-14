
// --- DATA ---
const translations = {
    en: { welcome_title: 'Welcome to Brainiac Platform', welcome_subtitle: 'Empowering rural learners with interactive games, progress tracking, and motivating achievement badges.', start_game: 'Learn More', teacher_dashboard: 'Dashboard', physics_quiz: 'Physics Quiz', score: 'Score', next_question: 'Next Question', restart_game: 'Play Again', back_to_home: 'Back to Home', progress_dashboard: 'Progress Dashboard', games_played: 'Games Played', high_score: 'High Score', correct: 'Correct!', wrong: 'Not Quite!', quiz_complete: 'Quiz Complete!' },
    hi: { welcome_title: 'ब्रेनियैक प्लेटफॉर्म पर आपका स्वागत है', welcome_subtitle: 'ग्रामीण शिक्षार्थियों को इंटरैक्टिव गेम, प्रगति ट्रैकिंग और प्रेरक उपलब्धि बैज के साथ सशक्त बनाना।', start_game: 'और जानें', teacher_dashboard: 'डैशबोर्ड', physics_quiz: 'भौतिकी प्रश्नोत्तरी', score: 'स्कोर', next_question: 'अगला प्रश्न', restart_game: 'फिर से खेलें', back_to_home: 'होम पर वापस जाएं', progress_dashboard: 'प्रगति डैशबोर्ड', games_played: 'कुल खेले गए खेल', high_score: 'उच्चतम स्कोर', correct: 'सही!', wrong: 'गलत!', quiz_complete: 'प्रश्नोत्तरी पूर्ण!' }
};

let allQuestions = {
    'physics-1': { title: "Intro to Forces", questions: [{ q: "What is the SI unit of force?", o: ["Watt", "Newton", "Joule", "Pascal"], a: "Newton" }, { q: "A push or a pull on an object is called...", o: ["Energy", "Work", "Force", "Power"], a: "Force" }, { q: "Which of these is a non-contact force?", o: ["Friction", "Tension", "Gravity", "Air Resistance"], a: "Gravity" }] },
    'chemistry-1': { title: "Periodic Table", questions: [{ q: "What does 'Au' stand for on the periodic table?", o: ["Silver", "Argon", "Gold", "Aluminum"], a: "Gold" }, { q: "The horizontal rows on the periodic table are called...", o: ["Groups", "Periods", "Families", "Blocks"], a: "Periods" }, { q: "Which element is a noble gas?", o: ["Oxygen", "Hydrogen", "Neon", "Carbon"], a: "Neon" }] },
    'biology-1': { title: "Cells & Organisms", questions: [{ q: "What is the powerhouse of the cell?", o: ["Nucleus", "Ribosome", "Mitochondria", "Cell Wall"], a: "Mitochondria" }, { q: "Which of these is NOT found in an animal cell?", o: ["Cell Membrane", "Cytoplasm", "Chloroplast", "Nucleus"], a: "Chloroplast" }] },
    'math-1': { title: "Basics of Algebra", questions: [{ q: "Solve for x: x + 5 = 12", o: ["5", "7", "17", "6"], a: "7" }, { q: "What is 3 squared (3²)?", o: ["6", "3", "9", "12"], a: "9" }] }
};

// --- GLOBAL STATE ---
let currentPage = 'home-page';
let currentLanguage = 'en';
let isDarkMode = document.documentElement.classList.contains('dark');
let studentData;
let classData;
let currentUserId = null;

// --- PAGE & UI MANAGEMENT ---
function showPage(pageId) {
    document.getElementById(currentPage)?.classList.remove('active');
    document.getElementById(pageId)?.classList.add('active');
    window.scrollTo(0, 0);
    currentPage = pageId;

    // Page-specific render functions
    if (pageId === 'teacher-portal-page') renderTeacherPortal();
    if (pageId === 'student-portal-page') renderStudentPortal();
    if (pageId === 'games-hub-page') renderGamesHub();
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.theme = 'dark'; }
    else { document.documentElement.classList.remove('dark'); localStorage.theme = 'light'; }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', isDarkMode ? '#000000' : '#4f46e5');
}

function setLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (translations[lang] && translations[lang][key]) { element.textContent = translations[lang][key]; }
    });
    document.getElementById('lang-btn-text').textContent = lang === 'hi' ? 'हिन्दी' : 'English';
}

function setupHeaderUI(userId) {
    const guestControls = document.getElementById('guest-controls');
    const userControls = document.getElementById('user-info-container');
    if (userId && userId !== 'guest') {
        const users = JSON.parse(localStorage.getItem('brainiac_users')) || [];
        const currentUser = users.find(u => u.id == userId);
        document.getElementById('user-name').textContent = currentUser?.name || 'User';
        guestControls.style.display = 'none';
        userControls.style.display = 'flex';
    } else {
        guestControls.style.display = 'flex';
        userControls.style.display = 'none';
    }
}

// --- AUTHENTICATION ---
function showAuthForm(formToShow) {
    document.getElementById('login-form').style.display = formToShow === 'login' ? 'block' : 'none';
    document.getElementById('signup-form').style.display = formToShow === 'signup' ? 'block' : 'none';
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    if (!name || !email || !password) { alert('Please fill all fields'); return; }

    let users = JSON.parse(localStorage.getItem('brainiac_users')) || [];
    if (users.find(u => u.email === email)) { alert('Email already registered!'); return; }

    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);
    localStorage.setItem('brainiac_users', JSON.stringify(users));

    loginUser(newUser.id, newUser.name);
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    let users = JSON.parse(localStorage.getItem('brainiac_users')) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        loginUser(user.id, user.name);
    } else {
        alert('Invalid email or password.');
    }
}

function loginUser(userId, userName) {
    // Migrate guest data if it exists
    const guestData = localStorage.getItem('brainiac_student_data_guest');
    if (guestData) {
        localStorage.setItem(`brainiac_student_data_${userId}`, guestData);
        localStorage.removeItem('brainiac_student_data_guest');
    }

    currentUserId = userId;
    localStorage.setItem('brainiac_session_userId', userId);
    initializeStudentData(userId);
    setupHeaderUI(userId);
    showPage('home-page');
}

function handleLogout() {
    localStorage.removeItem('brainiac_session_userId');
    initializeGuestSession();
}

function initializeGuestSession() {
    currentUserId = 'guest';
    initializeStudentData('guest');
    setupHeaderUI('guest');
    showPage('home-page');
}

// --- DATA INITIALIZATION ---
function initializeStudentData(userId) {
    const dataKey = `brainiac_student_data_${userId}`;
    const savedData = localStorage.getItem(dataKey);
    studentData = savedData ? JSON.parse(savedData) : {
        xp: 0, streak: 0, badges: 0,
        learningPath: [
            { id: "physics-1", status: "unlocked", score: null },
            { id: "chemistry-1", status: "locked", score: null },
            { id: "biology-1", status: "locked", score: null },
            { id: "math-1", status: "locked", score: null }
        ]
    };
}

function initializeClassData() {
    const savedClassData = localStorage.getItem('brainiac_class_data');
    classData = savedClassData ? JSON.parse(savedClassData) : [
        { id: 1, name: "Bismaya Jyoti Dalei", time: 120, lessons: { "physics-1": { score: 3, total: 3 }, "chemistry-1": { score: 3, total: 3 }, "biology-1": { score: 2, total: 3 } } },
        { id: 3, name: "Sumit Kumar Prusty", time: 150, lessons: { "physics-1": { score: 3, total: 3 }, "chemistry-1": { score: 3, total: 3 }, "biology-1": { score: 2, total: 2 } } },
        { id: 2, name: "Priya Patel", time: 95, lessons: { "physics-1": { score: 2, total: 3 } } },
        { id: 4, name: "Sneha Verma", time: 45, lessons: {} },
    ];
}

function saveStudentData() {
    if (!currentUserId) return;
    const dataKey = `brainiac_student_data_${currentUserId}`;
    localStorage.setItem(dataKey, JSON.stringify(studentData));
}

function saveAllQuestions() {
    localStorage.setItem('brainiac_all_questions', JSON.stringify(allQuestions));
}

function loadAllQuestions() {
    const savedQuestions = localStorage.getItem('brainiac_all_questions');
    if (savedQuestions) {
        allQuestions = JSON.parse(savedQuestions);
    }
}

// --- LESSON & PROGRESS LOGIC ---
function updateStudentProgress(finalScore, totalQuestions) {
    if (!studentData) return;
    studentData.xp += finalScore * 10;

    const currentLesson = studentData.learningPath.find(l => l.id === currentLessonId);
    const currentLessonIndex = studentData.learningPath.findIndex(l => l.id === currentLessonId);
    if (currentLesson) {
        currentLesson.score = finalScore;
        if (currentLesson.status !== 'completed' && finalScore / totalQuestions > 0.5) {
            currentLesson.status = 'completed';
            studentData.badges++;
            if (currentLessonIndex + 1 < studentData.learningPath.length) {
                studentData.learningPath[currentLessonIndex + 1].status = 'unlocked';
            }
        }
    }
    studentData.streak++;
    saveStudentData();
}

// --- QUIZ LOGIC ---
let lessonScore = 0;
let lessonActive = false;
let currentLessonId = null;
const quizTitleEl = document.getElementById('quiz-title');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const scoreEl = document.getElementById('score');
const resultContainer = document.getElementById('result-container');

function startLessonQuiz(lessonId) {
    currentLessonId = lessonId;
    const quizData = allQuestions[currentLessonId];
    quizTitleEl.textContent = quizData.title;
    let currentQuestionIndex = 0;
    lessonScore = 0;
    lessonActive = true;
    scoreEl.textContent = lessonScore;
    resultContainer.style.display = 'none';

    function loadLessonQuestion() {
        if (currentQuestionIndex >= quizData.questions.length) { endLessonQuiz(); return; }
        const currentQuestion = quizData.questions[currentQuestionIndex];
        questionEl.textContent = currentQuestion.q;
        optionsEl.innerHTML = '';
        currentQuestion.o.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'option-btn';
            button.onclick = () => selectLessonAnswer(option, currentQuestion.a);
            optionsEl.appendChild(button);
        });
    }

    function selectLessonAnswer(selected, correct) {
        if (!lessonActive) return;
        lessonActive = false;
        const buttons = optionsEl.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = true;
            if (button.textContent === correct) { button.classList.add('correct'); }
            else if (button.textContent === selected) { button.classList.add('incorrect'); }
        });

        if (selected === correct) {
            lessonScore++;
            scoreEl.textContent = lessonScore;
            scoreEl.classList.add('score-pop');
            scoreEl.addEventListener('animationend', () => scoreEl.classList.remove('score-pop'), { once: true });
        }
        setTimeout(() => { currentQuestionIndex++; lessonActive = true; loadLessonQuestion(); }, 1200);
    }

    loadLessonQuestion();
    showPage('lesson-quiz-page');
}

function endLessonQuiz() {
    updateStudentProgress(lessonScore, allQuestions[currentLessonId].questions.length);
    document.getElementById('result-title').textContent = 'Lesson Complete!';
    document.getElementById('result-title').className = "text-2xl font-bold mb-2 text-blue-500";
    document.getElementById('result-text').textContent = `You scored ${lessonScore} out of ${allQuestions[currentLessonId].questions.length}! You earned ${lessonScore * 10} XP!`;
    resultContainer.style.display = 'block';
}

// --- RENDERING FUNCTIONS (Student, Games, Teacher) ---
function renderStudentPortal() {
    const users = JSON.parse(localStorage.getItem('brainiac_users')) || [];
    const currentUser = users.find(u => u.id == currentUserId);
    const welcomeName = currentUserId === 'guest' ? 'Learner' : currentUser?.name || 'Learner';

    document.getElementById('student-welcome-title').textContent = `Welcome, ${welcomeName}!`;
    document.getElementById('student-xp').textContent = studentData.xp.toLocaleString();
    document.getElementById('student-streak').textContent = `${studentData.streak} Days`;
    document.getElementById('student-badges').textContent = studentData.badges;

    let leaderboardData = classData.map(s => ({ name: s.name, xp: Object.values(s.lessons).reduce((acc, l) => acc + (l.score || 0), 0) * 10 }));
    if (currentUserId === 'guest' || currentUser) {
        leaderboardData.push({ name: welcomeName, xp: studentData.xp });
    }
    leaderboardData.sort((a, b) => b.xp - a.xp);

    const learningPathContainer = document.getElementById('learning-path-container');
    learningPathContainer.innerHTML = '';
    studentData.learningPath.forEach(item => {
        const lessonInfo = allQuestions[item.id];
        if (!lessonInfo) return; // Skip if lesson was deleted
        const isLocked = item.status === 'locked';
        const isCompleted = item.status === 'completed';
        learningPathContainer.innerHTML += `
                    <div class="learning-path-item glass-container rounded-xl p-4 flex items-center justify-between ${isLocked ? 'locked' : ''}">
                        <div class="flex items-center"><i class="fa-solid ${isCompleted ? 'fa-check-circle text-green-500' : (isLocked ? 'fa-lock text-gray-500' : 'fa-circle-play text-blue-500')} text-2xl mr-4"></i><div><p class="font-bold dark:text-white">${lessonInfo.title}</p><p class="text-sm text-gray-400">Lesson & Quiz</p></div></div>
                        <div class="flex items-center space-x-3">
                             ${isCompleted ? `<span class="text-xs font-bold text-green-400">${item.score}/${lessonInfo.questions.length}</span><i class="fa-solid fa-medal text-yellow-400" title="Badge Earned!"></i>` : ''}
                             <i class="fa-solid fa-volume-high text-gray-400 cursor-pointer hover:text-white" title="Audio Narration"></i>
                             <i class="fa-solid fa-download text-gray-400 cursor-pointer hover:text-white" title="Download for Offline"></i>
                             <button data-lesson-id="${item.id}" class="start-btn px-4 py-2 text-sm font-semibold rounded-lg ${isLocked ? 'bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}" ${isLocked ? 'disabled' : ''}>${isCompleted ? 'Review' : (isLocked ? 'Locked' : 'Start')}</button>
                        </div></div>`;
    });

    const leaderboardContainer = document.getElementById('leaderboard-container');
    leaderboardContainer.innerHTML = '';
    leaderboardData.forEach((player, index) => {
        const isYou = player.name === welcomeName;
        leaderboardContainer.innerHTML += `<div class="flex items-center justify-between text-sm ${isYou ? 'bg-indigo-500/20 rounded p-2' : ''}"><p class="font-semibold"><span class="w-6 inline-block">${index + 1}.</span> ${player.name}</p><p class="text-yellow-400">${player.xp.toLocaleString()} XP</p></div>`;
    });
}

function renderGamesHub() {
    const games = [
        { id: 'math-game', title: 'Speed Arithmetic', icon: 'fa-calculator', description: 'Solve math problems against the clock!', requiredLesson: 'math-1' },
        { id: 'physics-game', title: 'Physics Lab', icon: 'fa-flask-vial', description: 'A drag-and-drop simulation. (Coming Soon)', requiredLesson: 'physics-1' },
        { id: 'logic-game', title: 'Logic Puzzles', icon: 'fa-brain', description: 'Challenge your reasoning skills. (Coming Soon)', requiredLesson: 'biology-1' }
    ];

    const gamesContainer = document.getElementById('games-container');
    gamesContainer.innerHTML = '';

    games.forEach(game => {
        const requiredLesson = studentData.learningPath.find(l => l.id === game.requiredLesson);
        const isLocked = !requiredLesson || requiredLesson.status !== 'completed';
        const isWIP = game.id !== 'math-game';

        gamesContainer.innerHTML += `
                    <div class="game-card glass-container rounded-xl p-6 text-center flex flex-col justify-between ${isLocked ? 'locked' : ''}">
                        <div>
                            <i class="fa-solid ${game.icon} text-4xl mb-4 text-purple-300"></i>
                            <h3 class="text-xl font-bold text-white">${game.title}</h3>
                            <p class="text-sm text-gray-400 mt-2 h-16">${game.description}</p>
                            ${isWIP ? '<p class="text-xs text-yellow-400 mt-2">Multiplayer Coming Soon!</p>' : ''}
                        </div>
                        <button data-game-id="${game.id}" class="mt-4 w-full py-2 text-sm font-semibold rounded-lg ${isLocked || isWIP ? 'bg-gray-700' : 'bg-purple-600 hover:bg-purple-700'}" ${isLocked || isWIP ? 'disabled' : ''}>
                           ${isLocked ? `Complete '${allQuestions[game.requiredLesson]?.title || ''}' to Unlock` : 'Play'}
                        </button>
                    </div>`;
    });
}

function renderTeacherPortal() {
    let totalScore = 0, totalPossible = 0, totalCompleted = 0, totalTime = 0;
    classData.forEach(student => {
        totalTime += student.time;
        let completedCount = 0;
        Object.values(student.lessons).forEach(l => {
            totalScore += l.score;
            totalPossible += l.total;
            completedCount++;
        });
        if (completedCount > 0) totalCompleted++;
    });
    document.getElementById('class-avg-score').textContent = `${totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0}%`;
    document.getElementById('class-completion-rate').textContent = `${classData.length > 0 ? Math.round((totalCompleted / classData.length) * 100) : 0}%`;
    document.getElementById('class-avg-time').textContent = `${classData.length > 0 ? Math.round(totalTime / classData.length) : 0} min`;

    const studentListContainer = document.getElementById('student-list-container');
    studentListContainer.innerHTML = '';
    classData.forEach(student => {
        const lessonsCompleted = Object.keys(student.lessons).length;
        studentListContainer.innerHTML += `<div class="flex items-center justify-between p-2 rounded hover:bg-slate-700/50"><p>${student.name}</p><div class="flex items-center space-x-4"><span class="text-sm text-gray-400">Completed: ${lessonsCompleted}</span><button data-student-id="${student.id}" class="view-report-btn text-xs bg-sky-600 px-2 py-1 rounded">View Report</button><button class="text-xs bg-yellow-600 px-2 py-1 rounded">Highlight</button></div></div>`;
    });

    const lessonSelect = document.getElementById('assign-lesson-select');
    lessonSelect.innerHTML = '<option value="" disabled selected></option>';
    Object.keys(allQuestions).forEach(key => {
        lessonSelect.innerHTML += `<option value="${key}">${allQuestions[key].title}</option>`;
    });
}

// --- EVENT LISTENERS ---
document.getElementById('theme-icon-container').addEventListener('click', toggleTheme);
document.getElementById('language-switcher').addEventListener('change', (e) => setLanguage(e.target.value));
document.getElementById('show-signup').addEventListener('click', (e) => { e.preventDefault(); showAuthForm('signup'); });
document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); showAuthForm('login'); });
document.getElementById('continue-guest').addEventListener('click', (e) => { e.preventDefault(); initializeGuestSession(); });
document.getElementById('show-auth-btn').addEventListener('click', () => showPage('auth-page'));
document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('signup-form').addEventListener('submit', handleSignup);
document.getElementById('logout-btn').addEventListener('click', handleLogout);
document.getElementById('learning-path-container').addEventListener('click', (e) => { if (e.target && e.target.classList.contains('start-btn')) { startLessonQuiz(e.target.dataset.lessonId); } });
document.getElementById('games-container').addEventListener('click', (e) => { if (e.target && e.target.dataset.gameId === 'math-game') { openSpeedGame(); } });
document.getElementById('start-speed-game-btn').addEventListener('click', () => { /* ... game start logic ... */ });
document.getElementById('student-list-container').addEventListener('click', e => { if (e.target.classList.contains('view-report-btn')) { openStudentReport(parseInt(e.target.dataset.studentId)); } });
document.getElementById('create-file-input').addEventListener('change', (e) => { document.getElementById('file-name-display').textContent = e.target.files.length > 0 ? e.target.files[0].name : 'No file chosen.'; });
document.getElementById('create-lesson-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('create-title').value;
    const question = document.getElementById('create-q').value;
    const answer = document.getElementById('create-a').value;
    if (!title || !question || !answer) {
        alert('Please fill all required fields to create a lesson.');
        return;
    }

    const newId = `custom-${Date.now()}`;
    allQuestions[newId] = {
        title: title,
        questions: [{ q: question, o: [answer, "Option 2", "Option 3", "Option 4"].sort(() => Math.random() - 0.5), a: answer }]
    };
    saveAllQuestions();

    // Add to every student's learning path
    const allUsers = JSON.parse(localStorage.getItem('brainiac_users')) || [];
    allUsers.forEach(user => {
        const dataKey = `brainiac_student_data_${user.id}`;
        let userData = JSON.parse(localStorage.getItem(dataKey));
        if (userData) {
            userData.learningPath.push({ id: newId, status: "locked", score: null });
            localStorage.setItem(dataKey, JSON.stringify(userData));
        }
    });

    alert(`Lesson "${title}" created successfully!`);
    renderTeacherPortal(); // Refresh the dropdown
    document.getElementById('create-lesson-form').reset();
});

document.getElementById('teacher-tools-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
        const tabId = e.target.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }
});


// --- MODAL & MISC ---
const studentReportModal = document.getElementById('student-report-modal');
function openStudentReport(studentId) {
    const student = classData.find(s => s.id === studentId);
    if (!student) return;
    document.getElementById('report-student-name').textContent = `${student.name}'s Report`;
    let totalScore = 0, totalPossible = 0, badges = 0;
    const pathContainer = document.getElementById('report-learning-path');
    pathContainer.innerHTML = '';
    Object.entries(allQuestions).forEach(([key, lesson]) => {
        const studentLesson = student.lessons[key];
        const status = studentLesson ? 'Completed' : 'Not Started';
        const scoreText = studentLesson ? `${studentLesson.score}/${studentLesson.total}` : 'N/A';
        if (studentLesson) { totalScore += studentLesson.score; totalPossible += studentLesson.total; badges++; }
        pathContainer.innerHTML += `<div class="text-sm flex justify-between"><p>${lesson.title}</p><p class="${status === 'Completed' ? 'text-green-400' : 'text-gray-400'}">${status} (${scoreText})</p></div>`;
    });
    document.getElementById('report-avg-score').textContent = `${totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0}%`;
    document.getElementById('report-badges').textContent = badges;
    studentReportModal.classList.add('active');
}
function closeStudentReport() { studentReportModal.classList.remove('active'); }

function smoothTypewriter() {
    const target = document.querySelector('.typewriter h1');
    const text = "Brainiac"; let i = 0; target.textContent = '';
    function type() { if (i < text.length) { target.textContent += text.charAt(i); i++; setTimeout(type, 150); } }
    type();
}

function awesomeCards() {
    document.querySelectorAll('.portal-card').forEach(card => {
        const cardContent = card.querySelector('.portal-card-content'), icon = card.querySelector('.fa-solid'), textElements = card.querySelectorAll('h3, p, button');
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
            const centerX = rect.width / 2, centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20, rotateY = (centerX - x) / 20;
            cardContent.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
            icon.style.transform = `translateZ(50px)`;
            textElements.forEach(el => el.style.transform = `translateZ(30px)`);
            cardContent.style.setProperty('--shine-x', `${x}px`);
            cardContent.style.setProperty('--shine-y', `${y}px`);
        });
        card.addEventListener('mouseleave', () => {
            cardContent.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
            icon.style.transform = `translateZ(0px)`;
            textElements.forEach(el => el.style.transform = `translateZ(0px)`);
        });
    });
}

// --- INITIALIZE APP ---
document.addEventListener('DOMContentLoaded', () => {
    currentUserId = localStorage.getItem('brainiac_session_userId');

    loadAllQuestions();
    initializeClassData();
    document.documentElement.classList.contains('dark');
    setLanguage('en');
    smoothTypewriter();
    awesomeCards();

    if (currentUserId) {
        setupHeaderUI(currentUserId);
        initializeStudentData(currentUserId);
        showPage('home-page');
    } else {
        initializeGuestSession();
    }

    // PWA: Register Service Worker
    if ('serviceWorker' in navigator) {
        const swUrl = 'service-worker.js';
        navigator.serviceWorker.register(swUrl).then(reg => {
            // Listen for updates to the service worker.
            if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // A new update is ready; activate immediately
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                // Reload to get the new service worker controlling the page
                window.location.reload();
            });
        }).catch(console.error);
    }

    // Online/Offline banner handling
    const offlineBanner = document.getElementById('offline-banner');
    function updateOnlineStatus() {
        if (navigator.onLine) offlineBanner.classList.remove('show');
        else offlineBanner.classList.add('show');
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
});
