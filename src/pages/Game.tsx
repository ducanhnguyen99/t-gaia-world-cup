import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ref, update } from 'firebase/database'
import { db } from '../firebase-config'
import { Layout } from '../components/Layout'
import { WaitingScreen } from '../components/WaitingScreen'
import { Leaderboard } from '../components/Leaderboard'
import { RevealAnimation } from '../components/RevealAnimation'
import { Confetti } from '../components/Confetti'
import { usePlayer } from '../hooks/usePlayer'
import { useSession } from '../hooks/useSession'
import { usePresence } from '../hooks/usePresence'
import { GAME_BY_ID } from '../utils/games'
import { GAME_COMPONENTS } from '../games/registry'

export function Game() {
  const navigate = useNavigate()
  const { identity } = usePlayer()
  const sessionId = identity.sessionId ?? 'WC2026'
  const playerId = identity.playerId
  const session = useSession(sessionId)

  usePresence(sessionId, playerId)

  // Late-joiner: if teams exist but I'm unassigned, join the smallest team.
  const assignedRef = useRef(false)
  useEffect(() => {
    if (assignedRef.current || !playerId) return
    if (session.teams.length === 0) return
    const me = session.players.find((p) => p.id === playerId)
    if (!me || me.team) return

    const counts = session.teams.map((t) => ({
      id: t.id,
      n: session.players.filter((p) => p.team === t.id).length,
    }))
    counts.sort((a, b) => a.n - b.n)
    const smallest = counts[0]
    if (smallest) {
      assignedRef.current = true
      void update(ref(db, `sessions/${sessionId}/players/${playerId}`), {
        team: smallest.id,
      })
    }
  }, [session.teams, session.players, playerId, sessionId])

  if (!playerId) {
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
      <AnimatePresence mode="wait">
        <motion.div
          key={session.status}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          {renderState()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  )

  function renderState() {
    if (session.loading) {
      return <CenterCard icon="📡" title="Connecting…" />
    }

    switch (session.status) {
      case 'lobby':
        return (
          <WaitingScreen
            sessionId={sessionId}
            playerId={playerId!}
            players={session.players}
            teams={session.teams}
            nextGame={session.nextGame}
          />
        )

      case 'playing': {
        if (!session.currentGame) {
          return <CenterCard icon="🎮" title="Game starting…" />
        }
        const GameComponent = GAME_COMPONENTS[session.currentGame]
        return (
          <GameComponent
            sessionId={sessionId}
            playerId={playerId!}
            round={session.currentRound}
            config={session.gameConfig}
            players={session.players}
          />
        )
      }

      case 'external':
        return (
          <CenterCard
            icon="🎮"
            title={session.externalName ?? 'External game'}
            subtitle="Follow your host — play this one in the other app/screen. Scores will appear on the leaderboard."
          />
        )

      case 'revealing':
        return session.lastReveal ? (
          <RevealAnimation reveal={session.lastReveal} />
        ) : (
          <CenterCard icon="🥁" title="Revealing results…" />
        )

      case 'between':
        return (
          <div className="mx-auto max-w-2xl">
            <div className="glass mb-6 p-6 text-center">
              <div className="text-4xl">🏆</div>
              <h2 className="mt-2 text-xl font-bold">Current Standings</h2>
              {session.nextGame && (
                <p className="mt-1 text-sm text-slate-400">
                  Next up: {GAME_BY_ID[session.nextGame].icon}{' '}
                  {GAME_BY_ID[session.nextGame].name}
                </p>
              )}
            </div>
            <Leaderboard
              players={session.players}
              teams={session.teams}
              meId={playerId!}
              myTeamId={session.players.find((p) => p.id === playerId)?.team}
            />
          </div>
        )

      case 'ended': {
        const champion = [...session.players].sort((a, b) => b.ip - a.ip)[0]
        const topTeam = [...session.teams].sort((a, b) => b.gp - a.gp)[0]
        return (
          <div className="mx-auto max-w-2xl">
            <Confetti fireKey="ended" duration={5000} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass mb-6 p-8 text-center"
            >
              <div className="text-6xl">🏆</div>
              <h2 className="mt-2 text-3xl font-black">Final Results</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {champion && (
                  <div className="rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-500/5 p-4">
                    <div className="text-xs tracking-wide text-slate-400 uppercase">
                      Individual Champion
                    </div>
                    <div className="mt-1 text-xl font-bold">🥇 {champion.name}</div>
                    <div className="text-sm text-cyan-accent">{champion.ip} IP</div>
                  </div>
                )}
                {topTeam && (
                  <div className="rounded-xl bg-gradient-to-br from-magenta/20 to-magenta-deep/5 p-4">
                    <div className="text-xs tracking-wide text-slate-400 uppercase">
                      Team Champion
                    </div>
                    <div className="mt-1 text-xl font-bold">
                      <span
                        className="mr-1 inline-block h-3 w-3 rounded-full align-middle"
                        style={{ backgroundColor: topTeam.color ?? '#888' }}
                      />
                      {topTeam.name}
                    </div>
                    <div className="text-sm text-magenta-bright">{topTeam.gp} GP</div>
                  </div>
                )}
              </div>
            </motion.div>
            <Leaderboard
              players={session.players}
              teams={session.teams}
              meId={playerId!}
              myTeamId={session.players.find((p) => p.id === playerId)?.team}
            />
          </div>
        )
      }

      default:
        return <CenterCard icon="⚽" title="Standing by…" />
    }
  }
}

function CenterCard({
  icon,
  title,
  subtitle,
}: {
  icon: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="glass mx-auto mt-8 max-w-2xl p-10 text-center">
      <div className="mb-4 text-5xl">{icon}</div>
      <h2 className="text-2xl font-bold">{title}</h2>
      {subtitle && <p className="mt-3 text-sm text-slate-400">{subtitle}</p>}
    </div>
  )
}
