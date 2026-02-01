"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useToast } from "@/hooks/use-toast"
import { ShowType, TitleLevel } from "@/types/database"

const showSchema = z.object({
  name: z.string().min(1, "Name is required"),
  event_date: z.string().min(1, "Date is required"),
  show_type: z.enum(["raw", "smackdown", "nxt", "ple"]),
  season: z.coerce.number().int().min(1),
  quarter: z.coerce.number().int().min(1).max(4),
  week: z.coerce.number().int().min(1),
})

const matchSchema = z.object({
  rating: z.coerce.number().min(0).max(10),
  duration_minutes: z.coerce.number().int().min(0),
  is_title_match: z.boolean().default(false),
  title_level: z.enum(["world", "other"]).optional().nullable(),
  is_main_event: z.boolean().default(false),
  is_special_stipulation: z.boolean().default(false),
})

type ShowForm = z.infer<typeof showSchema>
type MatchForm = z.infer<typeof matchSchema>

interface Show {
  id: string
  name: string
  event_date: string
  show_type: ShowType
  season: number
  quarter: number
  week: number
}

interface Match {
  id: string
  show_id: string
  rating: number
  duration_minutes: number
  is_title_match: boolean
  title_level: TitleLevel | null
  is_main_event: boolean
  is_special_stipulation: boolean
}

