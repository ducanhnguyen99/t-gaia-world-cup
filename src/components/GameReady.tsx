import { motion } from 'framer-motion'
import type { GameId } from '../types'
import { GAME_BY_ID } from '../utils/games'

/** Shown after a game is armed but before the host presses Begin. */
export function GameReady({ gameId }: { gameId: GameId }) {
  const meta = GAME_BY_ID[gameId]
  return (
    <div className="mx-auto mt-6 max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 text-center"
      >
        <div className="text-6xl">{meta.icon}</div>
        <h2 className="mt-3 text-2xl font-black">{meta.name}</h2>
        <p className="mx-auto mt-3 max-w-md text-slate-300">{meta.howTo}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-magenta-bright" />
          Waiting for the host to begin…
        </div>
      </motion.div>
    </div>
  )
}
