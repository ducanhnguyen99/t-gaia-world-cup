import { useSearchParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Leaderboard } from '../components/Leaderboard'
import { useSession } from '../hooks/useSession'

export function LeaderboardPage() {
  const [params] = useSearchParams()
  const sessionId = params.get('session') ?? 'WC2026'
  const session = useSession(sessionId)

  return (
    <Layout
      headerRight={
        <span className="glass px-4 py-2 text-sm font-mono text-cyan-accent">
          {sessionId}
        </span>
      }
    >
      <div className="mx-auto max-w-2xl">
        <div className="glass mb-6 p-6 text-center">
          <div className="text-4xl">🏆</div>
          <h2 className="mt-2 text-2xl font-black">Live Standings</h2>
          {session.loading && (
            <p className="mt-2 text-sm text-slate-400">Connecting…</p>
          )}
        </div>
        <Leaderboard players={session.players} teams={session.teams} />
      </div>
    </Layout>
  )
}