export default function AdminMatchesPage() {
  const [shows, setShows] = useState<Show[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedShow, setSelectedShow] = useState<Show | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isShowDialogOpen, setIsShowDialogOpen] = useState(false)
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()

  const showForm = useForm<ShowForm>({
    resolver: zodResolver(showSchema),
    defaultValues: {
      season: 1,
      quarter: 1,
      week: 1,
    },
  })

  const matchForm = useForm<MatchForm>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      rating: 0,
      duration_minutes: 0,
      is_title_match: false,
      is_main_event: false,
      is_special_stipulation: false,
    },
  })

  useEffect(() => {
    fetchShows()
  }, [])

  useEffect(() => {
    if (selectedShow) {
      fetchMatches(selectedShow.id)
    }
  }, [selectedShow])

  async function fetchShows() {
    const { data, error } = await supabase
      .from("shows")
      .select("*")
      .order("event_date", { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load shows",
        variant: "destructive",
      })
    } else {
      setShows(data || [])
      if (data && data.length > 0) {
        setSelectedShow(data[0])
      }
    }
    setIsLoading(false)
  }

  async function fetchMatches(showId: string) {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("show_id", showId)
      .order("created_at")

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive",
      })
    } else {
      setMatches(data || [])
    }
  }

  async function onShowSubmit(data: ShowForm) {
    const { error } = await supabase.from("shows").insert({
      name: data.name,
      event_date: data.event_date,
      show_type: data.show_type,
      season: data.season,
      quarter: data.quarter,
      week: data.week,
    })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create show",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Success",
      description: "Show created successfully",
    })

    setIsShowDialogOpen(false)
    showForm.reset()
    fetchShows()
  }

  async function onMatchSubmit(data: MatchForm) {
    if (!selectedShow) return

    const { error } = await supabase.from("matches").insert({
      show_id: selectedShow.id,
      rating: data.rating,
      duration_minutes: data.duration_minutes,
      is_title_match: data.is_title_match,
      title_level: data.is_title_match ? data.title_level : null,
      is_main_event: data.is_main_event,
      is_special_stipulation: data.is_special_stipulation,
    })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Success",
      description: "Match created successfully",
    })

    setIsMatchDialogOpen(false)
    matchForm.reset()
    fetchMatches(selectedShow.id)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading shows...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Shows & Matches</h1>
          <p className="text-muted-foreground">
            Add WWE shows and enter match results
          </p>
        </div>
        <Dialog open={isShowDialogOpen} onOpenChange={setIsShowDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Show</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Show</DialogTitle>
              <DialogDescription>
                Add a new WWE show to enter match results
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={showForm.handleSubmit(onShowSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Show Name</Label>
                <Input
                  id="name"
                  {...showForm.register("name")}
                  placeholder="e.g., RAW Week 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">Date</Label>
                <Input
                  id="event_date"
                  type="date"
                  {...showForm.register("event_date")}
                />
              </div>

              <div className="space-y-2">
                <Label>Show Type</Label>
                <Select
                  value={showForm.watch("show_type")}
                  onValueChange={(value) =>
                    showForm.setValue("show_type", value as ShowType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw">RAW</SelectItem>
                    <SelectItem value="smackdown">SmackDown</SelectItem>
                    <SelectItem value="nxt">NXT</SelectItem>
                    <SelectItem value="ple">Premium Live Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="season">Season</Label>
                  <Input
                    id="season"
                    type="number"
                    {...showForm.register("season")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quarter">Quarter</Label>
                  <Input
                    id="quarter"
                    type="number"
                    {...showForm.register("quarter")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="week">Week</Label>
                  <Input
                    id="week"
                    type="number"
                    {...showForm.register("week")}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsShowDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={showForm.formState.isSubmitting}>
                  {showForm.formState.isSubmitting ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Shows List */}
        <Card>
          <CardHeader>
            <CardTitle>Shows</CardTitle>
            <CardDescription>Select a show to manage matches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {shows.map((show) => (
              <Button
                key={show.id}
                variant={selectedShow?.id === show.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedShow(show)}
              >
                <div className="text-left">
                  <div className="font-medium">{show.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {show.event_date}
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Matches List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {selectedShow ? selectedShow.name : "Select a Show"}
              </CardTitle>
              <CardDescription>
                {selectedShow
                  ? `Matches for ${selectedShow.event_date}`
                  : "Choose a show from the list"}
              </CardDescription>
            </div>
            {selectedShow && (
              <Dialog
                open={isMatchDialogOpen}
                onOpenChange={setIsMatchDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">Add Match</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Match</DialogTitle>
                    <DialogDescription>
                      Enter match details for {selectedShow.name}
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={matchForm.handleSubmit(onMatchSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rating">Rating (0-10)</Label>
                        <Input
                          id="rating"
                          type="number"
                          step="0.25"
                          {...matchForm.register("rating")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (min)</Label>
                        <Input
                          id="duration"
                          type="number"
                          {...matchForm.register("duration_minutes")}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_title_match"
                          checked={matchForm.watch("is_title_match")}
                          onCheckedChange={(checked) =>
                            matchForm.setValue("is_title_match", !!checked)
                          }
                        />
                        <Label htmlFor="is_title_match">Title Match</Label>
                      </div>

                      {matchForm.watch("is_title_match") && (
                        <Select
                          value={matchForm.watch("title_level") || undefined}
                          onValueChange={(value) =>
                            matchForm.setValue(
                              "title_level",
                              value as TitleLevel
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Title level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="world">World Title</SelectItem>
                            <SelectItem value="other">Other Title</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_main_event"
                          checked={matchForm.watch("is_main_event")}
                          onCheckedChange={(checked) =>
                            matchForm.setValue("is_main_event", !!checked)
                          }
                        />
                        <Label htmlFor="is_main_event">Main Event</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_special_stipulation"
                          checked={matchForm.watch("is_special_stipulation")}
                          onCheckedChange={(checked) =>
                            matchForm.setValue(
                              "is_special_stipulation",
                              !!checked
                            )
                          }
                        />
                        <Label htmlFor="is_special_stipulation">
                          Special Stipulation
                        </Label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsMatchDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={matchForm.formState.isSubmitting}
                      >
                        {matchForm.formState.isSubmitting
                          ? "Adding..."
                          : "Add Match"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {selectedShow ? (
              matches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rating</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Bonuses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">
                          {match.rating} ★
                        </TableCell>
                        <TableCell>{match.duration_minutes} min</TableCell>
                        <TableCell className="space-x-1">
                          {match.is_title_match && (
                            <Badge variant="secondary">
                              {match.title_level === "world"
                                ? "World Title"
                                : "Title"}
                            </Badge>
                          )}
                          {match.is_main_event && (
                            <Badge variant="secondary">Main Event</Badge>
                          )}
                          {match.is_special_stipulation && (
                            <Badge variant="secondary">Stipulation</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">
                  No matches yet. Add a match to get started.
                </p>
              )
            ) : (
              <p className="text-muted-foreground">
                Select a show to view and manage matches.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
