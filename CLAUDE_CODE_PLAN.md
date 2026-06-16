# Claude Code Implementation Plan – T-Gaia World Cup 2026

## What This Is
A real-time multiplayer browser game competition app for ~20 colleagues. Vite + React + Tailwind CSS frontend hosted on GitHub Pages, Firebase Realtime Database for state management. No backend server needed.

## IMPORTANT: Before You Start
1. The user will provide a Firebase config object (apiKey, authDomain, databaseURL, etc.). Place it in `src/firebase-config.ts`. If not yet provided, use a placeholder and ask for it.
2. Initialize the project with: `npm create vite@latest t-gaia-world-cup -- --template react-ts`
3. Install dependencies: `npm install firebase framer-motion react-router-dom`
4. Install Tailwind: `npm install -D tailwindcss @tailwindcss/vite`
5. Deploy to GitHub Pages: use `vite build` → deploy `dist/` folder via GitHub Actions or `gh-pages` package.

## Implementation Order
Work through these phases sequentially. Each phase should result in a working, testable state. Implement aggressively – this needs to be done in hours, not days. Write a lot of code at once, don't be overly cautious. Use React components, Tailwind for all styling, Framer Motion for animations.

---

## PHASE 1: Foundation (do this first, ~30min)

### 1.1 Create project with Vite + React + TypeScript + Tailwind
```
t-gaia-world-cup/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── package.json
├── public/
│   └── sounds/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css            (Tailwind imports + custom theme)
│   ├── firebase-config.ts
│   ├── hooks/
│   │   ├── useSession.ts    (Firebase session listener)
│   │   ├── usePlayer.ts     (Current player state)
│   │   └── useGameState.ts  (Current game state listener)
│   ├── components/
│   │   ├── Layout.tsx        (Shared layout with theme)
│   │   ├── Leaderboard.tsx
│   │   ├── WaitingScreen.tsx
│   │   ├── RevealAnimation.tsx
│   │   ├── TeamDisplay.tsx
│   │   └── Timer.tsx
│   ├── pages/
│   │   ├── Landing.tsx       (Join page)
│   │   ├── Game.tsx          (Player game view - routes to current game)
│   │   ├── Admin.tsx         (Admin dashboard)
│   │   └── LeaderboardPage.tsx
│   ├── games/
│   │   ├── MathSpeed.tsx
│   │   ├── ScrambledWords.tsx
│   │   ├── EmojiRiddles.tsx
│   │   ├── WcStats.tsx
│   │   └── LanguageGuessing.tsx
│   ├── utils/
│   │   ├── scoring.ts       (IP/GP calculation)
│   │   ├── sounds.ts        (Web Audio API sounds)
│   │   └── teamNames.ts     (Funny name generator)
│   └── data/
│       ├── scrambled-words.json
│       ├── emoji-riddles.json
│       ├── wc-stats-questions.json
│       └── language-guessing.json
└── .github/
    └── workflows/
        └── deploy.yml        (GitHub Pages deploy on push)
```

### 1.2 Theme & Styling (apply immediately, not as afterthought)
Use Tailwind CSS for everything. Define custom theme in tailwind.config.js:
- **Primary**: Telekom Magenta #E20074
- **Background**: Dark gradient (slate-950 to purple-950/indigo-950, techy)
- **Cards/Panels**: Glassmorphism (`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`)
- **Accent**: Cyan-400/teal-400 for secondary highlights
- **Font**: Inter (import from Google Fonts)
- **Effects**: Subtle glow (`shadow-[0_0_15px_rgba(226,0,116,0.3)]`), smooth transitions
- **Title branding**: "T-Gaia World Cup 2026" with football + circuit/data aesthetics
- **Animations**: Use Framer Motion for page transitions, reveals, score updates
- **Make it look impressive** – use Tailwind's gradient utilities, glass effects, animated gradient backgrounds

