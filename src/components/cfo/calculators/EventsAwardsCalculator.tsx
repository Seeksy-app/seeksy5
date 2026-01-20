import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { Calendar, Trophy, RefreshCw, Save, Info } from 'lucide-react';
import { useCFOAssumptions } from '@/hooks/useCFOAssumptions';
import { CFO_ASSUMPTIONS_SCHEMA } from '@/lib/cfo-assumptions-schema';

interface Props {
  onSave?: (data?: Record<string, any>) => void;
}

const SCHEMA = CFO_ASSUMPTIONS_SCHEMA.events;

export function EventsAwardsCalculator({ onSave }: Props) {
  const { getEffectiveValue, saveMultipleAssumptions, isSaving } = useCFOAssumptions();

  // Events from canonical schema
  const [eventsPerYear, setEventsPerYear] = useState(SCHEMA.events_per_year.default);
  const [avgTicketPrice, setAvgTicketPrice] = useState(SCHEMA.avg_ticket_price.default);
  const [avgAttendeesPerEvent, setAvgAttendeesPerEvent] = useState(150);
  const [avgSponsorshipPerEvent, setAvgSponsorshipPerEvent] = useState(SCHEMA.avg_event_sponsorship.default);

  // Awards (not in canonical schema yet, using local defaults)
  const [awardProgramsPerYear, setAwardProgramsPerYear] = useState(4);
  const [avgSponsorshipPerAward, setAvgSponsorshipPerAward] = useState(2500);
  const [nominationFees, setNominationFees] = useState(25);
  const [avgNominations, setAvgNominations] = useState(200);

  // Load saved values - only run once on mount
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (initialized) return;
    const savedEvents = getEffectiveValue('events_per_year');
    const savedTicket = getEffectiveValue('avg_ticket_price');
    const savedSponsorship = getEffectiveValue('avg_event_sponsorship');
    
    if (savedEvents) setEventsPerYear(savedEvents);
    if (savedTicket) setAvgTicketPrice(savedTicket);
    if (savedSponsorship) setAvgSponsorshipPerEvent(savedSponsorship);
    setInitialized(true);
  }, [getEffectiveValue, initialized]);

  // Calculations
  const ticketRevenue = eventsPerYear * avgTicketPrice * avgAttendeesPerEvent;
  const eventSponsorshipRevenue = eventsPerYear * avgSponsorshipPerEvent;
  const totalEventRevenue = ticketRevenue + eventSponsorshipRevenue;

  const awardSponsorshipRevenue = awardProgramsPerYear * avgSponsorshipPerAward;
  const awardNominationRevenue = awardProgramsPerYear * nominationFees * avgNominations;
  const totalAwardRevenue = awardSponsorshipRevenue + awardNominationRevenue;

  const totalEventsAwardsRevenue = totalEventRevenue + totalAwardRevenue;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const handleReset = () => {
    setEventsPerYear(SCHEMA.events_per_year.default);
    setAvgTicketPrice(SCHEMA.avg_ticket_price.default);
    setAvgAttendeesPerEvent(150);
    setAvgSponsorshipPerEvent(SCHEMA.avg_event_sponsorship.default);
    setAwardProgramsPerYear(4);
    setAvgSponsorshipPerAward(2500);
    setNominationFees(25);
    setAvgNominations(200);
  };

  const handleSave = () => {
    saveMultipleAssumptions([
      { metric_key: 'events_per_year', value: eventsPerYear },
      { metric_key: 'avg_ticket_price', value: avgTicketPrice },
      { metric_key: 'avg_event_sponsorship', value: avgSponsorshipPerEvent },
    ]);
    onSave?.({
      eventsPerYear, avgTicketPrice, avgAttendeesPerEvent, avgSponsorshipPerEvent,
      awardProgramsPerYear, avgSponsorshipPerAward, nominationFees, avgNominations,
      totalEventRevenue, totalAwardRevenue, totalEventsAwardsRevenue,
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Events & Awards Calculator
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust these sliders to update CFO assumptions. Click 'Save to Pro Forma' to apply them to all board forecasts.
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            Event Revenue
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Events Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-foreground">Events</h3>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{SCHEMA.events_per_year.label}</span>
                <span className="text-sm font-medium">{eventsPerYear}</span>
              </Label>
              <Slider
                value={[eventsPerYear]}
                onValueChange={([v]) => setEventsPerYear(v)}
                min={SCHEMA.events_per_year.min}
                max={SCHEMA.events_per_year.max}
                step={SCHEMA.events_per_year.step}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{SCHEMA.avg_ticket_price.label}</span>
                <span className="text-sm font-medium">${avgTicketPrice}</span>
              </Label>
              <Slider
                value={[avgTicketPrice]}
                onValueChange={([v]) => setAvgTicketPrice(v)}
                min={SCHEMA.avg_ticket_price.min}
                max={SCHEMA.avg_ticket_price.max}
                step={SCHEMA.avg_ticket_price.step}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Avg Attendees per Event</span>
                <span className="text-sm font-medium">{avgAttendeesPerEvent}</span>
              </Label>
              <Slider
                value={[avgAttendeesPerEvent]}
                onValueChange={([v]) => setAvgAttendeesPerEvent(v)}
                min={10}
                max={1000}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>{SCHEMA.avg_event_sponsorship.label}</span>
                <span className="text-sm font-medium">${avgSponsorshipPerEvent.toLocaleString()}</span>
              </Label>
              <Slider
                value={[avgSponsorshipPerEvent]}
                onValueChange={([v]) => setAvgSponsorshipPerEvent(v)}
                min={SCHEMA.avg_event_sponsorship.min}
                max={SCHEMA.avg_event_sponsorship.max}
                step={SCHEMA.avg_event_sponsorship.step}
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Ticket Revenue</p>
                  <p className="font-bold text-foreground">{formatCurrency(ticketRevenue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sponsorships</p>
                  <p className="font-bold text-foreground">{formatCurrency(eventSponsorshipRevenue)}</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-100">
                <p className="text-xs text-muted-foreground">Total Event Revenue</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(totalEventRevenue)}</p>
              </div>
            </div>
          </div>

          {/* Awards Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-foreground">Awards Programs</h3>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Award Programs per Year</span>
                <span className="text-sm font-medium">{awardProgramsPerYear}</span>
              </Label>
              <Slider
                value={[awardProgramsPerYear]}
                onValueChange={([v]) => setAwardProgramsPerYear(v)}
                min={0}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Avg Sponsorship per Award</span>
                <span className="text-sm font-medium">${avgSponsorshipPerAward.toLocaleString()}</span>
              </Label>
              <Slider
                value={[avgSponsorshipPerAward]}
                onValueChange={([v]) => setAvgSponsorshipPerAward(v)}
                min={1000}
                max={50000}
                step={500}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Nomination Fee</span>
                <span className="text-sm font-medium">${nominationFees}</span>
              </Label>
              <Slider
                value={[nominationFees]}
                onValueChange={([v]) => setNominationFees(v)}
                min={0}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Avg Nominations per Program</span>
                <span className="text-sm font-medium">{avgNominations}</span>
              </Label>
              <Slider
                value={[avgNominations]}
                onValueChange={([v]) => setAvgNominations(v)}
                min={10}
                max={1000}
                step={10}
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Sponsorships</p>
                  <p className="font-bold text-foreground">{formatCurrency(awardSponsorshipRevenue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nomination Fees</p>
                  <p className="font-bold text-foreground">{formatCurrency(awardNominationRevenue)}</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-amber-100">
                <p className="text-xs text-muted-foreground">Total Awards Revenue</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(totalAwardRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg mt-6">
          <Info className="w-4 h-4 text-amber-600 mt-0.5" />
          <p className="text-sm text-amber-800">
            Use this to model events and awards revenue that feeds into the Events & Awards line in the AI Pro Forma.
          </p>
        </div>

        {/* Combined Total */}
        <Card className="mt-4 bg-gradient-to-br from-amber-100 to-orange-50 border-0">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-amber-700">Total Events & Awards Revenue</p>
            <p className="text-3xl font-bold text-amber-800">{formatCurrency(totalEventsAwardsRevenue)}</p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700">
            <Save className="w-4 h-4 mr-2" />
            Save to Pro Forma
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
