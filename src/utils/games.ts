import type { GameId } from '../types'

export interface GameMeta {
  id: GameId
  name: string
  icon: string
  blurb: string
}

export const GAMES: GameMeta[] = [
  {
    id: 'mathSpeed',
    name: 'Math Speed',
    icon: '⚡',
    blurb: 'Solve as many chained sums as you can in 60s',
  },
  {
    id: 'scrambledWords',
    name: 'Scrambled Words',
    icon: '🔤',
    blurb: 'Unscramble the word — fastest correct wins',
  },
  {
    id: 'emojiRiddles',
    name: 'Emoji Riddles',
    icon: '🧩',
    blurb: 'Decode the emojis — first correct answer wins',
  },
  {
    id: 'wcStats',
    name: 'WC Stats Guessing',
    icon: '📊',
    blurb: 'Guess the number — closest gets the most points',
  },
  {
    id: 'languageGuessing',
    name: 'Language Guessing',
    icon: '🌍',
    blurb: 'Which language is it? First correct wins',
  },
]

export const GAME_BY_ID: Record<GameId, GameMeta> = Object.fromEntries(
  GAMES.map((g) => [g.id, g]),
) as Record<GameId, GameMeta>
