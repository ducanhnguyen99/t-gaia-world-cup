// Programmatic sound effects via the Web Audio API — no audio files needed.

let ctx: AudioContext | null = null

function audio(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    ctx = new Ctor()
  }
  // Browsers suspend the context until a user gesture occurs.
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.18,
) {
  const ac = audio()
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = ac.currentTime + start
  env.gain.setValueAtTime(0.0001, t0)
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(env).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

export function playCorrect() {
  tone(440, 0, 0.12)
  tone(880, 0.1, 0.16)
}

export function playWrong() {
  tone(150, 0, 0.2, 'square', 0.14)
}

export function playCountdown(step = 0) {
  // Rising pitch for 3, 2, 1.
  tone(440 + step * 120, 0, 0.15, 'sine', 0.16)
}

export function playRoundStart() {
  tone(330, 0, 0.1)
  tone(495, 0.08, 0.1)
  tone(660, 0.16, 0.14)
}

export function playReveal() {
  // Rapid alternating drumroll-ish tones.
  for (let i = 0; i < 10; i++) {
    tone(i % 2 ? 380 : 300, i * 0.06, 0.06, 'triangle', 0.1)
  }
}

export function playFanfare() {
  // C - E - G - C arpeggio.
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((n, i) => tone(n, i * 0.14, 0.4, 'sawtooth', 0.14))
}
