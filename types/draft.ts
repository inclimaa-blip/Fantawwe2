import { Tables } from './database'

export type DraftBid = Tables<'draft_bids'>

export interface DraftBidWithDetails extends DraftBid {
  wrestler: {
    id: string
    name: string
    brand: string
  }
  user: {
    id: string
    username: string
  }
}

export interface DraftState {
  leagueId: string
  season: number
  quarter: number
  status: 'pending' | 'active' | 'completed'
  currentWrestlerId: string | null
  currentWrestlerName: string | null
  currentHighBid: number | null
  currentHighBidder: string | null
  currentHighBidderName: string | null
  timeRemaining: number | null
  availableWrestlers: DraftWrestler[]
  completedBids: DraftBidWithDetails[]
}

export interface DraftWrestler {
  id: string
  name: string
  brand: string
  nominated: boolean
  sold: boolean
  finalPrice?: number
  winnerId?: string
  winnerName?: string
}

export interface PlaceBidInput {
  leagueId: string
  season: number
  quarter: number
  wrestlerId: string
  bidAmount: number
}

export interface NominateWrestlerInput {
  leagueId: string
  season: number
  quarter: number
  wrestlerId: string
  openingBid: number
}

// Draft constants
export const INITIAL_BUDGET = 100
export const MINIMUM_BID = 1
export const ROSTER_SIZE = 12
export const EXTENSION_BUDGET = 8
export const EXTENSION_ROSTER_SIZE = 13
export const KEEPER_INFLATION_RATE = 1.2
