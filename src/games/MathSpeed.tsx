import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ref, serverTimestamp, set } from 'firebase/database'
import { db } from '../firebase-config'
import { useGameState } from '../hooks/useGameState'
import { useCountdown } from '../hooks/useServerTime'
import { Timer } from '../components/Timer'
import { GameIntro } from '../components/GameIntro'
import { generateMathQuestion } from '../utils/mathQuestions'
import { playCorrect, playWrong } from '../utils/sounds'
import { INTRO_MS, type GameComponentProps } from './types'

export function MathSpeed({
  sessionId,
  playerId,
  round,
  config,
  isHost,
  players = [],
}: GameComponentProps) {
  const key = `mathSpeed_${round}`
  const game = useGameState(sessionId, key)
  const total = config.timer
  // The clock only starts after the intro buffer.
  const playStart = game.startedAt ? game.startedAt + INTRO_MS : null
  const deadline = playStart ? playStart + total * 1000 : null
  const introLeft = useCountdown(playStart)
  const secondsLeft = useCountdown(deadline)
  const finished = deadline != null && secondsLeft <= 0

  if (!game.startedAt) {
    return <Centered>⚡ Get ready…</Centered>
  }

  if (introLeft > 0) {
    return <GameIntro gameId="mathSpeed" secondsLeft={introLeft} />
  }

  if (isHost) {
    return (
      <HostDashboard
        secondsLeft={secondsLeft}
        total={total}
        scores={game.scores}
        players={players}
      />
    )
  }

  return (
    <PlayerView
      sessionId={sessionId}
      playerId={playerId}
      gameKey={key}
      secondsLeft={secondsLeft}
      total={total}
      finished={finished}
    />
  )
}

function PlayerView({
  sessionId,
  playerId,
  gameKey,
  secondsLeft,
  total,
  finished,
}: {
  sessionId: string
  playerId: string
  gameKey: string
  secondsLeft: number
  total: number
  finished: boolean
}) {
  const [question, setQuestion] = useState(generateMathQuestion)
  const [input, setInput] = useState('')
  const [solved, setSolved] = useState(0)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Persist the final (and running) score.
  const writeScore = (value: number) =>
    void set(ref(db, `sessions/${sessionId}/games/${gameKey}/scores/${playerId}`), {
      value,
      timestamp: serverTimestamp(),
    })

  function submit() {
    if (finished) return
    const val = Number(input.trim())
    if (input.trim() !== '' && val === question.answer) {
      const next = solved + 1
      setSolved(next)
      writeScore(next)
      setFlash('correct')
      playCorrect()
    } else {
      setFlash('wrong')
      playWrong()
    }
    setInput('')
    setQuestion(generateMathQuestion())
    setTimeout(() => setFlash(null), 250)
    inputRef.current?.focus()
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  if (finished) {
    return (
      <div className="glass mx-auto mt-8 max-w-lg p-10 text-center">
        <div className="text-5xl">🏁</div>
        <h2 className="mt-3 text-2xl font-bold">Time's up!</h2>
        <p className="mt-2 text-slate-300">
          You solved{' '}
          <span className="font-mono text-3xl font-black text-cyan-accent">
            {solved}
          </span>
        </p>
        <p className="mt-4 text-sm text-slate-400">Waiting for the reveal…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto mt-6 max-w-lg">
      <Timer seconds={secondsLeft} total={total} />
      <motion.div
        animate={
          flash === 'correct'
            ? { boxShadow: '0 0 0 2px rgba(52,211,153,0.8)' }
            : flash === 'wrong'
              ? { boxShadow: '0 0 0 2px rgba(244,63,94,0.8)' }
              : { boxShadow: '0 0 0 0px rgba(0,0,0,0)' }
        }
        transition={{ duration: 0.2 }}
        className="glass mt-6 p-8 text-center"
      >
        <div className="text-sm text-slate-400">
          Solved: <span className="font-bold text-cyan-accent">{solved}</span>
        </div>
        <div className="my-6 font-mono text-3xl font-bold tracking-wide">
          {question.display} = ?
        </div>
        <input
          ref={inputRef}
          value={input}
          inputMode="numeric"
          onChange={(e) => setInput(e.target.value.replace(/[^\d-]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Answer"
          className="w-40 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl font-bold outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/40"
        />
        <div className="mt-2 text-xs text-slate-500">Press Enter</div>
      </motion.div>
    </div>
  )
}

function HostDashboard({
  secondsLeft,
  total,
  scores,
  players,
}: {
  secondsLeft: number
  total: number
  scores: Record<string, { value: number }>
  players: { id: string; name: string }[]
}) {
  const rows = useMemo(() => {
    return players
      .map((p) => ({ name: p.name, value: scores[p.id]?.value ?? 0 }))
      .sort((a, b) => b.value - a.value)
  }, [players, scores])

  return (
    <div className="mx-auto max-w-lg">
      <Timer seconds={secondsLeft} total={total} />
      <div className="glass mt-6 p-5">
        <h3 className="mb-3 text-center text-sm font-semibold tracking-wide text-slate-300 uppercase">
          ⚡ Live — solved
        </h3>
        <ul className="space-y-1.5">
          <AnimatePresence>
            {rows.map((r, i) => (
              <motion.li
                layout
                key={r.name}
                className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2"
              >
                <span className="w-6 text-center text-sm text-slate-400">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{r.name}</span>
                <span className="font-mono text-lg font-bold text-cyan-accent">
                  {r.value}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass mx-auto mt-8 max-w-lg p-10 text-center text-2xl font-bold">
      {children}
    </div>
  )
}
