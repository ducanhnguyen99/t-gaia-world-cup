import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { onValue, ref, serverTimestamp, set, update } from 'firebase/database'
import { db } from '../firebase-config'
import { useServerTime } from '../hooks/useServerTime'
import { Timer } from '../components/Timer'
import { GameIntro } from '../components/GameIntro'
import { playCorrect, playRoundStart } from '../utils/sounds'
import { seededShuffle } from '../utils/scramble'
import prompts from '../data/best-answer-prompts.json'
import { INTRO_MS, type GameComponentProps } from './types'

const PROMPTS = prompts as string[]
const SUBMIT_MS = 35000
const VOTE_MS = 25000
const REVEAL_MS = 8000

type Phase = 'submit' | 'vote' | 'reveal'
interface RoundData {
  order: number[]
  index: number
  phase: Phase
  deadline: number
  startsAt?: number
}
interface Node {
  status?: string
  roundData?: RoundData
  submissions?: Record<string, Record<string, { text: string }>>
  votes?: Record<string, Record<string, string>>
}

export function BestAnswer({
  sessionId,
  playerId,
  round,
  config,
  isHost,
  players = [],
}: GameComponentProps) {
  const key = `bestAnswer_${round}`
  const serverNow = useServerTime()
  const [node, setNode] = useState<Node>({})
  const [, tick] = useState(0)

  useEffect(() => {
    const r = ref(db, `sessions/${sessionId}/games/${key}`)
    return onValue(r, (s) => setNode(s.val() ?? {}))
  }, [sessionId, key])
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [])

  const rd = node.roundData
  const nodeRef = useRef(node)
  nodeRef.current = node

  // Host: init order once.
  const initRef = useRef(false)
  useEffect(() => {
    if (!isHost || initRef.current) return
    if (rd?.order) {
      initRef.current = true
      return
    }
    initRef.current = true
    const n = Math.min(config.rounds, PROMPTS.length)
    const order = [...PROMPTS.keys()].sort(() => Math.random() - 0.5).slice(0, n)
    const startsAt = serverNow() + INTRO_MS
    void update(ref(db, `sessions/${sessionId}/games/${key}`), {
      status: 'active',
      startedAt: serverTimestamp(),
      roundData: {
        order,
        index: 0,
        phase: 'submit',
        startsAt,
        deadline: startsAt + SUBMIT_MS,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, rd])

  // Host: drive phase transitions.
  useEffect(() => {
    if (!isHost) return
    const id = setInterval(() => {
      const cur = nodeRef.current.roundData
      if (!cur?.order) return
      const now = serverNow()
      const path = `sessions/${sessionId}/games/${key}`
      const connected = players.filter((p) => p.connected)
      const idx = String(cur.index)
      const subs = nodeRef.current.submissions?.[idx] ?? {}
      const votes = nodeRef.current.votes?.[idx] ?? {}
      const allSubmitted =
        connected.length > 0 && connected.every((p) => subs[p.id])
      // Everyone who isn't the sole author can vote.
      const voters = connected.filter((p) => Object.keys(subs).some((a) => a !== p.id))
      const allVoted = voters.length > 0 && voters.every((p) => votes[p.id])

      if (cur.phase === 'submit' && (now >= cur.deadline || allSubmitted)) {
        void update(ref(db, path), {
          'roundData/phase': 'vote',
          'roundData/deadline': now + VOTE_MS,
        })
      } else if (cur.phase === 'vote' && (now >= cur.deadline || allVoted)) {
        void update(ref(db, path), {
          'roundData/phase': 'reveal',
          'roundData/deadline': now + REVEAL_MS,
        })
      } else if (cur.phase === 'reveal' && now >= cur.deadline) {
        if (cur.index + 1 < cur.order.length) {
          void update(ref(db, path), {
            'roundData/index': cur.index + 1,
            'roundData/phase': 'submit',
            'roundData/deadline': now + SUBMIT_MS,
          })
        } else {
          void update(ref(db, path), { status: 'done' })
        }
      }
    }, 400)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, players])

  if (!rd?.order) {
    return <Card>Loading…</Card>
  }
  if (node.status === 'done') {
    return (
      <Card>
        <div className="text-4xl">✅</div>
        <h2 className="mt-3 text-2xl font-bold">That's a wrap!</h2>
        <p className="mt-2 text-sm text-slate-400">Waiting for the reveal…</p>
      </Card>
    )
  }

  const introLeft =
    rd.index === 0 && rd.startsAt
      ? Math.max(0, Math.ceil((rd.startsAt - serverNow()) / 1000))
      : 0
  if (introLeft > 0) {
    return <GameIntro gameId="bestAnswer" secondsLeft={introLeft} />
  }

  const promptText = PROMPTS[rd.order[rd.index]]
  const idx = String(rd.index)
  const subs = node.submissions?.[idx] ?? {}
  const votes = node.votes?.[idx] ?? {}
  const total =
    rd.phase === 'submit' ? SUBMIT_MS / 1000 : rd.phase === 'vote' ? VOTE_MS / 1000 : REVEAL_MS / 1000
  const secondsLeft = Math.max(0, Math.ceil((rd.deadline - serverNow()) / 1000))

  return (
    <div className="mx-auto mt-6 max-w-xl">
      <div className="mb-2 text-center text-sm text-slate-400">
        Prompt {rd.index + 1} / {rd.order.length} ·{' '}
        <span className="text-cyan-accent capitalize">{rd.phase}</span>
      </div>
      <Timer seconds={secondsLeft} total={total} />

      <div className="glass mt-6 p-6">
        <div className="mb-5 text-center text-xl font-bold">“{promptText}”</div>

        <AnimatePresence mode="wait">
          {rd.phase === 'submit' && (
            <SubmitPhase
              key="submit"
              sessionId={sessionId}
              gameKey={key}
              index={rd.index}
              playerId={playerId}
              already={subs[playerId]?.text}
              isHost={isHost}
              submittedCount={Object.keys(subs).length}
            />
          )}
          {rd.phase === 'vote' && (
            <VotePhase
              key="vote"
              sessionId={sessionId}
              gameKey={key}
              index={rd.index}
              playerId={playerId}
              subs={subs}
              myVote={votes[playerId]}
              isHost={isHost}
              voteCount={Object.keys(votes).length}
            />
          )}
          {rd.phase === 'reveal' && (
            <RevealPhase key="reveal" subs={subs} votes={votes} players={players} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function SubmitPhase({
  sessionId,
  gameKey,
  index,
  playerId,
  already,
  isHost,
  submittedCount,
}: {
  sessionId: string
  gameKey: string
  index: number
  playerId: string
  already?: string
  isHost?: boolean
  submittedCount: number
}) {
  const [text, setText] = useState('')
  useEffect(() => {
    playRoundStart()
  }, [])
  if (isHost) {
    return (
      <p className="text-center text-sm text-slate-400">
        {submittedCount} answer{submittedCount === 1 ? '' : 's'} submitted…
      </p>
    )
  }
  if (already) {
    return (
      <div className="text-center text-emerald-400">
        ✅ Submitted: <span className="italic">“{already}”</span>
      </div>
    )
  }
  function submit() {
    const t = text.trim()
    if (!t) return
    void set(
      ref(db, `sessions/${sessionId}/games/${gameKey}/submissions/${index}/${playerId}`),
      { text: t.slice(0, 120) },
    )
    playCorrect()
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        maxLength={120}
        placeholder="Your funniest answer…"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-lg outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/40"
      />
      <button
        onClick={submit}
        className="mx-auto mt-3 block rounded-xl bg-magenta px-6 py-2 font-semibold shadow-glow hover:bg-magenta-bright"
      >
        Submit
      </button>
    </motion.div>
  )
}

function VotePhase({
  sessionId,
  gameKey,
  index,
  playerId,
  subs,
  myVote,
  isHost,
  voteCount,
}: {
  sessionId: string
  gameKey: string
  index: number
  playerId: string
  subs: Record<string, { text: string }>
  myVote?: string
  isHost?: boolean
  voteCount: number
}) {
  // Shuffle the options stably for this voter.
  const options = useMemo(
    () =>
      seededShuffle(
        Object.entries(subs).filter(([author]) => author !== playerId),
        playerId + index,
      ),
    [subs, playerId, index],
  )

  if (isHost) {
    return (
      <p className="text-center text-sm text-slate-400">
        {voteCount} vote{voteCount === 1 ? '' : 's'} in…
      </p>
    )
  }
  if (options.length === 0) {
    return (
      <p className="text-center text-sm text-slate-400">
        No other answers to vote on this round.
      </p>
    )
  }
  function vote(author: string) {
    if (myVote) return
    void set(
      ref(db, `sessions/${sessionId}/games/${gameKey}/votes/${index}/${playerId}`),
      author,
    )
    playCorrect()
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
      <p className="mb-2 text-center text-sm text-slate-400">
        {myVote ? 'Vote locked in ✅' : 'Tap your favourite'}
      </p>
      {options.map(([author, sub]) => (
        <button
          key={author}
          disabled={!!myVote}
          onClick={() => vote(author)}
          className={`w-full rounded-xl border px-4 py-3 text-left transition ${
            myVote === author
              ? 'border-magenta bg-magenta/20'
              : 'border-white/10 bg-white/5 hover:border-magenta hover:bg-white/10'
          } ${myVote && myVote !== author ? 'opacity-50' : ''}`}
        >
          {sub.text}
        </button>
      ))}
    </motion.div>
  )
}

function RevealPhase({
  subs,
  votes,
  players,
}: {
  subs: Record<string, { text: string }>
  votes: Record<string, string>
  players: { id: string; name: string }[]
}) {
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? '—'
  const tally = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const author of Object.values(votes)) {
      counts[author] = (counts[author] ?? 0) + 1
    }
    return Object.entries(subs)
      .map(([author, sub]) => ({ author, text: sub.text, votes: counts[author] ?? 0 }))
      .sort((a, b) => b.votes - a.votes)
  }, [subs, votes])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      {tally.length === 0 && (
        <p className="text-center text-sm text-slate-400">No answers this round.</p>
      )}
      {tally.map((t, i) => (
        <div
          key={t.author}
          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
            i === 0 && t.votes > 0
              ? 'border-yellow-400/50 bg-yellow-400/10'
              : 'border-white/10 bg-white/5'
          }`}
        >
          <span className="flex-1">
            <span className="font-semibold">{t.text}</span>
            <span className="ml-2 text-xs text-slate-400">— {nameOf(t.author)}</span>
          </span>
          <span className="font-mono text-cyan-accent">
            {t.votes} {i === 0 && t.votes > 0 ? '👑' : ''}
          </span>
        </div>
      ))}
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
