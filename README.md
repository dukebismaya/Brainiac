# Brainiac Hackathon PWA

A learning platform for Students. Works offline with a Service Worker and app manifest.

## Features
- Progressive Web App (PWA): offline app shell, runtime caching, installable
- Gamification: XP, levels, badges, streaks, local leaderboard (localStorage)
- Games Hub: 3 offline mini-games (Speed Arithmetic, Memory Match, Ohm's Law)
- Multilingual: `locales/en.json` and `locales/hi.json` + Text-to-Speech (Web Speech API)
- Student Portal: XP dashboard, badges, streaks, learning path, offline lessons
- Teacher Portal: Analytics from local data, simple chart via Chart.js CDN, sync stub

## Quick Start (Local)

Use any static server from the `app` directory. On Windows PowerShell:

```pwsh
cd ..\brainiac\
# Python
python -m http.server 8080
# Or Node http-server
# npx http-server -p 8080
```

Open http://localhost:8080 in Chrome/Edge.

## Smoke Test
1. Load the home page. You should see the Student Portal cards, XP=0, etc.
2. The Service Worker registers (check Application > Service Workers). Reload once to activate.
3. Switch language from the globe menu; texts update. Try TTS via playing a game or downloading a lesson.
4. Open Games Hub:
   - Speed Arithmetic always playable; Memory Match requires unlocking Chemistry; Ohm's Law requires Physics (first lesson unlock).
   - Play Speed Arithmetic for 30 seconds; at the end, XP is awarded and spoken.
5. On the Student page, use Offline Lessons panel to Download a lesson. Toggle Remove. Turn off network and reload; content should still work thanks to SW caching.
6. Teacher Portal shows class metrics and an XP bar chart (uses Chart.js CDN).

## Notes
- Data is stored in `localStorage` under `brainiac_gamification_v1`.
- SW caches `index.html`, `games.html`, `teacher.html`, core JS/CSS, locale files, and runtime requests for `lessons/*` and `games/*`.
- To force-update the SW, bump `VERSION` in `service-worker.js`.
