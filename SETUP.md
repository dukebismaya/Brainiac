# Brainiac Setup Guide

This guide will help you set up and run the Brainiac AI-powered gamified learning platform.

## Quick Start

### 1. Unity Setup
1. **Install Unity 2022.3.21f1** or later from Unity Hub
2. **Open the project** in Unity (the project will auto-import dependencies)
3. **Open the main scene**: `Assets/Scenes/MainScene.unity`

### 2. Initial Testing
1. **Press Play** in Unity Editor to start the platform
2. The **BrainiacDemo** script will automatically run a comprehensive demonstration
3. **Check the Console** for detailed logs showing all system operations
4. **Watch the game view** for any UI elements or AR content

### 3. System Verification
- All core systems should initialize automatically
- Console will show green checkmarks (✅) for successful systems
- Any red X marks (❌) indicate systems needing attention

## Core Systems Overview

### 1. BrainiacGameManager
- **Location**: `Assets/Scripts/Core/BrainiacGameManager.cs`
- **Purpose**: Central system coordinator
- **Features**: Session management, system initialization, cross-system communication

### 2. AILearningSystem  
- **Location**: `Assets/Scripts/AI/AILearningSystem.cs`
- **Purpose**: Adaptive learning intelligence
- **Features**: Difficulty adjustment, topic mastery, personalized recommendations

### 3. GamificationManager
- **Location**: `Assets/Scripts/Gamification/GamificationManager.cs` 
- **Purpose**: Engagement and motivation
- **Features**: 20+ achievements, level progression, streak tracking, points system

### 4. ARLearningManager
- **Location**: `Assets/Scripts/AR/ARLearningManager.cs`
- **Purpose**: Augmented reality experiences
- **Features**: AR content library, cross-platform support, interactive 3D learning

### 5. FirebaseManager
- **Location**: `Assets/Scripts/Firebase/FirebaseManager.cs`
- **Purpose**: Cloud services and data sync
- **Features**: User authentication, real-time sync, offline support, analytics

## Configuration

### Firebase Configuration
1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project: "brainiac-learning"
   - Enable Authentication, Realtime Database, Analytics

2. **Download Configuration**:
   - **Android**: Download `google-services.json`
   - **iOS**: Download `GoogleService-Info.plist` 
   - Replace the placeholder file in `Assets/StreamingAssets/`

3. **Update Database URL**:
   ```csharp
   // In FirebaseManager.cs
   public string databaseURL = "https://your-project-default-rtdb.firebaseio.com/";
   ```

### AR Configuration
1. **Enable XR Management**:
   - Window → XR → XR Management
   - Install XR Plugin Management
   - Enable ARCore (Android) and/or ARKit (iOS)

2. **AR Foundation Setup**:
   - Packages should auto-install from `manifest.json`
   - Verify AR Foundation, ARCore XR Plugin, ARKit XR Plugin are installed

### Build Settings
1. **Platform Selection**:
   - File → Build Settings
   - Switch to iOS or Android
   - Configure Player Settings for your platform

2. **Required Permissions**:
   - **Camera**: For AR functionality
   - **Internet**: For Firebase synchronization
   - **Storage**: For offline data caching

## Testing the Platform

### 1. Play Mode Testing
```csharp
// The demo will automatically show:
// 🔐 Firebase Authentication
// 🎓 Learning Session Management  
// 🥽 AR Content Spawning
// 🏆 Gamification Features
// 🤖 AI Adaptation
```

### 2. Manual Testing
```csharp
// Access the game manager
BrainiacGameManager gameManager = BrainiacGameManager.Instance;

// Start a learning session
gameManager.StartLearningSession();

// Process learning interactions
gameManager.aiLearningSystem.ProcessQuestionResponse("Mathematics", true, 3.5f, 0.7f);

// Check progress
var progress = gameManager.GetLearningProgress();
var stats = gameManager.GetGamificationStats();
```

### 3. AR Testing
- **Editor**: AR simulation is enabled for testing
- **Device**: Deploy to AR-capable device for full AR experience
- **Content**: AR objects spawn 2-3 meters in front of camera

## Development Workflow

### Adding New Learning Content
1. **AI Content**: Add topics in `AILearningSystem.InitializeDataStructures()`
2. **AR Content**: Add experiences in `ARLearningManager.CreateSampleARContent()`
3. **Achievements**: Add new achievements in `GamificationManager.CreateAchievements()`

### Extending Systems
1. **AI Features**: Extend `AILearningSystem` with new algorithms
2. **Gamification**: Add new achievement types or progression mechanics
3. **AR Experiences**: Create new content types and interaction methods
4. **Firebase**: Add new data structures and sync patterns

### Debugging
1. **Console Logs**: All systems provide detailed logging
2. **System Status**: Use `BrainiacDemo.RunQuickSystemTest()`
3. **Progress Tracking**: Monitor learning analytics in real-time

## Platform Features

### Learning Analytics
- Real-time performance tracking
- Adaptive difficulty adjustment  
- Topic mastery measurement
- Personalized content recommendations

### Gamification Elements
- 20+ unlockable achievements
- Experience-based level progression
- Daily login streaks and bonuses
- Comprehensive point system with multipliers

### AR Experiences
- Mathematics: 3D geometry, fraction visualization
- Science: Solar system, molecular structures
- History: Ancient civilization tours
- Interactive touch, gesture, and movement controls

### Cloud Integration
- Anonymous and email authentication
- Cross-device progress synchronization
- Offline-first architecture
- Learning pattern analytics

## Troubleshooting

### Common Issues
1. **Systems Not Initializing**: Check console for initialization errors
2. **AR Not Working**: Verify XR Management configuration
3. **Firebase Errors**: Confirm configuration files are properly placed
4. **Performance Issues**: Monitor frame rate and optimize content

### Platform-Specific
- **iOS**: Requires ARKit-capable device (iPhone 6s+)
- **Android**: Requires ARCore support (Android 7.0+)
- **Editor**: All features work in simulation mode

## Performance Optimization

### Memory Management
- AR content is pooled and reused
- Firebase data is cached locally
- Learning analytics are batched

### Battery Optimization
- AR sessions can be paused/resumed
- Cloud sync is throttled
- Background processing is minimized

## Deployment

### iOS Deployment
1. Configure iOS Player Settings
2. Set minimum iOS version to 12.0
3. Enable Camera usage description
4. Build and deploy via Xcode

### Android Deployment  
1. Configure Android Player Settings
2. Set minimum API level to 24 (Android 7.0)
3. Enable required permissions
4. Build APK or AAB for distribution

## Support and Extensions

The platform is designed to be easily extensible:

- **Modular Architecture**: Each system is independent
- **Event-Driven Communication**: Loose coupling between systems
- **Comprehensive Logging**: Detailed debug information
- **Configuration-Based**: Easy to modify behavior without code changes

For advanced features, consider adding:
- Voice interaction and speech recognition
- Multiplayer collaborative learning
- Advanced AI models for content generation
- Parental controls and progress reporting
- Accessibility features for inclusive learning

---

**Ready to revolutionize learning with AI-powered gamification and AR! 🚀**