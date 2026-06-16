import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Player, Team } from '../types'

interface LeaderboardProps {
  players: Player[]
  teams: Team[]
  /** Limit the individual list (e.g. top 5 on the waiting screen). */
  topN?: number
  defaultTab?: 'individual' | 'teams'
}

const MEDALS = ['🥇', '🥈', '🥉']

function rankStyle(index: number): string {
  switch (index) {
    case 0:
      return 'from-yellow-400/25 to-amber-500/10 border-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.25)]'
    case 1:
      return 'from-slate-300/20 to-slate-400/5 border-slate-300/30'
    case 2:
      return 'from-amber-700/25 to-amber-800/10 border-amber-600/30'
    default:
      return 'from-white/5 to-white/0 border-white/10'
  }
}

export function Leaderboard({
  players,
  teams,
  topN,
  defaultTab = 'individual',
}: LeaderboardProps) {
  const [tab, setTab] = useState<'individual' | 'teams'>(defaultTab)

  const teamById = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t])),
    [teams],
  )

  const rankedPlayers = useMemo(
    () => [...players].sort((a, b) => b.ip - a.ip),
    [players],
  )
  const shownPlayers = topN ? rankedPlayers.slice(0, topN) : rankedPlayers

  const rankedTeams = useMemo(
    () => [...teams].sort((a, b) => b.gp - a.gp),
    [teams],
  )

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-center gap-2">
        <TabButton active={tab === 'individual'} onClick={() => setTab('individual')}>
          Individual (IP)
        </TabButton>
        <TabButton active={tab === 'teams'} onClick={() => setTab('teams')}>
          Teams (GP)
        </TabButton>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'individual' ? (
          <motion.ul
            key="individual"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            {shownPlayers.length === 0 && <EmptyRow label="No players yet" />}
            {shownPlayers.map((p, i) => {
              const team = p.team ? teamById[p.team] : undefined
              return (
                <motion.li
                  layout
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl border bg-gradient-to-r px-4 py-3 ${rankStyle(i)}`}
                >
                  <span className="w-8 text-center text-lg font-bold">
                    {MEDALS[i] ?? i + 1}
                  </span>
                  <span className="flex-1 truncate font-semibold">{p.name}</span>
                  {team && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-black/80"
                      style={{ backgroundColor: team.color ?? '#888' }}
                    >
                      {team.name}
                    </span>
                  )}
                  <span className="w-14 text-right font-mono text-lg font-bold text-cyan-accent">
                    {p.ip}
                  </span>
                </motion.li>
              )
            })}
          </motion.ul>
        ) : (
          <motion.ul
            key="teams"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            {rankedTeams.length === 0 && <EmptyRow label="Teams not assigned yet" />}
            {rankedTeams.map((t, i) => {
              const members = players.filter((p) => p.team === t.id)
              return (
                <motion.li
                  layout
                  key={t.id}
                  className={`rounded-xl border bg-gradient-to-r px-4 py-3 ${rankStyle(i)}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center text-lg font-bold">
                      {MEDALS[i] ?? i + 1}
                    </span>
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: t.color ?? '#888' }}
                    />
                    <span className="flex-1 truncate font-semibold">{t.name}</span>
                    <span className="w-14 text-right font-mono text-lg font-bold text-magenta-bright">
                      {t.gp}
                    </span>
                  </div>
                  {members.length > 0 && (
                    <div className="mt-1 pl-11 text-xs text-slate-400">
                      {members.map((m) => m.name).join(' · ')}
                    </div>
                  )}
                </motion.li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-magenta text-white shadow-glow'
          : 'bg-white/5 text-slate-300 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">
      {label}
    </li>
  )
}
