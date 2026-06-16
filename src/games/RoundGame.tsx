import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ref, serverTimestamp, set, update } from 'firebase/database'
import { db } from '../firebase-config'
import { useGameState } from '../hooks/useGameState'
import { useServerTime } from '../hooks/useServerTime'
import { Timer } from '../components/Timer'
import { playCorrect, playRoundStart, playWrong } from '../utils/sounds'
import type { GameId, Player } from '../types'

type AnswerConfig<T> =
  | { type: 'text'; check: (item: T, input: string) => boolean }
  | {
      type: 'choice'
      options: (item: T) => string[]
      isCorrect: (item: T, opt: string) => boolean
    }

export interface RoundGameConfig<T> {
  gameId: GameId
  items: T[]
  perRoundSeconds: number
  prompt: (item: T) => ReactNode
  correctText: (item: T) => string
  answer: AnswerConfig<T>
}

interface RoundData {
  order: number[]
  index: number
  phase: 'play' | 'reveal'
  deadline: number
}

interface Props<T> {
  sessionId: string
  playerId: string
  round: number
  numRounds: number
  isHost?: boolean
  players?: Player[]
  cfg: RoundGameConfig<T>
}

export function RoundGame<T>({
  sessionId,
  playerId,
  round,
  numRounds,
  isHost,
  players = [],
  cfg,
}: Props<T>) {
  const key = `${cfg.gameId}_${round}`
  const game = useGameState(sessionId, key)
  const serverNow = useServerTime()
  const rd = game.roundData as unknown as RoundData | undefined

  // ----- Host: initialise the round order once -----
  const initRef = useRef(false)
  useEffect(() => {
    if (!isHost || initRef.current || game.loading) return
    if (rd?.order) {
      initRef.current = true
      return
    }
    initRef.current = true
    const n = Math.min(numRounds, cfg.items.length)
    const order = [...cfg.items.keys()].sort(() => Math.random() - 0.5).slice(0, n)
    void update(ref(db, `sessions/${sessionId}/games/${key}`), {
      status: 'active',
      startedAt: serverTimestamp(),
      roundData: {
        order,
        index: 0,
        phase: 'play',
        deadline: serverNow() + cfg.perRoundSeconds * 1000,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, game.loading, rd])

  // ----- Host: drive phase transitions -----
  const gameRef = useRef(game)
  gameRef.current = game
  useEffect(() => {
    if (!isHost) return
    const id = setInterval(() => {
      const cur = gameRef.current.roundData as unknown as RoundData | undefined
      if (!cur?.order) return
      const now = serverNow()
      const path = `sessions/${sessionId}/games/${key}`
      const connected = players.filter((p) => p.connected)
      const answers = gameRef.current.roundScores?.[String(cur.index)] ?? {}
      const allAnswered =
        connected.length > 0 && connected.every((p) => answers[p.id])

      if (cur.phase === 'play' && (now >= cur.deadline || allAnswered)) {
        void update(ref(db, path), {
          'roundData/phase': 'reveal',
          'roundData/deadline': now + 3000,
        })
      } else if (cur.phase === 'reveal' && now >= cur.deadline) {
        if (cur.index + 1 < cur.order.length) {
          void update(ref(db, path), {
            'roundData/index': cur.index + 1,
            'roundData/phase': 'play',
            'roundData/deadline': now + cfg.perRoundSeconds * 1000,
          })
        } else {
          void update(ref(db, path), { status: 'done' })
        }
      }
    }, 300)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, players])

  if (game.loading || !rd?.order) {
    return (
      <div className="glass mx-auto mt-8 max-w-lg p-10 text-center text-xl">
        Loading round…
      </div>
    )
  }

  if (game.status === 'done') {
    return (
      <div className="glass mx-auto mt-8 max-w-lg p-10 text-center">
        <div className="text-4xl">✅</div>
        <h2 className="mt-3 text-2xl font-bold">All rounds done!</h2>
        <p className="mt-2 text-sm text-slate-400">Waiting for the reveal…</p>
      </div>
    )
  }

  const item = cfg.items[rd.order[rd.index]]
  const answers = game.roundScores?.[String(rd.index)] ?? {}

  return (
    <SubRound
      key={`${rd.index}-${rd.phase}`}
      sessionId={sessionId}
      playerId={playerId}
      gameKey={key}
      index={rd.index}
      total={rd.order.length}
      phase={rd.phase}
      deadline={rd.deadline}
      perRoundSeconds={cfg.perRoundSeconds}
      item={item}
      cfg={cfg}
      answers={answers as Record<string, { ts: number; correct: boolean }>}
      players={players}
      isHost={isHost}
    />
  )
}

function SubRound<T>({
  sessionId,
  playerId,
  gameKey,
  index,
  total,
  phase,
  deadline,
  perRoundSeconds,
  item,
  cfg,
  answers,
  players,
  isHost,
}: {
  sessionId: string
  playerId: string
  gameKey: string
  index: number
  total: number
  phase: 'play' | 'reveal'
  deadline: number
  perRoundSeconds: number
  item: T
  cfg: RoundGameConfig<T>
  answers: Record<string, { ts: number; correct: boolean }>
  players: Player[]
  isHost?: boolean
}) {
  const serverNow = useServerTime()
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [])
  const secondsLeft = Math.max(0, Math.ceil((deadline - serverNow()) / 1000))

  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const mine = answers[playerId]
  const answered = !!mine

  // Round-start chime for players when a new play phase begins.
  useEffect(() => {
    if (phase === 'play' && !isHost) playRoundStart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function record(correct: boolean) {
    void set(
      ref(
        db,
        `sessions/${sessionId}/games/${gameKey}/roundScores/${index}/${playerId}`,
      ),
      { ts: serverTimestamp(), correct },
    )
  }

  function submitText() {
    if (answered || phase !== 'play' || cfg.answer.type !== 'text') return
    if (cfg.answer.check(item, input)) {
      record(true)
      playCorrect()
    } else {
      setShake(true)
      playWrong()
      setTimeout(() => setShake(false), 400)
    }
    setInput('')
  }

  function pickChoice(opt: string) {
    if (answered || phase !== 'play' || cfg.answer.type !== 'choice') return
    const correct = cfg.answer.isCorrect(item, opt)
    record(correct)
    correct ? playCorrect() : playWrong()
  }

  const winnerId = useMemo(() => {
    const correct = Object.entries(answers)
      .filter(([, a]) => a.correct)
      .sort((a, b) => (a[1].ts ?? 0) - (b[1].ts ?? 0))
    return correct[0]?.[0]
  }, [answers])
  const winnerName = players.find((p) => p.id === winnerId)?.name

  return (
    <div className="mx-auto mt-6 max-w-xl">
      <div className="mb-2 text-center text-sm text-slate-400">
        Round {index + 1} / {total}
      </div>
      <Timer seconds={secondsLeft} total={phase === 'play' ? perRoundSeconds : 3} />

      <motion.div
        animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="glass mt-6 p-8 text-center"
      >
        <div className="mb-6 text-4xl font-bold break-words">
          {cfg.prompt(item)}
        </div>

        <AnimatePresence mode="wait">
          {phase === 'reveal' ? (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="text-sm text-slate-400">Answer</div>
              <div className="text-2xl font-black text-cyan-accent">
                {cfg.correctText(item)}
              </div>
              <div className="text-sm text-slate-300">
                {winnerName ? (
                  <>
                    🥇 First: <span className="font-semibold">{winnerName}</span>
                  </>
                ) : (
                  'No one got it'
                )}
              </div>
            </motion.div>
          ) : isHost ? (
            <motion.div key="host" className="text-sm text-slate-400">
              {Object.values(answers).filter((a) => a.correct).length} correct so
              far · {Object.keys(answers).length} answered
            </motion.div>
          ) : answered ? (
            <motion.div
              key="answered"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-lg font-bold ${mine?.correct ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {mine?.correct ? '✅ Locked in!' : '❌ Better luck next round'}
            </motion.div>
          ) : cfg.answer.type === 'text' ? (
            <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitText()}
                placeholder="Type your answer"
                className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-lg outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/40"
              />
              <button
                onClick={submitText}
                className="mt-3 block w-full max-w-xs mx-auto rounded-xl bg-magenta px-4 py-2 font-semibold shadow-glow hover:bg-magenta-bright"
              >
                Submit
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="choice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-3"
            >
              {cfg.answer.type === 'choice' &&
                cfg.answer.options(item).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => pickChoice(opt)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-lg font-semibold transition hover:border-magenta hover:bg-white/10"
                  >
                    {opt}
                  </button>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
