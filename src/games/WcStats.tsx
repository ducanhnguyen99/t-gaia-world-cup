import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ref, serverTimestamp, set, update } from 'firebase/database'
import { db } from '../firebase-config'
import { useGameState } from '../hooks/useGameState'
import { useCountdown, useServerTime } from '../hooks/useServerTime'
import { Timer } from '../components/Timer'
import { GameIntro } from '../components/GameIntro'
import { playCorrect, playRoundStart } from '../utils/sounds'
import questionsData from '../data/wc-stats-questions.json'
import { INTRO_MS, type GameComponentProps } from './types'

interface StatQuestion {
  question: string
  answer: number
  unit: string
}

interface RoundData {
  order: number[]
  index: number
  phase: 'play' | 'reveal'
  deadline: number
  startsAt?: number
}

const QUESTIONS = questionsData as StatQuestion[]
const PER_ROUND = 20

export function WcStats({
  sessionId,
  playerId,
  round,
  config,
  isHost,
  players = [],
}: GameComponentProps) {
  const key = `wcStats_${round}`
  const game = useGameState(sessionId, key)
  const serverNow = useServerTime()
  const rd = game.roundData as unknown as RoundData | undefined
  const introLeft = useCountdown(
    rd?.index === 0 ? (rd?.startsAt ?? null) : null,
  )

  // Host: init order once.
  const initRef = useRef(false)
  useEffect(() => {
    if (!isHost || initRef.current || game.loading) return
    if (rd?.order) {
      initRef.current = true
      return
    }
    initRef.current = true
    const n = Math.min(config.rounds, QUESTIONS.length)
    const order = [...QUESTIONS.keys()].sort(() => Math.random() - 0.5).slice(0, n)
    const startsAt = serverNow() + INTRO_MS
    void update(ref(db, `sessions/${sessionId}/games/${key}`), {
      status: 'active',
      startedAt: serverTimestamp(),
      roundData: {
        order,
        index: 0,
        phase: 'play',
        startsAt,
        deadline: startsAt + PER_ROUND * 1000,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, game.loading, rd])

  // Host: drive transitions.
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
          'roundData/deadline': now + 4000,
        })
      } else if (cur.phase === 'reveal' && now >= cur.deadline) {
        if (cur.index + 1 < cur.order.length) {
          void update(ref(db, path), {
            'roundData/index': cur.index + 1,
            'roundData/phase': 'play',
            'roundData/deadline': now + PER_ROUND * 1000,
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
    return <Card>Loading…</Card>
  }
  if (game.status === 'done') {
    return (
      <Card>
        <div className="text-4xl">✅</div>
        <h2 className="mt-3 text-2xl font-bold">All questions done!</h2>
        <p className="mt-2 text-sm text-slate-400">Waiting for the reveal…</p>
      </Card>
    )
  }

  if (rd.index === 0 && introLeft > 0) {
    return <GameIntro gameId="wcStats" secondsLeft={introLeft} />
  }

  const q = QUESTIONS[rd.order[rd.index]]
  const answers = (game.roundScores?.[String(rd.index)] ?? {}) as Record<
    string,
    { value: number; ts: number }
  >

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
      q={q}
      answers={answers}
      players={players}
      isHost={isHost}
    />
  )
}

function SubRound({
  sessionId,
  playerId,
  gameKey,
  index,
  total,
  phase,
  deadline,
  q,
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
  q: StatQuestion
  answers: Record<string, { value: number; ts: number }>
  players: { id: string; name: string }[]
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
  const mine = answers[playerId]
  const answered = !!mine

  useEffect(() => {
    if (phase === 'play' && !isHost) playRoundStart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function submit() {
    if (answered || phase !== 'play') return
    if (input.trim() === '') return
    void set(
      ref(
        db,
        `sessions/${sessionId}/games/${gameKey}/roundScores/${index}/${playerId}`,
      ),
      { value: Number(input.trim()), ts: serverTimestamp() },
    )
    playCorrect()
  }

  const closest = Object.entries(answers)
    .map(([id, a]) => ({ id, dev: Math.abs(a.value - q.answer), value: a.value }))
    .sort((a, b) => a.dev - b.dev)[0]
  const closestName = players.find((p) => p.id === closest?.id)?.name

  return (
    <div className="mx-auto mt-6 max-w-xl">
      <div className="mb-2 text-center text-sm text-slate-400">
        Question {index + 1} / {total}
      </div>
      <Timer seconds={secondsLeft} total={phase === 'play' ? PER_ROUND : 4} />

      <div className="glass mt-6 p-8 text-center">
        <div className="mb-6 text-xl font-semibold">{q.question}</div>

        <AnimatePresence mode="wait">
          {phase === 'reveal' ? (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="text-sm text-slate-400">Correct answer</div>
              <div className="text-3xl font-black text-cyan-accent">
                {q.answer.toLocaleString()} {q.unit}
              </div>
              {mine && (
                <div className="text-sm text-slate-300">
                  Your guess: {mine.value.toLocaleString()} (off by{' '}
                  {Math.abs(mine.value - q.answer).toLocaleString()})
                </div>
              )}
              {closestName && (
                <div className="text-sm">
                  🎯 Closest:{' '}
                  <span className="font-semibold">{closestName}</span> (
                  {closest!.value.toLocaleString()})
                </div>
              )}
            </motion.div>
          ) : isHost ? (
            <div className="text-sm text-slate-400">
              {Object.keys(answers).length} answered
            </div>
          ) : answered ? (
            <div className="text-lg font-bold text-emerald-400">
              ✅ Guess submitted: {mine!.value.toLocaleString()}
            </div>
          ) : (
            <div>
              <input
                autoFocus
                value={input}
                inputMode="numeric"
                onChange={(e) => setInput(e.target.value.replace(/[^\d-]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder={`Number of ${q.unit}`}
                className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xl outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/40"
              />
              <button
                onClick={submit}
                className="mx-auto mt-3 block w-full max-w-xs rounded-xl bg-magenta px-4 py-2 font-semibold shadow-glow hover:bg-magenta-bright"
              >
                Submit guess
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass mx-auto mt-8 max-w-lg p-10 text-center text-xl">
      {children}
    </div>
  )
}
