import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Standing {
  rank: number
  userId: string
  username: string
  points: number
  isCurrentUser?: boolean
}

interface LeaderboardProps {
  standings: Standing[]
  title?: string
}

export function Leaderboard({ standings, title }: LeaderboardProps) {
  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((standing) => (
            <TableRow
              key={standing.userId}
              className={standing.isCurrentUser ? "bg-muted/50" : ""}
            >
              <TableCell>
                <div className="flex items-center gap-1">
                  {standing.rank === 1 && "🥇"}
                  {standing.rank === 2 && "🥈"}
                  {standing.rank === 3 && "🥉"}
                  <span className={standing.rank <= 3 ? "font-bold" : ""}>
                    {standing.rank}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {standing.username}
                  {standing.isCurrentUser && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {standing.points.toFixed(1)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
