import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { GBPLayout } from "@/components/admin/gbp/GBPLayout";
import { GBPNotFound } from "@/components/admin/gbp/GBPNotFound";
import { GBPSeoLinkSection } from "@/components/admin/gbp/GBPSeoLinkSection";
import { GBPSeoDriftPanel } from "@/components/admin/gbp/GBPSeoDriftPanel";
import { GBPAiSuggestionsPanel } from "@/components/admin/gbp/GBPAiSuggestionsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  Globe, 
  Clock,
  Edit,
  Save,
  X,
  AlertTriangle,
  Loader2,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

function GBPLocationDetailContent() {
  const { location_id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [editingDescription, setEditingDescription] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; data: any } | null>(null);

  // Fetch location
  const { data: location, isLoading } = useQuery({
    queryKey: ['gbp-location', location_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_locations')
        .select('*')
        .eq('id', location_id)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Fetch write mode status
  const { data: settings } = useQuery({
    queryKey: ['gbp-admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_admin_settings')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Fetch audit log for this location
  const { data: auditLog } = useQuery({
    queryKey: ['gbp-audit-location', location_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_audit_log')
        .select('*')
        .eq('location_id', location_id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  // Write mutation
  const writeMutation = useMutation({
    mutationFn: async ({ action_type, payload }: { action_type: string; payload: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('gbp-write', {
        body: {
          action_type,
          connection_id: location?.connection_id,
          location_id: location?.id,
          payload,
          actor_user_id: user?.id
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Changes saved to Google Business Profile");
      queryClient.invalidateQueries({ queryKey: ['gbp-location', location_id] });
      queryClient.invalidateQueries({ queryKey: ['gbp-audit-location', location_id] });
      setEditingDescription(false);
      setShowPreviewModal(false);
      setPendingAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save changes");
    }
  });

  const writeModeEnabled = settings?.write_mode_enabled;

  const handleEditDescription = () => {
    setNewDescription(location?.description || "");
    setEditingDescription(true);
  };

  const handlePreviewDescription = () => {
    setPendingAction({
      type: 'UPDATE_DESCRIPTION',
      data: { location_name: location?.google_location_name, description: newDescription }
    });
    setShowPreviewModal(true);
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      writeMutation.mutate({
        action_type: pendingAction.type,
        payload: pendingAction.data
      });
    }
  };

  const formatAddress = (addressJson: any) => {
    if (!addressJson) return null;
    const parts = [
      addressJson.addressLines?.join(', '),
      addressJson.locality,
      addressJson.administrativeArea,
      addressJson.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const formatHours = (hoursJson: any) => {
    if (!hoursJson?.periods) return null;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return hoursJson.periods.map((period: any) => ({
      day: dayNames[period.openDay] || period.openDay,
      open: period.openTime?.hours ? `${period.openTime.hours}:${String(period.openTime.minutes || 0).padStart(2, '0')}` : '—',
      close: period.closeTime?.hours ? `${period.closeTime.hours}:${String(period.closeTime.minutes || 0).padStart(2, '0')}` : '—',
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!location) {
    return <GBPNotFound />;
  }

  const hours = formatHours(location.regular_hours_json);

  return (
    <TooltipProvider>
      <div className="container max-w-4xl py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/gbp/locations')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{location.title}</h1>
            <p className="text-sm text-muted-foreground">
              {location.primary_category && (
                <Badge variant="secondary" className="mr-2">{location.primary_category}</Badge>
              )}
              Last synced {location.last_synced_at 
                ? formatDistanceToNow(new Date(location.last_synced_at), { addSuffix: true })
                : 'never'}
            </p>
          </div>
        </div>

        {/* Write Mode Banner */}
        {!writeModeEnabled && (
          <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Write mode is disabled. Enable it in GBP settings to make changes.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Business Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {formatAddress(location.address_json) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{formatAddress(location.address_json)}</span>
                </div>
              )}
              {location.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{location.phone}</span>
                </div>
              )}
              {location.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={location.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                    {location.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hours */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hours ? (
                <div className="space-y-1 text-sm">
                  {hours.map((h: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span className="font-medium w-10">{h.day}</span>
                      <span className="text-muted-foreground">{h.open} - {h.close}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hours set</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Business Description</CardTitle>
              {!editingDescription && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditDescription}
                      disabled={!writeModeEnabled}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  {!writeModeEnabled && (
                    <TooltipContent>Enable write mode to edit</TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  placeholder="Enter business description..."
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditingDescription(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handlePreviewDescription}>
                    Preview Changes
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {location.description || 'No description set'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* SEO Link Section */}
        {location.connection_id && (
          <GBPSeoLinkSection 
            locationId={location.id} 
            connectionId={location.connection_id} 
          />
        )}

        {/* SEO Drift Panel */}
        {location.connection_id && (
          <GBPSeoDriftPanel
            locationId={location.id}
            connectionId={location.connection_id}
            gbpData={{
              title: location.title,
              description: location.description,
              address_json: location.address_json
            }}
          />
        )}

        {/* AI SEO Suggestions Panel */}
        {location.id && (
          <GBPAiSuggestionsPanel
            locationId={location.id}
            gbpLocationId={location.id}
          />
        )}

        {/* Audit Trail */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLog?.length ? (
              <div className="space-y-2">
                {auditLog.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <div>
                      <Badge variant={log.status === 'success' ? 'outline' : 'destructive'} className="text-xs mr-2">
                        {log.action_type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <Badge variant={log.status === 'success' ? 'secondary' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Preview Changes</DialogTitle>
              <DialogDescription>
                Review your changes before publishing to Google Business Profile
              </DialogDescription>
            </DialogHeader>
            
            {pendingAction?.type === 'UPDATE_DESCRIPTION' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Current Description</Label>
                  <div className="mt-1 p-3 bg-muted rounded text-sm">
                    {location.description || '(empty)'}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">New Description</Label>
                  <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded text-sm">
                    {pendingAction.data.description || '(empty)'}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmAction}
                disabled={writeMutation.isPending}
              >
                {writeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Publish to Google
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

export default function GBPLocationDetail() {
  return (
    <RequireAdmin>
      <GBPLayout title="Location Detail">
        <GBPLocationDetailContent />
      </GBPLayout>
    </RequireAdmin>
  );
}
