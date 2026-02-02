"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { LeagueStatus } from "@/types/database"
import { Users, LogIn, LogOut, Crown } from "lucide-react"

interface League {
  id: string
  name: string
  commissioner_id: string | null
  current_season: number
  current_quarter: number
  status: LeagueStatus
  created_at: string
  member_count?: number
  is_member?: boolean
  commissioner_name?: string
}

const STATUS_LABELS: Record<LeagueStatus, string> = {
  draft: "Draft Open",
  active: "Active",
  extension: "Extension Period",
  trade_window: "Trade Window",
  completed: "Completed",
}

const STATUS_COLORS: Record<LeagueStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "default",
  active: "secondary",
  extension: "outline",
  trade_window: "outline",
  completed: "destructive",
}

export default function LeaguesPage() {
  const [myLeagues, setMyLeagues] = useState<League[]>([])
  const [availableLeagues, setAvailableLeagues] = useState<League[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchUserAndLeagues()
  }, [])

  async function fetchUserAndLeagues() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }
    setCurrentUserId(user.id)

    // Fetch all leagues with member count and commissioner name
    const { data: leagues, error: leaguesError } = await supabase
      .from("leagues")
      .select(`
        *,
        league_members(count),
        commissioner:profiles!leagues_commissioner_id_fkey(username)
      `)
      .order("created_at", { ascending: false })

    if (leaguesError) {
      toast({
        title: "Error",
        description: "Failed to load leagues",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Fetch user's memberships
    const { data: memberships } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", user.id)

    const memberLeagueIds = new Set(memberships?.map(m => m.league_id) || [])

    // Process leagues
    const processedLeagues = leagues?.map(league => ({
      ...league,
      member_count: league.league_members?.[0]?.count || 0,
      is_member: memberLeagueIds.has(league.id),
      commissioner_name: league.commissioner?.username || "Unknown",
    })) || []

    // Separate into my leagues and available leagues
    setMyLeagues(processedLeagues.filter(l => l.is_member))
    setAvailableLeagues(processedLeagues.filter(l => !l.is_member && l.status === "draft"))

    setIsLoading(false)
  }

  async function joinLeague(leagueId: string) {
    if (!currentUserId) return

    const { error } = await supabase
      .from("league_members")
      .insert({
        league_id: leagueId,
        user_id: currentUserId,
      })

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    // Also create a roster for the user in this league
    const league = availableLeagues.find(l => l.id === leagueId)
    if (league) {
      await supabase.from("rosters").insert({
        league_id: leagueId,
        user_id: currentUserId,
        season: league.current_season,
        quarter: league.current_quarter,
        budget_remaining: 100,
      })
    }

    toast({
      title: "Success",
      description: "You have joined the league!",
    })

    fetchUserAndLeagues()
  }

  async function leaveLeague(leagueId: string) {
    if (!currentUserId) return

    // First check if user has any wrestlers drafted
    const { data: roster } = await supabase
      .from("rosters")
      .select("id")
      .eq("league_id", leagueId)
      .eq("user_id", currentUserId)
      .single()

    if (roster) {
      const { data: wrestlers } = await supabase
        .from("roster_wrestlers")
        .select("id")
        .eq("roster_id", roster.id)

      if (wrestlers && wrestlers.length > 0) {
        toast({
          title: "Cannot leave",
          description: "You cannot leave a league where you have drafted wrestlers.",
          variant: "destructive",
        })
        return
      }
    }

    const { error } = await supabase
      .from("league_members")
      .delete()
      .eq("league_id", leagueId)
      .eq("user_id", currentUserId)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Success",
      description: "You have left the league",
    })

    fetchUserAndLeagues()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading leagues...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leagues</h1>
        <p className="text-muted-foreground">
          View your leagues and join new ones
        </p>
      </div>

      {/* My Leagues */}
      <Card>
        <CardHeader>
          <CardTitle>My Leagues</CardTitle>
          <CardDescription>
            Leagues you are currently participating in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myLeagues.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You haven&apos;t joined any leagues yet. Join one below!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Season / Quarter</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Commissioner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myLeagues.map((league) => (
                  <TableRow key={league.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {league.name}
                        {league.commissioner_id === currentUserId && (
                          <Crown className="h-4 w-4 text-yellow-500" title="You are the commissioner" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      S{league.current_season} / Q{league.current_quarter}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {league.member_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>{league.commissioner_name}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[league.status]}>
                        {STATUS_LABELS[league.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {league.status === "draft" && league.commissioner_id !== currentUserId && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <LogOut className="h-4 w-4 mr-1" />
                              Leave
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Leave League</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to leave &quot;{league.name}&quot;?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => leaveLeague(league.id)}>
                                Leave League
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Available Leagues */}
      <Card>
        <CardHeader>
          <CardTitle>Available Leagues</CardTitle>
          <CardDescription>
            Leagues with open drafts you can join
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableLeagues.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No leagues with open drafts available right now.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Season / Quarter</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Commissioner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableLeagues.map((league) => (
                  <TableRow key={league.id}>
                    <TableCell className="font-medium">{league.name}</TableCell>
                    <TableCell>
                      S{league.current_season} / Q{league.current_quarter}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {league.member_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>{league.commissioner_name}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => joinLeague(league.id)}>
                        <LogIn className="h-4 w-4 mr-1" />
                        Join
                      </Button>
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
