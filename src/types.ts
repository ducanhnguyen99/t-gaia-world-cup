// Shared domain types mirroring the Firebase Realtime DB structure.

export type SessionStatus =
  | 'lobby'
  | 'playing'
  | 'between'
  | 'revealing'
  | 'ended'

export type GameId =
  | 'mathSpeed'
  | 'scrambledWords'
  | 'emojiRiddles'
  | 'wcStats'
  | 'languageGuessing'

export interface Player {
  id: string
  name: string
  team?: string
  ip: number
  gp: number
  connected: boolean
  joinedAt: number
}

export interface Team {
  id: string
  name: string
  gp: number
  renamed: boolean
  color?: string
}

export interface GameConfig {
  timer: number
  rounds: number
}

export interface RevealEntry {
  playerId: string
  name: string
  teamName?: string
  teamColor?: string
  raw: number
  ipGained: number
}

export interface RevealTeamEntry {
  teamId: string
  name: string
  color?: string
  gpGained: number
}

export interface LastReveal {
  gameId: GameId
  round: number
  entries: RevealEntry[] // sorted best → worst
  teams: RevealTeamEntry[] // sorted best → worst
}

export interface Session {
  status: SessionStatus
  currentGame: GameId | null
  currentRound: number
  gameConfig: GameConfig
  nextGame?: GameId | null
  players: Record<string, Omit<Player, 'id'>>
  teams: Record<string, Omit<Team, 'id'>>
}
