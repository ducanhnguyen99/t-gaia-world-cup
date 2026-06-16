import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Confetti } from './Confetti'
import { GAME_BY_ID } from '../utils/games'
import { playFanfare, playReveal } from '../utils/sounds'
import type { LastReveal } from '../types'

const MEDALS = ['🥇', '🥈', '🥉']

function rankStyle(rank: number): string {
  switch (rank) {
    case 0:
      return 'from-yellow-400/30 to-amber-500/10 border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.35)]'
    case 1:
      return 'from-slate-300/25 to-slate-400/5 border-slate-300/40'
    case 2:
      return 'from-amber-700/30 to-amber-800/10 border-amber-600/40'
    default:
      return 'from-white/5 to-white/0 border-white/10'
  }
}

export function RevealAnimation({ reveal }: { reveal: LastReveal }) {
  const meta = GAME_BY_ID[reveal.gameId]

  // Compute per-row reveal delays from worst → best (dramatic pause near the top).
  const { delays, winnerDelay } = useMemo(() => {
    const n = reveal.entries.length
    const d = new Array(n).fill(0)
    let t = 0.6
    for (let i = n - 1; i >= 0; i--) {
      d[i] = t
      t += i < 3 ? 1.3 : 0.4
    }
    return { delays: d, winnerDelay: d[0] ?? 0.6 }
  }, [reveal])

  const [showWinnerFx, setShowWinnerFx] = useState(false)
  const [showTeams, setShowTeams] = useState(false)

  useEffect(() => {
    playReveal()
    const winFx = setTimeout(() => {
      setShowWinnerFx(true)
      playFanfare()
    }, winnerDelay * 1000)
    const teamFx = setTimeout(
      () => setShowTeams(true),
      (winnerDelay + 1.2) * 1000,
    )
    return () => {
      clearTimeout(winFx)
      clearTimeout(teamFx)
    }
  }, [winnerDelay])

  return (
    <div className="mx-auto max-w-2xl">
      {showWinnerFx && <Confetti fireKey={reveal.round} />}

      <div className="mb-6 text-center">
        <div className="text-5xl">{meta.icon}</div>
        <h2 className="mt-2 text-2xl font-black">{meta.name} — Results</h2>
        <p className="text-sm text-slate-400">Round {reveal.round}</p>
      </div>

      <ul className="space-y-2">
        {reveal.entries.length === 0 && (
          <li className="glass p-6 text-center text-slate-400">
            No scores recorded this game.
          </li>
        )}
        {reveal.entries.map((e, rank) => (
          <motion.li
            key={e.playerId}
            initial={{ opacity: 0, x: -60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: rank === 0 ? 1.04 : 1 }}
            transition={{ delay: delays[rank], type: 'spring', stiffness: 120 }}
            className={`flex items-center gap-3 rounded-xl border bg-gradient-to-r px-4 py-3 ${rankStyle(rank)}`}
          >
            <span className="w-9 text-center text-xl font-bold">
              {MEDALS[rank] ?? rank + 1}
            </span>
            <span className="flex-1 truncate text-lg font-semibold">
              {e.name}
            </span>
            {e.teamName && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-black/80"
                style={{ backgroundColor: e.teamColor ?? '#888' }}
              >
                {e.teamName}
              </span>
            )}
            <span className="w-12 text-right text-sm text-slate-300">
              {e.raw} pts
            </span>
            <span className="w-12 text-right font-mono text-lg font-bold text-cyan-accent">
              +{e.ipGained}
            </span>
          </motion.li>
        ))}
      </ul>

      {showTeams && reveal.teams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mt-6 p-4"
        >
          <div className="mb-2 text-center text-sm font-semibold tracking-wide text-slate-400 uppercase">
            Team Points (GP) this game
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {reveal.teams.map((t) => (
              <span
                key={t.teamId}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-sm font-semibold"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: t.color ?? '#888' }}
                />
                {t.name}
                <span className="font-mono text-magenta-bright">+{t.gpGained}</span>
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Waiting for the host to continue…
      </p>
    </div>
  )
}
