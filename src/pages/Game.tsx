import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { usePlayer } from '../hooks/usePlayer'
import { useSession } from '../hooks/useSession'

export function Game() {
  const navigate = useNavigate()
  const { identity } = usePlayer()
  const sessionId = identity.sessionId ?? 'WC2026'
  const session = useSession(sessionId)

  if (!identity.playerId) {
    navigate('/')
    return null
  }

  return (
    <Layout
      headerRight={
        <span className="glass px-4 py-2 text-sm font-medium text-slate-200">
          {identity.name}
        </span>
      }
    >
      <div className="glass mx-auto mt-8 max-w-2xl p-10 text-center">
        <div className="mb-4 text-5xl">🎮</div>
        <h2 className="text-2xl font-bold">
          {session.loading ? 'Connecting…' : `Status: ${session.status}`}
        </h2>
        <p className="mt-3 text-slate-300">
          {session.players.length} player
          {session.players.length === 1 ? '' : 's'} connected
        </p>
        <p className="mt-6 text-sm text-slate-400">
          Game views render here based on session state (Phase 2+).
        </p>
      </div>
    </Layout>
  )
}
