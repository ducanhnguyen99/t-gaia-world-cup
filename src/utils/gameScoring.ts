import type { GameId } from '../types'
import type { GameState } from '../hooks/useGameState'
import { pointsForPosition } from '../games/types'
import wcQuestions from '../data/wc-stats-questions.json'

const WC_DEVIATION_POINTS = [10, 8, 6, 5, 4, 3, 2, 1] // 9th+ -> 1

interface RoundEntry {
  ts?: number
  correct?: boolean
  value?: number
}

/**
 * Reduce a finished game instance to a raw score per player (higher = better),
 * which the scoring util then turns into IP (player ranking) and GP (team sums).
 */
export function computeRawScores(
  gameId: GameId,
  game: GameState,
): Record<string, number> {
  if (gameId === 'mathSpeed') {
    const out: Record<string, number> = {}
    for (const [pid, s] of Object.entries(game.scores ?? {})) {
      out[pid] = s.value ?? 0
    }
    return out
  }

  if (gameId === 'wcStats') {
    return computeWcStats(game)
  }

  // First-correct-submit games: points by submission order per sub-round.
  return computeFirstSubmit(game)
}

function computeFirstSubmit(game: GameState): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const round of Object.values(game.roundScores ?? {})) {
    const correct = Object.entries(round as Record<string, RoundEntry>)
      .filter(([, e]) => e.correct)
      .sort((a, b) => (a[1].ts ?? 0) - (b[1].ts ?? 0))
    correct.forEach(([pid], position) => {
      totals[pid] = (totals[pid] ?? 0) + pointsForPosition(position)
    })
  }
  return totals
}

function computeWcStats(game: GameState): Record<string, number> {
  const totals: Record<string, number> = {}
  const order = (game.roundData as { order?: number[] })?.order ?? []
  const rounds = game.roundScores ?? {}

  for (const [idxStr, round] of Object.entries(rounds)) {
    const questionIndex = order[Number(idxStr)]
    const answer = wcQuestions[questionIndex]?.answer
    if (answer == null) continue
    const ranked = Object.entries(round as Record<string, RoundEntry>)
      .filter(([, e]) => typeof e.value === 'number')
      .map(([pid, e]) => ({ pid, dev: Math.abs((e.value as number) - answer) }))
      .sort((a, b) => a.dev - b.dev)
    ranked.forEach(({ pid }, rank) => {
      totals[pid] = (totals[pid] ?? 0) + (WC_DEVIATION_POINTS[rank] ?? 1)
    })
  }
  return totals
}
