import { useEffect, useRef } from 'react'
import { ref, runTransaction, set } from 'firebase/database'
import { db } from '../firebase-config'
import { INTRO_MS } from './types'

export interface DriverRoundData {
  order: number[]
  index: number
  phase: 'play' | 'reveal'
  deadline: number
  startsAt?: number
  done?: boolean
}

function shuffledRange(n: number): number[] {
  const a = [...Array(n).keys()]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Drives a round-based game's clock from *every* client using Firebase
 * transactions, so advancement is host-independent and self-healing: if the
 * admin tab closes, any remaining player advances the round. Transactions make
 * concurrent attempts idempotent (no double-advance / skipped rounds).
 *
 * Advancement is purely deadline-based (no early "all answered" skip) to keep
 * the transaction free of cross-node reads.
 */
export function useRoundDriver(opts: {
  sessionId: string
  gameKey: string
  itemCount: number
  numRounds: number
  perRoundMs: number
  revealMs?: number
  rd: DriverRoundData | undefined
  serverNow: () => number
}) {
  const {
    sessionId,
    gameKey,
    itemCount,
    numRounds,
    perRoundMs,
    revealMs = 3000,
    rd,
    serverNow,
  } = opts

  const rdRef = useRef(rd)
  rdRef.current = rd
  const doneSent = useRef(false)
  const nowRef = useRef(serverNow)
  nowRef.current = serverNow

  useEffect(() => {
    const node = ref(db, `sessions/${sessionId}/games/${gameKey}/roundData`)
    const statusRef = ref(db, `sessions/${sessionId}/games/${gameKey}/status`)

    const id = setInterval(() => {
      const now = nowRef.current()
      const cur = rdRef.current

      // Initialise the round order once (whoever wins the transaction).
      // Note: useGameState yields `{}` (not undefined) when roundData is absent,
      // so we must check for the `order` field, not just truthiness.
      if (!cur?.order) {
        const n = Math.min(numRounds, itemCount)
        const order = shuffledRange(itemCount).slice(0, n)
        const startsAt = now + INTRO_MS
        void runTransaction(node, (existing) =>
          existing
            ? undefined
            : { order, index: 0, phase: 'play', startsAt, deadline: startsAt + perRoundMs },
        )
        return
      }

      if (cur.done) {
        if (!doneSent.current) {
          doneSent.current = true
          void set(statusRef, 'done')
        }
        return
      }

      if (now < cur.deadline) return

      void runTransaction(node, (r: DriverRoundData | null) => {
        if (!r || r.done) return undefined
        if (r.phase === 'play' && now >= r.deadline) {
          return { ...r, phase: 'reveal', deadline: now + revealMs }
        }
        if (r.phase === 'reveal' && now >= r.deadline) {
          if (r.index + 1 < r.order.length) {
            return { ...r, index: r.index + 1, phase: 'play', deadline: now + perRoundMs }
          }
          return { ...r, done: true }
        }
        return undefined
      })
    }, 600)

    return () => clearInterval(id)
  }, [sessionId, gameKey, itemCount, numRounds, perRoundMs, revealMs])
}
