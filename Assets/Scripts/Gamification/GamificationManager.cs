using UnityEngine;
using System.Collections;
using System.Collections.Generic;

namespace Brainiac.Core
{
    /// <summary>
    /// Manages gamification elements including achievements, points, streaks, and rewards
    /// </summary>
    public class GamificationManager : MonoBehaviour
    {
        [Header("Gamification Configuration")]
        public int pointsPerCorrectAnswer = 10;
        public int streakBonusMultiplier = 2;
        public int dailyLoginBonus = 50;
        public int levelUpPointsRequirement = 1000;
        
        [Header("Achievement Configuration")]
        public int maxAchievements = 50;
        public int streakAchievementThresholds = 7;
        
        // Current gamification state
        private GamificationStats currentStats;
        private List<Achievement> achievements;
        private List<Achievement> unlockedAchievements;
        private Dictionary<string, int> dailyStats;
        
        // Session tracking
        private int sessionCorrectAnswers = 0;
        private int sessionPoints = 0;
        private float sessionStartTime;
        private bool hasLoginBonus = false;
        
        // Events
        public System.Action<GamificationStats> OnStatsUpdated;
        public System.Action<Achievement> OnAchievementUnlocked;
        public System.Action<int> OnPointsAwarded;
        public System.Action<int> OnLevelUp;
        public System.Action<int> OnStreakUpdated;
        
        public bool IsInitialized { get; private set; }
        
        void Awake()
        {
            InitializeGamificationData();
        }
        
        /// <summary>
        /// Initialize gamification data structures
        /// </summary>
        void InitializeGamificationData()
        {
            currentStats = new GamificationStats();
            achievements = new List<Achievement>();
            unlockedAchievements = new List<Achievement>();
            dailyStats = new Dictionary<string, int>();
            
            // Initialize daily stats tracking
            dailyStats["correctAnswers"] = 0;
            dailyStats["sessionsCompleted"] = 0;
            dailyStats["pointsEarned"] = 0;
        }
        
        /// <summary>
        /// Initialize the gamification system
        /// </summary>
        public IEnumerator Initialize()
        {
            Debug.Log("[GamificationManager] Initializing Gamification System...");
            
            // Load user's gamification data
            yield return StartCoroutine(LoadGamificationData());
            
            // Initialize achievements
            yield return StartCoroutine(InitializeAchievements());
            
            // Check for daily login bonus
            CheckDailyLoginBonus();
            
            IsInitialized = true;
            Debug.Log("[GamificationManager] Gamification System initialized successfully!");
        }
        
        /// <summary>
        /// Load user's gamification data from persistent storage
        /// </summary>
        IEnumerator LoadGamificationData()
        {
            // Simulate loading from Firebase/PlayerPrefs
            yield return new WaitForSeconds(0.5f);
            
            currentStats.totalPoints = PlayerPrefs.GetInt("TotalPoints", 0);
            currentStats.currentStreak = PlayerPrefs.GetInt("CurrentStreak", 0);
            currentStats.maxStreak = PlayerPrefs.GetInt("MaxStreak", 0);
            currentStats.achievementsUnlocked = PlayerPrefs.GetInt("AchievementsUnlocked", 0);
            currentStats.level = PlayerPrefs.GetInt("GamificationLevel", 1);
            currentStats.levelProgress = PlayerPrefs.GetFloat("LevelProgress", 0f);
            
            // Load daily stats
            string today = System.DateTime.Now.ToString("yyyy-MM-dd");
            string lastPlayDate = PlayerPrefs.GetString("LastPlayDate", "");
            
            if (lastPlayDate != today)
            {
                // Reset daily stats for new day
                dailyStats["correctAnswers"] = 0;
                dailyStats["sessionsCompleted"] = 0;
                dailyStats["pointsEarned"] = 0;
                
                // Check if streak should be broken
                if (!string.IsNullOrEmpty(lastPlayDate))
                {
                    System.DateTime lastDate = System.DateTime.Parse(lastPlayDate);
                    System.DateTime todayDate = System.DateTime.Parse(today);
                    
                    if ((todayDate - lastDate).Days > 1)
                    {
                        // Streak broken - reset to 0
                        currentStats.currentStreak = 0;
                        Debug.Log("[GamificationManager] Streak broken due to missed day(s)");
                    }
                }
            }
            else
            {
                // Load today's stats
                dailyStats["correctAnswers"] = PlayerPrefs.GetInt($"Daily_CorrectAnswers_{today}", 0);
                dailyStats["sessionsCompleted"] = PlayerPrefs.GetInt($"Daily_SessionsCompleted_{today}", 0);
                dailyStats["pointsEarned"] = PlayerPrefs.GetInt($"Daily_PointsEarned_{today}", 0);
            }
            
            Debug.Log($"[GamificationManager] Loaded gamification data - Level: {currentStats.level}, Points: {currentStats.totalPoints}, Streak: {currentStats.currentStreak}");
        }
        
