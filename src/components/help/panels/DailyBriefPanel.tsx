/**
 * Portal-scoped Daily Brief Panel
 * Shows daily brief content specific to the current portal
 * For Admin users: provides tabs to switch between Admin, Creator, Board briefs
 * Powered by Firecrawl for live competitive intelligence
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, RefreshCw, Calendar, TrendingUp, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { PortalType, PORTAL_LABELS } from '@/hooks/useHelpDrawer';
import { useNavigate } from 'react-router-dom';
import { useHelpDrawerStore } from '@/hooks/useHelpDrawer';
import { useDailyBrief, useRefreshDailyBrief } from '@/hooks/useDailyBrief';

interface DailyBriefPanelProps {
  portal: PortalType;
  contentKey: string;
}

interface BriefSection {
  id: string;
  title: string;
  content: string;
  type: string;
  source?: string;
}

export function DailyBriefPanel({ portal, contentKey }: DailyBriefPanelProps) {
  const navigate = useNavigate();
  const { close } = useHelpDrawerStore();
  
  // For admin users, allow switching between different brief types
  const [selectedPortal, setSelectedPortal] = useState<PortalType>(portal);
  const [selectedSection, setSelectedSection] = useState<BriefSection | null>(null);
  
  const { data: brief, isLoading } = useDailyBrief(selectedPortal);
  const refreshBrief = useRefreshDailyBrief();
  
  const handleRefresh = () => {
    refreshBrief.mutate(selectedPortal);
  };
  
  const handleViewFullBrief = () => {
    close();
    const route = selectedPortal === 'admin' ? '/admin/daily-brief' : '/creator/daily-brief';
    navigate(route);
  };
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'trend': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default: return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const handleSectionClick = (section: BriefSection) => {
    setSelectedSection(section);
  };
  
  // Show tabs only for admin users
  const isAdmin = portal === 'admin';
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Admin role selector tabs */}
      {isAdmin && (
        <Tabs value={selectedPortal} onValueChange={(v) => setSelectedPortal(v as PortalType)}>
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="admin" className="text-xs">Admin</TabsTrigger>
            <TabsTrigger value="creator" className="text-xs">Creator</TabsTrigger>
            <TabsTrigger value="board" className="text-xs">Board</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Today's brief for {PORTAL_LABELS[selectedPortal]}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshBrief.isPending}>
            {refreshBrief.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleViewFullBrief}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Full Brief
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {brief?.sections.map(section => (
          <Card 
            key={section.id} 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => handleSectionClick(section)}
          >
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center gap-2">
                {getIcon(section.type)}
                <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-3">
              <CardDescription className="text-sm">
                {section.content}
              </CardDescription>
              {section.source && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  Source: {section.source}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Section Detail Dialog */}
      <Dialog open={!!selectedSection} onOpenChange={(open) => !open && setSelectedSection(null)}>
        <DialogContent className="sm:max-w-lg bg-background border-border">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {selectedSection && getIcon(selectedSection.type)}
              <DialogTitle>{selectedSection?.title}</DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Detailed view of the brief section
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground">{selectedSection?.content}</p>
            </div>
            {selectedSection?.source && (
              <div className="pt-4 border-t">
                <Badge variant="secondary">
                  Source: {selectedSection.source}
                </Badge>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Brief type: {PORTAL_LABELS[selectedPortal]} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
