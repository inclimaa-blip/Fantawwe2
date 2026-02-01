/**
 * FantaWWE Points Calculator Engine
 *
 * This module implements the exact scoring rules for FantaWWE.
 *
 * SCORING RULES:
 *
 * 1. BASE POINTS: rating stars × 2
 *    - 1 star = 2 points, 2 stars = 4 points, etc.
 *
 * 2. VICTORY BONUS (per wrestler):
 *    - DQ/Count-out: +0.5
 *    - Pin: +1
 *    - Submission: +1.5
 *    - K.O.: +2
 *    - No contest: 0
 *
 * 3. CONTEXT BONUS (ONCE per player per match, not per wrestler):
 *    - World title match: +4
 *    - Other title match: +2
 *    - Main event: +3
 *    - Special stipulation: +2
 *
 * 4. DURATION BONUS (ONCE per player per match):
 *    - 15-20 minutes: +2
 *    - 20-30 minutes: +3
 *    - 30+ minutes: +4
 *
 * 5. NARRATIVE BONUS (per wrestler):
 *    - Debut/Return: +2
 *    - Title defense (champion who successfully defends): +1
 *
 * 6. MALUS (per wrestler):
 *    - Botch: -2
 *    - Short match (<5 min, non-intentional squash): -2
 *    - Squash loss (<2 min loss): -2
 *
 * 7. CAPTAIN MULTIPLIER:
 *    - Captain gets ×1.5 on all their individual points
 */

import {
  VictoryType,
  TitleLevel,
  VICTORY_BONUSES,
  TITLE_BONUSES,
  MAIN_EVENT_BONUS,
  SPECIAL_STIPULATION_BONUS,
  DEBUT_BONUS,
  TITLE_DEFENSE_BONUS,
  BOTCH_MALUS,
  SHORT_MATCH_MALUS,
  SQUASH_LOSS_MALUS,
  CAPTAIN_MULTIPLIER,
  DURATION_BONUS_TIERS,
  PointsBreakdown,
  WrestlerMatchPoints,
  PlayerMatchPoints,
} from '@/types/points'

// Match data structure for calculation
export interface MatchData {
  id: string
  rating: number
  durationMinutes: number
  isTitleMatch: boolean
  titleLevel: TitleLevel | null
  isMainEvent: boolean
  isSpecialStipulation: boolean
}

// Participant data for calculation
export interface ParticipantData {
  wrestlerId: string
  wrestlerName: string
  isWinner: boolean
  victoryType: VictoryType | null
  hasDebutBonus: boolean
  hasTitleDefenseBonus: boolean
  hasBotchMalus: boolean
  hasShortMatchMalus: boolean
  hasSquashLossMalus: boolean
}

// Lineup wrestler for calculation
export interface LineupWrestlerData {
  wrestlerId: string
  wrestlerName: string
  isCaptain: boolean
}

/**
 * Calculate base points from match rating
 * Formula: rating × 2 (rounded)
 */
export function calculateBasePoints(rating: number): number {
  return Math.round(rating * 2)
}

/**
 * Calculate victory bonus based on victory type
 */
export function calculateVictoryBonus(
  isWinner: boolean,
  victoryType: VictoryType | null
): number {
  if (!isWinner || !victoryType) return 0
  return VICTORY_BONUSES[victoryType] || 0
}

/**
 * Calculate context bonus for a match
 * This is applied ONCE per player per match, regardless of how many wrestlers they have
 */
export function calculateContextBonus(match: MatchData): number {
  let bonus = 0

  // Title bonus
  if (match.isTitleMatch && match.titleLevel) {
    bonus += TITLE_BONUSES[match.titleLevel]
  }

  // Main event bonus
  if (match.isMainEvent) {
    bonus += MAIN_EVENT_BONUS
  }

  // Special stipulation bonus
  if (match.isSpecialStipulation) {
    bonus += SPECIAL_STIPULATION_BONUS
  }

  return bonus
}

/**
 * Calculate duration bonus based on match length
 * This is applied ONCE per player per match
 */
export function calculateDurationBonus(durationMinutes: number): number {
  for (const tier of DURATION_BONUS_TIERS) {
    if (durationMinutes >= tier.minMinutes) {
      return tier.bonus
    }
  }
  return 0
}

/**
 * Calculate narrative bonus for a wrestler
 */
export function calculateNarrativeBonus(participant: ParticipantData): number {
  let bonus = 0

  if (participant.hasDebutBonus) {
    bonus += DEBUT_BONUS
  }

  if (participant.hasTitleDefenseBonus) {
    bonus += TITLE_DEFENSE_BONUS
  }

  return bonus
}

/**
 * Calculate malus for a wrestler
 */
export function calculateMalus(participant: ParticipantData): number {
  let malus = 0

  if (participant.hasBotchMalus) {
    malus += BOTCH_MALUS
  }

  if (participant.hasShortMatchMalus) {
    malus += SHORT_MATCH_MALUS
  }

  if (participant.hasSquashLossMalus) {
    malus += SQUASH_LOSS_MALUS
  }

  return malus
}

/**
 * Calculate points for a single wrestler in a match
 * Note: Context and duration bonuses are NOT included here - they're added once per player
 */
export function calculateWrestlerPoints(
  match: MatchData,
  participant: ParticipantData,
  isCaptain: boolean
): PointsBreakdown {
  const basePoints = calculateBasePoints(match.rating)
  const victoryBonus = calculateVictoryBonus(participant.isWinner, participant.victoryType)
  const narrativeBonus = calculateNarrativeBonus(participant)
  const malus = calculateMalus(participant)

  // Subtotal before captain multiplier (without context/duration - those are per-player)
  const subtotal = basePoints + victoryBonus + narrativeBonus + malus

  // Apply captain multiplier
  const captainMultiplier = isCaptain ? CAPTAIN_MULTIPLIER : 1.0
  const totalBeforeContext = subtotal * captainMultiplier

  return {
    basePoints,
    victoryBonus,
    contextBonus: 0, // Will be added at player level
    durationBonus: 0, // Will be added at player level
    narrativeBonus,
    malus,
    captainMultiplier,
    totalPoints: totalBeforeContext,
  }
}

