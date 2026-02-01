"use client"

import { useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"

type PostgresChanges = {
  event: "INSERT" | "UPDATE" | "DELETE" | "*"
  schema: string
  table: string
  filter?: string
}

interface UseRealtimeOptions {
  channel: string
  table: string
  filter?: string
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  onInsert?: (payload: Record<string, unknown>) => void
  onUpdate?: (payload: Record<string, unknown>) => void
  onDelete?: (payload: Record<string, unknown>) => void
  onChange?: (payload: Record<string, unknown>) => void
}

export function useRealtime({
  channel: channelName,
  table,
  filter,
  event = "*",
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeOptions) {
  const supabase = createClient()

  const handleChange = useCallback(
    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      if (onChange) {
        onChange(payload as unknown as Record<string, unknown>)
      }

      switch (payload.eventType) {
        case "INSERT":
          if (onInsert) onInsert(payload.new)
          break
        case "UPDATE":
          if (onUpdate) onUpdate(payload.new)
          break
        case "DELETE":
          if (onDelete) onDelete(payload.old)
          break
      }
    },
    [onChange, onInsert, onUpdate, onDelete]
  )

  useEffect(() => {
    const channelConfig: PostgresChanges = {
      event,
      schema: "public",
      table,
    }

    if (filter) {
      channelConfig.filter = filter
    }

    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        channelConfig,
        handleChange
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, channelName, table, filter, event, handleChange])
}

// Specialized hooks for common use cases

export function useDraftRealtime(
  leagueId: string,
  onBidPlaced: (bid: Record<string, unknown>) => void
) {
  useRealtime({
    channel: `draft:${leagueId}`,
    table: "draft_bids",
    filter: `league_id=eq.${leagueId}`,
    onInsert: onBidPlaced,
  })
}

export function useLineupRealtime(
  rosterId: string,
  onLineupChange: (lineup: Record<string, unknown>) => void
) {
  useRealtime({
    channel: `lineup:${rosterId}`,
    table: "lineups",
    filter: `roster_id=eq.${rosterId}`,
    onChange: onLineupChange,
  })
}

export function useMatchRealtime(
  showId: string,
  onMatchAdded: (match: Record<string, unknown>) => void
) {
  useRealtime({
    channel: `matches:${showId}`,
    table: "matches",
    filter: `show_id=eq.${showId}`,
    onInsert: onMatchAdded,
  })
}
