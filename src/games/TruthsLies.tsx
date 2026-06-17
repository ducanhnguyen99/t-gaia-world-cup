import { RoundGame, type RoundGameConfig } from './RoundGame'
import type { GameComponentProps } from './types'
import { seededShuffle } from '../utils/scramble'
import data from '../data/truths-lies.json'

interface TLItem {
  statements: string[]
  lie: number
}

const cfg: RoundGameConfig<TLItem> = {
  gameId: 'truthsLies',
  items: data as TLItem[],
  perRoundSeconds: 25,
  prompt: () => (
    <span className="text-xl">🕵️ Two are true, one is a lie. Spot the lie!</span>
  ),
  correctText: (item) => item.statements[item.lie],
  answer: {
    type: 'choice',
    // Shuffle so the lie isn't always in the same slot, stable per set.
    options: (item) => seededShuffle(item.statements, item.statements.join('|')),
    isCorrect: (item, opt) => opt === item.statements[item.lie],
  },
}

export function TruthsLies(props: GameComponentProps) {
  return <RoundGame {...props} numRounds={props.config.rounds} cfg={cfg} />
}
