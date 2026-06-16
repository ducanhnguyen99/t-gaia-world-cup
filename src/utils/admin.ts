import {
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'
import { db } from '../firebase-config'
import type { GameId, Player, SessionStatus } from '../types'
import { generateTeamNames, teamColor } from './teamNames'

/** Create (or reset) a session in lobby state, preserving any existing players. */
export async function createSession(sessionId: string) {
  await update(ref(db, `sessions/${sessionId}`), {
    status: 'lobby' as SessionStatus,
    currentGame: null,
    currentRound: 1,
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
  await update(ref(db, `sessions/${sessionId}`), {
    status: 'lobby' as SessionStatus,
    currentGame: null,
    currentRound: 1,
  })
}

/** Wipe everything (players, teams, games) and start a clean lobby. */
export async function hardResetSession(sessionId: string) {
  await set(ref(db, `sessions/${sessionId}`), {
    status: 'lobby' as SessionStatus,
    currentGame: null,
    currentRound: 1,
    nextGame: null,
    gameConfig: { timer: 60, rounds: 10 },
    createdAt: serverTimestamp(),
  })
}
