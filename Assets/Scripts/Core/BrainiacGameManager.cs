using UnityEngine;
using System.Collections;

namespace Brainiac.Core
{
    /// <summary>
    /// Main game manager that orchestrates the AI-powered gamified learning platform
    /// </summary>
    public class BrainiacGameManager : MonoBehaviour
    {
        [Header("Core Systems")]
        public AILearningSystem aiLearningSystem;
        public GamificationManager gamificationManager;
        public ARLearningManager arLearningManager;
        public FirebaseManager firebaseManager;
        
        [Header("Game Configuration")]
        public float sessionDuration = 30.0f; // Default session duration in minutes
        public int maxDailyStreakBonus = 7; // Maximum streak bonus days
        
        // Singleton pattern for global access
        public static BrainiacGameManager Instance { get; private set; }
        
        // Game state tracking
        public bool IsGameInitialized { get; private set; }
        public bool IsSessionActive { get; private set; }
        
        // Events for other systems to subscribe to
        public System.Action<bool> OnGameInitialized;
        public System.Action<bool> OnSessionStateChanged;
        
        void Awake()
        {
            // Singleton pattern implementation
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeGame();
            }
            else
            {
                Destroy(gameObject);
            }
        }
        
        void Start()
        {
            StartCoroutine(InitializeGameSystems());
        }
        
        /// <summary>
        /// Initialize the core game systems
        /// </summary>
        void InitializeGame()
        {
            Debug.Log("[BrainiacGameManager] Initializing Brainiac Learning Platform...");
            
            // Initialize core components if not already assigned
            InitializeComponents();
            
            IsGameInitialized = false;
        }
        
        /// <summary>
        /// Initialize components if they don't exist
        /// </summary>
        void InitializeComponents()
        {
            // Find or create AI Learning System
            if (aiLearningSystem == null)
            {
                aiLearningSystem = FindObjectOfType<AILearningSystem>();
                if (aiLearningSystem == null)
                {
                    GameObject aiSystemObj = new GameObject("AILearningSystem");
                    aiSystemObj.transform.SetParent(transform);
                    aiLearningSystem = aiSystemObj.AddComponent<AILearningSystem>();
                }
            }
            
            // Find or create Gamification Manager
            if (gamificationManager == null)
            {
                gamificationManager = FindObjectOfType<GamificationManager>();
                if (gamificationManager == null)
                {
                    GameObject gamificationObj = new GameObject("GamificationManager");
                    gamificationObj.transform.SetParent(transform);
                    gamificationManager = gamificationObj.AddComponent<GamificationManager>();
                }
            }
            
            // Find or create AR Learning Manager
            if (arLearningManager == null)
            {
                arLearningManager = FindObjectOfType<ARLearningManager>();
                if (arLearningManager == null)
                {
                    GameObject arObj = new GameObject("ARLearningManager");
                    arObj.transform.SetParent(transform);
                    arLearningManager = arObj.AddComponent<ARLearningManager>();
                }
            }
            
            // Find or create Firebase Manager
            if (firebaseManager == null)
            {
                firebaseManager = FindObjectOfType<FirebaseManager>();
                if (firebaseManager == null)
                {
                    GameObject firebaseObj = new GameObject("FirebaseManager");
                    firebaseObj.transform.SetParent(transform);
                    firebaseManager = firebaseObj.AddComponent<FirebaseManager>();
                }
            }
        }
        
        /// <summary>
        /// Coroutine to initialize all game systems in sequence
        /// </summary>
        IEnumerator InitializeGameSystems()
        {
            Debug.Log("[BrainiacGameManager] Starting system initialization sequence...");
            
            // Initialize Firebase first (required for other systems)
            yield return StartCoroutine(firebaseManager.Initialize());
            
            // Initialize AI Learning System
            yield return StartCoroutine(aiLearningSystem.Initialize());
            
            // Initialize Gamification Manager
            yield return StartCoroutine(gamificationManager.Initialize());
            
            // Initialize AR Learning Manager
            yield return StartCoroutine(arLearningManager.Initialize());
            
            // Mark game as initialized
            IsGameInitialized = true;
            OnGameInitialized?.Invoke(true);
            
            Debug.Log("[BrainiacGameManager] All systems initialized successfully!");
        }
        
