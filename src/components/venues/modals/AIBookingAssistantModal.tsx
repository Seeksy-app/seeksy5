import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Bot, User, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AIBookingAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId?: string;
  isDemoMode?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const eventTypes = ["Wedding", "Corporate Event", "Birthday Party", "Anniversary", "Gala", "Conference", "Concert", "Private Dinner"];

export function AIBookingAssistantModal({ open, onOpenChange, venueId, isDemoMode = true }: AIBookingAssistantModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bookingCreated, setBookingCreated] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm Mia, your AI booking assistant. I can help you create a booking quickly. Just tell me about the event – who's it for, what type of event, how many guests, and when they're thinking. I'll draft everything for you!" }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [quickForm, setQuickForm] = useState({
    eventType: "",
    guestCount: "",
    targetMonth: "",
    budgetRange: ""
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Build context from quick form
      const context = `User is inquiring about: Event type: ${quickForm.eventType || 'not specified'}, Guest count: ${quickForm.guestCount || 'not specified'}, Target month: ${quickForm.targetMonth || 'not specified'}, Budget: ${quickForm.budgetRange || 'not specified'}`;

      const { data, error } = await supabase.functions.invoke('venue-ai-manager-chat', {
        body: {
          message: userMessage,
          context: `You are Mia, an AI booking assistant for a venue. Help create bookings efficiently. ${context}. Current user message: ${userMessage}. If the user provides enough info (name, event type, date range, guest count), offer to create the booking. Keep responses concise.`,
          venueId
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.response || "I apologize, I couldn't process that. Could you try again?" }]);
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const createQuickBooking = async () => {
    if (!venueId) return;
    
    setLoading(true);
    try {
      // Create a sample client
      const { data: client, error: clientError } = await supabase
        .from('venue_clients')
        .insert({
          venue_id: venueId,
          first_name: 'AI-Assisted',
          last_name: 'Inquiry',
          email: 'pending@placeholder.com',
          type: 'individual',
          is_demo: isDemoMode
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create booking
      const { error: bookingError } = await supabase
        .from('venue_bookings')
        .insert({
          venue_id: venueId,
          client_id: client.id,
          event_type: quickForm.eventType || 'TBD',
          guest_count: parseInt(quickForm.guestCount) || null,
          status: 'inquiry',
          notes: `AI-assisted booking\nTarget month: ${quickForm.targetMonth}\nBudget range: ${quickForm.budgetRange}`,
          is_demo: isDemoMode
        });

      if (bookingError) throw bookingError;

      setBookingCreated(true);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I've created the booking inquiry for you. You can now find it in your Bookings page. Would you like me to help with anything else?" 
      }]);
      toast.success("Booking inquiry created!");
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error("Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            AI Booking Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Quick Form Panel */}
          <div className="w-64 shrink-0 space-y-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 uppercase">Quick Details</p>
            
            <div className="space-y-2">
              <Label className="text-xs">Event Type</Label>
              <Select value={quickForm.eventType} onValueChange={(v) => setQuickForm({ ...quickForm, eventType: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Guest Count</Label>
              <Input 
                type="number" 
                className="h-8 text-xs"
                placeholder="e.g., 100"
                value={quickForm.guestCount}
                onChange={(e) => setQuickForm({ ...quickForm, guestCount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Target Month</Label>
              <Select value={quickForm.targetMonth} onValueChange={(v) => setQuickForm({ ...quickForm, targetMonth: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Budget Range</Label>
              <Select value={quickForm.budgetRange} onValueChange={(v) => setQuickForm({ ...quickForm, budgetRange: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under $5k">Under $5k</SelectItem>
                  <SelectItem value="$5k - $15k">$5k - $15k</SelectItem>
                  <SelectItem value="$15k - $30k">$15k - $30k</SelectItem>
                  <SelectItem value="$30k+">$30k+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              size="sm" 
              className="w-full mt-4"
              onClick={createQuickBooking}
              disabled={loading || bookingCreated}
            >
              {bookingCreated ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Created!
                </>
              ) : (
                "Create Booking"
              )}
            </Button>

            {bookingCreated && (
              <Button 
                size="sm" 
                variant="outline"
                className="w-full"
                onClick={() => {
                  onOpenChange(false);
                  navigate('/venueOS/bookings');
                }}
              >
                Open Bookings
              </Button>
            )}
          </div>

          {/* Chat Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Describe the booking..."
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !inputMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
