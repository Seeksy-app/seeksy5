import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send } from 'lucide-react';

interface Message {
  id: string;
  sender_name: string;
  message: string;
  created_at: string;
  user_id?: string;
}

interface MeetingChatProps {
  meetingId: string;
  onClose: () => void;
}

const MeetingChat: React.FC<MeetingChatProps> = ({ meetingId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      const result = await (supabase as any)
        .from('meeting_chat_messages')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: true });
      
      setMessages((result.data as any[]) || []);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${meetingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'meeting_chat_messages',
        filter: `meeting_id=eq.${meetingId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    await (supabase as any).from('meeting_chat_messages').insert({
      meeting_id: meetingId,
      user_id: user?.id,
      sender_name: user?.email?.split('@')[0] || 'Guest',
      message: newMessage.trim(),
    });

    setNewMessage('');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-slate-700 flex items-center justify-between px-4">
        <h3 className="text-white font-medium">Chat</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-slate-500 text-center text-sm">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`${
                  msg.user_id === currentUserId
                    ? 'ml-auto bg-blue-600'
                    : 'mr-auto bg-slate-700'
                } max-w-[85%] rounded-lg p-3`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-300">
                    {msg.user_id === currentUserId ? 'You' : msg.sender_name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-white text-sm">{msg.message}</p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MeetingChat;
