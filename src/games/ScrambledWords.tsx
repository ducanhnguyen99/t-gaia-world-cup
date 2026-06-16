import { RoundGame, type RoundGameConfig } from './RoundGame'
import type { GameComponentProps } from './types'
import { normalize, scramble } from '../utils/scramble'
import wordsData from '../data/scrambled-words.json'

interface WordItem {
  word: string
  category: string
}

const cfg: RoundGameConfig<WordItem> = {
  gameId: 'scrambledWords',
  items: wordsData as WordItem[],
  perRoundSeconds: 20,
  prompt: (item) => (
    <span className="font-mono tracking-[0.3em] uppercase">
      {scramble(item.word)}
    </span>
  ),
  correctText: (item) => item.word,
  answer: {
    type: 'text',
    check: (item, input) => normalize(input) === normalize(item.word),
  },
}

export function ScrambledWords(props: GameComponentProps) {
  return (
    <RoundGame
      {...props}
      numRounds={props.config.rounds}
      cfg={cfg}
    />
  )
}
