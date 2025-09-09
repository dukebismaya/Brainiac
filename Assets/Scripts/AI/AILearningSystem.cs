using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace Brainiac.Core
{
    /// <summary>
    /// AI-powered learning system that adapts to user performance and learning patterns
    /// </summary>
    public class AILearningSystem : MonoBehaviour
    {
        [Header("AI Configuration")]
        public float adaptationRate = 0.1f;
        public int performanceHistorySize = 50;
        public float difficultyAdjustmentThreshold = 0.75f;
        
        [Header("Learning Parameters")]
        public float baseExperiencePerQuestion = 10f;
        public float accuracyBonusMultiplier = 1.5f;
        public float streakBonusMultiplier = 1.2f;
        
        // AI Learning State
        private LearningProgress currentProgress;
        private Queue<float> performanceHistory;
        private Dictionary<string, float> topicMastery;
        private float currentDifficulty = 0.5f; // 0.0 to 1.0
        
        // Learning Analytics
        private Dictionary<string, int> questionAttempts;
        private Dictionary<string, int> correctAnswers;
        private float sessionStartTime;
        private int currentStreak = 0;
        
        // Events
        public System.Action<LearningProgress> OnProgressUpdated;
        public System.Action<float> OnDifficultyAdjusted;
        public System.Action<string> OnTopicMasteryUpdated;
        
        public bool IsInitialized { get; private set; }
        
        void Awake()
        {
            InitializeDataStructures();
        }
        
        /// <summary>
        /// Initialize AI learning system data structures
        /// </summary>
        void InitializeDataStructures()
        {
            currentProgress = new LearningProgress();
            performanceHistory = new Queue<float>();
            topicMastery = new Dictionary<string, float>();
            questionAttempts = new Dictionary<string, int>();
            correctAnswers = new Dictionary<string, int>();
            
            // Initialize common learning topics
            string[] topics = { "Mathematics", "Science", "History", "Geography", "Literature", "Physics", "Chemistry", "Biology" };
            foreach (string topic in topics)
            {
                topicMastery[topic] = 0.0f;
                questionAttempts[topic] = 0;
                correctAnswers[topic] = 0;
            }
        }
        
        /// <summary>
        /// Initialize the AI learning system
        /// </summary>
        public IEnumerator Initialize()
        {
            Debug.Log("[AILearningSystem] Initializing AI Learning System...");
            
            // Load user's learning data from Firebase
            yield return StartCoroutine(LoadUserLearningData());
            
            // Initialize AI models (simulated)
            yield return StartCoroutine(InitializeAIModels());
            
            IsInitialized = true;
            Debug.Log("[AILearningSystem] AI Learning System initialized successfully!");
        }
        
        /// <summary>
        /// Load user's previous learning data
        /// </summary>
        IEnumerator LoadUserLearningData()
        {
            // Simulate loading from Firebase
            yield return new WaitForSeconds(1.0f);
            
            // For now, initialize with default values
            // In a real implementation, this would load from Firebase
            currentProgress.overallProgress = PlayerPrefs.GetFloat("LearningProgress", 0f);
            currentProgress.completedLessons = PlayerPrefs.GetInt("CompletedLessons", 0);
            currentProgress.totalLessons = 100; // This would be loaded from curriculum data
            currentProgress.accuracy = PlayerPrefs.GetFloat("Accuracy", 0f);
            currentProgress.currentLevel = PlayerPrefs.GetInt("CurrentLevel", 1);
            currentProgress.experiencePoints = PlayerPrefs.GetFloat("ExperiencePoints", 0f);
            
            currentDifficulty = PlayerPrefs.GetFloat("CurrentDifficulty", 0.5f);
            
            Debug.Log($"[AILearningSystem] Loaded user data - Level: {currentProgress.currentLevel}, XP: {currentProgress.experiencePoints}");
        }
        
        /// <summary>
        /// Initialize AI models for adaptive learning
        /// </summary>
        IEnumerator InitializeAIModels()
        {
            // Simulate AI model initialization
            yield return new WaitForSeconds(0.5f);
            
            Debug.Log("[AILearningSystem] AI models initialized for adaptive learning");
        }
        
        /// <summary>
        /// Start a new learning session
        /// </summary>
        public void StartSession()
        {
            sessionStartTime = Time.time;
            currentStreak = 0;
            Debug.Log("[AILearningSystem] Learning session started");
        }
        
        /// <summary>
        /// End the current learning session
        /// </summary>
        public void EndSession()
        {
            float sessionDuration = Time.time - sessionStartTime;
            Debug.Log($"[AILearningSystem] Session ended. Duration: {sessionDuration:F2} seconds");
            
            // Save progress
            SaveLearningProgress();
            
            // Analyze session performance
            AnalyzeSessionPerformance();
        }
        
        /// <summary>
        /// Process a question response and update AI learning models
        /// </summary>
        public void ProcessQuestionResponse(string topic, bool isCorrect, float responseTime, float questionDifficulty)
        {
            if (!IsInitialized)
            {
                Debug.LogWarning("[AILearningSystem] System not initialized!");
                return;
            }
            
            // Update question attempts tracking
            if (!questionAttempts.ContainsKey(topic))
            {
                questionAttempts[topic] = 0;
                correctAnswers[topic] = 0;
            }
            
            questionAttempts[topic]++;
            
            if (isCorrect)
            {
                correctAnswers[topic]++;
                currentStreak++;
                
                // Award experience points
                float xpGained = CalculateExperienceGain(questionDifficulty, responseTime, currentStreak);
                currentProgress.experiencePoints += xpGained;
                
                Debug.Log($"[AILearningSystem] Correct answer! XP gained: {xpGained:F1}");
            }
            else
            {
                currentStreak = 0;
                Debug.Log("[AILearningSystem] Incorrect answer - streak reset");
            }
            
            // Update topic mastery
            UpdateTopicMastery(topic);
            
            // Add to performance history
            float performance = isCorrect ? 1.0f : 0.0f;
            UpdatePerformanceHistory(performance);
            
            // Update overall progress
            UpdateLearningProgress();
            
            // Adjust difficulty based on performance
            AdjustDifficulty();
            
            OnProgressUpdated?.Invoke(currentProgress);
        }
        
        /// <summary>
        /// Calculate experience points gained from a question
        /// </summary>
        float CalculateExperienceGain(float questionDifficulty, float responseTime, int streak)
        {
            float baseXP = baseExperiencePerQuestion * (1.0f + questionDifficulty);
            
            // Accuracy bonus (faster responses get more XP)
            float timeBonusMultiplier = Mathf.Clamp(10.0f / responseTime, 1.0f, accuracyBonusMultiplier);
            
            // Streak bonus
            float streakMultiplier = 1.0f + (streak * 0.1f * streakBonusMultiplier);
            
            return baseXP * timeBonusMultiplier * streakMultiplier;
        }
        
        /// <summary>
        /// Update topic mastery based on recent performance
        /// </summary>
        void UpdateTopicMastery(string topic)
        {
            if (questionAttempts[topic] == 0) return;
            
            float accuracy = (float)correctAnswers[topic] / questionAttempts[topic];
            float previousMastery = topicMastery.ContainsKey(topic) ? topicMastery[topic] : 0f;
            
            // Use adaptive learning rate to update mastery
            topicMastery[topic] = Mathf.Lerp(previousMastery, accuracy, adaptationRate);
            
            OnTopicMasteryUpdated?.Invoke(topic);
        }
        
        /// <summary>
        /// Update performance history for AI analysis
        /// </summary>
        void UpdatePerformanceHistory(float performance)
        {
            performanceHistory.Enqueue(performance);
            
            // Keep history size limited
            while (performanceHistory.Count > performanceHistorySize)
            {
                performanceHistory.Dequeue();
            }
        }
        
        /// <summary>
        /// Update overall learning progress
        /// </summary>
        void UpdateLearningProgress()
        {
            // Calculate overall accuracy
            int totalAttempts = 0;
            int totalCorrect = 0;
            
            foreach (var topic in questionAttempts.Keys)
            {
                totalAttempts += questionAttempts[topic];
                totalCorrect += correctAnswers[topic];
            }
            
            currentProgress.accuracy = totalAttempts > 0 ? (float)totalCorrect / totalAttempts : 0f;
            
            // Update level based on experience points
            int newLevel = Mathf.FloorToInt(currentProgress.experiencePoints / 1000f) + 1;
            if (newLevel > currentProgress.currentLevel)
            {
                currentProgress.currentLevel = newLevel;
                Debug.Log($"[AILearningSystem] Level up! New level: {currentProgress.currentLevel}");
            }
            
            // Calculate overall progress
            float totalMastery = 0f;
            foreach (var mastery in topicMastery.Values)
            {
                totalMastery += mastery;
            }
            currentProgress.overallProgress = totalMastery / topicMastery.Count;
        }
        
        /// <summary>
        /// Adjust difficulty based on recent performance
        /// </summary>
        void AdjustDifficulty()
        {
            if (performanceHistory.Count < 10) return; // Need enough data
            
            // Calculate recent performance average
            float recentPerformance = 0f;
            foreach (float performance in performanceHistory)
            {
                recentPerformance += performance;
            }
            recentPerformance /= performanceHistory.Count;
            
            float previousDifficulty = currentDifficulty;
            
            // Adjust difficulty based on performance
            if (recentPerformance > difficultyAdjustmentThreshold)
            {
                // Performance is good, increase difficulty
                currentDifficulty = Mathf.Clamp01(currentDifficulty + adaptationRate * 0.5f);
            }
            else if (recentPerformance < (1.0f - difficultyAdjustmentThreshold))
            {
                // Performance is poor, decrease difficulty
                currentDifficulty = Mathf.Clamp01(currentDifficulty - adaptationRate * 0.5f);
            }
            
            if (Mathf.Abs(previousDifficulty - currentDifficulty) > 0.01f)
            {
                Debug.Log($"[AILearningSystem] Difficulty adjusted: {previousDifficulty:F2} -> {currentDifficulty:F2}");
                OnDifficultyAdjusted?.Invoke(currentDifficulty);
            }
        }
        
        /// <summary>
        /// Get recommended next topic based on AI analysis
        /// </summary>
        public string GetRecommendedTopic()
        {
            string recommendedTopic = "";
            float lowestMastery = float.MaxValue;
            
            foreach (var topic in topicMastery)
            {
                if (topic.Value < lowestMastery)
                {
                    lowestMastery = topic.Value;
                    recommendedTopic = topic.Key;
                }
            }
            
            Debug.Log($"[AILearningSystem] Recommended topic: {recommendedTopic} (mastery: {lowestMastery:F2})");
            return recommendedTopic;
        }
        
        /// <summary>
        /// Get current difficulty level
        /// </summary>
        public float GetCurrentDifficulty()
        {
            return currentDifficulty;
        }
        
        /// <summary>
        /// Get current learning progress
        /// </summary>
        public LearningProgress GetCurrentProgress()
        {
            return currentProgress;
        }
        
        /// <summary>
        /// Get mastery level for a specific topic
        /// </summary>
        public float GetTopicMastery(string topic)
        {
            return topicMastery.ContainsKey(topic) ? topicMastery[topic] : 0f;
        }
        
        /// <summary>
        /// Analyze session performance and provide insights
        /// </summary>
        void AnalyzeSessionPerformance()
        {
            if (performanceHistory.Count == 0) return;
            
            float avgPerformance = 0f;
            foreach (float perf in performanceHistory)
            {
                avgPerformance += perf;
            }
            avgPerformance /= performanceHistory.Count;
            
            Debug.Log($"[AILearningSystem] Session Analysis - Avg Performance: {avgPerformance:F2}, Current Difficulty: {currentDifficulty:F2}");
        }
        
        /// <summary>
        /// Save learning progress to persistent storage
        /// </summary>
        void SaveLearningProgress()
        {
            PlayerPrefs.SetFloat("LearningProgress", currentProgress.overallProgress);
            PlayerPrefs.SetInt("CompletedLessons", currentProgress.completedLessons);
            PlayerPrefs.SetFloat("Accuracy", currentProgress.accuracy);
            PlayerPrefs.SetInt("CurrentLevel", currentProgress.currentLevel);
            PlayerPrefs.SetFloat("ExperiencePoints", currentProgress.experiencePoints);
            PlayerPrefs.SetFloat("CurrentDifficulty", currentDifficulty);
            PlayerPrefs.Save();
            
            Debug.Log("[AILearningSystem] Learning progress saved");
        }
    }
}