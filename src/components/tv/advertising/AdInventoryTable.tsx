import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Play, Pause, Archive, Video, Music, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Ad {
  id: string;
  title: string;
  type: string;
  asset_url: string;
  duration_seconds: number;
  thumbnail_url?: string;
  status: string;
  created_at: string;
  notes?: string;
}

interface AdInventoryTableProps {
  ads: Ad[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AdInventoryTable({ ads, isLoading, onRefresh }: AdInventoryTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const updateAdStatus = async (adId: string, newStatus: string) => {
    setUpdating(adId);
    try {
      const result = await (supabase as any)
        .from('seeksy_tv_ads')
        .update({ status: newStatus })
        .eq('id', adId);
      
      if (result.error) throw result.error;
      toast.success(`Ad ${newStatus === 'active' ? 'activated' : newStatus === 'paused' ? 'paused' : 'archived'}`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update ad');
    } finally {
      setUpdating(null);
    }
  };

  const deleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad? This will also remove all placements using it.')) return;
    
    try {
      const result = await (supabase as any)
        .from('seeksy_tv_ads')
        .delete()
        .eq('id', adId);
      
      if (result.error) throw result.error;
      toast.success('Ad deleted');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete ad');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Paused</Badge>;
      case 'archived':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Archived</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading ads...</div>;
  }

  if (ads.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No ads in inventory</h3>
        <p className="text-muted-foreground mt-1">Upload your first ad to get started</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ad</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ads.map((ad) => (
          <TableRow key={ad.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                {ad.thumbnail_url ? (
                  <img src={ad.thumbnail_url} alt={ad.title} className="w-16 h-10 object-cover rounded" />
                ) : (
                  <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                    {ad.type === 'video' ? <Video className="h-5 w-5 text-muted-foreground" /> : <Music className="h-5 w-5 text-muted-foreground" />}
                  </div>
                )}
                <div>
                  <p className="font-medium">{ad.title}</p>
                  {ad.notes && <p className="text-xs text-muted-foreground line-clamp-1">{ad.notes}</p>}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {ad.type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <Music className="h-3 w-3 mr-1" />}
                {ad.type}
              </Badge>
            </TableCell>
            <TableCell>{ad.duration_seconds}s</TableCell>
            <TableCell>{getStatusBadge(ad.status)}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {format(new Date(ad.created_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={updating === ad.id}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.open(ad.asset_url, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  {ad.status !== 'active' && (
                    <DropdownMenuItem onClick={() => updateAdStatus(ad.id, 'active')}>
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </DropdownMenuItem>
                  )}
                  {ad.status === 'active' && (
                    <DropdownMenuItem onClick={() => updateAdStatus(ad.id, 'paused')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => updateAdStatus(ad.id, 'archived')}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteAd(ad.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
