import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../firebase-config'

export interface GameState {
  status: 'active' | 'revealing' | 'done'
  startedAt: number | null
  roundData: Record<string, unknown>
  scores: Record<string, { value: number; timestamp: number; details?: unknown }>
  roundScores: Record<string, Record<string, unknown>>
  /** Full raw node — for games with extra sub-trees (submissions, votes, …). */
  raw: Record<string, unknown>
  loading: boolean
}

const EMPTY: GameState = {
  status: 'active',
  startedAt: null,
  roundData: {},
  scores: {},
  roundScores: {},
  raw: {},
  loading: true,
}

/**
 * Live listener for a single game instance: `games/{gameId}_{round}`.
 * Pass the composed instance key (e.g. "mathSpeed_1").
 */
export function useGameState(
  sessionId: string,
  gameInstanceKey: string | null,
): GameState {
  const [state, setState] = useState<GameState>(EMPTY)

  useEffect(() => {
    if (!gameInstanceKey) {
      setState({ ...EMPTY, loading: false })
      return
    }
    const gameRef = ref(db, `sessions/${sessionId}/games/${gameInstanceKey}`)
    const unsub = onValue(gameRef, (snap) => {
      const val = snap.val()
      setState({
        status: val?.status ?? 'active',
        startedAt: val?.startedAt ?? null,
        roundData: val?.roundData ?? {},
        scores: val?.scores ?? {},
        roundScores: val?.roundScores ?? {},
        raw: val ?? {},
        loading: false,
      })
    })
    return () => unsub()
  }, [sessionId, gameInstanceKey])

  return state
}