### 1.3 Firebase Config
```typescript
// src/firebase-config.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  // USER WILL PROVIDE THESE VALUES
  apiKey: "PLACEHOLDER",
  authDomain: "PLACEHOLDER.firebaseapp.com",
  databaseURL: "https://PLACEHOLDER-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "PLACEHOLDER",
  storageBucket: "PLACEHOLDER.appspot.com",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
```

### 1.4 GitHub Actions Deploy
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

---

## PHASE 2: Session & Join Flow (~30min)

### 2.1 Landing Page (src/pages/Landing.tsx)
- Beautiful landing page with "T-Gaia World Cup 2026" title + animated background
- Input field: "Enter your name" (large, centered, glassmorphism card)
- Button: "Join Session" (magenta, glowing)
- On join: write player to Firebase `sessions/{sessionId}/players/{pushId}`
- Store playerId + sessionId in localStorage
- Navigate to /game route (React Router)
- Session ID from URL param (?session=WC2026) or default "WC2026"
- If player already joined (localStorage has playerId), auto-redirect to /game

### 2.2 Game Page (src/pages/Game.tsx)
- Shows different content based on session state (useSession hook):
  - `lobby`: WaitingScreen component – "Waiting for host to start... X players connected" + player list + teams
  - `playing`: Renders current game component (MathSpeed, ScrambledWords, etc.)
  - `between`: Leaderboard + "Next game coming up..." teaser
  - `revealing`: RevealAnimation component
- Listens to `sessions/{sessionId}/status` and `currentGame` via onValue
- Smooth transitions between states using Framer Motion AnimatePresence

### 2.3 Admin Page (src/pages/Admin.tsx)
- Password prompt on load (simple check against "tgaia2026")
- Create session button (generates session in Firebase)
- **Live player list** (real-time, shows connected status with green/grey dot)
- **"Randomize Teams" button**:
  - Number of teams selector (2-6, default 4)
  - Takes all players, shuffles, assigns round-robin to N teams
  - Auto-generates funny team names from `utils/teamNames.ts`:
    - Combine football term + tech/ML term
    - Examples: "Neural Strikers", "Gradient Goalkeepers", "Tensor Tacklers", "Backprop United", "Dropout FC", "Overfitting Offside", "Random Forest Rangers", "Deep Learning Defenders"
  - Writes team assignments to Firebase
- **Team rename**: players can rename their team ONCE (tracked via `teams/{id}/renamed: true` in Firebase)
- **Late-joiner handling**: If teams already assigned, new player goes to team with fewest members

### 2.4 Firebase Structure
```
sessions/
  {sessionId}/
    status: "lobby" | "playing" | "between" | "revealing" | "ended"
    currentGame: null | "mathSpeed" | "scrambledWords" | "emojiRiddles" | "wcStats" | "languageGuessing"
    currentRound: 1
    gameConfig: { timer: 60, rounds: 10 }
    players/
      {playerId}: 
        name: "Alice"
        team: "teamId1"
        ip: 0
        gp: 0
        connected: true
        joinedAt: serverTimestamp
    teams/
      {teamId}:
        name: "Neural Strikers"
        gp: 0
        renamed: false
    games/
      {gameId}_{round}/
        status: "active" | "revealing" | "done"
        startedAt: serverTimestamp
        roundData/
          currentWord: "ALGORITHM"     (for scrambled words – admin/system sets per round)
          currentQuestion: 3            (for WC stats – which question index)
          currentRiddle: 5              (for emoji riddles)
          currentPhrase: 2              (for language guessing)
        scores/
          {playerId}: { value: 7, timestamp: serverTimestamp, details: {} }
        roundScores/                    (for multi-round games like scrambled words)
          {roundNumber}/
            {playerId}: { correct: true, timestamp: serverTimestamp, position: 1 }
```

---

## PHASE 3: Admin Game Control (~20min)

