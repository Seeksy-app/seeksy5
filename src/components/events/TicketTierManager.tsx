import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Ticket, DollarSign, Heart, GripVertical } from "lucide-react";

export interface TicketTier {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  quantity_available: number | null;
  max_per_order: number;
  is_active: boolean;
  tier_order: number;
  benefits: string[];
}

interface TicketTierManagerProps {
  pricingMode: string;
  onPricingModeChange: (mode: string) => void;
  ticketTiers: TicketTier[];
  onTicketTiersChange: (tiers: TicketTier[]) => void;
}

export function TicketTierManager({
  pricingMode,
  onPricingModeChange,
  ticketTiers,
  onTicketTiersChange,
}: TicketTierManagerProps) {
  const [editingTier, setEditingTier] = useState<number | null>(null);

  const addTier = () => {
    const newTier: TicketTier = {
      name: pricingMode === "free" ? "Free Admission" : `Tier ${ticketTiers.length + 1}`,
      description: "",
      price: pricingMode === "free" ? 0 : 0,
      currency: "USD",
      quantity_available: null,
      max_per_order: 10,
      is_active: true,
      tier_order: ticketTiers.length,
      benefits: [],
    };
    onTicketTiersChange([...ticketTiers, newTier]);
    setEditingTier(ticketTiers.length);
  };

  const updateTier = (index: number, updates: Partial<TicketTier>) => {
    const updated = [...ticketTiers];
    updated[index] = { ...updated[index], ...updates };
    onTicketTiersChange(updated);
  };

  const removeTier = (index: number) => {
    onTicketTiersChange(ticketTiers.filter((_, i) => i !== index));
    setEditingTier(null);
  };

  const handlePricingModeChange = (mode: string) => {
    onPricingModeChange(mode);
    // Reset tiers when changing mode
    if (mode === "free") {
      onTicketTiersChange([{
        name: "Free Admission",
        description: "General admission ticket",
        price: 0,
        currency: "USD",
        quantity_available: null,
        max_per_order: 10,
        is_active: true,
        tier_order: 0,
        benefits: [],
      }]);
    } else {
      onTicketTiersChange([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pricing Mode Selector */}
      <div className="space-y-4">
        <Label>Pricing Model *</Label>
        <RadioGroup
          value={pricingMode}
          onValueChange={handlePricingModeChange}
          className="grid grid-cols-3 gap-4"
        >
          <label
            htmlFor="free"
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              pricingMode === "free"
                ? "border-green-500 bg-green-500/5"
                : "border-border hover:border-green-500/50"
            }`}
          >
            <RadioGroupItem value="free" id="free" className="sr-only" />
            <Ticket className={`w-6 h-6 ${pricingMode === "free" ? "text-green-500" : "text-muted-foreground"}`} />
            <span className="font-medium">Free</span>
            <span className="text-xs text-muted-foreground">No charge</span>
          </label>

          <label
            htmlFor="paid"
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              pricingMode === "paid"
                ? "border-blue-500 bg-blue-500/5"
                : "border-border hover:border-blue-500/50"
            }`}
          >
            <RadioGroupItem value="paid" id="paid" className="sr-only" />
            <DollarSign className={`w-6 h-6 ${pricingMode === "paid" ? "text-blue-500" : "text-muted-foreground"}`} />
            <span className="font-medium">Paid</span>
            <span className="text-xs text-muted-foreground">Set ticket prices</span>
          </label>

          <label
            htmlFor="donation"
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              pricingMode === "donation"
                ? "border-pink-500 bg-pink-500/5"
                : "border-border hover:border-pink-500/50"
            }`}
          >
            <RadioGroupItem value="donation" id="donation" className="sr-only" />
            <Heart className={`w-6 h-6 ${pricingMode === "donation" ? "text-pink-500" : "text-muted-foreground"}`} />
            <span className="font-medium">Donation</span>
            <span className="text-xs text-muted-foreground">Pay what you want</span>
          </label>
        </RadioGroup>
      </div>

      {/* Ticket Tiers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Ticket Tiers</Label>
          {pricingMode !== "free" && (
            <Button type="button" variant="outline" size="sm" onClick={addTier}>
              <Plus className="w-4 h-4 mr-1" />
              Add Tier
            </Button>
          )}
        </div>

        {ticketTiers.length === 0 && pricingMode !== "free" && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No ticket tiers yet</p>
              <Button type="button" variant="outline" onClick={addTier}>
                <Plus className="w-4 h-4 mr-1" />
                Add Your First Tier
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {ticketTiers.map((tier, index) => (
            <Card 
              key={index}
              className={`transition-all ${editingTier === index ? "ring-2 ring-primary" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    {editingTier === index ? (
                      <Input
                        value={tier.name}
                        onChange={(e) => updateTier(index, { name: e.target.value })}
                        className="max-w-[200px] h-8"
                        placeholder="Tier name"
                      />
                    ) : (
                      <CardTitle className="text-base">{tier.name}</CardTitle>
                    )}
                    {!tier.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={tier.price === 0 ? "secondary" : "default"}>
                      {tier.price === 0 ? "Free" : `$${tier.price}`}
                    </Badge>
                    {editingTier !== index ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTier(index)}
                      >
                        Edit
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTier(null)}
                      >
                        Done
                      </Button>
                    )}
                    {ticketTiers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTier(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {editingTier === index && (
                <CardContent className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={tier.description}
                      onChange={(e) => updateTier(index, { description: e.target.value })}
                      placeholder="What's included with this ticket?"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {pricingMode !== "free" && (
                      <div className="space-y-2">
                        <Label>Price ($)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tier.price}
                          onChange={(e) => updateTier(index, { price: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Quantity Available</Label>
                      <Input
                        type="number"
                        min="1"
                        value={tier.quantity_available || ""}
                        onChange={(e) => updateTier(index, { 
                          quantity_available: e.target.value ? parseInt(e.target.value) : null 
                        })}
                        placeholder="Unlimited"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Per Order</Label>
                      <Input
                        type="number"
                        min="1"
                        value={tier.max_per_order}
                        onChange={(e) => updateTier(index, { max_per_order: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
