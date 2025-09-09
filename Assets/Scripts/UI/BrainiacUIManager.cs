using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace Brainiac.UI
{
    /// <summary>
    /// Main UI controller that provides interface for the learning platform
    /// </summary>
    public class BrainiacUIManager : MonoBehaviour
    {
        [Header("UI References")]
        public Button startSessionButton;
        public Button endSessionButton;
        public Button startARButton;
        public Button signInButton;
        public TextMeshProUGUI statusText;
        public TextMeshProUGUI statsText;
        public Slider progressSlider;
        
        [Header("Panels")]
        public GameObject mainMenuPanel;
        public GameObject learningPanel;
        public GameObject statsPanel;
        
        // System references
        private Core.BrainiacGameManager gameManager;
        private Core.AILearningSystem aiSystem;
        private Core.GamificationManager gamificationSystem;
        private Core.ARLearningManager arSystem;
        private Core.FirebaseManager firebaseSystem;
        
        void Start()
        {
            InitializeUI();
            SetupEventListeners();
        }
        
        /// <summary>
        /// Initialize UI components and get system references
        /// </summary>
        void InitializeUI()
        {
            // Get system references
            gameManager = Core.BrainiacGameManager.Instance;
            
            if (gameManager != null)
            {
                aiSystem = gameManager.aiLearningSystem;
                gamificationSystem = gameManager.gamificationManager;
                arSystem = gameManager.arLearningManager;
                firebaseSystem = gameManager.firebaseManager;
            }
            
            // Initialize UI state
            UpdateUIState();
            
            // Show main menu by default
            ShowMainMenu();
        }
        
        /// <summary>
        /// Set up event listeners for UI interactions
        /// </summary>
        void SetupEventListeners()
        {
            if (startSessionButton != null)
            {
                startSessionButton.onClick.AddListener(OnStartSession);
            }
            
            if (endSessionButton != null)
            {
                endSessionButton.onClick.AddListener(OnEndSession);
            }
            
            if (startARButton != null)
            {
                startARButton.onClick.AddListener(OnStartAR);
            }
            
            if (signInButton != null)
            {
                signInButton.onClick.AddListener(OnSignIn);
            }
            
            // Subscribe to system events
            if (gameManager != null)
            {
                gameManager.OnGameInitialized += OnGameInitialized;
                gameManager.OnSessionStateChanged += OnSessionStateChanged;
            }
            
            if (aiSystem != null)
            {
                aiSystem.OnProgressUpdated += OnProgressUpdated;
            }
            
            if (gamificationSystem != null)
            {
                gamificationSystem.OnStatsUpdated += OnStatsUpdated;
                gamificationSystem.OnAchievementUnlocked += OnAchievementUnlocked;
            }
            
            if (arSystem != null)
            {
                arSystem.OnARAvailabilityChanged += OnARAvailabilityChanged;
            }
            
            if (firebaseSystem != null)
            {
                firebaseSystem.OnAuthenticationChanged += OnAuthenticationChanged;
            }
        }
        
        /// <summary>
        /// Update UI state based on system status
        /// </summary>
        void UpdateUIState()
        {
            bool gameInitialized = gameManager != null && gameManager.IsGameInitialized;
            bool sessionActive = gameManager != null && gameManager.IsSessionActive;
            bool arAvailable = arSystem != null && arSystem.IsARSupported;
            bool userAuthenticated = firebaseSystem != null && firebaseSystem.IsAuthenticated;
            
            // Update button states
            if (startSessionButton != null)
            {
                startSessionButton.interactable = gameInitialized && !sessionActive;
            }
            
            if (endSessionButton != null)
            {
                endSessionButton.interactable = sessionActive;
            }
            
            if (startARButton != null)
            {
                startARButton.interactable = arAvailable;
                if (!arAvailable)
                {
                    startARButton.GetComponentInChildren<TextMeshProUGUI>().text = "AR Not Available";
                }
            }
            
            if (signInButton != null)
            {
                signInButton.GetComponentInChildren<TextMeshProUGUI>().text = userAuthenticated ? "Sign Out" : "Sign In";
            }
            
            // Update status text
            if (statusText != null)
            {
                string status = "Initializing...";
                if (gameInitialized)
                {
                    status = sessionActive ? "Learning Session Active" : "Ready to Learn";
                }
                statusText.text = status;
            }
            
            // Update stats
            UpdateStatsDisplay();
        }
        
        /// <summary>
        /// Update the statistics display
        /// </summary>
        void UpdateStatsDisplay()
        {
            if (statsText == null || gameManager == null) return;
            
            var learningProgress = gameManager.GetLearningProgress();
            var gamificationStats = gameManager.GetGamificationStats();
            
            string statsDisplay = $"Level: {learningProgress.currentLevel}\n";
            statsDisplay += $"XP: {learningProgress.experiencePoints:F0}\n";
            statsDisplay += $"Accuracy: {learningProgress.accuracy:P1}\n";
            statsDisplay += $"Points: {gamificationStats.totalPoints}\n";
            statsDisplay += $"Streak: {gamificationStats.currentStreak}\n";
            statsDisplay += $"Achievements: {gamificationStats.achievementsUnlocked}/{gamificationStats.totalAchievements}";
            
            statsText.text = statsDisplay;
            
            // Update progress slider
            if (progressSlider != null)
            {
                progressSlider.value = learningProgress.overallProgress;
            }
        }
        
        /// <summary>
        /// Show main menu panel
        /// </summary>
        public void ShowMainMenu()
        {
            SetActivePanel(mainMenuPanel);
        }
        
        /// <summary>
        /// Show learning panel
        /// </summary>
        public void ShowLearningPanel()
        {
            SetActivePanel(learningPanel);
        }
        
        /// <summary>
        /// Show statistics panel
        /// </summary>
        public void ShowStatsPanel()
        {
            SetActivePanel(statsPanel);
        }
        
        /// <summary>
        /// Set active panel and hide others
        /// </summary>
        void SetActivePanel(GameObject activePanel)
        {
            if (mainMenuPanel != null) mainMenuPanel.SetActive(activePanel == mainMenuPanel);
            if (learningPanel != null) learningPanel.SetActive(activePanel == learningPanel);
            if (statsPanel != null) statsPanel.SetActive(activePanel == statsPanel);
        }
        
        // Event Handlers
        
        void OnStartSession()
        {
            if (gameManager != null)
            {
                gameManager.StartLearningSession();
                ShowLearningPanel();
                
                // Simulate some learning activity for demonstration
                StartCoroutine(SimulateLearningActivity());
            }
        }
        
        void OnEndSession()
        {
            if (gameManager != null)
            {
                gameManager.EndLearningSession();
                ShowMainMenu();
            }
        }
        
        void OnStartAR()
        {
            if (arSystem != null && arSystem.IsARSupported)
            {
                arSystem.StartARSession();
                
                // Spawn some AR content for demonstration
                Vector3 spawnPos = Camera.main.transform.position + Camera.main.transform.forward * 2f;
                arSystem.SpawnARContent("math_geometry", spawnPos, Quaternion.identity);
                
                if (statusText != null)
                {
                    statusText.text = "AR Session Started - Look around to see 3D learning content!";
                }
            }
        }
        
        void OnSignIn()
        {
            if (firebaseSystem != null)
            {
                if (firebaseSystem.IsAuthenticated)
                {
                    firebaseSystem.SignOut();
                }
                else
                {
                    StartCoroutine(firebaseSystem.SignInAnonymously());
                }
            }
        }
        
        // System Event Callbacks
        
        void OnGameInitialized(bool initialized)
        {
            UpdateUIState();
            if (statusText != null)
            {
                statusText.text = initialized ? "Game Initialized - Ready to Learn!" : "Initialization Failed";
            }
        }
        
        void OnSessionStateChanged(bool sessionActive)
        {
            UpdateUIState();
        }
        
        void OnProgressUpdated(Core.LearningProgress progress)
        {
            UpdateStatsDisplay();
        }
        
        void OnStatsUpdated(Core.GamificationStats stats)
        {
            UpdateStatsDisplay();
        }
        
        void OnAchievementUnlocked(Core.Achievement achievement)
        {
            if (statusText != null)
            {
                statusText.text = $"Achievement Unlocked: {achievement.name}!";
            }
            
            // Could trigger UI animation or notification here
            Debug.Log($"🏆 Achievement Unlocked: {achievement.name} - {achievement.description}");
        }
        
        void OnARAvailabilityChanged(bool available)
        {
            UpdateUIState();
        }
        
        void OnAuthenticationChanged(bool authenticated)
        {
            UpdateUIState();
            if (statusText != null)
            {
                statusText.text = authenticated ? "User Authenticated" : "User Signed Out";
            }
        }
        
        /// <summary>
        /// Simulate learning activity for demonstration
        /// </summary>
        System.Collections.IEnumerator SimulateLearningActivity()
        {
            if (aiSystem == null || gamificationSystem == null) yield break;
            
            // Simulate answering questions with varying success
            string[] topics = { "Mathematics", "Science", "History", "Geography" };
            
            for (int i = 0; i < 10; i++)
            {
                yield return new WaitForSeconds(2f);
                
                string topic = topics[Random.Range(0, topics.Length)];
                bool isCorrect = Random.Range(0f, 1f) > 0.3f; // 70% success rate
                float responseTime = Random.Range(2f, 8f);
                float questionDifficulty = Random.Range(0.3f, 0.9f);
                
                // Process the question response
                aiSystem.ProcessQuestionResponse(topic, isCorrect, responseTime, questionDifficulty);
                
                // Update gamification
                if (isCorrect)
                {
                    gamificationSystem.ProcessCorrectAnswer(questionDifficulty, aiSystem.GetCurrentProgress().currentLevel);
                }
                
                // Update UI
                UpdateStatsDisplay();
                
                if (statusText != null)
                {
                    statusText.text = $"Question {i + 1}/10: {topic} - {(isCorrect ? "Correct!" : "Try again!")}";
                }
            }
            
            if (statusText != null)
            {
                statusText.text = "Learning session simulation complete!";
            }
        }
        
        void OnDestroy()
        {
            // Unsubscribe from events
            if (gameManager != null)
            {
                gameManager.OnGameInitialized -= OnGameInitialized;
                gameManager.OnSessionStateChanged -= OnSessionStateChanged;
            }
            
            if (aiSystem != null)
            {
                aiSystem.OnProgressUpdated -= OnProgressUpdated;
            }
            
            if (gamificationSystem != null)
            {
                gamificationSystem.OnStatsUpdated -= OnStatsUpdated;
                gamificationSystem.OnAchievementUnlocked -= OnAchievementUnlocked;
            }
            
            if (arSystem != null)
            {
                arSystem.OnARAvailabilityChanged -= OnARAvailabilityChanged;
            }
            
            if (firebaseSystem != null)
            {
                firebaseSystem.OnAuthenticationChanged -= OnAuthenticationChanged;
            }
        }
    }
}