### 3.1 Admin Dashboard Features (src/pages/Admin.tsx)
- **Game selector**: Dropdown/cards with all 5 internal games + "External Game"
- **Start Game** button: Sets session status to "playing", sets currentGame, writes gameConfig
- **End Game** button: Triggers scoring calculation + reveal
- **External Score Entry**:
  - "External Game" mode: Name the game (e.g. "Kahoot Round 1")
  - Select player from dropdown → enter IP points
  - Select team from dropdown → enter GP points
  - "Apply Scores" button → adds to Firebase totals
- **Next Game / Show Leaderboard** button: status → "between"
- **Play Again** button: same game, increments currentRound, fresh game state
- **Timer override**: 30/60/90s for Math Speed (in gameConfig)
- **Round counter display**: Shows "Round X" for repeated games
- **Emergency controls**: "Reset Game" (if something breaks), "Remove Player"

### 3.2 Game Flow (admin controls)
1. Admin selects game + config (timer, rounds) → clicks "Start"
2. Firebase: status="playing", currentGame set → all players see game UI instantly
3. Game runs (auto-timed or until all submit / admin ends it)
4. Game ends → admin.js auto-calculates IP + GP (see scoring utils)
5. Session status → "revealing" → RevealAnimation plays for all players
6. Admin clicks "Show Leaderboard" → status → "between" → WaitingScreen with leaderboard
7. Admin selects next game or "Play Again" → repeat
8. At end of session: Admin clicks "End Session" → final leaderboard + winners announced

### 3.3 Multiple Rounds Support
- Each game instance stored as `games/{gameId}_{roundNumber}/`
- "Play Again" increments round counter, creates fresh game state
- Scoring accumulates: IP/GP from each round adds to player/team totals
- Admin can play Math Speed 3 times, Scrambled Words 2 times, etc.
- Leaderboard always shows cumulative totals

---

## PHASE 4: Internal Games (~90min total)

### 4.1 Math Speed ⚡
**File: src/games/MathSpeed.tsx**

- On game start: start 60s countdown (synced via Firebase serverTimestamp for start time)
- Generate question: chain of 5-7 operations
  - Numbers: 1-9
  - Operators: +, -, × (no division)
  - Respect order of operations (× before +/-)
  - Ensure result is positive integer (regenerate if not)
  - Display as: `3 + 7 × 2 - 4 + 1 × 3 = ?`
- **Each player gets different random questions** (seeded by playerId + round, or just random)
- Input: number field, auto-focus, Enter submits
- Correct: green flash, counter increments, new question instantly
- Wrong: red flash, new question (no penalty, just moves on)
- Write score to Firebase in real-time: `games/mathSpeed_{round}/scores/{playerId}/value`
- On timer end: final score submitted
- **Live Dashboard** (admin view): Listen to all scores, show sorted table updating in real-time
- **Scoring**:
  - IP: rank all players by # solved → 1st=10, 2nd=8, 3rd=6, 4th=5, 5th=4, 6th=3, 7th=2, 8th+=1
  - GP: sum all team members' solved → rank teams → 1st team=10GP, 2nd=6GP, 3rd=3GP, 4th=1GP

### 4.2 Scrambled Words 🔤
**File: src/games/ScrambledWords.tsx**
**Data: src/data/scrambled-words.json**

- Admin starts game → Firebase sets currentRound to 1, picks word from pool
- All players see same scrambled word simultaneously
- Scramble logic: shuffle letters, ensure result ≠ original
- Input: text field, Submit button (or Enter)
- On submit: check answer (case-insensitive, trimmed)
  - If correct: write to Firebase with serverTimestamp
  - If wrong: shake animation, can try again
- First N correct submits get points: 1st=10, 2nd=7, 3rd=5, 4th+=3, no answer=0
- After 20 seconds OR all answered: reveal correct answer + who was first
- 3 second pause → next word (auto-advance)
- After 10 rounds: sum up individual totals
- **Scoring**:
  - IP: rank by total points across all rounds → standard IP scale
  - GP: sum team points → rank teams → GP scale

