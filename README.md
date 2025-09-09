# Brainiac - AI-Powered Gamified Learning Platform

![Unity Version](https://img.shields.io/badge/Unity-2022.3.21f1-blue)
![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-green)
![License](https://img.shields.io/badge/License-GPL%20v3-orange)

An innovative AI-powered gamified learning platform built with Unity, featuring augmented reality experiences, adaptive learning algorithms, and comprehensive progress tracking through Firebase integration.

## 🎯 Features

### Core Learning System
- **AI-Powered Adaptive Learning**: Dynamic difficulty adjustment based on user performance
- **Personalized Learning Paths**: AI recommendations tailored to individual learning patterns
- **Comprehensive Progress Tracking**: Detailed analytics on learning performance and mastery

### Gamification Elements
- **Achievement System**: 20+ unlockable achievements with point rewards
- **Level Progression**: Experience-based leveling system with bonuses
- **Daily Streaks**: Encourage consistent learning habits
- **Points & Rewards**: Comprehensive scoring system with multipliers

### Augmented Reality Learning
- **AR Content Library**: Interactive 3D learning experiences
- **Subject-Specific AR Modules**: Mathematics, Science, and History content
- **Cross-Platform AR Support**: ARKit (iOS) and ARCore (Android)
- **Interactive AR Objects**: Touch, gesture, and movement-based interactions

### Cloud Integration
- **Firebase Authentication**: Anonymous and email-based user accounts
- **Real-time Data Sync**: Cross-device progress synchronization
- **Cloud Analytics**: Learning pattern analysis and insights
- **Offline Support**: Seamless offline-to-online data synchronization

## 🏗️ Architecture

### Project Structure
```
Assets/
├── Scripts/
│   ├── Core/           # Main game management and system coordination
│   ├── AI/            # AI learning algorithms and adaptation
│   ├── Gamification/  # Achievement, scoring, and progression systems
│   ├── AR/            # Augmented reality learning experiences
│   ├── Firebase/      # Cloud services and data synchronization
│   └── UI/            # User interface components
├── Scenes/            # Unity scenes
├── Prefabs/           # Reusable game objects
├── Materials/         # 3D materials and shaders
├── Textures/          # Image assets
├── Audio/             # Sound effects and music
├── Plugins/           # Third-party libraries and SDKs
└── StreamingAssets/   # Configuration files and data
```

### Core Systems

#### 1. BrainiacGameManager
Central coordinator that manages all core systems:
- System initialization and lifecycle management
- Learning session coordination
- Cross-system communication

#### 2. AILearningSystem
Adaptive learning intelligence:
- Performance analysis and difficulty adjustment
- Topic mastery tracking
- Personalized content recommendations
- Experience point calculation with bonuses

#### 3. GamificationManager
Comprehensive gamification features:
- Achievement system with 20+ achievements
- Level progression and experience tracking
- Daily login bonuses and streak management
- Points system with difficulty and streak multipliers

#### 4. ARLearningManager
Augmented reality education platform:
- Cross-platform AR support (ARKit/ARCore)
- Interactive 3D learning content
- AR object spawning and interaction management
- Subject-specific AR experiences

#### 5. FirebaseManager
Cloud services and data management:
- User authentication (anonymous and email)
- Real-time data synchronization
- Offline-first architecture with cloud sync
- Learning analytics and progress tracking

## 🚀 Getting Started

### Prerequisites
- Unity 2022.3.21f1 or later
- iOS 12.0+ (for ARKit support) or Android 7.0+ (for ARCore support)
- Firebase project (for cloud features)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/dukebismaya/Brainiac.git
   cd Brainiac
   ```

2. **Open in Unity**
   - Launch Unity Hub
   - Click "Open" and select the project folder
   - Unity will automatically import dependencies

3. **Firebase Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication, Realtime Database, and Analytics
   - Download `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
   - Replace the placeholder file in `Assets/StreamingAssets/`

4. **Build Settings**
   - Open Build Settings (Ctrl/Cmd + Shift + B)
   - Select your target platform (iOS/Android)
   - Configure player settings for your platform

### Configuration

#### Firebase Configuration
Edit `Assets/Scripts/Firebase/FirebaseManager.cs`:
```csharp
[Header("Firebase Configuration")]
public string databaseURL = "https://your-project-default-rtdb.firebaseio.com/";
```

#### AR Settings
For AR features, ensure XR Management is configured:
1. Window → XR → XR Management
2. Enable ARCore (Android) or ARKit (iOS)
3. Add AR Foundation packages through Package Manager

## 🎮 Usage

### Starting a Learning Session
```csharp
// Get the game manager instance
BrainiacGameManager gameManager = BrainiacGameManager.Instance;

// Start a learning session
gameManager.StartLearningSession();

// Process learning interactions
AILearningSystem aiSystem = gameManager.aiLearningSystem;
aiSystem.ProcessQuestionResponse("Mathematics", true, 3.5f, 0.7f);
```

### Gamification Integration
```csharp
// Award points for correct answers
GamificationManager gamification = gameManager.gamificationManager;
gamification.ProcessCorrectAnswer(difficulty: 0.8f, streakCount: 5);

// Check achievements
var achievements = gamification.GetAchievements();
var unlockedAchievements = gamification.GetUnlockedAchievements();
```

### AR Learning Experience
```csharp
// Check AR availability
ARLearningManager arManager = gameManager.arLearningManager;
if (arManager.IsARSupported)
{
    // Start AR session
    arManager.StartARSession();
    
    // Spawn AR content
    Vector3 spawnPosition = Camera.main.transform.position + Camera.main.transform.forward * 2f;
    arManager.SpawnARContent("math_geometry", spawnPosition, Quaternion.identity);
}
```

## 🔧 Development

### Adding New Learning Content
1. Create content data in the appropriate system (AI, AR, or UI)
2. Implement content logic in corresponding managers
3. Update achievement criteria if needed
4. Test across different difficulty levels

### Extending AI Capabilities
The AI system supports easy extension through:
- Custom difficulty adjustment algorithms
- New performance metrics
- Additional learning analytics
- Personalization features

### Creating AR Experiences
Add new AR content by:
1. Defining content in `ARLearningManager.CreateSampleARContent()`
2. Implementing content creation in `CreateARContentObject()`
3. Adding interaction handlers
4. Testing on AR-capable devices

## 📊 Analytics & Tracking

The platform tracks comprehensive learning analytics:
- **Performance Metrics**: Accuracy, response time, difficulty progression
- **Engagement Data**: Session duration, content interaction, streaks
- **Learning Patterns**: Topic mastery, learning velocity, preferred content
- **Gamification Stats**: Points earned, achievements unlocked, level progression

## 🔐 Privacy & Security

- Anonymous authentication by default
- Local-first data storage with cloud sync
- GDPR-compliant data handling
- Secure Firebase rules implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Unity Technologies for the development platform
- Google Firebase for cloud services
- ARKit and ARCore teams for AR capabilities
- The open-source community for inspiration and tools

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for learners worldwide**
