/**
 * GBPSeoDriftPanel - Shows drift detection and sync suggestions
 * 
 * Compares GBP data with linked SEO page and shows actionable suggestions.
 * Does NOT auto-write - applies changes to SEO draft only.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  RefreshCw, 
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GBPSeoDriftPanelProps {
  locationId: string;
  connectionId: string;
  gbpData: {
    title: string;
    description: string | null;
    address_json: any;
  };
}

interface DriftItem {
  field: string;
  label: string;
  gbpValue: string;
  seoValue: string;
  seoField: string;
  selected: boolean;
}

export function GBPSeoDriftPanel({ locationId, connectionId, gbpData }: GBPSeoDriftPanelProps) {
  const queryClient = useQueryClient();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [driftItems, setDriftItems] = useState<DriftItem[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Fetch existing link with SEO page
  const { data: link } = useQuery({
    queryKey: ['gbp-seo-link', locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_seo_links')
        .select(`
          *,
          seo_pages:seo_page_id (*)
        `)
        .eq('gbp_location_id', locationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Apply to SEO draft mutation
  const applyMutation = useMutation({
    mutationFn: async (items: DriftItem[]) => {
      if (!link?.seo_page_id) throw new Error("No linked SEO page");
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Build update payload for SEO page
      const updates: Record<string, string> = {};
      items.forEach(item => {
        if (item.selected) {
          updates[item.seoField] = item.gbpValue;
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new Error("No items selected");
      }

      // Update SEO page (draft-only, status stays as-is)
      const { error: updateError } = await supabase
        .from('seo_pages')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', link.seo_page_id);
      if (updateError) throw updateError;

      // Update link status
      await supabase
        .from('gbp_seo_links')
        .update({ 
          sync_status: 'linked',
          last_checked_at: new Date().toISOString(),
          drift_details: null
        })
        .eq('id', link.id);

      // Log to audit
      await supabase.from('gbp_audit_log').insert({
        connection_id: connectionId,
        location_id: locationId,
        action_type: 'SEO_SYNC_SUGGESTION_APPLIED',
        actor_user_id: user?.id,
        target_type: 'seo_page',
        target_id: link.seo_page_id,
        status: 'success',
        details: { 
          applied_fields: Object.keys(updates),
          is_draft: true
        }
      });
    },
    onSuccess: () => {
      toast.success("Changes applied to SEO page draft");
      queryClient.invalidateQueries({ queryKey: ['gbp-seo-link', locationId] });
      queryClient.invalidateQueries({ queryKey: ['seo-page', link?.seo_page_id] });
      setShowApplyDialog(false);
      setDriftItems([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to apply changes");
    }
  });

  const checkDrift = async () => {
    if (!link?.seo_pages) return;
    
    setIsChecking(true);
    try {
      const seoPage = link.seo_pages as any;
      const items: DriftItem[] = [];

      // Compare Business Description vs Meta Description
      if (gbpData.description && seoPage.meta_description !== gbpData.description) {
        items.push({
          field: 'description',
          label: 'Business Description → Meta Description',
          gbpValue: gbpData.description,
          seoValue: seoPage.meta_description || '(empty)',
          seoField: 'meta_description',
          selected: false
        });
      }

      // Compare Business Name vs H1 Override
      if (gbpData.title && seoPage.h1_override !== gbpData.title) {
        items.push({
          field: 'title',
          label: 'Business Name → H1 Override',
          gbpValue: gbpData.title,
          seoValue: seoPage.h1_override || '(empty)',
          seoField: 'h1_override',
          selected: false
        });
      }

      setDriftItems(items);

      // Update drift status in link
      const newStatus = items.length === 0 ? 'linked' : 
                       items.length <= 1 ? 'warning' : 'out_of_sync';
      
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('gbp_seo_links')
        .update({ 
          sync_status: newStatus,
          last_checked_at: new Date().toISOString(),
          drift_details: items.length > 0 ? { items: items.map(i => i.field) } : null
        })
        .eq('id', link.id);

      // Log drift detection
      if (items.length > 0) {
        await supabase.from('gbp_audit_log').insert({
          connection_id: connectionId,
          location_id: locationId,
          action_type: 'GBP_SEO_DRIFT_DETECTED',
          actor_user_id: user?.id,
          target_type: 'seo_page',
          target_id: link.seo_page_id,
          status: 'success',
          details: { drift_count: items.length, fields: items.map(i => i.field) }
        });
      }

      queryClient.invalidateQueries({ queryKey: ['gbp-seo-link', locationId] });

      if (items.length === 0) {
        toast.success("No drift detected - GBP and SEO are in sync");
      } else {
        toast.info(`Found ${items.length} difference${items.length > 1 ? 's' : ''}`);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const toggleItem = (index: number) => {
    setDriftItems(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const selectedCount = driftItems.filter(i => i.selected).length;

  if (!link) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              SEO Sync Suggestions
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkDrift}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-1">Check Drift</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {driftItems.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
              <p>Click "Check Drift" to compare GBP data with SEO page</p>
            </div>
          ) : (
            <div className="space-y-3">
              {driftItems.map((item, index) => (
                <div key={item.field} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => toggleItem(index)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.label}</span>
                        <Badge variant="outline" className="text-xs">
                          <AlertTriangle className="h-2 w-2 mr-1" />
                          Different
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-green-50 rounded border border-green-200">
                          <p className="text-green-600 font-medium mb-1">GBP Value:</p>
                          <p className="text-green-800 line-clamp-2">{item.gbpValue}</p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground font-medium mb-1">SEO Value:</p>
                          <p className="line-clamp-2">{item.seoValue}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < driftItems.length - 1 && <Separator />}
                </div>
              ))}

              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={() => setShowApplyDialog(true)}
                  disabled={selectedCount === 0}
                  className="w-full"
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Apply {selectedCount} to SEO Draft
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Changes will be saved as draft, not published
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apply Confirmation Dialog */}
      <AlertDialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Changes to SEO Draft</AlertDialogTitle>
            <AlertDialogDescription>
              The following GBP values will be copied to the linked SEO page as a draft. This will NOT publish the changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            {driftItems.filter(i => i.selected).map(item => (
              <div key={item.field} className="p-2 bg-muted rounded text-sm">
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => applyMutation.mutate(driftItems.filter(i => i.selected))}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Apply to Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