        /// <summary>
        /// Initialize achievement system
        /// </summary>
        IEnumerator InitializeAchievements()
        {
            achievements.Clear();
            
            // Create various achievements
            CreateAchievements();
            
            // Load unlocked achievements
            LoadUnlockedAchievements();
            
            currentStats.totalAchievements = achievements.Count;
            
            yield return null;
            
            Debug.Log($"[GamificationManager] Initialized {achievements.Count} achievements, {unlockedAchievements.Count} unlocked");
        }
        
        /// <summary>
        /// Create achievement definitions
        /// </summary>
        void CreateAchievements()
        {
            // First Steps achievements
            achievements.Add(new Achievement("first_correct", "First Steps", "Answer your first question correctly", 100));
            achievements.Add(new Achievement("five_correct", "Getting Started", "Answer 5 questions correctly", 250));
            achievements.Add(new Achievement("ten_correct", "On a Roll", "Answer 10 questions correctly", 500));
            
            // Streak achievements
            achievements.Add(new Achievement("streak_3", "Triple Threat", "Get a 3 answer streak", 200));
            achievements.Add(new Achievement("streak_5", "High Five", "Get a 5 answer streak", 300));
            achievements.Add(new Achievement("streak_10", "Perfect Ten", "Get a 10 answer streak", 500));
            
            // Daily achievements
            achievements.Add(new Achievement("daily_login", "Daily Learner", "Log in and learn every day for 7 days", 1000));
            achievements.Add(new Achievement("early_bird", "Early Bird", "Complete a session before 9 AM", 300));
            achievements.Add(new Achievement("night_owl", "Night Owl", "Complete a session after 10 PM", 300));
            
            // Points achievements
            achievements.Add(new Achievement("points_1000", "Point Collector", "Earn 1,000 points", 500));
            achievements.Add(new Achievement("points_5000", "Point Master", "Earn 5,000 points", 1000));
            achievements.Add(new Achievement("points_10000", "Point Legend", "Earn 10,000 points", 2000));
            
            // Level achievements
            achievements.Add(new Achievement("level_5", "Level Up", "Reach level 5", 750));
            achievements.Add(new Achievement("level_10", "Experienced", "Reach level 10", 1500));
            achievements.Add(new Achievement("level_20", "Expert Learner", "Reach level 20", 3000));
            
            // Topic mastery achievements
            achievements.Add(new Achievement("math_master", "Math Master", "Achieve 90% accuracy in Mathematics", 1000));
            achievements.Add(new Achievement("science_genius", "Science Genius", "Achieve 90% accuracy in Science", 1000));
            achievements.Add(new Achievement("history_buff", "History Buff", "Achieve 90% accuracy in History", 1000));
        }
        
        /// <summary>
        /// Load previously unlocked achievements
        /// </summary>
        void LoadUnlockedAchievements()
        {
            unlockedAchievements.Clear();
            
            foreach (Achievement achievement in achievements)
            {
                bool isUnlocked = PlayerPrefs.GetInt($"Achievement_{achievement.id}", 0) == 1;
                if (isUnlocked)
                {
                    unlockedAchievements.Add(achievement);
                }
            }
            
            currentStats.achievementsUnlocked = unlockedAchievements.Count;
        }
        
        /// <summary>
        /// Check and award daily login bonus
        /// </summary>
        void CheckDailyLoginBonus()
        {
            string today = System.DateTime.Now.ToString("yyyy-MM-dd");
            string lastPlayDate = PlayerPrefs.GetString("LastPlayDate", "");
            
            if (lastPlayDate != today)
            {
                // Award daily login bonus
                AwardPoints(dailyLoginBonus, "Daily Login Bonus");
                hasLoginBonus = true;
                
                // Update streak
                if (!string.IsNullOrEmpty(lastPlayDate))
                {
                    System.DateTime lastDate = System.DateTime.Parse(lastPlayDate);
                    System.DateTime todayDate = System.DateTime.Parse(today);
                    
                    if ((todayDate - lastDate).Days == 1)
                    {
                        // Consecutive day - increment streak
                        currentStats.currentStreak++;
                        if (currentStats.currentStreak > currentStats.maxStreak)
                        {
                            currentStats.maxStreak = currentStats.currentStreak;
                        }
                        OnStreakUpdated?.Invoke(currentStats.currentStreak);
                    }
                }
                else
                {
                    // First login
                    currentStats.currentStreak = 1;
                    currentStats.maxStreak = 1;
                    OnStreakUpdated?.Invoke(currentStats.currentStreak);
                }
                
                // Save last play date
                PlayerPrefs.SetString("LastPlayDate", today);
                
                Debug.Log($"[GamificationManager] Daily login bonus awarded! Streak: {currentStats.currentStreak}");
            }
        }
        
