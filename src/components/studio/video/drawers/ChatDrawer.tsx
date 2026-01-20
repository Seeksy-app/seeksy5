import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Users } from "lucide-react";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isHost: boolean;
}

const mockMessages: Message[] = [
  { id: "1", sender: "Host", content: "Welcome to the stream!", timestamp: new Date(), isHost: true },
  { id: "2", sender: "Guest 1", content: "Thanks for having me!", timestamp: new Date(), isHost: false },
];

export function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: "Host",
      content: newMessage,
      timestamp: new Date(),
      isHost: true,
    }]);
    setNewMessage("");
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-16 bottom-0 w-[400px] bg-[#1a1d21] border-l border-white/10 flex flex-col z-20">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Private Chat</h3>
          <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/60">
            <Users className="w-3 h-3 inline mr-1" />
            2
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-white/70 hover:text-white"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.isHost ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.isHost
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white"
                }`}
              >
                <p className="text-xs text-white/70 mb-1">{msg.sender}</p>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
