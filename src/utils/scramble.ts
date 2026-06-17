// Small seeded PRNG (mulberry32) so the scramble is identical for every player
// and stable across re-renders.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Deterministically shuffle an array, seeded by a string. Same array + seed →
 * same order for every client (so e.g. multiple-choice options aren't always
 * in the same position, but everyone sees an identical layout).
 */
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const rng = mulberry32(hash(seed))
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Deterministically scramble a word's letters (seeded by the word), guaranteeing
 * the result differs from the original. Same input → same output for everyone.
 */
export function scramble(word: string): string {
  const chars = word.split('')
  if (new Set(chars).size <= 1) return word // can't scramble (all same letter)
  let out = word
  let salt = 0
  while (out === word && salt < 50) {
    const rng = mulberry32(hash(word) + salt * 2654435761)
    const a = [...chars]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    out = a.join('')
    salt++
  }
  return out
}

export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Scramble only the *middle* letters of each word, keeping the first and last
 * letter in place (typoglycemia style) so it stays readable. Works on single
 * words and whole sentences. Deterministic (seeded by the text).
 */
export function scrambleReadable(text: string): string {
  let salt = 0
  let out = text
  while (out === text && salt < 30) {
    const rng = mulberry32(hash(text) + salt * 40503)
    out = text
      .split(/(\s+)/) // keep whitespace tokens
      .map((token) => {
        if (token.length <= 3 || /\s/.test(token)) return token
        const first = token[0]
        const last = token[token.length - 1]
        const mid = token.slice(1, -1).split('')
        for (let i = mid.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1))
          ;[mid[i], mid[j]] = [mid[j], mid[i]]
        }
        return first + mid.join('') + last
      })
      .join('')
    salt++
  }
  return out
}
