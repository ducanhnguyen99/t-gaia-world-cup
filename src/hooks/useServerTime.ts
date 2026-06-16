import { useEffect, useRef, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../firebase-config'

/**
 * Returns a function giving the current *server* time in ms, corrected for this
 * client's clock skew via Firebase's `.info/serverTimeOffset`. Use this for all
 * countdown maths so every player agrees on deadlines.
 */
export function useServerTime() {
  const offsetRef = useRef(0)
  const [, force] = useState(0)

  useEffect(() => {
    const unsub = onValue(ref(db, '.info/serverTimeOffset'), (snap) => {
      offsetRef.current = snap.val() ?? 0
      force((n) => n + 1)
    })
    return () => unsub()
  }, [])

  return () => Date.now() + offsetRef.current
}

/**
 * Ticking countdown to an absolute server deadline (ms). Returns whole seconds
 * remaining, re-rendering ~4x/sec. Returns 0 once elapsed (or if no deadline).
 */
export function useCountdown(deadline: number | null): number {
  const serverNow = useServerTime()
  const [, tick] = useState(0)

  useEffect(() => {
    if (!deadline) return
    const id = setInterval(() => tick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [deadline])

  if (!deadline) return 0
  return Math.max(0, Math.ceil((deadline - serverNow()) / 1000))
}
