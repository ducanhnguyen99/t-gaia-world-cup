import { motion } from 'framer-motion'
import type { GameId } from '../types'
import { GAME_BY_ID } from '../utils/games'

/** Pre-game buffer: game name, how-to, and a big "starting in N" countdown. */
export function GameIntro({
  gameId,
  secondsLeft,
}: {
  gameId: GameId
  secondsLeft: number
}) {
  const meta = GAME_BY_ID[gameId]
  return (
    <div className="mx-auto mt-6 max-w-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 text-center"
      >
        <div className="text-6xl">{meta.icon}</div>
        <h2 className="mt-3 text-2xl font-black">{meta.name}</h2>
        <p className="mx-auto mt-3 max-w-md text-slate-300">{meta.howTo}</p>

        <div className="mt-7 text-sm tracking-wide text-slate-400 uppercase">
          Starting in
        </div>
        <motion.div
          key={secondsLeft}
          initial={{ scale: 1.5, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-mono text-6xl font-black text-magenta-bright"
        >
          {Math.max(1, secondsLeft)}
        </motion.div>
      </motion.div>
    </div>
  )
}
