import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Globe, Upload, Play, Radio, Video } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import podcastThumb from "@/assets/studio-template-podcast.jpg";
import livestreamThumb from "@/assets/studio-template-livestream.jpg";
import interviewThumb from "@/assets/studio-template-interview.jpg";
import { useCredits } from "@/hooks/useCredits";

interface StudioSession {
  id: string;
  session_name: string;
  host_name: string | null;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  isLive?: boolean;
}

export default function StudioTemplates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deductCredit, isDeducting } = useCredits();
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTab, setSelectedTab] = useState("videos");
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form state
  const [sessionName, setSessionName] = useState("");
  const [hostName, setHostName] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

  const demoTemplates = [
    {
      id: 'demo-podcast',
      session_name: "Weekly Podcast Recording",
      host_name: "Your Name",
      description: "Professional podcast recording setup with multi-track audio",
      thumbnail_url: podcastThumb,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true,
      isLive: false,
    },
    {
      id: 'demo-livestream',
      session_name: "Live Stream Session",
      host_name: "Your Name",
      description: "Multi-platform live streaming with interactive chat",
      thumbnail_url: livestreamThumb,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true,
      isLive: false,
    },
    {
      id: 'demo-interview',
      session_name: "Guest Interview Studio",
      host_name: "Your Name",
      description: "Two-person interview setup with professional lighting",
      thumbnail_url: interviewThumb,
      created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true,
      isLive: false,
    },
  ];

  useEffect(() => {
    checkAdminStatus();
    loadSessions();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "super_admin"])
        .maybeSingle();

      const isAdminUser = !!roleData;
      setIsAdmin(isAdminUser);
      
      if (isAdminUser) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('studio_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Check if user is currently live
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_live_on_profile')
        .eq('id', user.id)
        .single();
      
      // Mark sessions as live if user is currently streaming
      const sessionsWithLiveStatus = (data || []).map(session => ({
        ...session,
        isLive: profile?.is_live_on_profile || false
      }));
      
      setSessions(sessionsWithLiveStatus);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load studio sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadThumbnail = async (file: File, sessionId: string) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${sessionId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('studio-recordings')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('studio-recordings')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      toast({
        title: "Validation Error",
        description: "Studio name is required",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Deduct credit for creating studio
      await deductCredit("create_studio", `Created studio: ${sessionName.trim()}`);

      // Create session first
      const { data: session, error: sessionError } = await supabase
        .from('studio_templates')
        .insert({
          user_id: user.id,
          session_name: sessionName.trim(),
          host_name: hostName.trim() || null,
          description: description.trim() || null,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnail && session) {
        thumbnailUrl = await uploadThumbnail(thumbnail, session.id);
        
        // Update session with thumbnail URL
        const { error: updateError } = await supabase
          .from('studio_templates')
          .update({ thumbnail_url: thumbnailUrl })
          .eq('id', session.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: "Studio session created successfully",
      });

      // Reset form
      setSessionName("");
      setHostName("");
      setDescription("");
      setThumbnail(null);
      setThumbnailPreview("");
      setShowCreateDialog(false);

      // Reload sessions
      loadSessions();
    } catch (error: any) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create studio session",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEnterSession = (session: StudioSession | typeof demoTemplates[0]) => {
    navigate(`/broadcast/session/${session.id}`, {
      state: {
        sessionName: session.session_name,
        hostName: session.host_name,
        description: session.description,
      }
    });
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Filter out meetings from studio sessions - only show podcast studios
  const podcastSessions = sessions.filter(session => 
    !session.session_name.startsWith('Meeting:')
  );
  
  const allSessions = [...podcastSessions, ...demoTemplates];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      
      {/* Tabs Navigation */}
      <div className="border-b border-border/50 bg-white/95 dark:bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <div className="flex items-center justify-between py-4">
              <TabsList className="bg-transparent border-b-0 h-auto p-0 gap-6">
                <TabsTrigger 
                  value="videos" 
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-2 shadow-none"
                >
                  Videos
                </TabsTrigger>
                <TabsTrigger 
                  value="studio"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-2 shadow-none text-muted-foreground data-[state=active]:text-foreground"
                >
                  Studio Recordings
                </TabsTrigger>
                <TabsTrigger 
                  value="clips"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-2 shadow-none text-muted-foreground data-[state=active]:text-foreground"
                >
                  Clips
                </TabsTrigger>
                <TabsTrigger 
                  value="live"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-2 shadow-none text-muted-foreground data-[state=active]:text-foreground"
                >
                  Live Stream
                </TabsTrigger>
                <TabsTrigger 
                  value="playlist"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-2 shadow-none text-muted-foreground data-[state=active]:text-foreground"
                >
                  Playlist
                </TabsTrigger>
              </TabsList>
              
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Studio
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create Studio Session</DialogTitle>
                    <DialogDescription>
                      Set up your studio session details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="session-name">Studio Name *</Label>
                      <Input
                        id="session-name"
                        placeholder="e.g., Episode 42: The Future of AI"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="host-name">Host Name</Label>
                      <Input
                        id="host-name"
                        placeholder="e.g., John Doe"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of this studio session..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail">Thumbnail Image</Label>
                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('thumbnail')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Thumbnail
                        </Button>
                        <Input
                          id="thumbnail"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleThumbnailChange}
                        />
                        {thumbnailPreview && (
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="h-16 w-16 object-cover rounded border"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateSession} disabled={creating || isDeducting}>
                      {creating || isDeducting ? "Creating..." : "Create Studio"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-6 py-6">
        {/* Filter Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Table Header */}
        <div className="mb-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground pb-2 border-b border-border/50">
            <div className="w-12 flex items-center justify-center">
              <Checkbox />
            </div>
            <div className="flex-1">Studio</div>
            <div className="w-32 text-center">Visibility</div>
            <div className="w-32 text-center">Status</div>
            <div className="w-32 text-right">Date</div>
          </div>
        </div>

        {/* Studio Sessions List */}
        <div className="space-y-1">
          {allSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No studio sessions yet. Create your first one to get started.
            </div>
          ) : (
            allSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-4 py-3 hover:bg-muted/50 rounded-lg transition-colors group cursor-pointer"
                onClick={() => handleEnterSession(session)}
              >
                <div className="w-12 flex items-center justify-center">
                  <Checkbox
                    checked={selectedSessions.includes(session.id)}
                    onCheckedChange={() => toggleSessionSelection(session.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-40 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                    {session.thumbnail_url ? (
                      <img
                        src={session.thumbnail_url}
                        alt={session.session_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Play className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                  </div>
                  
                  {/* Title and Description */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {session.session_name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {session.description || 
                        `Host: ${session.host_name || 'Not specified'}`}
                    </p>
                  </div>
                </div>

                {/* Visibility */}
                <div className="w-32 flex justify-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>Public</span>
                  </div>
                </div>

                {/* Status */}
                <div className="w-32 flex justify-center">
                  {('isDemo' in session && session.isDemo) ? (
                    <Badge variant="secondary">Demo</Badge>
                  ) : session.isLive ? (
                    <Badge variant="destructive" className="bg-red-600 animate-pulse">
                      <Radio className="h-3 w-3 mr-1" />
                      LIVE
                    </Badge>
                  ) : (
                    <Badge variant="default">Ready</Badge>
                  )}
                </div>

                {/* Date */}
                <div className="w-32 text-right text-sm text-muted-foreground">
                  {formatDate(session.created_at)}
                  <div className="text-xs mt-0.5">Published</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
