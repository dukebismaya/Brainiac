using UnityEngine;
using System.Collections;

namespace Brainiac.Demo
{
    /// <summary>
    /// Demonstration script showing how all Brainiac systems work together
    /// This script can be attached to a GameObject to showcase the platform capabilities
    /// </summary>
    public class BrainiacDemo : MonoBehaviour
    {
        [Header("Demo Configuration")]
        public bool runDemoOnStart = true;
        public float demoStepDelay = 3f;
        public int questionsToSimulate = 15;
        
        private Core.BrainiacGameManager gameManager;
        
        void Start()
        {
            if (runDemoOnStart)
            {
                StartCoroutine(RunComprehensiveDemo());
            }
        }
        
        /// <summary>
        /// Run a comprehensive demonstration of all platform features
        /// </summary>
        IEnumerator RunComprehensiveDemo()
        {
            Debug.Log("🚀 Starting Brainiac Platform Demonstration...");
            
            // Wait for game manager to be available
            while (Core.BrainiacGameManager.Instance == null)
            {
                yield return new WaitForSeconds(0.5f);
            }
            
            gameManager = Core.BrainiacGameManager.Instance;
            
            // Wait for all systems to initialize
            while (!gameManager.IsGameInitialized)
            {
                Debug.Log("⏳ Waiting for system initialization...");
                yield return new WaitForSeconds(1f);
            }
            
            Debug.Log("✅ All systems initialized! Starting demonstration...");
            yield return new WaitForSeconds(demoStepDelay);
            
            // Demonstrate Firebase Authentication
            yield return StartCoroutine(DemonstrateAuthentication());
            
            // Demonstrate Learning Session
            yield return StartCoroutine(DemonstrateLearningSession());
            
            // Demonstrate AR Capabilities
            yield return StartCoroutine(DemonstrateARFeatures());
            
            // Demonstrate Gamification Features
            yield return StartCoroutine(DemonstrateGamification());
            
            // Demonstrate AI Adaptation
            yield return StartCoroutine(DemonstrateAIAdaptation());
            
            Debug.Log("🎉 Brainiac Platform Demonstration Complete!");
            Debug.Log("📊 Platform successfully demonstrated AI-powered gamified learning with AR integration!");
        }
        
        /// <summary>
        /// Demonstrate Firebase authentication features
        /// </summary>
        IEnumerator DemonstrateAuthentication()
        {
            Debug.Log("\n🔐 DEMONSTRATING FIREBASE AUTHENTICATION");
            Debug.Log("========================================");
            
            var firebaseManager = gameManager.firebaseManager;
            
            if (firebaseManager != null)
            {
                Debug.Log("🔑 Firebase Manager Status:");
                Debug.Log($"   - Initialized: {firebaseManager.IsInitialized}");
                Debug.Log($"   - User Authenticated: {firebaseManager.IsAuthenticated}");
                Debug.Log($"   - User ID: {firebaseManager.CurrentUserId}");
                
                if (!firebaseManager.IsAuthenticated)
                {
                    Debug.Log("🔄 Attempting anonymous sign-in...");
                    yield return StartCoroutine(firebaseManager.SignInAnonymously());
                }
                
                Debug.Log("✅ Authentication demonstration complete");
            }
            else
            {
                Debug.Log("⚠️ Firebase Manager not available");
            }
            
            yield return new WaitForSeconds(demoStepDelay);
        }
        
        /// <summary>
        /// Demonstrate learning session functionality
        /// </summary>
        IEnumerator DemonstrateLearningSession()
        {
            Debug.Log("\n🎓 DEMONSTRATING LEARNING SESSION");
            Debug.Log("=================================");
            
            Debug.Log("▶️ Starting learning session...");
            gameManager.StartLearningSession();
            
            yield return new WaitForSeconds(1f);
            
            Debug.Log($"📚 Session Status: {gameManager.IsSessionActive}");
            
            // Simulate learning activities
            yield return StartCoroutine(SimulateLearningQuestions());
            
            Debug.Log("⏹️ Ending learning session...");
            gameManager.EndLearningSession();
            
            Debug.Log("✅ Learning session demonstration complete");
            yield return new WaitForSeconds(demoStepDelay);
        }
        
