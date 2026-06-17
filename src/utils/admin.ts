import {
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'
import { db } from '../firebase-config'
import type {
  GameConfig,
  GameId,
  LastReveal,
  PlanStep,
  Player,
  RevealEntry,
  RevealTeamEntry,
  SessionStatus,
  Team,
} from '../types'
import { generateTeamNames, teamColor } from './teamNames'

/** Create (or reset) a session in lobby state, preserving any existing players. */
export async function createSession(sessionId: string) {
  await update(ref(db, `sessions/${sessionId}`), {
    status: 'lobby' as SessionStatus,
    currentGame: null,
    currentRound: 0,
    nextGame: null,
    gameConfig: { timer: 60, rounds: 10 },
    createdAt: serverTimestamp(),
  })
}

/** Shuffle players and assign them round-robin into N freshly-named teams. */
export async function randomizeTeams(
  sessionId: string,
  players: Player[],
  numTeams: number,
) {
  const names = generateTeamNames(numTeams)
  const updates: Record<string, unknown> = {}

  // Create the teams.
  for (let i = 0; i < numTeams; i++) {
    updates[`teams/team${i}`] = {
      name: names[i],
      gp: 0,
      renamed: false,
      color: teamColor(i),
    }
  }

  // Shuffle players, then round-robin assign.
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  shuffled.forEach((p, idx) => {
    updates[`players/${p.id}/team`] = `team${idx % numTeams}`
  })

  await update(ref(db, `sessions/${sessionId}`), updates)
}

/** Set the session status (lobby / between / ended …). */
export async function setStatus(sessionId: string, status: SessionStatus) {
  await update(ref(db, `sessions/${sessionId}`), { status })
}

/** Set the "next game" teaser shown on the waiting screen. */
export async function setNextGame(sessionId: string, game: GameId | null) {
  await update(ref(db, `sessions/${sessionId}`), { nextGame: game })
}

export async function removePlayer(sessionId: string, playerId: string) {
  await remove(ref(db, `sessions/${sessionId}/players/${playerId}`))
}

/** Emergency: clear all played games and return to lobby (keeps players/teams). */
export async function resetGames(sessionId: string) {
  await set(ref(db, `sessions/${sessionId}/games`), null)
  await set(ref(db, `sessions/${sessionId}/lastReveal`), null)
  await update(ref(db, `sessions/${sessionId}`), {
    status: 'lobby' as SessionStatus,
    currentGame: null,
    currentRound: 0,
  })
}

// ---------- Game control (Phase 3) ----------

/** Start a game: write config, create the instance, flip session to playing. */
export async function startGame(
  sessionId: string,
  gameId: GameId,
  round: number,
  config: GameConfig,
) {
  await update(ref(db, `sessions/${sessionId}`), {
    currentGame: gameId,
    currentRound: round,
    status: 'playing' as SessionStatus,
    nextGame: null,
    gameConfig: config,
  })
  // The instance is created "armed" but not begun — players see the
  // instructions until the admin presses Begin (which sets startedAt).
  await update(ref(db, `sessions/${sessionId}/games/${gameId}_${round}`), {
    status: 'active',
  })
}

/** Begin a game that was started/armed: sets startedAt so the clock runs. */
export async function beginGame(
  sessionId: string,
  gameId: GameId,
  round: number,
) {
  await update(ref(db, `sessions/${sessionId}/games/${gameId}_${round}`), {
    startedAt: serverTimestamp(),
  })
}

/** Reset all IP (players) and GP (teams) to zero — for when scoring goes wrong. */
export async function resetScores(
  sessionId: string,
  players: Player[],
  teams: Team[],
) {
  const updates: Record<string, unknown> = {}
  for (const p of players) updates[`players/${p.id}/ip`] = 0
  for (const t of teams) updates[`teams/${t.id}/gp`] = 0
  if (Object.keys(updates).length)
    await update(ref(db, `sessions/${sessionId}`), updates)
}

/** "Play Again": same game, next round, fresh instance. Returns the new round. */
export async function playAgain(
  sessionId: string,
  gameId: GameId,
  currentRound: number,
  config: GameConfig,
): Promise<number> {
  const next = currentRound + 1
  await startGame(sessionId, gameId, next, config)
  return next
}

/**
 * End the active game: apply IP/GP deltas to totals, persist a per-game reveal
 * payload (so the reveal animation can show this game's ranking), then go to
 * the "revealing" state.
 */
export async function applyScoresAndReveal(
  sessionId: string,
  gameId: GameId,
  round: number,
  raw: Record<string, number>,
  ipUpdates: Record<string, number>,
  gpUpdates: Record<string, number>,
  players: Player[],
  teams: Team[],
) {
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]))
  const updates: Record<string, unknown> = {}

  for (const p of players) {
    const gained = ipUpdates[p.id] ?? 0
    if (gained) updates[`players/${p.id}/ip`] = p.ip + gained
  }
  for (const t of teams) {
    const gained = gpUpdates[t.id] ?? 0
    if (gained) updates[`teams/${t.id}/gp`] = t.gp + gained
  }

  // Include the whole roster so the reveal is never empty — players with no
  // correct answers simply show 0 pts / +0 IP.
  const entries: RevealEntry[] = players
    .map((p) => {
      const team = p.team ? teamById[p.team] : undefined
      return {
        playerId: p.id,
        name: p.name,
        teamName: team?.name,
        teamColor: team?.color,
        raw: raw[p.id] ?? 0,
        ipGained: ipUpdates[p.id] ?? 0,
      }
    })
    .sort((a, b) => b.raw - a.raw)

  const teamEntries: RevealTeamEntry[] = teams
    .filter((t) => (gpUpdates[t.id] ?? 0) > 0)
    .map((t) => ({
      teamId: t.id,
      name: t.name,
      color: t.color,
      gpGained: gpUpdates[t.id] ?? 0,
    }))
    .sort((a, b) => b.gpGained - a.gpGained)

  const reveal: LastReveal = { gameId, round, entries, teams: teamEntries }
  updates['lastReveal'] = reveal
  updates['status'] = 'revealing'

  await update(ref(db, `sessions/${sessionId}`), updates)
}

