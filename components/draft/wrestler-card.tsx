import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WWEBrand, WrestlerStatus } from "@/types/database"

interface WrestlerCardProps {
  wrestler: {
    id: string
    name: string
    brand: WWEBrand
    status: WrestlerStatus
    photoUrl?: string | null
  }
  currentBid?: number
  highBidder?: string
  onBid?: (wrestlerId: string, amount: number) => void
  disabled?: boolean
  isOwned?: boolean
}

export function WrestlerCard({
  wrestler,
  currentBid,
  highBidder,
  onBid,
  disabled,
  isOwned,
}: WrestlerCardProps) {
  const brandColors = {
    raw: "bg-red-500",
    smackdown: "bg-blue-500",
    nxt: "bg-yellow-500",
  }

  return (
    <Card className={isOwned ? "border-primary" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{wrestler.name}</h3>
            <div className="flex gap-2 mt-1">
              <Badge
                variant="outline"
                className={`${brandColors[wrestler.brand]} text-white border-0 capitalize`}
              >
                {wrestler.brand}
              </Badge>
              {wrestler.status !== "active" && (
                <Badge variant="destructive" className="capitalize">
                  {wrestler.status}
                </Badge>
              )}
            </div>
          </div>
          {isOwned && <Badge>Owned</Badge>}
        </div>

        {currentBid !== undefined && (
          <div className="mt-3 text-sm">
            <p className="text-muted-foreground">
              Current bid: <span className="font-medium">{currentBid} pts</span>
            </p>
            {highBidder && (
              <p className="text-muted-foreground">
                High bidder: <span className="font-medium">{highBidder}</span>
              </p>
            )}
          </div>
        )}

        {onBid && !isOwned && (
          <Button
            size="sm"
            className="mt-3 w-full"
            onClick={() => onBid(wrestler.id, (currentBid || 0) + 1)}
            disabled={disabled}
          >
            Place Bid
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