**Generate data/scrambled-words.json:**
```json
[
  {"word": "ALGORITHM", "category": "tech"},
  {"word": "PENALTY", "category": "football"},
  {"word": "STRIKER", "category": "football"},
  {"word": "NETWORK", "category": "tech"},
  {"word": "GRADIENT", "category": "tech"},
  {"word": "OFFSIDE", "category": "football"},
  {"word": "DATASET", "category": "tech"},
  {"word": "REFEREE", "category": "football"},
  {"word": "CLUSTER", "category": "tech"},
  {"word": "STADIUM", "category": "football"},
  {"word": "PYTHON", "category": "tech"},
  {"word": "GOALKEEPER", "category": "football"},
  {"word": "TENSOR", "category": "tech"},
  {"word": "MIDFIELD", "category": "football"},
  {"word": "NEURAL", "category": "tech"},
  {"word": "DRIBBLE", "category": "football"},
  {"word": "BOOLEAN", "category": "tech"},
  {"word": "WHISTLE", "category": "football"},
  {"word": "BANDWIDTH", "category": "tech"},
  {"word": "TRANSFER", "category": "football"},
  {"word": "PIPELINE", "category": "tech"},
  {"word": "TACKLE", "category": "football"},
  {"word": "FIREWALL", "category": "tech"},
  {"word": "CAPTAIN", "category": "football"},
  {"word": "MATRIX", "category": "tech"},
  {"word": "KICKOFF", "category": "football"},
  {"word": "DEPLOY", "category": "tech"},
  {"word": "CORNER", "category": "football"},
  {"word": "ITERATION", "category": "tech"},
  {"word": "CHAMPION", "category": "football"},
  {"word": "LATENCY", "category": "tech"},
  {"word": "FORMATION", "category": "football"},
  {"word": "BACKEND", "category": "tech"},
  {"word": "TROPHY", "category": "football"},
  {"word": "DEBUGGER", "category": "tech"}
]
```

### 4.3 Emoji Riddles 🧩
**File: src/games/EmojiRiddles.tsx**
**Data: src/data/emoji-riddles.json**

- Same mechanic as Scrambled Words (first-correct-submit, rounds)
- Display large emojis, player types answer
- Accept multiple valid answers (check against array, case-insensitive, trimmed)
- 25 seconds per riddle
- 10-15 rounds (configurable)