/**
 * Calculate all points for a player's wrestlers in a single match
 *
 * IMPORTANT: Context and duration bonuses are applied ONCE per player per match,
 * not per wrestler. This is a key rule that affects scoring when a player
 * has multiple wrestlers in the same match.
 */
export function calculatePlayerMatchPoints(
  match: MatchData,
  participants: ParticipantData[],
  lineupWrestlers: LineupWrestlerData[]
): PlayerMatchPoints | null {
  // Find which of the player's lineup wrestlers participated in this match
  const participatingWrestlers: Array<{
    participant: ParticipantData
    lineupWrestler: LineupWrestlerData
  }> = []

  for (const lineupWrestler of lineupWrestlers) {
    const participant = participants.find(
      p => p.wrestlerId === lineupWrestler.wrestlerId
    )
    if (participant) {
      participatingWrestlers.push({ participant, lineupWrestler })
    }
  }

  // If no lineup wrestlers participated in this match, skip it
  if (participatingWrestlers.length === 0) {
    return null
  }

  // Calculate context and duration bonuses ONCE for the player
  const contextBonus = calculateContextBonus(match)
  const durationBonus = calculateDurationBonus(match.durationMinutes)

  // Calculate points for each participating wrestler
  const wrestlerPoints: WrestlerMatchPoints[] = participatingWrestlers.map(
    ({ participant, lineupWrestler }) => {
      const breakdown = calculateWrestlerPoints(
        match,
        participant,
        lineupWrestler.isCaptain
      )

      return {
        wrestlerId: participant.wrestlerId,
        wrestlerName: participant.wrestlerName,
        matchId: match.id,
        breakdown,
        isCaptain: lineupWrestler.isCaptain,
      }
    }
  )

  // Sum up all wrestler points and add context/duration bonuses once
  const wrestlerPointsTotal = wrestlerPoints.reduce(
    (sum, wp) => sum + wp.breakdown.totalPoints,
    0
  )
  const totalMatchPoints = wrestlerPointsTotal + contextBonus + durationBonus

  return {
    matchId: match.id,
    matchRating: match.rating,
    wrestlers: wrestlerPoints,
    contextBonus,
    durationBonus,
    totalMatchPoints,
  }
}

/**
 * Calculate all points for a player's lineup across multiple matches
 */
export function calculateLineupPoints(
  matches: Array<{ match: MatchData; participants: ParticipantData[] }>,
  lineupWrestlers: LineupWrestlerData[]
): {
  matchPoints: PlayerMatchPoints[]
  totalPoints: number
} {
  const matchPoints: PlayerMatchPoints[] = []
  let totalPoints = 0

  for (const { match, participants } of matches) {
    const playerMatchPoints = calculatePlayerMatchPoints(
      match,
      participants,
      lineupWrestlers
    )

    if (playerMatchPoints) {
      matchPoints.push(playerMatchPoints)
      totalPoints += playerMatchPoints.totalMatchPoints
    }
  }

  return { matchPoints, totalPoints }
}

/**
 * Example calculation to verify the algorithm
 *
 * Example: Drew vs Cody, 4 stars, 25 min, world title, main event
 * Cody wins by pin, player has both Drew and Cody
 *
 * Expected:
 * - Cody: base(8) + victory(1) = 9 × 1.0 = 9
 * - Drew: base(8) = 8 × 1.0 = 8
 * - Context: world title(4) + main event(3) = 7
 * - Duration: 20-30min = 3
 * - Total: 9 + 8 + 7 + 3 = 27
 */
export function runExampleCalculation(): void {
  const match: MatchData = {
    id: 'example-match',
    rating: 4,
    durationMinutes: 25,
    isTitleMatch: true,
    titleLevel: 'world',
    isMainEvent: true,
    isSpecialStipulation: false,
  }

  const participants: ParticipantData[] = [
    {
      wrestlerId: 'cody-id',
      wrestlerName: 'Cody Rhodes',
      isWinner: true,
      victoryType: 'pin',
      hasDebutBonus: false,
      hasTitleDefenseBonus: false,
      hasBotchMalus: false,
      hasShortMatchMalus: false,
      hasSquashLossMalus: false,
    },
    {
      wrestlerId: 'drew-id',
      wrestlerName: 'Drew McIntyre',
      isWinner: false,
      victoryType: null,
      hasDebutBonus: false,
      hasTitleDefenseBonus: false,
      hasBotchMalus: false,
      hasShortMatchMalus: false,
      hasSquashLossMalus: false,
    },
  ]

  const lineupWrestlers: LineupWrestlerData[] = [
    { wrestlerId: 'cody-id', wrestlerName: 'Cody Rhodes', isCaptain: false },
    { wrestlerId: 'drew-id', wrestlerName: 'Drew McIntyre', isCaptain: false },
  ]

  const result = calculatePlayerMatchPoints(match, participants, lineupWrestlers)

  console.log('Example Calculation:')
  console.log('Match: Drew vs Cody, 4 stars, 25 min, world title, main event')
  console.log('Cody wins by pin, player has both in lineup')
  console.log('')
  console.log('Result:', JSON.stringify(result, null, 2))
  console.log('')
  console.log('Expected total: 27')
  console.log('Actual total:', result?.totalMatchPoints)
}
