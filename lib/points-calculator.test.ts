/**
 * Points Calculator Tests
 *
 * Run with: npx tsx lib/points-calculator.test.ts
 */

import {
  calculateBasePoints,
  calculateVictoryBonus,
  calculateContextBonus,
  calculateDurationBonus,
  calculateNarrativeBonus,
  calculateMalus,
  calculateWrestlerPoints,
  calculatePlayerMatchPoints,
  MatchData,
  ParticipantData,
  LineupWrestlerData,
} from './points-calculator'

// Simple test runner
let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (error) {
    console.log(`✗ ${name}`)
    console.log(`  Error: ${error instanceof Error ? error.message : error}`)
    failed++
  }
}

function expect(actual: number) {
  return {
    toBe(expected: number) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`)
      }
    },
    toBeCloseTo(expected: number, precision = 2) {
      const multiplier = Math.pow(10, precision)
      const roundedActual = Math.round(actual * multiplier) / multiplier
      const roundedExpected = Math.round(expected * multiplier) / multiplier
      if (roundedActual !== roundedExpected) {
        throw new Error(`Expected ${expected}, got ${actual}`)
      }
    },
  }
}

console.log('Running Points Calculator Tests...\n')

// Base Points Tests
test('calculates base points for 1 star', () => {
  expect(calculateBasePoints(1)).toBe(2)
})

test('calculates base points for 4 stars', () => {
  expect(calculateBasePoints(4)).toBe(8)
})

test('calculates base points for 4.5 stars', () => {
  expect(calculateBasePoints(4.5)).toBe(9)
})

test('calculates base points for 5 stars', () => {
  expect(calculateBasePoints(5)).toBe(10)
})

// Victory Bonus Tests
test('pin victory gives +1', () => {
  expect(calculateVictoryBonus(true, 'pin')).toBe(1)
})

test('submission victory gives +1.5', () => {
  expect(calculateVictoryBonus(true, 'submission')).toBe(1.5)
})

test('KO victory gives +2', () => {
  expect(calculateVictoryBonus(true, 'ko')).toBe(2)
})

test('DQ victory gives +0.5', () => {
  expect(calculateVictoryBonus(true, 'dq')).toBe(0.5)
})

test('count-out victory gives +0.5', () => {
  expect(calculateVictoryBonus(true, 'countout')).toBe(0.5)
})

test('no contest gives 0', () => {
  expect(calculateVictoryBonus(true, 'no_contest')).toBe(0)
})

test('loser gets no victory bonus', () => {
  expect(calculateVictoryBonus(false, 'pin')).toBe(0)
})

// Context Bonus Tests
test('world title match gives +4', () => {
  const match: MatchData = {
    id: 'test',
    rating: 4,
    durationMinutes: 20,
    isTitleMatch: true,
    titleLevel: 'world',
    isMainEvent: false,
    isSpecialStipulation: false,
  }
  expect(calculateContextBonus(match)).toBe(4)
})

test('other title match gives +2', () => {
  const match: MatchData = {
    id: 'test',
    rating: 4,
    durationMinutes: 20,
    isTitleMatch: true,
    titleLevel: 'other',
    isMainEvent: false,
    isSpecialStipulation: false,
  }
  expect(calculateContextBonus(match)).toBe(2)
})

test('main event gives +3', () => {
  const match: MatchData = {
    id: 'test',
    rating: 4,
    durationMinutes: 20,
    isTitleMatch: false,
    titleLevel: null,
    isMainEvent: true,
    isSpecialStipulation: false,
  }
  expect(calculateContextBonus(match)).toBe(3)
})

test('special stipulation gives +2', () => {
  const match: MatchData = {
    id: 'test',
    rating: 4,
    durationMinutes: 20,
    isTitleMatch: false,
    titleLevel: null,
    isMainEvent: false,
    isSpecialStipulation: true,
  }
  expect(calculateContextBonus(match)).toBe(2)
})

test('world title + main event + stipulation gives +9', () => {
  const match: MatchData = {
    id: 'test',
    rating: 4,
    durationMinutes: 20,
    isTitleMatch: true,
    titleLevel: 'world',
    isMainEvent: true,
    isSpecialStipulation: true,
  }
  expect(calculateContextBonus(match)).toBe(9)
})

// Duration Bonus Tests
test('30+ minutes gives +4', () => {
  expect(calculateDurationBonus(35)).toBe(4)
})

test('20-30 minutes gives +3', () => {
  expect(calculateDurationBonus(25)).toBe(3)
})

test('15-20 minutes gives +2', () => {
  expect(calculateDurationBonus(17)).toBe(2)
})

test('under 15 minutes gives 0', () => {
  expect(calculateDurationBonus(10)).toBe(0)
})

// Narrative Bonus Tests
test('debut bonus gives +2', () => {
  const participant: ParticipantData = {
    wrestlerId: 'test',
    wrestlerName: 'Test',
    isWinner: false,
    victoryType: null,
    hasDebutBonus: true,
    hasTitleDefenseBonus: false,
    hasBotchMalus: false,
    hasShortMatchMalus: false,
    hasSquashLossMalus: false,
  }
  expect(calculateNarrativeBonus(participant)).toBe(2)
})

test('title defense bonus gives +1', () => {
  const participant: ParticipantData = {
    wrestlerId: 'test',
    wrestlerName: 'Test',
    isWinner: true,
    victoryType: 'pin',
    hasDebutBonus: false,
    hasTitleDefenseBonus: true,
    hasBotchMalus: false,
    hasShortMatchMalus: false,
    hasSquashLossMalus: false,
  }
  expect(calculateNarrativeBonus(participant)).toBe(1)
})

// Malus Tests
test('botch malus gives -2', () => {
  const participant: ParticipantData = {
    wrestlerId: 'test',
    wrestlerName: 'Test',
    isWinner: false,
    victoryType: null,
    hasDebutBonus: false,
    hasTitleDefenseBonus: false,
    hasBotchMalus: true,
    hasShortMatchMalus: false,
    hasSquashLossMalus: false,
  }
  expect(calculateMalus(participant)).toBe(-2)
})

test('multiple maluses stack', () => {
  const participant: ParticipantData = {
    wrestlerId: 'test',
    wrestlerName: 'Test',
    isWinner: false,
    victoryType: null,
    hasDebutBonus: false,
    hasTitleDefenseBonus: false,
    hasBotchMalus: true,
    hasShortMatchMalus: true,
    hasSquashLossMalus: true,
  }
  expect(calculateMalus(participant)).toBe(-6)
})

// Full Match Calculation Test (The Key Example)
test('Drew vs Cody example: both in lineup = 27 points', () => {
  const match: MatchData = {
    id: 'example',
    rating: 4,
    durationMinutes: 25,
    isTitleMatch: true,
    titleLevel: 'world',
    isMainEvent: true,
    isSpecialStipulation: false,
  }

  const participants: ParticipantData[] = [
    {
      wrestlerId: 'cody',
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
      wrestlerId: 'drew',
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
    { wrestlerId: 'cody', wrestlerName: 'Cody Rhodes', isCaptain: false },
    { wrestlerId: 'drew', wrestlerName: 'Drew McIntyre', isCaptain: false },
  ]

  const result = calculatePlayerMatchPoints(match, participants, lineupWrestlers)

  // Cody: base(8) + victory(1) = 9
  // Drew: base(8) = 8
  // Context: world(4) + main event(3) = 7
  // Duration: 20-30min = 3
  // Total: 9 + 8 + 7 + 3 = 27
  expect(result!.totalMatchPoints).toBe(27)
})

test('Drew vs Cody example: only Cody in lineup = 19 points', () => {
  const match: MatchData = {
    id: 'example',
    rating: 4,
    durationMinutes: 25,
    isTitleMatch: true,
    titleLevel: 'world',
    isMainEvent: true,
    isSpecialStipulation: false,
  }

  const participants: ParticipantData[] = [
    {
      wrestlerId: 'cody',
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
      wrestlerId: 'drew',
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
    { wrestlerId: 'cody', wrestlerName: 'Cody Rhodes', isCaptain: false },
  ]

  const result = calculatePlayerMatchPoints(match, participants, lineupWrestlers)

  // Cody: base(8) + victory(1) = 9
  // Context: world(4) + main event(3) = 7
  // Duration: 20-30min = 3
  // Total: 9 + 7 + 3 = 19
  expect(result!.totalMatchPoints).toBe(19)
})

test('Drew vs Cody example: only Drew in lineup = 18 points', () => {
  const match: MatchData = {
    id: 'example',
    rating: 4,
    durationMinutes: 25,
    isTitleMatch: true,
    titleLevel: 'world',
    isMainEvent: true,
    isSpecialStipulation: false,
  }

  const participants: ParticipantData[] = [
    {
      wrestlerId: 'cody',
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
      wrestlerId: 'drew',
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
    { wrestlerId: 'drew', wrestlerName: 'Drew McIntyre', isCaptain: false },
  ]

  const result = calculatePlayerMatchPoints(match, participants, lineupWrestlers)

  // Drew: base(8) = 8
  // Context: world(4) + main event(3) = 7
  // Duration: 20-30min = 3
  // Total: 8 + 7 + 3 = 18
  expect(result!.totalMatchPoints).toBe(18)
})

test('Captain multiplier applies correctly', () => {
  const match: MatchData = {
    id: 'example',
    rating: 4,
    durationMinutes: 10, // No duration bonus
    isTitleMatch: false,
    titleLevel: null,
    isMainEvent: false,
    isSpecialStipulation: false,
  }

  const participants: ParticipantData[] = [
    {
      wrestlerId: 'wrestler1',
      wrestlerName: 'Wrestler 1',
      isWinner: true,
      victoryType: 'pin',
      hasDebutBonus: false,
      hasTitleDefenseBonus: false,
      hasBotchMalus: false,
      hasShortMatchMalus: false,
      hasSquashLossMalus: false,
    },
  ]

  const lineupWrestlers: LineupWrestlerData[] = [
    { wrestlerId: 'wrestler1', wrestlerName: 'Wrestler 1', isCaptain: true },
  ]

  const result = calculatePlayerMatchPoints(match, participants, lineupWrestlers)

  // base(8) + victory(1) = 9 × 1.5 = 13.5
  // No context or duration bonuses
  expect(result!.totalMatchPoints).toBeCloseTo(13.5)
})

test('No lineup wrestlers in match returns null', () => {
  const match: MatchData = {
    id: 'example',
    rating: 4,
    durationMinutes: 20,
    isTitleMatch: false,
    titleLevel: null,
    isMainEvent: false,
    isSpecialStipulation: false,
  }

  const participants: ParticipantData[] = [
    {
      wrestlerId: 'wrestler1',
      wrestlerName: 'Wrestler 1',
      isWinner: true,
      victoryType: 'pin',
      hasDebutBonus: false,
      hasTitleDefenseBonus: false,
      hasBotchMalus: false,
      hasShortMatchMalus: false,
      hasSquashLossMalus: false,
    },
  ]

  const lineupWrestlers: LineupWrestlerData[] = [
    { wrestlerId: 'different-wrestler', wrestlerName: 'Different', isCaptain: false },
  ]

  const result = calculatePlayerMatchPoints(match, participants, lineupWrestlers)

  if (result !== null) {
    throw new Error('Expected null when no lineup wrestlers participated')
  }
})

// Summary
console.log('\n---')
console.log(`Tests: ${passed + failed} total, ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
