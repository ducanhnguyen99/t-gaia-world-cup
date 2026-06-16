import type { GameConfig, Player } from '../types'

export interface GameComponentProps {
  sessionId: string
  playerId: string
  /** Session round (the "play again" counter), used to key the game instance. */
  round: number
  config: GameConfig
  /** True for the admin's host view (drives the clock + shows dashboards). */
  isHost?: boolean
  /** Provided for host dashboards / reveal name lookups. */
  players?: Player[]
}

// Per-sub-round points for first-correct-submit games.
export const SUBMIT_POINTS = [10, 7, 5] // 4th+ => 3
export function pointsForPosition(position: number): number {
  return SUBMIT_POINTS[position] ?? 3
}
