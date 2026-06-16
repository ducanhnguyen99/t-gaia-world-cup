import { RoundGame, type RoundGameConfig } from './RoundGame'
import type { GameComponentProps } from './types'
import { normalize } from '../utils/scramble'
import riddlesData from '../data/emoji-riddles.json'

interface RiddleItem {
  emojis: string
  answers: string[]
  category: string
}

const cfg: RoundGameConfig<RiddleItem> = {
  gameId: 'emojiRiddles',
  items: riddlesData as RiddleItem[],
  perRoundSeconds: 25,
  prompt: (item) => <span className="text-6xl">{item.emojis}</span>,
  correctText: (item) => item.answers[0],
  answer: {
    type: 'text',
    check: (item, input) =>
      item.answers.some((a) => normalize(a) === normalize(input)),
  },
}

export function EmojiRiddles(props: GameComponentProps) {
  return <RoundGame {...props} numRounds={props.config.rounds} cfg={cfg} />
}
