import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tv, Upload, FolderSync, Play, Clock, Eye, Radio, MoreVertical, ExternalLink, Pencil, Trash2, Plus, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DropboxImportDialog } from "@/components/tv/DropboxImportDialog";
import { VideoUploadDialog } from "@/components/tv/VideoUploadDialog";
import { ChannelSelector } from "@/components/tv/ChannelSelector";
import { VideoEditDialog } from "@/components/tv/VideoEditDialog";
import { VideoDeleteDialog } from "@/components/tv/VideoDeleteDialog";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const AdminSeeksyTV = () => {
  const navigate = useNavigate();
  const [dropboxOpen, setDropboxOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [channelSelectorOpen, setChannelSelectorOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string; channelId?: string | null; description?: string | null; category?: string | null } | null>(null);

  const { data: tvContent, isLoading, refetch } = useQuery({
    queryKey: ['admin-tv-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_content')
        .select(`
          *,
          channel:tv_channels(id, name, slug)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: channels } = useQuery({
    queryKey: ['tv-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: importJobs } = useQuery({
    queryKey: ['dropbox-import-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dropbox_import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPublishBadge = (isPublished: boolean) => {
    return isPublished 
      ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Published</Badge>
      : <Badge variant="secondary">Draft</Badge>;
  };

  const openChannelSelector = (video: { id: string; title: string; channel_id?: string | null }) => {
    setSelectedVideo({ id: video.id, title: video.title, channelId: video.channel_id });
    setChannelSelectorOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tv className="h-8 w-8 text-primary" />
            Seeksy TV Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage video content for Seeksy TV platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/seeksy-tv/channels')}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Channels
          </Button>
          <Button variant="outline" onClick={() => setDropboxOpen(true)}>
            <FolderSync className="h-4 w-4 mr-2" />
            Import from Dropbox
          </Button>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tvContent?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {tvContent?.filter(v => v.is_published).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {tvContent?.filter(v => !v.is_published).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {channels?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {importJobs?.filter(j => j.status === 'pending' || j.status === 'processing').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              TV Channels
            </CardTitle>
            <CardDescription>Your Seeksy TV channels</CardDescription>
          </div>
          <Button size="sm" onClick={() => navigate('/admin/seeksy-tv/channels')}>
            <Plus className="h-4 w-4 mr-1" />
            Create Channel
          </Button>
        </CardHeader>
        <CardContent>
          {channels && channels.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => navigate(`/tv/channel/${channel.slug}`)}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                    {channel.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{channel.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tvContent?.filter(v => v.channel_id === channel.id).length || 0} videos
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No channels yet. Create your first channel to organize content.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Import Jobs */}
      {importJobs && importJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Import Jobs</CardTitle>
            <CardDescription>Status of Dropbox imports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {importJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FolderSync className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{job.series_name || 'Untitled'}</span>
                      <p className="text-xs text-muted-foreground">{job.folder_path || 'Root'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {job.processed_files}/{job.total_files} files
                    </span>
                    {getStatusBadge(job.status)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(job.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Content Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Videos</CardTitle>
          <CardDescription>Manage your Seeksy TV content library</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading videos...</div>
          ) : tvContent && tvContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tvContent.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {video.thumbnail_url ? (
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tv className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="icon" variant="secondary">
                        <Play className="h-6 w-6" />
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2">
                      {getPublishBadge(video.is_published)}
                    </div>
                    <div className="absolute top-2 left-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="secondary" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => {
                            setSelectedVideo({ id: video.id, title: video.title, channelId: video.channel_id, description: video.description, category: video.category });
                            setEditDialogOpen(true);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openChannelSelector(video)}>
                            <Radio className="h-4 w-4 mr-2" />
                            {video.channel_id ? "Change Channel" : "Publish to Channel"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(video.video_url, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Video
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedVideo({ id: video.id, title: video.title });
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Video
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">{video.title}</h3>
                    {video.channel && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        <Radio className="h-3 w-3 mr-1" />
                        {(video.channel as { name: string }).name}
                      </Badge>
                    )}
                    {video.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {video.duration_seconds ? `${Math.floor(video.duration_seconds / 60)}m` : 'N/A'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.view_count || 0} views
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tv className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No videos yet</h3>
              <p className="text-muted-foreground mt-1">
                Import videos from Dropbox or upload directly to get started
              </p>
              <Button className="mt-4" onClick={() => setDropboxOpen(true)}>
                <FolderSync className="h-4 w-4 mr-2" />
                Import from Dropbox
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DropboxImportDialog 
        open={dropboxOpen} 
        onOpenChange={setDropboxOpen}
        onImportComplete={() => refetch()}
      />

      <VideoUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={() => refetch()}
      />

      {selectedVideo && (
        <>
          <ChannelSelector
            open={channelSelectorOpen}
            onOpenChange={setChannelSelectorOpen}
            videoId={selectedVideo.id}
            videoTitle={selectedVideo.title}
            currentChannelId={selectedVideo.channelId}
            onSuccess={() => refetch()}
          />
          <VideoEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            video={selectedVideo}
            onSuccess={() => refetch()}
          />
          <VideoDeleteDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            video={selectedVideo}
            onSuccess={() => refetch()}
          />
        </>
      )}
    </div>
  );
};

export default AdminSeeksyTV;
