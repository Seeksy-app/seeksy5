import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight, Building2, MapPin, Clock, Users, DollarSign, CreditCard, Sparkles, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const colors = {
  primary: "#053877",
  primaryLight: "#2C6BED",
  background: "#F5F7FF",
  surface: "#FFFFFF",
};

const eventTypes = [
  "Weddings",
  "Corporate",
  "Concerts",
  "Nonprofit",
  "Social",
  "Private Parties",
  "Conferences",
  "Other"
];

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Pacific/Honolulu",
];

interface Space {
  name: string;
  capacity: number;
  description: string;
}

export default function VenueOnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceCapacity, setNewSpaceCapacity] = useState("");
  const [newSpaceDescription, setNewSpaceDescription] = useState("");
  
  const [minNotice, setMinNotice] = useState("7");
  const [depositPercent, setDepositPercent] = useState("25");
  const [cancellationWindow, setCancellationWindow] = useState("30");
  const [contractTerms, setContractTerms] = useState("");

  const steps = [
    { id: "venue_profile", title: "Venue Profile", icon: Building2 },
    { id: "spaces", title: "Your Spaces", icon: MapPin },
    { id: "booking_rules", title: "Booking Rules", icon: Clock },
    { id: "payments", title: "Payments", icon: CreditCard },
    { id: "finish", title: "You're Ready!", icon: Sparkles },
  ];

  const toggleEventType = (type: string) => {
    setSelectedEventTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const addSpace = () => {
    if (newSpaceName) {
      setSpaces([...spaces, {
        name: newSpaceName,
        capacity: parseInt(newSpaceCapacity) || 0,
        description: newSpaceDescription,
      }]);
      setNewSpaceName("");
      setNewSpaceCapacity("");
      setNewSpaceDescription("");
    }
  };

  const removeSpace = (index: number) => {
    setSpaces(spaces.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        return;
      }

      // Get the user's venue
      const { data: venues } = await supabase
        .from('venues')
        .select('id')
        .eq('owner_user_id', user.id)
        .limit(1);

      if (!venues || venues.length === 0) {
        toast.error("No venue found");
        return;
      }

      const venueId = venues[0].id;

      // Update venue with onboarding data
      const { error: venueError } = await supabase
        .from('venues')
        .update({
          name: venueName,
          address,
          city,
          state,
          timezone,
          capacity: parseInt(maxCapacity) || null,
          max_capacity: parseInt(maxCapacity) || null,
          event_types: selectedEventTypes,
          booking_policy: {
            min_notice_days: parseInt(minNotice),
            deposit_percent: parseInt(depositPercent),
            cancellation_window_days: parseInt(cancellationWindow),
            contract_terms: contractTerms,
          },
          onboarding_completed: true,
        })
        .eq('id', venueId);

      if (venueError) throw venueError;

      // Create spaces
      if (spaces.length > 0) {
        const spacesData = spaces.map(space => ({
          venue_id: venueId,
          name: space.name,
          capacity: space.capacity,
          description: space.description,
        }));

        const { error: spacesError } = await supabase
          .from('venue_spaces')
          .insert(spacesData);

        if (spacesError) throw spacesError;
      }

      toast.success("Welcome to VenueOS!");
      navigate("/venueOS/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return venueName && city && state;
      case 1:
        return true; // Spaces are optional
      case 2:
        return true; // Rules have defaults
      case 3:
        return true; // Payments are optional
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="venueName">Venue Name *</Label>
              <Input
                id="venueName"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="The Grand Ballroom"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Event Lane"
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NY"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="capacity">Max Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  placeholder="500"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label>Event Types</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {eventTypes.map(type => (
                  <Badge
                    key={type}
                    variant={selectedEventTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleEventType(type)}
                    style={selectedEventTypes.includes(type) ? { backgroundColor: colors.primaryLight } : {}}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-6">
            <p className="text-gray-600">Add the spaces available at your venue (e.g., Ballroom, Garden, Rooftop).</p>
            
            {spaces.length > 0 && (
              <div className="space-y-3">
                {spaces.map((space, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{space.name}</p>
                      <p className="text-sm text-gray-600">
                        {space.capacity > 0 ? `Capacity: ${space.capacity}` : "No capacity set"}
                        {space.description && ` • ${space.description}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeSpace(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <Card className="border-dashed border-2">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="spaceName">Space Name</Label>
                  <Input
                    id="spaceName"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="Grand Ballroom"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="spaceCapacity">Capacity</Label>
                    <Input
                      id="spaceCapacity"
                      type="number"
                      value={newSpaceCapacity}
                      onChange={(e) => setNewSpaceCapacity(e.target.value)}
                      placeholder="200"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addSpace} disabled={!newSpaceName} className="w-full" style={{ backgroundColor: colors.primaryLight }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Space
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minNotice">Minimum Notice (days)</Label>
                <Input
                  id="minNotice"
                  type="number"
                  value={minNotice}
                  onChange={(e) => setMinNotice(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="depositPercent">Required Deposit (%)</Label>
                <Input
                  id="depositPercent"
                  type="number"
                  value={depositPercent}
                  onChange={(e) => setDepositPercent(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cancellationWindow">Cancellation Window (days)</Label>
              <Input
                id="cancellationWindow"
                type="number"
                value={cancellationWindow}
                onChange={(e) => setCancellationWindow(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="contractTerms">Default Contract Terms</Label>
              <Textarea
                id="contractTerms"
                value={contractTerms}
                onChange={(e) => setContractTerms(e.target.value)}
                placeholder="Enter your standard terms and conditions..."
                className="mt-1 min-h-[120px]"
              />
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6 text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.primaryLight}15` }}>
              <CreditCard className="h-8 w-8" style={{ color: colors.primaryLight }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Connect Payment Processing</h3>
              <p className="text-gray-600 mt-2">
                Accept deposits and payments directly through VenueOS with Stripe.
              </p>
            </div>
            <Button variant="outline" size="lg" disabled>
              Connect Stripe (Coming Soon)
            </Button>
            <p className="text-sm text-gray-500">
              You can skip this for now and connect payments later in Settings.
            </p>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6 text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${colors.primaryLight}15` }}>
              <Sparkles className="h-8 w-8" style={{ color: colors.primaryLight }} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">You're all set!</h3>
              <p className="text-gray-600 mt-2">
                Your venue is ready to start accepting bookings.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-left max-w-sm mx-auto">
              {[
                "Manage bookings and calendar",
                "Track clients and events",
                "Connect with influencers",
                "Get AI-powered assistance",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="h-5 w-5" style={{ color: colors.primaryLight }} />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="container max-w-2xl mx-auto py-12 px-4">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    index <= currentStep ? 'text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                  style={index <= currentStep ? { backgroundColor: colors.primary } : {}}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block w-12 h-1 mx-2 rounded ${
                      index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{steps[currentStep].title}</h2>
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              style={{ backgroundColor: colors.primary }}
            >
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={isSubmitting}
              style={{ backgroundColor: colors.primary }}
            >
              {isSubmitting ? "Setting up..." : "Go to Dashboard"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
