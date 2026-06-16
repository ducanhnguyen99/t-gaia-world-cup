import { motion } from 'framer-motion'

interface TimerProps {
  seconds: number
  total: number
}

/** Circular-ish countdown bar; turns magenta and pulses in the final 5s. */
export function Timer({ seconds, total }: TimerProps) {
  const pct = total > 0 ? Math.max(0, Math.min(1, seconds / total)) : 0
  const urgent = seconds <= 5 && seconds > 0

  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="mb-1 flex items-center justify-center gap-2">
        <motion.span
          key={seconds}
          initial={{ scale: urgent ? 1.4 : 1, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`font-mono text-3xl font-black tabular-nums ${
            urgent ? 'text-magenta-bright' : 'text-cyan-accent'
          }`}
        >
          {seconds}
        </motion.span>
        <span className="text-sm text-slate-400">s</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${
            urgent ? 'bg-magenta-bright' : 'bg-cyan-accent'
          }`}
          animate={{ width: `${pct * 100}%` }}
          transition={{ ease: 'linear', duration: 0.25 }}
        />
      </div>
    </div>
  )
}
