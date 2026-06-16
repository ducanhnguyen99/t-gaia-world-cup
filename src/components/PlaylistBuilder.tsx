import { useState } from 'react'
import type { GameId, PlanStep } from '../types'
import { GAMES, GAME_BY_ID } from '../utils/games'
import { advancePlan, savePlan, startPlanStep } from '../utils/admin'

interface Props {
  sessionId: string
  steps: PlanStep[]
  planIndex: number
  status: string
  currentRound: number
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function PlaylistBuilder({
  sessionId,
  steps,
  planIndex,
  status,
  currentRound,
}: Props) {
  const [gameId, setGameId] = useState<GameId>('mathSpeed')
  const [timer, setTimer] = useState(60)
  const [rounds, setRounds] = useState(10)
  const [extName, setExtName] = useState('')

  const gameInProgress =
    status === 'playing' || status === 'external' || status === 'revealing'

  function persist(next: PlanStep[]) {
    void savePlan(sessionId, next)
  }

  function addInternal() {
    persist([
      ...steps,
      { id: uid(), kind: 'internal', gameId, timer, rounds, name: GAME_BY_ID[gameId].name },
    ])
  }
  function addExternal() {
    const name = extName.trim()
    if (!name) return
    persist([...steps, { id: uid(), kind: 'external', name }])
    setExtName('')
  }
  function remove(id: string) {
    persist(steps.filter((s) => s.id !== id))
  }
  function move(index: number, dir: -1 | 1) {
    const j = index + dir
    if (j < 0 || j >= steps.length) return
    const next = [...steps]
    ;[next[index], next[j]] = [next[j], next[index]]
    persist(next)
  }

  const current = steps[planIndex]

  return (
    <div className="space-y-4">
      {/* Step list */}
      {steps.length === 0 ? (
        <p className="text-sm text-slate-400">
          No steps yet. Build your agenda below — mix internal games and external
          ones (Kahoot, Imposter, Wavelength…).
        </p>
      ) : (
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li
              key={s.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                i === planIndex
                  ? 'border-magenta bg-magenta/15 shadow-glow'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <span className="w-6 text-center font-mono text-slate-400">
                {i + 1}
              </span>
              <span className="text-xl">
                {s.kind === 'internal' && s.gameId
                  ? GAME_BY_ID[s.gameId].icon
                  : '🎮'}
              </span>
              <span className="flex-1 truncate">
                <span className="font-semibold">{s.name}</span>
                {s.kind === 'internal' && (
                  <span className="ml-2 text-xs text-slate-400">
                    {s.gameId === 'mathSpeed'
                      ? `${s.timer}s`
                      : `${s.rounds} rounds`}
                  </span>
                )}
                {s.kind === 'external' && (
                  <span className="ml-2 text-xs text-cyan-accent">external</span>
                )}
              </span>
              {i === planIndex && (
                <span className="rounded-full bg-magenta/30 px-2 py-0.5 text-xs font-semibold text-magenta-bright">
                  current
                </span>
              )}
              <button
                onClick={() => move(i, -1)}
                className="px-1 text-slate-400 hover:text-white"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => move(i, 1)}
                className="px-1 text-slate-400 hover:text-white"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => remove(s.id)}
                className="px-1 text-slate-500 hover:text-magenta-bright"
                title="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}

      {/* Run controls */}
      {steps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-black/20 p-3">
          <span className="text-sm text-slate-300">
            {current ? (
              <>
                Up next:{' '}
                <span className="font-semibold">
                  {planIndex + 1}. {current.name}
                </span>
              </>
            ) : (
              <span className="text-slate-400">Agenda complete</span>
            )}
          </span>
          <button
            onClick={() => startPlanStep(sessionId, steps, planIndex, currentRound)}
            disabled={!current || gameInProgress}
            className="rounded-lg bg-magenta px-4 py-2 text-sm font-bold text-white shadow-glow transition hover:bg-magenta-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            ▶ Start step {planIndex + 1}
          </button>
          <button
            onClick={() => advancePlan(sessionId, planIndex, steps)}
            disabled={planIndex >= steps.length}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20 disabled:opacity-40"
          >
            ⏭ Next step
          </button>
        </div>
      )}

      {/* Add steps */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Add internal game
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <select
              value={gameId}
              onChange={(e) => setGameId(e.target.value as GameId)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm outline-none focus:border-magenta"
            >
              {GAMES.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900">
                  {g.icon} {g.name}
                </option>
              ))}
            </select>
            {gameId === 'mathSpeed' ? (
              <select
                value={timer}
                onChange={(e) => setTimer(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm outline-none focus:border-magenta"
                title="Timer (s)"
              >
                {[30, 60, 90].map((t) => (
                  <option key={t} value={t} className="bg-slate-900">
                    {t}s
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                min={1}
                max={20}
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm outline-none focus:border-magenta"
                title="Rounds"
              />
            )}
            <button
              onClick={addInternal}
              className="rounded-lg bg-cyan-accent/90 px-3 py-1.5 text-sm font-semibold text-black hover:bg-cyan-accent"
            >
              + Add
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Add external step
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <input
              value={extName}
              onChange={(e) => setExtName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addExternal()}
              placeholder="e.g. Kahoot Round 1"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm outline-none focus:border-magenta"
            />
            <button
              onClick={addExternal}
              className="rounded-lg bg-cyan-accent/90 px-3 py-1.5 text-sm font-semibold text-black hover:bg-cyan-accent"
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
