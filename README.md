# Brainiac Hackathon PWA

A learning platform for Students. Works offline with a Service Worker and app manifest.

## Features
- Progressive Web App (PWA): offline app shell, runtime caching, installable
- Gamification: XP, levels, badges, streaks, local leaderboard (localStorage)
- Games Hub: Advanced offline STEM mini-games:
   - Projectile Motion (Physics): compute range/time/height for given v₀, θ, g
   - Equation Balancer (Chemistry): balance real chemical equations via coefficients
   - Logic Truth Table (CS/Math): complete truth tables for boolean expressions
   - Shortest Path (CS/Math): solve weighted graphs with Dijkstra
      - Derivative Challenge (Calculus): compute f′(x₀) for given f(x)
   - Plus: Speed Arithmetic, Memory Match, and Ohm's Law
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
   - New advanced games appear at the top: Projectile Motion, Equation Balancer, Logic Truth Table, Shortest Path.
   - Unlocks follow the learning path (Physics/Chemistry/Math 1). Speed Arithmetic is always playable.
   - Try Projectile Motion: enter v₀ and θ (deg), choose target (Range/Time/Height), press Compute.
   - Try Equation Balancer: enter integer coefficients matching the balanced equation; press Check.
   - Try Logic Truth Table: fill output for each row; press Check to score.
   - Try Shortest Path: compute the shortest distance from source to target; press Check.
   - Try Derivative Challenge: compute f′(x₀) numerically and enter exact value; press Check.
5. On the Student page, use Offline Lessons panel to Download a lesson. Toggle Remove. Turn off network and reload; content should still work thanks to SW caching.
6. Teacher Portal shows class metrics and an XP bar chart (uses Chart.js CDN).

## Notes
- Data is stored in `localStorage` under `brainiac_gamification_v1`.
- SW caches `index.html`, `games.html`, `teacher.html`, core JS/CSS, locale files, and runtime requests for `lessons/*` and `games/*`.
- To force-update the SW, bump `VERSION` in `service-worker.js`.
