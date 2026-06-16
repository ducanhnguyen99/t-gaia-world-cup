import { useCallback, useEffect, useState } from 'react'

export interface StoredIdentity {
  playerId: string | null
  sessionId: string | null
  name: string | null
}

const KEYS = {
  playerId: 'tgaia.playerId',
  sessionId: 'tgaia.sessionId',
  name: 'tgaia.name',
} as const

function read(): StoredIdentity {
  return {
    playerId: localStorage.getItem(KEYS.playerId),
    sessionId: localStorage.getItem(KEYS.sessionId),
    name: localStorage.getItem(KEYS.name),
  }
}

/** Persisted player identity (refresh-safe) stored in localStorage. */
export function usePlayer() {
  const [identity, setIdentity] = useState<StoredIdentity>(read)

  const save = useCallback(
    (next: { playerId: string; sessionId: string; name: string }) => {
      localStorage.setItem(KEYS.playerId, next.playerId)
      localStorage.setItem(KEYS.sessionId, next.sessionId)
      localStorage.setItem(KEYS.name, next.name)
      setIdentity(read())
    },
    [],
  )

  const clear = useCallback(() => {
    localStorage.removeItem(KEYS.playerId)
    localStorage.removeItem(KEYS.sessionId)
    localStorage.removeItem(KEYS.name)
    setIdentity(read())
  }, [])

  // Keep in sync if another tab updates identity.
  useEffect(() => {
    const onStorage = () => setIdentity(read())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return { identity, save, clear }
}
