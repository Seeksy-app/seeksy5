import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Star, 
  Grid3x3, 
  Sparkles, 
  ArrowRight, 
  Settings, 
  Check, 
  ExternalLink,
  MoreVertical,
  Loader2,
  Plus
} from "lucide-react";
import { useCustomPackages, CustomPackage } from "@/hooks/useCustomPackages";
import { useModuleActivation } from "@/hooks/useModuleActivation";
import { ActivatedBadge } from "@/components/ui/activated-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Instagram, BarChart3, Calendar, Video, Mic, FolderOpen, 
  Target, DollarSign, Scissors
} from "lucide-react";

// Module icon mapping
const MODULE_ICONS: Record<string, any> = {
  'social-connect': Instagram,
  'social-analytics': BarChart3,
  'meetings': Calendar,
  'studio': Video,
  'podcasts': Mic,
  'content-library': FolderOpen,
  'media-library': FolderOpen,
  'events': Calendar,
  'awards': Sparkles,
  'clips': Scissors,
  'clips-editing': Scissors,
  'brand-campaigns': Target,
  'revenue-tracking': DollarSign,
  'audience-insights': BarChart3,
  'crm': Target,
  'contacts': Target,
};

// Module paths mapping
const MODULE_PATHS: Record<string, string> = {
  'social-connect': '/integrations',
  'social-analytics': '/social-analytics',
  'meetings': '/creator/meetings',
  'studio': '/studio',
  'podcasts': '/podcasts',
  'content-library': '/studio/media',
  'media-library': '/studio/media',
  'events': '/events',
  'awards': '/awards',
  'clips': '/studio/clips',
  'clips-editing': '/studio/clips',
  'brand-campaigns': '/creator-campaigns',
  'revenue-tracking': '/monetization',
  'audience-insights': '/social-analytics',
  'crm': '/contacts',
  'contacts': '/contacts',
};

// Module colors
const MODULE_COLORS: Record<string, string> = {
  'social-connect': 'from-purple-500 to-pink-500',
  'social-analytics': 'from-blue-500 to-cyan-500',
  'meetings': 'from-teal-500 to-emerald-500',
  'studio': 'from-slate-600 to-slate-800',
  'podcasts': 'from-violet-500 to-purple-500',
  'content-library': 'from-red-500 to-orange-500',
  'media-library': 'from-red-500 to-orange-500',
  'events': 'from-amber-500 to-yellow-500',
  'awards': 'from-pink-500 to-rose-500',
  'clips': 'from-indigo-500 to-blue-500',
  'clips-editing': 'from-indigo-500 to-blue-500',
  'brand-campaigns': 'from-blue-600 to-indigo-600',
  'revenue-tracking': 'from-orange-500 to-amber-500',
  'audience-insights': 'from-cyan-500 to-blue-500',
  'crm': 'from-amber-500 to-orange-500',
  'contacts': 'from-amber-500 to-orange-500',
};

// Human-readable module names
const MODULE_NAMES: Record<string, string> = {
  'social-connect': 'Social Connect',
  'social-analytics': 'Social Analytics',
  'meetings': 'Meetings',
  'studio': 'Studio & Recording',
  'podcasts': 'Podcasts',
  'content-library': 'Content Library',
  'media-library': 'Media Library',
  'events': 'Events',
  'awards': 'Awards',
  'clips': 'Clips & Editing',
  'clips-editing': 'Clips & Editing',
  'brand-campaigns': 'Brand Campaigns',
  'revenue-tracking': 'Revenue Tracking',
  'audience-insights': 'Audience Insights',
  'crm': 'CRM & Contacts',
  'contacts': 'Contacts',
};

export default function WorkspaceDashboard() {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get('id');
  const navigate = useNavigate();
  
  const { packages, isLoading: packagesLoading } = useCustomPackages();
  const { deactivateModule } = useModuleActivation();
  
  // Find the workspace
  const workspace = packages.find(p => p.id === workspaceId);
  
  if (packagesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!workspace) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">Workspace Not Found</h2>
            <p className="text-muted-foreground mb-4">The workspace you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/apps?view=modules')}>
              Browse Apps & Tools
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const workspaceModules = workspace.modules || [];
  const hasModules = workspaceModules.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/80 to-primary">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{workspace.name}</h1>
                {workspace.is_default && (
                  <Badge variant="default" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {workspace.description || 'Your custom workspace with selected tools.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/apps?edit=${workspace.id}`)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Workspace
            </Button>
          </div>
        </div>

        {/* Activated Tools Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  Activated Tools
                </CardTitle>
                <CardDescription>Tools included in this workspace.</CardDescription>
              </div>
              {hasModules && (
                <span className="text-xs text-muted-foreground">
                  {workspaceModules.length} modules active
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {hasModules ? (
              <div 
                className="grid gap-4"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                }}
              >
                {workspaceModules.map((moduleId, index) => {
                  const Icon = MODULE_ICONS[moduleId] || Grid3x3;
                  const path = MODULE_PATHS[moduleId] || '/apps';
                  const color = MODULE_COLORS[moduleId] || 'from-gray-500 to-gray-600';
                  const name = MODULE_NAMES[moduleId] || moduleId;
                  
                  return (
                    <div
                      key={moduleId}
                      className="group p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${color} shadow-sm`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          <ActivatedBadge variant="compact" />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => navigate(path)}>
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate('/settings')}>
                                Manage settings
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deactivateModule(moduleId)}
                              >
                                Remove from workspace
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm">{name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">Click to open this tool</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-xs text-primary hover:text-primary"
                        onClick={() => navigate(path)}
                      >
                        Open <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Grid3x3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No tools in this workspace yet</p>
                <p className="text-xs mt-1 mb-4">Add modules to customize your workspace</p>
                <Button variant="outline" size="sm" onClick={() => navigate(`/apps?workspace=${workspace.id}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tools
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add More Tools CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Add more tools to this workspace</span>
              </div>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => navigate(`/apps?workspace=${workspace.id}`)}
              >
                Browse Apps & Tools <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
