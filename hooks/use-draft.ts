"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { DraftState, DraftWrestler, INITIAL_BUDGET, ROSTER_SIZE } from "@/types/draft"
import { useToast } from "@/hooks/use-toast"

export function useDraft(leagueId: string) {
  const [draftState, setDraftState] = useState<DraftState | null>(null)
  const [budgetRemaining, setBudgetRemaining] = useState(INITIAL_BUDGET)
  const [rosterCount, setRosterCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()
  const supabase = createClient()

  const fetchDraftState = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch league info
      const { data: league } = await supabase
        .from("leagues")
        .select("*")
        .eq("id", leagueId)
        .single()

      if (!league) return

      // Fetch all wrestlers
      const { data: wrestlers } = await supabase
        .from("wrestlers")
        .select("*")
        .eq("status", "active")
        .order("name")

      // Fetch user's roster
      const { data: roster } = await supabase
        .from("rosters")
        .select(`
          *,
          roster_wrestlers (*)
        `)
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
        .eq("season", league.current_season)
        .eq("quarter", league.current_quarter)
        .single()

      if (roster) {
        setBudgetRemaining(roster.budget_remaining)
        setRosterCount(roster.roster_wrestlers?.length || 0)
      }

      // Fetch all winning bids
      const { data: winningBids } = await supabase
        .from("draft_bids")
        .select(`
          *,
          wrestler:wrestlers (*),
          user:profiles (*)
        `)
        .eq("league_id", leagueId)
        .eq("season", league.current_season)
        .eq("quarter", league.current_quarter)
        .eq("is_winning_bid", true)

      const draftWrestlers: DraftWrestler[] = (wrestlers || []).map((w) => {
        const winningBid = winningBids?.find((b) => b.wrestler_id === w.id)
        return {
          id: w.id,
          name: w.name,
          brand: w.brand,
          nominated: false,
          sold: !!winningBid,
          finalPrice: winningBid?.bid_amount,
          winnerId: winningBid?.user_id,
          winnerName: winningBid?.user?.username,
        }
      })

      setDraftState({
        leagueId,
        season: league.current_season,
        quarter: league.current_quarter,
        status: league.status === "draft" ? "active" : "completed",
        currentWrestlerId: null,
        currentWrestlerName: null,
        currentHighBid: null,
        currentHighBidder: null,
        currentHighBidderName: null,
        timeRemaining: null,
        availableWrestlers: draftWrestlers,
        completedBids: (winningBids || []) as unknown as DraftState["completedBids"],
      })

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching draft state:", error)
      toast({
        title: "Error",
        description: "Failed to load draft state",
        variant: "destructive",
      })
    }
  }, [leagueId, supabase, toast])

  useEffect(() => {
    fetchDraftState()
  }, [fetchDraftState])

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`draft:${leagueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "draft_bids",
          filter: `league_id=eq.${leagueId}`,
        },
        () => {
          fetchDraftState()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leagueId, supabase, fetchDraftState])

  async function placeBid(wrestlerId: string, amount: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !draftState) return

    if (amount > budgetRemaining) {
      toast({
        title: "Insufficient Budget",
        description: `You only have ${budgetRemaining} points remaining`,
        variant: "destructive",
      })
      return
    }

    if (rosterCount >= ROSTER_SIZE) {
      toast({
        title: "Roster Full",
        description: `You already have ${ROSTER_SIZE} wrestlers`,
        variant: "destructive",
      })
      return
    }

    const { error } = await supabase.from("draft_bids").insert({
      league_id: leagueId,
      season: draftState.season,
      quarter: draftState.quarter,
      wrestler_id: wrestlerId,
      user_id: user.id,
      bid_amount: amount,
    })

    if (error) {
      toast({
        title: "Bid Failed",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Bid Placed",
      description: `You bid ${amount} points`,
    })

    fetchDraftState()
  }

  return {
    draftState,
    budgetRemaining,
    rosterCount,
    isLoading,
    placeBid,
    refresh: fetchDraftState,
  }
}
