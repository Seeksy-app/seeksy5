import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Radio, Plus, Pencil, Trash2, ArrowLeft, ExternalLink, 
  MoreVertical, Users, Video, Star, Loader2, ImageIcon
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "Podcasts",
  "Interviews",
  "Events",
  "Technology",
  "Business",
  "Entertainment",
  "Education",
  "Lifestyle",
  "Military",
  "News",
  "Other"
];

interface ChannelFormData {
  name: string;
  slug: string;
  description: string;
  category: string;
  cover_image_url: string;
  thumbnail_url: string;
  is_featured: boolean;
}

const emptyFormData: ChannelFormData = {
  name: "",
  slug: "",
  description: "",
  category: "",
  cover_image_url: "",
  thumbnail_url: "",
  is_featured: false,
};

const AdminTVChannels = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [formData, setFormData] = useState<ChannelFormData>(emptyFormData);

  const { data: channels, isLoading } = useQuery({
    queryKey: ['admin-tv-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tv_channels')
        .select(`
          *,
          videos:tv_content(id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: creators } = useQuery({
    queryKey: ['creators-for-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .limit(100);
      
      if (error) throw error;
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ChannelFormData & { id?: string }) => {
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
        const channelData: any = {
          name: data.name,
          slug,
          description: data.description,
          category: data.category,
          cover_image_url: data.cover_image_url,
          thumbnail_url: data.thumbnail_url,
          is_featured: data.is_featured,
        };

        if (data.id) {
          // Update
          channelData.updated_at = new Date().toISOString();
          const { error } = await supabase
            .from('tv_channels')
            .update(channelData)
            .eq('id', data.id);
          if (error) throw error;
        } else {
          // Create
          const { error } = await supabase
            .from('tv_channels')
            .insert(channelData);
          if (error) throw error;
        }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tv-channels'] });
      toast({
        title: editingChannel ? "Channel updated" : "Channel created",
        description: "Changes saved successfully",
      });
      setDialogOpen(false);
      setEditingChannel(null);
      setFormData(emptyFormData);
    },
    onError: (error) => {
      console.error("Error saving channel:", error);
      toast({
        title: "Error",
        description: "Failed to save channel",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tv_channels')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tv-channels'] });
      toast({
        title: "Channel deleted",
        description: "The channel has been removed",
      });
      setDeleteDialogOpen(false);
      setEditingChannel(null);
    },
    onError: (error) => {
      console.error("Error deleting channel:", error);
      toast({
        title: "Error",
        description: "Failed to delete channel",
        variant: "destructive",
      });
    }
  });

  const openCreateDialog = () => {
    setEditingChannel(null);
    setFormData(emptyFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (channel: any) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name || "",
      slug: channel.slug || "",
      description: channel.description || "",
      category: channel.category || "",
      cover_image_url: channel.cover_image_url || "",
      thumbnail_url: channel.thumbnail_url || "",
      is_featured: channel.is_featured || false,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a channel name",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate({ ...formData, id: editingChannel?.id });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/seeksy-tv')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Radio className="h-8 w-8 text-primary" />
              TV Channels
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage Seeksy TV channels
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Channel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Featured</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {channels?.filter(c => c.is_featured).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {channels?.reduce((acc, c) => acc + (c.videos?.length || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {new Set(channels?.filter(c => c.category).map(c => c.category)).size || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Channels</CardTitle>
          <CardDescription>Manage your Seeksy TV channels</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading channels...</div>
          ) : channels && channels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((channel) => (
                <Card key={channel.id} className="overflow-hidden group">
                  {/* Cover Image */}
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                    {channel.cover_image_url ? (
                      <img 
                        src={channel.cover_image_url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="secondary" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(channel)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Channel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/tv/channel/${channel.slug}`)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View on TV
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditingChannel(channel);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Channel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Featured Badge */}
                    {channel.is_featured && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-amber-500 text-white">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Channel Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-lg font-bold shrink-0 -mt-8 border-4 border-background relative z-10">
                        {channel.thumbnail_url ? (
                          <img src={channel.thumbnail_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          channel.name.charAt(0)
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-semibold truncate">{channel.name}</h3>
                        {channel.category && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {channel.category}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {channel.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
                        {channel.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Video className="h-4 w-4" />
                        {channel.videos?.length || 0} videos
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {channel.subscriber_count || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Radio className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No channels yet</h3>
              <p className="text-muted-foreground mt-1">
                Create your first channel to organize your TV content
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Channel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingChannel ? "Edit Channel" : "Create Channel"}</DialogTitle>
            <DialogDescription>
              {editingChannel ? "Update channel details" : "Create a new TV channel"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Channel Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="American Warriors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="american-warriors"
                />
                <p className="text-xs text-muted-foreground">Auto-generated if empty</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your channel..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cover_image">Cover Image URL</Label>
                <Input
                  id="cover_image"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_featured" className="text-sm font-normal cursor-pointer">
                Feature this channel on the TV homepage
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingChannel ? "Save Changes" : "Create Channel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{editingChannel?.name}"? This will unlink all videos from this channel but won't delete the videos themselves.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => editingChannel && deleteMutation.mutate(editingChannel.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTVChannels;