**Generate data/emoji-riddles.json:**
```json
[
  {"emojis": "⚽🧤🥅", "answers": ["goalkeeper", "goalie", "keeper"], "category": "football"},
  {"emojis": "🟨📋", "answers": ["yellow card", "yellowcard"], "category": "football"},
  {"emojis": "🏆🌍⚽", "answers": ["world cup", "worldcup", "fifa world cup"], "category": "football"},
  {"emojis": "⚽👟💨", "answers": ["free kick", "freekick", "shot"], "category": "football"},
  {"emojis": "🧠🔗🔗🔗", "answers": ["neural network", "neuralnetwork", "neural net"], "category": "tech"},
  {"emojis": "🐍📊", "answers": ["python", "python programming"], "category": "tech"},
  {"emojis": "🌳🤔❓", "answers": ["decision tree", "decisiontree"], "category": "tech"},
  {"emojis": "☁️💻", "answers": ["cloud computing", "cloud", "the cloud"], "category": "tech"},
  {"emojis": "🤖🎓", "answers": ["machine learning", "ml"], "category": "tech"},
  {"emojis": "🔥🧱", "answers": ["firewall"], "category": "tech"},
  {"emojis": "🐛🔍", "answers": ["debugging", "debug", "bug hunting"], "category": "tech"},
  {"emojis": "📱💗", "answers": ["t-mobile", "telekom", "tmobile", "deutsche telekom"], "category": "telekom"},
  {"emojis": "🧊🏔️💔", "answers": ["icebreaker", "ice breaker"], "category": "wordplay"},
  {"emojis": "🔥🐜", "answers": ["fire ant", "fireant"], "category": "wordplay"},
  {"emojis": "⭐🐟", "answers": ["starfish", "star fish"], "category": "wordplay"},
  {"emojis": "👁️☁️", "answers": ["icloud", "i cloud"], "category": "wordplay"},
  {"emojis": "🐝🍺", "answers": ["beer", "bee-r"], "category": "wordplay"},
  {"emojis": "🦁👑⚽🇦🇷", "answers": ["messi", "lionel messi"], "category": "football"},
  {"emojis": "🐢🐚💨", "answers": ["shell", "tortoise shell"], "category": "wordplay"},
  {"emojis": "📊📈📉🔮", "answers": ["forecasting", "prediction", "forecast"], "category": "tech"},
  {"emojis": "🏠📄", "answers": ["homepage", "home page"], "category": "tech"},
  {"emojis": "🍪💻", "answers": ["cookie", "cookies"], "category": "tech"},
  {"emojis": "⚽🎯1️⃣1️⃣", "answers": ["penalty", "penalty kick", "eleven meters"], "category": "football"},
  {"emojis": "🔑📝", "answers": ["password", "keyword", "key word"], "category": "tech"},
  {"emojis": "🕸️🌐", "answers": ["world wide web", "www", "web", "internet"], "category": "tech"},
  {"emojis": "🦊🔥", "answers": ["firefox", "fire fox"], "category": "tech"},
  {"emojis": "🧬➗📐", "answers": ["algorithm", "genetic algorithm"], "category": "tech"},
  {"emojis": "⚽🇧🇷💃5️⃣🏆", "answers": ["brazil", "brasil"], "category": "football"},
  {"emojis": "🎮🏟️⚽🎉", "answers": ["fifa", "football game", "ea sports"], "category": "football"},
  {"emojis": "🏗️🧪", "answers": ["testing", "test", "unit test", "build test"], "category": "tech"},
  {"emojis": "🐳📦", "answers": ["docker", "container"], "category": "tech"},
  {"emojis": "🔀🌿", "answers": ["git branch", "branch", "branching"], "category": "tech"},
  {"emojis": "☕📜", "answers": ["javascript", "java script", "java"], "category": "tech"},
  {"emojis": "⚽🏃‍♂️🏃‍♂️🏃‍♂️🚫⛳", "answers": ["offside", "off side"], "category": "football"},
  {"emojis": "🧲🔗", "answers": ["link", "hyperlink", "magnet link"], "category": "tech"}
]
```

### 4.4 WC Stats Guessing 📊
**File: src/games/WcStats.tsx**
**Data: src/data/wc-stats-questions.json**

- Question displayed with timer (20 seconds)
- Number input field
- All submissions collected, revealed after timer ends
- Show all answers + correct answer + who was closest
- Scoring by deviation ranking

