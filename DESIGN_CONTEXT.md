# T-Gaia World Cup 2026 – Design Decisions & Context

This file contains the design decisions, discussion outcomes, and broader context for the project.
Give this to Claude Code alongside CLAUDE_CODE_PLAN.md for full context.

## Overview
- Virtual bonding session with international colleagues (~8-20 people)
- Competition with individual (IP) and group (GP) scoring
- Mix of external games (admin scores) and internal browser games (auto-score)
- Session is 17. Juni 2026
- Claude Code builds, user oversees

## Tech Stack
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + Framer Motion
- **Hosting**: GitHub Pages (new repo, deploy via GitHub Actions)
- **Backend/State**: Firebase Realtime Database (free tier, 100 concurrent connections)
- **Routing**: React Router (HashRouter for GH Pages compatibility)
- **No server needed** – Firebase SDK runs client-side
- **Platform**: Laptop-first (mobile not priority)
- **Language**: English UI

## Theme & Design
- Name: "T-Gaia World Cup 2026"
- Telekom Magenta (#E20074) as primary color
- Dark techy background (space/tech vibes)
- WC 2026 elements: football icons, stadium graphics (CSS/SVG)
- Glassmorphism + gradient backgrounds + animations for "impressive but low-effort"
- Data Science / ML / Software Engineering aesthetic mixed in

## Session & Join Flow
1. Admin creates session on admin page → gets session link (e.g. ?session=WC2026)
2. Admin shares link in Teams call/chat
3. Players click link → Enter name → Join → See waiting screen
4. Admin sees live who joined
5. Admin clicks "Randomize Teams" once everyone is there
   - Round-robin or shuffle assignment
   - Late-joiners go to smallest team
6. Teams can be renamed (1 rename allowed, by admin OR team member)
7. Funny auto-generated team names from football + ML/software terms mashup
8. Player session stored in localStorage (refresh-safe)
9. Admin controls game flow: Start Game → Play → Reveal → Next Game

## Scoring System
- **IP** (Individual Points): Individual ranking within a game
- **GP** (Group Points): Best-performing team in a game
- **Two winners at end**: Individual Champion (highest IP) + Team Champion (highest GP)
- Optional: MVP = highest IP in winning team
- **HYBRID: Every game awards BOTH IP and GP**
- Scoring details (points per rank, exact numbers) to be fine-tuned LATER

### Per-Game Scoring Breakdown
| Game | IP (Individual) | GP (Team) |
|------|-----------------|-----------|
| Math Speed | Ranking by # solved → IP per rank | Team with highest SUM of solved → GP |
| Scrambled Words | Points from first-submit ranking → IP | Team with most total points → GP |
| Emoji Riddles | Points from first-submit ranking → IP | Team with most total points → GP |
| WC Stats Guessing | Ranking by deviation → IP per rank | Team with lowest AVG deviation → GP |
| Language Guessing | Points from first-submit ranking → IP | Team with most total points → GP |
| Kahoot (external) | Admin enters top ranks → IP | Admin enters winning team → GP |
| Imposter (external) | IP for imposter survival / correct vote | GP for team with best collective vote accuracy |
| Wavelength (external) | Small IP for closest individual guess | GP for closest team → admin enters |

### IP Distribution (per game, based on rank)
- Preliminary scale (fine-tune later):
  - 1st: 10 IP, 2nd: 8, 3rd: 6, 4th: 5, 5th: 4, 6th: 3, 7th: 2, 8th+: 1

### GP Distribution (per game)
- Winning team: 10 GP, 2nd team: 6 GP, 3rd: 3 GP, 4th: 1 GP
- GP is awarded to the TEAM (shared equally, not split)

## Games – Internal (Auto-Scored, Phase 1)

### 1. Math Speed ⚡
- 60 seconds timer (Firebase server-timestamp synced)
- Chained operations: **5-7 ops**, numbers 1-9, +/-/×, Punkt vor Strich, no parentheses
- **Each player gets different random questions** (no copying)
- Result must be a positive integer (regenerate if not)
- Input: type number → Enter → next question instantly
- Correct → counter +1, next immediately
- Wrong → red flash, moves on (no time penalty)
- Live Dashboard: Admin-view shows real-time who solved how many
- End: Reveal animation from last place → first place (dramatic)
- IP scoring by final ranking
- Timer configurable (30/60/90s), default 60s
- Algorithmically generated at runtime, no JSON data needed

### 2. Scrambled Words 🔤
- 10 rounds per game (configurable)
- All see same scrambled word simultaneously
- **First-correct-submit wins the round** (Firebase timestamp decides order)
- Scoring per round: 1st=10pts, 2nd=7pts, 3rd=5pts, 4th+=3pts, unsolved in 30s=0pts
- After each round: brief reveal (who was first)
- **English words only** (international team)
- Words: football/WC themed + Data Science/ML/Tech themed
- ~30-40 words in JSON pool, Claude Code generates
- 20 seconds per word, case-insensitive exact match
- LLM cheating mitigated by speed pressure

### 3. Emoji Riddles 🧩
- 10-15 rounds (configurable)
- Emojis appear (e.g. ⚽🧤🥅 = "Goalkeeper")
- **First-correct-submit** (same mechanic as Scrambled Words)
- **Freitext input**, accepts multiple valid answers (case-insensitive)
- 25 seconds per riddle
- Scoring: same as Scrambled Words
- **Broad topics**: football, Data Science, tech, movies, wordplay/puns, general knowledge
- Include clever wordplay riddles (e.g. 🔥🐜 = "Fireant" or 🧊🏔️💔 = "Icebreaker")
- ~35-40 riddles in JSON pool, Claude Code generates
- Each riddle has list of accepted answer variants

### 4. WC Stats Guessing 📊
- 8-10 questions (configurable)
- Question appears (e.g. "How many goals in WC 2022 group stage?")
- 20 seconds to answer (number input)
- All answers revealed after timer
- Scoring: Ranking by deviation from correct answer → 1st=10pts, 2nd=8pts etc.
- **Mix of questions**: historical WC stats + WC 2026 current tournament stats + DS/tech trivia numbers
- **Avoid easily googleable** – prefer cross-referenced or computed stats
- ~15-20 questions in JSON, Claude Code generates historical ones
- **User adds WC 2026 live questions manually** before session (current tournament data)
- Each question has: question text, correct answer (number), unit, optional hint

### 5. Language Guessing 🌍
- 10 rounds (configurable)
- A sentence or phrase is displayed in a language
- Players must guess which language it is
- **Multiple choice: 4 options** (1 correct + 3 plausible distractors)
- **First-correct-submit** (same mechanic as Scrambled Words)
- 15 seconds per round (shorter since it's multiple choice)
- Scoring: same as Scrambled Words (1st=10pts, 2nd=7pts, etc.)
- Wrong answer = 0 pts for that round (no second chance)
- Languages: WC 2026 participating countries' languages (diverse, interesting)
- Use real phrases (football commentary, famous quotes, common expressions)
- ~25-30 phrases in JSON, Claude Code generates
- Mix of easy (French, Spanish) and hard (Korean, Arabic, Swahili)
- Display in original script where possible (한국어, العربية) + Latin script fallback
- Distractors should be plausible/similar (e.g. for Portuguese: Spanish, Italian, Romanian)

## Games – External (Admin-Scored)
- **Kahoot**: User creates separately (HR Factbook + WM questions). Admin transfers ranking.
- **Imposter/Spyfall**: All play together. IP for imposter if survives, IP for correct voters. Optionally GP based on team's collective performance.
- **Wavelength**: Admin gives the clue, ALL teams guess, closest team gets GP.

## Design Decisions & Concerns

### GP/IP Balancing
- Hybrid scoring means strong players boost their team's GP too → INTENDED
- Randomized team assignment is the equalizer
- Admin can manually rebalance teams between rounds if needed
- No pure-teamwork browser games needed – Imposter/Wavelength are the teamwork games (external)

### Cheating Concerns
- Imposter/Wavelength: cheating/collusion risk → keep Imposter as all-play individual
- Scrambled Words: LLM cheating → speed pressure mitigates (short timers)
- Wavelength: admin gives the clue (simplest, no cheating possible)
- Language Guessing: multiple choice so no googling advantage (speed matters)

### Multiple Rounds
- Session needs to fill ~2 hours
- Some games can be played multiple rounds
- Each round scored separately (IP + GP accumulate)
- Admin can: play same game again, alternate games
- "Play Again" button increments round counter

### Reveal Animation
- Don't show scores immediately
- **Math Speed special reveal**: Replay/simulation of the 60s showing solves ticking up over time (race replay at 2x speed). Skip button available.
- **General reveal**: From last place → first place, dramatic pause at top 3
- **Expandable**: Click to see full list (all players, not just top)
- Math Speed replay is nice-to-have, fallback to standard reveal

### Waiting Screen
- Between games: show current leaderboard (animated updates)
- "Next game: ..." teaser
- Admin clicks "Start" when ready

### Sound Effects
- Countdown beep, correct/wrong sound, reveal drumroll
- Web Audio API generated (no external files needed)
- Simple, iterate later

### Admin Features
- Simple password protection (hardcoded "tgaia2026")
- Score entry for external games
- Game flow control (start/stop/next/play again)
- Live player list
- Team management (randomize, reassign late-joiners)
- Multiple rounds support

## Future Ideas (Backlog – NOT for initial build)

### Future Games
- **Wordle** (WC/DS-themed words, scored by tries)
- **Flag Guessing** (show flag, guess country, timed)
- **Buzzer mechanic** (generic first-to-buzz for any trivia round)
- **Mario Party style mini-games**
- **Joko & Klaas / Schlag den Raab** style challenges

### Future Gimmicks
- Confetti/particle effects on winner reveal
- Player avatars (random assignment from football/tech icons)
- Achievement badges ("First Blood", "Perfect Round", "Comeback King")
- Half-time show screen with stats
- "Instant replay" – show highlights of close finishes
- Export results as image/PDF for sharing afterwards

### Future Architecture
- Configurable game CMS (add/remove/reorder games)
- Game templates for easy new game creation
- Persistent history across sessions

## What User Needs To Do
- Create Firebase project (free tier) and get config keys
- Create Kahoot quiz (HR Factbook + WM questions)
- Test external games (Imposter, Wavelength websites)
- Create GitHub repo + enable Pages
- Add WC 2026 live questions to JSON before session
- Provide Firebase config to Claude Code

## Key Constraints
- Must be functional, not perfect
- Fine-tuning (rounds, timing, scoring weights) happens AFTER basic structure works
- Claude Code implements aggressively, user oversees
