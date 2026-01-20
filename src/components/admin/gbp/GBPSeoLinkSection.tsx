/**
 * GBPSeoLinkSection - Component to link GBP locations to SEO pages
 * 
 * Features:
 * - Search and select SEO pages to link
 * - View/unlink linked pages
 * - Show sync status badges
 * - Log actions to gbp_audit_log
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Globe, 
  Link2, 
  Link2Off, 
  ExternalLink, 
  Check, 
  ChevronsUpDown,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface GBPSeoLinkSectionProps {
  locationId: string;
  connectionId: string;
}

type SyncStatus = 'linked' | 'warning' | 'out_of_sync';

export function GBPSeoLinkSection({ locationId, connectionId }: GBPSeoLinkSectionProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  // Fetch existing link
  const { data: existingLink, isLoading: linkLoading } = useQuery({
    queryKey: ['gbp-seo-link', locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gbp_seo_links')
        .select(`
          *,
          seo_pages:seo_page_id (
            id,
            page_name,
            route_path,
            meta_description,
            score
          )
        `)
        .eq('gbp_location_id', locationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Fetch all SEO pages for selection
  const { data: seoPages } = useQuery({
    queryKey: ['seo-pages-for-link'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_pages')
        .select('id, page_name, route_path, score')
        .order('page_name', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Link mutation
  const linkMutation = useMutation({
    mutationFn: async (seoPageId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create the link
      const { error: linkError } = await supabase
        .from('gbp_seo_links')
        .insert({
          gbp_location_id: locationId,
          seo_page_id: seoPageId,
          link_type: 'primary',
          sync_status: 'linked'
        });
      if (linkError) throw linkError;

      // Log to audit
      await supabase.from('gbp_audit_log').insert({
        connection_id: connectionId,
        location_id: locationId,
        action_type: 'GBP_SEO_LINK_CREATED',
        actor_user_id: user?.id,
        target_type: 'seo_page',
        target_id: seoPageId,
        status: 'success',
        details: { seo_page_id: seoPageId }
      });
    },
    onSuccess: () => {
      toast.success("SEO page linked successfully");
      queryClient.invalidateQueries({ queryKey: ['gbp-seo-link', locationId] });
      setShowLinkDialog(false);
      setSelectedPageId("");
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to link SEO page");
    }
  });

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: async () => {
      if (!existingLink) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Remove the link
      const { error } = await supabase
        .from('gbp_seo_links')
        .delete()
        .eq('id', existingLink.id);
      if (error) throw error;

      // Log to audit
      await supabase.from('gbp_audit_log').insert({
        connection_id: connectionId,
        location_id: locationId,
        action_type: 'GBP_SEO_LINK_REMOVED',
        actor_user_id: user?.id,
        target_type: 'seo_page',
        target_id: existingLink.seo_page_id,
        status: 'success',
        details: { seo_page_id: existingLink.seo_page_id }
      });
    },
    onSuccess: () => {
      toast.success("SEO page unlinked");
      queryClient.invalidateQueries({ queryKey: ['gbp-seo-link', locationId] });
      setShowUnlinkDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to unlink SEO page");
    }
  });

  const getSyncStatusBadge = (status: SyncStatus) => {
    switch (status) {
      case 'linked':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            In Sync
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Minor Drift
          </Badge>
        );
      case 'out_of_sync':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Out of Sync
          </Badge>
        );
    }
  };

  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    setOpen(false);
    setShowLinkDialog(true);
  };

  const selectedPage = seoPages?.find(p => p.id === selectedPageId);

  if (linkLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Linked SEO Page
          </CardTitle>
        </CardHeader>
        <CardContent>
          {existingLink && existingLink.seo_pages ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{(existingLink.seo_pages as any).page_name}</span>
                    {getSyncStatusBadge(existingLink.sync_status as SyncStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {(existingLink.seo_pages as any).route_path}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>SEO Score:</span>
                    <span className={cn(
                      "font-medium",
                      (existingLink.seo_pages as any).score >= 80 ? "text-green-600" :
                      (existingLink.seo_pages as any).score >= 60 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {(existingLink.seo_pages as any).score}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/seo/${(existingLink.seo_pages as any).id}`)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View SEO Page
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUnlinkDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Link2Off className="h-3 w-3 mr-1" />
                  Unlink
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No SEO page linked. Link a page to sync content and track drift.
              </p>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Select SEO Page
                    </span>
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search pages..." />
                    <CommandList>
                      <CommandEmpty>No pages found.</CommandEmpty>
                      <CommandGroup>
                        {seoPages?.map((page) => (
                          <CommandItem
                            key={page.id}
                            value={`${page.page_name} ${page.route_path}`}
                            onSelect={() => handleSelectPage(page.id)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{page.page_name}</span>
                              <span className="text-xs text-muted-foreground font-mono">{page.route_path}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Confirmation Dialog */}
      <AlertDialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Link SEO Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to link this location to the SEO page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedPage && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{selectedPage.page_name}</p>
              <p className="text-sm text-muted-foreground font-mono">{selectedPage.route_path}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => linkMutation.mutate(selectedPageId)}
              disabled={linkMutation.isPending}
            >
              {linkMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Link Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink SEO Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this SEO page? Drift detection will be disabled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlinkMutation.mutate()}
              disabled={unlinkMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinkMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
