import { useState } from 'react'
import { Layout } from '../components/Layout'
import { Leaderboard } from '../components/Leaderboard'
import { useSession } from '../hooks/useSession'
import { useGameState } from '../hooks/useGameState'
import { GAMES, GAME_BY_ID } from '../utils/games'
import { GAME_COMPONENTS } from '../games/registry'
import { computeRawScores } from '../utils/gameScoring'
import { calculateGameScores } from '../utils/scoring'
import {
  applyExternalScore,
  applyScoresAndReveal,
  createSession,
  hardResetSession,
  playAgain,
  randomizeTeams,
  removePlayer,
  resetGames,
  setNextGame,
  setStatus,
  startGame,
} from '../utils/admin'
import type { GameConfig, GameId, Player, Team } from '../types'

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

        {/* Game control */}
        <Section title="Game Control">
          <GameControl
            sessionId={sessionId}
            status={session.status}
            currentGame={session.currentGame}
            currentRound={session.currentRound}
            gameConfig={session.gameConfig}
            players={session.players}
            teams={session.teams}
          />
        </Section>

        {/* External (admin-scored) games */}
        <Section title="External Game Scores">
          <ExternalScores
            sessionId={sessionId}
            players={session.players}
            teams={session.teams}
          />
        </Section>

        {/* Session flow */}
        <Section title="Session Flow">
          <div className="mb-3 flex flex-wrap gap-2">
            <FlowButton onClick={() => setStatus(sessionId, 'lobby')}>
              Back to Lobby
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

function GameControl({
  sessionId,
  status,
  currentGame,
  currentRound,
  gameConfig,
  players,
  teams,
}: {
  sessionId: string
  status: string
  currentGame: GameId | null
  currentRound: number
  gameConfig: GameConfig
  players: Player[]
  teams: Team[]
}) {
  const [selected, setSelected] = useState<GameId>('mathSpeed')
  const [timer, setTimer] = useState(60)
  const [rounds, setRounds] = useState(10)

  if (status === 'playing' && currentGame) {
    return (
      <HostActiveGame
        sessionId={sessionId}
        gameId={currentGame}
        round={currentRound}
        config={gameConfig}
        players={players}
        teams={teams}
      />
    )
  }

  if (status === 'revealing') {
    return (
      <div className="rounded-xl border border-magenta/30 bg-magenta/10 p-5 text-center">
        <div className="text-3xl">🥁</div>
        <p className="mt-2 font-semibold">
          The reveal animation is playing on the player screens.
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Scores have been applied. Click below when you're ready to move on.
        </p>
        <button
          onClick={() => setStatus(sessionId, 'between')}
          className="mt-4 rounded-lg bg-magenta px-5 py-2.5 font-bold text-white shadow-glow hover:bg-magenta-bright"
        >
          🏆 Show Leaderboard
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelected(g.id)}
            className={`rounded-xl border p-3 text-left transition ${
              selected === g.id
                ? 'border-magenta bg-magenta/15 shadow-glow'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="text-2xl">{g.icon}</div>
            <div className="text-sm font-semibold">{g.name}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        {selected === 'mathSpeed' ? (
          <label className="text-sm">
            <span className="mb-1 block text-slate-400">Timer (s)</span>
            <select
              value={timer}
              onChange={(e) => setTimer(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-magenta"
            >
              {[30, 60, 90].map((t) => (
                <option key={t} value={t} className="bg-slate-900">
                  {t}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="text-sm">
            <span className="mb-1 block text-slate-400">Rounds</span>
            <input
              type="number"
              min={1}
              max={20}
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-magenta"
            />
          </label>
        )}
        <button
          onClick={() =>
            startGame(sessionId, selected, currentRound + 1, {
              timer,
              rounds,
            })
          }
          disabled={players.length === 0}
          className="rounded-lg bg-magenta px-5 py-2.5 font-bold text-white shadow-glow transition hover:bg-magenta-bright disabled:cursor-not-allowed disabled:opacity-50"
        >
          ▶ Start {GAME_BY_ID[selected].name}
        </button>
      </div>
      {players.length === 0 && (
        <p className="mt-2 text-xs text-slate-500">Add players first.</p>
      )}
    </div>
  )
}

function HostActiveGame({
  sessionId,
  gameId,
  round,
  config,
  players,
  teams,
}: {
  sessionId: string
  gameId: GameId
  round: number
  config: GameConfig
  players: Player[]
  teams: Team[]
}) {
  const game = useGameState(sessionId, `${gameId}_${round}`)
  const GameComponent = GAME_COMPONENTS[gameId]

  function endAndReveal() {
    const raw = computeRawScores(gameId, game)
    const { ipUpdates, gpUpdates } = calculateGameScores(raw, players, teams, true)
    void applyScoresAndReveal(
      sessionId,
      gameId,
      round,
      raw,
      ipUpdates,
      gpUpdates,
      players,
      teams,
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-magenta/20 px-3 py-1 text-sm font-semibold text-magenta-bright">
          {GAME_BY_ID[gameId].icon} {GAME_BY_ID[gameId].name} · Round {round}
        </span>
        <button
          onClick={endAndReveal}
          className="rounded-lg bg-magenta px-4 py-2 text-sm font-bold shadow-glow hover:bg-magenta-bright"
        >
          ⏹ End &amp; Reveal Scores
        </button>
        <button
          onClick={() => playAgain(sessionId, gameId, round, config)}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
        >
          🔁 Play Again
        </button>
      </div>
      <div className="rounded-xl bg-black/20 p-2">
        <GameComponent
          sessionId={sessionId}
          playerId="__host__"
          round={round}
          config={config}
          players={players}
          isHost
        />
      </div>
    </div>
  )
}

function ExternalScores({
  sessionId,
  players,
  teams,
}: {
  sessionId: string
  players: Player[]
  teams: Team[]
}) {
  const [playerId, setPlayerId] = useState('')
  const [ip, setIp] = useState(0)
  const [teamId, setTeamId] = useState('')
  const [gp, setGp] = useState(0)

  function apply() {
    const player = players.find((p) => p.id === playerId) ?? null
    const team = teams.find((t) => t.id === teamId) ?? null
    void applyExternalScore(sessionId, player, ip, team, gp)
    setIp(0)
    setGp(0)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Award IP/GP from external games (Kahoot, Imposter, Wavelength…).
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Player</span>
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-magenta"
          >
            <option value="" className="bg-slate-900">
              — select —
            </option>
            {players.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900">
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">+ IP</span>
          <input
            type="number"
            value={ip}
            onChange={(e) => setIp(Number(e.target.value))}
            className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-magenta"
          />
        </label>
        <span className="px-2 pb-2 text-slate-600">|</span>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Team</span>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-magenta"
          >
            <option value="" className="bg-slate-900">
              — select —
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900">
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">+ GP</span>
          <input
            type="number"
            value={gp}
            onChange={(e) => setGp(Number(e.target.value))}
            className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-magenta"
          />
        </label>
        <button
          onClick={apply}
          className="rounded-lg bg-cyan-accent/90 px-4 py-2 font-semibold text-black transition hover:bg-cyan-accent"
        >
          Apply Scores
        </button>
      </div>
    </div>
  )
}