        /// <summary>
        /// Simulate answering learning questions
        /// </summary>
        IEnumerator SimulateLearningQuestions()
        {
            Debug.Log($"🧠 Simulating {questionsToSimulate} learning questions...");
            
            var aiSystem = gameManager.aiLearningSystem;
            var gamificationSystem = gameManager.gamificationManager;
            
            string[] topics = { "Mathematics", "Science", "History", "Geography", "Literature", "Physics", "Chemistry", "Biology" };
            
            for (int i = 0; i < questionsToSimulate; i++)
            {
                string topic = topics[Random.Range(0, topics.Length)];
                bool isCorrect = Random.Range(0f, 1f) > 0.25f; // 75% success rate
                float responseTime = Random.Range(2f, 8f);
                float questionDifficulty = Random.Range(0.3f, 0.9f);
                
                Debug.Log($"   Q{i + 1}: {topic} | Difficulty: {questionDifficulty:F2} | Result: {(isCorrect ? "✓" : "✗")} | Time: {responseTime:F1}s");
                
                // Process through AI system
                aiSystem.ProcessQuestionResponse(topic, isCorrect, responseTime, questionDifficulty);
                
                // Update gamification
                if (isCorrect)
                {
                    gamificationSystem.ProcessCorrectAnswer(questionDifficulty, Random.Range(1, 6));
                }
                
                yield return new WaitForSeconds(0.5f);
            }
            
            // Show final progress
            var progress = gameManager.GetLearningProgress();
            var stats = gameManager.GetGamificationStats();
            
            Debug.Log("📊 Learning Session Results:");
            Debug.Log($"   - Overall Progress: {progress.overallProgress:P1}");
            Debug.Log($"   - Accuracy: {progress.accuracy:P1}");
            Debug.Log($"   - Experience Points: {progress.experiencePoints:F0}");
            Debug.Log($"   - Current Level: {progress.currentLevel}");
            Debug.Log($"   - Total Points: {stats.totalPoints}");
            Debug.Log($"   - Current Streak: {stats.currentStreak}");
        }
        
        /// <summary>
        /// Demonstrate AR learning capabilities
        /// </summary>
        IEnumerator DemonstrateARFeatures()
        {
            Debug.Log("\n🥽 DEMONSTRATING AR LEARNING FEATURES");
            Debug.Log("====================================");
            
            var arManager = gameManager.arLearningManager;
            
            if (arManager != null)
            {
                Debug.Log("🔍 AR System Status:");
                Debug.Log($"   - AR Supported: {arManager.IsARSupported}");
                Debug.Log($"   - AR Session Active: {arManager.IsARSessionActive}");
                
                if (arManager.IsARSupported)
                {
                    Debug.Log("▶️ Starting AR session...");
                    arManager.StartARSession();
                    
                    yield return new WaitForSeconds(1f);
                    
                    // Demonstrate AR content spawning
                    Vector3 spawnPosition = Camera.main.transform.position + Camera.main.transform.forward * 3f;
                    
                    Debug.Log("🔮 Spawning AR learning content:");
                    
                    var mathContent = arManager.SpawnARContent("math_geometry", spawnPosition, Quaternion.identity);
                    Debug.Log("   - Mathematics: 3D Geometry Explorer spawned");
                    
                    yield return new WaitForSeconds(1f);
                    
                    var scienceContent = arManager.SpawnARContent("science_solar_system", 
                        spawnPosition + Vector3.right * 2f, Quaternion.identity);
                    Debug.Log("   - Science: Solar System Explorer spawned");
                    
                    yield return new WaitForSeconds(1f);
                    
                    // Show AR content library
                    var mathARContent = arManager.GetARContentForSubject("Mathematics");
                    var scienceARContent = arManager.GetARContentForSubject("Science");
                    
                    Debug.Log("📚 Available AR Content:");
                    Debug.Log($"   - Mathematics modules: {mathARContent.Count}");
                    Debug.Log($"   - Science modules: {scienceARContent.Count}");
                    
                    yield return new WaitForSeconds(2f);
                    
                    Debug.Log("⏹️ Stopping AR session...");
                    arManager.StopARSession();
                }
                else
                {
                    Debug.Log("ℹ️ AR not supported on this device - running in simulation mode");
                }
                
                Debug.Log("✅ AR demonstration complete");
            }
            else
            {
                Debug.Log("⚠️ AR Manager not available");
            }
            
            yield return new WaitForSeconds(demoStepDelay);
        }
        
