import { Tables, ShowType, TitleLevel, VictoryType } from './database'

export type Show = Tables<'shows'>
export type Match = Tables<'matches'>
export type MatchParticipant = Tables<'match_participants'>

export interface ShowWithMatches extends Show {
  matches: MatchWithParticipants[]
}

export interface MatchWithParticipants extends Match {
  participants: MatchParticipantWithWrestler[]
  show?: Show
}

export interface MatchParticipantWithWrestler extends MatchParticipant {
  wrestler: {
    id: string
    name: string
    brand: string
  }
}

export interface ShowCreateInput {
  name: string
  eventDate: string
  showType: ShowType
  season: number
  quarter: number
  week: number
}

export interface MatchCreateInput {
  showId: string
  rating: number
  durationMinutes: number
  isTitleMatch?: boolean
  titleLevel?: TitleLevel | null
  isMainEvent?: boolean
  isSpecialStipulation?: boolean
  participants: MatchParticipantInput[]
}

export interface MatchParticipantInput {
  wrestlerId: string
  isWinner?: boolean
  victoryType?: VictoryType | null
  hasDebutBonus?: boolean
  hasTitleDefenseBonus?: boolean
  hasBotchMalus?: boolean
  hasShortMatchMalus?: boolean
  hasSquashLossMalus?: boolean
}

export interface MatchFilter {
  showId?: string
  showType?: ShowType
  season?: number
  quarter?: number
  week?: number
}
