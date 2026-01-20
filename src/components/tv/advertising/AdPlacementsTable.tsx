import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Play, Pause, Archive, Target, Radio, Video, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Placement {
  id: string;
  ad_id: string;
  target_type: string;
  channel_id?: string;
  video_id?: string;
  position: string;
  cpm: number;
  start_date: string;
  end_date: string;
  status: string;
  priority: number;
  created_at: string;
  ad?: { id: string; title: string; type: string; thumbnail_url?: string };
  channel?: { id: string; name: string };
  video?: { id: string; title: string };
}

interface AdPlacementsTableProps {
  placements: Placement[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AdPlacementsTable({ placements, isLoading, onRefresh }: AdPlacementsTableProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const updatePlacementStatus = async (placementId: string, newStatus: string) => {
    setUpdating(placementId);
    try {
      const { error } = await supabase
        .from('seeksy_tv_ad_placements')
        .update({ status: newStatus })
        .eq('id', placementId);
      
      if (error) throw error;
      toast.success(`Placement ${newStatus === 'active' ? 'activated' : newStatus === 'paused' ? 'paused' : 'archived'}`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update placement');
    } finally {
      setUpdating(null);
    }
  };

  const deletePlacement = async (placementId: string) => {
    if (!confirm('Are you sure you want to delete this placement?')) return;
    
    try {
      const { error } = await supabase
        .from('seeksy_tv_ad_placements')
        .delete()
        .eq('id', placementId);
      
      if (error) throw error;
      toast.success('Placement deleted');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete placement');
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPositionBadge = (position: string) => {
    switch (position) {
      case 'pre':
        return <Badge variant="outline" className="text-blue-400 border-blue-500/30">Pre-roll</Badge>;
      case 'post':
        return <Badge variant="outline" className="text-purple-400 border-purple-500/30">Post-roll</Badge>;
      case 'both':
        return <Badge variant="outline" className="text-amber-400 border-amber-500/30">Both</Badge>;
      default:
        return <Badge variant="outline">{position}</Badge>;
    }
  };

  const isActive = (placement: Placement) => {
    const today = new Date();
    const start = new Date(placement.start_date);
    const end = new Date(placement.end_date);
    return placement.status === 'active' && today >= start && today <= end;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading placements...</div>;
  }

  if (placements.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No placements configured</h3>
        <p className="text-muted-foreground mt-1">Create a placement to target channels or videos</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ad</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Position</TableHead>
          <TableHead>CPM</TableHead>
          <TableHead>Run Dates</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {placements.map((placement) => (
          <TableRow key={placement.id} className={isActive(placement) ? '' : 'opacity-60'}>
            <TableCell>
              <div className="flex items-center gap-2">
                {placement.ad?.thumbnail_url ? (
                  <img src={placement.ad.thumbnail_url} alt="" className="w-10 h-6 object-cover rounded" />
                ) : (
                  <div className="w-10 h-6 bg-muted rounded flex items-center justify-center">
                    <Video className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <span className="font-medium">{placement.ad?.title || 'Unknown'}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {placement.target_type === 'channel' ? (
                  <>
                    <Radio className="h-4 w-4 text-muted-foreground" />
                    <span>{placement.channel?.name || 'Unknown Channel'}</span>
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="line-clamp-1">{placement.video?.title || 'Unknown Video'}</span>
                  </>
                )}
              </div>
            </TableCell>
            <TableCell>{getPositionBadge(placement.position)}</TableCell>
            <TableCell>${Number(placement.cpm).toFixed(2)}</TableCell>
            <TableCell className="text-sm">
              <div className="text-muted-foreground">
                {format(new Date(placement.start_date), 'MMM d')} - {format(new Date(placement.end_date), 'MMM d, yyyy')}
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(placement.status)}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={updating === placement.id}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {placement.status !== 'active' && (
                    <DropdownMenuItem onClick={() => updatePlacementStatus(placement.id, 'active')}>
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </DropdownMenuItem>
                  )}
                  {placement.status === 'active' && (
                    <DropdownMenuItem onClick={() => updatePlacementStatus(placement.id, 'paused')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => updatePlacementStatus(placement.id, 'archived')}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deletePlacement(placement.id)} className="text-destructive">
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
