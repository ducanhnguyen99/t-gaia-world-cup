import { useState } from 'react'
import { motion } from 'framer-motion'
import { ref, update } from 'firebase/database'
import { db } from '../firebase-config'
import type { Player, Team, GameId } from '../types'
import { GAME_BY_ID } from '../utils/games'

interface WaitingScreenProps {
  sessionId: string
  playerId: string
  players: Player[]
  teams: Team[]
  nextGame: GameId | null
}

/** Lobby view: who's here, team assignments, and a "waiting for host" pulse. */
export function WaitingScreen({
  sessionId,
  playerId,
  players,
  teams,
  nextGame,
}: WaitingScreenProps) {
  const connected = players.filter((p) => p.connected).length
  const me = players.find((p) => p.id === playerId)
  const myTeam = me?.team ? teams.find((t) => t.id === me.team) : undefined
  const teamsAssigned = teams.length > 0

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 text-center"
      >
        <div className="mb-2 text-5xl">⚽</div>
        <h2 className="text-2xl font-bold">Waiting for the host to start…</h2>
        <PulseDots />
        <p className="mt-2 text-slate-300">
          <span className="font-mono text-cyan-accent">{connected}</span> player
          {connected === 1 ? '' : 's'} connected
        </p>

        {nextGame && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm">
            <span>Next up:</span>
            <span className="text-xl">{GAME_BY_ID[nextGame].icon}</span>
            <span className="font-semibold text-magenta-bright">
              {GAME_BY_ID[nextGame].name}
            </span>
          </div>
        )}

        {myTeam && (
          <TeamRename
            sessionId={sessionId}
            team={myTeam}
          />
        )}
      </motion.div>

      {teamsAssigned ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {teams.map((team) => {
            const members = players.filter((p) => p.team === team.id)
            return (
              <div key={team.id} className="glass p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: team.color ?? '#888' }}
                  />
                  <span className="font-bold">{team.name}</span>
                </div>
                <ul className="space-y-1">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <PresenceDot on={m.connected} />
                      <span className={m.id === playerId ? 'font-semibold' : ''}>
                        {m.name}
                        {m.id === playerId && ' (you)'}
                      </span>
                    </li>
                  ))}
                  {members.length === 0 && (
                    <li className="text-sm text-slate-500">No members yet</li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass mt-6 p-5">
          <div className="mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
            In the lobby
          </div>
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-sm"
              >
                <PresenceDot on={p.connected} />
                {p.name}
                {p.id === playerId && ' (you)'}
              </span>
            ))}
            {players.length === 0 && (
              <span className="text-sm text-slate-500">
                No one here yet — share the join link!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TeamRename({ sessionId, team }: { sessionId: string; team: Team }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(team.name)
  const [saving, setSaving] = useState(false)

  async function save() {
    const name = value.trim()
    if (!name || name === team.name) {
      setEditing(false)
      return
    }
    setSaving(true)
    await update(ref(db, `sessions/${sessionId}/teams/${team.id}`), {
      name,
      renamed: true,
    })
    setSaving(false)
    setEditing(false)
  }

  if (team.renamed) {
    return (
      <p className="mt-4 text-xs text-slate-500">
        Your team: <span className="font-semibold text-slate-300">{team.name}</span>{' '}
        (already renamed)
      </p>
    )
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-4 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-cyan-accent transition hover:bg-white/10"
      >
        ✏️ Rename your team “{team.name}” (once)
      </button>
    )
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        maxLength={28}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-magenta"
      />
      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-magenta px-3 py-2 text-sm font-semibold disabled:opacity-60"
      >
        Save
      </button>
      <button
        onClick={() => setEditing(false)}
        className="rounded-lg bg-white/5 px-3 py-2 text-sm"
      >
        Cancel
      </button>
    </div>
  )
}

function PresenceDot({ on }: { on: boolean }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        on ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
      }`}
    />
  )
}

function PulseDots() {
  return (
    <div className="mt-3 flex justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-magenta-bright"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}
