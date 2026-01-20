import { useState } from "react";
import { Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLeadMagnetOffersByPersona, type LeadMagnetOffer } from "@/config/leadMagnets";

interface LeadMagnetOfferChipsProps {
  persona: string;
  selectedOffers: LeadMagnetOffer[];
  onSelectionChange: (offers: LeadMagnetOffer[]) => void;
  maxSelections?: number;
  className?: string;
}

export function LeadMagnetOfferChips({
  persona,
  selectedOffers,
  onSelectionChange,
  maxSelections = 3,
  className,
}: LeadMagnetOfferChipsProps) {
  const offers = getLeadMagnetOffersByPersona(persona);

  const toggleOffer = (offer: LeadMagnetOffer) => {
    const isSelected = selectedOffers.some((o) => o.id === offer.id);
    
    if (isSelected) {
      onSelectionChange(selectedOffers.filter((o) => o.id !== offer.id));
    } else if (selectedOffers.length < maxSelections) {
      onSelectionChange([...selectedOffers, offer]);
    }
  };

  if (!persona || offers.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Download className="w-4 h-4" />
        Recommended reports for you (select up to {maxSelections})
      </label>
      <div className="flex flex-wrap gap-2">
        {offers.map((offer) => {
          const isSelected = selectedOffers.some((o) => o.id === offer.id);
          return (
            <button
              key={offer.id}
              type="button"
              onClick={() => toggleOffer(offer)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:bg-muted"
              )}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {offer.title}
            </button>
          );
        })}
      </div>
      {selectedOffers.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedOffers.length} report{selectedOffers.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
