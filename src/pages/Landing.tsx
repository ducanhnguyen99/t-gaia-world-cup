import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { push, ref, serverTimestamp, set } from 'firebase/database'
import { db } from '../firebase-config'
import { Layout } from '../components/Layout'
import { usePlayer } from '../hooks/usePlayer'

export function Landing() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') ?? 'WC2026'
  const { identity, save } = usePlayer()
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Already joined this session → straight to the game.
  useEffect(() => {
    if (identity.playerId && identity.sessionId === sessionId) {
      navigate('/game')
    }
  }, [identity, sessionId, navigate])

  async function handleJoin() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter your name')
      return
    }
    setJoining(true)
    setError(null)
    try {
      const playersRef = ref(db, `sessions/${sessionId}/players`)
      const playerRef = push(playersRef)
      await set(playerRef, {
        name: trimmed,
        ip: 0,
        gp: 0,
        connected: true,
        joinedAt: serverTimestamp(),
      })
      save({ playerId: playerRef.key!, sessionId, name: trimmed })
      navigate('/game')
    } catch (e) {
      console.error(e)
      setError('Could not join — check your connection and try again.')
      setJoining(false)
    }
  }

  return (
    <Layout>
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="mb-3 text-6xl drop-shadow-[0_0_24px_rgba(226,0,116,0.5)]">
            ⚽
          </div>
          <h1 className="bg-gradient-to-r from-magenta-bright via-magenta to-cyan-accent bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
            T-Gaia World Cup
          </h1>
          <div className="mt-1 text-3xl font-bold tracking-[0.3em] text-cyan-accent/80">
            2026
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="glass mt-10 w-full max-w-md p-8 shadow-[0_0_40px_rgba(226,0,116,0.15)]"
        >
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Enter your name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="e.g. Alex"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-slate-500 outline-none transition focus:border-magenta focus:ring-2 focus:ring-magenta/40"
          />
          {error && <p className="mt-2 text-sm text-magenta-bright">{error}</p>}
          <button
            onClick={handleJoin}
            disabled={joining}
            className="mt-5 w-full rounded-xl bg-magenta px-4 py-3 text-lg font-bold text-white shadow-glow transition hover:scale-[1.02] hover:bg-magenta-bright hover:shadow-glow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {joining ? 'Joining…' : 'Join Session'}
          </button>
          <p className="mt-4 text-center text-xs tracking-wide text-slate-400">
            Session{' '}
            <span className="font-mono text-cyan-accent">{sessionId}</span>
          </p>
        </motion.div>
      </div>
    </Layout>
  )
}
