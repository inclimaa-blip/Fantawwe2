"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  calculatePlayerMatchPoints,
  MatchData,
  ParticipantData,
  LineupWrestlerData,
} from "@/lib/points-calculator"
import { PlayerMatchPoints, WeeklyPointsSummary } from "@/types/points"
import { useToast } from "@/hooks/use-toast"

export function usePoints(leagueId: string, week?: number, season?: number, quarter?: number) {
  const [weeklyPoints, setWeeklyPoints] = useState<WeeklyPointsSummary[]>([])
  const [userPoints, setUserPoints] = useState<PlayerMatchPoints[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()
  const supabase = createClient()

  const fetchPoints = useCallback(async () => {
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

      const targetSeason = season || league.current_season
      const targetQuarter = quarter || league.current_quarter

      // Fetch user's lineup for the week
      const { data: roster } = await supabase
        .from("rosters")
        .select(`
          *,
          lineups (
            *,
            lineup_wrestlers (
              *,
              wrestler:wrestlers (*)
            )
          )
        `)
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
        .eq("season", targetSeason)
        .eq("quarter", targetQuarter)
        .single()

      if (!roster) {
        setIsLoading(false)
        return
      }

      // Find the lineup for the specified week
      const targetWeek = week || Math.max(...(roster.lineups?.map((l: { week: number }) => l.week) || [1]))
      const lineup = roster.lineups?.find((l: { week: number }) => l.week === targetWeek)

      if (!lineup) {
        setIsLoading(false)
        return
      }

      // Fetch shows and matches for the week
      const { data: shows } = await supabase
        .from("shows")
        .select(`
          *,
          matches (
            *,
            match_participants (
              *,
              wrestler:wrestlers (*)
            )
          )
        `)
        .eq("season", targetSeason)
        .eq("quarter", targetQuarter)
        .eq("week", targetWeek)

      if (!shows || shows.length === 0) {
        setIsLoading(false)
        return
      }

      // Build lineup wrestler data
      const lineupWrestlers: LineupWrestlerData[] = (lineup.lineup_wrestlers || [])
        .filter((lw: { position: string }) => lw.position === "starter")
        .map((lw: { wrestler_id: string; wrestler: { name: string } }) => ({
          wrestlerId: lw.wrestler_id,
          wrestlerName: lw.wrestler?.name || "Unknown",
          isCaptain: lw.wrestler_id === lineup.captain_wrestler_id,
        }))

      // Calculate points for each match
      const matchPoints: PlayerMatchPoints[] = []
      let total = 0

      for (const show of shows) {
        for (const match of show.matches || []) {
          const matchData: MatchData = {
            id: match.id,
            rating: match.rating,
            durationMinutes: match.duration_minutes,
            isTitleMatch: match.is_title_match,
            titleLevel: match.title_level,
            isMainEvent: match.is_main_event,
            isSpecialStipulation: match.is_special_stipulation,
          }

          const participants: ParticipantData[] = (match.match_participants || []).map(
            (mp: {
              wrestler_id: string
              wrestler: { name: string }
              is_winner: boolean
              victory_type: string | null
              has_debut_bonus: boolean
              has_title_defense_bonus: boolean
              has_botch_malus: boolean
              has_short_match_malus: boolean
              has_squash_loss_malus: boolean
            }) => ({
              wrestlerId: mp.wrestler_id,
              wrestlerName: mp.wrestler?.name || "Unknown",
              isWinner: mp.is_winner,
              victoryType: mp.victory_type,
              hasDebutBonus: mp.has_debut_bonus,
              hasTitleDefenseBonus: mp.has_title_defense_bonus,
              hasBotchMalus: mp.has_botch_malus,
              hasShortMatchMalus: mp.has_short_match_malus,
              hasSquashLossMalus: mp.has_squash_loss_malus,
            })
          )

          const points = calculatePlayerMatchPoints(matchData, participants, lineupWrestlers)
          if (points) {
            matchPoints.push(points)
            total += points.totalMatchPoints
          }
        }
      }

      setUserPoints(matchPoints)
      setTotalPoints(total)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching points:", error)
      toast({
        title: "Error",
        description: "Failed to load points",
        variant: "destructive",
      })
    }
  }, [leagueId, week, season, quarter, supabase, toast])

  useEffect(() => {
    fetchPoints()
  }, [fetchPoints])

  return {
    weeklyPoints,
    userPoints,
    totalPoints,
    isLoading,
    refresh: fetchPoints,
  }
}