        /// <summary>
        /// Demonstrate gamification system
        /// </summary>
        IEnumerator DemonstrateGamification()
        {
            Debug.Log("\n🏆 DEMONSTRATING GAMIFICATION SYSTEM");
            Debug.Log("===================================");
            
            var gamificationManager = gameManager.gamificationManager;
            
            if (gamificationManager != null)
            {
                var stats = gamificationManager.GetCurrentStats();
                var achievements = gamificationManager.GetAchievements();
                var unlockedAchievements = gamificationManager.GetUnlockedAchievements();
                
                Debug.Log("🎮 Gamification Status:");
                Debug.Log($"   - Current Level: {stats.level}");
                Debug.Log($"   - Total Points: {stats.totalPoints}");
                Debug.Log($"   - Level Progress: {stats.levelProgress:P1}");
                Debug.Log($"   - Current Streak: {stats.currentStreak}");
                Debug.Log($"   - Max Streak: {stats.maxStreak}");
                Debug.Log($"   - Achievements Unlocked: {stats.achievementsUnlocked}/{stats.totalAchievements}");
                
                Debug.Log("\n🏅 Achievement System:");
                Debug.Log($"   - Total Achievements Available: {achievements.Count}");
                Debug.Log("   - Recent Unlocked Achievements:");
                
                foreach (var achievement in unlockedAchievements)
                {
                    Debug.Log($"     ✨ {achievement.name}: {achievement.description}");
                }
                
                // Demonstrate point awarding
                Debug.Log("\n💎 Demonstrating point system...");
                int initialPoints = stats.totalPoints;
                
                gamificationManager.AwardPoints(500, "Demo Bonus");
                stats = gamificationManager.GetCurrentStats();
                
                Debug.Log($"   - Points before: {initialPoints}");
                Debug.Log($"   - Points after: {stats.totalPoints}");
                Debug.Log($"   - Points gained: {stats.totalPoints - initialPoints}");
                
                Debug.Log("✅ Gamification demonstration complete");
            }
            else
            {
                Debug.Log("⚠️ Gamification Manager not available");
            }
            
            yield return new WaitForSeconds(demoStepDelay);
        }
        