        /// <summary>
        /// Start a new learning session
        /// </summary>
        public void StartLearningSession()
        {
            if (!IsGameInitialized)
            {
                Debug.LogWarning("[BrainiacGameManager] Cannot start session - game not initialized!");
                return;
            }
            
            if (IsSessionActive)
            {
                Debug.LogWarning("[BrainiacGameManager] Learning session already active!");
                return;
            }
            
            Debug.Log("[BrainiacGameManager] Starting new learning session...");
            
            IsSessionActive = true;
            OnSessionStateChanged?.Invoke(true);
            
            // Start session timer
            StartCoroutine(SessionTimer());
            
            // Notify all systems that a session has started
            aiLearningSystem.StartSession();
            gamificationManager.StartSession();
            arLearningManager.StartSession();
        }
        
        /// <summary>
        /// End the current learning session
        /// </summary>
        public void EndLearningSession()
        {
            if (!IsSessionActive)
            {
                Debug.LogWarning("[BrainiacGameManager] No active session to end!");
                return;
            }
            
            Debug.Log("[BrainiacGameManager] Ending learning session...");
            
            IsSessionActive = false;
            OnSessionStateChanged?.Invoke(false);
            
            // Notify all systems that the session has ended
            aiLearningSystem.EndSession();
            gamificationManager.EndSession();
            arLearningManager.EndSession();
            
            // Save session data to Firebase
            firebaseManager.SaveSessionData();
        }
        
        /// <summary>
        /// Session timer coroutine
        /// </summary>
        IEnumerator SessionTimer()
        {
            float elapsedTime = 0f;
            
            while (IsSessionActive && elapsedTime < sessionDuration * 60f)
            {
                elapsedTime += Time.deltaTime;
                yield return null;
            }
            
            // Auto-end session if time limit reached
            if (IsSessionActive)
            {
                Debug.Log("[BrainiacGameManager] Session time limit reached. Ending session...");
                EndLearningSession();
            }
        }
        
        /// <summary>
        /// Get current learning progress
        /// </summary>
        public LearningProgress GetLearningProgress()
        {
            if (aiLearningSystem != null)
            {
                return aiLearningSystem.GetCurrentProgress();
            }
            return new LearningProgress();
        }
        
        /// <summary>
        /// Get gamification stats
        /// </summary>
        public GamificationStats GetGamificationStats()
        {
            if (gamificationManager != null)
            {
                return gamificationManager.GetCurrentStats();
            }
            return new GamificationStats();
        }
        
        /// <summary>
        /// Check if AR is available and ready
        /// </summary>
        public bool IsARAvailable()
        {
            return arLearningManager != null && arLearningManager.IsARSupported();
        }
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus && IsSessionActive)
            {
                // Pause the session when app is paused
                Debug.Log("[BrainiacGameManager] App paused - pausing learning session");
                // Could implement pause functionality here
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus && IsSessionActive)
            {
                // Handle app losing focus
                Debug.Log("[BrainiacGameManager] App lost focus during session");
            }
        }
        
        void OnDestroy()
        {
            if (Instance == this)
            {
                Instance = null;
            }
        }
    }
    
    /// <summary>
    /// Data structure for learning progress
    /// </summary>
    [System.Serializable]
    public class LearningProgress
    {
        public float overallProgress = 0f;
        public int completedLessons = 0;
        public int totalLessons = 0;
        public float accuracy = 0f;
        public int currentLevel = 1;
        public float experiencePoints = 0f;
    }
    
    /// <summary>
    /// Data structure for gamification statistics
    /// </summary>
    [System.Serializable]
    public class GamificationStats
    {
        public int totalPoints = 0;
        public int currentStreak = 0;
        public int maxStreak = 0;
        public int achievementsUnlocked = 0;
        public int totalAchievements = 0;
        public int level = 1;
        public float levelProgress = 0f;
    }
}