**Generate data/wc-stats-questions.json:**
```json
[
  {"question": "How many total goals were scored in the 2022 World Cup?", "answer": 172, "unit": "goals"},
  {"question": "How many red cards were shown in the 2022 World Cup?", "answer": 4, "unit": "cards"},
  {"question": "What was the average age of players at the 2022 World Cup?", "answer": 27, "unit": "years"},
  {"question": "How many countries have ever won a FIFA World Cup?", "answer": 8, "unit": "countries"},
  {"question": "How many matches were played in the 2022 World Cup?", "answer": 64, "unit": "matches"},
  {"question": "What is the record attendance at a World Cup final (1950, Brazil)?", "answer": 173850, "unit": "people"},
  {"question": "How many own goals were scored in the 2022 World Cup?", "answer": 1, "unit": "goals"},
  {"question": "How many penalty shootouts took place in the 2022 World Cup?", "answer": 4, "unit": "shootouts"},
  {"question": "How many goals did the top scorer at WC 2022 (Mbappe) score?", "answer": 8, "unit": "goals"},
  {"question": "How many World Cups has Germany won?", "answer": 4, "unit": "titles"},
  {"question": "What year was the first FIFA World Cup held?", "answer": 1930, "unit": "year"},
  {"question": "How many teams participate in the 2026 World Cup?", "answer": 48, "unit": "teams"},
  {"question": "How many venues host the 2026 World Cup?", "answer": 16, "unit": "stadiums"},
  {"question": "How many parameters does GPT-3 have (in billions)?", "answer": 175, "unit": "billion"},
  {"question": "How many programming languages are tracked on GitHub?", "answer": 500, "unit": "languages"},
  {"question": "How many Deutsche Telekom employees worldwide (in thousands)?", "answer": 200, "unit": "thousand"},
  {"question": "How many World Cup goals has Miroslav Klose scored (all-time record)?", "answer": 16, "unit": "goals"},
  {"question": "How many minutes of added time were played in WC 2022 group stage total (estimated)?", "answer": 300, "unit": "minutes"}
]
```

### 4.5 Language Guessing 🌍
**File: src/games/LanguageGuessing.tsx**
**Data: src/data/language-guessing.json**

- Display phrase in original script
- Show 4 multiple choice buttons
- First correct click wins (Firebase timestamp)
- Wrong click = 0 for that round, button goes grey, no second chance
- 15 seconds per round

**Generate data/language-guessing.json:**
```json
[
  {"phrase": "El fútbol es el deporte más bonito del mundo", "answer": "Spanish", "options": ["Spanish", "Portuguese", "Italian", "French"]},
  {"phrase": "축구는 세계에서 가장 인기 있는 스포츠입니다", "answer": "Korean", "options": ["Korean", "Japanese", "Chinese", "Thai"]},
  {"phrase": "Le football est un sport universel", "answer": "French", "options": ["French", "Italian", "Portuguese", "Romanian"]},
  {"phrase": "كرة القدم هي الرياضة الأكثر شعبية في العالم", "answer": "Arabic", "options": ["Arabic", "Persian", "Urdu", "Turkish"]},
  {"phrase": "Fußball ist mehr als nur ein Spiel", "answer": "German", "options": ["German", "Dutch", "Swedish", "Danish"]},
  {"phrase": "O futebol é uma paixão mundial", "answer": "Portuguese", "options": ["Portuguese", "Spanish", "Italian", "Romanian"]},
  {"phrase": "サッカーワールドカップは最大のスポーツイベントです", "answer": "Japanese", "options": ["Japanese", "Chinese", "Korean", "Thai"]},
  {"phrase": "Piłka nożna to najpopularniejszy sport na świecie", "answer": "Polish", "options": ["Polish", "Czech", "Slovak", "Croatian"]},
  {"phrase": "Voetbal is de mooiste sport ter wereld", "answer": "Dutch", "options": ["Dutch", "German", "Afrikaans", "Danish"]},
  {"phrase": "Calcio è lo sport più amato in Italia", "answer": "Italian", "options": ["Italian", "Spanish", "Portuguese", "Romanian"]},
  {"phrase": "Футбол — это больше, чем просто игра", "answer": "Russian", "options": ["Russian", "Ukrainian", "Bulgarian", "Serbian"]},
  {"phrase": "Fotboll är världens mest populära sport", "answer": "Swedish", "options": ["Swedish", "Norwegian", "Danish", "Finnish"]},
  {"phrase": "Mpira wa miguu ni mchezo maarufu duniani", "answer": "Swahili", "options": ["Swahili", "Yoruba", "Zulu", "Somali"]},
  {"phrase": "Futbol dünyanın en popüler sporudur", "answer": "Turkish", "options": ["Turkish", "Azerbaijani", "Uzbek", "Hungarian"]},
  {"phrase": "Ποδόσφαιρο είναι το δημοφιλέστερο άθλημα", "answer": "Greek", "options": ["Greek", "Bulgarian", "Georgian", "Armenian"]},
  {"phrase": "Bóng đá là môn thể thao vua trên thế giới", "answer": "Vietnamese", "options": ["Vietnamese", "Thai", "Indonesian", "Filipino"]},
  {"phrase": "Sepak bola adalah olahraga paling populer di dunia", "answer": "Indonesian", "options": ["Indonesian", "Malay", "Filipino", "Vietnamese"]},
  {"phrase": "Fotbal este cel mai frumos sport din lume", "answer": "Romanian", "options": ["Romanian", "Italian", "Portuguese", "Spanish"]},
  {"phrase": "Fodbold er verdens mest populære sport", "answer": "Danish", "options": ["Danish", "Norwegian", "Swedish", "Dutch"]},
  {"phrase": "فوتبال محبوب‌ترین ورزش جهان است", "answer": "Persian", "options": ["Persian", "Arabic", "Urdu", "Pashto"]},
  {"phrase": "Jalkapallo on maailman suosituin urheilulaji", "answer": "Finnish", "options": ["Finnish", "Estonian", "Hungarian", "Swedish"]},
  {"phrase": "Futbal je najkrajšia hra na svete", "answer": "Slovak", "options": ["Slovak", "Czech", "Polish", "Slovenian"]},
  {"phrase": "Nogomet je najljepša igra na svijetu", "answer": "Croatian", "options": ["Croatian", "Serbian", "Bosnian", "Slovenian"]},
  {"phrase": "足球是世界上最受欢迎的运动", "answer": "Chinese", "options": ["Chinese", "Japanese", "Korean", "Vietnamese"]},
  {"phrase": "Labdarúgás a világ legnépszerűbb sportja", "answer": "Hungarian", "options": ["Hungarian", "Finnish", "Estonian", "Turkish"]}
]
```

