import { Tables, VictoryType, TitleLevel } from './database'

export type Points = Tables<'points'>

export interface PointsWithDetails extends Points {
  wrestler: {
    id: string
    name: string
  }
  match: {
    id: string
    rating: number
    durationMinutes: number
    isTitleMatch: boolean
    titleLevel: TitleLevel | null
    isMainEvent: boolean
    isSpecialStipulation: boolean
  }
}

export interface PointsBreakdown {
  basePoints: number
  victoryBonus: number
  contextBonus: number
  durationBonus: number
  narrativeBonus: number
  malus: number
  captainMultiplier: number
  totalPoints: number
}

export interface WrestlerMatchPoints {
  wrestlerId: string
  wrestlerName: string
  matchId: string
  breakdown: PointsBreakdown
  isCaptain: boolean
}

export interface PlayerMatchPoints {
  matchId: string
  matchRating: number
  wrestlers: WrestlerMatchPoints[]
  contextBonus: number // Applied once per player per match
  durationBonus: number // Applied once per player per match
  totalMatchPoints: number
}

export interface WeeklyPointsSummary {
  lineupId: string
  userId: string
  username: string
  week: number
  season: number
  quarter: number
  totalPoints: number
  matchPoints: PlayerMatchPoints[]
}

// Point calculation constants
export const VICTORY_BONUSES: Record<VictoryType, number> = {
  dq: 0.5,
  countout: 0.5,
  pin: 1,
  submission: 1.5,
  ko: 2,
  no_contest: 0,
}

export const TITLE_BONUSES: Record<TitleLevel, number> = {
  world: 4,
  other: 2,
}

export const MAIN_EVENT_BONUS = 3
export const SPECIAL_STIPULATION_BONUS = 2
export const DEBUT_BONUS = 2
export const TITLE_DEFENSE_BONUS = 1

export const BOTCH_MALUS = -2
export const SHORT_MATCH_MALUS = -2 // Match under 5 minutes
export const SQUASH_LOSS_MALUS = -2 // Lost in under 2 minutes

export const CAPTAIN_MULTIPLIER = 1.5

// Duration bonus thresholds
export const DURATION_BONUS_TIERS = [
  { minMinutes: 30, bonus: 4 },
  { minMinutes: 20, bonus: 3 },
  { minMinutes: 15, bonus: 2 },
] as const
