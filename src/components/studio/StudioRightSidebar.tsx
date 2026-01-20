import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Users, Sparkles, MessageSquare } from "lucide-react";
import AIMeetingNotesPanel from "./AIMeetingNotesPanel";
import { supabase } from "@/integrations/supabase/client";

interface StudioRightSidebarProps {
  currentViewerCount: number;
  onAdSelect: (ad: any, type: string) => void;
  selectedAd: any;
  markers: any[];
  onAddMarker: (type: 'ad' | 'clip') => void;
  isRecording: boolean;
  selectedChannels: {
    myPage: boolean;
    facebook: boolean;
    linkedin: boolean;
    tiktok: boolean;
    twitch: boolean;
    youtube: boolean;
  };
  onToggleChannel: (channel: string) => void;
  channelsExpanded: boolean;
  onToggleChannelsExpanded: () => void;
  profileImageUrl?: string;
  sessionId?: string;
  meetingId?: string;
  showAINotes?: boolean;
}

export function StudioRightSidebar({
  currentViewerCount,
  onAdSelect,
  selectedAd,
  markers,
  onAddMarker,
  isRecording,
  selectedChannels,
  onToggleChannel,
  channelsExpanded,
  onToggleChannelsExpanded,
  profileImageUrl,
  sessionId,
  meetingId,
  showAINotes = true,
}: StudioRightSidebarProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; text: string; avatar?: string }>>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'ai'>('chat');
  const [aiNotesVisible, setAiNotesVisible] = useState(showAINotes);

  // Sync aiNotesVisible with showAINotes prop changes
  useEffect(() => {
    setAiNotesVisible(showAINotes);
  }, [showAINotes]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setMessages([...messages, {
      id: Date.now().toString(),
      sender: "You",
      text: message,
      avatar: profileImageUrl
    }]);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Fetch user profile for host name
  const [hostName, setHostName] = useState('Host');
  
  useEffect(() => {
    const fetchHostProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.full_name) {
          setHostName(profile.full_name);
        }
      }
    };
    fetchHostProfile();
  }, []);

  const participants = [
    { id: '1', name: `${hostName} (Host, me)`, avatar: profileImageUrl, isHost: true },
    { id: '2', name: 'Seeksy AI Note Taker', avatar: '', isHost: false },
  ];

  // If meetingId is provided, show Meeting Studio UI
  if (meetingId) {
    return (
      <div className="flex flex-col h-full border-l border-border/40 bg-background">
        {/* Tabs at the top */}
        <div className="border-b border-border/40">
          <div className="flex items-center">
            <Button
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              size="lg"
              onClick={() => setActiveTab('chat')}
              className="flex-1 rounded-none border-b-2"
              style={{
                borderBottomColor: activeTab === 'chat' ? 'hsl(var(--primary))' : 'transparent'
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button
              variant={activeTab === 'ai' ? 'default' : 'ghost'}
              size="lg"
              onClick={() => {
                setActiveTab('ai');
                setAiNotesVisible(true);
              }}
              className="flex-1 rounded-none border-b-2"
              style={{
                borderBottomColor: activeTab === 'ai' ? 'hsl(var(--primary))' : 'transparent'
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Notes
            </Button>
          </div>
        </div>

        {/* Participants Section */}
        <div className="border-b border-border/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Participants ({participants.length})</span>
          </div>
          <ScrollArea className="max-h-32">
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback className="text-xs bg-primary/10">
                      {participant.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{participant.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'chat' ? (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex gap-2">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={msg.avatar} />
                          <AvatarFallback className="text-xs bg-primary/10">
                            {msg.sender.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium mb-1">{msg.sender}</div>
                          <div className="text-sm break-words">{msg.text}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border/40">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    size="icon"
                    disabled={!message.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 relative">
              {aiNotesVisible && (
                <AIMeetingNotesPanel
                  meetingId={meetingId}
                  isVisible={aiNotesVisible}
                  onClose={() => {
                    setAiNotesVisible(false);
                    setActiveTab('chat');
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Otherwise, show Podcast Studio UI
  return (
    <ScrollArea className="h-full border-l border-border/40">
      <div className="p-4 space-y-6">
        {/* Viewer Count */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <span className="text-sm font-medium">Live Viewers</span>
          <span className="text-2xl font-bold text-primary">{currentViewerCount}</span>
        </div>

        {/* Markers Panel */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Markers & Moments
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => onAddMarker('ad')}
              disabled={!isRecording}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Ad Spot
            </Button>
            <Button
              onClick={() => onAddMarker('clip')}
              disabled={!isRecording}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Clip Moment
            </Button>
          </div>
          <ScrollArea className="max-h-48">
            {markers.length > 0 ? (
              <div className="space-y-2">
                {markers.map((marker) => (
                  <div
                    key={marker.id}
                    className="p-2 rounded-lg bg-secondary/50 text-xs"
                  >
                    <div className="font-medium capitalize">{marker.type}</div>
                    <div className="text-muted-foreground">{marker.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No markers yet. Start recording to add markers.
              </p>
            )}
          </ScrollArea>
        </div>

        {/* Streaming Channels */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Streaming To</h3>
          <div className="space-y-2">
            {Object.entries(selectedChannels).map(([channel, enabled]) => (
              <div
                key={channel}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
              >
                <span className="text-sm capitalize">{channel.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