---

## PHASE 5: Leaderboard & Reveal (~30min)

### 5.1 Leaderboard Component (src/components/Leaderboard.tsx)
- Two tabs: **Individual (IP)** and **Teams (GP)** (use Framer Motion for tab switch)
- Individual: sorted list of all players with IP score, team color badge
- Teams: sorted list of teams with GP, expandable to show members
- **Animated**: use Framer Motion `layout` prop → items animate position when scores change
- Highlight top 3 with gold/silver/bronze gradient styling + glow
- Used in: LeaderboardPage (standalone), WaitingScreen (embedded), RevealAnimation (after reveal)

### 5.2 Reveal Animation (src/components/RevealAnimation.tsx)
- After game ends, session status = "revealing"
- **Standard reveal** (Scrambled, Emoji, Language, WC Stats):
  - Framer Motion staggered animation: results appear one by one from LAST → FIRST
  - Each entry: `initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}` with delay
  - Top 3: extra dramatic pause (1.5s) + pulsing glow effect + scale up
  - "Show all" expand button for full list
- **Math Speed special reveal** (implement if time allows):
  - Animated replay: simulated timer 0→60 at 2x speed
  - Counters tick up for each player as they would have solved
  - Skip button
  - Fallback: standard reveal
- After reveal: smooth transition to updated leaderboard (AnimatePresence)

### 5.3 Waiting Screen (src/components/WaitingScreen.tsx)
- Current leaderboard (animated, auto-updates from Firebase)
- "Next game: [Game Name]" teaser with game icon (if admin has selected next)
- Animated dots or subtle pulse: "Waiting for host..."
- Team standings + individual top 5
- Subtle ambient animation in background

---

## PHASE 6: Polish & Sounds (~20min)

