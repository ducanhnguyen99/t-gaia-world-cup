# T-Gaia World Cup 2026 ⚽

Real-time multiplayer browser game competition for a team bonding session (~20
colleagues). Vite + React + TypeScript + Tailwind CSS frontend, Firebase
Realtime Database for shared state, deployed to GitHub Pages.

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/vite`, theme in `src/index.css`)
- **Framer Motion** for animations
- **React Router** (`HashRouter` for GitHub Pages compatibility)
- **Firebase Realtime Database** (client-side SDK, no server)

## Routes

| Path             | Page                              |
| ---------------- | --------------------------------- |
| `/#/`            | Landing / join                    |
| `/#/game`        | Player game view                  |
| `/#/admin`       | Admin dashboard (pw: `tgaia2026`) |
| `/#/leaderboard` | Public leaderboard                |

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
```

## Firebase setup

1. Create a Firebase project and a Realtime Database (region `europe-west1`).
2. Paste the web app config into `src/firebase-config.ts`.
3. Deploy the open DB rules: `firebase deploy --only database`
   (rules in `database.rules.json` — intentionally open for this event).

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes `dist/` to GitHub Pages. Enable Pages with **GitHub Actions** as the
source. Vite `base` is set to `/t-gaia-world-cup/` to match the repo name.

## Implementation status

Built in phases (see `CLAUDE_CODE_PLAN.md`). Phase 1 (foundation: theme,
routing, Firebase wiring, hooks, scoring/sounds/team-name utils, game data,
deploy pipeline) is complete. Phases 2–6 add the join flow, admin controls,
the five internal games, leaderboard/reveal animations and polish.
