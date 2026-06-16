import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../firebase-config'
import type {
  GameId,
  LastReveal,
  PlanStep,
  Player,
  SessionStatus,
  Team,
} from '../types'

export interface SessionState {
  status: SessionStatus
  currentGame: GameId | null
  currentRound: number
  nextGame: GameId | null
  gameConfig: { timer: number; rounds: number }
  players: Player[]
  teams: Team[]
  lastReveal: LastReveal | null
  planSteps: PlanStep[]
  planIndex: number
  externalName: string | null
  exists: boolean
  loading: boolean
}

const EMPTY: SessionState = {
  status: 'lobby',
  currentGame: null,
  currentRound: 1,
  nextGame: null,
  gameConfig: { timer: 60, rounds: 10 },
  players: [],
  teams: [],
  lastReveal: null,
  planSteps: [],
  planIndex: 0,
  externalName: null,
  exists: false,
  loading: true,
}

/** Live listener for a session: status, current game, players and teams. */
export function useSession(sessionId: string): SessionState {
  const [state, setState] = useState<SessionState>(EMPTY)

  useEffect(() => {
    const sessionRef = ref(db, `sessions/${sessionId}`)
    const unsub = onValue(sessionRef, (snap) => {
      const val = snap.val()
      if (!val) {
        setState({ ...EMPTY, loading: false, exists: false })
        return
      }

      const players: Player[] = Object.entries(
        (val.players ?? {}) as Record<string, Partial<Player>>,
      ).map(([id, p]) => ({
        id,
        name: p.name ?? '',
        team: p.team,
        ip: p.ip ?? 0,
        gp: p.gp ?? 0,
        connected: p.connected ?? false,
        joinedAt: p.joinedAt ?? 0,
      }))

      const teams: Team[] = Object.entries(
        (val.teams ?? {}) as Record<string, Partial<Team>>,
      ).map(([id, t]) => ({
        id,
        name: t.name ?? '',
        gp: t.gp ?? 0,
        renamed: t.renamed ?? false,
        color: t.color,
      }))

      setState({
        status: (val.status ?? 'lobby') as SessionStatus,
        currentGame: (val.currentGame ?? null) as GameId | null,
        currentRound: val.currentRound ?? 1,
        nextGame: (val.nextGame ?? null) as GameId | null,
        gameConfig: val.gameConfig ?? { timer: 60, rounds: 10 },
        players,
        teams,
        lastReveal: (val.lastReveal ?? null) as LastReveal | null,
        planSteps: (val.plan?.steps ?? []) as PlanStep[],
        planIndex: val.plan?.index ?? 0,
        externalName: (val.externalName ?? null) as string | null,
        exists: true,
        loading: false,
      })
    })
    return () => unsub()
  }, [sessionId])

  return state
}
