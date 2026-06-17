import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ref, serverTimestamp, update } from 'firebase/database'
import { db } from '../firebase-config'
import { useGameState } from '../hooks/useGameState'
import { useServerTime } from '../hooks/useServerTime'
import { Timer } from '../components/Timer'
import { GameIntro } from '../components/GameIntro'
import { playCorrect, playRoundStart } from '../utils/sounds'
import { seededShuffle } from '../utils/scramble'
import questions from '../data/scale-questions.json'
import { INTRO_MS, type GameComponentProps } from './types'

const QUESTIONS = questions as string[]
const GUESS_MS = 90000
const MAX = 10

interface RoundData {
  secret: number
  guesserId: string
  questions: string[]
  phase: 'guess' | 'reveal'
  guess?: number
  startsAt?: number
  deadline: number
}

/** Closeness → points (used by both the reveal and the admin scoring). */
export function scalePoints(guess: number | undefined, secret: number): number {
  if (guess == null) return 0
  const d = Math.abs(guess - secret)
  return [10, 7, 5, 3, 2][d] ?? 1
}

export function OnAScale({
  sessionId,
  playerId,
  round,
  isHost,
  players = [],
}: GameComponentProps) {
  const key = `onAScale_${round}`
  const game = useGameState(sessionId, key)
  const serverNow = useServerTime()
  const rd = game.roundData as unknown as RoundData | undefined
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [])

  // Host: init once (pick secret, guesser, questions).
  const initRef = useRef(false)
  useEffect(() => {
    if (!isHost || initRef.current || game.loading) return
    if (rd?.guesserId) {
      initRef.current = true
      return
    }
    initRef.current = true
    const connected = players.filter((p) => p.connected)
    const pool = connected.length ? connected : players
    if (pool.length === 0) return
    const guesser = pool[(round - 1) % pool.length]
    const secret = 1 + Math.floor(Math.random() * MAX)
    const qs = seededShuffle(QUESTIONS, `${key}`).slice(0, 4)
    const startsAt = serverNow() + INTRO_MS
    void update(ref(db, `sessions/${sessionId}/games/${key}`), {
      status: 'active',
      startedAt: serverTimestamp(),
      roundData: {
        secret,
        guesserId: guesser.id,
        questions: qs,
        phase: 'guess',
        startsAt,
        deadline: startsAt + GUESS_MS,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, game.loading, rd, players])

  // Host: time out the guess phase.
  const gameRef = useRef(game)
  gameRef.current = game
  useEffect(() => {
    if (!isHost) return
    const id = setInterval(() => {
      const cur = gameRef.current.roundData as unknown as RoundData | undefined
      if (!cur?.guesserId) return
      if (cur.phase === 'guess' && serverNow() >= cur.deadline) {
        void update(ref(db, `sessions/${sessionId}/games/${key}/roundData`), {
          phase: 'reveal',
        })
      }
    }, 400)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost])

  if (game.loading || !rd?.guesserId) return <Card>Loading…</Card>

  const introLeft =
    rd.startsAt && rd.phase === 'guess'
      ? Math.max(0, Math.ceil((rd.startsAt - serverNow()) / 1000))
      : 0
  if (introLeft > 0) return <GameIntro gameId="onAScale" secondsLeft={introLeft} />

  const guesserName = players.find((p) => p.id === rd.guesserId)?.name ?? 'Someone'
  const isGuesser = playerId === rd.guesserId
  const secondsLeft = Math.max(0, Math.ceil((rd.deadline - serverNow()) / 1000))

  if (rd.phase === 'reveal') {
    return (
      <Reveal
        secret={rd.secret}
        guess={rd.guess}
        guesserName={guesserName}
      />
    )
  }

  return (
    <div className="mx-auto mt-6 max-w-xl">
      <Timer seconds={secondsLeft} total={GUESS_MS / 1000} />
      <div className="glass mt-6 p-6">
        {isHost ? (
          <HostView rd={rd} guesserName={guesserName} />
        ) : isGuesser ? (
          <GuesserView sessionId={sessionId} gameKey={key} rd={rd} />
        ) : (
          <HinterView secret={rd.secret} guesserName={guesserName} questions={rd.questions} />
        )}
      </div>
    </div>
  )
}

function GuesserView({
  sessionId,
  gameKey,
  rd,
}: {
  sessionId: string
  gameKey: string
  rd: RoundData
}) {
  const [val, setVal] = useState(5)
  useEffect(() => {
    playRoundStart()
  }, [])
  function submit() {
    void update(ref(db, `sessions/${sessionId}/games/${gameKey}/roundData`), {
      phase: 'reveal',
      guess: val,
    })
    playCorrect()
  }
  return (
    <div className="text-center">
      <div className="text-3xl">🎯</div>
      <h3 className="mt-2 text-xl font-bold">You're the guesser!</h3>
      <p className="mt-2 text-sm text-slate-300">
        Ask people these questions out loud — they'll answer with hints at the
        secret number (1–10). Then lock in your guess.
      </p>
      <ul className="mx-auto mt-4 max-w-sm space-y-1 text-left text-sm text-slate-300">
        {rd.questions.map((q, i) => (
          <li key={i} className="rounded-lg bg-white/5 px-3 py-2">
            💬 {q}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <div className="mb-1 font-mono text-4xl font-black text-cyan-accent">
          {val}
        </div>
        <input
          type="range"
          min={1}
          max={MAX}
          value={val}
          onChange={(e) => setVal(Number(e.target.value))}
          className="w-full accent-magenta"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>1</span>
          <span>10</span>
        </div>
      </div>
      <button
        onClick={submit}
        className="mt-5 rounded-xl bg-magenta px-6 py-2.5 font-bold shadow-glow hover:bg-magenta-bright"
      >
        Lock in {val}
      </button>
    </div>
  )
}

function HinterView({
  secret,
  guesserName,
  questions,
}: {
  secret: number
  guesserName: string
  questions: string[]
}) {
  return (
    <div className="text-center">
      <div className="text-sm tracking-wide text-slate-400 uppercase">
        The secret number is
      </div>
      <div className="my-2 font-mono text-6xl font-black text-magenta-bright">
        {secret}
      </div>
      <p className="text-sm text-slate-300">
        🤫 Don't say it! When <span className="font-semibold">{guesserName}</span>{' '}
        asks you a question, answer with a hint that feels like a{' '}
        <span className="font-semibold">{secret}/10</span>.
      </p>
      <ul className="mx-auto mt-4 max-w-sm space-y-1 text-left text-xs text-slate-400">
        {questions.map((q, i) => (
          <li key={i}>💬 {q}</li>
        ))}
      </ul>
    </div>
  )
}

function HostView({ rd, guesserName }: { rd: RoundData; guesserName: string }) {
  return (
    <div className="text-center">
      <p className="text-sm text-slate-400">Guesser</p>
      <p className="text-xl font-bold">{guesserName}</p>
      <p className="mt-3 text-sm text-slate-400">Secret number</p>
      <p className="font-mono text-4xl font-black text-magenta-bright">
        {rd.secret}
      </p>
      <p className="mt-3 text-xs text-slate-500">
        {rd.guess != null ? `Guessed ${rd.guess}` : 'Waiting for the guess…'}
      </p>
    </div>
  )
}

function Reveal({
  secret,
  guess,
  guesserName,
}: {
  secret: number
  guess?: number
  guesserName: string
}) {
  const pts = scalePoints(guess, secret)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass mx-auto mt-8 max-w-lg p-8 text-center"
    >
      <div className="text-4xl">🎯</div>
      <h3 className="mt-2 text-xl font-bold">{guesserName}'s guess</h3>
      <div className="mt-4 flex items-center justify-center gap-8">
        <div>
          <div className="text-xs text-slate-400">Guessed</div>
          <div className="font-mono text-4xl font-black text-cyan-accent">
            {guess ?? '—'}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Secret</div>
          <div className="font-mono text-4xl font-black text-magenta-bright">
            {secret}
          </div>
        </div>
      </div>
      <p className="mt-4 text-lg font-semibold">
        {guess == null
          ? 'No guess in time!'
          : guess === secret
            ? '🎉 Spot on!'
            : `Off by ${Math.abs(guess - secret)}`}{' '}
        — <span className="text-cyan-accent">+{pts}</span>
      </p>
      <p className="mt-3 text-sm text-slate-400">Waiting for the host…</p>
    </motion.div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass mx-auto mt-8 max-w-lg p-10 text-center text-xl">
      {children}
    </div>
  )
}
