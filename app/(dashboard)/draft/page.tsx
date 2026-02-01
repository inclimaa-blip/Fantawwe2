"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { INITIAL_BUDGET, MINIMUM_BID, ROSTER_SIZE } from "@/types/draft"

interface Wrestler {
  id: string
  name: string
  brand: string
  status: string
}

interface DraftBid {
  id: string
  wrestler_id: string
  bid_amount: number
  is_winning_bid: boolean
  wrestler: Wrestler
}

export default function DraftPage() {
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([])
  const [myBids, setMyBids] = useState<DraftBid[]>([])
  const [budgetRemaining, setBudgetRemaining] = useState(INITIAL_BUDGET)
  const [rosterCount, setRosterCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [bidAmounts, setBidAmounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      // Fetch all available wrestlers
      const { data: wrestlersData } = await supabase
        .from("wrestlers")
        .select("*")
        .eq("status", "active")
        .order("name")

      if (wrestlersData) {
        setWrestlers(wrestlersData)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's current roster to calculate budget
      const { data: roster } = await supabase
        .from("rosters")
        .select(`
          budget_remaining,
          roster_wrestlers (id)
        `)
        .eq("user_id", user.id)
        .order("season", { ascending: false })
        .order("quarter", { ascending: false })
        .limit(1)
        .single()

      if (roster) {
        setBudgetRemaining(roster.budget_remaining)
        setRosterCount(roster.roster_wrestlers?.length || 0)
      }

      // Fetch user's bids
      const { data: bidsData } = await supabase
        .from("draft_bids")
        .select(`
          *,
          wrestler:wrestlers (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (bidsData) {
        setMyBids(bidsData)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [supabase])

  const filteredWrestlers = wrestlers.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const wonWrestlerIds = myBids
    .filter(b => b.is_winning_bid)
    .map(b => b.wrestler_id)

  async function placeBid(wrestlerId: string) {
    const amount = bidAmounts[wrestlerId] || MINIMUM_BID

    if (amount < MINIMUM_BID) {
      toast({
        title: "Invalid Bid",
        description: `Minimum bid is ${MINIMUM_BID} point`,
        variant: "destructive"
      })
      return
    }

    if (amount > budgetRemaining) {
      toast({
        title: "Insufficient Budget",
        description: `You only have ${budgetRemaining} points remaining`,
        variant: "destructive"
      })
      return
    }

    if (rosterCount >= ROSTER_SIZE) {
      toast({
        title: "Roster Full",
        description: `You already have ${ROSTER_SIZE} wrestlers`,
        variant: "destructive"
      })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // In a real implementation, this would go through an API route
    // that handles the auction logic properly
    toast({
      title: "Bid Placed",
      description: `You bid ${amount} points on this wrestler`
    })
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Draft Auction</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading draft...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Draft Auction</h1>

      {/* Status Bar */}
      <div className="grid gap-4 mb-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Budget Remaining</CardDescription>
            <CardTitle className="text-2xl">{budgetRemaining} pts</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Roster Size</CardDescription>
            <CardTitle className="text-2xl">{rosterCount}/{ROSTER_SIZE}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Min Bid</CardDescription>
            <CardTitle className="text-2xl">{MINIMUM_BID} pt</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* My Winning Bids */}
      {myBids.filter(b => b.is_winning_bid).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Roster (Won)</CardTitle>
            <CardDescription>
              Wrestlers you have successfully drafted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {myBids
                .filter(b => b.is_winning_bid)
                .map(bid => (
                  <Badge key={bid.id} variant="secondary" className="py-2 px-3">
                    {bid.wrestler.name} ({bid.bid_amount} pts)
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Wrestlers */}
      <Card>
        <CardHeader>
          <CardTitle>Available Wrestlers</CardTitle>
          <CardDescription>
            Place bids on wrestlers to add them to your roster
          </CardDescription>
          <div className="mt-4">
            <Input
              placeholder="Search wrestlers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wrestler</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Your Bid</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWrestlers
                .filter(w => !wonWrestlerIds.includes(w.id))
                .map(wrestler => (
                  <TableRow key={wrestler.id}>
                    <TableCell className="font-medium">{wrestler.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {wrestler.brand}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={MINIMUM_BID}
                        max={budgetRemaining}
                        value={bidAmounts[wrestler.id] || ""}
                        onChange={(e) =>
                          setBidAmounts({
                            ...bidAmounts,
                            [wrestler.id]: parseInt(e.target.value) || 0
                          })
                        }
                        placeholder={`${MINIMUM_BID}`}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => placeBid(wrestler.id)}
                        disabled={rosterCount >= ROSTER_SIZE}
                      >
                        Place Bid
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
