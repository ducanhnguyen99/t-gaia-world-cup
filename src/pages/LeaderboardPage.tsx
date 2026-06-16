import { Layout } from '../components/Layout'

export function LeaderboardPage() {
  return (
    <Layout>
      <div className="glass mx-auto mt-8 max-w-3xl p-10 text-center">
        <div className="mb-4 text-5xl">🏆</div>
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <p className="mt-3 text-slate-400">
          Live Individual (IP) and Team (GP) standings render here (Phase 5).
        </p>
      </div>
    </Layout>
  )
}
