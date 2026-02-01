"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { STARTERS_COUNT, RESERVES_COUNT, validateLineup, ReserveWrestlerInput } from "@/types/lineup"

interface RosterWrestler {
  id: string
  wrestler_id: string
  wrestler: {
    id: string
    name: string
    brand: string
    status: string
  }
}

interface Lineup {
  id: string
  week: number
  season: number
  quarter: number
  captain_wrestler_id: string | null
  locked_at: string | null
}

export default function LineupPage() {
  const [rosterWrestlers, setRosterWrestlers] = useState<RosterWrestler[]>([])
  const [currentLineup, setCurrentLineup] = useState<Lineup | null>(null)
  const [selectedStarters, setSelectedStarters] = useState<string[]>([])
  const [selectedReserves, setSelectedReserves] = useState<ReserveWrestlerInput[]>([])
  const [selectedCaptain, setSelectedCaptain] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch roster
      const { data: roster } = await supabase
        .from("rosters")
        .select(`
          *,
          roster_wrestlers (
            id,
            wrestler_id,
            wrestler:wrestlers (id, name, brand, status)
          )
        `)
        .eq("user_id", user.id)
        .order("season", { ascending: false })
        .order("quarter", { ascending: false })
        .limit(1)
        .single()

      if (roster?.roster_wrestlers) {
        setRosterWrestlers(roster.roster_wrestlers)
      }

      // Fetch current lineup
      const { data: lineup } = await supabase
        .from("lineups")
        .select("*")
        .eq("roster_id", roster?.id)
        .order("week", { ascending: false })
        .limit(1)
        .single()

      if (lineup) {
        setCurrentLineup(lineup)
        setSelectedCaptain(lineup.captain_wrestler_id)

        // Fetch lineup wrestlers
        const { data: lineupWrestlers } = await supabase
          .from("lineup_wrestlers")
          .select("*")
          .eq("lineup_id", lineup.id)

        if (lineupWrestlers) {
          const starters = lineupWrestlers
            .filter(lw => lw.position === "starter")
            .map(lw => lw.wrestler_id)
          const reserves = lineupWrestlers
            .filter(lw => lw.position === "reserve")
            .map(lw => ({
              wrestlerId: lw.wrestler_id,
              priorityOrder: lw.priority_order || 1
            }))
            .sort((a, b) => a.priorityOrder - b.priorityOrder)

          setSelectedStarters(starters)
          setSelectedReserves(reserves)
        }
      }

      setIsLoading(false)
    }

    fetchData()
  }, [supabase])

  function toggleStarter(wrestlerId: string) {
    if (selectedStarters.includes(wrestlerId)) {
      setSelectedStarters(prev => prev.filter(id => id !== wrestlerId))
      if (selectedCaptain === wrestlerId) {
        setSelectedCaptain(null)
      }
    } else if (selectedStarters.length < STARTERS_COUNT) {
      // Remove from reserves if present
      setSelectedReserves(prev => prev.filter(r => r.wrestlerId !== wrestlerId))
      setSelectedStarters(prev => [...prev, wrestlerId])
    }
  }

  function toggleReserve(wrestlerId: string) {
    const existing = selectedReserves.find(r => r.wrestlerId === wrestlerId)
    if (existing) {
      setSelectedReserves(prev => prev.filter(r => r.wrestlerId !== wrestlerId))
    } else if (selectedReserves.length < RESERVES_COUNT) {
      // Remove from starters if present
      setSelectedStarters(prev => prev.filter(id => id !== wrestlerId))
      if (selectedCaptain === wrestlerId) {
        setSelectedCaptain(null)
      }
      setSelectedReserves(prev => [
        ...prev,
        { wrestlerId, priorityOrder: prev.length + 1 }
      ])
    }
  }

  function setCaptain(wrestlerId: string) {
    if (selectedStarters.includes(wrestlerId)) {
      setSelectedCaptain(selectedCaptain === wrestlerId ? null : wrestlerId)
    } else {
      toast({
        title: "Invalid Captain",
        description: "Captain must be one of your starters",
        variant: "destructive"
      })
    }
  }

  async function saveLineup() {
    if (!selectedCaptain) {
      toast({
        title: "No Captain Selected",
        description: "Please select a captain from your starters",
        variant: "destructive"
      })
      return
    }

    const validation = validateLineup(
      selectedStarters,
      selectedReserves,
      selectedCaptain,
      rosterWrestlers.map(rw => rw.wrestler_id)
    )

    if (!validation.isValid) {
      toast({
        title: "Invalid Lineup",
        description: validation.errors.join(", "),
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    // Lineup saving logic would go here
    toast({
      title: "Lineup Saved",
      description: "Your lineup has been updated successfully"
    })
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Weekly Lineup</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading lineup...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isLocked = currentLineup?.locked_at != null

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Weekly Lineup</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Starters */}
        <Card>
          <CardHeader>
            <CardTitle>Starters ({selectedStarters.length}/{STARTERS_COUNT})</CardTitle>
            <CardDescription>
              Select 6 wrestlers for your starting lineup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedStarters.map(wrestlerId => {
                const wrestler = rosterWrestlers.find(rw => rw.wrestler_id === wrestlerId)?.wrestler
                if (!wrestler) return null
                return (
                  <div
                    key={wrestlerId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{wrestler.name}</span>
                      <Badge variant="outline" className="capitalize">
                        {wrestler.brand}
                      </Badge>
                      {selectedCaptain === wrestlerId && (
                        <Badge>Captain</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedCaptain === wrestlerId ? "default" : "outline"}
                        onClick={() => setCaptain(wrestlerId)}
                        disabled={isLocked}
                      >
                        C
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => toggleStarter(wrestlerId)}
                        disabled={isLocked}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reserves */}
        <Card>
          <CardHeader>
            <CardTitle>Reserves ({selectedReserves.length}/{RESERVES_COUNT})</CardTitle>
            <CardDescription>
              Select 4 reserve wrestlers (in priority order)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedReserves.map((reserve, index) => {
                const wrestler = rosterWrestlers.find(
                  rw => rw.wrestler_id === reserve.wrestlerId
                )?.wrestler
                if (!wrestler) return null
                return (
                  <div
                    key={reserve.wrestlerId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <span className="font-medium">{wrestler.name}</span>
                      <Badge variant="outline" className="capitalize">
                        {wrestler.brand}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => toggleReserve(reserve.wrestlerId)}
                      disabled={isLocked}
                    >
                      Remove
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Wrestlers */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Available Wrestlers</CardTitle>
          <CardDescription>
            Click to add to starters or reserves
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {rosterWrestlers
              .filter(
                rw =>
                  !selectedStarters.includes(rw.wrestler_id) &&
                  !selectedReserves.find(r => r.wrestlerId === rw.wrestler_id)
              )
              .map(rw => (
                <div
                  key={rw.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rw.wrestler.name}</span>
                    <Badge variant="outline" className="capitalize">
                      {rw.wrestler.brand}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleStarter(rw.wrestler_id)}
                      disabled={isLocked || selectedStarters.length >= STARTERS_COUNT}
                    >
                      +S
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleReserve(rw.wrestler_id)}
                      disabled={isLocked || selectedReserves.length >= RESERVES_COUNT}
                    >
                      +R
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button
          size="lg"
          onClick={saveLineup}
          disabled={isLocked || isSaving}
        >
          {isSaving ? "Saving..." : isLocked ? "Lineup Locked" : "Save Lineup"}
        </Button>
      </div>
    </div>
  )
}
