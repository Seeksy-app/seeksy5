import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivatedBadge, StatusBadge } from "@/components/ui/activated-badge";
import { 
  Sparkles, 
  Instagram, 
  BarChart3, 
  Target, 
  DollarSign, 
  TrendingUp, 
  FolderOpen, 
  Mic, 
  Video, 
  Calendar,
  ArrowRight,
  Clock,
  Check,
  Loader2,
  ExternalLink,
  Grid3x3,
  Settings,
  MoreVertical
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useModuleActivation } from "@/hooks/useModuleActivation";
import { useState } from "react";
import { CustomPackageBuilder } from "@/components/apps/CustomPackageBuilder";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * CREATOR HUB - Personal Control Center
 * 
 * Purpose: "What tools and earning opportunities do I have?"
 * Content: Shows activated tools at top, discover section below.
 * 
 * To discover and activate new modules, users can browse here or go to Apps & Tools.
 */

const allModules = [
  {
    id: 'social-connect',
    name: 'Social Connect',
    description: 'Link social accounts',
    icon: Instagram,
    color: 'from-purple-500 to-pink-500',
    path: '/integrations',
    category: 'tools'
  },
  {
    id: 'social-analytics',
    name: 'Social Analytics',
    description: 'Track engagement & growth',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-500',
    path: '/social-analytics',
    category: 'tools'
  },
  {
    id: 'meetings',
    name: 'Meetings',
    description: 'Book calls & appointments',
    icon: Calendar,
    color: 'from-teal-500 to-emerald-500',
    path: '/creator/meetings',
    category: 'tools'
  },
  {
    id: 'studio',
    name: 'Studio & Recording',
    description: 'Record & edit content',
    icon: Video,
    color: 'from-slate-600 to-slate-800',
    path: '/studio',
    category: 'tools'
  },
  {
    id: 'podcasts',
    name: 'Podcasts',
    description: 'Publish & distribute shows',
    icon: Mic,
    color: 'from-violet-500 to-purple-500',
    path: '/podcasts',
    category: 'tools'
  },
  {
    id: 'content-library',
    name: 'Media Library',
    description: 'Manage media assets',
    icon: FolderOpen,
    color: 'from-red-500 to-orange-500',
    path: '/studio/media',
    category: 'tools'
  },
  {
    id: 'events',
    name: 'Events',
    description: 'Create & manage events',
    icon: Calendar,
    color: 'from-amber-500 to-yellow-500',
    path: '/events',
    category: 'tools'
  },
  {
    id: 'awards',
    name: 'Awards',
    description: 'Nominate & vote for awards',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-500',
    path: '/awards',
    category: 'tools'
  },
  {
    id: 'clips',
    name: 'Clips & Editing',
    description: 'Create clips from recordings',
    icon: Video,
    color: 'from-indigo-500 to-blue-500',
    path: '/studio/clips',
    category: 'tools'
  },
  {
    id: 'brand-campaigns',
    name: 'Brand Campaigns',
    description: 'Sponsorship opportunities',
    icon: Target,
    color: 'from-blue-600 to-indigo-600',
    path: '/creator-campaigns',
    category: 'monetization'
  },
  {
    id: 'revenue-tracking',
    name: 'Revenue Tracking',
    description: 'Earnings and payouts',
    icon: DollarSign,
    color: 'from-orange-500 to-amber-500',
    path: '/monetization',
    category: 'monetization'
  },
];

// Modules available for discovery (not yet activated)
const discoveryModules = [
  {
    id: 'audience-insights',
    name: 'Audience Insights',
    description: 'Deep analytics on followers',
    icon: BarChart3,
    color: 'from-cyan-500 to-blue-500',
    status: 'available' as const,
    path: '/social-analytics'
  },
  {
    id: 'growth-tools',
    name: 'Growth Tools',
    description: 'AI-powered growth strategies',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    status: 'coming_soon' as const,
    path: '/growth'
  },
  {
    id: 'crm',
    name: 'CRM & Contacts',
    description: 'Manage contacts & relationships',
    icon: Target,
    color: 'from-amber-500 to-orange-500',
    status: 'available' as const,
    path: '/contacts'
  },
];

