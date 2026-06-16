import { RoundGame, type RoundGameConfig } from './RoundGame'
import type { GameComponentProps } from './types'
import { seededShuffle } from '../utils/scramble'
import langData from '../data/language-guessing.json'

interface LangItem {
  phrase: string
  answer: string
  options: string[]
}

const cfg: RoundGameConfig<LangItem> = {
  gameId: 'languageGuessing',
  items: langData as LangItem[],
  perRoundSeconds: 15,
  prompt: (item) => (
    <span className="text-2xl leading-relaxed font-medium">“{item.phrase}”</span>
  ),
  correctText: (item) => item.answer,
  answer: {
    type: 'choice',
    // Shuffle so the correct answer isn't always option[0] (top-left), but keep
    // it deterministic per phrase so every player sees the same layout.
    options: (item) => seededShuffle(item.options, item.phrase),
    isCorrect: (item, opt) => opt === item.answer,
  },
}

export function LanguageGuessing(props: GameComponentProps) {
  return <RoundGame {...props} numRounds={props.config.rounds} cfg={cfg} />
}