        /// <summary>
        /// Start a new gamification session
        /// </summary>
        public void StartSession()
        {
            sessionStartTime = Time.time;
            sessionCorrectAnswers = 0;
            sessionPoints = 0;
            
            Debug.Log("[GamificationManager] Gamification session started");
        }
        
        /// <summary>
        /// End the current gamification session
        /// </summary>
        public void EndSession()
        {
            float sessionDuration = Time.time - sessionStartTime;
            
            // Award session completion points
            int completionBonus = Mathf.RoundToInt(sessionDuration / 60f * 10f); // 10 points per minute
            AwardPoints(completionBonus, "Session Completion");
            
            // Update daily stats
            dailyStats["sessionsCompleted"]++;
            dailyStats["pointsEarned"] += sessionPoints;
            
            // Save daily stats
            SaveDailyStats();
            
            // Check for achievements
            CheckSessionAchievements();
            
            Debug.Log($"[GamificationManager] Session ended - Duration: {sessionDuration:F1}s, Points earned: {sessionPoints}");
        }
        
        /// <summary>
        /// Process a correct answer for gamification
        /// </summary>
        public void ProcessCorrectAnswer(float difficulty = 1.0f, int streakCount = 0)
        {
            sessionCorrectAnswers++;
            dailyStats["correctAnswers"]++;
            
            // Calculate points based on difficulty and streak
            int basePoints = Mathf.RoundToInt(pointsPerCorrectAnswer * difficulty);
            int streakBonus = streakCount > 0 ? (streakCount - 1) * streakBonusMultiplier : 0;
            int totalPoints = basePoints + streakBonus;
            
            AwardPoints(totalPoints, "Correct Answer");
            
            // Check for achievements
            CheckAnswerAchievements();
            
            Debug.Log($"[GamificationManager] Correct answer processed - Base: {basePoints}, Streak Bonus: {streakBonus}, Total: {totalPoints}");
        }
        
        /// <summary>
        /// Award points to the player
        /// </summary>
        public void AwardPoints(int points, string reason = "")
        {
            currentStats.totalPoints += points;
            sessionPoints += points;
            
            // Check for level up
            int newLevel = (currentStats.totalPoints / levelUpPointsRequirement) + 1;
            if (newLevel > currentStats.level)
            {
                int levelsGained = newLevel - currentStats.level;
                currentStats.level = newLevel;
                OnLevelUp?.Invoke(currentStats.level);
                
                // Award bonus points for level up
                int levelUpBonus = levelsGained * 200;
                currentStats.totalPoints += levelUpBonus;
                
                Debug.Log($"[GamificationManager] Level up! New level: {currentStats.level}, Bonus: {levelUpBonus}");
            }
            
            // Update level progress
            int pointsInCurrentLevel = currentStats.totalPoints % levelUpPointsRequirement;
            currentStats.levelProgress = (float)pointsInCurrentLevel / levelUpPointsRequirement;
            
            OnPointsAwarded?.Invoke(points);
            OnStatsUpdated?.Invoke(currentStats);
            
            if (!string.IsNullOrEmpty(reason))
            {
                Debug.Log($"[GamificationManager] Awarded {points} points for: {reason}");
            }
        }
        
        /// <summary>
        /// Check for achievements related to correct answers
        /// </summary>
        void CheckAnswerAchievements()
        {
            CheckAndUnlockAchievement("first_correct", dailyStats["correctAnswers"] >= 1);
            CheckAndUnlockAchievement("five_correct", dailyStats["correctAnswers"] >= 5);
            CheckAndUnlockAchievement("ten_correct", dailyStats["correctAnswers"] >= 10);
        }
        
