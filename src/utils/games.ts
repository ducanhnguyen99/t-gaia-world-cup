import type { GameId } from '../types'

export interface GameMeta {
  id: GameId
  name: string
  icon: string
  blurb: string
  howTo: string
}

export const GAMES: GameMeta[] = [
  {
    id: 'mathSpeed',
    name: 'Math Speed',
    icon: '⚡',
    blurb: 'Solve as many chained sums as you can in 60s',
    howTo: 'Solve as many as you can before the timer runs out. Type the answer and press Enter — a new one appears instantly. × before + and −. Wrong answers just skip, no penalty.',
  },
  {
    id: 'scrambledWords',
    name: 'Scrambled Words',
    icon: '🔤',
    blurb: 'Unscramble the word — fastest correct wins',
    howTo: 'Everyone sees the same scrambled word. Type the unscrambled word and submit. The faster you are correct, the more points. One word per round.',
  },
  {
    id: 'emojiRiddles',
    name: 'Emoji Riddles',
    icon: '🧩',
    blurb: 'Decode the emojis — first correct answer wins',
    howTo: 'Work out the word or phrase the emojis represent and type it. Several spellings are accepted. Faster correct answers score more.',
  },
  {
    id: 'wcStats',
    name: 'WC Stats Guessing',
    icon: '📊',
    blurb: 'Guess the number — closest gets the most points',
    howTo: 'A number question appears. Type your best estimate. The closest guesses score the most — no need to be exact!',
  },
  {
    id: 'languageGuessing',
    name: 'Language Guessing',
    icon: '🌍',
    blurb: 'Which language is it? First correct wins',
    howTo: 'A phrase appears in a language. Tap which language it is from the four options. First correct wins — but a wrong tap locks you out for that round, so be sure!',
  },
  {
    id: 'bestAnswer',
    name: 'Best Answer',
    icon: '😂',
    blurb: 'Write the funniest answer — then everyone votes',
    howTo: 'A prompt appears. Type the funniest answer you can. Then everyone votes for their favourite (you can’t vote for your own). Every vote your answer gets is a point!',
  },
  {
    id: 'truthsLies',
    name: 'Truths & Lies',
    icon: '🕵️',
    blurb: 'Spot the lie among the statements',
    howTo: 'Three statements appear — two true, one a lie. Vote for the one you think is the LIE. Guess right to score. (In personal rounds you also write your own!)',
  },
  {
    id: 'onAScale',
    name: 'On a Scale',
    icon: '🎚️',
    blurb: 'One guesser reads the room to find a secret number',
    howTo: 'A secret number 1–10 is shown to everyone except the guesser. The guesser asks people the suggested questions; answer with hints at the number (don’t say it!). The guesser then guesses — closer = more points.',
  },
]

export const GAME_BY_ID: Record<GameId, GameMeta> = Object.fromEntries(
  GAMES.map((g) => [g.id, g]),
) as Record<GameId, GameMeta>