### 6.1 Sound Effects (src/utils/sounds.ts)
Use Web Audio API to generate simple sounds programmatically (no external files needed):
- **Countdown beep**: short sine wave beep at 3, 2, 1 (increasing pitch)
- **Correct answer**: ascending two-tone (ding) – 440Hz → 880Hz
- **Wrong answer**: low buzz – 150Hz square wave, 200ms
- **Reveal drumroll**: rapid alternating tones
- **Winner fanfare**: chord arpeggio (C-E-G-C)
- **Round start**: short ascending sweep
- Export functions: `playCorrect()`, `playWrong()`, `playCountdown()`, `playReveal()`, `playFanfare()`

### 6.2 Visual Polish
- Confetti effect on winner reveal (canvas particles, magenta/cyan/gold)
- Framer Motion page transitions (fade + slide)
- Loading skeleton during Firebase operations
- Laptop screen sizes 1280px - 1920px
- Hover effects on buttons (scale + glow)
- Team colors: auto-assigned from palette [magenta, cyan, lime, orange, purple, yellow]
- Animated gradient background (slow-moving, CSS keyframes)

---

## Technical Notes

### Firebase Realtime DB Rules (for the event)
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
Intentionally open – only 20 known colleagues will access it. No security needed.

### Tech Stack
- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** for styling (no component library needed)
- **Framer Motion** for animations
- **React Router** for page routing (/game, /admin, /leaderboard)
- **Firebase JS SDK** (modular, tree-shakeable)
- Deploy: `npm run build` → GitHub Pages via Actions

### Key Implementation Patterns
- **Custom hooks** for Firebase subscriptions (`useSession`, `useGameState`, `usePlayer`)
- All game state changes go through Firebase (single source of truth)
- Players listen via `onValue()` → React state updates → UI re-renders
- Admin writes via `set()` / `update()`
- Use `serverTimestamp()` for ALL timing (prevent clock skew between players)
- `localStorage` for player identity persistence (playerId, sessionId, name)
- Each game component is self-contained: receives sessionId + playerId as props
- Use React Router with HashRouter (for GitHub Pages compatibility: `/#/game`, `/#/admin`)

### Scoring Utility (src/utils/scoring.ts)
After each game ends, the admin page calls scoring function:
```typescript
function calculateGameScores(gameScores: Record<string, number>, players: Player[], teams: Team[]) {
  // 1. Rank all players by game score (descending)
  // 2. Assign IP per rank: [10, 8, 6, 5, 4, 3, 2, 1, 1, 1, ...]
  // 3. Sum team members' game scores → rank teams
  // 4. Assign GP per team rank: [10, 6, 3, 1]
  // 5. Return: { ipUpdates: {playerId: ipGained}, gpUpdates: {teamId: gpGained} }
}
```
Then write updates to Firebase (adds to existing IP/GP totals).

### Admin Password
Hardcoded: `"tgaia2026"` – simple check on Admin page mount. No real security needed.

### Routing (HashRouter for GitHub Pages)
```
/#/          → Landing (join page)
/#/game      → Player game view
/#/admin     → Admin dashboard
/#/leaderboard → Public leaderboard (can be shared on screen)
```

---

## Content Notes
- All UI text in English
- Game content (words, riddles, questions) in English
- Language guessing shows foreign scripts (that's the game mechanic)
- WC Stats: user may add WC 2026 live questions to the JSON before the session
- JSON data files are easy to edit – just modify and rebuild/redeploy

## What NOT to Build
- No user authentication / login system
- No mobile-responsive design (laptop-first, basic mobile is OK but not priority)
- No offline mode
- No chat system
- No persistent cross-session history
- No game configuration UI (admin edits JSON/code directly for now)
- No accessibility features beyond basics (time constraint)
- No i18n (English only)

## Deployment Checklist (for the user)
1. Create GitHub repo `t-gaia-world-cup` (public)
2. Enable GitHub Pages (Settings → Pages → GitHub Actions as source)
3. Create Firebase project → get config → paste in firebase-config.ts
4. Set Firebase Realtime DB rules to open (read/write: true)
5. Push code → GitHub Action builds and deploys automatically
6. Share URL: `https://{username}.github.io/t-gaia-world-cup/`

