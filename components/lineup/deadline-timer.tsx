"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LINEUP_DEADLINE_DAY, LINEUP_DEADLINE_HOUR } from "@/types/lineup"

function getNextDeadline(): Date {
  const now = new Date()
  const deadline = new Date()

  // Set to next Monday at 20:00
  const daysUntilMonday = (LINEUP_DEADLINE_DAY - now.getDay() + 7) % 7 || 7
  deadline.setDate(now.getDate() + daysUntilMonday)
  deadline.setHours(LINEUP_DEADLINE_HOUR, 0, 0, 0)

  // If we're past Monday's deadline this week, move to next week
  if (deadline <= now) {
    deadline.setDate(deadline.getDate() + 7)
  }

  return deadline
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Deadline passed"

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

export function DeadlineTimer() {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [deadline, setDeadline] = useState<Date | null>(null)

  useEffect(() => {
    const nextDeadline = getNextDeadline()
    setDeadline(nextDeadline)

    const interval = setInterval(() => {
      const now = new Date()
      const remaining = nextDeadline.getTime() - now.getTime()
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        // Recalculate for next week's deadline
        const newDeadline = getNextDeadline()
        setDeadline(newDeadline)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const isUrgent = timeRemaining > 0 && timeRemaining < 24 * 60 * 60 * 1000 // Less than 24 hours

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Lineup Deadline</p>
            <p className="text-lg font-semibold">
              {deadline?.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}{" "}
              at {LINEUP_DEADLINE_HOUR}:00
            </p>
          </div>
          <Badge variant={isUrgent ? "destructive" : "secondary"} className="text-lg px-3 py-1">
            {formatTimeRemaining(timeRemaining)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
