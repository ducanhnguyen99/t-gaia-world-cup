import { useEffect } from 'react'
import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
} from 'firebase/database'
import { db } from '../firebase-config'

/**
 * Marks a player connected while mounted and flips them to disconnected when
 * the tab closes / drops, using Firebase's onDisconnect + the .info/connected
 * presence channel.
 */
export function usePresence(sessionId: string, playerId: string | null) {
  useEffect(() => {
    if (!playerId) return
    const connRef = ref(db, `sessions/${sessionId}/players/${playerId}/connected`)
    const lastSeenRef = ref(
      db,
      `sessions/${sessionId}/players/${playerId}/lastSeen`,
    )
    const infoRef = ref(db, '.info/connected')

    const unsub = onValue(infoRef, (snap) => {
      if (snap.val() === false) return
      // When we (re)connect, schedule the disconnect handler then go online.
      void onDisconnect(connRef).set(false)
      void set(connRef, true)
      void set(lastSeenRef, serverTimestamp())
    })

    return () => {
      unsub()
      // Best-effort: mark offline on unmount (e.g. navigating away).
      void set(connRef, false)
    }
  }, [sessionId, playerId])
}
