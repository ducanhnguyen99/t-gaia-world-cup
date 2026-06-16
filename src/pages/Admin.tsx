import { useState } from 'react'
import { Layout } from '../components/Layout'
import { Leaderboard } from '../components/Leaderboard'
import { useSession } from '../hooks/useSession'
import { GAMES } from '../utils/games'
import {
  createSession,
  hardResetSession,
  randomizeTeams,
  removePlayer,
  resetGames,
  setNextGame,
  setStatus,
} from '../utils/admin'
import type { GameId } from '../types'

const ADMIN_PASSWORD = 'tgaia2026'
const AUTH_KEY = 'tgaia.admin'

export function Admin() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === '1',
  )
  if (!authed) return <PasswordGate onUnlock={() => setAuthed(true)} />
  return <AdminDashboard />
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  function submit() {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1')
      onUnlock()
    } else {
      setError(true)
    }
  }
  return (
    <Layout>
      <div className="glass mx-auto mt-16 max-w-sm p-8 text-center">
        <div className="mb-3 text-4xl">🔐</div>
        <h2 className="mb-4 text-xl font-bold">Admin Access</h2>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Password"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/40"
        />
        {error && <p className="mt-2 text-sm text-magenta-bright">Wrong password</p>}
        <button
          onClick={submit}
          className="mt-4 w-full rounded-xl bg-magenta px-4 py-3 font-bold text-white shadow-glow transition hover:bg-magenta-bright"
        >
          Unlock
        </button>
      </div>
    </Layout>
  )
}

function AdminDashboard() {
  const [sessionId, setSessionId] = useState('WC2026')
  const [numTeams, setNumTeams] = useState(4)
  const session = useSession(sessionId)

  const joinLink = `${window.location.origin}${window.location.pathname}#/?session=${sessionId}`
  const connected = session.players.filter((p) => p.connected).length

  return (
    <Layout
      headerRight={
        <span className="glass px-4 py-2 text-sm font-medium text-cyan-accent">
          Admin
        </span>
      }
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Session setup */}
        <Section title="Session">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-slate-400">Session ID</span>
              <input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value.trim() || 'WC2026')}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono outline-none focus:border-magenta"
              />
            </label>
            <button
              onClick={() => createSession(sessionId)}
              className="rounded-lg bg-magenta px-4 py-2 font-semibold text-white shadow-glow transition hover:bg-magenta-bright"
            >
              {session.exists ? 'Re-create / Reset to Lobby' : 'Create Session'}
            </button>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                session.exists
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-white/5 text-slate-400'
              }`}
            >
              {session.exists ? `status: ${session.status}` : 'not created'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="text-slate-400">Join link:</span>
            <code className="truncate rounded bg-black/30 px-2 py-1 text-cyan-accent">
              {joinLink}
            </code>
            <button
              onClick={() => navigator.clipboard?.writeText(joinLink)}
              className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
            >
              Copy
            </button>
          </div>
        </Section>

        {/* Players */}
        <Section title={`Players (${connected} online / ${session.players.length} total)`}>
          {session.players.length === 0 ? (
            <p className="text-sm text-slate-400">
              No players yet. Share the join link above.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {session.players.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-sm"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      p.connected ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                  />
                  {p.name}
                  <button
                    onClick={() => removePlayer(sessionId, p.id)}
                    title="Remove player"
                    className="ml-1 text-slate-500 hover:text-magenta-bright"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Teams */}
        <Section title="Teams">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-slate-400">Number of teams</span>
              <select
                value={numTeams}
                onChange={(e) => setNumTeams(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-magenta"
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n} className="bg-slate-900">
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => randomizeTeams(sessionId, session.players, numTeams)}
              disabled={session.players.length === 0}
              className="rounded-lg bg-cyan-accent/90 px-4 py-2 font-semibold text-black transition hover:bg-cyan-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              🎲 Randomize Teams
            </button>
          </div>
          {session.teams.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {session.teams.map((t) => (
                <div key={t.id} className="rounded-xl bg-white/5 p-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    {t.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {session.players
                      .filter((p) => p.team === t.id)
                      .map((p) => p.name)
                      .join(', ') || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Flow control (game start lands in Phase 3) */}
        <Section title="Flow Control">
          <div className="mb-3 flex flex-wrap gap-2">
            <FlowButton onClick={() => setStatus(sessionId, 'lobby')}>
              Lobby
            </FlowButton>
            <FlowButton onClick={() => setStatus(sessionId, 'between')}>
              🏆 Show Leaderboard
            </FlowButton>
            <FlowButton onClick={() => setStatus(sessionId, 'ended')}>
              🎉 End Session
            </FlowButton>
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-slate-400">
              Next game teaser (shown while waiting)
            </span>
            <select
              value={session.nextGame ?? ''}
              onChange={(e) =>
                setNextGame(sessionId, (e.target.value || null) as GameId | null)
              }
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-magenta"
            >
              <option value="" className="bg-slate-900">
                — none —
              </option>
              {GAMES.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900">
                  {g.icon} {g.name}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-3 text-xs text-slate-500">
            Game selection &amp; start/reveal controls arrive in Phase 3.
          </p>
        </Section>

        {/* Live standings */}
        {(session.players.length > 0 || session.teams.length > 0) && (
          <Section title="Live Standings">
            <Leaderboard players={session.players} teams={session.teams} />
          </Section>
        )}

        {/* Danger zone */}
        <Section title="Emergency">
          <div className="flex flex-wrap gap-2">
            <DangerButton onClick={() => resetGames(sessionId)}>
              Reset Games (keep players/teams)
            </DangerButton>
            <DangerButton
              onClick={() => {
                if (confirm('Wipe ALL players, teams and games for this session?'))
                  hardResetSession(sessionId)
              }}
            >
              Hard Reset Session
            </DangerButton>
          </div>
        </Section>
      </div>
    </Layout>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="glass p-5">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-300 uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function FlowButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
    >
      {children}
    </button>
  )
}

function DangerButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
    >
      {children}
    </button>
  )
}