/** Manual external-game scoring: add raw IP to a player / GP to a team. */
export async function applyExternalScore(
  sessionId: string,
  player: Player | null,
  ipDelta: number,
  team: Team | null,
  gpDelta: number,
) {
  const updates: Record<string, unknown> = {}
  if (player && ipDelta) updates[`players/${player.id}/ip`] = player.ip + ipDelta
  if (team && gpDelta) updates[`teams/${team.id}/gp`] = team.gp + gpDelta
  if (Object.keys(updates).length)
    await update(ref(db, `sessions/${sessionId}`), updates)
}

// ---------- Game plan / agenda ----------

function teaserFor(step: PlanStep | undefined): GameId | null {
  return step?.kind === 'internal' ? (step.gameId ?? null) : null
}

/** Persist the ordered agenda of steps. */
export async function savePlan(sessionId: string, steps: PlanStep[]) {
  await update(ref(db, `sessions/${sessionId}/plan`), { steps })
}

/** Run plan step `index`: start the internal game, or show the external screen. */
export async function startPlanStep(
  sessionId: string,
  steps: PlanStep[],
  index: number,
  currentRound: number,
) {
  const step = steps[index]
  if (!step) return
  const nextGame = teaserFor(steps[index + 1])

  if (step.kind === 'internal' && step.gameId) {
    await startGame(sessionId, step.gameId, currentRound + 1, {
      timer: step.timer ?? 60,
      rounds: step.rounds ?? 10,
    })
    await update(ref(db, `sessions/${sessionId}`), {
      nextGame,
      'plan/index': index,
    })
  } else {
    await update(ref(db, `sessions/${sessionId}`), {
      status: 'external' as SessionStatus,
      currentGame: null,
      externalName: step.name ?? 'External game',
      nextGame,
      'plan/index': index,
    })
  }
}

/** Advance the agenda pointer and show the leaderboard between steps. */
export async function advancePlan(
  sessionId: string,
  currentIndex: number,
  steps: PlanStep[],
) {
  const next = Math.min(currentIndex + 1, steps.length)
  await update(ref(db, `sessions/${sessionId}`), {
    'plan/index': next,
    status: 'between' as SessionStatus,
    nextGame: teaserFor(steps[next]),
  })
}

/** Wipe everything (players, teams, games) and start a clean lobby. */
export async function hardResetSession(sessionId: string) {
  await set(ref(db, `sessions/${sessionId}`), {
    status: 'lobby' as SessionStatus,
    currentGame: null,
    currentRound: 0,
    nextGame: null,
    gameConfig: { timer: 60, rounds: 10 },
    createdAt: serverTimestamp(),
  })
}