export default function CreatorHub() {
  const navigate = useNavigate();
  const [showPackageBuilder, setShowPackageBuilder] = useState(false);
  const { 
    activatedModuleIds, 
    isLoading, 
    isModuleActivated,
    activateModule,
    deactivateModule,
    isActivating,
  } = useModuleActivation();

  // Modules for the package builder
  const packageModules = [
    { id: 'audience-insights', name: 'Audience Insights', category: 'Creator Tools', creditEstimate: 10 },
    { id: 'social-analytics', name: 'Social Analytics', category: 'Creator Tools', creditEstimate: 10 },
    { id: 'brand-campaigns', name: 'Brand Campaigns', category: 'Creator Tools', creditEstimate: 15 },
    { id: 'revenue-tracking', name: 'Revenue Tracking', category: 'Creator Tools', creditEstimate: 5 },
    { id: 'growth-tools', name: 'Growth Tools', category: 'Creator Tools', creditEstimate: 20 },
    { id: 'content-library', name: 'Content Library', category: 'Creator Tools', creditEstimate: 10 },
    { id: 'studio', name: 'Studio & Recording', category: 'Media & Content', creditEstimate: 50 },
    { id: 'podcasts', name: 'Podcasts', category: 'Media & Content', creditEstimate: 20 },
    { id: 'content-library', name: 'Media Library', category: 'Media & Content', creditEstimate: 10 },
    { id: 'clips', name: 'Clips & Editing', category: 'Media & Content', creditEstimate: 30 },
    { id: 'my-page-streaming', name: 'My Page Streaming', category: 'Media & Content', creditEstimate: 40 },
    { id: 'crm', name: 'Contacts & Audience', category: 'Growth & Distribution', creditEstimate: 5 },
    { id: 'segments', name: 'Segments', category: 'Growth & Distribution', creditEstimate: 5 },
  ];

  // Show ONLY activated modules in the activated section
  const activatedTools = allModules.filter(
    mod => mod.category === 'tools' && isModuleActivated(mod.id)
  );
  const activatedMonetization = allModules.filter(
    mod => mod.category === 'monetization' && isModuleActivated(mod.id)
  );

  const hasAnyActivatedModules = activatedTools.length > 0 || activatedMonetization.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div 
          id="creatorhub-hero"
          className="flex items-center justify-between" 
          data-onboarding="creator-hub-header"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Creator Hub</h1>
              <p className="text-muted-foreground">Shortcuts to your tools and monetization opportunities.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.dispatchEvent(new Event('openNavCustomization'))}
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </Button>
          </div>
        </div>

        {/* Section 1: Activated Tools */}
        <Card id="creatorhub-activated-section" data-onboarding="active-modules">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  Activated Tools
                </CardTitle>
                <CardDescription>Tools you've turned on for your workspace.</CardDescription>
              </div>
              {hasAnyActivatedModules && (
                <span id="creatorhub-credits-strip" className="text-xs text-muted-foreground">
                  {activatedModuleIds.length} modules active
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {hasAnyActivatedModules ? (
              <div 
                className="grid gap-4"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                }}
              >
                {[...activatedTools, ...activatedMonetization].map((tool, index) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 bg-card ${index === 0 ? 'activated-badge-example' : ''}`}
                      id={index === 0 ? 'creatorhub-activated-badge-example' : undefined}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color} shadow-sm`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          <ActivatedBadge variant="compact" />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button 
                                className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity tool-card-menu"
                                id={index === 0 ? 'creatorhub-tool-context-menu' : undefined}
                              >
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(tool.path)}>
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate('/settings')}>
                                Manage settings
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => deactivateModule(tool.id)}
                              >
                                Remove from hub
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm">{tool.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{tool.description}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-xs text-primary hover:text-primary"
                        onClick={() => navigate(tool.path)}
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
                <p className="text-sm">No tools activated yet</p>
                <p className="text-xs mt-1 mb-4">Browse Apps & Tools to activate your first module</p>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/apps?view=modules')}>
                    Browse Apps & Tools
                  </Button>
                  <Button variant="default" size="sm" onClick={() => setShowPackageBuilder(true)}>
                    + Build a Custom Workspace
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Discover More Tools */}
        <Card id="creatorhub-discover-section" data-onboarding="discover-modules">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Discover More Tools
            </CardTitle>
            <CardDescription>Explore additional tools you can activate with credits.</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="grid gap-4 mb-4"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              }}
            >
              {discoveryModules.map((module) => {
                const Icon = module.icon;
                const isActivated = isModuleActivated(module.id);
                
                return (
                  <div
                    key={module.id}
                    className="group p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${module.color} shadow-sm opacity-70`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <StatusBadge status={isActivated ? 'activated' : module.status} />
                    </div>
                    <h3 className="font-semibold text-sm">{module.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{module.description}</p>
                    {module.status === 'available' && !isActivated ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => activateModule(module.id)}
                        disabled={isActivating}
                      >
                        {isActivating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Add to Workspace
                      </Button>
                    ) : module.status === 'coming_soon' ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs"
                        disabled
                      >
                        Coming Soon
                      </Button>
                    ) : isActivated ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs text-primary"
                        onClick={() => navigate(module.path || '/creator-hub')}
                      >
                        Open Module
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Global CTA: Browse Apps & Tools */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Looking for more capabilities?</span>
              </div>
              <Button 
                id="creatorhub-browse-apps-button"
                variant="default" 
                size="sm" 
                onClick={() => navigate('/apps?view=modules')}
              >
                Browse Apps & Tools <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cross-links */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Need to check your schedule or metrics?</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/my-day">
                    View My Day <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    Open Dashboard <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Package Builder Modal */}
      <CustomPackageBuilder 
        open={showPackageBuilder} 
        onOpenChange={setShowPackageBuilder}
        modules={packageModules}
      />
    </div>
  );
}
