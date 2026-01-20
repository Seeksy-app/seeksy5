import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Video, Eye, Trash2, Edit, TrendingUp, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface AdVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  advertiser_company: string | null;
  campaign_name: string | null;
  is_active: boolean;
  created_at: string;
}

export default function SalesAdLibrary() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdVideo | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    advertiser_company: '',
    campaign_name: '',
  });

  const { data: adVideos, isLoading } = useQuery({
    queryKey: ['ad-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdVideo[];
    },
  });

  const { data: impressionStats } = useQuery({
    queryKey: ['ad-video-impressions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('my_page_video_impressions')
        .select('video_id, video_type')
        .eq('video_type', 'ad');

      if (error) throw error;

      // Count impressions per video
      const stats = data.reduce((acc: any, imp: any) => {
        acc[imp.video_id] = (acc[imp.video_id] || 0) + 1;
        return acc;
      }, {});

      return stats;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ad_videos')
        .insert({
          ...data,
          created_by_user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-videos'] });
      toast.success('Ad video created successfully! 🎬');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create ad video', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('ad_videos')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-videos'] });
      toast.success('Ad video updated successfully!');
      setEditingAd(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update ad video', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ad_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-videos'] });
      toast.success('Ad video deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete ad video', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('ad_videos')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-videos'] });
      toast.success('Ad video status updated!');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      advertiser_company: '',
      campaign_name: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.video_url) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingAd) {
      updateMutation.mutate({ id: editingAd.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (ad: AdVideo) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      video_url: ad.video_url,
      thumbnail_url: ad.thumbnail_url || '',
      advertiser_company: ad.advertiser_company || '',
      campaign_name: ad.campaign_name || '',
    });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/sales-dashboard')}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Ad Video Library</h1>
          <p className="text-muted-foreground">
            Manage sponsored video content for creator pages
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingAd(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Ad Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAd ? 'Edit' : 'Add'} Ad Video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter video title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the ad"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="video_url">Video URL *</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="advertiser">Advertiser Company</Label>
                  <Input
                    id="advertiser"
                    value={formData.advertiser_company}
                    onChange={(e) => setFormData({ ...formData, advertiser_company: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign">Campaign Name</Label>
                  <Input
                    id="campaign"
                    value={formData.campaign_name}
                    onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                    placeholder="Campaign name"
                  />
                </div>
              </div>
              {formData.video_url && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={formData.video_url}
                      controls
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingAd ? 'Update' : 'Create'} Ad Video
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ad Videos</p>
                <p className="text-2xl font-bold">{adVideos?.length || 0}</p>
              </div>
              <Video className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Ads</p>
                <p className="text-2xl font-bold">
                  {adVideos?.filter(ad => ad.is_active).length || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
                <p className="text-2xl font-bold">
                  {impressionStats ? (Object.values(impressionStats) as number[]).reduce((a, b) => a + b, 0) : 0}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ad Videos Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : adVideos?.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ad videos yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first sponsored video ad
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Video</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Advertiser</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adVideos?.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="relative w-32 h-20 bg-black rounded overflow-hidden">
                        <video
                          src={ad.video_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                        {ad.duration_seconds && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                            {Math.floor(ad.duration_seconds / 60)}:{String(ad.duration_seconds % 60).padStart(2, '0')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>{ad.advertiser_company || '-'}</TableCell>
                    <TableCell>{ad.campaign_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        {(impressionStats as Record<string, number>)?.[ad.id] || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.is_active ? "default" : "secondary"}>
                        {ad.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(ad.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(ad)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: ad.id, 
                            is_active: !ad.is_active 
                          })}
                          className="h-8 w-8 p-0"
                        >
                          {ad.is_active ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this ad video?')) {
                              deleteMutation.mutate(ad.id);
                            }
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}