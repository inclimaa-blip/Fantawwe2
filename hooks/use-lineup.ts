"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  LineupWithWrestlers,
  RosterWithWrestlers,
  ReserveWrestlerInput,
  validateLineup,
  STARTERS_COUNT,
  RESERVES_COUNT,
} from "@/types/lineup"
import { useToast } from "@/hooks/use-toast"

export function useLineup() {
  const [roster, setRoster] = useState<RosterWithWrestlers | null>(null)
  const [lineup, setLineup] = useState<LineupWithWrestlers | null>(null)
  const [selectedStarters, setSelectedStarters] = useState<string[]>([])
  const [selectedReserves, setSelectedReserves] = useState<ReserveWrestlerInput[]>([])
  const [selectedCaptain, setSelectedCaptain] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()

  const fetchLineup = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's current roster
      const { data: rosterData } = await supabase
        .from("rosters")
        .select(`
          *,
          roster_wrestlers (
            *,
            wrestler:wrestlers (*)
          )
        `)
        .eq("user_id", user.id)
        .order("season", { ascending: false })
        .order("quarter", { ascending: false })
        .limit(1)
        .single()

      if (rosterData) {
        const rosterWithWrestlers: RosterWithWrestlers = {
          ...(rosterData as RosterWithWrestlers),
          wrestlers: rosterData.roster_wrestlers || [],
        }
        setRoster(rosterWithWrestlers)

        // Fetch current lineup
        const { data: lineupData } = await supabase
          .from("lineups")
          .select(`
            *,
            lineup_wrestlers (
              *,
              wrestler:wrestlers (*)
            )
          `)
          .eq("roster_id", rosterData.id)
          .order("week", { ascending: false })
          .limit(1)
          .single()

        if (lineupData) {
          const lineupWithWrestlers: LineupWithWrestlers = {
            ...(lineupData as LineupWithWrestlers),
            wrestlers: lineupData.lineup_wrestlers || [],
          }
          setLineup(lineupWithWrestlers)
          setSelectedCaptain(lineupData.captain_wrestler_id)

          const starters = (lineupData.lineup_wrestlers || [])
            .filter((lw: { position: string }) => lw.position === "starter")
            .map((lw: { wrestler_id: string }) => lw.wrestler_id)

          const reserves = (lineupData.lineup_wrestlers || [])
            .filter((lw: { position: string }) => lw.position === "reserve")
            .map((lw: { wrestler_id: string; priority_order: number | null }) => ({
              wrestlerId: lw.wrestler_id,
              priorityOrder: lw.priority_order || 1,
            }))
            .sort((a: ReserveWrestlerInput, b: ReserveWrestlerInput) => a.priorityOrder - b.priorityOrder)

          setSelectedStarters(starters)
          setSelectedReserves(reserves)
        }
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching lineup:", error)
      toast({
        title: "Error",
        description: "Failed to load lineup",
        variant: "destructive",
      })
    }
  }, [supabase, toast])

  useEffect(() => {
    fetchLineup()
  }, [fetchLineup])

  function addStarter(wrestlerId: string) {
    if (selectedStarters.length >= STARTERS_COUNT) {
      toast({
        title: "Starters Full",
        description: `You can only have ${STARTERS_COUNT} starters`,
        variant: "destructive",
      })
      return
    }

    // Remove from reserves if present
    setSelectedReserves((prev) => prev.filter((r) => r.wrestlerId !== wrestlerId))
    setSelectedStarters((prev) => [...prev, wrestlerId])
  }

  function removeStarter(wrestlerId: string) {
    setSelectedStarters((prev) => prev.filter((id) => id !== wrestlerId))
    if (selectedCaptain === wrestlerId) {
      setSelectedCaptain(null)
    }
  }

  function addReserve(wrestlerId: string) {
    if (selectedReserves.length >= RESERVES_COUNT) {
      toast({
        title: "Reserves Full",
        description: `You can only have ${RESERVES_COUNT} reserves`,
        variant: "destructive",
      })
      return
    }

    // Remove from starters if present
    removeStarter(wrestlerId)
    setSelectedReserves((prev) => [
      ...prev,
      { wrestlerId, priorityOrder: prev.length + 1 },
    ])
  }

  function removeReserve(wrestlerId: string) {
    setSelectedReserves((prev) => {
      const filtered = prev.filter((r) => r.wrestlerId !== wrestlerId)
      // Reorder priorities
      return filtered.map((r, index) => ({ ...r, priorityOrder: index + 1 }))
    })
  }

  function setCaptain(wrestlerId: string) {
    if (!selectedStarters.includes(wrestlerId)) {
      toast({
        title: "Invalid Captain",
        description: "Captain must be one of your starters",
        variant: "destructive",
      })
      return
    }
    setSelectedCaptain(wrestlerId)
  }

  async function saveLineup() {
    if (!roster) {
      toast({
        title: "No Roster",
        description: "You need a roster to save a lineup",
        variant: "destructive",
      })
      return
    }

    if (!selectedCaptain) {
      toast({
        title: "No Captain",
        description: "Please select a captain from your starters",
        variant: "destructive",
      })
      return
    }

    const availableWrestlerIds = roster.wrestlers.map((w) => w.wrestler_id)
    const validation = validateLineup(
      selectedStarters,
      selectedReserves,
      selectedCaptain,
      availableWrestlerIds
    )

    if (!validation.isValid) {
      toast({
        title: "Invalid Lineup",
        description: validation.errors.join(", "),
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculate current week (simplified - in production, this would be more sophisticated)
      const currentWeek = lineup?.week || 1

      // Upsert lineup
      const { data: newLineup, error: lineupError } = await supabase
        .from("lineups")
        .upsert({
          id: lineup?.id,
          roster_id: roster.id,
          week: currentWeek,
          season: roster.season,
          quarter: roster.quarter,
          captain_wrestler_id: selectedCaptain,
        })
        .select()
        .single()

      if (lineupError) throw lineupError

      // Delete existing lineup wrestlers
      if (lineup?.id) {
        await supabase
          .from("lineup_wrestlers")
          .delete()
          .eq("lineup_id", lineup.id)
      }

      // Insert new lineup wrestlers
      const lineupWrestlers = [
        ...selectedStarters.map((wrestlerId) => ({
          lineup_id: newLineup.id,
          wrestler_id: wrestlerId,
          position: "starter" as const,
          priority_order: null,
        })),
        ...selectedReserves.map((reserve) => ({
          lineup_id: newLineup.id,
          wrestler_id: reserve.wrestlerId,
          position: "reserve" as const,
          priority_order: reserve.priorityOrder,
        })),
      ]

      const { error: wrestlersError } = await supabase
        .from("lineup_wrestlers")
        .insert(lineupWrestlers)

      if (wrestlersError) throw wrestlersError

      toast({
        title: "Lineup Saved",
        description: "Your lineup has been updated successfully",
      })

      fetchLineup()
    } catch (error) {
      console.error("Error saving lineup:", error)
      toast({
        title: "Error",
        description: "Failed to save lineup",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isLocked = lineup?.locked_at != null

  return {
    roster,
    lineup,
    selectedStarters,
    selectedReserves,
    selectedCaptain,
    isLoading,
    isSaving,
    isLocked,
    addStarter,
    removeStarter,
    addReserve,
    removeReserve,
    setCaptain,
    saveLineup,
    refresh: fetchLineup,
  }
}
