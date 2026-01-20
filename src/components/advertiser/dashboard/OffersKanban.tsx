import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, X, Check, MoreHorizontal, MessageSquare, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface Offer {
  id: string;
  creatorName: string;
  creatorAvatar?: string;
  campaignName: string;
  budget: number;
  status: "sent" | "pending" | "rejected" | "accepted";
  daysAgo?: number;
}

interface OffersKanbanProps {
  offers: Offer[];
  onViewOffer?: (offerId: string) => void;
  onMessageCreator?: (offerId: string) => void;
}

const columns = [
  { id: "sent", label: "Offers Sent", icon: Send, color: "bg-blue-500" },
  { id: "pending", label: "Pending", icon: Clock, color: "bg-amber-500" },
  { id: "accepted", label: "Accepted", icon: Check, color: "bg-green-500" },
  { id: "rejected", label: "Rejected", icon: X, color: "bg-red-500" },
] as const;

export function OffersKanban({ offers, onViewOffer, onMessageCreator }: OffersKanbanProps) {
  const getOffersByStatus = (status: Offer["status"]) =>
    offers.filter((o) => o.status === status);

  return (
    <Card className="p-6 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#053877]">Offers & Negotiations</h3>
        <Button variant="outline" size="sm" className="text-xs">
          View All
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnOffers = getOffersByStatus(column.id);
          return (
            <div key={column.id} className="space-y-3">
              {/* Column Header */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className={cn("w-2 h-2 rounded-full", column.color)} />
                <span className="text-sm font-medium">{column.label}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {columnOffers.length}
                </Badge>
              </div>

              {/* Column Content */}
              <div className="space-y-2 min-h-[100px]">
                {columnOffers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No offers</p>
                ) : (
                  columnOffers.slice(0, 3).map((offer) => (
                    <Card
                      key={offer.id}
                      className="p-3 hover:shadow-md transition-all cursor-pointer border"
                      onClick={() => onViewOffer?.(offer.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={offer.creatorAvatar} />
                          <AvatarFallback className="bg-[#2C6BED]/10 text-[#2C6BED] text-[10px]">
                            {offer.creatorName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium truncate flex-1">
                          {offer.creatorName}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mb-1">
                        {offer.campaignName}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#053877]">
                          ${offer.budget.toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMessageCreator?.(offer.id);
                          }}
                        >
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
                {columnOffers.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{columnOffers.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
