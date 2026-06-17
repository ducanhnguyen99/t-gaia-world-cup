import { RoundGame, type RoundGameConfig } from './RoundGame'
import type { GameComponentProps } from './types'
import { normalize, scrambleReadable } from '../utils/scramble'
import wordsData from '../data/scrambled-words.json'

interface WordItem {
  word: string
  category: string
}

const cfg: RoundGameConfig<WordItem> = {
  gameId: 'scrambledWords',
  items: wordsData as WordItem[],
  perRoundSeconds: 25,
  // Keep first & last letters in place so it reads almost normally.
  prompt: (item) => {
    const isSentence = item.word.includes(' ')
    return (
      <span
        className={`font-mono ${isSentence ? 'text-2xl leading-relaxed' : 'text-3xl tracking-widest uppercase'}`}
      >
        {scrambleReadable(item.word)}
      </span>
    )
  },
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
