import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Monitor, MapPin, Globe } from "lucide-react";

interface EventTypeSelectorProps {
  eventType: string;
  onEventTypeChange: (type: string) => void;
  virtualUrl: string;
  onVirtualUrlChange: (url: string) => void;
  venueAddress: string;
  onVenueAddressChange: (address: string) => void;
}

export function EventTypeSelector({
  eventType,
  onEventTypeChange,
  virtualUrl,
  onVirtualUrlChange,
  venueAddress,
  onVenueAddressChange,
}: EventTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <Label>Event Type *</Label>
      <RadioGroup
        value={eventType}
        onValueChange={onEventTypeChange}
        className="grid grid-cols-3 gap-4"
      >
        <label
          htmlFor="live"
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            eventType === "live"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <RadioGroupItem value="live" id="live" className="sr-only" />
          <MapPin className={`w-6 h-6 ${eventType === "live" ? "text-primary" : "text-muted-foreground"}`} />
          <span className="font-medium">In-Person</span>
          <span className="text-xs text-muted-foreground text-center">Physical venue</span>
        </label>

        <label
          htmlFor="virtual"
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            eventType === "virtual"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <RadioGroupItem value="virtual" id="virtual" className="sr-only" />
          <Monitor className={`w-6 h-6 ${eventType === "virtual" ? "text-primary" : "text-muted-foreground"}`} />
          <span className="font-medium">Virtual</span>
          <span className="text-xs text-muted-foreground text-center">Online only</span>
        </label>

        <label
          htmlFor="hybrid"
          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            eventType === "hybrid"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          <RadioGroupItem value="hybrid" id="hybrid" className="sr-only" />
          <Globe className={`w-6 h-6 ${eventType === "hybrid" ? "text-primary" : "text-muted-foreground"}`} />
          <span className="font-medium">Hybrid</span>
          <span className="text-xs text-muted-foreground text-center">In-person + online</span>
        </label>
      </RadioGroup>

      {/* Location fields based on event type */}
      {(eventType === "live" || eventType === "hybrid") && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          <Label htmlFor="venueAddress">Venue Address</Label>
          <Input
            id="venueAddress"
            value={venueAddress}
            onChange={(e) => onVenueAddressChange(e.target.value)}
            placeholder="123 Main St, City, State, ZIP"
          />
        </div>
      )}

      {(eventType === "virtual" || eventType === "hybrid") && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          <Label htmlFor="virtualUrl">Virtual Event URL</Label>
          <Input
            id="virtualUrl"
            type="url"
            value={virtualUrl}
            onChange={(e) => onVirtualUrlChange(e.target.value)}
            placeholder="https://zoom.us/j/... or meeting link"
          />
        </div>
      )}
    </div>
  );
}
