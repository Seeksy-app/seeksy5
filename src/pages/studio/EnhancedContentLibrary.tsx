import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Search, Play, Sparkles, Clock, MoreVertical,
  Grid, List, Filter, SortAsc, Eye, Share2, Download,
  Scissors, CheckCircle2, AlertCircle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EnhancedMedia {
  id: string;
  file_name: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  edit_status: string | null;
  file_size_bytes: number | null;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function EnhancedContentLibrary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch AI-enhanced media
  const { data: enhancedMedia, isLoading } = useQuery({
    queryKey: ['enhanced-media'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .or('edit_status.eq.enhanced,edit_status.eq.completed,edit_status.eq.processing')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EnhancedMedia[];
    }
  });

  const filteredMedia = enhancedMedia?.filter(m => {
    const matchesSearch = !searchQuery || 
      m.file_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'processing') return matchesSearch && m.edit_status === 'processing';
    if (activeTab === 'completed') return matchesSearch && (m.edit_status === 'enhanced' || m.edit_status === 'completed');
    return matchesSearch;
  });

  const stats = {
    total: enhancedMedia?.length || 0,
    completed: enhancedMedia?.filter(m => m.edit_status === 'enhanced' || m.edit_status === 'completed').length || 0,
    processing: enhancedMedia?.filter(m => m.edit_status === 'processing').length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/studio')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[#2C6BED]" />
              AI Enhanced Content
            </h1>
            <p className="text-sm text-muted-foreground">
              View and manage all your AI-enhanced videos
            </p>
          </div>
          <Button 
            className="text-white"
            style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}
            onClick={() => navigate('/studio/ai-post-production')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Enhance New Video
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-[#053877]/10 to-[#2C6BED]/10 border-[#2C6BED]/20">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-[#2C6BED]">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Enhanced</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-emerald-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-amber-600">{stats.processing}</div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search enhanced content..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="gap-2">
              All
              <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Completed
              <Badge variant="secondary" className="ml-1">{stats.completed}</Badge>
            </TabsTrigger>
            <TabsTrigger value="processing" className="gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Processing
              <Badge variant="secondary" className="ml-1">{stats.processing}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content Grid/List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredMedia?.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Enhanced Content Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by enhancing a video with AI to see it here.
              </p>
              <Button 
                className="text-white"
                style={{ background: 'linear-gradient(135deg, #053877 0%, #2C6BED 100%)' }}
                onClick={() => navigate('/studio/ai-post-production')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Enhance Your First Video
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedia?.map((media) => (
              <Card 
                key={media.id} 
                className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#2C6BED]/50 transition-all group"
                onClick={() => navigate(`/studio/enhanced/${media.id}`)}
              >
                <div className="relative aspect-video bg-muted">
                  {media.thumbnail_url ? (
                    <img 
                      src={media.thumbnail_url} 
                      alt={media.file_name || ''} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <Play className="h-10 w-10 text-white/30" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <Badge 
                    className={cn(
                      "absolute top-2 left-2",
                      media.edit_status === 'processing' 
                        ? "bg-amber-500/90" 
                        : "bg-emerald-500/90"
                    )}
                  >
                    {media.edit_status === 'processing' ? (
                      <>Processing...</>
                    ) : (
                      <><Sparkles className="h-3 w-3 mr-1" /> Enhanced</>
                    )}
                  </Badge>

                  {/* Duration */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(media.duration_seconds)}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate mb-1">
                    {media.file_name || "Untitled Video"}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {media.created_at ? formatDistanceToNow(new Date(media.created_at), { addSuffix: true }) : '—'}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/studio/enhanced/${media.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/studio/clips?media=${media.id}`)}>
                          <Scissors className="h-4 w-4 mr-2" />
                          Generate Clips
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMedia?.map((media) => (
              <Card 
                key={media.id}
                className="cursor-pointer hover:ring-2 hover:ring-[#2C6BED]/50 transition-all"
                onClick={() => navigate(`/studio/enhanced/${media.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="relative w-32 aspect-video bg-muted rounded overflow-hidden flex-shrink-0">
                    {media.thumbnail_url ? (
                      <img 
                        src={media.thumbnail_url} 
                        alt={media.file_name || ''} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <Play className="h-6 w-6 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{media.file_name || "Untitled Video"}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{formatDuration(media.duration_seconds)}</span>
                      <span>•</span>
                      <span>{media.created_at ? format(new Date(media.created_at), "MMM d, yyyy") : '—'}</span>
                    </div>
                  </div>
                  <Badge 
                    className={cn(
                      media.edit_status === 'processing' 
                        ? "bg-amber-500/20 text-amber-600" 
                        : "bg-emerald-500/20 text-emerald-600"
                    )}
                  >
                    {media.edit_status === 'processing' ? 'Processing' : 'Enhanced'}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