        /// <summary>
        /// Check for session-related achievements
        /// </summary>
        void CheckSessionAchievements()
        {
            // Time-based achievements
            System.DateTime now = System.DateTime.Now;
            CheckAndUnlockAchievement("early_bird", now.Hour < 9);
            CheckAndUnlockAchievement("night_owl", now.Hour >= 22);
            
            // Points achievements
            CheckAndUnlockAchievement("points_1000", currentStats.totalPoints >= 1000);
            CheckAndUnlockAchievement("points_5000", currentStats.totalPoints >= 5000);
            CheckAndUnlockAchievement("points_10000", currentStats.totalPoints >= 10000);
            
            // Level achievements
            CheckAndUnlockAchievement("level_5", currentStats.level >= 5);
            CheckAndUnlockAchievement("level_10", currentStats.level >= 10);
            CheckAndUnlockAchievement("level_20", currentStats.level >= 20);
            
            // Streak achievements
            CheckAndUnlockAchievement("streak_3", currentStats.currentStreak >= 3);
            CheckAndUnlockAchievement("streak_5", currentStats.currentStreak >= 5);
            CheckAndUnlockAchievement("streak_10", currentStats.currentStreak >= 10);
            
            // Daily login achievement
            CheckAndUnlockAchievement("daily_login", currentStats.currentStreak >= 7);
        }
        
        /// <summary>
        /// Check and unlock a specific achievement
        /// </summary>
        void CheckAndUnlockAchievement(string achievementId, bool condition)
        {
            if (!condition) return;
            
            // Check if already unlocked
            bool alreadyUnlocked = PlayerPrefs.GetInt($"Achievement_{achievementId}", 0) == 1;
            if (alreadyUnlocked) return;
            
            // Find and unlock achievement
            Achievement achievement = achievements.Find(a => a.id == achievementId);
            if (achievement != null)
            {
                UnlockAchievement(achievement);
            }
        }
        
        /// <summary>
        /// Unlock an achievement
        /// </summary>
        void UnlockAchievement(Achievement achievement)
        {
            unlockedAchievements.Add(achievement);
            currentStats.achievementsUnlocked = unlockedAchievements.Count;
            
            // Save achievement unlock
            PlayerPrefs.SetInt($"Achievement_{achievement.id}", 1);
            
            // Award achievement points
            AwardPoints(achievement.pointReward, $"Achievement: {achievement.name}");
            
            OnAchievementUnlocked?.Invoke(achievement);
            OnStatsUpdated?.Invoke(currentStats);
            
            Debug.Log($"[GamificationManager] Achievement unlocked: {achievement.name} (+{achievement.pointReward} points)");
        }
        
        /// <summary>
        /// Get current gamification statistics
        /// </summary>
        public GamificationStats GetCurrentStats()
        {
            return currentStats;
        }
        
        /// <summary>
        /// Get list of all achievements
        /// </summary>
        public List<Achievement> GetAchievements()
        {
            return achievements;
        }
        
        /// <summary>
        /// Get list of unlocked achievements
        /// </summary>
        public List<Achievement> GetUnlockedAchievements()
        {
            return unlockedAchievements;
        }
        
        /// <summary>
        /// Save daily statistics
        /// </summary>
        void SaveDailyStats()
        {
            string today = System.DateTime.Now.ToString("yyyy-MM-dd");
            
            PlayerPrefs.SetInt($"Daily_CorrectAnswers_{today}", dailyStats["correctAnswers"]);
            PlayerPrefs.SetInt($"Daily_SessionsCompleted_{today}", dailyStats["sessionsCompleted"]);
            PlayerPrefs.SetInt($"Daily_PointsEarned_{today}", dailyStats["pointsEarned"]);
            
            // Save overall stats
            PlayerPrefs.SetInt("TotalPoints", currentStats.totalPoints);
            PlayerPrefs.SetInt("CurrentStreak", currentStats.currentStreak);
            PlayerPrefs.SetInt("MaxStreak", currentStats.maxStreak);
            PlayerPrefs.SetInt("AchievementsUnlocked", currentStats.achievementsUnlocked);
            PlayerPrefs.SetInt("GamificationLevel", currentStats.level);
            PlayerPrefs.SetFloat("LevelProgress", currentStats.levelProgress);
            
            PlayerPrefs.Save();
        }
        
        void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                SaveDailyStats();
            }
        }
        
        void OnApplicationFocus(bool hasFocus)
        {
            if (!hasFocus)
            {
                SaveDailyStats();
            }
        }
    }
    
    /// <summary>
    /// Achievement data structure
    /// </summary>
    [System.Serializable]
    public class Achievement
    {
        public string id;
        public string name;
        public string description;
        public int pointReward;
        
        public Achievement(string id, string name, string description, int pointReward)
        {
            this.id = id;
            this.name = name;
            this.description = description;
            this.pointReward = pointReward;
        }
    }
}