#!/bin/bash
# Script to create tags for the Brainiac project
# Run this script from the repository root directory

echo "Creating tags for Brainiac project..."

# Version tags
git tag v1.0.0 -m "Initial Brainiac PWA release - Basic STEM learning platform"
git tag v1.2.0 -m "Brainiac PWA v1.2.0 - Educational STEM learning platform with gamification"

# Topic tags
git tag education -m "Educational learning platform tag"
git tag stem-education -m "Science, Technology, Engineering and Math education platform"
git tag educational-games -m "Educational mini-games for learning"

# Technology tags
git tag pwa -m "Progressive Web App implementation"
git tag javascript-app -m "JavaScript-based web application"

# Feature tags
git tag gamification -m "Learning platform with gamification features"
git tag offline-first -m "Offline-first web application with service worker"
git tag multilingual -m "Multilingual support with English and Hindi"

echo "Tags created successfully!"
echo "To push tags to remote repository, run: git push origin --tags"
echo "To list all tags, run: git tag --list"