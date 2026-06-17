import type { Player, Team } from '../types'

// Preliminary scoring scales (fine-tuned later, per the design doc).
export const IP_SCALE = [10, 8, 6, 5, 4, 3, 2, 1] // 8th+ -> 1
export const GP_SCALE = [10, 6, 3, 1] // 5th+ team -> 0

/** IP awarded for a given 0-based rank. */
export function ipForRank(rank: number): number {
  return IP_SCALE[rank] ?? 1
}

/** GP awarded for a given 0-based team rank. */
export function gpForRank(rank: number): number {
  return GP_SCALE[rank] ?? 0
}

export interface ScoreUpdates {
  ipUpdates: Record<string, number> // playerId -> IP gained
  gpUpdates: Record<string, number> // teamId -> GP gained
}

/**
 * Given each player's raw game score (higher = better), compute IP per player
 * and GP per team. Ties share the same rank.
 *
 * @param gameScores  playerId -> raw score for this game
 * @param higherIsBetter  set false for deviation-style games (lower = better)
 */
export function calculateGameScores(
  gameScores: Record<string, number>,
  players: Player[],
  teams: Team[],
  higherIsBetter = true,
): ScoreUpdates {
  const sign = higherIsBetter ? -1 : 1

  // --- Individual (IP): rank players by raw score ---
  const ranked = players
    .filter((p) => p.id in gameScores)
    .map((p) => ({ id: p.id, score: gameScores[p.id] }))
    .sort((a, b) => sign * (a.score - b.score))

  const ipUpdates: Record<string, number> = {}
  let lastScore: number | null = null
  let lastRank = 0
  ranked.forEach((entry, index) => {
    const rank = lastScore === entry.score ? lastRank : index
    ipUpdates[entry.id] = ipForRank(rank)
    lastScore = entry.score
    lastRank = rank
  })

  // --- Team (GP): aggregate member scores, then rank teams ---
  const teamTotals = teams.map((team) => {
    const members = players.filter((p) => p.team === team.id && p.id in gameScores)
    const total = members.reduce((sum, p) => sum + gameScores[p.id], 0)
    // Rank teams by AVERAGE per member so smaller teams aren't disadvantaged.
    const value = members.length
      ? total / members.length
      : higherIsBetter
        ? -Infinity
        : Number.POSITIVE_INFINITY
    return { id: team.id, value, hasMembers: members.length > 0 }
  })

  const rankedTeams = teamTotals
    .filter((t) => t.hasMembers)
    .sort((a, b) => sign * (a.value - b.value))

  const gpUpdates: Record<string, number> = {}
  let lastVal: number | null = null
  let lastTeamRank = 0
  rankedTeams.forEach((entry, index) => {
    const rank = lastVal === entry.value ? lastTeamRank : index
    gpUpdates[entry.id] = gpForRank(rank)
    lastVal = entry.value
    lastTeamRank = rank
  })

  return { ipUpdates, gpUpdates }
}
