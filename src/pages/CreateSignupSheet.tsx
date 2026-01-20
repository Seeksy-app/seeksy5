import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Zap } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
  capacity: number;
}

interface ConfirmationCheckbox {
  id: string;
  label: string;
}

const CreateSignupSheet = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState("in-person");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  
  // Quick Generate
  const [quickStartTime, setQuickStartTime] = useState("09:00");
  const [quickDuration, setQuickDuration] = useState("15");
  const [quickNumSlots, setQuickNumSlots] = useState("15");
  const [quickCapacity, setQuickCapacity] = useState("1");
  
  // Manual Slots
  const [manualSlots, setManualSlots] = useState<TimeSlot[]>([]);
  
  // Confirmation Checkboxes
  const [checkboxes, setCheckboxes] = useState<ConfirmationCheckbox[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handleQuickGenerate = () => {
    const slots: TimeSlot[] = [];
    const [hours, minutes] = quickStartTime.split(':').map(Number);
    let currentTime = new Date(eventDate);
    currentTime.setHours(hours, minutes, 0, 0);
    
    const durationMinutes = parseInt(quickDuration);
    const numSlots = parseInt(quickNumSlots);
    const capacity = parseInt(quickCapacity);
    
    for (let i = 0; i < numSlots; i++) {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + durationMinutes * 60000);
      
      slots.push({
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        capacity: capacity
      });
      
      currentTime = endTime;
    }
    
    setManualSlots(slots);
    toast({
      title: "Slots generated!",
      description: `Created ${numSlots} time slots.`,
    });
  };

  const addManualSlot = () => {
    setManualSlots([...manualSlots, { start: "", end: "", capacity: 1 }]);
  };

  const removeSlot = (index: number) => {
    setManualSlots(manualSlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof TimeSlot, value: string | number) => {
    const updated = [...manualSlots];
    updated[index] = { ...updated[index], [field]: value };
    setManualSlots(updated);
  };

  const addCheckbox = () => {
    setCheckboxes([...checkboxes, { id: `cb-${Date.now()}`, label: "" }]);
  };

  const removeCheckbox = (id: string) => {
    setCheckboxes(checkboxes.filter(cb => cb.id !== id));
  };

  const updateCheckbox = (id: string, label: string) => {
    setCheckboxes(checkboxes.map(cb => cb.id === id ? { ...cb, label } : cb));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (manualSlots.length === 0) {
      toast({
        title: "No time slots",
        description: "Please add at least one time slot.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Find the earliest and latest times from manual slots
      const allTimes = manualSlots.flatMap(slot => [new Date(slot.start), new Date(slot.end)]);
      const startDate = new Date(Math.min(...allTimes.map(d => d.getTime()))).toISOString();
      const endDate = new Date(Math.max(...allTimes.map(d => d.getTime()))).toISOString();
      
      // Calculate average slot duration
      const avgDuration = Math.round(
        manualSlots.reduce((sum, slot) => {
          return sum + (new Date(slot.end).getTime() - new Date(slot.start).getTime()) / 60000;
        }, 0) / manualSlots.length
      );

      // Create the sheet
      const { data: sheet, error: sheetError } = await supabase
        .from("signup_sheets")
        .insert([
          {
            title,
            description,
            start_date: startDate,
            end_date: endDate,
            slot_duration: avgDuration,
            location: `${locationType === 'virtual' ? 'Virtual' : location}`,
            is_published: true,
            user_id: user?.id,
          },
        ])
        .select()
        .single();

      if (sheetError) throw sheetError;

      // Insert slots
      const slotsToInsert = manualSlots.map(slot => ({
        sheet_id: sheet.id,
        slot_start: slot.start,
        slot_end: slot.end,
        is_filled: false,
      }));

      const { error: slotsError } = await supabase
        .from("signup_slots")
        .insert(slotsToInsert);

      if (slotsError) throw slotsError;

      toast({
        title: "Sign-up sheet created!",
        description: `Created ${manualSlots.length} time slots.`,
      });

      navigate(`/signup-sheet/${sheet.id}`);
    } catch (error: any) {
      toast({
        title: "Error creating sheet",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          ← Back to Home
        </Button>

        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Create New Sign-up Sheet</h1>
            <p className="text-muted-foreground mt-1">
              Set up your sign-up sheet with time slots and capacity limits
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label htmlFor="title">Sign-up Sheet Name *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Summer Workshop"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell participants about your sign-up sheet..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationType">Location Type *</Label>
                <Select value={locationType} onValueChange={setLocationType}>
                  <SelectTrigger id="locationType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {locationType === 'in-person' && (
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required={locationType === 'in-person'}
                  placeholder="123 Main St"
                />
              </div>
            )}

            {/* Time Slots */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg">Time Slots *</Label>
                  <p className="text-sm text-muted-foreground">
                    Add time slots for your sign-up sheet
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addManualSlot}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              </div>

              {/* Quick Generate */}
              <Card className="p-6 bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800">
                <div className="flex items-start gap-2 mb-4">
                  <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-cyan-900 dark:text-cyan-100">
                      Quick Generate Slots
                    </h3>
                    <p className="text-sm text-cyan-700 dark:text-cyan-300">
                      Automatically create multiple consecutive time slots
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quickStartTime" className="text-cyan-900 dark:text-cyan-100">
                      Start Time
                    </Label>
                    <Input
                      id="quickStartTime"
                      type="time"
                      value={quickStartTime}
                      onChange={(e) => setQuickStartTime(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quickDuration" className="text-cyan-900 dark:text-cyan-100">
                      Slot Duration (minutes)
                    </Label>
                    <Input
                      id="quickDuration"
                      type="number"
                      value={quickDuration}
                      onChange={(e) => setQuickDuration(e.target.value)}
                      min="5"
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quickNumSlots" className="text-cyan-900 dark:text-cyan-100">
                      Number of Slots
                    </Label>
                    <Input
                      id="quickNumSlots"
                      type="number"
                      value={quickNumSlots}
                      onChange={(e) => setQuickNumSlots(e.target.value)}
                      min="1"
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quickCapacity" className="text-cyan-900 dark:text-cyan-100">
                      Capacity per Slot
                    </Label>
                    <Input
                      id="quickCapacity"
                      type="number"
                      value={quickCapacity}
                      onChange={(e) => setQuickCapacity(e.target.value)}
                      min="1"
                      className="bg-background"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleQuickGenerate}
                  disabled={!eventDate}
                  className="w-full mt-4"
                  variant="default"
                >
                  Generate {quickNumSlots} Slots
                </Button>
                <p className="text-xs text-center mt-2 text-cyan-700 dark:text-cyan-300">
                  This will replace any existing slots
                </p>
              </Card>

              {/* Manual Slots */}
              {manualSlots.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Generated Slots:</p>
                  {manualSlots.map((slot, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Start Time</Label>
                          <Input
                            type="datetime-local"
                            value={slot.start.slice(0, 16)}
                            onChange={(e) => updateSlot(index, 'start', new Date(e.target.value).toISOString())}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>End Time</Label>
                          <Input
                            type="datetime-local"
                            value={slot.end.slice(0, 16)}
                            onChange={(e) => updateSlot(index, 'end', new Date(e.target.value).toISOString())}
                          />
                        </div>
                        <div className="w-24 space-y-2">
                          <Label># of slots</Label>
                          <Input
                            type="number"
                            value={slot.capacity}
                            onChange={(e) => updateSlot(index, 'capacity', parseInt(e.target.value))}
                            min="1"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSlot(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {manualSlots.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p className="text-sm">No time slots yet</p>
                  <p className="text-xs mt-1">Use Quick Generate or add slots manually</p>
                </div>
              )}
            </div>

            {/* Confirmation Checkboxes */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg">Confirmation Checkboxes</Label>
                  <p className="text-sm text-muted-foreground">
                    Add checkboxes that participants must confirm during registration (e.g., "I agree to T&C...")
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCheckbox}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Checkbox
                </Button>
              </div>

              {checkboxes.length > 0 ? (
                <div className="space-y-3">
                  {checkboxes.map((checkbox) => (
                    <Card key={checkbox.id} className="p-4">
                      <div className="flex gap-4 items-center">
                        <Input
                          value={checkbox.label}
                          onChange={(e) => updateCheckbox(checkbox.id, e.target.value)}
                          placeholder="e.g., I agree to the terms and conditions"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCheckbox(checkbox.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p className="text-sm">No confirmation checkboxes yet</p>
                  <p className="text-xs mt-1">Click "Add Checkbox" to create one</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Sign-up Sheet
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default CreateSignupSheet;
