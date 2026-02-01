"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLineup } from "@/hooks/use-lineup"
import { STARTERS_COUNT, RESERVES_COUNT } from "@/types/lineup"

export default function LineupPage() {
  const {
    roster,
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
  } = useLineup()

  const rosterWrestlers = roster?.wrestlers || []

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

  if (!roster) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Weekly Lineup</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              You don&apos;t have a roster yet. Join a league and draft your team.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                        onClick={() => removeStarter(wrestlerId)}
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
                      onClick={() => removeReserve(reserve.wrestlerId)}
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
                      onClick={() => addStarter(rw.wrestler_id)}
                      disabled={isLocked || selectedStarters.length >= STARTERS_COUNT}
                    >
                      +S
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addReserve(rw.wrestler_id)}
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
