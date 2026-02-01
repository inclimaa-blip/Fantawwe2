import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  calculateBasePoints,
  calculateContextBonus,
  calculateDurationBonus,
  MatchData,
} from "@/lib/points-calculator"
import {
  VICTORY_BONUSES,
  MAIN_EVENT_BONUS,
  SPECIAL_STIPULATION_BONUS,
  TITLE_BONUSES,
} from "@/types/points"

interface PointsPreviewProps {
  match: MatchData
}

export function PointsPreview({ match }: PointsPreviewProps) {
  const basePoints = calculateBasePoints(match.rating)
  const contextBonus = calculateContextBonus(match)
  const durationBonus = calculateDurationBonus(match.durationMinutes)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Points Preview</CardTitle>
        <CardDescription>
          Estimated points breakdown for this match
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Base Points</p>
            <p className="text-2xl font-bold">{basePoints}</p>
            <p className="text-xs text-muted-foreground">
              {match.rating} stars × 2
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration Bonus</p>
            <p className="text-2xl font-bold">+{durationBonus}</p>
            <p className="text-xs text-muted-foreground">
              {match.durationMinutes} minutes
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Context Bonuses</p>
          <div className="flex flex-wrap gap-2">
            {match.isTitleMatch && match.titleLevel && (
              <Badge variant="secondary">
                {match.titleLevel === "world" ? "World Title" : "Other Title"} (+
                {TITLE_BONUSES[match.titleLevel]})
              </Badge>
            )}
            {match.isMainEvent && (
              <Badge variant="secondary">
                Main Event (+{MAIN_EVENT_BONUS})
              </Badge>
            )}
            {match.isSpecialStipulation && (
              <Badge variant="secondary">
                Stipulation (+{SPECIAL_STIPULATION_BONUS})
              </Badge>
            )}
            {contextBonus === 0 && (
              <span className="text-sm text-muted-foreground">None</span>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Victory Bonuses</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>Pin: +{VICTORY_BONUSES.pin}</div>
            <div>Submission: +{VICTORY_BONUSES.submission}</div>
            <div>KO: +{VICTORY_BONUSES.ko}</div>
            <div>DQ: +{VICTORY_BONUSES.dq}</div>
            <div>Count-out: +{VICTORY_BONUSES.countout}</div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">Estimated Total (per wrestler)</p>
          <p className="text-3xl font-bold">
            {basePoints + contextBonus + durationBonus}
            <span className="text-lg font-normal text-muted-foreground">
              {" "}
              + bonuses
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
