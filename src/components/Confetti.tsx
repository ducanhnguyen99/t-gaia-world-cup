import { useEffect, useRef } from 'react'

interface ConfettiProps {
  /** Bumping this key re-fires the burst. */
  fireKey?: string | number
  duration?: number
}

const COLORS = ['#e20074', '#22d3ee', '#facc15', '#a3e635', '#c084fc']

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  size: number
  color: string
}

/** Lightweight canvas confetti burst — magenta/cyan/gold, no dependencies. */
export function Confetti({ fireKey = 0, duration = 2800 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const W = window.innerWidth
    const H = window.innerHeight
    const count = 160
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.4,
      y: H * 0.3 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -14 - 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 8 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)
      const fade = Math.max(0, 1 - elapsed / duration)
      for (const p of particles) {
        p.vy += 0.4 // gravity
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.rot += p.vr
        ctx.globalAlpha = fade
        ctx.fillStyle = p.color
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }
      ctx.restore()
      if (elapsed < duration) {
        raf = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [fireKey, duration])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
