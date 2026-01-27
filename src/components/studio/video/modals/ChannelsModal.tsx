import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Youtube, Instagram, Linkedin, Twitch, Facebook, X, Radio, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

type Provider = "youtube" | "facebook" | "linkedin" | "twitch" | "tiktok" | "instagram" | "x" | "rtmp_custom";

interface Destination {
  id: string;
  user_id: string;
  provider: Provider;
  display_name: string;
  platform_meta: Record<string, unknown>;
  is_active_default: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface SessionDestination {
  destination_id: string;
  enabled: boolean;
}

const PROVIDERS: { id: Provider; name: string; icon: React.ReactNode; oauth: boolean }[] = [
  { id: "youtube", name: "YouTube", icon: <Youtube className="w-6 h-6 text-red-500" />, oauth: true },
  { id: "facebook", name: "Facebook", icon: <Facebook className="w-6 h-6 text-blue-600" />, oauth: true },
  { id: "linkedin", name: "LinkedIn", icon: <Linkedin className="w-6 h-6 text-blue-700" />, oauth: true },
  { id: "twitch", name: "Twitch", icon: <Twitch className="w-6 h-6 text-purple-500" />, oauth: true },
  { id: "tiktok", name: "TikTok", icon: <span className="text-lg font-bold">TT</span>, oauth: true },
  { id: "instagram", name: "Instagram", icon: <Instagram className="w-6 h-6 text-pink-500" />, oauth: true },
  { id: "x", name: "X (Twitter)", icon: <X className="w-6 h-6" />, oauth: true },
  { id: "rtmp_custom", name: "Custom RTMP", icon: <Radio className="w-6 h-6 text-orange-500" />, oauth: false },
];

export function ChannelsModal({ isOpen, onClose, sessionId }: ChannelsModalProps) {
  const [activeTab, setActiveTab] = useState("your");
  const [view, setView] = useState<"list" | "add" | "edit" | "rtmp">("list");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [rtmpForm, setRtmpForm] = useState({ name: "", url: "", key: "" });
  const [sessionToggles, setSessionToggles] = useState<Record<string, boolean>>({});
  
  const queryClient = useQueryClient();

  // Fetch user's destinations
  const { data: destinations = [], isLoading } = useQuery({
    queryKey: ["streaming-destinations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const result = await (supabase as any)
        .from("streaming_destinations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (result.error) throw result.error;
      
      const data = result.data as any[];
      // Initialize session toggles based on is_active_default
      const toggles: Record<string, boolean> = {};
      (data || []).forEach((d: any) => {
        toggles[d.id] = d.is_active_default ?? true;
      });
      setSessionToggles(toggles);
      
      return (data || []) as Destination[];
    },
  });

  // Create destination mutation
  const createDestination = useMutation({
    mutationFn: async (params: { provider: Provider; displayName: string; platformMeta?: Record<string, unknown> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const result = await (supabase as any)
        .from("streaming_destinations")
        .insert([{
          user_id: user.id,
          provider: params.provider,
          display_name: params.displayName,
          platform_meta: (params.platformMeta || {}) as Record<string, string>,
        }])
        .select()
        .single();
      
      if (result.error) throw result.error;
      return result.data as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streaming-destinations"] });
      toast.success("Channel added successfully");
      setView("list");
      setRtmpForm({ name: "", url: "", key: "" });
    },
    onError: (error) => {
      toast.error("Failed to add channel: " + error.message);
    },
  });

  // Update destination mutation
  const updateDestination = useMutation({
    mutationFn: async (params: { id: string; displayName: string; platformMeta?: Record<string, string> }) => {
      const updateData: { display_name: string; platform_meta?: Record<string, string> } = {
        display_name: params.displayName,
      };
      if (params.platformMeta) {
        updateData.platform_meta = params.platformMeta;
      }
      const result = await (supabase as any)
        .from("streaming_destinations")
        .update(updateData)
        .eq("id", params.id);
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streaming-destinations"] });
      toast.success("Channel updated");
      setView("list");
      setEditingDestination(null);
    },
  });

  // Delete destination mutation
  const deleteDestination = useMutation({
    mutationFn: async (id: string) => {
      const result = await (supabase as any)
        .from("streaming_destinations")
        .delete()
        .eq("id", id);
      
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streaming-destinations"] });
      toast.success("Channel removed");
      setView("list");
      setEditingDestination(null);
    },
  });

  const toggleDestination = (id: string) => {
    setSessionToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (enabled: boolean) => {
    const newToggles: Record<string, boolean> = {};
    destinations.forEach(d => { newToggles[d.id] = enabled; });
    setSessionToggles(newToggles);
  };

  const activeCount = Object.values(sessionToggles).filter(Boolean).length;

  const getProviderIcon = (provider: Provider) => {
    const p = PROVIDERS.find(pr => pr.id === provider);
    return p?.icon || <Radio className="w-4 h-4" />;
  };

  const getProviderLabel = (provider: Provider) => {
    const p = PROVIDERS.find(pr => pr.id === provider);
    return p?.name || provider;
  };

  const handleProviderSelect = (provider: Provider) => {
    if (provider === "rtmp_custom") {
      setSelectedProvider(provider);
      setView("rtmp");
    } else {
      // For OAuth providers, show coming soon for now
      toast.info(`${getProviderLabel(provider)} connection coming soon`);
      // In future: initiate OAuth flow
    }
  };

  const handleRtmpSubmit = () => {
    if (!rtmpForm.name.trim()) {
      toast.error("Please enter a stream name");
      return;
    }
    if (!rtmpForm.url.trim()) {
      toast.error("Please enter an RTMP URL");
      return;
    }
    
    createDestination.mutate({
      provider: "rtmp_custom",
      displayName: rtmpForm.name,
      platformMeta: {
        rtmp_url: rtmpForm.url,
        stream_key: rtmpForm.key,
      },
    });
  };

  const handleEditSubmit = () => {
    if (!editingDestination) return;
    
    if (editingDestination.provider === "rtmp_custom") {
      updateDestination.mutate({
        id: editingDestination.id,
        displayName: rtmpForm.name,
        platformMeta: {
          rtmp_url: rtmpForm.url,
          stream_key: rtmpForm.key,
        },
      });
    } else {
      updateDestination.mutate({
        id: editingDestination.id,
        displayName: rtmpForm.name,
      });
    }
  };

  const openEdit = (destination: Destination) => {
    setEditingDestination(destination);
    setRtmpForm({
      name: destination.display_name,
      url: (destination.platform_meta as Record<string, string>)?.rtmp_url || "",
      key: (destination.platform_meta as Record<string, string>)?.stream_key || "",
    });
    setView("edit");
  };

  const renderListView = () => (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="your">Your Channels</TabsTrigger>
          <TabsTrigger value="paired">Paired Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="your" className="space-y-4">
          {destinations.length === 0 ? (
            // Empty state
            <div className="py-12 text-center">
              <Radio className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No channels connected yet.</p>
              <Button onClick={() => setView("add")} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Channel
              </Button>
            </div>
          ) : (
            <>
              {/* Status Bar */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {activeCount} of {destinations.length} active
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Toggle all</span>
                  <button 
                    onClick={() => toggleAll(false)}
                    className={cn("font-medium", activeCount === 0 ? "text-foreground" : "text-muted-foreground")}
                  >
                    OFF
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button 
                    onClick={() => toggleAll(true)}
                    className={cn("font-medium", activeCount === destinations.length ? "text-foreground" : "text-muted-foreground")}
                  >
                    ON
                  </button>
                </div>
              </div>

              {/* Channel List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {destinations.map(destination => (
                  <div
                    key={destination.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                  >
                    {/* Channel Icon */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded bg-background flex items-center justify-center border">
                        {getProviderIcon(destination.provider)}
                      </div>
                    </div>

                    {/* Channel Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{destination.display_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {getProviderLabel(destination.provider)}
                        {destination.provider === "rtmp_custom" && " stream"}
                      </p>
                    </div>

                    {/* Actions */}
                    <button 
                      onClick={() => openEdit(destination)}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      Edit
                    </button>
                    <Switch
                      checked={sessionToggles[destination.id] || false}
                      onCheckedChange={() => toggleDestination(destination.id)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="paired">
          <div className="py-8 text-center text-muted-foreground">
            Paired channels coming soon.
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Channels Button */}
      {destinations.length > 0 && (
        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full h-12 gap-2"
            onClick={() => setView("add")}
          >
            <Plus className="w-4 h-4" />
            Add Channels
          </Button>
        </div>
      )}
    </>
  );

  const renderAddView = () => (
    <div className="space-y-4">
      <button 
        onClick={() => setView("list")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to channels
      </button>
      
      <p className="text-sm text-muted-foreground">
        Select a platform to connect your streaming channel.
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map(provider => (
          <button
            key={provider.id}
            onClick={() => handleProviderSelect(provider.id)}
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              {provider.icon}
            </div>
            <div>
              <div className="font-medium">{provider.name}</div>
              <div className="text-xs text-muted-foreground">
                {provider.oauth ? "Connect account" : "Enter details"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderRtmpView = () => (
    <div className="space-y-4">
      <button 
        onClick={() => setView("add")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to providers
      </button>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Radio className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <div className="font-medium">Custom RTMP</div>
          <div className="text-sm text-muted-foreground">Stream to any RTMP destination</div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rtmp-name">Stream Name</Label>
          <Input
            id="rtmp-name"
            placeholder="e.g., My Custom Stream"
            value={rtmpForm.name}
            onChange={(e) => setRtmpForm(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="rtmp-url">RTMP URL</Label>
          <Input
            id="rtmp-url"
            placeholder="rtmp://..."
            value={rtmpForm.url}
            onChange={(e) => setRtmpForm(prev => ({ ...prev, url: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="rtmp-key">Stream Key</Label>
          <Input
            id="rtmp-key"
            type="password"
            placeholder="Your stream key"
            value={rtmpForm.key}
            onChange={(e) => setRtmpForm(prev => ({ ...prev, key: e.target.value }))}
          />
        </div>
        
        <Button 
          className="w-full" 
          onClick={handleRtmpSubmit}
          disabled={createDestination.isPending}
        >
          {createDestination.isPending ? "Adding..." : "Add RTMP Destination"}
        </Button>
      </div>
    </div>
  );

  const renderEditView = () => {
    if (!editingDestination) return null;
    
    return (
      <div className="space-y-4">
        <button 
          onClick={() => { setView("list"); setEditingDestination(null); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to channels
        </button>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            {getProviderIcon(editingDestination.provider)}
          </div>
          <div>
            <div className="font-medium">Edit {getProviderLabel(editingDestination.provider)}</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Display Name</Label>
            <Input
              id="edit-name"
              value={rtmpForm.name}
              onChange={(e) => setRtmpForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          {editingDestination.provider === "rtmp_custom" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-url">RTMP URL</Label>
                <Input
                  id="edit-url"
                  placeholder="rtmp://..."
                  value={rtmpForm.url}
                  onChange={(e) => setRtmpForm(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-key">Stream Key</Label>
                <Input
                  id="edit-key"
                  type="password"
                  placeholder="Your stream key"
                  value={rtmpForm.key}
                  onChange={(e) => setRtmpForm(prev => ({ ...prev, key: e.target.value }))}
                />
              </div>
            </>
          )}
          
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={handleEditSubmit}
              disabled={updateDestination.isPending}
            >
              {updateDestination.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteDestination.mutate(editingDestination.id)}
              disabled={deleteDestination.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="p-6 pb-4 text-center">
          <DialogTitle className="text-xl font-semibold">
            {view === "list" && "Add channels"}
            {view === "add" && "Select a platform"}
            {view === "rtmp" && "Custom RTMP"}
            {view === "edit" && "Edit channel"}
          </DialogTitle>
          {view === "list" && (
            <p className="text-sm text-muted-foreground">
              Choose destinations and customize stream details.
            </p>
          )}
        </DialogHeader>

        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <>
              {view === "list" && renderListView()}
              {view === "add" && renderAddView()}
              {view === "rtmp" && renderRtmpView()}
              {view === "edit" && renderEditView()}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
