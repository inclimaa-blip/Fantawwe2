import { z } from "zod"
import { MINIMUM_BID, INITIAL_BUDGET, ROSTER_SIZE } from "@/types/draft"
import { STARTERS_COUNT, RESERVES_COUNT } from "@/types/lineup"

// ============================================
// AUTH VALIDATIONS
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

// ============================================
// WRESTLER VALIDATIONS
// ============================================

export const wrestlerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  brand: z.enum(["raw", "smackdown", "nxt"], {
    errorMap: () => ({ message: "Please select a valid brand" }),
  }),
  status: z.enum(["active", "injured", "released"]).default("active"),
  photo_url: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
})

export type WrestlerFormData = z.infer<typeof wrestlerSchema>

// ============================================
// SHOW & MATCH VALIDATIONS
// ============================================

export const showSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  event_date: z.string().min(1, "Date is required"),
  show_type: z.enum(["raw", "smackdown", "nxt", "ple"], {
    errorMap: () => ({ message: "Please select a valid show type" }),
  }),
  season: z.coerce.number().int().min(1, "Season must be at least 1"),
  quarter: z.coerce.number().int().min(1).max(4, "Quarter must be 1-4"),
  week: z.coerce.number().int().min(1, "Week must be at least 1"),
})

export type ShowFormData = z.infer<typeof showSchema>

export const matchSchema = z.object({
  show_id: z.string().uuid("Invalid show ID"),
  rating: z.coerce
    .number()
    .min(0, "Rating must be at least 0")
    .max(10, "Rating must be at most 10"),
  duration_minutes: z.coerce
    .number()
    .int()
    .min(0, "Duration must be at least 0"),
  is_title_match: z.boolean().default(false),
  title_level: z.enum(["world", "other"]).optional().nullable(),
  is_main_event: z.boolean().default(false),
  is_special_stipulation: z.boolean().default(false),
})

export type MatchFormData = z.infer<typeof matchSchema>

export const matchParticipantSchema = z.object({
  match_id: z.string().uuid("Invalid match ID"),
  wrestler_id: z.string().uuid("Invalid wrestler ID"),
  is_winner: z.boolean().default(false),
  victory_type: z
    .enum(["pin", "submission", "ko", "dq", "countout", "no_contest"])
    .optional()
    .nullable(),
  has_debut_bonus: z.boolean().default(false),
  has_title_defense_bonus: z.boolean().default(false),
  has_botch_malus: z.boolean().default(false),
  has_short_match_malus: z.boolean().default(false),
  has_squash_loss_malus: z.boolean().default(false),
})

export type MatchParticipantFormData = z.infer<typeof matchParticipantSchema>

// ============================================
// DRAFT VALIDATIONS
// ============================================

export const draftBidSchema = z.object({
  league_id: z.string().uuid("Invalid league ID"),
  season: z.number().int().min(1),
  quarter: z.number().int().min(1).max(4),
  wrestler_id: z.string().uuid("Invalid wrestler ID"),
  bid_amount: z.coerce
    .number()
    .min(MINIMUM_BID, `Minimum bid is ${MINIMUM_BID} point`)
    .max(INITIAL_BUDGET, `Maximum bid is ${INITIAL_BUDGET} points`),
})

export type DraftBidFormData = z.infer<typeof draftBidSchema>

export function validateBudget(
  currentBudget: number,
  bidAmount: number,
  rosterCount: number
): { isValid: boolean; error?: string } {
  if (bidAmount > currentBudget) {
    return { isValid: false, error: `You only have ${currentBudget} points remaining` }
  }

  if (rosterCount >= ROSTER_SIZE) {
    return { isValid: false, error: `You already have ${ROSTER_SIZE} wrestlers` }
  }

  // Ensure enough budget for remaining roster spots
  const remainingSpots = ROSTER_SIZE - rosterCount - 1
  const minimumRequired = remainingSpots * MINIMUM_BID
  const budgetAfterBid = currentBudget - bidAmount

  if (budgetAfterBid < minimumRequired) {
    return {
      isValid: false,
      error: `You need at least ${minimumRequired} points for remaining ${remainingSpots} roster spots`,
    }
  }

  return { isValid: true }
}

// ============================================
// LINEUP VALIDATIONS
// ============================================

export const lineupSchema = z.object({
  roster_id: z.string().uuid("Invalid roster ID"),
  week: z.number().int().min(1),
  season: z.number().int().min(1),
  quarter: z.number().int().min(1).max(4),
  captain_wrestler_id: z.string().uuid("Please select a captain"),
  starters: z
    .array(z.string().uuid())
    .length(STARTERS_COUNT, `Must have exactly ${STARTERS_COUNT} starters`),
  reserves: z
    .array(
      z.object({
        wrestler_id: z.string().uuid(),
        priority_order: z.number().int().min(1).max(RESERVES_COUNT),
      })
    )
    .length(RESERVES_COUNT, `Must have exactly ${RESERVES_COUNT} reserves`),
})

export type LineupFormData = z.infer<typeof lineupSchema>

export function validateLineupSelection(
  starters: string[],
  reserves: { wrestler_id: string; priority_order: number }[],
  captainId: string | null,
  availableWrestlerIds: string[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check starters count
  if (starters.length !== STARTERS_COUNT) {
    errors.push(`Must have exactly ${STARTERS_COUNT} starters`)
  }

  // Check reserves count
  if (reserves.length !== RESERVES_COUNT) {
    errors.push(`Must have exactly ${RESERVES_COUNT} reserves`)
  }

  // Check captain is selected
  if (!captainId) {
    errors.push("Please select a captain")
  }

  // Check captain is in starters
  if (captainId && !starters.includes(captainId)) {
    errors.push("Captain must be one of your starters")
  }

  // Check all wrestlers are unique
  const allWrestlerIds = [...starters, ...reserves.map((r) => r.wrestler_id)]
  const uniqueIds = new Set(allWrestlerIds)
  if (uniqueIds.size !== allWrestlerIds.length) {
    errors.push("Each wrestler can only appear once in the lineup")
  }

  // Check all wrestlers are in the roster
  for (const id of allWrestlerIds) {
    if (!availableWrestlerIds.includes(id)) {
      errors.push("Some selected wrestlers are not in your roster")
      break
    }
  }

  // Check reserve priorities
  const priorities = reserves.map((r) => r.priority_order).sort((a, b) => a - b)
  const expectedPriorities = Array.from({ length: RESERVES_COUNT }, (_, i) => i + 1)
  if (JSON.stringify(priorities) !== JSON.stringify(expectedPriorities)) {
    errors.push("Reserve priorities must be 1, 2, 3, and 4")
  }

  return { isValid: errors.length === 0, errors }
}

// ============================================
// TRADE VALIDATIONS
// ============================================

export const tradeProposalSchema = z.object({
  league_id: z.string().uuid("Invalid league ID"),
  receiver_id: z.string().uuid("Please select a trade partner"),
  offered_wrestler_ids: z
    .array(z.string().uuid())
    .min(1, "Must offer at least one wrestler"),
  requested_wrestler_ids: z
    .array(z.string().uuid())
    .min(1, "Must request at least one wrestler"),
})

export type TradeProposalFormData = z.infer<typeof tradeProposalSchema>

// ============================================
// LEAGUE VALIDATIONS
// ============================================

export const leagueSchema = z.object({
  name: z
    .string()
    .min(3, "League name must be at least 3 characters")
    .max(50, "League name must be at most 50 characters"),
})

export type LeagueFormData = z.infer<typeof leagueSchema>
