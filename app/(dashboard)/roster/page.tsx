import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

async function RosterContent() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <p>Please log in to view your roster.</p>
  }

  // Get user's current roster
  const { data: roster } = await supabase
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

  if (!roster) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Roster Found</CardTitle>
          <CardDescription>
            You don&apos;t have a roster yet. Join a league and participate in the
            draft to build your team!
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const wrestlers = roster.roster_wrestlers || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Roster</CardTitle>
          <CardDescription>
            Season {roster.season} - Quarter {roster.quarter} | Budget Remaining:{" "}
            {roster.budget_remaining} points
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wrestlers.length === 0 ? (
            <p className="text-muted-foreground">
              Your roster is empty. Draft some wrestlers!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wrestler</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Keeper</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wrestlers.map((rw: { id: string; acquisition_cost: number; is_keeper: boolean; wrestler: { id: string; name: string; brand: string; status: string } }) => (
                  <TableRow key={rw.id}>
                    <TableCell className="font-medium">
                      {rw.wrestler.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {rw.wrestler.brand}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          rw.wrestler.status === "active"
                            ? "default"
                            : rw.wrestler.status === "injured"
                            ? "destructive"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {rw.wrestler.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{rw.acquisition_cost} pts</TableCell>
                    <TableCell>
                      {rw.is_keeper && <Badge variant="secondary">Keeper</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function RosterPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Roster</h1>
      <Suspense
        fallback={
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Loading roster...</p>
            </CardContent>
          </Card>
        }
      >
        <RosterContent />
      </Suspense>
    </div>
  )
}
