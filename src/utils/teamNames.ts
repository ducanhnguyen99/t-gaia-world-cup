// Funny auto-generated team names: football term + ML/tech term mashups.

const FOOTBALL = [
  'Strikers',
  'Goalkeepers',
  'Tacklers',
  'Defenders',
  'Offside',
  'Rangers',
  'United',
  'FC',
  'Penalty',
  'Midfielders',
  'Wingers',
  'Keepers',
  'Dribblers',
  'Champions',
]

const TECH = [
  'Neural',
  'Gradient',
  'Tensor',
  'Backprop',
  'Dropout',
  'Overfitting',
  'Random Forest',
  'Deep Learning',
  'Quantum',
  'Boolean',
  'Recursive',
  'Async',
  'Sigmoid',
  'Latent',
]

// A few hand-picked favourites that read especially well.
const CURATED = [
  'Neural Strikers',
  'Gradient Goalkeepers',
  'Tensor Tacklers',
  'Backprop United',
  'Dropout FC',
  'Overfitting Offside',
  'Random Forest Rangers',
  'Deep Learning Defenders',
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Generate `count` unique funny team names. */
export function generateTeamNames(count: number): string[] {
  const names = new Set<string>()
  // Seed with curated names first.
  for (const name of shuffle(CURATED)) {
    if (names.size >= count) break
    names.add(name)
  }
  // Fill the rest with random combinations.
  let guard = 0
  while (names.size < count && guard < 500) {
    guard++
    const tech = TECH[Math.floor(Math.random() * TECH.length)]
    const football = FOOTBALL[Math.floor(Math.random() * FOOTBALL.length)]
    names.add(`${tech} ${football}`)
  }
  return [...names].slice(0, count)
}

// Team colour palette (matches CSS theme tokens), assigned by team index.
export const TEAM_COLORS = [
  '#e20074', // magenta
  '#22d3ee', // cyan
  '#a3e635', // lime
  '#fb923c', // orange
  '#c084fc', // purple
  '#facc15', // yellow
]

export function teamColor(index: number): string {
  return TEAM_COLORS[index % TEAM_COLORS.length]
}
