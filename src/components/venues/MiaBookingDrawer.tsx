import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User } from "lucide-react";

interface MiaBookingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content: "Hi! I'm Mia, your AI venue coordinator. I can help you create a booking, draft a proposal, or answer questions about managing your venue.\n\nWhat would you like help with today?"
  }
];

export function MiaBookingDrawer({ open, onOpenChange }: MiaBookingDrawerProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    let response = "";
    if (userMessage.toLowerCase().includes("booking") || userMessage.toLowerCase().includes("event")) {
      response = "I'd be happy to help create a booking! To get started, I'll need a few details:\n\n1. **Client name** - Who is the booking for?\n2. **Event type** - Wedding, corporate, birthday, etc.\n3. **Preferred date** - When are they looking to book?\n4. **Estimated guests** - How many attendees?\n\nJust share what you know and I'll help fill in the rest!";
    } else if (userMessage.toLowerCase().includes("proposal")) {
      response = "Creating a proposal is easy! Tell me about the event and I'll draft something professional. What package are you thinking - Basic, Standard, or Premium? I can also suggest custom inclusions based on the event type.";
    } else if (userMessage.toLowerCase().includes("follow") || userMessage.toLowerCase().includes("email")) {
      response = "I can help you draft a follow-up message! Would you like me to:\n\n• Write a friendly check-in for a pending inquiry\n• Send a tour reminder\n• Follow up after a site visit\n• Request a deposit or contract signature\n\nJust let me know which one!";
    } else {
      response = "That's a great question! I'm here to help with bookings, proposals, client follow-ups, and general venue management. Is there something specific you'd like assistance with?";
    }
    
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            Mia • AI Venue Manager
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div 
                  className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                    msg.role === "user" 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Mia anything..."
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={loading}
            />
            <Button 
              size="icon" 
              onClick={handleSend} 
              disabled={loading || !input.trim()}
              style={{ backgroundColor: "#053877" }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => setInput("Help me create a new booking")}
            >
              Create booking
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => setInput("Draft a follow-up email")}
            >
              Follow-up email
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
