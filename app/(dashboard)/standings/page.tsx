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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function StandingsContent() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <p>Please log in to view standings.</p>
  }

  // Get user's league membership
  const { data: leagueMember } = await supabase
    .from("league_members")
    .select(`
      league:leagues (
        id,
        name,
        current_season,
        current_quarter,
        status
      )
    `)
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!leagueMember?.league) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No League Found</CardTitle>
          <CardDescription>
            You&apos;re not part of any league yet. Join a league to see standings!
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const league = leagueMember.league as {
    id: string
    name: string
    current_season: number
    current_quarter: number
    status: string
  }

  // Get all league members with their point totals
  const { data: standings } = await supabase
    .from("league_members")
    .select(`
      user_id,
      profile:profiles (
        id,
        username
      )
    `)
    .eq("league_id", league.id)

  // In a real implementation, we'd calculate points from the points table
  // For now, we'll show the member list
  const standingsData = standings?.map((member, index) => {
    const profile = member.profile as { id: string; username: string } | null
    return {
      rank: index + 1,
      userId: member.user_id,
      username: profile?.username || "Unknown",
      weeklyPoints: 0,
      quarterlyPoints: 0,
      totalPoints: 0,
    }
  }) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{league.name}</CardTitle>
              <CardDescription>
                Season {league.current_season} - Quarter {league.current_quarter}
              </CardDescription>
            </div>
            <Badge variant="outline" className="capitalize">
              {league.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="quarterly">Quarter</TabsTrigger>
          <TabsTrigger value="season">Season</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Standings</CardTitle>
              <CardDescription>
                Points earned this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandingsTable
                standings={standingsData}
                pointsField="weeklyPoints"
                currentUserId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Standings</CardTitle>
              <CardDescription>
                Points earned this quarter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandingsTable
                standings={standingsData}
                pointsField="quarterlyPoints"
                currentUserId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="season">
          <Card>
            <CardHeader>
              <CardTitle>Season Standings</CardTitle>
              <CardDescription>
                Total points for the season
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandingsTable
                standings={standingsData}
                pointsField="totalPoints"
                currentUserId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StandingsTable({
  standings,
  pointsField,
  currentUserId,
}: {
  standings: Array<{
    rank: number
    userId: string
    username: string
    weeklyPoints: number
    quarterlyPoints: number
    totalPoints: number
  }>
  pointsField: "weeklyPoints" | "quarterlyPoints" | "totalPoints"
  currentUserId: string
}) {
  const sorted = [...standings].sort(
    (a, b) => b[pointsField] - a[pointsField]
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-right">Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((standing, index) => (
          <TableRow
            key={standing.userId}
            className={standing.userId === currentUserId ? "bg-muted/50" : ""}
          >
            <TableCell>
              <div className="flex items-center">
                {index === 0 && <span className="mr-1">🥇</span>}
                {index === 1 && <span className="mr-1">🥈</span>}
                {index === 2 && <span className="mr-1">🥉</span>}
                {index + 1}
              </div>
            </TableCell>
            <TableCell className="font-medium">
              {standing.username}
              {standing.userId === currentUserId && (
                <Badge variant="outline" className="ml-2">
                  You
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right font-mono">
              {standing[pointsField].toFixed(1)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function StandingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Standings</h1>
      <Suspense
        fallback={
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Loading standings...</p>
            </CardContent>
          </Card>
        }
      >
        <StandingsContent />
      </Suspense>
    </div>
  )
}