        /// <summary>
        /// Demonstrate AI adaptation features
        /// </summary>
        IEnumerator DemonstrateAIAdaptation()
        {
            Debug.Log("\n🤖 DEMONSTRATING AI ADAPTATION");
            Debug.Log("==============================");
            
            var aiSystem = gameManager.aiLearningSystem;
            
            if (aiSystem != null)
            {
                Debug.Log("🧠 AI Learning System Status:");
                
                float initialDifficulty = aiSystem.GetCurrentDifficulty();
                Debug.Log($"   - Current Difficulty: {initialDifficulty:F2}");
                
                string recommendedTopic = aiSystem.GetRecommendedTopic();
                Debug.Log($"   - Recommended Topic: {recommendedTopic}");
                
                // Show topic mastery levels
                Debug.Log("📊 Topic Mastery Levels:");
                string[] topics = { "Mathematics", "Science", "History", "Geography" };
                
                foreach (string topic in topics)
                {
                    float mastery = aiSystem.GetTopicMastery(topic);
                    Debug.Log($"   - {topic}: {mastery:P1} mastery");
                }
                
                // Demonstrate difficulty adaptation
                Debug.Log("\n🎯 Demonstrating difficulty adaptation...");
                Debug.Log("   Simulating high performance to increase difficulty...");
                
                // Simulate high performance
                for (int i = 0; i < 5; i++)
                {
                    aiSystem.ProcessQuestionResponse("Mathematics", true, 2f, initialDifficulty);
                    yield return new WaitForSeconds(0.2f);
                }
                
                float newDifficulty = aiSystem.GetCurrentDifficulty();
                Debug.Log($"   - Difficulty adapted: {initialDifficulty:F2} → {newDifficulty:F2}");
                
                var finalProgress = aiSystem.GetCurrentProgress();
                Debug.Log("\n📈 Final Learning Progress:");
                Debug.Log($"   - Overall Progress: {finalProgress.overallProgress:P1}");
                Debug.Log($"   - Accuracy: {finalProgress.accuracy:P1}");
                Debug.Log($"   - Experience Points: {finalProgress.experiencePoints:F0}");
                Debug.Log($"   - Current Level: {finalProgress.currentLevel}");
                
                Debug.Log("✅ AI adaptation demonstration complete");
            }
            else
            {
                Debug.Log("⚠️ AI Learning System not available");
            }
            
            yield return new WaitForSeconds(demoStepDelay);
        }
        
        /// <summary>
        /// Quick test method to verify all systems are working
        /// </summary>
        [ContextMenu("Run Quick System Test")]
        public void RunQuickSystemTest()
        {
            StartCoroutine(QuickSystemTest());
        }
        
        IEnumerator QuickSystemTest()
        {
            Debug.Log("🔧 Running Quick System Test...");
            
            yield return new WaitForSeconds(1f);
            
            if (gameManager == null)
            {
                gameManager = Core.BrainiacGameManager.Instance;
            }
            
            bool allSystemsOperational = true;
            
            // Test Game Manager
            if (gameManager == null || !gameManager.IsGameInitialized)
            {
                Debug.LogError("❌ Game Manager not initialized");
                allSystemsOperational = false;
            }
            else
            {
                Debug.Log("✅ Game Manager operational");
            }
            
            // Test AI System
            if (gameManager?.aiLearningSystem?.IsInitialized != true)
            {
                Debug.LogError("❌ AI Learning System not initialized");
                allSystemsOperational = false;
            }
            else
            {
                Debug.Log("✅ AI Learning System operational");
            }
            
            // Test Gamification System
            if (gameManager?.gamificationManager?.IsInitialized != true)
            {
                Debug.LogError("❌ Gamification Manager not initialized");
                allSystemsOperational = false;
            }
            else
            {
                Debug.Log("✅ Gamification Manager operational");
            }
            
            // Test AR System
            if (gameManager?.arLearningManager?.IsInitialized != true)
            {
                Debug.LogError("❌ AR Learning Manager not initialized");
                allSystemsOperational = false;
            }
            else
            {
                Debug.Log("✅ AR Learning Manager operational");
            }
            
            // Test Firebase System
            if (gameManager?.firebaseManager?.IsInitialized != true)
            {
                Debug.LogError("❌ Firebase Manager not initialized");
                allSystemsOperational = false;
            }
            else
            {
                Debug.Log("✅ Firebase Manager operational");
            }
            
            if (allSystemsOperational)
            {
                Debug.Log("🎉 All systems operational! Brainiac platform ready for learning!");
            }
            else
            {
                Debug.LogWarning("⚠️ Some systems may need attention. Check individual system status above.");
            }
        }
    }
}