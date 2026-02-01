import { Tables, LineupPosition } from './database'

export type Lineup = Tables<'lineups'>
export type LineupWrestler = Tables<'lineup_wrestlers'>
export type Roster = Tables<'rosters'>
export type RosterWrestler = Tables<'roster_wrestlers'>

export interface RosterWithWrestlers extends Roster {
  wrestlers: RosterWrestlerWithDetails[]
}

export interface RosterWrestlerWithDetails extends RosterWrestler {
  wrestler: {
    id: string
    name: string
    brand: string
    status: string
    photoUrl: string | null
  }
}

export interface LineupWithWrestlers extends Lineup {
  wrestlers: LineupWrestlerWithDetails[]
  captain?: {
    id: string
    name: string
  } | null
}

export interface LineupWrestlerWithDetails extends LineupWrestler {
  wrestler: {
    id: string
    name: string
    brand: string
    status: string
    photoUrl: string | null
  }
}

export interface LineupSubmitInput {
  rosterId: string
  week: number
  season: number
  quarter: number
  captainWrestlerId: string
  starters: string[] // wrestler IDs (6 starters)
  reserves: ReserveWrestlerInput[] // wrestler IDs with priority (4 reserves)
}

export interface ReserveWrestlerInput {
  wrestlerId: string
  priorityOrder: number // 1-4, lower = higher priority for substitution
}

export interface LineupValidation {
  isValid: boolean
  errors: string[]
}

// Lineup constants
export const STARTERS_COUNT = 6
export const RESERVES_COUNT = 4
export const TOTAL_LINEUP_SIZE = STARTERS_COUNT + RESERVES_COUNT
export const LINEUP_DEADLINE_DAY = 1 // Monday
export const LINEUP_DEADLINE_HOUR = 20 // 8:00 PM

export function validateLineup(
  starters: string[],
  reserves: ReserveWrestlerInput[],
  captainId: string,
  availableWrestlerIds: string[]
): LineupValidation {
  const errors: string[] = []

  // Check starters count
  if (starters.length !== STARTERS_COUNT) {
    errors.push(`Must have exactly ${STARTERS_COUNT} starters, got ${starters.length}`)
  }

  // Check reserves count
  if (reserves.length !== RESERVES_COUNT) {
    errors.push(`Must have exactly ${RESERVES_COUNT} reserves, got ${reserves.length}`)
  }

  // Check all wrestlers are unique
  const allWrestlerIds = [...starters, ...reserves.map(r => r.wrestlerId)]
  const uniqueIds = new Set(allWrestlerIds)
  if (uniqueIds.size !== allWrestlerIds.length) {
    errors.push('Each wrestler can only be in the lineup once')
  }

  // Check all wrestlers are available in roster
  for (const id of allWrestlerIds) {
    if (!availableWrestlerIds.includes(id)) {
      errors.push(`Wrestler ${id} is not in your roster`)
    }
  }

  // Check captain is in starters
  if (!starters.includes(captainId)) {
    errors.push('Captain must be one of the starters')
  }

  // Check reserve priority orders are 1-4
  const priorities = reserves.map(r => r.priorityOrder).sort((a, b) => a - b)
  if (priorities.join(',') !== '1,2,3,4') {
    errors.push('Reserve priority orders must be 1, 2, 3, and 4')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
