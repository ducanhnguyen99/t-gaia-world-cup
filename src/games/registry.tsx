import type { GameId } from '../types'
import type { GameComponentProps } from './types'
import { MathSpeed } from './MathSpeed'
import { ScrambledWords } from './ScrambledWords'
import { EmojiRiddles } from './EmojiRiddles'
import { WcStats } from './WcStats'
import { LanguageGuessing } from './LanguageGuessing'
import { BestAnswer } from './BestAnswer'
import { TruthsLies } from './TruthsLies'
import { OnAScale } from './OnAScale'

export const GAME_COMPONENTS: Record<
  GameId,
  (props: GameComponentProps) => React.ReactElement
> = {
  mathSpeed: MathSpeed,
  scrambledWords: ScrambledWords,
  emojiRiddles: EmojiRiddles,
  wcStats: WcStats,
  languageGuessing: LanguageGuessing,
  bestAnswer: BestAnswer,
  truthsLies: TruthsLies,
  onAScale: OnAScale,
}
